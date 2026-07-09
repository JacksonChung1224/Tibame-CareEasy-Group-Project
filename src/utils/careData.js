// ── 補助資料 ─────────────────────────────────────────────
export const CARE_SUBSIDY = {
  2: 10020, 3: 15460, 4: 18580,
  5: 24100, 6: 28070, 7: 32090, 8: 36180,
};

export const RESPITE_SUBSIDY = { low: 32340, high: 48510 };

export const TRANSPORT_BY_REGION = [
  { label: "第一類（台北、基隆、嘉義市等，< 500 km²）", value: 1680 },
  { label: "第二類（新北、桃園、台中等，500–1500 km²）", value: 1840 },
  { label: "第三類（高雄、南投、屏東等，> 1500 km²）", value: 2000 },
  { label: "第四類（偏遠地區：花東、澎湖、金門等）", value: 2400 },
];

export const IDENTITY_RATES = {
  care: { general: 0.16, midlow: 0.05, low: 0 },
  aids: { general: 0.30, midlow: 0.10, low: 0 },
  respite: { general: 0.16, midlow: 0.05, low: 0 },
};

export const TRANSPORT_RATES = {
  general: [0.30, 0.27, 0.25, 0.21],
  midlow: [0.10, 0.09, 0.08, 0.07],
  low: [0, 0, 0, 0],
};

export const IDENTITY_LABELS = { general: "一般戶", midlow: "中低收入戶", low: "低收入戶" };

// ── 申請資格（非失智路徑用）────────────────────────────────
export const ELIGIBILITY_OPTIONS = [
  { id: "elder", icon: "👴", label: "65 歲以上長者" },
  { id: "indigenous", icon: "⛰️", label: "55 歲以上原住民" },
  { id: "disability", icon: "♿", label: "身心障礙者（需持有身障證明）" },
];

// ── 路徑一：失智路徑題目 ─────────────────────────────────
export const DEMENTIA_QUESTIONS = [
  {
    id: "cdr",
    label: "失智狀況評估",
    desc: "請依據長輩平時在家的表現，選擇最符合的描述：",
    options: [
      {
        label: "記憶正常，生活完全自理",
        sub: "記憶與認知正常，能獨立處理日常事務與社交活動，無需他人提醒",
        value: 0,
      },
      {
        label: "偶爾忘事，但能自我修正",
        sub: "經常性輕度健忘（如忘記放東西），對時間概念稍有困難，但日常生活與自我照料仍可獨立完成",
        value: 0.5,
      },
      {
        label: "記憶退化已影響生活，需旁人提醒督促",
        sub: "中度記憶減退，無法單獨處理複雜家事、理財或購物；較困難的嗜好已放棄，居家生活需旁人提醒或督促",
        value: 1,
      },
      {
        label: "出門會走失，無法獨立生活",
        sub: "時間地點辨識嚴重困難，出門一定會迷路走失；算錢點餐困難，不會自己挑選衣服穿；穿衣、洗澡等個人照護需人協助",
        value: 2,
      },
      {
        label: "不認識家人，生活完全依賴他人",
        sub: "記憶僅剩片段，無法認出親近家人；溝通能力嚴重退化，只剩單字或呢喃；日常作息完全依賴他人，伴隨頻繁大小便失禁",
        value: 3,
      },
    ],
    type: "single",
  },
  {
    id: "behavior",
    label: "行為與精神症狀",
    desc: "長輩過去一個月是否有以下行為？（請選擇最符合的一項）",
    options: [
      { label: "無明顯行為問題", sub: "", value: 0 },
      { label: "偶爾出現", sub: "如徘徊遊走、重複問話、囤積物品、日夜顛倒", value: 1 },
      { label: "頻繁出現，照顧困難", sub: "如幻覺妄想、攻擊行為、強烈抗拒照顧、嚴重吵鬧影響他人", value: 2 },
    ],
    type: "single",
  },
  {
    id: "medical",
    label: "特殊醫療照護需求",
    desc: "長輩目前是否有以下醫療照護需求？（可複選，沒有請選以上皆無）",
    subItems: ["鼻胃管灌食", "氣切護理", "導尿管護理", "傷口換藥", "靜脈注射", "氧氣使用"],
    type: "multicheck",
  },
];

