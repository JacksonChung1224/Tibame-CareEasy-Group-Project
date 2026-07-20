"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export function PrivacyModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-ui-line shrink-0">
          <h2 className="text-xl font-bold text-ui-ink">隱私權政策</h2>
          <button onClick={onClose} className="p-2 text-ui-muted hover:text-ui-ink hover:bg-ui-cream-deep rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
          <p className="font-bold mb-4">【照護一點通 隱私權政策】<br/>最後更新：2026 年 7 月</p>
          
          <p className="mb-4">「照護一點通」（以下稱本平台）重視您的個人資料保護，依據《個人資料保護法》（以下稱個資法）向您告知下列事項。本平台目前為專題示範版本，實際服務內容以正式上線公告為準。</p>
          
          <h3 className="font-bold text-ui-ink mt-6 mb-2">一、蒐集目的</h3>
          <p className="mb-4">提供長照補助試算、照護紀錄與提醒服務、改善推估準確度之統計分析，以及平台服務成效統計。</p>
          
          <h3 className="font-bold text-ui-ink mt-6 mb-2">二、蒐集之個人資料類別</h3>
          <p className="mb-1">1. 補助試算：您於評估問卷填寫之身心失能與健康狀況評估選項（不含姓名、身分證字號等直接識別資料）。</p>
          <p className="mb-1">2. 照護日誌（註冊後）：電子郵件、您記錄之照護觀察內容。</p>
          <p className="mb-4">3. 平台使用紀錄：服務項目點擊統計。</p>
          
          <h3 className="font-bold text-ui-ink mt-6 mb-2">三、特種個資之同意</h3>
          <p className="mb-4">評估選項與照護紀錄可能涉及個資法第六條所定之病歷、醫療與健康檢查資料。本平台僅於取得您的明確同意後蒐集，並以匿名或去識別化方式儲存與分析，確保無法直接識別特定個人。</p>
          
          <h3 className="font-bold text-ui-ink mt-6 mb-2">四、利用期間、地區、對象及方式</h3>
          <p className="mb-1">・期間：蒐集目的存續期間，或依相關法令規定之保存年限。</p>
          <p className="mb-1">・地區：台灣及本平台所使用雲端服務主機之所在地。</p>
          <p className="mb-1">・對象：僅限本平台，不會提供予任何第三方。</p>
          <p className="mb-4">・方式：以電子方式於前述目的範圍內處理及利用。</p>
          
          <h3 className="font-bold text-ui-ink mt-6 mb-2">五、當事人權利</h3>
          <p className="mb-4">依個資法第三條，您得就您的個人資料行使下列權利：查詢或請求閱覽、請求製給複製本、請求補充或更正、請求停止蒐集處理或利用、請求刪除。<br/>行使方式：透過頁尾「聯絡我們」與我們聯繫，我們將於合理期間內處理。</p>
          
          <h3 className="font-bold text-ui-ink mt-6 mb-2">六、資料安全</h3>
          <p className="mb-4">本平台採取合理之安全維護措施，包含傳輸加密與存取控管，以防止個人資料被竊取、竄改、毀損、滅失或洩漏。</p>
          
          <h3 className="font-bold text-ui-ink mt-6 mb-2">七、注意事項</h3>
          <p className="mb-4">本平台提供之試算與分析為資訊參考，非政府機關正式核定，亦非醫療診斷；實際補助資格與額度須由各縣市長期照顧管理中心評估核定。</p>
          
          <h3 className="font-bold text-ui-ink mt-6 mb-2">八、政策修訂</h3>
          <p className="mb-4">本政策修訂時將公告於本頁面。若您不同意修訂內容，得停止使用本平台並依第五條行使權利。</p>
        </div>
      </div>
    </div>
  );
}

export function TermsModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-ui-line shrink-0">
          <h2 className="text-xl font-bold text-ui-ink">服務條款</h2>
          <button onClick={onClose} className="p-2 text-ui-muted hover:text-ui-ink hover:bg-ui-cream-deep rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
          <p className="font-bold mb-4">【照護一點通 服務條款】<br/>最後更新：2026 年 7 月</p>
          
          <h3 className="font-bold text-ui-ink mt-6 mb-2">一、服務性質</h3>
          <p className="mb-4">本平台為長期照顧資訊整理與試算工具，非政府機關，亦不提供醫療服務。所有試算結果、AI 分析與照護訊號均為觀察彙整與參考資訊，不構成醫療診斷或政府核定；金額均為法規所定最高上限之推估。</p>
          
          <h3 className="font-bold text-ui-ink mt-6 mb-2">二、使用者義務</h3>
          <p className="mb-4">您應提供真實之填答內容並妥善保管帳號；不得利用本平台從事違法行為，或以自動化方式大量存取本平台。</p>
          
          <h3 className="font-bold text-ui-ink mt-6 mb-2">三、智慧財產權</h3>
          <p className="mb-4">本平台之程式、介面、文字、圖示與商標均受相關法令保護，非經同意不得重製、改作或供公眾使用。</p>
          
          <h3 className="font-bold text-ui-ink mt-6 mb-2">四、免責事項</h3>
          <p className="mb-4">本平台盡力維持資訊正確與服務穩定，惟法規與費率可能隨主管機關公告調整，一切以衛生福利部及各縣市長期照顧管理中心之公告與核定為準。於法令許可範圍內，本平台不負因使用或無法使用本服務所生之間接損失責任。</p>
          
          <h3 className="font-bold text-ui-ink mt-6 mb-2">五、服務變更與終止</h3>
          <p className="mb-4">本平台得因營運需要調整或終止全部或部分服務，重大變更將以適當方式公告。</p>
          
          <h3 className="font-bold text-ui-ink mt-6 mb-2">六、準據法與管轄</h3>
          <p className="mb-4">本條款以中華民國法律為準據法；因本條款所生爭議，以臺灣臺北地方法院為第一審管轄法院。</p>
        </div>
      </div>
    </div>
  );
}

export function Footer() {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  return (
    <>
      <footer className="w-full bg-ui-cream-deep text-ui-muted text-sm py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-6 text-center flex flex-col md:flex-row justify-center items-center gap-2 md:gap-4">
          <span className="font-bold">© 2026 CareEasy 照護一點通</span>
          <span className="hidden md:inline text-ui-line">|</span>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-brand-teal-dark transition-colors">隱私權政策</button>
            <span className="text-ui-line">|</span>
            <button onClick={() => setIsTermsOpen(true)} className="hover:text-brand-teal-dark transition-colors">服務條款</button>
            <span className="text-ui-line">|</span>
            <a href="mailto:careeasy0720@gmail.com" className="hover:text-brand-teal-dark transition-colors">聯絡我們</a>
          </div>
        </div>
      </footer>
      
      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </>
  );
}
