# 任務卡 G｜家屬端日期選擇升級（反饋 8）
> 優先級：🟡 M3 後、demo 前｜需 Specialist 驗證：否

```
【全域規則 — 必須遵守】
1. 禁止修改 signalEngine.js 規則邏輯（日期鍵格式維持 "M/D"，引擎不動）。
2. 只修改 src/components/FamilyDiaryV3.jsx。
3. 完成後逐條回報驗收條件，附 npm run build 結果。
```

## 背景與設計
現況日期列是寫死的 8 個日期（6/18–6/27），demo 當天（7/22）看起來是
一個月前的舊資料，且使用者無法選其他日期。升級為：
**滾動 14 天日期列 + 任意日期選擇器**，mock 資料改為「相對今天」產生，
demo 任何一天執行畫面都是新鮮的。

## 任務 1：日期工具（元件內小函式）
```js
const fmtMD = (d) => `${d.getMonth()+1}/${d.getDate()}`;          // Date → "M/D"
const daysAgo = (n) => { const d=new Date(); d.setDate(d.getDate()-n); return d; };
const LAST_14 = Array.from({length:14}, (_,i) => fmtMD(daysAgo(i))); // 今天在前
```

## 任務 2：mock 資料改為相對日期
`FAMILY_LOGS` 與 `WORKER_LOGS` 的鍵由寫死日期改為相對產生，
**維持與現有內容相同的間隔結構**（訊號劇本不變）：
```js
// 家屬日誌：今天、-2、-3、-4、-5、-7 天（對應原 6/27,25,24,23,22,20）
const FAMILY_LOGS = {
  [fmtMD(daysAgo(0))]: { tags:[], text:"今天居服員來了…" },
  [fmtMD(daysAgo(2))]: { tags:["sleep_bad","walk_weak"], text:"夜裡不太好睡…" },
  [fmtMD(daysAgo(3))]: { tags:["choke"], text:"今天吃東西嗆到了…" },
  [fmtMD(daysAgo(4))]: { tags:["good_day"], text:"精神比昨天好…" },
  [fmtMD(daysAgo(5))]: { tags:["walk_weak"], text:"…腿沒力。" },
  [fmtMD(daysAgo(7))]: { tags:["pain","choke"], text:"腰說很酸…" },
};
// 居服紀錄：今天、-5、-7、-9 天（對應原 6/27,22,20,18），內容不變
```
文字內容照現有 mock 原樣搬移，只換鍵。

## 任務 3：DatePicker 升級
1. 日期列改渲染 `LAST_14`（今天在最左，標籤加「今天」小字），
   紅/綠點邏輯不變（有居服紀錄綠點、有日誌紅點）。
2. 列尾加一顆 📅 按鈕：點擊展開原生 `<input type="date">`
   （max=今天），選擇後：
   - 該日期轉為 "M/D" 設為 selectedDate；
   - 若不在 LAST_14 內，於日期列最前臨時插入該日期 chip（標記「自選」）。
3. **選中日期維持現有亮框樣式**（teal 邊框）；今天未被選中時
   以淡色外框提示（讓「今天」永遠可辨識）。
4. 選擇未來日期不可能發生（max 限制），仍加防禦：未來日期忽略。

## 任務 4：一致性
- `handleDateSelect`、儲存、chips 還原等邏輯不變（鍵仍為 "M/D" 字串）。
- AI 分析 tab 標題文字「近 14 天」與滾動窗口天然一致，無需改。
- 就醫摘要、訊號引擎呼叫不變（引擎已按 M/D 排序）。

## 驗收條件
- [ ] 日期列顯示最近 14 天、今天在首位且標示「今天」
- [ ] mock 紅綠點分佈與現況等價（間隔結構相同），AI 分析 tab 訊號輸出
      與升級前一致（行走/移位、吞嚥、睡眠等訊號照常觸發）
- [ ] 📅 可選任意過去日期並寫日誌；儲存後該日紅點出現
- [ ] 選中亮框樣式與現況一致；切換日期草稿正確載入
- [ ] `npm run build` 通過、console 無 error

## 已知限制（記入程式註解，不需解決）
- "M/D" 鍵不含年份，跨年 demo（12月→1月）排序會異常；正式版改 ISO 日期鍵
  （屆時 signalEngine 的 dateKey 需同步調整，屬 Backlog）。
