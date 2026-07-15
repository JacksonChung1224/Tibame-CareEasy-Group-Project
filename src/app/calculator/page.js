"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AssessmentQuiz from "@/components/AssessmentQuiz";
import SubsidyCalculator from "@/components/SubsidyCalculator";
import ResultTable from "@/components/ResultTable";
import { HeartHandshake, Home as HomeIcon, ChevronRight, ShieldCheck, ArrowRight } from "lucide-react";

const STEPS = [
  { id: "quiz", label: "1. 失能評估" },
  { id: "calc", label: "2. 補助試算" },
  { id: "table", label: "3. 總覽表" },
];

const trustPoints = [
  '依政府公開的長照補助規則試算',
  '免註冊、免費用，幾分鐘就完成',
  '步驟簡單，字體清楚，看得懂',
];

export default function Home() {
  const [tab, setTab] = useState("start"); // start, ask_level, quiz, calc, table
  const [hasApplied, setHasApplied] = useState(null);
  const [actualLevel, setActualLevel] = useState(null);
  const [calcLevel, setCalcLevel] = useState(null);

  const goHome = () => {
    if (tab === "quiz") {
      if (window.confirm("確定要返回首頁嗎？您目前的作答進度將會遺失。")) {
        setTab("start");
      }
    } else {
      setTab("start");
    }
  };

  const startQuiz = (applied) => {
    setHasApplied(applied);
    if (!applied) {
      setTab("quiz");
    } else {
      setTab("ask_level");
    }
  };

  const handleLevelSelect = (lvl) => {
    setActualLevel(lvl);
    setTab("quiz");
  };

  return (
    <main className="flex min-h-svh flex-col bg-background text-foreground relative">
      
      {/* 頂部品牌列 & Home 按鈕 */}
      <header className="mx-auto flex w-full max-w-md items-center gap-3 px-6 pt-7 relative z-10">
        {tab !== "start" && (
          <button onClick={goHome} className="mr-2 flex items-center justify-center p-2 rounded-full bg-card shadow-sm ring-1 ring-border text-muted-foreground hover:text-primary transition-colors active:scale-95">
            <HomeIcon className="size-6" />
          </button>
        )}
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground group-hover:scale-105 transition-transform">
            <HeartHandshake className="size-6" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <p className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">照護一點通</p>
            <p className="text-sm font-medium text-muted-foreground">Care Easy</p>
          </div>
        </Link>
      </header>

      {/* 步進器 (僅在評估流程顯示) */}
      {(tab === "quiz" || tab === "calc" || tab === "table") && (
        <div className="mx-auto w-full max-w-md mt-6 px-6">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => {
              const stepEnabled = s.id === "quiz" ? true : calcLevel !== null;
              return (
              <div key={s.id} className="flex items-center flex-1">
                <button 
                  onClick={() => stepEnabled && setTab(s.id)}
                  disabled={!stepEnabled}
                  title={stepEnabled ? "" : "請先完成失能評估"}
                  className={`flex flex-col items-center flex-1 transition-opacity ${tab === s.id ? "opacity-100" : "opacity-40"} ${stepEnabled ? "hover:opacity-70" : "cursor-not-allowed"}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1 ${tab === s.id ? "bg-accent text-accent-foreground shadow-sm" : "bg-border text-muted-foreground"}`}>
                    {i + 1}
                  </div>
                  <span className={`text-xs font-bold ${tab === s.id ? "text-accent" : "text-muted-foreground"}`}>{s.label.split(" ")[1]}</span>
                </button>
                {i < STEPS.length - 1 && <ChevronRight className="size-4 text-border mx-1 flex-shrink-0" />}
              </div>
            )})}
          </div>
        </div>
      )}

      {/* 內容區塊 */}
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-6 pb-10 pt-6 text-center">
        
        {tab === "start" && (
          <div className="w-full flex flex-col items-center">
            <div className="w-full text-left mb-4">
              <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                ← 回照護一點通首頁
              </Link>
            </div>
            {/* 首圖區塊 */}
            <div className="relative w-full overflow-hidden rounded-3xl bg-secondary h-48 md:h-56 flex items-center justify-center">
              <Image
                src="/images/care-hero.png"
                alt="女兒陪伴並攙扶著年長的家人一起散步"
                width={640}
                height={480}
                priority
                className="h-full w-full object-cover object-center"
              />
            </div>

            <span className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent/12 px-4 py-2 text-base font-semibold text-accent">
              <ShieldCheck className="size-5" aria-hidden="true" />
              長照家庭補助試算平台
            </span>

            <h1 className="mt-5 text-pretty text-3xl font-bold leading-snug text-foreground sm:text-4xl">
              一步步帶您算出
              <br />
              可以申請的長照補助
            </h1>

            <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
              只要回答幾個簡單問題，照護一點通就幫您整理出家人可能符合的政府補助項目與金額，不用再到處查資料。
            </p>

            {/* 信賴小點 */}
            <ul className="mt-7 w-full space-y-3 text-left">
              {trustPoints.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 rounded-2xl bg-card px-4 py-3.5 shadow-sm ring-1 ring-border"
                >
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                  </span>
                  <span className="text-base leading-relaxed text-foreground">
                    {point}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-10 w-full space-y-4">
              <div className="text-center mb-4">
                <span className="inline-block bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-full mb-2">開始試算</span>
                <p className="text-lg font-bold text-foreground">請問您是否已申請過長照補助 (CMS)？</p>
              </div>

              <button 
                onClick={() => startQuiz(true)} 
                className="group flex w-full items-center justify-between rounded-2xl bg-primary/10 text-foreground ring-2 ring-primary/30 h-16 px-6 text-xl font-bold shadow-sm transition-all hover:bg-primary/20 active:scale-95"
              >
                <span>有申請過 CMS</span>
                <ArrowRight className="size-6 text-primary transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </button>
              
              <button 
                onClick={() => startQuiz(false)} 
                className="group flex w-full items-center justify-between rounded-2xl bg-primary/10 text-foreground ring-2 ring-primary/30 h-16 px-6 text-xl font-bold shadow-sm transition-all hover:bg-primary/20 active:scale-95"
              >
                <span>沒有申請過</span>
                <ArrowRight className="size-6 text-primary transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </button>
            </div>
            
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              完全免費，不需要登入帳號。試算結果僅供參考，實際補助以各地長期照顧管理中心審核為準。
            </p>
          </div>
        )}

        {tab === "ask_level" && (
          <div className="w-full bg-card rounded-2xl ring-1 ring-border p-6 shadow-sm text-center mt-4">
            <h3 className="text-xl font-bold text-foreground mb-6">請問您核定的長照需要等級是？</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {[2,3,4,5,6,7,8].map(l => (
                <button 
                  key={l} 
                  onClick={() => handleLevelSelect(l)} 
                  className="flex size-14 items-center justify-center rounded-2xl text-xl font-bold ring-1 ring-border bg-card text-foreground hover:bg-accent/12 hover:text-accent hover:ring-accent transition-colors active:scale-95"
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === "quiz" && (
          <div className="w-full mt-4 text-left">
             <AssessmentQuiz 
               hasApplied={hasApplied} 
               actualLevel={actualLevel}
               onResult={lvl => { setCalcLevel(lvl); setTab("calc"); }} 
             />
          </div>
        )}
        
        {tab === "calc" && (
          <div className="w-full mt-4 text-left">
            <SubsidyCalculator 
              initLevel={calcLevel} 
              onRestart={() => {
                setCalcLevel(null);
                setTab("quiz");
              }} 
            />
          </div>
        )}
        
        {tab === "table" && (
          <div className="w-full mt-4 text-left">
            <ResultTable />
          </div>
        )}
      </div>
    </main>
  );
}
