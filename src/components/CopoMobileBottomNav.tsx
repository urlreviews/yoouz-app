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
              : "text-zinc-100 hover:text-white"
          }`}
        >
          <Home
            className={`w-[22px] h-[22px] transition-transform duration-200 ${
              activeSection === "home"
                ? "scale-110 fill-white/20 stroke-[2.5] text-white"
                : "stroke-[2.2] text-zinc-100"
            }`}
          />
          <span
            className={`text-[10px] tracking-tight mt-1 ${
              activeSection === "home" ? "font-bold text-white" : "font-medium text-zinc-100"
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
              : "text-zinc-100 hover:text-white"
          }`}
        >
          <div className="relative">
            <Search
              className={`w-[22px] h-[22px] transition-transform duration-200 ${
                activeSection === "search" || activeSection === "discover"
                  ? "scale-110 stroke-[2.5] text-white"
                  : "stroke-[2.2] text-zinc-100"
              }`}
            />
          </div>
          <span
            className={`text-[10px] tracking-tight mt-1 ${
              activeSection === "search" || activeSection === "discover"
                ? "font-bold text-white"
                : "font-medium text-zinc-100"
            }`}
          >
            {t("nav.search", "Search")}
          </span>
        </button>

        {/* 3. CENTER ACTION: Record Review */}
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
          className="flex flex-col items-center justify-center py-1 px-3 flex-1 rounded-xl active:scale-90 transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center justify-center w-[32px] h-[32px] rounded-full bg-white text-zinc-950 shadow-sm border border-zinc-950 hover:bg-zinc-200">
            <Video className="w-[16px] h-[16px] stroke-[2.5]" />
          </div>
          <span className="text-[10px] tracking-tight mt-1 font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis max-w-[76px]">
            {t("nav.record_review", "Video Review")}
          </span>
        </button>

        {/* 4. Inbox / Messages */}
        <button
          id="mobile-nav-inbox-btn"
          onClick={() => onSelectSection("messages")}
          className={`relative flex flex-col items-center justify-center py-1 px-3 flex-1 rounded-xl active:scale-90 transition-all duration-200 cursor-pointer ${
            activeSection === "messages" || activeSection === "notifications"
              ? "text-white"
              : "text-zinc-100 hover:text-white"
          }`}
        >
          <div className="relative">
            <Mail
              className={`w-[22px] h-[22px] transition-transform duration-200 ${
                activeSection === "messages" || activeSection === "notifications"
                  ? "scale-110 stroke-[2.5] text-white"
                  : "stroke-[2.2] text-zinc-100"
              }`}
            />
            {(unreadMessagesCount + unreadNotifsCount) > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[17px] h-[17px] flex items-center justify-center px-1 text-[9px] font-extrabold rounded-full bg-white text-zinc-950 border-2 border-zinc-950 shadow-sm animate-in zoom-in-75">
                {(unreadMessagesCount + unreadNotifsCount) > 9 ? "9+" : (unreadMessagesCount + unreadNotifsCount)}
              </span>
            )}
          </div>
          <span
            className={`text-[10px] tracking-tight mt-1 ${
              activeSection === "messages" || activeSection === "notifications"
                ? "font-bold text-white"
                : "font-medium text-zinc-100"
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
              : "text-zinc-100 hover:text-white"
          }`}
        >
          {currentUser?.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name || "Profile"}
              className={`w-[22px] h-[22px] rounded-full object-cover ring-2 transition-all ${
                activeSection === "profile" || activeSection === "more"
                  ? "ring-white scale-110"
                  : "ring-white/40"
              }`}
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (!target.src.includes('/api/avatar')) {
                  target.src = '/api/avatar?name=User&background=27272a&color=fff';
                }
              }}
            />
          ) : (
            <User
              className={`w-[22px] h-[22px] transition-transform duration-200 ${
                activeSection === "profile" || activeSection === "more"
                  ? "scale-110 stroke-[2.5] text-white"
                  : "stroke-[2.2] text-zinc-100"
              }`}
            />
          )}
          <span
            className={`text-[10px] tracking-tight mt-1 ${
              activeSection === "profile" || activeSection === "more" ? "font-bold text-white" : "font-medium text-zinc-100"
            }`}
          >
            {currentUser?.name ? currentUser.name.split(" ")[0] : t("nav.profile", "Profile")}
          </span>
        </button>
      </div>
    </nav>
  );
};
