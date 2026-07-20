# 任務卡 K｜AI 就醫摘要真實化（Claude API・server route・自動 fallback）
> 優先級：🟡 選配（僅在 7/21 排練順利且有半天餘裕時執行；否則列決賽後首週）
> 架構定位：LLM 只負責「語意層」（把資料寫成人話）；訊號與閾值仍由
> 規則引擎產生——LLM 永不產生訊號、永不下判斷。

```
【全域規則 — 必須遵守】
1. 遵守 CLAUDE.md。禁止修改 signalEngine.js 任何邏輯。
2. 修改檔案僅限：src/app/api/summary/route.js（新增）、
   src/components/FamilyDiaryV3.jsx（僅就醫摘要區塊）。
3. API 金鑰僅存於環境變數（Gemini_API_KEY），禁止出現在前端程式碼。
4. 完成後逐條回報驗收條件，附 npm run build 結果。
```

## 任務 1：server route `/api/summary`
POST 接收 `{ signals, recentLogs, workerObs }`（前端整理好的結構化資料，
**不含**姓名、身分證等識別資料）。呼叫 Gemini Messages API
（model: gemini-3.5-flash，max_tokens 500），system prompt 固定：
```
你是照護摘要助手。僅根據提供的結構化資料，以台灣繁體中文撰寫一段
醫師 30 秒內可讀完的就醫摘要。規則：
1. 只能陳述資料中存在的觀察，禁止推測診斷、禁止新增資料中沒有的事件。
2. 結構：近況一句 → 需優先確認項（引用日期）→ 請醫師留意項。
3. 結尾固定加註：「本摘要為家屬觀察彙整，非醫療診斷。」
4. 全文不超過 150 字。
```
回傳 `{ summary, source: "ai" }`；任何錯誤（逾時 8 秒、非 200、金鑰缺失）
→ 回傳 `{ summary: null, source: "fallback" }`，**不對外拋錯**。

## 任務 2：前端接線與 fallback
就醫摘要區塊「產生就醫摘要」點擊時：
1. 顯示 loading 文字（`AI 整理中…`，保留版面高度）。
2. 呼叫 `/api/summary`；`source==="ai"` → 顯示 AI 摘要，
   標註小字 `由 AI 依觀察紀錄彙整`；
   `source==="fallback"` 或逾時 → **無縫顯示現有模板摘要**（現行程式碼
   原樣保留為 fallback 函式），不顯示任何錯誤訊息。
3. 免責句「本分析為 AI 觀察彙整，非醫療診斷」維持顯示。

## Demo 保險（寫入 demo 腳本備註）
- 排練時先跑一次真實呼叫並截圖留存；正式 demo 若網路不穩，
  fallback 會自動接手，口白不需更動（兩種輸出都成立）。
- `.env.local` 的金鑰不進版控（確認 .gitignore）；Vercel 環境變數另行設定。

## 驗收條件
- [ ] 正常路徑：回傳 AI 摘要、含固定結尾加註、≤150 字、無資料外事件
- [ ] 拔掉金鑰／斷網模擬 → 無縫顯示模板摘要、console 無未捕捉錯誤
- [ ] DevTools 確認前端請求不含金鑰、payload 不含個人識別資料
- [ ] 三端 smoke；`npm run build` 通過