// ── 路徑二：非失智路徑題目 ───────────────────────────────
export const ADL_QUESTIONS = [
  {
    id: "adl_eating",
    label: "進食",
    desc: "長輩能否自行夾菜、進食？",
    options: [
      { label: "完全獨立", sub: "能在合理時間內自行使用餐具進食", value: 10 },
      { label: "需部分協助", sub: "需他人協助切碎食物、備餐、盛湯或夾菜，或需口頭提醒", value: 5 },
      { label: "完全依賴餵食或鼻胃管", sub: "無法自行進食，需完全協助或使用管灌", value: 0 },
    ],
    type: "single",
  },
  {
    id: "adl_transfer",
    label: "移位（床↔椅）",
    desc: "長輩能否在床與椅子之間自行移動？",
    options: [
      { label: "完全獨立", sub: "可自行坐起，並由床移動至椅子或輪椅，無安全顧慮", value: 15 },
      { label: "需稍微協助或口頭提醒", sub: "移位過程需輕扶保持平衡，或需口頭引導，仍有安全顧慮", value: 10 },
      { label: "可坐起但移位需大量協助", sub: "能自行坐起，但須他人大量協助才能完成移位", value: 5 },
      { label: "完全依賴，需兩人協助搬動", sub: "無法自行坐起，所有移位動作需他人全程執行", value: 0 },
    ],
    type: "single",
  },
  {
    id: "adl_hygiene",
    label: "個人衛生",
    desc: "長輩能否自行完成洗臉、洗手、刷牙、梳頭？",
    options: [
      { label: "完全獨立", sub: "上述盥洗項目皆可自行完成", value: 5 },
      { label: "需要協助", sub: "上述任一項需他人協助才能完成", value: 0 },
    ],
    type: "single",
  },
  {
    id: "adl_toilet",
    label: "如廁",
    desc: "長輩能否自行上廁所（含進出廁所、穿脫衣物、擦拭沖水）？",
    options: [
      { label: "完全獨立", sub: "可自行進出廁所、穿脫、擦拭、沖水，無安全顧慮", value: 10 },
      { label: "需部分協助", sub: "如廁過程需協助保持平衡、整理衣物或使用衛生紙", value: 5 },
      { label: "完全依賴他人", sub: "無法自行完成如廁過程", value: 0 },
    ],
    type: "single",
  },
  {
    id: "adl_bathing",
    label: "洗澡",
    desc: "長輩能否自行完成盆浴或淋浴？",
    options: [
      { label: "完全獨立", sub: "可自行完成盆浴或淋浴全程", value: 5 },
      { label: "需要協助", sub: "需他人在旁協助才能完成洗澡", value: 0 },
    ],
    type: "single",
  },
  {
    id: "adl_walking",
    label: "平地走動",
    desc: "長輩能否在平地自行行走？",
    options: [
      { label: "獨立行走 45 公尺以上", sub: "使用或不使用輔具皆可獨立行走，無安全顧慮", value: 15 },
      { label: "需稍微扶持或口頭指導", sub: "可行走但需旁人稍微攙扶或口頭引導方向", value: 10 },
      { label: "無法行走，但能獨立推輪椅", sub: "雖無法行走，但可獨立操作輪椅或電動輪椅移動 45 公尺以上", value: 5 },
      { label: "完全依賴他人移動", sub: "無法自行移動，所有行走移位需他人執行", value: 0 },
    ],
    type: "single",
  },
  {
    id: "adl_stairs",
    label: "上下樓梯",
    desc: "長輩能否自行上下樓梯？",
    options: [
      { label: "完全獨立", sub: "可自行上下樓梯，可使用扶手或拐杖", value: 10 },
      { label: "需稍微扶持或口頭指導", sub: "需旁人在旁稍微扶持或給予口頭指導", value: 5 },
      { label: "完全無法上下樓梯", sub: "無法自行完成，需他人協助或完全避免樓梯", value: 0 },
    ],
    type: "single",
  },
  {
    id: "adl_dressing",
    label: "穿脫衣物",
    desc: "長輩能否自行穿脫衣褲鞋襪？",
    options: [
      { label: "完全獨立", sub: "可自行穿脫所有衣褲鞋襪，必要時可使用輔具", value: 10 },
      { label: "需部分協助", sub: "在別人幫忙下，能自行完成一半以上的穿脫動作", value: 5 },
      { label: "完全依賴他人", sub: "需要別人完全幫忙穿脫，長輩幾乎無法配合", value: 0 },
    ],
    type: "single",
  },
  {
    id: "adl_bowel",
    label: "大便控制",
    desc: "長輩的大便控制狀況如何？",
    options: [
      { label: "完全自控", sub: "不會失禁，必要時能自行使用塞劑", value: 10 },
      { label: "偶爾失禁", sub: "每週失禁少於一次，使用塞劑時需旁人協助", value: 5 },
      { label: "經常或完全失禁", sub: "失禁情況頻繁或完全無法控制，需要灌腸", value: 0 },
    ],
    type: "single",
  },
  {
    id: "adl_bladder",
    label: "小便控制",
    desc: "長輩的小便控制狀況如何？",
    options: [
      { label: "完全自控", sub: "日夜皆不會尿失禁，必要時能自行使用尿套", value: 10 },
      { label: "偶爾失禁或需提醒", sub: "每週失禁少於一次，或需他人提醒如廁時間", value: 5 },
      { label: "經常或完全失禁", sub: "失禁情況頻繁，或目前已留置導尿管", value: 0 },
    ],
    type: "single",
  },
];

