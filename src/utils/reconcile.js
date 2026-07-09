export function reconcile(csvRows, ocrRows) {
  let rows = [];
  let usedCsv = new Set();
  let usedOcr = new Set();

  // ── 第一輪：精確鍵配對（caseId + date + code）──
  for (const csv of csvRows) {
    const match = ocrRows.find(o => 
      !usedOcr.has(o.id) &&
      o.caseId === csv.caseId &&
      o.date === csv.date &&
      o.code === csv.code
    );

    if (match) {
      usedCsv.add(csv.id);
      usedOcr.add(match.id);
      if (parseFloat(csv.hours) === parseFloat(match.hours)) {
        rows.push({
          id: `ok-${match.id}`,
          date: csv.date,
          caseId: csv.caseId,
          worker: csv.worker,
          code: match.code,
          hours: match.hours,
          status: "ok",
          source: "ocr_confirmed",
          note: ""
        });
      } else {
        rows.push({
          id: `d3-${match.id}`,
          date: csv.date,
          caseId: csv.caseId,
          worker: csv.worker,
          code: match.code,
          hours: match.hours,
          csvHours: csv.hours,
          status: "D3",
          source: "ocr_confirmed",
          note: `原時數: ${csv.hours}h`
        });
      }
    }
  }

  // ── 第二輪：同日碼不符配對（caseId + date，且雙邊剩餘各恰好一筆才配）──
  // 找出所有獨特的 (caseId, date) 組合
  const combinations = new Set([...csvRows.map(c => `${c.caseId}|${c.date}`), ...ocrRows.map(o => `${o.caseId}|${o.date}`)]);

  for (const combo of combinations) {
    const [caseId, date] = combo.split("|");
    const leftCsv = csvRows.filter(c => c.caseId === caseId && c.date === date && !usedCsv.has(c.id));
    const leftOcr = ocrRows.filter(o => o.caseId === caseId && o.date === date && !usedOcr.has(o.id));

    if (leftCsv.length === 1 && leftOcr.length === 1) {
      usedCsv.add(leftCsv[0].id);
      usedOcr.add(leftOcr[0].id);
      rows.push({
        id: `d4-${leftOcr[0].id}`,
        date: date,
        caseId: caseId,
        worker: leftCsv[0].worker,
        code: leftOcr[0].code,
        hours: leftOcr[0].hours,
        csvCode: leftCsv[0].code,
        status: "D4",
        source: "ocr_confirmed",
        note: `原排班: ${leftCsv[0].code}`
      });
    }
  }

  // ── 收尾 ──
  for (const csv of csvRows) {
    if (!usedCsv.has(csv.id)) {
      rows.push({
        id: `d1-${csv.id}`,
        date: csv.date,
        caseId: csv.caseId,
        worker: csv.worker,
        code: csv.code,
        hours: csv.hours,
        status: "D1",
        source: "csv",
        note: ""
      });
    }
  }

  for (const ocr of ocrRows) {
    if (!usedOcr.has(ocr.id)) {
      rows.push({
        id: `d2-${ocr.id}`,
        date: ocr.date,
        caseId: ocr.caseId,
        worker: "待查",
        code: ocr.code,
        hours: ocr.hours,
        status: "D2",
        source: "ocr_confirmed",
        note: "",
        d2Confirmed: false
      });
    }
  }

  const summary = {
    ok: rows.filter(r => r.status === 'ok').length,
    d1: rows.filter(r => r.status === 'D1').length,
    d2: rows.filter(r => r.status === 'D2').length,
    d3: rows.filter(r => r.status === 'D3').length,
    d4: rows.filter(r => r.status === 'D4').length,
  };

  return { rows, summary };
}
