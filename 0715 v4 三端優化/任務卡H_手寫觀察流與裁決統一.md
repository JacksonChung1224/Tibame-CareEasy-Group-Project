# 任務卡 H｜手寫觀察紀錄資料流 + 裁決機制統一（D1 / no_schedule）
> 優先級：🔴 demo 前｜Specialist 狀態：裁決統一已簽核 ✅；手寫觀察流不涉費率

```
【全域規則 — 必須遵守】
1. 禁止修改 careData.js 費率、signalEngine.js 規則邏輯、scheduleImport.js。
2. 只修改：src/components/InstitutionDashboard.jsx、src/utils/reconcile.js、
   reconcile.test.mjs、docs/reconciliation-rules.md、src/components/FamilyDiaryV3.jsx（僅任務 4 的 mock 文字）。
3. 完成後逐條回報驗收條件，附測試輸出與 npm run build 結果。
```

## 設計總則（先讀懂再動手）
一張紙本紀錄表 = 兩類資訊、兩條資料流：
```
📋 紙本紀錄表 ── OCR 辨識 ──┬── 核銷欄位（BA碼/數量/時段）→ 對帳比對室 → 官方申報檔
                            └── 個案特殊狀況（手寫觀察）→ 個案連動管理 → 推送家屬端
```
手寫觀察**永不進入**核銷比對與匯出；兩條流的「確認」動作彼此獨立，
其中一條未確認不阻擋另一條。

## 任務 1：OCR 步驟新增「個案特殊狀況」辨識區
`InstitutionDashboard.jsx` 步驟 2：
1. 新增 state（mock 資料，模擬辨識自紙本「個案特殊狀況」欄）：
```js
const [careNotes, setCareNotes] = useState([]);
const MOCK_CARE_NOTES = [
  { id:"n1", caseNatId:"A141408XXX", noteDate:"5/4",
    text:"案主今日早上吃早餐時不慎跌倒，左膝蓋稍微擦傷。", confidence:0.92, confirmed:false },
  { id:"n2", caseNatId:"A141408XXX", noteDate:"5/5",
    text:"家屬早上帶案主運動時不慎跌倒，左肩、左手背、左膝上方均有輕微擦傷。", confidence:0.78, confirmed:false },
  { id:"n3", caseNatId:"A141408XXX", noteDate:"5/18",
    text:"個案右耳道有分泌物流出，會用手抓癢耳朵，右耳有異味。", confidence:0.66, confirmed:false },
];
```
2. 於核銷欄位確認表格**下方**新增獨立區塊「📝 個案特殊狀況（手寫辨識）」：
   - 每則為可編輯 textarea（日期欄可編輯）；confidence < 0.85 標黃，
     須經編輯或點〔✓ 確認〕才變 `confirmed:true`。
   - 區塊底部按鈕〔確認並存入照護紀錄〕：僅將 `confirmed` 的則數存入
     個案連動管理的照護觀察（見任務 2），toast：`已存入 N 則照護觀察`。
   - 區塊說明小字（一字不差）：`此區內容供家屬照護參考，不列入核銷申報。`
3. **兩流獨立**：此區塊的確認狀態不影響「確認匯入核銷」按鈕，反之亦然。

## 任務 2：個案連動管理新增「照護觀察」區
已連動個案展開區（任務卡 F 任務 7 的產物）內，於「本月已確認服務紀錄」下方新增：
1. 子區塊「📝 照護觀察（居服員手寫紀錄）」：列出已確認 careNotes
   （日期＋全文）；空狀態顯示：`尚無照護觀察——可於核銷流程的 OCR 步驟辨識紙本手寫紀錄`。
2. 〔推送至家屬端〕按鈕行為更新：toast 改為
   `已同步 N 筆服務紀錄與 M 則照護觀察至家屬端`（N、M 取實際數）。
3. 機制說明小字更新（一字不差）：
   `督導確認的紙本實績與手寫觀察，即為家屬端「居服紀錄」的資料來源——一筆紀錄，三種價值。`

