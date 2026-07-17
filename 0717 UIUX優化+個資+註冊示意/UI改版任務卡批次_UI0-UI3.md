# UI/UX 改版任務卡批次（UI-0 → UI-3）
> 依據：《CareEasy_UIUX_Design_System_v1_0.md》（請 Jackson 先 commit 至
> `docs/`，各卡以該文件為視覺權威）＋本批次的「適配決議」。
> 原則：**Vercel repo 為唯一產品**；設計文件描述的平行展示站僅供視覺參考，
> 其導覽項（資源專區／照護導航）與步驟命名**不採用**，一切以現有功能為準。
> 執行順序：UI-0（基礎）→ UI-1／UI-2／UI-3（可並行）。前置：F1-Lite 已完成。

## 適配決議（各卡共同遵守，衝突時以本節為準）
1. **角色 accent**：試算＝`brand-teal-dark`；家屬＝`brand-coral`；
   機構＝`brand-teal-dark` 主功能＋`ui-brown` 標題（文件未定義機構色，此為決議）。
2. **語意狀態色不動**：比對室的紅/琥珀/綠/灰差異標記、AI 訊號紅/琥珀
   維持現有語意色（文件 2.3 亦禁止品牌橘當錯誤色），僅底色調和至奶茶系。
3. **emoji 範圍**：僅替換「導覽層級」（tab 列、功能卡、header 按鈕）為
   CareEasyIcon；內文與 toast 的 emoji 保留，決賽後再清。
   對應不到 8 顆 icon 的（如 AI 分析）→ 保留現狀，列入回報清單。
4. **文案不動**：本批次為樣式卡，所有文字（含免責、法規文案）禁止更動。
5. 每張卡固定驗收：對照標註截圖／三端每 tab 點一輪／`npm run build`／
   回報變更檔案清單。禁止改動任何邏輯、state、props、事件處理。

---

## 【UI-0】基礎建設：Tokens・字體・Icon・Logo
**修改**：`src/app/globals.css`、新增 `src/components/CareEasyIcon.jsx`、
`public/` 放入 Logo 檔、三端 header。

1. **Tokens**：文件 2.1 全部色彩以 Tailwind v4 `@theme` 落地於 globals.css：
   ```css
   @theme {
     --color-brand-teal:#20afa9; --color-brand-teal-dark:#087f7d;
     --color-brand-coral:#ef6a52; --color-brand-orange:#f0522d;
     --color-brand-amber:#efa72f; --color-brand-leaf:#79b85a;
     --color-ui-brown:#4b3024; --color-ui-ink:#332b27; --color-ui-muted:#746861;
     --color-ui-cream:#fff9f0; --color-ui-cream-deep:#f5e8d5;
     --color-ui-paper:#fffdf9; --color-ui-line:#eadbc9;
     --color-ui-teal-soft:#edf7f5; --color-ui-orange-soft:#fff1e7;
   }
   ```
   之後各卡以 `bg-ui-cream`、`text-ui-ink`、`bg-brand-teal-dark` 等 utility 引用，
   **禁止新增寫死色碼**。
2. **字體基準**（文件 4.1）：body 設 `font-size:17px; font-weight:500;`
   Noto Sans TC；正文最小 16px。
3. **CareEasyIcon.jsx**：文件 8.3 的 TSX 轉為 JSX（去 type 標註），
   8 顆 icon 原封不動；外層 `UiIcon` 與 `.nav-icon`/`.feature-icon` CSS 一併落地。
4. **Logo 檔**：`public/careeasy-logo-full.png`（直式完整版，透明底）、
   `public/careeasy-logo-mark.png`（符號版，透明底）。
   - Landing hero：完整版置於標題區（max-height 200px，object-fit contain）。
   - 三端 header：`mark 圖（高 40–48px）＋「照護一點通」文字`，整組 Link 回 `/`。
   - 遵守文件 3.3：Logo 四周留白 ≥16px、不拉伸不改色。
5. **字級切換（F3）**：文件 4.5 三檔 class 落地——html `data-fontsize`
   屬性驅動 body 字級（15/17/19px），家屬端 header 放「字級 小/中/大」
   切換鈕，選擇存 localStorage。切大字後驗證按鈕與結果數字不截斷。

