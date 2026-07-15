"use client";

import { useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { CloudUpload, Table, Download, CheckCircle, AlertTriangle, FileSpreadsheet, ClipboardPaste, AlertCircle, Eye, Info, UserPlus } from "lucide-react";
import { BA_MAP } from "@/utils/careData";
import { reconcile } from "@/utils/reconcile";
import { parseScheduleSheet, OFFICIAL_HEADERS } from "@/utils/scheduleImport";

export default function InstitutionDashboard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [importedData, setImportedData] = useState([]);
  const [ocrData, setOcrData] = useState([]);
  const [reconciledData, setReconciledData] = useState([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [unconfirmedFields, setUnconfirmedFields] = useState([]);
  const [importErrors, setImportErrors] = useState([]);

  const [view, setView] = useState("billing"); // "billing" | "cases"
  const [cases, setCases] = useState([
    { caseId:"A141408XXX", name:"王奶奶", status:"connected", family:"王小姐（女兒）", inviteCode:"CARE01", lastSync:"6/27", syncedCount:4 },
    { caseId:"B222333XXX", name:"林爺爺", status:"invited", inviteCode:"CARE02", invitedAt:"6/25" },
    { caseId:"C111222XXX", name:"陳阿姨", status:"none" },
  ]);
  const [toastMsg, setToastMsg] = useState("");
  const [confirmModal, setConfirmModal] = useState({ show: false, caseId: null, caseName: "" });

  // P0-2: Invite Family logic
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeInviteCase, setActiveInviteCase] = useState(null);

  const handleCopy = () => {
    if (activeInviteCase) {
      navigator.clipboard.writeText(activeInviteCase.inviteCode);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handlePushRecords = (c) => {
    setCases(prev => prev.map(x => 
      x.caseId === c.caseId 
        ? { ...x, lastSync: new Date().toLocaleDateString('zh-TW', {month: 'numeric', day: 'numeric'}) } 
        : x
    ));
    showToast(`已將 ${c.syncedCount} 筆督導確認之服務紀錄同步至家屬端`);
  };

  const handleGenerateInvite = (c) => {
    const newCode = "CARE03"; // Mock next code
    const updatedCase = { ...c, status: "invited", inviteCode: newCode, invitedAt: new Date().toLocaleDateString('zh-TW', {month: 'numeric', day: 'numeric'}) };
    setCases(prev => prev.map(x => x.caseId === c.caseId ? updatedCase : x));
    setActiveInviteCase(updatedCase);
    setShowInviteModal(true);
  };

  const confirmRemoveConnection = (c) => {
    setConfirmModal({ show: true, caseId: c.caseId, caseName: c.name });
  };

  const handleRemoveConnection = () => {
    setCases(prev => prev.map(x => 
      x.caseId === confirmModal.caseId 
        ? { caseId: x.caseId, name: x.name, status: "none" } 
        : x
    ));
    setConfirmModal({ show: false, caseId: null, caseName: "" });
  };

  // Load Mock CSV
  const loadMockData = () => {
    setImportedData([
      { id: "c1", caseNatId: "A141408XXX", dateROC: "1150301", code: "BA15-1", category: 1, qty: 1, price: 50, workerNatId: "A123456789", startH: 9, startM: 30, endH: 10, endM: 30, hoursDerived: 1 },
      { id: "c2", caseNatId: "A141408XXX", dateROC: "1150302", code: "BA15-1", category: 1, qty: 1, price: 50, workerNatId: "A123456789", startH: 11, startM: 30, endH: 12, endM: 30, hoursDerived: 1 },
      { id: "c3", caseNatId: "A141408XXX", dateROC: "1150305", code: "BA02", category: 1, qty: 1, price: 40, workerNatId: "A123456789", startH: 12, startM: 30, endH: 13, endM: 0, hoursDerived: 0.5 },
      { id: "c4", caseNatId: "A141408XXX", dateROC: "1150305", code: "BA17e", category: 1, qty: 1, price: 30, workerNatId: "A123456789", startH: 12, startM: 30, endH: 13, endM: 0, hoursDerived: 0.5 },
    ]);
    setImportErrors([]);
    alert("已載入衛福部範本模擬資料");
  };

  const loadMockOcrData = () => {
    setOcrData([
      { id: "o1", caseNatId: "A141408XXX", dateROC: "1150301", code: "BA15-1", qty: 1, price: 50, hoursDerived: 1, bp: "120/80", temp: "36.5", note: "", confidence: { code: 1, hoursDerived: 1, bp: 1, temp: 1, caseNatId: 1, dateROC: 1, note: 1 } },
      { id: "o2", caseNatId: "A141408XXX", dateROC: "1150305", code: "BA02", qty: 2, price: 40, hoursDerived: 0.5, bp: "120/80", temp: "36.5", note: "", confidence: { caseNatId: 1, temp: 1, note: 1, code: 1, hoursDerived: 1, bp: 1, dateROC: 1, qty: 0.7 } },
      { id: "o3", caseNatId: "A141408XXX", dateROC: "1150305", code: "BA17e", qty: 1, price: 30, hoursDerived: 0.5, bp: "135/85", temp: "37.2", note: "", confidence: { caseNatId: 1, temp: 0.8, note: 1, code: 1, hoursDerived: 1, bp: 1, dateROC: 1 } },
      { id: "o4", caseNatId: "A141408XXX", dateROC: "1150306", code: "BA05", qty: 1, price: 310, hoursDerived: 1, bp: "120/80", temp: "36.5", note: "", confidence: { caseNatId: 1, temp: 1, note: 1, code: 1, hoursDerived: 1, bp: 1, dateROC: 1 } },
    ]);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows2D = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const result = parseScheduleSheet(rows2D);

    if (result.fatalError) {
      alert("匯入失敗：" + result.fatalError);
      return;
    }
    setImportedData(result.rows);
    setImportErrors(result.errors);
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

    // Call pure function reconcile engine
    const { rows } = reconcile(importedData, ocrData);
    setReconciledData(rows);
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
    // Sheet 1: 核銷明細 (ok, D3, D4, and D2 with confirmed)
    const validData = reconciledData.filter(r => r.status === 'ok' || r.status === 'D3' || r.status === 'D4' || (r.status === 'D2' && r.d2Confirmed));
    
    const sheet1AOA = [OFFICIAL_HEADERS];
    validData.forEach(row => {
      sheet1AOA.push([
        row.caseNatId || "",
        row.dateROC || "",
        row.code || "",
        row.category || "",
        row.qty || "",
        row.price !== null ? row.price : "",
        row.workerNatId || "",
        row.startH !== null ? row.startH : "",
        row.startM !== null ? row.startM : "",
        row.endH !== null ? row.endH : "",
        row.endM !== null ? row.endM : ""
      ]);
    });

    const sheet2AOA = [["個案代號", "日期", "BA碼", "差異類型", "異常說明", "督導處理註記"]];
    reconciledData.forEach(row => {
      let isError = false;
      let errType = "";
      let errMsg = "";
      if (row.status === 'D1') {
        isError = true; errType = "D1 疑似未執行"; errMsg = "無對應紙本";
      } else if (row.status === 'D2' && !row.d2Confirmed) {
        isError = true; errType = "D2 計畫外服務"; errMsg = "未確認";
      } else if (row.status === 'D3') {
        isError = true; errType = "D3 差異"; errMsg = row.note;
      } else if (row.status === 'D4') {
        isError = true; errType = "D4 項目差異"; errMsg = row.note;
      } else if (row.priceWarning) {
        isError = true; errType = "單價警示"; errMsg = "單價與衛福部附表不符";
      } else if (row.price === null && row.status !== 'D1') {
        isError = true; errType = "待補價"; errMsg = "單價為空且無預設值";
      }

      if (isError) {
        sheet2AOA.push([
          row.caseNatId,
          row.dateROC,
          row.code,
          errType,
          errMsg,
          row.note || ""
        ]);
      }
    });

    const ws1 = XLSX.utils.aoa_to_sheet(sheet1AOA);
    const ws2 = XLSX.utils.aoa_to_sheet(sheet2AOA);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, "核銷明細");
    XLSX.utils.book_append_sheet(wb, ws2, "異常附表");
    XLSX.writeFile(wb, "核銷報表.xlsx");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-950">邀請家屬連動個案</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                個案：{activeInviteCase?.name}（{activeInviteCase?.caseId}）
              </p>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center mb-4">
                <div className="text-3xl font-mono tracking-widest font-bold text-slate-800 select-all">
                  {activeInviteCase?.inviteCode}
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed bg-blue-50 p-3 rounded-lg border border-blue-100">
                請家屬前往「照護一點通」首頁 → 我是家屬 → 輸入此邀請碼。<br/>
                連動後家屬可查看居服員服務紀錄與即時額度；家屬的照護日誌不會提供給機構。
              </p>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-2 border-t">
              <button onClick={() => setShowInviteModal(false)} className="px-5 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-sm">
                關閉
              </button>
              <button onClick={handleCopy} className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">
                {copied ? "✓ 已複製" : "複製邀請碼"}
              </button>
            </div>
          </div>
        </div>
      )}

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
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-inner">
              <CloudUpload className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h1 className="text-xl font-extrabold tracking-wide">長照 3.0 紙本對帳與多個案核銷系統</h1>
              </div>
            </div>
          </Link>
        </div>
      </header>

      <nav className="bg-white border-b shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex border-b mb-1">
            <button 
              onClick={() => setView("billing")}
              className={`py-4 px-6 font-bold text-base transition-colors border-b-4 ${view === "billing" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}>
              📤 月底核銷作業
            </button>
            <button 
              onClick={() => setView("cases")}
              className={`py-4 px-6 font-bold text-base transition-colors border-b-4 ${view === "cases" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}>
              👪 個案連動管理
            </button>
          </div>
          {view === "billing" && (
            <ul className="flex space-x-8 overflow-x-auto whitespace-nowrap">
              {[
                { id: 1, label: "排班計畫匯入" },
                { id: 2, label: "OCR 結果確認" },
                { id: 3, label: "個案紙本對帳比對室" },
                { id: 4, label: "月底核銷導出 (XLSX)" },
              ].map(step => (
                <li key={step.id} 
                    className={`cursor-pointer pb-4 pt-2 ${currentStep === step.id ? 'text-blue-600 border-b-2 border-blue-600 font-bold' : 'text-slate-500'}`}
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
          )}
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto w-full p-4 md:p-6 relative">
        {toastMsg && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl font-bold animate-in slide-in-from-top-4 z-50">
            {toastMsg}
          </div>
        )}

        {confirmModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-950 mb-2">確定解除連動？</h3>
                <p className="text-sm text-slate-600">解除後，家屬 {confirmModal.caseName} 將無法再查看服務紀錄與剩餘額度。</p>
              </div>
              <div className="bg-slate-50 px-6 py-4 flex justify-end gap-2 border-t">
                <button onClick={() => setConfirmModal({ show: false, caseId: null, caseName: "" })} className="px-5 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors">
                  取消
                </button>
                <button onClick={handleRemoveConnection} className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                  確定解除
                </button>
              </div>
            </div>
          </div>
        )}

        {view === "cases" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-800 text-sm leading-relaxed shadow-sm">
              <div className="flex gap-2">
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
                <div>
                  <p className="font-bold mb-1">ℹ 家屬端顯示的服務紀錄，即為督導於核銷流程中確認的紙本實績——</p>
                  <p className="mb-2 text-blue-700">一筆紀錄，同時服務核銷申報與家屬安心。</p>
                  <p className="text-blue-700 font-semibold">🔒 連動僅單向分享服務紀錄給家屬；家屬的照護日誌不會提供給機構。</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <th className="p-4 font-bold">個案</th>
                      <th className="p-4 font-bold">連動狀態</th>
                      <th className="p-4 font-bold">服務紀錄同步</th>
                      <th className="p-4 font-bold">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cases.map(c => (
                      <tr key={c.caseId} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-800">{c.name}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{c.caseId}</div>
                        </td>
                        <td className="p-4">
                          {c.status === 'none' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">未邀請</span>}
                          {c.status === 'invited' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">邀請中 · {c.inviteCode}</span>}
                          {c.status === 'connected' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">已連動 · {c.family}</span>}
                        </td>
                        <td className="p-4">
                          {c.status === 'connected' ? (
                            <div className="flex flex-col gap-2 items-start">
                              <span className="text-xs text-slate-600">最近同步 {c.lastSync} · 本月已同步 {c.syncedCount} 筆</span>
                              <button onClick={() => handlePushRecords(c)} className="text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition shadow-sm">
                                推送本月紀錄
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-4">
                          {c.status === 'none' && (
                            <button onClick={() => handleGenerateInvite(c)} className="text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 px-3 py-1.5 rounded-lg transition shadow-sm">
                              產生邀請碼
                            </button>
                          )}
                          {c.status === 'invited' && (
                            <div className="flex gap-2">
                              <button onClick={() => { setActiveInviteCase(c); navigator.clipboard.writeText(c.inviteCode); setCopied(true); setTimeout(()=>setCopied(false),2000); }} className="text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition shadow-sm">
                                {copied && activeInviteCase?.caseId === c.caseId ? "已複製" : "複製邀請碼"}
                              </button>
                              <button onClick={() => handleGenerateInvite(c)} className="text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition shadow-sm">
                                重新產生
                              </button>
                            </div>
                          )}
                          {c.status === 'connected' && (
                            <button onClick={() => confirmRemoveConnection(c)} className="text-xs font-bold bg-white border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition shadow-sm">
                              解除連動
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {view === "billing" && currentStep === 1 && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 animate-in fade-in">
            <div className="mb-6 flex items-center space-x-2 text-blue-600">
              <CloudUpload className="w-6 h-6" />
              <h2 className="text-xl font-bold">步驟 1：匯入居服系統排班計畫</h2>
            </div>
            <div className="grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 shadow-sm">
                  <label className="block text-sm font-bold text-slate-700 mb-2">上傳官方格式檔案</label>
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                </div>
                <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100/80 shadow-sm">
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">載入包含 A141408XXX 等案之模擬排班表，用以觸發 D1~D4 異常狀態。</p>
                  <button onClick={loadMockData} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2">
                    <ClipboardPaste className="w-4 h-4" /> 載入衛福部範本模擬資料
                  </button>
                </div>
              </div>
              <div className="lg:col-span-7 border border-slate-200 rounded-2xl flex flex-col bg-slate-50/30 shadow-sm overflow-hidden min-h-[300px]">
                <div className="p-4 border-b bg-white flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-700">已匯入排班計畫：</span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-semibold border">共 {importedData.length} 筆，異常 {importErrors.length} 筆</span>
                </div>
                {importErrors.length > 0 && (
                  <div className="p-3 bg-red-50 border-b border-red-100 max-h-32 overflow-auto">
                    <p className="text-sm font-bold text-red-700 mb-1">匯入異常紀錄：</p>
                    <ul className="text-xs text-red-600 space-y-1 pl-4 list-disc">
                      {importErrors.map((err, i) => (
                        <li key={i}>第 {err.rowIdx} 列 (身分證: {err.caseNatId || "空"}): {err.reasons.join(", ")}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex-1 p-4 overflow-auto max-h-64">
                  {importedData.length > 0 ? (
                    <div className="space-y-2">
                      {importedData.map((row, i) => (
                        <div key={i} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 text-sm">
                          <div>
                            <span className="font-mono text-slate-500 mr-2">{row.dateROC}</span>
                            <span className="font-bold text-slate-700 mr-2">{row.caseNatId}</span>
                            <span className="text-slate-600 text-xs">居服:{row.workerNatId}</span>
                          </div>
                          <div className="flex gap-3 items-center">
                            <span className="font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{row.code}</span>
                            <span className="text-slate-500">Qty:{row.qty}</span>
                            <span className="text-slate-500">${row.price}</span>
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

        {view === "billing" && currentStep === 2 && (
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
                      <th className="p-3 font-bold border-b w-16">Qty</th>
                      <th className="p-3 font-bold border-b w-16">時數</th>
                      <th className="p-3 font-bold border-b w-20">血壓</th>
                      <th className="p-3 font-bold border-b w-16">體溫</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ocrData.map((row) => (
                      <tr key={row.id}>
                        {['dateROC', 'caseNatId', 'code', 'qty', 'hoursDerived', 'bp', 'temp'].map(field => {
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
              <div className="mt-6 flex justify-end items-center gap-4">
                <span className="text-sm text-slate-500 font-bold flex items-center gap-1"><CheckCircle className="w-4 h-4 text-emerald-500"/> 確認後的紀錄將同步顯示於已連動家屬的照護日誌</span>
                <button onClick={confirmOcrImport} className="bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-700 transition">
                  確認匯入，進入對帳室
                </button>
              </div>
            )}
          </section>
        )}

        {view === "billing" && currentStep === 3 && (
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
                    <th className="p-3 font-bold">數量 / 時數</th>
                    <th className="p-3 font-bold text-right">單價</th>
                    <th className="p-3 font-bold text-right">小計</th>
                    <th className="p-3 font-bold">差異狀態 (D1-D4)</th>
                    <th className="p-3 font-bold">督導處理註記</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reconciledData.map((row) => {
                    const isMissingPrice = row.price === null && row.status !== 'D1';
                    const displayPrice = row.price !== null ? `$${row.price}` : "待補價";
                    const displaySubtotal = row.subtotal !== null ? `$${row.subtotal}` : "待補價";

                    return (
                      <tr key={row.id} className={`hover:bg-slate-50 transition-colors ${row.status === 'D1' ? 'opacity-70 bg-slate-50/50' : ''}`}>
                        <td className="p-3 font-mono text-slate-500">{row.dateROC}</td>
                        <td className="p-3 font-bold text-slate-700">{row.caseNatId}</td>
                        <td className="p-3">
                          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">{row.code}</span>
                          {row.priceWarning && <div className="text-yellow-600 text-xs mt-1 font-bold">⚠ 單價與附表不符</div>}
                        </td>
                        <td className="p-3 font-bold text-slate-700">{row.qty} <span className="text-xs text-slate-400 font-normal">({row.hoursDerived}h)</span></td>
                        <td className={`p-3 text-right ${isMissingPrice ? 'text-amber-600 font-bold' : 'text-slate-600'}`}>{displayPrice}</td>
                        <td className={`p-3 text-right ${isMissingPrice ? 'text-amber-600 font-bold' : 'text-slate-800 font-bold'}`}>{displaySubtotal}</td>
                        <td className="p-3">
                          {row.status === 'ok' && <span className="text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full font-bold text-xs"><CheckCircle className="w-3 h-3 inline mr-1"/>完全一致</span>}
                          {row.status === 'D1' && <span className="text-red-700 bg-red-100 px-2 py-1 rounded-full font-bold text-xs"><AlertTriangle className="w-3 h-3 inline mr-1"/>🔴 D1 疑似未執行</span>}
                          {row.status === 'D2' && <span className="text-orange-700 bg-orange-100 px-2 py-1 rounded-full font-bold text-xs"><AlertTriangle className="w-3 h-3 inline mr-1"/>🟠 D2 計畫外服務</span>}
                          {row.status === 'D3' && (
                            <div className="flex flex-col gap-1">
                              <span className="text-yellow-800 bg-yellow-100 px-2 py-1 rounded-full font-bold text-xs w-max"><AlertCircle className="w-3 h-3 inline mr-1"/>🟡 D3 數量/時數差異</span>
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
                          <div className="flex flex-col gap-1">
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
                            {isMissingPrice && <span className="text-[10px] text-amber-600">匯出前需人工補價</span>}
                            {row.status === 'D1' && <span className="text-[10px] text-red-600">不列入核銷明細</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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

        {view === "billing" && currentStep === 4 && (() => {
          const validData = reconciledData.filter(r => r.status === 'ok' || r.status === 'D3' || r.status === 'D4' || (r.status === 'D2' && r.d2Confirmed));
          const subsidyTotal = validData.filter(r => r.category === 1).reduce((sum, r) => sum + (r.subtotal || 0), 0);
          const selfPayTotal = validData.filter(r => r.category === 2).reduce((sum, r) => sum + (r.subtotal || 0), 0);
          const missingPriceCount = validData.filter(r => r.price === null).length;
          const warningCount = validData.filter(r => r.priceWarning).length;

          return (
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 animate-in fade-in flex flex-col items-center justify-center min-h-[400px]">
              <Download className="w-16 h-16 text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold text-slate-800 mb-6">步驟 4：衛福部月底核銷導出</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mb-8">
                <div className="bg-slate-50 p-4 rounded-xl border text-center">
                  <div className="text-sm text-slate-500 mb-1">補助小計 (類別1)</div>
                  <div className="text-xl font-bold text-slate-800">${subsidyTotal.toLocaleString()}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border text-center">
                  <div className="text-sm text-slate-500 mb-1">自費小計 (類別2)</div>
                  <div className="text-xl font-bold text-slate-800">${selfPayTotal.toLocaleString()}</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                  <div className="text-sm text-blue-600 mb-1 font-bold">總計金額</div>
                  <div className="text-xl font-bold text-blue-700">${(subsidyTotal + selfPayTotal).toLocaleString()}</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-center flex flex-col items-center justify-center">
                  <div className="text-sm text-yellow-700 mb-1 font-bold">待補價 / 單價警示</div>
                  <div className="text-lg font-bold text-yellow-800">{missingPriceCount} 筆 / {warningCount} 筆</div>
                </div>
              </div>

              <p className="text-slate-500 mb-8 text-center max-w-md leading-relaxed">
                已完成所有的紙本與排班比對及督導註記。<br/>
                您可以將結果匯出為符合衛福部格式的 XLSX 檔案，進行申報。
              </p>
              <button onClick={exportExcel} disabled={reconciledData.length === 0}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold text-lg shadow-sm flex items-center gap-2 transition-all">
                <FileSpreadsheet className="w-5 h-5" /> 匯出核銷報表 (含異常附表)
              </button>
            </section>
          );
        })()}
      </main>
    </div>
  );
}
