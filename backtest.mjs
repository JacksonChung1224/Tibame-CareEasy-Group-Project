// ============================================================
// backtest.mjs — CMS 引擎回測腳本（唯讀，不改任何資料）
// ------------------------------------------------------------
// 功能：
//   1. 載入測試資料（真實案例 from Supabase / 或合成案例 JSON）
//   2. 用 cmsEngine 重新推估每筆的級數
//   3. 與「真實核定級數」比對，輸出：
//        - 整體準確率（完全命中 / 區間命中 / ±1 容差）
//        - 混淆矩陣（真實 × 推估）
//        - 各級數的偏誤方向（系統性高估 / 低估）
//
// 執行方式：
//   node backtest.mjs --synthetic           # 用合成案例（無需 DB，先驗證邏輯）
//   node backtest.mjs --api <URL> <密碼>     # 從 admin API 拉真實資料回測
//
// ⚠️ 此腳本為唯讀。它只計算與列印，不寫入資料庫、不改演算法。
//    可安全交給開發 Agent 直接執行。
// ============================================================

import { estimateLevel } from "./cmsEngine.js";
import fs from "node:fs";

const MIN_SAMPLES_WARN = 20; // 低於此樣本數，結果僅供參考

// ── 資料載入 ──────────────────────────────────────────────
async function loadSynthetic() {
  const raw = fs.readFileSync(new URL("./testCases.json", import.meta.url), "utf-8");
  const cases = JSON.parse(raw);
  return cases.map((c) => ({
    answers: c.answers,
    isDementia: c.is_dementia_path,
    actual: c.actual_cms_level,
    note: c.note ?? "",
  }));
}

// 從你的 admin API 拉真實資料（對應 src/app/api/admin/records/route.js）
async function loadFromApi(url, password) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error(`API 回應 ${res.status}：請確認網址與密碼`);
  const data = await res.json();
  const records = Array.isArray(data) ? data : data.records ?? [];
  // 僅保留有真實核定級數的記錄（回測必須要有標準答案）
  return records
    .filter((r) => r.actual_cms_level != null)
    .map((r) => ({
      answers: typeof r.answers === "string" ? JSON.parse(r.answers) : r.answers,
      isDementia: r.is_dementia_path,
      actual: r.actual_cms_level,
      note: `id=${r.id ?? "?"}`,
    }));
}

// ── 比對與統計 ────────────────────────────────────────────
function evaluate(samples) {
  const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8];
  // 混淆矩陣：matrix[actual][predicted使用min] = count
  const matrix = {};
  LEVELS.forEach((a) => { matrix[a] = {}; LEVELS.forEach((p) => (matrix[a][p] = 0)); });

  let exactHit = 0;     // 推估 min === 真實（單點完全命中）
  let rangeHit = 0;     // 真實落在 [min,max] 區間內
  let within1 = 0;      // 真實與 min 差距 <= 1
  const errorByLevel = {}; // 各真實級數的平均誤差（推估min - 真實）
  LEVELS.forEach((l) => (errorByLevel[l] = { sum: 0, n: 0 }));

  const misses = []; // 不命中的個案，供人工檢視

  for (const s of samples) {
    const { min, max } = estimateLevel(s.answers, s.isDementia);
    const pred = min; // 以下界作為單點代表
    const actual = s.actual;

    if (matrix[actual] && matrix[actual][pred] !== undefined) {
      matrix[actual][pred]++;
    }

    const isExact = pred === actual;
    const isRange = actual >= min && actual <= max;
    const isWithin1 = Math.abs(pred - actual) <= 1;

    if (isExact) exactHit++;
    if (isRange) rangeHit++;
    if (isWithin1) within1++;

    if (errorByLevel[actual]) {
      errorByLevel[actual].sum += (pred - actual);
      errorByLevel[actual].n++;
    }

    if (!isRange) {
      misses.push({ actual, pred: `${min}-${max}`, dementia: s.isDementia, note: s.note });
    }
  }

  return { matrix, exactHit, rangeHit, within1, errorByLevel, misses, total: samples.length };
}

