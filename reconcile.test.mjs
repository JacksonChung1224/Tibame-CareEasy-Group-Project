import { reconcile, resolveRow, resolveAmount, getExportBlockers } from './src/utils/reconcile.js';

function runTests() {
  let passed = 0;
  let failed = 0;

  function assertEqual(actual, expected, msg) {
    if (actual !== expected) {
      console.error(`❌ FAIL: ${msg}`);
      console.error(`  Expected: ${expected}`);
      console.error(`  Actual:   ${actual}`);
      failed++;
    } else {
      console.log(`✅ PASS: ${msg}`);
      passed++;
    }
  }

  // TEST data
  const csv = [
    { id: "c1", caseNatId: "A141408XXX", dateROC: "1150301", code: "BA15-1", category: 1, qty: 1, price: 50, workerNatId: "A123456789", hoursDerived: 1, startH: 9, startM: 30, endH: 10, endM: 30 },
    { id: "c2", caseNatId: "A141408XXX", dateROC: "1150302", code: "BA15-1", category: 1, qty: 1, price: 50, workerNatId: "A123456789", hoursDerived: 1, startH: 9, startM: 0, endH: 10, endM: 0 },
    { id: "c3", caseNatId: "A141408XXX", dateROC: "1150305", code: "BA02", category: 1, qty: 1, price: 40, workerNatId: "A123456789", hoursDerived: 0.5 },
    { id: "c4", caseNatId: "A141408XXX", dateROC: "1150305", code: "BA17e", category: 1, qty: 1, price: 30, workerNatId: "A123456789", hoursDerived: 0.5 },
    
    // H5 Cases
    { id: "c5", caseNatId: "A141408XXX", dateROC: "1150307", code: "BA02", category: 1, qty: 1, price: 40, workerNatId: "W1" },
    { id: "c6", caseNatId: "B123", dateROC: "1150308", code: "BA01", category: 1, qty: 1, price: 50, workerNatId: "W1" },
    { id: "c7", caseNatId: "B123", dateROC: "1150308", code: "BA02", category: 1, qty: 1, price: 40, workerNatId: "W1" },
    { id: "c8", caseNatId: "C123", dateROC: "1150309", code: "BA01", category: 1, qty: 1, price: 195, workerNatId: "W1", startH: 10, startM: 0, endH: 11, endM: 0 },
  ];

  const ocr = [
    { id: "o1", caseNatId: "A141408XXX", dateROC: "1150301", code: "BA15-1", qty: 1, price: 50, hoursDerived: 1, startH: 9, startM: 45, endH: 10, endM: 45 },
    { id: "o2", caseNatId: "A141408XXX", dateROC: "1150305", code: "BA02", qty: 2, price: 40, hoursDerived: 0.5 }, // qty mismatch -> D3
    { id: "o3", caseNatId: "A141408XXX", dateROC: "1150305", code: "BA17e", qty: 1, price: 30, hoursDerived: 0.5 },
    { id: "o4", caseNatId: "A141408XXX", dateROC: "1150306", code: "BA05", qty: 1, price: 310, hoursDerived: 1 }, // no_schedule
    
    // H5 Cases
    { id: "o5", caseNatId: "A141408XXX", dateROC: "1150307", code: "BA03", qty: 1, price: 40, hoursDerived: 1 }, // D4
    { id: "o6", caseNatId: "B123", dateROC: "1150308", code: "BA03", qty: 1, price: 50, hoursDerived: 1 }, // no_schedule x1 (c6, c7 become D1)
    { id: "o7", caseNatId: "C123", dateROC: "1150309", code: "BA01", qty: 1, price: 300, hoursDerived: 1 }, // H2 case, ok
  ];

  const res = reconcile(csv, ocr);

  assertEqual(res.length, 10, "Total rows is 10");
  
  const ok1 = res.find(r => r.code === "BA15-1" && r.status === "ok");
  assertEqual(!!ok1, true, "Find ok for BA15-1");
  assertEqual(ok1.startM, 45, "H1 Regression: ok row time = ocr time");

  const d1 = res.find(r => r.status === "D1" && r.dateROC === "1150302");
  assertEqual(d1.code, "BA15-1", "D1 code is BA15-1");
  assertEqual(d1.startH, 9, "H1 Regression: D1 time uses csv time");

  const d3 = res.find(r => r.status === "D3");
  assertEqual(d3.code, "BA02", "D3 is BA02");
  assertEqual(d3.qty, 2, "D3 qty is from OCR (2)");
  assertEqual(d3.csvQty, 1, "D3 csvQty is 1");

  // D3 resolving system
  d3.decision = "system";
  const resolvedD3 = resolveRow(d3);
  assertEqual(resolvedD3.include, true, "D3 include is true");
  assertEqual(resolvedD3.values[4], 1, "D3 採系統 → 解析值 qty = 排班(1)");
  
  // D3 resolving system using resolveAmount
  const d3Amt = resolveAmount(d3);
  assertEqual(d3Amt.subtotal, 40, "D3 採系統 → resolveAmount.subtotal = 排班單價(40) * 排班數量(1)");

  const ok2 = res.find(r => r.code === "BA17e" && r.status === "ok");
  assertEqual(!!ok2, true, "Find ok for BA17e");

  const ns1 = res.find(r => r.status === "no_schedule" && r.code === "BA05");
  assertEqual(!!ns1, true, "Find no_schedule for BA05");

  // no_schedule resolving system (default)
  ns1.decision = "system";
  const resolvedNsSys = resolveRow(ns1);
  assertEqual(resolvedNsSys.include, false, "no_schedule 採系統（預設）→ include=false");
  
  // no_schedule resolving paper
  ns1.decision = "paper";
  const resolvedNsPap = resolveRow(ns1);
  assertEqual(resolvedNsPap.include, true, "no_schedule 採紙本 → include=true");
  assertEqual(resolvedNsPap.values[2], "BA05", "no_schedule 採紙本 → 解析值 code = 紙本(BA05)");

  // no_schedule auto-fill worker test
  assertEqual(ns1.workerNatId, "A123456789", "no_schedule 自動帶入排班表第一人的服務人員身分證");
  assertEqual(ns1.isWorkerAutoFilled, true, "no_schedule 標記為自動帶入");

  // no_schedule resolveAmount when worker is missing (simulate empty schedule scenario by clearing auto-fill)
  ns1.workerNatId = null;
  const blockersNs = getExportBlockers([ns1]);
  // Wait, our new logic in getExportBlockers checks `hasAnyWorker = rows.some(r => r.csvWorkerNatId || r.workerNatId);`
  // So if we only pass `[ns1]` to getExportBlockers and ns1 has no workerNatId, missingWorker should be 1.
  assertEqual(blockersNs.missingWorker, 1, "排班完全無人且紀錄無人員時 → missingWorker === 1");
  
  // restore workerNatId for further tests
  ns1.workerNatId = "A123456789";
  const nsAmt = resolveAmount(ns1);
  assertEqual(nsAmt.subtotal, 310, "no_schedule 採紙本且有服務人員 → subtotal 正確");

  // H5 Cases validation
  const d4 = res.find(r => r.status === "D4");
  assertEqual(!!d4, true, "Find D4 case");
  assertEqual(d4.code, "BA03", "D4 code is OCR code");
  assertEqual(d4.csvCode, "BA02", "D4 csvCode is retained");

  // D4 resolving paper
  d4.decision = "paper";
  const resolvedD4 = resolveRow(d4);
  assertEqual(resolvedD4.include, true, "D4 include is true");
  assertEqual(resolvedD4.values[2], "BA03", "D4 採紙本 → 解析值 code = 紙本(BA03)");

  const b123_d1 = res.filter(r => r.status === "D1" && r.caseNatId === "B123");
  const b123_ns = res.filter(r => r.status === "no_schedule" && r.caseNatId === "B123");
  assertEqual(b123_d1.length, 2, "2:1 mismatch yields 2 D1s");
  assertEqual(b123_ns.length, 1, "2:1 mismatch yields 1 no_schedule");

  // D1 resolving system
  const d1Case = b123_d1[0];
  d1Case.decision = "system";
  const resolvedD1Sys = resolveRow(d1Case);
  assertEqual(resolvedD1Sys.include, true, "D1 採系統 → include=true");
  assertEqual(resolvedD1Sys.values[2], "BA01", "D1 採系統 → 解析值 = 排班");
  assertEqual(resolvedD1Sys.values[4], 1, "D1 採系統 → qty = 排班");
  assertEqual(resolvedD1Sys.values[5], 50, "D1 採系統 → price = 排班");

  // D1 resolveAmount
  const d1Amt = resolveAmount(d1Case);
  assertEqual(d1Amt.subtotal, 50, "D1 採系統 → resolveAmount 傳回 qty * price = 50");

  // D1 resolving paper
  d1Case.decision = "paper";
  const resolvedD1Pap = resolveRow(d1Case);
  assertEqual(resolvedD1Pap.include, false, "D1 採紙本 → include=false");

  // Test unresolved rows and getExportBlockers
  const unresolvedRes = reconcile(csv, ocr);
  const unresolvedD1 = unresolvedRes.find(r => r.status === "D1");
  assertEqual(unresolvedD1.decision, null, "D1 初始 decision 為 null");
  const resolvedNull = resolveRow(unresolvedD1);
  assertEqual(resolvedNull.include, null, "未裁決列 include 為 null");

  const blockers = getExportBlockers(unresolvedRes);
  assertEqual(blockers.undecided, 7, "總共有 7 筆衝突紀錄待裁決");

  // no_schedule fallback testing
  const nsCase = unresolvedRes.find(r => r.status === "no_schedule" && r.code === "BA05");
  nsCase.decision = "paper"; // 採紙本
  // OCR only has qty and price for BA05. Let's say price is missing.
  // Wait, BA05 in ocr has price 310. Let's test with a mock row
  const mockFallbackRow = { ...nsCase, price: null, code: "BA05" };
  const fallbackRes = resolveRow(mockFallbackRow);
  assertEqual(fallbackRes.values[5], 310, "BA05 單價空時 fallback 到 310 (BA_MAP)");

  const c123_ok = res.find(r => r.status === "ok" && r.caseNatId === "C123");
  assertEqual(!!c123_ok, true, "Find C123 ok");
  assertEqual(c123_ok.startH, 10, "H1 Regression: ok row missing OCR time falls back to CSV time");

  console.log(`\nTests finished: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests();

