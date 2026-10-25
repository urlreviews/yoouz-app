import React from "react";
import {
  Home,
  Search,
  Video,
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
  unreadNotifsCount = 0,
  unreadMessagesCount = 0,
  onOpenCreateModal,
  onOpenSearch,
  className = "md:hidden fixed bottom-0 left-0 right-0"
}) => {
  const { t } = useLanguage();

  return (
    <nav
      id="copo-mobile-bottom-nav"
      aria-label="Mobile Navigation"
      className={`${className} z-50 bg-zinc-950/95 backdrop-blur-2xl border-t border-zinc-800/90 text-white shadow-[0_-8px_30px_rgba(0,0,0,0.8)]`}
      style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom, 10px))" }}
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-1 w-full max-w-lg mx-auto relative">
        {/* 1. Home */}
        <button
          id="mobile-nav-home-btn"
          onClick={() => onSelectSection("home")}
          className={`flex flex-col items-center justify-center py-1 px-3 flex-1 rounded-xl active:scale-90 transition-all duration-200 cursor-pointer ${
            activeSection === "home"
              ? "text-white"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Home
            className={`w-[22px] h-[22px] transition-transform duration-200 ${
              activeSection === "home"
                ? "scale-105 stroke-[2.4] text-white"
                : "stroke-[1.9] text-zinc-400"
            }`}
          />
          <span
            className={`text-[10px] tracking-tight mt-1 transition-colors ${
              activeSection === "home" ? "font-bold text-white" : "font-medium text-zinc-400"
            }`}
          >
            {t("nav.home", "Home")}
          </span>
        </button>

        {/* 2. Search / Discover */}
        <button
          id="mobile-nav-search-btn"
          onClick={() => {
            if (onOpenSearch) onOpenSearch();
            else onSelectSection("search");
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 flex-1 rounded-xl active:scale-90 transition-all duration-200 cursor-pointer ${
            activeSection === "search" || activeSection === "discover"
              ? "text-white"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <div className="relative">
            <Search
              className={`w-[22px] h-[22px] transition-transform duration-200 ${
                activeSection === "search" || activeSection === "discover"
                  ? "scale-105 stroke-[2.4] text-white"
                  : "stroke-[1.9] text-zinc-400"
              }`}
            />
          </div>
          <span
            className={`text-[10px] tracking-tight mt-1 transition-colors ${
              activeSection === "search" || activeSection === "discover"
                ? "font-bold text-white"
                : "font-medium text-zinc-400"
            }`}
          >
            {t("nav.search", "Search")}
          </span>
        </button>

        {/* 3. CENTER ACTION: Record Review - Unified Dark Mode Hero Action */}
        <button
          id="mobile-nav-record-btn"
          onClick={() => {
            if (onOpenCreateModal) {
              onOpenCreateModal();
            } else {
              onSelectSection("record_review");
            }
          }}
          aria-label="Record 60-Second Video Review"
          className={`flex flex-col items-center justify-center py-1 px-2 flex-1 rounded-xl active:scale-90 transition-all duration-200 cursor-pointer ${
            activeSection === "record_review"
              ? "text-white"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <div className="relative">
            <Video
              className={`w-[22px] h-[22px] transition-transform duration-200 ${
                activeSection === "record_review"
                  ? "scale-105 stroke-[2.4] text-white"
                  : "stroke-[1.9] text-zinc-400"
              }`}
            />
          </div>
          <span
            className={`text-[10px] tracking-tight mt-1 transition-colors ${
              activeSection === "record_review" ? "font-bold text-white" : "font-medium text-zinc-400"
            }`}
          >
            {t("nav.record_review", "Video Review")}
          </span>
        </button>

        {/* 4. Inbox / Messages */}
        <button
          id="mobile-nav-inbox-btn"
          onClick={() => onSelectSection("messages")}
          className={`relative flex flex-col items-center justify-center py-1 px-3 flex-1 rounded-xl active:scale-90 transition-all duration-200 cursor-pointer ${
            activeSection === "messages"
              ? "text-white"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <div className="relative">
            <Mail
              className={`w-[22px] h-[22px] transition-transform duration-200 ${
                activeSection === "messages"
                  ? "scale-105 stroke-[2.4] text-white"
                  : "stroke-[1.9] text-zinc-400"
              }`}
            />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] flex items-center justify-center px-1 text-[9px] font-black rounded-full bg-red-500 text-white border-2 border-zinc-950 shadow-md">
                {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
              </span>
            )}
          </div>
          <span
            className={`text-[10px] tracking-tight mt-1 transition-colors ${
              activeSection === "messages"
                ? "font-bold text-white"
                : "font-medium text-zinc-400"
            }`}
          >
            {t("nav.messages", "Inbox")}
          </span>
        </button>

        {/* 5. Profile */}
        <button
          id="mobile-nav-profile-btn"
          onClick={() => onSelectSection("profile")}
          className={`flex flex-col items-center justify-center py-1 px-3 flex-1 rounded-xl active:scale-90 transition-all duration-200 cursor-pointer ${
            activeSection === "profile" || activeSection === "more"
              ? "text-white"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          {currentUser?.avatar ? (
            <img
              src={getSafeAvatarUrl(currentUser.avatar, currentUser.name, currentUser.handle || currentUser.email)}
              alt={currentUser.name || "Profile"}
              className={`w-[22px] h-[22px] rounded-full object-cover ring-1 transition-all ${
                activeSection === "profile" || activeSection === "more"
                  ? "ring-2 ring-white scale-105 opacity-100"
                  : "ring-zinc-700/80 opacity-80"
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
              className={`w-[22px] h-[22px] transition-transform duration-200 ${
                activeSection === "profile" || activeSection === "more"
                  ? "scale-105 stroke-[2.4] text-white"
                  : "stroke-[1.9] text-zinc-400"
              }`}
            />
          )}
          <span
            className={`text-[10px] tracking-tight mt-1 transition-colors ${
              activeSection === "profile" || activeSection === "more" ? "font-bold text-white" : "font-medium text-zinc-400"
            }`}
          >
            {currentUser?.name ? currentUser.name.split(" ")[0] : t("nav.profile", "Profile")}
          </span>
        </button>
      </div>
    </nav>
  );
};
