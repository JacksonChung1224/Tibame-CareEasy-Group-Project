"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ShieldAlert, Download, LockKeyhole } from "lucide-react";
import * as XLSX from "xlsx";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === "care2026") {
      setIsAuthenticated(true);
      fetchData();
    } else {
      setError("密碼錯誤，請重試");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "care2026" })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch data");
      }

      setRecords(result.data);
    } catch (err) {
      console.error(err);
      setError("讀取資料失敗，請確認伺服器連線狀態。");
    } finally {
      setLoading(false);
    }
  };

  // 核心轉換邏輯：將凌亂的 JSON 與欄位攤平成全中文的乾淨物件
  const transformData = (data) => {
    return data.map((row) => {
      const ans = row.answers || {};
      
      // 處理陣列格式的選項，過濾掉 __none__ 標籤
      const formatArray = (arr) => {
        if (!Array.isArray(arr)) return "";
        return arr.filter((v) => v !== "__none__").join("、");
      };

      // 轉換台灣時間
      const twTime = ans.tw_time ? ans.tw_time.replace("+08:00", "") : new Date(row.created_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });

      return {
        "紀錄ID": row.id,
        "建立時間(台灣)": twTime,
        "是否申請過CMS": row.has_applied_cms ? "是" : "否",
        "系統推估級數": row.calculated_cms_level || "無",
        "是否走失智路徑": row.is_dementia_path ? "是" : "否",
        
        // 攤平 Answers 的核心欄位
        "申請者身分別": ans.identity === "elder" ? "65歲以上" : ans.identity === "indigenous" ? "55歲以上原住民" : ans.identity === "disability" ? "身心障礙者" : ans.identity || "",
        "居住縣市": ans.region || "",
        "居住狀況": ans.living_status === "alone" ? "獨居" : ans.living_status === "with_family" ? "與家人同住" : ans.living_status === "institution" ? "住機構" : ans.living_status || "",
        "照顧者狀況": ans.caregiver_status === "foreign" ? "有外籍看護" : ans.caregiver_status === "family" ? "無外籍看護，家人照顧" : ans.caregiver_status === "none" ? "無人照顧" : ans.caregiver_status || "",
        
        // 失智與特殊醫療
        "CDR分數(失智路徑)": ans.cdr ?? "",
        "行為與精神症狀": ans.behavior === 0 ? "無明顯問題" : ans.behavior === 1 ? "偶爾出現" : ans.behavior === 2 ? "頻繁出現" : "",
        "特殊醫療照護需求": formatArray(ans.medical),
        "工具性日常生活(IADL)": formatArray(ans.iadl),
        
        // 巴氏量表 (ADL)
        "進食": ans.adl_eating ?? "",
        "移位": ans.adl_transfer ?? "",
        "個人衛生": ans.adl_hygiene ?? "",
        "如廁": ans.adl_toilet ?? "",
        "洗澡": ans.adl_bathing ?? "",
        "平地走動": ans.adl_walking ?? "",
        "上下樓梯": ans.adl_stairs ?? "",
        "穿脫衣物": ans.adl_dressing ?? "",
        "大便控制": ans.adl_bowel ?? "",
        "小便控制": ans.adl_bladder ?? "",
        "總分": ans.score ?? ""
      };
    });
  };

  const handleDownloadCSV = () => {
    const formattedData = transformData(records);
    if (formattedData.length === 0) return;

    // 取得所有中文表頭
    const headers = Object.keys(formattedData[0]);
    // 將資料轉為 CSV 格式的字串，並處理逗號與換行
    const csvRows = formattedData.map((row) => {
      return headers
        .map((header) => {
          const val = row[header] === null || row[header] === undefined ? "" : String(row[header]);
          // 如果內容有逗號或雙引號，用雙引號包起來
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    // 加入 UTF-8 BOM，強制 Excel 以正確編碼開啟，解決亂碼問題
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `長照輔助試算資料_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadExcel = () => {
    const formattedData = transformData(records);
    if (formattedData.length === 0) return;

    // 建立一個新活頁簿
    const workbook = XLSX.utils.book_new();
    // 將 JSON 資料轉為工作表
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    
    // 設定欄寬 (稍微讓它好看點)
    const colWidths = [
      { wch: 36 }, // 紀錄ID
      { wch: 20 }, // 建立時間
      { wch: 15 }, // 是否申請過CMS
      { wch: 12 }, // 系統推估級數
      { wch: 15 }, // 是否走失智路徑
      { wch: 15 }, // 申請者身分別
      { wch: 12 }, // 居住縣市
      { wch: 15 }, // 居住狀況
      { wch: 20 }, // 照顧者狀況
      { wch: 15 }, // CDR分數
      { wch: 15 }, // 行為與精神症狀
      { wch: 30 }, // 特殊醫療照護需求
      { wch: 40 }, // 工具性日常生活(IADL)
    ];
    worksheet["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "評估紀錄");
    
    // 匯出檔案
    XLSX.writeFile(workbook, `長照輔助試算資料_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-2xl shadow-sm ring-1 ring-border p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <LockKeyhole className="size-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">管理員後台登入</h1>
            <p className="text-muted-foreground text-sm mt-2 text-center">
              請輸入團隊通關密碼以下載報表資料
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入密碼"
                className="w-full h-12 px-4 rounded-xl ring-1 ring-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                autoFocus
              />
            </div>
            {error && <p className="text-destructive text-sm font-bold">{error}</p>}
            <button
              type="submit"
              className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors active:scale-95"
            >
              進入後台
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ShieldAlert className="size-6 text-primary" />
              報表匯出專用後台
            </h1>
            <p className="text-muted-foreground mt-1">
              將資料庫紀錄轉換為易讀的中文格式，支援 CSV 與 Excel 原生格式。
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <button
              onClick={handleDownloadCSV}
              disabled={loading || records.length === 0}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-card text-foreground ring-1 ring-border font-bold hover:bg-secondary transition-colors disabled:opacity-50"
            >
              <Download className="size-4" />
              下載 CSV (防亂碼)
            </button>
            <button
              onClick={handleDownloadExcel}
              disabled={loading || records.length === 0}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-accent text-accent-foreground font-bold hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              <Download className="size-4" />
              下載 Excel (.xlsx)
            </button>
          </div>
        </div>

        <div className="bg-card rounded-2xl ring-1 ring-border p-6 shadow-sm">
          {loading ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground font-bold animate-pulse">
              載入資料中...
            </div>
          ) : records.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground">
              目前沒有任何資料紀錄。
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <span className="text-foreground font-bold text-lg">系統資料預覽</span>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
                  共 {records.length} 筆紀錄
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-muted-foreground border-b border-border">
                    <tr>
                      <th className="pb-3 px-2 font-bold whitespace-nowrap">建立時間 (台灣)</th>
                      <th className="pb-3 px-2 font-bold whitespace-nowrap">申請過 CMS</th>
                      <th className="pb-3 px-2 font-bold whitespace-nowrap">推估級數</th>
                      <th className="pb-3 px-2 font-bold whitespace-nowrap">失智路徑</th>
                      <th className="pb-3 px-2 font-bold whitespace-nowrap">同住家人</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {records.slice(0, 10).map((record) => {
                      const ans = record.answers || {};
                      const twTime = ans.tw_time ? ans.tw_time.replace("+08:00", "") : new Date(record.created_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
                      const living = ans.living_status === "alone" ? "獨居" : ans.living_status === "with_family" ? "與家人同住" : ans.living_status === "institution" ? "住機構" : "未填寫";
                      
                      return (
                        <tr key={record.id} className="hover:bg-secondary/50 transition-colors">
                          <td className="py-3 px-2 text-foreground whitespace-nowrap">{twTime}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${record.has_applied_cms ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                              {record.has_applied_cms ? "是" : "否"}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-foreground font-bold">{record.calculated_cms_level || "-"}</td>
                          <td className="py-3 px-2 text-muted-foreground">{record.is_dementia_path ? "是" : "否"}</td>
                          <td className="py-3 px-2 text-muted-foreground">{living}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {records.length > 10 && (
                <div className="text-center pt-4 text-sm text-muted-foreground">
                  ... 還有 {records.length - 10} 筆資料未顯示，請下載完整報表查看。
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
