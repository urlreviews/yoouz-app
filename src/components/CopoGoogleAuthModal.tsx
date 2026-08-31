import React, { useEffect, useState, useRef } from "react";
import { Loader2, X, AlertCircle, HelpCircle, Mail, ArrowRight, CheckCircle2, User, Sparkles, MapPin } from "lucide-react";
import { generateGoogleLetterAvatarSvg, getAvatarColor, getFirstLetter } from "../lib/avatar";
import { CountrySelector } from "./CountrySelector";
import { SearchableComboSelector } from "./SearchableComboSelector";
import { locationData } from "../utils/locationData";
import { Country, State, City } from "country-state-city";

export type AuthIntent = 
  | 'general' 
  | 'record' 
  | 'following' 
  | 'messages' 
  | 'notifications' 
  | 'bookmarks' 
  | 'profile' 
  | 'comment'
  | 'like'
  | 'claim';

export interface CopoGoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userData: { name: string; email: string; avatar: string; uid?: string; firstName?: string; lastName?: string; city?: string; country?: string }) => void;
  intent?: AuthIntent | string;
  customTitle?: string;
  customSubtitle?: string;
  onOpenHelp?: () => void;
  onOpenLegal?: (tab: 'terms' | 'privacy') => void;
}

export const getAuthContextCopy = (intent?: string, customTitle?: string, customSubtitle?: string) => {
  if (customTitle && customSubtitle) {
    return { title: customTitle, subtitle: customSubtitle };
  }
  
  switch (intent) {
    case 'record':
      return {
        title: customTitle || "Sign in to Record",
        subtitle: customSubtitle || "Sign in to record and share your 60-second video review."
      };
    case 'following':
      return {
        title: customTitle || "Sign in to Yoouz",
        subtitle: customSubtitle || "Sign in to follow creators and stay updated on top places."
      };
    case 'messages':
      return {
        title: customTitle || "Sign in to Yoouz",
        subtitle: customSubtitle || "Sign in to message reviewers and verified businesses."
      };
    case 'notifications':
      return {
        title: customTitle || "Sign in to Yoouz",
        subtitle: customSubtitle || "Sign in to view your activity and notifications."
      };
    case 'bookmarks':
      return {
        title: customTitle || "Sign in to Yoouz",
        subtitle: customSubtitle || "Sign in to save and access your favorite places."
      };
    case 'profile':
      return {
        title: customTitle || "Sign in to Yoouz",
        subtitle: customSubtitle || "Sign in to manage your account and video reviews."
      };
    case 'comment':
    case 'like':
      return {
        title: customTitle || "Sign in to Yoouz",
        subtitle: customSubtitle || "Sign in to join the conversation and interact."
      };
    case 'claim':
      return {
        title: customTitle || "Business Sign in",
        subtitle: customSubtitle || "Sign in to verify and manage your official business."
      };
    default:
      return {
        title: customTitle || "Sign in to Yoouz",
        subtitle: customSubtitle || "Enter your email to sign in or create an account."
      };
  }
};

/**
 * Reusable Auth Form / Card with Email-First Flow & Pure Dark Mode
 */
