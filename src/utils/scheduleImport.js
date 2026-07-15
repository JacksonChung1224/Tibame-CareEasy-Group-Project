export const OFFICIAL_HEADERS = [
  "身分證字號",
  "服務日期(請輸入7碼)",
  "服務項目代碼",
  "服務類別\n1.補助\n2.自費",
  "數量\n(僅整數)",
  "單價",
  "服務人員身分證",
  "起始時段-小時\n(24小時制)",
  "起始時段-分鐘",
  "結束時段-小時\n(24小時制)",
  "結束時段-分鐘",
];

export function parseScheduleSheet(rows2D) {
  let headerIndex = -1;
  for (let i = 0; i < rows2D.length; i++) {
    const row = rows2D[i] || [];
    const hasCode = row.some(cell => String(cell).replace(/\s/g, '').includes('服務項目代碼'));
    if (hasCode) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    return { errors: [], fatalError: "找不到包含「服務項目代碼」的表頭列", rows: [] };
  }

  const parsedRows = [];
  const errors = [];

  for (let i = headerIndex + 1; i < rows2D.length; i++) {
    const row = rows2D[i] || [];
    
    // Ignore empty rows
    if (row.length === 0 || row.every(c => c === undefined || c === null || String(c).trim() === '')) {
      continue;
    }

    const rawCaseNatId = row[0];
    const rawDateROC = row[1];
    const rawCode = row[2];
    const rawCategory = row[3];
    const rawQty = row[4];
    const rawPrice = row[5];
    const rawWorkerNatId = row[6];
    const rawStartH = row[7];
    const rawStartM = row[8];
    const rawEndH = row[9];
    const rawEndM = row[10];

    const caseNatId = rawCaseNatId ? String(rawCaseNatId).trim() : null;
    let dateROC = rawDateROC !== undefined && rawDateROC !== null ? String(rawDateROC).trim() : null;
    const code = rawCode ? String(rawCode).trim() : null;
    const categoryStr = rawCategory !== undefined && rawCategory !== null ? String(rawCategory).trim() : null;
    const qtyStr = rawQty !== undefined && rawQty !== null ? String(rawQty).trim() : null;
    const priceStr = rawPrice !== undefined && rawPrice !== null ? String(rawPrice).trim() : null;
    const workerNatId = rawWorkerNatId ? String(rawWorkerNatId).trim() : null;

    if (!caseNatId || !dateROC || !code || !qtyStr) {
      return { errors: [], fatalError: `第 ${i + 1} 列缺少必要欄位 (身分證/日期/代碼/數量)`, rows: [] };
    }

    let rowErrors = [];

    if (dateROC.length !== 7) {
      rowErrors.push("服務日期非7碼");
    }

    const category = parseInt(categoryStr, 10);
    if (category !== 1 && category !== 2) {
      rowErrors.push("服務類別必須為1或2");
    }

    const qty = Number(qtyStr);
    if (!Number.isInteger(qty) || qty <= 0) {
      rowErrors.push("數量必須為正整數");
    }

    const price = priceStr && priceStr !== '' ? Number(priceStr) : null;
    if (priceStr && priceStr !== '' && isNaN(price)) {
      rowErrors.push("單價格式錯誤");
    }

    const startH = Number(rawStartH);
    const startM = Number(rawStartM);
    const endH = Number(rawEndH);
    const endM = Number(rawEndM);
    
    let hoursDerived = null;
    if (
      rawStartH !== undefined && rawStartH !== null && Number.isInteger(startH) && startH >= 0 && startH <= 24 &&
      rawStartM !== undefined && rawStartM !== null && Number.isInteger(startM) && startM >= 0 && startM < 60 &&
      rawEndH !== undefined && rawEndH !== null && Number.isInteger(endH) && endH >= 0 && endH <= 24 &&
      rawEndM !== undefined && rawEndM !== null && Number.isInteger(endM) && endM >= 0 && endM < 60
    ) {
      const startTotal = startH * 60 + startM;
      const endTotal = endH * 60 + endM;
      if (endTotal <= startTotal) {
        rowErrors.push("結束時間必須晚於起始時間");
      } else {
        hoursDerived = (endTotal - startTotal) / 60;
      }
    } else {
      rowErrors.push("時段格式錯誤");
    }

    if (rowErrors.length > 0) {
      errors.push({ rowIdx: i + 1, caseNatId, dateROC, code, reasons: rowErrors });
    } else {
      parsedRows.push({
        caseNatId,
        dateROC,
        code,
        category,
        qty,
        price,
        workerNatId,
        startH,
        startM,
        endH,
        endM,
        hoursDerived
      });
    }
  }

  return { rows: parsedRows, errors, fatalError: null };
}
