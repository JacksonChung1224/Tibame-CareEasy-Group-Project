"use client";
// ════════════════════════════════════════════════════════════════
//  PartnerServiceCard.jsx
//  ────────────────────────────────────────────────────────────────
//  放在「每包錢明細」展開區的最底部。依 PARTNER.services[packageId]:
//   • 企業有提供 → 顯示自家服務卡片（品牌色 + CTA）
//   • 企業沒提供 → 顯示政府官方管道（中性、可信賴）
//
//  白標：PARTNER.whiteLabel = true 時，呈現為「自家平台服務」，
//        不顯示「合作夥伴提供」字樣。
// ════════════════════════════════════════════════════════════════

import { useState } from "react";
import { PARTNER, GOV_CHANNELS, PLATFORM_DISCLAIMER } from "@/utils/partnerData";
import { trackPartnerClick } from "@/utils/trackPartnerClick";

export default function PartnerServiceCard({ packageId, cmsLevel, identity }) {
  const [copied, setCopied] = useState(false);
  const service = PARTNER.services[packageId];
  const hasService = service?.hasService;

  // ── 企業有提供此包服務 ──────────────────────────────────
  if (hasService) {
    const onClick = () => {
      trackPartnerClick({
        packageId,
        channel: "partner",
        brand: PARTNER.brand,
        cmsLevel,
        identity,
      });
      // ctaValue 為 "#" 時不導頁（MVP 假資料），避免跳到空白頁
      if (service.ctaValue && service.ctaValue !== "#") {
        window.open(service.ctaValue, "_blank", "noopener,noreferrer");
      }
    };

    return (
      <div className="mt-4 rounded-2xl bg-accent/8 ring-1 ring-accent/30 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-accent">
            {PARTNER.brandShort}・{service.title}
          </span>
          {service.tag && (
            <span className="text-xs font-bold text-accent bg-accent/15 px-2 py-0.5 rounded-full">
              {service.tag}
            </span>
          )}
          {!PARTNER.whiteLabel && (
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              合作夥伴提供
            </span>
          )}
        </div>

        <p className="text-sm text-foreground/80 leading-relaxed">{service.desc}</p>

        <button
          onClick={onClick}
          className="w-full h-12 rounded-xl font-bold text-accent-foreground bg-accent hover:opacity-90 transition-opacity active:scale-95 flex items-center justify-center gap-1.5"
        >
          {service.ctaLabel}
          <span aria-hidden="true">→</span>
        </button>
        <p className="text-xs text-muted-foreground leading-relaxed text-center">
          {PLATFORM_DISCLAIMER.ctaMicroNote}
        </p>
      </div>
    );
  }

  // ── 企業沒提供 → 政府官方管道 ───────────────────────────
  const gov = GOV_CHANNELS[packageId];
  if (!gov || gov.hasChannel === false) return null;

  const onGovClick = () => {
    trackPartnerClick({ packageId, channel: "gov", cmsLevel, identity });
    if (gov.ctaType === "phone") {
      navigator.clipboard.writeText("1966");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      window.location.href = gov.ctaValue;
    } else {
      if (gov.ctaValue) window.location.href = gov.ctaValue;
    }
  };

  return (
    <div className="mt-4 rounded-2xl bg-secondary/40 ring-1 ring-border p-5 space-y-2">
      <div className="text-sm font-bold text-muted-foreground">透過政府官方管道申請</div>
      {gov.ctaType === "link" ? (
        <a
          href={gov.ctaValue}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackPartnerClick({ packageId, channel: "gov", cmsLevel, identity })}
          className="w-full h-12 rounded-xl font-bold text-foreground bg-card ring-1 ring-border hover:ring-foreground/40 transition-all active:scale-95 flex items-center justify-center gap-1.5"
        >
          {gov.label}
          <span aria-hidden="true">→</span>
        </a>
      ) : (
        <>
          <button
            onClick={onGovClick}
            className="w-full h-12 rounded-xl font-bold text-foreground bg-card ring-1 ring-border hover:ring-foreground/40 transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            {copied ? "✓ 號碼已複製：1966" : gov.label}
            <span aria-hidden="true">→</span>
          </button>
          {gov.ctaType === "phone" && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              電腦版用戶請直接以電話撥打 1966
            </p>
          )}
        </>
      )}
    </div>
  );
}
