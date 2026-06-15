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

  const questions = isDementia ? DEMENTIA_QUESTIONS : [...ADL_QUESTIONS, ...NON_DEMENTIA_EXTRA];
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
      // Calculate final min level to store
      const calculated_cms_level = lvlInfo.min; 
      
      const { error } = await supabase.from('assessment_records').insert([
        {
          has_applied_cms: hasApplied,
          calculated_cms_level,
          actual_cms_level: hasApplied ? actualLevel : null,
          answers,
          is_dementia_path: isDementia
        }
      ]);
      
      if (error) console.error("Supabase Error:", error);
    } catch (err) {
      console.error("Save Error:", err);
    }
    setSubmitting(false);
    setResult(lvlInfo);
    setDone(true);
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
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
          <h3 className="text-base font-bold text-stone-800 mb-1">第一步：確認失智症診斷</h3>
          <p className="text-sm text-stone-500 mb-4">長輩是否已有醫師開立的失智症診斷？</p>
          <div className="space-y-2">
            <button onClick={() => { setIsDementia(true); setStage("quiz"); setStep(0); }} className="w-full text-left px-4 py-3 rounded-xl border border-stone-200 text-stone-700 hover:border-teal-400 hover:bg-teal-50 transition flex gap-3">
              <span className="text-xl">🧠</span>
              <div>
                <div className="font-bold">是，已有醫師確診失智症</div>
                <div className="text-xs text-stone-400 mt-0.5">長照 3.0 起不限年齡均可申請</div>
              </div>
            </button>
            <button onClick={() => setStage("qual_check")} className="w-full text-left px-4 py-3 rounded-xl border border-stone-200 text-stone-700 hover:border-teal-400 hover:bg-teal-50 transition flex gap-3">
              <span className="text-xl">📋</span>
              <div>
                <div className="font-bold">否，沒有失智症診斷</div>
                <div className="text-xs text-stone-400 mt-0.5">將進行身體功能評估 (ADL / IADL)</div>
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
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
          <h3 className="text-base font-bold text-stone-800 mb-1">第二步：申請資格確認</h3>
          <p className="text-sm text-stone-500 mb-4">請確認長輩符合以下至少一項資格：</p>
          <div className="space-y-2">
            {ELIGIBILITY_OPTIONS.map(opt => (
              <button key={opt.id} onClick={() => { setIsDementia(false); setStage("quiz"); setStep(0); }} className="w-full text-left px-4 py-3 rounded-xl border border-stone-200 text-stone-700 hover:border-teal-400 hover:bg-teal-50 transition flex gap-3 items-center">
                <span className="text-xl">{opt.icon}</span>
                <span className="font-medium">{opt.label}</span>
              </button>
            ))}
            <button onClick={() => setStage("pac_info")} className="w-full text-left px-4 py-3 rounded-xl border border-stone-200 text-stone-700 hover:border-teal-400 hover:bg-teal-50 transition flex gap-3 items-center">
              <span className="text-xl">🏥</span>
              <div>
                <div className="font-medium">長輩目前正在住院復健中 (PAC)</div>
                <div className="text-xs text-stone-400 mt-0.5">不限年齡・適用腦中風、骨折等</div>
              </div>
            </button>
            <button onClick={() => setStage("not_eligible")} className="w-full text-left px-4 py-3 rounded-xl border border-dashed border-stone-300 text-stone-500 hover:bg-stone-50 transition flex gap-3 items-center">
              <span className="text-xl">❓</span>
              <span className="font-medium">以上皆不符合</span>
            </button>
          </div>
          <button onClick={() => setStage("dementia_check")} className="mt-3 text-xs text-stone-400 hover:text-stone-600 underline">返回上一步</button>
        </div>
      </div>
    );
  }

  if (stage === "pac_info") {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-stone-800">健保 PAC 急性後期照護</h3>
          <p className="text-sm text-stone-500 leading-relaxed">若長輩因急性疾病正在住院進行健保 PAC 急性後期復健，出院前請主動聯繫醫院的「出院準備服務小組」。</p>
          <button onClick={() => setStage("qual_check")} className="w-full px-5 py-2 rounded-lg bg-stone-100 text-stone-600 font-bold hover:bg-stone-200">返回</button>
        </div>
      </div>
    );
  }

  if (stage === "not_eligible") {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-stone-800">目前不在長照給付對象範圍</h3>
          <p className="text-sm text-stone-500 leading-relaxed">長照補助的對象為：65歲以上長者、55歲以上原住民、領有身心障礙證明者、經醫師確診之失智症者。</p>
          <button onClick={() => setStage("qual_check")} className="w-full px-5 py-2 rounded-lg bg-stone-100 text-stone-600 font-bold hover:bg-stone-200">返回</button>
        </div>
      </div>
    );
  }

  if (done) {
    const { min, max, isRange } = result;
    const hasMedical = (answers.medical || []).filter(v => v !== "__none__").length > 0;
    const labels = ["","","輕度失能","輕中度","中度失能","中重度","重度失能","重度","極重度"];
    
    if (min === 1) {
      return (
        <div className="space-y-6 text-center py-4">
          <div className="bg-white border rounded-2xl px-6 py-6 shadow-sm space-y-2">
            <span className="text-stone-700 text-base font-bold block">評估結果：未達失能門檻</span>
            <p className="text-xs text-stone-500 leading-relaxed">長輩目前日常生活自理能力良好。長照服務僅提供給等級2以上之失能者。</p>
          </div>
          <button onClick={resetAll} className="px-5 py-2 rounded-lg bg-teal-600 text-white font-bold w-full">重新評估</button>
        </div>
      );
    }
    return (
      <div className="space-y-6 text-center py-4">
        <div>
          <p className="text-stone-500 text-sm mb-2">評估結果（僅供參考，正式評估請洽 1966）</p>
          <div className="inline-flex flex-col items-center bg-white border-2 rounded-2xl p-6 shadow-sm border-teal-200">
            <span className="text-stone-400 text-sm">長照需要等級（推估）</span>
            <span className="text-7xl font-black leading-none my-1 text-teal-600">
              {isRange ? `${min}–${max}` : min}
            </span>
            <span className="text-sm font-bold text-teal-600">
              {isRange ? `${labels[min]}～${labels[max]}` : labels[min]}
            </span>
          </div>
        </div>
        <p className="text-xs text-stone-400 max-w-xs mx-auto">
          {isDementia ? "本結果依 CDR 失智嚴重度與行為症狀雙軌評估。" : "本結果依巴氏量表加權計分與行為症狀推估。"}
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={resetAll} className="px-4 py-2 rounded-lg border border-stone-300 text-stone-600 font-semibold hover:bg-stone-50">重新評估</button>
          <button onClick={() => onResult(min)} className="px-5 py-2 rounded-lg bg-teal-600 text-white font-bold hover:bg-teal-700">帶入補助試算 →</button>
        </div>
      </div>
    );
  }

  // Quiz active
  const total = questions.length;
  const progress = ((step + 1) / total) * 100;

  return (
    <div className="space-y-4">
      {/* 進度條 */}
      <div>
        <div className="flex justify-between text-xs text-stone-400 mb-1">
          <span>問題 {step + 1} / {total}</span>
          <span>{q.label}</span>
        </div>
        <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
          <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
        <h3 className="text-base font-bold text-stone-800 mb-1">{q.label}</h3>
        <p className="text-sm text-stone-500 mb-4">{q.desc}</p>

        {q.type === "single" && (
          <div className="space-y-2">
            {q.options.map((opt, i) => {
              const sel = answers[q.id] === opt.value;
              return (
                <button key={i} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.value }))}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition ${sel ? "border-teal-500 bg-teal-50" : "border-stone-200 hover:border-stone-300"}`}
                >
                  <div className={`text-sm font-semibold ${sel ? "text-teal-800" : "text-stone-700"}`}>{opt.label}</div>
                  {opt.sub && <div className={`text-xs mt-1 leading-relaxed ${sel ? "text-teal-600" : "text-stone-400"}`}>{opt.sub}</div>}
                </button>
              );
            })}
          </div>
        )}

        {q.type === "multicheck" && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {q.subItems.map((item, idx) => {
                const checked = (answers[q.id] || []).includes(item);
                return (
                  <button key={idx} onClick={() => toggleCheck(q.id, item)}
                    className={`text-left text-sm px-3 py-2.5 rounded-lg border transition ${checked ? "bg-teal-50 border-teal-400 text-teal-800 font-medium" : "border-stone-200 text-stone-600 hover:border-stone-300"}`}
                  >
                    {checked ? "✓ " : ""}{item}
                  </button>
                );
              })}
            </div>
            <button onClick={() => toggleCheck(q.id, "__none__")}
              className={`w-full text-sm px-3 py-2 rounded-lg border transition ${
                (answers[q.id] || []).includes("__none__") ? "bg-stone-200 border-stone-400 text-stone-700 font-medium" : "border-dashed border-stone-300 text-stone-400 hover:border-stone-400"
              }`}
            >
              {(answers[q.id] || []).includes("__none__") ? "✓ 以上皆無" : "以上皆無"}
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={prev} disabled={submitting} className="px-5 py-3 rounded-xl border border-stone-300 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition">
          ← {step === 0 ? "上一步" : "上一題"}
        </button>
        <button onClick={next} disabled={!isAnswered() || submitting}
          className={`flex-1 py-3 rounded-xl font-semibold text-sm transition ${isAnswered() && !submitting ? "bg-teal-600 text-white hover:bg-teal-700" : "bg-stone-200 text-stone-400 cursor-not-allowed"}`}
        >
          {submitting ? "處理中..." : (step < questions.length - 1 ? "下一題 →" : "查看評估結果")}
        </button>
      </div>
    </div>
  );
}
