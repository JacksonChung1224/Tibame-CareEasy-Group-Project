# 任務卡 E v2｜機構端官方核銷格式對接（依 衛福部TEST.xls 實測定版）
> 取代 v1。優先級：🔴｜需 Specialist 驗證：是（計價、自費類別、單價警示原則）
> 本卡欄位與 mock 資料均由官方檔 `衛福部TEST.xls` 程式化讀取確認（含表頭字色），
> 執行模型不需再向 Jackson 索取原檔，照本卡即可。

```
【全域規則 — 必須遵守】
1. 禁止修改 careData.js 的 BA_MAP 費率數字（僅供比對，不得因檔案不符而改資料）。
2. 涉及計價/合計邏輯，PR 標註「⚠️ 需 CMS Rules Specialist 驗證」。
3. 不新增 npm 套件（SheetJS 已在依賴中）。
4. 只修改本卡列出的檔案。完成後逐條回報驗收條件，附測試輸出與 build 結果。
```

## 官方格式實測結論（已程式化驗證，勿再猜測）
- 官方範本共 **33 欄**，其中**紅字（核銷必要）恰為前 11 欄**；
  第 12–33 欄（備註、服務人員身分證2–5、AA09、訪視未遇、C 碼復能欄組、
  OT01 餐別、BD03/DA01 交通欄組）為黑字，**本專案一律忽略：
  匯入時不解析、匯出時不產生**。
- 表頭在**第 1 列**（無前置說明列）。
- 計價邏輯確認：小計 = 單價 × 數量（整數）；時數由時段推導、僅稽核參考。

**紅字 11 欄的精確表頭字串（含儲存格內換行 `\n`，匯出必須一字不差）**：
```js
export const OFFICIAL_HEADERS = [
  "身分證字號",
  "服務日期(請輸入7碼)",
  "服務項目代碼",
  "服務類別\n1.補助\n2.自費",
  "數量\n(僅整數)",
  "單價",
  "服務人員身分證",
  "起始時段-小時\n(24小時制)",
  "起始時段-分鐘",
  "結束時段-小時\n(24小時制)",
  "結束時段-分鐘",
];
```

## 修改檔案
1. `src/utils/scheduleImport.js`（新增 — 純函式匯入解析器，OFFICIAL_HEADERS 定義於此）
2. `src/utils/reconcile.js`（改 — 欄位模型升級）
3. `src/components/InstitutionDashboard.jsx`（改 — 真實上傳 + mock + 匯出）
4. `reconcile.test.mjs`（改）＋ `scheduleImport.test.mjs`（新增）

## 任務 1：`scheduleImport.js` 純函式解析器（審視項 7）
```js
/**
 * parseScheduleSheet(rows2D) → { rows, errors }
 * rows2D: XLSX.utils.sheet_to_json(ws, { header:1 }) 之二維陣列
 */
```
規則：
1. **表頭偵測**：自上而下找含「服務項目代碼」的列（比對前移除空白與換行）。
2. **欄位對映**：以「移除空白換行後包含關鍵字」比對前 11 欄 →
   `caseNatId, dateROC, code, category, qty, price, workerNatId, startH, startM, endH, endM`；
   **第 12 欄以後全部忽略**。
3. 標準化列結構：
   ```js
   { caseNatId, dateROC:"1150301", code:"BA15-1", category:1|2, qty:1,
     price:50|null, workerNatId, startH, startM, endH, endM,
     hoursDerived:(endH*60+endM-startH*60-startM)/60 }
   ```
   注意：dateROC 讀入時可能為數字型別（xls 儲存 1150301 為 number），
   一律轉為 7 碼字串再驗證。
4. 驗證（不合格列進 errors，不中斷整批）：dateROC 7 碼且月日合法；
   qty 正整數；category ∈ {1,2}；時段合法且結束 > 起始；price 允許空值 null。
5. **code 不做白名單校正**（BA15-1、CA01、OT01 等原樣保留；
   白名單校正僅屬 OCR 後處理範疇）。
6. 缺必要欄（caseNatId/dateROC/code/qty）→ 整批失敗並回報缺欄清單。

## 任務 2：真實上傳（審視項 7）
1. 步驟 1 恢復 `<input type="file" accept=".xlsx,.xls,.csv">` →
   `XLSX.read(await file.arrayBuffer())` → 第一個工作表 → `parseScheduleSheet`。
2. 成功 → 以紅字 11 欄順序預覽 + 「共 N 筆，異常 M 筆」；errors 逐列列於
   警示區（列號＋欄位＋原因），異常列不進比對。整批失敗 → modal 列缺欄。
3. 「載入衛福部範本模擬資料」按鈕保留，內容改為任務 3。

