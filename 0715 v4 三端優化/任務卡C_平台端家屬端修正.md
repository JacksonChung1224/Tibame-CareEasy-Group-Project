# 任務卡 C｜試算平台端 + 家屬端修正（審視項 1–5）
> 優先級：🔴 本週｜需 Specialist 驗證：否（不涉金額計算與法規數字）
> 可直接複製本卡全文給開發模型執行。

```
【全域規則 — 必須遵守】
1. 禁止修改 careData.js 費率與等級邏輯、signalEngine.js、reconcile.js。
2. 不得改動任何補助金額數字與既有免責文案（移除整個區塊除外，見任務 2b）。
3. 不新增 npm 套件。只修改本卡列出的檔案。
4. 完成後逐條回報驗收條件，附 npm run build 結果。
```

## 修改檔案
`src/app/calculator/page.js`、`src/utils/partnerData.js`、
`src/components/PartnerServiceCard.jsx`、`src/components/SubsidyCalculator.jsx`、
`src/components/ResultTable.jsx`、`src/components/FamilyDiaryV3.jsx`、
`src/app/diary/page.js` 或 V3 header（任務 1 統一入口）

## 任務 1（審視項 1）：全站回三端首頁
1. `/calculator` header 的品牌區（HeartHandshake logo + 「照護一點通」文字）
   整組包 `<Link href="/">`，hover 加 cursor-pointer。
2. `/calculator` 的 start 分頁最上方加文字連結：`← 回照護一點通首頁`（導向 `/`）。
3. 同樣把品牌區回首頁行為加到家屬端（V3 header 的「照護一點通 · 家屬端」字樣）
   與機構端（InstitutionDashboard header 品牌區）——三端行為一致。

## 任務 2（審視項 2）：四包錢管道連結修正
修改 `src/utils/partnerData.js`：
a. **喘息服務（respite）**：保留 `tel:1966`，但 label 改為
   `撥打 1966 申請喘息服務（市話/手機直撥）`。
   同時修改 `PartnerServiceCard.jsx`：`ctaType==="phone"` 的按鈕點擊時，
   除觸發 tel: 外，同步 `navigator.clipboard.writeText("1966")` 並將按鈕文字
   短暫改為「✓ 號碼已複製：1966」2 秒（解決電腦版點擊無反應問題）。
   按鈕下方固定顯示小字：`電腦版用戶請直接以電話撥打 1966`。
b. **交通接送（transport）**：`GOV_CHANNELS.transport` 整個移除
   （或設 `hasChannel:false`），UI 對 transport 不再渲染任何申請管道區塊。
   PACKAGE_DETAILS 的交通接送說明文字不動。
c. **照顧及專業服務（care）與輔具（aids）**：新增/改為外部連結管道：
   ```js
   { label: "前往合作廠商服務網頁", ctaType: "link",
     ctaValue: "https://ltc.jubo-care.com/longtermcarehomepage" }
   ```
   渲染為 `<a target="_blank" rel="noopener noreferrer">`，
   點擊時保留 `trackPartnerClick({ packageId, channel:"partner", brand:"jubo", ... })`。

## 任務 3（審視項 3）：照護日誌入口搬家 + 說明彈窗
1. **移除** `ResultTable.jsx` 底部現有的 📓 CTA 卡（約 103–113 行）。
2. `SubsidyCalculator.jsx` 中，於「四包錢明細」（第一個 ExpandablePackage）
   **上方**插入 CTA 卡（沿用原 rose 視覺）：
   標題「📓 試算之後，下一步是每天的照顧」
   副文「照護日誌：每天 10 秒記錄長輩狀況，AI 幫您留意變化。」
   點擊 → **開啟說明彈窗（不直接跳轉）**。
3. 新增 `DiaryIntroModal`（元件內部即可，沿用現有 modal 版型，禁用 window.confirm）：
   ```
   標題：照護日誌能幫您做什麼？
   內容（逐條列出，含 icon）：
   ⏱ 每天 10 秒完成 — 點選「嗆咳、睡不好」等快速標籤即可，不必打字
   🔍 AI 幫您留意 — 自動比對近 14 天紀錄，發現惡化徵兆主動提醒
   🏥 一鍵就醫摘要 — 看診前把觀察整理成醫師 30 秒能讀完的摘要
   🏢 連動居服機構 — 輸入機構邀請碼，直接查看居服員服務紀錄與額度
   🔒 隱私保障 — 您的日誌只有您看得到，機構無法查看
   按鈕：〔開始使用照護日誌〕→ router.push("/diary")／〔稍後再說〕關閉
   ```
   文案一字不差照上方使用。

## 任務 4（審視項 4）：等級鎖定
`SubsidyCalculator.jsx`：
1. 移除 2–8 級可點選按鈕列，改為唯讀顯示：
   `CMS {level} 級`大字 badge + 小字 `依您的評估結果帶入`。
2. badge 旁提供文字連結 `重新評估`：呼叫父層傳入的 `onRestart` prop
   （`calculator/page.js` 傳入 `() => setTab("quiz")`；若既有守衛邏輯
   需重置 calcLevel，一併重置並回報做法）。
3. `initLevel` 為 null 的防禦：顯示「請先完成失能評估」+ 回 quiz 按鈕
   （正常流程因步進器守衛不會發生，此為防禦線）。

## 任務 5（審視項 5）：移除家屬端「預估額度」
`FamilyDiaryV3.jsx`：
1. 刪除 `QuotaEstimatePanel` 元件、`TABS_SOLO` 的 quota 項
   （solo 回到 2 tabs：照護日誌 / AI 分析）、
   `SOLO_CASE` 的 `estimatedCmsLevel`、`estimateSource` 欄位。
2. solo 模式下 quota tab 的渲染分支整段移除；確認 `validTab` fallback
   在 connected→solo 切換時不會停留在已不存在的 tab。
3. Connected 模式的額度 tab **完全不動**。

## 驗收條件
- [ ] 三端 header 品牌區點擊皆回 `/`；/calculator start 頁有「← 回照護一點通首頁」
- [ ] 喘息按鈕電腦版點擊顯示「✓ 號碼已複製：1966」；下方有電腦版提示小字
- [ ] 交通接送不再顯示任何申請管道；照顧服務與輔具的管道連結開新分頁至
      ltc.jubo-care.com，且 partner_clicks 有寫入（console 無錯即可）
- [ ] ResultTable 底部無日誌 CTA；補助試算的四包錢明細上方有 CTA →
      點擊出說明彈窗 → 〔開始使用〕導向 /diary
- [ ] 補助試算等級為唯讀 badge，無法點選其他級；「重新評估」回 quiz
- [ ] /diary solo 模式僅 2 tabs；connected 模式 4 tabs 且額度 tab 正常
- [ ] `npm run build` 通過、全程 console 無 error
