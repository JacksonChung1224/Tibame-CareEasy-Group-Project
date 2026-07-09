/**
 * ocrPostprocess.js — CareEasy · OCR 結果後處理校正層 v1
 * ─────────────────────────────────────────────────────────────
 * 定位：辨識引擎（LLM vision / OCR）的原始輸出 → 規則校正 → 欄位級信心分數。
 * 純函式、零依賴、無 I/O。confidence < 0.85 之欄位應於 UI 標黃強制人工確認
 * （對應任務卡 P2-1 步驟 2.5）。
 *
 * 信心分數約定：
 *   0.98 完全合法、無需校正        0.90 經自動校正後合法
 *   0.60 合法但異常（如時數非 0.5 步進）
 *   0.40 數值超出生理/合理範圍     0.30 BA 碼無法對應白名單
 *   0.20 格式無法解析              0.00 空值
 */

// ── BA 碼白名單（與家屬端 BA_MAP 鍵一致；新增碼時兩處同步）──
export const BA_WHITELIST = [
  "BA01","BA02","BA03","BA04","BA05","BA07","BA10","BA11","BA12","BA13",
  "BA14","BA15","BA16","BA17a","BA17b","BA17c","BA17d1","BA17d2","BA17e",
  "BA18","BA20","BA22","BA23","BA24",
];

// ── 合理範圍表（Specialist 可調整區）─────────────────────────
export const RANGES = {
  systolic:  { min: 60,  max: 250 },
  diastolic: { min: 40,  max: 150 },
  temp:      { min: 34.0, max: 42.0 },
  pulse:     { min: 30,  max: 200 },
  resp:      { min: 8,   max: 40 },
  hours:     { min: 0.5, max: 12, step: 0.5 },
};

// ── 內部工具 ────────────────────────────────────────────────

/** 全形 → 半形 */
function toHalfWidth(s) {
  return String(s ?? "").replace(/[\uFF01-\uFF5E]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xFEE0)
  ).replace(/\u3000/g, " ");
}

/** Levenshtein 編輯距離（早停於 >limit） */
function editDistance(a, b, limit = 2) {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[a.length][b.length];
}

const WL_UPPER = BA_WHITELIST.map((c) => c.toUpperCase());

/**
 * 校正單一 BA 碼。
 * 流程：半形化 → 去空白/連字號 → 大寫 → 易混字替換（O→0、I/L→1，
 *       僅套用於 "BA" 之後的字元）→ 白名單精確比對 →
 *       失敗則編輯距離 ≤1 的「唯一」候選 → 仍失敗保留原值。
 */
export function correctBaCode(raw) {
  const original = String(raw ?? "").trim();
  if (!original) return { value: "", confidence: 0.0, corrected: false };

  let s = toHalfWidth(original).replace(/[\s-]/g, "").toUpperCase();
  const head = s.slice(0, 2);
  let tail = s.slice(2).replace(/O/g, "0").replace(/[IL]/g, "1");
  s = head + tail;

  // 精確比對（大寫空間）
  const exactIdx = WL_UPPER.indexOf(s);
  if (exactIdx !== -1) {
    const canonical = BA_WHITELIST[exactIdx];
    const corrected = canonical !== original;
    return { value: canonical, confidence: corrected ? 0.90 : 0.98, corrected };
  }

  // 編輯距離 ≤ 1 的唯一候選
  const candidates = WL_UPPER
    .map((w, i) => ({ i, d: editDistance(s, w, 1) }))
    .filter((c) => c.d <= 1);
  if (candidates.length === 1) {
    return { value: BA_WHITELIST[candidates[0].i], confidence: 0.90, corrected: true };
  }

  // 無法對應（含多重候選 → 寧可標低分交人工，不猜）
  return { value: original, confidence: 0.30, corrected: false };
}

/** 數值欄位驗證（temp 允許一位小數，其餘整數） */
function checkNumber(raw, range, { float = false } = {}) {
  const s = toHalfWidth(raw).trim();
  if (!s) return { value: null, confidence: 0.0 };
  const re = float ? /^\d{1,3}(\.\d)?$/ : /^\d{1,3}$/;
  if (!re.test(s)) return { value: s, confidence: 0.20 };
  const n = float ? parseFloat(s) : parseInt(s, 10);
  if (n < range.min || n > range.max) return { value: n, confidence: 0.40 };
  return { value: n, confidence: 0.98 };
}

