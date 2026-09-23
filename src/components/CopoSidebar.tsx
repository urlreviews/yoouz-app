import React, { useState } from "react";
import {
  Home,
  Compass,
  UserPlus,
  Users,
  Search,
  MapPin,
  Mail,
  Bell,
  Bookmark,
  User,
  Menu,
  Video,
  Shield,
  Download,
  Globe
} from "lucide-react";
import { NavSection, UserProfile } from "../types";
import { useLanguage } from "../i18n/LanguageContext";
import { LanguageSelectorModal } from "./LanguageSelectorModal";
import { CopoMobileBottomNav } from "./CopoMobileBottomNav";
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
}

export const CopoSidebar: React.FC<CopoSidebarProps> = ({
  activeSection,
  onSelectSection,
  currentUser,
  unreadNotifsCount = 0,
  unreadMessagesCount = 0,
  onOpenSearch,
  onOpenCreateModal,
  onOpenLegal
}) => {
  const { t, currentLanguageMeta, isRTL } = useLanguage();
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const mobileNavRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const updateNavHeight = () => {
      if (typeof window === "undefined") return;
      if (window.innerWidth < 768 && mobileNavRef.current) {
        const height = mobileNavRef.current.offsetHeight || mobileNavRef.current.getBoundingClientRect().height;
        if (height > 0) {
          document.documentElement.style.setProperty("--mobile-nav-height", `${Math.round(height)}px`);
          return;
        }
      } else if (window.innerWidth >= 768) {
        document.documentElement.style.setProperty("--mobile-nav-height", "0px");
      }
    };

    updateNavHeight();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && mobileNavRef.current) {
      ro = new ResizeObserver(() => updateNavHeight());
      ro.observe(mobileNavRef.current);
    }

    window.addEventListener("resize", updateNavHeight, { passive: true });
    window.addEventListener("orientationchange", updateNavHeight, { passive: true });

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", updateNavHeight);
      window.removeEventListener("orientationchange", updateNavHeight);
    };
  }, []);
 
  const navItems = [
    { id: "home" as NavSection, label: t("nav.home", "Home"), icon: Home },
    { id: "search" as NavSection, label: t("nav.search", "Search"), icon: Search, hasDot: true },
    { id: "following" as NavSection, label: t("nav.following", "Following"), icon: UserPlus },
    { id: "messages" as NavSection, label: t("nav.messages", "Messages"), icon: Mail, badge: unreadMessagesCount },
    { id: "notifications" as NavSection, label: t("nav.notifications", "Alerts"), icon: Bell, badge: unreadNotifsCount },
    { id: "bookmarks" as NavSection, label: t("nav.bookmarks", "Saved"), icon: Bookmark },
    { id: "business" as NavSection, label: t("nav.business", "Business"), icon: Shield },
    { id: "profile" as NavSection, label: t("nav.profile", "Profile"), icon: User },
    { id: "more" as NavSection, label: t("nav.more", "More"), icon: Menu },
    { id: "record_review" as NavSection, label: t("nav.record_review", "Record"), icon: Video, isDarkBlue: true }
  ];

  return (
    <>
      {/* 1. Desktop Left Sidebar (Expanded - lg and above) */}
      <aside
        id="copo-desktop-sidebar"
        className="hidden lg:flex flex-col w-64 h-[100dvh] shrink-0 bg-zinc-950 border-r border-zinc-800/80 px-4 py-6 justify-between select-none z-30 shadow-none text-white"
      >
        <div className="flex flex-col gap-6">
          {/* Official Yoouz Logo */}
          <div
            id="copo-brand-logo"
            onClick={() => onSelectSection("home")}
            className="flex items-center gap-3 px-3 py-2 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-[42px] h-[42px] rounded-[14px] bg-zinc-900 shadow-[0_4px_16px_rgba(0,0,0,0.5)] group-hover:shadow-[0_6px_20px_rgba(0,0,0,0.6)] group-hover:-translate-y-0.5 transition-all duration-300 shrink-0 border border-zinc-800">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div className="flex flex-col justify-center pt-0.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-white text-[23px] font-black tracking-tight leading-none font-['Google_Sans',sans-serif]">
                  Yoouz
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[9px] text-zinc-200 font-black uppercase tracking-wider scale-90 origin-left">
                  Beta
                </span>
              </div>
              <span className="text-[11.5px] text-zinc-200 font-medium tracking-tight mt-1 whitespace-nowrap flex items-center gap-1.5">
                {t("legal.tagline", "Real People. Real Reviews.")}
              </span>
            </div>
          </div>

          {/* Navigation items list */}
          <nav className="flex flex-col gap-1.5 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              const isProfileItem = item.id === "profile" && currentUser?.avatar;

              return (
                <React.Fragment key={item.id}>
                  <button
                    key={item.id}
                    id={`nav-btn-${item.id}`}
                    onClick={() => onSelectSection(item.id)}
                    className={`relative flex items-center transition-all duration-150 cursor-pointer group ${
                      item.isDarkBlue
                        ? "justify-center gap-2.5 px-4 py-3.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-[15px] tracking-tight shadow-lg my-1 mt-4 active:scale-[0.98] transition-all"
                        : isActive
                        ? "gap-3.5 px-4 py-3 rounded-full text-[15px] text-left bg-zinc-900 border border-zinc-700/80 text-white font-bold shadow-xs"
                        : "gap-3.5 px-4 py-3 rounded-full text-[15px] text-left text-white hover:bg-zinc-900/90 font-medium"
                    }`}
                  >
                    <div className="relative flex items-center justify-center">
                      {isProfileItem ? (
                        <img
                          src={getSafeAvatarUrl(currentUser?.avatar, currentUser?.name, (currentUser as any)?.handle || currentUser?.email)}
                          alt={currentUser?.name || "Profile"}
                          className={`w-5 h-5 rounded-full object-cover shrink-0 ring-1.5 ${
                            isActive ? "ring-white" : "ring-white/40"
                          }`}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.src = getSafeAvatarUrl(null, currentUser?.name, (currentUser as any)?.handle || currentUser?.email);
                          }}
                        />
                      ) : (
                        <Icon
                          className={`w-5 h-5 shrink-0 transition-colors ${
                            item.isDarkBlue ? "text-zinc-950 stroke-[2.2]" : "text-white"
                          }`}
                        />
                      )}
                      {item.hasDot && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white ring-2 ring-zinc-950" />
                      )}
                    </div>
                    <span className={item.isDarkBlue ? "font-bold text-[15px] text-zinc-950 tracking-tight" : "truncate flex-1"}>
                      {item.id === "profile" && currentUser?.name ? currentUser.name.split(" ")[0] : item.label}
                    </span>
                    
                    {item.badge && item.badge > 0 ? (
                      <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-zinc-800 text-white border border-zinc-700">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Footer & Legal Links */}
        <div className="px-3 pt-4 border-t border-zinc-800/80 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-200">
            <button
              onClick={() => onOpenLegal ? onOpenLegal("privacy") : onSelectSection("more")}
              className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0"
            >
              {t("legal.privacy", "Privacy")}
            </button>
            <span className="text-zinc-600">•</span>
            <button
              onClick={() => onOpenLegal ? onOpenLegal("terms") : onSelectSection("more")}
              className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0"
            >
              {t("legal.terms", "Terms")}
            </button>
            <span className="text-zinc-600">•</span>
            <button
              onClick={() => onSelectSection("more")}
              className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0"
            >
              {t("legal.about", "About")}
            </button>
          </div>
          <p className="text-[11px] text-zinc-200 font-normal">{t("legal.allRightsReserved", "© 2026 Yoouz. All rights reserved.")}</p>
        </div>
      </aside>

      {/* 2. Tablet Left Rail (Collapsed - md to lg) */}
      <aside
        id="copo-tablet-rail"
        className="hidden md:flex lg:hidden flex-col w-[76px] h-[100dvh] shrink-0 bg-zinc-950 border-r border-zinc-800/80 py-6 items-center justify-between select-none z-30 shadow-none text-white"
      >
        <div className="flex flex-col gap-6 items-center w-full">
          {/* Logo Icon Only */}
          <div
            onClick={() => onSelectSection("home")}
            className="flex items-center justify-center w-[42px] h-[42px] rounded-[14px] bg-zinc-900 shadow-[0_4px_16px_rgba(0,0,0,0.5)] cursor-pointer hover:-translate-y-0.5 transition-all duration-300 border border-zinc-800"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>

          {/* Navigation items list (Icons Only) */}
          <nav className="flex flex-col gap-3 w-full px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              const isProfileItem = item.id === "profile" && currentUser?.avatar;

              return (
                <React.Fragment key={item.id}>
                  <button
                    key={item.id}
                    onClick={() => onSelectSection(item.id)}
                    className={`relative flex items-center justify-center w-12 h-12 mx-auto rounded-full transition-all duration-150 cursor-pointer ${
                      item.isDarkBlue
                        ? "bg-white hover:bg-zinc-200 text-zinc-950 shadow-lg my-1 mt-4 active:scale-95 transition-all"
                        : isActive
                        ? "bg-zinc-850 border border-zinc-700 text-white shadow-xs"
                        : "text-white hover:bg-zinc-900/90"
                    }`}
                    title={item.label}
                  >
                    <div className="relative flex items-center justify-center">
                      {isProfileItem ? (
                        <img
                          src={getSafeAvatarUrl(currentUser?.avatar, currentUser?.name, (currentUser as any)?.handle || currentUser?.email)}
                          alt={currentUser!.name || "Profile"}
                          className={`w-7 h-7 rounded-full object-cover shrink-0 ring-2 ${
                            isActive ? "ring-white" : "ring-white/40"
                          }`}
                          referrerPolicy="no-referrer"
                         onError={(e) => { const target = e.currentTarget as HTMLImageElement; if (!target.src.includes('/api/avatar')) { target.src = '/api/avatar?name=User&background=27272a&color=fff'; } }} />
                      ) : (
                        <Icon
                          className={`w-[22px] h-[22px] shrink-0 transition-colors ${
                            item.isDarkBlue ? "text-zinc-950 stroke-[2.2]" : "text-white"
                          }`}
                        />
                      )}
                      {item.hasDot && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white ring-2 ring-zinc-950" />
                      )}
                    </div>
                    {item.badge && item.badge > 0 ? (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[9px] font-bold rounded-full bg-zinc-800 text-white border border-zinc-700 ring-2 ring-zinc-950">
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    ) : null}
                  </button>
                </React.Fragment>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* 3. Mobile Native 5-Tab Bottom Navigation Bar (iOS & Android Universal) */}
      <CopoMobileBottomNav
        activeSection={activeSection}
        onSelectSection={onSelectSection}
        currentUser={currentUser}
        unreadNotifsCount={unreadNotifsCount}
        unreadMessagesCount={unreadMessagesCount}
        onOpenCreateModal={onOpenCreateModal}
        onOpenSearch={onOpenSearch}
        className="md:hidden fixed bottom-0 left-0 right-0"
      />

      {/* Language Selection Modal */}
      <LanguageSelectorModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
      />
    </>
  );
};
