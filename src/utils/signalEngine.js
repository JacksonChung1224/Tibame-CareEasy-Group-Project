/**
 * signalEngine.js — CareEasy 照護一點通 · AI 照護訊號規則引擎 v1
 * ─────────────────────────────────────────────────────────────
 * ⚠️ 本檔案為「規則引擎」，非 ML 模型。所有訊號皆由下列明文規則計算，
 *    每一條訊號必附 evidence（原始紀錄出處），禁止產生無依據的描述。
 *
 * ⚠️ 需 CMS Rules Specialist 驗證項目：
 *    R1–R4 的觸發閾值、WORKER_OBS_KEYWORDS 關鍵字表、
 *    REASSESS_THRESHOLD（建議重評門檻）。
 *
 * ── 規則定義（v1）──────────────────────────────────────────
 * R1 吞嚥/進食：家屬 tag "choke" 近 14 天出現 ≥ 2 次
 * R2 行走/移位：家屬 tag "walk_weak" 或 "fall" 合計 ≥ 2 次
 * R3 血壓趨勢：居服員量測收縮壓「最近 3 筆」嚴格遞增，且末筆 ≥ 140
 * R4 睡眠　　：家屬 tag "sleep_bad" 出現 ≥ 3 次
 *
 * 可信度判定：
 *   同一面向（dim）家屬端與居服員端「都有」證據 → conf = "concordant"（紅）
 *   僅單邊有證據                             → conf = "single_source"（琥珀）
 *
 * 已知限制（v1，文件化）：
 *   - 家屬端僅以結構化 tags 判定（P1-1 上線後生效）；舊制純文字日誌
 *     不觸發規則，但會列入 evidence 供人工參考。
 *   - 日期格式假設同一年度內之 "M/D"，跨年份排序不在 v1 範圍。
 */

// ── 常數（Specialist 可調整區）──────────────────────────────

export const RULE_THRESHOLDS = {
  R1_CHOKE_MIN: 2,
  R2_MOBILITY_MIN: 2,
  R3_BP_TREND_LEN: 3,
  R3_SYSTOLIC_ALERT: 140,
  R4_SLEEP_MIN: 3,
};

export const REASSESS_THRESHOLD = 2; // concordant 訊號數 ≥ 2 → 建議提前重評

/** 居服員 obs 文字 → 面向 關鍵字表（v1，命中即列為該面向之居服員端證據） */
export const WORKER_OBS_KEYWORDS = {
  mobility: ["攙扶", "費力", "步態", "跌倒", "移位", "無力"],
  swallow: ["嗆", "吞嚥"],
  sleep: ["夜眠", "失眠", "嗜睡"],
};

/** 面向 中文顯示名 */
const DIM_LABEL = {
  swallow: "吞嚥/進食",
  mobility: "行走/移位",
  bp: "血壓趨勢",
  sleep: "睡眠",
};

const CONF_LABEL = {
  concordant: "兩端一致",
  family: "家屬觀察",
  worker: "居服員紀錄",
};

// ── 內部工具 ────────────────────────────────────────────────

/** "M/D" → 可排序數值（同年度內）。無法解析回傳 null。 */
function dateKey(d) {
  const m = /^(\d{1,2})\/(\d{1,2})$/.exec(String(d).trim());
  if (!m) return null;
  const mo = +m[1], da = +m[2];
  if (mo < 1 || mo > 12 || da < 1 || da > 31) return null;
  return mo * 100 + da;
}

/** 家屬日誌 entry 正規化：舊制字串 → { tags:[], text } */
function normalizeFamilyEntry(entry) {
  if (typeof entry === "string") return { tags: [], text: entry };
  return { tags: entry?.tags ?? [], text: entry?.text ?? "" };
}

/** 解析 "138/82" → { sys, dia }；失敗回傳 null */
function parseBp(bp) {
  const m = /^(\d{2,3})\s*\/\s*(\d{2,3})$/.exec(String(bp ?? "").trim());
  if (!m) return null;
  return { sys: +m[1], dia: +m[2] };
}

/** 依日期排序的 entries 陣列 [{date, ...}] */
function sortedByDate(obj) {
  return Object.entries(obj || {})
    .map(([date, v]) => ({ date, ...((typeof v === "object" && v) || { _raw: v }) , _raw: v }))
    .filter((e) => dateKey(e.date) !== null)
    .sort((a, b) => dateKey(a.date) - dateKey(b.date));
}

// ── 證據蒐集 ────────────────────────────────────────────────

/** 家屬端：tag → evidence（附原文供「查看依據」） */
function collectFamilyEvidence(familyLogs) {
  const byDim = { swallow: [], mobility: [], sleep: [] };
  const tagToDim = {
    choke: "swallow",
    walk_weak: "mobility",
    fall: "mobility",
    sleep_bad: "sleep",
  };
  const tagLabel = {
    choke: "嗆咳",
    walk_weak: "走路沒力",
    fall: "跌倒/差點跌倒",
    sleep_bad: "睡不好",
  };
  for (const e of sortedByDate(familyLogs)) {
    const { tags, text } = normalizeFamilyEntry(e._raw);
    for (const t of tags) {
      const dim = tagToDim[t];
      if (!dim) continue;
      byDim[dim].push({
        source: "family",
        date: e.date,
        text: text ? `［${tagLabel[t]}］${text}` : `［${tagLabel[t]}］`,
      });
    }
  }
  return byDim;
}

