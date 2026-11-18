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
  FileText,
  Download,
  QrCode,
  ArrowRight,
  Copy,
  Check,
  ShieldCheck,
  Monitor,
  Smartphone,
  Globe,
  CheckCircle2,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import { Place, VideoReview } from "../types";
import {
  PITCH_CHAPTERS,
  ANONYMOUS_CLAIMED_ENTITIES,
  PitchChapter,
} from "../data/pitchDeckChapters";
import { CopoEmbedView } from "./CopoEmbedView";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface YoouzInvestorPitchViewProps {
  onBackToApp?: () => void;
  places?: Place[];
  videos?: VideoReview[];
}

const PdfPageCanvas: React.FC<{
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNum: number;
  totalPages: number;
  zoomLevel: number;
  onPageRef?: (el: HTMLDivElement | null) => void;
}> = ({ pdfDoc, pageNum, totalPages, zoomLevel, onPageRef }) => {
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

        const containerMaxW = Math.min(window.innerWidth - 48, 1080);
        const baseViewport = page.getViewport({ scale: 1 });
        const fitScale = Math.min(1.45, containerMaxW / baseViewport.width);
        const cssScale = (zoomLevel / 100) * Math.max(0.45, fitScale);
        const viewport = page.getViewport({ scale: cssScale });
        const outputScale = Math.max(window.devicePixelRatio || 1, 2.2);
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) return;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform =
          outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

        const task = page.render({
          canvasContext: context,
          viewport,
          transform,
          canvas,
        });
        renderTaskRef.current = task;
        await task.promise;

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
      <div className="relative bg-[#09090B] rounded-xl shadow-2xl border border-zinc-800 overflow-x-auto max-w-full">
        <canvas ref={canvasRef} className="block bg-[#09090B]" />
        <div ref={textLayerRef} className="pdf-text-layer absolute inset-0 select-text" />
      </div>
      <span className="text-[11px] text-zinc-500 mt-2 font-medium tabular-nums select-none">
        Page {pageNum} of {totalPages}
      </span>
    </div>
  );
};

