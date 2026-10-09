import React, { useState } from 'react';
import { X, Check, Shield, Zap, Sparkles, Download, Code, Search, QrCode, MessageSquare, Star, CheckCircle2, ArrowRight } from 'lucide-react';

interface CopoPremiumPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  ownerEmail: string;
}

export const CopoPremiumPlansModal: React.FC<CopoPremiumPlansModalProps> = ({
  isOpen,
  onClose,
  businessName,
  ownerEmail,
}) => {
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
          businessName: businessName || 'Claimed Business',
          ownerEmail: ownerEmail || 'Owner',
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
    <div className="fixed inset-0 z-[100] bg-zinc-950 text-white flex flex-col overflow-y-auto animate-in fade-in duration-200">
      {/* Sticky Dark Header Bar */}
      <div className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">Business Membership Plans</h2>
            <p className="text-xs text-zinc-400 font-medium hidden sm:block">
              Scale your location's reputation and engage with video reviewers
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 flex-1 space-y-8">
        {/* Business Identifier Banner */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-zinc-400">Account Verified</span>
              <h3 className="text-sm sm:text-base font-bold text-white">{businessName || 'Your Business Account'}</h3>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-300 w-fit">
            <span>Current Status:</span>
            <span className="font-bold text-white uppercase tracking-wider">Free Tier Active</span>
          </div>
        </div>

        {/* Pricing & Plan Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
          {/* FREE PLAN CARD */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 relative hover:border-zinc-700 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-300">
                  CURRENT PLAN
                </span>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">STANDARD</span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white">Free Plan</h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  Essential baseline capabilities for claimed businesses.
                </p>
              </div>

              <div className="pt-2">
                <div className="text-3xl sm:text-4xl font-black text-white">$0</div>
                <div className="text-xs text-zinc-400 mt-1 font-medium">Free forever — no credit card required</div>
              </div>

              <hr className="border-zinc-800" />

              {/* Free Features Checklist */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Included Features:</p>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-zinc-200">
                    <strong className="text-white">Reply to comments</strong> & customer feedback
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-zinc-200">
                    <strong className="text-white">Update business profile details</strong>, bio & operating hours
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <QrCode className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-zinc-200">
                    <strong className="text-white">Generate & update custom QR Code</strong> for table/desk displays
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <MessageSquare className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-zinc-200">
                    <strong className="text-white">Respond directly</strong> to customer video reviews
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-zinc-200">
                    Basic analytics and total review counts
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                disabled
                className="w-full py-3.5 bg-zinc-800 text-zinc-400 font-bold rounded-2xl text-xs sm:text-sm border border-zinc-700/60 cursor-not-allowed text-center"
              >
                Active Plan
              </button>
            </div>
          </div>

          {/* PREMIUM PLAN CARD */}
          <div className="bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-2 border-zinc-700 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 relative shadow-2xl overflow-hidden ring-1 ring-zinc-700">
            {/* Top Accent Badge */}
            <div className="absolute top-0 right-0 bg-white text-zinc-950 px-4 py-1.5 rounded-bl-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-lg">
              <Sparkles className="w-3.5 h-3.5 fill-zinc-950 text-zinc-950" />
              <span>Full Suite Access</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-white flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  RECOMMENDED FOR GROWTH
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  Premium Business Suite
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  Complete marketing, video embed & SEO distribution suite.
                </p>
              </div>

              <div className="pt-2">
                <div className="text-3xl sm:text-4xl font-black text-white flex items-baseline gap-2">
                  <span>Premium Partner</span>
                </div>
                <div className="text-xs text-zinc-400 mt-1 font-medium">
                  Unlock high-converting video review embeds & search ranking
                </div>
              </div>

              <hr className="border-zinc-800" />

              {/* Premium Features Checklist */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-white">Everything in Free, plus:</p>

                <div className="flex items-start gap-3">
                  <Code className="w-4 h-4 text-white shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-zinc-100">
                    <strong className="text-white">Embed Video Reviews</strong> on your official website with interactive widgets
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
                    <strong className="text-white">Smart Video Review Finder</strong> to aggregate unlinked video reviews across the web
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
              {requestStatus === 'success' ? (
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-700 text-center space-y-1">
                  <div className="inline-flex items-center gap-2 text-white font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Upgrade Request Received!</span>
                  </div>
                  <p className="text-xs text-zinc-300">
                    Our support team has been notified. We will review your account and get in touch with you shortly.
                  </p>
                </div>
              ) : requestStatus === 'error' ? (
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 text-center space-y-2">
                  <p>Failed to send request. Please try again or reach out to support@yoouz.com directly.</p>
                  <button
                    onClick={handleUpgrade}
                    className="px-4 py-2 bg-white text-zinc-950 font-bold rounded-lg text-xs"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleUpgrade}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-white hover:bg-zinc-200 text-zinc-950 font-black rounded-2xl transition-all shadow-xl hover:shadow-2xl active:scale-98 flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                      Sending Request...
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

        {/* Breakdown Comparison Table */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-zinc-800 pb-4">
            <h3 className="text-lg font-bold text-white">Full Plan Comparison</h3>
            <p className="text-xs text-zinc-400">Detailed breakdown of features included in each plan tier</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="pb-3 font-semibold w-1/2">Feature</th>
                  <th className="pb-3 font-semibold text-center w-1/4">Free</th>
                  <th className="pb-3 font-semibold text-center w-1/4 text-white">Premium Suite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                <tr>
                  <td className="py-3 font-medium text-white">Reply to Comments & Reviews</td>
                  <td className="py-3 text-center"><Check className="w-4 h-4 mx-auto text-zinc-400" /></td>
                  <td className="py-3 text-center"><Check className="w-4 h-4 mx-auto text-white" /></td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-white">Update Business Profile & Bio</td>
                  <td className="py-3 text-center"><Check className="w-4 h-4 mx-auto text-zinc-400" /></td>
                  <td className="py-3 text-center"><Check className="w-4 h-4 mx-auto text-white" /></td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-white">Update & Download Business Profile QR Code</td>
                  <td className="py-3 text-center"><Check className="w-4 h-4 mx-auto text-zinc-400" /></td>
                  <td className="py-3 text-center"><Check className="w-4 h-4 mx-auto text-white" /></td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-white">Embed Customer Video Reviews on Website</td>
                  <td className="py-3 text-center text-zinc-600">—</td>
                  <td className="py-3 text-center"><Check className="w-4 h-4 mx-auto text-white" /></td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-white">Download High-Res Video Reviews for Social Ads</td>
                  <td className="py-3 text-center text-zinc-600">—</td>
                  <td className="py-3 text-center"><Check className="w-4 h-4 mx-auto text-white" /></td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-white">Google SEO Indexing & Video Rich Snippets</td>
                  <td className="py-3 text-center text-zinc-600">—</td>
                  <td className="py-3 text-center"><Check className="w-4 h-4 mx-auto text-white" /></td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-white">Smart Web Video Review Finder</td>
                  <td className="py-3 text-center text-zinc-600">—</td>
                  <td className="py-3 text-center"><Check className="w-4 h-4 mx-auto text-white" /></td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-white">AI Response Recommendations</td>
                  <td className="py-3 text-center text-zinc-600">—</td>
                  <td className="py-3 text-center"><Check className="w-4 h-4 mx-auto text-white" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Support & Assistance Note */}
        <div className="text-center pb-8 space-y-2">
          <p className="text-xs text-zinc-400">
            Have questions about business membership tiers or multi-location setup?
          </p>
          <a
            href="mailto:support@yoouz.com"
            className="text-xs font-bold text-white hover:underline inline-flex items-center gap-1"
          >
            <span>Contact Support: support@yoouz.com</span>
          </a>
        </div>
      </div>
    </div>
  );
};