export const NON_DEMENTIA_EXTRA = [
  {
    id: "iadl",
    label: "工具性日常生活（IADL）",
    desc: "以下事項中，長輩「需要他人協助或完全無法獨立完成」的有幾項？（可複選）",
    subItems: ["購物買菜", "備餐煮飯", "管理用藥", "搭乘交通工具外出", "處理金錢帳務", "撥打電話", "洗衣服", "做簡單家事"],
    type: "multicheck",
  },
  {
    id: "behavior",
    label: "行為與精神症狀",
    desc: "長輩過去一個月是否有以下行為？（請選擇最符合的一項）",
    options: [
      { label: "無明顯行為問題", sub: "", value: 0 },
      { label: "偶爾出現", sub: "如徘徊遊走、重複問話、囤積物品、日夜顛倒", value: 1 },
      { label: "頻繁出現，照顧困難", sub: "如幻覺妄想、攻擊行為、強烈抗拒照顧、嚴重吵鬧", value: 2 },
    ],
    type: "single",
  },
  {
    id: "medical",
    label: "特殊醫療照護需求",
    desc: "長輩目前是否有以下醫療照護需求？（可複選，沒有請選以上皆無）",
    subItems: ["鼻胃管灌食", "氣切護理", "導尿管護理", "傷口換藥", "靜脈注射", "氧氣使用"],
    type: "multicheck",
  },
];

// ── 可校準閾值 ─────────────────────────────────────────────
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

// ── 工具函式 ─────────────────────────────────────────────
export function calcSubsidy(amount, identityKey, type) {
  const rate = IDENTITY_RATES[type][identityKey];
  const selfPay = Math.round(amount * rate);
  return { total: amount, gov: amount - selfPay, self: selfPay };
}

export function calcTransport(amount, identityKey, regionIdx) {
  const rate = TRANSPORT_RATES[identityKey][regionIdx];
  const selfPay = Math.round(amount * rate);
  return { total: amount, gov: amount - selfPay, self: selfPay, ratePct: Math.round(rate * 100) };
}

export function canUseTransport(level) {
  return level >= 2;
}

export const BA_MAP = {
  BA01:{name:"基本身體清潔",price:260}, BA02:{name:"基本日常照顧",price:195},
  BA03:{name:"測量生命徵象",price:35},  BA04:{name:"協助進食或管灌",price:130},
  BA05:{name:"餐食照顧",price:310},     BA07:{name:"協助沐浴及洗頭",price:325},
  BA10:{name:"翻身拍背",price:155},     BA11:{name:"肢體關節活動",price:195},
  BA12:{name:"協助上下樓梯",price:130}, BA13:{name:"陪同外出",price:195},
  BA14:{name:"陪同就醫",price:685},     BA15:{name:"家務協助",price:195},
  BA16:{name:"代購代領代送",price:130}, BA17a:{name:"人工氣道抽吸",price:75},
  BA17b:{name:"口腔分泌物抽吸",price:65},BA17c:{name:"尿管鼻胃管清潔",price:50},
  BA17d1:{name:"血糖機驗血糖",price:50},BA17d2:{name:"甘油球通便",price:50},
  BA17e:{name:"依指示置入藥盒",price:50},BA18:{name:"安全看視",price:200},
  BA20:{name:"陪伴服務",price:175},     BA22:{name:"巡視服務",price:130},
  BA23:{name:"協助洗頭",price:200},     BA24:{name:"協助排泄",price:220},
};
