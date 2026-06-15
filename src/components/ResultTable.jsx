"use client";
import { useState } from "react";
import { IDENTITY_LABELS, CARE_SUBSIDY, calcSubsidy } from "@/utils/careData";

export default function ResultTable() {
  const [identity, setIdentity] = useState("general");

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-stone-500 block mb-2">選擇身分別查看補助比例</label>
        <div className="flex gap-2">
          {Object.entries(IDENTITY_LABELS).map(([k, v]) => (
            <button key={k} onClick={() => setIdentity(k)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${
                identity === k ? "bg-stone-800 text-white border-stone-800" : "bg-white text-stone-600 border-stone-200"
              }`}
            >{v}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
        <div className="bg-teal-600 text-white px-4 py-2.5">
          <span className="text-sm font-bold">① 照顧及專業服務（每月）</span>
          <span className="text-xs ml-2 opacity-75">自付：{identity === "low" ? "0%" : identity === "midlow" ? "5%" : "16%"}</span>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-stone-50"><tr>
            <th className="text-left px-3 py-2 text-stone-400 font-semibold">等級</th>
            <th className="text-right px-3 py-2 text-stone-400 font-semibold">補助上限</th>
            <th className="text-right px-3 py-2 text-teal-600 font-semibold">政府補助</th>
            <th className="text-right px-3 py-2 text-rose-500 font-semibold">自付額</th>
          </tr></thead>
          <tbody>
            {[2,3,4,5,6,7,8].map((lvl, i) => {
              const d = calcSubsidy(CARE_SUBSIDY[lvl], identity, "care");
              return <tr key={lvl} className={i % 2 === 0 ? "bg-white" : "bg-stone-50"}>
                <td className="px-3 py-2.5 font-bold text-teal-700">第 {lvl} 級</td>
                <td className="px-3 py-2.5 text-right text-stone-600">${d.total.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right text-teal-700 font-semibold">${d.gov.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right text-rose-600 font-semibold">{identity === "low" ? "免費" : `$${d.self.toLocaleString()}`}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
        <div className="bg-amber-500 text-white px-4 py-2.5">
          <span className="text-sm font-bold">④ 喘息服務（每年）</span>
          <span className="text-xs ml-2 opacity-75">自付：{identity === "low" ? "0%" : identity === "midlow" ? "5%" : "16%"}</span>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-stone-50"><tr>
            <th className="text-left px-3 py-2 text-stone-400 font-semibold">等級</th>
            <th className="text-right px-3 py-2 text-stone-400 font-semibold">補助上限</th>
            <th className="text-right px-3 py-2 text-teal-600 font-semibold">政府補助</th>
            <th className="text-right px-3 py-2 text-rose-500 font-semibold">自付額</th>
          </tr></thead>
          <tbody>
            {[2,3,4,5,6,7,8].map((lvl, i) => {
              const amt = lvl <= 6 ? 32340 : 48510;
              const d = calcSubsidy(amt, identity, "respite");
              return <tr key={lvl} className={i % 2 === 0 ? "bg-white" : "bg-stone-50"}>
                <td className="px-3 py-2.5 font-bold text-amber-700">第 {lvl} 級</td>
                <td className="px-3 py-2.5 text-right text-stone-600">${d.total.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right text-teal-700 font-semibold">${d.gov.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right text-rose-600 font-semibold">{identity === "low" ? "免費" : `$${d.self.toLocaleString()}`}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-2">
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold text-stone-700">② 交通接送（每月）</div>
              <div className="text-xs text-stone-400 mt-0.5"><span className="text-teal-600 font-medium">第 2 級以上即可申請</span></div>
              <div className="text-xs text-stone-400">額度依地區：$1,680 / $1,840 / $2,000 / $2,400</div>
            </div>
            <div className="text-xs text-teal-700 font-bold ml-3 text-right">{identity === "low" ? "免費" : identity === "midlow" ? "自付 7%~10%" : "自付 21%~30%"}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold text-stone-700">③ 輔具 / 居家無障礙（每 3 年）</div>
              <div className="text-xs text-stone-400 mt-0.5">傳統輔具 $40,000（可購買）或 智慧組合包 $60,000（限租賃）</div>
              <div className="text-xs text-stone-400">選定後 3 年內不得變更，每滿 3 年可重新選擇</div>
            </div>
            <div className="text-xs text-teal-700 font-bold ml-3">{identity === "low" ? "全額補助" : identity === "midlow" ? "自付 10%" : "自付 30%"}</div>
          </div>
        </div>
      </div>
      <div className="text-xs text-stone-400 text-center">資料來源：衛福部「長期照顧服務申請及給付辦法」</div>
    </div>
  );
}
