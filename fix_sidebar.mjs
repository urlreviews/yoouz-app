import fs from 'fs';
fs.writeFileSync('src/components/CopoSidebar.tsx', `import React from "react";
import { Search, Home, Map, Plus, Bookmark, Compass, LayoutDashboard, Globe, Bell, Mail, Settings, UserCircle, Star, LogOut, Flame, Info, CheckCircle, Verified, LayoutGrid } from "lucide-react";
import { NavSection, UserProfile } from "../types";
import { t } from "../i18n/translations";

interface NavItem {
  id: NavSection;
  label: string;
  icon: any;
  hasDot?: boolean;
  badge?: number;
  isDarkBlue?: boolean;
}

interface CopoSidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  onOpenSearch?: () => void;
  onOpenCreateReview?: () => void;
  currentUser: UserProfile | null;
  unreadMessagesCount: number;
  unreadNotifsCount: number;
}

export const CopoSidebar: React.FC<CopoSidebarProps> = ({
  activeSection,
  onSelectSection,
  onOpenSearch,
  onOpenCreateReview,
  currentUser,
  unreadMessagesCount,
  unreadNotifsCount,
}) => {
  const navItems: NavItem[] = [
    { id: "home" as NavSection, label: t("nav.home", "Home"), icon: Home },
    { id: "search" as NavSection, label: t("nav.search", "Search"), icon: Search },
    { id: "create" as NavSection, label: t("nav.create", "Record Review"), icon: Plus, isDarkBlue: true },
    { id: "discover" as NavSection, label: t("nav.discover", "Discover"), icon: Compass },
    { id: "map" as NavSection, label: t("nav.map", "Map"), icon: Map },
    { id: "bookmarks" as NavSection, label: t("nav.bookmarks", "Saved"), icon: Bookmark },
  ];

  if (currentUser) {
    if (currentUser.role === "business" || currentUser.role === "admin") {
      navItems.splice(2, 0, { id: "business" as NavSection, label: t("nav.business", "Business Hub"), icon: LayoutDashboard });
    }
    if (currentUser.role === "admin") {
      navItems.push({ id: "admin" as NavSection, label: "Admin Panel", icon: Star });
    }
  }

  return (
    <>
      {/* 1. Desktop Sidebar (lg and up) */}
      <aside
        id="copo-desktop-sidebar"
        className="hidden lg:flex flex-col w-64 h-[100dvh] shrink-0 bg-zinc-950 border-r border-zinc-800/80 px-4 py-6 justify-between select-none z-30 shadow-none text-white"
      >
        <div className="flex flex-col gap-6">
          {/* Logo & Tagline */}
          <div
            onClick={() => onSelectSection("home")}
            className="flex items-center gap-3.5 px-3 py-1 mb-2 cursor-pointer group"
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
                    id={"nav-btn-"+item.id}
                    onClick={() => {
                      if (item.id === "search" && onOpenSearch) {
                        onOpenSearch();
                      } else {
                        onSelectSection(item.id);
                      }
                    }}
                    className={"relative flex items-center gap-3.5 px-4 py-3 rounded-full text-[15px] transition-all duration-150 text-left cursor-pointer group " + (
                      item.isDarkBlue
                        ? "bg-white text-zinc-950 hover:bg-zinc-200 shadow-md shadow-white/10 font-bold my-1 mt-4 active:scale-95"
                        : isActive
                        ? "bg-zinc-900 border border-zinc-700/80 text-white font-bold shadow-xs"
                        : item.id === "search"
                        ? "text-white bg-zinc-900 border border-zinc-800 shadow-sm"
                        : "text-white hover:bg-zinc-900/90 font-medium"
                    )}
                  >
                    <div className="relative flex items-center justify-center">
                      {isProfileItem ? (
                        <img
                          src={currentUser!.avatar}
                          alt={currentUser!.name || "Profile"}
                          className={"w-7 h-7 rounded-full object-cover shrink-0 ring-2 " + (
                            isActive ? "ring-white" : "ring-white/40"
                          )}
                          referrerPolicy="no-referrer"
                         onError={(e) => { const target = e.currentTarget as HTMLImageElement; if (!target.src.includes('/api/avatar')) { target.src = '/api/avatar?name=User&background=27272a&color=fff'; } }} />
                      ) : (
                        <Icon
                          className={"w-5 h-5 shrink-0 transition-colors " + (
                            item.isDarkBlue ? "text-zinc-950" : "text-white"
                          )}
                        />
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

        <div className="flex flex-col gap-3">
          <div className="px-3 pt-4 border-t border-zinc-800/80 flex flex-col gap-2">
            <button
              onClick={() => onSelectSection("more")}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-zinc-100 hover:text-white hover:bg-zinc-900/40 text-sm font-medium cursor-pointer"
            >
              <LayoutGrid className="w-5 h-5 stroke-[2.2] shrink-0" />
              <span>More Settings</span>
            </button>
            <button
              onClick={() => {}}
              className="text-left px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
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
                    onClick={() => {
                      if (item.id === "search" && onOpenSearch) {
                        onOpenSearch();
                      } else {
                        onSelectSection(item.id);
                      }
                    }}
                    className={"relative flex items-center justify-center w-12 h-12 mx-auto rounded-full transition-all duration-150 cursor-pointer " + (
                      item.isDarkBlue
                        ? "bg-white hover:bg-zinc-200 text-zinc-950 shadow-md shadow-white/10 my-1 mt-4"
                        : isActive
                        ? "bg-zinc-900 border border-zinc-700/80 text-white"
                        : "text-zinc-100 hover:text-white hover:bg-zinc-900/60"
                    )}
                    title={item.label}
                  >
                    <div className="relative flex items-center justify-center">
                      {isProfileItem ? (
                        <img
                          src={currentUser!.avatar}
                          alt={currentUser!.name || "Profile"}
                          className={"w-7 h-7 rounded-full object-cover shrink-0 ring-2 " + (
                            isActive ? "ring-white" : "ring-white/40"
                          )}
                          referrerPolicy="no-referrer"
                         onError={(e) => { const target = e.currentTarget as HTMLImageElement; if (!target.src.includes('/api/avatar')) { target.src = '/api/avatar?name=User&background=27272a&color=fff'; } }} />
                      ) : (
                        <Icon
                          className={"w-[22px] h-[22px] shrink-0 " + (
                            item.isDarkBlue ? "text-zinc-950" : "text-white"
                          )}
                        />
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

      {/* 3. Mobile Bottom Navigation Bar (md and down) */}
      <aside
        id="copo-mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-2xl border-t border-zinc-800/90 text-white shadow-[0_-8px_30px_rgba(0,0,0,0.8)]"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 16px) + 8px)",
          paddingTop: "8px"
        }}
      >
        <div className="flex items-center justify-around px-2 max-w-md mx-auto relative">
          {/* 1. Home */}
          <button
            id="mobile-nav-home-btn"
            onClick={() => onSelectSection("home")}
            className={"flex flex-col items-center justify-center py-1 px-3 flex-1 rounded-xl active:scale-90 transition-all duration-200 cursor-pointer " + (
              activeSection === "home" || activeSection === "map"
                ? "text-white"
                : "text-zinc-100 hover:text-white"
            )}
          >
            <div className="relative">
              <Home
                className={"w-[22px] h-[22px] transition-transform duration-200 " + (
                  activeSection === "home" || activeSection === "map"
                    ? "scale-110 stroke-[2.5] text-white"
                    : "stroke-[2.2] text-zinc-100"
                )}
              />
            </div>
            <span
              className={"text-[10px] tracking-tight mt-1 " + (
                activeSection === "home" || activeSection === "map"
                  ? "font-bold text-white"
                  : "font-medium text-zinc-100"
              )}
            >
              {t("nav.home", "Home")}
            </span>
          </button>

          {/* 2. Search */}
          <button
            id="mobile-nav-search-btn"
            onClick={() => {
              if (onOpenSearch) onOpenSearch();
              else onSelectSection("search");
            }}
            className={"flex flex-col items-center justify-center py-1 px-3 flex-1 rounded-xl active:scale-90 transition-all duration-200 cursor-pointer " + (
              activeSection === "search" || activeSection === "discover"
                ? "text-white"
                : "text-zinc-100 hover:text-white"
            )}
          >
            <div className="relative">
              <Search
                className={"w-[22px] h-[22px] transition-transform duration-200 " + (
                  activeSection === "search" || activeSection === "discover"
                    ? "scale-110 stroke-[2.5] text-white"
                    : "stroke-[2.2] text-zinc-100"
                )}
              />
            </div>
            <span
              className={"text-[10px] tracking-tight mt-1 " + (
                activeSection === "search" || activeSection === "discover"
                  ? "font-bold text-white"
                  : "font-medium text-zinc-100"
              )}
            >
              {t("nav.search", "Search")}
            </span>
          </button>

          {/* 3. Create (Center Floating Action Button) */}
          <button
            id="mobile-nav-create-btn"
            onClick={() => onSelectSection("create")}
            className="flex flex-col items-center justify-center flex-1 cursor-pointer"
          >
            <div className="relative -mt-6 mb-1">
              <div className="w-[52px] h-[52px] bg-white rounded-2xl flex items-center justify-center shadow-[0_8px_24px_rgba(255,255,255,0.2)] active:scale-95 transition-all duration-200 border border-white/40 cursor-pointer text-zinc-950">
                <Plus className="w-7 h-7 stroke-[2.5]" />
              </div>
            </div>
          </button>

          {/* 4. Inbox & Activity */}
          <button
            id="mobile-nav-inbox-btn"
            onClick={() => onSelectSection("messages")}
            className={"relative flex flex-col items-center justify-center py-1 px-3 flex-1 rounded-xl active:scale-90 transition-all duration-200 cursor-pointer " + (
              activeSection === "messages" || activeSection === "notifications"
                ? "text-white"
                : "text-zinc-100 hover:text-white"
            )}
          >
            <div className="relative">
              <Mail
                className={"w-[22px] h-[22px] transition-transform duration-200 " + (
                  activeSection === "messages" || activeSection === "notifications"
                    ? "scale-110 stroke-[2.5] text-white"
                    : "stroke-[2.2] text-zinc-100"
                )}
              />
              {(unreadMessagesCount + unreadNotifsCount) > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[17px] h-[17px] flex items-center justify-center px-1 text-[9px] font-extrabold rounded-full bg-white text-zinc-950 border-2 border-zinc-950 shadow-sm animate-in zoom-in-75">
                  {(unreadMessagesCount + unreadNotifsCount) > 9 ? "9+" : (unreadMessagesCount + unreadNotifsCount)}
                </span>
              )}
            </div>
            <span
              className={"text-[10px] tracking-tight mt-1 " + (
                activeSection === "messages" || activeSection === "notifications"
                  ? "font-bold text-white"
                  : "font-medium text-zinc-100"
              )}
            >
              {t("nav.messages", "Inbox")}
            </span>
          </button>

          {/* 5. Profile */}
          <button
            id="mobile-nav-profile-btn"
            onClick={() => onSelectSection("more")}
            className={"flex flex-col items-center justify-center py-1 px-3 flex-1 rounded-xl active:scale-90 transition-all duration-200 cursor-pointer " + (
              activeSection === "profile" || activeSection === "more"
                ? "text-white"
                : "text-zinc-100 hover:text-white"
            )}
          >
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name || "Profile"}
                className={"w-[26px] h-[26px] rounded-full object-cover shrink-0 ring-2 transition-transform duration-200 mb-0.5 " + (
                  activeSection === "profile" || activeSection === "more"
                    ? "ring-white scale-110"
                    : "ring-white/40"
                )}
                referrerPolicy="no-referrer"
               onError={(e) => { const target = e.currentTarget as HTMLImageElement; if (!target.src.includes('/api/avatar')) { target.src = '/api/avatar?name=User&background=27272a&color=fff'; } }} />
            ) : (
              <UserCircle
                className={"w-[22px] h-[22px] transition-transform duration-200 " + (
                  activeSection === "profile" || activeSection === "more"
                    ? "scale-110 stroke-[2.5] text-white"
                    : "stroke-[2.2] text-zinc-100"
                )}
              />
            )}
            <span
              className={"text-[10px] tracking-tight mt-1 " + (
                activeSection === "profile" || activeSection === "more"
                  ? "font-bold text-white"
                  : "font-medium text-zinc-100"
              )}
            >
              {t("nav.profile", "Profile")}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};
`);
