# CareEasy — 進度與待辦總表 v3
> 更新：2026-07-09（週四）｜M3 零重大 bug：7/15｜決賽：7/22
> 本檔取代 v2。commit 至 `docs/PROGRESS_TODO.md`。

---

## 一、已完成 ✅（累計）

| 項目 | 狀態 |
|---|---|
| 三端合一 monorepo + 首頁三入口 landing（含「一筆紀錄，三種價值」tagline） | ✅ 已上線 care-easy.vercel.app |
| P0-2 邀請碼連動（家屬端輸入側）/ P1-1 chips / P1-2 引擎接線 / P1-3 solo 額度 | ✅ 已整合 `/diary` |
| B1 常數收斂：V3 改 import 自 careData.js | ✅ |
| signalEngine（9/9）/ ocrPostprocess（12/12）測試 | ✅ 於 repo 環境複驗通過 |
| 機構端改寫 React + P2-1 confidence 確認 + P2-3 差異標記骨架 | ✅（比對邏輯待任務卡 A 修正）|
| 四包錢細項 + 廠商導流 + partner_clicks 追蹤 + PLATFORM_DISCLAIMER | ✅ |
| Supabase 真值管線（calculated / actual_cms_level，經 /api/submit） | ✅ 運作中 |
| P0-3 立即可做項：重評文案(6)、身分別註記(1)、外看空窗揭露(3)、高風險碼免責(5) | ✅ 已執行（見 FILLED 清單） |

## 二、本輪待執行 🔴（7/9–7/12，M3 前）

- [ ] **任務卡 A**：機構端兩輪配對 + 匯出分表（D1 永不入核銷）+ 金額欄
      → 交開發模型，完成後跑 `reconcile.test.mjs` 驗收
- [ ] **任務卡 B**：飛輪三處路由 + 步進器守衛 + 機構端邀請碼彈窗
      → 交開發模型，驗收含「飛輪全鏈路手測」
- [ ] **docs 進 repo**（Jackson，5 分鐘）— 需 commit 的檔案清單：
      ```
      docs/CareEasy_優化執行規格書_v1.md
      docs/rate-verification-checklist-FILLED.md
      docs/PROGRESS_TODO.md          （本檔）
      docs/reconciliation-rules.md   （任務卡 A 產出後）
      docs/demo-script.md            （P0-1 產出後）
      CLAUDE.md                       （repo 根目錄，非 docs/）
      ```
- [ ] **CHANGELOG 補記**（Jackson）— P0-3 四項變更立即記入 `[Unreleased]` 💰 區塊，
      已驗證項標 ✅、待簽核項標 ⏳（格式見對話中的範例片段）。
      任務卡 A/B 完成後同輪補記。
- [ ] **P0-3 收尾**：Item 5 高風險碼免責的最終簽核；確認 Item 2/4
      （包別部分負擔一致性、CMS_BUDGET 115 年度值）是否已在 FILLED 清單結案，
      未結案者 7/15 前準備「顯示等級、隱藏金額」降級方案。

## 三、M3 → 決賽 🟡（7/13–7/21）

- [ ] 7/13–7/15：全站回歸測試（三入口、試算含步進器守衛、日誌 CRUD、
      連動/解除、機構端新比對流程、兩張 sheet 匯出）→ M3 驗收
- [ ] **P0-1 Demo 腳本**（可交低階模型，規格書任務卡自包含）—
      口白需納入兩個實測彈藥：solo→connected 訊號升級對照（兩琥珀→兩紅）、
      機構端「D1 不入核銷」的合規賣點
- [ ] **OCR vision 引擎接線**（Jackson 親做）— Claude API vision → 逐欄
      value+confidence JSON → ocrPostprocess 二次校正 → 取代機構端 mock；
      demo 未完成前口徑一律「模擬 OCR 輸出」
- [ ] 機構端補「上傳照片」UI 動作（未接引擎前點擊載入模擬結果，流程觀感完整）
- [ ] 10 張手寫測試照片集（全隊）→ 統計欄位級準確率作簡報數據
- [ ] 7/20–7/21：demo 排練 ×3 + 備援影片

## 四、UI/UX 優化階段（告一段落後啟動）

依序執行，前一步是後一步的依據：
1. **Design tokens 統一**（半天）：以試算平台 token 系統為基準做一頁 tokens 表，
   三端底色/字階/圓角/陰影/按鈕收斂；保留角色 accent 色（teal 平台 / rose 家屬 / slate 機構）
2. **分端裝置優化**：家屬端手機優先（字級 ≥16px、觸控 ≥44px、對比 AA）；
   機構端桌機資訊密度（表格排序、D1/D2 篩選、鍵盤友善）
3. **Demo 路徑打磨**：landing → 試算結果頁 → 家屬端 AI 分析 tab → 機構端步驟 2.5/3
4. **細節清理**：dev 模式切換器改 `?dev=1` 才顯示；window.confirm 換一致 modal；
   首頁「查看更新日誌」改連 CHANGELOG.md；loading/empty/error 三態補齊
   （特別是 /api/submit 失敗時的用戶提示）

## 五、Backlog 💡（決賽後）

| # | 方向 | 觸發條件 |
|---|---|---|
| B2 | 部分負擔按包別分流（額度明細出現非 BA 碼前為 blocking） | 明細納入 D/EF 碼時 |
| B3 | 訊號 snapshot 進 Supabase → 累積後回測 R1–R4 閾值 | 有真實用戶資料後 |
| B5 | 就醫摘要 PDF 匯出（A4 單頁、醫師 30 秒可讀） | 決賽後 |
| B7 | 邀請碼正式機制（Supabase invites 表 + RLS + 機構端產碼） | 決賽後 |
| B9 | BA08/BA09/BA09a 是否正式列入 BA_MAP（Specialist 裁定 + 官方單價） | Specialist 簽核後 |
| B10 | reconcile 引擎支援跨月/多居服員鍵（+worker 維度） | 真實機構試用時 |
| B11 | CI：GitHub Actions 跑三支 .test.mjs + build（防止低階模型回歸） | 決賽後首件事 |

## 六、風險看板 ⚠️
1. 任務卡 A 是唯一含合規風險的修正（D1 溢報）——**必須在 M3 前完成**，
   否則 demo 匯出功能降級為「僅展示步驟 3 畫面、不點匯出」。
2. P0-3 Item 2/4（包別比率、115 年度額度）若未結案，7/15 起額度金額隱藏顯示。
3. Demo 口徑三件套不動搖：「最高」、「須經評估核定」、「觀察彙整非醫療診斷」；
   OCR 未接引擎前一律講「模擬輸出」。
