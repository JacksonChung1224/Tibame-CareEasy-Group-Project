# Care Easy 照護一點通｜UI/UX Design System & Engineering Handoff

> 文件版本：1.0  
> 對應網站版本：Care Easy Desktop Demo v5  
> 文件用途：前端／後端工程串接、元件開發、功能擴充、驗收基準  
> 適用平台：桌機網頁、平板、手機網頁  
> 核心原則：高齡友善、溫暖可信、資訊清楚、操作直覺、醫療邊界明確

---

## 1. 設計定位

### 1.1 品牌感受

Care Easy 的介面應同時傳達：

- **溫暖**：奶茶與米白底色，降低醫療系統的冰冷感。
- **可信**：深茶色文字、深青綠功能色，避免過度鮮豔或娛樂化。
- **好理解**：一句話只表達一個重點，按鈕文案採動作導向。
- **高齡友善**：字級偏大、字重偏粗、點擊範圍充足、狀態清楚。
- **不造成醫療誤解**：試算結果必須標示「僅供參考」「非正式核定」「不是醫療診斷」。

### 1.2 視覺風格

- 高質感暖色系平面設計。
- Icon 使用圓角細線 SVG，不使用 emoji、字型符號或 3D 圖示。
- 卡片可使用輕微陰影，但不製作凸起、塑膠或遊戲化立體效果。
- 主色控制在「青綠＋暖橘＋奶茶中性色」，珊瑚與琥珀只作輔助提示。

---

## 2. Design Tokens

### 2.1 CSS 變數（唯一色彩來源）

後續所有頁面、元件與後端模板必須引用 Token，不得在個別元件新增近似色碼。

```css
:root {
  /* Brand */
  --brand-teal: #20afa9;
  --brand-teal-dark: #087f7d;
  --brand-coral: #ef6a52;
  --brand-orange: #f0522d;
  --brand-amber: #efa72f;
  --brand-leaf: #79b85a;

  /* Neutral UI */
  --ui-brown: #4b3024;
  --ui-ink: #332b27;
  --ui-muted: #746861;
  --ui-cream: #fff9f0;
  --ui-cream-deep: #f5e8d5;
  --ui-paper: #fffdf9;
  --ui-line: #eadbc9;

  /* Soft surfaces */
  --ui-teal-soft: #edf7f5;
  --ui-orange-soft: #fff1e7;

  /* Shadows */
  --shadow-card: 0 10px 28px rgba(91, 62, 38, 0.075);
  --shadow-button: 0 8px 20px rgba(211, 71, 35, 0.16);
}
```

### 2.2 色彩用途

| Token | 用途 | 禁止用途 |
|---|---|---|
| `--brand-orange` | 主要 CTA、目前選取的主導覽、重點數字 | 大面積正文背景 |
| `--brand-teal-dark` | 主要功能按鈕、連結、進度、Icon、焦點狀態 | 錯誤或危險訊息 |
| `--brand-teal` | 品牌輔色、Focus 外框 | 長篇文字 |
| `--brand-coral` | 照護日誌、次級暖色提示 | 全頁主色 |
| `--brand-amber` | 輔助功能、服務組合、溫和提醒 | 嚴重警告 |
| `--ui-brown` | H1–H3 標題 | Disabled 狀態 |
| `--ui-ink` | 正文與欄位標籤 | 次要說明 |
| `--ui-muted` | 補充文字、免責說明 | 主要操作文案 |
| `--ui-cream` | 頁面主背景 | 高對比文字按鈕 |
| `--ui-paper` | 卡片、表單內容底色 | 全頁深色區塊 |
| `--ui-line` | 邊框、分隔線 | 文字 |

### 2.3 狀態色規則

```css
.state-primary  { color: #087f7d; background: #edf7f5; }
.state-action   { color: #ffffff; background: #f0522d; }
.state-warning  { color: #4b3024; background: #fff8ee; border-color: #eadbc9; }
.state-disabled { color: #ffffff; background: #aaa29a; }
```

