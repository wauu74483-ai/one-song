import { NextResponse } from "next/server";

type Palette = "nocturne" | "sunrise" | "warm";
type Song = { songTitle: string; artist: string; palette: Palette; moodLabel: string; tags: string[] };
type ReferenceProfile = { terms: string[]; tags: string[]; description: string };
type GeminiResponse = { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };

const songs: Song[] = [
  { songTitle: "밤편지", artist: "아이유", palette: "warm", moodLabel: "조용한 온기", tags: ["밤", "산책", "차분", "포근", "그리움", "어쿠스틱", "서정", "느림"] },
  { songTitle: "Square (2017)", artist: "백예린", palette: "sunrise", moodLabel: "가벼운 해방감", tags: ["산뜻", "후련", "햇살", "드라이브", "설렘", "인디팝", "중간템포"] },
  { songTitle: "TOMBOY", artist: "혁오", palette: "nocturne", moodLabel: "느슨한 밤공기", tags: ["지침", "혼자", "생각", "밤", "공허", "인디록", "밴드"] },
  { songTitle: "Love Lee", artist: "AKMU", palette: "sunrise", moodLabel: "맑은 설렘", tags: ["기분좋", "신남", "산뜻", "주말", "설렘", "밝음", "팝", "경쾌"] },
  { songTitle: "Everything", artist: "검정치마", palette: "warm", moodLabel: "포근한 여운", tags: ["사랑", "포근", "그리움", "집", "비", "인디", "느림"] },
  { songTitle: "Ditto", artist: "NewJeans", palette: "nocturne", moodLabel: "희미한 잔상", tags: ["겨울", "몽환", "차분", "새벽", "그리움", "뉴트로", "중간템포"] },
  { songTitle: "여행", artist: "볼빨간사춘기", palette: "sunrise", moodLabel: "가벼운 출발", tags: ["여행", "출발", "신남", "드라이브", "답답", "밝음", "팝"] },
  { songTitle: "출발", artist: "김동률", palette: "warm", moodLabel: "다정한 용기", tags: ["시작", "용기", "응원", "아침", "새로운", "어쿠스틱", "서정"] },
  { songTitle: "D (half moon)", artist: "DEAN", palette: "nocturne", moodLabel: "새벽의 빈자리", tags: ["새벽", "외로움", "몽환", "밤", "집", "알앤비", "그루브"] },
  { songTitle: "Show Me How", artist: "Men I Trust", palette: "nocturne", moodLabel: "부드러운 부유감", tags: ["몽환", "드림팝", "느림", "밤", "신스", "공간감", "그루브"] },
  { songTitle: "My Jinji", artist: "Sunset Rollercoaster", palette: "warm", moodLabel: "느긋한 낭만", tags: ["드림팝", "포근", "그루브", "중간템포", "밴드", "공간감"] },
  { songTitle: "Apocalypse", artist: "Cigarettes After Sex", palette: "nocturne", moodLabel: "짙은 잔향", tags: ["몽환", "드림팝", "느림", "밤", "쓸쓸", "공간감"] },
  { songTitle: "Warm on a Cold Night", artist: "HONNE", palette: "warm", moodLabel: "전자음의 온기", tags: ["포근", "신스", "알앤비", "그루브", "밤", "중간템포"] },
  { songTitle: "Instagram", artist: "DEAN", palette: "nocturne", moodLabel: "도시의 고독", tags: ["새벽", "쓸쓸", "알앤비", "그루브", "도시", "중간템포"] },
  { songTitle: "Get You", artist: "Daniel Caesar", palette: "warm", moodLabel: "느린 설렘", tags: ["사랑", "알앤비", "느림", "포근", "그루브"] },
  { songTitle: "Bad Habit", artist: "Steve Lacy", palette: "sunrise", moodLabel: "비뚤어진 그루브", tags: ["알앤비", "펑크", "그루브", "중간템포", "밝음"] },
  { songTitle: "Hype Boy", artist: "NewJeans", palette: "sunrise", moodLabel: "가벼운 박동", tags: ["팝", "댄스", "경쾌", "밝음", "신남", "빠름"] },
  { songTitle: "LILAC", artist: "아이유", palette: "sunrise", moodLabel: "봄날의 작별", tags: ["팝", "댄스", "밝음", "경쾌", "봄", "빠름"] },
  { songTitle: "Time of Our Life", artist: "DAY6", palette: "sunrise", moodLabel: "청량한 질주", tags: ["밴드", "록", "빠름", "신남", "청량", "응원"] },
  { songTitle: "주저하는 연인들을 위해", artist: "잔나비", palette: "warm", moodLabel: "복고의 낭만", tags: ["밴드", "인디록", "서정", "그리움", "중간템포"] },
  { songTitle: "Every day, Every Moment", artist: "폴킴", palette: "warm", moodLabel: "담백한 다정함", tags: ["발라드", "어쿠스틱", "느림", "따뜻", "사랑"] },
];

