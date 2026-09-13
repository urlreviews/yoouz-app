import React, { useEffect, useState, useRef } from "react";
import { Loader2, X, AlertCircle, HelpCircle, Mail, ArrowRight, ArrowLeft, CheckCircle2, User, Sparkles, MapPin, Camera } from "lucide-react";
import { generateGoogleLetterAvatarSvg, getAvatarColor, getFirstLetter } from "../lib/avatar";
import { CountrySelector } from "./CountrySelector";
import { SearchableComboSelector } from "./SearchableComboSelector";
import { locationData } from "../utils/locationData";
import { KNOWN_COMMUNITY_USERS, unrecordDeletedUsersInLocalStorage } from "../utils/placeUtils";
import { Country, State, City } from "country-state-city";
import { useSwipeDownToDismiss } from "../hooks/useSwipeDownToDismiss";
import { useLanguage } from "../i18n/LanguageContext";
import { sendWelcomeNotificationForNewUser } from "../lib/socialSync";
import { UserProfile } from "../types";

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
  currentUser?: UserProfile | null;
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
  currentUser?: UserProfile | null;
  onSuccess?: (userData: { name: string; email: string; avatar: string; uid?: string; firstName?: string; lastName?: string; city?: string; country?: string }) => void;
  onOpenHelp?: () => void;
  onOpenLegal?: (tab: 'terms' | 'privacy') => void;
  isFullPage?: boolean;
  onStepChange?: (step: 'email' | 'code' | 'profile') => void;
  currentStep?: 'email' | 'code' | 'profile';
  onRequestBack?: () => void;
}> = ({
  intent = "general",
  customTitle,
  customSubtitle,
  currentUser,
  onSuccess,
  onOpenHelp,
  onOpenLegal,
  isFullPage = false,
  onStepChange,
  currentStep,
  onRequestBack
}) => {
  const { t } = useLanguage();

  const isProfileIncomplete = currentUser && (!currentUser.firstName || !currentUser.lastName || !currentUser.name || currentUser.name.includes('@'));
  const initialStep = currentStep || (isProfileIncomplete ? 'profile' : 'email');

  // Steps: 'email' -> 'code' -> 'profile' (if new user or incomplete profile)
  const [step, setStepState] = useState<'email' | 'code' | 'profile'>(initialStep);

  useEffect(() => {
    if (currentStep && currentStep !== step) {
      setStepState(currentStep);
    }
  }, [currentStep]);

  const setStep = (newStep: 'email' | 'code' | 'profile') => {
    setStepState(newStep);
    if (onStepChange) onStepChange(newStep);
  };
  const [email, setEmail] = useState<string>(currentUser?.email || "");
  
  // First & Last Name must start empty unless user already has a distinct, saved real name (never fill from email)
  const [firstName, setFirstName] = useState<string>(() => {
    const raw = (currentUser?.firstName || "").trim();
    const emailPrefix = (currentUser?.email || "").split('@')[0].toLowerCase();
    if (raw && raw.toLowerCase() !== emailPrefix && !raw.includes('@') && !raw.toLowerCase().startsWith('usr_')) {
      return raw;
    }
    return "";
  });
  const [lastName, setLastName] = useState<string>(() => {
    const raw = (currentUser?.lastName || "").trim();
    if (raw && !raw.includes('@')) {
      return raw;
    }
    return "";
  });
  const [city, setCity] = useState<string>(currentUser?.city || "");
  const [country, setCountry] = useState<string>(currentUser?.country || "");
  const [stateRegion, setStateRegion] = useState<string>("");
  const [avatar, setAvatar] = useState<string>(currentUser?.avatar || "");
  const [banner, setBanner] = useState<string>(currentUser?.banner || "");
  const [avatarError, setAvatarError] = useState<string>("");
  const [bannerError, setBannerError] = useState<string>("");
  const [bio, setBio] = useState<string>(currentUser?.bio || "");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [otpCode, setOtpCode] = useState<string>("");
  const [tempUser, setTempUser] = useState<any>(currentUser || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const copy = getAuthContextCopy(intent, customTitle, customSubtitle);

  // Avatar file upload & canvas compression
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError(t("profile.invalidImage", "Please select a valid image file."));
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setAvatarError(t("profile.imageTooLarge", "Image file must be under 8MB."));
      return;
    }

    setAvatarError("");
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 256;
        const MAX_HEIGHT = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          try {
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.85);
            setAvatar(compressedBase64);
          } catch (err) {
            setAvatarError("Failed to process image.");
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Banner file upload & canvas compression
  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setBannerError(t("profile.invalidImage", "Please select a valid image file."));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setBannerError(t("profile.bannerTooLarge", "Banner file must be under 10MB."));
      return;
    }

    setBannerError("");
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          try {
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.85);
            setBanner(compressedBase64);
          } catch (err) {
            setBannerError("Failed to process banner.");
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // STEP 1: Send Magic Link / OTP via Email only
  const handleSendMagicLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage(t("auth.invalidEmail", "Please enter a valid email address."));
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
        throw new Error(data.error || "Failed to send verification email");
      }

      setStep('code');
    } catch (err: any) {
      setErrorMessage(err.message || "Could not dispatch sign-in email. Please check your address and try again.");
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

      let returnedUser = data.user;

      // Check if user is known locally via KNOWN_COMMUNITY_USERS or saved profile
      const cleanEmail = email.trim().toLowerCase();
      const knownCommunity = KNOWN_COMMUNITY_USERS[cleanEmail] || 
                             KNOWN_COMMUNITY_USERS[cleanEmail.split('@')[0]] ||
                             KNOWN_COMMUNITY_USERS[cleanEmail.replace(/[^a-z0-9]/g, '')];

      if (knownCommunity) {
        returnedUser = {
          ...returnedUser,
          name: returnedUser?.name && !returnedUser.name.includes('@') ? returnedUser.name : knownCommunity.name,
          firstName: returnedUser?.firstName || knownCommunity.name.split(' ')[0] || knownCommunity.name,
          lastName: returnedUser?.lastName || (knownCommunity.name.includes(' ') ? knownCommunity.name.split(' ').slice(1).join(' ') : ''),
          handle: knownCommunity.handle,
          avatar: (returnedUser?.avatar && !returnedUser.avatar.includes('ui-avatars')) ? returnedUser.avatar : knownCommunity.avatar,
          bio: returnedUser?.bio || knownCommunity.bio,
          isNewUser: false
        };
      }

      setTempUser(returnedUser);

      // Determine if user is already registered with mandatory First and Last Name
      const hasFirstName = Boolean(returnedUser?.firstName && returnedUser.firstName.trim().length > 0);
      const hasLastName = Boolean(returnedUser?.lastName && returnedUser.lastName.trim().length > 0);
      const hasBothNames = hasFirstName && hasLastName;

      const isFullyActivated = (!returnedUser?.isNewUser || Boolean(knownCommunity)) && hasBothNames;

      if (isFullyActivated) {
        // Existing user recognized and fully activated -> log in immediately
        completeLogin(returnedUser);
      } else {
        // Account not yet activated -> proceed to Step 3 to collect First & Last Name
        const emailPrefix = cleanEmail.split('@')[0].toLowerCase();
        if (returnedUser?.firstName && returnedUser.firstName.toLowerCase() !== emailPrefix && !returnedUser.firstName.includes('@') && !returnedUser.firstName.toLowerCase().startsWith('usr_')) {
          setFirstName(returnedUser.firstName);
        } else {
          setFirstName("");
        }
        if (returnedUser?.lastName && !returnedUser.lastName.includes('@')) {
          setLastName(returnedUser.lastName);
        } else {
          setLastName("");
        }
        if (returnedUser?.avatar) setAvatar(returnedUser.avatar);
        if (returnedUser?.banner) setBanner(returnedUser.banner);
        if (returnedUser?.city) setCity(returnedUser.city);
        if (returnedUser?.country) setCountry(returnedUser.country || "");
        if (returnedUser?.bio) setBio(returnedUser.bio);
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
    
    const fName = (firstName || "").trim();
    const lName = (lastName || "").trim();

    if (!fName) {
      setErrorMessage(t("auth.enterFirstName", "Please enter your first name."));
      return;
    }
    if (!lName) {
      setErrorMessage(t("auth.enterLastName", "Please enter your last name."));
      return;
    }
    
    setIsLoading(true);
    setErrorMessage("");

    try {
      const cleanEmail = (email || tempUser?.email || currentUser?.email || "").trim().toLowerCase();
      if (!cleanEmail) {
        throw new Error("Missing email address.");
      }

      const fullName = `${fName} ${lName}`;
      const finalCity = (city || "").trim();
      const finalState = (stateRegion || "").trim();
      const finalCountry = (country || "").trim();
      const locParts = [finalCity, finalState, finalCountry].filter(Boolean);
      const combinedLocation = locParts.join(", ");

      let finalAvatar = (avatar || "").trim() || tempUser?.avatar || currentUser?.avatar;

      // If user uploaded a custom photo (data:image/jpeg/png...), upload to Bunny CDN / storage
      if (finalAvatar && finalAvatar.startsWith('data:image/')) {
        try {
          const uploadRes = await fetch('/api/user/upload-avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: finalAvatar,
              userId: cleanEmail
            })
          });
          const uploadData = await uploadRes.json();
          if (uploadData.avatarUrl) {
            finalAvatar = uploadData.avatarUrl;
          }
        } catch (uploadErr) {
          console.warn("Avatar upload to Bunny CDN notice:", uploadErr);
        }
      }

      // If no custom avatar uploaded, auto-generate single-letter avatar from First Name
      if (!finalAvatar || finalAvatar.includes('ui-avatars')) {
        finalAvatar = generateGoogleLetterAvatarSvg(fName, 128, cleanEmail);
      }

      const updatedUser = {
        uid: tempUser?.uid || tempUser?.id || currentUser?.uid || currentUser?.id || `usr_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        id: tempUser?.uid || tempUser?.id || currentUser?.uid || currentUser?.id || `usr_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email: cleanEmail,
        name: fullName,
        firstName: fName,
        lastName: lName,
        city: finalCity,
        country: finalCountry,
        location: combinedLocation,
        avatar: finalAvatar,
        banner: (banner || "").trim() || tempUser?.banner || currentUser?.banner || "",
        bio: (bio || "").trim(),
        role: 'user',
        isNewUser: false,
        isVerified: true,
        verifiedAt: new Date().toISOString()
      };

      await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser)
      });

      // Send real one-time welcome notification for newly registered user
      sendWelcomeNotificationForNewUser(updatedUser);
      completeLogin(updatedUser);
    } catch (err: any) {
      console.error("Profile save error:", err);
      setErrorMessage(err.message || "Failed to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const completeLogin = (userObj: any) => {
    try {
      if (userObj) {
        unrecordDeletedUsersInLocalStorage([userObj.email, userObj.uid, userObj.id, userObj.name, userObj.handle]);
      }
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

  return (
    <div className={`w-full ${isFullPage ? "min-h-full flex flex-col justify-between pt-[max(12px,env(safe-area-inset-top,12px))]" : "flex flex-col items-center"} p-4 sm:p-7 select-none bg-[#09090b] text-white`}>
      {isFullPage && (
        <div className="w-full flex items-center justify-between py-2 mb-2">
          {(step !== 'email' || onRequestBack) ? (
            <button
              onClick={() => {
                if (step === 'profile') setStep('code');
                else if (step === 'code') setStep('email');
                else if (onRequestBack) onRequestBack();
              }}
              className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700/80 text-white flex items-center justify-center shrink-0 active:scale-90 transition-all cursor-pointer shadow-md group"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-white stroke-[2.25] group-hover:-translate-x-0.5 transition-transform" />
            </button>
          ) : <div />}

          {onOpenHelp && (
            <button
              onClick={onOpenHelp}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-zinc-200 hover:text-white transition-all px-3 py-1.5 rounded-full bg-zinc-800/80 border border-zinc-700/80 hover:bg-zinc-700/80 cursor-pointer active:scale-95 shadow-sm"
            >
              <HelpCircle className="w-3.5 h-3.5 text-zinc-200" />
              <span>{t("common.help", "Help")}</span>
            </button>
          )}
        </div>
      )}

      <div className="w-full max-w-sm sm:max-w-md mx-auto flex flex-col items-center text-center space-y-4 py-2 sm:py-5 sm:my-auto pb-6">
        
        {/* Step-Aware Brand / Profile Icon (hidden during profile step for clean hero focus) */}
        {step !== 'profile' && (
          <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-[0_4px_24px_rgba(0,0,0,0.5)] shrink-0">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        )}

        <div className="space-y-1 max-w-xs">
          <h1 className="text-[21px] sm:text-2xl font-bold text-white tracking-tight font-['Google_Sans',sans-serif] leading-tight">
            {step === 'code' ? t("auth.checkEmailTitle", "Check your email") : step === 'profile' ? t("auth.completeProfileTitle", "Complete your profile") : copy.title}
          </h1>
          <p className="text-[12.5px] text-zinc-400 font-normal leading-relaxed">
            {step === 'code' 
              ? `${t("auth.sentCodeTo", "We sent a 6-digit confirmation code to")} ${email}`
              : step === 'profile'
                ? t("auth.completeProfileSubtitle", "Customize your public profile card.")
                : copy.subtitle}
          </p>
        </div>

        {/* STEP 1: Email Only Form */}
        {step === 'email' && (
          <form onSubmit={handleSendMagicLink} className="w-full space-y-3 pt-1 text-left">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 mb-1 tracking-wider uppercase">
                {t("auth.emailAddress", "Email Address")}
              </label>
              <div className="relative">
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-11 sm:h-12 pl-10 pr-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all"
                />
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5 sm:top-4" />
              </div>
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-red-950/40 text-red-400 text-xs rounded-xl border border-red-900/40 text-center flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email.includes('@')}
              className="w-full h-11 sm:h-12 rounded-xl bg-white hover:bg-zinc-200 active:scale-[0.98] text-black font-bold text-[14px] sm:text-[14.5px] shadow-lg shadow-white/5 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-black" />
              ) : (
                <>
                  <span>{t("auth.continueWithEmail", "Continue with Email")}</span>
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
                <label className="block text-[11px] font-semibold text-zinc-200 tracking-wider uppercase">
                  {t("auth.sixDigitCode", "6-Digit Verification Code")}
                </label>
                <span className="text-[11px] text-zinc-200 font-mono">
                  {otpCode.length}/6 {t("auth.digits", "digits")}
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
                            ? "bg-zinc-900 text-zinc-200 border-2 border-zinc-400 ring-2 ring-white/10"
                            : "bg-zinc-900/90 text-zinc-600 border border-zinc-800"
                        }`}
                      >
                        {isFilled ? (
                          char
                        ) : isFocused ? (
                          <span className="animate-pulse text-zinc-200 font-normal">|</span>
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
                  <span>{t("auth.verifyCode", "Verify Code")}</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs text-zinc-200 pt-1">
              <button
                type="button"
                onClick={() => { setStep('email'); setErrorMessage(''); }}
                className="text-zinc-200 hover:text-white underline cursor-pointer"
              >
                ← {t("auth.changeEmail", "Change Email")}
              </button>
              <button
                type="button"
                onClick={() => handleSendMagicLink()}
                disabled={isLoading}
                className="text-zinc-200 hover:text-white underline cursor-pointer"
              >
                {t("auth.resendCode", "Resend Code")}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Profile Setup (Luxury Integrated Avatar/Cover & Structured Form) */}
        {step === 'profile' && (
          <form onSubmit={(e) => handleSaveProfile(e)} className="w-full max-w-sm sm:max-w-md space-y-4 pt-1 text-left">
            {/* Hidden File Inputs */}
            <input
              type="file"
              ref={avatarInputRef}
              onChange={handleAvatarFileChange}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />
            <input
              type="file"
              ref={bannerInputRef}
              onChange={handleBannerFileChange}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />

            {/* Profile Photo Uploader */}
            <div className="flex flex-col items-center gap-2 pt-1">
              <div 
                className="relative group cursor-pointer select-none" 
                onClick={() => avatarInputRef.current?.click()}
                title={t("profile.profilePicture", "Profile Picture")}
              >
                <div className="w-22 h-22 rounded-full overflow-hidden border-2 border-zinc-700 shadow-md relative bg-zinc-950">
                  {avatar ? (
                    <img 
                      src={avatar} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                      referrerPolicy="no-referrer" 
                    /> 
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-850 text-zinc-400">
                      <User className="w-8 h-8 text-zinc-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Camera className="w-5 h-5" />
                  </div>
                </div>
                <button 
                  type="button" 
                  className="absolute bottom-0 right-0 p-1.5 bg-zinc-850 hover:bg-zinc-750 text-white rounded-full shadow-lg transition-colors cursor-pointer border border-zinc-750"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-zinc-200">{t("profile.profilePicture", "Profile Picture")}</span>
                <p className="text-[10px] text-zinc-400">{t("profile.uploadCustomPhoto", "Click to upload a custom JPG or PNG")}</p>
              </div>
            </div>

            {/* Banner Photo Uploader */}
            <div className="flex flex-col items-center gap-2">
              <div 
                className="relative group cursor-pointer w-full select-none" 
                onClick={() => bannerInputRef.current?.click()}
                title={t("profile.coverBanner", "Cover Banner")}
              >
                <div className="w-full h-26 rounded-2xl overflow-hidden border-2 border-zinc-700 shadow-md relative bg-zinc-950">
                  {banner ? (
                    <img 
                      src={banner} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-500 font-medium text-xs">
                      <span className="text-[11px] font-bold text-zinc-500">{t("profile.noBannerSelected", "No banner selected")}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Camera className="w-5 h-5" />
                  </div>
                </div>
                <button 
                  type="button" 
                  className="absolute bottom-2.5 right-2.5 p-1.5 bg-zinc-850 hover:bg-zinc-750 text-white rounded-full shadow-lg transition-colors cursor-pointer border border-zinc-750"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-zinc-200">{t("profile.coverBanner", "Cover Banner")}</span>
                <p className="text-[10px] text-zinc-400">{t("profile.uploadCustomBanner", "Click to upload a custom JPG or PNG")}</p>
              </div>
            </div>

            {avatarError && <p className="text-[11px] text-red-400 px-1">{avatarError}</p>}
            {bannerError && <p className="text-[11px] text-red-400 px-1">{bannerError}</p>}

            {/* First & Last Name */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-200 mb-1 tracking-wider uppercase">
                  {t("auth.firstName", "First Name")} <span className="text-red-400 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full h-11 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-200 mb-1 tracking-wider uppercase">
                  {t("auth.lastName", "Last Name")} <span className="text-red-400 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Taylor"
                  className="w-full h-11 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all font-medium"
                />
              </div>
            </div>

            {/* Bio Field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-semibold text-zinc-200 tracking-wider uppercase">
                  {t("profile.bio", "Bio")}
                </label>
                <span className="text-[10px] font-semibold text-zinc-400">
                  {bio.length} / 160
                </span>
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 160))}
                rows={3}
                placeholder={t("profile.bioPlaceholder", "Introduce yourself! What are your favorite places, foods, or hobbies?")}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all placeholder-zinc-500 resize-none font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-zinc-200 tracking-wider uppercase">
                  {t("auth.country", "Country")}
                </label>
                <span className="text-[10px] text-zinc-400 font-normal">
                  {t("common.optional", "optional")}
                </span>
              </div>
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
              const stateLabel = t("auth.regionProvince", "Region / Province");
              
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
                        <div className="flex items-center justify-between pl-1">
                          <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-wide block">{stateLabel}</span>
                          <span className="text-[9px] text-zinc-400 font-normal">{t("common.optional", "optional")}</span>
                        </div>
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
                        <div className="flex items-center justify-between pl-1">
                          <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-wide block">{t("auth.city", "City")}</span>
                          <span className="text-[9px] text-zinc-400 font-normal">{t("common.optional", "optional")}</span>
                        </div>
                        <SearchableComboSelector
                          value={city}
                          onChange={setCity}
                          options={uniqueCityOptions}
                          placeholder={t("auth.selectCity", "Select City")}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2 space-y-1">
                      <div className="flex items-center justify-between pl-1">
                        <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-wide block">{t("auth.city", "City")}</span>
                        <span className="text-[9px] text-zinc-400 font-normal">{t("common.optional", "optional")}</span>
                      </div>
                      <SearchableComboSelector
                        value={city}
                        onChange={setCity}
                        options={uniqueCityOptions}
                        placeholder={t("auth.selectCity", "Select City")}
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
              disabled={isLoading || !firstName.trim() || !lastName.trim()}
              className="w-full h-12 rounded-xl bg-white hover:bg-zinc-200 active:scale-[0.98] text-black font-bold text-[14.5px] shadow-lg shadow-white/5 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-black" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-black" />
                  <span>{t("auth.activateProfileAndContinue", "Activate Profile & Continue")}</span>
                </>
              )}
            </button>
          </form>
        )}

        <p className="text-[11.5px] text-zinc-200 font-normal leading-relaxed max-w-xs mx-auto">
          {t("auth.agreePrompt", "By continuing, you agree to Yoouz's")}{" "}
          <button
            type="button"
            onClick={() => onOpenLegal ? onOpenLegal('terms') : null}
            className="font-semibold text-zinc-200 hover:text-white underline decoration-zinc-600 underline-offset-2 cursor-pointer inline bg-transparent p-0 border-none"
          >
            {t("legal.termsTab", "Terms of Service")}
          </button>{" "}
          {t("common.and", "and")}{" "}
          <button
            type="button"
            onClick={() => onOpenLegal ? onOpenLegal('privacy') : null}
            className="font-semibold text-zinc-200 hover:text-white underline decoration-zinc-600 underline-offset-2 cursor-pointer inline bg-transparent p-0 border-none"
          >
            {t("legal.privacyTab", "Privacy Policy")}
          </button>
          .
        </p>
      </div>

      {isFullPage && (
        <div className="w-full pt-6 pb-2 text-center text-[12px] text-zinc-200 font-medium">
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
  currentUser,
  onOpenHelp,
  onOpenLegal
}) => {
  const isProfileIncomplete = currentUser && (!currentUser.firstName || !currentUser.lastName || !currentUser.name || currentUser.name.includes('@'));
  const [currentStep, setCurrentStep] = useState<'email' | 'code' | 'profile'>(isProfileIncomplete ? 'profile' : 'email');
  const authPromptRef = useRef<{ goBack?: () => void } | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (currentUser && (!currentUser.firstName || !currentUser.lastName || !currentUser.name || currentUser.name.includes('@'))) {
        setCurrentStep('profile');
      } else {
        setCurrentStep('email');
      }
    }
  }, [isOpen, currentUser]);

  const { swipeProps, dragOffsetY } = useSwipeDownToDismiss({
    onDismiss: onClose,
    threshold: 60
  });

  if (!isOpen) return null;

  const handleBackClick = () => {
    if (currentStep === 'profile') {
      setCurrentStep('code');
    } else if (currentStep === 'code') {
      setCurrentStep('email');
    } else {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm pt-[max(12px,env(safe-area-inset-top,12px))] pb-0 sm:p-6 animate-in fade-in duration-200 select-none sm:select-auto"
      onClick={onClose}
    >
      <div 
        className="w-full sm:max-w-[480px] h-auto max-h-[85dvh] sm:max-h-[90dvh] bg-[#09090b] rounded-t-[28px] sm:rounded-[28px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border-t sm:border border-white/10 text-white flex flex-col relative animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 overflow-y-auto pb-[max(16px,env(safe-area-inset-bottom,16px))] mt-auto sm:my-auto"
        style={{
          transform: dragOffsetY > 0 ? `translateY(${dragOffsetY}px)` : undefined,
          transition: dragOffsetY === 0 ? "transform 0.2s ease-out" : "none"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with Drag Indicator, High-Contrast Back Button & Help */}
        <div 
          className="sticky top-0 z-30 bg-[#09090b]/95 backdrop-blur-md border-b border-white/[0.06] pt-2 pb-2.5 px-4 sm:px-5 flex flex-col gap-1 shrink-0 touch-pan-y"
          {...swipeProps}
        >
          {/* Top Drag Handle Indicator */}
          <div className="w-full flex justify-center py-0.5 sm:hidden cursor-grab active:cursor-grabbing touch-none">
            <div className="w-12 h-1.5 rounded-full bg-zinc-700/80" />
          </div>

          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2.5">
              {/* High-Contrast Prominent Back Button */}
              <button
                onClick={handleBackClick}
                className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700/80 hover:bg-zinc-700/90 text-white flex items-center justify-center shrink-0 active:scale-90 transition-all cursor-pointer shadow-md group"
                aria-label="Back"
                title="Go Back"
              >
                <ArrowLeft className="w-5 h-5 text-white stroke-[2.25] group-hover:-translate-x-0.5 transition-transform" />
              </button>

              {onOpenHelp ? (
                <button
                  onClick={() => {
                    onClose();
                    onOpenHelp();
                  }}
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-zinc-200 hover:text-white transition-all px-3 py-1.5 rounded-full bg-zinc-800/80 border border-zinc-700/80 hover:bg-zinc-700/80 cursor-pointer active:scale-95 shadow-sm"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-200" />
                  <span>Help</span>
                </button>
              ) : null}
            </div>

            <button
              onClick={onClose}
              aria-label="Close modal"
              className="w-9 h-9 rounded-full bg-zinc-800/80 border border-zinc-700/80 text-zinc-300 hover:text-white hover:bg-zinc-700 flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-2 sm:p-4 flex-1 flex flex-col justify-center">
          <CopoAuthPrompt
            intent={intent}
            customTitle={customTitle}
            customSubtitle={customSubtitle}
            currentUser={currentUser}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
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
