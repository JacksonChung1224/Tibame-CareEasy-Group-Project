# 任務卡 E-Hotfix｜核銷匯出鏈修正（六項，端到端實測發現）
> 優先級：🔴 立即（官方申報檔目前缺必要欄位，demo 匯出功能不可用）
> 發現方式：以真實 `衛福部TEST.xls` 跑「匯入→配對→匯出」端到端，單元測試未覆蓋。

```
【全域規則 — 必須遵守】
1. 禁止修改 careData.js 費率。涉及計價 PR 標註「⚠️ 需 CMS Rules Specialist 驗證」。
2. 只修改：src/utils/reconcile.js、src/components/InstitutionDashboard.jsx、
   reconcile.test.mjs。完成後逐條回報驗收，附測試輸出與 build 結果。
```

## H1（🔴 致命）：匯出列的四個時段欄全部空白
**根因**：`reconcile.buildRow` 以紙本（ocr）為 base，但 OCR 資料模型沒有
`startH/startM/endH/endM` → 所有 ok/D3/D4/D2 列的時段為 undefined →
Sheet1 的四個紅字必要欄（起始/結束時段）整欄空白，官方申報檔不合格。
**修法**：
1. OCR mock 四列補上時段欄（值照排班同筆帶入；o4 D2 列自訂 14:00–15:00）。
2. 步驟 2.5 確認表格加入時段四欄（可編輯、含 confidence，預設 1）。
3. `buildRow` 時段改為 `ocr?.startH ?? csv?.startH ?? null`（四欄同式）——
   紙本有值用紙本，缺值退排班，皆無為 null 並於 UI 標「⚠ 缺時段」，
   缺時段列比照待補價：匯出前需人工補齊（把關條件加入）。

## H2（🔴）：單價警示比對錯對象
**根因**：`priceWarning` 比對的是**排班**價 vs BA_MAP，但匯出採用**紙本**價
→ 紙本價異常而排班價正常時漏警示；D2（無排班）永不警示。
**修法**：警示一律以「該列實際採用之價格」（即輸出的 price）比對
`BA_MAP[code].price`；D1 用排班價、其餘用紙本價。

## H3（🟠）：D2 的類別與服務人員寫死
**根因**：D2 無排班對應，`category` 預設 1（補助）、`workerNatId` 寫 "待查"
→ 計畫外服務一律被當「補助」申報、"待查" 字串會寫進官方檔的服務人員欄。
**修法**：D2 確認 modal 升級為必填兩項：服務類別（1.補助/2.自費 radio）
與服務人員身分證（文字欄，預設帶排班常見值 A123456789 供 demo）。
未填不得確認，確認值寫回該列。

## H4（🟠）：fallback 單價沒有回寫輸出欄
**根因**：price=null 時 subtotal 以 `BA_MAP` fallback 計算，但 `row.price`
仍為 null → Sheet1 單價欄空白、UI 合計卻有金額，兩者不一致。
**修法**：`row.price` 輸出實際採用價（含 fallback），並以
`priceSource: "sheet" | "ba_map_fallback" | null` 欄位註記來源；
fallback 列於異常附表加註「單價採衛福部附表預設值」。

## H5（🟡）：補齊缺漏測試
`reconcile.test.mjs` 新增四案：
1. D4 觸發（同日剩餘各一筆、碼不符 → 以紙本碼為準、csvCode 保留）
2. 同日剩餘 2:1 不猜（產出 D1×2 + D2×1，零 D4）
3. H1 迴歸：ok 列時段 = 紙本值；紙本缺時段 → 退排班值
4. H2 迴歸：紙本價 300／排班價 195（=附表）→ priceWarning true

## H6（🟡）：docs 未 commit
`docs/PROGRESS_TODO.md`（v4 內容）與 `docs/demo-script.md`（P0-1 產出後）
仍未入 repo——由 Jackson commit，非模型任務。

## 驗收條件
- [ ] `node reconcile.test.mjs` 全過（含新四案）
- [ ] 端到端：上傳 `衛福部TEST.xls` → 三步 → 匯出 → 開檔檢查
      Sheet1 每一列 11 欄**皆有值**（時段、單價、類別、服務人員無空白）
- [ ] D2 未填類別/服務人員時無法確認
- [ ] 紙本價異常列（BA02=40、BA17e=30）警示仍正確；模擬「紙本價異常＋
      排班價正常」一筆驗證 H2
- [ ] `npm run build` 通過
- [ ] PR 標註「⚠️ 需 CMS Rules Specialist 驗證：時段退排班值之原則、
      fallback 單價入申報檔之原則」
