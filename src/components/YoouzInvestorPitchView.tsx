import React, { useState, useEffect, useRef } from "react";
import { 
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

// Configure PDF.js worker locally from server route
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface YoouzInvestorPitchViewProps {
  onBackToApp?: () => void;
}

const SECTIONS = [
  { page: 1, title: "Executive Summary & Core Mission" },
  { page: 2, title: "Complete Platform Guide & 18-Section Breakdown" },
  { page: 3, title: "The Market Problem & 60-Second Video Protocol" },
  { page: 4, title: "Trust Flywheel & Mobile Web App (PWA)" },
  { page: 5, title: "Vertical Video Player & Community Architecture" },
  { page: 6, title: "Interactive Comments & Business Profile Portal" },
  { page: 7, title: "Recording Studio Hardware Lock & Interactive Map" },
  { page: 8, title: "Local Commerce Metrics & Yoouz for Business" },
  { page: 9, title: "B2B Growth Engine: Tabletop QR Stands & Viral Loop" },
  { page: 10, title: "Branded Ad Exporter, Website Widget & Tech Stack" },
  { page: 11, title: "Cloud SQL, 75+ Languages, AI SEO & Pricing Tiers" },
  { page: 12, title: "Unit Economics, ARR Scaling & Competitive Moat" },
  { page: 13, title: "Four Defensive Moats & Execution Roadmap" },
  { page: 14, title: "Phase 2/3 Milestones & Investor Summary" },
];

/**
 * Individual Main Page Canvas + Selectable Vector TextLayer Renderer
 * Renders at 3x+ Retina HiDPI resolution with native PDF font metrics and full text selection
 */
const PdfPageCanvas: React.FC<{
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNum: number;
  zoomLevel: number;
  onPageRef?: (el: HTMLDivElement | null) => void;
}> = ({ pdfDoc, pageNum, zoomLevel, onPageRef }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<any>(null);
  const textLayerInstanceRef = useRef<any>(null);

  useEffect(() => {
    let isCancelled = false;

    const render = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        if (isCancelled || !canvasRef.current) return;

        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }
        if (textLayerInstanceRef.current) {
          try {
            textLayerInstanceRef.current.cancel();
          } catch {}
        }

        // Base display scale (at 100% zoom, 595pt PDF page is ~850px CSS width)
        const cssScale = (zoomLevel / 100) * 1.45;
        const viewport = page.getViewport({ scale: cssScale });

        // Ultra-crisp Retina HiDPI supersampling (minimum 3x physical pixel density)
        const outputScale = Math.max(window.devicePixelRatio || 1, 3);
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d", { alpha: false });

        if (!context) return;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform =
          outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          transform: transform,
          canvas: canvas,
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;
        await task.promise;

        // Render authentic selectable PDF TextLayer over the canvas so text & links can be copied freely
        if (!isCancelled && textLayerRef.current && (pdfjsLib as any).TextLayer) {
          const textContainer = textLayerRef.current;
          textContainer.innerHTML = "";
          textContainer.style.width = `${Math.floor(viewport.width)}px`;
          textContainer.style.height = `${Math.floor(viewport.height)}px`;
          textContainer.style.setProperty("--scale-factor", `${cssScale}`);

          const textContentSource = page.streamTextContent();
          const textLayer = new (pdfjsLib as any).TextLayer({
            textContentSource,
            container: textContainer,
            viewport,
          });
          textLayerInstanceRef.current = textLayer;
          await textLayer.render();
        }
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
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }
      if (textLayerInstanceRef.current) {
        try {
          textLayerInstanceRef.current.cancel();
        } catch {}
      }
    };
  }, [pdfDoc, pageNum, zoomLevel]);

  return (
    <div
      ref={onPageRef}
      data-page-num={pageNum}
      className="flex flex-col items-center my-4 transition-all duration-200 max-w-full"
    >
      <div className="relative bg-white rounded-lg shadow-2xl border border-zinc-800/80 overflow-x-auto max-w-full">
        <canvas
          ref={canvasRef}
          className="block bg-white"
        />
        <div
          ref={textLayerRef}
          className="pdf-text-layer absolute inset-0 select-text"
        />
      </div>
      <span className="text-[11px] text-zinc-500 mt-2 font-medium select-none">
        Page {pageNum}
      </span>
    </div>
  );
};

