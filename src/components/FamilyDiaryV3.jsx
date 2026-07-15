/**
 * FamilyDiaryV3.jsx — CareEasy 家屬端 · 整合版
 * ─────────────────────────────────────────────────────────────
 * 本版整合任務卡：P0-2（邀請碼連動）、P1-1（快速標籤 chips）、
 *                P1-2（訊號引擎接線，移除全部 hardcode 訊號）、
 *                P1-3（Solo 預估額度 tab）
 *
 * 依賴：./signalEngine.js（放入 repo 時請調整 import 路徑，
 *       建議 src/utils/signalEngine.js → import from "@/utils/signalEngine"）
 *
 * ⚠️ 需 CMS Rules Specialist 驗證（P0-3 清單完成前不得對外展示實際金額）：
 *    WELFARE_RATE / CMS_BUDGET / BA_MAP / 外看 30% / 提前重評文案
 * ⚠️ 本檔常數與 careData.js 重複，屬原型暫態；P0-3 完成後應收斂至單一來源。
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { computeSignals, shouldSuggestReassessment } from "@/utils/signalEngine";
import { BA_MAP, CARE_SUBSIDY as CMS_BUDGET, IDENTITY_RATES } from "@/utils/careData";

const WELFARE_RATE = IDENTITY_RATES.care; // ⚠️ P0-3 第1、2項

// ── P0-2：邀請碼（先寫死常數，之後接 Supabase）─────────────
const INVITE = { code: "CARE01", institution: "台北市居家服務中心", caseId: "c1" };

// ── P1-1：快速標籤定義（與 signalEngine tagToDim 對應）──────
const DIARY_TAGS = [
  { id:"eat_less",  label:"吃得少",         dim:"nutrition" },
  { id:"choke",     label:"嗆咳",           dim:"swallow"  },
  { id:"sleep_bad", label:"睡不好",         dim:"sleep"    },
  { id:"mood_low",  label:"情緒低落",       dim:"mood"     },
  { id:"walk_weak", label:"走路沒力",       dim:"mobility" },
  { id:"pain",      label:"喊痛/不適",      dim:"pain"     },
  { id:"fall",      label:"跌倒/差點跌倒",  dim:"mobility" },
  { id:"good_day",  label:"今天狀態不錯",   dim:"positive" },
];

// ── 個案資料（solo / connected 兩態）────────────────────────
const SOLO_CASE = {
  id:"c1", nameLabel:"媽媽",
  institution:null, cmsLevel:null, welfare:null,
};
const CONNECTED_CASE = {
  id:"c1", nameLabel:"王奶奶",
  institution:"台北市居家服務中心",
  cmsLevel:4, welfare:"general", hasForeignCarer:false,
  monthlyBudget:18580, usedAmount:11245,
};

const fmtMD = (d) => `${d.getMonth()+1}/${d.getDate()}`;
const daysAgo = (n) => { const d=new Date(); d.setDate(d.getDate()-n); return d; };
const LAST_14 = Array.from({length:14}, (_,i) => fmtMD(daysAgo(i)));

// 修正原型不一致：原 AI_SIGNALS 引用 6/18 紀錄但 WORKER_LOGS 缺該筆，已補齊。
const WORKER_LOGS = {
  [fmtMD(daysAgo(0))]:{codes:["BA02","BA03","BA07"],hours:1.5,
    vitals:{bp:"146/88",temp:"36.5",pulse:"74",resp:"18"},
    obs:"協助沐浴，狀況穩定。進食時偶有輕微嗆咳。",worker:"謙師傅"},
  [fmtMD(daysAgo(5))]:{codes:["BA02","BA14"],hours:1.5,
    vitals:{bp:"142/86",temp:"36.5",pulse:"78",resp:"18"},
    obs:"陪同就醫，步態需攙扶。",worker:"謙師傅"},
  [fmtMD(daysAgo(7))]:{codes:["BA02","BA03","BA17d1"],hours:1.0,
    vitals:{bp:"138/82",temp:"36.4",pulse:"74",resp:"18"},
    obs:"血糖 112 mg/dL，腰部皮膚輕微泛紅。",worker:"謙師傅"},
  [fmtMD(daysAgo(9))]:{codes:["BA02","BA10"],hours:1.0,
    vitals:{bp:"136/80",temp:"36.4",pulse:"72",resp:"18"},
    obs:"移位過程稍顯費力。",worker:"謙師傅"},
};

// P1-1：日誌新結構 { tags:[], text:"" }（舊制字串仍相容）
const FAMILY_LOGS = {
  [fmtMD(daysAgo(0))]:{ tags:[],                       text:"今天居服員來了，媽媽狀態還好。下午有點昏昏的。" },
  [fmtMD(daysAgo(2))]:{ tags:["sleep_bad","walk_weak"],text:"夜裡不太好睡，一直叫我。白天走路有點晃。" },
  [fmtMD(daysAgo(3))]:{ tags:["choke"],                text:"今天吃東西嗆到了，咳了蠻久。" },
  [fmtMD(daysAgo(4))]:{ tags:["good_day"],             text:"精神比昨天好，有跟我說說話。" },
  [fmtMD(daysAgo(5))]:{ tags:["walk_weak"],            text:"陪媽媽去看診，醫生說血壓偏高。回來路上走很慢，腿沒力。" },
  [fmtMD(daysAgo(7))]:{ tags:["pain","choke"],         text:"腰說很酸。晚上嗆到一次。" },
};

// 舊制字串 entry → 新結構（與 signalEngine 內部一致的相容規則）
const normEntry = (e) =>
  typeof e === "string" ? { tags:[], text:e } : { tags:e?.tags ?? [], text:e?.text ?? "" };
const entryHasContent = (e) => {
  if (!e) return false;
  const n = normEntry(e);
  return n.tags.length > 0 || n.text.length > 0;
};

// ── Sub components ───────────────────────────────────────────

function DatePicker({dates, selected, workerLogs, familyLogs, onSelect, onCustomDate}) {
  const todayStr = fmtMD(daysAgo(0));
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-3 shadow-sm overflow-x-auto">
      <div className="text-xs font-bold text-stone-400 mb-2">選擇日期</div>
      <div className="flex gap-1.5 flex-nowrap min-w-max pb-1">
        {dates.map(d => {
          const hasW = !!workerLogs[d];
          const hasF = entryHasContent(familyLogs[d]); // P1-1：tags 或 text 皆算有紀錄
          const isTodayActual = d === todayStr;
          const isCustom = !LAST_14.includes(d);

          return (
            <button key={d} onClick={()=>onSelect(d)}
              className={`flex flex-col items-center px-2.5 py-1.5 rounded-xl border-2 transition min-w-[44px] ${
                selected===d ? "border-teal-500 bg-teal-50" : 
                isTodayActual ? "border-teal-200/50 bg-teal-50/30 hover:border-teal-300" : 
                "border-stone-100 hover:border-stone-200 bg-white"
              }`}>
              <span className={`text-xs font-bold ${selected===d?"text-teal-700":"text-stone-600"}`}>{d}</span>
              {(isTodayActual || isCustom) && (
                <span className="text-[10px] scale-90 text-teal-600 font-bold -mt-0.5">{isCustom ? "自選" : "今天"}</span>
              )}
              <div className={`flex gap-0.5 ${isTodayActual||isCustom ? "mt-0" : "mt-0.5"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${hasW?"bg-teal-500":"bg-stone-200"}`}/>
                <span className={`w-1.5 h-1.5 rounded-full ${hasF?"bg-rose-400":"bg-stone-200"}`}/>
              </div>
            </button>
          );
        })}
        <label className="flex flex-col items-center justify-center px-2 py-1.5 rounded-xl border-2 border-stone-100 bg-stone-50 hover:bg-stone-100 transition cursor-pointer min-w-[44px]">
          <span className="text-lg">📅</span>
          <input type="date" className="hidden" onChange={(e) => {
            if(e.target.value) onCustomDate(e.target.value);
          }} />
        </label>
      </div>
      <div className="flex gap-3 mt-2 text-xs text-stone-400">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500"/>居服員</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400"/>家屬日誌</span>
      </div>
    </div>
  );
}

function WorkerCard({log, date}) {
  const cost = log.codes.reduce((s,c)=>s+(BA_MAP[c]?.price||0),0);
  return (
    <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-mono text-teal-600">{date} · {log.worker}</div>
          <div className="text-sm font-bold text-stone-800 mt-0.5">居服員服務紀錄</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-black text-teal-700">{log.hours}h</div>
          <div className="text-xs text-stone-400">{cost} 元</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {log.codes.map(c=>(
          <span key={c} className="text-xs bg-white border border-teal-200 text-teal-700 font-mono font-bold px-2 py-0.5 rounded-md">
            {c} {BA_MAP[c]?.name} {["BA08","BA09","BA09a"].includes(c) ? "(金額以最新公告為準)" : ""}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-1.5 text-center">
        {[["血壓","bp"],["體溫","temp"],["脈搏","pulse"],["呼吸","resp"]].map(([l,k])=>(
          <div key={k} className="bg-white rounded-lg px-1.5 py-2 border border-teal-100">
            <div className="text-xs text-stone-400">{l}</div>
            <div className="text-xs font-bold text-stone-700 mt-0.5">{log.vitals[k]}</div>
          </div>
        ))}
      </div>
      {log.obs && (
        <div className="bg-white rounded-xl p-3 border border-teal-100">
          <p className="text-sm text-stone-600 leading-relaxed">「{log.obs}」</p>
        </div>
      )}
    </div>
  );
}

// P1-1：快速標籤 chips
function TagChips({selected, onToggle}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {DIARY_TAGS.map(t=>{
        const on = selected.includes(t.id);
        return (
          <button key={t.id} onClick={()=>onToggle(t.id)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 transition ${
              on ? "bg-rose-100 border-rose-400 text-rose-700"
                 : "bg-white border-stone-200 text-stone-500 hover:border-stone-300"
            }`}>
            {on ? "✓ " : ""}{t.label}
          </button>
        );
      })}
    </div>
  );
}

function DiaryEntry({date, tags, text, onToggleTag, onTextChange, onSave, saved}) {
  return (
    <div className="bg-white rounded-2xl border border-rose-200 p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-mono text-rose-500">{date} · 家屬觀察</div>
          <div className="text-sm font-bold text-stone-800 mt-0.5">今天的記錄</div>
        </div>
        <span className="text-xs text-stone-400 bg-stone-50 px-2 py-1 rounded-lg">🔒 機構看不到</span>
      </div>
      {/* P1-1：點 chips 十秒完成，文字選填 */}
      <div>
        <div className="text-xs text-stone-400 mb-1.5">今天有這些狀況嗎？（點選即可，可複選）</div>
        <TagChips selected={tags} onToggle={onToggleTag}/>
      </div>
      <textarea value={text} onChange={e=>onTextChange(e.target.value)} rows={4}
        placeholder="想多寫一點也可以（選填）——吃飯、走路、睡覺、情緒、有沒有跟平常不一樣的地方..."
        className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm leading-relaxed focus:outline-none focus:border-rose-300 resize-none"/>
      <button onClick={onSave}
        className={`w-full py-2.5 rounded-xl text-sm font-bold transition ${
          saved ? "bg-emerald-100 text-emerald-700" : "bg-rose-600 text-white hover:bg-rose-700"
        }`}>
        {saved ? "✓ 已儲存" : "儲存今日觀察"}
      </button>
    </div>
  );
}

