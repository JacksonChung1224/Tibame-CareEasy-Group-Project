# 任務卡 F1-Lite｜方案說明頁＋示意註冊（無金流・無真帳號）
> 優先級：🔴 UI 改版前執行（先邏輯後樣式）｜需 Specialist 驗證：否
> 執行順序：本卡 → UI-0 → UI-1/2/3（樣式卡會一併替 /plans 與註冊卡換裝）

```
【全域規則 — 必須遵守】
1. 遵守 CLAUDE.md 全部規則。禁止引入 Supabase Auth 或任何 auth 套件。
2. 修改檔案僅限：src/app/plans/page.js（新增）、src/components/FamilyDiaryV3.jsx、
   src/components/SubsidyCalculator.jsx（僅日誌 CTA 彈窗加一行連結）。
3. 完成後逐條回報驗收條件，附 npm run build 結果。
```

## 任務 1：/plans 靜態方案頁（同時是商業模式簡報素材）
新增 `src/app/plans/page.js`（'use client' 不必要，純靜態）：
- 頂部標語：`先安心使用，需要更多再升級`
- 兩欄方案卡（沿用現有卡片樣式即可，UI 卡之後統一換裝）：
  - 【免費版】`NT$0`：1 位被照顧者・日誌保存 90 天・AI 照護訊號・就醫摘要
    按鈕〔開始免費使用〕→ Link 至 `/diary`
  - 【進階版】`即將推出`：多位被照顧者・日誌無限保存・PDF 匯出・
    家屬多人共編・AI 週報。按鈕〔即將推出〕disabled。
- 頁尾小字：`方案內容以正式上線公告為準`；品牌區點擊回 `/`。

## 任務 2：示意註冊（純前端 state，零網路請求）
`FamilyDiaryV3.jsx`：
1. 新增 state `registered`（預設 false）。solo 且未註冊時，日誌 tab 頂部
   顯示引導卡：`建立帳號，開始記錄` ＋ email 輸入框 ＋〔開始使用〕：
   - 前端驗證 email 格式（正規表達式），不合法顯示錯誤文字。
   - 通過 → `registered=true` → toast `歡迎使用照護日誌`，
     header 顯示 email @ 前綴（如 `jackson`）。
2. **dev 切換器直接以 registered=true 進入**（排練與 demo 不被引導卡阻擋）。
3. 引導卡下方小字連結 `查看方案說明` → `/plans`。
4. 全程不得發出任何網路請求（DevTools Network 驗證）。

## 任務 3：試算端串接
`SubsidyCalculator.jsx` 的日誌 CTA 說明彈窗底部加小字連結
`查看方案說明 →`（開新分頁至 /plans）。其餘一字不改。

## 驗收條件
- [ ] /plans 正常渲染、兩方案內容一字不差、進階版按鈕不可點
- [ ] 未註冊 solo 顯示引導卡；email 格式錯誤有文字提示；註冊後功能與現況完全一致
- [ ] dev 切換器進入時不出現引導卡
- [ ] 示意註冊全程無網路請求（DevTools 確認截圖）
- [ ] 三端每 tab 點擊一輪無 error；`npm run build` 通過
