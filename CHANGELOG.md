# Changelog

本檔案記錄 **Care Easy 照護一點通** 長照補助試算平台的所有重要版本變更。

格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/)，
版本號遵循 [語意化版本 (Semantic Versioning)](https://semver.org/lang/zh-TW/)。

---

## 版本號規則（本專案約定）

- **主版號 (MAJOR)**：資料庫 Schema 不相容變動（例如刪除/重新命名 `assessment_records` 欄位、變更 `answers` JSONB 結構）、或核心演算法不相容的重大改寫。
- **次版號 (MINOR)**：新增功能、新增資料表欄位（向下相容）、補助費率年度更新、演算法調整。
- **修訂號 (PATCH)**：Bug 修正、UI 微調、文案修改。

---

## ⚠️ 特別記錄區塊（每次變更務必檢查）

以下兩類變更具有法規與資料一致性風險，異動時務必在對應版本中明確標註：

- **🗄️ Schema 變更**：`assessment_records` 的欄位（尤其 `answers` JSONB 結構）一旦變動，會影響未來 AI 模型訓練資料的一致性。請在該版本下以 `### 🗄️ Schema` 區塊記錄，並標明 Schema 版本號。
- **💰 補助費率變更**：`careData.js` 內的費率屬於法規性資料，每年更新。請以 `### 💰 補助費率` 區塊記錄，並**明確標註對應年度**，避免日後試算結果對不上。

---

## [Unreleased]

### Added
- 🚀 **機構端核銷修正 (任務卡 A)**：
  - **核心重構**：抽離 `src/utils/reconcile.js` 純函式兩輪配對比對引擎，徹底解決同案同日多筆服務時的假異常問題。
  - **單價小計補齊**：掛載 `BA_MAP` 金額，於步驟 3 及匯出報表自動填入「單價」、「小計」與「合計」。
  - **D1 分流隔離**：D1（疑似未執行）的異常資料獨立匯出至「異常附表」，徹底與「核銷明細」切開以避免溢報風險。
  - ⚠️ 需 CMS Rules Specialist 驗證：D3/D4「以紙本為準」原則，以及 BA 碼按次計價之小計邏輯。

### Changed
- 💰 重評文案改為行動引導版（P0-3 Item 6，依 FILLED 清單）✅已驗證
- 💰 身分別加註「以照管中心核定為準」（Item 1）✅已驗證
- 💰 外看空窗期例外揭露（Item 3）✅已驗證
- 💰 BA08/BA09/BA09a 高風險碼加「金額以最新公告為準」免責（Item 5）⏳待 Specialist 最終簽核

---

## [3.0.0] - 2026-07-09

> 🎉 三端整合大改版：正式將「家屬端」、「機構端」、「試算平台」合而為一。

### 💰 補助費率
- **法規依據更新**：全面查證並對齊《長期照顧服務申請及給付辦法》最新版（114 年 6 月 19 日衛部顧字第 1141961114 號令修正，長照 3.0 版）。
- **生效狀態**：三階段施行日（114/9/1、115/1/1、115/7/1）於本次查證日 (2026-07-09) 均已全部生效。
- **身分別名稱改制**：對外文件用語變更為「第一類／第二類／第三類」。且釐清列冊中低收入戶的照顧及專業服務實質負擔比率為 0%（第一類）。
- **外看 30% 額度限制**：明定外籍看護家庭之 30% 額度不可用於居家照顧服務（BA 碼）。
- **BA 碼單價換版**：紀錄指出 BA08、BA09、BA09a 已於 115/1/1 換版生效，為潛在影響系統金額的項目，已標記需優先人工複核。

### Added
- 🚀 **[P2-3] 機構端差異標記規則表 (Reconciliation Engine)**：
  - 新增 `docs/reconciliation-rules.md` 規則文件，明訂 `D1(疑似未執行)`、`D2(計畫外服務)`、`D3(時數差異)`、`D4(項目差異)` 及 `OK` 的處理原則與 Mock 範例。
  - 將機構端流程重構為：1. 匯入排班 → 2. OCR 結果確認 → 3. 個案紙本對帳比對室 → 4. 匯出核銷。
  - **D1/D2 防呆卡控**：若有未填寫「督導註記」的 D1 或未點擊「確認可核銷」的 D2，系統將阻擋匯出並提示未結案筆數。
  - ⚠️ 需 CMS Rules Specialist 驗證 D3/D4『以紙本為準』原則。
- 🚀 **[P2-1] OCR: Human-in-the-loop 確認流程**：
  - 在機構端加入「步驟 2.5：OCR 結果確認」。
  - 實作防呆機制：低於 0.85 信心度的辨識結果將標示為黃色背景及警告圖示，強制管理員逐一 `Focus` 或修改後才允許匯入，阻絕錯誤資料流入核銷階段。
  - Excel 核銷匯出時新增 `資料來源` 欄位，標註該資料來自 `CSV 排班系統` 或 `OCR 掃描 (已確認)`。
- 🚀 **首頁三入口重構 (Landing Page)**：
  - 新增包含「試算補助」、「我是家屬」、「我是機構」三個入口卡片的首頁 (`src/app/page.js`)，作為完整的三端樞紐。
- 🚀 **機構端雛形實作 (Institution Dashboard)**：
  - 將原有的機構端 Alpine.js 原型全面改寫為純前端 React Component (`src/components/InstitutionDashboard.jsx`)，建立於 `/institution` 路由，支援排班計畫載入與紙本對帳室模擬，並整合 `xlsx` 套件提供核銷報表匯出功能。
- 🚀 **家屬端照護日誌升級 (FamilyDiaryV3)**：
  - **邀請碼連動流程**：新增與機構端連動的 UI 骨架，輸入邀請碼後可切換至 `connected` 模式查看居服員紀錄。
  - **快速標籤 (Chips)**：取代純自由文字，支援「嗆咳、吃得少」等結構化標籤複選，大幅降低輸入摩擦。
  - **Solo 模式強化**：未連動時也可查看「預估額度」分頁，增強獨立使用的價值。
- 🤖 **AI 訊號規則引擎 (`signalEngine.js`)**：
  - 導入資料驅動的純規則引擎（非 ML），從家屬與居服員雙邊日誌抓取惡化訊號（如吞嚥、血壓趨勢）。
  - 當出現兩端一致的紅色訊號時，觸發「建議提前重評」提醒，閉合飛輪流程。
- ⚙️ **OCR 後處理校正層 (`ocrPostprocess.js`)**：為機構端紙本辨識預先實作 BA 碼白名單與數值範圍校正邏輯。
- 🚀 **新增「四包錢可展開」與「單一企業白標導流」功能**：為 B2B 商業模式提供強大的擴展性與議價籌碼。
  - **白標與合作設定 (`src/utils/partnerData.js`)**：集中管理合作企業的設定（品牌名稱、主色、白標模式切換）與四包錢的法規明細。支援將平台直接「換皮」為單一企業服務。
  - **點擊成效追蹤 (`src/utils/trackPartnerClick.js`)**：在使用者點擊「企業服務」或「政府管道」時，於背景無痛（Fire-and-Forget）寫入追蹤記錄，作為未來與企業洽談合約的數據支撐。
  - **全新元件 (`ExpandablePackage.jsx`, `PartnerServiceCard.jsx`)**：實作流暢的明細展開動畫，並依據企業是否提供該包錢的服務，自動切換顯示「企業專屬導流卡片」或「中立政府管道卡片」。
  - **合規免責與個資宣告**：於明細底端宣告平台定位為「資訊揭露與導流」，並清楚標示點擊統計不含個資、試算僅供參考，避免觸碰法規紅線。
- 🚀 **新增報表匯出專用後台 (`/admin`)**：為營運團隊打造專屬的資料下載頁面。
  - **安全防護**：加入簡單的通關密碼機制 (`care2026`)，避免資料外洩。
  - **🛡️ 企業級資安升級 (RLS & Service Role Key)**：廢棄前端直連資料庫的危險作法。新增 `src/app/api/admin/records/route.js` 後端 API，前端必須攜帶密碼呼叫後端，由後端持「無敵金鑰 (Service Role Key)」繞過 RLS 撈取資料。此架構確保了資料庫能在 RLS 完全開啟的狀態下依然能安全匯出。
  - **資料清洗與翻譯**：自動攤平 `answers` JSON 結構，並將所有欄位名稱及選項內容翻譯為易讀的中文（例如：將 `calculated_cms_level` 轉換為 `系統推估級數`）。
  - **修復 CSV 中文亂碼**：匯出 CSV 時強制寫入 UTF-8 BOM (`\uFEFF`)，徹底解決以 Microsoft Excel 開啟時的中文亂碼問題。
  - **支援原生 Excel 格式**：整合 `xlsx` 套件，新增 `.xlsx` 一鍵下載功能，方便行政人員直接編輯整理。

### Changed
- `src/app/calculator/page.js`: 將原先的首頁試算平台整體搬遷至獨立的 `/calculator` 路由。
- 🔧 **常數收斂 (Backlog B1)**：將 `FamilyDiaryV3.jsx` 中的硬編碼費率常數（`BA_MAP`, `CMS_BUDGET`, `WELFARE_RATE`）全面移除，並統一由 `src/utils/careData.js` 引入，確保全站法規資料的單一來源 (Single Source of Truth)。
- `src/components/SubsidyCalculator.jsx`: 全面翻新四包錢明細的顯示邏輯。棄用原本直接展開的純文字，改為依賴 `ExpandablePackage` 與 `PartnerServiceCard` 組成具備高度互動性的區塊。
- `src/app/page.js`: 增強首頁底部行動呼籲 (CTA) 區塊的 UX 設計。將按鈕改為淺橘色底 (`bg-primary/10`) 並加上主色外框，且在標題上方新增「開始試算」的提示小標籤，引導長輩明確知道該從何處開始操作。
- `src/app/page.js`: 微調首頁底部選項按鈕樣式，將「有申請過 CMS」的橘色背景改為與未申請相同的白底外框 (`bg-card`)，避免過於強烈的視覺暗示導致使用者直覺誤點。

---

## [1.1.0] - 2026-06-16

### Added
- 🎨 **全站設計系統導入**：依據 `DESIGN_SYSTEM_CareEasy.md` 與 `home-hero.tsx`，徹底翻新全站 UI 介面。
  - **色彩與排版**：全面導入 Tailwind CSS 變數，設定溫暖橘 (`Primary`)、沉穩綠 (`Accent`) 與米白 (`Background`)。
  - **首頁 (`page.js`)**：引進帶有 `Home` 圖示與 `Care Easy` 品牌標示的專屬頭部列；新增情境圖片與三大信賴小點卡片；將原本單調的按鈕改為視覺凸出的大雙選項按鈕。
  - **問卷與試算表 (`AssessmentQuiz.jsx`, `SubsidyCalculator.jsx`, `ResultTable.jsx`)**：套用大圓角 (`rounded-2xl`)、大高度觸控區 (`h-14` / `min-h-[56px]`) 與更清晰的陰影卡片設計，解決原本過於簡陋的問題，確保 50歲以上長輩使用者能直覺點擊、安心操作。

### Changed
- `src/app/page.js`: 優化「回到首頁」按鈕：放大點擊範圍、加上白底膠囊狀視覺，並增加「回首頁」文字提示，提升長輩使用者的操作直覺性與安心感。
- `src/components/AssessmentQuiz.jsx`: 變更 Supabase `insert` 邏輯，現在會手動抓取精確的台灣時間 (`Asia/Taipei`) 帶入 `created_at` 欄位寫入資料庫，解決預設 UTC 時差問題。

### Fixed
- `src/components/AssessmentQuiz.jsx`: 修正 Supabase 靜默失敗 (Silent Failure) 問題。現在若 `insert` 發生錯誤（如 Vercel 漏設環境變數或網路異常），會跳出 `alert` 提示使用者且中斷流程，避免在資料未存入時直接顯示結果頁面。

### 🗄️ Schema
- 於 `answers` JSONB 結構中，額外寫入 `tw_time` 鍵值，雙重保證台灣時間記錄的正確性。

### 💰 補助費率

---

## [1.0.0] - 2026-06-16

初始版本：建立 Care Easy 照護一點通長照補助試算平台全端架構。

### Added
- **系統架構**：採用 Serverless 全端架構（Next.js + Tailwind CSS + Supabase + Vercel + GitHub）。
- **前端核心組件**：
  - `src/app/page.js`：系統主入口與狀態總管，管理首頁選單、使用者旅程與畫面分頁切換。
  - `src/components/AssessmentQuiz.jsx`：動態問卷組件，依失智路徑切換 ADL / CDR 題庫，作答完畢後寫入 Supabase。
  - `src/components/SubsidyCalculator.jsx`：長照四包錢試算引擎，含外籍看護工、交通分級、輔具選擇等邏輯。
  - `src/components/ResultTable.jsx`：各級數補助上限總覽表。
  - `src/components/MoneyRow.jsx`：共用金錢顯示微型組件。
- **工具與邏輯層**：
  - `src/utils/careData.js`：抽離補助表、地區費率、評估題庫等常數與核心演算法（`estimateLevelDementia`、`estimateLevelNormal`）。
- **後端與資料庫**：以 Supabase（PostgreSQL）取代自建後端 API，透過 SDK 直接存取。
- **安全性**：
  - 啟用 Row Level Security (RLS)：允許匿名 (anon) `INSERT`，僅認證管理員 (authenticated) 可 `SELECT`。
  - `src/lib/supabaseClient.js` 透過 `.env.local` 環境變數初始化 SDK。

### 🗄️ Schema
- **Schema 版本：v1.0.0**
- 建立核心資料表 `assessment_records`，作為未來 AI 模型訓練的 Ground Truth 來源：
  - `id` (uuid)：唯一識別碼
  - `created_at` (timestamp)：建立時間
  - `has_applied_cms` (boolean)：是否曾申請過 CMS 補助
  - `calculated_cms_level` (integer)：系統演算法推估的 CMS 級數
  - `actual_cms_level` (integer, nullable)：真實核定級數（用於驗證推估準確度）
  - `answers` (jsonb)：完整原始問卷作答記錄
  - `is_dementia_path` (boolean)：是否走失智路徑

### 💰 補助費率
- **對應年度：115 年度（2026）**
- 於 `careData.js` 建立長照四包錢補助表、各級數補助上限、地區費率與交通分級基準。

---

[Unreleased]: #unreleased
[1.0.0]: #100---2026-06-16