// ── P0-2：Solo 模式 · 邀請碼連動 ─────────────────────────────
function ConnectBanner({onConnect}) {
  const [visible, setVisible] = useState(true);
  const [showInput, setShowInput] = useState(false);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  if (!visible) return null;

  const submit = () => {
    const c = code.trim().toUpperCase();
    if (c.length !== 6) { setErr("邀請碼為 6 碼，請確認後再試一次"); return; }
    setErr("");
    onConnect(c);
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3 items-start">
          <span className="text-xl shrink-0">🏢</span>
          <div className="flex-1">
            <div className="text-sm font-bold text-stone-800">已使用居家服務？</div>
            <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
              連動居服機構後，可同步看居服員紀錄、即時額度，AI 分析也會更準確。
            </p>
            {!showInput ? (
              <div className="mt-2 flex gap-2">
                <button onClick={()=>setShowInput(true)}
                  className="text-xs text-teal-600 border border-teal-300 px-3 py-1.5 rounded-lg font-bold hover:bg-teal-50 transition">
                  輸入機構邀請碼
                </button>
              </div>
            ) : (
              <div className="mt-2 space-y-1.5">
                <div className="flex gap-2">
                  <input value={code} maxLength={6}
                    onChange={e=>{setCode(e.target.value.toUpperCase()); setErr("");}}
                    onKeyDown={e=>e.key==="Enter"&&submit()}
                    placeholder="輸入機構提供的 6 碼邀請碼"
                    className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm font-mono tracking-widest focus:outline-none focus:border-teal-400"/>
                  <button onClick={submit}
                    className="px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition">
                    連動
                  </button>
                </div>
                {err && <p className="text-xs text-red-500">{err}</p>}
                <p className="text-xs text-stone-400">邀請碼由您簽約的居服機構督導提供。連動後您的日誌仍然只有您看得到。</p>
              </div>
            )}
          </div>
        </div>
        <button onClick={()=>setVisible(false)} className="text-stone-300 hover:text-stone-500 shrink-0 text-lg">✕</button>
      </div>
    </div>
  );
}