const referenceProfiles: ReferenceProfile[] = [
  { terms: ["space song", "beach house"], tags: ["몽환", "드림팝", "느림", "밤", "신스", "공간감"], description: "느린 템포와 넓게 번지는 신스, 몽환적인 드림팝 질감" },
  { terms: ["밤편지"], tags: ["어쿠스틱", "서정", "느림", "따뜻", "밤"], description: "잔잔한 어쿠스틱 편곡과 가까이 속삭이는 듯한 서정성" },
  { terms: ["ditto"], tags: ["뉴트로", "몽환", "중간템포", "그리움", "팝"], description: "절제된 리듬과 흐릿한 향수를 품은 뉴트로 팝 질감" },
  { terms: ["love lee"], tags: ["밝음", "팝", "경쾌", "설렘", "어쿠스틱"], description: "통통 튀는 리듬과 밝은 어쿠스틱 팝의 설렘" },
  { terms: ["tomboy", "혁오"], tags: ["인디록", "밴드", "쓸쓸", "중간템포"], description: "건조한 밴드 사운드와 청춘의 쓸쓸한 인디 록 정서" },
  { terms: ["newjeans", "뉴진스", "hype boy", "super shy"], tags: ["팝", "댄스", "경쾌", "밝음", "빠름"], description: "가볍고 탄력적인 비트와 선명한 팝 에너지" },
  { terms: ["dean", "딘", "half moon", "instagram"], tags: ["알앤비", "그루브", "새벽", "도시", "중간템포"], description: "도시적인 알앤비 그루브와 늦은 밤의 공기" },
  { terms: ["wave to earth", "seasons", "bad"], tags: ["인디", "밴드", "몽환", "포근", "느림"], description: "느슨한 밴드 연주와 포근하게 번지는 인디 사운드" },
  { terms: ["day6", "데이식스", "한 페이지가 될 수 있게"], tags: ["밴드", "록", "빠름", "청량", "응원"], description: "빠른 밴드 리듬과 함께 달리는 듯한 청량한 록 에너지" },
];

function stableHash(value: string) {
  let hash = 2166136261;
  for (const character of value) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return hash >>> 0;
}

