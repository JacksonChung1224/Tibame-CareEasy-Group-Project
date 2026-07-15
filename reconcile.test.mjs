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
    { id: "c1", caseNatId: "A141408XXX", dateROC: "1150301", code: "BA15-1", category: 1, qty: 1, price: 50, workerNatId: "A123456789", hoursDerived: 1 },
    { id: "c2", caseNatId: "A141408XXX", dateROC: "1150302", code: "BA15-1", category: 1, qty: 1, price: 50, workerNatId: "A123456789", hoursDerived: 1 },
    { id: "c3", caseNatId: "A141408XXX", dateROC: "1150305", code: "BA02", category: 1, qty: 1, price: 40, workerNatId: "A123456789", hoursDerived: 0.5 },
    { id: "c4", caseNatId: "A141408XXX", dateROC: "1150305", code: "BA17e", category: 1, qty: 1, price: 30, workerNatId: "A123456789", hoursDerived: 0.5 },
  ];

  const ocr = [
    { id: "o1", caseNatId: "A141408XXX", dateROC: "1150301", code: "BA15-1", qty: 1, price: 50, hoursDerived: 1 },
    { id: "o2", caseNatId: "A141408XXX", dateROC: "1150305", code: "BA02", qty: 2, price: 40, hoursDerived: 0.5 }, // qty mismatch -> D3
    { id: "o3", caseNatId: "A141408XXX", dateROC: "1150305", code: "BA17e", qty: 1, price: 30, hoursDerived: 0.5 },
    { id: "o4", caseNatId: "A141408XXX", dateROC: "1150306", code: "BA05", qty: 1, price: 310, hoursDerived: 1 }, // D2
  ];

  const res = reconcile(csv, ocr);

  assertEqual(res.length, 5, "Total rows is 5");
  
  const ok1 = res.find(r => r.code === "BA15-1" && r.status === "ok");
  assertEqual(!!ok1, true, "Find ok for BA15-1");
  assertEqual(ok1.priceWarning, false, "BA15-1 priceWarning is false");

  const d1 = res.find(r => r.status === "D1");
  assertEqual(d1.code, "BA15-1", "D1 code is BA15-1");
  assertEqual(d1.dateROC, "1150302", "D1 date is 1150302");

  const d3 = res.find(r => r.status === "D3");
  assertEqual(d3.code, "BA02", "D3 is BA02");
  assertEqual(d3.qty, 2, "D3 qty is from OCR (2)");
  assertEqual(d3.csvQty, 1, "D3 csvQty is 1");
  assertEqual(d3.priceWarning, true, "BA02 priceWarning is true");

  const ok2 = res.find(r => r.code === "BA17e" && r.status === "ok");
  assertEqual(!!ok2, true, "Find ok for BA17e");
  assertEqual(ok2.priceWarning, true, "BA17e priceWarning is true");

  const d2 = res.find(r => r.status === "D2");
  assertEqual(d2.code, "BA05", "D2 code is BA05");

  console.log(`\nTests finished: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests();
