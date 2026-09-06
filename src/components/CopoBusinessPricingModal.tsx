import React from 'react';
import { Shield, Zap, Star, Check, X } from 'lucide-react';
import { useSwipeDownToDismiss } from '../hooks/useSwipeDownToDismiss';
import { useLanguage } from '../i18n/LanguageContext';

interface CopoBusinessPricingModalProps {
  onClose: () => void;
  onSelectPlan: (plan: 'basic' | 'pro' | 'premium') => void;
  currentPlan?: 'none' | 'basic' | 'pro' | 'premium' | 'free';
}

export const CopoBusinessPricingModal: React.FC<CopoBusinessPricingModalProps> = ({ 
  onClose, 
  onSelectPlan,
  currentPlan = 'none'
}) => {
  const { t } = useLanguage();
  const { swipeProps, dragOffsetY } = useSwipeDownToDismiss({
    onDismiss: onClose,
    threshold: 60
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-200 copo-business-pricing-modal select-none sm:select-auto">
      {/* Blurred Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div 
        style={{
          transform: dragOffsetY > 0 ? `translateY(${dragOffsetY}px)` : undefined,
          transition: dragOffsetY === 0 ? "transform 0.2s ease-out" : "none"
        }}
        className="w-full sm:max-w-5xl rounded-none sm:rounded-[32px] shadow-2xl relative z-10 flex flex-col bg-[#141416] ring-0 sm:ring-1 sm:ring-white/[0.05] animate-in slide-in-from-bottom duration-300 h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[95vh] overflow-hidden"
      >
        {/* Top Drag Indicator Pill for Mobile (Signature Top Black/Dark Line like Comments) */}
        <div 
          className="h-8 flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing sm:hidden touch-none"
          {...swipeProps}
        >
          <div className="w-12 h-1.5 rounded-full bg-zinc-700" />
        </div>

        {/* Scrollable Area */}
        <div className="overflow-y-auto custom-scrollbar flex-1 p-6 md:p-10">
          
          <button 
            onClick={onClose}
            className="absolute right-6 top-6 w-10 h-10 hidden sm:flex items-center justify-center rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 transition-colors cursor-pointer z-20"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-10 mt-2">
            <h2 className="text-[32px] md:text-[40px] font-black text-white tracking-tight mb-3">{t("pricingModal.title", "Upgrade Your Business")}</h2>
            <p className="text-[15px] text-zinc-400 max-w-lg mx-auto font-medium leading-relaxed">
              {t("pricingModal.subtitle", "Turn video reviews into your most powerful marketing asset. Choose the plan that accelerates your growth.")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            
            {/* Basic Plan */}
            <div className={`rounded-[24px] p-8 flex flex-col h-full ${currentPlan === 'basic' ? 'bg-white/[0.08] ring-2 ring-white/[0.2]' : 'bg-white/[0.04] hover:bg-white/[0.06] transition-colors ring-1 ring-white/[0.05]'}`}>
              <div className="mb-6">
                <Shield className="w-8 h-8 text-zinc-400 mb-4" />
                <h3 className="text-2xl font-black text-white">{t("pricingModal.basic", "Basic")}</h3>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-[40px] font-black text-white leading-none">$0</span>
                  <span className="text-[13px] text-zinc-500 font-bold uppercase tracking-wider">{t("pricingModal.perMonth", "/ month")}</span>
                </div>
                <p className="text-[13px] text-zinc-500 font-bold mt-2">{t("pricingModal.freeForever", "Free forever.")}</p>
                <p className="text-[14px] text-zinc-400 mt-5 font-medium leading-relaxed h-10">{t("pricingModal.basicDesc", "Get listed and stay informed.")}</p>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  t("pricingModal.f1", "Claim business"),
                  t("pricingModal.f2", "Verified Badge"),
                  t("pricingModal.f3", "Update address/hours"),
                  t("pricingModal.f4", "Email alerts for new videos")
                ].map((feature, i) => (
                  <li key={i} className="flex gap-3 text-[14px] text-zinc-300 font-medium items-start">
                    <Check className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" /> 
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button 
                disabled={currentPlan === 'basic'}
                onClick={() => onSelectPlan('basic')}
                className={`w-full py-4 rounded-xl font-bold text-[14px] transition-all flex items-center justify-center ${currentPlan === 'basic' ? 'bg-white/[0.05] text-zinc-500 cursor-not-allowed' : 'bg-white/[0.08] text-white hover:bg-white/[0.12]'}`}
              >
                {currentPlan === 'none' ? t("pricingModal.claimFree", "Claim Business (Free)") : currentPlan === 'basic' ? t("pricingModal.currentPlan", "Current Plan") : t("pricingModal.downgradeBasic", "Downgrade to Basic")}
              </button>
            </div>

            {/* Pro Plan */}
            <div className={`rounded-[24px] p-8 flex flex-col h-full relative ${currentPlan === 'pro' ? 'bg-white/[0.08] ring-2 ring-white' : 'bg-white/[0.04] hover:bg-white/[0.06] transition-colors ring-1 ring-zinc-750'}`}>
              {currentPlan !== 'pro' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-zinc-950 text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg">
                  {t("pricingModal.mostPopular", "Most Popular")}
                </div>
              )}
              <div className="mb-6">
                <Zap className="w-8 h-8 text-zinc-300 mb-4" />
                <h3 className="text-2xl font-black text-white">{t("pricingModal.pro", "Pro")}</h3>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-[40px] font-black text-white leading-none">$149</span>
                  <span className="text-[13px] text-zinc-500 font-bold uppercase tracking-wider">{t("pricingModal.perMonth", "/ month")}</span>
                </div>
                <p className="text-[13px] text-zinc-500 font-bold mt-2">{t("pricingModal.cancelAnytime", "Cancel anytime.")}</p>
                <p className="text-[14px] text-zinc-400 mt-5 font-medium leading-relaxed h-10">{t("pricingModal.proDesc", "Engage customers and drive sales.")}</p>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  t("pricingModal.p1", "Everything in Basic"),
                  t("pricingModal.p2", "Add Website Link"),
                  t("pricingModal.p3", 'Add "Book Now" / CTA Button'),
                  t("pricingModal.p4", "Publicly Reply to videos"),
                  t("pricingModal.p5", "Up to 5 Direct Messages / day"),
                  t("pricingModal.p6", "Dedicated Business Dashboard"),
                  t("pricingModal.p7", "Custom Review Invite Links & QR Codes"),
                  t("pricingModal.p8", "Custom QR Print Kit"),
                  t("pricingModal.p9", "Download Videos for Social Media")
                ].map((feature, i) => (
                  <li key={i} className="flex gap-3 text-[14px] text-zinc-300 font-medium items-start">
                    <Check className="w-5 h-5 text-white shrink-0 mt-0.5" /> 
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button 
                disabled={currentPlan === 'pro'}
                onClick={() => onSelectPlan('pro')}
                className={`w-full py-4 rounded-xl font-bold text-[14px] transition-all flex items-center justify-center ${currentPlan === 'pro' ? 'bg-white/[0.05] text-zinc-500 cursor-not-allowed' : 'bg-white text-zinc-950 hover:bg-zinc-200 shadow-lg'}`}
              >
                {currentPlan === 'none' ? t("pricingModal.claimUpgradePro", "Claim & Upgrade to Pro") : currentPlan === 'pro' ? t("pricingModal.currentPlan", "Current Plan") : t("pricingModal.upgradePro", "Upgrade to Pro")}
              </button>
            </div>

            {/* Premium Plan */}
            <div className={`rounded-[24px] p-8 flex flex-col h-full bg-[#18181b] ring-1 ring-zinc-800 relative overflow-hidden shadow-2xl`}>
              <div className="mb-6 relative z-10">
                <Star className="w-8 h-8 text-zinc-300 mb-4" />
                <h3 className="text-2xl font-black text-white">{t("pricingModal.premium", "Premium")}</h3>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-[40px] font-black text-white leading-none">$299</span>
                  <span className="text-[13px] text-zinc-500 font-bold uppercase tracking-wider">{t("pricingModal.perMonth", "/ month")}</span>
                </div>
                <p className="text-[13px] text-zinc-500 font-bold mt-2">{t("pricingModal.cancelAnytime", "Cancel anytime.")}</p>
                <p className="text-[14px] text-zinc-400 mt-5 font-medium leading-relaxed h-10">{t("pricingModal.premiumDesc", "The ultimate marketing engine.")}</p>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1 relative z-10">
                {[
                  t("pricingModal.pr1", "Everything in Pro"),
                  t("pricingModal.pr2", "Up to 10 Direct Messages / day"),
                  t("pricingModal.pr3", "Website Video Widget (Embed videos)"),
                  t("pricingModal.pr4", "Full Commercial Rights (Paid Ads)"),
                  t("pricingModal.pr5", "Advanced Analytics & Tracking"),
                  t("pricingModal.pr6", "Premium NFC Tap Stands & Decals"),
                  t("pricingModal.pr7", "SEO Rich Snippets (Google Search)"),
                  t("pricingModal.pr8", "CRM Integrations (Shopify, Salesforce)")
                ].map((feature, i) => (
                  <li key={i} className="flex gap-3 text-[14px] text-zinc-300 font-medium items-start">
                    <Check className="w-5 h-5 text-white shrink-0 mt-0.5" /> 
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button 
                disabled={currentPlan === 'premium'}
                onClick={() => onSelectPlan('premium')}
                className={`relative z-10 w-full py-4 rounded-xl font-bold text-[14px] transition-all flex items-center justify-center ${currentPlan === 'premium' ? 'bg-white/[0.05] text-zinc-500 cursor-not-allowed' : 'bg-white text-black hover:bg-zinc-200 shadow-xl'}`}
              >
                {currentPlan === 'none' ? t("pricingModal.claimUpgradePremium", "Claim & Upgrade to Premium") : currentPlan === 'premium' ? t("pricingModal.currentPlan", "Current Plan") : t("pricingModal.upgradePremium", "Upgrade to Premium")}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