## 任務 3：裁決機制統一（Specialist 已簽核 ✅）
`reconcile.js` 與 UI：D1 與 no_schedule 比照 D3/D4 加入採紙本/採系統 radio。
**統一語義：裁決 = 選擇哪一邊的資料為真；選中的一邊沒有該筆 → 該筆不成立、不列入核銷明細。**

| 狀態 | 採紙本（含義） | 採系統（含義） | 預設 |
|---|---|---|---|
| D3 數量差異 | 以紙本值申報 | 以排班值申報 | 採紙本 |
| D4 項目差異 | 以紙本碼申報 | 以排班碼申報 | 採紙本 |
| D1 排班有紙本無 | 紙本為真=未執行 → **不列入**，原因必填 | 排班為真=已執行 → **以排班值列入**，備註選填 | 採紙本 |
| no_schedule 紙本有排班無 | 紙本為真=已執行 → **以紙本值列入** | 排班為真=無此服務 → **不列入** | **採系統** |

實作：
1. 四種狀態的列皆帶 `decision`（預設如上表）；`resolveRow(row)` 擴充：
   回傳 `{ include:boolean, values:官方11欄值 }`——
   include=false 者僅入異常附表。
2. UI 督導處理註記欄：四種狀態統一為「radio ＋ 備註輸入框」版型；
   僅 D1 採紙本時備註為必填（未執行原因），其餘選填。
3. 匯出把關更新：條件 = 「無缺時段」且「D1 採紙本者皆已填原因」。
4. 異常附表：所有 include=false 的列（含裁決欄與備註）。
5. `reconcile.test.mjs` 新增 3 案：
   D1 採系統 → include=true 且值=排班；
   no_schedule 採紙本 → include=true 且值=紙本；
   no_schedule 採系統（預設）→ include=false。
6. `docs/reconciliation-rules.md` 改版 v3：以上表取代原處理原則表，
   標註「裁決語義與預設值已經 CMS Rules Specialist 簽核（日期）」。

## 任務 4：家屬端 mock 呼應（demo 故事線）
`FamilyDiaryV3.jsx` 的 `WORKER_LOGS`：將其中一筆（原「陪同就醫，步態需攙扶」
之外再取一筆）的 `obs` 文字改為與任務 1 的 n1 完全相同：
`案主今日早上吃早餐時不慎跌倒，左膝蓋稍微擦傷。`
——demo 可展示「機構端確認的那句話，出現在家屬端居服紀錄卡」，
且「跌倒」命中訊號引擎 mobility 關鍵字，維持兩端一致紅色訊號劇本。
除 obs 文字外不得改動任何邏輯。

## 驗收條件
- [ ] OCR 步驟出現手寫觀察區；n2/n3 低信心標黃，未確認不能存入；
      存入 toast 則數正確
- [ ] 手寫觀察未確認時，核銷「確認匯入」不受阻擋（反向亦然）
- [ ] 個案連動頁顯示已存入之照護觀察；推送 toast 含 N 筆＋M 則
- [ ] 四種差異狀態皆有採紙本/採系統 radio 且預設正確；
      D1 採系統 → 該筆出現在匯出 Sheet1（開檔驗證，值=排班）；
      no_schedule 採紙本 → 出現在 Sheet1（值=紙本）；預設狀態下兩者皆只在異常附表
- [ ] D1 採紙本未填原因 → 匯出擋；填畢即放行
- [ ] `node reconcile.test.mjs` 全過（含新 3 案）
- [ ] 家屬端居服紀錄卡出現與機構端相同之跌倒觀察文字；
      AI 分析「行走/移位」仍為紅色兩端一致
- [ ] `npm run build` 通過、console 無 error
- [ ] `reconciliation-rules.md` v3 已更新並註記簽核

## 禁止
- 手寫觀察不得出現在核銷明細 Sheet1 或異常附表的申報相關欄位
- 不得改動 signalEngine 關鍵字表（「跌倒」已在表內，無需新增）
