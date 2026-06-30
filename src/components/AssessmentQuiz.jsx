"use client";
import { useState } from "react";
import { 
  DEMENTIA_QUESTIONS, ADL_QUESTIONS, NON_DEMENTIA_EXTRA, ELIGIBILITY_OPTIONS,
  estimateLevelDementia, estimateLevelNormal 
} from "@/utils/careData";
import { supabase } from "@/lib/supabaseClient";

export default function AssessmentQuiz({ hasApplied, actualLevel, onResult }) {
  const [stage, setStage] = useState("dementia_check"); // dementia_check | qual_check | pac_info | not_eligible | quiz
  const [isDementia, setIsDementia] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const questions = isDementia 
    ? [...DEMENTIA_QUESTIONS, ...ADL_QUESTIONS] 
    : [...ADL_QUESTIONS, ...NON_DEMENTIA_EXTRA];
  const q = questions[step];

  const resetAll = () => {
    setStage("dementia_check"); setStep(0); setAnswers({});
    setDone(false); setResult(null); setIsDementia(false);
  };

  const toggleCheck = (id, val) => {
    setAnswers(prev => {
      const arr = prev[id] || [];
      if (val === "__none__") {
        return { ...prev, [id]: arr.includes("__none__") ? [] : ["__none__"] };
      }
      const withoutNone = arr.filter(v => v !== "__none__");
      return {
        ...prev,
        [id]: withoutNone.includes(val)
          ? withoutNone.filter(v => v !== val)
          : [...withoutNone, val],
      };
    });
  };

  const isAnswered = () => {
    if (!q) return false;
    if (q.type === "multicheck") return (answers[q.id] || []).length > 0;
    return answers[q.id] !== undefined;
  };

  const saveToSupabaseAndFinish = async (lvlInfo) => {
    setSubmitting(true);
    try {
      const calculated_cms_level = lvlInfo.min; 
      const taiwanTimeStr = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Taipei" }) + "+08:00";
      const finalAnswers = { ...answers, tw_time: taiwanTimeStr };

      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          has_applied_cms: hasApplied,
          calculated_cms_level,
          actual_cms_level: hasApplied ? actualLevel : null,
          answers: finalAnswers,
          is_dementia_path: isDementia,
          created_at: taiwanTimeStr
        })
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }
      
      setSubmitting(false);
      setResult(lvlInfo);
      setDone(true);
    } catch (err) {
      console.error("Save Error:", err);
      alert("系統發生未預期錯誤，請稍後再試！");
      setSubmitting(false);
    }
  };

  const next = () => {
    if (step < questions.length - 1) {
      setStep(s => s + 1);
    } else {
      const lvlInfo = isDementia 
        ? estimateLevelDementia(answers) 
        : estimateLevelNormal(answers);
      saveToSupabaseAndFinish(lvlInfo);
    }
  };

  const prev = () => {
    if (step > 0) {
      setStep(s => s - 1);
    } else {
      setStage(isDementia ? "dementia_check" : "qual_check");
      setAnswers({});
    }
  };

  if (stage === "dementia_check") {
    return (
      <div className="space-y-4">
        <div className="bg-card rounded-2xl ring-1 ring-border p-5 shadow-sm">
          <h3 className="text-xl font-bold text-foreground mb-1">第一步：確認失智症診斷</h3>
          <p className="text-base text-muted-foreground mb-4">長輩是否已有醫師開立的失智症診斷？</p>
          <div className="space-y-3">
            <button onClick={() => { setIsDementia(true); setStage("quiz"); setStep(0); }} className="w-full text-left px-5 py-4 rounded-2xl ring-1 ring-border bg-card text-foreground hover:ring-accent hover:bg-accent/12 transition-all flex gap-3 active:scale-95">
              <span className="text-2xl">🧠</span>
              <div>
                <div className="font-bold text-lg">是，已有醫師確診失智症</div>
                <div className="text-sm text-muted-foreground mt-0.5">長照 3.0 起不限年齡均可申請</div>
              </div>
            </button>
            <button onClick={() => setStage("qual_check")} className="w-full text-left px-5 py-4 rounded-2xl ring-1 ring-border bg-card text-foreground hover:ring-accent hover:bg-accent/12 transition-all flex gap-3 active:scale-95">
              <span className="text-2xl">📋</span>
              <div>
                <div className="font-bold text-lg">否，沒有失智症診斷</div>
                <div className="text-sm text-muted-foreground mt-0.5">將進行身體功能評估 (ADL / IADL)</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "qual_check") {
    return (
      <div className="space-y-4">
        <div className="bg-card rounded-2xl ring-1 ring-border p-5 shadow-sm">
          <h3 className="text-xl font-bold text-foreground mb-1">第二步：申請資格確認</h3>
          <p className="text-base text-muted-foreground mb-4">請確認長輩符合以下至少一項資格：</p>
          <div className="space-y-3">
            {ELIGIBILITY_OPTIONS.map(opt => (
              <button key={opt.id} onClick={() => { 
                setAnswers(prev => ({ ...prev, identity: opt.id }));
                setIsDementia(false); setStage("quiz"); setStep(0); 
              }} className="w-full text-left px-5 py-4 rounded-2xl ring-1 ring-border bg-card text-foreground hover:ring-accent hover:bg-accent/12 transition-all flex gap-3 items-center active:scale-95">
                <span className="text-2xl">{opt.icon}</span>
                <span className="font-bold text-lg">{opt.label}</span>
              </button>
            ))}
            <button onClick={() => setStage("pac_info")} className="w-full text-left px-5 py-4 rounded-2xl ring-1 ring-border bg-card text-foreground hover:ring-accent hover:bg-accent/12 transition-all flex gap-3 items-center active:scale-95">
              <span className="text-2xl">🏥</span>
              <div>
                <div className="font-bold text-lg">長輩目前正在住院復健中 (PAC)</div>
                <div className="text-sm text-muted-foreground mt-0.5">不限年齡・適用腦中風、骨折等</div>
              </div>
            </button>
            <button onClick={() => setStage("not_eligible")} className="w-full text-left px-5 py-4 rounded-2xl border-2 border-dashed border-border text-muted-foreground hover:bg-secondary transition-all flex gap-3 items-center active:scale-95">
              <span className="text-2xl">❓</span>
              <span className="font-bold text-lg">以上皆不符合</span>
            </button>
          </div>
          <button onClick={() => setStage("dementia_check")} className="mt-4 text-sm text-muted-foreground hover:text-foreground underline font-medium">返回上一步</button>
        </div>
      </div>
    );
  }

  if (stage === "pac_info") {
    return (
      <div className="space-y-4">
        <div className="bg-card rounded-2xl ring-1 ring-border p-6 shadow-sm space-y-4">
          <h3 className="text-xl font-bold text-foreground">健保 PAC 急性後期照護</h3>
          <p className="text-base text-muted-foreground leading-relaxed">若長輩因急性疾病正在住院進行健保 PAC 急性後期復健，出院前請主動聯繫醫院的「出院準備服務小組」。</p>
          <button onClick={() => setStage("qual_check")} className="w-full h-14 rounded-2xl bg-secondary text-foreground font-bold text-lg hover:bg-border transition-colors">返回</button>
        </div>
      </div>
    );
  }

  if (stage === "not_eligible") {
    return (
      <div className="space-y-4">
        <div className="bg-card rounded-2xl ring-1 ring-border p-6 shadow-sm space-y-4">
          <h3 className="text-xl font-bold text-foreground">目前不在長照給付對象範圍</h3>
          <p className="text-base text-muted-foreground leading-relaxed">長照補助的對象為：65歲以上長者、55歲以上原住民、領有身心障礙證明者、經醫師確診之失智症者。</p>
          <button onClick={() => setStage("qual_check")} className="w-full h-14 rounded-2xl bg-secondary text-foreground font-bold text-lg hover:bg-border transition-colors">返回</button>
        </div>
      </div>
    );
  }

  if (done) {
    const { min, max, isRange } = result;
    const labels = ["","","輕度失能","輕中度","中度失能","中重度","重度失能","重度","極重度"];
    
    if (min === 1) {
      return (
        <div className="space-y-6 text-center py-4">
          <div className="bg-card rounded-2xl ring-1 ring-border px-6 py-8 shadow-sm space-y-3">
            <span className="text-foreground text-xl font-bold block">評估結果：未達失能門檻</span>
            <p className="text-base text-muted-foreground leading-relaxed">長輩目前日常生活自理能力良好。長照服務僅提供給等級2以上之失能者。</p>
          </div>
          <button onClick={resetAll} className="h-14 px-6 rounded-2xl bg-primary text-primary-foreground font-bold text-lg w-full shadow-md active:scale-95">重新評估</button>
        </div>
      );
    }
    return (
      <div className="space-y-6 text-center py-4">
        <div>
          <p className="text-muted-foreground text-base mb-3 font-medium">評估結果（僅供參考，正式評估請洽 1966）</p>
          <div className="inline-flex flex-col items-center bg-card rounded-3xl p-8 shadow-sm ring-2 ring-primary/20">
            <span className="text-muted-foreground text-base font-bold">長照需要等級（推估）</span>
            <span className="text-7xl font-black leading-none my-3 text-primary">
              {isRange ? `${min}–${max}` : min}
            </span>
            <span className="text-lg font-bold text-primary">
              {isRange ? `${labels[min]}～${labels[max]}` : labels[min]}
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          {isDementia ? "本結果依 CDR 失智嚴重度與行為症狀雙軌評估。" : "本結果依巴氏量表加權計分與行為症狀推估。"}
        </p>
        <div className="flex gap-3 justify-center mt-2">
          <button onClick={resetAll} className="flex-1 h-14 rounded-2xl ring-1 ring-border bg-card text-foreground font-bold text-lg hover:bg-secondary transition-colors active:scale-95">重新評估</button>
          <button onClick={() => onResult(min)} className="flex-1 h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-md hover:opacity-90 transition-opacity active:scale-95">帶入補助試算 →</button>
        </div>
      </div>
    );
  }

  // Quiz active
  const total = questions.length;
  const progress = ((step + 1) / total) * 100;

  return (
    <div className="space-y-6">
      {/* 進度條 */}
      <div className="px-1">
        <div className="flex justify-between text-sm font-medium text-muted-foreground mb-2">
          <span>問題 {step + 1} / {total}</span>
          <span>{q.label}</span>
        </div>
        <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="bg-card rounded-2xl ring-1 ring-border p-6 shadow-sm">
        <h3 className="text-xl font-bold text-foreground mb-2 leading-snug">{q.label}</h3>
        <p className="text-base text-muted-foreground mb-6 leading-relaxed">{q.desc}</p>

        {q.type === "single" && (
          <div className="space-y-3">
            {q.options.map((opt, i) => {
              const sel = answers[q.id] === opt.value;
              return (
                <button key={i} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.value }))}
                  className={`w-full text-left px-5 py-4 rounded-2xl transition-all active:scale-95 ${sel ? "ring-2 ring-accent bg-accent/12 shadow-sm" : "ring-1 ring-border hover:ring-accent/50 bg-card"}`}
                >
                  <div className={`text-lg font-bold leading-snug ${sel ? "text-accent" : "text-foreground"}`}>{opt.label}</div>
                  {opt.sub && <div className={`text-sm mt-1.5 leading-relaxed ${sel ? "text-accent/80" : "text-muted-foreground"}`}>{opt.sub}</div>}
                </button>
              );
            })}
          </div>
        )}

        {q.type === "multicheck" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {q.subItems.map((item, idx) => {
                const checked = (answers[q.id] || []).includes(item);
                return (
                  <button key={idx} onClick={() => toggleCheck(q.id, item)}
                    className={`text-left text-base px-4 py-3.5 rounded-2xl transition-all active:scale-95 min-h-[56px] ${checked ? "bg-accent/12 ring-2 ring-accent text-accent font-bold shadow-sm" : "ring-1 ring-border bg-card text-foreground hover:ring-accent/50"}`}
                  >
                    <span className="inline-block w-6 font-bold">{checked ? "✓ " : ""}</span>{item}
                  </button>
                );
              })}
            </div>
            <button onClick={() => toggleCheck(q.id, "__none__")}
              className={`w-full text-base px-4 py-3.5 rounded-2xl transition-all active:scale-95 mt-2 min-h-[56px] ${
                (answers[q.id] || []).includes("__none__") ? "bg-secondary ring-2 ring-muted-foreground text-foreground font-bold shadow-sm" : "ring-1 border-dashed ring-border bg-card text-muted-foreground hover:ring-muted-foreground/50"
              }`}
            >
              <span className="inline-block w-6 font-bold">{(answers[q.id] || []).includes("__none__") ? "✓ " : ""}</span>以上皆無
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button onClick={prev} disabled={submitting} className="px-6 h-14 rounded-2xl ring-1 ring-border bg-card text-base font-bold text-foreground hover:bg-secondary transition-colors active:scale-95 disabled:opacity-50">
          ← {step === 0 ? "上一步" : "上一題"}
        </button>
        <button onClick={next} disabled={!isAnswered() || submitting}
          className={`flex-1 h-14 rounded-2xl font-bold text-lg shadow-md transition-all active:scale-95 ${isAnswered() && !submitting ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-secondary text-muted-foreground cursor-not-allowed"}`}
        >
          {submitting ? "處理中..." : (step < questions.length - 1 ? "下一題 →" : "查看評估結果")}
        </button>
      </div>
    </div>
  );
}