// P0-2：解除連動確認 modal
function ConfirmModal({title, desc, onCancel, onConfirm}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40">
      <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-xl space-y-3">
        <div className="text-sm font-bold text-stone-800">{title}</div>
        <p className="text-xs text-stone-500 leading-relaxed">{desc}</p>
        <div className="flex gap-2 pt-1">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-xs font-bold hover:bg-stone-50">
            取消
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700">
            確認解除
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({msg}) {
  if (!msg) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg">
      {msg}
    </div>
  );
}

// ── 額度 Panel（Connected）⚠️ P0-3 驗證中 ────────────────────
function QuotaPanel({caseData}) {
  const {cmsLevel, welfare, hasForeignCarer, monthlyBudget, usedAmount} = caseData;
  const base = CMS_BUDGET[cmsLevel] || monthlyBudget;
  const available = hasForeignCarer ? Math.round(base*0.3) : base; // ⚠️ P0-3 第3項
  const rate = WELFARE_RATE[welfare] ?? 0.16;
  const selfPayUsed = Math.round(usedAmount * rate);
  const govUsed = usedAmount - selfPayUsed;
  const remaining = available - usedAmount;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <div className="flex gap-2">
          <span className={`font-bold px-2 py-0.5 rounded-full ${
            welfare==="low"?"bg-emerald-100 text-emerald-700":
            welfare==="midlow"?"bg-teal-100 text-teal-700":"bg-stone-100 text-stone-600"
          }`}>
            {welfare==="low"?"低收入戶":welfare==="midlow"?"中低收入戶":"一般戶"}
          </span>
          <span className="text-stone-400">自付 {Math.round(rate*100)}%</span>
        </div>
        {hasForeignCarer && (
          <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
            有外籍看護 · 30%
          </span>
        )}
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-stone-500">本月可用額度</span>
          <span className="font-bold text-stone-700">{usedAmount.toLocaleString()} / {available.toLocaleString()} 元</span>
        </div>
        <div className="h-4 bg-stone-100 rounded-full overflow-hidden flex">
          <div className="bg-teal-500 h-full" style={{width:`${(govUsed/available)*100}%`}}/>
          <div className="bg-amber-400 h-full" style={{width:`${(selfPayUsed/available)*100}%`}}/>
        </div>
        <div className="flex gap-3 mt-1.5 text-xs text-stone-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-teal-500"/>政府補助</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400"/>已自付</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          {label:"核定額度", val:base, color:"stone"},
          {label:"可用額度", val:available, color:hasForeignCarer?"amber":"teal"},
          {label:"剩餘額度", val:remaining, color:remaining<2000?"red":"stone"},
          {label:"已自付",   val:selfPayUsed, color:"stone"},
        ].map(({label,val,color})=>(
          <div key={label} className={`rounded-xl p-2 border ${
            color==="red"?"bg-red-50 border-red-200":
            color==="teal"?"bg-teal-50 border-teal-200":
            color==="amber"?"bg-amber-50 border-amber-200":
            "bg-stone-50 border-stone-200"
          }`}>
            <div className={`text-sm font-black ${
              color==="red"?"text-red-600":color==="teal"?"text-teal-700":
              color==="amber"?"text-amber-700":"text-stone-700"
            }`}>{val.toLocaleString()}</div>
            <div className="text-xs text-stone-400 mt-0.5 leading-tight">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}



// ══ Main ═════════════════════════════════════════════════════
export default function FamilyDiaryV3() {
  const router = useRouter();
  // P0-2：連動狀態（dev 切換器與邀請碼流程共用同一 state）
  const [connected, setConnected] = useState(false);
  const caseData = connected ? CONNECTED_CASE : SOLO_CASE;

  // P1-1：日誌資料進 state，chips 儲存後 AI 訊號即時重算（demo 亮點）
  const [familyLogs, setFamilyLogs] = useState(FAMILY_LOGS);
  const todayStr = fmtMD(daysAgo(0));
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [customDates, setCustomDates] = useState([]);
  const initial = normEntry(FAMILY_LOGS[todayStr]);
  const [draftTags, setDraftTags] = useState(initial.tags);
  const [draftText, setDraftText] = useState(initial.text);
  const [saved, setSaved] = useState(false);

  const [activeTab, setActiveTab] = useState("diary");
  const [expandSignal, setExpandSignal] = useState(null);
  const [showMedical, setShowMedical] = useState(false);
  const [toast, setToast] = useState("");
  const [showDisconnect, setShowDisconnect] = useState(false);

  // P1-2：訊號由引擎即時計算（solo 僅家屬日誌單軌）
  const signals = computeSignals(familyLogs, connected ? WORKER_LOGS : {});
  const suggestReassess = connected && shouldSuggestReassessment(signals);
  const concordantDims = signals.filter(s=>s.conf==="concordant").map(s=>s.dim);
  const singleDims = signals.filter(s=>s.conf==="single_source").map(s=>s.dim);

  function flashToast(msg) {
    setToast(msg);
    setTimeout(()=>setToast(""), 2600);
  }

  function handleConnect(code) {
    // MVP demo：任意 6 碼即連動；正式版改為向 Supabase 驗證 INVITE.code
    setConnected(true);
    flashToast(`已與 ${INVITE.institution} 連動，您現在可以查看居服員服務紀錄`);
  }

  function handleDisconnect() {
    setConnected(false);
    setShowDisconnect(false);
    setActiveTab("diary"); // 避免停在 connected-only tab；家屬日誌資料保留
    flashToast("已解除連動。您的日誌資料完整保留。");
  }

  function handleDateSelect(d) {
    setSelectedDate(d);
    const e = normEntry(familyLogs[d]);
    setDraftTags(e.tags);
    setDraftText(e.text);
    setSaved(false);
  }

  function handleCustomDate(val) {
    const d = new Date(val);
    const md = `${d.getMonth() + 1}/${d.getDate()}`;
    if (!LAST_14.includes(md) && !customDates.includes(md)) {
      setCustomDates(prev => [md, ...prev]);
    }
    handleDateSelect(md);
  }

  function toggleTag(id) {
    setDraftTags(t => t.includes(id) ? t.filter(x=>x!==id) : [...t, id]);
    setSaved(false);
  }

  function saveDiary() {
    setFamilyLogs(logs => ({...logs, [selectedDate]: { tags:draftTags, text:draftText }}));
    setSaved(true);
  }

  const TABS_SOLO = [
    {id:"diary",   icon:"📔", label:"照護日誌"},
    {id:"signals", icon:"🔍", label:"AI 分析"},
  ];
  const TABS_CONNECTED = [
    {id:"diary",   icon:"📔", label:"日誌"},
    {id:"records", icon:"🧑‍⚕️", label:"居服紀錄"},
    {id:"signals", icon:"🔍", label:"AI 分析"},
    {id:"quota",   icon:"💰", label:"額度"},
  ];
  const TABS = connected ? TABS_CONNECTED : TABS_SOLO;
  const validTab = TABS.find(t=>t.id===activeTab) ? activeTab : "diary";

  const signalColors = {
    red:{bg:"bg-red-50",border:"border-red-200",badge:"bg-red-100 text-red-700",dot:"bg-red-500"},
    amber:{bg:"bg-amber-50",border:"border-amber-200",badge:"bg-amber-100 text-amber-700",dot:"bg-amber-500"},
  };

  return (
    <div className="min-h-screen bg-stone-100 pb-24">
      <Toast msg={toast}/>
      {showDisconnect && (
        <ConfirmModal
          title="確定要解除機構連動嗎？"
          desc="解除後將無法查看居服員紀錄與即時額度。您的照護日誌資料會完整保留，隨時可重新連動。"
          onCancel={()=>setShowDisconnect(false)}
          onConfirm={handleDisconnect}/>
      )}

      {/* Dev 模式切換器（開發用，正式版移除） */}
      <div className="bg-stone-800 px-4 py-2 flex items-center justify-between">
        <span className="text-xs text-stone-400">示範模式切換（dev）</span>
        <div className="flex bg-stone-700 rounded-lg p-0.5 gap-0.5">
          {[["solo","Solo（無機構）",false],["connected","Connected（有機構）",true]].map(([k,label,val])=>(
            <button key={k} onClick={()=>{ setConnected(val); setActiveTab("diary"); }}
              className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                connected===val ? "bg-white text-stone-800" : "text-stone-400 hover:text-white"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className={`text-white px-4 pt-8 pb-5 ${connected ? "bg-teal-700" : "bg-stone-700"}`}>
        <Link href="/" className="text-xs font-mono opacity-60 mb-1 hover:opacity-100 transition-opacity inline-block">照護一點通 · 家屬端</Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-black">{caseData.nameLabel}</h1>
            {connected ? (
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{caseData.institution}</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">CMS {caseData.cmsLevel}</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  {caseData.welfare==="low"?"低收入戶":caseData.welfare==="midlow"?"中低收入戶":"一般戶"}
                </span>
                <button onClick={()=>setShowDisconnect(true)}
                  className="text-xs underline opacity-50 hover:opacity-90 ml-1">
                  解除連動
                </button>
              </div>
            ) : (
              <div className="mt-1.5">
                <span className="text-xs bg-white/15 border border-white/20 px-2.5 py-1 rounded-full">
                  個人日誌模式 · 尚未連動機構
                </span>
              </div>
            )}
          </div>
          {connected && (
            <div className="text-right shrink-0">
              <div className="text-2xl font-black">{(caseData.monthlyBudget - caseData.usedAmount).toLocaleString()}</div>
              <div className="text-xs opacity-60">剩餘額度</div>
            </div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="flex">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)}
              className={`flex-1 py-3 text-xs font-bold transition border-b-2 ${
                validTab===t.id
                  ? "border-teal-600 text-teal-700"
                  : "border-transparent text-stone-400 hover:text-stone-600"
              }`}>
              <span className="mr-0.5">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">

        {/* ── 日誌 Tab ── */}
        {validTab === "diary" && (
          <>
            {!connected && <ConnectBanner onConnect={handleConnect}/>}

            <DatePicker 
              dates={[...customDates, ...LAST_14]} 
              selected={selectedDate} 
              workerLogs={connected ? WORKER_LOGS : {}}
              familyLogs={familyLogs}
              onSelect={handleDateSelect}
              onCustomDate={handleCustomDate}
            />

            {connected && WORKER_LOGS[selectedDate] ? (
              <WorkerCard log={WORKER_LOGS[selectedDate]} date={selectedDate} />
            ) : connected ? (
              <div className="bg-stone-50 rounded-2xl border border-dashed border-stone-200 p-5 text-center">
                <p className="text-sm text-stone-400">{selectedDate} 無居服員服務</p>
              </div>
            ) : null}

            <DiaryEntry date={selectedDate}
              tags={draftTags} text={draftText}
              onToggleTag={toggleTag}
              onTextChange={t=>{setDraftText(t);setSaved(false);}}
              onSave={saveDiary} saved={saved} />

            {/* 就醫摘要（由訊號引擎輸出組成，移除 hardcode） */}
            <div className="bg-stone-800 rounded-2xl p-4 space-y-3">
              <div className="text-white font-bold text-sm">🏥 準備看診？</div>
              <p className="text-stone-400 text-xs leading-relaxed">
                AI 把最近日誌{connected?"和居服員紀錄":""}整合成就醫摘要，直接給醫師看。
              </p>
              <button onClick={()=>setShowMedical(!showMedical)}
                className="w-full py-2.5 rounded-xl bg-teal-500 text-white text-sm font-bold hover:bg-teal-400 transition">
                產生就醫摘要 →
              </button>
              {showMedical && (
                <div className="bg-white rounded-xl p-4 space-y-3">
                  <div className="text-xs font-mono text-stone-400">AI 就醫摘要 · 近 14 天</div>
                  <div className="space-y-2 text-xs text-stone-600">
                    {signals.length === 0 ? (
                      <div className="text-stone-400">近 14 天無明顯異常訊號。</div>
                    ) : (
                      <>
                        {concordantDims.length > 0 && (
                          <div><b className="text-red-600">需優先確認：</b>{concordantDims.join("、")}（兩端一致）</div>
                        )}
                        {singleDims.length > 0 && (
                          <div><b className="text-amber-600">請醫師留意：</b>{singleDims.join("、")}</div>
                        )}
                      </>
                    )}
                    {!connected && (
                      <div className="text-stone-400 text-xs mt-1">
                        連動居服機構後，摘要可加入居服員的生命徵象數據。
                      </div>
                    )}
                  </div>
                  <button className="w-full py-2 rounded-lg border border-stone-200 text-stone-600 text-xs font-bold hover:bg-stone-50">
                    匯出 PDF
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── 居服紀錄 Tab（Connected only）── */}
        {validTab === "records" && connected && (
          <>
            <DatePicker dates={DATES} selected={selectedDate}
              workerLogs={WORKER_LOGS} familyLogs={familyLogs}
              onSelect={handleDateSelect} />
            {WORKER_LOGS[selectedDate] ? (
              <WorkerCard log={WORKER_LOGS[selectedDate]} date={selectedDate} />
            ) : (
              <div className="bg-stone-50 rounded-2xl border border-dashed border-stone-200 p-8 text-center">
                <div className="text-3xl mb-2">📋</div>
                <p className="text-sm text-stone-400">{selectedDate} 無居服員服務</p>
              </div>
            )}
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-xs text-teal-700 leading-relaxed">
              ℹ 居服員紀錄由機構督導確認後同步顯示。每筆費用已依衛福部附表四費率計算。
            </div>
          </>
        )}

        {/* ── AI 分析 Tab（訊號引擎驅動）── */}
        {validTab === "signals" && (
          <>
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
              <div className="text-sm font-bold text-stone-800 mb-1">近 14 天照護訊號分析</div>
              <p className="text-xs text-stone-500 leading-relaxed">
                {connected
                  ? "AI 交叉比對您的日誌與居服員紀錄，找出兩端都觀察到的變化（可信度較高）與單邊訊號。"
                  : "AI 從您的日誌萃取照護訊號。連動機構後可加入居服員紀錄做交叉驗證，訊號更準確。"
                }
              </p>
              {!connected && (
                <div className="mt-2 bg-stone-50 rounded-xl px-3 py-2 text-xs text-stone-500">
                  目前為單軌分析（僅家屬日誌）
                </div>
              )}
            </div>

            {connected && signals.length > 0 && (
              <div className="flex gap-3 text-xs px-1">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"/>兩端一致</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"/>單側觀察</span>
              </div>
            )}

            {signals.length === 0 && (
              <div className="bg-stone-50 rounded-2xl border border-dashed border-stone-200 p-8 text-center">
                <div className="text-3xl mb-2">🌤</div>
                <p className="text-sm text-stone-400">近 14 天沒有偵測到需要留意的訊號</p>
              </div>
            )}

            {signals.map((s,i)=>{
              const c = signalColors[s.color];
              return (
                <div key={s.dim} className={`${c.bg} border ${c.border} rounded-2xl p-4 space-y-2`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${c.dot} shrink-0`}/>
                      <span className="text-sm font-bold text-stone-800">{s.dim}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${c.badge}`}>{s.label}</span>
                  </div>
                  <p className="text-sm text-stone-600 leading-relaxed">{s.desc}</p>
                  <button onClick={()=>setExpandSignal(expandSignal===i?null:i)}
                    className="text-xs text-stone-400 underline">
                    {expandSignal===i?"收起依據 ▲":"查看依據 ▼"}
                  </button>
                  {expandSignal===i && (
                    <div className="bg-white rounded-xl p-3 border border-stone-200 text-xs text-stone-500 space-y-1">
                      <div className="font-bold text-stone-600 mb-1">原始依據：</div>
                      {s.evidence.map((ev,j)=>(
                        <div key={j}>· {ev.source==="family"?"家屬":"居服員"} {ev.date}：{ev.text}</div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {suggestReassess && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
                <div className="text-sm font-bold text-red-800">🚨 建議與專員討論提前重評</div>
                <p className="text-xs text-red-700 leading-relaxed">
                  {/* ⚠️ P0-3 第6項：文案由「依規定可申請」改為行動引導，待 Specialist 確認 */}
                  有 {concordantDims.length} 個面向出現家屬與居服員一致觀察到的退步（{concordantDims.join("、")}）。
                  若長輩狀況明顯改變，可聯繫照管專員或 A 個管討論是否提前複評（是否辦理由照管中心評估決定）。
                </p>
                <div className="flex gap-2">
                  <button onClick={() => router.push("/calculator")} className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition">
                    用試算平台先估新等級
                  </button>
                  <a href="tel:1966" className="flex-1 py-2.5 rounded-xl border border-red-300 text-red-700 text-xs font-bold hover:bg-red-100 transition text-center block">
                    聯繫個管 1966
                  </a>
                </div>
              </div>
            )}

            <p className="text-xs text-stone-400 text-center">本分析為 AI 觀察彙整，非醫療診斷。</p>
          </>
        )}

        {/* ── 額度 Tab：Connected 實際額度 ── */}
        {validTab === "quota" && connected && (
          <>
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm space-y-4">
              <div className="text-sm font-bold text-stone-800">本月補助額度（6月）</div>
              <QuotaPanel caseData={CONNECTED_CASE} />
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="bg-stone-700 text-white px-4 py-2.5 text-sm font-bold">本月服務明細</div>
              <div className="divide-y divide-stone-100">
                {Object.entries(WORKER_LOGS).map(([date,log])=>{
                  const cost = log.codes.reduce((s,c)=>s+(BA_MAP[c]?.price||0),0);
                  return (
                    <div key={date} className="px-4 py-3">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-xs font-mono text-stone-500">{date} · {log.worker}</span>
                        <span className="text-sm font-bold text-stone-700">{cost} 元</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {log.codes.map(c=>(
                          <span key={c} className="text-xs bg-teal-100 text-teal-700 font-mono px-1.5 py-0.5 rounded">{c}</span>
                        ))}
                        <span className="text-xs bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">{log.hours}h</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-4 py-3 bg-stone-50 flex justify-between text-sm font-bold border-t border-stone-100">
                <span>合計</span>
                <span>{Object.values(WORKER_LOGS).reduce((s,l)=>s+l.codes.reduce((ss,c)=>ss+(BA_MAP[c]?.price||0),0),0).toLocaleString()} 元</span>
              </div>
            </div>

            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-xs text-teal-700 leading-relaxed">
              費用依衛福部附表四（民國 114 年 6 月 19 日修正版）計算。
              實際核銷金額以機構向衛福部申報為準。
            </div>
          </>
        )}
      </div>
    </div>
  );
}