**驗收**：tokens utility 可用（任一元件測試引用）；三端 header 有 Logo mark
且點擊回首頁；字級三檔切換正常且重整保留；smoke＋build。

---

## 【UI-1】Landing＋試算平台
**修改**：`src/app/page.js`、`src/app/calculator/page.js`、
`SubsidyCalculator.jsx`、`ResultTable.jsx`、`AssessmentQuiz.jsx`（僅樣式）。

1. 頁面底 `bg-ui-cream`；卡片 `bg-ui-paper border-ui-line rounded-[18px]`
   ＋文件 2.1 之 shadow-card；標題 `text-ui-brown`、正文 `text-ui-ink`。
2. 主要 CTA 依文件 7.2：高度 ≥56px、`bg-brand-teal-dark` 白字 900 字重；
   首頁三入口的「試算」主卡可用 `brand-orange` 膠囊強調（文件：橘＝主 CTA）。
3. 試算步進器依文件 7.5：目前步驟深青綠圓＋白數字、未完成淺灰、
   細虛線連接；**disabled 守衛樣式維持**（不動邏輯）。
4. 三入口功能卡 icon 換 CareEasyIcon（calculator／diary／institution，
   tone 依角色 accent）。
5. Focus 樣式：文件 10.1 的 focus-visible 外框全域套用（放 UI-0 亦可）。

---

## 【UI-2】家屬端（/diary＋/plans）
**修改**：`FamilyDiaryV3.jsx`、`src/app/plans/page.js`（僅樣式）。

1. 角色 accent：現有 rose 系一律換 `brand-coral` 系
   （chips 選中態、日誌卡框線、紅點）；頁底 `bg-ui-cream`。
2. Connected header 底色改 `brand-teal-dark`；solo header 改 `ui-brown`。
3. **AI 分析 tab（最高優先畫面）**：訊號卡語意色保留
   （紅＝兩端一致、琥珀＝單側），但卡片底改用柔和層
   （紅底改淡珊瑚、琥珀底改 ui-orange-soft），字重與行高依文件 4.x；
   「查看依據」展開區 `bg-ui-paper`。
4. Tab 列 emoji → CareEasyIcon（日誌=diary、居服紀錄=services、
   額度=wallet；AI 分析無對應 → 保留 emoji 並回報）。
5. /plans 方案卡換裝：免費版 `brand-teal-dark` 框、進階版 `ui-line` 框
   ＋〔即將推出〕disabled 樣式（文件 7.2 disabled 規格）。
6. 大字模式抽查：chips、日期列、訊號卡在 19px 檔不溢出。

---

## 【UI-3】機構端（/institution）
**修改**：`InstitutionDashboard.jsx`（僅樣式）。

1. 深色 slate header → `bg-ui-paper` 淺色 header（文件 3.3：Header 近白
   確保品牌辨識），Logo mark＋標題 `text-ui-brown`；
   環境徽章與版本 pill 改 `ui-teal-soft` 底＋`brand-teal-dark` 字。
2. 步驟導覽 active 態依文件 7.1：暖橘文字＋淺橘底＋底部 3px 指示線；
   hover 深青綠。
3. 表格：表頭 `bg-ui-cream-deep text-ui-brown`、列分隔 `ui-line`、
   差異標記語意色不動；裁決 radio 與備註框依文件 7.3（欄位高、label 顯示）。
4. 按鈕：主要動作 `brand-teal-dark`、匯出維持綠色語意、
   危險動作（解除連動）另用深紅（不得用品牌橘，文件 2.3）。
5. 個案連動管理卡片與展開區換 `ui-paper`＋`ui-line`；
   三態 badge 底色調至奶茶系但語意色相不變。

---

## 交付節奏建議
7/17：F1-Lite → UI-0 ｜ 7/18：UI-1＋UI-2（並行 UI-3）＋任務卡 P ｜
7/19：全站回歸＋設計成員以 preview URL 對照驗收 → 晚上凍結。
