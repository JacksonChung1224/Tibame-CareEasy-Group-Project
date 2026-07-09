# CLAUDE.md — CareEasy 照護一點通 · AI 協作規則
> 本檔供所有 AI 開發會話自動載入。任何模型（含 Claude Code、低階開發模型）
> 開始作業前必須完整閱讀本檔。最後更新：2026-07-09

## 專案概觀
台灣長照 3.0 資訊整合平台。三端合一 monorepo：
- **試算平台**（`/calculator`）：免登入 CMS 等級估算 + 四包錢補助試算 + 配合廠商導流（獲客漏斗頂端）
- **家屬端**（`/diary`）：照護日誌 + AI 訊號分析 + 額度查詢（solo / connected 雙模式）
- **機構端**（`/institution`）：排班對照 + OCR 輔助核銷 + 衛福部報表匯出

核心敘事：**一筆紀錄，三種價值**（居服員服務紀錄 = 機構核銷憑證 + 家屬照護透明度 + AI 交叉驗證資料源）。
決賽日：7/22。里程碑 M3（零重大 bug）：7/15。

## 技術棧
Next.js 16 App Router / React 19 / Tailwind v4 / Supabase / Vercel / lucide-react / SheetJS(xlsx)

## 檔案地圖
```
src/app/page.js                  首頁三入口 landing
src/app/calculator/page.js       試算流程（quiz → calc → table 三步）
src/app/diary/page.js            家屬端路由
src/app/institution/page.js      機構端路由
src/components/FamilyDiaryV3.jsx 家屬端主元件（日誌/居服紀錄/AI分析/額度）
src/components/InstitutionDashboard.jsx 機構端主元件（三步核銷流程）
src/components/AssessmentQuiz.jsx / SubsidyCalculator.jsx / ResultTable.jsx 試算三元件
src/utils/careData.js            ★單一事實來源：BA_MAP、CARE_SUBSIDY、IDENTITY_RATES、
                                 estimateLevelNormal/Dementia、calcSubsidy 等
src/utils/signalEngine.js        AI 訊號規則引擎（純函式，規則 R1–R4）
src/utils/ocrPostprocess.js      OCR 後處理校正層（純函式）
src/utils/partnerData.js         四包錢細項 + 廠商資料 + PLATFORM_DISCLAIMER
src/utils/trackPartnerClick.js   導流點擊追蹤（Supabase partner_clicks）
signalEngine.test.mjs / ocrPostprocess.test.mjs / backtest.mjs（根目錄，node 直接跑）
docs/                            規格書、費率清單、進度表、demo 腳本
```

## 🔒 全域規則（違反任一條 = 產出無效）
1. **禁止修改**：`careData.js` 內任何費率數字與 `estimateLevel*` 等級判定邏輯、
   `signalEngine.js` 的規則閾值。需要調整時只能在 PR 描述提出，不可直接改。
2. **合規閘門**：涉及補助金額、部分負擔比率、法規文案、訊號規則的變更，
   PR 必須標註「⚠️ 需 CMS Rules Specialist 驗證」，不可自行 merge。
3. **用詞紀律**：金額一律加「最高」；主文用「補助」、引用來源時用「給付」；
   等級寫「CMS 2–8 級」；核定相關必須保留「須經各縣市長期照顧管理中心評估核定」；
   AI 分析必須保留「觀察彙整、非醫療診斷」框架。
4. **禁止新增 npm 套件**，除非任務卡明確允許。
5. **只修改任務卡列出的檔案**。
6. **常數單一來源**：BA_MAP / 額度 / 比率一律 import 自 `careData.js`，禁止在元件內複製。
7. 完成後必須執行「驗收條件」自我檢查並逐條回報，附 `npm run build` 結果。

## 測試（交付前必跑）
```bash
node signalEngine.test.mjs    # 預期 9/9
node ocrPostprocess.test.mjs  # 預期 12/12
node reconcile.test.mjs       # 機構端比對引擎（任務卡 A 之後存在）
npm run build                 # 必須通過
```

## 協作協議
- 一次執行一張任務卡。任務卡 = 目標 + 輸入檔案 + 精確變更點 + 資料結構 + 驗收條件 + 禁止事項。
- 純邏輯一律抽成 `src/utils/` 純函式 + 根目錄 `.test.mjs`（node 零依賴可跑）——
  測試檔是非工程成員的驗收介面。
- 回報格式：變更檔案清單 + 測試輸出 + 未通過項目說明。不要自行 merge。

## 資料模型要點
- Supabase：`assessment_records`（含 calculated_cms_level / actual_cms_level 真值對，
  供 backtest.mjs 回測）、`partner_clicks`（導流成效，anon key 僅 INSERT）。
- 試算寫入走 `/api/submit` server route，禁止前端直連寫入 assessment_records。
- 家屬日誌永不提供給機構端；居服紀錄經機構授權（邀請碼）才顯示於家屬端。

## docs/ 索引
- `docs/CareEasy_優化執行規格書_v1.md` — 任務卡總庫
- `docs/rate-verification-checklist-FILLED.md` — 費率合規驗證（P0-3）
- `docs/PROGRESS_TODO.md` — 進度與待辦（以最新版為準）
- `docs/reconciliation-rules.md` — 機構端差異比對規則（任務卡 A 產出）
- `docs/demo-script.md` — 決賽 demo 六幕腳本（P0-1，待產出）
