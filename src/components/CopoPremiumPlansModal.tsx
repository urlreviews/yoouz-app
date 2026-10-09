import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Shield, 
  Zap, 
  Sparkles, 
  Download, 
  Code, 
  Search, 
  QrCode, 
  MessageSquare, 
  Star, 
  CheckCircle2, 
  ArrowRight,
  HelpCircle,
  BarChart3,
  Layers,
  Building2,
  Mail,
  Clock,
  CheckCircle,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { Place } from '../types';

interface CopoPremiumPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  ownerEmail: string;
  placeId?: string;
  isPremium?: boolean;
  currentPlace?: Place | null;
  onUpdatePlace?: (place: Place) => void;
}

export const CopoPremiumPlansModal: React.FC<CopoPremiumPlansModalProps> = ({
  isOpen,
  onClose,
  businessName,
  ownerEmail,
  placeId,
  isPremium = false,
  currentPlace,
  onUpdatePlace,
}) => {
  const [activeTab, setActiveTab] = useState<'plans' | 'matrix' | 'faq'>('plans');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [cancelStatus, setCancelStatus] = useState<'idle' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setIsSubmitting(true);
    setRequestStatus('idle');
    try {
      const response = await fetch('/api/upgrade-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName || currentPlace?.name || 'Claimed Business',
          ownerEmail: ownerEmail || currentPlace?.claimedByEmail || 'Owner',
          placeId: placeId || currentPlace?.id || '',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setRequestStatus('success');
      } else {
        setRequestStatus('error');
      }
    } catch (error) {
      console.error('Error sending upgrade request:', error);
      setRequestStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsSubmitting(true);
    setCancelStatus('idle');
    try {
      const response = await fetch('/api/upgrade-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel_subscription',
          businessName: businessName || currentPlace?.name || 'Claimed Business',
          ownerEmail: ownerEmail || currentPlace?.claimedByEmail || 'Owner',
          placeId: placeId || currentPlace?.id || '',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setCancelStatus('success');
      } else {
        setCancelStatus('error');
      }
    } catch (error) {
      console.error('Error sending cancellation request:', error);
      setCancelStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950 text-white flex flex-col overflow-y-auto animate-in fade-in duration-200 select-none">
      {/* Sticky Top Header Bar */}
      <div className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0 shadow-inner">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-xl font-black text-white tracking-tight">Business Membership Plans</h2>
              {isPremium && (
                <span className="px-2.5 py-0.5 rounded-full bg-white text-zinc-950 text-[10px] font-black uppercase tracking-wider hidden sm:inline-block">
                  PREMIUM
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-300 font-medium hidden sm:block">
              Scale your location's video reputation and acquire high-intent local customers
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer active:scale-95"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex-1 space-y-6">
        
        {/* Business Identifier & Plan Status Banner */}
        <div className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all ${
          isPremium 
            ? 'bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border-zinc-700 shadow-xl' 
            : 'bg-zinc-900/90 border-zinc-800'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              {currentPlace?.logoUrl ? (
                <img 
                  src={currentPlace.logoUrl} 
                  alt={businessName} 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl object-cover border border-zinc-700 shrink-0" 
                />
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-black shrink-0 text-base sm:text-lg">
                  {(businessName || 'B').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400">Claimed Business Workspace</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-white truncate">{businessName || 'Your Business Workspace'}</h3>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl sm:rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-bold text-zinc-200 shrink-0 self-start sm:self-auto">
              <span className="text-zinc-400 font-medium">Status:</span>
              {isPremium ? (
                <span className="font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 fill-white text-white" />
                  Premium Suite Active
                </span>
              ) : (
                <span className="font-black text-zinc-200 uppercase tracking-wider">
                  Free Plan Active
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Segmented Controller / Native App Capsule Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-zinc-900/90 border border-zinc-800/80 shadow-inner">
          <button
            onClick={() => setActiveTab('plans')}
            className={`flex-1 py-2.5 px-3 rounded-full text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'plans'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Plans</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex-1 py-2.5 px-3 rounded-full text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Compare</span>
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`flex-1 py-2.5 px-3 rounded-full text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'faq'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>FAQ</span>
          </button>
        </div>

        {/* TAB 1: PLAN CARDS OVERVIEW */}
        {activeTab === 'plans' && (
          <div className="grid md:grid-cols-2 gap-6 items-stretch animate-in fade-in duration-150">
            {/* FREE PLAN CARD */}
            <div className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 relative transition-all ${
              !isPremium 
                ? 'bg-zinc-900/90 border-2 border-zinc-700 shadow-xl' 
                : 'bg-zinc-900/60 border border-zinc-800 opacity-90'
            }`}>
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase ${
                    !isPremium 
                      ? 'bg-zinc-800 text-white border border-zinc-700' 
                      : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/80'
                  }`}>
                    {!isPremium ? 'Active Plan' : 'Standard Tier'}
                  </span>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-950 px-2.5 py-1 rounded-full border border-zinc-800">
                    Baseline
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">Free Standard Tier</h3>
                  <p className="text-xs sm:text-sm text-zinc-300 mt-2 leading-relaxed font-medium">
                    Essential tools for verified local businesses to manage reviews and engage customers.
                  </p>
                </div>

                <div className="pt-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">$0</span>
                    <span className="text-xs sm:text-sm font-bold text-zinc-400">/ forever</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1 font-medium">No credit card required</div>
                </div>

                <div className="h-px bg-zinc-800/80 my-2" />

                <div className="space-y-3.5">
                  <p className="text-[11px] font-black uppercase tracking-wider text-zinc-400">Included in Free Tier:</p>

                  <div className="flex items-start gap-3">
                    <BarChart3 className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-zinc-200 font-medium">
                      <strong className="text-white font-bold">Real-time Video Analytics</strong> & watch impression tracking
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-zinc-200 font-medium">
                      <strong className="text-white font-bold">Interactive Performance Charts</strong> (7D, 30D, 90D & All Time)
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-zinc-200 font-medium">
                      <strong className="text-white font-bold">Reply to Customer Reviews</strong> & direct chat feedback
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-zinc-200 font-medium">
                      <strong className="text-white font-bold">Update Business Profile</strong>, hours & location
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <QrCode className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-zinc-200 font-medium">
                      <strong className="text-white font-bold">Custom Table QR Code Generator</strong> for table tents
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  disabled
                  className={`w-full py-3.5 rounded-2xl text-xs sm:text-sm font-black border text-center transition-all ${
                    !isPremium 
                      ? 'bg-zinc-800 text-white border-zinc-700 cursor-default shadow-xs' 
                      : 'bg-zinc-900/80 text-zinc-500 border-zinc-800/80 cursor-not-allowed'
                  }`}
                >
                  {!isPremium ? 'Current Active Plan' : 'Included'}
                </button>
              </div>
            </div>

            {/* PREMIUM PLAN CARD */}
            <div className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 relative transition-all shadow-2xl ${
              isPremium
                ? 'bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-2 border-white ring-1 ring-white/20'
                : 'bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-2 border-zinc-600 hover:border-zinc-400 shadow-[0_0_50px_rgba(255,255,255,0.06)]'
            }`}>
              <div className="space-y-5">
                {/* Clean, perfectly aligned top header bar */}
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 text-zinc-200 text-xs font-extrabold border border-zinc-700 tracking-wide uppercase">
                    <Shield className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>Growth Suite</span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-zinc-950 text-xs font-black uppercase tracking-wider shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 fill-zinc-950 text-zinc-950" />
                    <span>Full Suite Access</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">Premium Business Suite</h3>
                  <p className="text-xs sm:text-sm text-zinc-300 mt-2 leading-relaxed font-medium">
                    Website video embedding, HD ad downloads, Google SEO indexing, and smart review tools.
                  </p>
                </div>

                {/* PRICING DISPLAY SECTION */}
                <div className="pt-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">$149</span>
                    <span className="text-xs sm:text-sm font-extrabold text-zinc-300">/ month</span>
                  </div>
                  
                  <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Billed monthly • Cancel anytime</span>
                  </div>
                </div>

                <div className="h-px bg-zinc-800/80 my-2" />

                {/* Premium Features List */}
                <div className="space-y-3.5">
                  <p className="text-[11px] font-black uppercase tracking-wider text-white">Everything in Free, plus:</p>

                  <div className="flex items-start gap-3">
                    <Code className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-zinc-100 font-medium">
                      <strong className="text-white font-bold">Embed Video Reviews</strong> on your official website
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <Download className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-zinc-100 font-medium">
                      <strong className="text-white font-bold">Download High-Res Videos</strong> for social ads & marketing
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <Search className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-zinc-100 font-medium">
                      <strong className="text-white font-bold">Google SEO Indexing</strong> with video rich snippets
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <Sparkles className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-zinc-100 font-medium">
                      <strong className="text-white font-bold">Smart Video Review Finder</strong> for web aggregation
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-zinc-100 font-medium">
                      <strong className="text-white font-bold">AI Response Recommendations</strong> for instant replies
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-zinc-100 font-medium">
                      <strong className="text-white font-bold">Reply to Comments & Direct Messages</strong>
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <Zap className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-zinc-100 font-medium">
                      <strong className="text-white font-bold">Custom Profile Action Buttons</strong>
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <Star className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-zinc-100 font-medium">
                      <strong className="text-white font-bold">Priority Search Placement</strong> in category listings
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <Shield className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-zinc-100 font-medium">
                      <strong className="text-white font-bold">Priority Business Support</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                {isPremium ? (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-700 text-center space-y-1">
                      <div className="inline-flex items-center gap-2 text-white font-black text-sm">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                        <span>Premium Suite Active</span>
                      </div>
                      <p className="text-xs text-zinc-300 font-medium">
                        Your account is fully upgraded ($149/mo).
                      </p>
                    </div>

                    {cancelStatus === 'success' ? (
                      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 text-center font-medium">
                        Cancellation request sent to support. Your account will revert to the Free Plan upon review.
                      </div>
                    ) : (
                      <button
                        onClick={handleCancelSubscription}
                        disabled={isSubmitting}
                        className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-300 hover:text-white text-xs font-bold transition-all cursor-pointer border border-zinc-700"
                      >
                        {isSubmitting ? 'Sending Request...' : 'Cancel Subscription & Downgrade to Free'}
                      </button>
                    )}
                  </div>
                ) : requestStatus === 'success' ? (
                  <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-600 text-center space-y-1.5 animate-in fade-in">
                    <div className="inline-flex items-center gap-2 text-white font-black text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>Upgrade Request Sent!</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                      Our support team has been notified. Admin will activate your Premium Suite shortly.
                    </p>
                  </div>
                ) : requestStatus === 'error' ? (
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 text-center space-y-2 font-medium">
                    <p>Failed to send request. Please try again.</p>
                    <button
                      onClick={handleUpgrade}
                      className="px-4 py-2 bg-white text-zinc-950 font-black rounded-lg text-xs hover:bg-zinc-200 cursor-pointer"
                    >
                      Retry Request
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleUpgrade}
                    disabled={isSubmitting}
                    className="w-full py-4 bg-white hover:bg-zinc-100 active:bg-zinc-200 text-zinc-950 font-black rounded-2xl transition-all shadow-xl hover:shadow-2xl active:scale-98 flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base tracking-wide"
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                        Sending Request...
                      </span>
                    ) : (
                      <>
                        <span>Upgrade to Premium Suite</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DETAILED COMPARISON MATRIX */}
        {activeTab === 'matrix' && (
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-zinc-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white">Full Feature Comparison Matrix</h3>
                <p className="text-xs text-zinc-300 font-medium mt-0.5">Exact feature breakdown between Standard Free ($0) and Premium Business Suite ($149/mo)</p>
              </div>

              {!isPremium && (
                <button
                  onClick={handleUpgrade}
                  disabled={isSubmitting || requestStatus === 'success'}
                  className="px-4 py-2.5 rounded-xl bg-white text-zinc-950 font-black text-xs hover:bg-zinc-200 transition-all self-start sm:self-auto cursor-pointer shadow-md"
                >
                  {requestStatus === 'success' ? 'Request Sent' : 'Request Premium Upgrade'}
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="pb-3.5 font-bold w-1/2 text-zinc-300">Capability</th>
                    <th className="pb-3.5 font-bold text-center w-1/4 text-zinc-300">Free Standard ($0)</th>
                    <th className="pb-3.5 font-black text-center w-1/4 text-white">Premium Suite ($149/mo)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-200 font-medium">
                  <tr>
                    <td className="py-4 font-bold text-white">Real-time Video Impression Analytics & Watch Counts</td>
                    <td className="py-4 text-center"><Check className="w-4 h-4 mx-auto text-zinc-300" /></td>
                    <td className="py-4 text-center"><Check className="w-4 h-4 mx-auto text-white stroke-[3]" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 font-bold text-white">Interactive Performance Charts (7D / 30D / 90D / All Time)</td>
                    <td className="py-4 text-center"><Check className="w-4 h-4 mx-auto text-zinc-300" /></td>
                    <td className="py-4 text-center"><Check className="w-4 h-4 mx-auto text-white stroke-[3]" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 font-bold text-white">Reply to Customer Video Reviews, Comments & Direct Messages (User Chat)</td>
                    <td className="py-4 text-center"><Check className="w-4 h-4 mx-auto text-zinc-300" /></td>
                    <td className="py-4 text-center"><Check className="w-4 h-4 mx-auto text-white stroke-[3]" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 font-bold text-white">Custom Profile Action Buttons</td>
                    <td className="py-4 text-center text-zinc-600">—</td>
                    <td className="py-4 text-center"><Check className="w-4 h-4 mx-auto text-white stroke-[3]" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 font-bold text-white">Update Business Profile, Hours & Bio</td>
                    <td className="py-4 text-center"><Check className="w-4 h-4 mx-auto text-zinc-300" /></td>
                    <td className="py-4 text-center"><Check className="w-4 h-4 mx-auto text-white stroke-[3]" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 font-bold text-white">Update & Download Business Profile QR Code</td>
                    <td className="py-4 text-center"><Check className="w-4 h-4 mx-auto text-zinc-300" /></td>
                    <td className="py-4 text-center"><Check className="w-4 h-4 mx-auto text-white stroke-[3]" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 font-bold text-white">Track Customer Followers & In-App Notifications</td>
                    <td className="py-4 text-center"><Check className="w-4 h-4 mx-auto text-zinc-300" /></td>
                    <td className="py-4 text-center"><Check className="w-4 h-4 mx-auto text-white stroke-[3]" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 font-bold text-white">Embed Customer Video Reviews on Website</td>
                    <td className="py-4 text-center text-zinc-600">—</td>
                    <td className="py-4 text-center"><Check className="w-4 h-4 mx-auto text-white stroke-[3]" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 font-bold text-white">Download High-Res Video Reviews for Social Ads</td>
                    <td className="py-4 text-center text-zinc-600">—</td>
                    <td className="py-4 text-center"><Check className="w-4 h-4 mx-auto text-white stroke-[3]" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 font-bold text-white">Google SEO Indexing & Video Rich Snippets</td>
                    <td className="py-4 text-center text-zinc-600">—</td>
                    <td className="py-4 text-center"><Check className="w-4 h-4 mx-auto text-white stroke-[3]" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 font-bold text-white">Smart Web Video Review Finder</td>
                    <td className="py-4 text-center text-zinc-600">—</td>
                    <td className="py-4 text-center"><Check className="w-4 h-4 mx-auto text-white stroke-[3]" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 font-bold text-white">AI Response Recommendations</td>
                    <td className="py-4 text-center text-zinc-600">—</td>
                    <td className="py-4 text-center"><Check className="w-4 h-4 mx-auto text-white stroke-[3]" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 font-bold text-white">Priority Local Category Search Ranking</td>
                    <td className="py-4 text-center text-zinc-600">—</td>
                    <td className="py-4 text-center"><Check className="w-4 h-4 mx-auto text-white stroke-[3]" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 font-bold text-white">Priority Business Support</td>
                    <td className="py-4 text-center text-zinc-600">Standard Support</td>
                    <td className="py-4 text-center"><Check className="w-4 h-4 mx-auto text-white stroke-[3]" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: FAQ & SUPPORT */}
        {activeTab === 'faq' && (
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-zinc-800 pb-4">
              <h3 className="text-lg sm:text-xl font-black text-white">Frequently Asked Questions</h3>
              <p className="text-xs text-zinc-300 font-medium mt-0.5">Everything you need to know about Yoouz Business Memberships and $149/mo pricing</p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <h4 className="font-extrabold text-white flex items-center gap-2 text-sm sm:text-base">
                  <CreditCard className="w-4 h-4 text-zinc-300" />
                  What is the price of the Premium Business Suite?
                </h4>
                <p className="text-zinc-300 leading-relaxed pl-6 font-medium">
                  The Premium Business Suite is <strong className="text-white font-bold">$149 per month</strong>. It is billed monthly with no long-term contracts — you can cancel anytime.
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <h4 className="font-extrabold text-white flex items-center gap-2 text-sm sm:text-base">
                  <HelpCircle className="w-4 h-4 text-zinc-300" />
                  How is the Premium upgrade activated?
                </h4>
                <p className="text-zinc-300 leading-relaxed pl-6 font-medium">
                  When you click <strong className="text-white font-bold">Upgrade to Premium Suite</strong>, our team receives an instant notification with your place details. Once verified, the admin team activates your account and unlocks all features immediately.
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <h4 className="font-extrabold text-white flex items-center gap-2 text-sm sm:text-base">
                  <Code className="w-4 h-4 text-zinc-300" />
                  Can I embed video reviews on any website?
                </h4>
                <p className="text-zinc-300 leading-relaxed pl-6 font-medium">
                  Yes! Premium Suite provides an iframe embed code and direct script snippet compatible with WordPress, Wix, Shopify, Squarespace, Webflow, or custom React/HTML sites.
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <h4 className="font-extrabold text-white flex items-center gap-2 text-sm sm:text-base">
                  <Clock className="w-4 h-4 text-zinc-300" />
                  What happens if I downgrade or switch back to Free?
                </h4>
                <p className="text-zinc-300 leading-relaxed pl-6 font-medium">
                  If your subscription is updated back to Free by admin, your profile remains verified and active. You retain full capability to reply to customer reviews, update hours, and download QR codes ($0 standard tier).
                </p>
              </div>
            </div>

            <div className="text-center border-t border-zinc-800 pt-6 space-y-2">
              <p className="text-xs text-zinc-300 font-medium">
                Need customized enterprise agreements or multi-location agency onboarding?
              </p>
              <button
                type="button"
                onClick={handleUpgrade}
                className="text-xs font-black text-white hover:underline inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Contact Business Support</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

