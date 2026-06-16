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

> 尚未發版的變更請記錄於此區塊，發版時再移至正式版本號下。

### Added
- `src/app/page.js`: 新增「回到首頁」圖示按鈕，附帶 `window.confirm` 防呆機制，避免使用者誤觸流失資料。
- `src/app/page.js`: 將原本的分頁切換按鈕優化為 1 ➔ 2 ➔ 3 步進器 (Stepper) 視覺，強化流程引導感。

### Changed
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
