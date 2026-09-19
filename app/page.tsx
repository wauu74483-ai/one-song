"use client";

import { useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, Disc3, Headphones, LoaderCircle, Music2, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Palette = "nocturne" | "sunrise" | "warm";
type RecommendationMode = "moment" | "song";
type Recommendation = { songTitle: string; artist: string; shortReason: string; detailReason: string; moodLabel: string; palette: Palette; similarity?: string | null; difference?: string | null };

const situationExamples = ["밤 산책", "쉬는 시간", "집으로 가는 길"];
const moodExamples = ["차분함", "산뜻함", "포근함"];
const songExamples = ["Space Song — Beach House", "밤편지 — 아이유", "Ditto — NewJeans"];
const paletteStyles: Record<Palette, { page: string; glow: string; ink: string; soft: string; accent: string }> = {
  nocturne: { page: "from-[#101126] via-[#171833] to-[#25214a]", glow: "bg-[#a99af5]", ink: "text-[#f7f3ff]", soft: "text-[#c9c3e8]", accent: "bg-[#b8a9ff] text-[#18132d] hover:bg-[#cabfff]" },
  sunrise: { page: "from-[#fff6de] via-[#ffe6c5] to-[#ffb98d]", glow: "bg-[#ff6f61]", ink: "text-[#3f201b]", soft: "text-[#78544a]", accent: "bg-[#ef604f] text-white hover:bg-[#dc5141]" },
  warm: { page: "from-[#fffaf0] via-[#f5e5cf] to-[#d9b795]", glow: "bg-[#8b5e3c]", ink: "text-[#38261d]", soft: "text-[#765f52]", accent: "bg-[#68452f] text-white hover:bg-[#543724]" },
};

export default function Home() {
  const [mode, setMode] = useState<RecommendationMode>("moment");
  const [situation, setSituation] = useState("");
  const [mood, setMood] = useState("");
  const [referenceSong, setReferenceSong] = useState("");
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const canSubmit = mode === "moment"
    ? situation.trim().length > 0 && mood.trim().length > 0 && !loading
    : referenceSong.trim().length > 0 && !loading;
  const colors = recommendation ? paletteStyles[recommendation.palette] : paletteStyles.nocturne;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(mode === "moment" ? { situation: situation.trim(), mood: mood.trim() } : { referenceSong: referenceSong.trim() }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "추천을 가져오지 못했어요.");
      setRecommendation(body);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "잠시 후 다시 시도해주세요.");
    } finally { setLoading(false); }
  }

  function resetAll() { setRecommendation(null); setMode("moment"); setSituation(""); setMood(""); setReferenceSong(""); setError(""); }

  if (recommendation) {
    const searchUrl = `https://music.youtube.com/search?q=${encodeURIComponent(`${recommendation.songTitle} ${recommendation.artist}`)}`;
    return (
      <main className={`relative min-h-screen overflow-hidden bg-gradient-to-br ${colors.page} ${colors.ink} transition-colors duration-700`}>
        <div className={`pointer-events-none absolute -right-24 -top-20 h-96 w-96 rounded-full ${colors.glow} opacity-25 blur-[110px]`} />
        <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-7 sm:px-8 lg:px-12">
          <Header inverted={recommendation.palette === "nocturne"} />
          <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div className="relative mx-auto flex aspect-square w-full max-w-[410px] items-center justify-center">
              <div className="absolute inset-3 rounded-full border border-current/10" />
              <div className="vinyl relative flex h-[82%] w-[82%] items-center justify-center rounded-full bg-[#111118] shadow-[0_40px_80px_rgba(0,0,0,.32)]">
                <div className={`flex h-[34%] w-[34%] items-center justify-center rounded-full ${colors.glow} shadow-[inset_0_0_0_8px_rgba(255,255,255,.16)]`}><Music2 className="h-9 w-9 text-white/90" /></div>
              </div>
              <div className="absolute bottom-[7%] right-[2%] flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md">
                <div className="equalizer flex h-7 items-end gap-1" aria-hidden="true">{[18, 28, 22, 12].map((height, index) => <span key={index} className="w-1 rounded-full bg-current" style={{ height }} />)}</div>
              </div>
            </div>
            <div className="max-w-xl">
              <button onClick={() => setRecommendation(null)} className={`mb-8 inline-flex items-center gap-2 text-sm font-semibold ${colors.soft} transition hover:opacity-70`}><ArrowLeft className="h-4 w-4" /> 입력으로 돌아가기</button>
              <div className={`mb-5 inline-flex items-center gap-2 rounded-full border border-current/15 px-3 py-1.5 text-sm font-semibold ${colors.soft}`}><Sparkles className="h-4 w-4" /> {recommendation.moodLabel}</div>
              <p className={`text-sm font-semibold uppercase tracking-[0.2em] ${colors.soft}`}>지금의 첫 곡</p>
              <h1 className="mt-4 text-5xl font-bold leading-[1.05] tracking-[-0.045em] sm:text-6xl">{recommendation.songTitle}</h1>
              <p className={`mt-4 text-xl font-medium ${colors.soft}`}>{recommendation.artist}</p>
              <p className="mt-8 text-xl font-semibold leading-relaxed sm:text-2xl">{recommendation.shortReason}</p>
              <p className={`mt-3 max-w-lg text-base leading-7 ${colors.soft}`}>{recommendation.detailReason}</p>
              {referenceSong && recommendation.similarity && (
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-current/15 bg-white/8 p-4 backdrop-blur-sm"><p className={`text-xs font-bold uppercase tracking-wider ${colors.soft}`}>닮은 점</p><p className="mt-2 text-sm leading-6">{recommendation.similarity}</p></div>
                  <div className="rounded-2xl border border-current/15 bg-white/8 p-4 backdrop-blur-sm"><p className={`text-xs font-bold uppercase tracking-wider ${colors.soft}`}>다른 점</p><p className="mt-2 text-sm leading-6">{recommendation.difference}</p></div>
                </div>
              )}
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className={`h-12 rounded-full px-6 text-base font-bold ${colors.accent}`}><a href={searchUrl} target="_blank" rel="noreferrer">유튜브 뮤직에서 찾기 <ArrowUpRight /></a></Button>
                <Button onClick={resetAll} size="lg" variant="outline" className="h-12 rounded-full border-current/20 bg-transparent px-6 text-base hover:bg-white/10 hover:text-current"><RotateCcw /> 새로운 순간</Button>
              </div>
              <p className={`mt-5 text-xs leading-5 ${colors.soft}`}>AI 추천이며 곡 정보가 부정확할 수 있어요. 검색 결과에서 한 번 더 확인해주세요.</p>
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
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-7 sm:px-8 lg:px-12">
        <Header />
        <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-14">
          <div className="max-w-md">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#1d1d26]/10 bg-white/55 px-3 py-1.5 text-sm font-semibold text-[#5b5964] shadow-sm backdrop-blur"><Headphones className="h-4 w-4" /> 오늘의 첫 재생</div>
            <h1 className="text-5xl font-bold leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-7xl">지금의 마음에<br /><span className="text-[#f05e47]">한 곡</span>을 놓아드려요.</h1>
            <p className="mt-6 max-w-sm text-base leading-7 text-[#66636d]">지금 놓인 상황과 기분을 알려주세요. 오래 고르지 않아도, 첫 곡은 바로 시작될 수 있으니까요.</p>
            <div className="mt-10 hidden items-center gap-4 text-sm text-[#77737d] lg:flex"><div className="flex -space-x-2">{["#171830", "#f06a52", "#b58a62"].map((color) => <span key={color} className="h-8 w-8 rounded-full border-2 border-[#f4f0e8]" style={{ background: color }} />)}</div><span>곡의 무드에 맞춰<br />화면도 함께 변해요</span></div>
          </div>
          <form onSubmit={handleSubmit} className="rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-[0_32px_80px_rgba(59,49,38,.14)] backdrop-blur-xl sm:p-8">
            <div className="flex items-start justify-between gap-4 border-b border-[#24232d]/10 pb-6"><div><p className="text-sm font-bold text-[#f05e47]">01 — 추천 방식</p><h2 className="mt-1 text-2xl font-bold tracking-tight">어디서 시작할까요?</h2></div><Disc3 className="h-9 w-9 text-[#302e39]" /></div>
            <Tabs value={mode} onValueChange={(value) => { const nextMode = value as RecommendationMode; setMode(nextMode); setError(""); if (nextMode === "moment") setReferenceSong(""); else { setSituation(""); setMood(""); } }} className="mt-6">
              <TabsList className="grid h-12 w-full grid-cols-2 rounded-xl bg-[#eeebe4] p-1">
                <TabsTrigger value="moment" className="rounded-lg px-3 text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm"><Sparkles /> 상황과 기분</TabsTrigger>
                <TabsTrigger value="song" className="rounded-lg px-3 text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm"><Music2 /> 떠오르는 노래</TabsTrigger>
              </TabsList>
              <TabsContent value="moment" className="mt-1">
                <FieldGroup label="지금 어떤 상황인가요?" htmlFor="situation" examples={situationExamples} value={situation} onChange={setSituation} placeholder="예: 과제를 끝내고 집으로 걷는 중" />
                <FieldGroup label="어떤 기분인가요?" htmlFor="mood" examples={moodExamples} value={mood} onChange={setMood} placeholder="예: 후련한데 조금 지쳤어요" />
              </TabsContent>
              <TabsContent value="song" className="mt-7">
                <label htmlFor="reference" className="text-base font-bold">지금 떠오르는 노래</label>
                <p className="mt-1 text-sm leading-6 text-[#77727c]">한 곡을 알려주면 닮은 점과 새로운 결을 함께 찾아드려요.</p>
                <div className="mt-3 flex flex-wrap gap-2">{songExamples.map((song) => <button key={song} type="button" onClick={() => setReferenceSong(song)} className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition ${referenceSong === song ? "border-[#24232d] bg-[#24232d] text-white shadow-sm" : "border-[#ddd8cf] bg-[#faf8f3] text-[#65616a] hover:border-[#f05e47] hover:text-[#d94c38]"}`}>{song}</button>)}</div>
                <Input id="reference" value={referenceSong} onChange={(event) => setReferenceSong(event.target.value)} placeholder="곡명 — 아티스트" className="mt-3 h-12 rounded-xl border-[#dad5cc] bg-white/80 px-4 text-base shadow-none focus-visible:border-[#f05e47] focus-visible:ring-[#f05e47]/15" />
              </TabsContent>
            </Tabs>
            {error && <div role="alert" className="mt-6 rounded-xl border border-[#ef6b59]/25 bg-[#fff1ee] px-4 py-3 text-sm leading-6 text-[#9a392c]">{error} <button type="submit" className="ml-1 font-bold underline underline-offset-2">다시 시도</button></div>}
            <Button type="submit" disabled={!canSubmit} size="lg" className="mt-8 h-14 w-full rounded-2xl bg-[#24232d] text-base font-bold text-white shadow-[0_12px_30px_rgba(36,35,45,.22)] hover:bg-[#3a3845] disabled:shadow-none">{loading ? <><LoaderCircle className="animate-spin" /> 곡을 찾고 있어요</> : <><Sparkles /> {mode === "moment" ? "지금에 맞는 한 곡" : "이 곡에서 이어질 한 곡"}</>}</Button>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-[#85818a]"><Check className="h-3.5 w-3.5" /> {mode === "moment" ? "상황과 감정의 결을 읽어 추천해요" : "좋아하는 곡의 결을 새롭게 이어드려요"}</p>
          </form>
        </section>
      </div>
    </main>
  );
}

function Header({ inverted = false }: { inverted?: boolean }) {
  return <header className="flex items-center justify-between"><div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-full ${inverted ? "bg-white/12" : "bg-[#24232d] text-white"}`}><Music2 className="h-5 w-5" /></span><span className="text-lg font-extrabold tracking-[-0.03em]">지금 한 곡</span></div><span className={`text-xs font-semibold ${inverted ? "text-white/55" : "text-[#8c8790]"}`}>ONE SONG, RIGHT NOW</span></header>;
}

function FieldGroup({ label, htmlFor, examples, value, onChange, placeholder }: { label: string; htmlFor: string; examples: string[]; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <div className="mt-7"><label htmlFor={htmlFor} className="text-base font-bold">{label}</label><div className="mt-3 flex flex-wrap gap-2">{examples.map((example) => { const selected = value === example; return <button key={example} type="button" aria-pressed={selected} onClick={() => onChange(example)} className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition ${selected ? "border-[#24232d] bg-[#24232d] text-white shadow-sm" : "border-[#ddd8cf] bg-[#faf8f3] text-[#65616a] hover:border-[#f05e47] hover:text-[#d94c38]"}`}>{selected && <Check className="mr-1 inline h-3.5 w-3.5" />}{example}</button>; })}</div><Input id={htmlFor} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-3 h-12 rounded-xl border-[#dad5cc] bg-white/80 px-4 text-base shadow-none focus-visible:border-[#f05e47] focus-visible:ring-[#f05e47]/15" /></div>;
}
