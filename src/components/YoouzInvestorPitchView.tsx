import React, { useState, useEffect, useRef } from "react";
import { 
  Lock, 
  Key, 
  User,
  Eye, 
  EyeOff, 
  List, 
  X, 
  CheckCircle, 
  ShieldCheck, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  ArrowLeft,
  ChevronUp
} from "lucide-react";

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

const TOTAL_PAGES = 18;
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
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadedPages, setLoadedPages] = useState<Record<number, boolean>>({});

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
    document.title = "Yoouz • Confidential Series Seed Investor Memorandum";

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

  // Track currently visible page during continuous scroll via IntersectionObserver
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
        threshold: 0.25,
      }
    );

    pageRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [isAuthenticated]);

  // Document security: Block Print, Save, Copy keyboard shortcuts
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
    const targetEl = pageRefs.current[pageNum - 1];
    if (targetEl && scrollContainerRef.current) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentPage(pageNum);
      setIsTocOpen(false);
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
            Confidential Document
          </div>
        </header>

        {/* Center Access Card */}
        <main className="w-full max-w-md my-auto relative z-10 py-6">
          <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
            {/* Brand Logo & Lock Icon */}
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
                Enter your authorized credentials to view the 18-page Series Seed institutional memorandum.
              </p>
            </div>

            {/* Authentication Form (Username + Password) */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className={`space-y-3.5 transition-transform duration-100 ${isShaking ? "animate-shake" : ""}`}>
                {/* Username Input - Clean, NO hints or examples */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Username
                  </label>
                  <div className="relative flex items-center bg-zinc-900/90 border border-zinc-800 focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-600 rounded-xl px-3.5 py-2.5 transition-all">
                    <User className="w-4 h-4 text-zinc-500 shrink-0 mr-2.5 pointer-events-none" />
                    <input
                      type="text"
                      autoFocus
                      autoComplete="username"
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

                {/* Password Input - Clean, NO hints or examples */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Password
                  </label>
                  <div className="relative flex items-center bg-zinc-900/90 border border-zinc-800 focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-600 rounded-xl px-3.5 py-2.5 transition-all">
                    <Key className="w-4 h-4 text-zinc-500 shrink-0 mr-2.5 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
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

              {/* Monochrome Pure-White/Black Premium Button (Zero Gold) */}
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-sm tracking-normal transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 active:scale-[0.99]"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>View Memorandum</span>
              </button>
            </form>

            {/* Security Assurance */}
            <div className="mt-6 pt-5 border-t border-zinc-800/80 text-[11px] text-zinc-500 space-y-1 text-center">
              <p className="flex items-center justify-center gap-1.5 text-zinc-400 font-medium">
                <CheckCircle className="w-3.5 h-3.5 text-zinc-400" />
                <span>Confidential Institutional Presentation</span>
              </p>
              <p>Strictly confidential. Unauthorized copying or redistribution is prohibited.</p>
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
  // 2. CONTINUOUS VERTICAL SCROLL VIEWER (Pure Dark Mode, High-End)
  // -------------------------------------------------------------
  return (
    <div 
      onContextMenu={(e) => e.preventDefault()}
      className="fixed inset-0 z-[9999] bg-[#07080b] text-white flex flex-col font-sans select-none overflow-hidden"
    >
      {/* Institutional Top Navigation Bar */}
      <header className="w-full bg-zinc-950 border-b border-zinc-800/90 px-3 sm:px-6 py-2.5 flex items-center justify-between shrink-0 z-40 select-none">
        {/* Left: Brand & Title */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <button
            type="button"
            onClick={onBackToApp || (() => window.location.href = "/")}
            className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            title="Return to Yoouz"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <div className="w-6 h-6 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
                <path d="M12 3.8l2.32 4.7 5.18 0.75-3.75 3.65 0.88 5.16L12 15.62l-4.63 2.44 0.88-5.16-3.75-3.65 5.18-0.75L12 3.8z" />
              </svg>
            </div>
            <span className="font-bold text-sm tracking-tight hidden xs:inline">
              Yoouz
            </span>
          </div>

          <div className="h-4 w-px bg-zinc-800 hidden sm:block shrink-0" />

          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-semibold text-white truncate leading-tight">
              Series Seed Investor Memorandum
            </h2>
            <p className="text-[11px] text-zinc-400 truncate hidden md:block leading-none mt-0.5">
              {SECTIONS[currentPage - 1]?.title || "18-Section Presentation"}
            </p>
          </div>
        </div>

        {/* Center: Live Page Position Pill */}
        <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 px-3 py-1 rounded-full text-xs font-medium text-zinc-300">
          <span>Page {currentPage} of {TOTAL_PAGES}</span>
        </div>

        {/* Right: Actions (Sections Drawer, Zoom, Lock) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Table of Contents Button */}
          <button
            type="button"
            onClick={() => setIsTocOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Jump to Section"
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Sections</span>
          </button>

          {/* Zoom Controls (Desktop only) */}
          <div className="hidden lg:flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(75, z - 15))}
              className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-medium text-zinc-400 min-w-[34px] text-center">{zoomLevel}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(140, z + 15))}
              className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="hidden sm:flex w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Lock / Exit Session */}
          <button
            type="button"
            onClick={handleSignOut}
            className="w-8 h-8 sm:w-auto sm:px-3 sm:py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors text-xs font-medium cursor-pointer flex items-center justify-center gap-1.5"
            title="Lock document"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lock</span>
          </button>
        </div>
      </header>

      {/* Main Continuous Vertical Scroll Canvas */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 w-full overflow-y-auto overflow-x-hidden p-2 sm:p-6 md:p-8 flex flex-col items-center gap-6 sm:gap-8 scroll-smooth"
      >
        {/* Confidential Document Notice */}
        <div className="w-full max-w-4xl flex items-center justify-between text-xs text-zinc-500 px-2">
          <span className="font-medium tracking-wide text-zinc-400">
            Confidential Series Seed Investment Memorandum • View Only
          </span>
          <span className="hidden sm:inline text-zinc-500">18 Pages</span>
        </div>

        {/* All 18 Pages - Seamless Continuous Vertical Scroll */}
        {Array.from({ length: TOTAL_PAGES }).map((_, idx) => {
          const pageNum = idx + 1;
          const pageStr = String(pageNum).padStart(2, "0");
          const pageInfo = SECTIONS[idx];
          const isLoaded = loadedPages[pageNum];

          return (
            <div
              key={pageNum}
              ref={(el) => { pageRefs.current[idx] = el; }}
              data-page-num={pageNum}
              className="w-full flex flex-col items-center"
              style={{
                maxWidth: `${Math.round(880 * (zoomLevel / 100))}px`,
              }}
            >
              {/* Page Container with crisp border and view-only protection shield */}
              <div 
                className="w-full relative rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800/80 shadow-2xl"
                style={{ minHeight: isLoaded ? "auto" : "500px" }}
              >
                {/* Skeleton shimmer before image loads */}
                {!isLoaded && (
                  <div className="w-full aspect-[1/1.414] bg-zinc-900/60 animate-pulse flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-600">
                      <Lock className="w-4 h-4" />
                    </div>
                    <span className="text-xs text-zinc-600 font-medium">Loading Page {pageNum}...</span>
                  </div>
                )}

                {/* Page Image */}
                <img
                  src={`/assets/pitch_pages/page_${pageStr}.png`}
                  alt={`Memorandum Page ${pageNum}`}
                  loading={pageNum <= 3 ? "eager" : "lazy"}
                  draggable={false}
                  onLoad={() => {
                    setLoadedPages((prev) => ({ ...prev, [pageNum]: true }));
                  }}
                  onError={(e) => {
                    // Fallback to secondary route if primary path encounters network quirk
                    const target = e.currentTarget;
                    if (!target.dataset.triedFallback) {
                      target.dataset.triedFallback = "true";
                      target.src = `/pitch_pages/page_${pageStr}.png`;
                    }
                  }}
                  className={`w-full h-auto object-contain block transition-opacity duration-300 ${
                    isLoaded ? "opacity-100" : "opacity-0 absolute inset-0"
                  }`}
                />

                {/* View-Only Protection Overlay: Completely intercepts right click, drag, and touch hold */}
                <div 
                  className="absolute inset-0 z-20 bg-transparent cursor-default pointer-events-auto"
                  onContextMenu={(e) => e.preventDefault()}
                  draggable={false}
                />

                {/* Subtle corner watermark tag */}
                <div className="absolute bottom-2.5 right-3 z-30 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm border border-zinc-800 text-[10px] font-medium text-zinc-400 pointer-events-none">
                  Page {pageNum} of {TOTAL_PAGES}
                </div>
              </div>

              {/* Page Caption */}
              <div className="w-full flex items-center justify-between px-2 pt-2 text-[11px] text-zinc-500 font-medium">
                <span className="truncate max-w-[80%] text-zinc-400">
                  {pageNum}. {pageInfo?.title}
                </span>
                <span className="shrink-0 text-zinc-600">
                  {pageNum} / {TOTAL_PAGES}
                </span>
              </div>
            </div>
          );
        })}

        {/* End of Memorandum Footer */}
        <div className="w-full max-w-4xl mt-8 pb-16 text-center border-t border-zinc-800/80 pt-8 text-xs text-zinc-500 space-y-3">
          <p className="font-semibold text-zinc-300 text-sm">
            Yoouz Inc. • Series Seed Investment Memorandum
          </p>
          <p className="max-w-md mx-auto text-zinc-500 text-xs">
            For approved institutional partners and authorized venture investors only.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => scrollToPage(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronUp className="w-4 h-4" />
              <span>Back to Top</span>
            </button>
          </div>
        </div>
      </div>

      {/* Slide-Over Sections Drawer */}
      {isTocOpen && (
        <div 
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsTocOpen(false)}
        >
          <div 
            className="w-full max-w-sm h-full bg-zinc-950 border-l border-zinc-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">Memorandum Sections</h3>
              <button
                type="button"
                onClick={() => setIsTocOpen(false)}
                className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sections List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {SECTIONS.map((sec) => {
                const isActive = currentPage === sec.page;
                return (
                  <button
                    key={sec.page}
                    type="button"
                    onClick={() => scrollToPage(sec.page)}
                    className={`w-full p-2.5 rounded-lg flex items-start gap-3 text-left transition-colors cursor-pointer ${
                      isActive 
                        ? "bg-zinc-800 text-white" 
                        : "hover:bg-zinc-900 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-semibold shrink-0 ${
                      isActive ? "bg-white text-black" : "bg-zinc-900 border border-zinc-800 text-zinc-400"
                    }`}>
                      {sec.page}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-medium truncate leading-tight ${isActive ? "text-white" : "text-zinc-300"}`}>
                        {sec.title}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                        {sec.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-zinc-800 bg-zinc-950 text-center text-[11px] text-zinc-500">
              Yoouz • Confidential Series Seed Memorandum
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
