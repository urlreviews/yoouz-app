import React from "react";
import {
  Home,
  Search,
  Camera,
  Mail,
  User
} from "lucide-react";
import { NavSection, UserProfile } from "../types";
import { useLanguage } from "../i18n/LanguageContext";
import { getSafeAvatarUrl } from "../utils/placeUtils";
import { generateGoogleLetterAvatarSvg } from "../lib/avatar";

export interface CopoMobileBottomNavProps {
  activeSection: NavSection | string;
  onSelectSection: (section: NavSection) => void;
  currentUser?: UserProfile | null;
  unreadNotifsCount?: number;
  unreadMessagesCount?: number;
  onOpenCreateModal?: () => void;
  onOpenSearch?: () => void;
  className?: string;
}

export const CopoMobileBottomNav: React.FC<CopoMobileBottomNavProps> = ({
  activeSection,
  onSelectSection,
  currentUser,
  unreadMessagesCount = 0,
  onOpenCreateModal,
  onOpenSearch,
  className = "md:hidden fixed bottom-0 left-0 right-0"
}) => {
  const { t } = useLanguage();

  const focusActiveSearch = () => {
    const mobileInputs = document.querySelectorAll<HTMLInputElement>("#yoouz-mobile-search-input");
    const mainInputs = document.querySelectorAll<HTMLInputElement>("#copo-main-search-input");
    const input =
      (mobileInputs.length > 0 ? mobileInputs[mobileInputs.length - 1] : null) ||
      (mainInputs.length > 0 ? mainInputs[mainInputs.length - 1] : null);
    if (input) {
      try {
        input.focus({ preventScroll: true });
      } catch {
        input.focus();
      }
    }
  };

  const isHomeActive = activeSection === "home";
  const isSearchActive = activeSection === "search" || activeSection === "discover";
  const isReviewActive = activeSection === "record_review";
  const isMessagesActive = activeSection === "messages";
  const isProfileActive = activeSection === "profile" || activeSection === "more";

  return (
    <div
      id="copo-mobile-bottom-nav"
      className={`${className} z-50 px-3.5 pt-2 pointer-events-none select-none`}
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))" }}
    >
      {/* Floating iOS Liquid-Glass Dock Capsule */}
      <nav
        aria-label="Mobile Navigation"
        className="pointer-events-auto relative flex items-center justify-between max-w-[430px] mx-auto rounded-[28px] bg-[#111114]/88 backdrop-blur-2xl border border-white/[0.12] px-2 py-1.5 shadow-[0_18px_48px_rgba(0,0,0,0.88),inset_0_1px_0_rgba(255,255,255,0.08)] text-white"
      >
        {/* 1. Home */}
        <button
          id="mobile-nav-home-btn"
          type="button"
          onClick={() => onSelectSection("home")}
          aria-current={isHomeActive ? "page" : undefined}
          className={`relative flex flex-col items-center justify-center min-h-[44px] py-1 px-1.5 flex-1 rounded-2xl active:scale-90 transition-all duration-200 cursor-pointer ${
            isHomeActive ? "text-white" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <div className="relative flex items-center justify-center">
            <Home
              className={`w-[20px] h-[20px] transition-all duration-200 ${
                isHomeActive ? "stroke-[2.3] text-white" : "stroke-[1.85] text-zinc-400"
              }`}
            />
          </div>
          <span
            className={`text-[10px] tracking-tight mt-1 leading-none transition-colors whitespace-nowrap ${
              isHomeActive ? "font-semibold text-white" : "font-medium text-zinc-400"
            }`}
          >
            {t("nav.home", "Home")}
          </span>
          <span
            className={`mt-1 w-1 h-1 rounded-full bg-white transition-all duration-200 ${
              isHomeActive ? "opacity-100 scale-100" : "opacity-0 scale-50"
            }`}
            aria-hidden="true"
          />
        </button>

        {/* 2. Search */}
        <button
          id="mobile-nav-search-btn"
          type="button"
          onClick={() => {
            if (onOpenSearch) {
              onOpenSearch();
            } else {
              onSelectSection("search");
            }
            focusActiveSearch();
          }}
          aria-current={isSearchActive ? "page" : undefined}
          className={`relative flex flex-col items-center justify-center min-h-[44px] py-1 px-1.5 flex-1 rounded-2xl active:scale-90 transition-all duration-200 cursor-pointer ${
            isSearchActive ? "text-white" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <div className="relative flex items-center justify-center">
            <Search
              className={`w-[20px] h-[20px] transition-all duration-200 ${
                isSearchActive ? "stroke-[2.3] text-white" : "stroke-[1.85] text-zinc-400"
              }`}
            />
          </div>
          <span
            className={`text-[10px] tracking-tight mt-1 leading-none transition-colors whitespace-nowrap ${
              isSearchActive ? "font-semibold text-white" : "font-medium text-zinc-400"
            }`}
          >
            {t("nav.search", "Search")}
          </span>
          <span
            className={`mt-1 w-1 h-1 rounded-full bg-white transition-all duration-200 ${
              isSearchActive ? "opacity-100 scale-100" : "opacity-0 scale-50"
            }`}
            aria-hidden="true"
          />
        </button>

        {/* 3. CENTER HERO ACTION: Signature Tactile White Camera Shutter */}
        <div className="flex items-center justify-center px-1 shrink-0">
          <button
            id="mobile-nav-record-btn"
            type="button"
            onClick={() => {
              if (onOpenCreateModal) {
                onOpenCreateModal();
              } else {
                onSelectSection("record_review");
              }
              focusActiveSearch();
            }}
            aria-label={t("nav.add_review", "Add Live Photo Review")}
            title={t("nav.add_review", "Add Review")}
            className={`relative w-[48px] h-[48px] -my-0.5 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 flex items-center justify-center shadow-[0_6px_22px_rgba(255,255,255,0.28)] ring-[3px] transition-all duration-200 active:scale-90 cursor-pointer ${
              isReviewActive ? "ring-white/45 scale-105" : "ring-white/15"
            }`}
          >
            <Camera className="w-[22px] h-[22px] stroke-[2.25] text-zinc-950" />
          </button>
        </div>

        {/* 4. Messages (Unmistakable Envelope Icon + Unread Pill) */}
        <button
          id="mobile-nav-inbox-btn"
          type="button"
          onClick={() => onSelectSection("messages")}
          aria-current={isMessagesActive ? "page" : undefined}
          className={`relative flex flex-col items-center justify-center min-h-[44px] py-1 px-1.5 flex-1 rounded-2xl active:scale-90 transition-all duration-200 cursor-pointer ${
            isMessagesActive ? "text-white" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <div className="relative flex items-center justify-center">
            <Mail
              className={`w-[20px] h-[20px] transition-all duration-200 ${
                isMessagesActive ? "stroke-[2.3] text-white" : "stroke-[1.85] text-zinc-400"
              }`}
            />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] flex items-center justify-center px-1 text-[9px] font-bold tabular-nums rounded-full bg-white text-zinc-950 border border-[#111114] shadow-md">
                {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
              </span>
            )}
          </div>
          <span
            className={`text-[10px] tracking-tight mt-1 leading-none transition-colors whitespace-nowrap ${
              isMessagesActive ? "font-semibold text-white" : "font-medium text-zinc-400"
            }`}
          >
            {t("nav.messages", "Messages")}
          </span>
          <span
            className={`mt-1 w-1 h-1 rounded-full bg-white transition-all duration-200 ${
              isMessagesActive ? "opacity-100 scale-100" : "opacity-0 scale-50"
            }`}
            aria-hidden="true"
          />
        </button>

        {/* 5. Profile */}
        <button
          id="mobile-nav-profile-btn"
          type="button"
          onClick={() => onSelectSection("profile")}
          aria-current={isProfileActive ? "page" : undefined}
          className={`relative flex flex-col items-center justify-center min-h-[44px] py-1 px-1.5 flex-1 rounded-2xl active:scale-90 transition-all duration-200 cursor-pointer ${
            isProfileActive ? "text-white" : "text-zinc-400 hover:text-zinc-200"
          }`}
          title={
            currentUser && !(currentUser as any).passkeyProtected
              ? "Save your passkey"
              : undefined
          }
        >
          <div className="relative flex items-center justify-center">
            {currentUser?.avatar ? (
              <img
                src={getSafeAvatarUrl(currentUser.avatar, currentUser.name, currentUser.handle || currentUser.email)}
                alt={currentUser.name || "Profile"}
                className={`w-[21px] h-[21px] rounded-full object-cover transition-all ${
                  isProfileActive
                    ? "ring-2 ring-white scale-105 opacity-100"
                    : "ring-1 ring-white/25 opacity-90"
                }`}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  const fallback = generateGoogleLetterAvatarSvg(currentUser.name || "User", 128, currentUser.handle || currentUser.name);
                  if (target.src !== fallback) {
                    target.src = fallback;
                  }
                }}
              />
            ) : (
              <User
                className={`w-[20px] h-[20px] transition-all duration-200 ${
                  isProfileActive ? "stroke-[2.3] text-white" : "stroke-[1.85] text-zinc-400"
                }`}
              />
            )}
            {currentUser && !(currentUser as any).passkeyProtected && (
              <span
                className="absolute -top-0.5 -right-1 w-2.5 h-2.5 rounded-full bg-[#E8C78A] ring-2 ring-[#111114]"
                title="Passkey not saved yet"
              />
            )}
          </div>
          <span
            className={`text-[10px] tracking-tight mt-1 leading-none transition-colors max-w-[60px] truncate ${
              isProfileActive ? "font-semibold text-white" : "font-medium text-zinc-400"
            }`}
          >
            {currentUser?.name ? currentUser.name.split(" ")[0] : t("nav.profile", "Profile")}
          </span>
          <span
            className={`mt-1 w-1 h-1 rounded-full bg-white transition-all duration-200 ${
              isProfileActive ? "opacity-100 scale-100" : "opacity-0 scale-50"
            }`}
            aria-hidden="true"
          />
        </button>
      </nav>
    </div>
  );
};
