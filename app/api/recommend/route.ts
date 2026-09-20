import { NextResponse } from "next/server";

type Palette = "nocturne" | "sunrise" | "warm";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const situation = typeof body.situation === "string" ? body.situation.trim() : "";
    const mood = typeof body.mood === "string" ? body.mood.trim() : "";
    const referenceSong = typeof body.referenceSong === "string" ? body.referenceSong.trim() : "";

    // 공백은 미입력 처리 & 필수 입력 검증
    if (!situation || !mood) {
      return NextResponse.json(
        { error: "상황과 기분을 모두 입력해주세요." },
        { status: 400 }
      );
    }

    // 클라이언트 헤더 또는 서버 환경변수에서 키 획득
    const clientKey = request.headers.get("x-gemini-api-key")?.trim();
    const serverKey = process.env.GEMINI_API_KEY?.trim();
    const apiKey = clientKey || serverKey;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Gemini API 키가 설정되지 않았습니다. 우측 상단의 'API 키 설정'에서 키를 입력하거나 서버 환경변수(GEMINI_API_KEY)를 등록해주세요.",
          isKeyMissing: true,
        },
        { status: 400 }
      );
    }

    const hasReference = Boolean(referenceSong);
    const referencePrompt = hasReference
      ? `기준 곡: "${referenceSong}".
요구사항:
1. 기준 곡을 실제로 식별하여 그 음악적 결(장르, 무드, 감성 등)을 참고하되, 기준 곡과 동일한 아티스트나 같은 곡은 절대 추천하지 마라.
2. 실제로 존재하는 유명하거나 널리 알려진 곡 1곡을 추천하라.
3. similarity에는 기준 곡과 닮은 점을 1문장으로 자연스럽게 작성하라.
4. difference에는 기준 곡과 다른 점 또는 새로운 점을 1문장으로 자연스럽게 작성하라.
만약 기준 곡의 제목이나 아티스트가 불분명하거나 식별이 어렵다면, similarity와 difference에 기준 곡과의 관계를 설명하기 어렵다는 점을 언급하거나 친숙한 곡으로 비교하라.`
      : `기준 곡: 없음.
similarity와 difference는 반드시 null로 지정하라.`;

    const prompt = `당신은 탁월한 음악 큐레이터입니다.
첫 곡이 떠오르지 않는 사용자를 위해, 상황과 기분(그리고 선택적인 기준 곡)에 꼭 맞는 실제로 존재하는 노래 '단 1곡'을 추천해주세요.

사용자 입력:
- 상황: "${situation}"
- 기분: "${mood}"
- ${referencePrompt}

테마(palette) 규칙:
- "nocturne": 남색·라벤더 테마. 밤, 새벽, 몽환적, 차분함, 고요함, 지친 밤 위로
- "sunrise": 크림색·코랄 테마. 산뜻함, 밝음, 경쾌함, 새로운 시작, 활력, 기분 전환
- "warm": 아이보리·갈색 테마. 포근함, 따스함, 잔잔함, 커피, 나른함, 편안한 휴식

반드시 마크다운이나 코드 블록 기호(\`\`\`json 등) 없이, 오직 순수한 JSON 객체 하나만 출력하세요.
형식:
{
  "songTitle": "실제 존재하는 곡 제목 (정확한 표기)",
  "artist": "가수/아티스트 이름",
  "shortReason": "상황과 기분에 어울리는 한 줄 추천 이유 (20~40자 내외)",
  "detailReason": "상황과 감정선을 연결하여 왜 이 곡을 추천하는지 설명하는 1~2문장의 자연스러운 문장",
  "theme": "nocturne" | "sunrise" | "warm",
  "themeLabel": "남색·라벤더" | "크림색·코랄" | "아이보리·갈색",
  "similarity": ${hasReference ? '"기준 곡과 닮은 점 (한 문장)"' : "null"},
  "difference": ${hasReference ? '"기준 곡과 다른 점 (한 문장)"' : "null"}
}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errorText);

      if (geminiRes.status === 400 || geminiRes.status === 403) {
        return NextResponse.json(
          {
            error:
              "API 키가 올바르지 않거나 권한이 없습니다. API 키를 다시 확인해주세요.",
            isKeyError: true,
          },
          { status: geminiRes.status }
        );
      }
      if (geminiRes.status === 429) {
        return NextResponse.json(
          {
            error:
              "Gemini API 무료 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        {
          error:
            "곡을 추천하는 중 Gemini 서비스 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        },
        { status: 502 }
      );
    }

    const data: GeminiResponse = await geminiRes.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!rawText) {
      return NextResponse.json(
        {
          error:
            "Gemini 응답을 읽어오지 못했습니다. 입력은 그대로 유지되니 다시 시도해주세요.",
        },
        { status: 502 }
      );
    }

    // JSON 파싱 (코드펜스 제거 포함)
    const cleanedText = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleanedText);

    if (!parsed.songTitle || !parsed.artist) {
      return NextResponse.json(
        {
          error:
            "곡 정보를 정확히 파악하지 못했습니다. 기준 곡을 입력하셨다면 곡명과 가수를 조금 더 명확히 입력 후 다시 시도해주세요.",
        },
        { status: 422 }
      );
    }

    const validPalettes: Palette[] = ["nocturne", "sunrise", "warm"];
    const theme: Palette = validPalettes.includes(parsed.theme)
      ? parsed.theme
      : "nocturne";

    const themeLabelMap: Record<Palette, string> = {
      nocturne: "남색·라벤더 테마",
      sunrise: "크림색·코랄 테마",
      warm: "아이보리·갈색 테마",
    };

    return NextResponse.json({
      recommendation: {
        songTitle: String(parsed.songTitle).trim(),
        artist: String(parsed.artist).trim(),
        shortReason: String(
          parsed.shortReason || "지금의 순간에 가장 어울리는 첫 곡이에요."
        ).trim(),
        detailReason: String(
          parsed.detailReason || "남겨주신 상황과 기분을 바탕으로 골랐어요."
        ).trim(),
        theme,
        themeLabel: themeLabelMap[theme],
        similarity: parsed.similarity ? String(parsed.similarity).trim() : null,
        difference: parsed.difference ? String(parsed.difference).trim() : null,
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        error:
          "추천을 생성하는 도중 오류가 발생했습니다. 입력하신 내용은 그대로 유지되니 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}
