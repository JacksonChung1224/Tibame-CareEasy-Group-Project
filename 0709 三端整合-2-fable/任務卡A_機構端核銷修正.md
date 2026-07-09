# 任務卡 A｜機構端核銷修正：兩輪配對演算法 + 匯出分表 + 金額欄
> 優先級：🔴 M3 前（7/15）｜需 Specialist 驗證：是（D3/D4「以紙本為準」原則 + 計價單位）
> 可直接複製本卡全文給開發模型執行。

```
【全域規則 — 必須遵守】
1. 禁止修改 careData.js 內任何費率數字與等級判定邏輯、signalEngine.js 規則閾值。
2. 涉及金額/法規文案的變更，PR 標註「⚠️ 需 CMS Rules Specialist 驗證」，不可自行 merge。
3. 金額文案一律使用「最高」；核銷相關保留「以衛福部申報為準」。
4. 不新增任何 npm 套件。
5. 只修改本卡列出的檔案。完成後逐條回報驗收條件通過/未通過，附 npm run build 結果。
```

## 背景（為什麼要改）
現行 `InstitutionDashboard.jsx` 的 `confirmOcrImport` 有兩個缺陷：
- **缺陷一**：配對條件只有 `caseId + date`，未含 BA 碼。同案同日多筆服務
  （如同一次到宅 BA02+BA03+BA07）會被任意配對，產生假 D3/D4。
- **缺陷二**：D1「疑似未執行」列被匯進「核銷報表」sheet，帶著 BA 碼與時數，
  等同把未執行服務送入申報（溢報風險），違反「以紙本實績為唯一申報基準」。
另外核銷報表缺金額欄（單價/小計/合計），本卡一併補上。

## 修改檔案
1. `src/components/InstitutionDashboard.jsx`（改）
2. `src/utils/reconcile.js`（新增 — 純函式比對引擎）
3. `reconcile.test.mjs`（新增 — 根目錄，node 直接可跑，格式仿 signalEngine.test.mjs）
4. `docs/reconciliation-rules.md`（新增 — 規則文件，內容見附錄）

## 任務 1：抽出純函式比對引擎 `src/utils/reconcile.js`

實作並 export：
```js
/**
 * reconcile(csvRows, ocrRows) → { rows, summary }
 * csvRows: [{ id, date, caseId, worker, code, hours }]
 * ocrRows: [{ id, date, caseId, code, hours, ... }]
 * rows: 比對結果列（結構見下）
 * summary: { ok, d1, d2, d3, d4 } 各狀態筆數
 */
export function reconcile(csvRows, ocrRows) { ... }
```

**兩輪配對演算法（必須完全照此實作）**：

```
usedCsv = Set(); usedOcr = Set(); rows = []

── 第一輪：精確鍵配對（caseId + date + code）──
for csv of csvRows:
  match = ocrRows 中第一筆滿足
          !usedOcr.has(o.id) && o.caseId===csv.caseId
          && o.date===csv.date && o.code===csv.code
  if match:
    usedCsv.add(csv.id); usedOcr.add(match.id)
    if parseFloat(csv.hours) === parseFloat(match.hours):
      push { status:"ok",  code:match.code, hours:match.hours, source:"ocr_confirmed" }
    else:
      push { status:"D3",  code:match.code, hours:match.hours,   // 以紙本為準
             csvHours:csv.hours, note:`原時數: ${csv.hours}h`, source:"ocr_confirmed" }

── 第二輪：同日碼不符配對（caseId + date，且雙邊剩餘各恰好一筆才配）──
for 每個 (caseId, date) 組合:
  leftCsv = 該組合中未用的 csvRows
  leftOcr = 該組合中未用的 ocrRows
  if leftCsv.length === 1 && leftOcr.length === 1:
    usedCsv.add; usedOcr.add
    push { status:"D4", code:leftOcr[0].code, hours:leftOcr[0].hours,  // 以紙本為準
           csvCode:leftCsv[0].code, note:`原排班: ${leftCsv[0].code}`,
           source:"ocr_confirmed" }
  // 剩餘 ≥2 筆時「不猜」，留給收尾各自成 D1/D2（寧可多兩筆異常，不做錯誤配對）

── 收尾 ──
未用 csvRows → push { status:"D1", source:"csv", note:"" }        // 疑似未執行
未用 ocrRows → push { status:"D2", source:"ocr_confirmed",
                      worker:"待查", d2Confirmed:false }           // 計畫外服務
```

每列輸出必含：`id, date, caseId, worker, code, hours, status, source, note`
（D3 另含 csvHours、D4 另含 csvCode）。

## 任務 2：`InstitutionDashboard.jsx` 接上新引擎並修匯出

1. 刪除 `confirmOcrImport` 內的舊配對邏輯，改呼叫 `reconcile(importedData, ocrData)`。
   OCR confidence 檢查（<0.85 阻擋）維持原樣，放在呼叫 reconcile 之前。
