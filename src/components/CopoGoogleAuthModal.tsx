import React, { useEffect, useState } from "react";
import { Loader2, X, AlertCircle, HelpCircle, Mail, ArrowRight, CheckCircle2, User, Sparkles } from "lucide-react";
import { generateGoogleLetterAvatarSvg, getAvatarColor, getFirstLetter } from "../lib/avatar";

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
  onSuccess: (userData: { name: string; email: string; avatar: string; uid?: string; firstName?: string; lastName?: string }) => void;
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
        subtitle: customSubtitle || "Sign in with your email to record and publish verified 60-second video reviews."
      };
    case 'following':
      return {
        title: customTitle || "Sign in to Yoouz",
        subtitle: customSubtitle || "Follow creators, save top reviewers, and get updates from places you love."
      };
    case 'messages':
      return {
        title: customTitle || "Sign in to Yoouz",
        subtitle: customSubtitle || "Connect with video reviewers and verified local business owners."
      };
    case 'notifications':
      return {
        title: customTitle || "Sign in to Yoouz",
        subtitle: customSubtitle || "Stay notified on likes, comments, and mentions on your video reviews."
      };
    case 'bookmarks':
      return {
        title: customTitle || "Sign in to Yoouz",
        subtitle: customSubtitle || "Save places and keep your favorite 60-second reviews in one place."
      };
    case 'profile':
      return {
        title: customTitle || "Sign in to Yoouz",
        subtitle: customSubtitle || "Sign in with your email to customize your profile, avatar, and reviews."
      };
    case 'comment':
    case 'like':
      return {
        title: customTitle || "Sign in to Yoouz",
        subtitle: customSubtitle || "Join the conversation, leave feedback, and interact with reviews."
      };
    case 'claim':
      return {
        title: customTitle || "Business Sign in",
        subtitle: customSubtitle || "Sign in to verify and manage your official business listing."
      };
    default:
      return {
        title: customTitle || "Welcome to Yoouz",
        subtitle: customSubtitle || "Enter your email to sign in or create an account with a secure magic link."
      };
  }
};

/**
 * Reusable Auth Form / Card
 */
