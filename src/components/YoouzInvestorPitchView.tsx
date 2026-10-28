import React, { useState, useEffect, useRef } from "react";
import { 
  Lock, 
  Key, 
  User,
  Eye, 
  EyeOff, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  PanelLeft,
  Loader2,
  FileText
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import { parseLocaleFromPath, buildLocalizedPath } from "../i18n/urlLocalization";

// Configure PDF.js worker locally from server route with CDN fallback
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface YoouzInvestorPitchViewProps {
  onBackToApp?: () => void;
}

const SECTIONS = [
  { page: 1, title: "Executive Thesis & Foundational Mandate" },
  { page: 2, title: "Strategic Overview & Table of Contents" },
  { page: 3, title: "The Market Problem: The Fake Review Crisis" },
  { page: 4, title: "The Solution: The 60-Second Video Protocol" },
  { page: 5, title: "Consumer Experience: Mobile PWA & Discovery" },
  { page: 6, title: "The Immersive Vertical Video Player" },
  { page: 7, title: "Community, Creator Profiles & Direct Sharing" },
  { page: 8, title: "Interactive Comments & Inquiries Drawer" },
  { page: 9, title: "Business Profile Architecture & Action Portal" },
  { page: 10, title: "The Recording Studio: Hardware Camera Lock" },
  { page: 11, title: "Interactive Map & Geolocation Discovery" },
  { page: 12, title: "B2B Merchant Suite: Verification & Claiming" },
  { page: 13, title: "B2B Growth Tools: Tabletop QR Stands" },
  { page: 14, title: "Branded Ad Exporter & 1-Click Video Embeds" },
  { page: 15, title: "Technical Architecture: Bunny.net & Cloud SQL" },
  { page: 16, title: "Business Model & Revenue Architecture" },
  { page: 17, title: "Competitive Moat: Why Incumbents Cannot Replicate" },
  { page: 18, title: "Execution Roadmap & Investment Opportunity" },
];

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

/**
 * Individual Main Page Canvas Renderer
 */
const PdfPageCanvas: React.FC<{
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNum: number;
  zoomLevel: number;
  onPageRef?: (el: HTMLDivElement | null) => void;
}> = ({ pdfDoc, pageNum, zoomLevel, onPageRef }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    let isCancelled = false;

    const render = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        if (isCancelled || !canvasRef.current) return;

        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const scale = (zoomLevel / 100) * 1.5;
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;
        await task.promise;
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error(`Error rendering PDF page ${pageNum}:`, err);
        }
      }
    };

    render();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, pageNum, zoomLevel]);

  return (
    <div
      ref={onPageRef}
      data-page-num={pageNum}
      className="flex flex-col items-center my-4 transition-all duration-200"
    >
      <div className="bg-[#0e0f12] p-1 sm:p-2 rounded-xl shadow-2xl border border-zinc-800/80 max-w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          className="block rounded shadow-lg max-w-full h-auto bg-white"
        />
      </div>
      <span className="text-[11px] text-zinc-500 mt-2 font-medium">
        Page {pageNum}
      </span>
    </div>
  );
};

/**
 * Individual Sidebar Thumbnail Canvas Renderer
 */
