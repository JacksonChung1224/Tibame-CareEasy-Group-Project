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
    <main className="flex min-h-screen flex-col bg-ui-cream text-ui-ink relative">
      
      {/* 頂部品牌列 & Home 按鈕 */}
      <header className="mx-auto flex w-full max-w-md items-center gap-2 px-6 pt-7 relative z-10">
        {tab !== "start" && (
          <button onClick={goHome} className="mr-2 flex items-center justify-center p-2 rounded-full bg-ui-paper shadow-sm ring-1 ring-ui-line text-ui-muted hover:text-brand-teal-dark transition-colors active:scale-95">
            <HomeIcon className="size-6" />
          </button>
        )}
        <Link href="/" className="flex items-center gap-2 group cursor-pointer hover:opacity-80 transition-opacity">
          <img src="/careeasy-logo-mark.png" alt="Logo" className="h-10 object-contain" />
          <span className="font-bold tracking-wider text-sm text-ui-brown">照護一點通</span>
        </Link>
      </header>

      {/* 步進器 (僅在評估流程顯示) */}
      {(tab === "quiz" || tab === "calc" || tab === "table") && (
        <div className="mx-auto w-full max-w-md mt-6 px-6">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-4 left-0 w-full h-[1px] border-t border-dashed border-ui-line -z-10"></div>
            {STEPS.map((s, i) => {
              const isCompleted = (s.id === "quiz" && calcLevel !== null && tab !== "quiz") || (s.id === "calc" && tab === "table");
              const isCurrent = tab === s.id;
              const isActive = isCurrent || isCompleted;
              const stepEnabled = s.id === "quiz" ? true : calcLevel !== null;
              return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <button 
                  onClick={() => stepEnabled && setTab(s.id)}
                  disabled={!stepEnabled}
                  title={stepEnabled ? "" : "請先完成失能評估"}
                  className={`flex flex-col items-center w-full transition-opacity ${isActive ? "opacity-100" : "opacity-60"} ${stepEnabled ? "hover:opacity-80" : "cursor-not-allowed"}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1 mx-auto ${isActive ? "bg-brand-teal-dark text-white shadow-sm" : "bg-stone-200 text-stone-400"}`}>
                    {i + 1}
                  </div>
                  <span className={`text-xs font-bold ${isActive ? "text-brand-teal-dark" : "text-stone-400"}`}>{s.label.split(" ")[1]}</span>
                </button>
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

            <span className="mt-8 inline-flex items-center gap-2 rounded-full bg-ui-teal-soft px-4 py-2 text-base font-semibold text-brand-teal-dark border border-brand-teal-dark/20">
              <ShieldCheck className="size-5" aria-hidden="true" />
              長照家庭補助試算平台
            </span>

            <h1 className="mt-5 text-pretty text-3xl font-bold leading-snug text-ui-brown sm:text-4xl">
              一步步帶您算出
              <br />
              可以申請的長照補助
            </h1>

            <p className="mt-4 text-pretty text-lg leading-relaxed text-ui-muted">
              只要回答幾個簡單問題，照護一點通就幫您整理出家人可能符合的政府補助項目與金額，不用再到處查資料。
            </p>

            {/* 信賴小點 */}
            <ul className="mt-7 w-full space-y-3 text-left">
              {trustPoints.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 rounded-2xl bg-ui-paper px-4 py-3.5 shadow-sm ring-1 ring-ui-line"
                >
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-ui-teal-soft text-brand-teal-dark border border-brand-teal-dark/20">
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                  </span>
                  <span className="text-base leading-relaxed text-ui-ink">
                    {point}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-10 w-full space-y-4">
              <div className="text-center mb-4">
                <span className="inline-block bg-brand-teal-dark text-white text-sm font-bold px-3 py-1 rounded-full mb-2">開始試算</span>
                <p className="text-lg font-bold text-ui-brown">請問您是否已申請過長照補助 (CMS)？</p>
              </div>

              <button 
                onClick={() => startQuiz(true)} 
                className="group flex w-full items-center justify-between rounded-2xl bg-white text-ui-ink ring-2 ring-ui-line h-[56px] px-6 text-lg font-black shadow-sm transition-all hover:ring-brand-teal-dark active:scale-95"
              >
                <span>有申請過 CMS</span>
                <ArrowRight className="size-6 text-brand-teal-dark transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </button>
              
              <button 
                onClick={() => startQuiz(false)} 
                className="group flex w-full items-center justify-between rounded-2xl bg-brand-teal-dark text-white ring-2 ring-brand-teal-dark h-[56px] px-6 text-lg font-black shadow-sm transition-all hover:opacity-90 active:scale-95"
              >
                <span>沒有申請過</span>
                <ArrowRight className="size-6 text-white transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </button>
            </div>
            
            <p className="mt-6 text-sm leading-relaxed text-ui-muted">
              完全免費，不需要登入帳號。試算結果僅供參考，實際補助以各地長期照顧管理中心審核為準。
            </p>
          </div>
        )}

        {tab === "ask_level" && (
          <div className="w-full bg-ui-paper rounded-2xl ring-1 ring-ui-line p-6 shadow-sm text-center mt-4">
            <h3 className="text-xl font-bold text-ui-brown mb-6">請問您核定的長照需要等級是？</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {[2,3,4,5,6,7,8].map(l => (
                <button 
                  key={l} 
                  onClick={() => handleLevelSelect(l)} 
                  className="flex size-14 items-center justify-center rounded-2xl text-xl font-bold ring-1 ring-ui-line bg-white text-ui-ink hover:bg-ui-teal-soft hover:text-brand-teal-dark hover:ring-brand-teal-dark transition-colors active:scale-95"
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
