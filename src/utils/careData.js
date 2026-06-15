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

// ── 評估算法 ─────────────────────────────────────────────
export function estimateLevelDementia(answers) {
  const cdr = answers.cdr ?? 0;
  const behavior = answers.behavior ?? 0;
  const medical = (answers.medical || []).filter(v => v !== "__none__").length;
  let base = 1;
  if (cdr === 0.5) base = 2;
  if (cdr === 1) base = 3;
  if (cdr === 2) base = 5;
  if (cdr === 3) base = 7;
  // 行為精神症狀（BPSD）：實務變數大，以有界區間呈現
  let min = base, max = base;
  if (behavior === 1) { min = Math.max(min, 3); max = Math.max(max, 4); }
  if (behavior === 2) { min = Math.max(min, 5); max = Math.max(max, 6); }
  // 黃金組合：CDR 3（生活完全依賴）＋特殊醫療管路 → 臨床上接近確定，鎖定單點第 8 級
  if (cdr === 3 && medical > 0) { min = 8; max = 8; }
  min = Math.min(8, min);
  max = Math.min(8, max);
  return { min, max, isRange: min !== max };
}

export function estimateLevelNormal(answers) {
  // 巴氏量表計分
  const barthelScore =
    (answers.adl_eating ?? 10) +
    (answers.adl_transfer ?? 15) +
    (answers.adl_hygiene ?? 5) +
    (answers.adl_toilet ?? 10) +
    (answers.adl_bathing ?? 5) +
    (answers.adl_walking ?? 15) +
    (answers.adl_stairs ?? 10) +
    (answers.adl_dressing ?? 10) +
    (answers.adl_bowel ?? 10) +
    (answers.adl_bladder ?? 10);

  const iadl = (answers.iadl || []).filter(v => v !== "__none__").length;
  const behavior = answers.behavior ?? 0;
  const medical = (answers.medical || []).filter(v => v !== "__none__").length;
  
  // 軌道一：巴氏量表
  let adlLevel;
  if (barthelScore >= 95) adlLevel = 1;
  else if (barthelScore >= 85) adlLevel = 2;
  else if (barthelScore >= 70) adlLevel = 3;
  else if (barthelScore >= 50) adlLevel = 4;
  else if (barthelScore >= 35) adlLevel = 5;
  else if (barthelScore >= 20) adlLevel = 6;
  else adlLevel = 7;
  
  // IADL 修正：ADL 獨立但 IADL 高度依賴（≥3 項）→ 保底第 2 級
  if (barthelScore >= 85 && iadl >= 3) adlLevel = Math.max(adlLevel, 2);
  
  // 軌道二：行為精神症狀（BPSD）
  let min = adlLevel, max = adlLevel;
  if (behavior === 1) { min = Math.max(min, 3); max = Math.max(max, 4); }
  if (behavior === 2) { min = Math.max(min, 5); max = Math.max(max, 6); }
  
  // 黃金組合：巴氏 < 10（完全臥床依賴）＋特殊醫療管路 → 臨床上接近確定，鎖定單點第 8 級
  if (barthelScore < 10 && medical > 0) { min = 8; max = 8; }
  
  min = Math.min(8, min);
  max = Math.min(8, max);
  return { min, max, isRange: min !== max };
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
