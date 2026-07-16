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
    let priceSource = "sheet";
    if (finalPrice === null || finalPrice === undefined) {
      finalPrice = BA_MAP[code]?.price || null;
      if (finalPrice !== null) {
        priceSource = "ba_map_fallback";
      } else {
        priceSource = null;
      }
    }
    if (finalPrice !== null && qty !== null && qty !== undefined) {
      subtotal = finalPrice * qty;
    }

    return {
      id: `${status.toLowerCase()}-${base.id || Math.random().toString(36).substr(2, 9)}`,
      dateROC: base.dateROC,
      caseNatId: base.caseNatId,
      workerNatId: csv ? csv.workerNatId : "待查",
      code: code,
      qty: qty,
      price: finalPrice,
      category: cat,
      subtotal: subtotal,
      priceSource: priceSource,
      hoursDerived: base.hoursDerived,
      csvQty: csv ? csv.qty : null,
      csvCode: csv ? csv.code : null,
      csvPrice: csv ? csv.price : null,
      csvStartH: csv ? csv.startH : null,
      csvStartM: csv ? csv.startM : null,
      csvEndH: csv ? csv.endH : null,
      csvEndM: csv ? csv.endM : null,
      decision: status === "no_schedule" ? "system" : "paper",
      status: status,
      source: status === "D1" ? "csv" : (status === "no_schedule" ? "ocr_unmatched" : "ocr_confirmed"),
      note: note,
      startH: ocr?.startH ?? csv?.startH ?? null,
      startM: ocr?.startM ?? csv?.startM ?? null,
      endH: ocr?.endH ?? csv?.endH ?? null,
      endM: ocr?.endM ?? csv?.endM ?? null
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
      rows.push(buildRow("no_schedule", null, ocr, ""));
    }
  }

  return rows;
}

export function resolveRow(row) {
  let include = true;
  let values = [];

  if (row.decision === "system") {
    const qty = row.csvQty !== null ? row.csvQty : row.qty;
    const price = row.csvPrice !== null ? row.csvPrice : (BA_MAP[row.csvCode || row.code]?.price || 0);
    const code = row.csvCode || row.code;
    values = [
      row.caseNatId || "",
      row.dateROC || "",
      code,
      row.category || 1,
      qty,
      price,
      row.workerNatId || "待查",
      row.csvStartH ?? "",
      row.csvStartM ?? "",
      row.csvEndH ?? "",
      row.csvEndM ?? "",
    ];
  } else {
    values = [
      row.caseNatId || "",
      row.dateROC || "",
      row.code || "",
      row.category || 1,
      row.qty || 0,
      row.price || 0,
      row.workerNatId || "待查",
      row.startH ?? "",
      row.startM ?? "",
      row.endH ?? "",
      row.endM ?? "",
    ];
  }

  if (row.status === "D1" && row.decision === "paper") {
    include = false;
  }
  if (row.status === "no_schedule" && row.decision === "system") {
    include = false;
  }

  return { include, values };
}
