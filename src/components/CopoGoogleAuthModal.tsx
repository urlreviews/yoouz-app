import React, { useEffect, useState } from "react";
import { Loader2, X, AlertCircle, HelpCircle } from "lucide-react";
import { signInWithGoogle } from "../lib/firebase";

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
  onSuccess: (userData: { name: string; email: string; avatar: string }) => void;
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
        title: customTitle || "Log in to Yoouz",
        subtitle: customSubtitle || "Sign in to record and publish verified 60-second video reviews."
      };
    case 'following':
      return {
        title: customTitle || "Log in to Yoouz",
        subtitle: customSubtitle || "Manage your account, follow creators, and see updates from places you love."
      };
    case 'messages':
      return {
        title: customTitle || "Log in to Yoouz",
        subtitle: customSubtitle || "Sign in to chat with reviewers, business owners, and your local community."
      };
    case 'notifications':
      return {
        title: customTitle || "Log in to Yoouz",
        subtitle: customSubtitle || "Sign in to see likes, comments, and mentions on your video reviews."
      };
    case 'bookmarks':
      return {
        title: customTitle || "Log in to Yoouz",
        subtitle: customSubtitle || "Sign in to access your saved places and favorite 60-second video reviews."
      };
    case 'profile':
      return {
        title: customTitle || "Log in to Yoouz",
        subtitle: customSubtitle || "Sign in to view your profile, manage your reviews, and track your activity."
      };
    case 'comment':
    case 'like':
      return {
        title: customTitle || "Log in to Yoouz",
        subtitle: customSubtitle || "Sign in to like reviews, share insights, and join the conversation."
      };
    case 'claim':
      return {
        title: customTitle || "Log in to Yoouz",
        subtitle: customSubtitle || "Sign in to claim and verify ownership of your business location."
      };
    default:
      return {
        title: customTitle || "Log in to Yoouz",
        subtitle: customSubtitle || "Manage your account, check notifications, comment on videos and more."
      };
  }
};

/**
 * Reusable TikTok-inspired Auth Card / Screen
 */
