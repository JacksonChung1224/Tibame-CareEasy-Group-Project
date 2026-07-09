/**
 * signalEngine.test.mjs — 執行方式：node signalEngine.test.mjs
 * 格式仿照 backtest.mjs：純 node、零依賴、逐案回報 PASS/FAIL。
 * 涵蓋：R1–R4 各觸發/不觸發、concordant 判定、重評門檻、
 *       舊制字串日誌相容、evidence 完整性。
 */
import { computeSignals, shouldSuggestReassessment } from "./signalEngine.js";

const cases = [];
const t = (name, fn) => cases.push({ name, fn });
const findDim = (sigs, dim) => sigs.find((s) => s.dim === dim);

// ── Case 1：R1 觸發（嗆咳 2 次，僅家屬）→ single_source / amber ──
t("R1 觸發：choke×2 → 吞嚥訊號 single_source", () => {
  const fam = {
    "6/20": { tags: ["choke"], text: "晚上嗆到一次" },
    "6/24": { tags: ["choke"], text: "吃東西嗆到" },
  };
  const sigs = computeSignals(fam, {});
  const s = findDim(sigs, "吞嚥/進食");
  return s && s.conf === "single_source" && s.color === "amber"
    && s.label === "家屬觀察" && s.evidence.length === 2;
});

// ── Case 2：R1 不觸發（嗆咳僅 1 次）──
t("R1 不觸發：choke×1 → 無吞嚥訊號", () => {
  const sigs = computeSignals({ "6/24": { tags: ["choke"], text: "" } }, {});
  return !findDim(sigs, "吞嚥/進食");
});

// ── Case 3：R2 觸發 + concordant（家屬×2 + 居服員 obs 命中）──
t("R2 concordant：家屬 walk_weak+fall、居服員「攙扶」→ 紅色兩端一致", () => {
  const fam = {
    "6/22": { tags: ["walk_weak"], text: "腿沒力" },
    "6/25": { tags: ["fall"], text: "差點跌倒" },
  };
  const wk = {
    "6/22": { obs: "陪同就醫，步態需攙扶。", vitals: {} },
  };
  const sigs = computeSignals(fam, wk);
  const s = findDim(sigs, "行走/移位");
  return s && s.conf === "concordant" && s.color === "red"
    && s.label === "兩端一致"
    && s.evidence.some((e) => e.source === "family")
    && s.evidence.some((e) => e.source === "worker");
});

// ── Case 4：R2 不觸發（僅居服員 obs、家屬 0 次）──
t("R2 不觸發：家屬端 0 次（居服員單邊不觸發 v1 家屬主導規則）", () => {
  const wk = { "6/22": { obs: "步態需攙扶", vitals: {} } };
  return !findDim(computeSignals({}, wk), "行走/移位");
});

// ── Case 5：R3 觸發（收縮壓 136→138→142，末筆 ≥140）──
t("R3 觸發：血壓三筆遞增且末筆 142 → 血壓訊號", () => {
  const wk = {
    "6/18": { vitals: { bp: "136/80" } },
    "6/20": { vitals: { bp: "138/82" } },
    "6/22": { vitals: { bp: "142/86" } },
  };
  const sigs = computeSignals({}, wk);
  const s = findDim(sigs, "血壓趨勢");
  return s && s.label === "居服員紀錄" && s.evidence.length === 3
    && s.desc.includes("136→138→142");
});

// ── Case 6：R3 不觸發（遞增但末筆 <140）──
t("R3 不觸發：128→132→138 末筆未達 140", () => {
  const wk = {
    "6/18": { vitals: { bp: "128/80" } },
    "6/20": { vitals: { bp: "132/82" } },
    "6/22": { vitals: { bp: "138/86" } },
  };
  return !findDim(computeSignals({}, wk), "血壓趨勢");
});

// ── Case 7：R4 觸發（sleep_bad×3）──
t("R4 觸發：sleep_bad×3 → 睡眠訊號", () => {
  const fam = {
    "6/21": { tags: ["sleep_bad"], text: "" },
    "6/23": { tags: ["sleep_bad"], text: "" },
    "6/25": { tags: ["sleep_bad"], text: "夜裡一直叫我" },
  };
  const s = findDim(computeSignals(fam, {}), "睡眠");
  return s && s.evidence.length === 3;
});

// ── Case 8：重評門檻（concordant ≥2 → true；<2 → false）──
t("重評門檻：2 個 concordant → true / 1 個 → false", () => {
  const fam = {
    "6/20": { tags: ["choke"], text: "" },
    "6/22": { tags: ["choke", "walk_weak"], text: "" },
    "6/24": { tags: ["fall"], text: "" },
  };
  const wkBoth = { "6/22": { obs: "進食時嗆咳，步態需攙扶", vitals: {} } };
  const wkOne = { "6/22": { obs: "步態需攙扶", vitals: {} } };
  const yes = shouldSuggestReassessment(computeSignals(fam, wkBoth)); // 吞嚥+行走皆 concordant
  const no = shouldSuggestReassessment(computeSignals(fam, wkOne));   // 僅行走 concordant
  return yes === true && no === false;
});

// ── Case 9：舊制字串日誌相容（不觸發規則、不噴錯）──
t("相容性：舊制純文字日誌 → 不觸發、不拋錯", () => {
  const fam = { "6/24": "今天吃東西嗆到了，咳了蠻久。", "6/25": "夜裡不太好睡。" };
  const sigs = computeSignals(fam, {});
  return Array.isArray(sigs) && sigs.length === 0;
});

// ── Runner ──────────────────────────────────────────────────
let pass = 0;
for (const c of cases) {
  let ok = false, err = null;
  try { ok = c.fn(); } catch (e) { err = e; }
  const mark = ok ? "✅ PASS" : "❌ FAIL";
  console.log(`${mark}  ${c.name}${err ? `  (${err.message})` : ""}`);
  if (ok) pass++;
}
console.log(`\n結果：${pass}/${cases.length} 通過`);
process.exit(pass === cases.length ? 0 : 1);
