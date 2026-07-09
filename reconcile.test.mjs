import { reconcile } from './src/utils/reconcile.js';

const csvRows = [
  { id: 'c1', date: '6/25', caseId: 'A141408XXX', worker: '陳小美', code: 'BA02', hours: 1 },
  { id: 'c2', date: '6/25', caseId: 'A141408XXX', worker: '陳小美', code: 'BA03', hours: 0.5 },
  { id: 'c3', date: '6/26', caseId: 'A141408XXX', worker: '陳小美', code: 'BA05', hours: 1 },
  { id: 'c4', date: '6/27', caseId: 'A141408XXX', worker: '陳小美', code: 'BA02', hours: 1.5 },
  { id: 'c5', date: '6/27', caseId: 'A141408XXX', worker: '陳小美', code: 'BA07', hours: 1 },
  { id: 'c6', date: '6/28', caseId: 'A141408XXX', worker: '陳小美', code: 'BA04', hours: 1 },
];

const ocrRows = [
  { id: 'o1', date: '6/25', caseId: 'A141408XXX', code: 'BA02', hours: 1 },
  { id: 'o2', date: '6/25', caseId: 'A141408XXX', code: 'BA03', hours: 0.5 },
  { id: 'o3', date: '6/27', caseId: 'A141408XXX', code: 'BA02', hours: 1 }, // D3
  { id: 'o4', date: '6/27', caseId: 'A141408XXX', code: 'BA07', hours: 1 },
  { id: 'o5', date: '6/28', caseId: 'A141408XXX', code: 'BA07', hours: 1 }, // D4 (csv: BA04)
  { id: 'o6', date: '6/29', caseId: 'A141408XXX', code: 'BA05', hours: 1.5 }, // D2
];

console.log("=== Running reconcile.test.mjs ===");

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failCount++;
  }
}

// 1. 完整 mock
const { rows, summary } = reconcile(csvRows, ocrRows);
assert(summary.ok === 3 && summary.d1 === 1 && summary.d2 === 1 && summary.d3 === 1 && summary.d4 === 1, "完整 mock -> summary 恰為 {ok:3, d1:1, d2:1, d3:1, d4:1}");

// 2. 哨兵案例：6/25 同日兩筆（BA02+BA03）→ 兩筆皆 OK、零 D3/D4
const d25ok = rows.filter(r => r.date === '6/25' && r.status === 'ok').length;
assert(d25ok === 2, "哨兵案例：同日兩筆皆 OK 不錯亂");

// 3. D3：同鍵時數不符 -> 以紙本時數為準
const d3Row = rows.find(r => r.status === 'D3');
assert(d3Row && d3Row.hours === 1 && d3Row.csvHours === 1.5, "D3: 以紙本時數為準、csvHours 保留");

// 4. D4：同日碼不符 -> 以紙本碼為準
const d4Row = rows.find(r => r.status === 'D4');
assert(d4Row && d4Row.code === 'BA07' && d4Row.csvCode === 'BA04', "D4: 以紙本碼為準、csvCode 保留");

// 5. 同日剩餘 2:1 (不猜)
const { summary: s2 } = reconcile(
  [
    { id: 'c1', date: '7/1', caseId: 'A', code: 'BA02', hours: 1 },
    { id: 'c2', date: '7/1', caseId: 'A', code: 'BA03', hours: 1 }
  ],
  [
    { id: 'o1', date: '7/1', caseId: 'A', code: 'BA07', hours: 1 }
  ]
);
assert(s2.d4 === 0 && s2.d1 === 2 && s2.d2 === 1, "同日剩餘 2:1 (不猜) -> 不產生 D4，各自成 D1/D2");

// 6. 空 OCR -> 全部 D1; 空 CSV -> 全部 D2
const { summary: s3 } = reconcile([{ id: 'c1', date: '7/1', caseId: 'A', code: 'BA', hours: 1 }], []);
assert(s3.d1 === 1 && s3.d2 === 0, "空 OCR -> 全部 D1");
const { summary: s4 } = reconcile([], [{ id: 'o1', date: '7/1', caseId: 'A', code: 'BA', hours: 1 }]);
assert(s4.d1 === 0 && s4.d2 === 1, "空 CSV -> 全部 D2");

// 7. hours 型別容錯
const { summary: s5 } = reconcile(
  [{ id: 'c1', date: '7/1', caseId: 'A', code: 'BA02', hours: "1.5" }],
  [{ id: 'o1', date: '7/1', caseId: 'A', code: 'BA02', hours: 1.5 }]
);
assert(s5.ok === 1, "hours 型別容錯：字串與數字視為相同");

if (failCount > 0) {
  process.exit(1);
} else {
  console.log("All tests passed!");
}
