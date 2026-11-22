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
  Columns2,
  Sparkles,
  Camera,
  Database,
  Server,
  Lock,
  ExternalLink,
  MousePointerClick,
  Star,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import { Place, VideoReview } from "../types";
import {
  PITCH_CHAPTERS,
  PITCH_ACTS,
  ANONYMOUS_CLAIMED_ENTITIES,
  PitchChapter,
} from "../data/pitchDeckChapters";
import { CopoEmbedView } from "./CopoEmbedView";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const toWebp = (p?: string) => (p ? p.replace(/\.png$/, ".webp") : "");

interface YoouzInvestorPitchViewProps {
  onBackToApp?: () => void;
  places?: Place[];
  videos?: VideoReview[];
}

const PitchResponsiveImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  onClick?: () => void;
}> = ({ src, alt, className = "", priority = false, onClick }) => {
  const [loaded, setLoaded] = useState(false);
  const webpSrc = toWebp(src);

  return (
    <div
      onClick={onClick}
      className={`relative w-full overflow-hidden bg-black flex items-center justify-center min-h-[140px] ${
        onClick ? "cursor-zoom-in group" : ""
      }`}
    >
      {!loaded && (
        <div className="absolute inset-0 bg-zinc-950/85 flex items-center justify-center z-10">
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
          className={`w-full h-auto block object-contain transition-all duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          } ${onClick ? "group-hover:scale-[1.01]" : ""} ${className}`}
        />
      </picture>
      {onClick && loaded && (
        <div className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-[10px] font-medium text-white flex items-center gap-1 pointer-events-none">
          <ZoomIn className="w-3 h-3" />
          Inspect
        </div>
      )}
    </div>
  );
};

// ============================================================================
// PDF Canvas Renderer (for Print PDF View mode)
// ============================================================================
const PdfPageCanvas: React.FC<{
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNum: number;
  totalPages: number;
  zoomLevel: number;
  onPageRef?: (el: HTMLDivElement | null) => void;
}> = ({ pdfDoc, pageNum, totalPages, zoomLevel, onPageRef }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    let isCancelled = false;

    const render = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        if (isCancelled) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: 1.25 * zoomLevel });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {}
        }

        const task = page.render({
          canvasContext: ctx,
          viewport,
        } as any);
        renderTaskRef.current = task;
        await task.promise;
      } catch {
        // ignore cancelled renders
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
  }, [pdfDoc, pageNum, zoomLevel]);

  return (
    <div
      ref={onPageRef}
      data-pdf-page={pageNum}
      className="flex flex-col items-center w-full"
    >
      <div className="rounded-xl overflow-hidden border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.85)] bg-[#09090B]">
        <canvas ref={canvasRef} className="block" />
      </div>
      <span className="mt-2.5 text-[11px] font-mono text-zinc-500">
        Slide {pageNum < 10 ? `0${pageNum}` : pageNum} / {totalPages}
      </span>
    </div>
  );
};

