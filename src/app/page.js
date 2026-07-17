"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { UiIcon } from "@/components/CareEasyIcon";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ui-cream flex flex-col items-center justify-center p-6 text-ui-ink">
      <div className="max-w-4xl w-full">
        {/* Header Section */}
        <div className="text-center mb-12 relative mt-4">
          <div className="inline-block mb-6 relative">
            <img src="/careeasy-logo-mark.png" alt="Logo" className="h-16 object-contain" />
            <div className="absolute -top-3 -right-6 bg-brand-coral text-white text-xs font-bold px-2 py-1 rounded-full shadow-md animate-bounce">
              v3.1
            </div>
          </div>
          
          <div className="mb-4">
            <span className="inline-block bg-ui-teal-soft text-brand-teal-dark border border-brand-teal-dark/20 text-sm px-4 py-1.5 rounded-full font-semibold shadow-sm">
              🎉 全新上線：三端整合大改版！ 
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-ui-brown tracking-tight mb-4">
            照護一點通
          </h1>
          <p className="text-lg md:text-xl text-ui-muted font-medium max-w-2xl mx-auto leading-relaxed">
            台灣長期照顧家庭的第一站
            <br />
            一筆紀錄，三種價值：試算補助、家屬安心、機構核銷
          </p>
        </div>

        {/* 3 Entry Points */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Card 1: Calculator */}
          <Link href="/calculator" className="group flex flex-col bg-ui-paper p-6 rounded-3xl shadow-card border border-ui-line hover:border-brand-teal-dark transition-all active:scale-[0.98]">
            <UiIcon name="calculator" className="feature-icon teal mb-4" />
            <h2 className="text-xl font-bold mb-2 text-ui-brown">試算平台</h2>
            <p className="text-sm text-ui-muted mb-6 flex-grow leading-relaxed">
              免註冊，快速估算 CMS 等級與「四包錢」補助額度，並導流配合廠商。
            </p>
            <div className="flex items-center text-sm font-bold text-brand-teal-dark">
              免登入開始試算
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Family Diary */}
          <Link href="/diary" className="group flex flex-col bg-ui-paper p-6 rounded-3xl shadow-card border border-ui-line hover:border-brand-coral transition-all active:scale-[0.98]">
            <UiIcon name="diary" className="feature-icon coral mb-4" />
            <h2 className="text-xl font-bold mb-2 text-ui-brown">我是家屬</h2>
            <p className="text-sm text-ui-muted mb-6 flex-grow leading-relaxed">
              輸入邀請碼連動機構，查看居服員紀錄；寫日誌讓 AI 幫您留意惡化徵兆。
            </p>
            <div className="flex items-center text-sm font-bold text-brand-coral">
              進入照護日誌
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Institution */}
          <Link href="/institution" className="group flex flex-col bg-ui-paper p-6 rounded-3xl shadow-card border border-ui-line hover:border-brand-amber transition-all active:scale-[0.98]">
            <UiIcon name="institution" className="feature-icon amber mb-4" />
            <h2 className="text-xl font-bold mb-2 text-ui-brown">我是機構</h2>
            <p className="text-sm text-ui-muted mb-6 flex-grow leading-relaxed">
              排班對照、紙本 OCR 辨識輔助填寫，月底一鍵產出衛福部核銷報表。
            </p>
            <div className="flex items-center text-sm font-bold text-brand-amber">
              進入機構管理台
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
