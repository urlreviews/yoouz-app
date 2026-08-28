import React, { useState } from 'react';
import { X, Lock, CreditCard, Loader2, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

interface CopoCreemCheckoutModalProps {
  plan: 'pro' | 'premium';
  onClose: () => void;
  onSuccess: (details?: { email?: string; last4?: string; paymentMethod?: string }) => void;
}

export const CopoCreemCheckoutModal: React.FC<CopoCreemCheckoutModalProps> = ({ plan, onClose, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple_pay' | 'google_pay'>('card');
  const [email, setEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardZip, setCardZip] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const price = plan === 'pro' ? '$49.00' : '$299.00';
  const planName = plan === 'pro' ? 'Pro Business' : 'Premium Plan';

  const formatCardNumber = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 16);
    return clean.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    if (clean.length > 2) {
      return `${clean.slice(0, 2)}/${clean.slice(2)}`;
    }
    return clean;
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess({
          email: email || 'demo@yoouz.com',
          last4: cardNumber.slice(-4) || '4242',
          paymentMethod: 'card'
        });
      }, 2000);
    }, 1500);
  };

  const handleExpressPay = (method: 'apple_pay' | 'google_pay') => {
    setPaymentMethod(method);
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess({
          paymentMethod: method,
          email: 'express@checkout.com'
        });
      }, 2000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 copo-creem-checkout-modal">
      {/* Blurred Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="w-full max-w-[420px] rounded-[32px] overflow-hidden shadow-2xl relative z-10 flex flex-col bg-[#141416] ring-1 ring-white/[0.05] animate-in slide-in-from-bottom-8 duration-300 max-h-[95vh]">
        
        {isSuccess ? (
          <div className="p-12 flex flex-col items-center justify-center text-center bg-[#141416]">
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-6 ring-1 ring-emerald-500/20 animate-in zoom-in duration-300">
              <CheckCircle2 className="w-10 h-10 stroke-[2]" />
            </div>
            <h3 className="text-2xl font-black text-white mb-3">Payment Confirmed</h3>
            <p className="text-[13px] text-zinc-400 font-medium max-w-[260px] leading-relaxed">
              Your {planName} subscription is now active. A receipt has been sent to your email.
            </p>
            <div className="mt-8 flex items-center gap-2 text-zinc-500 text-xs font-bold bg-white/[0.02] px-4 py-2.5 rounded-full border border-white/[0.04]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Redirecting to dashboard...
            </div>
          </div>
        ) : (
          <>
            {/* Top Dark Header Section */}
            <div className="bg-[#18181b] px-8 pt-8 pb-7 text-center relative border-b border-white/[0.04]">
              <button 
                onClick={onClose}
                className="absolute right-5 top-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[11px] font-bold mb-5">
                <Lock className="w-3.5 h-3.5" /> creem.io secure checkout
              </div>
              
              <h2 className="text-[40px] font-black text-white tracking-tight leading-none mb-2 flex items-center justify-center gap-2">
                {price} <span className="text-lg font-bold text-zinc-500 mt-2">/ month</span>
              </h2>
              
              <p className="text-[13px] text-zinc-400 font-medium">
                Yoouz {planName} • <span className="text-emerald-400 font-bold">Cancel anytime</span>
              </p>
            </div>

            {/* Bottom Dark Form Section */}
            <div className="bg-[#141416] p-7 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              
              {/* Express Checkout */}
              <div className="space-y-3">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Express Checkout</div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleExpressPay('apple_pay')}
                    className="py-3.5 bg-[#000000] border border-white/[0.08] hover:bg-white/[0.04] text-white rounded-xl font-bold flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <span className="text-lg leading-none">Pay</span>
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleExpressPay('google_pay')}
                    className="py-3.5 bg-[#000000] border border-white/[0.08] hover:bg-white/[0.04] text-white rounded-xl font-bold flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 text-base">
                      <span className="text-[#4285F4]">G</span> Pay
                    </span>
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="h-px bg-white/[0.06] flex-1"></div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Or pay with card</div>
                <div className="h-px bg-white/[0.06] flex-1"></div>
              </div>

              <form onSubmit={handlePay} className="space-y-5">
                
                {/* Email */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
                    Business Billing Email
                  </label>
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@yourcompany.com (optional in demo)"
                    className="w-full bg-[#000000] border border-white/[0.08] rounded-xl px-4 py-3.5 text-[13px] text-white placeholder-zinc-600 focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] transition-all"
                  />
                </div>

                {/* Card */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Card Information
                    </label>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500">
                      <span>VISA</span>
                      <span>MC</span>
                      <span>AMEX</span>
                      <span>DISC</span>
                    </div>
                  </div>
                  
                  <div className="bg-[#000000] border border-white/[0.08] rounded-xl overflow-hidden focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8] transition-all">
                    <div className="relative border-b border-white/[0.08]">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
                      <input 
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        maxLength={19}
                        placeholder="4242 •••• •••• 4242"
                        className="w-full bg-transparent pl-12 pr-4 py-3.5 text-[13px] text-white font-mono placeholder-zinc-600 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-white/[0.08]">
                      <input 
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        maxLength={5}
                        placeholder="MM / YY"
                        className="bg-transparent px-4 py-3.5 text-[13px] text-white font-mono placeholder-zinc-600 focus:outline-none text-center"
                      />
                      <input 
                        type="text"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        maxLength={4}
                        placeholder="CVC"
                        className="bg-transparent px-4 py-3.5 text-[13px] text-white font-mono placeholder-zinc-600 focus:outline-none text-center"
                      />
                      <input 
                        type="text"
                        value={cardZip}
                        onChange={(e) => setCardZip(e.target.value.slice(0, 10))}
                        placeholder="ZIP / Postal"
                        className="bg-transparent px-4 py-3.5 text-[13px] text-white placeholder-zinc-600 focus:outline-none text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Terms Box */}
                <div className="bg-[#000000] border border-white/[0.04] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-[12px] font-bold text-white">30-Day Money Back & Auto-Renewal</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                    You will be billed {price} monthly starting today. You can pause, change plans, or cancel anytime directly from your Business Dashboard.
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-4 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-xl text-[14px] font-bold shadow-lg shadow-[#1a73e8]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isProcessing ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Processing Payment...</>
                  ) : (
                    <><Lock className="w-4 h-4" /> Subscribe for {price}</>
                  )}
                </button>
              </form>

            </div>
          </>
        )}
      </div>
    </div>
  );
};
