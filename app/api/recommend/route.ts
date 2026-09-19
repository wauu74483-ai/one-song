import { NextResponse } from "next/server";

type GeminiPart = { text?: string };

type Palette = "nocturne" | "sunrise" | "warm";

type CuratedSong = {
  songTitle: string;
  artist: string;
  palette: Palette;
  tags: string[];
  moodLabel: string;
};

const curatedSongs: CuratedSong[] = [
  { songTitle: "밤편지", artist: "아이유", palette: "warm", tags: ["밤", "산책", "차분", "포근", "그리움"], moodLabel: "조용한 온기" },
  { songTitle: "Square (2017)", artist: "백예린", palette: "sunrise", tags: ["산뜻", "후련", "햇살", "드라이브", "설렘"], moodLabel: "가벼운 해방감" },
  { songTitle: "TOMBOY", artist: "혁오", palette: "nocturne", tags: ["지침", "혼자", "생각", "밤", "공허"], moodLabel: "느슨한 밤공기" },
  { songTitle: "Love Lee", artist: "AKMU", palette: "sunrise", tags: ["기분좋", "신남", "산뜻", "주말", "설렘"], moodLabel: "맑은 설렘" },
  { songTitle: "Everything", artist: "검정치마", palette: "warm", tags: ["사랑", "포근", "그리움", "집", "비"], moodLabel: "포근한 여운" },
  { songTitle: "Ditto", artist: "NewJeans", palette: "nocturne", tags: ["겨울", "몽환", "차분", "새벽", "그리움"], moodLabel: "희미한 잔상" },
  { songTitle: "여행", artist: "볼빨간사춘기", palette: "sunrise", tags: ["여행", "출발", "신남", "드라이브", "답답"], moodLabel: "가벼운 출발" },
  { songTitle: "출발", artist: "김동률", palette: "warm", tags: ["시작", "용기", "응원", "아침", "새로운"], moodLabel: "다정한 용기" },
  { songTitle: "D (half moon)", artist: "DEAN", palette: "nocturne", tags: ["새벽", "외로움", "몽환", "밤", "집"], moodLabel: "새벽의 빈자리" },
];

function getCuratedRecommendation(situation: string, mood: string, referenceSong?: string) {
  const input = `${situation} ${mood}`.toLowerCase();
  const scored = curatedSongs.map((song, index) => ({
    song,
    index,
    score: song.tags.reduce((total, tag) => total + (input.includes(tag) ? 2 : 0), 0),
  }));
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  const selected = scored[0].score > 0
    ? scored[0].song
    : curatedSongs[Math.abs([...input].reduce((sum, character) => sum + character.charCodeAt(0), 0)) % curatedSongs.length];
  const hasReference = Boolean(referenceSong?.trim());

  return {
    songTitle: selected.songTitle,
    artist: selected.artist,
    shortReason: `${mood.trim()} 마음에 자연스럽게 스며들 곡이에요.`,
    detailReason: `${situation.trim()}이라는 순간을 방해하지 않으면서도, 지금 느끼는 ${mood.trim()}의 결을 부드럽게 이어줄 한 곡으로 골랐어요.`,
    moodLabel: selected.moodLabel,
    palette: selected.palette,
    similarity: hasReference ? "기준 곡처럼 감정선을 천천히 쌓아가는 분위기가 닮았어요." : null,
    difference: hasReference ? "조금 다른 목소리와 리듬으로 지금의 순간에 새로운 결을 더해요." : null,
  };
}

export async function POST(request: Request) {
  try {
    const { situation, mood, referenceSong } = await request.json() as { situation?: string; mood?: string; referenceSong?: string };
    if (!situation?.trim() || !mood?.trim()) return NextResponse.json({ error: "상황과 기분을 모두 알려주세요." }, { status: 400 });
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) return NextResponse.json(getCuratedRecommendation(situation.trim(), mood.trim(), referenceSong));
    const referenceInstruction = referenceSong?.trim() ? `기준 곡은 “${referenceSong.trim()}”이다. 실제로 식별 가능한 곡이면 비슷한 결을 참고하되 같은 아티스트는 피하라. similarity와 difference를 각각 한 문장으로 작성하라. 식별이 어렵다면 곡명과 가수를 확인해달라는 내용을 shortReason에 담아라.` : "기준 곡은 없다. similarity와 difference는 null로 반환하라.";
    const prompt = `너는 음악 큐레이터다. 사용자의 현재 순간에 어울리는 실제로 존재하는 노래 딱 한 곡을 추천한다.\n상황: ${situation.trim()}\n기분: ${mood.trim()}\n${referenceInstruction}\n\n한국어로 답하고, 다음 JSON 객체만 출력하라. 마크다운과 코드펜스는 쓰지 마라.\n{"songTitle":"정확한 곡명","artist":"정확한 아티스트","shortReason":"14~28자의 자연스러운 한 줄","detailReason":"입력한 상황과 기분을 직접 연결한 1~2문장","moodLabel":"결과를 표현하는 2~5단어","palette":"nocturne 또는 sunrise 또는 warm","similarity":null 또는 한 문장,"difference":null 또는 한 문장}\npalette는 몽환적·차분함이면 nocturne, 밝고 경쾌하면 sunrise, 포근하고 잔잔하면 warm으로 정하라. 곡명이나 가수를 확신할 수 없으면 유명하고 식별 가능한 다른 곡을 선택하라.`;
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent", { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.85, maxOutputTokens: 700, responseMimeType: "application/json" } }) });
    if (!response.ok) {
      if (response.status === 429) return NextResponse.json(getCuratedRecommendation(situation.trim(), mood.trim(), referenceSong));
      throw new Error(`Gemini request failed: ${response.status}`);
    }
    const data = await response.json() as { candidates?: Array<{ content?: { parts?: GeminiPart[] } }> };
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
    if (!text) throw new Error("Empty Gemini response");
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const palettes = new Set(["nocturne", "sunrise", "warm"]);
    const result = { songTitle: String(parsed.songTitle || ""), artist: String(parsed.artist || ""), shortReason: String(parsed.shortReason || "지금의 순간에 어울리는 첫 곡이에요."), detailReason: String(parsed.detailReason || "입력한 상황과 기분을 바탕으로 골랐어요."), moodLabel: String(parsed.moodLabel || "지금의 무드"), palette: palettes.has(String(parsed.palette)) ? parsed.palette : "nocturne", similarity: referenceSong?.trim() ? String(parsed.similarity || "비슷한 분위기의 결을 가진 곡이에요.") : null, difference: referenceSong?.trim() ? String(parsed.difference || "조금 다른 리듬과 질감으로 들려요.") : null };
    if (!result.songTitle || !result.artist) throw new Error("Invalid Gemini response");
    return NextResponse.json(result);
  } catch (error) {
    console.error("Recommendation error", error);
    return NextResponse.json({ error: "추천을 가져오는 중 문제가 생겼어요. 입력은 그대로 두었으니 다시 시도해주세요." }, { status: 500 });
  }
}
