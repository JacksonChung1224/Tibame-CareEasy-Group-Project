// ════════════════════════════════════════════════════════════════
//  trackPartnerClick.js — 企業服務 / 政府管道點擊成效追蹤
//  ────────────────────────────────────────────────────────────────
//  寫一筆點擊紀錄到 Supabase partner_clicks 表。
//  用途：作為與企業 (智齡等) 談 B2B 合約時的成效議價籌碼
//        （「這個月幫你導了 X 個高意向家屬」）。
//
//  設計原則：
//   • 完全 fire-and-forget，不阻塞 UI、不擋使用者點擊。
//   • 失敗只在 console 留訊息，絕不跳錯誤給家屬看。
//   • 沿用現有 supabaseClient（anon key, 僅 INSERT，RLS 防讀取）。
// ════════════════════════════════════════════════════════════════

import { supabase } from "@/lib/supabaseClient";

/**
 * 記錄一次導流點擊
 * @param {Object} p
 * @param {string} p.packageId   - care | transport | aids | respite
 * @param {"partner"|"gov"} p.channel - 點的是企業服務還是政府管道
 * @param {string} [p.brand]     - 企業品牌（partner 時帶入）
 * @param {number} [p.cmsLevel]  - 當下試算的 CMS 級數（可選，利於分析）
 * @param {string} [p.identity]  - 身分別（可選）
 */
export async function trackPartnerClick({ packageId, channel, brand, cmsLevel, identity }) {
  try {
    const payload = {
      package_id: packageId,
      channel,
      brand: brand ?? null,
      cms_level: cmsLevel ?? null,
      identity: identity ?? null,
      // 與專案慣例一致：手動帶台灣時間，避免 UTC 時差
      created_at: new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" })
      ).toISOString(),
    };
    const { error } = await supabase.from("partner_clicks").insert(payload);
    if (error) console.warn("[trackPartnerClick] insert failed:", error.message);
  } catch (e) {
    console.warn("[trackPartnerClick] unexpected error:", e);
  }
}