export const YoouzInvestorPitchView: React.FC<YoouzInvestorPitchViewProps> = ({
  onBackToApp,
  places = [],
  videos = [],
}) => {
  const [viewMode, setViewMode] = useState<"interactive" | "pdf">("interactive");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Per-chapter desktop/mobile screen switcher for chapters that supply both captures
  const [deviceViewByPage, setDeviceViewByPage] = useState<Record<number, "desktop" | "mobile">>({});

  // Chapter 10 live interactive embed domain switcher + JSON-LD copy state
  const [embedMerchant, setEmbedMerchant] = useState<string>("wolt.com");
  const [copiedEmbedCode, setCopiedEmbedCode] = useState<boolean>(false);

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);

  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const numPages = PITCH_CHAPTERS.length;

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

    const originalTitle = document.title;
    document.title = "Yoouz Investor Pitch Deck | 1 Live Photo = 1,000 Words";

    try {
      if (window.location.pathname !== "/pitch") {
        window.history.replaceState(null, "", "/pitch");
      }
    } catch {}

    return () => {
      if (robotsTag) {
        if (originalRobots) robotsTag.content = originalRobots;
        else robotsTag.remove();
      }
      document.title = originalTitle;
    };
  }, []);

  useEffect(() => {
    if (viewMode !== "pdf" || pdfDoc) return;
    let isMounted = true;
    setIsLoadingPdf(true);
    setPdfLoadError(null);

    const loadPdf = async () => {
      try {
        const response = await fetch(`/api/pitch/raw-pdf?v=${Date.now()}`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`Failed to fetch pitch PDF: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          standardFontDataUrl: "/standard_fonts/",
          cMapUrl: "/cmaps/",
          cMapPacked: true,
        });
        const doc = await loadingTask.promise;
        if (isMounted) {
          setPdfDoc(doc);
          setIsLoadingPdf(false);
        }
      } catch (err: any) {
        console.error("Error loading pitch PDF:", err);
        if (isMounted) {
          setPdfLoadError("Unable to render PDF document. Use Interactive HD Deck or Download PDF.");
          setIsLoadingPdf(false);
        }
      }
    };

    loadPdf();
    return () => {
      isMounted = false;
    };
  }, [viewMode, pdfDoc]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = Number(entry.target.getAttribute("data-page-num"));
            if (pageNum) setCurrentPage(pageNum);
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
  }, [viewMode, pdfDoc]);

  const scrollToPage = (pageNum: number) => {
    const clamped = Math.max(1, Math.min(numPages, pageNum));
    const targetEl = pageRefs.current[clamped - 1];
    if (targetEl && scrollContainerRef.current) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentPage(clamped);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        scrollToPage(currentPage + 1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        scrollToPage(currentPage - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const embedSnippetCode = `<!-- Yoouz Live Photo Review Widget + Google AggregateRating Schema -->
<div class="yoouz-embed" style="max-width:390px;margin:0 auto;">
  <iframe
    src="https://www.yoouz.com/embed/${embedMerchant}"
    width="100%"
    height="520"
    style="border:none;border-radius:24px;overflow:hidden;"
    title="Verified Photo Reviews for ${embedMerchant}">
  </iframe>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    "itemReviewed": { "@type": "LocalBusiness", "name": "${embedMerchant}" },
    "ratingValue": "5.0",
    "bestRating": "5",
    "worstRating": "1",
    "ratingCount": "14"
  }
  </script>
</div>`;

  const handleCopyEmbedSnippet = () => {
    navigator.clipboard?.writeText(embedSnippetCode).catch(() => {});
    setCopiedEmbedCode(true);
    setTimeout(() => setCopiedEmbedCode(false), 2000);
  };

  const renderChapterExtrasTop = (chapter: PitchChapter) => {
    if (chapter.page === 1) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
            <div className="text-[11px] font-semibold text-zinc-400">01 · Legacy Text Sites</div>
            <div className="text-sm font-bold text-white mt-1">Google · Yelp · Trustpilot</div>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Flooded with anonymous AI bot paragraphs and pay-to-play removals written from anywhere without proof of visit.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
            <div className="text-[11px] font-semibold text-zinc-400">02 · Staged Photo Libraries</div>
            <div className="text-sm font-bold text-white mt-1">Uploaded Gallery Images</div>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Legacy platforms allow years-old stock photos, heavy marketing filters, and recycled gallery uploads that mislead buyers.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-600 bg-zinc-900 p-4">
            <div className="text-[11px] font-bold text-amber-400">03 · The Yoouz Standard</div>
            <div className="text-sm font-bold text-white mt-1">1 Live Hardware Photo (3 Seconds)</div>
            <p className="text-xs text-zinc-200 mt-1.5 leading-relaxed">
              Native phone shutter only with zero gallery roll uploads + 1 to 5 solid whole stars. Undeniable proof on every visit.
            </p>
          </div>
        </div>
      );
    }

    if (chapter.page === 3) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-zinc-950/90 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0 text-white">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">1. Customer Scans QR Code</div>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                Pointing any phone camera at a Yoouz table standee, receipt, or desktop prompt opens the link immediately.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0 text-amber-400">
              <ArrowRight className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">2. Lands on Business Front Page</div>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                Visitors arrive directly at the full Business Profile first to inspect real customer photos, star score, and brand banner.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-white text-zinc-950 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">3. Taps Add Review on Profile</div>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                With authentic context right in front of them, visitors tap Add Review and snap a 3-second native camera photo.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (chapter.page === 6) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-zinc-950/90 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0 text-white font-black text-xs">
              01
            </div>
            <div>
              <div className="text-xs font-bold text-white">1. Snap Photo in Seconds (No Account)</div>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                Users never create an account, enter an email, or invent a password upfront—they just snap 1 live photo and rate 1–5 stars.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0 text-amber-400 font-black text-xs">
              02
            </div>
            <div>
              <div className="text-xs font-bold text-white">2. Instant U/A4B6C8 Handle Created</div>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                Yoouz automatically provisions their persistent U/XXXXXX account on the spot so their photo review goes live immediately.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-white text-zinc-950 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">3. Optional 1-Time Phone Passkey</div>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                After publishing (for the first time only), they can optionally tap Continue with Face ID on their phone to lock their handle forever.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderChapterVisual = (chapter: PitchChapter) => {
    const activeDevice =
      chapter.mobileImagePath && deviceViewByPage[chapter.page] === "mobile"
        ? "mobile"
        : chapter.frameMode;

    if (chapter.page === 6) {
      return (
        <div className="rounded-2xl border border-zinc-800 bg-[#09090B] overflow-hidden">
          <div className="px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-medium text-zinc-300 font-mono">
              yoouz.com · Dual Proof Stage: Live U/XXXXXX Profile + Native iPhone Face ID Passkey
            </span>
            <span className="text-xs text-amber-400 font-semibold">
              No Email · No Password · 1-Time Optional Face ID
            </span>
          </div>

          <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center bg-[#070709]">
            <div className="lg:col-span-7 rounded-xl border border-zinc-800 bg-black overflow-hidden shadow-2xl">
              <div className="px-3.5 py-2 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between text-[11px] text-zinc-300">
                <span className="font-semibold text-white">01 · Live Yoouz U/6MRX8X Community Profile</span>
                <span className="text-zinc-400 font-mono">Save Face ID (1-Time) Button</span>
              </div>
              <img
                src="/pitch-assets/v2/06-passkey-live-app.png"
                alt="Live U/XXXXXX Member Profile with 1-Time Face ID Passkey Button"
                referrerPolicy="no-referrer"
                className="w-full h-auto block object-contain bg-black"
              />
            </div>

            <div className="lg:col-span-5 rounded-xl border border-zinc-700 bg-black overflow-hidden shadow-2xl">
              <div className="px-3.5 py-2 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between text-[11px] text-zinc-300">
                <span className="font-semibold text-white">02 · Native Phone Passkey Sheet</span>
                <span className="text-amber-400 font-mono">Passkey for yoouz.com · U/A4B6C8</span>
              </div>
              <img
                src="/pitch-assets/v2/06-iphone-passkey-prompt.png"
                alt="Passkey for yoouz.com on iPhone Face ID for U/A4B6C8"
                referrerPolicy="no-referrer"
                className="w-full h-auto block object-contain bg-black"
              />
            </div>
          </div>

          <div className="px-5 py-2.5 bg-zinc-950 border-t border-zinc-800 text-xs text-zinc-400">
            {chapter.imageCaption}
          </div>
        </div>
      );
    }

    if (chapter.frameMode === "embed") {
      return (
        <div className="rounded-2xl border border-zinc-800 bg-[#09090B] overflow-hidden">
          <div className="px-4 py-3 bg-zinc-900/90 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-zinc-300 font-medium">
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              <span>Interactive Merchant Website Storefront Preview</span>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg p-1">
              {[
                { label: "wolt.com", slug: "wolt.com" },
                { label: "sephora.com", slug: "sephora.com" },
                { label: "lernerandrowe.com", slug: "lernerandrowe.com" },
              ].map((opt) => (
                <button
                  key={opt.slug}
                  type="button"
                  onClick={() => setEmbedMerchant(opt.slug)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    embedMerchant === opt.slug
                      ? "bg-white text-zinc-950 font-semibold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Simulated Client Storefront Mounting Real Working CopoEmbedView */}
            <div className="lg:col-span-7 rounded-xl border border-zinc-800 bg-[#121216] overflow-hidden">
              <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                <span className="font-mono truncate">https://www.{embedMerchant}/reviews</span>
                <span className="text-zinc-500">Live Customer Proof Section</span>
              </div>
              <div className="p-4 sm:p-5 flex flex-col items-center bg-[#0B0B0E]">
                <div className="text-center mb-3">
                  <p className="text-xs font-semibold text-zinc-400">
                    Real Customers · Verified On-Site Proof
                  </p>
                  <p className="text-sm font-bold text-white mt-0.5">
                    What Verified Buyers Photograph at {embedMerchant}
                  </p>
                </div>
                <div className="w-full max-w-[390px] h-[520px] rounded-[24px] overflow-hidden border border-zinc-800 bg-black shadow-2xl relative">
                  <CopoEmbedView
                    key={embedMerchant}
                    embedId={embedMerchant}
                    places={places}
                    videos={videos}
                    currentUser={null}
                    forcePreview={true}
                    onOpenPlace={() => {}}
                    onOpenCreator={() => {}}
                    onRecordReview={() => {}}
                    onCloseEmbed={() => {}}
                  />
                </div>
              </div>
            </div>

            {/* Deployment Snippet & Schema.org Proof */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white">
                    1-Line Iframe + Schema.org Rich Snippet
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyEmbedSnippet}
                    className="px-2.5 py-1 rounded-md bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {copiedEmbedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-[#09090B] border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed select-text">
                  {embedSnippetCode}
                </pre>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Merchants paste once onto Shopify, WooCommerce, Webflow, or custom React pages. New live photo reviews appear immediately without deployments.
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                <div className="text-xs font-bold text-white">
                  Why Storefronts Convert Higher With Embedded Photos
                </div>
                <ul className="text-xs text-zinc-300 space-y-1.5 leading-relaxed">
                  <li>· Shoppers stay on merchant checkout instead of opening new search tabs</li>
                  <li>· Hardware-captured proof outperforms anonymized plain text widgets</li>
                  <li>· Automatic AggregateRating JSON-LD boosts organic Google SERP visibility</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="px-5 py-2.5 bg-zinc-950 border-t border-zinc-800 text-xs text-zinc-400">
            {chapter.imageCaption}
          </div>
        </div>
      );
    }

    if (activeDevice === "mobile") {
      const mobileSrc = chapter.mobileImagePath || chapter.imagePath;
      return (
        <div className="rounded-2xl border border-zinc-800 bg-[#09090B] overflow-hidden">
          {chapter.mobileImagePath && (
            <div className="px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-zinc-300">Live App Viewport Switcher</span>
              <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() =>
                    setDeviceViewByPage((prev) => ({ ...prev, [chapter.page]: "desktop" }))
                  }
                  className="px-2.5 py-1 rounded-md text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop 1440px</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDeviceViewByPage((prev) => ({ ...prev, [chapter.page]: "mobile" }))
                  }
                  className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white text-zinc-950 flex items-center gap-1.5 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile PWA</span>
                </button>
              </div>
            </div>
          )}

          <div className="p-5 sm:p-8 flex flex-col items-center justify-center bg-[#070709]">
            <div className="w-full max-w-[360px] rounded-[28px] border-2 border-zinc-700 bg-black overflow-hidden shadow-2xl">
              <img
                src={mobileSrc}
                alt={chapter.headline}
                referrerPolicy="no-referrer"
                className="w-full h-auto block object-contain bg-black"
              />
            </div>
          </div>

          <div className="px-5 py-2.5 bg-zinc-950 border-t border-zinc-800 text-xs text-zinc-400">
            {chapter.imageCaption}
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-zinc-800 bg-[#09090B] overflow-hidden">
        <div className="px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-medium text-zinc-300 font-mono">
            yoouz.com · 2x Retina Live Production Capture
          </span>

          {chapter.mobileImagePath && (
            <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-1">
              <button
                type="button"
                onClick={() =>
                  setDeviceViewByPage((prev) => ({ ...prev, [chapter.page]: "desktop" }))
                }
                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white text-zinc-950 flex items-center gap-1.5 cursor-pointer"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop 1440px</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setDeviceViewByPage((prev) => ({ ...prev, [chapter.page]: "mobile" }))
                }
                className="px-2.5 py-1 rounded-md text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile PWA</span>
              </button>
            </div>
          )}
        </div>

        <div className="bg-black w-full">
          <img
            src={chapter.imagePath}
            alt={chapter.headline}
            referrerPolicy="no-referrer"
            className="w-full h-auto block object-contain bg-black"
          />
        </div>

        <div className="px-5 py-2.5 bg-zinc-950 border-t border-zinc-800 text-xs text-zinc-400">
          {chapter.imageCaption}
        </div>
      </div>
    );
  };

  const renderChapterExtrasBottom = (chapter: PitchChapter) => {
    if (chapter.page === 14) {
      return (
        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-bold tracking-wider text-white uppercase">
              Active Claimed & Pre-Indexed Portfolio (Privacy-Protected Showcase)
            </h3>
            <span className="text-xs text-zinc-400 tabular-nums">
              {places.length > 0 ? `${places.length} Live Entities Indexed` : "194+ Entities Indexed"} · Zero Exposed Owner Emails
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ANONYMOUS_CLAIMED_ENTITIES.map((entity) => (
              <div
                key={entity.domain}
                className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-3.5 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white truncate">{entity.name}</span>
                  {entity.status.includes("Claimed") && (
                    <ShieldCheck className="w-4 h-4 text-white shrink-0" />
                  )}
                </div>
                <div className="text-[11px] font-mono text-zinc-400 truncate">{entity.domain}</div>
                <div className="text-[11px] text-zinc-300">{entity.category}</div>
                <div className="text-[11px] text-amber-400/90 font-medium pt-1 border-t border-zinc-800/80">
                  {entity.highlights}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (chapter.page === 15) {
      return (
        <div className="space-y-5 pt-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/90 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/90 text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                  <th className="py-3 px-4">Platform Architecture</th>
                  <th className="py-3 px-4">Legacy Text Review Sites</th>
                  <th className="py-3 px-4 text-white">Yoouz Live Photo Protocol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-xs">
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Proof Format</td>
                  <td className="py-3 px-4 text-zinc-400">Plain text spoofable by bots</td>
                  <td className="py-3 px-4 font-semibold text-white">
                    1 Live Hardware Photo + Whole Stars (3s)
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Gallery & Stock Spoofing</td>
                  <td className="py-3 px-4 text-zinc-400">Open file uploads & old galleries</td>
                  <td className="py-3 px-4 font-semibold text-white">
                    Blocked at OS camera level (0% uploads)
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Business Onboarding</td>
                  <td className="py-3 px-4 text-zinc-400">Manual listing setup required</td>
                  <td className="py-3 px-4 font-semibold text-white">
                    Zero-signup auto-scraped profile, logo & banner
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Reviewer Friction</td>
                  <td className="py-3 px-4 text-zinc-400">Mandatory email / password wall</td>
                  <td className="py-3 px-4 font-semibold text-white">
                    Instant U/XXXXXX handle + 1-Tap Face ID Passkey
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Unit Infrastructure Cost</td>
                  <td className="py-3 px-4 text-zinc-400">High spam moderation overhead</td>
                  <td className="py-3 px-4 font-semibold text-amber-400 tabular-nums">
                    ~120 KB Sharp JPEG · Bunny.net CDN + Cloud SQL
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
              <div className="text-xs font-bold text-zinc-400">TIER 01 · PUBLIC PROFILE</div>
              <div className="text-xl font-black text-white mt-1 tabular-nums">$0 / forever</div>
              <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">
                Auto-indexed profile, cover banner, aggregate whole-star rating, and unlimited customer live photo reviews.
              </p>
            </div>
            <div className="rounded-xl border-2 border-white bg-zinc-900 p-4 shadow-xl">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-white">
                  TIER 02 · CLAIMED BUSINESS PRO
                </span>
                <span className="text-[11px] font-bold text-amber-400">Core SaaS</span>
              </div>
              <div className="text-xl font-black text-white mt-1 tabular-nums">$49 / month</div>
              <p className="text-xs text-zinc-200 mt-1.5 leading-relaxed">
                Verified Business badge, Official Pinned Replies, Direct Customer Chat Inbox, Analytics & Print QR Stand Kit.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-700 bg-zinc-900/90 p-4">
              <div className="text-xs font-extrabold text-amber-400">
                TIER 03 · GROWTH & WEBSITE WIDGET
              </div>
              <div className="text-xl font-black text-white mt-1 tabular-nums">$149 / month</div>
              <p className="text-xs text-zinc-200 mt-1.5 leading-relaxed">
                Unlimited Embeddable Website Photo Carousels, Schema.org Rich Snippets, Ad Exports & Priority Placement.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#09090B] text-white flex flex-col font-sans overflow-hidden">
      <style>{`
        .pdf-text-layer {
          position: absolute;
          text-align: initial;
          inset: 0;
          overflow: hidden;
          opacity: 1;
          line-height: 1;
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
          background: rgba(255, 255, 255, 0.28);
          color: transparent;
        }
      `}</style>

      {/* Top Executive Utility Bar */}
      <header className="w-full h-14 bg-[#09090B] border-b border-zinc-800 px-3 sm:px-5 flex items-center justify-between gap-4 shrink-0 z-40 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBackToApp || (() => (window.location.href = "/"))}
            className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Back to Yoouz"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsSidebarOpen((v) => !v)}
            className={`hidden md:flex w-8 h-8 rounded-lg border items-center justify-center transition-colors cursor-pointer shrink-0 ${
              isSidebarOpen
                ? "bg-white text-zinc-950 border-white"
                : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white"
            }`}
            title="Toggle 15-Chapter Navigator"
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          <div className="hidden sm:flex items-center gap-2 ml-1 truncate">
            <span className="text-sm font-black tracking-tight text-white whitespace-nowrap">
              Yoouz
            </span>
            <span className="text-zinc-600 text-xs">·</span>
            <span className="text-xs font-semibold text-zinc-300 truncate hidden lg:inline">
              Investor Pitch Deck (15 Chapters · Live Photo Proof)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("interactive")}
              className={`px-2 sm:px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === "interactive"
                  ? "bg-white text-zinc-950"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span className="sm:hidden">HD Deck</span>
              <span className="hidden sm:inline">Interactive HD Deck</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("pdf")}
              className={`px-2 sm:px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === "pdf" ? "bg-white text-zinc-950" : "text-zinc-400 hover:text-white"
              }`}
            >
              <span className="sm:hidden">PDF</span>
              <span className="hidden sm:inline">PDF Document View</span>
            </button>
          </div>

          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-1.5 py-1 gap-1">
            <button
              type="button"
              onClick={() => scrollToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
              title="Previous Chapter"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-bold text-white px-1.5 tabular-nums whitespace-nowrap">
              {currentPage} <span className="text-zinc-500">/</span> {numPages}
            </span>
            <button
              type="button"
              onClick={() => scrollToPage(currentPage + 1)}
              disabled={currentPage >= numPages}
              className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
              title="Next Chapter"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="hidden lg:flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-1.5 py-1 gap-1">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
              className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(100)}
              className="text-xs font-semibold text-zinc-200 hover:text-white min-w-[44px] text-center tabular-nums cursor-pointer"
              title="Reset Zoom"
            >
              {zoomLevel}%
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(140, z + 10))}
              className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/api/pitch/raw-pdf?download=1&refresh=1"
            download="Yoouz_Visual_Investor_Pitch_Deck.pdf"
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download PDF</span>
          </a>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="hidden sm:flex w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative bg-[#09090B]">
        {isSidebarOpen && (
          <aside className="hidden md:flex w-72 bg-[#09090B] border-r border-zinc-800 flex-col shrink-0 z-30 overflow-y-auto p-3 space-y-1.5 select-none">
            <div className="text-[11px] font-bold tracking-wider text-zinc-400 px-1 pb-2 border-b border-zinc-800 flex items-center justify-between">
              <span>15-Chapter Investor Deck</span>
              <span className="text-white font-extrabold">Photo Proof</span>
            </div>

            {PITCH_CHAPTERS.map((chapter) => {
              const isActive = currentPage === chapter.page;
              const pageStr = chapter.page < 10 ? `0${chapter.page}` : `${chapter.page}`;
              return (
                <button
                  key={chapter.page}
                  type="button"
                  onClick={() => scrollToPage(chapter.page)}
                  className={`w-full p-2.5 rounded-xl flex items-start gap-2.5 text-left transition-all cursor-pointer ${
                    isActive
                      ? "bg-zinc-900 border border-white shadow-lg"
                      : "hover:bg-zinc-900/60 border border-zinc-800/40"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-md text-xs font-extrabold tabular-nums flex items-center justify-center shrink-0 mt-0.5 ${
                      isActive ? "bg-white text-zinc-950" : "bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    {pageStr}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-xs font-bold leading-snug ${
                        isActive ? "text-white" : "text-zinc-300"
                      }`}
                    >
                      {chapter.shortTitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </aside>
        )}

        {/* Scrollable Deck Container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 h-full overflow-y-auto overflow-x-hidden p-3 sm:p-8 flex flex-col items-center bg-[#09090B]"
        >
          {viewMode === "interactive" ? (
            <div
              style={{
                width: "100%",
                maxWidth: `${Math.round(1140 * (zoomLevel / 100))}px`,
              }}
              className="space-y-10 pb-16 transition-all duration-150"
            >
              {PITCH_CHAPTERS.map((chapter, idx) => {
                const pageStr = chapter.page < 10 ? `0${chapter.page}` : `${chapter.page}`;
                return (
                  <section
                    key={chapter.page}
                    ref={(el) => {
                      pageRefs.current[idx] = el as HTMLDivElement | null;
                    }}
                    data-page-num={chapter.page}
                    className="rounded-2xl bg-[#111215] border border-zinc-800 shadow-2xl overflow-hidden"
                  >
                    {/* Chapter Top Bar */}
                    <div className="px-5 sm:px-8 py-3.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between gap-4">
                      <span className="text-xs font-extrabold tracking-wider text-zinc-200">
                        {chapter.kicker}
                      </span>
                      <span className="text-xs font-bold text-zinc-400 tabular-nums whitespace-nowrap">
                        Page {pageStr} of {numPages}
                      </span>
                    </div>

                    <div className="p-4 sm:p-8 space-y-6">
                      {/* Editorial Headline & Subheadline */}
                      <div className="max-w-4xl">
                        <h2
                          style={{ textWrap: "balance" } as React.CSSProperties}
                          className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight"
                        >
                          {chapter.headline}
                        </h2>
                        <p className="text-sm sm:text-base text-zinc-300 mt-3 leading-relaxed">
                          {chapter.subheadline}
                        </p>
                      </div>

                      {renderChapterExtrasTop(chapter)}

                      {/* Uncropped 2x Retina Visual Proof Stage */}
                      {renderChapterVisual(chapter)}

                      {/* 4 Numbered Annotations */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-extrabold tracking-wider text-white uppercase">
                            Detailed Screen & Architecture Breakdown
                          </span>
                          <span className="text-xs text-zinc-400 font-medium">
                            4 Key Proof Points
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {chapter.callouts.map((c) => (
                            <div
                              key={c.id}
                              className="text-left p-4 rounded-xl bg-zinc-900/75 border border-zinc-800 flex items-start gap-3.5"
                            >
                              <span className="w-7 h-7 rounded-lg bg-white text-zinc-950 text-xs font-black tabular-nums flex items-center justify-center shrink-0 mt-0.5">
                                {c.id}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                  <h3 className="text-sm font-extrabold text-white">{c.title}</h3>
                                  <span className="text-[11px] font-medium text-amber-400">
                                    {c.tag}
                                  </span>
                                </div>
                                <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">
                                  {c.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {renderChapterExtrasBottom(chapter)}

                      {/* Bottom 3-Column Metrics */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-zinc-800">
                        {chapter.metrics.map((m, mIdx) => (
                          <div
                            key={mIdx}
                            className="rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3"
                          >
                            <div className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">
                              {m.label}
                            </div>
                            <div className="text-base sm:text-lg font-black text-white tabular-nums mt-0.5">
                              {m.value}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">{m.detail}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              {isLoadingPdf && (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-400">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                  <span className="text-sm font-semibold text-white">
                    Rendering 15-Page Investor Pitch PDF...
                  </span>
                </div>
              )}

              {pdfLoadError && (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white">
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-zinc-300 font-medium">{pdfLoadError}</p>
                  <button
                    type="button"
                    onClick={() => setViewMode("interactive")}
                    className="mt-2 px-4 py-2 rounded-lg bg-white text-zinc-950 text-xs font-extrabold transition-colors cursor-pointer"
                  >
                    Switch to Interactive HD Deck
                  </button>
                </div>
              )}

              {!isLoadingPdf && !pdfLoadError && pdfDoc && (
                <div className="w-full flex flex-col items-center">
                  {Array.from({ length: pdfDoc.numPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <PdfPageCanvas
                        key={pageNum}
                        pdfDoc={pdfDoc}
                        pageNum={pageNum}
                        totalPages={pdfDoc.numPages}
                        zoomLevel={zoomLevel}
                        onPageRef={(el) => {
                          pageRefs.current[idx] = el;
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
