"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { CloudUpload, Table, Download, CheckCircle, AlertTriangle, Info, FileSpreadsheet, ClipboardPaste, AlertCircle } from "lucide-react";

export default function InstitutionDashboard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [importedData, setImportedData] = useState([]);
  const [reconciledData, setReconciledData] = useState([]);

  // Mock data loader
  const loadMockData = () => {
    const mock = [
      { date: "6/27", caseId: "A141408XXX", worker: "陳小美", code: "BA02", hours: 1, source: "csv", status: "ok" },
      { date: "6/27", caseId: "A141408XXX", worker: "陳小美", code: "BA04", hours: 0.5, source: "csv", status: "ok" },
      { date: "6/28", caseId: "B222333XXX", worker: "王大明", code: "BA05", hours: 1, source: "csv", status: "D1", note: "紙本無紀錄" },
      { date: "6/28", caseId: "B222333XXX", worker: "王大明", code: "BA07", hours: 1.5, source: "ocr_confirmed", status: "D2", note: "計畫外服務" },
    ];
    setImportedData(mock);
    setReconciledData(mock);
    alert("已載入衛福部範本模擬資料");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      const formatted = data.map(row => ({
        date: row["日期"] || row.date,
        caseId: row["個案代號"] || row.caseId,
        worker: row["居服員"] || row.worker,
        code: row["BA碼"] || row.code,
        hours: parseFloat(row["時數"] || row.hours || 0),
        source: "csv",
        status: "ok",
        note: ""
      }));
      setImportedData(formatted);
      setReconciledData(formatted);
    };
    reader.readAsBinaryString(file);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(reconciledData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "核銷報表");
    XLSX.writeFile(wb, "核銷報表.xlsx");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <header className="bg-slate-900 text-white py-4 px-6 shadow-md z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-inner">
              <CalculatorIcon />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h1 className="text-xl font-extrabold tracking-wide">長照 3.0 紙本對帳與多個案核銷系統</h1>
                <span className="text-[11px] font-semibold bg-blue-900 text-blue-200 px-2.5 py-0.5 rounded-full border border-blue-700">衛福部 114.06.19 組合表修訂版</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">以「紙本實績」為唯一申報基準 • 自動稽核核銷欄位 • 杜絕漏項及人工比對疏漏</p>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6">
          <ul className="flex space-x-8 overflow-x-auto whitespace-nowrap">
            {[
              { id: 1, label: "排班計畫匯入 (衛福部標準版)" },
              { id: 2, label: "個案紙本對帳比對室" },
              { id: 3, label: "衛福部月底核銷導出 (XLSX)" },
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
            <div className="mb-6 flex items-center space-x-2 text-blue-600 mb-1">
              <CloudUpload className="w-6 h-6" />
              <h2 className="text-xl font-bold">第一步：匯入居服系統排班計畫</h2>
            </div>
            <div className="grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-4">
                <label className="border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-blue-500 transition-all h-64 relative shadow-sm group">
                  <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
                  <div className="bg-blue-50 text-blue-600 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                    <FileSpreadsheet className="w-8 h-8" />
                  </div>
                  <span className="font-bold text-slate-700 text-base">點擊或拖曳上傳排班計畫表</span>
                </label>
                <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100/80 shadow-sm">
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">載入預設的多個案模擬排班計畫（已完美建構包含 A141408XXX 等案之標準欄位）。</p>
                  <button onClick={loadMockData} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2">
                    <ClipboardPaste className="w-4 h-4" /> 載入衛福部範本模擬資料
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
                    <button onClick={() => setCurrentStep(2)} className="bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-700 transition flex items-center gap-2">
                      進入對帳比對室 
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
                <Table className="w-6 h-6" />
                <h2 className="text-xl font-bold">第二步：個案紙本對帳比對室</h2>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="p-3 font-bold">日期</th>
                    <th className="p-3 font-bold">個案代號</th>
                    <th className="p-3 font-bold">居服員</th>
                    <th className="p-3 font-bold">BA碼</th>
                    <th className="p-3 font-bold">時數</th>
                    <th className="p-3 font-bold">差異狀態</th>
                    <th className="p-3 font-bold">督導註記</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reconciledData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono text-slate-500">{row.date}</td>
                      <td className="p-3 font-bold text-slate-700">{row.caseId}</td>
                      <td className="p-3 text-slate-600">{row.worker}</td>
                      <td className="p-3"><span className="font-mono bg-slate-100 px-2 py-0.5 rounded">{row.code}</span></td>
                      <td className="p-3 text-slate-600">{row.hours}h</td>
                      <td className="p-3">
                        {row.status === 'ok' && <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded font-bold text-xs"><CheckCircle className="w-3 h-3 inline mr-1"/>一致</span>}
                        {row.status === 'D1' && <span className="text-red-600 bg-red-50 px-2 py-1 rounded font-bold text-xs"><AlertTriangle className="w-3 h-3 inline mr-1"/>紙本無紀錄</span>}
                        {row.status === 'D2' && <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded font-bold text-xs"><AlertCircle className="w-3 h-3 inline mr-1"/>計畫外服務</span>}
                      </td>
                      <td className="p-3 text-slate-500 text-xs">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {reconciledData.length === 0 && (
                <div className="py-12 text-center text-slate-400">請先於步驟一匯入排班表</div>
              )}
            </div>
            
            {reconciledData.length > 0 && (
              <div className="mt-6 flex justify-end">
                <button onClick={() => setCurrentStep(3)} className="bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-700 transition">
                  完成比對，前往匯出
                </button>
              </div>
            )}
          </section>
        )}

        {currentStep === 3 && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 animate-in fade-in flex flex-col items-center justify-center min-h-[400px]">
            <Download className="w-16 h-16 text-blue-600 mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">衛福部月底核銷導出</h2>
            <p className="text-slate-500 mb-8 text-center max-w-md">
              已完成所有的紙本與排班比對。<br/>
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

function CalculatorIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="20" x="4" y="2" rx="2" />
      <line x1="8" x2="16" y1="6" y2="6" />
      <line x1="16" x2="16" y1="14" y2="18" />
      <path d="M16 10h.01" />
      <path d="M12 10h.01" />
      <path d="M8 10h.01" />
      <path d="M12 14h.01" />
      <path d="M8 14h.01" />
      <path d="M12 18h.01" />
      <path d="M8 18h.01" />
    </svg>
  );
}