export const CopoAuthPrompt: React.FC<{
  intent?: AuthIntent | string;
  customTitle?: string;
  customSubtitle?: string;
  onSuccess?: (userData: { name: string; email: string; avatar: string }) => void;
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
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const copy = getAuthContextCopy(intent, customTitle, customSubtitle);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage("");
    try {
      const userData = await signInWithGoogle();
      if (userData) {
        if (onSuccess) {
          onSuccess(userData);
        }
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        return;
      }
      console.error("Google sign in failed:", err);
      if (err?.code === 'auth/popup-blocked') {
        setErrorMessage("Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.");
      } else if (err?.code === 'auth/unauthorized-domain') {
        setErrorMessage("Domain authorization needed: Please add 'yoouz.com' to Firebase Console > Authentication > Settings > Authorized domains.");
      } else if (err?.message) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Sign in failed. Please try again.");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className={`w-full ${isFullPage ? "min-h-full flex flex-col justify-between" : "flex flex-col items-center"} p-4 sm:p-8 select-none bg-[#09090b] text-white`}>
      {isFullPage && onOpenHelp && (
        <div className="w-full flex items-center justify-end py-2 mb-6">
          <button
            onClick={onOpenHelp}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-full hover:bg-white/[0.04]"
          >
            <HelpCircle className="w-4 h-4 text-zinc-400" />
            <span>Feedback and help</span>
          </button>
        </div>
      )}

      <div className="w-full max-w-md mx-auto my-auto flex flex-col items-center text-center space-y-7 py-4">
        <div className="space-y-3 max-w-sm">
          <h1 className="text-[26px] sm:text-3xl font-bold text-white tracking-tight font-['Google_Sans',sans-serif] leading-snug">
            {copy.title}
          </h1>
          <p className="text-[14px] text-zinc-400 font-normal leading-relaxed">
            {copy.subtitle}
          </p>
        </div>

        <div className="w-full max-w-sm space-y-4 pt-2">
          <button
            type="button"
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="w-full h-[52px] px-4 rounded-xl bg-[#18181b] hover:bg-white/[0.08] active:bg-white/[0.1] border border-white/[0.08] shadow-sm transition-all cursor-pointer flex items-center justify-center relative disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            <div className="absolute left-5 flex items-center justify-center">
              {isSigningIn ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#1a73e8]" />
              ) : (
                <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.32 7.22 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.5-.38-2.27s.13-1.55.38-2.27H6.58H1.19C.43 8.1 0 9.98 0 12s.43 3.9 1.19 5.42l4.09-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.22 0 3.17 2.68 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
              )}
            </div>
            <span className="font-bold text-[14.5px] text-white">
              {isSigningIn ? "Connecting with Google..." : "Continue with Google"}
            </span>
          </button>

          {errorMessage && (
            <div className="p-3 bg-red-950/40 text-red-400 text-xs rounded-xl border border-red-900/40 text-center leading-normal flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
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
            and confirm that you have read Yoouz's{" "}
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
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setErrorMessage("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copy = getAuthContextCopy(intent, customTitle, customSubtitle);

  const handleFirebaseGoogleClick = async () => {
    setIsSigningIn(true);
    setErrorMessage("");
    try {
      const userData = await signInWithGoogle();
      if (userData) {
        onSuccess(userData);
        onClose();
      }
    } catch (err: any) {
      console.error("Google sign in failed:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage("Sign-in window was closed before completing. Please try again.");
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMessage("Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.");
      } else if (err.message) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Sign in failed. Please try again.");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-[420px] bg-[#09090b] rounded-[28px] shadow-2xl border border-white/[0.08] text-white flex flex-col relative animate-in zoom-in-95 duration-200 overflow-hidden">
        
        <div className="flex items-center justify-end px-5 py-3.5 border-b border-white/[0.04]">
          <div className="flex items-center gap-1.5">
            {onOpenHelp && (
              <button
                onClick={() => {
                  onClose();
                  onOpenHelp();
                }}
                className="flex items-center gap-1.5 text-[13px] font-medium text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-white/[0.06] cursor-pointer"
              >
                <HelpCircle className="w-[15px] h-[15px]" />
                <span>Feedback and help</span>
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

        <div className="px-6 py-10 flex flex-col items-center text-center space-y-7">
          <div className="space-y-3 max-w-[320px]">
            <h2 className="text-[26px] font-bold tracking-tight text-white font-['Google_Sans',sans-serif]">
              {copy.title}
            </h2>
            <p className="text-[14px] text-zinc-400 font-normal leading-relaxed">
              {copy.subtitle}
            </p>
          </div>

          <div className="w-full space-y-5 pt-2">
            <button
              type="button"
              onClick={handleFirebaseGoogleClick}
              disabled={isSigningIn}
              className="w-full h-[52px] px-4 rounded-[14px] bg-[#18181b] hover:bg-white/[0.08] active:bg-white/[0.1] border border-white/[0.08] shadow-sm transition-all cursor-pointer flex items-center justify-center relative disabled:opacity-60 disabled:cursor-not-allowed group"
            >
              <div className="absolute left-5 flex items-center justify-center">
                {isSigningIn ? (
                  <Loader2 className="w-[18px] h-[18px] animate-spin text-white" />
                ) : (
                  <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.32 7.22 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.5-.38-2.27s.13-1.55.38-2.27H6.58H1.19C.43 8.1 0 9.98 0 12s.43 3.9 1.19 5.42l4.09-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.22 0 3.17 2.68 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                )}
              </div>
              <span className="font-bold text-[14.5px] text-white">
                {isSigningIn ? "Connecting with Google..." : "Continue with Google"}
              </span>
            </button>

            {errorMessage && (
              <div className="p-3 bg-red-950/40 text-red-400 text-xs rounded-xl border border-red-900/40 text-center leading-normal flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            <p className="text-[11.5px] text-zinc-500 font-normal leading-relaxed max-w-[280px] mx-auto">
              By continuing, you agree to Yoouz's{" "}
              <button
                type="button"
                onClick={() => onOpenLegal ? onOpenLegal('terms') : null}
                className="font-bold text-zinc-400 hover:text-white underline decoration-zinc-600 underline-offset-2 cursor-pointer inline bg-transparent p-0 border-none"
              >
                Terms of Service
              </button>{" "}
              and confirm that you have read Yoouz's{" "}
              <button
                type="button"
                onClick={() => onOpenLegal ? onOpenLegal('privacy') : null}
                className="font-bold text-zinc-400 hover:text-white underline decoration-zinc-600 underline-offset-2 cursor-pointer inline bg-transparent p-0 border-none"
              >
                Privacy Policy
              </button>
              .
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/[0.04] flex items-center justify-center text-[11.5px] text-zinc-500 font-medium">
          <span>© 2026 Yoouz. Real People. Real Reviews.</span>
        </div>
      </div>
    </div>
  );
};
