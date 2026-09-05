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
  User,
  LogOut,
  LogIn,
  CheckCircle2,
  FileText,
  Lock,
  HelpCircle,
  MessageSquare,
  Sparkles,
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
  onOpenEditProfile
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
        
        {/* Top Header: Sleek Close Button & Top Spacing */}
        <div className="flex items-center justify-between px-5 pt-[max(16px,calc(env(safe-area-inset-top,0px)+12px))] pb-3 border-b border-zinc-800/80 bg-zinc-950/95 sticky top-0 z-20">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Menu
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            title="Close menu"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-5 divide-y divide-zinc-800/60">
          
          {/* User Profile Card */}
          <div className="pt-1">
            {currentUser ? (
              <div
                onClick={() => handleNavClick("profile")}
                className="p-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 shadow-md transition-all active:scale-[0.98] cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-zinc-700 shrink-0"
                      referrerPolicy="no-referrer"
                     onError={(e) => { const target = e.currentTarget as HTMLImageElement; if (!target.src.includes('/api/avatar')) { target.src = '/api/avatar?name=User&background=27272a&color=fff'; } }} />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-white text-base shadow-sm shrink-0">
                      {currentUser.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-zinc-200 transition-colors">
                        {currentUser.name}
                      </h4>
                      <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300 shrink-0 fill-zinc-800" />
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {currentUser.email || ""}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                        <Sparkles className="w-2.5 h-2.5 text-zinc-400" />
                        Community Reviewer
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors shrink-0" />
                </div>

                <div className="mt-3 pt-2.5 border-t border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-zinc-400" />
                    View & Manage Profile
                  </span>
                  <span className="text-[11px] font-semibold text-white group-hover:text-zinc-200">
                    Open &rarr;
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-md text-left">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4 text-zinc-300" />
                  <h4 className="text-sm font-bold text-white">Join the Community</h4>
                </div>
                <p className="text-xs text-zinc-400 mb-3">
                  Sign in to record video reviews, follow creators, and save your favorite places.
                </p>
                <button
                  onClick={() => {
                    if (onOpenAuth) onOpenAuth("drawer");
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold shadow-md shadow-white/10 transition-all cursor-pointer active:scale-95"
                >
                  <LogIn className="w-4 h-4 text-zinc-950" />
                  <span>Sign In / Register</span>
                </button>
              </div>
            )}
          </div>

          {/* Core App Navigation */}
          <div className="pt-4 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 px-3 mb-2">
              Menu & Features
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
              <ChevronRight className="w-4 h-4 text-zinc-400" />
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
              <ChevronRight className="w-4 h-4 text-zinc-400" />
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
              <ChevronRight className="w-4 h-4 text-zinc-400" />
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
                <ChevronRight className="w-4 h-4 text-zinc-400" />
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
                <ChevronRight className="w-4 h-4 text-zinc-400" />
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
              <ChevronRight className="w-4 h-4 text-zinc-400" />
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
                <Globe className="w-4 h-4 text-zinc-300" />
                <span>{t("nav.language", "Language")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-300 font-medium">{currentLanguageMeta.nativeName}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono uppercase">
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
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 px-3 mb-2">
              Trust & Support
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
                <span>Trust Protocol & Guidelines</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>

            {/* Help & FAQs */}
            <button
              onClick={() => handleNavClick("more")}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-4 h-4 text-white" />
                <span>Help & FAQs</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>

            {/* Contact Support */}
            <button
              onClick={() => handleNavClick("more")}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-white" />
                <span>Contact Support</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>
          </div>

          {/* Account & Session Controls (Standard Bottom Placement) */}
          {currentUser && (
            <div className="pt-4 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 px-3 mb-2">
                Account & Settings
              </p>

              {/* Edit Profile Action */}
              <button
                onClick={() => {
                  if (onOpenEditProfile) onOpenEditProfile();
                  else handleNavClick("profile");
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-white hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-white" />
                  <span>Edit Profile</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>

              {/* Sign Out Button */}
              <button
                onClick={() => {
                  if (onSignOut) onSignOut();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-4 h-4 text-zinc-300" />
                  <span>Sign Out</span>
                </div>
              </button>
            </div>
          )}

          {/* Legal & Version Footer */}
          <div className="pt-5 pb-8 space-y-2 border-t border-zinc-800/80 mt-2">
            <div className="flex items-center justify-center gap-3 text-xs text-zinc-400">
              <button
                onClick={() => {
                  if (onOpenLegal) onOpenLegal("terms");
                  onClose();
                }}
                className="hover:text-zinc-200 transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
              <span className="text-zinc-600">•</span>
              <button
                onClick={() => {
                  if (onOpenLegal) onOpenLegal("privacy");
                  onClose();
                }}
                className="hover:text-zinc-200 transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
            </div>

            <p className="text-[11px] text-center text-zinc-500 font-mono">
              Yoouz Mobile PWA • v2.4.0
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
