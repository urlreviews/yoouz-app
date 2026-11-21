import React, { useEffect, useState } from "react";
import {
  Users,
  MessageSquare,
  Bell,
  Bookmark,
  User,
  SlidersHorizontal,
  Building2,
  X,
  ChevronRight,
  KeyRound,
  ShieldCheck,
  Settings2,
  Download,
  Share,
  PlusSquare,
} from "lucide-react";
import { NavSection, UserProfile } from "../types";
import { getSafeAvatarUrl } from "../utils/placeUtils";
import { useLanguage } from "../i18n/LanguageContext";
import { triggerHaptic } from "../utils/haptics";
import { usePWAInstall } from "../hooks/usePWAInstall";

interface CopoMobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  currentUser: UserProfile | null;
  unreadNotifsCount?: number;
  unreadMessagesCount?: number;
  onOpenCreateModal: () => void;
  onOpenSearch: () => void;
  onOpenAuth?: (intent?: string) => void;
  onOpenPasskeyModal?: (mode: "save" | "restore") => void;
  onOpenLegal?: (tab: "terms" | "privacy") => void;
  onOpenEditProfile?: () => void;
  onOpenNotificationSettings?: () => void;
}

export const CopoMobileNavDrawer: React.FC<CopoMobileNavDrawerProps> = ({
  isOpen,
  onClose,
  activeSection,
  onSelectSection,
  currentUser,
  unreadNotifsCount = 0,
  unreadMessagesCount = 0,
  onOpenPasskeyModal,
  onOpenLegal,
  onOpenEditProfile,
  onOpenNotificationSettings,
}) => {
  const { t } = useLanguage();
  const { canShowInstall, promptInstall } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Lock background scroll & close on Escape while sheet is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isPasskeyProtected = Boolean((currentUser as any)?.passkeyProtected);

  const rawHandle = (currentUser as any)?.handle || currentUser?.name || "";
  const formattedHandle = rawHandle
    ? rawHandle.startsWith("@") || rawHandle.toUpperCase().startsWith("U/")
      ? rawHandle
      : `@${rawHandle}`
    : "";

  const displayName = currentUser
    ? currentUser.name || formattedHandle || t("nav.profile", "Your Profile")
    : t("profile.your_profile", "Your Profile");

  const hasDistinctHandle =
    Boolean(currentUser?.name) &&
    Boolean(formattedHandle) &&
    currentUser!.name.toLowerCase().replace(/^@/, "") !==
      formattedHandle.toLowerCase().replace(/^@/, "");

  const profileSubtitle = currentUser
    ? isPasskeyProtected
      ? t("profile.passkey_protected", "Passkey protected")
      : hasDistinctHandle
        ? formattedHandle
        : t("profile.view_profile", "View profile")
    : t("profile.reviews_activity", "Reviews & activity");

  const libraryItems: {
    id: NavSection;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: "following", label: t("nav.following", "Following"), icon: Users },
    { id: "bookmarks", label: t("nav.saved", "Saved"), icon: Bookmark },
    {
      id: "notifications",
      label: t("nav.notifications", "Notifications"),
      icon: Bell,
      badge: unreadNotifsCount,
    },
    {
      id: "messages",
      label: t("nav.messages", "Messages"),
      icon: MessageSquare,
      badge: unreadMessagesCount,
    },
  ];

  const handleNavTap = (id: NavSection) => {
    triggerHaptic("light");
    onSelectSection(id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[200] md:hidden flex justify-end overflow-hidden overscroll-none"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
    >
      {/* Dimmed obsidian backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Flush full-height Apple / Google right-aligned sheet */}
      <aside className="relative z-10 w-[84%] max-w-[332px] h-[100dvh] bg-[#08080A] border-l border-white/[0.08] flex flex-col overflow-hidden overscroll-none shadow-[-24px_0_64px_rgba(0,0,0,0.88)] animate-in slide-in-from-right duration-250 ease-out">
        {/* Top Bar */}
        <div
          className="px-5 pb-3.5 border-b border-white/[0.06] flex items-center justify-between shrink-0"
          style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
        >
          <button
            type="button"
            onClick={() => handleNavTap("home")}
            className="flex items-center gap-2.5 text-left active:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="w-[34px] h-[34px] rounded-[10px] bg-[#121216] border border-white/[0.12] flex items-center justify-center shrink-0 shadow-[0_4px_14px_rgba(0,0,0,0.45)]">
              <svg viewBox="0 0 24 24" className="w-[17px] h-[17px] fill-white" aria-hidden="true">
                <path d="M12 3.8l2.32 4.7 5.18 0.75-3.75 3.65 0.88 5.16L12 15.62l-4.63 2.44 0.88-5.16-3.75-3.65 5.18-0.75L12 3.8z" />
              </svg>
            </div>
            <span className="text-[19px] font-bold tracking-[-0.03em] leading-none font-['Google_Sans',sans-serif] text-white">
              Yoouz
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            aria-label="Close menu"
            className="w-11 h-11 rounded-full bg-white/[0.06] hover:bg-white/[0.11] active:scale-95 border border-white/[0.08] text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4.5 h-4.5 stroke-[2]" />
          </button>
        </div>

        {/* Scrollable Sheet Content — proportioned to fit cleanly without clipping */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain overscroll-x-none touch-pan-y px-4 py-4 space-y-3.5 no-scrollbar">
          {/* 1. Passwordless Identity & Passkey Card (NEVER asks consumer for email) */}
          <div className="rounded-2xl bg-[#111114] border border-white/[0.07] overflow-hidden divide-y divide-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                triggerHaptic("light");
                onClose();
                if (onOpenEditProfile) {
                  onOpenEditProfile();
                } else {
                  onSelectSection("profile");
                }
              }}
              className="w-full px-3.5 py-3 flex items-center gap-3 text-left hover:bg-white/[0.03] active:bg-white/[0.05] transition-colors cursor-pointer"
            >
              {currentUser?.avatar ? (
                <img
                  src={getSafeAvatarUrl(
                    currentUser.avatar,
                    currentUser.name,
                    (currentUser as any)?.handle || currentUser?.id
                  )}
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover ring-1 ring-white/15 shrink-0"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.src = getSafeAvatarUrl(
                      null,
                      currentUser.name,
                      (currentUser as any)?.handle || currentUser?.id
                    );
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-zinc-200 shrink-0">
                  <User className="w-[18px] h-[18px] stroke-[1.9]" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[14.5px] font-semibold tracking-[-0.015em] text-white truncate">
                    {displayName}
                  </p>
                  {isPasskeyProtected && (
                    <ShieldCheck className="w-3.5 h-3.5 text-[#E8C78A] shrink-0" />
                  )}
                </div>
                <p className="text-[12px] text-zinc-400 truncate mt-0.5">
                  {profileSubtitle}
                </p>
              </div>

              <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
            </button>

            {/* Biometric Passkey Action Row — Save if active & unprotected, Restore if guest */}
            {onOpenPasskeyModal && !isPasskeyProtected && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  onClose();
                  onOpenPasskeyModal(currentUser ? "save" : "restore");
                }}
                className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2.5 text-left hover:bg-white/[0.03] active:bg-white/[0.05] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[#E8C78A]/10 border border-[#E8C78A]/20 flex items-center justify-center text-[#E8C78A] shrink-0">
                    <KeyRound className="w-3.5 h-3.5 stroke-[2]" />
                  </div>
                  <span className="text-[13px] font-medium text-[#E8C78A] truncate">
                    {currentUser
                      ? t("passkey.save_action", "Save with Passkey")
                      : t("passkey.restore_action", "Restore with Passkey")}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
              </button>
            )}
          </div>

          {/* 2. Activity & Library (non-redundant with mobile bottom dock) */}
          <div className="rounded-2xl bg-[#111114] border border-white/[0.07] overflow-hidden divide-y divide-white/[0.06]">
            {libraryItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavTap(item.id)}
                  className={`w-full min-h-[48px] px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    isActive
                      ? "bg-white/[0.07] text-white"
                      : "text-zinc-200 hover:bg-white/[0.03] active:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${
                        isActive
                          ? "bg-white text-zinc-950"
                          : "bg-white/[0.05] text-zinc-300"
                      }`}
                    >
                      <Icon className="w-[16px] h-[16px] stroke-[2]" />
                    </div>
                    <span className="text-[14.5px] font-medium tracking-[-0.01em] truncate">
                      {item.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-white text-zinc-950 text-[11px] font-bold tabular-nums flex items-center justify-center">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-zinc-600" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* 3. Business & Preferences */}
          <div className="rounded-2xl bg-[#111114] border border-white/[0.07] overflow-hidden divide-y divide-white/[0.06]">
            <button
              type="button"
              onClick={() => handleNavTap("business" as NavSection)}
              className={`w-full min-h-[54px] px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                (activeSection as string) === "business"
                  ? "bg-white/[0.07]"
                  : "hover:bg-white/[0.03] active:bg-white/[0.05]"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-[10px] bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white shrink-0">
                  <Building2 className="w-[16px] h-[16px] stroke-[1.9]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold tracking-[-0.01em] text-white truncate">
                    {t("business.portal", "Yoouz for Business")}
                  </p>
                  <p className="text-[11.5px] text-zinc-400 truncate mt-0.5">
                    {t("business.claim_subtitle", "Claim & manage your page")}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
            </button>

            {onOpenNotificationSettings && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  onClose();
                  onOpenNotificationSettings();
                }}
                className="w-full min-h-[48px] px-3.5 py-2.5 flex items-center justify-between gap-3 text-zinc-200 hover:bg-white/[0.03] active:bg-white/[0.05] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-[10px] bg-white/[0.05] flex items-center justify-center text-zinc-300 shrink-0">
                    <SlidersHorizontal className="w-[16px] h-[16px] stroke-[2]" />
                  </div>
                  <span className="text-[14px] font-medium tracking-[-0.01em] truncate">
                    {t("settings.notifications", "Notification preferences")}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
              </button>
            )}

            <button
              type="button"
              onClick={() => handleNavTap("more")}
              className={`w-full min-h-[48px] px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                activeSection === "more"
                  ? "bg-white/[0.07] text-white"
                  : "text-zinc-200 hover:bg-white/[0.03] active:bg-white/[0.05]"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${
                    activeSection === "more"
                      ? "bg-white text-zinc-950"
                      : "bg-white/[0.05] text-zinc-300"
                  }`}
                >
                  <Settings2 className="w-[16px] h-[16px] stroke-[2]" />
                </div>
                <span className="text-[14px] font-medium tracking-[-0.01em] truncate">
                  {t("nav.more_settings", "Settings & About")}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
            </button>

            {canShowInstall && (
              <div>
                <button
                  type="button"
                  onClick={async () => {
                    triggerHaptic("light");
                    const res = await promptInstall();
                    if (res === "ios-guide") {
                      setShowIOSGuide((v) => !v);
                    } else if (res === "accepted") {
                      onClose();
                    }
                  }}
                  className="w-full min-h-[52px] px-3.5 py-2.5 flex items-center justify-between gap-3 text-left text-white hover:bg-white/[0.03] active:bg-white/[0.05] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-[10px] bg-white text-zinc-950 flex items-center justify-center shrink-0">
                      <Download className="w-[16px] h-[16px] stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold tracking-[-0.01em] text-white truncate">
                        Install Yoouz App
                      </p>
                      <p className="text-[11.5px] text-zinc-400 truncate mt-0.5">
                        Full-screen native home screen app
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
                </button>
                {showIOSGuide && (
                  <div className="px-3.5 pb-3 pt-1 text-[12px] text-zinc-300 space-y-2 bg-white/[0.025] border-t border-white/[0.05]">
                    <div className="flex items-center gap-2">
                      <Share className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>1. Tap <strong className="text-white">Share</strong> in Safari&apos;s toolbar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PlusSquare className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>2. Tap <strong className="text-white">Add to Home Screen</strong></span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quiet Legal Footer — pinned cleanly to bottom safe area */}
        <footer
          className="px-5 pt-3 border-t border-white/[0.06] bg-[#08080A] shrink-0"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <div className="flex items-center justify-center flex-wrap gap-x-2 gap-y-1 text-[11.5px] font-medium text-zinc-500">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLegal?.("privacy");
              }}
              className="hover:text-zinc-300 transition-colors cursor-pointer"
            >
              {t("legal.privacy", "Privacy")}
            </button>
            <span className="text-zinc-700">·</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLegal?.("terms");
              }}
              className="hover:text-zinc-300 transition-colors cursor-pointer"
            >
              {t("legal.terms", "Terms")}
            </button>
            <span className="text-zinc-700">·</span>
            <button
              type="button"
              onClick={() => handleNavTap("more")}
              className="hover:text-zinc-300 transition-colors cursor-pointer"
            >
              {t("nav.about", "About")}
            </button>
            <span className="text-zinc-700">·</span>
            <span className="text-zinc-600">© 2026 Yoouz</span>
          </div>
        </footer>
      </aside>
    </div>
  );
};