錯誤訊息若未來新增，建議另建 `--state-danger`，不可直接把品牌橘當作系統錯誤色。

---

## 3. Logo 使用規格

### 3.1 正式檔案

- 使用正式橫式 Logo：`careeasy-logo-horizontal.png`。
- 不可用文字重新拼出 Logo。
- 不可改色、拉伸、切割、加外框或套濾鏡。
- Logo 內部顏色以原始品牌圖檔為準；網站 CSS Token 只負責周邊介面配色。

### 3.2 網頁尺寸

```css
.brand {
  width: 342px;
  height: 94px;
  padding: 0;
  border: 0;
  background: none;
}

.brand img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: left center;
}

@media (max-width: 1360px) { .brand { width: 265px; height: 82px; } }
@media (max-width: 1180px) { .brand { width: 235px; } }
@media (max-width: 600px)  { .brand { width: 190px; height: 62px; } }
```

### 3.3 安全空間

- Logo 與導覽、邊框至少保留 `16px`。
- 不放在高彩度照片或複雜紋理上。
- Header 底色固定為近白紙張色，確保品牌辨識。

---

## 4. 字體與文字階層

### 4.1 Font Family

```css
body {
  font-family: "Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif;
  font-size: 17px;
  font-weight: 500;
  color: var(--ui-ink);
}
```

不得使用細字體。中文最小正文建議 `16px`，桌機預設 `17px`。

### 4.2 字級 Token

```css
:root {
  --font-xs: 14px;
  --font-sm: 15px;
  --font-md: 17px;
  --font-lg: 19px;
  --font-h3: 1.18em;
  --font-h2: 1.55em;
  --font-h1-flow: 2em;
  --font-h1-result: 2.3em;
  --font-h1-hero: clamp(46px, 4vw, 70px);
}
```

### 4.3 字重

| 類型 | Font weight |
|---|---:|
| 一般正文 | 500–600 |
| 補充說明 | 500 |
| 欄位標籤／導覽 | 700–800 |
| 按鈕 | 800–900 |
| H1／重點數字 | 900 |

### 4.4 行高與字距

- 正文：`line-height: 1.6–1.75`。
- Hero H1：`line-height: 1.17; letter-spacing: -0.045em`。
- Eyebrow：`letter-spacing: 0.06em`，不可用於長句。
- 中文內文不可使用過度緊縮字距。

### 4.5 字級切換

```css
.font-small  { font-size: 15px; }
.font-medium { font-size: 17px; }
.font-large  { font-size: 19px; }
```

- 預設為 `medium`。
- 使用者切換後，應保存至帳號偏好或 `localStorage`。
- 字級放大後不可截斷按鈕、表單標籤或結果數字。

---

## 5. 文案規則

### 5.1 語氣

- 使用台灣繁體中文。
- 親切、直接、避免命令或責備。
- 避免醫療術語堆疊；必要術語後面加白話說明。
- 一個段落只處理一件事。
- 使用「你／家人／長輩」，避免冷硬的「案主」。

### 5.2 按鈕命名

按鈕採「動作＋對象／結果」：

- `開始免費試算`
- `同意並開始試算`
- `查看試算結果`
- `重新試算`
- `查看詳細建議`
- `申請正式評估`

禁止模糊文案：`確認`、`送出`、`OK`、`點我`。

### 5.3 結果與風險文案

試算結果附近至少出現一次：

> 本結果為示範性試算，不是政府正式核定，也不是醫療診斷。實際資格與額度仍須由長照管理中心評估。

若有健康或症狀資訊，再補充：

> 如有急性或立即危險症狀，請撥打 119 或儘速就醫。

### 5.4 個資蒐集告知

在送出或儲存資料前，介面必須明確顯示：

- 蒐集目的。
- 使用哪些資料。
- 是否儲存、保存多久。
- 是否提供第三方。
- 使用者如何撤回或停止。
- 試算不是醫療診斷或政府核定。