/**
 * Individual Sidebar Thumbnail Canvas Renderer (HiDPI crisp rendering)
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

        const cssScale = 0.32;
        const outputScale = Math.max(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: cssScale });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d", { alpha: false });

        if (!context) return;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          transform: [outputScale, 0, 0, outputScale, 0, 0],
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
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }
    };
  }, [pdfDoc, pageNum]);

  return (
    <div className="w-full aspect-[595/842] rounded overflow-hidden shadow-md border border-zinc-700/80 bg-zinc-900 flex items-center justify-center pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full object-contain" />
    </div>
  );
};

export const YoouzInvestorPitchView: React.FC<YoouzInvestorPitchViewProps> = ({ onBackToApp }) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(14);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(true);
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Enforce strict noindex, strip keywords/grounding & synchronize address bar URL to /pitch
  useEffect(() => {
    const noIndexRule = "noindex, nofollow, noarchive, nosnippet, noimageindex";

    let robotsTag = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    const originalRobots = robotsTag ? robotsTag.content : "";
    if (!robotsTag) {
      robotsTag = document.createElement("meta");
      robotsTag.name = "robots";
      document.head.appendChild(robotsTag);
    }
    robotsTag.content = noIndexRule;

    let googlebotTag = document.querySelector('meta[name="googlebot"]') as HTMLMetaElement;
    const originalGooglebot = googlebotTag ? googlebotTag.content : "";
    if (!googlebotTag) {
      googlebotTag = document.createElement("meta");
      googlebotTag.name = "googlebot";
      document.head.appendChild(googlebotTag);
    }
    googlebotTag.content = noIndexRule;

    const keywordsTag = document.querySelector('meta[name="keywords"]') as HTMLMetaElement | null;
    const originalKeywords = keywordsTag ? keywordsTag.content : "";
    if (keywordsTag) {
      keywordsTag.content = "";
    }

    const originalTitle = document.title;
    document.title = "Investor Memorandum | Yoouz";

    try {
      if (window.location.pathname !== "/pitch") {
        window.history.replaceState(null, "", "/pitch");
      }
    } catch (e) {}

    return () => {
      if (robotsTag) {
        if (originalRobots) {
          robotsTag.content = originalRobots;
        } else {
          robotsTag.remove();
        }
      }
      if (googlebotTag) {
        if (originalGooglebot) {
          googlebotTag.content = originalGooglebot;
        } else {
          googlebotTag.remove();
        }
      }
      if (keywordsTag && originalKeywords) {
        keywordsTag.content = originalKeywords;
      }
      document.title = originalTitle;
    };
  }, []);

  // Load 100% original PDF file with local standard_fonts and cmaps for exact original font fidelity
  useEffect(() => {
    let isMounted = true;
    setIsLoadingPdf(true);
    setPdfLoadError(null);

    const loadPdf = async () => {
      try {
        const response = await fetch(`/api/pitch/raw-pdf?v=${Date.now()}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch pitch PDF: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          throw new Error("Pitch PDF buffer is empty");
        }

        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          standardFontDataUrl: "/standard_fonts/",
          cMapUrl: "/cmaps/",
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (isMounted) {
          setPdfDoc(doc);
          setNumPages(doc.numPages || 14);
          setIsLoadingPdf(false);
        }
      } catch (err: any) {
        console.error("Failed to load pitch PDF document via ArrayBuffer:", err);
        try {
          const fallbackTask = pdfjsLib.getDocument({
            url: `/api/pitch/raw-pdf?v=${Date.now()}`,
            standardFontDataUrl: "/standard_fonts/",
            cMapUrl: "/cmaps/",
            cMapPacked: true,
          });
          const doc = await fallbackTask.promise;
          if (isMounted) {
            setPdfDoc(doc);
            setNumPages(doc.numPages || 14);
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
  }, []);

  // Track currently visible page during vertical scroll using IntersectionObserver
  useEffect(() => {
    if (!pdfDoc) return;

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
  }, [pdfDoc, numPages]);

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

  return (
    <div className="fixed inset-0 z-[9999] bg-[#121316] text-white flex flex-col font-sans overflow-hidden">
      {/* Official PDF.js TextLayer CSS for accurate selectable text and links */}
      <style>{`
        .pdf-text-layer {
          position: absolute;
          text-align: initial;
          inset: 0;
          overflow: hidden;
          opacity: 1;
          line-height: 1;
          -webkit-text-size-adjust: none;
          text-size-adjust: none;
          forced-color-adjust: none;
          transform-origin: 0 0;
          z-index: 2;
        }
        .pdf-text-layer :is(span, br) {
          color: transparent;
          position: absolute;
          white-space: pre;
          cursor: text;
          transform-origin: 0% 0%;
        }
        .pdf-text-layer ::selection {
          background: rgba(59, 130, 246, 0.35);
          color: transparent;
        }
      `}</style>

      {/* Header Bar */}
      <header className="w-full h-13 bg-[#1c1e22] border-b border-black/60 px-3 sm:px-4 flex items-center justify-between shrink-0 z-40 shadow-md select-none">
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
          <div className="flex items-center bg-[#121316] border border-zinc-700/80 rounded-lg px-1.5 py-1 gap-1">
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

        {/* Right: Fullscreen */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex w-8 h-8 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/80 items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative bg-[#121316]">
        {/* Left Page Thumbnails Sidebar */}
        {isSidebarOpen && pdfDoc && (
          <aside className="w-56 sm:w-64 bg-[#181a1f] border-r border-black/60 flex flex-col shrink-0 z-30 overflow-y-auto p-3 space-y-3 select-none">
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

        {/* Scrollable HiDPI Document View */}
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
