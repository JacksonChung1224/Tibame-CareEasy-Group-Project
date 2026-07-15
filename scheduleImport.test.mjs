import { parseScheduleSheet, OFFICIAL_HEADERS } from './src/utils/scheduleImport.js';

function runTests() {
  let passed = 0;
  let failed = 0;

  function assertEqual(actual, expected, msg) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      console.error(`❌ FAIL: ${msg}`);
      console.error(`  Expected: ${JSON.stringify(expected)}`);
      console.error(`  Actual:   ${JSON.stringify(actual)}`);
      failed++;
    } else {
      console.log(`✅ PASS: ${msg}`);
      passed++;
    }
  }

  // 1. 正常解析
  const rows1 = [
    ["前置說明1"],
    ["前置說明2"],
    OFFICIAL_HEADERS.concat(["忽略欄1", "忽略欄2"]),
    ["A123", 1150301, "BA15-1", 1, 2, 50, "W1", 9, 30, 11, 0, "ignore"],
    ["A123", "1150302", " BA02 ", "2", " 1 ", "", "W2", 14, 0, 14, 30, "ignore"]
  ];
  const res1 = parseScheduleSheet(rows1);
  assertEqual(res1.fatalError, null, "正常解析 - 無 fatalError");
  assertEqual(res1.errors.length, 0, "正常解析 - 無 errors");
  assertEqual(res1.rows.length, 2, "正常解析 - row 數量");
  assertEqual(res1.rows[0].dateROC, "1150301", "正常解析 - 數字轉字串");
  assertEqual(res1.rows[0].hoursDerived, 1.5, "正常解析 - derived hours = 1.5");
  assertEqual(res1.rows[1].price, null, "正常解析 - price null");
  assertEqual(res1.rows[1].code, "BA02", "正常解析 - code trim");

  // 2. 缺欄整批失敗
  const rows2 = [
    OFFICIAL_HEADERS,
    ["A123", 1150301, "BA15-1"] // 缺數量
  ];
  const res2 = parseScheduleSheet(rows2);
  assertEqual(res2.fatalError !== null, true, "缺欄整批失敗");

  // 3. 欄位驗證錯誤入 errors
  const rows3 = [
    OFFICIAL_HEADERS,
    ["A123", "115030", "BA15", 3, 1.5, "abc", "W1", 9, 30, 9, 0] 
    // 日期非7碼, category非1/2, qty小數, price字串, 結束<起始
  ];
  const res3 = parseScheduleSheet(rows3);
  assertEqual(res3.fatalError, null, "驗證錯誤不 fatal");
  assertEqual(res3.errors.length, 1, "驗證錯誤入 errors");
  const errs = res3.errors[0].reasons;
  assertEqual(errs.includes("服務日期非7碼"), true, "錯誤捕捉: 日期");
  assertEqual(errs.includes("服務類別必須為1或2"), true, "錯誤捕捉: 類別");
  assertEqual(errs.includes("數量必須為正整數"), true, "錯誤捕捉: 數量");
  assertEqual(errs.includes("單價格式錯誤"), true, "錯誤捕捉: 單價");
  assertEqual(errs.includes("結束時間必須晚於起始時間"), true, "錯誤捕捉: 時間");

  console.log(`\nTests finished: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests();
