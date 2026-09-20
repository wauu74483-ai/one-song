import { NextResponse } from "next/server";

type Palette = "nocturne" | "sunrise" | "warm";
type Song = { songTitle: string; artist: string; palette: Palette; moodLabel: string; tags: string[] };
type GeminiResponse = { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };

const songs: Song[] = [
  { songTitle: "밤편지", artist: "아이유", palette: "warm", moodLabel: "조용한 온기", tags: ["밤", "산책", "차분", "포근", "그리움"] },
  { songTitle: "Square (2017)", artist: "백예린", palette: "sunrise", moodLabel: "가벼운 해방감", tags: ["산뜻", "후련", "햇살", "드라이브", "설렘"] },
  { songTitle: "TOMBOY", artist: "혁오", palette: "nocturne", moodLabel: "느슨한 밤공기", tags: ["지침", "혼자", "생각", "밤", "공허"] },
  { songTitle: "Love Lee", artist: "AKMU", palette: "sunrise", moodLabel: "맑은 설렘", tags: ["기분좋", "신남", "산뜻", "주말", "설렘"] },
  { songTitle: "Everything", artist: "검정치마", palette: "warm", moodLabel: "포근한 여운", tags: ["사랑", "포근", "그리움", "집", "비"] },
  { songTitle: "Ditto", artist: "NewJeans", palette: "nocturne", moodLabel: "희미한 잔상", tags: ["겨울", "몽환", "차분", "새벽", "그리움"] },
  { songTitle: "여행", artist: "볼빨간사춘기", palette: "sunrise", moodLabel: "가벼운 출발", tags: ["여행", "출발", "신남", "드라이브", "답답"] },
  { songTitle: "출발", artist: "김동률", palette: "warm", moodLabel: "다정한 용기", tags: ["시작", "용기", "응원", "아침", "새로운"] },
  { songTitle: "D (half moon)", artist: "DEAN", palette: "nocturne", moodLabel: "새벽의 빈자리", tags: ["새벽", "외로움", "몽환", "밤", "집"] },
];

