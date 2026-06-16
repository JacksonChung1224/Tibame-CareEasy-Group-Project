"use client";
import { useState } from "react";
import AssessmentQuiz from "@/components/AssessmentQuiz";
import SubsidyCalculator from "@/components/SubsidyCalculator";
import ResultTable from "@/components/ResultTable";
import { HeartHandshake, Home as HomeIcon, ChevronRight } from "lucide-react";

const STEPS = [
  { id: "quiz", label: "1. 失能評估" },
  { id: "calc", label: "2. 補助試算" },
  { id: "table", label: "3. 總覽表" },
];

export default function Home() {
  const [tab, setTab] = useState("start"); // start, quiz, calc, table
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
    <div className="min-h-screen bg-stone-50 flex flex-col items-center py-6 px-4 relative">
      {tab !== "start" && (
        <button onClick={goHome} className="absolute top-6 left-4 p-2 text-stone-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition">
          <HomeIcon className="w-6 h-6" />
        </button>
      )}
      
      <div className="w-full max-w-md mb-6 text-center">
        <div className="inline-flex items-center justify-center gap-2 mb-2">
          <HeartHandshake className="w-10 h-10 text-teal-500" />
          <h1 className="text-3xl font-black text-stone-800 tracking-tight">Care Easy</h1>
        </div>
        <h2 className="text-xl font-bold text-stone-600 mb-1">照護一點通</h2>
        <p className="text-sm text-stone-400">長照資源整合平台與補助試算</p>
      </div>

      {(tab === "quiz" || tab === "calc" || tab === "table") && (
        <div className="w-full max-w-md flex items-center justify-between mb-6 px-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <button 
                onClick={() => setTab(s.id)}
                className={`flex flex-col items-center flex-1 transition ${tab === s.id ? "opacity-100" : "opacity-40 hover:opacity-70"}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1 ${tab === s.id ? "bg-teal-600 text-white shadow-md" : "bg-stone-200 text-stone-600"}`}>
                  {i + 1}
                </div>
                <span className={`text-xs font-bold ${tab === s.id ? "text-teal-800" : "text-stone-500"}`}>{s.label.split(" ")[1]}</span>
              </button>
              {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-stone-300 mx-1 flex-shrink-0" />}
            </div>
          ))}
        </div>
      )}

      <div className="w-full max-w-md">
        {tab === "start" && (
          <div className="space-y-4">
            <button onClick={() => startQuiz(true)} className="w-full flex flex-col items-center justify-center py-8 rounded-2xl border-2 border-teal-500 bg-teal-50 text-teal-800 hover:bg-teal-100 transition shadow-sm">
              <span className="text-xl font-bold mb-1">有申請過 CMS 補助</span>
              <span className="text-sm opacity-80">已有長照需要等級 (2-8級)</span>
            </button>
            <button onClick={() => startQuiz(false)} className="w-full flex flex-col items-center justify-center py-8 rounded-2xl border-2 border-rose-400 bg-rose-50 text-rose-700 hover:bg-rose-100 transition shadow-sm">
              <span className="text-xl font-bold mb-1">沒有申請過 CMS 補助</span>
              <span className="text-sm opacity-80">想先透過系統進行試算</span>
            </button>
          </div>
        )}

        {tab === "ask_level" && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm text-center">
            <h3 className="text-lg font-bold text-stone-800 mb-4">請問您核定的長照需要等級是？</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {[2,3,4,5,6,7,8].map(l => (
                <button key={l} onClick={() => handleLevelSelect(l)} className="w-12 h-12 rounded-xl text-lg font-bold border-2 border-stone-200 text-stone-600 hover:border-teal-500 hover:text-teal-600 transition">
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === "quiz" && <AssessmentQuiz 
          hasApplied={hasApplied} 
          actualLevel={actualLevel}
          onResult={lvl => { setCalcLevel(lvl); setTab("calc"); }} 
        />}
        {tab === "calc" && <SubsidyCalculator initLevel={calcLevel} />}
        {tab === "table" && <ResultTable />}
      </div>
    </div>
  );
}