const PdfThumbnailCanvas: React.FC<{
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNum: number;
}> = ({ pdfDoc, pageNum }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    let isCancelled = false;

    const render = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        if (isCancelled || !canvasRef.current) return;

        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const viewport = page.getViewport({ scale: 0.28 });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;
        await task.promise;
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          // Ignore cancellation
        }
      }
    };

    render();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, pageNum]);

  return (
    <div className="w-full aspect-[595/842] rounded overflow-hidden shadow-md border border-zinc-700/80 bg-zinc-900 flex items-center justify-center pointer-events-none">
      <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
    </div>
  );
};

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

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(18);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Enforce noindex dynamically on mount & synchronize address bar URL to /pitch
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
    document.title = "Investor Memorandum | Yoouz";

    try {
      const { pathWithoutLocale } = parseLocaleFromPath(window.location.pathname);
      if (pathWithoutLocale !== "/pitch") {
        window.history.replaceState(null, "", buildLocalizedPath("/pitch", "en"));
      }
    } catch (e) {}

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

  // Load original PDF file via PDF.js SDK when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    setIsLoadingPdf(true);
    setPdfLoadError(null);

    const loadPdf = async () => {
      try {
        const response = await fetch("/api/pitch/raw-pdf");
        if (!response.ok) {
          throw new Error(`Failed to fetch pitch PDF: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          throw new Error("Pitch PDF buffer is empty");
        }

        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || "6.4.299"}/cmaps/`,
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (isMounted) {
          setPdfDoc(doc);
          setNumPages(doc.numPages || 18);
          setIsLoadingPdf(false);
        }
      } catch (err: any) {
        console.error("Failed to load pitch PDF document via ArrayBuffer:", err);
        // Resilient fallback attempt with URL directly
        try {
          const fallbackTask = pdfjsLib.getDocument({ url: "/api/pitch/raw-pdf" });
          const doc = await fallbackTask.promise;
          if (isMounted) {
            setPdfDoc(doc);
            setNumPages(doc.numPages || 18);
            setIsLoadingPdf(false);
            return;
          }
        } catch (fallbackErr) {
          console.error("Fallback PDF URL load failed:", fallbackErr);
        }

        if (isMounted) {
          setPdfLoadError("Unable to render PDF document. Please try again.");
          setIsLoadingPdf(false);
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // Track currently visible page during vertical scroll using IntersectionObserver
  useEffect(() => {
    if (!isAuthenticated || !pdfDoc) return;

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
        threshold: 0.3,
      }
    );

    pageRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [isAuthenticated, pdfDoc, numPages]);

  // Document security keyboard overrides
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
      setAuthError("Please enter your username.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    if (!passNorm) {
      setAuthError("Please enter your password.");
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
      setAuthError("Invalid username or password.");
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
    const clamped = Math.max(1, Math.min(numPages, pageNum));
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
  // 1. MINIMAL LOGIN SCREEN
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div 
        onContextMenu={(e) => e.preventDefault()}
        className="fixed inset-0 z-[9999] bg-[#07080b] text-white flex flex-col justify-between items-center p-4 sm:p-6 overflow-y-auto select-none font-sans"
      >
        <header className="w-full max-w-4xl flex items-center justify-between py-3 relative z-10">
          <button
            type="button"
            onClick={onBackToApp || (() => window.location.href = "/")}
            className="flex items-center gap-2 text-xs sm:text-sm font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Return to Yoouz</span>
          </button>
        </header>

        <main className="w-full max-w-sm my-auto relative z-10 py-6">
          <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shadow-lg mb-3.5">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white mb-1">
                Investor Memorandum
              </h1>
              <p className="text-xs text-zinc-400 font-medium">
                Yoouz Pitch Deck & Strategic Overview
              </p>
            </div>

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
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-sm tracking-normal transition-all cursor-pointer flex items-center justify-center mt-4 active:scale-[0.99]"
              >
                Sign In
              </button>
            </form>
          </div>
        </main>

        <div className="w-full py-3 relative z-10" />
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. HIGH-PERFORMANCE PDF READER WITH CANVAS RENDERING
  // -------------------------------------------------------------
  return (
    <div 
      onContextMenu={(e) => e.preventDefault()}
      className="fixed inset-0 z-[9999] bg-[#121316] text-white flex flex-col font-sans select-none overflow-hidden print:hidden"
    >
      {/* Header Bar */}
      <header className="w-full h-13 bg-[#1c1e22] border-b border-black/60 px-3 sm:px-4 flex items-center justify-between shrink-0 z-40 shadow-md">
        {/* Left: Back, Sidebar Toggle, Clean Title */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onBackToApp || (() => window.location.href = "/")}
            className="w-8 h-8 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/80 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Back to App"
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

          <div className="flex items-center gap-1.5 ml-1 truncate">
            <span className="text-sm font-bold text-zinc-100">Yoouz</span>
            <span className="text-zinc-600 text-xs">•</span>
            <span className="text-xs font-medium text-zinc-400 truncate">Investor Memorandum</span>
          </div>
        </div>

        {/* Center: Page Stepper & Dynamic Zoom Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Page Navigation */}
          <div className="flex items-center bg-[#121316] border border-zinc-700/80 rounded-lg px-1.5 py-1 gap-1">
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
              {currentPage} <span className="text-zinc-500">/</span> {numPages}
            </span>
            <button
              type="button"
              onClick={() => scrollToPage(currentPage + 1)}
              disabled={currentPage >= numPages}
              className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
              title="Next Page"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dynamic Zoom Controls */}
          <div className="hidden md:flex items-center bg-[#121316] border border-zinc-700/80 rounded-lg px-1.5 py-1 gap-1">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
              className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(100)}
              className="text-xs font-medium text-zinc-300 hover:text-white min-w-[44px] text-center tabular-nums cursor-pointer hover:bg-zinc-800 rounded py-0.5"
              title="Reset Zoom to 100%"
            >
              {zoomLevel}%
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(200, z + 15))}
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
            title="Lock Viewer"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative bg-[#121316]">
        {/* Left Page Thumbnails Sidebar */}
        {isSidebarOpen && pdfDoc && (
          <aside className="w-56 sm:w-64 bg-[#181a1f] border-r border-black/60 flex flex-col shrink-0 z-30 overflow-y-auto p-3 space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 px-1 pb-1 border-b border-zinc-800/80 flex items-center justify-between">
              <span>Pages</span>
              <span className="text-zinc-500 font-normal">{numPages}</span>
            </div>
            {Array.from({ length: numPages }).map((_, idx) => {
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
                  className={`w-full p-2 rounded-xl flex flex-col items-center gap-2 text-left transition-all cursor-pointer group ${
                    isActive
                      ? "bg-zinc-800 ring-2 ring-white/60 shadow-lg"
                      : "hover:bg-zinc-800/50"
                  }`}
                >
                  <PdfThumbnailCanvas pdfDoc={pdfDoc} pageNum={pageNum} />
                  <div className="w-full text-center px-1">
                    <span className={`text-[11px] font-semibold ${isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"}`}>
                      Page {pageNum}
                    </span>
                    {sec && (
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5 leading-tight">
                        {sec.title}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </aside>
        )}

        {/* Scrollable Canvas Document View */}
        <div
          ref={scrollContainerRef}
          className="flex-1 h-full overflow-y-auto p-4 sm:p-6 flex flex-col items-center custom-scrollbar bg-[#121316]"
        >
          {isLoadingPdf && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
              <span className="text-sm font-medium">Loading Investor Memorandum...</span>
            </div>
          )}

          {pdfLoadError && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm text-zinc-300 font-medium">{pdfLoadError}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-colors"
              >
                Reload Document
              </button>
            </div>
          )}

          {!isLoadingPdf && !pdfLoadError && pdfDoc && (
            <div className="w-full flex flex-col items-center">
              {Array.from({ length: numPages }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <PdfPageCanvas
                    key={pageNum}
                    pdfDoc={pdfDoc}
                    pageNum={pageNum}
                    zoomLevel={zoomLevel}
                    onPageRef={(el) => (pageRefs.current[idx] = el)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


