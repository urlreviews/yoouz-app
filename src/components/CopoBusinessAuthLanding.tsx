import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Mail, 
  Check, 
  Loader2, 
  AlertCircle, 
  AlertTriangle,
  ArrowLeft, 
  ArrowRight, 
  ShieldCheck, 
  Lock,
  CheckCircle2,
  X,
  Sparkles,
  RefreshCw,
  Globe,
  MapPin
} from 'lucide-react';
import { Place, NavSection, UserProfile, VideoReview, BusinessSession } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { derivePlaceFromEmailOrDomain } from '../utils/businessDomainUtils';
import { extractCleanDomain } from '../utils/placeUtils';

interface CopoBusinessAuthLandingProps {
  onNavigate: (section: NavSection) => void;
  places: Place[];
  onSuccessAuth: (session: BusinessSession) => void;
  initialPlace?: Place | null;
  initialMode?: 'signin' | 'claim' | 'demo';
  onCancelSelectedPlace?: () => void;
  currentUser?: UserProfile | null;
  videos?: VideoReview[];
  hasActiveSession?: boolean;
  onReturnToDashboard?: () => void;
}

export const CopoBusinessAuthLanding: React.FC<CopoBusinessAuthLandingProps> = ({
  onNavigate,
  places = [],
  onSuccessAuth,
  initialPlace = null,
  initialMode = 'signin',
  onCancelSelectedPlace,
  currentUser = null,
  videos = [],
  hasActiveSession = false,
  onReturnToDashboard
}) => {
  const { t } = useLanguage();

  const handleExitOrBack = () => {
    if (onCancelSelectedPlace) onCancelSelectedPlace();
    if (hasActiveSession && onReturnToDashboard) {
      onReturnToDashboard();
    } else {
      onNavigate('home');
    }
  };

  // State
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(initialPlace || null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // 6-Digit Code State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setSelectedPlace(initialPlace || null);
  }, [initialPlace]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Auto-detect matching place by email domain
  const findMatchingPlaceForEmail = (emailStr: string): Place | null => {
    return derivePlaceFromEmailOrDomain(emailStr, places);
  };

  // Cross-account conflict validation: Reviewer/Customer vs Business
  const checkReviewerConflict = (rawEmail: string): { isConflict: boolean; reason: string } => {
    if (!rawEmail || !rawEmail.includes('@')) return { isConflict: false, reason: '' };
    const clean = rawEmail.trim().toLowerCase();
    const prefix = clean.split('@')[0];

    // 1. Check logged-in user profile if active
    if (currentUser?.email && currentUser.email.toLowerCase() === clean) {
      return {
        isConflict: true,
        reason: t(
          'businessAuth.reviewerConflictSelf',
          'This email is registered to your customer/reviewer account. Business accounts must use an official, dedicated work email to maintain review authenticity and avoid conflicts of interest.'
        )
      };
    }

    // 2. Check if email matches any reviewer who authored video reviews in feed
    if (videos && videos.length > 0) {
      const hasReview = videos.some(v => {
        const vEmail = (v.userEmail || (v as any).userId || '').toLowerCase().trim();
        const a = v.author || {};
        const aEmail = ((a as any).email || '').toLowerCase().trim();
        const aHandle = (((a as any).handle || (v as any).authorHandle || '') as string).toLowerCase().replace(/^@+/, '');
        return vEmail === clean || aEmail === clean || (prefix.length >= 4 && aHandle === prefix);
      });

      if (hasReview) {
        return {
          isConflict: true,
          reason: t(
            'businessAuth.reviewerConflictReview',
            'This email is associated with a customer reviewer who has posted photo reviews. Business accounts must use a dedicated business email to protect review integrity.'
          )
        };
      }
    }

    return { isConflict: false, reason: '' };
  };

  const conflictInfo = checkReviewerConflict(email);

  // Auto-verify Magic Link if present in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const magicToken = urlParams.get('magic_token');
    const paramEmail = urlParams.get('email');
    const paramPlace = urlParams.get('place');

    if (magicToken && paramEmail) {
      setIsLoading(true);
      fetch('/api/business/verify-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: paramEmail,
          token: magicToken,
          placeId: paramPlace || (selectedPlace ? selectedPlace.id : 'place-custom')
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.session) {
            localStorage.setItem('copo_business_verified_session', JSON.stringify(data.session));
            window.dispatchEvent(new CustomEvent('copo_business_auth_changed', { detail: data.session }));
            onSuccessAuth(data.session);
          } else {
            setErrorMessage(data.error || 'The verification link has expired or is invalid.');
          }
        })
        .catch(() => {
          setErrorMessage('Unable to verify login link. Please try again.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, []);

  // Handle 6-Digit OTP Changes
  const handleDigitChange = (index: number, value: string) => {
    const cleanVal = value.replace(/\D/g, '');
    if (cleanVal.length > 1) {
      const digits = cleanVal.slice(0, 6).split('');
      const newOtp = [...otpDigits];
      digits.forEach((d, idx) => {
        if (index + idx < 6) newOtp[index + idx] = d;
      });
      setOtpDigits(newOtp);
      const nextIdx = Math.min(index + digits.length, 5);
      inputRefs.current[nextIdx]?.focus();

      if (newOtp.every(d => d.length === 1)) {
        verifyCode(newOtp.join(''));
      }
      return;
    }

    const newOtp = [...otpDigits];
    newOtp[index] = cleanVal;
    setOtpDigits(newOtp);

    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every(d => d.length === 1)) {
      verifyCode(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Dispatch Magic Link / OTP via API
  const doSendMagicLink = async (targetEmail: string, placeToClaim: Place | null) => {
    setIsLoading(true);
    setErrorMessage(null);

    const placeId = placeToClaim ? placeToClaim.id : 'place-custom';
    const placeName = placeToClaim ? placeToClaim.name : 'Your Business';
    const website = placeToClaim?.website || '';

    try {
      const response = await fetch('/api/business/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          placeId,
          placeName,
          website,
          host: window.location.host
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setStep('code');
        setOtpDigits(['', '', '', '', '', '']);
        setResendCooldown(30);
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
      } else {
        setErrorMessage(data.error || 'Failed to send verification code. Please check your email.');
      }
    } catch (err) {
      setErrorMessage('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Submit Work Email
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid work email.');
      return;
    }

    // Check conflict before sending
    if (conflictInfo.isConflict) {
      setErrorMessage(conflictInfo.reason);
      return;
    }

    setErrorMessage(null);

    // Auto-detect business if none preselected
    let matched = selectedPlace || findMatchingPlaceForEmail(cleanEmail);
    if (matched) {
      setSelectedPlace(matched);
    }

    await doSendMagicLink(cleanEmail, matched);
  };

  // Step 2: Verify 6-digit Code
  const verifyCode = async (codeToVerify: string) => {
    if (!codeToVerify || codeToVerify.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const placeId = selectedPlace ? selectedPlace.id : 'place-custom';

    try {
      const response = await fetch('/api/business/verify-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          code: codeToVerify,
          placeId
        })
      });

      const data = await response.json();
      if (response.ok && data.success && data.session) {
        localStorage.setItem('copo_business_verified_session', JSON.stringify(data.session));
        
        try {
          const raw = localStorage.getItem('copo_claimed_places') || '[]';
          const list = JSON.parse(raw);
          if (!list.includes(placeId)) {
            list.push(placeId);
            localStorage.setItem('copo_claimed_places', JSON.stringify(list));
          }
        } catch (e) {}

        window.dispatchEvent(new CustomEvent('copo_business_auth_changed', { detail: data.session }));
        onSuccessAuth(data.session);
      } else {
        setErrorMessage(data.error || 'Invalid or expired code. Please try again.');
      }
    } catch (err) {
      setErrorMessage('Failed to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-full min-w-0 h-full min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain overscroll-x-none touch-pan-y bg-[#050506] flex flex-col antialiased text-white selection:bg-white/15 selection:text-white copo-business-auth-landing">
      
      {/* Subtle Ambient Radial Highlight at Top */}
      <div 
        className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(255,255,255,0.05),transparent)]" 
        aria-hidden="true" 
      />

      {/* 1. Refined Minimal Header */}
      <header className="relative w-full h-16 bg-[#050506]/85 backdrop-blur-2xl border-b border-white/[0.08] px-4 sm:px-8 flex items-center justify-between shrink-0 z-30">
        <div 
          onClick={handleExitOrBack}
          className="flex items-center gap-2.5 cursor-pointer group"
          id="btn-business-logo-exit"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white shadow-sm group-hover:bg-white/[0.09] transition-all">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M12 3.8l2.32 4.7 5.18 0.75-3.75 3.65 0.88 5.16L12 15.62l-4.63 2.44 0.88-5.16-3.75-3.65 5.18-0.75L12 3.8z" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg text-white font-['Google_Sans',sans-serif] tracking-tight">Yoouz</span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-zinc-200 text-[11px] font-semibold border border-white/[0.1]">
              Business
            </span>
          </div>
        </div>

        <button
          id="btn-business-exit-nav"
          onClick={handleExitOrBack}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-zinc-200 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-semibold transition-all cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{hasActiveSession ? t("business.backToDashboard", "Back to Business Dashboard") : t("common.exit", "Exit")}</span>
        </button>
      </header>

      {/* 2. Main Authentication Content */}
      <main className="relative flex-1 max-w-lg w-full mx-auto px-4 py-8 sm:py-12 pb-24 flex flex-col items-center justify-start shrink-0">
        
        {/* Emblem & Hero Headings */}
        <div className="flex flex-col items-center text-center w-full mb-6">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center mb-4 shadow-sm text-white">
            <Building2 className="w-6 h-6 text-white" />
          </div>

          <h1 className="text-2xl sm:text-[26px] font-extrabold text-white tracking-tight leading-snug">
            {initialMode === 'claim' ? t("businessAuth.claimTitle", "Verify Ownership & Claim Portal") : t("businessAuth.title", "Sign in to Yoouz Business")}
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm mt-2 leading-relaxed max-w-sm font-normal">
            {t("businessAuth.subtitle", "Claim your business, respond to authentic photo reviews, and connect with customers as the verified owner.")}
          </p>
        </div>

        {/* Premium Obsidian Glass Authentication Card */}
        <div className="w-full bg-[#0c0c0f]/96 backdrop-blur-2xl rounded-3xl border border-white/[0.1] shadow-[0_24px_70px_rgba(0,0,0,0.8)] p-6 sm:p-7 transition-all">
          
          {/* STEP 1: EMAIL SIGN-IN */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4" id="form-business-email-signin">
              
              {/* Selected Venue Preview Card */}
              {selectedPlace && (
                <div className="p-3.5 bg-white/[0.03] rounded-2xl border border-white/[0.08] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center shrink-0 text-white overflow-hidden p-0.5">
                      {selectedPlace.logoUrl ? (
                        <img 
                          src={selectedPlace.logoUrl} 
                          alt={selectedPlace.name} 
                          className="w-full h-full object-contain rounded-lg"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }} 
                        />
                      ) : (
                        <Building2 className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-xs sm:text-sm truncate block">
                          {selectedPlace.name}
                        </span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#E8C78A] shrink-0" />
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {selectedPlace.website ? (
                          <Globe className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
                        ) : (
                          <MapPin className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
                        )}
                        <span className="text-[11px] text-zinc-400 block truncate font-normal">
                          {selectedPlace.website ? extractCleanDomain(selectedPlace.website) : selectedPlace.address}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    id="btn-change-selected-place"
                    onClick={() => {
                      setSelectedPlace(null);
                      setErrorMessage(null);
                      try {
                        const url = new URL(window.location.href);
                        if (url.searchParams.has('place') || url.searchParams.has('claim')) {
                          url.searchParams.delete('place');
                          url.searchParams.delete('claim');
                          window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
                        }
                      } catch (e) {}
                      if (onCancelSelectedPlace) {
                        onCancelSelectedPlace();
                      }
                    }}
                    className="text-zinc-300 text-xs font-semibold shrink-0 hover:text-white px-2.5 py-1 rounded-full hover:bg-white/[0.08] transition-colors cursor-pointer"
                  >
                    {t("common.change", "Change")}
                  </button>
                </div>
              )}

              {/* Work Email Input */}
              <div>
                <label htmlFor="input-business-work-email" className="block text-xs font-semibold text-zinc-200 mb-2">
                  {t("businessAuth.workEmail", "Work Email")}
                </label>

                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="input-business-work-email"
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder={t("businessAuth.emailPlaceholder", "name@yourcompany.com")}
                    className={`w-full pl-10 pr-4 py-3 bg-white/[0.04] focus:bg-white/[0.06] border rounded-2xl text-sm text-white placeholder-zinc-500 focus:outline-hidden transition-all ${
                      conflictInfo.isConflict 
                        ? 'border-[#E8C78A]/60 focus:border-[#E8C78A] focus:ring-1 focus:ring-[#E8C78A]/20' 
                        : 'border-white/[0.1] focus:border-white/30 focus:ring-1 focus:ring-white/10'
                    }`}
                  />
                </div>
              </div>

              {/* Cross-Account Reviewer Conflict Alert Banner */}
              {conflictInfo.isConflict && (
                <div className="p-3.5 bg-[#E8C78A]/[0.08] border border-[#E8C78A]/30 rounded-2xl flex items-start gap-3 text-xs text-zinc-200 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-[#E8C78A] shrink-0 mt-0.5" />
                  <div className="space-y-0.5 leading-relaxed">
                    <span className="font-bold text-[#E8C78A] block">Reviewer Account Detected</span>
                    <p className="text-[11.5px] text-zinc-300">{conflictInfo.reason}</p>
                  </div>
                </div>
              )}

              {/* General Error Message from API */}
              {errorMessage && !conflictInfo.isConflict && (
                <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-2xl flex items-start gap-2.5 text-xs text-red-200 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="flex-1 leading-relaxed text-[11.5px]">{errorMessage}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                id="btn-business-continue-magic-link"
                disabled={isLoading || !email || conflictInfo.isConflict}
                className="w-full py-3.5 bg-white hover:bg-zinc-200 disabled:bg-white/[0.08] disabled:text-zinc-300/75 disabled:border disabled:border-white/[0.12] disabled:cursor-not-allowed text-zinc-950 rounded-full text-sm font-semibold shadow-lg shadow-black/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>{t("common.loading", "Sending code...")}</span>
                  </>
                ) : (
                  <>
                    <span>{t("businessAuth.continueMagicLink", "Continue with Magic Link")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: 6-DIGIT CODE VERIFICATION */}
          {step === 'code' && (
            <div className="space-y-5 animate-in fade-in" id="container-business-otp-verification">
              <div className="text-center space-y-1">
                <h2 className="text-base font-bold text-white">
                  {initialMode === 'claim' ? t("businessAuth.verifyOwnership", "Verify Ownership") : t("businessAuth.checkInbox", "Enter 6-Digit Code")}
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {t("businessAuth.codeSentTo", "We sent an official confirmation code to")}{' '}
                  <strong className="text-white font-semibold break-all">{email}</strong>
                </p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); verifyCode(otpDigits.join('')); }} className="space-y-4">
                <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { inputRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="w-10 sm:w-12 h-12 sm:h-13 text-center text-xl font-mono font-bold bg-white/[0.04] focus:bg-white/[0.08] border border-white/[0.1] focus:border-white focus:ring-1 focus:ring-white/20 rounded-xl text-white focus:outline-hidden transition-all"
                    />
                  ))}
                </div>

                {errorMessage && (
                  <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-2xl flex items-center gap-2 text-xs text-red-200">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="text-[11.5px]">{errorMessage}</span>
                  </div>
                )}

                {/* Resend Code Link */}
                <div className="flex items-center justify-center text-xs text-zinc-300">
                  {resendCooldown > 0 ? (
                    <span className="text-zinc-400 font-medium">
                      Resend code in {resendCooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      id="btn-resend-business-code"
                      onClick={() => doSendMagicLink(email.trim().toLowerCase(), selectedPlace)}
                      disabled={isLoading}
                      className="text-zinc-200 hover:text-white font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{t("businessAuth.resendCode", "Resend verification code")}</span>
                    </button>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    id="btn-business-back-to-email"
                    onClick={() => { setStep('email'); setErrorMessage(null); }}
                    className="px-4 py-3 bg-white/[0.06] hover:bg-white/[0.12] text-white rounded-full text-xs font-semibold transition-colors cursor-pointer border border-white/[0.1]"
                  >
                    {t("common.back", "Back")}
                  </button>

                  <button
                    type="submit"
                    id="btn-business-verify-code-submit"
                    disabled={isLoading || otpDigits.some(d => !d)}
                    className="flex-1 py-3 bg-white hover:bg-zinc-200 disabled:bg-white/[0.06] disabled:text-zinc-500 text-zinc-950 rounded-full text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t("businessAuth.verifying", "Verifying...")}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{t("businessAuth.verifyCode", "Verify & Access Dashboard")}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

      </main>
    </div>
  );
};
