import React, { useState } from 'react';
import { X, Lock, CreditCard, Loader2, CheckCircle2, ShieldCheck, Smartphone, Check } from 'lucide-react';

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
  const [processingMethod, setProcessingMethod] = useState<'card' | 'apple_pay' | 'google_pay' | null>(null);
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
    setProcessingMethod('card');
    
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess({
          email: email || 'billing@yoouz.com',
          last4: cardNumber.slice(-4) || '4242',
          paymentMethod: 'card'
        });
      }, 1800);
    }, 1200);
  };

  const handleExpressPay = (method: 'apple_pay' | 'google_pay') => {
    setPaymentMethod(method);
    setProcessingMethod(method);
    setIsProcessing(true);
    
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess({
          paymentMethod: method,
          email: email || (method === 'apple_pay' ? 'apple.pay.user@icloud.com' : 'gpay.user@gmail.com')
        });
      }, 1800);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200 copo-creem-checkout-modal select-none">
      {/* Blurred Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Container / Mobile Bottom Sheet */}
      <div className="w-full max-w-[440px] rounded-t-[32px] sm:rounded-[28px] overflow-hidden shadow-2xl relative z-10 flex flex-col bg-zinc-950 border border-zinc-800 animate-in slide-in-from-bottom-6 duration-300 max-h-[92vh] sm:max-h-[90vh]">
        
        {/* Mobile Pull Handle Bar */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center w-full shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-zinc-700/80" />
        </div>

        {isSuccess ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center bg-zinc-950">
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-6 ring-2 ring-emerald-500/20 animate-in zoom-in duration-300">
              <CheckCircle2 className="w-10 h-10 stroke-[2.2]" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Payment Confirmed</h3>
            <p className="text-[14px] text-zinc-300 font-medium max-w-[280px] leading-relaxed mb-4">
              Your {planName} is now active. All premium business tools and verified badges are unlocked.
            </p>
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold bg-zinc-900/80 px-4 py-2 rounded-full border border-zinc-800">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" /> Redirecting to Dashboard...
            </div>
          </div>
        ) : (
          <>
            {/* Top Header Section */}
            <div className="bg-zinc-900/90 px-6 sm:px-8 pt-5 sm:pt-7 pb-5 text-center relative border-b border-zinc-800 shrink-0">
              <button 
                onClick={onClose}
                className="absolute right-4 sm:right-5 top-4 sm:top-5 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[11px] font-bold mb-3.5">
                <Lock className="w-3 h-3" /> creem.io secure checkout
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none mb-1.5 flex items-center justify-center gap-2">
                {price} <span className="text-base sm:text-lg font-bold text-zinc-400 mt-1">/ month</span>
              </h2>
              
              <p className="text-xs sm:text-[13px] text-zinc-400 font-medium">
                Yoouz {planName} • <span className="text-emerald-400 font-semibold">Cancel anytime</span>
              </p>
            </div>

            {/* Bottom Form Section */}
            <div className="p-5 sm:p-7 space-y-5 overflow-y-auto custom-scrollbar flex-1 pb-8 sm:pb-7">
              
              {/* Express Checkout: Apple Pay & Google Pay */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-1">
                  <span>Express 1-Tap Checkout</span>
                  <span className="text-[10px] text-zinc-500 lowercase">Face ID / Touch ID</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleExpressPay('apple_pay')}
                    className="h-12 sm:h-13 bg-black hover:bg-zinc-900 border border-zinc-700/80 active:scale-[0.98] text-white rounded-2xl font-bold flex items-center justify-center transition-all cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    {isProcessing && processingMethod === 'apple_pay' ? (
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                    ) : (
                      <span className="text-xl leading-none tracking-tight flex items-center gap-0.5">
                        <span className="text-2xl"></span>Pay
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleExpressPay('google_pay')}
                    className="h-12 sm:h-13 bg-black hover:bg-zinc-900 border border-zinc-700/80 active:scale-[0.98] text-white rounded-2xl font-bold flex items-center justify-center transition-all cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    {isProcessing && processingMethod === 'google_pay' ? (
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                    ) : (
                      <span className="flex items-center gap-1.5 text-base font-bold">
                        <span className="text-white">G</span> Pay
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="h-px bg-zinc-800 flex-1"></div>
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Or pay with card</div>
                <div className="h-px bg-zinc-800 flex-1"></div>
              </div>

              <form onSubmit={handlePay} className="space-y-4">
                
                {/* Business Email */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5 px-0.5">
                    Business Billing Email
                  </label>
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="billing@yourcompany.com"
                    className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                  />
                </div>

                {/* Card Information */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 px-0.5">
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                      Card Information
                    </label>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400">
                      <span>VISA</span>
                      <span>MC</span>
                      <span>AMEX</span>
                      <span>DISC</span>
                    </div>
                  </div>
                  
                  <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl overflow-hidden focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-500 transition-all">
                    <div className="relative border-b border-zinc-800">
                      <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input 
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        maxLength={19}
                        placeholder="4242 •••• •••• 4242"
                        className="w-full bg-transparent pl-10 pr-4 py-3 text-sm text-white font-mono placeholder-zinc-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-zinc-800">
                      <input 
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        maxLength={5}
                        placeholder="MM / YY"
                        className="bg-transparent px-3 py-3 text-sm text-white font-mono placeholder-zinc-500 focus:outline-none text-center"
                      />
                      <input 
                        type="text"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        maxLength={4}
                        placeholder="CVC"
                        className="bg-transparent px-3 py-3 text-sm text-white font-mono placeholder-zinc-500 focus:outline-none text-center"
                      />
                      <input 
                        type="text"
                        value={cardZip}
                        onChange={(e) => setCardZip(e.target.value.slice(0, 10))}
                        placeholder="ZIP / Postal"
                        className="bg-transparent px-3 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Trust & Guarantee Box */}
                <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-white">30-Day Money Back & Instant Activation</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                    You will be billed {price}/mo starting today. Manage or cancel anytime from your Business Dashboard.
                  </p>
                </div>

                {/* Primary Card Submit CTA */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full h-12 sm:h-13 bg-white hover:bg-zinc-100 text-zinc-950 rounded-2xl text-[15px] font-bold shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isProcessing && processingMethod === 'card' ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Authorizing Payment...</>
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
