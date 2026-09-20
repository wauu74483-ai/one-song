"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, Headphones, KeyRound, LoaderCircle, Music2, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Palette = "nocturne" | "sunrise" | "warm";
type RecommendationMode = "moment" | "song";
type Recommendation = { songTitle: string; artist: string; shortReason: string; detailReason: string; theme: Palette; themeLabel: string; similarity?: string | null; difference?: string | null };

const situationExamples = ["밤 산책", "쉬는 시간", "집으로 가는 길"];
const moodExamples = ["차분함", "산뜻함", "포근함"];
const songExamples = ["Space Song — Beach House", "밤편지 — 아이유", "Ditto — NewJeans"];
const themes: Record<Palette, { page: string; glow: string; ink: string; soft: string; accent: string }> = {
  nocturne: { page: "from-[#101126] via-[#171833] to-[#25214a]", glow: "bg-[#a99af5]", ink: "text-[#f7f3ff]", soft: "text-[#c9c3e8]", accent: "bg-[#b8a9ff] text-[#18132d] hover:bg-[#cabfff]" },
  sunrise: { page: "from-[#fff6de] via-[#ffe6c5] to-[#ffb98d]", glow: "bg-[#ff6f61]", ink: "text-[#3f201b]", soft: "text-[#78544a]", accent: "bg-[#ef604f] text-white hover:bg-[#dc5141]" },
  warm: { page: "from-[#fffaf0] via-[#f5e5cf] to-[#d9b795]", glow: "bg-[#8b5e3c]", ink: "text-[#38261d]", soft: "text-[#765f52]", accent: "bg-[#68452f] text-white hover:bg-[#543724]" },
};

