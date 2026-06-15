"use client";
import { useState, useEffect } from "react";
import { 
  CARE_SUBSIDY, RESPITE_SUBSIDY, TRANSPORT_BY_REGION, IDENTITY_LABELS,
  calcSubsidy, calcTransport, canUseTransport 
} from "@/utils/careData";
import MoneyRow from "@/components/MoneyRow";

export default function SubsidyCalculator({ initLevel }) {
  const [level, setLevel] = useState(initLevel || 5);
  const [identity, setIdentity] = useState("general");
  const [region, setRegion] = useState(0);
  const [aidsType, setAidsType] = useState("traditional");
  const [hasForeign, setHasForeign] = useState(false);
  const [wantTransport, setWantTransport] = useState(false);

  useEffect(() => { 
    if (initLevel && initLevel >= 2) setLevel(initLevel); 
  }, [initLevel]);

  const careBase = CARE_SUBSIDY[level];
  const careAmt = hasForeign ? Math.round(careBase * 0.3) : careBase;
  const careData = calcSubsidy(careAmt, identity, "care");
  const respiteAmt = level <= 6 ? RESPITE_SUBSIDY.low : RESPITE_SUBSIDY.high;
  const respiteData = calcSubsidy(respiteAmt, identity, "respite");
  const transportAmt = TRANSPORT_BY_REGION[region].value;
  const transportData = calcTransport(transportAmt, identity, region);
  const aidsData = calcSubsidy(aidsType === "smart" ? 60000 : 40000, identity, "aids");
  
  const transportOk = canUseTransport(level);
  const inclTransport = transportOk && wantTransport;
  const monthlyGov = careData.gov + (inclTransport ? transportData.gov : 0);
  const monthlySelf = careData.self + (inclTransport ? transportData.self : 0);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm space-y-4">
        <div>
          <label className="text-xs font-semibold text-stone-500 block mb-2">長照需要等級</label>
          <div className="flex gap-1.5 flex-wrap">
            {[2,3,4,5,6,7,8].map(l => (
              <button key={l} onClick={() => setLevel(l)}
                className={`w-10 h-10 rounded-lg text-sm font-bold border transition ${level === l ? "bg-teal-600 text-white border-teal-600" : "bg-white text-stone-600 border-stone-200 hover:border-teal-300"}`}
              >{l}</button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="text-xs font-semibold text-stone-500 block mb-2">身分別</label>
          <div className="flex gap-2">
            {Object.entries(IDENTITY_LABELS).map(([k, v]) => (
              <button key={k} onClick={() => setIdentity(k)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${identity === k ? "bg-stone-800 text-white border-stone-800" : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"}`}
              >{v}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-stone-500 block mb-2">是否聘僱外籍看護工？</label>
          <button onClick={() => setHasForeign(v => !v)}
            className={`w-full text-left px-3 py-2.5 rounded-lg border text-xs transition ${hasForeign ? "border-teal-500 bg-teal-50 text-teal-800" : "border-stone-200 text-stone-600"}`}
          >
            <span className="font-semibold">{hasForeign ? "✓ 有聘僱外籍看護" : "沒有聘僱外籍看護"}</span>
            {hasForeign && <span className="block mt-1 leading-relaxed text-teal-600">照顧及專業服務額度以 30% 計算，且限用於專業服務。</span>}
          </button>
        </div>

        <div>
          <label className="text-xs font-semibold text-stone-500 block mb-2">居住地區（影響交通額度）</label>
          <select value={region} onChange={e => setRegion(Number(e.target.value))}
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 bg-white"
          >
            {TRANSPORT_BY_REGION.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-teal-600 text-white rounded-2xl p-4 text-center">
          <div className="text-xs opacity-75 mb-1">每月至少可申請（政府補助{inclTransport ? "・含交通" : ""}）</div>
          <div className="text-2xl font-black">${monthlyGov.toLocaleString()}</div>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center">
          <div className="text-xs text-rose-500 mb-1">每月自付額</div>
          <div className="text-2xl font-black text-rose-600">{identity === "low" ? "免費" : `$${monthlySelf.toLocaleString()}`}</div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest pl-1">四包錢明細</h3>
        
        <MoneyRow label={`① 照顧及專業服務（每月）${hasForeign ? "・外看家庭 30%" : ""}`} total={careAmt} gov={careData.gov} self={careData.self} identity={identity} />
        
        {inclTransport ? (
          <div className="space-y-2">
            <MoneyRow label="② 交通接送（每月）" total={transportData.total} gov={transportData.gov} self={transportData.self} identity={identity} />
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-stone-400">限就醫、定期復健、透析往返・須照管專員核定</p>
              <button onClick={() => setWantTransport(false)} className="text-xs text-rose-500 font-semibold hover:underline">取消</button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-teal-300 bg-teal-50/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-stone-700">② 交通接送（每月最高 ${transportData.total}）</div>
                <p className="text-xs text-stone-400 mt-0.5">第 2 級以上即可申請・限就醫/復健/透析</p>
              </div>
              <button onClick={() => setWantTransport(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-teal-400 text-teal-700 bg-white hover:bg-teal-50 transition whitespace-nowrap"
              >有接送需求？</button>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-stone-700">③ 輔具及居家無障礙改善（每 3 年）</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setAidsType("traditional")}
              className={`text-left px-3 py-2.5 rounded-lg border-2 transition ${aidsType === "traditional" ? "border-teal-500 bg-teal-50" : "border-stone-200"}`}
            >
              <div className={`text-xs font-bold ${aidsType === "traditional" ? "text-teal-800" : "text-stone-700"}`}>傳統輔具</div>
              <div className="text-xs text-stone-400 mt-0.5 leading-relaxed">47 項輔具與無障礙改善（可購買）</div>
            </button>
            <button onClick={() => setAidsType("smart")}
              className={`text-left px-3 py-2.5 rounded-lg border-2 transition ${aidsType === "smart" ? "border-teal-500 bg-teal-50" : "border-stone-200"}`}
            >
              <div className={`text-xs font-bold ${aidsType === "smart" ? "text-teal-800" : "text-stone-700"}`}>智慧組合包</div>
              <div className="text-xs text-stone-400 mt-0.5 leading-relaxed">全租賃・移位/沐浴/床邊/預防走失組合</div>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-stone-50 rounded-lg p-2"><div className="text-xs text-stone-400 mb-0.5">補助上限</div><div className="text-sm font-bold text-stone-800">${aidsData.total.toLocaleString()}</div></div>
            <div className="bg-teal-50 rounded-lg p-2"><div className="text-xs text-teal-600 mb-0.5">政府補助</div><div className="text-sm font-bold text-teal-700">${aidsData.gov.toLocaleString()}</div></div>
            <div className="bg-rose-50 rounded-lg p-2"><div className="text-xs text-rose-500 mb-0.5">自付額</div><div className="text-sm font-bold text-rose-600">{identity === "low" ? "免費" : `$${aidsData.self.toLocaleString()}`}</div></div>
          </div>
          <p className="text-xs text-stone-400 leading-relaxed">⚠ 兩組額度<b>二擇一</b>，選定後 3 年內不得變更，每滿 3 年可重新選擇。智慧組合包為租賃制，期間包含維修保養。</p>
        </div>

        <MoneyRow label={`④ 喘息服務（每年，${level <= 6 ? "2-6級" : "7-8級"}）`} total={respiteAmt} gov={respiteData.gov} self={respiteData.self} identity={identity} />
      </div>
    </div>
  );
}
