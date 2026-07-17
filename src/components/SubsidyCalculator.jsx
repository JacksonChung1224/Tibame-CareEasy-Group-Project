"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CARE_SUBSIDY, RESPITE_SUBSIDY, TRANSPORT_BY_REGION, IDENTITY_LABELS,
  calcSubsidy, calcTransport, canUseTransport
} from "@/utils/careData";
import { PACKAGE_DETAILS, PLATFORM_DISCLAIMER } from "@/utils/partnerData";
import MoneyRow from "@/components/MoneyRow";
import ExpandablePackage from "@/components/ExpandablePackage";
import PartnerServiceCard from "@/components/PartnerServiceCard";

// 明細展開區的共用內文：服務項目 + 3.0 新制重點 + 來源
function PackageBody({ detail }) {
  return (
    <>
      {detail.levelNote && (
        <p className="text-sm text-foreground/80 leading-relaxed mb-3">{detail.levelNote}</p>
      )}
      <div className="text-xs font-bold text-muted-foreground mb-1.5">服務項目</div>
      <ul className="space-y-1.5">
        {detail.items.map((it, i) => (
          <li key={i} className="text-sm text-foreground/80 leading-relaxed flex gap-2">
            <span className="text-accent shrink-0" aria-hidden="true">・</span>
            <span><span className="font-bold text-foreground">{it.name}</span>：{it.desc}</span>
          </li>
        ))}
      </ul>
      {detail.highlights?.length > 0 && (
        <div className="mt-3 rounded-xl bg-primary/5 ring-1 ring-primary/15 p-3 space-y-1.5">
          {detail.highlights.map((h, i) => (
            <p key={i} className="text-sm text-primary leading-relaxed flex gap-1.5">
              <span aria-hidden="true">✦</span><span>{h}</span>
            </p>
          ))}
        </div>
      )}
      {detail.source && (
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{detail.source}</p>
      )}
    </>
  );
}

