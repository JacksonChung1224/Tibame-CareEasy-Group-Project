# 任務卡 M｜機構端裁決 UI 簡化（決賽前最後一張功能卡）
> 優先級：🔴 立即（10–20 分鐘小卡）

```
【全域規則 — 必須遵守】
1. 遵守 CLAUDE.md。修改檔案僅限：src/components/InstitutionDashboard.jsx、
   src/utils/reconcile.js（僅 missingWorker 邏輯）、reconcile.test.mjs。
2. 完成後逐條回報驗收條件，附測試輸出與 npm run build 結果。
```

## 任務 1：D3 移除手動輸入框
D3 列的督導處理區只保留「採紙本／採系統」radio；
移除備註輸入框（輸入不影響金額，造成誤會）。
差異資訊（如「排班數量: 1」）改為**唯讀灰字小標**顯示於狀態 badge 下方
（現有位置已有，確認保留即可）——督導看得到差異、但不會誤以為可輸入修改。
D4 比照辦理（僅 radio＋唯讀差異資訊）。
D1 的「未執行原因」輸入框**保留**（僅採紙本時必填，維持現制）。

## 任務 2：no_schedule 移除服務人員輸入
前提確認：本核銷頁面預設整批屬同一位照顧服務員。
1. 移除 no_schedule 採紙本時的「服務人員身分證」輸入框。
2. `workerNatId` 改為**自動帶入**：取本次匯入排班檔中的服務人員身分證
   （整批同一人；若排班檔含多位人員，取該列同日同案之人員，
   皆無則取排班檔第一筆之人員並於該列標唯讀小字「自動帶入」）。
3. `getExportBlockers.missingWorker`：僅在排班檔完全無任何服務人員
   資料時才觸發（理論上不會發生，保留為防禦）。

## 驗收條件
- [ ] D3/D4 列僅剩 radio＋唯讀差異小字，無任何輸入框
- [ ] no_schedule 採紙本 → 無輸入框、匯出檔該列服務人員欄＝排班檔人員值
- [ ] D1 採紙本原因必填機制不受影響
- [ ] `node reconcile.test.mjs` 全過（missingWorker 案例依新邏輯調整）
- [ ] 開匯出檔驗證 no_schedule 列服務人員非空、非「待查」
- [ ] 三端 smoke；`npm run build` 通過
