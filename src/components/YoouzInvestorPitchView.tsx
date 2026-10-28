import React, { useState, useEffect, useRef } from "react";
import { 
  Lock, 
  Key, 
  User,
  Eye, 
  EyeOff, 
  Mail,
  ChevronLeft, 
  ChevronRight, 
  List, 
  X, 
  CheckCircle, 
  ShieldCheck, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  ArrowLeft,
  Sparkles,
  FileText
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
        threshold: 0.35,
      }
    );

    pageRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [isAuthenticated]);

  const handleAuthSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const userNorm = usernameInput.trim().toLowerCase();
    const passNorm = passwordInput.trim().toLowerCase();
    
    if (!userNorm) {
      setAuthError("Please enter your authorized investor username.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
      return;
    }

    if (!passNorm) {
      setAuthError("Please enter your confidential access password.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
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
      setAuthError("Invalid username or password. Please verify credentials or contact investor-relations@yoouz.com.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
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

  const handleNextPage = () => {
    if (currentPage < TOTAL_PAGES) {
      scrollToPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      scrollToPage(currentPage - 1);
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

  // Keyboard navigation
  useEffect(() => {
    if (!isAuthenticated) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        if (currentPage < TOTAL_PAGES) scrollToPage(currentPage + 1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        if (currentPage > 1) scrollToPage(currentPage - 1);
      } else if (e.key === "Escape") {
        setIsTocOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthenticated, currentPage]);

  // -------------------------------------------------------------
  // PASSWORD GATE SCREEN (If not unlocked)
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#05070B] text-white flex flex-col justify-between items-center p-4 sm:p-6 overflow-y-auto select-none font-sans">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-blue-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-0" />

        {/* Top Header Bar */}
        <header className="w-full max-w-5xl flex items-center justify-between py-3 relative z-10">
          <button
            type="button"
            onClick={onBackToApp || (() => window.location.href = "/")}
            className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Return to Yoouz</span>
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/90 border border-amber-500/30 text-amber-300 text-[11px] font-bold tracking-wider uppercase shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Confidential • Series Seed
          </div>
        </header>

        {/* Center Access Card */}
        <main className="w-full max-w-md my-auto relative z-10 py-6">
          <div className="bg-zinc-900/80 backdrop-blur-2xl border border-zinc-800/90 rounded-3xl p-6 sm:p-8 shadow-[0_30px_90px_rgba(0,0,0,0.8)] relative overflow-hidden">
            {/* Top Amber Accent Line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-amber-400 to-amber-500" />

            {/* Brand Logo & Lock Icon */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-white shadow-xl relative">
                  <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
                    <path d="M12 3.8l2.32 4.7 5.18 0.75-3.75 3.65 0.88 5.16L12 15.62l-4.63 2.44 0.88-5.16-3.75-3.65 5.18-0.75L12 3.8z" />
                  </svg>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              <h1 className="text-2xl sm:text-[26px] font-black tracking-tight text-white leading-tight">
                Yoouz Investor Memorandum
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm mt-2 leading-relaxed">
                Enter your authorized investor username and password to access the complete 18-page Series Seed institutional memorandum.
              </p>
            </div>

            {/* Authentication Form (Username + Password) */}
            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              <div className={`space-y-3 transition-transform duration-100 ${isShaking ? "animate-shake" : ""}`}>
                {/* Username Input */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Authorized Username
                  </label>
                  <div className="relative flex items-center bg-zinc-950 border border-zinc-800 focus-within:border-amber-400/60 focus-within:ring-4 focus-within:ring-amber-500/10 rounded-2xl px-4 py-3 transition-all">
                    <User className="w-4 h-4 text-zinc-500 shrink-0 mr-3 pointer-events-none" />
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
                      placeholder="e.g. investor"
                      className="w-full bg-transparent text-white text-sm placeholder:text-zinc-600 focus:outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Confidential Access Key
                  </label>
                  <div className="relative flex items-center bg-zinc-950 border border-zinc-800 focus-within:border-amber-400/60 focus-within:ring-4 focus-within:ring-amber-500/10 rounded-2xl px-4 py-3 transition-all">
                    <Key className="w-4 h-4 text-zinc-500 shrink-0 mr-3 pointer-events-none" />
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
                      placeholder="e.g. Yoouz2026"
                      className="w-full bg-transparent text-white text-sm placeholder:text-zinc-600 focus:outline-none font-medium tracking-wide"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-zinc-500 hover:text-white transition-colors p-1 cursor-pointer shrink-0 ml-1"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {authError && (
                  <p className="text-red-400 text-xs mt-2 font-medium flex items-center gap-1.5 animate-in fade-in duration-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    {authError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-zinc-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Unlock Confidential Memorandum</span>
              </button>
            </form>

            {/* Security Assurance Notes */}
            <div className="mt-6 pt-5 border-t border-zinc-800/80 text-[11px] text-zinc-500 space-y-1.5 text-center">
              <p className="flex items-center justify-center gap-1.5 text-zinc-400 font-medium">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>256-Bit Encrypted Institutional Presentation</span>
              </p>
              <p>Strictly confidential. Unauthorized reproduction or sharing is prohibited.</p>
            </div>
          </div>
        </main>

        {/* Footer Disclaimer */}
        <footer className="w-full max-w-5xl py-3 text-center text-[11px] text-zinc-600 relative z-10">
          Yoouz Inc. • Executive Office & Investor Relations • All Rights Reserved © 2026
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // FULL ULTRA-PREMIUM PRESENTATION VIEWER (When unlocked)
  // -------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-[9999] bg-[#07090E] text-white flex flex-col font-sans select-none overflow-hidden">
      {/* 1. Master Institutional Navigation Header Bar */}
      <header className="w-full bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/80 px-3 sm:px-6 py-2.5 flex items-center justify-between shrink-0 z-40 select-none shadow-xl">
        {/* Left: Brand, Title & Badge */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <button
            type="button"
            onClick={onBackToApp || (() => window.location.href = "/")}
            className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            title="Return to Yoouz Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shadow-xs">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
                <path d="M12 3.8l2.32 4.7 5.18 0.75-3.75 3.65 0.88 5.16L12 15.62l-4.63 2.44 0.88-5.16-3.75-3.65 5.18-0.75L12 3.8z" />
              </svg>
            </div>
            <span className="font-black text-sm sm:text-base tracking-tight font-['Google_Sans',sans-serif] hidden xs:inline">
              Yoouz
            </span>
          </div>

          <div className="h-4 w-px bg-zinc-800 hidden sm:block shrink-0" />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-white truncate leading-tight">
                Series Seed Pitch Memorandum
              </h2>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold tracking-wider uppercase shrink-0">
                Confidential
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 truncate hidden md:block leading-none mt-0.5">
              {SECTIONS[currentPage - 1]?.title || "18-Section Comprehensive Breakdown"}
            </p>
          </div>
        </div>

        {/* Center: Desktop Page Stepper */}
        <div className="hidden sm:flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 rounded-full px-3 py-1 shadow-inner">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Previous page (Up arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-xs font-bold text-zinc-200 tracking-wider min-w-[70px] text-center">
            {currentPage} <span className="text-zinc-500">/</span> {TOTAL_PAGES}
          </span>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={currentPage >= TOTAL_PAGES}
            className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Next page (Down arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Actions (TOC, Zoom, Download, Lock) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Table of Contents Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsTocOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-200 hover:text-white transition-all cursor-pointer shadow-xs"
            title="View Table of Contents"
          >
            <List className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xs:inline">Sections</span>
          </button>

          {/* Zoom controls (desktop only) */}
          <div className="hidden lg:flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-full px-2 py-1">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(75, z - 15))}
              className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-bold text-zinc-400 min-w-[36px] text-center">{zoomLevel}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(140, z + 15))}
              className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Schedule Partner Call CTA (Keeps investors engaged directly on yoouz.com) */}
          <a
            href="mailto:investor-relations@yoouz.com?subject=Yoouz%20Series%20Seed%20Inquiry%20-%20Partner%20Call"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-zinc-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            title="Schedule Founder Call / Investor Relations"
          >
            <Mail className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Contact IR / Schedule Call</span>
          </a>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="hidden sm:flex w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Lock / Sign Out */}
          <button
            type="button"
            onClick={handleSignOut}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-red-400 transition-colors text-xs font-semibold cursor-pointer flex items-center gap-1"
            title="Lock document"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Lock</span>
          </button>
        </div>
      </header>

      {/* 2. Main Continuous Scroll Canvas */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 w-full overflow-y-auto overflow-x-hidden p-2 sm:p-6 md:p-8 flex flex-col items-center gap-6 sm:gap-10 scroll-smooth relative"
        style={{ scrollBehavior: "smooth" }}
      >
        {/* Subtle Watermark Banner at Top */}
        <div className="w-full max-w-4xl flex items-center justify-between text-[11px] text-zinc-500 px-2 select-none">
          <span className="tracking-wider uppercase font-semibold text-zinc-400">
            Strictly Confidential • For Authorized Institutional Investors Only
          </span>
          <span className="hidden sm:inline">Yoouz Inc. • Series Seed</span>
        </div>

        {/* 18 High-Resolution Pages Stream */}
        {Array.from({ length: TOTAL_PAGES }).map((_, idx) => {
          const pageNum = idx + 1;
          const pageStr = String(pageNum).padStart(2, "0");
          const pageInfo = SECTIONS[idx];

          return (
            <div
              key={pageNum}
              ref={(el) => { pageRefs.current[idx] = el; }}
              data-page-num={pageNum}
              className="w-full flex flex-col items-center transition-transform duration-200"
              style={{
                maxWidth: `${Math.round(896 * (zoomLevel / 100))}px`,
              }}
            >
              {/* Page Wrapper with luxury drop shadow and border */}
              <div className="w-full relative rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800/90 shadow-[0_20px_60px_rgba(0,0,0,0.85)] group">
                {/* Page Image with view-only protection */}
                <img
                  src={`/assets/pitch_pages/page_${pageStr}.png`}
                  alt={`Yoouz Pitch Deck - Page ${pageNum}: ${pageInfo?.title || ""}`}
                  loading={pageNum <= 3 ? "eager" : "lazy"}
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  className="w-full h-auto object-contain block pointer-events-auto select-none"
                />

                {/* Micro Watermark Strip on every page */}
                <div className="absolute bottom-2 right-3 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md border border-white/5 text-[9px] font-semibold text-zinc-300 tracking-wider pointer-events-none select-none">
                  Page {pageNum} of {TOTAL_PAGES} • Protected Institutional View
                </div>
              </div>

              {/* Page Footer Label */}
              <div className="w-full flex items-center justify-between px-2 pt-2 text-[11px] text-zinc-500 font-medium select-none">
                <span className="truncate max-w-[80%] text-zinc-400">
                  {pageNum}. {pageInfo?.title}
                </span>
                <span className="shrink-0 text-zinc-500">
                  {pageNum} / {TOTAL_PAGES}
                </span>
              </div>
            </div>
          );
        })}

        {/* Bottom Concluding Disclaimer */}
        <div className="w-full max-w-4xl mt-6 pb-20 text-center border-t border-zinc-800/80 pt-8 text-xs text-zinc-500 space-y-2 select-none">
          <p className="font-bold text-zinc-400 text-sm">
            Yoouz Inc. • Confidential Series Seed Investment Memorandum
          </p>
          <p className="max-w-xl mx-auto leading-relaxed">
            Presented strictly for confidential evaluation by approved institutional investors, venture partners, and strategic acquirers.
            Inquiries: <span className="text-zinc-300 font-medium">investor-relations@yoouz.com</span>
          </p>
          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => scrollToPage(1)}
              className="px-4 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              Back to Top
            </button>
            <a
              href="mailto:investor-relations@yoouz.com?subject=Meeting%20Request%20-%20Yoouz%20Series%20Seed"
              className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-xs font-bold text-zinc-950 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Mail className="w-3.5 h-3.5" />
              Schedule Founder Briefing
            </a>
          </div>
        </div>
      </div>

      {/* 3. Floating Bottom Stepper for Mobile (Thumb-Friendly) */}
      <div className="sm:hidden fixed bottom-4 inset-x-4 z-40 flex items-center justify-between bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/90 rounded-2xl px-4 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.8)]">
        <button
          type="button"
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
          className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setIsTocOpen(true)}
          className="flex flex-col items-center text-center cursor-pointer px-2"
        >
          <span className="text-xs font-black text-white tracking-wider">
            Page {currentPage} of {TOTAL_PAGES}
          </span>
          <span className="text-[10px] text-amber-400 font-semibold truncate max-w-[180px]">
            {SECTIONS[currentPage - 1]?.title || "Tap for Sections"}
          </span>
        </button>

        <button
          type="button"
          onClick={handleNextPage}
          disabled={currentPage >= TOTAL_PAGES}
          className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 4. Slide-Over Table of Contents Drawer */}
      {isTocOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md h-full bg-zinc-950 border-l border-zinc-800/90 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Memorandum Sections</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTocOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sections List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 divide-y divide-zinc-900">
              {SECTIONS.map((sec) => {
                const isActive = currentPage === sec.page;
                return (
                  <button
                    key={sec.page}
                    type="button"
                    onClick={() => scrollToPage(sec.page)}
                    className={`w-full p-3 rounded-xl flex items-start gap-3 text-left transition-all cursor-pointer ${
                      isActive 
                        ? "bg-amber-500/10 border border-amber-500/30 text-white" 
                        : "hover:bg-zinc-900 text-zinc-300 hover:text-white"
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                      isActive ? "bg-amber-500 text-zinc-950 font-black shadow-md" : "bg-zinc-900 border border-zinc-800 text-zinc-400"
                    }`}>
                      {sec.page}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs sm:text-sm font-bold truncate leading-tight ${isActive ? "text-amber-300" : "text-white"}`}>
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
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex flex-col gap-2 text-center">
              <a
                href="mailto:investor-relations@yoouz.com?subject=Yoouz%20Series%20Seed%20Memorandum%20Inquiry"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-amber-500/20"
              >
                <Mail className="w-4 h-4" />
                <span>Connect with Investor Relations</span>
              </a>
              <span className="text-[10px] text-zinc-500 font-medium">
                Protected Interactive Memorandum • View-Only on yoouz.com
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
