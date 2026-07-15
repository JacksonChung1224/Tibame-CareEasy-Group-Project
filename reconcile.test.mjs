import { reconcile } from './src/utils/reconcile.js';

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
    { id: "o4", caseNatId: "A141408XXX", dateROC: "1150306", code: "BA05", qty: 1, price: 310, hoursDerived: 1 }, // D2
    
    // H5 Cases
    { id: "o5", caseNatId: "A141408XXX", dateROC: "1150307", code: "BA03", qty: 1, price: 40, hoursDerived: 1 }, // D4
    { id: "o6", caseNatId: "B123", dateROC: "1150308", code: "BA03", qty: 1, price: 50, hoursDerived: 1 }, // D2x1 (c6, c7 become D1)
    { id: "o7", caseNatId: "C123", dateROC: "1150309", code: "BA01", qty: 1, price: 300, hoursDerived: 1 }, // H2: priceWarning
  ];

  const res = reconcile(csv, ocr);

  assertEqual(res.length, 10, "Total rows is 10");
  
  const ok1 = res.find(r => r.code === "BA15-1" && r.status === "ok");
  assertEqual(!!ok1, true, "Find ok for BA15-1");
  assertEqual(ok1.priceWarning, false, "BA15-1 priceWarning is false");
  assertEqual(ok1.startM, 45, "H1 Regression: ok row time = ocr time");

  const d1 = res.find(r => r.status === "D1" && r.dateROC === "1150302");
  assertEqual(d1.code, "BA15-1", "D1 code is BA15-1");
  assertEqual(d1.startH, 9, "H1 Regression: D1 time uses csv time");

  const d3 = res.find(r => r.status === "D3");
  assertEqual(d3.code, "BA02", "D3 is BA02");
  assertEqual(d3.qty, 2, "D3 qty is from OCR (2)");
  assertEqual(d3.csvQty, 1, "D3 csvQty is 1");
  assertEqual(d3.priceWarning, true, "BA02 priceWarning is true");

  const ok2 = res.find(r => r.code === "BA17e" && r.status === "ok");
  assertEqual(!!ok2, true, "Find ok for BA17e");
  assertEqual(ok2.priceWarning, true, "BA17e priceWarning is true");

  const d2 = res.find(r => r.status === "D2" && r.code === "BA05");
  assertEqual(!!d2, true, "Find D2 for BA05");

  // H5 Cases validation
  const d4 = res.find(r => r.status === "D4");
  assertEqual(!!d4, true, "Find D4 case");
  assertEqual(d4.code, "BA03", "D4 code is OCR code");
  assertEqual(d4.csvCode, "BA02", "D4 csvCode is retained");

  const b123_d1 = res.filter(r => r.status === "D1" && r.caseNatId === "B123");
  const b123_d2 = res.filter(r => r.status === "D2" && r.caseNatId === "B123");
  assertEqual(b123_d1.length, 2, "2:1 mismatch yields 2 D1s");
  assertEqual(b123_d2.length, 1, "2:1 mismatch yields 1 D2");

  const c123_ok = res.find(r => r.status === "ok" && r.caseNatId === "C123");
  assertEqual(!!c123_ok, true, "Find C123 ok");
  assertEqual(c123_ok.priceWarning, true, "H2 Regression: priceWarning true when OCR price != BA_MAP price");
  assertEqual(c123_ok.startH, 10, "H1 Regression: ok row missing OCR time falls back to CSV time");

  console.log(`\nTests finished: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests();