同意 Checkbox 不可預先勾選。

---

## 6. Layout 與間距系統

### 6.1 Spacing Scale

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 28px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
}
```

只使用 4px 倍數；既有版面中的 15px、17px 等為元件微調，不作為新元件基準。

### 6.2 內容寬度

- 首頁主要內容：`min(1460px, calc(100% - 8vw))`。
- 流程頁：`min(1160px, 92vw)`。
- 閱讀型卡片：最大寬度 `780px`。

### 6.3 圓角

| 元件 | Radius |
|---|---:|
| 輸入欄位 | 9–12px |
| 一般卡片 | 17–18px |
| 流程主卡片 | 24px |
| Header | 20px |
| CTA／狀態膠囊 | 999px |

---

## 7. 主要元件規格

### 7.1 Header

- Sticky Header：`top: 8px; z-index: 20`。
- 桌機高度：至少 `116px`。
- Logo 在左、主導覽置中偏右、字級與登入在最右。
- Active 導覽使用暖橘文字、淺橘背景、底部 3px 指示線。
- Hover 使用深青綠文字與極淺奶茶底。

### 7.2 Primary CTA

```css
.primary-button {
  min-height: 56px;
  padding: 14px 26px;
  border: 0;
  border-radius: 16px;
  color: #fff;
  background: var(--brand-teal-dark);
  font-weight: 900;
  cursor: pointer;
}

.orange-button {
  min-width: 330px;
  min-height: 70px;
  border-radius: 999px;
  background: var(--brand-orange);
  box-shadow: var(--shadow-button);
}

.primary-button:disabled {
  background: #aaa29a;
  box-shadow: none;
  cursor: not-allowed;
}
```

### 7.3 表單與選項

- 欄位高度至少 `56px`。
- Checkbox／Radio 的可點擊區不得小於 `44 × 44px`。
- Label 永遠顯示，不以 Placeholder 取代。
- Disabled 按鈕需同時使用視覺狀態與 HTML `disabled`。
- 驗證錯誤需顯示文字，不得只靠紅色外框。

### 7.4 卡片

```css
.card {
  background: var(--ui-paper);
  border: 1px solid var(--ui-line);
  border-radius: 18px;
  box-shadow: var(--shadow-card);
}
```

卡片內 Icon、標題、說明、動作順序固定；不可把整張卡片塞入過多說明。

### 7.5 試算步驟

- 步驟順序：`基本狀況 → 照護需求 → 預算與結果`。
- Current：深青綠圓形、白色數字。
- Upcoming：淺灰圓形、灰色文字。
- 步驟間以細虛線連接。
- 不可只靠顏色判斷目前步驟，文字需同步呈現。

---

## 8. Icon System（固定規格）

### 8.1 全域規則

- 格線：`32 × 32 viewBox`。
- Style：2D 平面圓角線框。
- 預設線寬：`1.8`。
- `stroke-linecap: round`。
- `stroke-linejoin: round`。
- Icon 顏色使用 `currentColor`，由外層元件控制。
- 純裝飾 Icon 使用 `aria-hidden="true"`。
- 有獨立功能的 Icon Button 必須提供 `aria-label`。
- 禁止用 `▣`、`⌖`、`♧`、Emoji 或字型圖示代替正式 Icon。

### 8.2 Icon 名稱契約

後端回傳 icon key 時，只能使用以下固定值：

```ts
export type CareEasyIconName =
  | "calculator"
  | "diary"
  | "institution"
  | "resources"
  | "navigation"
  | "shield"
  | "wallet"
  | "services";
