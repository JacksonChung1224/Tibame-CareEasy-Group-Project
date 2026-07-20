# 任務卡 J｜裁決交叉路徑金額落實（三缺陷修正）
> 優先級：🔴 立即（D1 採系統／no_schedule 採紙本的金額未正確入帳）
> 診斷方式：resolveRow 純函式實測**正確**，缺陷全在下游三處。

```
【全域規則 — 必須遵守】
1. 遵守 CLAUDE.md。修改檔案僅限：src/utils/reconcile.js、
   src/components/InstitutionDashboard.jsx、reconcile.test.mjs。
2. 完成後逐條回報驗收條件，附測試輸出與 npm run build 結果。
```

## 缺陷診斷（先讀懂再修）
- **缺陷 A（no_schedule 採紙本被無聲丟列）**：exportExcel 的 Sheet1 迴圈有
  `if (resolved.values[6] === "待查") return;`——no_schedule 列無排班對應，
  服務人員欄為 "待查"，整列被靜默跳過，Sheet1 與合計都少了它。
  同一迴圈的 `values[5] === null → return` 也是同型靜默丟列。
- **缺陷 B（合計卡過時）**：步驟 4 的 `validData` 過濾條件仍是
  `status ∈ {ok, D3, D4, D2&&confirmed}`——排除了 D1 採系統與
  no_schedule 採紙本，且引用已移除的 D2；加總用的 `row.subtotal`
  是 buildRow 時期的 base 側值，**未依裁決重算**（D3 採系統也會加錯邊）。
- **缺陷 C（每列顯示過時）**：步驟 3 表格的單價/小計顯示用
  `row.price / row.subtotal`，裁決切換後不會反映選定側（違反「所見即所出」）。

## 任務 1：reconcile.js 新增裁決後金額解析
```js
/** 裁決後金額：include!==true 回傳 null */
export function resolveAmount(row) {
  const r = resolveRow(row);
  if (r.include !== true) return null;
  const [ , , , category, qty, price ] = r.values;
  const subtotal = (typeof price === "number" && typeof qty === "number")
    ? price * qty : null;
  return { category, qty, price, subtotal };
}
```
`getExportBlockers` 擴充第五項 `missingWorker`：
include===true 但 values[6]（服務人員）為空或 "待查" 的筆數。

## 任務 2：no_schedule 採紙本補「服務人員」必填
紙本流（OCR）不含服務人員身分證，故 no_schedule 選「採紙本」時：
1. 裁決 radio 下方展開必填輸入框「服務人員身分證」
   （demo 預設帶 `A123456789`，可修改），值寫回 `row.workerNatId`。
2. 未填時列入 `missingWorker` 阻擋，匯出提示：`N 筆待填服務人員`。

## 任務 3：exportExcel 移除靜默丟列
Sheet1 迴圈刪除兩行靜默 `return`（"待查" 與 null 單價檢查）——
匯出放行條件已由 `getExportBlockers` 四＋一項把關
（undecided／missingReason／missingPrice／missingTime／missingWorker 皆 0），
放行後不存在需要跳過的列；若仍遇異常值，throw 明確錯誤而非靜默跳過。

## 任務 4：合計卡改為裁決感知（步驟 4）
```js
const amounts = reconciledData.map(r => resolveAmount(r)).filter(Boolean);
const subsidyTotal = amounts.filter(a => a.category === 1)
                            .reduce((s,a) => s + (a.subtotal || 0), 0);
const selfPayTotal = amounts.filter(a => a.category === 2)
                            .reduce((s,a) => s + (a.subtotal || 0), 0);
```
移除對 D2 的殘留引用；missingPrice／warning 計數同樣改由
resolveAmount／getExportBlockers 取得。

## 任務 5：步驟 3 每列顯示裁決感知
已裁決列的單價/小計顯示改用 `resolveAmount(row)`（null → 「不列入」灰字或
「待補價」）；未裁決列維持顯示雙側對照或 base 值＋「⚠ 待裁決」。
裁決 radio 切換時該列即時刷新。

## 任務 6：測試補強（reconcile.test.mjs 新增 3 案）
1. D1 採系統 → `resolveAmount` 回傳排班側 qty×price（本次 bug 的迴歸鎖）
2. no_schedule 採紙本＋已填服務人員 → include true、amount＝紙本側；
   未填服務人員 → `getExportBlockers.missingWorker === 1`
3. D3 採系統 → resolveAmount.subtotal＝排班側單價×數量（合計加對邊驗證）

## 驗收條件
- [ ] `node reconcile.test.mjs` 全過（含新 3 案）
- [ ] mock 流程：D1 選採系統＋no_schedule 選採紙本（填服務人員）→
      步驟 4 合計卡金額 = 手算值（兩筆都含入，補助/自費分類正確）
- [ ] **開匯出檔驗證**：兩筆皆出現在 Sheet1，服務人員欄為實填值非「待查」，
      單價/數量＝選定側
- [ ] no_schedule 採紙本未填服務人員 → 匯出 disabled 且提示筆數
- [ ] 步驟 3 切換任一列裁決 → 該列單價/小計即時變為選定側
- [ ] 三端 smoke；`npm run build` 通過
