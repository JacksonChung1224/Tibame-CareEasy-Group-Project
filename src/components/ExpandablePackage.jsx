"use client";
// ════════════════════════════════════════════════════════════════
//  ExpandablePackage.jsx
//  ────────────────────────────────────────────────────────────────
//  四包錢明細的「可點擊展開」外框。
//  收合時：顯示包別標題 + 政府補助金額摘要 + 展開箭頭。
//  展開時：顯示 children（服務明細 + PartnerServiceCard）。
//
//  純 React state 控制，不使用 localStorage（符合專案/環境限制）。
// ════════════════════════════════════════════════════════════════

import { useState } from "react";

export default function ExpandablePackage({
  title,
  govAmount,       // 顯示在標題右側的「政府補助」摘要金額（number，可選）
  govSuffix = "",  // 金額後綴，如 "/月"、"/年"、"/3年"
  defaultOpen = false,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl ring-1 ring-border bg-card shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left hover:bg-secondary/30 transition-colors active:scale-[0.99] min-h-[60px]"
      >
        <span className="text-base font-bold text-foreground leading-snug">{title}</span>
        <span className="flex items-center gap-3 shrink-0">
          {typeof govAmount === "number" && (
            <span className="text-right">
              <span className="block text-xs text-muted-foreground font-medium">政府補助</span>
              <span className="block text-base font-black text-primary">
                ${govAmount.toLocaleString()}
                <span className="text-xs font-bold text-muted-foreground ml-0.5">{govSuffix}</span>
              </span>
            </span>
          )}
          <span
            aria-hidden="true"
            className={`text-muted-foreground text-lg transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-border">{children}</div>
      )}
    </div>
  );
}
