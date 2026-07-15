# 任務卡 F｜機構端調整批次（團隊反饋 1–7 + 匯出崩潰修復）
> 優先級：🔴 立即（匯出功能目前不可用）｜需 Specialist 驗證：是（採紙本/採系統裁決原則）

```
【全域規則 — 必須遵守】
1. 禁止修改 careData.js 費率、signalEngine.js、scheduleImport.js 解析邏輯。
2. 只修改：src/components/InstitutionDashboard.jsx、src/utils/reconcile.js、
   reconcile.test.mjs、docs/reconciliation-rules.md。
3. 完成後逐條回報驗收條件，附測試輸出與 npm run build 結果。
```

## 任務 1（反饋 5，🔴 先修）：匯出崩潰修復
`exportExcel` 內有兩個缺陷：
a. 異常附表迴圈使用未宣告變數 → `ReferenceError` 使整個函式崩潰。
   修法：迴圈內補宣告 `let isError = false, errType = "", errMsg = "";`
   （每列重置，宣告在 forEach callback 內第一行）。
b. Sheet1 每列推入 12 個值（多了 `row.hoursDerived`），官方表頭僅 11 欄。
   修法：移除第 12 個值，**Sheet1 每列恰為 11 個值**。
c. 順手清理：`row.price || 0` 改為 price 缺值時不得進 Sheet1（待補價把關已存在，
   此為防禦）；`row.workerNatId || "待查"` 的 "待查" 不得寫入 Sheet1（同前）。

## 任務 2（反饋 1）：移除血壓/體溫
OCR mock 與步驟 2 確認表格移除 `bp`、`temp` 欄（含 confidence 對應鍵）。
核銷資料流不需生命徵象；家屬端顯示之生命徵象屬另一資料模型，不受影響。

## 任務 3（反饋 2）：移除單價與附表比對
- `reconcile.js`：移除 `priceWarning` 欄位與 BA_MAP 單價比對邏輯
  （BA_MAP 的 fallback 補價機制**保留**，僅移除「不符警示」）。
- UI 步驟 3 移除「⚠ 單價與附表不符」標示；異常附表移除「單價警示」分類。
- `reconcile.test.mjs` 同步移除 priceWarning 相關斷言。

## 任務 4（反饋 3）：移除 D2 計畫外服務分類
- `reconcile.js`：無對應排班的紙本列不再標 `D2`，改標
  `status:"no_schedule"`，**不列入核銷明細、不阻擋匯出**，
  於異常附表以「紙本無對應排班（請確認排班匯入是否完整）」列出。
  ——不做靜默丟棄：資料必須看得到，但不進入申報流程。
- 移除 D2 確認 modal（`d2ConfirmModal`、`submitD2Confirm`）與相關把關條件。
- 差異狀態圖例更新為：一致／D1 疑似未執行／D3 數量·時數差異／D4 項目差異。

## 任務 5（反饋 4）：D3/D4 督導裁決——採紙本 / 採系統
參考截圖之 radio 設計，D3 與 D4 列的督導處理區改為：
1. **裁決 radio（必選）**：`○ 採紙本`｜`○ 採系統`，**預設「採紙本」**
   （紙本實績原則），可切換。選項旁保留原備註輸入框（選填）。
2. 資料：`row.decision = "paper" | "system"`（預設 "paper"）。
3. **匯出值依裁決解析**：decision==="paper" → qty/price/時段取紙本值；
   ==="system" → 取排班值（D4 之 code 亦同：採系統時輸出排班原碼）。
   實作為純函式 `resolveRow(row) → 官方11欄值`，置於 reconcile.js 並 export，
   exportExcel 呼叫之。
4. 把關更新：匯出條件 = 無未註記 D1 且無缺時段（D3/D4 因有預設值不阻擋）。
5. 異常附表的 D3/D4 列加「裁決」欄（採紙本/採系統）。
6. `reconcile.test.mjs` 新增 2 案：D3 採系統 → 解析值=排班；D4 採紙本 → code=紙本。
7. `docs/reconciliation-rules.md` 更新：處理原則由「一律以紙本為準」改為
   「督導逐筆裁決，預設採紙本」，並標註「⚠️ 需 CMS Rules Specialist 簽核」。

## 任務 6（反饋 7）：OCR 頁上傳照片
步驟 2 的「紙本照片預覽區」升級：
1. 區塊內加主按鈕：📷 `上傳紙本照片`（`<input type="file" accept="image/*" capture="environment">` 隱藏觸發）。
2. 選檔後以 `URL.createObjectURL(file)` 於預覽區實際顯示照片
   （純前端即可運作，無需後端）；再點可更換。
3. 照片就位後顯示提示：`已載入照片 · 點擊「載入 OCR 模擬資料」進行辨識（辨識引擎示意）`
   ——demo 口徑維持「模擬輸出」。
4. 未選照片時維持現有雲朵佔位圖＋文字「紙本照片預覽區」。

## 任務 7（反饋 6）：個案連動管理——居服紀錄同步示意
「個案連動管理」頁，已連動個案（王奶奶）列新增可展開區塊：
1. 展開標題：`本月已確認服務紀錄（來源：月底核銷流程）`。
2. 內容：讀取核銷流程的 `reconciledData` 中 status ∈ {ok, D3, D4} 的列
   （即督導已確認之紙本實績），以精簡表呈現：日期／BA碼／數量／時數。
3. 若 `reconciledData` 為空（尚未跑核銷）→ 顯示引導：
   `尚無已確認紀錄——請先於「月底核銷作業」完成紙本比對`
   ＋按鈕〔載入示範紀錄〕（載入 4 筆與核銷 mock 相同之紀錄）。
4. 區塊底部：〔推送至家屬端〕按鈕（沿用現有 toast 機制，顯示實際筆數）
   ＋機制說明小字（一字不差）：
   `督導於核銷流程確認的紙本實績，即為家屬端「居服紀錄」的資料來源——一筆紀錄，三種價值。`

## 驗收條件
- [ ] 匯出點擊即下載 xlsx；Sheet1 恰 11 欄、每列 11 值、無 undefined/"待查"/多餘欄
- [ ] `node reconcile.test.mjs` 全過（含裁決解析新案例，無 priceWarning/D2 斷言）
- [ ] 步驟 2 表格無血壓/體溫欄；可實際選照片並於預覽區顯示
- [ ] D3/D4 列有採紙本/採系統 radio（預設採紙本）；切採系統後匯出值＝排班值
      （開檔驗證 BA02 列：採系統時數量=1）
- [ ] 無對應排班之紙本列出現於異常附表、不在核銷明細、不阻擋匯出
- [ ] 個案連動頁可展開已確認紀錄、空狀態引導正確、推送 toast 筆數正確
- [ ] `npm run build` 通過、console 無 error
- [ ] PR 標註「⚠️ 需 CMS Rules Specialist 簽核：採紙本/採系統裁決原則（預設採紙本）」
