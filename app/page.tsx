"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  KeyRound,
  Loader2,
  Music,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Palette = "nocturne" | "sunrise" | "warm";

interface Recommendation {
  songTitle: string;
  artist: string;
  shortReason: string;
  detailReason: string;
  theme: Palette;
  themeLabel: string;
  similarity?: string | null;
  difference?: string | null;
}

const situationExamples = ["밤 산책", "쉬는 시간"];
const moodExamples = ["차분함", "산뜻함", "포근함"];
const referenceExamples = ["Space Song — Beach House"];

const themeStyles: Record<
  Palette,
  {
    bg: string;
    cardBg: string;
    textPrimary: string;
    textSecondary: string;
    accentBg: string;
    accentText: string;
    accentHover: string;
    border: string;
    chipBg: string;
    chipText: string;
  }
> = {
  // 남색·라벤더
  nocturne: {
    bg: "bg-[#111322] text-[#f4f2fb]",
    cardBg: "bg-[#1c2035]/90 border-[#2f3557]",
    textPrimary: "text-[#f8f7ff]",
    textSecondary: "text-[#c2bede]",
    accentBg: "bg-[#a78bfa]",
    accentText: "text-[#121024]",
    accentHover: "hover:bg-[#b8a0fc]",
    border: "border-[#343b60]",
    chipBg: "bg-[#282d4a]",
    chipText: "text-[#dcd6fa]",
  },
  // 크림색·코랄
  sunrise: {
    bg: "bg-[#fffaf4] text-[#2d1f1c]",
    cardBg: "bg-white/95 border-[#fed7aa]",
    textPrimary: "text-[#2a1a17]",
    textSecondary: "text-[#7c5850]",
    accentBg: "bg-[#ea580c]",
    accentText: "text-white",
    accentHover: "hover:bg-[#c2410c]",
    border: "border-[#fed7aa]",
    chipBg: "bg-[#ffedd5]",
    chipText: "text-[#9a3412]",
  },
  // 아이보리·갈색
  warm: {
    bg: "bg-[#fbf7f0] text-[#2b211a]",
    cardBg: "bg-white/95 border-[#e7dbce]",
    textPrimary: "text-[#261c16]",
    textSecondary: "text-[#6e584a]",
    accentBg: "bg-[#854d0e]",
    accentText: "text-white",
    accentHover: "hover:bg-[#713f12]",
    border: "border-[#dfd1c1]",
    chipBg: "bg-[#f3eae0]",
    chipText: "text-[#633e24]",
  },
};

