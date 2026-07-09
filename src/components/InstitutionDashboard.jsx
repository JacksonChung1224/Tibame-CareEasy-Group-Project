"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { CloudUpload, Table, Download, CheckCircle, AlertTriangle, FileSpreadsheet, ClipboardPaste, AlertCircle, Eye, Info } from "lucide-react";

export default function InstitutionDashboard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [importedData, setImportedData] = useState([]);
  const [ocrData, setOcrData] = useState([]);
  const [reconciledData, setReconciledData] = useState([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [unconfirmedFields, setUnconfirmedFields] = useState([]);

  // Load Mock CSV
  const loadMockData = () => {
    setImportedData([
      { id: 1, date: "6/25", caseId: "A141408XXX", worker: "陳小美", code: "BA02", hours: 1 }, // Will match OK
      { id: 2, date: "6/26", caseId: "A141408XXX", worker: "陳小美", code: "BA05", hours: 1 }, // Missing in OCR -> D1
      { id: 3, date: "6/27", caseId: "A141408XXX", worker: "陳小美", code: "BA02", hours: 1.5 }, // Hours diff -> D3
      { id: 4, date: "6/28", caseId: "A141408XXX", worker: "陳小美", code: "BA04", hours: 1 }, // Code diff -> D4
    ]);
    alert("已載入模擬排班表");
  };

  // Load Mock OCR
  const loadMockOcrData = () => {
    setOcrData([
      { id: 'o1', date: "6/25", caseId: "A141408XXX", code: "BA02", hours: 1, bp: "120/80", temp: "36.5", note: "", confidence: { code: 1, hours: 1, bp: 1, temp: 1, caseId: 1, date: 1, note: 1 } },
      { id: 'o2', date: "6/27", caseId: "A141408XXX", code: "BA02", hours: 1, bp: "135/85", temp: "37.2", note: "", confidence: { caseId: 1, temp: 0.8, note: 1, code: 1, hours: 1, bp: 1, date: 1 } },
      { id: 'o3', date: "6/28", caseId: "A141408XXX", code: "BA07", hours: 1, bp: "120/80", temp: "36.5", note: "", confidence: { caseId: 1, temp: 1, note: 1, code: 0.7, hours: 1, bp: 1, date: 1 } },
      { id: 'o4', date: "6/29", caseId: "A141408XXX", code: "BA08", hours: 1.5, bp: "120/80", temp: "36.5", note: "臨時服務", confidence: { caseId: 1, temp: 1, note: 1, code: 1, hours: 1, bp: 1, date: 1 } }, // Missing in CSV -> D2
    ]);
  };

  const handleFieldChange = (rowId, field, value) => {
    setOcrData(prev => prev.map(row => {
      if (row.id === rowId) {
        return {
          ...row,
          [field]: value,
          confidence: { ...row.confidence, [field]: 1 }
        };
      }
      return row;
    }));
  };

  const handleFieldFocus = (rowId, field) => {
    setOcrData(prev => prev.map(row => {
      if (row.id === rowId && row.confidence[field] < 0.85) {
        return {
          ...row,
          confidence: { ...row.confidence, [field]: 1 }
        };
      }
      return row;
    }));
  };

  const confirmOcrImport = () => {
    let unconfirmed = [];
    ocrData.forEach((row, idx) => {
      Object.keys(row.confidence || {}).forEach(key => {
        if (row.confidence[key] < 0.85) {
          unconfirmed.push(`第 ${idx + 1} 筆紀錄 - ${key}`);
        }
      });
    });

    if (unconfirmed.length > 0) {
      setUnconfirmedFields(unconfirmed);
      setShowWarningModal(true);
      return;
    }

    // Run reconciliation logic
    let result = [];
    let ocrUsed = new Set();

    importedData.forEach(csvRow => {
      const matchOcr = ocrData.find(ocr => ocr.caseId === csvRow.caseId && ocr.date === csvRow.date && !ocrUsed.has(ocr.id));
      if (!matchOcr) {
        result.push({
          id: `csv-${csvRow.id}`,
          date: csvRow.date,
          caseId: csvRow.caseId,
          worker: csvRow.worker,
          code: csvRow.code,
          hours: csvRow.hours,
          status: 'D1',
          source: 'csv',
          note: ''
        });
      } else {
        ocrUsed.add(matchOcr.id);
        if (csvRow.code !== matchOcr.code) {
          result.push({
            id: `merge-${matchOcr.id}`,
            date: csvRow.date,
            caseId: csvRow.caseId,
            worker: csvRow.worker,
            code: matchOcr.code,
            csvCode: csvRow.code,
            hours: matchOcr.hours,
            status: 'D4',
            source: 'ocr_confirmed',
            note: `原排班: ${csvRow.code}`
          });
        } else if (parseFloat(csvRow.hours) !== parseFloat(matchOcr.hours)) {
          result.push({
            id: `merge-${matchOcr.id}`,
            date: csvRow.date,
            caseId: csvRow.caseId,
            worker: csvRow.worker,
            code: matchOcr.code,
            hours: matchOcr.hours,
            csvHours: csvRow.hours,
            status: 'D3',
            source: 'ocr_confirmed',
            note: `原時數: ${csvRow.hours}h`
          });
        } else {
          result.push({
            id: `merge-${matchOcr.id}`,
            date: csvRow.date,
            caseId: csvRow.caseId,
            worker: csvRow.worker,
            code: matchOcr.code,
            hours: matchOcr.hours,
            status: 'ok',
            source: 'ocr_confirmed',
            note: ''
          });
        }
      }
    });

    ocrData.forEach(ocrRow => {
      if (!ocrUsed.has(ocrRow.id)) {
        result.push({
          id: `ocr-${ocrRow.id}`,
          date: ocrRow.date,
          caseId: ocrRow.caseId,
          worker: "待查",
          code: ocrRow.code,
          hours: ocrRow.hours,
          status: 'D2',
          source: 'ocr_confirmed',
          note: '',
          d2Confirmed: false
        });
      }
    });

    setReconciledData(result);
    setCurrentStep(3);
  };

  const handleReconcileNote = (id, val) => {
    setReconciledData(prev => prev.map(row => row.id === id ? { ...row, note: val } : row));
  };

  const handleD2Confirm = (id) => {
    setReconciledData(prev => prev.map(row => row.id === id ? { ...row, d2Confirmed: true } : row));
  };

  const unhandledD1D2 = reconciledData.filter(r => (r.status === 'D1' && !r.note) || (r.status === 'D2' && !r.d2Confirmed)).length;

  const exportExcel = () => {
    const exportData = reconciledData.map(row => ({
      "日期": row.date,
      "個案代號": row.caseId,
      "居服員": row.worker,
      "BA碼": row.code,
      "時數": row.hours,
      "督導處理註記": row.note || "",
      "差異類型": row.status === 'ok' ? '完全一致' : 
                  row.status === 'D1' ? '疑似未執行' : 
                  row.status === 'D2' ? '計畫外服務' : 
                  row.status === 'D3' ? '時數差異' : '項目差異',
      "資料來源": row.source === 'ocr_confirmed' ? 'OCR掃描 (已確認)' : '排班系統 (CSV)'
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "核銷報表");
    XLSX.writeFile(wb, "核銷報表.xlsx");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-amber-100 text-amber-600 p-2 rounded-full">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-950">尚有未確認的 OCR 欄位</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                請確認所有黃色標示（低信心度）的欄位皆已人工檢查。
              </p>
              <ul className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border max-h-32 overflow-auto space-y-1">
                {unconfirmedFields.map(f => <li key={f}>• {f}</li>)}
              </ul>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end">
              <button onClick={() => setShowWarningModal(false)} className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-sm">
                返回確認
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-slate-900 text-white py-4 px-6 shadow-md z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-inner">
              <CloudUpload className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h1 className="text-xl font-extrabold tracking-wide">長照 3.0 紙本對帳與多個案核銷系統</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6">
          <ul className="flex space-x-8 overflow-x-auto whitespace-nowrap">
            {[
              { id: 1, label: "排班計畫匯入" },
              { id: 2, label: "OCR 結果確認" },
              { id: 3, label: "個案紙本對帳比對室" },
              { id: 4, label: "月底核銷導出 (XLSX)" },
            ].map(step => (
              <li key={step.id} 
                  className={`cursor-pointer py-4 ${currentStep === step.id ? 'text-blue-600 border-b-2 border-blue-600 font-bold' : 'text-slate-500'}`}
                  onClick={() => setCurrentStep(step.id)}>
                <span className="flex items-center space-x-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep === step.id ? 'bg-blue-100' : 'bg-slate-100'}`}>
                    {step.id}
                  </span>
                  <span>{step.label}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto w-full p-4 md:p-6">
        {currentStep === 1 && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 animate-in fade-in">
            <div className="mb-6 flex items-center space-x-2 text-blue-600">
              <CloudUpload className="w-6 h-6" />
              <h2 className="text-xl font-bold">步驟 1：匯入居服系統排班計畫</h2>
            </div>
            <div className="grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100/80 shadow-sm">
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">載入包含 A141408XXX 等案之模擬排班表，用以觸發 D1~D4 異常狀態。</p>
                  <button onClick={loadMockData} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2">
                    <ClipboardPaste className="w-4 h-4" /> 載入模擬排班表
                  </button>
                </div>
              </div>
              <div className="lg:col-span-7 border border-slate-200 rounded-2xl flex flex-col bg-slate-50/30 shadow-sm overflow-hidden min-h-[300px]">
                <div className="p-4 border-b bg-white flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-700">已匯入排班計畫：</span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-semibold border">共 {importedData.length} 筆資料</span>
                </div>
                <div className="flex-1 p-4 overflow-auto max-h-64">
                  {importedData.length > 0 ? (
                    <div className="space-y-2">
                      {importedData.map((row, i) => (
                        <div key={i} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 text-sm">
                          <div>
                            <span className="font-mono text-slate-500 mr-2">{row.date}</span>
                            <span className="font-bold text-slate-700 mr-2">{row.caseId}</span>
                            <span className="text-slate-600">{row.worker}</span>
                          </div>
                          <div className="flex gap-3">
                            <span className="font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{row.code}</span>
                            <span className="text-slate-500">{row.hours}h</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <Table className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">尚未匯入資料</p>
                    </div>
                  )}
                </div>
                {importedData.length > 0 && (
                  <div className="p-4 bg-white border-t flex justify-end">
                    <button onClick={() => setCurrentStep(2)} className="bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-700 transition">
                      前往 OCR 結果確認
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {currentStep === 2 && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 animate-in fade-in">
             <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-blue-600">
                <Eye className="w-6 h-6" />
                <h2 className="text-xl font-bold">步驟 2：OCR 結果確認</h2>
              </div>
              <button onClick={loadMockOcrData} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-200 transition">
                載入 OCR 模擬資料
              </button>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-slate-100 rounded-xl border border-slate-200 p-4 flex flex-col items-center justify-center min-h-[400px]">
                <div className="text-slate-400 mb-4">
                  <CloudUpload className="w-16 h-16 mx-auto opacity-50 mb-2" />
                  <p className="text-center font-bold">紙本照片預覽區</p>
                </div>
              </div>

              <div className="overflow-x-auto border rounded-xl flex flex-col h-[400px]">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="sticky top-0 bg-slate-50 text-slate-600 shadow-sm z-10">
                    <tr>
                      <th className="p-3 font-bold border-b">日期</th>
                      <th className="p-3 font-bold border-b">個案代號</th>
                      <th className="p-3 font-bold border-b">BA碼</th>
                      <th className="p-3 font-bold border-b w-16">時數</th>
                      <th className="p-3 font-bold border-b w-20">血壓</th>
                      <th className="p-3 font-bold border-b w-16">體溫</th>
                      <th className="p-3 font-bold border-b">備註</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ocrData.map((row) => (
                      <tr key={row.id}>
                        {['date', 'caseId', 'code', 'hours', 'bp', 'temp', 'note'].map(field => {
                          const isLowConfidence = row.confidence[field] < 0.85;
                          return (
                            <td key={field} className="p-1 border-t border-slate-100">
                              <div className={`relative ${isLowConfidence ? 'bg-yellow-100 rounded' : ''}`}>
                                <input 
                                  value={row[field]}
                                  onChange={(e) => handleFieldChange(row.id, field, e.target.value)}
                                  onFocus={() => handleFieldFocus(row.id, field)}
                                  className={`w-full p-2 bg-transparent outline-none ${isLowConfidence ? 'text-yellow-900 font-bold' : 'text-slate-700'}`}
                                />
                                {isLowConfidence && <AlertTriangle className="w-3 h-3 text-yellow-600 absolute right-2 top-2.5 pointer-events-none" />}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {ocrData.length > 0 && (
              <div className="mt-6 flex justify-end">
                <button onClick={confirmOcrImport} className="bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-700 transition">
                  確認匯入，進入對帳室
                </button>
              </div>
            )}
          </section>
        )}

        {currentStep === 3 && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 animate-in fade-in">
             <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-blue-600">
                <Table className="w-6 h-6" />
                <h2 className="text-xl font-bold">步驟 3：個案紙本對帳比對室</h2>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="p-3 font-bold">日期</th>
                    <th className="p-3 font-bold">個案代號</th>
                    <th className="p-3 font-bold">BA碼</th>
                    <th className="p-3 font-bold">核銷時數</th>
                    <th className="p-3 font-bold">差異狀態 (D1-D4)</th>
                    <th className="p-3 font-bold">督導處理註記</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reconciledData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono text-slate-500">{row.date}</td>
                      <td className="p-3 font-bold text-slate-700">{row.caseId}</td>
                      <td className="p-3"><span className="font-mono bg-slate-100 px-2 py-0.5 rounded">{row.code}</span></td>
                      <td className="p-3 font-bold">{row.hours}h</td>
                      <td className="p-3">
                        {row.status === 'ok' && <span className="text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full font-bold text-xs"><CheckCircle className="w-3 h-3 inline mr-1"/>完全一致</span>}
                        {row.status === 'D1' && <span className="text-red-700 bg-red-100 px-2 py-1 rounded-full font-bold text-xs"><AlertTriangle className="w-3 h-3 inline mr-1"/>🔴 D1 疑似未執行</span>}
                        {row.status === 'D2' && <span className="text-orange-700 bg-orange-100 px-2 py-1 rounded-full font-bold text-xs"><AlertTriangle className="w-3 h-3 inline mr-1"/>🟠 D2 計畫外服務</span>}
                        {row.status === 'D3' && (
                          <div className="flex flex-col gap-1">
                            <span className="text-yellow-800 bg-yellow-100 px-2 py-1 rounded-full font-bold text-xs w-max"><AlertCircle className="w-3 h-3 inline mr-1"/>🟡 D3 時數差異</span>
                            <span className="text-[10px] text-slate-500">{row.note}</span>
                          </div>
                        )}
                        {row.status === 'D4' && (
                          <div className="flex flex-col gap-1">
                            <span className="text-yellow-800 bg-yellow-100 px-2 py-1 rounded-full font-bold text-xs w-max"><AlertCircle className="w-3 h-3 inline mr-1"/>🟡 D4 項目差異</span>
                            <span className="text-[10px] text-slate-500">{row.note}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {row.status === 'D1' ? (
                          <input 
                            placeholder="請填寫未執行原因..."
                            className="border border-red-300 bg-red-50 text-red-900 text-xs px-2 py-1.5 rounded outline-none focus:ring-1 focus:ring-red-500 w-full"
                            value={row.note}
                            onChange={(e) => handleReconcileNote(row.id, e.target.value)}
                          />
                        ) : row.status === 'D2' && !row.d2Confirmed ? (
                          <button onClick={() => handleD2Confirm(row.id)} className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded-lg shadow-sm">
                            確認可核銷
                          </button>
                        ) : row.status === 'D2' && row.d2Confirmed ? (
                          <span className="text-xs text-orange-700 font-bold">✓ 已確認</span>
                        ) : (
                          <span className="text-slate-400 text-xs">{row.note || "無須註記"}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 flex justify-between items-center bg-slate-50 p-4 rounded-xl border">
              <div className="flex items-center gap-2">
                {unhandledD1D2 > 0 ? (
                  <span className="text-red-600 font-bold text-sm bg-red-100 px-3 py-1 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4"/> 尚有 {unhandledD1D2} 筆未結案異常 (D1/D2)
                  </span>
                ) : (
                  <span className="text-emerald-600 font-bold text-sm bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-4 h-4"/> 所有異常皆已結案
                  </span>
                )}
              </div>
              <button 
                onClick={() => setCurrentStep(4)} 
                disabled={unhandledD1D2 > 0 || reconciledData.length === 0}
                className="bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                前往月底核銷導出
              </button>
            </div>
          </section>
        )}

        {currentStep === 4 && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 animate-in fade-in flex flex-col items-center justify-center min-h-[400px]">
            <Download className="w-16 h-16 text-blue-600 mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">步驟 4：衛福部月底核銷導出</h2>
            <p className="text-slate-500 mb-8 text-center max-w-md">
              已完成所有的紙本與排班比對及督導註記。<br/>
              您可以將結果匯出為符合衛福部格式的 XLSX 檔案，進行申報。
            </p>
            <button onClick={exportExcel} disabled={reconciledData.length === 0}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold text-lg shadow-sm flex items-center gap-2 transition-all">
              <FileSpreadsheet className="w-5 h-5" /> 匯出核銷報表
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
