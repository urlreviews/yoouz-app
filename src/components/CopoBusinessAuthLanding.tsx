import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Mail, 
  Check, 
  Loader2, 
  Sparkles, 
  AlertCircle, 
  ArrowLeft, 
  ChevronRight, 
  ArrowRight, 
  ShieldCheck, 
  Code, 
  QrCode,
  Copy,
  Globe,
  Search,
  ExternalLink
} from 'lucide-react';
import { Place, NavSection } from '../types';
import { BusinessSession } from './CopoBusinessClaimModal';
import { useLanguage } from '../i18n/LanguageContext';

interface CopoBusinessAuthLandingProps {
  onNavigate: (section: NavSection) => void;
  places: Place[];
  onSuccessAuth: (session: BusinessSession) => void;
  initialPlace?: Place | null;
  initialMode?: 'signin' | 'claim' | 'demo';
  onCancelSelectedPlace?: () => void;
}

export const CopoBusinessAuthLanding: React.FC<CopoBusinessAuthLandingProps> = ({
  onNavigate,
  places,
  onSuccessAuth,
  initialPlace = null,
  initialMode = 'signin',
  onCancelSelectedPlace,
}) => {
  const { t } = useLanguage();
  // Verification method: Email magic link vs HTML Code Tag
  const [authMethod, setAuthMethod] = useState<'email' | 'html_tag'>('email');

  // State
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(initialPlace || null);

  // HTML Meta Tag State
  const [websiteUrl, setWebsiteUrl] = useState<string>(initialPlace?.website || '');
  const [copiedTag, setCopiedTag] = useState(false);
  const [tagSuccess, setTagSuccess] = useState(false);
  const [placeSearchTerm, setPlaceSearchTerm] = useState('');
  const [isSearchingPlace, setIsSearchingPlace] = useState(false);

  useEffect(() => {
    setSelectedPlace(initialPlace || null);
    if (initialPlace?.website) {
      setWebsiteUrl(initialPlace.website);
    }
  }, [initialPlace]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // 6-Digit Code State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Filtered places for HTML tag claiming
  const filteredPlaces = places.filter(p => 
    p.name.toLowerCase().includes(placeSearchTerm.toLowerCase()) || 
    p.address.toLowerCase().includes(placeSearchTerm.toLowerCase()) ||
    (p.website && p.website.toLowerCase().includes(placeSearchTerm.toLowerCase()))
  );

  // Auto-detect matching place by email domain
  const findMatchingPlaceForEmail = (emailStr: string): Place | null => {
    const domain = emailStr.split('@')[1]?.toLowerCase().trim();
    if (!domain) return null;

    // Check if domain matches any place website or name
    const cleanDomain = domain.replace(/^www\./, '');
    const found = places.find(p => {
      if (p.website) {
        const pDom = p.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
        if (pDom.includes(cleanDomain) || cleanDomain.includes(pDom)) return true;
      }
      const pNameSlug = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const domSlug = cleanDomain.split('.')[0];
      if (pNameSlug && domSlug && (pNameSlug.includes(domSlug) || domSlug.includes(pNameSlug))) return true;
      return false;
    });

    return found || null;
  };

  // Auto-verify Magic Link if token exists in URL
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

  // Handle Digit Changes
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
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
      } else {
        setErrorMessage(data.error || 'Failed to send verification code. Please try again.');
      }
    } catch (err) {
      setErrorMessage('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Email (Step 1)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid work email.');
      return;
    }

    setErrorMessage(null);

    // Auto-detect business
    let matched = selectedPlace || findMatchingPlaceForEmail(cleanEmail);
    
    // If not matched, show error with option to verify via HTML tag
    if (!matched) {
      setErrorMessage('Email domain does not match a listed venue. Select your business below or use the HTML Code Tag method to verify domain ownership.');
      return;
    }

    setSelectedPlace(matched);
    await doSendMagicLink(cleanEmail, matched);
  };

  // Verify Code (Step 2)
  const verifyCode = async (codeToVerify: string) => {
    if (!codeToVerify || codeToVerify.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit code.');
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
        
        // Save to claimed places list
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

  // HTML Meta Tag Verification Handler
  const currentExpectedTag = `<meta name="yoouz-verification" content="verify_${selectedPlace?.id || 'business'}" />`;

  const handleVerifyWebsiteTag = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const url = websiteUrl.trim() || selectedPlace?.website;
    if (!url) {
      setErrorMessage('Please specify your official website URL.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setTagSuccess(false);

    try {
      const response = await fetch('/api/business/verify-website-tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: selectedPlace?.id || 'place-custom',
          placeName: selectedPlace?.name || 'Verified Venue',
          website: url,
          expectedTag: `verify_${selectedPlace?.id || 'business'}`,
          userEmail: email.trim() || undefined
        })
      });

      const data = await response.json();
      if (response.ok && data.verified && data.session) {
        setTagSuccess(true);
        localStorage.setItem('copo_business_verified_session', JSON.stringify(data.session));

        // Save to claimed places list
        try {
          const raw = localStorage.getItem('copo_claimed_places') || '[]';
          const list = JSON.parse(raw);
          const pId = selectedPlace?.id || 'place-custom';
          if (!list.includes(pId)) {
            list.push(pId);
            localStorage.setItem('copo_claimed_places', JSON.stringify(list));
          }
        } catch (e) {}

        window.dispatchEvent(new CustomEvent('copo_business_auth_changed', { detail: data.session }));
        setTimeout(() => {
          onSuccessAuth(data.session);
        }, 1200);
      } else {
        setErrorMessage(data.message || 'Verification meta tag was not detected in your website homepage <head>.');
      }
    } catch (err: any) {
      setErrorMessage('Unable to reach your website server. Please verify the URL and ensure the tag is deployed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyTag = () => {
    navigator.clipboard.writeText(currentExpectedTag);
    setCopiedTag(true);
    setTimeout(() => setCopiedTag(false), 2000);
  };

  return (
    <div className="w-full h-full min-h-0 flex-1 overflow-y-auto bg-zinc-950 flex flex-col antialiased text-white selection:bg-zinc-800 selection:text-white copo-business-auth-landing">
      
      {/* 1. Refined Minimal Header */}
      <header className="w-full h-16 bg-zinc-900 border-b border-zinc-800 px-6 flex items-center justify-between shadow-2xs shrink-0 z-30">
        <div 
          onClick={() => {
            if (onCancelSelectedPlace) onCancelSelectedPlace();
            onNavigate('home');
          }}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-white text-zinc-950 shadow-sm group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-zinc-950">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg text-white font-['Google_Sans',sans-serif] tracking-tight">Yoouz</span>
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10.5px] font-bold uppercase tracking-wider border border-zinc-700">
              Business
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (onCancelSelectedPlace) onCancelSelectedPlace();
              onNavigate('home');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t("common.exit", "Exit")}</span>
          </button>
        </div>
      </header>

      {/* 2. Main Authentication Card */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-8 sm:py-12 pb-28 flex flex-col items-center justify-start shrink-0">
        
        {/* Header */}
        <div className="text-center w-full mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {t("businessAuth.title", "Sign in to Yoouz Business")}
          </h1>
          <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
            {t("businessAuth.subtitle", "Claim your business, respond to video reviews, and engage customers as the verified owner.")}
          </p>
        </div>

        {/* Card */}
        <div className="w-full bg-zinc-900 rounded-3xl border border-zinc-800 shadow-xl p-6 sm:p-8 transition-all">
          
          {/* METHOD SWITCHER TABS (Only in initial step) */}
          {step === 'email' && (
            <div className="flex bg-zinc-950 p-1 rounded-2xl border border-zinc-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('email');
                  setErrorMessage(null);
                  setTagSuccess(false);
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  authMethod === 'email'
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Mail className="w-4 h-4 text-zinc-300" />
                <span>{t("businessAuth.workEmail", "Work Email")}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMethod('html_tag');
                  setErrorMessage(null);
                  setTagSuccess(false);
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  authMethod === 'html_tag'
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Code className="w-4 h-4 text-blue-400" />
                <span>{t("businessAuth.htmlTag", "HTML Code Tag")}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                  {t("businessAuth.instant", "Instant")}
                </span>
              </button>
            </div>
          )}

          {/* METHOD 1: EMAIL MAGIC LINK */}
          {authMethod === 'email' && step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  {t("businessAuth.workEmail", "Work Email")}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@yourcompany.com"
                    className="w-full pl-10 pr-4 py-3 bg-zinc-950 focus:bg-zinc-900 border border-zinc-750 rounded-xl text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-zinc-600 transition-all"
                  />
                </div>
              </div>

              {/* Selected venue indicator if picked */}
              {selectedPlace && (
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <span className="font-semibold text-zinc-200 block truncate">{selectedPlace.name}</span>
                    <span className="text-[11px] text-zinc-400 block truncate">{selectedPlace.address}</span>
                  </div>
                  <button
                    type="button"
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
                    className="text-zinc-400 text-xs font-semibold shrink-0 hover:text-white hover:underline cursor-pointer"
                  >
                    {t("common.change", "Change")}
                  </button>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-zinc-800 border border-zinc-700 rounded-xl flex items-start gap-2.5 text-xs text-zinc-300">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">
                    <p>{errorMessage}</p>
                    <button
                      type="button"
                      onClick={() => setAuthMethod('html_tag')}
                      className="mt-1.5 text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{t("businessAuth.switchToHtml", "Switch to HTML Code Tag verification")}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full py-3.5 bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t("common.loading", "Continuing...")}</span>
                  </>
                ) : (
                  <>
                    <span>{t("businessAuth.continueWithMagicLink", "Continue with Magic Link")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* METHOD 1 STEP 2: CODE VERIFICATION */}
          {authMethod === 'email' && step === 'code' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="text-center space-y-1">
                <h2 className="text-base font-bold text-white">{t("auth.checkEmailTitle", "Check your inbox")}</h2>
                <p className="text-xs text-zinc-400">
                  {t("auth.sentCodeTo", "We sent a 6-digit code to")} <strong className="text-zinc-200">{email}</strong>
                </p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); verifyCode(otpDigits.join('')); }} className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { inputRefs.current[idx] = el; }}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="w-10 sm:w-11 h-12 text-center text-xl font-mono font-bold bg-zinc-950 focus:bg-zinc-900 border border-zinc-750 rounded-xl text-white focus:outline-hidden transition-all"
                    />
                  ))}
                </div>

                {errorMessage && (
                  <div className="p-3 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center gap-2 text-xs text-zinc-300">
                    <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setStep('email'); setErrorMessage(null); }}
                    className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-zinc-700"
                  >
                    {t("common.back", "Back")}
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || otpDigits.some(d => !d)}
                    className="flex-1 py-3 bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t("auth.verifying", "Verifying...")}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{t("auth.verifyAndContinue", "Verify & Continue")}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* METHOD 2: HTML META TAG VERIFICATION */}
          {authMethod === 'html_tag' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Place Selection / Confirmation */}
              {!selectedPlace ? (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-zinc-300">
                    {t("businessAuth.selectBusiness", "Select Your Business")}
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={placeSearchTerm}
                      onChange={(e) => setPlaceSearchTerm(e.target.value)}
                      placeholder={t("businessAuth.searchPlaceholder", "Search business name or address...")}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-750 rounded-xl text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-zinc-600"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
                    {filteredPlaces.slice(0, 5).map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPlace(p);
                          if (p.website) setWebsiteUrl(p.website);
                          setErrorMessage(null);
                        }}
                        className="w-full p-2.5 rounded-lg text-left hover:bg-zinc-800 transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <div className="truncate pr-2">
                          <p className="text-xs font-bold text-zinc-200 group-hover:text-white truncate">{p.name}</p>
                          <p className="text-[10px] text-zinc-400 truncate">{p.address}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 shrink-0" />
                      </button>
                    ))}
                    {filteredPlaces.length === 0 && (
                      <p className="text-xs text-zinc-500 text-center py-4">{t("businessAuth.noMatching", "No matching business found")}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected Place Banner */}
                  <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3 truncate pr-2">
                      <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-750 flex items-center justify-center shrink-0 text-zinc-300">
                        <Building2 className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="truncate">
                        <h3 className="text-xs font-bold text-white truncate">{selectedPlace.name}</h3>
                        <p className="text-[11px] text-zinc-400 truncate">{selectedPlace.address}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlace(null);
                        setErrorMessage(null);
                      }}
                      className="text-zinc-400 text-xs font-semibold hover:text-white cursor-pointer px-2 py-1 rounded-md hover:bg-zinc-800"
                    >
                      {t("common.change", "Change")}
                    </button>
                  </div>

                  {/* Target Website URL */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center justify-between">
                      <span>{t("businessAuth.officialWebsiteUrl", "Official Website URL")}</span>
                      <span className="text-[10px] text-zinc-500 font-normal">{t("businessAuth.homepagePlacement", "Homepage where tag is placed")}</span>
                    </label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://yourwebsite.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-750 rounded-xl text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-zinc-600"
                      />
                    </div>
                  </div>

                  {/* HTML Tag Snippet */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                        <Code className="w-3.5 h-3.5 text-blue-400" />
                        <span>{t("businessAuth.addTagInstruction", "Add this 1-line tag to your HTML")}</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyTag}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold transition-colors cursor-pointer border border-zinc-700"
                      >
                        {copiedTag ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">{t("common.copied", "Copied!")}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>{t("businessAuth.copyTag", "Copy Tag")}</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-[11.5px] text-blue-300 break-all select-all leading-relaxed">
                      {currentExpectedTag}
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-relaxed pt-1">
                      {t("businessAuth.pasteInstruction", "Paste this tag into the <head> section of your website homepage (WordPress, Shopify, Wix, Squarespace, or custom code).")}
                    </p>
                  </div>

                  {tagSuccess && (
                    <div className="p-3.5 bg-emerald-950/50 border border-emerald-800/80 rounded-xl flex items-center gap-3 text-xs text-emerald-200 animate-in zoom-in-95">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold">{t("businessAuth.ownershipVerified", "Official Ownership Verified!")}</p>
                        <p className="text-[11px] text-emerald-300/80 mt-0.5">
                          {t("businessAuth.ownershipVerifiedDesc", "You can now manage your venue and reply to comments as the verified owner.")}
                        </p>
                      </div>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="p-3 bg-zinc-800 border border-zinc-700 rounded-xl flex items-start gap-2.5 text-xs text-zinc-300">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <p>{errorMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Verify Button */}
                  <button
                    type="button"
                    onClick={handleVerifyWebsiteTag}
                    disabled={isLoading || !websiteUrl}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t("businessAuth.checkingWebsite", "Checking Website Live...")}</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>{t("businessAuth.checkAndVerify", "Check Website & Verify Instantly")}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

      </main>
    </div>
  );
};