export default function Home() {
  const [situation, setSituation] = useState("");
  const [mood, setMood] = useState("");
  const [referenceSong, setReferenceSong] = useState("");

  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isKeyError, setIsKeyError] = useState(false);

  // 로컬 브라우저에서 편리하게 테스트할 수 있는 사용자 API Key 지원
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [savedApiKey, setSavedApiKey] = useState("");

  useEffect(() => {
    const key = localStorage.getItem("user_gemini_api_key") || "";
    setSavedApiKey(key);
    setApiKeyInput(key);
  }, []);

  function saveKey() {
    const trimmed = apiKeyInput.trim();
    localStorage.setItem("user_gemini_api_key", trimmed);
    setSavedApiKey(trimmed);
    setShowKeyModal(false);
    setError("");
    setIsKeyError(false);
  }

  // 상황, 기분이 모두 채워졌을 때 버튼 활성화 (공백 제외)
  const canSubmit = situation.trim().length > 0 && mood.trim().length > 0 && !loading;

  async function handleRecommend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError("");
    setIsKeyError(false);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (savedApiKey) {
        headers["x-gemini-api-key"] = savedApiKey;
      }

      const res = await fetch("/api/recommend", {
        method: "POST",
        headers,
        body: JSON.stringify({
          situation: situation.trim(),
          mood: mood.trim(),
          referenceSong: referenceSong.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.isKeyMissing || data.isKeyError) {
          setIsKeyError(true);
        }
        throw new Error(data.error || "곡을 추천받지 못했습니다.");
      }

      if (!data.recommendation || !data.recommendation.songTitle) {
        throw new Error("추천 결과 형식이 올바르지 않습니다.");
      }

      setRecommendation(data.recommendation);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "잠시 후 다시 시도해주세요.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // 예시 채우기 (해당 칸만 채우며 수정 가능)
  function fillExample(type: "situation" | "mood" | "reference", val: string) {
    if (type === "situation") setSituation(val);
    if (type === "mood") setMood(val);
    if (type === "reference") setReferenceSong(val);
  }

  // PRD 시연 시나리오 A: 과제 끝내고 집으로 걷는 중, 후련한데 조금 지쳤어요
  function fillDemoA() {
    setSituation("과제 끝내고 집으로 걷는 중");
    setMood("후련한데 조금 지쳤어요");
    setReferenceSong("");
    setError("");
  }

  // PRD 시연 시나리오 B: 밤 산책, 몽환적이지만 조금 더 밝게, Space Song — Beach House
  function fillDemoB() {
    setSituation("밤 산책");
    setMood("몽환적이지만 조금 더 밝게");
    setReferenceSong("Space Song — Beach House");
    setError("");
  }

  // 다른 순간 고르기: "입력을 유지하며 돌아간다" (PRD 명시)
  function handleBackToInput() {
    setRecommendation(null);
    setError("");
  }

  // -------------------------------------------------------------
  // 화면 2: 결과 화면
  // -------------------------------------------------------------
  if (recommendation) {
    const theme = themeStyles[recommendation.theme] || themeStyles.nocturne;
    const searchUrl = `https://music.youtube.com/search?q=${encodeURIComponent(
      `${recommendation.songTitle} ${recommendation.artist}`
    )}`;

    return (
      <main
        className={`min-h-screen ${theme.bg} transition-colors duration-500 py-10 px-5 sm:px-8 flex flex-col justify-between`}
      >
        <div className="w-full max-w-[720px] mx-auto flex-1 flex flex-col">
          {/* 상단 헤더 & 돌아가기 버튼 */}
          <header className="flex items-center justify-between pb-6 border-b border-current/15">
            <button
              onClick={handleBackToInput}
              className="inline-flex items-center gap-1.5 text-sm font-semibold opacity-85 hover:opacity-100 transition-opacity"
            >
              <ArrowLeft className="w-4 h-4" /> 다른 순간 고르기
            </button>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${theme.chipBg} ${theme.chipText}`}
            >
              {recommendation.themeLabel}
            </span>
          </header>

          {/* 결과 본문 */}
          <section className="mt-8 flex-1">
            <p className="text-sm font-bold tracking-wider uppercase opacity-80 mb-2">
              지금의 첫 곡
            </p>

            {/* 입력 요약 배지 */}
            <div className="mb-6 flex flex-wrap gap-2 text-xs">
              <span
                className={`px-3 py-1.5 rounded-full border ${theme.border} ${theme.cardBg} font-medium`}
              >
                상황: {situation}
              </span>
              <span
                className={`px-3 py-1.5 rounded-full border ${theme.border} ${theme.cardBg} font-medium`}
              >
                기분: {mood}
              </span>
              {referenceSong.trim() && (
                <span
                  className={`px-3 py-1.5 rounded-full border ${theme.border} ${theme.cardBg} font-medium`}
                >
                  기준 곡: {referenceSong}
                </span>
              )}
            </div>

            {/* 추천 곡 정보 카드 */}
            <div
              className={`rounded-2xl border ${theme.border} ${theme.cardBg} p-6 sm:p-8 shadow-lg`}
            >
              {/* 곡명 (36px 기준) */}
              <h1 className="text-[32px] sm:text-[36px] font-bold leading-tight tracking-tight">
                {recommendation.songTitle}
              </h1>
              {/* 가수 (16px 기준) */}
              <p className={`mt-2 text-base font-semibold ${theme.textSecondary}`}>
                {recommendation.artist}
              </p>

              {/* 추천 이유 */}
              <div className="mt-6 pt-5 border-t border-current/10 space-y-2">
                <p className="text-lg font-bold leading-snug">
                  “{recommendation.shortReason}”
                </p>
                <p className={`text-base leading-relaxed ${theme.textSecondary}`}>
                  {recommendation.detailReason}
                </p>
              </div>

              {/* 기준 곡 비교 (기준 곡이 있을 때) */}
              {referenceSong.trim() && (recommendation.similarity || recommendation.difference) && (
                <div className="mt-6 pt-5 border-t border-current/10">
                  <p className="text-xs font-bold uppercase tracking-wider mb-3 opacity-75">
                    기준 곡과의 비교 ({referenceSong})
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 text-sm">
                    {recommendation.similarity && (
                      <div
                        className={`p-3.5 rounded-xl border ${theme.border} ${theme.chipBg}`}
                      >
                        <span className="font-bold block mb-1">닮은 점</span>
                        <p className="leading-relaxed opacity-95">
                          {recommendation.similarity}
                        </p>
                      </div>
                    )}
                    {recommendation.difference && (
                      <div
                        className={`p-3.5 rounded-xl border ${theme.border} ${theme.chipBg}`}
                      >
                        <span className="font-bold block mb-1">다른 점</span>
                        <p className="leading-relaxed opacity-95">
                          {recommendation.difference}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 액션 버튼: 유튜브 뮤직에서 검색 (새 탭) */}
              <div className="mt-8 pt-5 border-t border-current/10 flex flex-col sm:flex-row gap-3">
                <Button
                  asChild
                  size="lg"
                  className={`flex-1 rounded-xl h-12 font-bold shadow-md ${theme.accentBg} ${theme.accentText} ${theme.accentHover}`}
                >
                  <a href={searchUrl} target="_blank" rel="noopener noreferrer">
                    유튜브 뮤직에서 검색 <ExternalLink className="ml-1.5 w-4 h-4" />
                  </a>
                </Button>
                <Button
                  onClick={handleBackToInput}
                  variant="outline"
                  size="lg"
                  className={`rounded-xl h-12 font-semibold border-current/20 bg-transparent hover:bg-black/5 dark:hover:bg-white/10`}
                >
                  <RotateCcw className="mr-1.5 w-4 h-4" /> 다른 순간 고르기
                </Button>
              </div>
            </div>
          </section>

          {/* AI 안내 문구 (14px) */}
          <footer className="mt-8 text-center text-sm opacity-70">
            AI 추천이며 곡 정보가 부정확할 수 있어요
          </footer>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------
  // 화면 1: 선택 화면 (밝은 테마, 최대 폭 720px, 모바일 360px 대응)
  // -------------------------------------------------------------
  return (
    <main className="min-h-screen bg-[#faf8f5] text-[#1e1e24] py-8 px-5 sm:px-8 flex flex-col justify-between">
      <div className="w-full max-w-[720px] mx-auto flex-1 flex flex-col">
        {/* 헤더 */}
        <header className="flex items-center justify-between pb-6 border-b border-[#e5e0d8]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#222129] text-white shadow-sm">
              <Music className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold tracking-tight">지금 한 곡</span>
          </div>
          <button
            type="button"
            onClick={() => setShowKeyModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6e6875] bg-white border border-[#ded8cf] px-3 py-1.5 rounded-full hover:bg-[#f3eee7] transition"
          >
            <KeyRound className="w-3.5 h-3.5" />
            {savedApiKey ? "API 키 설정됨" : "API 키 등록"}
          </button>
        </header>

        {/* API 키 모달 */}
        {showKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-[#ded8cf]">
              <h3 className="text-lg font-bold text-[#222129]">Gemini API 키 설정</h3>
              <p className="mt-1.5 text-xs text-[#6e6875] leading-relaxed">
                Gemini API 키가 서버 환경변수(<code>GEMINI_API_KEY</code>)에 등록되지
                않은 경우, 브라우저에 임시 저장하여 바로 테스트할 수 있습니다.
              </p>
              <Input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="mt-4 h-11 text-sm border-[#ded8cf]"
              />
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowKeyModal(false)}
                  className="rounded-lg"
                >
                  닫기
                </Button>
                <Button
                  size="sm"
                  onClick={saveKey}
                  className="rounded-lg bg-[#222129] text-white hover:bg-[#383742]"
                >
                  저장하기
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 메인 폼 영역 */}
        <section className="mt-8 flex-1">
          {/* 타이틀: 32px 기준 */}
          <h1 className="text-[28px] sm:text-[32px] font-extrabold tracking-tight text-[#1f1e24] leading-snug">
            지금, 어떤 순간인가요?
          </h1>
          <p className="mt-2 text-sm text-[#6f6a76]">
            상황과 기분을 남겨주시면, 지금 듣기 좋은 첫 곡 하나를 추천해 드려요.
          </p>

          {/* 빠른 시연 버튼 (시나리오 A, B 원클릭 프리셋) */}
          <div className="mt-5 p-3.5 rounded-xl bg-white/80 border border-[#e8e2d8] flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-[#837e89] mr-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#e0674f]" /> 빠른 시연 예시:
            </span>
            <button
              type="button"
              onClick={fillDemoA}
              className="px-2.5 py-1 rounded-md bg-[#f3eee7] text-[#423d47] font-semibold hover:bg-[#e7dfd4] transition"
            >
              시나리오 A (과제 끝내고 퇴근길)
            </button>
            <button
              type="button"
              onClick={fillDemoB}
              className="px-2.5 py-1 rounded-md bg-[#f3eee7] text-[#423d47] font-semibold hover:bg-[#e7dfd4] transition"
            >
              시나리오 B (밤 산책 + 기준 곡)
            </button>
          </div>

          <form onSubmit={handleRecommend} className="mt-7 space-y-6">
            {/* 1. 상황 입력 */}
            <div className="space-y-2">
              <label htmlFor="situation" className="block text-base font-bold text-[#222129]">
                지금 어떤 상황인가요? <span className="text-[#e05238]">*</span>
              </label>
              {/* 예시 칩: 밤 산책, 쉬는 시간 */}
              <div className="flex flex-wrap gap-2 pt-1">
                {situationExamples.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => fillExample("situation", ex)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                      situation === ex
                        ? "border-[#222129] bg-[#222129] text-white"
                        : "border-[#dfd9ce] bg-white text-[#554f5c] hover:border-[#222129]"
                    }`}
                  >
                    {ex}
                  </button>
                ))}
              </div>
              <Input
                id="situation"
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="예: 과제 끝내고 집으로 걷는 중"
                className="h-12 text-base rounded-xl border-[#ded8cf] bg-white px-4 shadow-none focus-visible:border-[#222129]"
              />
            </div>

            {/* 2. 기분 입력 */}
            <div className="space-y-2">
              <label htmlFor="mood" className="block text-base font-bold text-[#222129]">
                어떤 기분인가요? <span className="text-[#e05238]">*</span>
              </label>
              {/* 예시 칩: 차분함, 산뜻함, 포근함 */}
              <div className="flex flex-wrap gap-2 pt-1">
                {moodExamples.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => fillExample("mood", ex)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                      mood === ex
                        ? "border-[#222129] bg-[#222129] text-white"
                        : "border-[#dfd9ce] bg-white text-[#554f5c] hover:border-[#222129]"
                    }`}
                  >
                    {ex}
                  </button>
                ))}
              </div>
              <Input
                id="mood"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="예: 후련한데 조금 지쳤어요"
                className="h-12 text-base rounded-xl border-[#ded8cf] bg-white px-4 shadow-none focus-visible:border-[#222129]"
              />
            </div>

            {/* 3. 떠오르는 노래가 있나요? (선택) */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="referenceSong"
                  className="block text-base font-bold text-[#222129]"
                >
                  떠오르는 노래가 있나요? <span className="text-xs font-normal text-[#75707c]">(선택)</span>
                </label>
              </div>
              <p className="text-xs text-[#75707c]">
                기준 곡을 알려주시면 닮은 점과 다른 점을 함께 분석해 드려요.
              </p>
              {/* 예시 칩: Space Song — Beach House */}
              <div className="flex flex-wrap gap-2 pt-1">
                {referenceExamples.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => fillExample("reference", ex)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                      referenceSong === ex
                        ? "border-[#222129] bg-[#222129] text-white"
                        : "border-[#dfd9ce] bg-white text-[#554f5c] hover:border-[#222129]"
                    }`}
                  >
                    {ex}
                  </button>
                ))}
              </div>
              <Input
                id="referenceSong"
                value={referenceSong}
                onChange={(e) => setReferenceSong(e.target.value)}
                placeholder="곡명 — 가수 (예: Space Song — Beach House)"
                className="h-12 text-base rounded-xl border-[#ded8cf] bg-white px-4 shadow-none focus-visible:border-[#222129]"
              />
            </div>

            {/* 에러 메시지 및 재시도 */}
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-[#fca5a5] bg-[#fff5f5] p-4 text-sm text-[#b91c1c] space-y-2"
              >
                <p className="font-semibold">{error}</p>
                <div className="flex items-center gap-3 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleRecommend()}
                    className="h-8 rounded-lg bg-[#b91c1c] text-white text-xs font-bold hover:bg-[#991b1b]"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> 다시 시도
                  </Button>
                  {isKeyError && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowKeyModal(true)}
                      className="h-8 rounded-lg text-xs font-bold border-[#b91c1c]/30 text-[#b91c1c] bg-white"
                    >
                      <KeyRound className="w-3.5 h-3.5 mr-1" /> API 키 입력하기
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* 추천 버튼: "한 곡 추천받기" (상황·기분 채우면 활성화, 로딩 시 "곡을 찾고 있어요") */}
            <Button
              type="submit"
              disabled={!canSubmit}
              size="lg"
              className="w-full h-14 rounded-2xl bg-[#222129] hover:bg-[#34323d] text-white font-bold text-base shadow-md disabled:opacity-40 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> 곡을 찾고 있어요
                </>
              ) : (
                "한 곡 추천받기"
              )}
            </Button>
          </form>
        </section>

        {/* 안내 문구: 14px (PRD 명시: "AI 추천이며 곡 정보가 부정확할 수 있어요") */}
        <footer className="mt-8 pt-4 border-t border-[#e5e0d8] text-center text-sm text-[#7a7482]">
          AI 추천이며 곡 정보가 부정확할 수 있어요
        </footer>
      </div>
    </main>
  );
}
