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
  Mail,
  Clock,
  TrendingUp,
  CreditCard,
  Award,
  BadgeCheck
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
  isEmbedded?: boolean;
}

export const CopoPremiumPlansModal: React.FC<CopoPremiumPlansModalProps> = ({
  isOpen,
  onClose,
  businessName,
  ownerEmail,
  placeId,
  isPremium = false,
  currentPlace,
  isEmbedded = false,
}) => {
  const [activeTab, setActiveTab] = useState<'plans' | 'matrix' | 'faq'>('plans');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [cancelStatus, setCancelStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

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

  const matrixRows: Array<{ label: string; free: string | boolean; pro: boolean }> = [
    { label: 'Real-time photo review impression analytics', free: true, pro: true },
    { label: 'Interactive performance charts (7D / 30D / 90D / All)', free: true, pro: true },
    { label: 'Reply to customer photo reviews & comments', free: true, pro: true },
    { label: 'Update business profile, hours & bio', free: true, pro: true },
    { label: 'Print-ready table & counter QR standee', free: true, pro: true },
    { label: 'Track customer followers & alerts', free: true, pro: true },
    { label: 'Embed customer photo reviews on your website', free: false, pro: true },
    { label: 'Export high-res branded review cards for social ads', free: false, pro: true },
    { label: 'Google SEO indexing & rich review snippets', free: false, pro: true },
    { label: 'Direct messaging with customer reviewers', free: false, pro: true },
    { label: 'Custom profile action buttons (Book, Order, Reserve)', free: false, pro: true },
    { label: 'Priority category search placement', free: false, pro: true },
    { label: 'Business support', free: 'Standard', pro: true },
  ];

  return (
    <div
      className={
        isEmbedded
          ? 'w-full text-white flex flex-col space-y-6 animate-in fade-in duration-200 select-none pb-6'
          : 'fixed inset-0 z-[100] bg-[#050506] text-white flex flex-col overflow-y-auto animate-in fade-in duration-200 select-none'
      }
    >
      {/* Modal Top Header Bar (standalone modal mode only) */}
      {!isEmbedded && (
        <div className="sticky top-0 z-30 bg-[#050506]/92 backdrop-blur-2xl border-b border-white/[0.08] px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-[#E8C78A]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-white tracking-[-0.02em] truncate">
                Plans &amp; Membership
              </h2>
              <p className="text-xs text-zinc-400 hidden sm:block truncate">
                Scale authentic photo proof across your website and search listings.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white border border-white/[0.1] flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0"
            aria-label="Close plans"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className={isEmbedded ? 'w-full max-w-4xl mx-auto space-y-6' : 'max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex-1 space-y-6'}>
        {/* Embedded Editorial Page Header */}
        {isEmbedded && (
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-[26px] sm:text-[32px] font-semibold text-white tracking-[-0.03em] leading-[1.12]">
                Plans &amp; Membership
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                Manage your workspace tier and growth tools for {businessName || 'your business'}.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400 shrink-0">
              <span>Current tier:</span>
              <span className={`font-semibold ${isPremium ? 'text-[#E8C78A]' : 'text-white'}`}>
                {isPremium ? 'Premium Suite' : 'Free Standard'}
              </span>
            </div>
          </div>
        )}

        {/* Workspace Summary Bar (modal mode or clean status strip) */}
        {!isEmbedded && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {currentPlace?.logoUrl ? (
                <img
                  src={currentPlace.logoUrl}
                  alt={businessName}
                  className="w-10 h-10 rounded-xl object-contain bg-white/[0.05] p-1 border border-white/[0.1] shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-white font-semibold shrink-0 text-sm">
                  {(businessName || 'B').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm sm:text-base font-semibold text-white truncate">
                    {businessName || 'Your Business Workspace'}
                  </h3>
                  <BadgeCheck className="w-4 h-4 text-[#E8C78A] shrink-0" />
                </div>
                <p className="text-xs text-zinc-400 truncate">
                  Verified business workspace
                </p>
              </div>
            </div>

            <div className="text-xs text-zinc-400 shrink-0">
              Status:{' '}
              <span className={`font-semibold ${isPremium ? 'text-[#E8C78A]' : 'text-white'}`}>
                {isPremium ? 'Premium Suite Active' : 'Free Standard'}
              </span>
            </div>
          </div>
        )}

        {/* Segmented Control */}
        <div className="inline-flex w-full sm:w-auto items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
          {[
            { id: 'plans' as const, label: 'Plans', icon: Zap },
            { id: 'matrix' as const, label: 'Compare', icon: Layers },
            { id: 'faq' as const, label: 'FAQ', icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap min-h-[38px] ${
                  active
                    ? 'bg-white text-zinc-950 shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: PLAN CARDS */}
        {activeTab === 'plans' && (
          <div className="grid md:grid-cols-2 gap-4 sm:gap-5 items-stretch animate-in fade-in duration-150">
            {/* FREE STANDARD */}
            <div
              className={`rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-6 transition-all border ${
                !isPremium
                  ? 'bg-white/[0.035] border-white/[0.14]'
                  : 'bg-white/[0.02] border-white/[0.08]'
              }`}
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-400">Standard</span>
                  {!isPremium && (
                    <span className="font-semibold text-white">Current plan</span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white tracking-[-0.02em]">
                    Free Standard
                  </h3>
                  <p className="text-xs sm:text-[13px] text-zinc-400 mt-1.5 leading-relaxed">
                    Essential tools for verified businesses to track photo proof, reply to reviews, and collect scans.
                  </p>
                </div>

                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-semibold text-white tracking-[-0.03em] tabular-nums">$0</span>
                    <span className="text-xs text-zinc-400">/ forever</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">No credit card required</p>
                </div>

                <div className="h-px bg-white/[0.08]" />

                <div className="space-y-3">
                  <p className="text-[11px] font-medium text-zinc-400">Included</p>
                  {[
                    { icon: BarChart3, text: 'Real-time photo review impression analytics' },
                    { icon: TrendingUp, text: 'Interactive charts across 7D, 30D, 90D & All Time' },
                    { icon: MessageSquare, text: 'Public owner replies on customer photo reviews' },
                    { icon: CheckCircle2, text: 'Editable business profile, hours & location' },
                    { icon: QrCode, text: 'Print-ready table & counter QR standee' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <item.icon className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-[13px] text-zinc-300 leading-snug">
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled
                  className="w-full py-3 rounded-full text-xs font-semibold border border-white/[0.1] bg-white/[0.04] text-zinc-400 cursor-default min-h-[44px]"
                >
                  {!isPremium ? 'Current active plan' : 'Included'}
                </button>
              </div>
            </div>

            {/* PREMIUM BUSINESS SUITE */}
            <div
              className={`rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-6 transition-all border ${
                isPremium
                  ? 'bg-white/[0.05] border-[#E8C78A]/40'
                  : 'bg-white/[0.045] border-white/[0.18]'
              }`}
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#E8C78A] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#E8C78A]" />
                    <span>Growth Suite</span>
                  </span>
                  <span className="font-medium text-zinc-300">
                    {isPremium ? 'Active' : 'Recommended'}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white tracking-[-0.02em]">
                    Premium Business Suite
                  </h3>
                  <p className="text-xs sm:text-[13px] text-zinc-300 mt-1.5 leading-relaxed">
                    Website photo embeds, high-res ad exports, Google SEO rich snippets, and direct customer messaging.
                  </p>
                </div>

                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-semibold text-white tracking-[-0.03em] tabular-nums">$149</span>
                    <span className="text-xs text-zinc-400">/ month</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Billed monthly · Cancel anytime
                  </p>
                </div>

                <div className="h-px bg-white/[0.09]" />

                <div className="space-y-3">
                  <p className="text-[11px] font-medium text-zinc-300">Everything in Free, plus</p>
                  {[
                    { icon: Code, text: 'Embed live photo reviews on your official website' },
                    { icon: Download, text: 'Export high-res branded review cards for social ads' },
                    { icon: Search, text: 'Google SEO indexing with Schema.org rich snippets' },
                    { icon: MessageSquare, text: 'Direct messaging with verified reviewers' },
                    { icon: Zap, text: 'Custom profile CTA button (Book, Order, Reserve)' },
                    { icon: Star, text: 'Priority placement in local category listings' },
                    { icon: Shield, text: 'Priority business onboarding & support' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <item.icon className="w-4 h-4 text-[#E8C78A] shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-[13px] text-zinc-200 leading-snug">
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 space-y-3">
                {isPremium ? (
                  <div className="space-y-3">
                    {cancelStatus === 'success' ? (
                      <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.09] text-xs text-zinc-300 text-center">
                        Cancellation request sent. Your workspace will revert to Free Standard after review.
                      </div>
                    ) : showCancelConfirm ? (
                      <div className="p-4 rounded-xl bg-[#09090b] border border-white/[0.1] space-y-3 animate-in fade-in">
                        <div className="text-xs font-medium text-white text-center">
                          Request subscription cancellation?
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowCancelConfirm(false)}
                            className="flex-1 py-2.5 rounded-full bg-white/[0.07] hover:bg-white/[0.12] text-zinc-200 text-xs font-semibold transition cursor-pointer"
                          >
                            Keep plan
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowCancelConfirm(false);
                              handleCancelSubscription();
                            }}
                            disabled={isSubmitting}
                            className="flex-1 py-2.5 rounded-full bg-rose-500/90 hover:bg-rose-500 text-white text-xs font-semibold transition cursor-pointer"
                          >
                            {isSubmitting ? 'Sending...' : 'Confirm'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowCancelConfirm(true)}
                        disabled={isSubmitting}
                        className="w-full py-3 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 hover:text-white text-xs font-semibold transition-all cursor-pointer border border-white/[0.1] min-h-[44px]"
                      >
                        Cancel subscription
                      </button>
                    )}
                  </div>
                ) : requestStatus === 'success' ? (
                  <div className="p-4 rounded-xl bg-white/[0.04] border border-[#E8C78A]/30 text-center space-y-1 animate-in fade-in">
                    <div className="inline-flex items-center gap-1.5 text-white font-semibold text-sm">
                      <CheckCircle2 className="w-4 h-4 text-[#E8C78A]" />
                      <span>Upgrade request sent</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Our team has been notified and will activate your Premium Suite shortly.
                    </p>
                  </div>
                ) : requestStatus === 'error' ? (
                  <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.09] text-xs text-zinc-300 text-center space-y-2.5">
                    <p>Could not send request. Please try again.</p>
                    <button
                      type="button"
                      onClick={handleUpgrade}
                      className="px-4 py-2 bg-white text-zinc-950 font-semibold rounded-full text-xs hover:bg-zinc-200 cursor-pointer"
                    >
                      Retry request
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleUpgrade}
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-white hover:bg-zinc-200 active:scale-[0.99] text-zinc-950 font-semibold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer text-sm min-h-[46px]"
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                        Sending request...
                      </span>
                    ) : (
                      <>
                        <span>Upgrade to Premium</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMPARISON MATRIX */}
        {activeTab === 'matrix' && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 sm:p-7 space-y-5 animate-in fade-in duration-150">
            <div className="border-b border-white/[0.07] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white tracking-[-0.02em]">
                  Feature comparison
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Side-by-side breakdown of Free Standard ($0) and Premium Suite ($149/mo).
                </p>
              </div>

              {!isPremium && (
                <button
                  type="button"
                  onClick={handleUpgrade}
                  disabled={isSubmitting || requestStatus === 'success'}
                  className="px-4 py-2.5 rounded-full bg-white text-zinc-950 font-semibold text-xs hover:bg-zinc-200 transition-all self-start sm:self-auto cursor-pointer"
                >
                  {requestStatus === 'success' ? 'Request sent' : 'Upgrade to Premium'}
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-[13px]">
                <thead>
                  <tr className="border-b border-white/[0.08] text-zinc-400">
                    <th className="pb-3 font-medium w-1/2">Capability</th>
                    <th className="pb-3 font-medium text-center w-1/4 tabular-nums">Free ($0)</th>
                    <th className="pb-3 font-semibold text-center w-1/4 text-white tabular-nums">Premium ($149/mo)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {matrixRows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="py-3.5 text-zinc-200 font-medium pr-3">{row.label}</td>
                      <td className="py-3.5 text-center">
                        {row.free === true ? (
                          <Check className="w-4 h-4 mx-auto text-zinc-400" />
                        ) : row.free === false ? (
                          <span className="text-zinc-600">—</span>
                        ) : (
                          <span className="text-zinc-400 text-xs">{row.free}</span>
                        )}
                      </td>
                      <td className="py-3.5 text-center">
                        <Check className="w-4 h-4 mx-auto text-[#E8C78A]" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: FAQ */}
        {activeTab === 'faq' && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 sm:p-7 space-y-5 animate-in fade-in duration-150">
            <div className="border-b border-white/[0.07] pb-4">
              <h3 className="text-base sm:text-lg font-semibold text-white tracking-[-0.02em]">
                Frequently asked questions
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Details on Yoouz Business memberships, billing, and activation.
              </p>
            </div>

            <div className="divide-y divide-white/[0.07]">
              {[
                {
                  icon: CreditCard,
                  q: 'What is included in the Premium Business Suite ($149/mo)?',
                  a: 'It includes the live website review embed with automated Google Rich Snippets SEO schema, high-resolution branded ad card exports, direct customer messaging, custom profile action buttons, priority search placement, and priority support.',
                },
                {
                  icon: Sparkles,
                  q: 'How does the embed improve Google Search SEO?',
                  a: 'When embedded on your site, Yoouz outputs valid Schema.org JSON-LD structured data so search engines can index your verified customer ratings and live photo proof.',
                },
                {
                  icon: Award,
                  q: 'Can I export customer photo reviews for social ads?',
                  a: 'Yes. Premium subscribers can export customer live photo reviews as high-definition branded cards featuring your official logo, ready for Instagram, TikTok, or Meta ads.',
                },
                {
                  icon: HelpCircle,
                  q: 'How is the Premium upgrade activated?',
                  a: 'When you request an upgrade, our onboarding team verifies your workspace and activates all Premium Suite features immediately.',
                },
                {
                  icon: Code,
                  q: 'Which websites support the Yoouz embed?',
                  a: 'The embed snippet works on WordPress, Shopify, Wix, Squarespace, Webflow, and custom HTML or React websites.',
                },
                {
                  icon: Clock,
                  q: 'What happens if I cancel and return to Free?',
                  a: 'Your business stays verified on Yoouz. You continue to have full access to analytics, public review replies, profile edits, and print-ready QR standees at $0.',
                },
              ].map((item, idx) => (
                <div key={idx} className="py-4 first:pt-1 last:pb-1 space-y-1.5">
                  <h4 className="font-semibold text-white flex items-center gap-2 text-xs sm:text-sm">
                    <item.icon className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>{item.q}</span>
                  </h4>
                  <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed pl-6">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center border-t border-white/[0.07] pt-5 space-y-2">
              <p className="text-xs text-zinc-400">
                Need multi-location enterprise onboarding?
              </p>
              <button
                type="button"
                onClick={handleUpgrade}
                className="text-xs font-semibold text-white hover:underline inline-flex items-center gap-1.5 cursor-pointer"
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