export const CopoAuthPrompt: React.FC<{
  intent?: AuthIntent | string;
  customTitle?: string;
  customSubtitle?: string;
  onSuccess?: (userData: { name: string; email: string; avatar: string; uid?: string; firstName?: string; lastName?: string }) => void;
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
  // Steps: 'email' -> 'code' (or name setup if first time)
  const [step, setStep] = useState<'email' | 'code' | 'name'>('email');
  const [email, setEmail] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [simulationHint, setSimulationHint] = useState<string>("");

  const copy = getAuthContextCopy(intent, customTitle, customSubtitle);

  // Step 1: Send Magic Link / OTP via Resend
  const handleSendMagicLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSimulationHint("");

    try {
      const res = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          host: window.location.host
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to send magic link");
      }

      if (data.previewCode) {
        setSimulationHint(`Demo Preview Code: ${data.previewCode}`);
      }

      setStep('code');
    } catch (err: any) {
      setErrorMessage(err.message || "Could not dispatch sign-in email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify Code
  const handleVerifyCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = otpCode.trim();
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
          code: cleanCode,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Invalid code. Please try again.");
      }

      const returnedUser = data.user;
      const fName = firstName.trim() || returnedUser.firstName || email.split('@')[0];
      const lName = lastName.trim() || returnedUser.lastName || '';
      const fullName = lName ? `${fName} ${lName}` : fName;
      
      // Automatic 1-letter Google-style initial avatar
      const avatarSvg = generateGoogleLetterAvatarSvg(fName, 128);

      const finalUser = {
        name: fullName,
        email: returnedUser.email || email.trim().toLowerCase(),
        avatar: avatarSvg,
        uid: returnedUser.uid || `usr_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        firstName: fName,
        lastName: lName
      };

      // Persist to localStorage
      try {
        localStorage.setItem("copo_user", JSON.stringify(finalUser));
      } catch {}

      if (onSuccess) {
        onSuccess(finalUser);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Verification failed. Please check the code.");
    } finally {
      setIsLoading(false);
    }
  };

  const previewLetter = getFirstLetter(firstName || email || 'Y');
  const previewColor = getAvatarColor(firstName || email || 'Y');

  return (
    <div className={`w-full ${isFullPage ? "min-h-full flex flex-col justify-between" : "flex flex-col items-center"} p-4 sm:p-8 select-none bg-[#09090b] text-white`}>
      {isFullPage && onOpenHelp && (
        <div className="w-full flex items-center justify-end py-2 mb-4">
          <button
            onClick={onOpenHelp}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-full hover:bg-white/[0.04]"
          >
            <HelpCircle className="w-4 h-4 text-zinc-400" />
            <span>Feedback and help</span>
          </button>
        </div>
      )}

      <div className="w-full max-w-md mx-auto my-auto flex flex-col items-center text-center space-y-6 py-4">
        
        {/* Dynamic Google-Style 1-Letter Avatar Icon */}
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold tracking-tight shadow-xl transition-all duration-300 transform scale-100 hover:scale-105"
          style={{ backgroundColor: previewColor.bg, color: previewColor.text }}
        >
          {previewLetter}
        </div>

        <div className="space-y-2 max-w-sm">
          <h1 className="text-[24px] sm:text-2xl font-bold text-white tracking-tight font-['Google_Sans',sans-serif] leading-snug">
            {step === 'code' ? 'Check your email' : copy.title}
          </h1>
          <p className="text-[13.5px] text-zinc-400 font-normal leading-relaxed">
            {step === 'code' 
              ? `We sent a 6-digit sign-in code to ${email}`
              : copy.subtitle}
          </p>
        </div>

        {/* STEP 1: Name + Email Form */}
        {step === 'email' && (
          <form onSubmit={handleSendMagicLink} className="w-full max-w-sm space-y-3.5 pt-1 text-left">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1 tracking-wider uppercase">
                  First Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Alex"
                    className="w-full h-11 px-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1 tracking-wider uppercase">
                  Last Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Taylor"
                    className="w-full h-11 px-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1 tracking-wider uppercase">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.taylor@example.com"
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
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
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-[14.5px] shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Continue with Magic Link</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Enter 6-Digit Code */}
        {step === 'code' && (
          <form onSubmit={handleVerifyCode} className="w-full max-w-sm space-y-4 pt-1 text-left">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5 tracking-wider uppercase text-center">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                autoFocus
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full h-14 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-center font-mono text-2xl tracking-[8px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            {simulationHint && (
              <div className="p-2.5 bg-blue-950/40 border border-blue-800/40 rounded-xl text-blue-300 text-xs text-center font-medium">
                {simulationHint}
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-red-950/40 text-red-400 text-xs rounded-xl border border-red-900/40 text-center flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || otpCode.length < 6}
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-[14.5px] shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify & Sign In</span>
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
                className="text-blue-400 hover:text-blue-300 underline cursor-pointer"
              >
                Resend Code
              </button>
            </div>
          </form>
        )}

        <p className="text-[11.5px] text-zinc-500 font-normal leading-relaxed max-w-xs mx-auto">
          By signing in, you agree to Yoouz's{" "}
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-[440px] bg-[#09090b] rounded-[28px] shadow-2xl border border-white/[0.08] text-white flex flex-col relative animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header with Close and Help */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold">Y</div>
            <span className="text-sm font-bold tracking-tight text-white font-['Google_Sans',sans-serif]">Yoouz Account</span>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenHelp && (
              <button
                onClick={() => {
                  onClose();
                  onOpenHelp();
                }}
                className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-400 hover:text-white transition-colors px-2.5 py-1 rounded-full hover:bg-white/[0.06] cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Help</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-8">
          <CopoAuthPrompt
            intent={intent}
            customTitle={customTitle}
            customSubtitle={customSubtitle}
            onSuccess={(userData) => {
              onSuccess(userData);
              onClose();
            }}
            onOpenHelp={onOpenHelp}
            onOpenLegal={onOpenLegal}
            isFullPage={false}
          />
        </div>

        <div className="px-6 py-3.5 border-t border-white/[0.04] flex items-center justify-center text-[11.5px] text-zinc-500 font-medium">
          <span>Powered by Bunny.net CDN & Resend Magic Link</span>
        </div>
      </div>
    </div>
  );
};
