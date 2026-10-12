import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Mail, 
  ShieldCheck, 
  ArrowRight, 
  Check, 
  Loader2, 
  X, 
  Sparkles, 
  AlertCircle,
  Globe
} from "lucide-react";
import { Place } from "../types";
import { useSwipeDownToDismiss } from "../hooks/useSwipeDownToDismiss";
import { useLanguage } from "../i18n/LanguageContext";
import { derivePlaceFromEmailOrDomain } from "../utils/businessDomainUtils";

export interface BusinessSession {
  businessEmail: string;
  placeId: string;
  placeName: string;
  domain?: string;
  logoUrl?: string;
  bannerUrl?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  category?: string;
  verifiedAt: string;
  role: 'business_owner';
  verificationMethod: 'business_email_code';
  token: string;
}

interface CopoBusinessClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  places?: Place[];
  selectedPlace?: Place | null;
  onSuccess: (session: BusinessSession) => void;
}

export const CopoBusinessClaimModal: React.FC<CopoBusinessClaimModalProps> = ({
  isOpen,
  onClose,
  places = [],
  selectedPlace = null,
  onSuccess
}) => {
  const { t } = useLanguage();
  
  // Selected place for claim
  const [targetPlace, setTargetPlace] = useState<Partial<Place>>(() => {
    if (selectedPlace) return selectedPlace;
    if (places.length > 0) return places[0];
    return derivePlaceFromEmailOrDomain('yoouz.com', places);
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showPlaceSearch, setShowPlaceSearch] = useState(false);

  // Email OTP Code State (Resend API)
  const [businessEmail, setBusinessEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Sync selectedPlace if prop changes
  useEffect(() => {
    if (selectedPlace) {
      setTargetPlace(selectedPlace);
      if (selectedPlace.email && !businessEmail) {
        setBusinessEmail(selectedPlace.email);
      }
    }
  }, [selectedPlace]);

  if (!isOpen) return null;

  // 1. Send 6-Digit Code via Resend API
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessEmail || !businessEmail.includes('@')) {
      setEmailError('Please enter a valid official business email address.');
      return;
    }

    setIsSendingEmail(true);
    setEmailError(null);

    try {
      const response = await fetch('/api/business/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: businessEmail.trim(),
          placeId: targetPlace.id,
          placeName: targetPlace.name,
          website: targetPlace.website,
          host: window.location.host
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setEmailSentSuccess(true);
      } else {
        setEmailError(data.error || 'Failed to dispatch verification code.');
      }
    } catch (err: any) {
      setEmailError('Network error. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // 2. Verify 6-digit OTP code
  const handleVerifyCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpCode || otpCode.trim().length < 6) {
      setEmailError('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsVerifyingCode(true);
    setEmailError(null);

    try {
      const response = await fetch('/api/business/verify-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: businessEmail.trim(),
          code: otpCode.trim(),
          placeId: targetPlace.id
        })
      });

      const data = await response.json();
      if (response.ok && data.success && data.session) {
        // Save verified session
        localStorage.setItem('copo_business_verified_session', JSON.stringify(data.session));
        
        // Add to claimed places
        try {
          const raw = localStorage.getItem('copo_claimed_places') || '[]';
          const list = JSON.parse(raw);
          if (!list.includes(targetPlace.id)) {
            list.push(targetPlace.id);
            localStorage.setItem('copo_claimed_places', JSON.stringify(list));
          }
        } catch (e) {}

        window.dispatchEvent(new CustomEvent('copo_business_auth_changed', { detail: data.session }));
        onSuccess(data.session);
        onClose();
      } else {
        setEmailError(data.error || 'Invalid or expired code. Please try again.');
      }
    } catch (err: any) {
      setEmailError('Verification error. Please try again.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const filteredPlaces = React.useMemo(() => {
    if (!isOpen || !places || !Array.isArray(places)) return [];
    const query = (searchQuery || "").toLowerCase().trim();
    if (!query) return places;
    return places.filter(p => {
      if (!p) return false;
      const name = (p.name || "").toLowerCase();
      const address = (p.address || "").toLowerCase();
      const city = (p.city || "").toLowerCase();
      const domain = (p.brandDomain || "").toLowerCase();
      return name.includes(query) || address.includes(query) || city.includes(query) || domain.includes(query);
    });
  }, [isOpen, places, searchQuery]);

  const { swipeProps, dragOffsetY } = useSwipeDownToDismiss({
    onDismiss: onClose,
    threshold: 60
  });

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in copo-business-claim-modal select-none sm:select-auto"
      onClick={onClose}
    >
      <div 
        style={{
          transform: dragOffsetY > 0 ? `translateY(${dragOffsetY}px)` : undefined,
          transition: dragOffsetY === 0 ? "transform 0.2s ease-out" : "none"
        }}
        className="bg-zinc-900 rounded-none sm:rounded-[2.5rem] max-w-lg w-full h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[85vh] shadow-2xl border-0 sm:border border-zinc-800 overflow-hidden flex flex-col my-0 sm:my-auto relative animate-in slide-in-from-bottom sm:zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Drag Indicator Pill for Mobile */}
        <div 
          className="h-8 flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing sm:hidden touch-none"
          {...swipeProps}
        >
          <div className="w-12 h-1.5 rounded-full bg-zinc-700" />
        </div>

        {/* Top Header */}
        <div 
          className="px-6 pt-3 sm:pt-6 pb-5 border-b border-zinc-800 flex items-start justify-between shrink-0 touch-pan-y"
          {...swipeProps}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-white flex items-center justify-center shadow-md shrink-0 border border-zinc-700">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white tracking-tight">
                  Claim & Verify Business
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[9px] font-bold text-zinc-300 uppercase tracking-widest border border-zinc-700">
                  Secure Owner Access
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                Verify ownership via business email matching website domain.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hidden sm:flex items-center justify-center transition-colors cursor-pointer border border-zinc-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Target Business Selection Card */}
          <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3.5 truncate">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 text-white flex items-center justify-center font-black text-sm shrink-0">
                {targetPlace.name?.charAt(0) || 'B'}
              </div>
              <div className="truncate space-y-0.5">
                <div className="font-black text-xs text-white flex items-center gap-1.5 truncate uppercase tracking-wide">
                  <span>{targetPlace.name}</span>
                  <ShieldCheck className="w-4 h-4 text-white shrink-0" />
                </div>
                <div className="text-[11px] text-zinc-400 truncate font-medium">
                  {targetPlace.website || targetPlace.address || "Verified Business Venue"}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowPlaceSearch(!showPlaceSearch)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl border border-zinc-700 transition-colors shrink-0 cursor-pointer"
            >
              {showPlaceSearch ? "Cancel" : "Switch"}
            </button>
          </div>

          {/* Place Search Dropdown if switched */}
          {showPlaceSearch && (
            <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-lg space-y-2 animate-in fade-in">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search venue name or address..."
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-zinc-500 font-medium"
              />
              <div className="max-h-40 overflow-y-auto space-y-1">
                {filteredPlaces.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setTargetPlace(p);
                      setShowPlaceSearch(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-zinc-800 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="truncate">
                      <span className="font-bold text-white block truncate">{p.name}</span>
                      <span className="text-[10px] text-zinc-400 block truncate">{p.address}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 1-Step Email & 6-Digit Code Verification Flow */}
          {!emailSentSuccess ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-300">
                  Official Business Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    placeholder="e.g. owner@firststrikeelectrical.co.uk"
                    className="w-full pl-10 pr-4 py-3 bg-zinc-950 focus:bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-zinc-500 font-medium"
                  />
                </div>
                <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                  Enter the email address associated with <strong className="text-white">{targetPlace.name}</strong> to receive a secure 6-digit verification code.
                </p>
              </div>

              {emailError && (
                <div className="p-3 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center gap-2 text-xs text-zinc-200 font-medium">
                  <AlertCircle className="w-4 h-4 text-white shrink-0" />
                  <span>{emailError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSendingEmail || !businessEmail}
                className="w-full py-3.5 bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>Sending verification code...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-zinc-950" />
                    <span>Send 6-Digit Verification Code</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Step 2: Enter 6-digit code */
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-wider">
                  <Check className="w-4 h-4 text-white" />
                  <span>Verification Code Dispatched</span>
                </div>
                <p className="text-[11.5px] text-zinc-400 font-medium leading-relaxed">
                  We sent a secure 6-digit code to <strong className="text-white">{businessEmail}</strong>. Enter the code below to claim and unlock your business portal.
                </p>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-300">
                      6-Digit Code
                    </label>
                    <span className="text-[11px] text-zinc-400 font-mono font-bold">
                      {otpCode.length}/6
                    </span>
                  </div>

                  {/* Interactive 6-Cell OTP Input */}
                  <div className="relative group my-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="one-time-code"
                      maxLength={6}
                      autoFocus
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer caret-transparent"
                    />

                    <div className="grid grid-cols-6 gap-2 w-full">
                      {[0, 1, 2, 3, 4, 5].map((index) => {
                        const char = otpCode[index];
                        const isFilled = Boolean(char);
                        const isFocused = otpCode.length === index;

                        return (
                          <div
                            key={index}
                            className={`h-12 rounded-xl flex items-center justify-center font-mono text-lg font-bold transition-all select-none ${
                              isFilled
                                ? "bg-zinc-800 text-white border-2 border-white"
                                : isFocused
                                ? "bg-zinc-900 text-white border-2 border-zinc-400 ring-2 ring-white/10"
                                : "bg-zinc-950 text-zinc-600 border border-zinc-800"
                            }`}
                          >
                            {isFilled ? (
                              char
                            ) : isFocused ? (
                              <span className="animate-pulse text-white font-normal">|</span>
                            ) : (
                              <span className="text-zinc-600 font-light text-sm">·</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {emailError && (
                  <div className="p-3 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center gap-2 text-xs text-zinc-200 font-medium">
                    <AlertCircle className="w-4 h-4 text-white shrink-0" />
                    <span>{emailError}</span>
                  </div>
                )}

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setEmailSentSuccess(false)}
                    className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-zinc-700"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifyingCode || otpCode.length < 6}
                    className="flex-1 py-3 bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isVerifyingCode ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                        <span>Verifying & Claiming...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-zinc-950" />
                        <span>Verify & Claim Business</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