2. **匯出改為兩張 sheet**：
   - Sheet「核銷明細」：僅含 `status ∈ {ok, D3, D4}` 與 `status==="D2" && d2Confirmed===true` 的列。
     欄位：日期、個案代號、居服員、BA碼、服務名稱、時數、**單價、小計**、
     差異類型、督導處理註記、資料來源。
   - Sheet「異常附表」：僅含 D1 列。欄位：日期、個案代號、居服員、BA碼、
     排班時數、督導處理註記（=未執行原因）。**D1 永不出現在「核銷明細」。**
3. **金額欄**：`import { BA_MAP } from "@/utils/careData"`。
   - 單價 = `BA_MAP[code]?.price`；小計 = 單價（BA 碼為按次計價，時數僅供稽核參考）。
   - **code 不在 BA_MAP 時**（如 BA08）：單價與小計顯示「待補價」，
     該列於 UI 標註「碼未列價，匯出前需人工補價」，且列於核銷明細時
     在「督導處理註記」自動附加「(金額以最新公告為準)」。
   - 核銷明細 sheet 末列加「合計」：所有可計價列之小計加總。
4. 匯出把關維持：存在未註記 D1 或未確認 D2 時，匯出按鈕 disabled 並顯示未結案筆數。
5. 步驟 3 的 UI 表格同步顯示單價/小計欄與五色狀態標記（沿用現有配色）。

## 任務 3：更新 mock 資料（必須含多服務日，作為哨兵案例）

`loadMockData` 的排班（CSV）改為：
```
6/25 A141408XXX BA02 1    ｜ 6/25 A141408XXX BA03 0.5
6/26 A141408XXX BA05 1    ｜ 6/27 A141408XXX BA02 1.5
6/27 A141408XXX BA07 1    ｜ 6/28 A141408XXX BA04 1
```
OCR mock 改為（confidence 結構維持現制，o2 的 temp、o3 的 code 維持低信心示範）：
```
6/25 BA02 1（OK）｜ 6/25 BA03 0.5（OK）
6/27 BA02 1（D3：排班1.5）｜ 6/27 BA07 1（OK）
6/28 BA07 1（D4：排班BA04）｜ 6/29 BA05 1.5（D2）
```
預期結果：**OK×4、D1×1（6/26 BA05）、D2×1、D3×1、D4×1**。

## 任務 4：`reconcile.test.mjs`（至少 7 案例）

1. 哨兵案例：6/25 同日兩筆（BA02+BA03）→ 兩筆皆 OK、零 D3/D4
   （舊演算法在此會產生假差異，此案例防止回歸）
2. 完整 mock → summary 恰為 {ok:4, d1:1, d2:1, d3:1, d4:1}
3. D3：同鍵時數不符 → 以紙本時數為準、csvHours 保留
4. D4：同日剩餘各一筆碼不符 → 以紙本碼為準、csvCode 保留
5. 同日剩餘 2:1（不猜）→ 不產生 D4，各自成 D1/D2
6. 空 OCR → 全部 D1；空 CSV → 全部 D2
7. hours 型別容錯："1.5"（字串）與 1.5（數字）視為相同

## 驗收條件
- [ ] `node reconcile.test.mjs` 全數通過
- [ ] `npm run build` 通過
- [ ] UI 手測：載入新 mock → 步驟 2.5 確認 → 步驟 3 顯示 4🟢1🔴1🟠1🟡(D3)1🟡(D4)
- [ ] D1 未註記時匯出按鈕 disabled；註記後匯出 → 開啟 xlsx 確認 D1 只在「異常附表」
- [ ] 核銷明細含單價/小計/合計；BA08 之類未列價碼顯示「待補價」不顯示 0
- [ ] PR 標註「⚠️ 需 CMS Rules Specialist 驗證：D3/D4 以紙本為準原則、BA 碼按次計價之小計邏輯」

## 禁止
- 不得修改 careData.js（含不得自行把 BA08 加進 BA_MAP——是否列碼由 Specialist 裁定）
- 不得改動 OCR confidence 檢查邏輯與 ocrPostprocess.js

---
## 附錄：docs/reconciliation-rules.md 內容（原樣寫入該檔）

# 機構端差異比對規則 v2
比對引擎：`src/utils/reconcile.js`（兩輪配對）。回歸測試：`reconcile.test.mjs`。

| 代碼 | 判定 | 情境 | 處理 | 是否列入核銷明細 |
|---|---|---|---|---|
| OK | 第一輪鍵全符、時數同 | 排班=紙本 | 直接列入 | ✅ |
| D3 | 第一輪鍵全符、時數異 | 時數差異 | 以紙本時數為準，註記排班原值 | ✅ |
| D4 | 第二輪同日剩餘各一筆 | 項目差異 | 以紙本碼為準，註記排班原碼 | ✅ |
| D2 | 紙本有、排班無 | 計畫外服務 | 督導確認後列入 | ✅（確認後） |
| D1 | 排班有、紙本無 | 疑似未執行 | 督導必填原因 | ❌ 永不列入，僅入異常附表 |

原則：以「紙本實績」為唯一申報基準；同日剩餘雙邊各 ≥2 筆時不做推測配對，
寧可各自成 D1/D2 交人工。⚠️ D3/D4「以紙本為準」與按次計價小計，需 CMS Rules Specialist 簽核。