export const CopoAuthPrompt: React.FC<{
  intent?: AuthIntent | string;
  customTitle?: string;
  customSubtitle?: string;
  onSuccess?: (userData: { name: string; email: string; avatar: string; uid?: string; firstName?: string; lastName?: string; city?: string; country?: string }) => void;
  onOpenHelp?: () => void;
  onOpenLegal?: (tab: 'terms' | 'privacy') => void;
  isFullPage?: boolean;
}> = ({
  intent = "general",
  customTitle,
  customSubtitle,
  onSuccess,
  onOpenHelp,
  onOpenLegal,
  isFullPage = false
}) => {
  // Steps: 'email' -> 'code' -> 'profile' (if new user)
  const [step, setStep] = useState<'email' | 'code' | 'profile'>('email');
  const [email, setEmail] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [stateRegion, setStateRegion] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [tempUser, setTempUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const copy = getAuthContextCopy(intent, customTitle, customSubtitle);

  // STEP 1: Send Magic Link / OTP via Email only
  const handleSendMagicLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          host: window.location.host
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to send magic link");
      }

      setStep('code');
    } catch (err: any) {
      setErrorMessage(err.message || "Could not dispatch sign-in email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Verify Code
  const handleVerifyCode = async (e?: React.FormEvent, explicitCode?: string) => {
    if (e) e.preventDefault();
    const cleanCode = (explicitCode || otpCode).trim();
    if (!cleanCode || cleanCode.length < 6) {
      setErrorMessage("Please enter the complete 6-digit confirmation code.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/verify-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: cleanCode
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Invalid code. Please check your inbox and try again.");
      }

      const returnedUser = data.user;
      setTempUser(returnedUser);

      // If existing user already has a saved name, log in immediately
      if (returnedUser && !returnedUser.isNewUser && returnedUser.name && !returnedUser.name.includes('@')) {
        completeLogin(returnedUser);
      } else {
        // New user or missing profile details -> proceed to Step 3 (Profile Setup)
        if (returnedUser?.firstName) setFirstName(returnedUser.firstName);
        if (returnedUser?.lastName) setLastName(returnedUser.lastName);
        if (returnedUser?.city) setCity(returnedUser.city);
        if (returnedUser?.country) setCountry(returnedUser.country || "");
        setStep('profile');
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Verification failed. Please check the code.");
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3: Complete Profile & Persist
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!country.trim()) {
      setErrorMessage("Please select your country to continue.");
      return;
    }
    
    setIsLoading(true);
    setErrorMessage("");

    const fName = firstName.trim() || email.split('@')[0];
    const lName = lastName.trim();
    const fullName = lName ? `${fName} ${lName}` : fName;
    const finalCity = city.trim();
    const finalState = stateRegion.trim();
    const finalCountry = country.trim();
    const locParts = [finalCity, finalState, finalCountry].filter(Boolean);
    const combinedLocation = locParts.join(", ");

    const avatarSvg = generateGoogleLetterAvatarSvg(fName || email.split("@")[0] || "Y", 128, email);

    const updatedUser = {
      uid: tempUser?.uid || `usr_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
      id: tempUser?.uid || `usr_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
      email: email.trim().toLowerCase(),
      name: fullName,
      firstName: fName,
      lastName: lName,
      city: finalCity,
      country: finalCountry,
      location: combinedLocation,
      avatar: tempUser?.avatar || avatarSvg,
      role: 'user',
      verifiedAt: new Date().toISOString()
    };

    try {
      await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser)
      });
    } catch (saveErr) {
      console.warn("Profile update warning:", saveErr);
    } finally {
      setIsLoading(false);
      completeLogin(updatedUser);
    }
  };

  const completeLogin = (userObj: any) => {
    try {
      localStorage.setItem("copo_user", JSON.stringify(userObj));
      localStorage.setItem("copo_user_profile", JSON.stringify(userObj));
      window.dispatchEvent(new CustomEvent("copo_auth_changed", { detail: userObj }));
      window.dispatchEvent(new Event("user_logged_in"));
      window.dispatchEvent(new Event("storage"));
    } catch {}

    if (onSuccess) {
      onSuccess(userObj);
    }
  };

  const hasName = firstName && firstName.trim().length > 0;
  const seedName = hasName ? firstName.trim() : 'User';
  const previewLetter = hasName ? getFirstLetter(seedName) : '';
  const previewColor = hasName ? getAvatarColor(seedName) : { bg: '#27272a', text: '#ffffff' };

  return (
    <div className={`w-full ${isFullPage ? "min-h-full flex flex-col justify-between" : "flex flex-col items-center"} p-4 sm:p-7 select-none bg-[#09090b] text-white`}>
      {isFullPage && onOpenHelp && (
        <div className="w-full flex items-center justify-end py-2 mb-4">
          <button
            onClick={onOpenHelp}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-full hover:bg-white/[0.04]"
          >
            <HelpCircle className="w-4 h-4 text-zinc-400" />
            <span>Help</span>
          </button>
        </div>
      )}

      <div className="w-full max-w-sm mx-auto my-auto flex flex-col items-center text-center space-y-5 py-2">
        
        {/* Step-Aware Brand / Profile Icon */}
        {step === 'profile' ? (
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-zinc-900 border border-zinc-800 shadow-xl">
            <User className="w-6 h-6 text-zinc-400" />
          </div>
        ) : (
          <div className="relative flex items-center justify-center w-13 h-13 rounded-2xl bg-white shadow-[0_4px_24px_rgba(255,255,255,0.18)] border border-white/20">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-zinc-950">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        )}

        <div className="space-y-1.5 max-w-xs">
          <h1 className="text-[22px] sm:text-2xl font-bold text-white tracking-tight font-['Google_Sans',sans-serif] leading-tight">
            {step === 'code' ? 'Check your email' : step === 'profile' ? 'Complete your profile' : copy.title}
          </h1>
          <p className="text-[13px] text-zinc-400 font-normal leading-relaxed">
            {step === 'code' 
              ? `We sent a 6-digit confirmation code to ${email}`
              : step === 'profile'
                ? "Enter your name and location for verified reviews."
                : copy.subtitle}
          </p>
        </div>

        {/* STEP 1: Email Only Form */}
        {step === 'email' && (
          <form onSubmit={handleSendMagicLink} className="w-full space-y-3.5 pt-1 text-left">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5 tracking-wider uppercase">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-12 pl-10 pr-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all"
                />
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-4" />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-950/40 text-red-400 text-xs rounded-xl border border-red-900/40 text-center flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email.includes('@')}
              className="w-full h-12 rounded-xl bg-white hover:bg-zinc-200 active:bg-zinc-300 text-black font-bold text-[14.5px] shadow-lg shadow-white/5 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-black" />
              ) : (
                <>
                  <span>Continue with Email</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Enter 6-Digit Code */}
        {step === 'code' && (
          <form onSubmit={handleVerifyCode} className="w-full max-w-sm space-y-4 pt-1 text-left">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-semibold text-zinc-400 tracking-wider uppercase">
                  6-Digit Verification Code
                </label>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {otpCode.length}/6 digits
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
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtpCode(cleanVal);
                    if (cleanVal.length === 6) {
                      handleVerifyCode(undefined, cleanVal);
                    }
                  }}
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
                        className={`h-13 rounded-xl flex items-center justify-center font-mono text-xl font-bold transition-all select-none ${
                          isFilled
                            ? "bg-zinc-800/90 text-white border-2 border-white/80 shadow-md shadow-white/5"
                            : isFocused
                            ? "bg-zinc-900 text-zinc-300 border-2 border-zinc-400 ring-2 ring-white/10"
                            : "bg-zinc-900/90 text-zinc-600 border border-zinc-800"
                        }`}
                      >
                        {isFilled ? (
                          char
                        ) : isFocused ? (
                          <span className="animate-pulse text-zinc-400 font-normal">|</span>
                        ) : (
                          <span className="text-zinc-600 font-light text-base">·</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-950/40 text-red-400 text-xs rounded-xl border border-red-900/40 text-center flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || otpCode.length < 6}
              className="w-full h-12 rounded-xl bg-white hover:bg-zinc-200 active:bg-zinc-300 text-black font-bold text-[14.5px] shadow-lg shadow-white/5 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-black" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-black" />
                  <span>Verify Code</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
              <button
                type="button"
                onClick={() => { setStep('email'); setErrorMessage(''); }}
                className="text-zinc-400 hover:text-white underline cursor-pointer"
              >
                ← Change Email
              </button>
              <button
                type="button"
                onClick={() => handleSendMagicLink()}
                disabled={isLoading}
                className="text-zinc-300 hover:text-white underline cursor-pointer"
              >
                Resend Code
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Profile Setup (First Name, Last Name, City, Country) */}
        {step === 'profile' && (
          <form onSubmit={(e) => handleSaveProfile(e)} className="w-full max-w-sm space-y-3.5 pt-1 text-left">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1 tracking-wider uppercase">
                  First Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Alex"
                  className="w-full h-11 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1 tracking-wider uppercase">
                  Last Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Taylor"
                  className="w-full h-11 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1 tracking-wider uppercase">
                Country <span className="text-red-400">*</span>
              </label>
              <CountrySelector
                value={country}
                onChange={(c) => {
                  setCountry(c);
                  setCity("");
                  setStateRegion("");
                }}
              />
            </div>

            {country && (() => {
              const selectedCountryObj = Country.getAllCountries().find(c => c.name === country);
              const isoCode = selectedCountryObj?.isoCode || "";
              
              const statesObj = State.getStatesOfCountry(isoCode);
              const hasStates = statesObj.length > 0;
              const stateOptions = statesObj.map(s => s.name);
              const stateLabel = "Region / Province";
              
              let cityOptions: string[] = [];
              if (stateRegion) {
                const selectedState = statesObj.find(s => s.name === stateRegion);
                if (selectedState) {
                   const stateCities = City.getCitiesOfState(isoCode, selectedState.isoCode).map(c => c.name);
                   cityOptions = stateCities.length > 0 ? stateCities : (City.getCitiesOfCountry(isoCode)?.map(c => c.name) || []);
                } else {
                   cityOptions = City.getCitiesOfCountry(isoCode)?.map(c => c.name) || [];
                }
              } else {
                cityOptions = City.getCitiesOfCountry(isoCode)?.map(c => c.name) || [];
              }
              const uniqueCityOptions = Array.from(new Set(cityOptions));

              return (
                <div className="grid grid-cols-2 gap-3 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  {hasStates ? (
                    <>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide pl-1 block">{stateLabel}</span>
                        <SearchableComboSelector
                          value={stateRegion}
                          onChange={(val) => {
                            setStateRegion(val);
                            setCity("");
                          }}
                          options={stateOptions}
                          placeholder={stateLabel}
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide pl-1 block">City</span>
                        <SearchableComboSelector
                          value={city}
                          onChange={setCity}
                          options={uniqueCityOptions}
                          placeholder="Select City"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2 space-y-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide pl-1 block">City</span>
                      <SearchableComboSelector
                        value={city}
                        onChange={setCity}
                        options={uniqueCityOptions}
                        placeholder="Select City"
                      />
                    </div>
                  )}
                </div>
              );
            })()}

            {errorMessage && (
              <div className="p-3 bg-red-950/40 text-red-400 text-xs rounded-xl border border-red-900/40 text-center flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !firstName.trim()}
              className="w-full h-12 rounded-xl bg-white hover:bg-zinc-200 active:bg-zinc-300 text-black font-bold text-[14.5px] shadow-lg shadow-white/5 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-black" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-black" />
                  <span>Complete Profile & Enter</span>
                </>
              )}
            </button>
          </form>
        )}

        <p className="text-[11.5px] text-zinc-500 font-normal leading-relaxed max-w-xs mx-auto">
          By continuing, you agree to Yoouz's{" "}
          <button
            type="button"
            onClick={() => onOpenLegal ? onOpenLegal('terms') : null}
            className="font-semibold text-zinc-400 hover:text-white underline decoration-zinc-600 underline-offset-2 cursor-pointer inline bg-transparent p-0 border-none"
          >
            Terms of Service
          </button>{" "}
          and{" "}
          <button
            type="button"
            onClick={() => onOpenLegal ? onOpenLegal('privacy') : null}
            className="font-semibold text-zinc-400 hover:text-white underline decoration-zinc-600 underline-offset-2 cursor-pointer inline bg-transparent p-0 border-none"
          >
            Privacy Policy
          </button>
          .
        </p>
      </div>

      {isFullPage && (
        <div className="w-full pt-6 pb-2 text-center text-[12px] text-zinc-500 font-medium">
          © 2026 Yoouz. Real People. Real Reviews.
        </div>
      )}
    </div>
  );
};

export const CopoGoogleAuthModal: React.FC<CopoGoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  intent = "general",
  customTitle,
  customSubtitle,
  onOpenHelp,
  onOpenLegal
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-[440px] bg-[#09090b] rounded-[28px] shadow-2xl border border-white/[0.08] text-white flex flex-col relative animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header with Close and Help */}
        <div className="flex items-center justify-between px-5 pt-4 pb-1">
          <div className="flex items-center">
            {onOpenHelp ? (
              <button
                onClick={() => {
                  onClose();
                  onOpenHelp();
                }}
                className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-400 hover:text-white transition-colors px-2.5 py-1 rounded-full hover:bg-white/[0.06] cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
                <span>Help</span>
              </button>
            ) : <div />}
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-2 sm:p-4">
          <CopoAuthPrompt
            intent={intent}
            customTitle={customTitle}
            customSubtitle={customSubtitle}
            onSuccess={(user) => {
              onSuccess(user);
              onClose();
            }}
            onOpenHelp={() => {
              onClose();
              if (onOpenHelp) onOpenHelp();
            }}
            onOpenLegal={onOpenLegal}
            isFullPage={false}
          />
        </div>
      </div>
    </div>
  );
};