function curatedRecommendations(situation: string, mood: string, referenceSong: string) {
  const input = `${situation} ${mood} ${referenceSong}`.toLowerCase();
  const seed = stableHash(input);
  const profile = referenceSong ? referenceProfiles.find((item) => item.terms.some((term) => input.includes(term))) : undefined;
  const profileTags = new Set(profile?.tags || []);
  const normalizedReference = referenceSong.replace(/[^a-z0-9가-힣]/gi, "").toLowerCase();
  const ranked = songs
    .filter((song) => {
      const identity = `${song.songTitle}${song.artist}`.replace(/[^a-z0-9가-힣]/gi, "").toLowerCase();
      return !normalizedReference || !normalizedReference.includes(song.songTitle.replace(/[^a-z0-9가-힣]/gi, "").toLowerCase()) && !identity.includes(normalizedReference);
    })
    .map((song) => ({ song, score: song.tags.reduce((total, tag) => total + (profileTags.has(tag) ? 5 : 0) + (input.includes(tag) ? 2 : 0), 0), tie: stableHash(`${input}:${song.songTitle}`) }))
    .sort((a, b) => b.score - a.score || a.tie - b.tie);
  const chosen = ranked[0].score > 0
    ? ranked.slice(0, 3).map(({ song }) => song)
    : [0, 7, 13].map((offset) => ranked[(seed + offset) % ranked.length].song);
  const hasReference = Boolean(referenceSong);
  const roles = ["첫 재생으로 자연스럽게 스며들", "분위기를 산뜻하게 바꿔 줄", "마지막에 여운을 남길"];

  return chosen.map((song, index) => ({
    songTitle: song.songTitle,
    artist: song.artist,
    shortReason: hasReference ? "좋아하는 곡의 여운을 새로운 결로 이어줘요." : `${mood} 마음에 ${roles[index]} 곡이에요.`,
    detailReason: hasReference
      ? profile
        ? `“${referenceSong}”의 ${profile.description}을 기준으로, 핵심 분위기는 유지하면서 서로 다른 세 방향으로 골랐어요.`
        : `“${referenceSong}”을 출발점으로 삼아, 겹치지 않는 장르와 템포로 세 곡의 흐름을 구성했어요. API 키를 설정하면 곡의 음악적 특징을 더 정밀하게 분석해요.`
      : `${situation}이라는 순간에 어울리면서도 세 곡이 서로 다른 온도로 이어지도록 골랐어요.`,
    theme: song.palette,
    themeLabel: song.moodLabel,
    similarity: hasReference ? profile ? `${profile.description} 중 일부를 자연스럽게 이어가요.` : "기준 곡에서 느껴지는 정서적 흐름을 이어가요." : null,
    difference: hasReference ? ["멜로디를 조금 더 선명하게 이어가요.", "리듬과 목소리의 질감을 새롭게 바꿨어요.", "한층 잔잔한 여운으로 마무리돼요."][index] : null,
  }));
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
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
      : `상황과 기분 입력은 없다. 기준 곡은 "${referenceSong}"이다. 먼저 이 곡을 정확히 식별한 뒤 장르, 템포(BPM 범위), 에너지, 밝기/어두움, 리듬, 악기 편성, 보컬 질감의 7가지 축으로 분석하라. 기준 곡과 같은 곡이나 같은 아티스트는 추천하지 마라.`;
    const comparisonInstruction = hasReference
      ? "각 곡의 similarity와 difference를 기준 곡과 비교한 한 문장으로 작성하라."
      : "모든 similarity와 difference는 null로 반환하라.";
    const prompt = `너는 음악 큐레이터다. 아래 입력을 바탕으로 실제 존재하는 노래 3곡을 추천하라. 아티스트를 겹치지 말고, 세 곡 모두 기준 입력의 핵심 음악적 특징과 명확한 연결점이 있어야 한다. 유명도만으로 반복 추천하지 말고 장르·템포·에너지·리듬·악기·보컬 질감을 근거로 선택하라. 첫 곡은 가장 가까운 곡, 두 번째는 핵심 특징을 유지한 변주, 세 번째는 경계 안에서 가장 새로운 곡으로 구성하라.\n${inputInstruction}\n${comparisonInstruction}\n\n마크다운 없이 다음 형식의 JSON 객체만 출력하라.\n{"recommendations":[{"songTitle":"정확한 곡명","artist":"정확한 아티스트","shortReason":"짧은 추천 이유","detailReason":"어떤 음악적 특징 때문에 추천했는지 구체적인 1~2문장","theme":"nocturne 또는 sunrise 또는 warm","themeLabel":"2~5단어","similarity":null 또는 구체적인 한 문장,"difference":null 또는 구체적인 한 문장}]}\nrecommendations는 정확히 3개여야 한다.`;
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
