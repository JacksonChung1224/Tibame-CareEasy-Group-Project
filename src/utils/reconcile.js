import { BA_MAP } from "./careData.js";

export function reconcile(csvRows, ocrRows) {
  let rows = [];
  let usedCsv = new Set();
  let usedOcr = new Set();

  function buildRow(status, csv, ocr, note = "") {
    const base = status === "D1" ? csv : ocr;
    
    const qty = status === "D1" ? csv.qty : ocr.qty;
    const cat = csv ? csv.category : 1; 
    const price = status === "D1" ? csv.price : ocr.price;
    const code = base.code;
    
    let finalPrice = price;
    let subtotal = null;
    if (finalPrice === null || finalPrice === undefined) {
      finalPrice = BA_MAP[code]?.price || null;
    }
    if (finalPrice !== null && qty !== null && qty !== undefined) {
      subtotal = finalPrice * qty;
    }
    
    let priceWarning = false;
    if (csv && csv.price !== null && csv.price !== undefined) {
      if (BA_MAP[csv.code] && csv.price !== BA_MAP[csv.code].price) {
        priceWarning = true;
      }
    }

    return {
      id: `${status.toLowerCase()}-${base.id || Math.random().toString(36).substr(2, 9)}`,
      dateROC: base.dateROC,
      caseNatId: base.caseNatId,
      workerNatId: csv ? csv.workerNatId : "待查",
      code: code,
      qty: qty,
      price: price,
      category: cat,
      subtotal: subtotal,
      priceWarning: priceWarning,
      hoursDerived: base.hoursDerived,
      csvQty: csv ? csv.qty : null,
      csvCode: csv ? csv.code : null,
      status: status,
      source: status === "D1" ? "csv" : (status === "D2" ? "ocr_unmatched" : "ocr_confirmed"),
      note: note,
      startH: base.startH,
      startM: base.startM,
      endH: base.endH,
      endM: base.endM
    };
  }

  for (const csv of csvRows) {
    const match = ocrRows.find(o => 
      !usedOcr.has(o.id) &&
      o.caseNatId === csv.caseNatId &&
      o.dateROC === csv.dateROC &&
      o.code === csv.code
    );

    if (match) {
      usedCsv.add(csv.id);
      usedOcr.add(match.id);
      
      let isD3 = false;
      let notes = [];
      
      if (csv.qty !== match.qty) {
        isD3 = true;
        notes.push(`排班數量: ${csv.qty}`);
      }
      
      if (csv.hoursDerived !== null && match.hoursDerived !== null) {
        if (Math.abs(csv.hoursDerived - match.hoursDerived) > 0.25) {
          isD3 = true;
          notes.push(`排班時數差 > 0.25h`);
        }
      }

      if (!isD3) {
        rows.push(buildRow("ok", csv, match, ""));
      } else {
        rows.push(buildRow("D3", csv, match, notes.join(", ")));
      }
    }
  }

  const combinations = new Set([...csvRows.map(c => `${c.caseNatId}|${c.dateROC}`), ...ocrRows.map(o => `${o.caseNatId}|${o.dateROC}`)]);

  for (const combo of combinations) {
    const [caseNatId, dateROC] = combo.split("|");
    const leftCsv = csvRows.filter(c => c.caseNatId === caseNatId && c.dateROC === dateROC && !usedCsv.has(c.id));
    const leftOcr = ocrRows.filter(o => o.caseNatId === caseNatId && o.dateROC === dateROC && !usedOcr.has(o.id));

    if (leftCsv.length === 1 && leftOcr.length === 1) {
      usedCsv.add(leftCsv[0].id);
      usedOcr.add(leftOcr[0].id);
      rows.push(buildRow("D4", leftCsv[0], leftOcr[0], `原排班: ${leftCsv[0].code}`));
    }
  }

  for (const csv of csvRows) {
    if (!usedCsv.has(csv.id)) {
      rows.push(buildRow("D1", csv, null, ""));
    }
  }

  for (const ocr of ocrRows) {
    if (!usedOcr.has(ocr.id)) {
      rows.push(buildRow("D2", null, ocr, ""));
    }
  }

  return rows;
}
