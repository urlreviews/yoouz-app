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
  X,
  Layers,
  Play,
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

const toWebp = (p?: string) => (p ? p.replace(/\.png$/, ".webp") : "");

const PITCH_VIDEO_CHAPTERS: { time: number; label: string; title: string }[] = [
  { time: 0, label: "0:00", title: "Executive Summary" },
  { time: 34, label: "0:34", title: "Market Opportunity ($15.8B+)" },
  { time: 65, label: "1:05", title: "Competitive Landscape" },
  { time: 94, label: "1:34", title: "Go-To-Market Strategy" },
  { time: 124, label: "2:04", title: "Business Model" },
  { time: 158, label: "2:38", title: "Founder Edge & Live Status" },
  { time: 188, label: "3:08", title: "Autonomous Indexing Engine" },
  { time: 215, label: "3:35", title: "Physical-to-Digital QR Journey" },
  { time: 241, label: "4:01", title: "Anti-Spoofing Camera Protocol" },
  { time: 262, label: "4:22", title: "Zero-Friction Identity" },
  { time: 287, label: "4:47", title: "Verified Badge & Passkey" },
  { time: 308, label: "5:08", title: "Complete Business Storefront" },
  { time: 327, label: "5:27", title: "Engagement & Dialogue" },
  { time: 347, label: "5:47", title: "Customer Retention & Chat" },
  { time: 367, label: "6:07", title: "Merchant Website Embed" },
  { time: 387, label: "6:27", title: "$0 CAC Physical Distribution" },
  { time: 407, label: "6:47", title: "B2B Merchant Portal" },
  { time: 433, label: "7:13", title: "Organic Search & SEO" },
  { time: 460, label: "7:40", title: "Real Market Traction" },
  { time: 484, label: "8:04", title: "Monetization & Moat" },
];

const PitchResponsiveImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}> = ({ src, alt, className = "", priority = false }) => {
  const [loaded, setLoaded] = useState(false);
  const webpSrc = toWebp(src);

  return (
    <div className="relative w-full overflow-hidden bg-black flex items-center justify-center min-h-[140px] sm:min-h-[200px]">
      {!loaded && (
        <div className="absolute inset-0 bg-zinc-950/80 flex items-center justify-center z-10">
          <Loader2 className="w-5 h-5 text-zinc-600 animate-spin" />
        </div>
      )}
      <picture className="w-full h-auto block">
        <source srcSet={webpSrc} type="image/webp" />
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={`w-full h-auto block object-contain transition-opacity duration-200 ${
            loaded ? "opacity-100" : "opacity-0"
          } ${className}`}
        />
      </picture>
    </div>
  );
};

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
          // Suppress transient render cancellation noise
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

  const pageStr = pageNum < 10 ? `0${pageNum}` : `${pageNum}`;
  const totalStr = totalPages < 10 ? `0${totalPages}` : `${totalPages}`;

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
        {pageStr} / {totalStr}
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

  // Chapter 15 (Interactive Website Embed) domain switcher + JSON-LD copy state
  const [embedMerchant, setEmbedMerchant] = useState<string>("wolt.com");
  const [copiedEmbedCode, setCopiedEmbedCode] = useState<boolean>(false);

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);
  const [isMobileChapterSheetOpen, setIsMobileChapterSheetOpen] = useState<boolean>(false);

  // Executive Pitch Video Cinema Modal state
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);
  const [videoStartTime, setVideoStartTime] = useState<number>(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [videoPlaybackRate, setVideoPlaybackRate] = useState<number>(1);
  const [isVideoBuffering, setIsVideoBuffering] = useState<boolean>(false);
  const pitchVideoRef = useRef<HTMLVideoElement | null>(null);

  const openPitchVideo = (startSeconds = 0) => {
    setVideoStartTime(startSeconds);
    setVideoCurrentTime(startSeconds);
    setIsMobileChapterSheetOpen(false);
    setIsVideoModalOpen(true);
  };

  const closePitchVideo = () => {
    if (pitchVideoRef.current) {
      try {
        pitchVideoRef.current.pause();
      } catch {}
    }
    setIsVideoModalOpen(false);
  };

  const seekPitchVideo = (seconds: number) => {
    setVideoStartTime(seconds);
    setVideoCurrentTime(seconds);
    const el = pitchVideoRef.current;
    if (el) {
      try {
        el.currentTime = seconds;
        const playPromise = el.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {});
        }
      } catch {}
    }
  };

  const cycleVideoPlaybackRate = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const next = speeds[(speeds.indexOf(videoPlaybackRate) + 1) % speeds.length];
    setVideoPlaybackRate(next);
    if (pitchVideoRef.current) {
      pitchVideoRef.current.playbackRate = next;
    }
  };

  useEffect(() => {
    if (!isVideoModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closePitchVideo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isVideoModalOpen]);

  useEffect(() => {
    if (!isVideoModalOpen) return;
    const el = pitchVideoRef.current;
    if (!el) return;
    el.playbackRate = videoPlaybackRate;
    const applyStartAndPlay = () => {
      try {
        if (videoStartTime > 0 && Math.abs(el.currentTime - videoStartTime) > 1) {
          el.currentTime = videoStartTime;
        }
        const p = el.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      } catch {}
    };
    if (el.readyState >= 1) {
      applyStartAndPlay();
    } else {
      el.addEventListener("loadedmetadata", applyStartAndPlay, { once: true });
      return () => el.removeEventListener("loadedmetadata", applyStartAndPlay);
    }
  }, [isVideoModalOpen]);

  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const numPages = PITCH_CHAPTERS.length;

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      if (deltaX < 0 && currentPage < numPages) {
        scrollToPage(currentPage + 1);
      } else if (deltaX > 0 && currentPage > 1) {
        scrollToPage(currentPage - 1);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  useEffect(() => {
    // Eagerly preload all pitch deck visual assets in WebP format on mount for instant zero-lag rendering
    const webpAssets = [
      "/pitch-assets/v2/01-home-discovery.webp",
      "/pitch-assets/v2/02-search-autoscraping.webp",
      "/pitch-assets/v2/03-qr-business-front.webp",
      "/pitch-assets/v2/04-mobile-camera-flow.webp",
      "/pitch-assets/v2/05-uhandle-profile.webp",
      "/pitch-assets/v2/06-business-profile-hub.webp",
      "/pitch-assets/v2/06-iphone-passkey-prompt.webp",
      "/pitch-assets/v2/06-passkey-live-app.webp",
      "/pitch-assets/v2/06-passkey-settings.webp",
      "/pitch-assets/v2/07-comments-social-rail.webp",
      "/pitch-assets/v2/08-mobile-home.webp",
      "/pitch-assets/v2/09-messages-direct-chat.webp",
      "/pitch-assets/v2/10b-embed-standalone.webp",
      "/pitch-assets/v2/11-mobile-business-front.webp",
      "/pitch-assets/v2/12-business-portal.webp",
      "/pitch-assets/v2/13-seo-localized-page.webp",
      "/pitch-assets/v2/14-claimed-businesses.webp",
      "/pitch-assets/v2/15-mobile-pwa-feed.webp",
    ];

    webpAssets.forEach((url) => {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
    });
  }, []);

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

    const fetchPdfWithRetry = async (): Promise<ArrayBuffer> => {
      const urls = [
        "/Yoouz_Visual_Investor_Pitch_Deck.pdf?v=20261118-20ch",
        "/api/pitch/raw-pdf?v=20261118-20ch",
        "/Yoouz_Investor_Pitch_Memorandum.pdf?v=20261118-20ch",
      ];
      const delays = [600, 1200, 2000, 3000];

      for (let attempt = 0; attempt <= delays.length; attempt++) {
        const targetUrl = urls[attempt % urls.length];
        try {
          const response = await fetch(targetUrl, {
            cache: "default",
          });
          if (response.ok) {
            return await response.arrayBuffer();
          }
          if (response.status !== 429 && response.status < 500 && attempt >= urls.length - 1) {
            break;
          }
        } catch {
          // Transient fetch error; proceed to backoff retry
        }
        if (attempt < delays.length && isMounted) {
          await new Promise((r) => setTimeout(r, delays[attempt]));
        }
      }
      throw new Error("PDF temporarily rate-limited");
    };

    const loadPdf = async () => {
      try {
        const arrayBuffer = await fetchPdfWithRetry();
        if (!isMounted) return;
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
      } catch {
        if (isMounted) {
          setPdfLoadError("Unable to render PDF document right now. Use Interactive HD Deck or Download PDF.");
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

    if (chapter.page === 8) {
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

    if (chapter.page === 11) {
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
    const isMobileViewport = typeof window !== "undefined" && window.innerWidth < 640;
    const activeDevice =
      deviceViewByPage[chapter.page] ||
      (chapter.mobileImagePath && isMobileViewport ? "mobile" : chapter.frameMode);

    // Slide 02 — Market Opportunity (TAM / SAM / SOM)
    if (chapter.page === 2) {
      return (
        <div className="rounded-2xl border border-zinc-800 bg-[#09090B] overflow-hidden">
          <div className="px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-medium text-zinc-300 font-mono">
              yoouz.com · Global Market Sizing & Initial Pre-Seed Wedge (TAM / SAM / SOM)
            </span>
            <span className="text-xs text-amber-400 font-semibold">
              Multi-Billion-Dollar Visual Trust Replacement Cycle
            </span>
          </div>

          <div className="p-5 sm:p-7 grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#070709]">
            {/* TAM Card */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold tracking-wider text-zinc-400 uppercase">
                    01 · Total Addressable Market (TAM)
                  </span>
                  <span className="text-[11px] font-bold text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">
                    Global Scope
                  </span>
                </div>
                <div className="text-3xl sm:text-4xl font-black text-white tabular-nums mt-3">
                  $15.8B+
                </div>
                <div className="text-xs font-bold text-amber-400 mt-1">
                  Global Online Review & Local Discovery Market
                </div>
                <p className="text-xs text-zinc-300 mt-2.5 leading-relaxed">
                  Encompasses global consumer review platforms, enterprise reputation software, local search discovery, and e-commerce social proof widgets across 75+ languages.
                </p>
              </div>
              <div className="pt-3 border-t border-zinc-800 text-[11px] text-zinc-400 font-mono">
                CAGR ~14.2% · Driven by AI text trust collapse
              </div>
            </div>

            {/* SAM Card */}
            <div className="rounded-xl border border-zinc-700 bg-zinc-900/90 p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold tracking-wider text-zinc-300 uppercase">
                    02 · Serviceable Market (SAM)
                  </span>
                  <span className="text-[11px] font-bold text-amber-400 bg-zinc-800 px-2 py-0.5 rounded">
                    85M+ Venues
                  </span>
                </div>
                <div className="text-3xl sm:text-4xl font-black text-white tabular-nums mt-3">
                  $4.2B+
                </div>
                <div className="text-xs font-bold text-amber-400 mt-1">
                  Addressable SMB & Multi-Location Venues Worldwide
                </div>
                <p className="text-xs text-zinc-300 mt-2.5 leading-relaxed">
                  Hospitality, restaurants, cafés, boutique hotels, clinics, salons, legal practices, and D2C storefronts actively acquiring visual reviews & website conversion widgets.
                </p>
              </div>
              <div className="pt-3 border-t border-zinc-800 text-[11px] text-zinc-400 font-mono">
                $49/mo Pro – $149/mo Growth SaaS ACV
              </div>
            </div>

            {/* SOM Card */}
            <div className="rounded-xl border-2 border-white bg-zinc-900 p-5 flex flex-col justify-between space-y-4 shadow-xl">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold tracking-wider text-white uppercase">
                    03 · Pre-Seed Target (SOM)
                  </span>
                  <span className="text-[11px] font-extrabold text-zinc-950 bg-white px-2 py-0.5 rounded">
                    Immediate Wedge
                  </span>
                </div>
                <div className="text-3xl sm:text-4xl font-black text-white tabular-nums mt-3">
                  1,000 Venues
                </div>
                <div className="text-xs font-bold text-amber-400 mt-1">
                  Initial 1,000-Venue Pre-Seed Target (~$1.2M+ ARR)
                </div>
                <p className="text-xs text-zinc-200 mt-2.5 leading-relaxed">
                  High-frequency restaurants, cafés, hospitality groups, and digital merchants onboarded via free counter QR standees and self-serve profile claiming.
                </p>
              </div>
              <div className="pt-3 border-t border-zinc-800 text-[11px] text-amber-400 font-mono font-semibold">
                194+ Profiles Already Auto-Indexed in Beta
              </div>
            </div>
          </div>

          <div className="px-5 py-2.5 bg-zinc-950 border-t border-zinc-800 text-xs text-zinc-400">
            {chapter.imageCaption}
          </div>
        </div>
      );
    }

    // Slide 03 — Competitive Landscape Matrix
    if (chapter.page === 3) {
      const criteriaList = [
        {
          num: "1",
          title: "AI & Fake Review Immunity",
          yoouz: "100% Immune — Live OS Hardware Camera Only (0% Gallery Uploads)",
          google: "Fails — Flooded by AI text bots & old stock uploads",
          trustpilot: "Fails — Susceptible to bot farms & paid review broker extortion",
        },
        {
          num: "2",
          title: "3-Second Live Capture",
          yoouz: "Yes — 1 Live Photo + 1–5 Whole Stars in Under 3 Seconds",
          google: "No — Requires typing multi-sentence text essays",
          trustpilot: "No — Tedious text paragraph essays & complaint rants",
        },
        {
          num: "3",
          title: "Zero Signup / Zero App Download",
          yoouz: "Yes — Instant U/XXXXXX Handle + Optional 1-Time Passkey",
          google: "No — Mandatory Google login, email & 2FA prompt walls",
          trustpilot: "No — High-friction email sign-up forms & verification emails",
        },
        {
          num: "4",
          title: "In-Store Counter QR Loop",
          yoouz: "Yes — QR Opens Business Front Page First -> 1-Tap Photo",
          google: "Broken — Drops mobile scanners at login prompts",
          trustpilot: "None — Zero physical merchant onboarding flywheel",
        },
        {
          num: "5",
          title: "Google Page-1 Visual SEO",
          yoouz: "Yes — Original JPEGs + Schema.org Across 75+ Languages",
          google: "Generic plain-text snippets; photos buried in tabs",
          trustpilot: "Walled directories charging businesses to push bad reviews down",
        },
      ];

      return (
        <div className="rounded-2xl border border-zinc-800 bg-[#09090B] overflow-hidden">
          <div className="px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-medium text-zinc-300 font-mono">
              yoouz.com · 5-Criterion Competitive Landscape Matrix
            </span>
            <span className="text-xs text-amber-400 font-semibold">
              Yoouz vs. Google Maps &amp; Local Search vs. Trustpilot &amp; Yelp
            </span>
          </div>

          {/* Mobile-Native PWA Criterion Stack (< 640px) */}
          <div className="sm:hidden p-3.5 space-y-3.5 bg-[#070709]">
            {criteriaList.map((c) => (
              <div
                key={c.num}
                className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3.5 space-y-2.5"
              >
                <div className="text-xs font-black text-white flex items-center justify-between">
                  <span>
                    {c.num}. {c.title}
                  </span>
                </div>

                {/* Yoouz Winner Highlight */}
                <div className="rounded-lg bg-zinc-950 border border-amber-400/80 p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-amber-400">
                      Yoouz (Live Photo Protocol)
                    </span>
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-400/10 border border-amber-400/30 px-1.5 py-0.5 rounded">
                      Winner
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white leading-snug">
                    {c.yoouz}
                  </p>
                </div>

                {/* Legacy Platforms */}
                <div className="space-y-1.5 pt-0.5 text-[11px]">
                  <div className="p-2 rounded bg-zinc-950/70 border border-zinc-800/80">
                    <span className="font-bold text-zinc-400">Google Maps: </span>
                    <span className="text-zinc-300">{c.google}</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950/70 border border-zinc-800/80">
                    <span className="font-bold text-zinc-400">Trustpilot &amp; Yelp: </span>
                    <span className="text-zinc-300">{c.trustpilot}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= 640px) */}
          <div className="hidden sm:block p-4 sm:p-6 bg-[#070709] overflow-x-auto">
            <table className="w-full text-left border-collapse rounded-xl overflow-hidden border border-zinc-800">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900 text-[11px] font-extrabold uppercase tracking-wider">
                  <th className="py-3.5 px-4 text-zinc-300">Evaluation Criteria</th>
                  <th className="py-3.5 px-4 text-white bg-zinc-800/80 border-x border-zinc-700">
                    Yoouz (Live Photo Protocol)
                  </th>
                  <th className="py-3.5 px-4 text-zinc-400">
                    Google Maps &amp; Local Reviews
                  </th>
                  <th className="py-3.5 px-4 text-zinc-400">
                    Trustpilot &amp; Yelp
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/90 text-xs bg-zinc-950/90">
                {criteriaList.map((c) => (
                  <tr key={c.num}>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {c.num}. {c.title}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-amber-400 bg-zinc-900/80 border-x border-zinc-800">
                      {c.yoouz}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400">{c.google}</td>
                    <td className="py-3.5 px-4 text-zinc-400">{c.trustpilot}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-2.5 bg-zinc-950 border-t border-zinc-800 text-xs text-zinc-400">
            {chapter.imageCaption}
          </div>
        </div>
      );
    }

    // Slide 04 — Go-To-Market & $0 CAC Distribution Playbook
    if (chapter.page === 4) {
      return (
        <div className="rounded-2xl border border-zinc-800 bg-[#09090B] overflow-hidden">
          <div className="px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-medium text-zinc-300 font-mono">
              yoouz.com · Self-Reinforcing $0 CAC Viral & SEO Growth Playbook
            </span>
            <span className="text-xs text-amber-400 font-semibold">
              Zero Paid Ads Required to Scale Supply & Demand
            </span>
          </div>

          <div className="p-5 sm:p-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-[#070709]">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-white text-zinc-950 text-xs font-black flex items-center justify-center">
                    01
                  </span>
                  <span className="text-[11px] font-bold text-amber-400">Offline Loop</span>
                </div>
                <div className="text-sm font-extrabold text-white mt-3">
                  Free Print-Ready Counter QR Standees
                </div>
                <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">
                  Local shops, cafés, clinics, and hotels display Yoouz QR cards on tables and counters. Every guest scan lands on the business front page and converts into a 3-second photo review.
                </p>
              </div>
              <div className="pt-2.5 border-t border-zinc-800 text-[11px] text-zinc-400 font-mono">
                CAC: $0 · Merchant-Funded Display
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-white text-zinc-950 text-xs font-black flex items-center justify-center">
                    02
                  </span>
                  <span className="text-[11px] font-bold text-amber-400">Supply Engine</span>
                </div>
                <div className="text-sm font-extrabold text-white mt-3">
                  Autonomous Global Brand & Venue Indexing
                </div>
                <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">
                  Any searched domain or street venue is auto-scraped on the fly—populating official logos, banners, and review-ready pages without waiting for merchant onboarding.
                </p>
              </div>
              <div className="pt-2.5 border-t border-zinc-800 text-[11px] text-zinc-400 font-mono">
                194+ Profiles Live in Production
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-white text-zinc-950 text-xs font-black flex items-center justify-center">
                    03
                  </span>
                  <span className="text-[11px] font-bold text-amber-400">Organic Search</span>
                </div>
                <div className="text-sm font-extrabold text-white mt-3">
                  Google Page-1 SEO Across 75+ Languages
                </div>
                <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">
                  Google prioritizes original customer photos + Schema.org AggregateRating JSON-LD. Every profile auto-publishes in 75+ localized routes to capture global search traffic.
                </p>
              </div>
              <div className="pt-2.5 border-t border-zinc-800 text-[11px] text-zinc-400 font-mono">
                75+ Native Hreflang Routes
              </div>
            </div>

            <div className="rounded-xl border-2 border-white bg-zinc-900 p-4 flex flex-col justify-between space-y-3 shadow-xl">
              <div>
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-amber-400 text-zinc-950 text-xs font-black flex items-center justify-center">
                    04
                  </span>
                  <span className="text-[11px] font-extrabold text-white">B2B SaaS Conversion</span>
                </div>
                <div className="text-sm font-extrabold text-white mt-3">
                  Self-Serve Claiming Into Paid SaaS
                </div>
                <p className="text-xs text-zinc-200 mt-1.5 leading-relaxed">
                  Merchants discover their active Yoouz profile ranking on Google with real customer photos, then claim ownership at yoouz.com/business and upgrade to $49–$149/mo tiers.
                </p>
              </div>
              <div className="pt-2.5 border-t border-zinc-800 text-[11px] text-amber-400 font-mono font-semibold">
                Inbound Self-Serve Upgrade Loop
              </div>
            </div>
          </div>

          <div className="px-5 py-2.5 bg-zinc-950 border-t border-zinc-800 text-xs text-zinc-400">
            {chapter.imageCaption}
          </div>
        </div>
      );
    }

    // Slide 05 — Business Model & SaaS Economics
    if (chapter.page === 5) {
      return (
        <div className="rounded-2xl border border-zinc-800 bg-[#09090B] overflow-hidden">
          <div className="px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-medium text-zinc-300 font-mono">
              yoouz.com/business · B2B SaaS Tiers & Unit Economics
            </span>
            <span className="text-xs text-amber-400 font-semibold">
              ~95%+ Software Gross Margin · ~120 KB Bunny.net CDN
            </span>
          </div>

          <div className="p-5 sm:p-7 space-y-5 bg-[#070709]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* $0 Free Tier */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-zinc-400 uppercase">
                      Tier 01 · Discovery
                    </span>
                    <span className="text-[11px] font-semibold text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">
                      Auto-Indexed
                    </span>
                  </div>
                  <div className="text-3xl font-black text-white tabular-nums mt-2">
                    $0 <span className="text-sm font-semibold text-zinc-400">/ forever</span>
                  </div>
                  <div className="text-xs font-bold text-white mt-1">
                    Free Auto-Indexed Discovery
                  </div>
                  <ul className="text-xs text-zinc-300 mt-3 space-y-1.5 leading-relaxed">
                    <li>· Autonomous profile, logo & cover banner</li>
                    <li>· Unlimited customer 3-second photo reviews</li>
                    <li>· 1 to 5 solid whole-star rating aggregation</li>
                    <li>· 75+ language Google SEO public indexing</li>
                  </ul>
                </div>
                <div className="pt-3 border-t border-zinc-800 text-[11px] text-zinc-400 font-mono">
                  Goal: Maximum Global Supply & SEO Moat
                </div>
              </div>

              {/* $49/mo Pro Tier */}
              <div className="rounded-xl border-2 border-white bg-zinc-900 p-5 flex flex-col justify-between space-y-4 shadow-xl">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white uppercase">
                      Tier 02 · Claimed Pro
                    </span>
                    <span className="text-[11px] font-extrabold text-zinc-950 bg-white px-2 py-0.5 rounded">
                      Most Popular
                    </span>
                  </div>
                  <div className="text-3xl font-black text-white tabular-nums mt-2">
                    $49 <span className="text-sm font-semibold text-zinc-300">/ month</span>
                  </div>
                  <div className="text-xs font-bold text-amber-400 mt-1">
                    Claimed Business Pro
                  </div>
                  <ul className="text-xs text-zinc-200 mt-3 space-y-1.5 leading-relaxed">
                    <li>· Anonymous Verified Business Claimed badge</li>
                    <li>· Official pinned owner replies in comment threads</li>
                    <li>· Direct customer chat inbox & instant notifications</li>
                    <li>· Print-ready counter & table QR standee kit + analytics</li>
                  </ul>
                </div>
                <div className="pt-3 border-t border-zinc-800 text-[11px] text-amber-400 font-mono font-semibold">
                  Core SMB Recurring Revenue Engine
                </div>
              </div>

              {/* $149/mo Growth Tier */}
              <div className="rounded-xl border border-zinc-700 bg-zinc-900/90 p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-amber-400 uppercase">
                      Tier 03 · Growth & Embed
                    </span>
                    <span className="text-[11px] font-bold text-amber-400 bg-zinc-800 px-2 py-0.5 rounded">
                      High ARPU
                    </span>
                  </div>
                  <div className="text-3xl font-black text-white tabular-nums mt-2">
                    $149 <span className="text-sm font-semibold text-zinc-400">/ month</span>
                  </div>
                  <div className="text-xs font-bold text-white mt-1">
                    Growth & Website Widget
                  </div>
                  <ul className="text-xs text-zinc-300 mt-3 space-y-1.5 leading-relaxed">
                    <li>· Unlimited 1-line embeddable website photo carousels</li>
                    <li>· Automated Schema.org AggregateRating JSON-LD sync</li>
                    <li>· Multi-location & franchise brand hub management</li>
                    <li>· Priority placement in local & category discovery feeds</li>
                  </ul>
                </div>
                <div className="pt-3 border-t border-zinc-800 text-[11px] text-zinc-300 font-mono">
                  Built for E-Commerce, Chains & High-Ticket Brands
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                  ~95%+ Software Gross Margin Architecture
                </div>
                <p className="text-xs text-zinc-300 mt-1">
                  Every live photo is compressed via Sharp to ~120 KB and served from Bunny.net global edge nodes with Cloud SQL PostgreSQL—eliminating expensive compute or AI token costs.
                </p>
              </div>
              <div className="px-3.5 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono font-bold text-white shrink-0">
                ~120 KB / Photo · &lt;$0.01 / 1,000 Views
              </div>
            </div>
          </div>

          <div className="px-5 py-2.5 bg-zinc-950 border-t border-zinc-800 text-xs text-zinc-400">
            {chapter.imageCaption}
          </div>
        </div>
      );
    }

    // Slide 06 — Founder Edge, Live Production Status & Pre-Seed Ask
    if (chapter.page === 6) {
      return (
        <div className="rounded-2xl border border-zinc-800 bg-[#09090B] overflow-hidden">
          <div className="px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-medium text-zinc-300 font-mono">
              yoouz.com · Founder Execution, Active Production Beta & Pre-Seed Use of Funds
            </span>
            <span className="text-xs text-amber-400 font-semibold">
              15 Yrs Luxury Hospitality + Solo Full-Stack Execution
            </span>
          </div>

          <div className="p-5 sm:p-7 grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#070709]">
            {/* Pillar 1: Founder Edge */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                  01 · Founder Domain & Technical Edge
                </div>
                <div className="text-lg font-black text-white mt-2">
                  15 Years Luxury Hospitality + Solo Full-Stack Builder
                </div>
                <p className="text-xs text-zinc-300 mt-2.5 leading-relaxed">
                  15 years managing luxury hospitality venues provided direct insight into why guests abandon text surveys and how venues win local trust—paired with solo full-stack engineering that built Yoouz end-to-end with zero outside agency burn.
                </p>
              </div>
              <div className="pt-3 border-t border-zinc-800 text-[11px] text-zinc-400 font-mono">
                100% In-House Codebase · Zero Agency Debt
              </div>
            </div>

            {/* Pillar 2: Live Production Status */}
            <div className="rounded-xl border border-zinc-700 bg-zinc-900/90 p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="text-xs font-extrabold text-white uppercase tracking-wider">
                  02 · Transparent Live Production Status
                </div>
                <div className="text-lg font-black text-white mt-2">
                  Active Production Beta With Early Pilot Venues
                </div>
                <p className="text-xs text-zinc-300 mt-2.5 leading-relaxed">
                  The 194+ indexed business profiles and 40+ live photo reviews on yoouz.com represent our live production beta and initial pilot venues—validating end-to-end QR scanning, hardware camera capture, Passkey login, and website embeds.
                </p>
              </div>
              <div className="pt-3 border-t border-zinc-800 text-[11px] text-amber-400 font-mono font-semibold">
                Live Today at https://www.yoouz.com
              </div>
            </div>

            {/* Pillar 3: Pre-Seed Ask & Use of Funds */}
            <div className="rounded-xl border-2 border-white bg-zinc-900 p-5 flex flex-col justify-between space-y-4 shadow-xl">
              <div>
                <div className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                  03 · Pre-Seed Raise & Use of Funds
                </div>
                <div className="text-lg font-black text-white mt-2">
                  Capital Allocation to Reach First 500 Venues
                </div>
                <div className="mt-3 space-y-2.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                    <div className="flex justify-between font-bold text-white">
                      <span>Onboarding First 500 Venues</span>
                      <span className="text-amber-400 tabular-nums">45%</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Physical counter QR standee deployment & merchant activation
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                    <div className="flex justify-between font-bold text-white">
                      <span>Global SEO & Indexing Scale</span>
                      <span className="text-amber-400 tabular-nums">35%</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Autonomous directory expansion across 75+ languages
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                    <div className="flex justify-between font-bold text-white">
                      <span>Core Product Growth</span>
                      <span className="text-amber-400 tabular-nums">20%</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Self-serve SaaS claiming & 1-click e-commerce embed integrations
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 py-2.5 bg-zinc-950 border-t border-zinc-800 text-xs text-zinc-400">
            {chapter.imageCaption}
          </div>
        </div>
      );
    }

    if (chapter.page === 11) {
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
              <PitchResponsiveImage
                src="/pitch-assets/v2/06-passkey-live-app.png"
                alt="Live U/XXXXXX Member Profile with 1-Time Face ID Passkey Button"
                priority={true}
              />
            </div>

            <div className="lg:col-span-5 rounded-xl border border-zinc-700 bg-black overflow-hidden shadow-2xl">
              <div className="px-3.5 py-2 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between text-[11px] text-zinc-300">
                <span className="font-semibold text-white">02 · Native Phone Passkey Sheet</span>
                <span className="text-amber-400 font-mono">Passkey for yoouz.com · U/A4B6C8</span>
              </div>
              <PitchResponsiveImage
                src="/pitch-assets/v2/06-iphone-passkey-prompt.png"
                alt="Passkey for yoouz.com on iPhone Face ID for U/A4B6C8"
                priority={true}
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
              <span className="text-xs font-medium text-zinc-300 font-mono">Live App Viewport Switcher</span>
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

          <div className="p-4 sm:p-8 flex flex-col items-center justify-center bg-[#070709]">
            <div className="w-full max-w-[340px] sm:max-w-[360px] rounded-[28px] border-2 border-zinc-700 bg-black overflow-hidden shadow-2xl">
              <PitchResponsiveImage
                src={mobileSrc}
                alt={chapter.headline}
                priority={chapter.page <= 2}
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

        <div className="bg-black w-full overflow-hidden">
          <PitchResponsiveImage
            src={chapter.imagePath}
            alt={chapter.headline}
            priority={chapter.page <= 2}
          />
        </div>

        <div className="px-5 py-2.5 bg-zinc-950 border-t border-zinc-800 text-xs text-zinc-400">
          {chapter.imageCaption}
        </div>
      </div>
    );
  };

  const renderChapterExtrasBottom = (chapter: PitchChapter) => {
    if (chapter.page === 19) {
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

    if (chapter.page === 20) {
      const archPoints = [
        {
          label: "Proof Format",
          legacy: "Plain text spoofable by bots",
          yoouz: "1 Live Hardware Photo + Whole Stars (3s)",
        },
        {
          label: "Gallery & Stock Spoofing",
          legacy: "Open file uploads & old galleries",
          yoouz: "Blocked at OS camera level (0% uploads)",
        },
        {
          label: "Business Onboarding",
          legacy: "Manual listing setup required",
          yoouz: "Zero-signup auto-scraped profile, logo & banner",
        },
        {
          label: "Reviewer Friction",
          legacy: "Mandatory email / password wall",
          yoouz: "Instant U/XXXXXX handle + 1-Tap Face ID Passkey",
        },
        {
          label: "Unit Infrastructure Cost",
          legacy: "High spam moderation overhead",
          yoouz: "~120 KB Sharp JPEG · Bunny.net CDN + Cloud SQL",
        },
      ];

      return (
        <div className="space-y-5 pt-2">
          {/* Mobile Architecture Card Stack (< 640px) */}
          <div className="sm:hidden p-3.5 space-y-3 bg-zinc-950/90 rounded-xl border border-zinc-800">
            {archPoints.map((pt, pIdx) => (
              <div
                key={pIdx}
                className="rounded-lg bg-zinc-900/80 border border-zinc-800 p-3 space-y-2"
              >
                <div className="text-xs font-black text-white">{pt.label}</div>
                <div className="rounded bg-zinc-950 border border-amber-400/80 p-2">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    Yoouz Live Photo Protocol
                  </div>
                  <div className="text-xs font-bold text-white mt-0.5">{pt.yoouz}</div>
                </div>
                <div className="p-2 rounded bg-zinc-950/60 border border-zinc-800/80 text-[11px]">
                  <span className="font-bold text-zinc-400">Legacy: </span>
                  <span className="text-zinc-300">{pt.legacy}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= 640px) */}
          <div className="hidden sm:block rounded-xl border border-zinc-800 bg-zinc-950/90 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/90 text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                  <th className="py-3 px-4">Platform Architecture</th>
                  <th className="py-3 px-4">Legacy Text Review Sites</th>
                  <th className="py-3 px-4 text-white">Yoouz Live Photo Protocol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-xs">
                {archPoints.map((pt, pIdx) => (
                  <tr key={pIdx}>
                    <td className="py-3 px-4 font-semibold text-white">{pt.label}</td>
                    <td className="py-3 px-4 text-zinc-400">{pt.legacy}</td>
                    <td className="py-3 px-4 font-semibold text-amber-400 tabular-nums">
                      {pt.yoouz}
                    </td>
                  </tr>
                ))}
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

  const currentPageStr = currentPage < 10 ? `0${currentPage}` : `${currentPage}`;
  const numPagesStr = numPages < 10 ? `0${numPages}` : `${numPages}`;

  return (
    <div className="fixed inset-0 z-[9999] w-full max-w-full bg-[#09090B] text-white flex flex-col font-sans overflow-hidden overscroll-none">
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
      <header className="w-full h-14 bg-[#09090B] border-b border-zinc-800 px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-4 shrink-0 z-40 select-none">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBackToApp || (() => (window.location.href = "/"))}
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
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
            title="Toggle 20-Chapter Navigator"
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2 ml-0.5 sm:ml-1 truncate">
            <span className="text-sm font-black tracking-tight text-white whitespace-nowrap">
              Yoouz
            </span>
            <span className="hidden sm:inline text-zinc-600 text-xs">·</span>
            <span className="hidden sm:inline text-xs font-semibold text-zinc-300 truncate">
              <span className="lg:hidden">Pitch Deck</span>
              <span className="hidden lg:inline">Investor Pitch Deck (20 Chapters · Live Photo Proof)</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Deck / PDF / Video Switcher */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("interactive")}
              className={`px-2 sm:px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                viewMode === "interactive" && !isVideoModalOpen
                  ? "bg-white text-zinc-950"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span className="sm:hidden">Deck</span>
              <span className="hidden sm:inline">Interactive HD Deck</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("pdf")}
              className={`px-2 sm:px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                viewMode === "pdf" && !isVideoModalOpen
                  ? "bg-white text-zinc-950"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              PDF
            </button>
            <button
              type="button"
              onClick={() => openPitchVideo(0)}
              className={`px-2 sm:px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                isVideoModalOpen
                  ? "bg-white text-zinc-950"
                  : "text-amber-400 hover:text-white hover:bg-zinc-800/80"
              }`}
              title="Watch 8:29 Narrated Investor Pitch Video"
            >
              <Play className="w-3 h-3 fill-current shrink-0" />
              <span className="sm:hidden">Video</span>
              <span className="hidden sm:inline">Pitch Video</span>
            </button>
          </div>

          {/* Quick Chapter Pill on Mobile */}
          <button
            type="button"
            onClick={() => setIsMobileChapterSheetOpen(true)}
            className="sm:hidden flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 gap-1 text-xs font-bold text-amber-400 tabular-nums cursor-pointer hover:bg-zinc-800 transition-colors"
            title="Jump to Chapter"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{currentPageStr}/{numPagesStr}</span>
          </button>

          {/* Stepper on Desktop */}
          <div className="hidden sm:flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-1.5 py-1 gap-1">
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
              {currentPageStr} <span className="text-zinc-500">/</span> {numPagesStr}
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

          {/* Desktop Zoom Controls */}
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

          {/* Download PDF Button */}
          <a
            href="/api/pitch/raw-pdf?download=1&refresh=1"
            download="Yoouz_Visual_Investor_Pitch_Deck.pdf"
            className="w-9 h-9 sm:w-auto sm:px-3.5 sm:py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 shadow-md"
            title="Download PDF"
          >
            <Download className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
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
              <span>20-Chapter Investor Deck</span>
              <span className="text-white font-extrabold tabular-nums">01 / {numPagesStr}</span>
            </div>

            {/* Quick Launch Pitch Video in Sidebar */}
            <button
              type="button"
              onClick={() => openPitchVideo(0)}
              className="w-full p-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 hover:border-amber-400/60 flex items-center gap-2.5 text-left transition-all cursor-pointer group"
            >
              <span className="w-7 h-7 rounded-lg bg-white text-zinc-950 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-extrabold text-white leading-snug truncate">
                  Watch Pitch Video
                </div>
                <div className="text-[11px] text-zinc-400 tabular-nums">
                  08:29 · Narrated Walkthrough
                </div>
              </div>
            </button>

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
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="flex-1 h-full overflow-y-auto overflow-x-hidden p-3 sm:p-8 flex flex-col items-center bg-[#09090B]"
        >
          {viewMode === "interactive" ? (
            <div
              style={{
                width: "100%",
                maxWidth: `${Math.round(1140 * (zoomLevel / 100))}px`,
              }}
              className="space-y-6 sm:space-y-10 pb-28 sm:pb-16 transition-all duration-150"
            >
              {/* Executive Video Walkthrough Showcase (Desktop 2-Column Split / Mobile Stacked Card) */}
              <section
                aria-label="Executive Video Briefing"
                className="rounded-2xl bg-[#111215] border border-zinc-800 shadow-2xl overflow-hidden"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                  {/* Interactive Widescreen Video Poster Preview (Top on Mobile, Right on Desktop) */}
                  <button
                    type="button"
                    onClick={() => openPitchVideo(0)}
                    className="order-1 lg:order-2 lg:col-span-7 relative aspect-video lg:aspect-auto lg:min-h-[300px] w-full bg-black overflow-hidden group cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                    aria-label="Play Yoouz Investor Pitch Walkthrough Video"
                  >
                    <picture className="absolute inset-0 w-full h-full">
                      <source srcSet="/pitch-assets/v2/01-home-discovery.webp" type="image/webp" />
                      <img
                        src="/pitch-assets/v2/01-home-discovery.png"
                        alt="Yoouz Executive Pitch Walkthrough Preview"
                        referrerPolicy="no-referrer"
                        loading="eager"
                        className="w-full h-full object-cover object-center opacity-80 group-hover:opacity-95 group-hover:scale-[1.02] transition-all duration-300"
                      />
                    </picture>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20" />

                    {/* Center Cinema Play Button */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
                      <span className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white text-zinc-950 shadow-[0_12px_40px_rgba(0,0,0,0.65)] flex items-center justify-center group-hover:scale-105 active:scale-95 transition-transform">
                        <Play className="w-7 h-7 fill-current ml-1" />
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-white tracking-tight drop-shadow">
                        Play Investor Presentation · 08:29
                      </span>
                    </div>

                    {/* Subtle Bottom Caption Bar */}
                    <div className="absolute inset-x-0 bottom-0 px-4 sm:px-5 py-3 flex items-center justify-between text-[11px] sm:text-xs text-zinc-200 font-medium">
                      <span className="truncate">Full Narrated Walkthrough · 20 Chapters</span>
                      <span className="tabular-nums text-zinc-300 shrink-0 ml-3">HD 16:9</span>
                    </div>
                  </button>

                  {/* Editorial Summary & Direct Video Actions (Bottom on Mobile, Left on Desktop) */}
                  <div className="order-2 lg:order-1 lg:col-span-5 p-5 sm:p-7 flex flex-col justify-between gap-5 border-t lg:border-t-0 lg:border-r border-zinc-800/90">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-400">
                        <span className="text-amber-400">Executive Video Briefing</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">08:29</span>
                        <span aria-hidden="true">·</span>
                        <span>Audio + Slides</span>
                      </div>
                      <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight [text-wrap:balance]">
                        Watch the Yoouz Investor Pitch Walkthrough
                      </h1>
                      <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                        Prefer to listen and watch before reading all 20 chapters? Open the narrated presentation covering live camera proof, $0 CAC distribution, B2B SaaS margins, and live traction.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Primary & Secondary Actions */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => openPitchVideo(0)}
                          className="flex-1 sm:flex-initial min-h-[44px] px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 active:scale-[0.98] text-zinc-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg whitespace-nowrap"
                        >
                          <Play className="w-4 h-4 fill-current shrink-0" />
                          <span>Watch Pitch Video</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode("pdf")}
                          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span>View PDF</span>
                        </button>
                      </div>

                      {/* Quick Timestamp Jumps */}
                      <div className="pt-3 border-t border-zinc-800/80">
                        <div className="text-[11px] font-semibold text-zinc-400 mb-2">
                          Jump straight to a topic:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { time: 34, label: "0:34 Market" },
                            { time: 124, label: "2:04 Business Model" },
                            { time: 241, label: "4:01 Camera Proof" },
                            { time: 460, label: "7:40 Traction" },
                          ].map((jump) => (
                            <button
                              key={jump.time}
                              type="button"
                              onClick={() => openPitchVideo(jump.time)}
                              className="px-2.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-semibold text-zinc-300 hover:text-white tabular-nums transition-colors cursor-pointer whitespace-nowrap"
                            >
                              {jump.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

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
                      <span className="text-xs font-bold text-zinc-300 tabular-nums whitespace-nowrap">
                        {pageStr} / {numPagesStr}
                      </span>
                    </div>

                    {/* Chapter Body */}
                    <div className="p-5 sm:p-8 space-y-6">
                      <div>
                        <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                          {chapter.headline}
                        </h2>
                        <p className="text-sm sm:text-base text-zinc-300 mt-2.5 leading-relaxed max-w-4xl">
                          {chapter.subheadline}
                        </p>
                      </div>

                      {renderChapterExtrasTop(chapter)}

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
                    Rendering 20-Page Investor Pitch PDF...
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

      {/* Floating Mobile Bottom Action Pill (Thumb-Zone Ergonomics) */}
      <div className="sm:hidden fixed bottom-3 inset-x-3 z-40 h-13 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/90 rounded-2xl shadow-2xl flex items-center justify-between px-2.5">
        <button
          type="button"
          onClick={() => scrollToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-9 px-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-1 text-xs font-bold text-zinc-300 disabled:opacity-30 active:scale-95 transition-all cursor-pointer"
        >
          <ChevronUp className="w-4 h-4 -rotate-90" />
          <span>Prev</span>
        </button>

        <button
          type="button"
          onClick={() => setIsMobileChapterSheetOpen(true)}
          className="flex flex-col items-center justify-center px-3 py-1 rounded-xl hover:bg-zinc-900/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-1 text-xs font-black text-white tabular-nums">
            <span className="text-amber-400 font-extrabold">{currentPageStr}</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400">{numPagesStr}</span>
          </div>
          <span className="text-[10px] text-zinc-400 truncate max-w-[130px]">
            {PITCH_CHAPTERS[currentPage - 1]?.shortTitle || "Chapter"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => scrollToPage(currentPage + 1)}
          disabled={currentPage >= numPages}
          className="h-9 px-3 rounded-xl bg-white text-zinc-950 font-bold text-xs flex items-center gap-1 active:scale-95 transition-all shadow-md cursor-pointer"
        >
          <span>Next</span>
          <ChevronDown className="w-4 h-4 -rotate-90" />
        </button>
      </div>

      {/* Mobile Chapter Sheet Modal */}
      {isMobileChapterSheetOpen && (
        <div className="sm:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end">
          <div
            className="w-full bg-[#111215] border-t border-zinc-800 rounded-t-3xl max-h-[80vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
          >
            {/* Grab handle */}
            <div className="w-10 h-1.5 bg-zinc-700 rounded-full mx-auto my-3" />

            <div className="px-5 pb-3 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white">20-Chapter Deck Navigation</h3>
                <p className="text-[11px] text-zinc-400">Tap any chapter to jump immediately</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileChapterSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-4 space-y-2 flex-1">
              {/* Mobile Quick-Launch Video Walkthrough */}
              <button
                type="button"
                onClick={() => openPitchVideo(0)}
                className="w-full p-3.5 rounded-xl bg-white text-zinc-950 flex items-center gap-3 text-left transition-transform active:scale-[0.98] cursor-pointer shadow-lg mb-2"
              >
                <span className="w-8 h-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center shrink-0">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black truncate">Watch Investor Pitch Video</div>
                  <div className="text-[11px] text-zinc-600 font-semibold tabular-nums">
                    08:29 · Full Narrated Presentation
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-700 shrink-0" />
              </button>

              {PITCH_CHAPTERS.map((ch) => {
                const isSelected = ch.page === currentPage;
                const pStr = ch.page < 10 ? `0${ch.page}` : `${ch.page}`;
                return (
                  <button
                    key={ch.page}
                    type="button"
                    onClick={() => {
                      scrollToPage(ch.page);
                      setIsMobileChapterSheetOpen(false);
                    }}
                    className={`w-full p-3 rounded-xl flex items-center gap-3 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-zinc-900 border border-amber-400 shadow-md"
                        : "bg-zinc-950/70 border border-zinc-800/80 hover:bg-zinc-900/60"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-amber-400 text-zinc-950" : "bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      {pStr}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">{ch.shortTitle}</div>
                      <div className="text-[10px] text-zinc-400 truncate">{ch.kicker}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Cinema Investor Pitch Video Modal (Desktop & Mobile) */}
      {isVideoModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Yoouz Investor Pitch Walkthrough Video"
          onClick={closePitchVideo}
          className="fixed inset-0 z-[10050] bg-black/90 backdrop-blur-md flex items-center justify-center p-0 sm:p-6 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-5xl bg-[#0D0E11] sm:rounded-2xl border-0 sm:border border-zinc-800 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-4 sm:px-5 py-3 bg-[#111215] border-b border-zinc-800 flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-black text-white truncate">
                  <span>Yoouz Investor Pitch Video</span>
                </div>
                <div className="text-[11px] text-zinc-400 font-medium tabular-nums truncate">
                  08:29 · Narrated Executive Walkthrough · Confidential
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={cycleVideoPlaybackRate}
                  className="h-9 sm:h-8 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-200 hover:text-white tabular-nums transition-colors cursor-pointer whitespace-nowrap"
                  title="Change Playback Speed"
                >
                  {videoPlaybackRate}x
                </button>

                <a
                  href="/api/pitch/video?download=1"
                  download="Yoouz_Investor_Pitch_Walkthrough.mp4"
                  className="h-9 w-9 sm:h-8 sm:w-auto sm:px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                  title="Download MP4"
                >
                  <Download className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Download MP4</span>
                </a>

                <button
                  type="button"
                  onClick={closePitchVideo}
                  className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="Close Video (Esc)"
                  aria-label="Close Pitch Video"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Widescreen 16:9 Video Stage */}
            <div className="relative w-full bg-black flex items-center justify-center shrink-0 aspect-video max-h-[58vh] sm:max-h-[65vh]">
              {isVideoBuffering && (
                <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center bg-black/30">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
              <video
                ref={pitchVideoRef}
                controls
                playsInline
                preload="metadata"
                poster="/pitch-assets/v2/01-home-discovery.webp"
                onWaiting={() => setIsVideoBuffering(true)}
                onPlaying={() => setIsVideoBuffering(false)}
                onCanPlay={() => setIsVideoBuffering(false)}
                onTimeUpdate={(e) => setVideoCurrentTime(e.currentTarget.currentTime)}
                className="w-full h-full object-contain bg-black focus:outline-none"
              >
                <source src="/api/pitch/video" type="video/mp4" />
                <source src="/assets/aistudio/Yoouz_vid__2bf6b810.mp4" type="video/mp4" />
              </video>
            </div>

            {/* Interactive Video Chapter Jump Strip */}
            <div className="p-3.5 sm:p-4 bg-[#111215] border-t border-zinc-800 flex-1 min-h-0 overflow-y-auto">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400">
                  Video Chapters
                </span>
                <span className="text-[11px] text-zinc-500 font-medium">
                  Tap any timestamp to jump
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5">
                {PITCH_VIDEO_CHAPTERS.map((ch, idx) => {
                  const nextTime = PITCH_VIDEO_CHAPTERS[idx + 1]?.time ?? Infinity;
                  const isActiveChapter = videoCurrentTime >= ch.time && videoCurrentTime < nextTime;
                  return (
                    <button
                      key={ch.time}
                      type="button"
                      onClick={() => seekPitchVideo(ch.time)}
                      className={`px-2.5 py-2 rounded-lg border text-left flex items-center gap-2 transition-colors cursor-pointer min-w-0 ${
                        isActiveChapter
                          ? "bg-white text-zinc-950 border-white font-bold"
                          : "bg-zinc-950/80 hover:bg-zinc-900 border-zinc-800/90 text-zinc-300 hover:text-white"
                      }`}
                    >
                      <span
                        className={`text-[11px] font-bold tabular-nums shrink-0 ${
                          isActiveChapter ? "text-zinc-900" : "text-amber-400"
                        }`}
                      >
                        {ch.label}
                      </span>
                      <span className="text-xs truncate">{ch.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