// ============================================================================
// Live Working Website Embed Sandbox (Chapter 18)
// ============================================================================
const LiveEmbedSandbox: React.FC<{
  places: Place[];
  videos: VideoReview[];
}> = ({ places, videos }) => {
  const [selectedBrand, setSelectedBrand] = useState<"sephora.com" | "apple.com" | "wolt.com">(
    "sephora.com"
  );
  const [copiedCode, setCopiedCode] = useState(false);

  const brandTabs: { slug: "sephora.com" | "apple.com" | "wolt.com"; label: string; category: string }[] = [
    { slug: "sephora.com", label: "Sephora", category: "Beauty Retail" },
    { slug: "apple.com", label: "Apple", category: "Consumer Tech" },
    { slug: "wolt.com", label: "Wolt", category: "Food Delivery" },
  ];

  const embedSnippet = `<iframe src="https://www.yoouz.com/embed/${selectedBrand}" width="100%" height="520" style="border:0;border-radius:16px;overflow:hidden;" loading="lazy" title="Yoouz Verified Photo Reviews"></iframe>`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(embedSnippet).catch(() => {});
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-[#0B0B0E] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
      {/* Simulated Merchant Storefront Top Chrome */}
      <div className="px-4 py-3 border-b border-white/10 bg-[#111115] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          </div>
          <span className="text-[11px] font-mono text-zinc-400 px-2.5 py-1 rounded-md bg-black/60 border border-white/10">
            https://www.{selectedBrand}/checkout-reviews
          </span>
        </div>

        {/* Storefront Brand Switcher */}
        <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-lg border border-white/10">
          {brandTabs.map((tab) => {
            const active = selectedBrand === tab.slug;
            return (
              <button
                key={tab.slug}
                type="button"
                onClick={() => setSelectedBrand(tab.slug)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  active
                    ? "bg-white text-black shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Working CopoEmbedView */}
      <div className="h-[460px] sm:h-[520px] w-full bg-black relative">
        <CopoEmbedView
          embedId={selectedBrand}
          places={places}
          videos={videos}
          currentUser={null}
          forcePreview={true}
        />
      </div>

      {/* 1-Line Copyable Embed Snippet Bar */}
      <div className="px-4 py-3 border-t border-white/10 bg-[#0E0E12] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-400 mb-1">
            1-Line Production Storefront Snippet (Shopify · Webflow · HTML)
          </p>
          <code className="block text-[11px] font-mono text-zinc-300 truncate bg-black/70 px-3 py-1.5 rounded-lg border border-white/10">
            {embedSnippet}
          </code>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
        >
          {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copiedCode ? "Copied Snippet" : "Copy 1-Line Embed"}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// Institutional Data Visualizations (Slides 02, 03, 04, 05, 06, 07, 21, 22)
// ============================================================================
const ChapterDataVisual: React.FC<{ page: number }> = ({ page }) => {
  if (page === 2) {
    // Why Live Photo Beats Both Fake Text & Video Reviews
    const rows = [
      {
        metric: "Customer Capture Time",
        yoouz: "3 seconds (1 snap + star tap)",
        text: "2–5 minutes typing essays",
        video: "60–120s filming + retakes",
      },
      {
        metric: "Customer Completion Rate",
        yoouz: "10x higher · zero shyness",
        text: "Low · keyboard fatigue",
        video: "< 2% · severe camera shyness",
      },
      {
        metric: "AI & Bot Resistance",
        yoouz: "100% hardware shutter only",
        text: "0% · flooded by LLM bots",
        video: "High friction, low supply",
      },
      {
        metric: "Buyer Verification Speed",
        yoouz: "0.2s silent visual glance",
        text: "Slow reading & guessing",
        video: "Requires audio & scrubbing",
      },
      {
        metric: "Cloud Delivery Weight",
        yoouz: "~120 KB JPEG (~95%+ GM)",
        text: "Tiny, zero visual proof",
        video: "30 MB+ streaming cost burn",
      },
      {
        metric: "Google Visual SEO",
        yoouz: "Direct Google Images + Page 1",
        text: "Generic text stars only",
        video: "Heavy slow-loading embeds",
      },
    ];
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0D0D11] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/10 bg-[#121217] flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-400">
            Format Breakthrough Matrix
          </span>
          <span className="text-[11px] text-zinc-400">
            Why 1 Live Photo Wins the Global Trust Standard
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-zinc-400 bg-black/40">
                <th className="py-3.5 px-4 font-semibold">Dimension</th>
                <th className="py-3.5 px-4 font-semibold text-amber-400 bg-amber-500/[0.06] border-x border-amber-500/20">
                  Yoouz (Live Photo)
                </th>
                <th className="py-3.5 px-4 font-semibold">Legacy Text</th>
                <th className="py-3.5 px-4 font-semibold">Video Reviews</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-xs">
              {rows.map((r) => (
                <tr key={r.metric} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-white">{r.metric}</td>
                  <td className="py-3.5 px-4 font-semibold text-amber-300 bg-amber-500/[0.04] border-x border-amber-500/15">
                    {r.yoouz}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400">{r.text}</td>
                  <td className="py-3.5 px-4 text-zinc-400">{r.video}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (page === 3) {
    // TAM / SAM / SOM
    const tiers = [
      {
        code: "TAM",
        title: "Total Addressable Market",
        figure: "$15.8B+",
        badge: "Global Review & Local Discovery Economy",
        desc: "Consumer review directories, B2B reputation SaaS, local discovery budgets, and e-commerce social proof widgets globally.",
        width: "100%",
        highlight: false,
      },
      {
        code: "SAM",
        title: "Serviceable Available Market",
        figure: "$4.2B+",
        badge: "85M+ Physical & Digital Storefronts",
        desc: "Restaurants, boutique hotels, clinics, salons, legal practices, and D2C brands actively competing on visual trust & local search rankings.",
        width: "84%",
        highlight: false,
      },
      {
        code: "SOM",
        title: "Pre-Seed Initial Wedge",
        figure: "1,000 Venues · ~$1.2M+ ARR",
        badge: "18-Month Target Merchant Cohort",
        desc: "High-frequency hospitality, dining, and retail venues onboarded via free counter QR standees and converting to $49–$149/mo SaaS.",
        width: "68%",
        highlight: true,
      },
    ];
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0D0D11] p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-400">
            Global Market Sizing (Bottom-Up & Top-Down)
          </span>
          <span className="text-[11px] text-zinc-400">75+ Languages · Zero Geographic Ceiling</span>
        </div>
        <div className="space-y-3.5">
          {tiers.map((t) => (
            <div
              key={t.code}
              className={`rounded-xl p-4 sm:p-5 border transition-colors ${
                t.highlight
                  ? "bg-white/[0.04] border-white/30 shadow-[0_0_40px_rgba(255,255,255,0.05)]"
                  : "bg-black/60 border-white/10"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                      t.highlight ? "bg-amber-400 text-black" : "bg-zinc-800 text-zinc-200"
                    }`}
                  >
                    {t.code}
                  </span>
                  <span className="text-xs font-medium text-zinc-300">{t.title}</span>
                </div>
                <span className="text-[11px] font-medium text-amber-400">{t.badge}</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white tabular-nums mb-1.5">
                {t.figure}
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-3">{t.desc}</p>
              <div className="h-1.5 w-full rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    t.highlight ? "bg-amber-400" : "bg-zinc-500"
                  }`}
                  style={{ width: t.width }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (page === 4) {
    // Competitive Moat Matrix
    const criteria = [
      {
        name: "AI & Fake Review Immunity",
        yoouz: "100% Live OS Camera Only (0% Gallery)",
        google: "Fails — AI text bots & stock uploads",
        legacy: "Fails — Bot farms & pay-to-play",
      },
      {
        name: "Time to Publish Review",
        yoouz: "3 Seconds (1 Photo + Whole Stars)",
        google: "Slow paragraph typing",
        legacy: "Multi-step written forms",
      },
      {
        name: "Upfront Login / App Wall",
        yoouz: "0% Friction (Auto U/ID + Face ID)",
        google: "Mandatory Google login",
        legacy: "Mandatory email & password",
      },
      {
        name: "Physical Counter QR Loop",
        yoouz: "Opens Business Hub -> 1-Tap Snap",
        google: "Drops guests at login walls",
        legacy: "Zero offline POS loop",
      },
      {
        name: "Viral Social Share Cards",
        yoouz: "Unboxed 1200×630 + ★ Yoouz Mark",
        google: "Plain map pin URL",
        legacy: "Generic text box preview",
      },
      {
        name: "Global Visual SEO",
        yoouz: "Original JPEGs + 75-Lang Schema",
        google: "Closed walled-garden ecosystem",
        legacy: "Gated paid ad directory",
      },
    ];
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0D0D11] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/10 bg-[#121217] flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-400">
            Structural Moat Comparison
          </span>
          <span className="text-[11px] text-zinc-400">Why Incumbents Cannot Pivot Without Breaking</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-zinc-400 bg-black/40">
                <th className="py-3.5 px-4 font-semibold">Criterion</th>
                <th className="py-3.5 px-4 font-semibold text-amber-400 bg-amber-500/[0.06] border-x border-amber-500/20">
                  Yoouz
                </th>
                <th className="py-3.5 px-4 font-semibold">Google Maps</th>
                <th className="py-3.5 px-4 font-semibold">Trustpilot & Yelp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-xs">
              {criteria.map((c) => (
                <tr key={c.name} className="hover:bg-white/[0.02]">
                  <td className="py-3.5 px-4 font-semibold text-white">{c.name}</td>
                  <td className="py-3.5 px-4 font-semibold text-amber-300 bg-amber-500/[0.04] border-x border-amber-500/15">
                    {c.yoouz}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400">{c.google}</td>
                  <td className="py-3.5 px-4 text-zinc-400">{c.legacy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (page === 5) {
    // $0 CAC Distribution Flywheel
    const loops = [
      {
        num: "01",
        tag: "Offline Foot Traffic",
        title: "Free Print-Ready Counter QR Standees",
        desc: "Cafes, hotels, restaurants & shops display Yoouz QR standees at tables and checkout. Walk-in guests scan -> see real peer photos -> snap a 3-second photo.",
        metric: "CAC: $0 · Merchant-Placed",
      },
      {
        num: "02",
        tag: "Zero Cold-Start",
        title: "Autonomous Brand & Venue Indexing",
        desc: "Every searched URL or physical street business automatically receives a live profile with official logo, cover banner & clean /reviews/{slug} URL.",
        metric: "543+ Indexed Brands Live",
      },
      {
        num: "03",
        tag: "Organic Reach Multiplier",
        title: "75+ Language SEO + Unboxed Share Cards",
        desc: "Fresh customer JPEGs + Schema.org AggregateRating rank on Google Page 1 & Google Images, while every WhatsApp/iMessage share carries the ★ Yoouz mark.",
        metric: "75+ Native Hreflang Routes",
      },
      {
        num: "04",
        tag: "Inbound B2B Monetization",
        title: "Self-Serve Claiming Into $49–$149/mo SaaS",
        desc: "Merchants discover real customer photos and impressions accumulating on their free profile, claim ownership at yoouz.com/business, and upgrade self-serve.",
        metric: "Inbound High-Intent Pull",
      },
    ];
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0D0D11] p-5 sm:p-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-400">
            Compounding $0 CAC Growth Flywheel
          </span>
          <span className="text-[11px] text-zinc-400">4 Self-Reinforcing Organic Loops</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loops.map((l, idx) => (
            <div
              key={l.num}
              className={`rounded-xl p-4 border flex flex-col justify-between ${
                idx === 3
                  ? "bg-white/[0.04] border-white/30"
                  : "bg-black/60 border-white/10"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center ${
                      idx === 3 ? "bg-amber-400 text-black" : "bg-white text-black"
                    }`}
                  >
                    {l.num}
                  </span>
                  <span className="text-[11px] font-medium text-amber-400">{l.tag}</span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1.5">{l.title}</h4>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">{l.desc}</p>
              </div>
              <div className="pt-2.5 border-t border-white/[0.08] text-[11px] font-mono text-zinc-300">
                {l.metric}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (page === 6) {
    // B2B SaaS Pricing Ladder & ~95%+ Gross Margin
    const plans = [
      {
        tier: "Tier 01 · Supply Engine",
        name: "Free Auto-Indexed",
        price: "$0",
        period: "/ forever",
        features: [
          "Auto-built brand logo & cover banner",
          "Unlimited 3-second customer photos",
          "1–5 solid whole-star rating score",
          "75+ language Google SEO indexing",
        ],
        featured: false,
      },
      {
        tier: "Tier 02 · Core SMB SaaS",
        name: "Claimed Business Pro",
        price: "$49",
        period: "/ month",
        features: [
          "Anonymous Verified Claimed Shield",
          "Official Pinned Owner Replies",
          "Direct Customer Chat Inbox",
          "7D/30D/90D Analytics + QR Standee Kit",
        ],
        featured: true,
      },
      {
        tier: "Tier 03 · Conversion Suite",
        name: "Growth & Website Widget",
        price: "$149",
        period: "/ month",
        features: [
          "Unlimited 1-Line Storefront Carousels",
          "Google AggregateRating JSON-LD",
          "Multi-location brand dashboard",
          "Priority category discovery placement",
        ],
        featured: false,
      },
    ];
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0D0D11] p-5 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-xl p-4 sm:p-5 border flex flex-col justify-between ${
                p.featured
                  ? "bg-white/[0.05] border-white/35 shadow-[0_12px_40px_rgba(255,255,255,0.06)]"
                  : "bg-black/60 border-white/10"
              }`}
            >
              <div>
                <p
                  className={`text-[10px] font-semibold uppercase tracking-widest mb-2 ${
                    p.featured ? "text-amber-400" : "text-zinc-500"
                  }`}
                >
                  {p.tier}
                </p>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-3xl font-bold text-white tabular-nums">{p.price}</span>
                  <span className="text-xs text-zinc-400">{p.period}</span>
                </div>
                <h4 className="text-sm font-semibold text-amber-300 mb-4">{p.name}</h4>
                <ul className="space-y-2.5 text-xs text-zinc-300">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl p-4 bg-gradient-to-r from-amber-500/10 via-zinc-900/90 to-zinc-900 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
              ~95%+ Software Gross Margin Infrastructure
            </p>
            <p className="text-xs text-zinc-300 mt-0.5">
              ~120 KB Sharp-compressed JPEGs on Bunny.net Global Edge CDN + Cloud SQL PostgreSQL keep COGS under $0.01 per 1,000 review views.
            </p>
          </div>
          <div className="shrink-0 px-3.5 py-2 rounded-lg bg-black/70 border border-white/10 text-right">
            <div className="text-lg font-bold text-white tabular-nums">~95%+</div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Gross Margin</div>
          </div>
        </div>
      </div>
    );
  }

  if (page === 7) {
    // Founder Edge, Live Traction & Pre-Seed Capital Allocation
    const allocations = [
      {
        pct: 45,
        label: "First 500 Venues QR Rollout",
        detail: "Physical counter & table QR standees across flagship dining, hotel & retail districts",
        color: "bg-amber-400",
      },
      {
        pct: 35,
        label: "Global 75+ Language SEO Scale",
        detail: "Autonomous brand indexing, Google Images & Page-1 rich snippet expansion",
        color: "bg-white",
      },
      {
        pct: 20,
        label: "Core Product & SaaS Velocity",
        detail: "1-click Shopify/Webflow embed apps, automated claim verification & Stripe billing",
        color: "bg-zinc-500",
      },
    ];
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0D0D11] p-5 sm:p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl p-4 bg-black/60 border border-white/10">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-400 mb-1.5">
              Founder Domain & Engineering Edge
            </p>
            <h4 className="text-base font-bold text-white mb-2">
              15 Years Luxury Hospitality + Solo Full-Stack Execution
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Built 100% in-house with zero agency burn. Combines 15 years of frontline luxury hospitality management with complete full-stack engineering across consumer PWA, B2B portal, SEO, WebAuthn Passkeys, and Bunny.net CDN.
            </p>
          </div>

          <div className="rounded-xl p-4 bg-black/60 border border-white/10">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-400 mb-1.5">
              Live Production Proof Today (yoouz.com)
            </p>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-white/10">
                <div className="text-xl font-bold text-white tabular-nums">543+</div>
                <div className="text-[10px] text-zinc-400">Indexed Brands</div>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-white/10">
                <div className="text-xl font-bold text-white tabular-nums">62</div>
                <div className="text-[10px] text-zinc-400">Live Photo Reviews</div>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-white/10">
                <div className="text-xl font-bold text-white tabular-nums">75+</div>
                <div className="text-[10px] text-zinc-400">SEO Languages</div>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-white/10">
                <div className="text-xl font-bold text-amber-400 tabular-nums">$0</div>
                <div className="text-[10px] text-zinc-400">Paid Ad Burn</div>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Pre-Seed Use of Funds Bar */}
        <div className="rounded-xl p-4 sm:p-5 bg-white/[0.03] border border-white/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Pre-Seed Capital Allocation
            </span>
            <span className="text-xs font-medium text-amber-400">
              80% Direct Growth & Distribution
            </span>
          </div>
          <div className="h-3 w-full rounded-full overflow-hidden flex gap-1 mb-4 bg-zinc-900">
            {allocations.map((a) => (
              <div
                key={a.label}
                className={`${a.color} h-full rounded-sm`}
                style={{ width: `${a.pct}%` }}
              />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {allocations.map((a) => (
              <div key={a.label} className="p-3 rounded-lg bg-black/60 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${a.color}`} />
                  <span className="text-base font-bold text-white tabular-nums">{a.pct}%</span>
                </div>
                <div className="text-xs font-semibold text-zinc-100 mb-1">{a.label}</div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">{a.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (page === 21) {
    // Bunny.net + Cloud SQL Architecture Blueprint
    const stack = [
      {
        icon: Camera,
        layer: "01 · Capture & Identity Edge",
        title: "Native Hardware Shutter + FIDO2 / WebAuthn Passkeys",
        detail: "Instant native mobile camera launch (front or rear lens, 0% gallery uploads) paired with device Secure Enclave Face ID / Biometric Passkeys.",
        badge: "0% Spoofing · $0 SMS OTP",
      },
      {
        icon: Server,
        layer: "02 · Express SSR & Sharp Media Pipeline",
        title: "EXIF GPS Scrubber + Dynamic 1200×630 OG Card Engine",
        detail: "Strips private location headers on upload, compresses every photo to ~120 KB high-DPI JPEG/WebP, and injects Schema.org JSON-LD across 75+ languages.",
        badge: "100% Privacy Scrubbed",
      },
      {
        icon: Globe,
        layer: "03 · Global Edge CDN",
        title: "Bunny.net Global Edge Storage & Pull Zone (119+ PoPs)",
        detail: "Ultra-low-cost global media replication delivering sub-100ms photo proof to desktop browsers, mobile PWAs, and embedded merchant websites worldwide.",
        badge: "< $0.01 / 1K Views",
      },
      {
        icon: Database,
        layer: "04 · Relational Persistence Core",
        title: "Cloud SQL (PostgreSQL) + Drizzle ORM",
        detail: "ACID-compliant relational storage powering 543+ indexed businesses, live photo reviews, atomic like counters, threaded comments, messages, and B2B portals.",
        badge: "~95%+ Software GM",
      },
    ];
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0D0D11] p-5 sm:p-6 space-y-3.5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-400">
            Production Cloud Architecture Blueprint
          </span>
          <span className="text-[11px] text-zinc-400">Zero Legacy Lock-In · Zero Video Streaming Burn</span>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {stack.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.layer}
                className={`rounded-xl p-4 border flex items-start gap-4 ${
                  idx === 2 ? "bg-white/[0.04] border-white/25" : "bg-black/60 border-white/10"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/15 flex items-center justify-center shrink-0 text-amber-400">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                      {s.layer}
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-amber-300 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      {s.badge}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">{s.title}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">{s.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (page === 22) {
    // Live Active Portfolio Table (100% Anonymous Owner Badges) + 18-Month Roadmap
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-[#0D0D11] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/10 bg-[#121217] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-white">
                Live Active Brand Portfolio (100% Anonymous Owner Privacy)
              </span>
            </div>
            <span className="text-[11px] text-zinc-400">Sample of 543+ Indexed Profiles</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-400 bg-black/50">
                  <th className="py-3 px-4 font-semibold">Entity</th>
                  <th className="py-3 px-4 font-semibold">Domain</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Live Highlights</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-xs">
                {ANONYMOUS_CLAIMED_ENTITIES.slice(0, 8).map((ent) => (
                  <tr key={ent.domain} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-4 font-semibold text-white whitespace-nowrap">{ent.name}</td>
                    <td className="py-2.5 px-4 font-mono text-zinc-400 whitespace-nowrap">{ent.domain}</td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          ent.status.includes("Claimed")
                            ? "bg-amber-400/15 text-amber-300 border border-amber-400/30"
                            : "bg-zinc-800/80 text-zinc-300 border border-white/10"
                        }`}
                      >
                        {ent.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-zinc-300">{ent.highlights}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 18-Month Pre-Seed Execution Roadmap */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              phase: "Months 1–6",
              goal: "First 250–500 Venues",
              desc: "Counter QR standee deployment across flagship dining, hotel & retail corridors.",
            },
            {
              phase: "Months 6–12",
              goal: "Self-Serve SaaS Ramp",
              desc: "Automated domain claiming + 1-click Shopify & Webflow embed apps ($49–$149/mo).",
            },
            {
              phase: "Months 12–18",
              goal: "1,000+ Venues · $1.2M+ ARR",
              desc: "Compounding 75+ language Google Page-1 visual moat ready for institutional Seed/A.",
            },
          ].map((m, idx) => (
            <div
              key={m.phase}
              className={`rounded-xl p-4 border ${
                idx === 2 ? "bg-white/[0.05] border-white/30" : "bg-[#0D0D11] border-white/10"
              }`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-400">
                {m.phase}
              </span>
              <h4 className="text-sm font-bold text-white mt-1 mb-1">{m.goal}</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

// ============================================================================
// Device Proof Stage (Side-by-Side | Desktop | Mobile + Special Showcases)
// ============================================================================
const ChapterDeviceStage: React.FC<{
  chapter: PitchChapter;
  onZoomImage: (src: string, caption: string) => void;
  places: Place[];
  videos: VideoReview[];
}> = ({ chapter, onZoomImage, places, videos }) => {
  const hasBoth = Boolean(chapter.imagePath && chapter.mobileImagePath);
  const [deviceView, setDeviceView] = useState<"split" | "desktop" | "mobile">(
    hasBoth ? "split" : chapter.frameMode === "mobile" ? "mobile" : "desktop"
  );

  if (chapter.frameMode === "data") {
    return <ChapterDataVisual page={chapter.page} />;
  }

  if (chapter.frameMode === "embed") {
    return <LiveEmbedSandbox places={places} videos={videos} />;
  }

  return (
    <div className="space-y-4">
      {/* Device Switcher Bar */}
      {hasBoth && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center p-1 rounded-xl bg-[#111115] border border-white/10">
            <button
              type="button"
              onClick={() => setDeviceView("split")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                deviceView === "split"
                  ? "bg-white text-black shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Columns2 className="w-3.5 h-3.5" />
              Desktop + Mobile
            </button>
            <button
              type="button"
              onClick={() => setDeviceView("desktop")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                deviceView === "desktop"
                  ? "bg-white text-black shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Desktop (1440px)
            </button>
            <button
              type="button"
              onClick={() => setDeviceView("mobile")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                deviceView === "mobile"
                  ? "bg-white text-black shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Mobile PWA (390px)
            </button>
          </div>
          <span className="text-[11px] text-zinc-500 hidden sm:inline">
            Live production screenshots · Click any screen to zoom
          </span>
        </div>
      )}

      {/* Visual Stage */}
      {deviceView === "split" && hasBoth ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Desktop Browser Frame (8 cols) */}
          <div className="lg:col-span-8 rounded-2xl border border-white/12 bg-[#0B0B0F] overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.85)]">
            <div className="px-3.5 py-2.5 bg-[#121217] border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              </div>
              <span className="text-[10px] font-mono text-zinc-400">yoouz.com · Desktop 1440px</span>
              <Monitor className="w-3.5 h-3.5 text-zinc-500" />
            </div>
            <PitchResponsiveImage
              src={chapter.imagePath}
              alt={chapter.imageCaption}
              priority={chapter.page <= 2}
              onClick={() => onZoomImage(chapter.imagePath, chapter.imageCaption)}
            />
            <div className="px-4 py-2.5 bg-[#09090C] border-t border-white/[0.06] text-[11px] text-zinc-400">
              {chapter.imageCaption}
            </div>
          </div>

          {/* iPhone Titanium Bezel Frame (4 cols) */}
          <div className="lg:col-span-4 flex flex-col items-center">
            <div className="w-full max-w-[270px] rounded-[34px] p-2 bg-gradient-to-b from-zinc-700/70 via-zinc-800/80 to-zinc-900 border border-white/15 shadow-[0_24px_70px_rgba(0,0,0,0.9)]">
              <div className="rounded-[27px] overflow-hidden bg-black border border-white/10">
                <div className="h-5 bg-black flex items-center justify-center">
                  <div className="w-16 h-3 rounded-full bg-zinc-900 border border-white/10" />
                </div>
                <PitchResponsiveImage
                  src={chapter.mobileImagePath!}
                  alt={chapter.mobileCaption || "Mobile PWA view"}
                  priority={chapter.page <= 2}
                  onClick={() =>
                    onZoomImage(
                      chapter.mobileImagePath!,
                      chapter.mobileCaption || chapter.imageCaption
                    )
                  }
                />
              </div>
            </div>
            {chapter.mobileCaption && (
              <p className="mt-2.5 text-[11px] text-zinc-400 text-center max-w-[280px] leading-relaxed">
                {chapter.mobileCaption}
              </p>
            )}
          </div>
        </div>
      ) : deviceView === "mobile" && chapter.mobileImagePath ? (
        <div className="flex flex-col items-center py-4 rounded-2xl border border-white/10 bg-[#0B0B0F]">
          <div className="w-full max-w-[330px] rounded-[40px] p-2.5 bg-gradient-to-b from-zinc-700/70 via-zinc-800/80 to-zinc-900 border border-white/15 shadow-[0_28px_80px_rgba(0,0,0,0.92)]">
            <div className="rounded-[32px] overflow-hidden bg-black border border-white/10">
              <div className="h-6 bg-black flex items-center justify-center">
                <div className="w-20 h-3.5 rounded-full bg-zinc-900 border border-white/10" />
              </div>
              <PitchResponsiveImage
                src={chapter.mobileImagePath}
                alt={chapter.mobileCaption || chapter.imageCaption}
                onClick={() =>
                  onZoomImage(
                    chapter.mobileImagePath!,
                    chapter.mobileCaption || chapter.imageCaption
                  )
                }
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-zinc-400 text-center px-4">
            {chapter.mobileCaption || chapter.imageCaption}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/12 bg-[#0B0B0F] overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.85)]">
          <div className="px-4 py-2.5 bg-[#121217] border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            </div>
            <span className="text-[10px] font-mono text-zinc-400">yoouz.com · Desktop 1440px</span>
            <Monitor className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <PitchResponsiveImage
            src={chapter.imagePath}
            alt={chapter.imageCaption}
            onClick={() => onZoomImage(chapter.imagePath, chapter.imageCaption)}
          />
          <div className="px-4 py-2.5 bg-[#09090C] border-t border-white/[0.06] text-xs text-zinc-400">
            {chapter.imageCaption}
          </div>
        </div>
      )}

      {/* Chapter 11 Bonus Showcase: Actual Server-Rendered 1200x630 OG Link Preview Card */}
      {chapter.page === 11 && chapter.secondaryImagePath && (
        <div className="rounded-2xl border border-amber-500/25 bg-[#0E0E13] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Live 1200×630 Dynamic Social Preview Card (WhatsApp / iMessage / Telegram / X)
              </span>
            </div>
            <span className="text-[11px] font-mono text-amber-300">
              Rendered live by Sharp + SVG Engine
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-7 rounded-xl overflow-hidden border border-white/15 shadow-2xl">
              <PitchResponsiveImage
                src={chapter.secondaryImagePath}
                alt="Live 1200x630 Yoouz OpenGraph Card for Sephora"
                onClick={() =>
                  onZoomImage(
                    chapter.secondaryImagePath!,
                    "Live 1200×630 Server-Rendered OpenGraph Social Share Card (Sephora · 5/5 Stars · ★ Yoouz Mark)"
                  )
                }
              />
            </div>
            <div className="md:col-span-5 space-y-2.5 text-xs text-zinc-300">
              <p className="font-semibold text-white text-sm">
                Exact 1:1 parity between the in-app Share Sheet and what recipients see in chat.
              </p>
              <p className="text-zinc-400 leading-relaxed">
                Zero white borders, zero awkward thumbnails. Every shared link delivers the unboxed customer photo edge-to-edge with the subtle top-right <span className="text-white font-semibold">★ Yoouz</span> mark, 5/5 solid gold stars, business squircle logo, and verified reviewer attribution.
              </p>
              <div className="pt-2 flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-md bg-black/70 border border-white/10 text-[11px] font-mono text-zinc-300">
                  1200 × 630 PNG
                </span>
                <span className="px-2.5 py-1 rounded-md bg-black/70 border border-white/10 text-[11px] font-mono text-zinc-300">
                  og:image + twitter:card
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chapter 15 Bonus Showcase: Real Native iOS Face ID Passkey Prompt */}
      {chapter.page === 15 && chapter.secondaryImagePath && (
        <div className="rounded-2xl border border-amber-500/25 bg-[#0E0E13] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Real Native iOS Face ID Passkey Prompt (Zero Passwords · Zero SMS Cost)
              </span>
            </div>
            <span className="text-[11px] font-mono text-amber-300">FIDO2 / WebAuthn Standard</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            <div className="md:col-span-4 flex justify-center">
              <div className="w-full max-w-[230px] rounded-[28px] p-1.5 bg-zinc-800 border border-white/15 shadow-2xl">
                <div className="rounded-[22px] overflow-hidden bg-black">
                  <PitchResponsiveImage
                    src={chapter.secondaryImagePath}
                    alt="Native iOS Passkey for yoouz.com Face ID Sheet"
                    onClick={() =>
                      onZoomImage(
                        chapter.secondaryImagePath!,
                        "Native iOS Safari WebAuthn Prompt — 'Passkey for yoouz.com' (1-Time Optional Face ID Lock)"
                      )
                    }
                  />
                </div>
              </div>
            </div>
            <div className="md:col-span-8 space-y-3 text-xs text-zinc-300">
              <h4 className="text-base font-bold text-white">
                Why 1-Time Optional Face ID Passkeys Beat Legacy Sign-Up Forms
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-black/60 border border-white/10">
                  <div className="text-amber-400 font-bold mb-1">Step 1 · 3s Review</div>
                  <p className="text-zinc-400 leading-relaxed">
                    Customer snaps 1 live photo & taps 1–5 whole stars immediately. Zero login screen.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-black/60 border border-white/10">
                  <div className="text-amber-400 font-bold mb-1">Step 2 · Auto U/ID</div>
                  <p className="text-zinc-400 leading-relaxed">
                    Yoouz creates their persistent handle (e.g. U/9D9CY7) on the spot so their photo goes live instantly.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-black/60 border border-white/10">
                  <div className="text-amber-400 font-bold mb-1">Step 3 · 1x Face ID</div>
                  <p className="text-zinc-400 leading-relaxed">
                    One optional Face ID glance saves their Passkey forever & awards the Verified checkmark.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT: YoouzInvestorPitchView
// ============================================================================
export const YoouzInvestorPitchView: React.FC<YoouzInvestorPitchViewProps> = ({
  onBackToApp,
  places = [],
  videos = [],
}) => {
  const [viewMode, setViewMode] = useState<"interactive" | "pdf">("interactive");
  const [activePage, setActivePage] = useState<number>(1);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [lightbox, setLightbox] = useState<{ src: string; caption: string } | null>(null);

  // PDF Viewer state
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const chapterRefs = useRef<Record<number, HTMLElement | null>>({});

  const totalChapters = PITCH_CHAPTERS.length;

  // Responsive sidebar default
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1100) {
      setSidebarOpen(false);
    }
  }, []);

  // Load PDF only when switched to PDF view
  useEffect(() => {
    if (viewMode !== "pdf" || pdfDoc) return;
    let cancelled = false;
    setPdfLoading(true);
    setPdfError(null);

    const loadPdf = async () => {
      try {
        const res = await fetch("/api/pitch/raw-pdf", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuf = await res.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuf });
        const loaded = await loadingTask.promise;
        if (!cancelled) {
          setPdfDoc(loaded);
          setPdfLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setPdfError(err?.message || "Failed to load Investor PDF");
          setPdfLoading(false);
        }
      }
    };

    loadPdf();
    return () => {
      cancelled = true;
    };
  }, [viewMode, pdfDoc]);

  // Track active chapter on scroll in interactive mode
  useEffect(() => {
    if (viewMode !== "interactive") return;
    const scroller = scrollContainerRef.current;
    if (!scroller) return;

    const handleScroll = () => {
      const containerTop = scroller.getBoundingClientRect().top;
      let bestPage = 1;
      let bestDist = Infinity;

      for (const ch of PITCH_CHAPTERS) {
        const el = chapterRefs.current[ch.page];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top - containerTop - 96);
        if (dist < bestDist) {
          bestDist = dist;
          bestPage = ch.page;
        }
      }
      setActivePage(bestPage);
    };

    scroller.addEventListener("scroll", handleScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", handleScroll);
  }, [viewMode]);

  const scrollToChapter = (pageNum: number) => {
    const clamped = Math.max(1, Math.min(totalChapters, pageNum));
    setActivePage(clamped);
    setMobileMenuOpen(false);

    if (viewMode === "interactive") {
      const targetEl = chapterRefs.current[clamped];
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      const pdfEl = document.querySelector(`[data-pdf-page="${clamped}"]`);
      if (pdfEl) {
        pdfEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  // Keyboard navigation (ArrowUp/ArrowDown + Escape for lightbox)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (lightbox && e.key === "Escape") {
        setLightbox(null);
        return;
      }
      if (
        document.activeElement &&
        ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
      ) {
        return;
      }
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        scrollToChapter(activePage + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        scrollToChapter(activePage - 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activePage, lightbox, viewMode]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const progressPct = Math.round((activePage / totalChapters) * 100);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[120] bg-[#060608] text-white flex flex-col overflow-hidden antialiased selection:bg-amber-400 selection:text-black"
    >
      {/* Top Reading Progress Hairline */}
      <div className="h-[2px] w-full bg-zinc-900 shrink-0">
        <div
          className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-white transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* ================================================================= */}
      {/* EXECUTIVE TOP HEADER BAR                                          */}
      {/* ================================================================= */}
      <header className="h-14 shrink-0 px-3 sm:px-5 border-b border-white/[0.08] bg-[#09090C]/95 backdrop-blur-xl flex items-center justify-between gap-3 z-30">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onBackToApp && (
            <button
              type="button"
              onClick={onBackToApp}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-medium text-zinc-200 transition-colors cursor-pointer shrink-0"
              title="Back to Yoouz"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">App</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (window.innerWidth < 1024) {
                setMobileMenuOpen((v) => !v);
              } else {
                setSidebarOpen((v) => !v);
              }
            }}
            className="p-2 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Toggle Chapters Sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-white/15 flex items-center justify-center shrink-0">
              <Star className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-white">Yoouz</span>
                <span className="hidden md:inline text-[11px] font-medium text-zinc-400 border-l border-white/15 pl-2 truncate">
                  Institutional Investor Deck · 2026
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Mode Switcher + Chapter Counter */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center p-0.5 rounded-lg bg-zinc-900/90 border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode("interactive")}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === "interactive"
                  ? "bg-white text-black shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Interactive</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("pdf")}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === "pdf"
                  ? "bg-white text-black shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>

          {/* Slide Stepper */}
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900/80 border border-white/10">
            <button
              type="button"
              onClick={() => scrollToChapter(activePage - 1)}
              disabled={activePage <= 1}
              className="p-1 rounded hover:bg-white/10 text-zinc-300 disabled:opacity-30 cursor-pointer"
              title="Previous Slide"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-zinc-200 px-1.5 tabular-nums">
              {activePage < 10 ? `0${activePage}` : activePage} / {totalChapters}
            </span>
            <button
              type="button"
              onClick={() => scrollToChapter(activePage + 1)}
              disabled={activePage >= totalChapters}
              className="p-1 rounded hover:bg-white/10 text-zinc-300 disabled:opacity-30 cursor-pointer"
              title="Next Slide"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: PDF Download + Fullscreen */}
        <div className="flex items-center gap-2 shrink-0">
          {viewMode === "pdf" && (
            <div className="hidden md:flex items-center gap-1 px-1.5 py-1 rounded-lg bg-zinc-900 border border-white/10">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.6, Number((z - 0.15).toFixed(2))))}
                className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono text-zinc-300 w-10 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(1.6, Number((z + 0.15).toFixed(2))))}
                className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <a
            href="/api/pitch/raw-pdf"
            download="Yoouz_Visual_Investor_Pitch_Deck.pdf"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-semibold transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download PDF</span>
          </a>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="hidden lg:flex p-2 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ================================================================= */}
      {/* BODY: 3-ACT SIDEBAR + MAIN READING CANVAS                         */}
      {/* ================================================================= */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Desktop Collapsible 3-Act Sidebar */}
        {sidebarOpen && (
          <aside className="hidden lg:flex w-[290px] xl:w-[310px] shrink-0 border-r border-white/[0.08] bg-[#09090C] flex-col overflow-y-auto">
            <div className="p-4 space-y-5">
              {PITCH_ACTS.map((act) => {
                const actChapters = PITCH_CHAPTERS.filter((c) => c.act === act.id);
                return (
                  <div key={act.id}>
                    <div className="px-2 mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                        {act.label}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">{act.range}</span>
                    </div>
                    <div className="space-y-0.5">
                      {actChapters.map((ch) => {
                        const isActive = activePage === ch.page;
                        return (
                          <button
                            key={ch.page}
                            type="button"
                            onClick={() => scrollToChapter(ch.page)}
                            className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all flex items-start gap-2.5 cursor-pointer ${
                              isActive
                                ? "bg-white text-black font-semibold shadow-sm"
                                : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
                            }`}
                          >
                            <span
                              className={`font-mono text-[10px] mt-0.5 shrink-0 ${
                                isActive ? "text-black/70" : "text-zinc-600"
                              }`}
                            >
                              {ch.page < 10 ? `0${ch.page}` : ch.page}
                            </span>
                            <span className="leading-snug line-clamp-2">{ch.shortTitle}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* Mobile Chapter Drawer Overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/80"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-[84%] max-w-[320px] bg-[#0B0B0F] border-r border-white/10 h-full overflow-y-auto p-4 z-10">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                <span className="text-xs font-bold uppercase tracking-widest text-white">
                  22 Pitch Chapters
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg bg-white/10 text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-5">
                {PITCH_ACTS.map((act) => (
                  <div key={act.id}>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-2 px-2">
                      {act.label} ({act.range})
                    </div>
                    <div className="space-y-1">
                      {PITCH_CHAPTERS.filter((c) => c.act === act.id).map((ch) => {
                        const isActive = activePage === ch.page;
                        return (
                          <button
                            key={ch.page}
                            type="button"
                            onClick={() => scrollToChapter(ch.page)}
                            className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-start gap-2.5 ${
                              isActive
                                ? "bg-white text-black font-semibold"
                                : "text-zinc-300 hover:bg-white/[0.06]"
                            }`}
                          >
                            <span className="font-mono text-[10px] mt-0.5 opacity-60">
                              {ch.page < 10 ? `0${ch.page}` : ch.page}
                            </span>
                            <span>{ch.shortTitle}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MAIN CONTENT SCROLLER */}
        <main
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto scroll-smooth bg-[#060608]"
        >
          {viewMode === "interactive" ? (
            <div className="max-w-[1180px] mx-auto px-4 sm:px-8 lg:px-10 py-8 sm:py-12 space-y-16 sm:space-y-24">
              {/* ========================================================= */}
              {/* 60-SECOND EXECUTIVE COVER HERO                            */}
              {/* ========================================================= */}
              <section className="relative rounded-3xl border border-white/12 bg-gradient-to-b from-[#101016] via-[#0B0B0F] to-[#08080B] p-6 sm:p-10 lg:p-12 overflow-hidden shadow-[0_32px_100px_rgba(0,0,0,0.9)]">
                {/* Subtle ambient gold rim */}
                <div className="pointer-events-none absolute -top-24 right-0 w-[420px] h-[420px] rounded-full bg-amber-500/[0.06] blur-3xl" />

                <div className="relative z-10 max-w-4xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/12 text-[11px] font-semibold tracking-wide text-amber-300 mb-6">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    YOOUZ · PRE-SEED INVESTOR MEMORANDUM · LIVE PRODUCTION EDITION
                  </div>

                  <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-bold tracking-tight text-white leading-[1.06] mb-5">
                    See the truth before you decide.{" "}
                    <span className="text-zinc-400">
                      The global live photo review platform replacing fake text forever.
                    </span>
                  </h1>

                  <p className="text-sm sm:text-base lg:text-lg text-zinc-300 leading-relaxed max-w-3xl mb-8">
                    AI has broken trust in text reviews across Google, Yelp, and Trustpilot. Yoouz enforces{" "}
                    <strong className="text-white">
                      1 real-time hardware camera photo + 1 to 5 solid whole stars in 3 seconds
                    </strong>{" "}
                    with zero signup wall, zero gallery uploads, $0 paid-ad CAC via physical counter QR standees, and ~95%+ gross margin B2B SaaS.
                  </p>

                  {/* 4-Card Live Executive KPI Strip */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
                    {[
                      {
                        val: "543+",
                        label: "Indexed Global Brands",
                        sub: "Zero cold-start auto-scraper",
                      },
                      {
                        val: "62",
                        label: "Live Photo Reviews",
                        sub: "Apple, Noma, Zara, Sephora...",
                      },
                      {
                        val: "~95%+",
                        label: "Software Gross Margin",
                        sub: "~120 KB Bunny.net + Cloud SQL",
                      },
                      {
                        val: "75+",
                        label: "Localized SEO Languages",
                        sub: "$0 CAC QR & Page-1 flywheel",
                      },
                    ].map((kpi) => (
                      <div
                        key={kpi.label}
                        className="rounded-2xl p-4 bg-black/60 border border-white/10"
                      >
                        <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums tracking-tight">
                          {kpi.val}
                        </div>
                        <div className="text-xs font-semibold text-amber-300 mt-1">
                          {kpi.label}
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">{kpi.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Jump Act Actions */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => scrollToChapter(1)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                    >
                      Start 60s Investment Thesis
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToChapter(8)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-xs sm:text-sm font-medium text-white transition-colors cursor-pointer"
                    >
                      <Columns2 className="w-4 h-4 text-amber-400" />
                      Desktop + Mobile Product Tour (08–19)
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToChapter(18)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-xs sm:text-sm font-medium text-white transition-colors cursor-pointer"
                    >
                      <QrCode className="w-4 h-4 text-amber-400" />
                      Test Live Embed Sandbox
                    </button>
                  </div>
                </div>
              </section>

              {/* ========================================================= */}
              {/* ALL 22 CHAPTERS (3 ACTS)                                  */}
              {/* ========================================================= */}
              {PITCH_CHAPTERS.map((chapter, idx) => {
                const isFirstInAct =
                  idx === 0 || PITCH_CHAPTERS[idx - 1].act !== chapter.act;
                const actMeta = PITCH_ACTS.find((a) => a.id === chapter.act);

                return (
                  <React.Fragment key={chapter.page}>
                    {isFirstInAct && actMeta && (
                      <div className="pt-4 pb-2 border-b border-white/10 flex flex-wrap items-end justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
                            {actMeta.label}
                          </p>
                          <p className="text-sm text-zinc-400 mt-1">{actMeta.subtitle}</p>
                        </div>
                        <span className="text-xs font-mono text-zinc-500">
                          Chapters {actMeta.range}
                        </span>
                      </div>
                    )}

                    <article
                      ref={(el) => {
                        chapterRefs.current[chapter.page] = el;
                      }}
                      id={`pitch-chapter-${chapter.page}`}
                      className="scroll-mt-20 space-y-6"
                    >
                      {/* Chapter Header */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-400">
                            {chapter.kicker}
                          </span>
                          <span className="text-xs font-mono text-zinc-500 tabular-nums">
                            {chapter.page < 10 ? `0${chapter.page}` : chapter.page} / {totalChapters}
                          </span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-[1.14]">
                          {chapter.headline}
                        </h2>
                        <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-4xl">
                          {chapter.subheadline}
                        </p>
                      </div>

                      {/* Primary Visual Stage (Desktop + Mobile / Data Visual / Live Embed) */}
                      <ChapterDeviceStage
                        chapter={chapter}
                        onZoomImage={(src, caption) => setLightbox({ src, caption })}
                        places={places}
                        videos={videos}
                      />

                      {/* 4 Key Architectural & Business Callouts */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                        {chapter.callouts.map((c) => (
                          <div
                            key={c.id}
                            className="rounded-2xl p-4 sm:p-5 bg-[#0D0D11] border border-white/[0.09] hover:border-white/20 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2 mb-2.5">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-6 h-6 rounded-md bg-white text-black text-[11px] font-bold flex items-center justify-center shrink-0">
                                  {c.id}
                                </span>
                                <h3 className="text-sm font-bold text-white leading-snug truncate">
                                  {c.title}
                                </h3>
                              </div>
                              <span className="hidden sm:inline-block shrink-0 text-[10px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                                {c.tag}
                              </span>
                            </div>
                            <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed">
                              {c.description}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Per-Screen Interactive Controls & Button Guide (Product Tour Slides) */}
                      {chapter.buttonGuide && chapter.buttonGuide.length > 0 && (
                        <div className="rounded-2xl border border-white/10 bg-[#0A0A0E] p-4 sm:p-5">
                          <div className="flex items-center gap-2 mb-3.5">
                            <MousePointerClick className="w-4 h-4 text-amber-400" />
                            <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-200">
                              Every Interactive Button & Control on This Screen
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {chapter.buttonGuide.map((item) => (
                              <div
                                key={item.control}
                                className="rounded-xl p-3 bg-black/60 border border-white/[0.08]"
                              >
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="text-xs font-semibold text-white">
                                    {item.control}
                                  </span>
                                </div>
                                <div className="text-[10px] font-mono text-amber-400/90 mb-1">
                                  {item.location}
                                </div>
                                <p className="text-[11px] text-zinc-400 leading-relaxed">
                                  {item.action}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3-Column Bottom Executive Metrics Strip */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {chapter.metrics.map((m) => (
                          <div
                            key={m.label}
                            className="rounded-xl px-4 py-3.5 bg-[#0F0F14] border border-white/[0.08]"
                          >
                            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                              {m.label}
                            </div>
                            <div className="text-lg font-bold text-white mt-0.5 tabular-nums">
                              {m.value}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">{m.detail}</div>
                          </div>
                        ))}
                      </div>
                    </article>
                  </React.Fragment>
                );
              })}

              {/* ========================================================= */}
              {/* CLOSING INVESTOR CTA FOOTER                               */}
              {/* ========================================================= */}
              <footer className="rounded-3xl border border-white/15 bg-gradient-to-b from-[#111117] to-[#09090C] p-6 sm:p-10 text-center space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-[11px] font-semibold text-amber-300">
                  Live in Production at yoouz.com
                </div>
                <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white max-w-2xl mx-auto">
                  Experience the entire live product right now—zero login required.
                </h2>
                <p className="text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
                  Search any global brand or local venue, snap a 3-second hardware photo review, test 1-tap Face ID Passkey, or download the complete 22-slide institutional PDF for your investment committee.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <a
                    href="/api/pitch/raw-pdf"
                    download="Yoouz_Visual_Investor_Pitch_Deck.pdf"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black hover:bg-zinc-200 text-sm font-semibold transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download 22-Slide Investor PDF
                  </a>
                  {onBackToApp && (
                    <button
                      type="button"
                      onClick={onBackToApp}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-sm font-medium text-white transition-colors cursor-pointer"
                    >
                      Launch Live App
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 pt-4">
                  © 2026 Yoouz · Confidential Investor Presentation · 100% Live Photo Proof · Bunny.net CDN & Cloud SQL Architecture
                </p>
              </footer>
            </div>
          ) : (
            /* ========================================================= */
            /* PRINT PDF VIEW MODE                                       */
            /* ========================================================= */
            <div className="max-w-[1100px] mx-auto px-4 py-8 flex flex-col items-center gap-8">
              {pdfLoading && (
                <div className="py-24 flex flex-col items-center gap-3 text-zinc-400">
                  <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
                  <p className="text-sm font-medium">Rendering 22-page high-resolution Investor PDF...</p>
                </div>
              )}

              {pdfError && (
                <div className="py-16 text-center space-y-3">
                  <p className="text-sm text-red-400">Unable to preview PDF inline: {pdfError}</p>
                  <a
                    href="/api/pitch/raw-pdf"
                    download="Yoouz_Visual_Investor_Pitch_Deck.pdf"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-sm font-semibold"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF Directly
                  </a>
                </div>
              )}

              {pdfDoc &&
                Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1).map((pageNum) => (
                  <PdfPageCanvas
                    key={pageNum}
                    pdfDoc={pdfDoc}
                    pageNum={pageNum}
                    totalPages={pdfDoc.numPages}
                    zoomLevel={zoomLevel}
                  />
                ))}
            </div>
          )}
        </main>
      </div>

      {/* ================================================================= */}
      {/* FULL-SCREEN LIGHTBOX ZOOM INSPECTOR                               */}
      {/* ================================================================= */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-8"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Zoom"
          >
            <X className="w-5 h-5" />
          </button>
          <div
            className="max-w-[95vw] max-h-[84vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightbox.src}
              alt={lightbox.caption}
              className="max-w-full max-h-[82vh] object-contain rounded-xl border border-white/15 shadow-2xl"
            />
          </div>
          <p className="mt-4 text-xs sm:text-sm text-zinc-300 text-center max-w-2xl">
            {lightbox.caption}
          </p>
        </div>
      )}
    </div>
  );
};

export default YoouzInvestorPitchView;