export default function Home() {
  const [situation, setSituation] = useState("");
  const [mood, setMood] = useState("");
  const [referenceSong, setReferenceSong] = useState("");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingMode, setLoadingMode] = useState<RecommendationMode | null>(null);
  const [error, setError] = useState("");
  const [errorMode, setErrorMode] = useState<RecommendationMode | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [savedApiKey, setSavedApiKey] = useState("");

  useEffect(() => {
    const key = localStorage.getItem("user_gemini_api_key") || "";
    setSavedApiKey(key);
    setApiKeyInput(key);
  }, []);

  function saveKey() {
    const key = apiKeyInput.trim();
    localStorage.setItem("user_gemini_api_key", key);
    setSavedApiKey(key);
    setShowKeyModal(false);
  }

  async function recommend(event: React.FormEvent<HTMLFormElement>, mode: RecommendationMode) {
    event.preventDefault();
    const valid = mode === "moment" ? Boolean(situation.trim() && mood.trim()) : Boolean(referenceSong.trim());
    if (!valid || loadingMode) return;
    setLoadingMode(mode);
    setError("");
    setErrorMode(null);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (savedApiKey) headers["x-gemini-api-key"] = savedApiKey;
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers,
        body: JSON.stringify(mode === "moment" ? { situation: situation.trim(), mood: mood.trim() } : { referenceSong: referenceSong.trim() }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "추천을 가져오지 못했어요.");
      if (!Array.isArray(body.recommendations) || body.recommendations.length < 2) throw new Error("추천 결과를 확인하지 못했어요.");
      setRecommendations(body.recommendations);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "잠시 후 다시 시도해주세요.");
      setErrorMode(mode);
    } finally {
      setLoadingMode(null);
    }
  }

  function resetAll() {
    setRecommendations([]);
    setSituation("");
    setMood("");
    setReferenceSong("");
    setError("");
    setErrorMode(null);
  }

  if (recommendations.length > 0) {
    const theme = themes[recommendations[0].theme] || themes.nocturne;
    return (
      <main className={`relative min-h-screen overflow-hidden bg-gradient-to-br ${theme.page} ${theme.ink}`}>
        <div className={`pointer-events-none absolute -right-24 -top-20 h-96 w-96 rounded-full ${theme.glow} opacity-25 blur-[110px]`} />
        <div className="relative mx-auto w-full max-w-6xl px-5 py-7 sm:px-8 lg:px-12">
          <Header inverted={recommendations[0].theme === "nocturne"} />
          <section className="grid gap-10 py-10 lg:grid-cols-[0.62fr_1.38fr] lg:items-start lg:gap-14 lg:py-14">
            <div className="lg:sticky lg:top-10">
              <button onClick={() => setRecommendations([])} className={`mb-8 inline-flex items-center gap-2 text-sm font-semibold ${theme.soft} transition hover:opacity-70`}><ArrowLeft className="h-4 w-4" /> 입력으로 돌아가기</button>
              <div className="relative mx-auto flex aspect-square w-full max-w-[320px] items-center justify-center lg:mx-0">
                <div className="absolute inset-3 rounded-full border border-current/10" />
                <div className="vinyl relative flex h-[82%] w-[82%] items-center justify-center rounded-full bg-[#111118] shadow-[0_40px_80px_rgba(0,0,0,.32)]"><div className={`flex h-[34%] w-[34%] items-center justify-center rounded-full ${theme.glow} shadow-[inset_0_0_0_8px_rgba(255,255,255,.16)]`}><Music2 className="h-9 w-9 text-white/90" /></div></div>
              </div>
              <p className={`mt-8 text-sm font-semibold uppercase tracking-[0.2em] ${theme.soft}`}>지금의 세 곡</p>
              <h1 className="mt-3 text-4xl font-bold leading-tight tracking-[-0.04em] sm:text-5xl">첫 곡부터<br />여운까지.</h1>
              <p className={`mt-4 max-w-sm text-base leading-7 ${theme.soft}`}>비슷하기만 한 곡 대신, 지금의 분위기를 자연스럽게 이어갈 세 가지 결을 골랐어요.</p>
            </div>
            <div className="space-y-4">
              {recommendations.map((song, index) => {
                const songTheme = themes[song.theme] || themes.nocturne;
                const searchUrl = `https://music.youtube.com/search?q=${encodeURIComponent(`${song.songTitle} ${song.artist}`)}`;
                return <article key={`${song.songTitle}-${song.artist}`} className="rounded-[1.75rem] border border-current/15 bg-white/10 p-5 shadow-[0_18px_50px_rgba(0,0,0,.12)] backdrop-blur-md sm:p-7">
                  <div className="flex items-start gap-4"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${songTheme.glow} text-sm font-black text-white`}>0{index + 1}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border border-current/15 px-2.5 py-1 text-xs font-bold ${theme.soft}`}>{song.themeLabel}</span>{index === 0 && <span className="text-xs font-bold uppercase tracking-wider">첫 재생 추천</span>}</div><h2 className="mt-3 text-2xl font-bold tracking-[-0.035em] sm:text-3xl">{song.songTitle}</h2><p className={`mt-1 text-base font-semibold ${theme.soft}`}>{song.artist}</p></div></div>
                  <p className="mt-5 text-lg font-semibold leading-7">{song.shortReason}</p><p className={`mt-2 text-sm leading-6 ${theme.soft}`}>{song.detailReason}</p>
                  {referenceSong && song.similarity && <div className="mt-4 grid gap-2 sm:grid-cols-2"><p className="rounded-xl border border-current/10 bg-black/5 p-3 text-sm leading-6"><strong>닮은 점</strong><br />{song.similarity}</p><p className="rounded-xl border border-current/10 bg-black/5 p-3 text-sm leading-6"><strong>새로운 점</strong><br />{song.difference}</p></div>}
                  <Button asChild size="sm" className={`mt-5 rounded-full px-5 font-bold ${songTheme.accent}`}><a href={searchUrl} target="_blank" rel="noreferrer">유튜브 뮤직에서 찾기 <ArrowUpRight /></a></Button>
                </article>;
              })}
              <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between"><Button onClick={resetAll} size="lg" variant="outline" className="h-12 rounded-full border-current/20 bg-transparent px-6 text-base hover:bg-white/10 hover:text-current"><RotateCcw /> 새로운 추천</Button><p className={`text-xs ${theme.soft}`}>AI 추천은 검색 결과에서 한 번 더 확인해주세요.</p></div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4f0e8] text-[#1d1d26]">
      <div className="paper-grid pointer-events-none absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute -left-24 top-32 h-72 w-72 rounded-full bg-[#ff8a6d]/25 blur-[100px]" />
      <div className="relative mx-auto w-full max-w-6xl px-5 py-7 sm:px-8 lg:px-12">
        <Header onKeyClick={() => setShowKeyModal(true)} hasKey={Boolean(savedApiKey)} />
        <section className="grid gap-10 py-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:gap-14 lg:py-14">
          <div className="max-w-md lg:sticky lg:top-10"><div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#1d1d26]/10 bg-white/55 px-3 py-1.5 text-sm font-semibold text-[#5b5964] shadow-sm backdrop-blur"><Headphones className="h-4 w-4" /> 오늘의 첫 재생</div><h1 className="text-5xl font-bold leading-[1.02] tracking-[-0.055em] sm:text-6xl">지금의 마음에<br /><span className="text-[#f05e47]">세 곡</span>을 놓아드려요.</h1><p className="mt-6 max-w-sm text-base leading-7 text-[#66636d]">지금의 상황과 기분을 말해도 좋고, 머릿속에 떠오른 노래 한 곡에서 시작해도 좋아요.</p></div>
          <div className="space-y-5">
            <form onSubmit={(event) => recommend(event, "moment")} className="rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-[0_28px_70px_rgba(59,49,38,.13)] backdrop-blur-xl sm:p-8">
              <div className="flex items-start justify-between gap-4 border-b border-[#24232d]/10 pb-5"><div><p className="text-sm font-bold text-[#f05e47]">상황과 기분으로</p><h2 className="mt-1 text-2xl font-bold tracking-tight">지금 어떤 순간인가요?</h2></div><Sparkles className="h-8 w-8 text-[#f05e47]" /></div>
              <FieldGroup label="지금 어떤 상황인가요?" id="situation" examples={situationExamples} value={situation} onChange={setSituation} placeholder="예: 과제를 끝내고 집으로 걷는 중" />
              <FieldGroup label="어떤 기분인가요?" id="mood" examples={moodExamples} value={mood} onChange={setMood} placeholder="예: 후련한데 조금 지쳤어요" />
              {errorMode === "moment" && <ErrorMessage message={error} />}
              <Button type="submit" disabled={!situation.trim() || !mood.trim() || Boolean(loadingMode)} size="lg" className="mt-7 h-14 w-full rounded-2xl bg-[#24232d] text-base font-bold text-white hover:bg-[#3a3845]">{loadingMode === "moment" ? <><LoaderCircle className="animate-spin" /> 세 곡을 찾고 있어요</> : <><Sparkles /> 지금에 맞는 세 곡</>}</Button>
            </form>

            <form onSubmit={(event) => recommend(event, "song")} className="rounded-[2rem] border border-[#343342] bg-[#24232d] p-5 text-white shadow-[0_28px_70px_rgba(36,35,45,.2)] sm:p-8">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5"><div><p className="text-sm font-bold text-[#ff8a72]">노래 한 곡에서</p><h2 className="mt-1 text-2xl font-bold tracking-tight">떠오르는 노래가 있나요?</h2></div><Music2 className="h-8 w-8 text-[#ff8a72]" /></div>
              <p className="mt-5 text-sm leading-6 text-white/65">곡명과 아티스트를 알려주면 닮은 점은 이어가고, 새로운 결을 더한 세 곡을 찾아드려요.</p>
              <div className="mt-4 flex flex-wrap gap-2">{songExamples.map((song) => <button key={song} type="button" onClick={() => setReferenceSong(song)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${referenceSong === song ? "border-[#ff8a72] bg-[#ff8a72] text-[#241c1b]" : "border-white/15 bg-white/5 text-white/70 hover:border-white/35"}`}>{song}</button>)}</div>
              <label htmlFor="referenceSong" className="sr-only">떠오르는 노래</label><Input id="referenceSong" value={referenceSong} onChange={(event) => setReferenceSong(event.target.value)} placeholder="곡명 — 아티스트" className="mt-3 h-12 rounded-xl border-white/15 bg-white/10 px-4 text-base text-white placeholder:text-white/35 focus-visible:border-[#ff8a72] focus-visible:ring-[#ff8a72]/20" />
              {errorMode === "song" && <ErrorMessage message={error} dark />}
              <Button type="submit" disabled={!referenceSong.trim() || Boolean(loadingMode)} size="lg" className="mt-6 h-14 w-full rounded-2xl bg-[#ff8068] text-base font-bold text-[#2c1b18] hover:bg-[#ff927d]">{loadingMode === "song" ? <><LoaderCircle className="animate-spin" /> 세 곡을 찾고 있어요</> : <><Music2 /> 이 곡에서 이어질 세 곡</>}</Button>
            </form>
          </div>
        </section>
      </div>
      {showKeyModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"><div className="w-full max-w-md rounded-2xl border border-[#ded8cf] bg-white p-6 shadow-2xl"><h3 className="text-lg font-bold">Gemini API 키 설정</h3><p className="mt-2 text-sm leading-6 text-[#6e6875]">선택 사항입니다. 키가 없어도 기본 추천은 정상 작동합니다.</p><Input type="password" value={apiKeyInput} onChange={(event) => setApiKeyInput(event.target.value)} placeholder="AIzaSy..." className="mt-4 h-11" /><div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => setShowKeyModal(false)}>닫기</Button><Button onClick={saveKey} className="bg-[#24232d] text-white hover:bg-[#3a3845]">저장하기</Button></div></div></div>}
    </main>
  );
}

function Header({ inverted = false, onKeyClick, hasKey = false }: { inverted?: boolean; onKeyClick?: () => void; hasKey?: boolean }) {
  return <header className="flex items-center justify-between"><div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-full ${inverted ? "bg-white/12" : "bg-[#24232d] text-white"}`}><Music2 className="h-5 w-5" /></span><span className="text-lg font-extrabold tracking-[-0.03em]">지금 한 곡</span></div>{onKeyClick ? <button onClick={onKeyClick} className="inline-flex items-center gap-1.5 rounded-full border border-[#ded8cf] bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#6e6875]"><KeyRound className="h-3.5 w-3.5" />{hasKey ? "API 키 설정됨" : "API 키 설정"}</button> : <span className={`text-xs font-semibold ${inverted ? "text-white/55" : "text-[#8c8790]"}`}>THREE SONGS, RIGHT NOW</span>}</header>;
}

function FieldGroup({ label, id, examples, value, onChange, placeholder }: { label: string; id: string; examples: string[]; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <div className="mt-6"><label htmlFor={id} className="text-base font-bold">{label}</label><div className="mt-3 flex flex-wrap gap-2">{examples.map((example) => <button key={example} type="button" aria-pressed={value === example} onClick={() => onChange(example)} className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition ${value === example ? "border-[#24232d] bg-[#24232d] text-white" : "border-[#ddd8cf] bg-[#faf8f3] text-[#65616a] hover:border-[#f05e47]"}`}>{value === example && <Check className="mr-1 inline h-3.5 w-3.5" />}{example}</button>)}</div><Input id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-3 h-12 rounded-xl border-[#dad5cc] bg-white/80 px-4 text-base focus-visible:border-[#f05e47] focus-visible:ring-[#f05e47]/15" /></div>;
}

function ErrorMessage({ message, dark = false }: { message: string; dark?: boolean }) {
  return <div role="alert" className={`mt-5 rounded-xl border px-4 py-3 text-sm ${dark ? "border-red-300/25 bg-red-400/10 text-red-100" : "border-red-200 bg-red-50 text-red-700"}`}>{message}</div>;
}
