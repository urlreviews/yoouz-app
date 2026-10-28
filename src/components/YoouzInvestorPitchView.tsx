import React, { useState, useEffect, useRef } from "react";
import { 
  Lock, 
  Key, 
  User,
  Eye, 
  EyeOff, 
  CheckCircle, 
  ShieldCheck, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  FileText,
  PanelLeft
} from "lucide-react";
import { INVESTOR_PITCH_PAGES } from "../data/investorPitchPages";

interface YoouzInvestorPitchViewProps {
  onBackToApp?: () => void;
}

const SECTIONS = [
  { page: 1, title: "Executive Thesis & Foundational Mandate", subtitle: "Confidential Series Seed Pitch" },
  { page: 2, title: "Strategic Overview & Table of Contents", subtitle: "18-Section Institutional Breakdown" },
  { page: 3, title: "The Market Problem: The Fake Review Crisis", subtitle: "$152B Global Trust Collapse" },
  { page: 4, title: "The Solution: The 60-Second Video Protocol", subtitle: "Hardware-Level Proof-of-Authenticity" },
  { page: 5, title: "Consumer Experience: Mobile PWA & Discovery", subtitle: "Instant Zero-Friction Web App" },
  { page: 6, title: "The Immersive Vertical Video Player", subtitle: "88% Watch Completion & Social Action Rail" },
  { page: 7, title: "Community, Creator Profiles & Direct Sharing", subtitle: "Frictionless Following & Taste-Makers" },
  { page: 8, title: "Interactive Comments & Inquiries Drawer", subtitle: "Contextual Suggestion Chips & Dialogue" },
  { page: 9, title: "Business Profile Architecture & Action Portal", subtitle: "62% Direct Action Conversion" },
  { page: 10, title: "The Recording Studio: Hardware Camera Lock", subtitle: "Mandatory Front Camera & Zero Uploads" },
  { page: 11, title: "Interactive Map & Geolocation Discovery", subtitle: "High-Density Visual Local Navigation" },
  { page: 12, title: "B2B Merchant Suite: Verification & Claiming", subtitle: "Domain Matching & Anti-Yelp Defense" },
  { page: 13, title: "B2B Growth Tools: Tabletop QR Stands", subtitle: "Zero-CAC Viral Diner Acquisition" },
  { page: 14, title: "Branded Ad Exporter & 1-Click Video Embeds", subtitle: "Turnkey Social Video & Web Widgets" },
  { page: 15, title: "Technical Architecture: Bunny.net & Cloud SQL", subtitle: "Edge Streaming & 90% Cost Advantage" },
  { page: 16, title: "Business Model & Revenue Architecture", subtitle: "Dual-Engine Monetization & ARR Scaling" },
  { page: 17, title: "Competitive Moat: Why Incumbents Cannot Replicate", subtitle: "Four Impenetrable Structural Barriers" },
  { page: 18, title: "Execution Roadmap & Investment Opportunity", subtitle: "Venture Investment Thesis & Capital Allocation" },
];

const TOTAL_PAGES = INVESTOR_PITCH_PAGES.length || 18;
const STORAGE_KEY = "yoouz_investor_auth_seed_2026";
const AUTHORIZED_USERNAMES = [
  "investor",
  "investors",
  "partner",
  "partners",
  "yoouz",
  "vc",
  "seed",
  "venture"
];
const AUTHORIZED_PASSWORDS = [
  "yoouz2026",
  "yoouz2026!",
  "yoouzseriesseed",
  "yoouzseed2026",
  "investor2026",
  "yoouz"
];

