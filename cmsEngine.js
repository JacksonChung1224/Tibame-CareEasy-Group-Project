// ============================================================
// cmsEngine.js — CMS 等級評估引擎（基礎 + 三層加權，雙路徑共用）
// ------------------------------------------------------------
// 設計原則：
//   最終級數 = 基礎級數(ADL/CDR) → IADL 修正 → BPSD 加權 → 醫療管路加權
//   失智與非失智兩條路徑共用「同一套加權邏輯」，只有「基礎級數」來源不同：
//     - 非失智：基礎來自巴氏量表(Barthel)分數
//     - 失智  ：基礎來自 ADL(若有作答) 與 CDR 取較嚴重者
//
// ⚠️ 重要聲明：
//   官方 CMS 判定為未公開之決策樹演算法，本引擎為「逼近估算」，
//   定位為家屬事前參考，非官方判級。所有對外結果須保留
//   「僅供參考，正式評估請洽 1966」之聲明。
//
// 所有閾值集中在 THRESHOLDS，校準時只改這裡，不動邏輯。
// 每次修改 THRESHOLDS 屬演算法調整 → MINOR 版號 → 記入 CHANGELOG。
// ============================================================

// ── 可校準閾值（CMS Rules Specialist 的主要調整面板）──────────
export const THRESHOLDS = {
  // 巴氏量表分數 → 基礎級數的切點（分數 >= 切點即為該級）
  // 格式：[最低分, 對應級數]，由高分到低分排列
  barthelToLevel: [
    [95, 1],
    [85, 2],
    [70, 3],
    [50, 4],
    [30, 5],
    [15, 6],
    [0,  7],
  ],

  // CDR → 基礎級數對照
  cdrToLevel: {
    0:   1,
    0.5: 2,
    1:   3,
    2:   5,
    3:   7,
  },

  // IADL 高度依賴修正：ADL 大致獨立(巴氏 >= 此分) 但 IADL 失能項數 >= 門檻 → 保底級數
  iadlAdjust: { minBarthel: 85, minItems: 3, floorLevel: 2 },

  // BPSD 行為精神症狀加權（以區間呈現照顧困難造成的跳級不確定性）
  bpsd: {
    1: { minFloor: 3, maxFloor: 4 }, // 偶爾出現
    2: { minFloor: 5, maxFloor: 6 }, // 頻繁、照顧困難
  },

  // 黃金組合：身體完全依賴 + 特殊醫療管路 → 鎖定第 8 級
  goldenCombo: { maxBarthel: 10, cdrTrigger: 3, lockLevel: 8 },

  LEVEL_CAP: 8,
  LEVEL_FLOOR: 1,
};

// ── 內部工具 ──────────────────────────────────────────────
function countMulti(arr) {
  return (arr || []).filter((v) => v !== "__none__").length;
}

function barthelToLevel(score) {
  for (const [minScore, level] of THRESHOLDS.barthelToLevel) {
    if (score >= minScore) return level;
  }
  return THRESHOLDS.barthelToLevel[THRESHOLDS.barthelToLevel.length - 1][1];
}

function computeBarthel(answers) {
  return (
    (answers.adl_eating   ?? 10) +
    (answers.adl_transfer ?? 15) +
    (answers.adl_hygiene  ?? 5)  +
    (answers.adl_toilet   ?? 10) +
    (answers.adl_bathing  ?? 5)  +
    (answers.adl_walking  ?? 15) +
    (answers.adl_stairs   ?? 10) +
    (answers.adl_dressing ?? 10) +
    (answers.adl_bowel    ?? 10) +
    (answers.adl_bladder  ?? 10)
  );
}

// 判斷此 answers 是否含有 ADL 作答（失智路徑也可能補問 ADL）
function hasAdlAnswers(answers) {
  return [
    "adl_eating", "adl_transfer", "adl_hygiene", "adl_toilet", "adl_bathing",
    "adl_walking", "adl_stairs", "adl_dressing", "adl_bowel", "adl_bladder",
  ].some((k) => answers[k] !== undefined && answers[k] !== null);
}

// ── 共用加權核心 ──────────────────────────────────────────
// 輸入基礎級數與各維度，輸出 { min, max }
function applyWeights(baseLevel, { iadl, behavior, medical, barthel, cdr }) {
  const T = THRESHOLDS;
  let level = baseLevel;

  // 第一層：IADL 修正（ADL 大致獨立但 IADL 高度依賴 → 保底）
  if (
    barthel !== null &&
    barthel >= T.iadlAdjust.minBarthel &&
    iadl >= T.iadlAdjust.minItems
  ) {
    level = Math.max(level, T.iadlAdjust.floorLevel);
  }

  let min = level;
  let max = level;

  // 第二層：BPSD 行為精神症狀加權
  const bpsd = T.bpsd[behavior];
  if (bpsd) {
    min = Math.max(min, bpsd.minFloor);
    max = Math.max(max, bpsd.maxFloor);
  }

  // 第三層：黃金組合 — 身體完全依賴 + 醫療管路 → 鎖定第 8 級
  const bodyFullyDependent =
    (barthel !== null && barthel <= T.goldenCombo.maxBarthel) ||
    cdr === T.goldenCombo.cdrTrigger;
  if (bodyFullyDependent && medical > 0) {
    min = T.goldenCombo.lockLevel;
    max = T.goldenCombo.lockLevel;
  }

  // 收斂上下界
  min = Math.min(T.LEVEL_CAP, Math.max(T.LEVEL_FLOOR, min));
  max = Math.min(T.LEVEL_CAP, Math.max(T.LEVEL_FLOOR, max));
  if (max < min) max = min;

  return { min, max, isRange: min !== max };
}

// ── 對外主函式：非失智路徑 ─────────────────────────────────
export function estimateLevelNormal(answers) {
  const barthel = computeBarthel(answers);
  const base = barthelToLevel(barthel);
  return applyWeights(base, {
    iadl: countMulti(answers.iadl),
    behavior: answers.behavior ?? 0,
    medical: countMulti(answers.medical),
    barthel,
    cdr: null,
  });
}

// ── 對外主函式：失智路徑 ───────────────────────────────────
// 重點改進：若失智路徑也有 ADL 作答，取「CDR 基礎」與「ADL 基礎」中較嚴重者，
// 避免身體已臥床卻只看 CDR 而低估。
export function estimateLevelDementia(answers) {
  const cdr = answers.cdr ?? 0;
  const cdrBase = THRESHOLDS.cdrToLevel[cdr] ?? 1;

  let barthel = null;
  let base = cdrBase;
  if (hasAdlAnswers(answers)) {
    barthel = computeBarthel(answers);
    const adlBase = barthelToLevel(barthel);
    base = Math.max(cdrBase, adlBase); // 取較嚴重者
  }

  return applyWeights(base, {
    iadl: countMulti(answers.iadl),
    behavior: answers.behavior ?? 0,
    medical: countMulti(answers.medical),
    barthel,
    cdr,
  });
}

// ── 統一入口（給回測腳本用）────────────────────────────────
export function estimateLevel(answers, isDementiaPath) {
  return isDementiaPath
    ? estimateLevelDementia(answers)
    : estimateLevelNormal(answers);
}