```

| Key | 中文意義 | 使用位置 |
|---|---|---|
| `calculator` | 免費試算／補助試算 | 導覽、CTA、試算區、功能卡 |
| `diary` | 照護日誌 | 導覽、功能卡 |
| `institution` | 機構管理 | 導覽、機構頁 |
| `resources` | 資源專區 | 導覽、資源頁 |
| `navigation` | 照護導航 | 導覽、功能卡 |
| `shield` | 個資與安全提醒 | 隱私說明、同意流程 |
| `wallet` | 補助額度 | 結果摘要 |
| `services` | 建議服務組合 | 結果摘要 |

### 8.3 React／TSX 固定實作

```tsx
type CareEasyIconName =
  | "calculator"
  | "diary"
  | "institution"
  | "resources"
  | "navigation"
  | "shield"
  | "wallet"
  | "services";

export function CareEasyIcon({ name }: { name: CareEasyIconName }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      {name === "calculator" && <>
        <rect {...common} x="7" y="3.5" width="18" height="25" rx="3" />
        <rect {...common} x="10.5" y="7" width="11" height="5" rx="1" />
        <path {...common} d="M11 16.5h2M16 16.5h2M21 16.5h.1M11 21h2M16 21h2M21 21h.1M11 25.5h2M16 25.5h2M21 25.5h.1" />
      </>}

      {name === "diary" && <>
        <rect {...common} x="6" y="4" width="20" height="24" rx="3" />
        <path {...common} d="M10 4v24M6 9h4M6 14h4M6 19h4" />
        <path {...common} d="M17.5 11.5c-1.8-2.2-5.2.2-3.3 2.8l3.3 3.2 3.3-3.2c1.9-2.6-1.5-5-3.3-2.8Z" />
        <path {...common} d="M14.5 22h7" />
      </>}

      {name === "institution" && <>
        <path {...common} d="M5 27h22M8 27V13h16v14M12 13V6h8v7" />
        <path {...common} d="M14.5 9.5h3M12 17h2M18 17h2M12 21h2M18 21h2M14 27v-3h4v3" />
        <path {...common} d="M23 20.5h5v5.2c0 1.6-1.1 2.8-2.5 3.3-1.4-.5-2.5-1.7-2.5-3.3z" />
        <path {...common} d="m24.3 24.8 1 1 1.7-2" />
      </>}

      {name === "resources" && <>
        <path {...common} d="M4.5 7.5c4-1.7 7.5-.8 11.5 2.2v18c-4-3-7.5-3.9-11.5-2.2zM27.5 7.5c-4-1.7-7.5-.8-11.5 2.2v18c4-3 7.5-3.9 11.5-2.2z" />
        <path {...common} d="M22 7v8l2-1.5 2 1.5V7.8" />
      </>}

      {name === "navigation" && <>
        <path {...common} d="M7 23.5c-2.4-1.7-3.4-4-2.5-5.4.9-1.4 3.2-1 5.2.5l4.2 3" />
        <path {...common} d="M7 23.5 15 28c1 .6 2.1.6 3.1.1l8.5-4.3c1.7-.9 1.8-3.3.2-4.4-1-.7-2.2-.7-3.2-.1l-4.3 2.4" />
        <path {...common} d="M21 5.5a6.5 6.5 0 0 0-6.5 6.5c0 4.8 6.5 9 6.5 9s6.5-4.2 6.5-9A6.5 6.5 0 0 0 21 5.5Z" />
        <path {...common} d="m19 12 2.8-2-1.1 3.2-2.8 2z" />
      </>}

      {name === "shield" && <>
        <path {...common} d="M16 3.5 26 7v7.2c0 6.4-4.1 11.3-10 14.3-5.9-3-10-7.9-10-14.3V7z" />
        <path {...common} d="m11.2 15.7 3.1 3.1 6.5-7" />
      </>}

      {name === "wallet" && <>
        <path {...common} d="M6 9.5h18a3 3 0 0 1 3 3v12H7a3 3 0 0 1-3-3v-14a3 3 0 0 1 3-3h15" />
        <path {...common} d="M20 14h7v6h-7a3 3 0 0 1 0-6Z" />
        <circle cx="21.5" cy="17" r=".8" fill="currentColor" />
      </>}

      {name === "services" && <>
        <circle {...common} cx="16" cy="10" r="4" />
        <path {...common} d="M8.5 26v-2.5c0-4.1 3.4-7.5 7.5-7.5s7.5 3.4 7.5 7.5V26" />
        <path {...common} d="M5 20.5h5M22 20.5h5" />
      </>}
    </svg>
  );
}
```

### 8.4 Icon 外層元件

```tsx
export function UiIcon({
  name,
  className = "",
}: {
  name: CareEasyIconName;
  className?: string;
}) {
  return (
    <span className={`ui-icon ${className}`} aria-hidden="true">
      <CareEasyIcon name={name} />
    </span>
  );
}
```

```css
.ui-icon {
  display: inline-grid;
  place-items: center;
  flex: none;
}

