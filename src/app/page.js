"use client";

import Link from "next/link";
import { Calculator, Users, Building2, ChevronRight, HeartHandshake } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-stone-800">
      <div className="max-w-4xl w-full">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-teal-600 rounded-2xl mb-6 shadow-sm">
            <HeartHandshake className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-stone-900 tracking-tight mb-4">
            照護一點通
          </h1>
          <p className="text-lg md:text-xl text-stone-500 font-medium max-w-2xl mx-auto leading-relaxed">
            台灣長期照顧家庭的第一站
            <br />
            一筆紀錄，三種價值：試算補助、家屬安心、機構核銷
          </p>
        </div>

        {/* 3 Entry Points */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Card 1: Calculator */}
          <Link href="/calculator" className="group flex flex-col bg-white p-6 rounded-3xl shadow-sm border border-stone-200 hover:border-teal-500 hover:shadow-md transition-all active:scale-[0.98]">
            <div className="w-12 h-12 bg-stone-100 text-stone-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
              <Calculator className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold mb-2">試算平台</h2>
            <p className="text-sm text-stone-500 mb-6 flex-grow leading-relaxed">
              免註冊，快速估算 CMS 等級與「四包錢」補助額度，並導流配合廠商。
            </p>
            <div className="flex items-center text-sm font-bold text-teal-600">
              免登入開始試算
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Family Diary */}
          <Link href="/diary" className="group flex flex-col bg-rose-50 p-6 rounded-3xl shadow-sm border border-rose-200 hover:border-rose-400 hover:shadow-md transition-all active:scale-[0.98]">
            <div className="w-12 h-12 bg-white text-rose-600 rounded-xl flex items-center justify-center mb-4 shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-rose-900">我是家屬</h2>
            <p className="text-sm text-rose-700/80 mb-6 flex-grow leading-relaxed">
              輸入邀請碼連動機構，查看居服員紀錄；寫日誌讓 AI 幫您留意惡化徵兆。
            </p>
            <div className="flex items-center text-sm font-bold text-rose-600">
              進入照護日誌
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Institution */}
          <Link href="/institution" className="group flex flex-col bg-slate-50 p-6 rounded-3xl shadow-sm border border-slate-200 hover:border-slate-400 hover:shadow-md transition-all active:scale-[0.98]">
            <div className="w-12 h-12 bg-white text-slate-700 rounded-xl flex items-center justify-center mb-4 shadow-sm">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-slate-900">我是機構</h2>
            <p className="text-sm text-slate-600 mb-6 flex-grow leading-relaxed">
              排班對照、紙本 OCR 辨識輔助填寫，月底一鍵產出衛福部核銷報表。
            </p>
            <div className="flex items-center text-sm font-bold text-slate-700">
              進入機構管理台
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