/** 血壓 "138/82"（容忍全形斜線與空白） */
export function correctBp(raw) {
  const s = toHalfWidth(raw).replace(/\s/g, "").replace(/／/g, "/");
  if (!s) return { value: "", confidence: 0.0 };
  const m = /^(\d{2,3})\/(\d{2,3})$/.exec(s);
  if (!m) return { value: String(raw), confidence: 0.20 };
  const sys = +m[1], dia = +m[2];
  const okS = sys >= RANGES.systolic.min && sys <= RANGES.systolic.max;
  const okD = dia >= RANGES.diastolic.min && dia <= RANGES.diastolic.max;
  return { value: `${sys}/${dia}`, confidence: okS && okD ? 0.98 : 0.40 };
}

/** 時數：0.5–12、步進 0.5。非步進值保留原值但降分 0.60。 */
export function correctHours(raw) {
  const s = toHalfWidth(raw).trim();
  if (!s) return { value: null, confidence: 0.0 };
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(s)) return { value: s, confidence: 0.20 };
  const n = parseFloat(s);
  if (n < RANGES.hours.min || n > RANGES.hours.max) return { value: n, confidence: 0.40 };
  const onStep = Math.abs(n / RANGES.hours.step - Math.round(n / RANGES.hours.step)) < 1e-9;
  return { value: n, confidence: onStep ? 0.98 : 0.60 };
}

/**
 * 日期正規化 → "M/D"
 * 接受：6/27、06-27、114/6/27（民國）、2025.6.27（西元）、全形數字。
 * 三段式時第一段視為年份（民國 <200 / 西元 ≥1900）並捨棄。
 */
export function correctDate(raw) {
  const s = toHalfWidth(raw).trim().replace(/[.\-年月]/g, "/").replace(/日/g, "");
  if (!s) return { value: "", confidence: 0.0 };
  const parts = s.split("/").map((p) => p.trim()).filter(Boolean);
  let mo, da;
  if (parts.length === 2) [mo, da] = parts.map(Number);
  else if (parts.length === 3) {
    const y = Number(parts[0]);
    const yearLike = (y >= 100 && y < 200) || (y >= 1900 && y <= 2100);
    if (!yearLike) return { value: String(raw), confidence: 0.20 };
    [mo, da] = [Number(parts[1]), Number(parts[2])];
  } else return { value: String(raw), confidence: 0.20 };
  if (!Number.isInteger(mo) || !Number.isInteger(da) || mo < 1 || mo > 12 || da < 1 || da > 31) {
    return { value: String(raw), confidence: 0.20 };
  }
  const corrected = `${mo}/${da}` !== String(raw).trim();
  return { value: `${mo}/${da}`, confidence: corrected ? 0.90 : 0.98 };
}

/**
 * 主函式：postprocess(rawFields) → { fields, confidence }
 * rawFields = { date, caseId, codes:[...], hours, bp, temp, pulse, resp, note }
 * 皆為辨識引擎輸出之字串（codes 為字串陣列）。
 */
export function postprocess(rawFields = {}) {
  const fields = {};
  const confidence = {};

  const d = correctDate(rawFields.date ?? "");
  fields.date = d.value; confidence.date = d.confidence;

  // 個案代號：僅做半形化與去空白（格式規則屬機構自定，v1 不驗證內容）
  const caseId = toHalfWidth(rawFields.caseId ?? "").replace(/\s/g, "");
  fields.caseId = caseId;
  confidence.caseId = caseId ? 0.90 : 0.0;

  const codesRaw = Array.isArray(rawFields.codes) ? rawFields.codes : [];
  const codeResults = codesRaw.map(correctBaCode);
  fields.codes = codeResults.map((r) => r.value);
  confidence.codes = codeResults.length
    ? Math.min(...codeResults.map((r) => r.confidence))
    : 0.0;
  fields._codeDetails = codeResults; // UI 可逐碼標色

  const h = correctHours(rawFields.hours ?? "");
  fields.hours = h.value; confidence.hours = h.confidence;

  const bp = correctBp(rawFields.bp ?? "");
  fields.bp = bp.value; confidence.bp = bp.confidence;

  const temp = checkNumber(rawFields.temp ?? "", RANGES.temp, { float: true });
  fields.temp = temp.value; confidence.temp = temp.confidence;

  const pulse = checkNumber(rawFields.pulse ?? "", RANGES.pulse);
  fields.pulse = pulse.value; confidence.pulse = pulse.confidence;

  const resp = checkNumber(rawFields.resp ?? "", RANGES.resp);
  fields.resp = resp.value; confidence.resp = resp.confidence;

  // 備註：自由文字不驗證，僅半形化空白整理
  fields.note = String(rawFields.note ?? "").trim();
  confidence.note = fields.note ? 0.90 : 0.0;

  return { fields, confidence };
}
