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
  QrCode
} from 'lucide-react';
import { Place, NavSection } from '../types';
import { BusinessSession } from './CopoBusinessClaimModal';

interface CopoBusinessAuthLandingProps {
  onNavigate: (section: NavSection) => void;
  places: Place[];
  onSuccessAuth: (session: BusinessSession) => void;
  initialPlace?: Place | null;
  initialMode?: 'signin' | 'claim' | 'demo';
}

export const CopoBusinessAuthLanding: React.FC<CopoBusinessAuthLandingProps> = ({
  onNavigate,
  places,
  onSuccessAuth,
  initialPlace = null,
}) => {
  // State
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(initialPlace || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // 6-Digit Code State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
    
    // If not matched, show error
    if (!matched) {
      setErrorMessage('Your email domain does not match any known business. Please claim your business from its official Yoouz page.');
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
    <div className="w-full h-full min-h-0 flex-1 overflow-y-auto bg-zinc-950 flex flex-col antialiased text-white selection:bg-zinc-800 selection:text-white copo-business-auth-landing">
      
      {/* 1. Refined Minimal Header */}
      <header className="w-full h-16 bg-zinc-900 border-b border-zinc-800 px-6 flex items-center justify-between shadow-2xs shrink-0 z-30">
        <div 
          onClick={() => onNavigate('home')}
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
            onClick={() => onNavigate('home')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>
        </div>
      </header>

      {/* 2. Main Authentication Card */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-12 sm:py-16 pb-28 flex flex-col items-center justify-start shrink-0">
        
        {/* Header */}
        <div className="text-center w-full mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Sign in to Yoouz Business
          </h1>
          <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
            Manage your verified listing, video reviews, and customer engagement.
          </p>
        </div>

        {/* Card */}
        <div className="w-full bg-zinc-900 rounded-3xl border border-zinc-800 shadow-xl p-6 sm:p-8 transition-all">
          
          {/* STEP 1: EMAIL INPUT */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Work Email
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

              {/* Optional selected venue indicator if previously picked */}
              {selectedPlace && (
                <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <span className="font-semibold text-zinc-200 block truncate">{selectedPlace.name}</span>
                    <span className="text-[11px] text-zinc-400 block truncate">{selectedPlace.address}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlace(null);
                      setErrorMessage(null);
                    }}
                    className="text-white text-xs font-semibold shrink-0 hover:underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center gap-2 text-xs text-zinc-300">
                  <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>{errorMessage}</span>
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
                    <span>Continuing...</span>
                  </>
                ) : (
                  <>
                    <span>Continue with Magic Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: CODE VERIFICATION */}
          {step === 'code' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="text-center space-y-1">
                <h2 className="text-base font-bold text-white">Check your inbox</h2>
                <p className="text-xs text-zinc-400">
                  We sent a 6-digit code to <strong className="text-zinc-200">{email}</strong>
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
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || otpDigits.some(d => !d)}
                    className="flex-1 py-3 bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Verify & Continue</span>
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
