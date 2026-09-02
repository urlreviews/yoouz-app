import React from "react";
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
  Youtube,
  Instagram,
  Linkedin,
  Facebook,
  Video,
  Shield,
  Download
} from "lucide-react";
import { NavSection, UserProfile } from "../types";

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
 
  const navItems = [
    { id: "home" as NavSection, label: "Home", icon: Home },
    { id: "search" as NavSection, label: "Search", icon: Search, hasDot: true },
    { id: "discover" as NavSection, label: "Discover", icon: Compass },
    { id: "following" as NavSection, label: "Following", icon: UserPlus },
    { id: "messages" as NavSection, label: "Messages", icon: Mail, badge: unreadMessagesCount },
    { id: "notifications" as NavSection, label: "Notifications", icon: Bell, badge: unreadNotifsCount },
    { id: "bookmarks" as NavSection, label: "Bookmarks", icon: Bookmark },
    { id: "business" as NavSection, label: "For Businesses", icon: Shield },
    { id: "profile" as NavSection, label: "Profile", icon: User },
    { id: "more" as NavSection, label: "More", icon: Menu },
    { id: "record_review" as NavSection, label: "Record Review", icon: Video, isDarkBlue: true }
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
            <div className="relative flex items-center justify-center w-[42px] h-[42px] rounded-[14px] bg-white shadow-[0_4px_16px_rgba(255,255,255,0.15)] group-hover:shadow-[0_6px_20px_rgba(255,255,255,0.25)] group-hover:-translate-y-0.5 transition-all duration-300 shrink-0 border border-white/20">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-zinc-950">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div className="flex flex-col justify-center pt-0.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-white text-[23px] font-black tracking-tight leading-none font-['Google_Sans',sans-serif]">
                  Yoouz
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[9px] text-zinc-300 font-black uppercase tracking-wider scale-90 origin-left">
                  Beta
                </span>
              </div>
              <span className="text-[11.5px] text-zinc-400 font-medium tracking-tight mt-1 whitespace-nowrap flex items-center gap-1.5">
                Real People. Real Reviews.
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
                    className={`relative flex items-center gap-3.5 px-4 py-3 rounded-full font-medium text-[15px] transition-all duration-150 text-left cursor-pointer group ${
                      item.isDarkBlue
                        ? "bg-white text-zinc-950 hover:bg-zinc-200 shadow-md shadow-white/10 font-bold my-1 mt-4 active:scale-95"
                        : isActive
                        ? "bg-zinc-900 border border-zinc-800 text-white font-bold shadow-xs"
                        : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                    }`}
                  >
                    <div className="relative flex items-center justify-center">
                      {isProfileItem ? (
                        <img
                          src={currentUser!.avatar}
                          alt={currentUser!.name || "Profile"}
                          className={`w-5 h-5 rounded-full object-cover shrink-0 ring-1.5 ${
                            isActive ? "ring-white" : "ring-zinc-700"
                          }`}
                          referrerPolicy="no-referrer"
                         onError={(e) => { const target = e.currentTarget as HTMLImageElement; if (!target.src.includes('/api/avatar')) { target.src = '/api/avatar?name=User&background=27272a&color=fff'; } }} />
                      ) : (
                        <Icon
                          className={`w-5 h-5 shrink-0 transition-colors ${
                            item.isDarkBlue ? "text-zinc-950" : isActive ? "text-white" : "text-zinc-400 group-hover:text-white"
                          }`}
                        />
                      )}
                      {item.hasDot && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white ring-2 ring-zinc-950" />
                      )}
                    </div>
                    <span className="truncate flex-1">
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

        {/* Footer & Social Media Channels */}
        <div className="px-3 pt-4 border-t border-zinc-800/80 text-xs text-zinc-400 flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              className="w-7 h-7 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white flex items-center justify-center transition-all shadow-3xs cursor-pointer active:scale-90"
              title="YouTube"
            >
              <Youtube className="w-3.5 h-3.5" strokeWidth={2} />
            </a>
            <a
              href="https://x.com"
              target="_blank"
              rel="noreferrer"
              className="w-7 h-7 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white flex items-center justify-center transition-all shadow-3xs cursor-pointer active:scale-90"
              title="X"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noreferrer"
              className="w-7 h-7 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white flex items-center justify-center transition-all shadow-3xs cursor-pointer active:scale-90"
              title="TikTok"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298 0 .59.04.87.12V9.4a6.34 6.34 0 0 0-6.63 6.31A6.34 6.34 0 0 0 10.06 22a6.34 6.34 0 0 0 6.32-6.33V9.58a8.28 8.28 0 0 0 4.88 1.58V7.71a4.83 4.83 0 0 1-1.67-1.02z" />
              </svg>
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="w-7 h-7 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white flex items-center justify-center transition-all shadow-3xs cursor-pointer active:scale-90"
              title="Instagram"
            >
              <Instagram className="w-3.5 h-3.5" strokeWidth={2} />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="w-7 h-7 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white flex items-center justify-center transition-all shadow-3xs cursor-pointer active:scale-90"
              title="LinkedIn"
            >
              <Linkedin className="w-3.5 h-3.5" strokeWidth={2} />
            </a>
            <a
              href="https://www.facebook.com/yoouz.official/"
              target="_blank"
              rel="noreferrer"
              className="w-7 h-7 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white flex items-center justify-center transition-all shadow-3xs cursor-pointer active:scale-90"
              title="Facebook (@yoouz.official)"
            >
              <Facebook className="w-3.5 h-3.5" strokeWidth={2} />
            </a>
          </div>
          <div className="flex items-center justify-center gap-2 text-[10px] font-semibold text-zinc-500">
            <button
              onClick={() => onOpenLegal ? onOpenLegal("privacy") : onSelectSection("more")}
              className="hover:text-zinc-300 transition-colors cursor-pointer bg-transparent border-none p-0"
            >
              Privacy
            </button>
            <span>•</span>
            <button
              onClick={() => onOpenLegal ? onOpenLegal("terms") : onSelectSection("more")}
              className="hover:text-zinc-300 transition-colors cursor-pointer bg-transparent border-none p-0"
            >
              Terms
            </button>
          </div>
          <p className="text-[11px] text-zinc-500">© 2026 Yoouz • All rights reserved.</p>
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
            className="flex items-center justify-center w-[42px] h-[42px] rounded-[14px] bg-white shadow-[0_4px_16px_rgba(255,255,255,0.15)] cursor-pointer hover:-translate-y-0.5 transition-all duration-300 border border-white/20"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-zinc-950">
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
                        ? "bg-white hover:bg-zinc-200 text-zinc-950 shadow-md shadow-white/10 my-1 mt-4"
                        : isActive
                        ? "bg-zinc-800 text-white shadow-xs"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                    }`}
                    title={item.label}
                  >
                    <div className="relative flex items-center justify-center">
                      {isProfileItem ? (
                        <img
                          src={currentUser!.avatar}
                          alt={currentUser!.name || "Profile"}
                          className={`w-7 h-7 rounded-full object-cover shrink-0 ring-2 ${
                            isActive ? "ring-white" : "ring-zinc-700"
                          }`}
                          referrerPolicy="no-referrer"
                         onError={(e) => { const target = e.currentTarget as HTMLImageElement; if (!target.src.includes('/api/avatar')) { target.src = '/api/avatar?name=User&background=27272a&color=fff'; } }} />
                      ) : (
                        <Icon
                          className={`w-[22px] h-[22px] shrink-0 ${
                            item.isDarkBlue ? "text-zinc-950" : isActive ? "text-white" : "text-zinc-400"
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
      <nav
        id="copo-mobile-bottom-nav"
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-2xl border-t border-zinc-800/90 text-white shadow-[0_-8px_30px_rgba(0,0,0,0.8)]"
        style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom, 10px))" }}>
        <div className="flex items-center justify-around px-2 pt-2 pb-1 max-w-lg mx-auto relative">
          {/* 1. Home */}
          <button
            id="mobile-nav-home-btn"
            onClick={() => onSelectSection("home")}
            className={`flex flex-col items-center justify-center py-1 px-3 flex-1 rounded-xl active:scale-90 transition-all duration-200 cursor-pointer ${
              activeSection === "home"
                ? "text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Home
              className={`w-[22px] h-[22px] transition-transform duration-200 ${
                activeSection === "home"
                  ? "scale-110 fill-white/20 stroke-[2.5] text-white"
                  : "stroke-[1.8] text-zinc-400"
              }`}
            />
            <span
              className={`text-[10px] tracking-tight mt-1 ${
                activeSection === "home" ? "font-bold text-white" : "font-medium text-zinc-400"
              }`}
            >
              Home
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
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <div className="relative">
              <Search
                className={`w-[22px] h-[22px] transition-transform duration-200 ${
                  activeSection === "search" || activeSection === "discover"
                    ? "scale-110 stroke-[2.5] text-white"
                    : "stroke-[1.8] text-zinc-400"
                }`}
              />
            </div>
            <span
              className={`text-[10px] tracking-tight mt-1 ${
                activeSection === "search" || activeSection === "discover"
                  ? "font-bold text-white"
                  : "font-medium text-zinc-400"
              }`}
            >
              Search
            </span>
          </button>

          {/* 3. CENTER HERO ACTION: [+] Record Review */}
          <div className="flex flex-col items-center justify-center px-1 flex-1 relative -top-3">
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
              className="group relative flex items-center justify-center w-[52px] h-[52px] rounded-full bg-white text-zinc-950 shadow-[0_8px_20px_rgba(255,255,255,0.2)] border-[3px] border-zinc-950 active:scale-95 transition-all duration-200 hover:bg-zinc-200 cursor-pointer"
            >
              <Video className="w-[24px] h-[24px] stroke-[2.2] text-zinc-950" />
            </button>
            <span className="text-[9px] tracking-tight mt-1 font-bold text-zinc-300">
              Record
            </span>
          </div>

          {/* 4. Inbox & Activity */}
          <button
            id="mobile-nav-inbox-btn"
            onClick={() => onSelectSection("messages")}
            className={`relative flex flex-col items-center justify-center py-1 px-3 flex-1 rounded-xl active:scale-90 transition-all duration-200 cursor-pointer ${
              activeSection === "messages" || activeSection === "notifications"
                ? "text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <div className="relative">
              <Mail
                className={`w-[22px] h-[22px] transition-transform duration-200 ${
                  activeSection === "messages" || activeSection === "notifications"
                    ? "scale-110 stroke-[2.5] text-white"
                    : "stroke-[1.8] text-zinc-400"
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
                  : "font-medium text-zinc-400"
              }`}
            >
              Inbox
            </span>
          </button>

          {/* 5. Profile */}
          <button
            id="mobile-nav-profile-btn"
            onClick={() => onSelectSection("profile")}
            className={`flex flex-col items-center justify-center py-1 px-3 flex-1 rounded-xl active:scale-90 transition-all duration-200 cursor-pointer ${
              activeSection === "profile" || activeSection === "more"
                ? "text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name || "Profile"}
                className={`w-[22px] h-[22px] rounded-full object-cover ring-2 transition-all ${
                  activeSection === "profile" || activeSection === "more"
                    ? "ring-white scale-110"
                    : "ring-zinc-700"
                }`}
                referrerPolicy="no-referrer"
               onError={(e) => { const target = e.currentTarget as HTMLImageElement; if (!target.src.includes('/api/avatar')) { target.src = '/api/avatar?name=User&background=27272a&color=fff'; } }} />
            ) : (
              <User
                className={`w-[22px] h-[22px] transition-transform duration-200 ${
                  activeSection === "profile" || activeSection === "more"
                    ? "scale-110 stroke-[2.5] text-white"
                    : "stroke-[1.8] text-zinc-400"
                }`}
              />
            )}
            <span
              className={`text-[10px] tracking-tight mt-1 ${
                activeSection === "profile" || activeSection === "more" ? "font-bold text-white" : "font-medium text-zinc-400"
              }`}
            >
              {currentUser?.name ? currentUser.name.split(" ")[0] : "Profile"}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
