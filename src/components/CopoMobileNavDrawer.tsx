import React from "react";
import {
  Home,
  Search,
  UserPlus,
  Mail,
  Bell,
  Bookmark,
  Shield,
  User,
  Menu,
  Video,
  X
} from "lucide-react";
import { NavSection, UserProfile } from "../types";
import { triggerHaptic } from "../utils/haptics";
import { useLanguage } from "../i18n/LanguageContext";

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
  const { t } = useLanguage();

  if (!isOpen) return null;

  const handleNavClick = (section: NavSection) => {
    triggerHaptic("selection");
    onSelectSection(section);
    onClose();
  };

  const navItems = [
    { id: "home" as NavSection, label: t("nav.home", "Home"), icon: Home },
    { id: "search" as NavSection, label: t("nav.search", "Search"), icon: Search, hasDot: true },
    { id: "following" as NavSection, label: t("nav.following", "Following"), icon: UserPlus },
    { id: "messages" as NavSection, label: t("nav.messages", "Messages"), icon: Mail, badge: unreadMessagesCount },
    { id: "notifications" as NavSection, label: t("nav.notifications", "Notifications"), icon: Bell, badge: unreadNotifsCount },
    { id: "bookmarks" as NavSection, label: t("nav.bookmarks", "Bookmarks"), icon: Bookmark },
    { id: "business" as NavSection, label: t("nav.business", "For Businesses"), icon: Shield },
    { id: "profile" as NavSection, label: t("nav.profile", "Profile"), icon: User },
    { id: "more" as NavSection, label: t("nav.more", "More"), icon: Menu }
  ];

  return (
    <div className="fixed inset-0 z-[300] flex animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer Container (exact 1-to-1 match to desktop sidebar styling) */}
      <div className="relative w-[85%] max-w-[320px] h-[100dvh] bg-zinc-950 text-white border-r border-zinc-800/80 shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-300 ease-out select-none">
        
        {/* Top Header: Brand Logo, Tagline & Close Button */}
        <div className="flex items-center justify-between px-4 pt-[max(16px,calc(env(safe-area-inset-top,0px)+12px))] pb-3 border-b border-zinc-800/80 bg-zinc-950/95 sticky top-0 z-20">
          <div
            onClick={() => handleNavClick("home")}
            className="flex items-center gap-3 cursor-pointer active:scale-95 transition-transform group min-w-0"
          >
            <div className="relative flex items-center justify-center w-[40px] h-[40px] rounded-[13px] bg-zinc-900 shadow-[0_4px_16px_rgba(0,0,0,0.5)] shrink-0 border border-zinc-800">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div className="flex flex-col justify-center min-w-0 pt-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-white text-[21px] font-black tracking-tight leading-none font-['Google_Sans',sans-serif]">
                  Yoouz
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[8.5px] text-zinc-300 font-black uppercase tracking-wider scale-90 origin-left">
                  Beta
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 font-medium tracking-tight mt-1 whitespace-nowrap">
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

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3.5 py-3 flex flex-col justify-between">
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              const isProfileItem = item.id === "profile" && currentUser?.avatar;

              return (
                <button
                  key={item.id}
                  id={`mobile-nav-${item.id}`}
                  onClick={() => {
                    if (item.id === "search") {
                      if (onOpenSearch) onOpenSearch();
                      else handleNavClick("search");
                      onClose();
                    } else {
                      handleNavClick(item.id);
                    }
                  }}
                  className={`relative flex items-center gap-3.5 px-4 py-3 rounded-full text-[15px] text-left transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                    isActive
                      ? "bg-zinc-900 border border-zinc-700/80 text-white font-bold shadow-xs"
                      : "text-white hover:bg-zinc-900/90 font-medium"
                  }`}
                >
                  <div className="relative flex items-center justify-center">
                    {isProfileItem ? (
                      <img
                        src={currentUser!.avatar}
                        alt={currentUser!.name || "Profile"}
                        className={`w-5 h-5 rounded-full object-cover shrink-0 ring-1.5 ${
                          isActive ? "ring-white" : "ring-white/40"
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
                      <Icon className="w-5 h-5 shrink-0 text-white" />
                    )}

                    {item.hasDot && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white ring-2 ring-zinc-950" />
                    )}
                  </div>

                  <span className="truncate flex-1">
                    {item.id === "profile" && currentUser?.name
                      ? currentUser.name.split(" ")[0]
                      : item.label}
                  </span>

                  {item.badge && item.badge > 0 ? (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-zinc-800 text-white border border-zinc-700">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}

            {/* Video Review Primary Hero CTA (Matching Desktop Solid White Button) */}
            <button
              id="mobile-nav-record-btn"
              onClick={() => {
                if (onOpenCreateModal) onOpenCreateModal();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-[15px] tracking-tight shadow-lg shadow-white/10 my-1 mt-4 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Video className="w-5 h-5 shrink-0 text-zinc-950 stroke-[2.2]" />
              <span>{t("nav.record_review", "Video Review")}</span>
            </button>
          </nav>

          {/* Legal & Copyright Footer (Matching Desktop 1-to-1) */}
          <div className="flex flex-col gap-2 px-3 pt-6 pb-[max(16px,env(safe-area-inset-bottom,0px))] border-t border-zinc-900/80 text-xs text-zinc-400 mt-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (onOpenLegal) onOpenLegal("privacy");
                  else handleNavClick("more");
                }}
                className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-xs text-zinc-400"
              >
                {t("legal.privacy", "Privacy")}
              </button>
              <span>•</span>
              <button
                onClick={() => {
                  if (onOpenLegal) onOpenLegal("terms");
                  else handleNavClick("more");
                }}
                className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-xs text-zinc-400"
              >
                {t("legal.terms", "Terms")}
              </button>
              <span>•</span>
              <button
                onClick={() => handleNavClick("more")}
                className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-xs text-zinc-400"
              >
                {t("legal.about", "About")}
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 font-normal">
              {t("legal.allRightsReserved", "© 2026 Yoouz. All rights reserved.")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