/** 居服員端：obs 關鍵字 → evidence */
function collectWorkerObsEvidence(workerLogs) {
  const byDim = { mobility: [], swallow: [], sleep: [] };
  for (const e of sortedByDate(workerLogs)) {
    const obs = e.obs ?? "";
    if (!obs) continue;
    for (const [dim, kws] of Object.entries(WORKER_OBS_KEYWORDS)) {
      if (kws.some((k) => obs.includes(k))) {
        byDim[dim].push({ source: "worker", date: e.date, text: obs });
      }
    }
  }
  return byDim;
}

/** 居服員端：血壓序列 [{date, sys, dia, raw}] */
function collectBpSeries(workerLogs) {
  const out = [];
  for (const e of sortedByDate(workerLogs)) {
    const bp = parseBp(e.vitals?.bp);
    if (bp) out.push({ date: e.date, ...bp, raw: e.vitals.bp });
  }
  return out;
}

// ── 訊號組裝 ────────────────────────────────────────────────

function buildSignal({ dim, familyEv, workerEv, desc }) {
  const hasF = familyEv.length > 0;
  const hasW = workerEv.length > 0;
  const conf = hasF && hasW ? "concordant" : "single_source";
  const label = conf === "concordant" ? CONF_LABEL.concordant
    : hasF ? CONF_LABEL.family : CONF_LABEL.worker;
  return {
    dim: DIM_LABEL[dim],
    dir: "deteriorating",
    conf,
    color: conf === "concordant" ? "red" : "amber",
    label,
    desc,
    evidence: [...familyEv, ...workerEv],
  };
}

const joinDates = (ev) => ev.map((e) => e.date).join("、");

/**
 * 主函式：computeSignals(familyLogs, workerLogs) → Signal[]
 * 純函式，無副作用，無外部呼叫。
 */
export function computeSignals(familyLogs = {}, workerLogs = {}) {
  const T = RULE_THRESHOLDS;
  const fam = collectFamilyEvidence(familyLogs);
  const wob = collectWorkerObsEvidence(workerLogs);
  const signals = [];

  // R2 行走/移位（列前：與重評判斷最相關）
  if (fam.mobility.length >= T.R2_MOBILITY_MIN) {
    const concordantNote = wob.mobility.length > 0 ? "居服員紀錄亦提及相關觀察。" : "";
    signals.push(buildSignal({
      dim: "mobility",
      familyEv: fam.mobility,
      workerEv: wob.mobility,
      desc: `近 14 天家屬記錄行動相關異常 ${fam.mobility.length} 次（${joinDates(fam.mobility)}）。${concordantNote}`,
    }));
  }

  // R1 吞嚥/進食
  if (fam.swallow.length >= T.R1_CHOKE_MIN) {
    const concordantNote = wob.swallow.length > 0 ? "居服員紀錄亦提及相關觀察。" : "";
    signals.push(buildSignal({
      dim: "swallow",
      familyEv: fam.swallow,
      workerEv: wob.swallow,
      desc: `近 14 天家屬記錄嗆咳 ${fam.swallow.length} 次（${joinDates(fam.swallow)}）。頻率偏高，建議就醫時主動告知。${concordantNote}`,
    }));
  }

  // R3 血壓趨勢（居服員量測）
  const bpSeries = collectBpSeries(workerLogs);
  if (bpSeries.length >= T.R3_BP_TREND_LEN) {
    const last = bpSeries.slice(-T.R3_BP_TREND_LEN);
    const rising = last.every((p, i) => i === 0 || p.sys > last[i - 1].sys);
    if (rising && last[last.length - 1].sys >= T.R3_SYSTOLIC_ALERT) {
      signals.push(buildSignal({
        dim: "bp",
        familyEv: [], // v1：血壓無家屬端對應 tag
        workerEv: last.map((p) => ({ source: "worker", date: p.date, text: `血壓 ${p.raw}` })),
        desc: `居服員量測收縮壓呈上升趨勢：${last.map((p) => p.sys).join("→")}（${joinDates(last.map((p) => ({ date: p.date })))}），末筆已達 ${last[last.length - 1].sys}。建議就醫時提供此趨勢。`,
      }));
    }
  }

  // R4 睡眠
  if (fam.sleep.length >= T.R4_SLEEP_MIN) {
    const concordantNote = wob.sleep.length > 0 ? "居服員紀錄亦提及相關觀察。" : "";
    signals.push(buildSignal({
      dim: "sleep",
      familyEv: fam.sleep,
      workerEv: wob.sleep,
      desc: `近 14 天家屬記錄睡眠不佳 ${fam.sleep.length} 次（${joinDates(fam.sleep)}）。${concordantNote}`,
    }));
  }

  return signals;
}

/** 建議提前重評：concordant 訊號數 ≥ REASSESS_THRESHOLD */
export function shouldSuggestReassessment(signals) {
  return signals.filter((s) => s.conf === "concordant").length >= REASSESS_THRESHOLD;
}
