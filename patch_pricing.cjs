const fs = require('fs');

const content = `import React from 'react';
import { Shield, Zap, Star, Check, X } from 'lucide-react';

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
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Blurred Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="w-full max-w-5xl rounded-[32px] shadow-2xl relative z-10 flex flex-col bg-[#141416] ring-1 ring-white/[0.05] animate-in slide-in-from-bottom-8 duration-300 max-h-[95vh]">
        
        {/* Scrollable Area */}
        <div className="overflow-y-auto custom-scrollbar flex-1 p-6 md:p-10">
          
          <button 
            onClick={onClose}
            className="absolute right-6 top-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 transition-colors cursor-pointer z-20"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-10 mt-2">
            <h2 className="text-[32px] md:text-[40px] font-black text-white tracking-tight mb-3">Upgrade Your Business</h2>
            <p className="text-[15px] text-zinc-400 max-w-lg mx-auto font-medium leading-relaxed">
              Turn video reviews into your most powerful marketing asset. Choose the plan that accelerates your growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            
            {/* Basic Plan */}
            <div className={\`rounded-[24px] p-8 flex flex-col h-full \${currentPlan === 'basic' ? 'bg-white/[0.08] ring-2 ring-white/[0.2]' : 'bg-white/[0.04] hover:bg-white/[0.06] transition-colors ring-1 ring-white/[0.05]'}\`}>
              <div className="mb-6">
                <Shield className="w-8 h-8 text-zinc-400 mb-4" />
                <h3 className="text-2xl font-black text-white">Basic</h3>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-[40px] font-black text-white leading-none">$0</span>
                  <span className="text-[13px] text-zinc-500 font-bold uppercase tracking-wider">/ month</span>
                </div>
                <p className="text-[13px] text-zinc-500 font-bold mt-2">Free forever.</p>
                <p className="text-[14px] text-zinc-400 mt-5 font-medium leading-relaxed h-10">Get listed and stay informed.</p>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  'Claim business',
                  'Verified Badge',
                  'Update address/hours',
                  'Email alerts for new videos'
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
                className={\`w-full py-4 rounded-xl font-bold text-[14px] transition-all flex items-center justify-center \${currentPlan === 'basic' ? 'bg-white/[0.05] text-zinc-500 cursor-not-allowed' : 'bg-white/[0.08] text-white hover:bg-white/[0.12]'}\`}
              >
                {currentPlan === 'none' ? 'Claim Business (Free)' : currentPlan === 'basic' ? 'Current Plan' : 'Downgrade to Basic'}
              </button>
            </div>

            {/* Pro Plan */}
            <div className={\`rounded-[24px] p-8 flex flex-col h-full relative \${currentPlan === 'pro' ? 'bg-[#1a73e8]/10 ring-2 ring-[#1a73e8]' : 'bg-white/[0.04] hover:bg-white/[0.06] transition-colors ring-1 ring-[#1a73e8]/50'}\`}>
              {currentPlan !== 'pro' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1a73e8] text-white text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg shadow-[#1a73e8]/20">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <Zap className="w-8 h-8 text-[#4285F4] mb-4" />
                <h3 className="text-2xl font-black text-white">Pro</h3>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-[40px] font-black text-white leading-none">$149</span>
                  <span className="text-[13px] text-zinc-500 font-bold uppercase tracking-wider">/ month</span>
                </div>
                <p className="text-[13px] text-zinc-500 font-bold mt-2">Cancel anytime.</p>
                <p className="text-[14px] text-zinc-400 mt-5 font-medium leading-relaxed h-10">Engage customers and drive sales.</p>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  'Everything in Basic',
                  'Add Website Link',
                  'Add "Book Now" / CTA Button',
                  'Publicly Reply to videos',
                  'Up to 5 Direct Messages / day',
                  'Dedicated Business Dashboard',
                  'Custom Review Invite Links & QR Codes',
                  'Custom QR Print Kit',
                  'Download Videos for Social Media'
                ].map((feature, i) => (
                  <li key={i} className="flex gap-3 text-[14px] text-zinc-300 font-medium items-start">
                    <Check className="w-5 h-5 text-[#4285F4] shrink-0 mt-0.5" /> 
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button 
                disabled={currentPlan === 'pro'}
                onClick={() => onSelectPlan('pro')}
                className={\`w-full py-4 rounded-xl font-bold text-[14px] transition-all flex items-center justify-center \${currentPlan === 'pro' ? 'bg-[#1a73e8]/20 text-[#4285F4] cursor-not-allowed' : 'bg-[#1a73e8] text-white hover:bg-[#1557b0] shadow-lg shadow-[#1a73e8]/20'}\`}
              >
                {currentPlan === 'none' ? 'Claim & Upgrade to Pro' : currentPlan === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
              </button>
            </div>

            {/* Premium Plan */}
            <div className={\`rounded-[24px] p-8 flex flex-col h-full bg-[#1e1e1e] ring-1 ring-white/[0.05] relative overflow-hidden shadow-2xl\`}>
              {/* Subtle orange glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#f59e0b]/10 blur-[80px] rounded-full pointer-events-none" />
              
              <div className="mb-6 relative z-10">
                <Star className="w-8 h-8 text-[#f59e0b] mb-4" />
                <h3 className="text-2xl font-black text-white">Premium</h3>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-[40px] font-black text-white leading-none">$299</span>
                  <span className="text-[13px] text-zinc-500 font-bold uppercase tracking-wider">/ month</span>
                </div>
                <p className="text-[13px] text-zinc-500 font-bold mt-2">Cancel anytime.</p>
                <p className="text-[14px] text-zinc-400 mt-5 font-medium leading-relaxed h-10">The ultimate marketing engine.</p>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1 relative z-10">
                {[
                  'Everything in Pro',
                  'Up to 10 Direct Messages / day',
                  'Website Video Widget (Embed videos)',
                  'Full Commercial Rights (Paid Ads)',
                  'Advanced Analytics & Tracking',
                  'Premium NFC Tap Stands & Decals',
                  'SEO Rich Snippets (Google Search)',
                  'CRM Integrations (Shopify, Salesforce)'
                ].map((feature, i) => (
                  <li key={i} className="flex gap-3 text-[14px] text-zinc-300 font-medium items-start">
                    <Check className="w-5 h-5 text-[#f59e0b] shrink-0 mt-0.5" /> 
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button 
                disabled={currentPlan === 'premium'}
                onClick={() => onSelectPlan('premium')}
                className={\`relative z-10 w-full py-4 rounded-xl font-bold text-[14px] transition-all flex items-center justify-center \${currentPlan === 'premium' ? 'bg-[#f59e0b]/20 text-[#f59e0b] cursor-not-allowed' : 'bg-white text-black hover:bg-zinc-200 shadow-xl'}\`}
              >
                {currentPlan === 'none' ? 'Claim & Upgrade to Premium' : currentPlan === 'premium' ? 'Current Plan' : 'Upgrade to Premium'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/CopoBusinessPricingModal.tsx', content);
console.log('patched pricing modal');
