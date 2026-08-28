import React from "react";
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
  Youtube,
  Instagram,
  Linkedin,
  Facebook
} from "lucide-react";
import { NavSection, UserProfile } from "../types";
import { triggerHaptic } from "../utils/haptics";

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
        
        {/* Top Header: Official Logo + Close Button */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-zinc-800/80 bg-zinc-950/95 sticky top-0 z-20">
          <div
            onClick={() => handleNavClick("home")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            {/* Yoouz Official Star Logo */}
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#1a73e8] shadow-[0_4px_14px_rgba(26,115,232,0.4)] border border-white/10 shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-white text-xl font-black tracking-tight font-['Google_Sans',sans-serif]">
                  Yoouz
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-[9px] text-blue-400 font-bold uppercase tracking-wider">
                  Beta
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 font-medium tracking-tight">
                Real People. Real Reviews.
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            title="Close menu"
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
                className="p-3.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800/80 shadow-md transition-all active:scale-[0.98] cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-500/30 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-base shadow-sm shrink-0">
                      {currentUser.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                        {currentUser.name}
                      </h4>
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 fill-blue-400/20" />
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {currentUser.email || ""}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Sparkles className="w-2.5 h-2.5" />
                        Community Reviewer
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors shrink-0" />
                </div>

                <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    View & Manage Profile
                  </span>
                  <span className="text-[11px] font-semibold text-blue-400 group-hover:text-blue-300">
                    Open &rarr;
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/60 to-zinc-900 border border-blue-500/30 shadow-md text-left">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4 text-blue-400" />
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
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer active:scale-95"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In / Register</span>
                </button>
              </div>
            )}
          </div>

          {/* Core App Navigation */}
          <div className="pt-4 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500 px-3 mb-2">
              Menu & Features
            </p>

            {/* Home Feed */}
            <button
              onClick={() => handleNavClick("home")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeSection === "home"
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Home className="w-4 h-4 text-blue-400" />
                <span>Home Feed</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </button>

            {/* Search Places & Websites */}
            <button
              onClick={() => {
                if (onOpenSearch) onOpenSearch();
                else handleNavClick("search");
                onClose();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Search className="w-4 h-4 text-amber-400" />
                <span>Search Websites & Places</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                URL
              </span>
            </button>

            {/* Discover */}
            <button
              onClick={() => handleNavClick("discover")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeSection === "discover"
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Compass className="w-4 h-4 text-purple-400" />
                <span>Discover Creators & Spots</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </button>

            {/* Following */}
            <button
              onClick={() => handleNavClick("following")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeSection === "following"
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Following</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </button>

            {/* Messages / Inbox */}
            <button
              onClick={() => handleNavClick("messages")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeSection === "messages"
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-cyan-400" />
                <span>Direct Messages</span>
              </div>
              {unreadMessagesCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white font-bold text-[10px]">
                  {unreadMessagesCount}
                </span>
              ) : (
                <ChevronRight className="w-4 h-4 text-zinc-600" />
              )}
            </button>

            {/* Notifications */}
            <button
              onClick={() => handleNavClick("notifications")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeSection === "notifications"
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-rose-400" />
                <span>Notifications</span>
              </div>
              {unreadNotifsCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold text-[10px]">
                  {unreadNotifsCount}
                </span>
              ) : (
                <ChevronRight className="w-4 h-4 text-zinc-600" />
              )}
            </button>

            {/* Bookmarks */}
            <button
              onClick={() => handleNavClick("bookmarks")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeSection === "bookmarks"
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Bookmark className="w-4 h-4 text-amber-400" />
                <span>Saved Bookmarks</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </button>

            {/* For Businesses */}
            <button
              onClick={() => handleNavClick("business")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeSection === "business"
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>For Businesses & Owners</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                PRO
              </span>
            </button>
          </div>

          {/* Hero Record Button Action */}
          <div className="pt-4">
            <button
              onClick={() => {
                if (onOpenCreateModal) onOpenCreateModal();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 border border-blue-400/20 transition-all cursor-pointer active:scale-95"
            >
              <Video className="w-4 h-4 shrink-0" />
              <span>Record Video Review</span>
            </button>
          </div>

          {/* Trust & Knowledge Section */}
          <div className="pt-4 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500 px-3 mb-2">
              Trust & Support
            </p>

            {/* Knowledge & Trust Center */}
            <button
              onClick={() => handleNavClick("more")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeSection === "more"
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>Trust Protocol & Guidelines</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </button>

            {/* Help & FAQs */}
            <button
              onClick={() => handleNavClick("more")}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-4 h-4 text-zinc-400" />
                <span>Help & FAQs</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </button>

            {/* Contact Support */}
            <button
              onClick={() => handleNavClick("more")}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-zinc-400" />
                <span>Contact Support</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </button>
          </div>

          {/* Account & Session Controls (Standard Bottom Placement) */}
          {currentUser && (
            <div className="pt-4 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500 px-3 mb-2">
                Account & Settings
              </p>

              {/* Edit Profile Action */}
              <button
                onClick={() => {
                  if (onOpenEditProfile) onOpenEditProfile();
                  else handleNavClick("profile");
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-blue-400" />
                  <span>Edit Profile</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600" />
              </button>

              {/* Sign Out Button */}
              <button
                onClick={() => {
                  if (onSignOut) onSignOut();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-4 h-4 text-red-400" />
                  <span>Sign Out</span>
                </div>
              </button>
            </div>
          )}

          {/* Legal & Social Footer */}
          <div className="pt-4 pb-6 space-y-4">
            <div className="flex items-center justify-center gap-3 text-xs text-zinc-500">
              <button
                onClick={() => {
                  if (onOpenLegal) onOpenLegal("terms");
                  onClose();
                }}
                className="hover:text-zinc-300 transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
              <span>•</span>
              <button
                onClick={() => {
                  if (onOpenLegal) onOpenLegal("privacy");
                  onClose();
                }}
                className="hover:text-zinc-300 transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
            </div>

            {/* Social Icons */}
            <div className="flex items-center justify-center gap-3">
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:border-red-500/30 transition-all cursor-pointer"
                title="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/30 transition-all cursor-pointer"
                title="X (Twitter)"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-cyan-400 hover:border-cyan-400/30 transition-all cursor-pointer"
                title="TikTok"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.65a6.34 6.34 0 0 0 10.86 4.48A6.33 6.33 0 0 0 15.86 16v-7a8.28 8.28 0 0 0 4.84 1.57v-3.5a4.84 4.84 0 0 1-1.11-.38z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-pink-500 hover:border-pink-500/30 transition-all cursor-pointer"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-blue-400 hover:border-blue-400/30 transition-all cursor-pointer"
                title="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>

            <p className="text-[10px] text-center text-zinc-600 font-mono">
              Yoouz Mobile PWA • v2.4.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