export const YoouzInvestorPitchView: React.FC<YoouzInvestorPitchViewProps> = ({ onBackToApp }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "authorized";
    } catch {
      return false;
    }
  });

  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Enforce noindex dynamically on mount
  useEffect(() => {
    let metaTag = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    const originalRobots = metaTag ? metaTag.content : "";
    
    if (!metaTag) {
      metaTag = document.createElement("meta");
      metaTag.name = "robots";
      document.head.appendChild(metaTag);
    }
    metaTag.content = "noindex, nofollow, noarchive";

    const originalTitle = document.title;
    document.title = "Yoouz_Investor_Pitch_Memorandum.pdf";

    return () => {
      if (metaTag) {
        if (originalRobots) {
          metaTag.content = originalRobots;
        } else {
          metaTag.remove();
        }
      }
      document.title = originalTitle;
    };
  }, []);

  // Track currently visible PDF page during continuous vertical scroll
  useEffect(() => {
    if (!isAuthenticated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = Number(entry.target.getAttribute("data-page-num"));
            if (pageNum) {
              setCurrentPage(pageNum);
            }
          }
        });
      },
      {
        root: scrollContainerRef.current,
        threshold: 0.35,
      }
    );

    pageRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [isAuthenticated]);

  // Document security: Block Print, Save, View-Source keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) && 
        (e.key === "s" || e.key === "S" || e.key === "p" || e.key === "P" || e.key === "u" || e.key === "U")
      ) {
        e.preventDefault();
        return false;
      }
    };
    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, []);

  const handleAuthSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const userNorm = usernameInput.trim().toLowerCase();
    const passNorm = passwordInput.trim().toLowerCase();
    
    if (!userNorm) {
      setAuthError("Please enter your authorized username.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    if (!passNorm) {
      setAuthError("Please enter your access password.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    const isValidUser = AUTHORIZED_USERNAMES.includes(userNorm);
    const isValidPass = AUTHORIZED_PASSWORDS.includes(passNorm);

    if (isValidUser && isValidPass) {
      try {
        sessionStorage.setItem(STORAGE_KEY, "authorized");
      } catch {}
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Invalid credentials. Access is restricted to authorized partners.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const handleSignOut = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
    setIsAuthenticated(false);
    setUsernameInput("");
    setPasswordInput("");
    setAuthError("");
  };

  const scrollToPage = (pageNum: number) => {
    const clamped = Math.max(1, Math.min(TOTAL_PAGES, pageNum));
    const targetEl = pageRefs.current[clamped - 1];
    if (targetEl && scrollContainerRef.current) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentPage(clamped);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // -------------------------------------------------------------
  // 1. PASSWORD GATE SCREEN (Clean, pure dark mode, no gold/yellow)
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div 
        onContextMenu={(e) => e.preventDefault()}
        className="fixed inset-0 z-[9999] bg-[#07080b] text-white flex flex-col justify-between items-center p-4 sm:p-6 overflow-y-auto select-none font-sans"
      >
        {/* Top Header Bar */}
        <header className="w-full max-w-4xl flex items-center justify-between py-3 relative z-10">
          <button
            type="button"
            onClick={onBackToApp || (() => window.location.href = "/")}
            className="flex items-center gap-2 text-xs sm:text-sm font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Return to Yoouz</span>
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            Confidential PDF
          </div>
        </header>

        {/* Center Access Card */}
        <main className="w-full max-w-md my-auto relative z-10 py-6">
          <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
            {/* Brand Logo */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative mb-4">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shadow-lg">
                  <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
                    <path d="M12 3.8l2.32 4.7 5.18 0.75-3.75 3.65 0.88 5.16L12 15.62l-4.63 2.44 0.88-5.16-3.75-3.65 5.18-0.75L12 3.8z" />
                  </svg>
                </div>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                Investor Memorandum
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm mt-2 leading-relaxed">
                Enter your authorized credentials to open the 18-page Series Seed PDF memorandum.
              </p>
            </div>

            {/* Authentication Form (Username + Password) */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className={`space-y-3.5 transition-transform duration-100 ${isShaking ? "animate-shake" : ""}`}>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Username
                  </label>
                  <div className="relative flex items-center bg-zinc-900/90 border border-zinc-800 focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-600 rounded-xl px-3.5 py-2.5 transition-all">
                    <User className="w-4 h-4 text-zinc-500 shrink-0 mr-2.5 pointer-events-none" />
                    <input
                      type="text"
                      autoFocus
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      value={usernameInput}
                      onChange={(e) => {
                        setUsernameInput(e.target.value);
                        if (authError) setAuthError("");
                      }}
                      placeholder="Username"
                      className="w-full bg-transparent text-white text-sm placeholder:text-zinc-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Password
                  </label>
                  <div className="relative flex items-center bg-zinc-900/90 border border-zinc-800 focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-600 rounded-xl px-3.5 py-2.5 transition-all">
                    <Key className="w-4 h-4 text-zinc-500 shrink-0 mr-2.5 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        if (authError) setAuthError("");
                      }}
                      placeholder="Password"
                      className="w-full bg-transparent text-white text-sm placeholder:text-zinc-600 focus:outline-none tracking-normal"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 cursor-pointer shrink-0 ml-1"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {authError && (
                  <p className="text-red-400 text-xs mt-1.5 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    {authError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-sm tracking-normal transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 active:scale-[0.99]"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Open PDF Memorandum</span>
              </button>
            </form>

            {/* Security Assurance */}
            <div className="mt-6 pt-5 border-t border-zinc-800/80 text-[11px] text-zinc-500 space-y-1 text-center">
              <p className="flex items-center justify-center gap-1.5 text-zinc-400 font-medium">
                <CheckCircle className="w-3.5 h-3.5 text-zinc-400" />
                <span>Protected Read-Only PDF Viewer</span>
              </p>
              <p>Strictly confidential. Downloading, printing, or redistribution is disabled.</p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full max-w-4xl py-3 text-center text-xs text-zinc-600 relative z-10">
          Yoouz Inc. • All Rights Reserved © 2026
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. NATIVE PDF READER EXPERIENCE (Instant 0ms Embedded Pages)
  // -------------------------------------------------------------
  return (
    <div 
      onContextMenu={(e) => e.preventDefault()}
      className="fixed inset-0 z-[9999] bg-[#18191d] text-white flex flex-col font-sans select-none overflow-hidden print:hidden"
    >
      {/* Native PDF Reader Top Toolbar */}
      <header className="w-full h-13 bg-[#202227] border-b border-black/60 px-3 sm:px-4 flex items-center justify-between shrink-0 z-40 shadow-md">
        {/* Left: Back, Sidebar Toggle, PDF Filename */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onBackToApp || (() => window.location.href = "/")}
            className="w-8 h-8 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/80 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Return to Yoouz"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsSidebarOpen((v) => !v)}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
              isSidebarOpen
                ? "bg-white text-black border-white"
                : "bg-zinc-800/80 hover:bg-zinc-700 border-zinc-700/80 text-zinc-300 hover:text-white"
            }`}
            title="Toggle Page Thumbnails"
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-zinc-700/80 mx-0.5 hidden xs:block shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-zinc-400 shrink-0 hidden sm:block" />
            <span className="text-xs sm:text-sm font-medium text-zinc-100 truncate">
              Yoouz_Investor_Pitch_Memorandum.pdf
            </span>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 shrink-0">
              Read-Only
            </span>
          </div>
        </div>

        {/* Center: Native PDF Page Stepper & Zoom Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Page Navigation */}
          <div className="flex items-center bg-[#141519] border border-zinc-700/80 rounded-lg px-1.5 py-1 gap-1">
            <button
              type="button"
              onClick={() => scrollToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
              title="Previous Page"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-medium text-zinc-200 px-1.5 tabular-nums whitespace-nowrap">
              {currentPage} <span className="text-zinc-500">/</span> {TOTAL_PAGES}
            </span>
            <button
              type="button"
              onClick={() => scrollToPage(currentPage + 1)}
              disabled={currentPage >= TOTAL_PAGES}
              className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
              title="Next Page"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="hidden md:flex items-center bg-[#141519] border border-zinc-700/80 rounded-lg px-1.5 py-1 gap-1">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(60, z - 15))}
              className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(100)}
              className="text-xs font-medium text-zinc-300 hover:text-white min-w-[42px] text-center tabular-nums cursor-pointer"
              title="Reset Zoom to 100%"
            >
              {zoomLevel}%
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(160, z + 15))}
              className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Fullscreen & Lock */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="hidden sm:flex w-8 h-8 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/80 items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="h-8 px-2.5 sm:px-3 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/80 text-zinc-300 hover:text-white transition-colors text-xs font-medium cursor-pointer flex items-center justify-center gap-1.5"
            title="Lock PDF"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lock</span>
          </button>
        </div>
      </header>

      {/* PDF Workspace Body (Optional Left Thumbnail Rail + Main Continuous PDF Page Scroll) */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Left Collapsible PDF Page Thumbnails Sidebar */}
        {isSidebarOpen && (
          <aside className="w-60 sm:w-64 bg-[#1c1e24] border-r border-black/60 flex flex-col shrink-0 z-30 overflow-y-auto p-3 space-y-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 px-1 pb-1 border-b border-zinc-800">
              Pages ({TOTAL_PAGES})
            </div>
            {INVESTOR_PITCH_PAGES.map((pageSrc, idx) => {
              const pageNum = idx + 1;
              const isActive = currentPage === pageNum;
              const sec = SECTIONS[idx];
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => {
                    scrollToPage(pageNum);
                    if (window.innerWidth < 640) setIsSidebarOpen(false);
                  }}
                  className={`w-full p-2 rounded-lg flex flex-col items-center gap-1.5 text-left transition-all cursor-pointer ${
                    isActive
                      ? "bg-zinc-800 ring-1 ring-white/40"
                      : "hover:bg-zinc-800/50"
                  }`}
                >
                  <div className="w-32 aspect-[595/842] rounded overflow-hidden bg-white shadow-md border border-zinc-700 relative">
                    <img
                      src={pageSrc}
                      alt={`Page ${pageNum}`}
                      draggable={false}
                      className="w-full h-full object-contain block pointer-events-none select-none"
                    />
                  </div>
                  <div className="w-full text-center px-1">
                    <span className={`text-[11px] font-semibold ${isActive ? "text-white" : "text-zinc-400"}`}>
                      Page {pageNum}
                    </span>
                    {sec && (
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                        {sec.title}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </aside>
        )}

        {/* Main Continuous PDF Scroll View (Acts & Looks Identical to a Native PDF Viewer) */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 h-full overflow-y-auto overflow-x-auto bg-[#18191d] px-2 sm:px-6 md:px-10 py-4 sm:py-8 flex flex-col items-center gap-4 sm:gap-6"
        >
          {INVESTOR_PITCH_PAGES.map((pageDataUri, idx) => {
            const pageNum = idx + 1;

            return (
              <div
                key={pageNum}
                ref={(el) => { pageRefs.current[idx] = el; }}
                data-page-num={pageNum}
                className="w-full flex flex-col items-center shrink-0"
                style={{
                  maxWidth: `${Math.round(794 * (zoomLevel / 100))}px`,
                }}
              >
                {/* Exact A4 PDF Page Sheet */}
                <div 
                  className="w-full aspect-[595/842] relative bg-white shadow-[0_10px_35px_rgba(0,0,0,0.65)] ring-1 ring-black/40 overflow-hidden"
                >
                  <img
                    src={pageDataUri}
                    alt={`Page ${pageNum}`}
                    draggable={false}
                    className="w-full h-full object-contain block select-none pointer-events-none"
                  />

                  {/* Transparent Read-Only Shield (Blocks Save Image As, Dragging, Touch-Hold) */}
                  <div 
                    className="absolute inset-0 z-20 bg-transparent cursor-default"
                    onContextMenu={(e) => e.preventDefault()}
                    draggable={false}
                  />
                </div>
              </div>
            );
          })}

          {/* Subtle End-of-Document Footer */}
          <div className="w-full max-w-2xl py-6 text-center text-xs text-zinc-500 flex flex-col items-center gap-3">
            <span>End of Document • 18 Pages</span>
            <button
              type="button"
              onClick={() => scrollToPage(1)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#202227] hover:bg-zinc-800 border border-zinc-700/80 text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Top of Document</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
