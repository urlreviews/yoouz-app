import React, { useEffect, useState } from "react";
import { X, KeyRound, Camera, User, Loader2, ShieldCheck } from "lucide-react";
import { triggerHaptic } from "../utils/haptics";
import { useLanguage } from "../i18n/LanguageContext";

interface GuestProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onRestorePasskey: () => void;
  onAddReview: () => void;
  onCreateProfileNow: () => Promise<void> | void;
}

export const GuestProfileSheet: React.FC<GuestProfileSheetProps> = ({
  isOpen,
  onClose,
  onRestorePasskey,
  onAddReview,
  onCreateProfileNow
}) => {
  const { t } = useLanguage();
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsCreating(false);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCreateNow = async () => {
    if (isCreating) return;
    triggerHaptic("light");
    setIsCreating(true);
    try {
      await onCreateProfileNow();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div
      id="yoouz-guest-profile-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-profile-sheet-title"
      className="fixed inset-0 z-[250] bg-black/78 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-[400px] bg-[#0B0B0E] rounded-t-[28px] sm:rounded-[28px] border-t sm:border border-white/[0.1] shadow-[0_28px_90px_rgba(0,0,0,0.9)] px-6 pt-5 sm:p-7 text-white overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        style={{ paddingBottom: "max(1.75rem, env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle top rim highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        {/* Mobile drag indicator */}
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5 sm:hidden" aria-hidden="true" />

        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic("light");
            onClose();
          }}
          aria-label={t("common.close", "Close")}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Identity Emblem */}
        <div className="w-14 h-14 rounded-full bg-gradient-to-b from-white/[0.11] to-white/[0.03] border border-white/[0.14] flex items-center justify-center mx-auto mb-4 shadow-[0_8px_28px_rgba(0,0,0,0.5)]">
          <User className="w-6 h-6 text-white stroke-[1.8]" />
        </div>

        {/* Heading & Copy */}
        <div className="text-center space-y-2 mb-6">
          <h2
            id="guest-profile-sheet-title"
            className="text-[21px] font-semibold tracking-[-0.025em] text-white font-['Google_Sans',sans-serif]"
          >
            {t("profile.guestTitle", "Your Yoouz Profile")}
          </h2>
          <p className="text-[13.5px] text-zinc-400 leading-relaxed max-w-[310px] mx-auto text-balance">
            {t(
              "profile.guestSubtitle",
              "No email or password needed. Post a live review to start automatically, or restore your saved handle with Passkey."
            )}
          </p>
        </div>

        {/* Primary & Secondary Actions */}
        <div className="space-y-2.5">
          <button
            id="btn-guest-restore-passkey"
            type="button"
            onClick={() => {
              triggerHaptic("light");
              onRestorePasskey();
            }}
            className="w-full h-12 px-5 rounded-full bg-white hover:bg-zinc-200 active:scale-[0.985] text-zinc-950 font-semibold text-[14.5px] tracking-[-0.01em] flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(255,255,255,0.12)] transition-all cursor-pointer"
          >
            <KeyRound className="w-4 h-4 stroke-[2.2]" />
            <span>{t("profile.restoreWithPasskey", "Restore Account with Passkey")}</span>
          </button>

          <button
            id="btn-guest-add-review"
            type="button"
            onClick={() => {
              triggerHaptic("light");
              onAddReview();
            }}
            className="w-full h-12 px-5 rounded-full bg-white/[0.06] hover:bg-white/[0.11] active:scale-[0.985] border border-white/[0.1] text-white font-semibold text-[14px] tracking-[-0.01em] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4 stroke-[2]" />
            <span>{t("profile.addLiveReview", "Add a Live Review")}</span>
          </button>
        </div>

        {/* Subtle Privacy Footnote & Explicit New Profile Escape Hatch */}
        <div className="mt-5 pt-4 border-t border-white/[0.07] flex flex-col items-center gap-2.5">
          <button
            id="btn-guest-create-new-profile"
            type="button"
            disabled={isCreating}
            onClick={handleCreateNow}
            className="text-[12.5px] font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5 py-1 disabled:opacity-60"
          >
            {isCreating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{t("profile.createNewProfileNow", "New here? Create a blank profile now")}</span>
          </button>

          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span>{t("profile.zeroEmailPrivacyNote", "Zero emails · Protected by Face ID & Touch ID")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
