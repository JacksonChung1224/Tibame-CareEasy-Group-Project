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
    <div className="space-y-6">
      <div className="bg-card rounded-2xl ring-1 ring-border p-5 shadow-sm space-y-5">
        <div>
          <label className="text-sm font-bold text-muted-foreground block mb-2">長照需要等級</label>
          <div className="flex gap-2 flex-wrap">
            {[2,3,4,5,6,7,8].map(l => (
              <button key={l} onClick={() => setLevel(l)}
                className={`w-12 h-12 rounded-xl text-lg font-bold ring-1 transition-all active:scale-95 ${level === l ? "bg-primary text-primary-foreground ring-primary shadow-sm" : "bg-card text-foreground ring-border hover:ring-primary/50"}`}
              >{l}</button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="text-sm font-bold text-muted-foreground block mb-2">身分別</label>
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            {Object.entries(IDENTITY_LABELS).map(([k, v]) => (
              <button key={k} onClick={() => setIdentity(k)}
                className={`flex-1 py-3 px-2 rounded-xl text-sm font-bold ring-1 transition-all active:scale-95 ${identity === k ? "bg-foreground text-background ring-foreground shadow-sm" : "bg-card text-foreground ring-border hover:ring-foreground/50"}`}
              >{v}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-muted-foreground block mb-2">是否聘僱外籍看護工？</label>
          <button onClick={() => setHasForeign(v => !v)}
            className={`w-full text-left px-4 py-3 rounded-xl ring-1 transition-all active:scale-95 min-h-[56px] ${hasForeign ? "ring-2 ring-accent bg-accent/12 text-accent shadow-sm" : "ring-border bg-card text-foreground hover:ring-accent/50"}`}
          >
            <span className="font-bold text-base">{hasForeign ? "✓ 有聘僱外籍看護" : "沒有聘僱外籍看護"}</span>
            {hasForeign && <span className="block mt-1 text-sm leading-relaxed text-accent/80">照顧及專業服務額度以 30% 計算，且限用於專業服務。</span>}
          </button>
        </div>

        <div>
          <label className="text-sm font-bold text-muted-foreground block mb-2">居住地區（影響交通額度）</label>
          <select value={region} onChange={e => setRegion(Number(e.target.value))}
            className="w-full ring-1 ring-border rounded-xl px-4 h-14 text-base font-medium text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          >
            {TRANSPORT_BY_REGION.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-primary text-primary-foreground rounded-2xl p-5 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="text-sm opacity-90 mb-1 font-medium">每月政府補助{inclTransport ? " (含交通)" : ""}</div>
          <div className="text-3xl font-black">${monthlyGov.toLocaleString()}</div>
        </div>
        <div className="bg-secondary rounded-2xl p-5 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="text-sm text-muted-foreground mb-1 font-medium">每月自付額</div>
          <div className="text-3xl font-black text-foreground">{identity === "low" ? "免費" : `$${monthlySelf.toLocaleString()}`}</div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest pl-1 border-b border-border pb-2">四包錢明細</h3>
        
        <MoneyRow label={`① 照顧及專業服務（每月）${hasForeign ? "・外看家庭 30%" : ""}`} total={careAmt} gov={careData.gov} self={careData.self} identity={identity} />
        
        {inclTransport ? (
          <div className="space-y-2">
            <MoneyRow label="② 交通接送（每月）" total={transportData.total} gov={transportData.gov} self={transportData.self} identity={identity} />
            <div className="flex items-center justify-between px-1">
              <p className="text-sm text-muted-foreground leading-relaxed">限就醫、定期復健、透析往返・須照管專員核定</p>
              <button onClick={() => setWantTransport(false)} className="text-sm text-foreground font-bold hover:underline px-2 py-1">取消</button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-accent bg-accent/5 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-base font-bold text-foreground">② 交通接送（每月最高 ${transportData.total}）</div>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">第 2 級以上即可申請・限就醫/復健/透析</p>
              </div>
              <button onClick={() => setWantTransport(true)}
                className="h-12 px-5 rounded-xl font-bold ring-1 ring-accent text-accent bg-card hover:bg-accent/12 transition-colors whitespace-nowrap active:scale-95"
              >新增接送需求</button>
            </div>
          </div>
        )}

        <div className="rounded-2xl ring-1 ring-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-foreground">③ 輔具及居家無障礙改善（每 3 年）</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={() => setAidsType("traditional")}
              className={`text-left px-4 py-3 rounded-xl ring-1 transition-all active:scale-95 min-h-[56px] ${aidsType === "traditional" ? "ring-2 ring-primary bg-primary/5 shadow-sm" : "ring-border bg-card hover:ring-primary/50"}`}
            >
              <div className={`text-base font-bold ${aidsType === "traditional" ? "text-primary" : "text-foreground"}`}>傳統輔具</div>
              <div className="text-sm text-muted-foreground mt-1 leading-relaxed">47 項輔具與無障礙改善（可購買）</div>
            </button>
            <button onClick={() => setAidsType("smart")}
              className={`text-left px-4 py-3 rounded-xl ring-1 transition-all active:scale-95 min-h-[56px] ${aidsType === "smart" ? "ring-2 ring-primary bg-primary/5 shadow-sm" : "ring-border bg-card hover:ring-primary/50"}`}
            >
              <div className={`text-base font-bold ${aidsType === "smart" ? "text-primary" : "text-foreground"}`}>智慧組合包</div>
              <div className="text-sm text-muted-foreground mt-1 leading-relaxed">全租賃・防走失/跌倒感測組合</div>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center mt-2">
            <div className="bg-secondary/50 rounded-xl p-3"><div className="text-xs text-muted-foreground mb-1 font-medium">補助上限</div><div className="text-base font-bold text-foreground">${aidsData.total.toLocaleString()}</div></div>
            <div className="bg-primary/10 rounded-xl p-3"><div className="text-xs text-primary mb-1 font-medium">政府補助</div><div className="text-base font-bold text-primary">${aidsData.gov.toLocaleString()}</div></div>
            <div className="bg-secondary rounded-xl p-3"><div className="text-xs text-muted-foreground mb-1 font-medium">自付額</div><div className="text-base font-bold text-foreground">{identity === "low" ? "免費" : `$${aidsData.self.toLocaleString()}`}</div></div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">⚠ 兩組額度<b>二擇一</b>，選定後 3 年內不得變更。智慧組合包為租賃制，期間包含維修保養。</p>
        </div>

        <MoneyRow label={`④ 喘息服務（每年，${level <= 6 ? "2-6級" : "7-8級"}）`} total={respiteAmt} gov={respiteData.gov} self={respiteData.self} identity={identity} />
      </div>
    </div>
  );
}
