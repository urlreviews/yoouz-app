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
  Camera,
  CheckCircle2,
  ShieldCheck,
  ScanFace,
  UserCheck,
  Navigation,
  Phone,
  Bookmark,
  Share2,
  MessageSquare,
  Star,
  Globe,
  QrCode,
  Code2,
  Sparkles,
  AtSign,
  RotateCcw,
  Check,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker locally from server route
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface YoouzInvestorPitchViewProps {
  onBackToApp?: () => void;
}

interface CalloutItem {
  id: number;
  title: string;
  badgeText: string;
  description: string;
}

interface PitchSlideData {
  page: number;
  shortTitle: string;
  kicker: string;
  headline: string;
  subheadline: string;
  metrics: Array<{ label: string; value: string; detail: string }>;
  callouts: CalloutItem[];
}

const PITCH_SLIDES: PitchSlideData[] = [
  {
    page: 1,
    shortTitle: "The 5-Second Hook: 1 Photo = 1,000 Words",
    kicker: "01 · EXECUTIVE SUMMARY & CORE THESIS",
    headline: "A Picture Is Worth 1,000 Words. One Live Photo Replaces Fake Text Reviews.",
    subheadline:
      "Text reviews on Google, Yelp, and Trustpilot are flooded with AI bots and fake paragraphs written from a couch. Video reviews fail because 99% of customers refuse to film a 60-second selfie speaking in public. Yoouz captures undeniable proof in 3 seconds: 1 live camera photo + 1–5 solid whole stars.",
    metrics: [
      { label: "Review Creation Time", value: "3 Seconds", detail: "1 live camera photo + 1–5 whole stars" },
      { label: "Gallery / Fake Uploads", value: "0% Allowed", detail: "Hardware camera launch only — no gallery roll" },
      { label: "Visual Proof Density", value: "1,000 Words", detail: "Instant proof of real visit or delivery" },
    ],
    callouts: [
      {
        id: 1,
        title: "Home Discovery & Universal Search Bar",
        badgeText: "See the Truth Before You Decide",
        description:
          "Visitors land directly on trending live photo reviews (Sephora, Lerner & Rowe, Maki Cafe, Wolt) and can search any local venue, brand, or URL worldwide with zero sign-up wall.",
      },
      {
        id: 2,
        title: "Verified Business Pill (Top Backdrop Overlay)",
        badgeText: "Wolt ✓ · ★ 5.0 (1 review)",
        description:
          "Translucent dark glass pill (backdrop-blur-xl) at the top of every photo review displaying the official brand logo, verified checkmark, whole-star score, and review count.",
      },
      {
        id: 3,
        title: "100% Live Photo Canvas & Reviewer Attribution",
        badgeText: "David C · 20h ago · ★★★★★ · wolt.com",
        description:
          "Full-bleed customer photo paired with the reviewer's handle (U/XXXXXX or custom name), accurate relative timestamp, solid gold star rating, and clickable business domain.",
      },
      {
        id: 4,
        title: "5-Button Vertical Social Action Rail",
        badgeText: "Creator (+) · Like (9) · Comment (3) · Save (3) · Share (2)",
        description:
          "Thumb-friendly action rail on the right side of every photo review for following the reviewer, liking, opening threaded comments, bookmarking the business, and sharing.",
      },
    ],
  },
  {
    page: 2,
    shortTitle: "The 3-Second Native Camera Flow",
    kicker: "02 · ZERO-UPLOAD NATIVE CAMERA PROTOCOL",
    headline: "How a Photo Review Works: Native Camera -> Whole Stars -> Published.",
    subheadline:
      "Every customer already snaps photos of their meal, coffee, hotel room, or delivery. Yoouz turns that effortless 3-second habit into a verified review—launching the phone's native camera directly while strictly blocking camera-roll uploads.",
    metrics: [
      { label: "Gallery Roll Uploads", value: "Strictly Blocked", detail: "Eliminates old, stolen, or AI-generated images" },
      { label: "Star Rating Standard", value: "1–5 Whole Stars", detail: "Solid whole stars only — no text required" },
      { label: "Privacy & Compression", value: "Sharp ~120 KB", detail: "EXIF/GPS stripped & optimized on Bunny.net CDN" },
    ],
    callouts: [
      {
        id: 1,
        title: "Desktop-to-Mobile QR Camera Handoff",
        badgeText: "Add Live Photo Review · Scan QR",
        description:
          "When a user clicks '+ Add Review' on Desktop, Yoouz displays an instant QR code pre-linked to that exact business so their phone camera opens the review screen in 1 second.",
      },
      {
        id: 2,
        title: "Mobile Native Camera Launch ('Open Camera')",
        badgeText: "Snap a Native Photo · capture='environment'",
        description:
          "On mobile, tapping 'Open Camera' launches the iOS/Android native camera app directly for full HDR and stabilization—with zero option to upload old photos from the gallery.",
      },
      {
        id: 3,
        title: "Full-Screen Photo Preview & 1–5 Whole-Star Tap",
        badgeText: "Rate your experience · ★★★★★",
        description:
          "After snapping the photo, the user sees their crisp photo preview, taps 1, 2, 3, 4, or 5 solid gold stars (zero half-stars, zero text essay required), or taps 'Retake'.",
      },
      {
        id: 4,
        title: "1-Tap 'Publish Photo Review' to Global Feed",
        badgeText: "Publish Photo Review -> Instant Live",
        description:
          "Tapping the white 'Publish Photo Review' button strips private EXIF location metadata via Sharp and publishes the photo immediately to the business profile and global feed.",
      },
    ],
  },
  {
    page: 3,
    shortTitle: "Zero-Password U/XXXXXX & Face ID Passkey",
    kicker: "03 · ZERO-FRICTION IDENTITY & BIOMETRIC PASSKEY",
    headline: "No Email, No Password, No Magic Link: Auto U/XXXXXX Handle -> Face ID Passkey.",
    subheadline:
      "Legacy platforms lose over 70% of reviewers at sign-up walls, password rules, and email magic-link delays. On Yoouz, users never need an email or password—an automatic U/XXXXXX member profile is created on action, customizable anytime and locked forever via 1-tap Face ID Passkey.",
    metrics: [
      { label: "Passwords or Magic Links", value: "Zero Required", detail: "No inbox switching or OTP code drop-off" },
      { label: "Automatic Member Handle", value: "U/XXXXXX", detail: "Created automatically on first review or action" },
      { label: "Cross-Phone Persistence", value: "1-Tap Passkey", detail: "Face ID / Biometrics + Verified Badge (✓)" },
    ],
    callouts: [
      {
        id: 1,
        title: "On-Action Automatic Guest-to-Member Profile (U/XXXXXX)",
        badgeText: "Auto-Assigned: U/FCC8RS · U/J4DCGH",
        description:
          "Zero sign-up is required to browse. The moment a user publishes a photo review, likes, comments, saves, or follows, Yoouz automatically generates their unique U/XXXXXX member profile.",
      },
      {
        id: 2,
        title: "Claim or Change Custom @Username Anytime (Always Saved)",
        badgeText: "@yourhandle · Saved Permanently",
        description:
          "Right after publishing ('Claim Your Reviewer Handle') or anytime inside their Profile Drawer, users can change U/XXXXXX to any custom username or real name—and it stays saved across all reviews and comments.",
      },
      {
        id: 3,
        title: "1-Tap Biometric Face ID / Passkey Account Lock",
        badgeText: "Save Account with Face ID / Passkey",
        description:
          "Tapping 'Save Face ID (1-Time)' stores a WebAuthn Passkey in Apple iCloud Keychain or Google Password Manager—keeping the user's account even if they switch phones, with zero email or password.",
      },
      {
        id: 4,
        title: "Verified Reviewer Checkmark (✓) & Full Creator Hub",
        badgeText: "Verified Badge ✓ · Reviews · Followers",
        description:
          "Saving a Passkey unlocks the official white Verified Reviewer badge (✓) next to their name and powers their complete profile drawer (Overview, Photo Reviews, Followers, Following, and Chat).",
      },
    ],
  },
  {
    page: 4,
    shortTitle: "Business Profile Hub & 5 Action Buttons",
    kicker: "04 · INTERACTIVE BUSINESS PROFILE & CONVERSION DOCK",
    headline: "Every Business & Website Becomes an Actionable Conversion Hub.",
    subheadline:
      "Alongside every photo review on desktop—and as a full native screen on mobile—Yoouz renders a dedicated Business Profile Drawer with official brand assets, aggregate whole-star score, 1-tap camera launch, and 5 direct customer conversion buttons.",
    metrics: [
      { label: "Customer Action Dock", value: "5 Direct Buttons", detail: "Directions · Call · Save · Share · Chat" },
      { label: "Profile Navigation", value: "3 Clean Tabs", detail: "Overview · Photo Reviews · About" },
      { label: "Camera Trigger", value: "1-Tap Pre-Tagged", detail: "'ADD REVIEW' opens camera for that business" },
    ],
    callouts: [
      {
        id: 1,
        title: "Official Brand Banner, Squircle Logo & '+ Follow'",
        badgeText: "Wolt ✓ · wolt.com · [+ Follow]",
        description:
          "Displays the high-resolution cover banner, official brand logo inside a crisp squircle frame, verified badge, clickable domain link, and one-tap '+ Follow' button.",
      },
      {
        id: 2,
        title: "Aggregate Star Rating & Primary '📷 ADD REVIEW' Button",
        badgeText: "5.0 ★★★★★ · [📷 ADD REVIEW]",
        description:
          "High-contrast white 'ADD REVIEW' button directly below the aggregate star rating launches the photo review flow pre-tagged to that exact business.",
      },
      {
        id: 3,
        title: "Overview · Photo Reviews · About Navigation Tabs",
        badgeText: "Overview | Photo Reviews 1 | About",
        description:
          "Lets customers switch seamlessly between the business summary, the complete grid of verified customer photo reviews, and location/hours/website details.",
      },
      {
        id: 4,
        title: "5-Button Customer Conversion Dock",
        badgeText: "DIRECTIONS · CALL · SAVE · SHARE · CHAT",
        description:
          "Converts visual discovery into immediate business revenue: GPS Map Directions, 1-Tap Phone Call, Bookmark Save, Social/QR Share, and Direct Business Chat.",
      },
    ],
  },
  {
    page: 5,
    shortTitle: "Authentic Community Comments & Timestamps",
    kicker: "05 · VERIFIED SOCIAL PROOF & MICRO-CONVERSATIONS",
    headline: "Real Human Questions, Verified Reviewer Replies & Accurate Timestamps.",
    subheadline:
      "When shoppers see an authentic photo, they ask specific, high-intent questions ('broth didnt spill at all?'). Yoouz highlights replies from the actual photo Reviewer and enforces strict chronological timestamp accuracy across the database.",
    metrics: [
      { label: "Live Seeded Catalog", value: "40 Photo Reviews", detail: "Across food, retail, hotels, clinics & law" },
      { label: "Database Interactions", value: "589+ Synced", detail: "318 Likes · 111 Saves · 86 Shares · 74 Comments" },
      { label: "Timestamp Engine", value: "100% Chronological", detail: "Staggered relative times & live 'Just now' sync" },
    ],
    callouts: [
      {
        id: 1,
        title: "Right-Hand Threaded Comments Drawer ('Comments 3')",
        badgeText: "Comments 3 · [Top | Newest]",
        description:
          "Opens alongside the photo review without interrupting viewing, featuring instant switching between Top-liked comments and Newest activity.",
      },
      {
        id: 2,
        title: "Short, Natural Human Remarks with Realistic Timing",
        badgeText: "NordicBite (15h ago) · Aiko Tanaka (9h ago)",
        description:
          "Real conversational comments ('22 mins is impressive for ramen', 'broth didnt spill at all?') with distinct, chronologically newer timestamps than the parent review.",
      },
      {
        id: 3,
        title: "Official 'Reviewer' Badge on Photo Author Replies",
        badgeText: "David C [Reviewer] · 'sealed lid held up great'",
        description:
          "When the original photo author replies to a question, Yoouz attaches a verified 'Reviewer' badge so everyone knows the answer comes from the customer who took the photo.",
      },
      {
        id: 4,
        title: "Live Comment Bar & Full Admin Console Sync",
        badgeText: "Add a comment... · Instant DB Persistence",
        description:
          "Every new comment, reply, like, save, and share is written to dedicated database tables with live millisecond timestamps and full visibility in the Admin Console.",
      },
    ],
  },
  {
    page: 6,
    shortTitle: "Local Venues + Global Website Directory",
    kicker: "06 · UNIVERSAL LOCAL + WEB DISCOVERY ENGINE",
    headline: "Every Physical Street Venue & Global Website Indexed in One Platform.",
    subheadline:
      "Unlike Yelp (local venues only) or Trustpilot (web domains only), Yoouz indexes every physical business AND every global website—automatically resolving brand logos, banners, and 75+ language SEO.",
    metrics: [
      { label: "Index Coverage", value: "Local + Global Web", detail: "Restaurants & clinics to e-commerce domains" },
      { label: "Multi-Industry Depth", value: "12+ Verticals", detail: "Food, Hotels, Legal, Dental, Auto, Tech & Retail" },
      { label: "Search & AI Indexing", value: "75+ Languages", detail: "Schema.org JSON-LD, hreflang & AEO blocks" },
    ],
    callouts: [
      {
        id: 1,
        title: "Hospitality, Dining & Local Cafes",
        badgeText: "Noma · Hotel Julien · Maki Cafe · Regalia Hotel",
        description:
          "Diners and travelers browse real, unfiltered table and room photos before booking—eliminating staged marketing photography.",
      },
      {
        id: 2,
        title: "High-Trust Professional Services (Legal, Medical, Dental, Auto)",
        badgeText: "Lerner & Rowe Law · Healis · Praktijk Nexus · Auto Brugge",
        description:
          "Covers high-value local services where trust matters most: injury attorneys, medical clinics, physiotherapy practices, pharmacies, and auto repair shops.",
      },
      {
        id: 3,
        title: "Global E-Commerce, Delivery & Consumer Tech Brands",
        badgeText: "wolt.com · sephora.com · zara.com · flipper.net",
        description:
          "Shoppers snap live unboxing and delivery photos for any online domain—automatically scraping official logos, cover banners, and domain metadata.",
      },
      {
        id: 4,
        title: "Automated 75+ Language SEO & Dynamic OpenGraph Cards",
        badgeText: "yoouz.com/reviews/{domain} · JSON-LD",
        description:
          "Every business page generates structured Schema.org AggregateRating markup, localized hreflang URLs, and custom social preview cards for organic search traffic.",
      },
    ],
  },
  {
    page: 7,
    shortTitle: "B2B Viral Loop: Claiming, QR Stands & Widgets",
    kicker: "07 · ZERO-CAC B2B DISTRIBUTION & PRIVACY-FIRST CLAIMING",
    headline: "Every Claimed Business Becomes a Zero-CAC User Acquisition Channel.",
    subheadline:
      "Business owners claim their official profile via work email, display physical Yoouz QR Review Stands on tables and counters, and embed live photo review carousels on their websites—driving continuous organic growth at $0 CAC.",
    metrics: [
      { label: "Customer Acquisition Cost", value: "$0 via QR Loop", detail: "Merchants promote Yoouz at point of sale" },
      { label: "Owner Email Privacy", value: "100% Protected", detail: "Public sees 'Business Claimed' — never private emails" },
      { label: "Website Integration", value: "1-Line JS Widget", detail: "Live photo review embed for any merchant site" },
    ],
    callouts: [
      {
        id: 1,
        title: "Yoouz Business Portal & Strict Owner Privacy",
        badgeText: "yoouz.com/business · Private Verification",
        description:
          "Merchants sign in with their work domain email to claim their profile. Public pages show the verified badge while owner personal emails remain 100% private and hidden.",
      },
      {
        id: 2,
        title: "Physical Tabletop & Checkout QR Review Stands",
        badgeText: "Scan QR -> Open Camera -> 5 Stars in 3s",
        description:
          "Claimed businesses download custom QR table tents and counter stickers. Customers scan with their phone camera and snap 1 live photo in 3 seconds with zero app download.",
      },
      {
        id: 3,
        title: "Merchant Dashboard: Analytics, Owner Replies & Direct Chat",
        badgeText: "Views · Likes · Shares · Verified Owner Reply",
        description:
          "Inside the Business Dashboard, owners track real-time engagement metrics, reply publicly to customer photo reviews, and message customers directly.",
      },
      {
        id: 4,
        title: "Embeddable Website Trust Widget & Branded Social Export",
        badgeText: "Live Website Carousel + Ad Card Generator",
        description:
          "Merchants embed their live Yoouz photo reviews directly on their e-commerce checkout pages and export high-resolution branded social proof cards in one click.",
      },
    ],
  },
  {
    page: 8,
    shortTitle: "B2B SaaS Model, 98.5% Lower Cost & Moat",
    kicker: "08 · UNIT ECONOMICS, B2B SAAS TIERS & DEFENSIVE MOATS",
    headline: "10x Higher Review Conversion at 98.5% Lower Infrastructure Cost.",
    subheadline:
      "By focusing exclusively on Sharp-optimized live photos (~120 KB) on Bunny.net CDN and Cloud SQL instead of heavy video streams (10+ MB), Yoouz eliminates video transcoding overhead and delivers 92%+ B2B SaaS gross margins.",
    metrics: [
      { label: "Storage & Bandwidth Cost", value: "98.5% Lower", detail: "~120 KB Sharp JPEG vs. 10+ MB video file" },
      { label: "Target Gross Margin", value: "92%+ SaaS", detail: "Bunny.net Edge Storage + Cloud SQL backend" },
      { label: "B2B SaaS Monetization", value: "3 Recurring Tiers", detail: "$0 Free · $49/mo Pro · $149/mo Growth" },
    ],
    callouts: [
      {
        id: 1,
        title: "98.5% Lower Infrastructure Footprint (Zero Video Bloat)",
        badgeText: "~120 KB Photo vs. 10 MB Video Stream",
        description:
          "Zero video transcoding queues and zero HLS streaming bandwidth costs. 10,000 live photo reviews require just ~1.2 GB of Bunny.net edge storage.",
      },
      {
        id: 2,
        title: "Claimed Business Pro Subscription ($49 / month)",
        badgeText: "Verified Badge + Live Chat + QR Stand Kit",
        description:
          "Core recurring B2B tier unlocking the Verified Business badge, Direct Customer Chat inbox, Official Owner Replies, Analytics, and printable QR Stand templates.",
      },
      {
        id: 3,
        title: "Growth & E-Commerce Widget Tier ($149 / month)",
        badgeText: "Website Embed Carousels + Branded Ad Export",
        description:
          "Designed for online brands and multi-location venues: unlimited website embed widgets, social ad card exports, and priority category placement.",
      },
      {
        id: 4,
        title: "Four Compounding Defensive Moats",
        badgeText: "Native Camera · U/XXXXXX + Passkey · QR Loop · Local+Web",
        description:
          "(1) Zero-upload native camera prevents fake reviews, (2) Zero-password U/XXXXXX + Face ID Passkey identity, (3) Physical QR stand viral loop, (4) Unified local + web directory.",
      },
    ],
  },
];