// ── 報表輸出 ──────────────────────────────────────────────
function printReport(r) {
  const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8];
  const pct = (n) => ((n / r.total) * 100).toFixed(1) + "%";

  console.log("\n========== CMS 引擎回測報告 ==========");
  console.log(`樣本總數：${r.total}`);
  if (r.total < MIN_SAMPLES_WARN) {
    console.log(`⚠️  樣本數低於 ${MIN_SAMPLES_WARN}，以下統計僅供參考，請持續累積真實核定資料。`);
  }
  console.log("");
  console.log(`單點完全命中（推估=真實）  ：${r.exactHit} / ${r.total}  (${pct(r.exactHit)})`);
  console.log(`區間命中（真實落在推估範圍）：${r.rangeHit} / ${r.total}  (${pct(r.rangeHit)})`);
  console.log(`±1 級容差命中              ：${r.within1} / ${r.total}  (${pct(r.within1)})`);

  // 混淆矩陣
  console.log("\n---------- 混淆矩陣（列=真實核定，欄=系統推估）----------");
  let header = "真實\\推估 |";
  LEVELS.forEach((p) => (header += ` ${String(p).padStart(3)}`));
  console.log(header);
  console.log("-".repeat(header.length));
  for (const a of LEVELS) {
    let row = `   ${a}     |`;
    for (const p of LEVELS) {
      const v = r.matrix[a][p];
      row += ` ${v === 0 ? "  ." : String(v).padStart(3)}`;
    }
    console.log(row);
  }
  console.log("（對角線=命中；對角線右上=系統高估；左下=系統低估）");

  // 各級偏誤
  console.log("\n---------- 各真實級數的系統性偏誤 ----------");
  console.log("真實級數 | 樣本數 | 平均誤差(推估-真實) | 判讀");
  for (const l of LEVELS) {
    const e = r.errorByLevel[l];
    if (e.n === 0) continue;
    const avg = (e.sum / e.n);
    let verdict = "準確";
    if (avg > 0.3) verdict = "⚠️ 系統性高估，建議調高該級切點";
    else if (avg < -0.3) verdict = "⚠️ 系統性低估，建議調低該級切點";
    console.log(`   ${l}     |  ${String(e.n).padStart(4)}  |       ${avg.toFixed(2).padStart(6)}        | ${verdict}`);
  }

  // 不命中個案（最多列 15 筆）
  if (r.misses.length > 0) {
    console.log("\n---------- 未命中個案（供 CMS Rules Specialist 人工檢視）----------");
    r.misses.slice(0, 15).forEach((m, i) => {
      console.log(`${String(i + 1).padStart(2)}. 真實=${m.actual}  推估=${m.pred}  ${m.dementia ? "[失智]" : "[非失智]"}  ${m.note}`);
    });
    if (r.misses.length > 15) console.log(`...（其餘 ${r.misses.length - 15} 筆省略）`);
  }
  console.log("\n=====================================\n");
}

// ── 主程式 ────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  let samples;

  if (args[0] === "--api") {
    const url = args[1], password = args[2];
    if (!url || !password) { console.error("用法：node backtest.mjs --api <URL> <密碼>"); process.exit(1); }
    console.log("從 admin API 載入真實核定資料...");
    samples = await loadFromApi(url, password);
    if (samples.length === 0) {
      console.log("⚠️  沒有任何含 actual_cms_level 的記錄。請先讓使用者回填真實核定級數，或改用 --synthetic 驗證邏輯。");
      process.exit(0);
    }
  } else {
    console.log("載入合成測試案例（驗證演算法邏輯，非真實資料）...");
    samples = await loadSynthetic();
  }

  const result = evaluate(samples);
  printReport(result);
}

main().catch((e) => { console.error("回測失敗：", e.message); process.exit(1); });
