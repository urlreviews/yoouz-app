// Yoouz Platform Flagship 3-Zone Desktop & Tablet Top Navigation Bar
import React, { useState, Suspense, lazy } from "react";
import {
  Mail,
  Bell,
  User,
  Menu,
  Camera,
  KeyRound
} from "lucide-react";
import { NavSection, UserProfile } from "../types";
import { useLanguage } from "../i18n/LanguageContext";
const LanguageSelectorModal = lazy(() => import("./LanguageSelectorModal").then(m => ({ default: m.LanguageSelectorModal })));
import { getSafeAvatarUrl } from "../utils/placeUtils";

interface CopoSidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  currentUser?: UserProfile | null;
  unreadNotifsCount?: number;
  unreadMessagesCount?: number;
  onOpenSearch?: () => void;
  onOpenCreateModal?: () => void;
  onOpenLegal?: (tab: "terms" | "privacy") => void;
  onOpenPasskeyModal?: (mode: "save" | "restore") => void;
}

export const CopoSidebar: React.FC<CopoSidebarProps> = ({
  activeSection,
  onSelectSection,
  currentUser,
  unreadNotifsCount = 0,
  unreadMessagesCount = 0,
  onOpenPasskeyModal
}) => {
  const { t } = useLanguage();
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  const isDiscoverActive =
    activeSection === "home" || activeSection === "search" || activeSection === "discover";
  const isFollowingActive = activeSection === "following";
  const isSavedActive = activeSection === "bookmarks";
  const isBusinessActive = (activeSection as string) === "business";
  const isMessagesActive = activeSection === "messages";
  const isNotificationsActive = activeSection === "notifications";
  const isProfileActive = activeSection === "profile";
  const isMoreActive = activeSection === "more";
  const needsPasskeySave = Boolean(currentUser && !(currentUser as any).passkeyProtected);

  return (
    <>
      {/* Flagship 3-Zone Desktop & Tablet Top Bar (md and above) */}
      <header
        id="copo-desktop-topbar"
        className="hidden md:flex items-center justify-between gap-2 lg:gap-6 w-full h-16 shrink-0 bg-[#050506]/90 backdrop-blur-2xl border-b border-white/[0.07] px-3.5 lg:px-8 select-none z-40 text-white"
      >
        {/* Zone 1: Brand Mark (Left) */}
        <button
          id="copo-brand-logo"
          type="button"
          onClick={() => onSelectSection("home")}
          className="flex items-center gap-2 lg:gap-2.5 group cursor-pointer bg-transparent border-none p-0 shrink-0 whitespace-nowrap"
          aria-label="Yoouz Home"
        >
          <div className="relative flex items-center justify-center w-[32px] h-[32px] lg:w-[34px] lg:h-[34px] rounded-[10px] bg-[#121216] border border-white/[0.12] group-hover:border-white/[0.24] shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition-all duration-200 shrink-0">
            <svg viewBox="0 0 24 24" className="w-[16px] h-[16px] lg:w-[17px] lg:h-[17px] fill-white">
              <path d="M12 3.8l2.32 4.7 5.18 0.75-3.75 3.65 0.88 5.16L12 15.62l-4.63 2.44 0.88-5.16-3.75-3.65 5.18-0.75L12 3.8z" />
            </svg>
          </div>
          <span className="text-white text-[19px] lg:text-[20px] font-bold tracking-[-0.03em] leading-none font-['Google_Sans',sans-serif] whitespace-nowrap">
            Yoouz
          </span>
        </button>

        {/* Zone 2: Primary High-Frequency Destinations (Center) */}
        <nav
          aria-label="Primary Navigation"
          className="flex items-center gap-0.5 lg:gap-1.5 min-w-0"
        >
          <button
            id="nav-btn-home"
            type="button"
            onClick={() => onSelectSection("home")}
            aria-current={isDiscoverActive ? "page" : undefined}
            className={`px-2 lg:px-3.5 py-2 rounded-full text-[13px] lg:text-[14px] tracking-[-0.01em] whitespace-nowrap shrink-0 transition-all duration-150 cursor-pointer ${
              isDiscoverActive
                ? "text-white font-semibold bg-white/[0.08]"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.04] font-medium"
            }`}
          >
            {t("nav.discover", "Discover")}
          </button>

          <button
            id="nav-btn-following"
            type="button"
            onClick={() => onSelectSection("following")}
            aria-current={isFollowingActive ? "page" : undefined}
            className={`px-2 lg:px-3.5 py-2 rounded-full text-[13px] lg:text-[14px] tracking-[-0.01em] whitespace-nowrap shrink-0 transition-all duration-150 cursor-pointer ${
              isFollowingActive
                ? "text-white font-semibold bg-white/[0.08]"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.04] font-medium"
            }`}
          >
            {t("nav.following", "Following")}
          </button>

          <button
            id="nav-btn-bookmarks"
            type="button"
            onClick={() => onSelectSection("bookmarks")}
            aria-current={isSavedActive ? "page" : undefined}
            className={`px-2 lg:px-3.5 py-2 rounded-full text-[13px] lg:text-[14px] tracking-[-0.01em] whitespace-nowrap shrink-0 transition-all duration-150 cursor-pointer ${
              isSavedActive
                ? "text-white font-semibold bg-white/[0.08]"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.04] font-medium"
            }`}
          >
            {t("nav.saved", "Saved")}
          </button>

          <button
            id="nav-btn-business"
            type="button"
            onClick={() => onSelectSection("business")}
            aria-current={isBusinessActive ? "page" : undefined}
            className={`px-2 lg:px-3.5 py-2 rounded-full text-[13px] lg:text-[14px] tracking-[-0.01em] whitespace-nowrap shrink-0 transition-all duration-150 cursor-pointer ${
              isBusinessActive
                ? "text-white font-semibold bg-white/[0.08]"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.04] font-medium"
            }`}
          >
            For Business
          </button>
        </nav>

        {/* Zone 3: Utility Icons + Signature White Add Review Pill (Right) */}
        <div className="flex items-center gap-0.5 lg:gap-1.5 shrink-0">
          {/* Messages */}
          <button
            id="nav-btn-messages"
            type="button"
            onClick={() => onSelectSection("messages")}
            title={t("nav.messages", "Messages")}
            aria-label={t("nav.messages", "Messages")}
            className={`relative w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer shrink-0 ${
              isMessagesActive
                ? "bg-white/[0.12] text-white"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            <Mail className="w-[17px] h-[17px] lg:w-[18px] lg:h-[18px] stroke-[1.9]" />
            {unreadMessagesCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[17px] h-[17px] px-1 flex items-center justify-center text-[9.5px] font-bold tabular-nums rounded-full bg-white text-zinc-950 border-2 border-[#050506]">
                {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
              </span>
            )}
          </button>

          {/* Notifications */}
          <button
            id="nav-btn-notifications"
            type="button"
            onClick={() => onSelectSection("notifications")}
            title={t("nav.notifications", "Notifications")}
            aria-label={t("nav.notifications", "Notifications")}
            className={`relative w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer shrink-0 ${
              isNotificationsActive
                ? "bg-white/[0.12] text-white"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            <Bell className="w-[17px] h-[17px] lg:w-[18px] lg:h-[18px] stroke-[1.9]" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[17px] h-[17px] px-1 flex items-center justify-center text-[9.5px] font-bold tabular-nums rounded-full bg-white text-zinc-950 border-2 border-[#050506]">
                {unreadNotifsCount > 9 ? "9+" : unreadNotifsCount}
              </span>
            )}
          </button>

          {/* Passkey Save Shortcut (Only when signed-in user hasn't backed up passkey yet) */}
          {needsPasskeySave && onOpenPasskeyModal && (
            <button
              type="button"
              onClick={() => onOpenPasskeyModal("save")}
              title="Save your passkey"
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8C78A]/10 hover:bg-[#E8C78A]/18 border border-[#E8C78A]/25 text-[#E8C78A] text-[12px] font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 shrink-0" />
              <span>Save Key</span>
            </button>
          )}

          {/* Profile */}
          <button
            id="nav-btn-profile"
            type="button"
            onClick={() => onSelectSection("profile")}
            title={currentUser?.name || t("nav.profile", "Profile")}
            aria-label={t("nav.profile", "Profile")}
            className={`relative w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer shrink-0 ${
              isProfileActive
                ? "bg-white/[0.12] text-white ring-1 ring-white/30"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            {currentUser?.avatar ? (
              <img
                src={getSafeAvatarUrl(currentUser.avatar, currentUser.name, (currentUser as any)?.handle || currentUser?.email)}
                alt={currentUser.name || "Profile"}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-white/25"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.src = getSafeAvatarUrl(null, currentUser.name, (currentUser as any)?.handle || currentUser?.email);
                }}
              />
            ) : (
              <User className="w-[17px] h-[17px] lg:w-[18px] lg:h-[18px] stroke-[1.9]" />
            )}
            {needsPasskeySave && (
              <span className="xl:hidden absolute top-1 right-1 w-2 h-2 rounded-full bg-[#E8C78A] ring-2 ring-[#050506]" />
            )}
          </button>

          {/* More / Settings / About */}
          <button
            id="nav-btn-more"
            type="button"
            onClick={() => onSelectSection("more")}
            title={t("nav.more", "More")}
            aria-label={t("nav.more", "More")}
            className={`w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer shrink-0 ${
              isMoreActive
                ? "bg-white/[0.12] text-white"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            <Menu className="w-[17px] h-[17px] lg:w-[18px] lg:h-[18px] stroke-[1.9]" />
          </button>

          {/* Primary Hero CTA: Pure White Add Review Pill */}
          <button
            id="sidebar-record-btn"
            type="button"
            onClick={() => onSelectSection("record_review")}
            className="ml-1 flex items-center justify-center gap-1.5 lg:gap-2 px-3 lg:px-4 h-9 lg:h-10 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-[12.5px] lg:text-[13.5px] tracking-[-0.01em] whitespace-nowrap shrink-0 shadow-[0_4px_20px_rgba(255,255,255,0.14)] active:scale-[0.97] transition-all cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0 text-zinc-950 stroke-[2.2]" />
            <span>{t("nav.add_review", "Add Review")}</span>
          </button>
        </div>
      </header>

      {/* Language Selection Modal */}
      {isLangModalOpen && (
        <Suspense fallback={null}>
          <LanguageSelectorModal
            isOpen={isLangModalOpen}
            onClose={() => setIsLangModalOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
};
