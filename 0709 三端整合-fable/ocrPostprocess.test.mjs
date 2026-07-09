/**
 * ocrPostprocess.test.mjs — 執行方式：node ocrPostprocess.test.mjs
 * 12 案例：BA 碼校正/歧義、數值範圍、日期正規化、整合流程。
 */
import {
  correctBaCode, correctBp, correctHours, correctDate, postprocess,
} from "./ocrPostprocess.js";

const cases = [];
const t = (name, fn) => cases.push({ name, fn });

// ── BA 碼 ──
t("BA碼：BAO7（字母O）→ BA07，經校正 conf 0.90", () => {
  const r = correctBaCode("BAO7");
  return r.value === "BA07" && r.confidence === 0.90 && r.corrected;
});
t("BA碼：ba17d1 小寫 → 正規化 BA17d1", () => {
  const r = correctBaCode("ba17d1");
  return r.value === "BA17d1" && r.confidence >= 0.90;
});
t("BA碼：全形ＢＡ１４ → BA14", () => {
  const r = correctBaCode("ＢＡ１４");
  return r.value === "BA14" && r.confidence >= 0.90;
});
t("BA碼：BA02 完全正確 → conf 0.98 未校正", () => {
  const r = correctBaCode("BA02");
  return r.value === "BA02" && r.confidence === 0.98 && !r.corrected;
});
t("BA碼：BA19 多重候選（BA10/13/14…距離1）→ 不猜、conf 0.30", () => {
  const r = correctBaCode("BA19");
  return r.value === "BA19" && r.confidence === 0.30;
});
t("BA碼：XX99 完全無法對應 → 保留原值 conf 0.30", () => {
  const r = correctBaCode("XX99");
  return r.value === "XX99" && r.confidence === 0.30;
});

// ── 數值 ──
t("血壓：300/82 超出收縮壓範圍 → conf 0.40", () => {
  return correctBp("300/82").confidence === 0.40;
});
t("血壓：13/8/82 格式錯誤 → conf 0.20", () => {
  return correctBp("13/8/82").confidence === 0.20;
});
t("時數：1.25 非 0.5 步進 → 保留值、conf 0.60", () => {
  const r = correctHours("1.25");
  return r.value === 1.25 && r.confidence === 0.60;
});

// ── 日期 ──
t("日期：114/6/27（民國）→ 6/27", () => {
  const r = correctDate("114/6/27");
  return r.value === "6/27" && r.confidence === 0.90;
});
t("日期：2025.6.27（西元）→ 6/27；06-27 → 6/27", () => {
  return correctDate("2025.6.27").value === "6/27"
    && correctDate("06-27").value === "6/27";
});

// ── 整合 ──
t("整合：一列典型 OCR 輸出 → 髒欄位低分、乾淨欄位高分", () => {
  const { fields, confidence } = postprocess({
    date: "114/6/27",
    caseId: "A141408XXX",
    codes: ["BA02", "BAO7", "BA19"],
    hours: "1.5",
    bp: "138/82",
    temp: "36.5",
    pulse: "74",
    resp: "18",
    note: "協助沐浴，狀況穩定。",
  });
  return fields.date === "6/27"
    && fields.codes.includes("BA07")            // 自動校正成功
    && confidence.codes === 0.30                 // 取最低分（BA19 歧義）→ 整欄標黃
    && confidence.bp === 0.98
    && confidence.hours === 0.98
    && fields._codeDetails[2].confidence === 0.30; // 逐碼細節供 UI 標色
});

// ── Runner ──
let pass = 0;
for (const c of cases) {
  let ok = false, err = null;
  try { ok = c.fn(); } catch (e) { err = e; }
  console.log(`${ok ? "✅ PASS" : "❌ FAIL"}  ${c.name}${err ? `  (${err.message})` : ""}`);
  if (ok) pass++;
}
console.log(`\n結果：${pass}/${cases.length} 通過`);
process.exit(pass === cases.length ? 0 : 1);
