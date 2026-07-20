# 任務卡 I｜裁決無預設化：差異必經人工選擇、金額確實入帳
> 優先級：🔴 凍結前｜Specialist 狀態：⚠️ 裁決語義 7/15 已簽核，但「移除預設值」
> 屬簽核內容變更，完成後請 Specialist 快速複核 v4 規則表（流程性複核，非費率）。

```
【全域規則 — 必須遵守】
1. 遵守 CLAUDE.md。修改檔案僅限：src/utils/reconcile.js、
   src/components/InstitutionDashboard.jsx、reconcile.test.mjs、
   docs/reconciliation-rules.md。
2. 完成後逐條回報驗收條件，附測試輸出與 npm run build 結果。
```

## 變更核心（一句話）
四種差異（D1／D3／D4／no_schedule）的裁決 radio **一律無預設值**；
每筆差異必須由督導主動選擇「採紙本」或「採系統」才能匯出；
**選定側的單價 × 數量必須真實寫入官方申報檔 Sheet1**。

## 任務 1：reconcile.js
1. `decision` 初始值由預設改為 `null`（四種差異狀態皆同；OK 列不需裁決）。
2. `resolveRow(row)`：
   - `decision === null` → 回傳 `{ include: null }`（未裁決，非 true 非 false）。
   - `"paper"` → 取紙本側；`"system"` → 取排班側；
     選定側不存在該筆（D1 採紙本／no_schedule 採系統）→ `include:false`。
   - **金額落實**：`values` 中的 單價、數量、時段、服務人員一律取自選定側；
     選定側單價為空 → BA_MAP fallback 並標 `priceSource:"ba_map_fallback"`；
     皆無 → 該列標「待補價」並視同未完成（阻擋匯出）。
3. 新增匯出前檢核函式 `getExportBlockers(rows)` 回傳
   `{ undecided:N, missingReason:N, missingPrice:N, missingTime:N }`
   ——四項皆 0 才可匯出。（missingReason＝D1 採紙本未填原因）

## 任務 2：InstitutionDashboard UI
1. 差異列的 radio **初始皆未選**；未裁決列以醒目樣式標示
   （左框線琥珀色＋「⚠ 待裁決」badge）。
2. 步驟 3 頂部摘要列新增：`待裁決 N 筆`（N>0 時琥珀色）。
3. 匯出按鈕 disabled 條件改用 `getExportBlockers`，按鈕下方文字提示
   阻擋原因與筆數（例：`尚有 2 筆待裁決、1 筆待補價`）。
4. 裁決切換時，該列的單價／數量／小計即時依選定側刷新
   （督導所見＝將匯出之值）。
5. D1 採紙本仍必填未執行原因；其餘備註選填（維持現制）。

## 任務 3：規則文件改版 v4（docs/reconciliation-rules.md）
1. 表格更新：「預設」欄整欄改為 **「無預設・必選」**。
2. 原則句改寫（取代「以紙本實績為唯一申報基準」）：
   `原則：差異不預設立場，由督導逐筆裁決採紙本或採系統；
   未裁決不得匯出，確保每一筆應核銷金額都經人工確認後入帳。
   同日剩餘雙邊各 ≥2 筆時不做推測配對，各自成 D1／no_schedule 交人工裁決。`
3. 簽核註記更新：`裁決語義 2026-07-15 簽核；無預設化變更 2026-07-__ 複核`。
4. **同步修改機構端 header 副標**（對外文案）：
   `以「紙本實績」為唯一申報基準` → `差異逐筆裁決 • 自動稽核核銷欄位 • 杜絕漏項及人工比對疏漏`。

## 任務 4：測試更新（reconcile.test.mjs）
既有預設值相關斷言改寫，並新增 4 案：
1. 未裁決列 → `resolveRow` 回傳 `include:null`；`getExportBlockers.undecided` 正確計數
2. D3 採系統 → values 之單價/數量＝排班側（金額落實驗證）
3. D1 採系統 → include:true 且單價/數量/時段/服務人員全＝排班側
4. no_schedule 採紙本 → include:true 且值全＝紙本側；紙本單價空 → fallback 生效

## 驗收條件
- [ ] `node reconcile.test.mjs` 全過
- [ ] 載入 mock → 所有差異列 radio 皆未選、標「⚠ 待裁決」→ 匯出 disabled 且提示筆數
- [ ] 逐筆裁決完成（含 D1 填原因）→ 匯出放行
- [ ] **開匯出檔逐欄驗證兩條路徑的金額**：任一筆採系統 → Sheet1 該列
      單價/數量＝排班檔原值；任一筆採紙本 → ＝紙本值；小計於 UI 同步一致
- [ ] 機構端 header 副標已更新為新文案
- [ ] 三端 smoke；`npm run build` 通過
- [ ] 規則文件 v4 已更新，回報時提醒 Jackson 送 Specialist 複核
