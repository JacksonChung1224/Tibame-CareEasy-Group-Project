# CMS 引擎校準工具包 — 交付說明

## 四個檔案

| 檔案 | 性質 | 能否讓開發 Agent 直接執行 |
|------|------|--------------------------|
| `cmsEngine.js` | 重構後的評估引擎（基礎+三層加權，雙路徑共用） | ❌ 改判級結果，須先驗證再合併 |
| `backtest.mjs` | 回測腳本（唯讀，印混淆矩陣） | ✅ 唯讀，可直接跑 |
| `testCases.json` | 合成測試案例（16 筆，依官方文件手寫） | ✅ 資料檔 |
| `README_交付說明.md` | 本文件 | — |

## 給開發 Agent 的執行指令

### 第一步（安全，先做）：用合成案例驗證邏輯
```
node backtest.mjs --synthetic
```
預期：75% 完全命中、100% 在 ±1 級內。若數字不同，代表套用過程有誤。

### 第二步（核心校準）：用真實資料回測
等 assessment_records 有足夠的 actual_cms_level 後：
```
node backtest.mjs --api https://<你的網域>/api/admin/records care2026
```
看混淆矩陣的對角線偏移，據此調整 cmsEngine.js 裡的 THRESHOLDS。

## ⚠️ 套用 cmsEngine.js 的正確流程（不要讓 Agent 直接覆蓋上線）

1. Agent 將 cmsEngine.js 的 estimateLevelDementia / estimateLevelNormal
   替換進 src/utils/careData.js（或 import 進來）
2. 跑 `node backtest.mjs --synthetic` 確認沒跑壞
3. **CMS Rules Specialist 用真實案例人工驗證輸出**（你們團隊的既定機制）
4. 通過後才 commit，並在 CHANGELOG 的演算法區塊記為 MINOR 版號變更

## 校準怎麼做（CMS Rules Specialist 的工作）

只改 cmsEngine.js 最上方的 `THRESHOLDS` 物件，不要動下面的邏輯。
- 混淆矩陣某級「系統性高估」→ 把該級的 barthel 切點調低
- 某級「系統性低估」→ 把該級切點調高
- 改完重跑 backtest，確認該級命中且沒弄壞其他級

## 重要聲明（務必對團隊與稽核說明）

官方 CMS 判定為未公開的決策樹，本引擎是「逼近估算」，定位為家屬事前參考。
前端「僅供參考，正式評估請洽 1966」的聲明必須保留。