## 任務 3：mock = 衛福部TEST.xls 實際資料（一模一樣，已實測讀出）
```
caseNatId    dateROC   code    category qty price workerNatId  start  end
A141408XXX   1150301   BA15-1  1        1   50    A123456789   9:30   10:30
A141408XXX   1150302   BA15-1  1        1   50    A123456789   11:30  12:30
A141408XXX   1150305   BA02    1        1   40    A123456789   12:30  13:00
A141408XXX   1150305   BA17e   1        1   30    A123456789   12:30  13:00
```
OCR mock 改為下列 4 筆（qty 欄補上；confidence 結構沿用現制，
自行保留 1–2 個低信心欄示範步驟 2.5）：
```
o1: 1150301 BA15-1 qty1 price50 → 預期 OK
o2: 1150305 BA02   qty2 price40 → 預期 D3（qty 不符，排班 1）
o3: 1150305 BA17e  qty1 price30 → 預期 OK
o4: 1150306 BA05   qty1 price310 → 預期 D2（排班無此筆）
（排班 1150302 BA15-1 無對應紙本 → 預期 D1）
```
**預期矩陣：OK×2、D1×1、D2×1、D3×1；D4 不在 mock 中出現，
由 reconcile.test.mjs 單元測試覆蓋（1150305 同日雙筆為兩輪配對的哨兵案例）。**

## 任務 4：reconcile.js 升級（審視項 9）
1. 比對鍵：`caseNatId + dateROC + code`（兩輪配對演算法不變）。
2. D3 判定：qty 不符（主）或 |hoursDerived 差| > 0.25h（僅稽核註記）；值以紙本為準。
3. 每列輸出新增 `qty, price, category, subtotal, priceWarning`：
   - `subtotal = price × qty`；price null 時：fallback `BA_MAP[code]?.price`，
     皆無 → subtotal null、UI 標「待補價」。
   - `priceWarning`：檔案單價與 `BA_MAP` 同碼單價不符 → true。
     **TEST 資料實測會觸發兩筆**：BA02（40 vs 附表 195）、BA17e（30 vs 附表 50）；
     BA15-1 不在 BA_MAP → 無比對基準、不警示。
     UI 標 `⚠ 單價與衛福部附表不符，請督導確認`，**不自動改值、不阻擋**。
4. `reconcile.test.mjs`：既有案例改用新欄位模型 + 新增 3 案
   （qty 不符→D3、price null→待補價、priceWarning 觸發與不觸發各一）。

## 任務 5：匯出（審視項 8，依紅字欄定版）
1. **Sheet1「核銷明細」＝紅字 11 欄，欄名一字不差使用 OFFICIAL_HEADERS
   （含 `\n` 換行）**，欄序固定，不加合計列、不加任何自訂欄。
   列 = OK / D3 / D4 / 已確認 D2，值以紙本為準（qty、price、時段），
   category 原樣傳遞。SheetJS 寫入含 `\n` 之表頭後，該列建議設
   wrap text（`!rows` 高度 + cell style；若 CDN 版不支援樣式則保留純文字，
   換行字元本身必須存在）。
2. **Sheet2「異常附表」**：D1 全列 + 差異類型 + 督導註記 +
   priceWarning 清單 + 待補價清單（此表為內部稽核用，欄位自訂）。
3. **UI 合計卡**（不進 xlsx）：補助小計（類別1）／自費小計（類別2）分列 + 總計
   + 待補價與單價警示筆數。
4. D1 永不入 Sheet1；未結案把關（D1 註記／D2 確認）維持。

## 驗收條件
- [ ] `node scheduleImport.test.mjs` 全過（≥6 案：正常、表頭含換行、缺欄整批失敗、
      日期非法入 errors、qty 小數入 errors、price 空值容許、
      **dateROC 數字型別轉字串**）
- [ ] `node reconcile.test.mjs` 全過
- [ ] **上傳真實 `衛福部TEST.xls` → 4 列全數正確解析**（第 12 欄後被忽略）
- [ ] 載入 mock → 三步跑完 → 步驟 3 呈現 OK×2、D1×1、D2×1、D3×1
- [ ] BA02 與 BA17e 兩列顯示單價警示且值未改；BA15-1 無警示
- [ ] 匯出 xlsx：Sheet1 表頭與 OFFICIAL_HEADERS 一字不差（含換行）、
      恰 11 欄、無 D1；Sheet2 含 D1 與稽核清單
- [ ] UI 有「數量」欄；時數標示「時段推導 · 稽核參考」；合計分補助/自費
- [ ] `npm run build` 通過
- [ ] PR 標註「⚠️ 需 CMS Rules Specialist 驗證：按次計價小計、
      自費(類別2)入核銷明細、單價不符僅警示不阻擋之原則」

## 禁止
- 不得將 TEST 檔單價（40/30 等）寫回 careData.js
- 不得對排班檔 code 做白名單強制校正
- Sheet1 不得出現第 12 欄以後的任何官方欄位或自訂欄位
