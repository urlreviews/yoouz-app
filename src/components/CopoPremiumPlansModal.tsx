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
  CheckCircle,
  Building2,
  Mail,
  Clock
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

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950 text-white flex flex-col overflow-y-auto animate-in fade-in duration-200 select-none">
      {/* Sticky Top Header Bar */}
      <div className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 shadow-inner">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">Business Membership Plans</h2>
              {isPremium && (
                <span className="px-2 py-0.5 rounded-full bg-white text-zinc-950 text-[10px] font-black uppercase tracking-wider hidden sm:inline-block">
                  PREMIUM
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 font-medium hidden sm:block">
              Scale your location's video reputation and acquire new customers
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
        <div className={`p-4 sm:p-5 rounded-3xl border transition-all ${
          isPremium 
            ? 'bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border-zinc-700 shadow-xl' 
            : 'bg-zinc-900/90 border-zinc-800'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {currentPlace?.logoUrl ? (
                <img 
                  src={currentPlace.logoUrl} 
                  alt={businessName} 
                  className="w-11 h-11 rounded-2xl object-cover border border-zinc-800 shrink-0" 
                />
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-black shrink-0 text-base">
                  {(businessName || 'B').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">Claimed Business Account</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">{businessName || 'Your Business Account'}</h3>
              </div>
            </div>

            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-semibold text-zinc-300 shrink-0">
              <span className="text-zinc-400">Current Status:</span>
              {isPremium ? (
                <span className="font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 fill-white text-white" />
                  Premium Suite Active
                </span>
              ) : (
                <span className="font-bold text-zinc-300 uppercase tracking-wider">
                  Free Tier Active
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Segmented Controller / View Switcher Tabs */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80">
          <button
            onClick={() => setActiveTab('plans')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'plans'
                ? 'bg-white text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Plan Tiers</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-white text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Full Comparison Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'faq'
                ? 'bg-white text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>FAQ & Support</span>
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    !isPremium 
                      ? 'bg-white text-zinc-950' 
                      : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                  }`}>
                    {!isPremium ? 'YOUR CURRENT PLAN' : 'STANDARD TIER'}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">BASELINE</span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">Free Standard Tier</h3>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
                    Essential tools for verified place owners to respond and manage their listing.
                  </p>
                </div>

                <div className="pt-2">
                  <div className="text-3xl sm:text-4xl font-black text-white">$0</div>
                  <div className="text-xs text-zinc-400 mt-1 font-medium">Free forever — no credit card required</div>
                </div>

                <hr className="border-zinc-800" />

                <div className="space-y-3 pt-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Included Features:</p>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-zinc-300">
                      <strong className="text-white">Reply to comments</strong> & customer feedback
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-zinc-300">
                      <strong className="text-white">Update business profile</strong>, description & operating hours
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <QrCode className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-zinc-300">
                      <strong className="text-white">Custom QR Code generator</strong> for venue tables & counter stands
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-zinc-300">
                      <strong className="text-white">Direct video review responses</strong> to verified customers
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <BarChart3 className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-zinc-300">
                      Basic visitor counts and total review tracking
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  disabled
                  className={`w-full py-3.5 rounded-2xl text-xs sm:text-sm font-bold border text-center transition-all ${
                    !isPremium 
                      ? 'bg-zinc-800 text-white border-zinc-700 cursor-default' 
                      : 'bg-zinc-900/80 text-zinc-500 border-zinc-800/80 cursor-not-allowed'
                  }`}
                >
                  {!isPremium ? 'Active Plan' : 'Included in Account'}
                </button>
              </div>
            </div>

            {/* PREMIUM PLAN CARD */}
            <div className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 relative overflow-hidden transition-all shadow-2xl ${
              isPremium
                ? 'bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-2 border-white ring-1 ring-white/20'
                : 'bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-2 border-zinc-700 hover:border-zinc-500'
            }`}>
              {/* Badge Overlay */}
              <div className="absolute top-0 right-0 bg-white text-zinc-950 px-4 py-1.5 rounded-bl-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 fill-zinc-950 text-zinc-950" />
                <span>Full Suite Access</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                    isPremium 
                      ? 'bg-white text-zinc-950' 
                      : 'bg-white/10 border border-white/20 text-white'
                  }`}>
                    <Shield className="w-3.5 h-3.5" />
                    {isPremium ? 'CURRENT ACTIVE PLAN ✨' : 'RECOMMENDED FOR GROWTH'}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    Premium Business Suite
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
                    Complete video embedding, high-res downloads, and Google SEO indexing engine.
                  </p>
                </div>

                <div className="pt-2">
                  <div className="text-3xl sm:text-4xl font-black text-white flex items-baseline gap-2">
                    <span>Premium Partner</span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-1 font-medium">
                    Turn customer video reviews into your highest-converting marketing asset
                  </div>
                </div>

                <hr className="border-zinc-800" />

                {/* Premium Features List */}
                <div className="space-y-3 pt-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-white">Everything in Free, plus:</p>

                  <div className="flex items-start gap-3">
                    <Code className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-zinc-100">
                      <strong className="text-white">Embed Video Reviews</strong> on your official website with interactive HTML widgets
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <Download className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-zinc-100">
                      <strong className="text-white">Download High-Res Video Reviews</strong> for Instagram, TikTok & Facebook Ads
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <Search className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-zinc-100">
                      <strong className="text-white">Google SEO Indexing</strong> with Schema.org video rich snippets for search engine dominance
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <Sparkles className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-zinc-100">
                      <strong className="text-white">Smart Video Review Finder</strong> to aggregate web video reviews automatically
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-zinc-100">
                      <strong className="text-white">AI Response Recommendations</strong> for instant review replies
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <Star className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-zinc-100">
                      <strong className="text-white">Priority Search Placement</strong> in local category listings
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <Shield className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-zinc-100">
                      <strong className="text-white">1-on-1 Dedicated Support</strong> & account manager
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                {isPremium ? (
                  <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-700 text-center space-y-1">
                    <div className="inline-flex items-center gap-2 text-white font-black text-sm">
                      <CheckCircle2 className="w-4.5 h-4.5 text-white" />
                      <span>Premium Active</span>
                    </div>
                    <p className="text-xs text-zinc-300">
                      Your business account is fully upgraded with active Premium Suite capabilities.
                    </p>
                  </div>
                ) : requestStatus === 'success' ? (
                  <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-700 text-center space-y-1 animate-in fade-in">
                    <div className="inline-flex items-center gap-2 text-white font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Upgrade Request Received!</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Our support team has been notified at <strong className="text-white">support@yoouz.com</strong>. Admin will activate your account shortly.
                    </p>
                  </div>
                ) : requestStatus === 'error' ? (
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 text-center space-y-2">
                    <p>Failed to send request. Please try again or email support@yoouz.com directly.</p>
                    <button
                      onClick={handleUpgrade}
                      className="px-4 py-2 bg-white text-zinc-950 font-bold rounded-lg text-xs"
                    >
                      Retry Request
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleUpgrade}
                    disabled={isSubmitting}
                    className="w-full py-4 bg-white hover:bg-zinc-200 active:bg-zinc-300 text-zinc-950 font-black rounded-2xl transition-all shadow-xl hover:shadow-2xl active:scale-98 flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                        Sending Request to Support...
                      </span>
                    ) : (
                      <>
                        <span>Upgrade to Premium Suite</span>
                        <ArrowRight className="w-4 h-4" />
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
            <div className="border-b border-zinc-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-white">Full Feature Comparison Matrix</h3>
                <p className="text-xs text-zinc-400">Exact feature breakdown between Standard Free and Premium Suite</p>
              </div>

              {!isPremium && (
                <button
                  onClick={handleUpgrade}
                  disabled={isSubmitting || requestStatus === 'success'}
                  className="px-4 py-2 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-all self-start sm:self-auto cursor-pointer"
                >
                  {requestStatus === 'success' ? 'Request Sent' : 'Request Premium Upgrade'}
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="pb-3 font-semibold w-1/2">Capability</th>
                    <th className="pb-3 font-semibold text-center w-1/4">Free Tier</th>
                    <th className="pb-3 font-semibold text-center w-1/4 text-white">Premium Suite</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  <tr>
                    <td className="py-3.5 font-medium text-white">Reply to Comments & Reviews</td>
                    <td className="py-3.5 text-center"><Check className="w-4 h-4 mx-auto text-zinc-400" /></td>
                    <td className="py-3.5 text-center"><Check className="w-4 h-4 mx-auto text-white" /></td>
                  </tr>
                  <tr>
                    <td className="py-3.5 font-medium text-white">Update Business Profile, Hours & Bio</td>
                    <td className="py-3.5 text-center"><Check className="w-4 h-4 mx-auto text-zinc-400" /></td>
                    <td className="py-3.5 text-center"><Check className="w-4 h-4 mx-auto text-white" /></td>
                  </tr>
                  <tr>
                    <td className="py-3.5 font-medium text-white">Update & Download Business Profile QR Code</td>
                    <td className="py-3.5 text-center"><Check className="w-4 h-4 mx-auto text-zinc-400" /></td>
                    <td className="py-3.5 text-center"><Check className="w-4 h-4 mx-auto text-white" /></td>
                  </tr>
                  <tr>
                    <td className="py-3.5 font-medium text-white">Embed Customer Video Reviews on Website</td>
                    <td className="py-3.5 text-center text-zinc-600">—</td>
                    <td className="py-3.5 text-center"><Check className="w-4 h-4 mx-auto text-white" /></td>
                  </tr>
                  <tr>
                    <td className="py-3.5 font-medium text-white">Download High-Res Video Reviews for Social Ads</td>
                    <td className="py-3.5 text-center text-zinc-600">—</td>
                    <td className="py-3.5 text-center"><Check className="w-4 h-4 mx-auto text-white" /></td>
                  </tr>
                  <tr>
                    <td className="py-3.5 font-medium text-white">Google SEO Indexing & Video Rich Snippets</td>
                    <td className="py-3.5 text-center text-zinc-600">—</td>
                    <td className="py-3.5 text-center"><Check className="w-4 h-4 mx-auto text-white" /></td>
                  </tr>
                  <tr>
                    <td className="py-3.5 font-medium text-white">Smart Web Video Review Finder</td>
                    <td className="py-3.5 text-center text-zinc-600">—</td>
                    <td className="py-3.5 text-center"><Check className="w-4 h-4 mx-auto text-white" /></td>
                  </tr>
                  <tr>
                    <td className="py-3.5 font-medium text-white">AI Response Recommendations</td>
                    <td className="py-3.5 text-center text-zinc-600">—</td>
                    <td className="py-3.5 text-center"><Check className="w-4 h-4 mx-auto text-white" /></td>
                  </tr>
                  <tr>
                    <td className="py-3.5 font-medium text-white">Priority Local Category Search Ranking</td>
                    <td className="py-3.5 text-center text-zinc-600">—</td>
                    <td className="py-3.5 text-center"><Check className="w-4 h-4 mx-auto text-white" /></td>
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
              <h3 className="text-lg font-bold text-white">Frequently Asked Questions</h3>
              <p className="text-xs text-zinc-400">Everything you need to know about Yoouz Business Memberships</p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-zinc-400" />
                  How is the Premium upgrade activated?
                </h4>
                <p className="text-zinc-400 leading-relaxed pl-6">
                  When you click <strong className="text-zinc-200">Upgrade to Premium Suite</strong>, our team receives an instant notification at <strong className="text-white">support@yoouz.com</strong> with your business verification ID. Once verified or invoice settled, the admin team manually activates your account and unlocks all features immediately.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Code className="w-4 h-4 text-zinc-400" />
                  Can I embed video reviews on any website?
                </h4>
                <p className="text-zinc-400 leading-relaxed pl-6">
                  Yes! Premium Suite provides an iframe embed code and direct script snippet compatible with WordPress, Wix, Shopify, Squarespace, Webflow, or custom React/HTML sites.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  What happens if I downgrade or switch back to Free?
                </h4>
                <p className="text-zinc-400 leading-relaxed pl-6">
                  If your subscription is updated back to Free by admin, your profile remains verified and active. You retain full capability to reply to customer reviews, update hours, and download QR codes. Video embed widgets will revert to baseline mode.
                </p>
              </div>
            </div>

            <div className="pt-2 text-center border-t border-zinc-800 pt-6 space-y-2">
              <p className="text-xs text-zinc-400">
                Need customized enterprise agreements or multi-location agency onboarding?
              </p>
              <a
                href="mailto:support@yoouz.com"
                className="text-xs font-bold text-white hover:underline inline-flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Contact Direct Support: support@yoouz.com</span>
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
