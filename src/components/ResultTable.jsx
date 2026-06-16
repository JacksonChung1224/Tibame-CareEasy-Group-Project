"use client";
import { useState } from "react";
import { IDENTITY_LABELS, CARE_SUBSIDY, calcSubsidy } from "@/utils/careData";

export default function ResultTable() {
  const [identity, setIdentity] = useState("general");

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl ring-1 ring-border p-5 shadow-sm">
        <label className="text-sm font-bold text-muted-foreground block mb-3">選擇身分別查看補助比例</label>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          {Object.entries(IDENTITY_LABELS).map(([k, v]) => (
            <button key={k} onClick={() => setIdentity(k)}
              className={`flex-1 py-3 px-2 rounded-xl text-sm font-bold ring-1 transition-all active:scale-95 ${
                identity === k ? "bg-foreground text-background ring-foreground shadow-sm" : "bg-card text-foreground ring-border hover:ring-foreground/50"
              }`}
            >{v}</button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl ring-1 ring-border overflow-hidden shadow-sm">
        <div className="bg-primary text-primary-foreground px-5 py-4">
          <span className="text-base font-bold">① 照顧及專業服務（每月）</span>
          <span className="text-sm ml-2 opacity-90">自付：{identity === "low" ? "0%" : identity === "midlow" ? "5%" : "16%"}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50"><tr>
              <th className="text-left px-4 py-3 text-muted-foreground font-bold whitespace-nowrap">等級</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-bold whitespace-nowrap">補助上限</th>
              <th className="text-right px-4 py-3 text-primary font-bold whitespace-nowrap">政府補助</th>
              <th className="text-right px-4 py-3 text-foreground font-bold whitespace-nowrap">自付額</th>
            </tr></thead>
            <tbody>
              {[2,3,4,5,6,7,8].map((lvl, i) => {
                const d = calcSubsidy(CARE_SUBSIDY[lvl], identity, "care");
                return <tr key={lvl} className={i % 2 === 0 ? "bg-card" : "bg-secondary/20"}>
                  <td className="px-4 py-3.5 font-bold text-foreground">第 {lvl} 級</td>
                  <td className="px-4 py-3.5 text-right text-muted-foreground">${d.total.toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-right text-primary font-bold">${d.gov.toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-right text-foreground font-bold">{identity === "low" ? "免費" : `$${d.self.toLocaleString()}`}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card rounded-2xl ring-1 ring-border overflow-hidden shadow-sm">
        <div className="bg-accent text-accent-foreground px-5 py-4">
          <span className="text-base font-bold">④ 喘息服務（每年）</span>
          <span className="text-sm ml-2 opacity-90">自付：{identity === "low" ? "0%" : identity === "midlow" ? "5%" : "16%"}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50"><tr>
              <th className="text-left px-4 py-3 text-muted-foreground font-bold whitespace-nowrap">等級</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-bold whitespace-nowrap">補助上限</th>
              <th className="text-right px-4 py-3 text-accent font-bold whitespace-nowrap">政府補助</th>
              <th className="text-right px-4 py-3 text-foreground font-bold whitespace-nowrap">自付額</th>
            </tr></thead>
            <tbody>
              {[2,3,4,5,6,7,8].map((lvl, i) => {
                const amt = lvl <= 6 ? 32340 : 48510;
                const d = calcSubsidy(amt, identity, "respite");
                return <tr key={lvl} className={i % 2 === 0 ? "bg-card" : "bg-secondary/20"}>
                  <td className="px-4 py-3.5 font-bold text-foreground">第 {lvl} 級</td>
                  <td className="px-4 py-3.5 text-right text-muted-foreground">${d.total.toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-right text-accent font-bold">${d.gov.toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-right text-foreground font-bold">{identity === "low" ? "免費" : `$${d.self.toLocaleString()}`}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-card rounded-2xl ring-1 ring-border p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="text-base font-bold text-foreground">② 交通接送（每月）</div>
              <div className="text-sm text-muted-foreground mt-1 leading-relaxed"><span className="text-primary font-bold">第 2 級以上即可申請</span></div>
              <div className="text-sm text-muted-foreground leading-relaxed">額度依地區：$1,680 / $1,840 / $2,000 / $2,400</div>
            </div>
            <div className="text-sm text-primary font-bold sm:text-right bg-primary/10 px-3 py-1.5 rounded-lg inline-flex">{identity === "low" ? "免費" : identity === "midlow" ? "自付 7%~10%" : "自付 21%~30%"}</div>
          </div>
        </div>
        <div className="bg-card rounded-2xl ring-1 ring-border p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="text-base font-bold text-foreground">③ 輔具 / 居家無障礙（每 3 年）</div>
              <div className="text-sm text-muted-foreground mt-1 leading-relaxed">傳統輔具 $40,000（可購買）或 智慧組合包 $60,000（限租賃）</div>
              <div className="text-sm text-muted-foreground leading-relaxed">選定後 3 年內不得變更，每滿 3 年可重新選擇</div>
            </div>
            <div className="text-sm text-primary font-bold sm:text-right bg-primary/10 px-3 py-1.5 rounded-lg inline-flex">{identity === "low" ? "全額補助" : identity === "midlow" ? "自付 10%" : "自付 30%"}</div>
          </div>
        </div>
      </div>
      <div className="text-sm text-muted-foreground text-center pt-2">資料來源：衛福部「長期照顧服務申請及給付辦法」</div>
    </div>
  );
}
