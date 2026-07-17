import Link from "next/link";
import { HeartHandshake } from "lucide-react";

export default function PlansPage() {
  return (
    <main className="flex min-h-screen flex-col bg-ui-cream text-ui-ink relative">
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-6 pt-7 relative z-10">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer hover:opacity-80 transition-opacity">
          <img src="/careeasy-logo-mark.png" alt="Logo" className="h-10 object-contain" />
          <span className="font-bold tracking-wider text-sm text-ui-brown">照護一點通 · 家屬端</span>
        </Link>
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-10 pt-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">先安心使用，需要更多再升級</h1>
          <p className="text-sm text-muted-foreground">選擇最適合您的照護紀錄方案</p>
        </div>

        <div className="space-y-6">
          {/* 免費版 */}
          <div className="bg-ui-paper rounded-[18px] p-6 ring-2 ring-brand-teal-dark shadow-card relative">
            <div className="absolute top-0 right-6 -translate-y-1/2">
              <span className="bg-brand-teal-dark text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                目前方案
              </span>
            </div>
            <h3 className="text-xl font-bold text-ui-brown mb-1">【免費版】</h3>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-black text-ui-ink">NT$0</span>
              <span className="text-sm font-medium text-ui-muted">/月</span>
            </div>
            <ul className="space-y-3 text-sm text-ui-ink mb-6">
              <li className="flex items-center gap-2">
                <span className="text-brand-teal-dark">✓</span> 1 位被照顧者
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand-teal-dark">✓</span> 日誌保存 90 天
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand-teal-dark">✓</span> AI 照護訊號
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand-teal-dark">✓</span> 就醫摘要
              </li>
            </ul>
            <Link 
              href="/diary" 
              className="block w-full py-3.5 text-center bg-brand-teal-dark text-white rounded-2xl font-bold hover:opacity-90 transition-opacity active:scale-95 shadow-md"
            >
              開始免費使用
            </Link>
          </div>

          {/* 進階版 */}
          <div className="bg-ui-paper rounded-[18px] p-6 ring-1 ring-ui-line shadow-card relative opacity-70">
            <h3 className="text-xl font-bold text-ui-brown mb-1">【進階版】</h3>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-black text-ui-muted">即將推出</span>
            </div>
            <ul className="space-y-3 text-sm text-ui-muted mb-6">
              <li className="flex items-center gap-2">✓ 多位被照顧者</li>
              <li className="flex items-center gap-2">✓ 日誌無限保存</li>
              <li className="flex items-center gap-2">✓ PDF 匯出</li>
              <li className="flex items-center gap-2">✓ 家屬多人共編</li>
              <li className="flex items-center gap-2">✓ AI 週報</li>
            </ul>
            <button 
              disabled
              className="w-full py-3.5 bg-stone-100 text-ui-muted rounded-2xl font-bold cursor-not-allowed"
            >
              即將推出
            </button>
          </div>
        </div>

        <p className="text-xs text-center text-stone-400 mt-8 mb-4">方案內容以正式上線公告為準</p>
      </div>
    </main>
  );
}