function curatedRecommendations(situation: string, mood: string, referenceSong: string) {
  const input = `${situation} ${mood} ${referenceSong}`.toLowerCase();
  const seed = Math.abs([...input].reduce((sum, char) => sum + char.charCodeAt(0), 0));
  const ranked = songs
    .map((song, index) => ({ song, index, score: song.tags.reduce((total, tag) => total + (input.includes(tag) ? 2 : 0), 0) }))
    .sort((a, b) => b.score - a.score || ((a.index + seed) % songs.length) - ((b.index + seed) % songs.length));
  const chosen = ranked[0].score > 0
    ? ranked.slice(0, 3).map(({ song }) => song)
    : Array.from({ length: 3 }, (_, index) => songs[(seed + index * 2) % songs.length]);
  const hasReference = Boolean(referenceSong);
  const roles = ["첫 재생으로 자연스럽게 스며들", "분위기를 산뜻하게 바꿔 줄", "마지막에 여운을 남길"];

  return chosen.map((song, index) => ({
    songTitle: song.songTitle,
    artist: song.artist,
    shortReason: hasReference ? "좋아하는 곡의 여운을 새로운 결로 이어줘요." : `${mood} 마음에 ${roles[index]} 곡이에요.`,
    detailReason: hasReference
      ? `“${referenceSong}”에서 느껴지는 분위기를 출발점으로 삼아, 익숙함과 새로움이 함께 남도록 골랐어요.`
      : `${situation}이라는 순간에 어울리면서도 세 곡이 서로 다른 온도로 이어지도록 골랐어요.`,
    theme: song.palette,
    themeLabel: song.moodLabel,
    similarity: hasReference ? "감정선을 천천히 쌓아가는 분위기가 닮았어요." : null,
    difference: hasReference ? ["멜로디를 조금 더 선명하게 이어가요.", "리듬과 목소리의 질감을 새롭게 바꿨어요.", "한층 잔잔한 여운으로 마무리돼요."][index] : null,
  }));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const situation = typeof body.situation === "string" ? body.situation.trim() : "";
    const mood = typeof body.mood === "string" ? body.mood.trim() : "";
    const referenceSong = typeof body.referenceSong === "string" ? body.referenceSong.trim() : "";
    const hasMoment = Boolean(situation && mood);
    const hasReference = Boolean(referenceSong);
    if (!hasMoment && !hasReference) return NextResponse.json({ error: "상황과 기분, 또는 떠오르는 노래를 알려주세요." }, { status: 400 });

    const apiKey = request.headers.get("x-gemini-api-key")?.trim() || process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) return NextResponse.json({ recommendations: curatedRecommendations(situation, mood, referenceSong) });

    const inputInstruction = hasMoment
      ? `상황: "${situation}"\n기분: "${mood}"\n기준 곡은 없다.`
      : `상황과 기분 입력은 없다. 기준 곡은 "${referenceSong}"이다. 기준 곡과 같은 곡이나 같은 아티스트는 추천하지 마라.`;
    const comparisonInstruction = hasReference
      ? "각 곡의 similarity와 difference를 기준 곡과 비교한 한 문장으로 작성하라."
      : "모든 similarity와 difference는 null로 반환하라.";
    const prompt = `너는 음악 큐레이터다. 아래 입력을 바탕으로 실제 존재하는 노래 3곡을 추천하라. 아티스트를 겹치지 말고, 첫 재생·분위기 전환·여운처럼 세 곡의 역할을 다르게 구성하라.\n${inputInstruction}\n${comparisonInstruction}\n\n마크다운 없이 다음 형식의 JSON 객체만 출력하라.\n{"recommendations":[{"songTitle":"정확한 곡명","artist":"정확한 아티스트","shortReason":"짧은 추천 이유","detailReason":"입력과 연결한 1~2문장","theme":"nocturne 또는 sunrise 또는 warm","themeLabel":"2~5단어","similarity":null 또는 한 문장,"difference":null 또는 한 문장}]}\nrecommendations는 정확히 3개여야 한다.`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.8, maxOutputTokens: 1600, responseMimeType: "application/json" } }),
    });
    if (!response.ok) {
      if (response.status === 400 || response.status === 403) return NextResponse.json({ error: "API 키가 올바르지 않거나 권한이 없습니다.", isKeyError: true }, { status: response.status });
      return NextResponse.json({ recommendations: curatedRecommendations(situation, mood, referenceSong) });
    }

    const data: GeminiResponse = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
    if (!raw) return NextResponse.json({ recommendations: curatedRecommendations(situation, mood, referenceSong) });
    const parsed = JSON.parse(raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, ""));
    const validThemes: Palette[] = ["nocturne", "sunrise", "warm"];
    const recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 3).map((item: Record<string, unknown>) => ({
      songTitle: String(item.songTitle || "").trim(),
      artist: String(item.artist || "").trim(),
      shortReason: String(item.shortReason || "지금 듣기 좋은 곡이에요.").trim(),
      detailReason: String(item.detailReason || "입력해 주신 취향을 바탕으로 골랐어요.").trim(),
      theme: validThemes.includes(item.theme as Palette) ? item.theme : "nocturne",
      themeLabel: String(item.themeLabel || "지금의 무드").trim(),
      similarity: hasReference ? String(item.similarity || "감정의 결이 자연스럽게 이어져요.").trim() : null,
      difference: hasReference ? String(item.difference || "새로운 리듬과 목소리를 더해요.").trim() : null,
    })) : [];
    if (recommendations.length < 2 || recommendations.some((item: { songTitle: string; artist: string }) => !item.songTitle || !item.artist)) return NextResponse.json({ recommendations: curatedRecommendations(situation, mood, referenceSong) });
    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("Recommendation error", error);
    return NextResponse.json({ error: "추천을 만드는 중 문제가 생겼어요. 입력은 그대로 두었으니 다시 시도해주세요." }, { status: 500 });
  }
}