export default function SubsidyCalculator({ initLevel, onRestart }) {
  const router = useRouter();
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [level, setLevel] = useState(initLevel || 5);
  const [identity, setIdentity] = useState("general");
  const [region, setRegion] = useState(0);
  const [aidsType, setAidsType] = useState("traditional");
  const [hasForeign, setHasForeign] = useState(false);
  const [wantTransport, setWantTransport] = useState(false);

  if (initLevel === null) {
    return (
      <div className="bg-card rounded-2xl ring-1 ring-border p-8 shadow-sm flex flex-col items-center text-center mt-4">
        <div className="text-lg font-bold text-foreground mb-2">請先完成失能評估</div>
        <button onClick={onRestart} className="mt-4 h-12 px-6 rounded-xl font-bold text-primary-foreground bg-primary hover:opacity-90 transition-opacity">
          返回失能評估
        </button>
      </div>
    );
  }

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

  // 傳給點擊追蹤的共用上下文
  const ctx = { cmsLevel: level, identity };

  return (
    <div className="space-y-6">
      {/* ── 輸入區（維持原樣）────────────────────────────── */}
      <div className="bg-card rounded-2xl ring-1 ring-border p-5 shadow-sm space-y-5">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-bold text-muted-foreground">長照需要等級</label>
            <button onClick={onRestart} className="text-sm font-bold text-primary hover:underline">
              重新評估
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground text-xl font-bold px-4 py-2 rounded-xl">
              CMS {level} 級
            </div>
            <div className="text-sm text-muted-foreground font-medium">
              依您的評估結果帶入
            </div>
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
          <div className="text-xs text-muted-foreground mt-2">實際身分類別以照管中心核定為準</div>
        </div>

        <div>
          <label className="text-sm font-bold text-muted-foreground block mb-2">是否聘僱外籍看護工？</label>
          <button onClick={() => setHasForeign(v => !v)}
            className={`w-full text-left px-4 py-3 rounded-xl ring-1 transition-all active:scale-95 min-h-[56px] ${hasForeign ? "ring-2 ring-accent bg-accent/12 text-accent shadow-sm" : "ring-border bg-card text-foreground hover:ring-accent/50"}`}
          >
            <span className="font-bold text-base">{hasForeign ? "✓ 有聘僱外籍看護" : "沒有聘僱外籍看護"}</span>
            {hasForeign && <span className="block mt-1 text-sm leading-relaxed text-accent/80">長照 3.0 起，本包額度以 30% 計算，可用於日間照顧中心、家庭托顧或專業服務。<br/>外看請假返國或空窗期間，出具證明可暫依一般額度使用服務。</span>}
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

      {/* ── 每月補助摘要（維持原樣）──────────────────────── */}
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

      {/* ── 照護日誌 CTA ──────────────────────────────────── */}
      <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 hover:border-rose-400 transition-colors cursor-pointer" onClick={() => setShowDiaryModal(true)}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">📓</span>
          <div className="flex-1">
            <div className="text-sm font-bold text-rose-900">📓 試算之後，下一步是每天的照顧</div>
            <p className="text-xs text-rose-700/80 mt-0.5 leading-relaxed">
              照護日誌：每天 10 秒記錄長輩狀況，AI 幫您留意變化。
            </p>
          </div>
          <span className="text-rose-400 text-lg">›</span>
        </div>
      </div>

      {showDiaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="p-6 space-y-4">
              <h3 className="text-xl font-bold text-slate-800 border-b pb-3">照護日誌能幫您做什麼？</h3>
              <ul className="space-y-3">
                <li className="flex gap-3 text-sm text-slate-700"><span className="text-base shrink-0">⏱</span> <span>每天 10 秒完成 — 點選「嗆咳、睡不好」等快速標籤即可，不必打字</span></li>
                <li className="flex gap-3 text-sm text-slate-700"><span className="text-base shrink-0">🔍</span> <span>AI 幫您留意 — 自動比對近 14 天紀錄，發現惡化徵兆主動提醒</span></li>
                <li className="flex gap-3 text-sm text-slate-700"><span className="text-base shrink-0">🏥</span> <span>一鍵就醫摘要 — 看診前把觀察整理成醫師 30 秒能讀完的摘要</span></li>
                <li className="flex gap-3 text-sm text-slate-700"><span className="text-base shrink-0">🏢</span> <span>連動居服機構 — 輸入機構邀請碼，直接查看居服員服務紀錄與額度</span></li>
                <li className="flex gap-3 text-sm text-slate-700"><span className="text-base shrink-0">🔒</span> <span>隱私保障 — 您的日誌只有您看得到，機構無法查看</span></li>
              </ul>
              <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                <button onClick={() => setShowDiaryModal(false)} className="h-11 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">稍後再說</button>
                <button onClick={() => router.push("/diary")} className="h-11 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors">開始使用照護日誌</button>
              </div>
              <div className="text-center mt-3">
                <a href="/plans" target="_blank" rel="noopener noreferrer" className="text-xs text-rose-600 hover:underline">查看方案說明 →</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 四包錢明細（可點擊展開 + 導流）────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest pl-1 border-b border-border pb-2">四包錢明細</h3>
        <p className="text-sm text-muted-foreground pl-1 -mt-2 leading-relaxed">點擊每一包可展開服務內容與申請方式。</p>

        {/* ① 照顧及專業服務 */}
        <ExpandablePackage
          title={`① 照顧及專業服務（每月）${hasForeign ? "・外看 30%" : ""}`}
          govAmount={careData.gov}
          govSuffix="/月"
        >
          <MoneyRow label="本月額度" total={careAmt} gov={careData.gov} self={careData.self} identity={identity} />
          <div className="mt-3"><PackageBody detail={PACKAGE_DETAILS.care} /></div>
          <PartnerServiceCard packageId="care" {...ctx} />
        </ExpandablePackage>

        {/* ② 交通接送 */}
        <ExpandablePackage
          title={`② 交通接送（每月最高 $${transportData.total.toLocaleString()}）`}
          govAmount={transportOk ? transportData.gov : undefined}
          govSuffix="/月"
        >
          {!transportOk ? (
            <p className="text-sm text-muted-foreground leading-relaxed mb-1">第 2 級以上才可申請交通接送補助。</p>
          ) : (
            <>
              {inclTransport ? (
                <>
                  <MoneyRow label="本月額度" total={transportData.total} gov={transportData.gov} self={transportData.self} identity={identity} />
                  <button onClick={() => setWantTransport(false)} className="mt-2 text-sm text-foreground font-bold hover:underline">取消接送需求</button>
                </>
              ) : (
                <button onClick={() => setWantTransport(true)}
                  className="w-full h-12 mb-1 rounded-xl font-bold ring-1 ring-accent text-accent bg-card hover:bg-accent/12 transition-colors active:scale-95"
                >新增接送需求（納入每月補助）</button>
              )}
            </>
          )}
          <div className="mt-3"><PackageBody detail={PACKAGE_DETAILS.transport} /></div>
          <PartnerServiceCard packageId="transport" {...ctx} />
        </ExpandablePackage>

        {/* ③ 輔具及居家無障礙改善 */}
        <ExpandablePackage
          title="③ 輔具及居家無障礙改善（每 3 年）"
          govAmount={aidsData.gov}
          govSuffix="/3年"
        >
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
          <div className="grid grid-cols-3 gap-2 text-center mt-3">
            <div className="bg-secondary/50 rounded-xl p-3"><div className="text-xs text-muted-foreground mb-1 font-medium">補助上限</div><div className="text-base font-bold text-foreground">${aidsData.total.toLocaleString()}</div></div>
            <div className="bg-primary/10 rounded-xl p-3"><div className="text-xs text-primary mb-1 font-medium">政府補助</div><div className="text-base font-bold text-primary">${aidsData.gov.toLocaleString()}</div></div>
            <div className="bg-secondary rounded-xl p-3"><div className="text-xs text-muted-foreground mb-1 font-medium">自付額</div><div className="text-base font-bold text-foreground">{identity === "low" ? "免費" : `$${aidsData.self.toLocaleString()}`}</div></div>
          </div>
          <div className="mt-3"><PackageBody detail={PACKAGE_DETAILS.aids} /></div>
          <PartnerServiceCard packageId="aids" {...ctx} />
        </ExpandablePackage>

        {/* ④ 喘息服務 */}
        <ExpandablePackage
          title={`④ 喘息服務（每年，${level <= 6 ? "2-6級" : "7-8級"}）`}
          govAmount={respiteData.gov}
          govSuffix="/年"
        >
          <MoneyRow label="本年度額度" total={respiteAmt} gov={respiteData.gov} self={respiteData.self} identity={identity} />
          <div className="mt-3"><PackageBody detail={PACKAGE_DETAILS.respite} /></div>
          <PartnerServiceCard packageId="respite" {...ctx} />
        </ExpandablePackage>
      </div>

      {/* ── 平台合規聲明 ────────────────────────────────── */}
      <div className="mt-4 rounded-2xl bg-secondary/40 ring-1 ring-border p-5 space-y-3">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">關於本平台與試算結果</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{PLATFORM_DISCLAIMER.platformNature}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{PLATFORM_DISCLAIMER.calcNature}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{PLATFORM_DISCLAIMER.privacyNotice}</p>
      </div>
    </div>
  );
}
