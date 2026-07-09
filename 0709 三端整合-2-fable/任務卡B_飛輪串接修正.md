# 任務卡 B｜飛輪串接修正：三處路由 + 試算步進器守衛 + 機構端邀請碼彈窗
> 優先級：🔴 M3 前（7/15）｜需 Specialist 驗證：否（純串接，不涉金額與法規文案）
> 可直接複製本卡全文給開發模型執行。預估工時：1 小時內。

```
【全域規則 — 必須遵守】
1. 禁止修改 careData.js 費率與等級邏輯、signalEngine.js 規則閾值。
2. 不得改動任何金額顯示與法規文案（本卡不涉及，若發現需要改，停下回報）。
3. 不新增任何 npm 套件。
4. 只修改本卡列出的檔案。完成後逐條回報驗收條件，附 npm run build 結果。
```

## 背景
使用者旅程「試算 → 日誌 → 連動 → AI 訊號 → 回試算」的飛輪目前斷了三個環節，
且 demo 第三幕（督導發送邀請碼）沒有畫面可演。本卡全部補齊。

## 修改檔案
1. `src/components/ResultTable.jsx`（改 — 加照護日誌入口）
2. `src/components/FamilyDiaryV3.jsx`（改 — 兩顆按鈕接路由）
3. `src/app/calculator/page.js`（改 — 步進器守衛）
4. `src/components/InstitutionDashboard.jsx`（改 — 邀請家屬彈窗）

## 任務 1：試算結果頁 → 照護日誌入口（流程圖 STEP 5）
於 `ResultTable.jsx` 的總覽表最底部（免責聲明之前）新增 CTA 卡：
```jsx
import Link from "next/link";
// 置於總覽表內容之後：
<Link href="/diary" className="block mt-6 rounded-2xl border-2 border-rose-200 bg-rose-50 p-4 hover:border-rose-400 transition-colors">
  <div className="flex items-center gap-3">
    <span className="text-2xl">📓</span>
    <div className="flex-1">
      <div className="text-sm font-bold text-rose-900">下一步：開始記錄照護日誌</div>
      <p className="text-xs text-rose-700/80 mt-0.5 leading-relaxed">
        每天 10 秒記錄長輩狀況，AI 幫您留意惡化徵兆；連動居服機構後還能查看服務紀錄。
      </p>
    </div>
    <span className="text-rose-400 text-lg">›</span>
  </div>
</Link>
```
文字內容一字不差照上方使用。

## 任務 2：家屬端兩顆按鈕接路由
`FamilyDiaryV3.jsx`：
1. 頂部加 `import { useRouter } from "next/navigation";`，
   主元件內加 `const router = useRouter();`
2. **Solo 預估額度 tab 的「重新試算」**：
   現況為 `onRecalc={()=>flashToast("正式版將導向試算平台（路由待接）")}`，
   改為 `onRecalc={()=>router.push("/calculator")}`。
3. **重評卡「用試算平台先估新等級」按鈕**：現況無 onClick，
   加上 `onClick={()=>router.push("/calculator")}`。
4. 「聯繫個管 1966」按鈕改為 `<a href="tel:1966">` 包裹（樣式不變，手機可直撥）。

## 任務 3：試算流程步進器守衛
`src/app/calculator/page.js`：已驗證缺陷——quiz 未完成即可點「3. 總覽表」。
修法（依現有 state 命名微調，邏輯必須等價）：
```jsx
// 各步驟的可點擊條件：
// step "quiz"  → 永遠可點
// step "calc"  → calcLevel !== null 才可點
// step "table" → calcLevel !== null 才可點
const stepEnabled = (id) =>
  id === "quiz" ? true : calcLevel !== null;

// 步進器按鈕：
<button
  onClick={() => stepEnabled(s.id) && setTab(s.id)}
  disabled={!stepEnabled(s.id)}
  className={`... ${stepEnabled(s.id) ? "" : "cursor-not-allowed"}`}
  title={stepEnabled(s.id) ? "" : "請先完成失能評估"}
>
```
未啟用步驟維持現有 opacity-40 樣式即可，但 hover 不得提升透明度、點擊無作用。
若專案中「quiz 完成」另有旗標（如 quizDone），以該旗標為準並回報採用的條件。

## 任務 4：機構端「邀請家屬連動」彈窗（demo 第三幕畫面）
`InstitutionDashboard.jsx`：
1. Header 右側新增按鈕：`邀請家屬連動`（樣式：白字、bg-blue-600、rounded-lg、
   與現有 header 風格一致，含 lucide `UserPlus` icon）。
2. 點擊開啟 modal（沿用現有 modal 版型）：
```
標題：邀請家屬連動個案
內文區：
  個案：王奶奶（A141408XXX）
  邀請碼（大字、font-mono、tracking-widest、可框選）：CARE01
  說明文字：「請家屬前往『照護一點通』首頁 → 我是家屬 → 輸入此邀請碼。
  連動後家屬可查看居服員服務紀錄與即時額度；家屬的照護日誌不會提供給機構。」
按鈕：〔複製邀請碼〕（navigator.clipboard.writeText("CARE01")，
      成功後按鈕文字變「✓ 已複製」2 秒）＋〔關閉〕
```
3. 邀請碼與個案先寫死常數 `const INVITE = { code:"CARE01", caseName:"王奶奶", caseId:"A141408XXX" };`
   （與家屬端 INVITE 一致；正式版接 Supabase，本卡不做）。

## 驗收條件
- [ ] `/calculator` 完成試算 → 總覽表底部出現 📓 卡 → 點擊導向 `/diary`
- [ ] `/diary` solo 模式 → 預估額度 tab → 「重新試算」導向 `/calculator`
- [ ] `/diary` connected 模式 → 觸發重評卡 → 「用試算平台先估新等級」導向 `/calculator`
- [ ] 「聯繫個管 1966」為 `tel:1966` 連結
- [ ] `/calculator` 首次進入 quiz 未完成時，「2. 補助試算」「3. 總覽表」不可點擊；
      完成評估後可自由切換
- [ ] `/institution` header 有「邀請家屬連動」→ modal 顯示 CARE01 → 複製功能正常 →
      說明文字含「家屬的照護日誌不會提供給機構」一句（一字不差）
- [ ] `npm run build` 通過；全程 console 無 error
- [ ] Demo 全鏈路手測一次：試算 → 📓 卡 → /diary → 輸入 CARE01 → connected →
      AI 分析 → 重評卡 → 回 /calculator（飛輪閉合）

## 禁止
- 不得改動 QuotaPanel / SubsidyCalculator 的任何金額計算
- 不得移除既有免責文案
- modal 不得使用 window.confirm / window.alert
