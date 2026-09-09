import React, { useState } from "react";
import {
  Home,
  Search,
  Compass,
  UserPlus,
  Mail,
  Bell,
  Bookmark,
  Shield,
  Video,
  X,
  ChevronRight,
  LogOut,
  LogIn,
  FileText,
  Lock,
  HelpCircle,
  MessageSquare,
  Globe
} from "lucide-react";
import { NavSection, UserProfile } from "../types";
import { triggerHaptic } from "../utils/haptics";
import { useLanguage } from "../i18n/LanguageContext";
import { LanguageSelectorModal } from "./LanguageSelectorModal";

interface CopoMobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  currentUser?: UserProfile | null;
  unreadNotifsCount?: number;
  unreadMessagesCount?: number;
  onOpenCreateModal?: () => void;
  onOpenSearch?: () => void;
  onOpenAuth?: (intent?: string) => void;
  onOpenLegal?: (tab: "terms" | "privacy") => void;
  onSignOut?: () => void;
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
  onOpenCreateModal,
  onOpenSearch,
  onOpenAuth,
  onOpenLegal,
  onSignOut,
  onOpenEditProfile,
  onOpenNotificationSettings
}) => {
  const { t, currentLanguageMeta, isRTL } = useLanguage();
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  if (!isOpen) return null;

  const handleNavClick = (section: NavSection) => {
    triggerHaptic("selection");
    onSelectSection(section);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer Container (85% max-w-[340px]) */}
      <div className="relative w-[85%] max-w-[340px] h-[100dvh] bg-zinc-950 text-white border-r border-zinc-800 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300 ease-out select-none">
        
        {/* Top Header: Brand Logo, Tagline & Close Button */}
        <div className="flex items-center justify-between px-4 pt-[max(16px,calc(env(safe-area-inset-top,0px)+12px))] pb-3 border-b border-zinc-800/80 bg-zinc-950/95 sticky top-0 z-20">
          <div
            onClick={() => {
              handleNavClick("home");
            }}
            className="flex items-center gap-3 cursor-pointer active:scale-95 transition-transform group min-w-0"
          >
            <div className="relative flex items-center justify-center w-[38px] h-[38px] rounded-[13px] bg-white shadow-[0_4px_16px_rgba(255,255,255,0.15)] shrink-0 border border-white/20 group-hover:-translate-y-0.5 transition-transform">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-zinc-950">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div className="flex flex-col justify-center min-w-0 pt-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-white text-[20px] font-black tracking-tight leading-none font-['Google_Sans',sans-serif]">
                  Yoouz
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[8.5px] text-zinc-300 font-bold uppercase tracking-wider scale-90 origin-left">
                  Beta
                </span>
              </div>
              <span className="text-[10.5px] text-zinc-400 font-medium tracking-tight mt-1 whitespace-nowrap">
                {t("legal.tagline", "Real People. Real Reviews.")}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-90 shrink-0 ml-2"
            title="Close menu"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 space-y-4 divide-y divide-zinc-800/60">
          
          {/* Core App Navigation */}
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 px-3 mb-2">
              {t("drawer.menuFeatures", "Menu & Features")}
            </p>

            {/* Home Feed */}
            <button
              onClick={() => handleNavClick("home")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeSection === "home"
                  ? "bg-zinc-900 text-white font-bold border border-zinc-700/80"
                  : "text-white hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Home className="w-4 h-4 text-white" />
                <span>{t("nav.home", "Home")}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-200" />
            </button>

            {/* Search Places & Websites */}
            <button
              onClick={() => {
                if (onOpenSearch) onOpenSearch();
                else handleNavClick("search");
                onClose();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Search className="w-4 h-4 text-white" />
                <span>{t("nav.search", "Search Websites & Places")}</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-white font-mono border border-zinc-700">
                URL
              </span>
            </button>

            {/* Discover */}
            <button
              onClick={() => handleNavClick("discover")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeSection === "discover"
                  ? "bg-zinc-900 text-white font-bold border border-zinc-700/80"
                  : "text-white hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Compass className="w-4 h-4 text-white" />
                <span>{t("nav.discover", "Discover Creators & Spots")}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-200" />
            </button>

            {/* Following */}
            <button
              onClick={() => handleNavClick("following")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeSection === "following"
                  ? "bg-zinc-900 text-white font-bold border border-zinc-700/80"
                  : "text-white hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <UserPlus className="w-4 h-4 text-white" />
                <span>{t("nav.following", "Following")}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-200" />
            </button>

            {/* Messages / Inbox */}
            <button
              onClick={() => handleNavClick("messages")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeSection === "messages"
                  ? "bg-zinc-900 text-white font-bold border border-zinc-700/80"
                  : "text-white hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-white" />
                <span>{t("nav.messages", "Direct Messages")}</span>
              </div>
              {unreadMessagesCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-white font-bold text-[10px] border border-zinc-700">
                  {unreadMessagesCount}
                </span>
              ) : (
                <ChevronRight className="w-4 h-4 text-zinc-200" />
              )}
            </button>

            {/* Notifications */}
            <button
              onClick={() => handleNavClick("notifications")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeSection === "notifications"
                  ? "bg-zinc-900 text-white font-bold border border-zinc-700/80"
                  : "text-white hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-white" />
                <span>{t("nav.notifications", "Notifications")}</span>
              </div>
              {unreadNotifsCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-white font-bold text-[10px] border border-zinc-700">
                  {unreadNotifsCount}
                </span>
              ) : (
                <ChevronRight className="w-4 h-4 text-zinc-200" />
              )}
            </button>

            {/* Bookmarks */}
            <button
              onClick={() => handleNavClick("bookmarks")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeSection === "bookmarks"
                  ? "bg-zinc-900 text-white font-bold border border-zinc-700/80"
                  : "text-white hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Bookmark className="w-4 h-4 text-white" />
                <span>{t("nav.bookmarks", "Saved Bookmarks")}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-200" />
            </button>

            {/* For Businesses */}
            <button
              onClick={() => handleNavClick("business")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeSection === "business"
                  ? "bg-zinc-900 text-white font-bold border border-zinc-700/80"
                  : "text-white hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-white" />
                <span>{t("nav.business", "For Businesses & Owners")}</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-white font-bold border border-zinc-700">
                PRO
              </span>
            </button>

            {/* Language Selection Row */}
            <button
              id="mobile-drawer-language-btn"
              onClick={() => setIsLangModalOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium bg-zinc-900/90 hover:bg-zinc-850 text-white border border-zinc-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-zinc-200" />
                <span>{t("nav.language", "Language")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-200 font-medium">{currentLanguageMeta.nativeName}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 font-mono uppercase">
                  {currentLanguageMeta.code}
                </span>
              </div>
            </button>
          </div>

          {/* Hero Record Button Action */}
          <div className="pt-4">
            <button
              onClick={() => {
                if (onOpenCreateModal) onOpenCreateModal();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-sm shadow-lg shadow-white/10 border border-white/20 transition-all cursor-pointer active:scale-95"
            >
              <Video className="w-4 h-4 shrink-0 text-zinc-950" />
              <span>{t("nav.record_review", "Record Video Review")}</span>
            </button>
          </div>

          {/* Trust & Knowledge Section */}
          <div className="pt-4 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-200 px-3 mb-2">
              {t("drawer.trustSupport", "Trust & Support")}
            </p>

            {/* Knowledge & Trust Center */}
            <button
              onClick={() => handleNavClick("more")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeSection === "more"
                  ? "bg-zinc-900 text-white font-bold border border-zinc-700/80"
                  : "text-white hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-white" />
                <span>{t("more.trustGuidelines", "Knowledge & Trust Center")}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-200" />
            </button>
          </div>

          {/* Account & Session Controls (Standard Bottom Placement) */}
          <div className="pt-4 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 px-3 mb-2">
              {t("profile.accountSettings", "Account & Settings")}
            </p>

            {currentUser ? (
              <>
                {/* Notification Settings Action */}
                <button
                  id="btn-mobile-nav-notification-settings"
                  onClick={() => {
                    onClose();
                    if (onOpenNotificationSettings) onOpenNotificationSettings();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-white" />
                    <span>Notification Preferences</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </button>

                {/* Sign Out Button */}
                <button
                  onClick={() => {
                    if (onSignOut) onSignOut();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-zinc-200 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="w-4 h-4 text-zinc-200" />
                    <span>{t("nav.logout", "Sign Out")}</span>
                  </div>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  if (onOpenAuth) onOpenAuth("drawer");
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 transition-colors cursor-pointer border border-zinc-800"
              >
                <div className="flex items-center gap-3">
                  <LogIn className="w-4 h-4 text-white" />
                  <span>{t("auth.signIn", "Sign In")}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>
            )}
          </div>

          {/* Legal & Copyright Footer (Matching Desktop) */}
          <div className="pt-5 pb-8 space-y-2 border-t border-zinc-800/80 mt-2">
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
              <button
                onClick={() => {
                  if (onOpenLegal) onOpenLegal("privacy");
                  else handleNavClick("more");
                  onClose();
                }}
                className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                {t("legal.privacy", "Privacy")}
              </button>
              <span className="text-zinc-600">•</span>
              <button
                onClick={() => {
                  if (onOpenLegal) onOpenLegal("terms");
                  else handleNavClick("more");
                  onClose();
                }}
                className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                {t("legal.terms", "Terms")}
              </button>
              <span className="text-zinc-600">•</span>
              <button
                onClick={() => {
                  handleNavClick("more");
                }}
                className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                {t("legal.about", "About")}
              </button>
            </div>

            <p className="text-[11px] text-center text-zinc-400 font-normal">
              {t("legal.allRightsReserved", "© 2026 Yoouz. All rights reserved.")}
            </p>
          </div>
        </div>
      </div>

      {/* Language Selector Modal */}
      <LanguageSelectorModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
      />
    </div>
  );
};