.ui-icon svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.nav-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: var(--brand-teal-dark);
  background: linear-gradient(145deg, #f3faf8, #e5f2ef);
}

.nav-icon svg { width: 35px; height: 35px; }

.feature-icon {
  width: 72px;
  height: 72px;
  padding: 13px;
  border-radius: 50%;
}

.feature-icon.teal  { color: var(--brand-teal-dark); background: #dff3f1; }
.feature-icon.amber { color: #dc791e; background: #fff0d7; }
.feature-icon.coral { color: #d95743; background: #ffe9df; }
```

### 8.5 後端資料格式

後端只回傳語意 key，不回傳 SVG、HTML 或顏色：

```json
{
  "feature_id": "subsidy-calculator",
  "title": "補助試算",
  "description": "快速估算補助額度與自費金額",
  "icon": "calculator",
  "tone": "teal",
  "action_label": "立即試算",
  "action_url": "/calculator"
}
```

前端需對 `icon` 與 `tone` 建立 allowlist；收到未知值時使用安全 fallback，不直接渲染後端傳入的 SVG／HTML。

---

## 9. 響應式規格

### 9.1 Breakpoints

| Breakpoint | 行為 |
|---:|---|
| `≤1360px` | Logo、導覽 Icon 與導覽文字縮小；隱藏字級工具 |
| `≤1180px` | 試算欄位改為 2 欄；Dashboard 改為單欄 |
| `≤900px` | 隱藏桌機主導覽；Hero 改單欄；功能卡改單欄 |
| `≤600px` | 手機版，主內容左右留 12–20px；CTA 滿寬；表單單欄 |

### 9.2 手機導覽

目前桌機版在 `≤900px` 隱藏主導覽。正式手機版應補上：

- 底部固定導覽，或
- 漢堡選單＋清楚文字。

不可只保留 Icon 而移除文字，避免高齡使用者無法理解。

### 9.3 觸控尺寸

- 所有主要按鈕至少 `44px` 高。
- 主要 CTA 建議 `56–70px` 高。
- 相鄰觸控元件至少保留 `8px`。

---

## 10. 無障礙與高齡友善

### 10.1 Keyboard Focus

```css
button:focus-visible,
input:focus-visible,
select:focus-visible,
a:focus-visible {
  outline: 4px solid rgba(32, 175, 169, 0.34);
  outline-offset: 3px;
}
```

### 10.2 基本要求

- 所有功能都可用鍵盤完成。
- Icon-only button 必須有 `aria-label`。
- 裝飾圖片使用 `alt=""`；資訊圖片需有實際替代文字。
- 表單錯誤使用 `aria-describedby` 連結錯誤訊息。
- 不以顏色作為唯一狀態辨識。
- 支援 `prefers-reduced-motion`。

```css
@media (prefers-reduced-motion: reduce) {
  * {
    scroll-behavior: auto !important;
    transition: none !important;
  }
}
```

### 10.3 對比與閱讀

- 正文優先使用 `--ui-ink`，不得在奶茶底使用過淡灰字。
- `--ui-muted` 僅限次要說明，字級不得小於 14px。
- 長文每行建議不超過 36 個中文字。
- 禁止全段置中；流程說明與表單文字以靠左為主。

---

## 11. 前後端串接規則

### 11.1 後端負責

- 資料內容與業務規則。
- 試算計算與資格判斷。
- 欄位驗證結果。
- 使用者權限與資料存取。
- 同意紀錄版本與時間。
- API 的錯誤碼及可理解的錯誤訊息 key。

### 11.2 前端負責

- 色彩、字體、間距與元件樣式。
- Icon key 對應 SVG。
- Loading、Empty、Error、Disabled、Success 狀態。
- 文字換行與響應式版面。
- Focus、鍵盤操作與 ARIA。

### 11.3 API 不應回傳

- 任意 HTML。
- 任意 SVG。
- Inline CSS。
- 任意 hex 色碼。
- 未經 allowlist 的 Icon 名稱。

### 11.4 建議狀態模型

```ts
type AsyncStatus = "idle" | "loading" | "success" | "empty" | "error";

type ApiError = {
  code: string;
  message: string;
  field?: string;
  retryable: boolean;
};
```

Loading 時保留版面高度，避免內容跳動；不可只顯示旋轉動畫而沒有文字。

---

## 12. 驗收 Checklist

### 視覺

- [ ] 所有顏色皆引用 Design Token。
- [ ] Logo 未被拉伸、裁切或改色。
- [ ] Icon 使用固定 32×32 SVG 系統。
- [ ] 免費試算 Icon 為單純計算機，不含文件或勾選附件。
- [ ] 未出現 emoji、字型符號或不同風格 Icon。
- [ ] 卡片與按鈕圓角、陰影一致。

### 文字

- [ ] 使用繁體中文與台灣用語。
- [ ] 正文桌機不小於 17px；手機不小於 16px。
- [ ] 主要按鈕使用具體動作文案。
- [ ] 試算結果有「非正式核定／非醫療診斷」提示。
- [ ] 個資蒐集前有明確告知與未預勾同意框。

### 操作

- [ ] 主要操作可用鍵盤完成。
- [ ] Focus 清楚可見。
- [ ] Disabled 狀態不可點擊。
- [ ] Loading／Empty／Error 狀態皆有文字。
- [ ] 手機點擊範圍至少 44×44px。
- [ ] 大字模式不截字、不重疊、不溢出。

### 資安與資料

- [ ] 前端不直接渲染 API 回傳 HTML／SVG。
- [ ] Icon 與 tone 使用 allowlist。
- [ ] 敏感資料不寫入前端 log。
- [ ] 同意紀錄包含版本、時間與使用者識別方式。
- [ ] API 錯誤不暴露內部系統資訊。

---

## 13. 建議專案結構

```text
src/
├─ design-system/
│  ├─ tokens.css
│  ├─ typography.css
│  ├─ components.css
│  └─ icons/
│     ├─ CareEasyIcon.tsx
│     └─ icon.types.ts
├─ components/
│  ├─ SiteHeader.tsx
│  ├─ PrimaryButton.tsx
│  ├─ FeatureCard.tsx
│  ├─ StepProgress.tsx
│  ├─ ConsentNotice.tsx
│  └─ ResultSummary.tsx
├─ features/
│  ├─ calculator/
│  ├─ diary/
│  ├─ institution/
│  ├─ resources/
│  └─ navigation/
└─ services/
   └─ api/
```

---

## 14. 變更管理

- Design Token、Icon path、字級或 Logo 規格變更時，必須升級此文件版本。
- Icon 只能在中央 `CareEasyIcon` 元件新增，不可在業務頁面各自畫 SVG。
- 新增色彩前先確認既有 Token 是否可滿足需求。
- 新增元件需提供 Default、Hover、Focus、Disabled、Loading、Error 狀態。
- 每次正式發布前，至少驗證桌機 1440px、平板 900px、手機 390px 三種寬度。

---

## 附錄：目前正式網站

`https://careeasy-desktop-demo.silvia901612.chatgpt.site`