/**
 * Individual Main Page Canvas + Selectable Vector TextLayer Renderer (for PDF Document Mode)
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

        const cssScale = (zoomLevel / 100) * 1.45;
        const viewport = page.getViewport({ scale: cssScale });
        const outputScale = Math.max(window.devicePixelRatio || 1, 2.5);
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
        Page {pageNum} of 8
      </span>
    </div>
  );
};

export const YoouzInvestorPitchView: React.FC<YoouzInvestorPitchViewProps> = ({ onBackToApp }) => {
  const [viewMode, setViewMode] = useState<"interactive" | "pdf">("interactive");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);

  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const numPages = PITCH_SLIDES.length;

  // Enforce strict noindex & synchronize address bar URL to /pitch
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
    document.title = "Visual Investor Pitch Deck | Yoouz";

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

  // Load 8-page PDF when user switches to PDF Document View
  useEffect(() => {
    if (viewMode !== "pdf" || pdfDoc) return;
    let isMounted = true;
    setIsLoadingPdf(true);
    setPdfLoadError(null);

    const loadPdf = async () => {
      try {
        const response = await fetch(`/api/pitch/raw-pdf?v=${Date.now()}`, { cache: "no-store" });
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
          setPdfLoadError("Unable to render PDF document. Please use Interactive HD View or Download PDF.");
          setIsLoadingPdf(false);
        }
      }
    };

    loadPdf();
    return () => {
      isMounted = false;
    };
  }, [viewMode, pdfDoc]);

  // Track visible slide during scroll
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

  // Keyboard navigation
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

  const renderSlideVisualShowcase = (slide: PitchSlideData) => {
    switch (slide.page) {
      case 1:
        return (
          <div className="space-y-5">
            {/* 3-Column Core Thesis Comparison Strip (Pure Dark Mode Black & White) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                  <span>01 · Legacy Text Reviews</span>
                  <span className="text-zinc-300 font-semibold border border-zinc-700 bg-zinc-800 px-2 py-0.5 rounded">
                    Fake & Unverified
                  </span>
                </div>
                <p className="text-sm font-bold text-white">Google · Yelp · Trustpilot</p>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  Anyone can write 500 words of fake praise or competitor attacks from a couch without ever visiting the business.
                </p>
              </div>
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                  <span>02 · 60-Second Video Concept</span>
                  <span className="text-zinc-300 font-semibold border border-zinc-700 bg-zinc-800 px-2 py-0.5 rounded">
                    99% User Drop-Off
                  </span>
                </div>
                <p className="text-sm font-bold text-white">Selfie Video Recording</p>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  Customers refuse to film themselves speaking for 60 seconds in a crowded restaurant, clinic, or hotel lobby.
                </p>
              </div>
              <div className="bg-zinc-950 border-2 border-white rounded-xl p-4 shadow-xl">
                <div className="flex items-center justify-between text-xs text-zinc-300 mb-1.5">
                  <span className="font-bold text-white">03 · The Yoouz Standard</span>
                  <span className="bg-white text-zinc-950 font-extrabold px-2 py-0.5 rounded">
                    1 Photo = 1,000 Words
                  </span>
                </div>
                <p className="text-sm font-extrabold text-white">One Live Camera Photo (3 Seconds)</p>
                <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">
                  Native phone camera only (zero gallery uploads) + 1–5 solid whole stars. Effortless for users, undeniable proof for shoppers.
                </p>
              </div>
            </div>

            {/* Side-by-Side Real Retina Screenshots of the Live Yoouz App */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl overflow-hidden border border-zinc-800 bg-black shadow-2xl flex flex-col">
                <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-white">Live Home Screen (`yoouz.com`)</span>
                  <span className="text-zinc-400">Trending Photo Reviews & Universal Search</span>
                </div>
                <img
                  src="/pitch-assets/screen-6-home-feed.png"
                  alt="Yoouz Home Screen — See the Truth Before You Decide"
                  className="w-full h-auto block object-cover"
                />
              </div>

              <div className="rounded-xl overflow-hidden border border-zinc-800 bg-black shadow-2xl flex flex-col">
                <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-white">Live Photo Review Screen (`yoouz.com/reviews/wolt.com`)</span>
                  <span className="text-amber-400 font-bold">★ 5.0 Whole-Star Feed</span>
                </div>
                <img
                  src="/pitch-assets/screen-1-wolt-full.png"
                  alt="Yoouz Live Photo Review View — Wolt"
                  className="w-full h-auto block object-cover"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
            {/* Stage 1: Real Desktop QR Handoff Screenshot */}
            <div className="rounded-xl border border-zinc-800 bg-black overflow-hidden flex flex-col justify-between shadow-2xl">
              <div>
                <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-white">01 · Desktop QR Handoff</span>
                  <span className="text-zinc-400">Instant Phone Launch</span>
                </div>
                <img
                  src="/pitch-assets/screen-2-desktop-qr-modal.png"
                  alt="Yoouz Desktop QR Code Camera Handoff Modal"
                  className="w-full h-64 object-cover object-center border-b border-zinc-800"
                />
              </div>
              <div className="p-4 bg-zinc-950 text-xs text-zinc-300 leading-relaxed">
                On desktop, clicking <span className="text-white font-bold">ADD REVIEW</span> displays a scannable QR code that opens the business directly on the user&apos;s phone camera.
              </div>
            </div>

            {/* Stage 2: Real Mobile 'Snap a Native Photo' Screenshot */}
            <div className="rounded-xl border-2 border-white bg-black overflow-hidden flex flex-col justify-between shadow-2xl">
              <div>
                <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-white">02 · Mobile Native Camera</span>
                  <span className="bg-white text-zinc-950 font-extrabold px-2 py-0.5 rounded text-[10px]">
                    NO GALLERY UPLOAD
                  </span>
                </div>
                <div className="bg-zinc-950 flex items-center justify-center p-2 border-b border-zinc-800">
                  <img
                    src="/pitch-assets/screen-4-mobile-camera-modal.png"
                    alt="Yoouz Mobile Snap a Native Photo Screen"
                    className="h-60 w-auto object-contain rounded-lg border border-zinc-800"
                  />
                </div>
              </div>
              <div className="p-4 bg-zinc-950 text-xs text-zinc-300 leading-relaxed">
                Tapping the white <span className="text-white font-bold">Open Camera</span> button triggers <code className="text-white">capture=&quot;environment&quot;</code>—opening the phone&apos;s real camera app with zero gallery roll uploads.
              </div>
            </div>

            {/* Stage 3: Exact Preview + 1–5 Whole Star Selector + Publish UI from CopoCreateModal.tsx */}
            <div className="rounded-xl border border-zinc-800 bg-black overflow-hidden flex flex-col justify-between shadow-2xl">
              <div>
                <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-white">03 · Preview, Rate 1–5 Stars & Publish</span>
                  <span className="text-amber-400 font-bold">★★★★★</span>
                </div>
                <div className="relative h-64 w-full bg-black overflow-hidden border-b border-zinc-800 flex flex-col justify-between p-3.5">
                  <img
                    src="/uploads/photos/rev_wolt_delivery_11_wolt_com.jpg"
                    alt="Captured Photo Preview"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/95 via-black/75 to-transparent pointer-events-none" />

                  {/* Top Reviewing Pill */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="px-3 py-1.5 rounded-xl bg-black/65 backdrop-blur-xl border border-white/15 text-white text-xs font-extrabold">
                      Reviewing · Wolt
                    </div>
                  </div>

                  {/* Bottom Whole-Star Selector & Retake / Publish Buttons */}
                  <div className="relative z-10 space-y-2.5">
                    <div className="p-2.5 rounded-xl bg-zinc-950/90 backdrop-blur-xl border border-white/15 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 mb-1">
                        Rate your experience (1–5 Whole Stars)
                      </div>
                      <div className="flex items-center justify-center gap-1.5 text-amber-400">
                        <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                        <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                        <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                        <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                        <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="px-3.5 py-2.5 rounded-xl bg-zinc-950/90 border border-white/20 text-white font-bold text-xs flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retake</span>
                      </div>
                      <div className="flex-1 py-2.5 px-3 rounded-xl bg-white text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-xl">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Publish Photo Review</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-zinc-950 text-xs text-zinc-300 leading-relaxed">
                Users select 1 to 5 solid whole stars and tap the white <span className="text-white font-bold">Publish Photo Review</span> button—live in under 3 seconds.
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Left 7 Cols: Real Live Screenshot of U/FCC8RS Reviewer Profile Drawer */}
            <div className="lg:col-span-7 rounded-xl border border-zinc-800 bg-black overflow-hidden flex flex-col justify-between shadow-2xl">
              <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs">
                <span className="font-bold text-white">Live Automatic Member Profile (`U/FCC8RS` on `jollibee.com.ph`)</span>
                <span className="text-zinc-300 font-semibold">Zero Email or Password Required</span>
              </div>
              <img
                src="/pitch-assets/screen-7-creator-u-handle.png"
                alt="Yoouz Automatic U/FCC8RS Member Profile Drawer"
                className="w-full h-auto block object-cover"
              />
              <div className="px-4 py-3 bg-zinc-950 border-t border-zinc-800 text-xs text-zinc-300 flex flex-wrap items-center justify-between gap-2">
                <span>Automatic <strong className="text-white">U/XXXXXX</strong> guest-to-member profile created the moment a user publishes or interacts</span>
                <span className="text-white font-bold">100% Privacy-First</span>
              </div>
            </div>

            {/* Right 5 Cols: Exact Post-Submit 'Claim Your Reviewer Handle' & 'Save Face ID / Passkey' UI */}
            <div className="lg:col-span-5 rounded-xl border-2 border-white bg-zinc-950 p-5 flex flex-col justify-between shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-white text-[11px] font-black uppercase tracking-wider">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Photo Review Live</span>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-semibold">Post-Publish Screen</span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">
                    Claim Your Reviewer Handle & Passkey
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Your review is live under <span className="text-white font-bold">U/FCC8RS</span>. Change to any custom username anytime—it stays saved forever—and lock your account with Face ID.
                  </p>
                </div>

                {/* Custom Username Box (Exact Match to CopoCreateModal) */}
                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                    Custom Username (Optional — Always Saved)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <AtSign className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <div className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs font-bold text-white">
                        nordicbite
                      </div>
                    </div>
                    <div className="px-3.5 py-2 rounded-xl bg-white text-zinc-950 font-black text-xs">
                      Claim
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-300 font-medium">
                    ✓ @nordicbite is available · Updates across all reviews & comments
                  </p>
                </div>

                {/* 1-Tap Face ID / Passkey Box (Exact Match to CopoCreateModal) */}
                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-200">
                    <ShieldCheck className="w-4 h-4 text-white" />
                    <span>Remember My Face Across Phones (Passkey)</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    No email, magic links, or passwords. Apple iCloud Keychain or Android Biometrics remembers your account automatically and unlocks your Verified Badge (✓).
                  </p>
                  <div className="w-full py-2.5 px-4 rounded-xl bg-white text-zinc-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg">
                    <ScanFace className="w-4 h-4" />
                    <span>Save Account with Face ID / Passkey</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
                <span>WebAuthn Hardware Biometrics</span>
                <span className="text-white font-bold">0.5s Account Recovery</span>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Left 8 Cols: Desktop Full View Highlighting Left Business Profile Drawer */}
            <div className="lg:col-span-8 rounded-xl overflow-hidden border border-zinc-800 bg-black shadow-2xl flex flex-col justify-between">
              <div>
                <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-white">Desktop Business Profile Hub + Photo Review (`wolt.com`)</span>
                  <span className="text-amber-400 font-bold">5.0 ★★★★★</span>
                </div>
                <img
                  src="/pitch-assets/screen-1-wolt-full.png"
                  alt="Yoouz Desktop Business Profile Hub and Photo Review"
                  className="w-full h-auto block object-cover"
                />
              </div>
              <div className="bg-zinc-950 border-t border-zinc-800 px-4 py-3 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Navigation className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                  <span>DIRECTIONS</span>
                </div>
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Phone className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                  <span>CALL</span>
                </div>
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Bookmark className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                  <span>SAVE</span>
                </div>
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Share2 className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                  <span>SHARE</span>
                </div>
                <div className="flex items-center gap-2 text-white font-semibold">
                  <MessageSquare className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                  <span>CHAT</span>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Real Mobile Business Profile Screenshot */}
            <div className="lg:col-span-4 rounded-xl overflow-hidden border border-zinc-800 bg-black shadow-2xl flex flex-col justify-between">
              <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs">
                <span className="font-bold text-white">Mobile Business Hub</span>
                <span className="text-zinc-400">iOS / Android PWA</span>
              </div>
              <div className="bg-zinc-950 flex items-center justify-center p-2 flex-1">
                <img
                  src="/pitch-assets/screen-3-mobile-view.png"
                  alt="Yoouz Mobile Business Profile View"
                  className="max-h-[410px] w-auto object-contain rounded-lg border border-zinc-800"
                />
              </div>
              <div className="px-4 py-3 bg-zinc-950 border-t border-zinc-800 text-xs text-zinc-300">
                Full mobile parity with bottom navigation (<strong className="text-white">Home · Search · Review · Messages · Profile</strong>).
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="rounded-xl overflow-hidden border border-zinc-800 bg-black shadow-2xl">
            <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-white">
                Live 3-Column Interface with Threaded Comments Drawer Open (`yoouz.com/reviews/wolt.com`)
              </span>
              <span className="text-zinc-300 font-semibold">
                Review: 20h ago · Comments: 15h ago, 9h ago & Reviewer Reply
              </span>
            </div>
            <img
              src="/pitch-assets/screen-5-wolt-comments.png"
              alt="Yoouz Threaded Comments Drawer Open on Wolt"
              className="w-full h-auto block object-cover"
            />
            <div className="bg-zinc-950 border-t border-zinc-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-300">
              <span>
                Every comment displays realistic chronological relative time (<strong className="text-white">15h ago</strong>, <strong className="text-white">9h ago</strong>) and highlights the photo author with a <strong className="text-white">Reviewer</strong> badge.
              </span>
              <span className="bg-white text-zinc-950 font-extrabold px-2.5 py-1 rounded">
                40 Reviews · 74 Comments · 100% DB Synced
              </span>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            {/* 6-Card Real Customer Photo Review Grid Across Local Venues & Global Domains */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                {
                  name: "Sephora",
                  domain: "sephora.com",
                  category: "Cosmetics · Web",
                  rating: "5.0",
                  author: "Aiko Tanaka ✓",
                  photo: "/uploads/photos/rev_sephora_cosmetics_15_sephora_com.jpg",
                },
                {
                  name: "Lerner & Rowe",
                  domain: "lernerandrowe.com",
                  category: "Injury Law · Legal",
                  rating: "5.0",
                  author: "Lucas ✓",
                  photo: "/uploads/photos/rev_lerner_21_lernerandrowe_com.jpg",
                },
                {
                  name: "Noma",
                  domain: "noma.dk",
                  category: "Fine Dining · Local",
                  rating: "5.0",
                  author: "NordicBite",
                  photo: "/uploads/photos/rev_noma_34_noma_dk.jpg",
                },
                {
                  name: "Hotel Julien",
                  domain: "hotel-julien.com",
                  category: "Boutique Hotel",
                  rating: "5.0",
                  author: "Rachel Brooks",
                  photo: "/uploads/photos/rev_hotel_julien_27_hotel_julien_com.jpg",
                },
                {
                  name: "Flipper Zero",
                  domain: "flipper.net",
                  category: "Hardware · Tech",
                  rating: "5.0",
                  author: "nightowl88",
                  photo: "/uploads/photos/rev_flipper_40_flipper_net.jpg",
                },
                {
                  name: "Healis Clinic",
                  domain: "healis.be",
                  category: "Healthcare Clinic",
                  rating: "5.0",
                  author: "GreenLeaf",
                  photo: "/uploads/photos/rev_healis_25_healis_be.jpg",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 flex flex-col justify-between shadow-lg"
                >
                  <div className="relative h-40 w-full bg-black">
                    <img
                      src={item.photo}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-[11px] font-extrabold text-amber-400">
                      ★ {item.rating}
                    </div>
                  </div>
                  <div className="p-2.5">
                    <div className="text-xs font-extrabold text-white truncate">{item.name}</div>
                    <div className="text-[10px] text-zinc-400 truncate">{item.domain}</div>
                    <div className="text-[10px] text-zinc-300 font-semibold mt-1 truncate">
                      {item.category}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Universal URL / Domain Auto-Resolver Banner */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-zinc-950 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    Universal Domain & Local Venue Intelligence Engine
                  </div>
                  <div className="text-xs text-zinc-300 mt-0.5">
                    Type any website URL or street business—Yoouz automatically extracts official logos, cover banners, descriptions, and generates 75+ language SEO landing pages.
                  </div>
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs font-mono text-white">
                yoouz.com/reviews/&#123;any-domain&#125;
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
            {/* Left: Real Screenshot of Yoouz Business Portal (/business) */}
            <div className="rounded-xl overflow-hidden border border-zinc-800 bg-black shadow-2xl flex flex-col justify-between">
              <div>
                <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-white">Official Business Portal (`yoouz.com/business`)</span>
                  <span className="text-zinc-300 font-semibold">100% Private Owner Email Policy</span>
                </div>
                <img
                  src="/pitch-assets/screen-9-business-portal.png"
                  alt="Sign in to Yoouz Business Portal"
                  className="w-full h-auto block object-cover"
                />
              </div>
              <div className="p-4 bg-zinc-950 border-t border-zinc-800 text-xs text-zinc-300 leading-relaxed">
                Business owners verify ownership via official work email. Public profiles show the <strong className="text-white">Verified Business</strong> badge while never exposing personal owner emails.
              </div>
            </div>

            {/* Right: Real Screenshot of Point-of-Sale QR Review Stand / Handoff */}
            <div className="rounded-xl overflow-hidden border border-zinc-800 bg-black shadow-2xl flex flex-col justify-between">
              <div>
                <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-white">Point-of-Sale QR Stand & Instant Camera Launch</span>
                  <span className="bg-white text-zinc-950 font-extrabold px-2 py-0.5 rounded text-[10px]">
                    $0 CAC VIRAL LOOP
                  </span>
                </div>
                <img
                  src="/pitch-assets/screen-2-desktop-qr-modal.png"
                  alt="Yoouz QR Code Camera Handoff"
                  className="w-full h-auto block object-cover"
                />
              </div>
              <div className="p-4 bg-zinc-950 border-t border-zinc-800 text-xs text-zinc-300 leading-relaxed">
                Merchants place QR stands on tables and checkout counters and embed <code className="text-white">&lt;script src=&quot;https://yoouz.com/embed.js&quot;&gt;</code> widgets on their websites.
              </div>
            </div>
          </div>
        );

      case 8:
      default:
        return (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6 space-y-5">
            {/* Competitive & Unit Economics Matrix (Pure Black & White Dark Mode) */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="py-3 px-3 font-semibold">Platform / Dimension</th>
                    <th className="py-3 px-3 font-semibold">Google / Yelp / Trustpilot</th>
                    <th className="py-3 px-3 font-semibold">60s Video Review Apps</th>
                    <th className="py-3 px-3 font-extrabold text-white bg-zinc-900 border-x border-t border-zinc-700">
                      Yoouz (Live Photo Standard)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 text-zinc-300 tabular-nums">
                  <tr>
                    <td className="py-3 px-3 font-bold text-white">Review Format & Speed</td>
                    <td className="py-3 px-3">Text Paragraphs (3–5 mins)</td>
                    <td className="py-3 px-3">60s Selfie Video (High Friction)</td>
                    <td className="py-3 px-3 font-extrabold text-white bg-zinc-900 border-x border-zinc-700">
                      1 Live Photo + 1–5 Whole Stars (3 Seconds)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-white">Anti-Fake Authenticity</td>
                    <td className="py-3 px-3 text-zinc-400">Easily Faked by Bots & Rivals</td>
                    <td className="py-3 px-3">Authentic but 99% Drop-Off</td>
                    <td className="py-3 px-3 font-extrabold text-white bg-zinc-900 border-x border-zinc-700">
                      Native Phone Camera Only (No Gallery Uploads)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-white">User Onboarding</td>
                    <td className="py-3 px-3">Email + Password + OTP</td>
                    <td className="py-3 px-3">App Store Download + Sign-Up</td>
                    <td className="py-3 px-3 font-extrabold text-white bg-zinc-900 border-x border-zinc-700">
                      Zero Email/Password → Auto U/XXXXXX → Face ID Passkey
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-white">File Size & Infra Cost</td>
                    <td className="py-3 px-3">Text Only (Zero Visual Proof)</td>
                    <td className="py-3 px-3 text-zinc-400">10+ MB Video + Transcoding</td>
                    <td className="py-3 px-3 font-extrabold text-white bg-zinc-900 border-x border-b border-zinc-700">
                      ~120 KB Sharp JPEG on Bunny.net (98.5% Cheaper)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* B2B SaaS Tiers (Pure Black & White Dark Mode) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
                <div className="text-xs font-bold text-zinc-400">TIER 01 · PUBLIC PROFILE</div>
                <div className="text-xl font-black text-white mt-1 tabular-nums">$0 / forever</div>
                <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">
                  Auto-indexed business profile, aggregate whole-star score, and unlimited customer live photo reviews.
                </p>
              </div>
              <div className="rounded-xl border-2 border-white bg-zinc-900 p-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white">TIER 02 · CLAIMED BUSINESS PRO</span>
                  <span className="bg-white text-zinc-950 text-[10px] font-black px-2 py-0.5 rounded">
                    CORE SAAS
                  </span>
                </div>
                <div className="text-xl font-black text-white mt-1 tabular-nums">$49 / month</div>
                <p className="text-xs text-zinc-200 mt-1.5 leading-relaxed">
                  Verified Business badge, Direct Customer Chat Inbox, Official Owner Replies, Analytics & Tabletop QR Stand Kit.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-700 bg-zinc-900/90 p-4">
                <div className="text-xs font-extrabold text-amber-400">TIER 03 · GROWTH & WEBSITE WIDGET</div>
                <div className="text-xl font-black text-white mt-1 tabular-nums">$149 / month</div>
                <p className="text-xs text-zinc-200 mt-1.5 leading-relaxed">
                  Unlimited Embeddable Website Photo Carousels, Branded Social Ad Card Exporter & Multi-Location Priority Placement.
                </p>
              </div>
            </div>
          </div>
        );
    }
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

      {/* Top Executive Utility Bar (Natural Dark Mode Black & White) */}
      <header className="w-full h-14 bg-[#09090B] border-b border-zinc-800 px-3 sm:px-5 flex items-center justify-between gap-4 shrink-0 z-40 select-none">
        {/* Left: Back, Sidebar Toggle, Brand Title */}
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
            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
              isSidebarOpen
                ? "bg-white text-zinc-950 border-white"
                : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white"
            }`}
            title="Toggle 8-Page Slide Navigator"
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 ml-1 truncate">
            <span className="text-sm font-black tracking-tight text-white whitespace-nowrap">Yoouz</span>
            <span className="text-zinc-600 text-xs">·</span>
            <span className="text-xs font-semibold text-zinc-300 truncate">
              Investor Pitch Deck (1 Live Photo = 1,000 Words)
            </span>
          </div>
        </div>

        {/* Center: View Switcher, Slide Stepper & Zoom */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mode Switcher: Interactive HD Deck vs PDF View */}
          <div className="hidden md:flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("interactive")}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === "interactive"
                  ? "bg-white text-zinc-950"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Interactive HD Deck
            </button>
            <button
              type="button"
              onClick={() => setViewMode("pdf")}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === "pdf"
                  ? "bg-white text-zinc-950"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              PDF Document View
            </button>
          </div>

          {/* Page Stepper */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-1.5 py-1 gap-1">
            <button
              type="button"
              onClick={() => scrollToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
              title="Previous Slide"
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
              title="Next Slide"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-1.5 py-1 gap-1">
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

        {/* Right: Download PDF & Fullscreen */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/api/pitch/raw-pdf?download=1"
            download="Yoouz_Visual_Investor_Pitch_Deck.pdf"
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </a>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative bg-[#09090B]">
        {/* Left 8-Page Navigator Sidebar */}
        {isSidebarOpen && (
          <aside className="w-60 sm:w-68 bg-[#09090B] border-r border-zinc-800 flex flex-col shrink-0 z-30 overflow-y-auto p-3 space-y-2 select-none">
            <div className="text-[11px] font-bold tracking-wider text-zinc-400 px-1 pb-2 border-b border-zinc-800 flex items-center justify-between">
              <span>8-Page Investor Deck</span>
              <span className="text-white font-extrabold">Photo-First</span>
            </div>

            {PITCH_SLIDES.map((slide) => {
              const isActive = currentPage === slide.page;
              return (
                <button
                  key={slide.page}
                  type="button"
                  onClick={() => {
                    scrollToPage(slide.page);
                    if (window.innerWidth < 640) setIsSidebarOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl flex items-start gap-2.5 text-left transition-all cursor-pointer ${
                    isActive
                      ? "bg-zinc-900 border-2 border-white shadow-lg"
                      : "hover:bg-zinc-900/60 border border-zinc-800/50"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-md text-xs font-extrabold tabular-nums flex items-center justify-center shrink-0 mt-0.5 ${
                      isActive
                        ? "bg-white text-zinc-950"
                        : "bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    0{slide.page}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-xs font-bold leading-snug ${
                        isActive ? "text-white" : "text-zinc-300"
                      }`}
                    >
                      {slide.shortTitle}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                      Live App Screens & Breakdown
                    </div>
                  </div>
                </button>
              );
            })}
          </aside>
        )}

        {/* Scrollable Deck Viewport */}
        <div
          ref={scrollContainerRef}
          className="flex-1 h-full overflow-y-auto p-4 sm:p-8 flex flex-col items-center custom-scrollbar bg-[#09090B]"
        >
          {viewMode === "interactive" ? (
            <div
              style={{
                width: "100%",
                maxWidth: `${Math.round(1120 * (zoomLevel / 100))}px`,
              }}
              className="space-y-10 pb-16 transition-all duration-150"
            >
              {PITCH_SLIDES.map((slide, idx) => (
                <section
                  key={slide.page}
                  ref={(el) => {
                    pageRefs.current[idx] = el as HTMLDivElement | null;
                  }}
                  data-page-num={slide.page}
                  className="rounded-2xl bg-[#111215] border border-zinc-800 shadow-2xl overflow-hidden"
                >
                  {/* Slide Top Ribbon */}
                  <div className="px-5 sm:px-8 py-3.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between gap-4">
                    <span className="text-xs font-extrabold tracking-wider text-zinc-200">
                      {slide.kicker}
                    </span>
                    <span className="text-xs font-extrabold text-white bg-zinc-800 border border-zinc-700 px-2.5 py-0.5 rounded tabular-nums">
                      PAGE 0{slide.page} OF 08
                    </span>
                  </div>

                  {/* Slide Body */}
                  <div className="p-5 sm:p-8 space-y-6">
                    {/* Headline & Subheadline */}
                    <div className="max-w-4xl">
                      <h2
                        style={{ textWrap: "balance" } as React.CSSProperties}
                        className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight"
                      >
                        {slide.headline}
                      </h2>
                      <p className="text-sm sm:text-base text-zinc-300 mt-2.5 leading-relaxed">
                        {slide.subheadline}
                      </p>
                    </div>

                    {/* Clean Unobstructed HD Visual Showcase (Zero Overlapping Floating Circles) */}
                    {renderSlideVisualShowcase(slide)}

                    {/* 4 Numbered Screen & Button Explanation Cards */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-extrabold tracking-wider text-white uppercase">
                          Complete Screen & Workflow Breakdown
                        </span>
                        <span className="text-xs text-zinc-400 font-medium">
                          4 Core Pillars Explained
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {slide.callouts.map((c) => (
                          <div
                            key={c.id}
                            className="text-left p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-3.5"
                          >
                            <span className="w-7 h-7 rounded-lg bg-white text-zinc-950 text-xs font-black tabular-nums flex items-center justify-center shrink-0 mt-0.5">
                              0{c.id}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="text-sm font-extrabold text-white">
                                  {c.title}
                                </h3>
                                <span className="text-[11px] font-mono font-semibold text-zinc-200 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded">
                                  {c.badgeText}
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

                    {/* Bottom 3-Column Quantitative Proof Strip */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-800">
                      {slide.metrics.map((m, mIdx) => (
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
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            {m.detail}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              {isLoadingPdf && (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-400">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                  <span className="text-sm font-semibold text-white">
                    Rendering 8-Page Investor Pitch PDF...
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
