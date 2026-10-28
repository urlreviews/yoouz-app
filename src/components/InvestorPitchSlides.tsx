import React from "react";
import {
  ShieldCheck,
  Video,
  Store,
  Zap,
  MapPin,
  CheckCircle2,
  Lock,
  QrCode,
  Share2,
  MessageSquare,
  Sparkles,
  Layers,
  ArrowRight,
  Globe,
  Star,
  Check,
  Smartphone,
  ChevronRight,
  TrendingUp,
  BarChart3
} from "lucide-react";

interface SlideProps {
  pageNum: number;
}

export const InvestorPitchSlide: React.FC<SlideProps> = ({ pageNum }) => {
  // Page 1 is Dark Cover theme; Pages 2-18 are Light Canvas Theme matching PDF 1:1
  const isDarkCover = pageNum === 1;

  return (
    <div
      className={`w-full h-full p-5 sm:p-7 flex flex-col justify-between font-sans relative overflow-hidden select-none ${
        isDarkCover
          ? "bg-[#0B0F19] text-slate-100 border border-slate-800"
          : "bg-[#F8FAFC] text-slate-900 border border-slate-200 shadow-sm"
      }`}
    >
      {/* Background Subtle Accent */}
      {isDarkCover && (
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      )}

      {/* Slide Content Router */}
      <div className="flex-1 flex flex-col justify-between relative z-10 min-h-0">
        {pageNum === 1 && <Slide1 />}
        {pageNum === 2 && <Slide2 />}
        {pageNum === 3 && <Slide3 />}
        {pageNum === 4 && <Slide4 />}
        {pageNum === 5 && <Slide5 />}
        {pageNum === 6 && <Slide6 />}
        {pageNum === 7 && <Slide7 />}
        {pageNum === 8 && <Slide8 />}
        {pageNum === 9 && <Slide9 />}
        {pageNum === 10 && <Slide10 />}
        {pageNum === 11 && <Slide11 />}
        {pageNum === 12 && <Slide12 />}
        {pageNum === 13 && <Slide13 />}
        {pageNum === 14 && <Slide14 />}
        {pageNum === 15 && <Slide15 />}
        {pageNum === 16 && <Slide16 />}
        {pageNum === 17 && <Slide17 />}
        {pageNum === 18 && <Slide18 />}
      </div>

      {/* Running Footer across all slides matching original PDF */}
      <div
        className={`pt-2.5 mt-2 flex items-center justify-between text-[10px] sm:text-[11px] font-medium relative z-10 shrink-0 border-t ${
          isDarkCover
            ? "border-slate-800 text-slate-400"
            : "border-slate-200 text-slate-500"
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Yoouz Inc.
          </span>
          <span>•</span>
          <span className="truncate">Confidential Investor Memorandum</span>
          <span>•</span>
          <span className="text-blue-600 dark:text-blue-400 font-mono">
            yoouz.com
          </span>
        </div>
        <div className="shrink-0 font-semibold text-slate-700 dark:text-slate-300">
          Page {pageNum} of 18
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// Slide 1: Cover / Executive Thesis (Dark Theme)
// ----------------------------------------------------------------------
const Slide1: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <Star className="w-4 h-4 fill-white text-white" />
        </div>
        <span className="px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-400 text-[10px] font-bold tracking-widest uppercase">
          CONFIDENTIAL • SERIES SEED
        </span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-none mb-2">
        See the Truth
        <br />
        Before You Decide.
      </h1>
      <p className="text-xs sm:text-sm text-slate-400 font-medium mb-5 max-w-xl">
        The Next-Generation Video Review & Trust Protocol for Local Commerce,
        Consumer Places, and E-Commerce.
      </p>

      <div className="bg-[#111625] border border-blue-900/40 rounded-xl p-4 sm:p-5 mb-4 space-y-2.5">
        <div className="text-[11px] font-bold tracking-wider text-blue-400 uppercase">
          EXECUTIVE THESIS & FOUNDATIONAL MANDATE
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Online text reviews have suffered an irreversible crisis of trust. With
          generative AI models, automated click-farms, and negative reputation
          extortion, consumers can no longer distinguish authentic opinions from
          fraudulent propaganda.
        </p>
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-white">Yoouz solves this $152B global trust crisis</strong>{" "}
          through an unbreachable hardware-level protocol: mandatory 60-second
          front-camera live video reviews, zero gallery uploads, and instant
          edge streaming powered by Bunny.net. By replacing static text with
          verified human faces and real-time voice, Yoouz creates the immutable
          proof-of-authenticity standard for modern commerce.
        </p>
      </div>
    </div>

    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-[#111625] border border-slate-800 rounded-xl p-3">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            AUTHENTICITY
          </div>
          <div className="text-lg font-extrabold text-emerald-400 mt-0.5">
            100% Live
          </div>
          <div className="text-[10px] text-slate-400 leading-tight mt-1">
            Zero gallery uploads, front camera only
          </div>
        </div>

        <div className="bg-[#111625] border border-slate-800 rounded-xl p-3">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            VIDEO PROTOCOL
          </div>
          <div className="text-lg font-extrabold text-blue-400 mt-0.5">
            60 Seconds
          </div>
          <div className="text-[10px] text-slate-400 leading-tight mt-1">
            High-signal, maximum retention format
          </div>
        </div>

        <div className="bg-[#111625] border border-slate-800 rounded-xl p-3">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            B2B SUITE
          </div>
          <div className="text-lg font-extrabold text-purple-400 mt-0.5">
            $149 / mo
          </div>
          <div className="text-[10px] text-slate-400 leading-tight mt-1">
            Claiming, table QR stands & ad exports
          </div>
        </div>

        <div className="bg-[#111625] border border-slate-800 rounded-xl p-3">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            INFRASTRUCTURE
          </div>
          <div className="text-lg font-extrabold text-cyan-400 mt-0.5">
            Bunny Edge
          </div>
          <div className="text-[10px] text-slate-400 leading-tight mt-1">
            Low-cost multi-bitrate HLS streaming
          </div>
        </div>
      </div>

      <div className="bg-[#111625] border border-amber-500/30 rounded-xl p-3">
        <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
          INVESTOR HIGHLIGHT • CONFIDENTIAL COMPREHENSIVE MEMORANDUM
        </div>
        <p className="text-[11px] text-slate-300">
          Yoouz Inc. • Head of Product & Executive Engineering • Web Application
          Live: yoouz.com
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          Strictly Confidential. Presented to Select Institutional Investors,
          Venture Partners, and Strategic Acquirers.
        </p>
      </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 2: Strategic Overview & TOC (Light Theme)
// ----------------------------------------------------------------------
const Slide2: React.FC = () => {
  const sections = [
    { num: "01", title: "Executive Summary & Platform Thesis", page: "2" },
    { num: "02", title: "The Macro Crisis: The Fake Review Collapse", page: "3" },
    { num: "03", title: "The Yoouz Solution: The 60-Second Video Protocol", page: "4" },
    { num: "04", title: "Mobile PWA Experience & Real-Time Discovery", page: "5" },
    { num: "05", title: "Immersive Video Player & Social Interaction Rail", page: "6" },
    { num: "06", title: "Community Graph & Direct Friend Sharing", page: "7" },
    { num: "07", title: "Interactive Comments & Inquiry Drawer", page: "8" },
    { num: "08", title: "Business Profile Architecture & Action Portal", page: "9" },
    { num: "09", title: "The Recording Studio: Hardware Camera Lock", page: "10" },
    { num: "10", title: "Interactive Map & Geolocation Discovery", page: "11" },
    { num: "11", title: "B2B Merchant Suite: Verification & Claiming", page: "12" },
    { num: "12", title: "B2B Growth Tools: Table QR Stands & Viral Capture", page: "13" },
    { num: "13", title: "Branded Ad Exporter & 1-Click Video Embeds", page: "14" },
    { num: "14", title: "Technical Architecture: Bunny Stream & PostgreSQL", page: "15" },
    { num: "15", title: "Business Model, Pricing Tiers & Unit Economics", page: "16" },
    { num: "16", title: "Competitive Moat: Why Yelp & Google Cannot Pivot", page: "17" },
    { num: "17", title: "Execution Roadmap, Capital Allocation & Investment", page: "18" }
  ];

  return (
    <div className="flex flex-col justify-between h-full py-1">
      <div>
        <div className="flex items-center justify-between mb-1.5 border-b border-slate-200 pb-1">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
            01 • DOCUMENT STRUCTURE
          </span>
          <span className="text-[10px] font-semibold text-slate-500 uppercase">
            YOOUZ • CONFIDENTIAL INVESTOR MEMORANDUM
          </span>
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 mb-0.5">
          Strategic Overview & Table of Contents
        </h2>
        <p className="text-xs text-slate-500 mb-3">
          Complete 18-Section Institutional Breakdown of the Yoouz Technology and Business Platform.
        </p>

        <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 mb-3">
          <div className="text-[10px] font-bold text-sky-800 uppercase tracking-wider mb-0.5">
            PLATFORM SYNOPSIS
          </div>
          <p className="text-[11px] text-slate-700 leading-relaxed">
            Yoouz unites the virality and engagement of vertical video (TikTok/Instagram Reels) with the high-intent utility and commercial intent of local business directories (Google Maps/Yelp). By enforcing front-camera proof-of-human reviews and delivering a comprehensive B2B SaaS suite, Yoouz captures massive value from consumers and merchants simultaneously.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-3">
          {sections.map((sec) => (
            <div
              key={sec.num}
              className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">
                  {sec.num}
                </span>
                <span className="text-slate-800 font-medium truncate text-[11px]">
                  {sec.title}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold shrink-0 ml-1">
                Page {sec.page}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0B0F19] text-white rounded-xl p-3.5 space-y-1.5">
        <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
          KEY AT-A-GLANCE INVESTMENT METRICS
        </div>
        <ul className="text-[11px] text-slate-300 space-y-1">
          <li>• <strong>Total Addressable Market:</strong> $152B Global Online Review & Local Advertising Market</li>
          <li>• <strong>Primary Monetization:</strong> $149/month B2B SaaS Recurring Merchant Subscription ($1,788 ACV)</li>
          <li>• <strong>High Gross Margins:</strong> &gt;88% Gross Margin achieved via ultra-lean Bunny.net video transcode economics</li>
          <li>• <strong>Production Status:</strong> 100% Fully Built & Deployed PWA with zero conceptual mockups.</li>
        </ul>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// Slide 3: The Market Problem (Light Theme)
// ----------------------------------------------------------------------
const Slide3: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="flex items-center justify-between mb-1.5 border-b border-slate-200 pb-1">
        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
          02 • PROBLEM SPACE
        </span>
        <span className="text-[10px] font-semibold text-slate-500 uppercase">
          YOOUZ • CONFIDENTIAL INVESTOR MEMORANDUM
        </span>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-0.5">
        The Market Problem: The Fake Review Crisis
      </h2>
      <p className="text-xs text-slate-500 mb-3">
        Over 93% of purchasing decisions are shaped by online reviews, yet trust in text ratings has collapsed.
      </p>

      <div className="space-y-2.5 mb-3">
        <div className="bg-white border border-rose-200 rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
          <div className="max-w-[70%]">
            <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-0.5">
              CRISIS 01
            </div>
            <div className="text-xs font-extrabold text-slate-900 mb-1">
              Generative AI & Synthetic Bot Farms
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Large language models enable bad actors to churn out thousands of convincing 5-star reviews or launch devastating automated smear campaigns against competitors in seconds. Star ratings have lost all credibility.
            </p>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center min-w-[120px]">
            <div className="text-xl font-black text-rose-600 tabular-nums">42% - 54%</div>
            <div className="text-[9px] text-rose-700 font-medium leading-tight mt-0.5">
              Estimated fake or AI-generated reviews on legacy platforms
            </div>
          </div>
        </div>

        <div className="bg-white border border-amber-200 rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
          <div className="max-w-[70%]">
            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-0.5">
              CRISIS 02
            </div>
            <div className="text-xs font-extrabold text-slate-900 mb-1">
              Reputational Extortion & Fraud
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Anonymous accounts weaponize negative 1-star reviews on Google Maps and Yelp to extort restaurant owners and contractors. Honest small businesses are forced into paying dubious "reputation management" agencies.
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center min-w-[120px]">
            <div className="text-xl font-black text-amber-600 tabular-nums">$152 Billion</div>
            <div className="text-[9px] text-amber-800 font-medium leading-tight mt-0.5">
              Annual global cost of fraudulent reviews to legitimate merchants
            </div>
          </div>
        </div>

        <div className="bg-white border border-purple-200 rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
          <div className="max-w-[70%]">
            <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-0.5">
              CRISIS 03
            </div>
            <div className="text-xs font-extrabold text-slate-900 mb-1">
              The Visual Disconnect for Gen-Z
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Modern digital natives refuse to read unverified walls of text. Consumers want to see the real lighting, portion size, cleanliness, and ambiance, and hear the genuine tone of voice of a real person.
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center min-w-[120px]">
            <div className="text-lg font-black text-purple-700 tabular-nums">84% of Gen-Z</div>
            <div className="text-[9px] text-purple-800 font-medium leading-tight mt-0.5">
              Prefer short-form video over text when researching dining & shopping
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-[#0B0F19] text-white rounded-xl p-3.5 space-y-1.5">
      <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
        WHY INCUMBENTS ARE STRUCTURALLY PARALYZED
      </div>
      <ul className="text-[11px] text-slate-300 space-y-1">
        <li>• <strong>Google Maps & Yelp:</strong> Built on legacy text databases from 2004. Switching to mandatory live video would invalidate 99.8% of their historical review catalogs and disrupt their core ad auctions.</li>
        <li>• <strong>TikTok & Instagram:</strong> Optimized for viral influencer algorithms, sponsored PR entertainment, and passive viewing — not structured business directories, verified locations, or authenticated reviews.</li>
        <li>• <strong>TripAdvisor & Trustpilot:</strong> Stuck in subscription paywall conflicts where paying enterprise brands negotiate removal of critical reviews, destroying independent credibility.</li>
      </ul>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 4: The Solution (Light Theme)
// ----------------------------------------------------------------------
const Slide4: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="flex items-center justify-between mb-1.5 border-b border-slate-200 pb-1">
        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
          03 • THE PROTOCOL
        </span>
        <span className="text-[10px] font-semibold text-slate-500 uppercase">
          YOOUZ • CONFIDENTIAL INVESTOR MEMORANDUM
        </span>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-0.5">
        The Solution: The 60-Second Video Protocol
      </h2>
      <p className="text-xs text-slate-500 mb-3">
        Replacing anonymous text with unhackable, proof-of-authenticity short-form video.
      </p>

      <div className="space-y-2 mb-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-2xs">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">RULE 01</span>
              <span className="text-xs font-bold text-slate-900">Mandatory Front-Camera Selfie Capture</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Reviewers must look directly into the camera in real-time. Facial expressions, vocal inflection, and real human micro-cues create an insurmountable barrier against bots and AI synthesis.
            </p>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold shrink-0 ml-3">
            ANTI-DEEPFAKE
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-2xs">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">RULE 02</span>
              <span className="text-xs font-bold text-slate-900">Zero Gallery Uploads (Strictly Enforced)</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Importing pre-recorded video clips, marketing agency promotional b-roll, or downloaded files is technically barred at the application layer. The review must be filmed live on-site.
            </p>
          </div>
          <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 text-[10px] font-extrabold shrink-0 ml-3">
            TAMPER-PROOF
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-2xs">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">RULE 03</span>
              <span className="text-xs font-bold text-slate-900">Strict 60-Second Video Limit</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Reviews are strictly capped at 60 seconds. This enforces concise, high-density feedback, eliminates fluff, and guarantees 90%+ video completion rates on mobile devices.
            </p>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold shrink-0 ml-3">
            HIGH-SIGNAL
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-2xs">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">RULE 04</span>
              <span className="text-xs font-bold text-slate-900">Edge Transcode & Smart Captions</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Recorded videos are immediately processed at the edge via Bunny Stream Smart Captions, generating dynamic synchronized subtitles for 100% sound-off accessibility.
            </p>
          </div>
          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-extrabold shrink-0 ml-3">
            BUNNY STREAM
          </span>
        </div>
      </div>
    </div>

    <div className="bg-slate-100 border border-slate-300 rounded-xl p-3.5 text-center">
      <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">
        THE SELF-REINFORCING YOOUZ TRUST FLYWHEEL
      </div>
      <div className="space-y-1.5 text-left text-[11px] text-slate-800 font-medium">
        <div className="p-1.5 rounded bg-white border border-slate-200">
          <strong>1. On-Site Live Capture:</strong> Customers scan table QR code or open PWA and film 60s verdict using front camera.
        </div>
        <div className="p-1.5 rounded bg-white border border-slate-200">
          <strong>2. Low-Latency Transcode:</strong> Bunny Stream transcodes video into adaptive multi-bitrate HLS with dynamic subtitles.
        </div>
        <div className="p-1.5 rounded bg-white border border-slate-200">
          <strong>3. High-Intent Discovery:</strong> Consumers discover authentic reviews via search, map pins, and trending feeds.
        </div>
        <div className="p-1.5 rounded bg-white border border-slate-200">
          <strong>4. Merchant ROI & Claim:</strong> Businesses claim their profile, respond to reviews, embed widgets, and export ads.
        </div>
        <div className="p-1.5 rounded bg-white border border-slate-200">
          <strong>5. Creator Rewards & Following:</strong> Reviewers gain trusted Local Guide badges, followers, and organic social influence.
        </div>
      </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 5: Consumer Experience & PWA (Light Theme)
// ----------------------------------------------------------------------
const Slide5: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="flex items-center justify-between mb-1.5 border-b border-slate-200 pb-1">
        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
          04 • PRODUCT WALKTHROUGH
        </span>
        <span className="text-[10px] font-semibold text-slate-500 uppercase">
          YOOUZ • CONFIDENTIAL INVESTOR MEMORANDUM
        </span>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-0.5">
        Consumer Experience: Mobile PWA & Discovery
      </h2>
      <p className="text-xs text-slate-500 mb-3">
        Ultra-fast Progressive Web App delivering native performance without App Store friction.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 items-center">
        <div className="space-y-2 text-[11px]">
          <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 text-xs">
            Homepage Architecture & Search
          </div>
          <div>
            <strong className="text-blue-700">Pure OLED Dark Canvas:</strong>
            <p className="text-slate-600">
              Immersive #000000 theme highlights vibrant video thumbnails and conserves battery life.
            </p>
          </div>
          <div>
            <strong className="text-blue-700">Instant Search (&lt;12ms):</strong>
            <p className="text-slate-600">
              Unified search bar queries businesses, products, services, cities, and creators in milliseconds.
            </p>
          </div>
          <div>
            <strong className="text-blue-700">Active Flashing Caret (|):</strong>
            <p className="text-slate-600">
              iOS/Android native focus synchronization opens keyboard immediately upon tap with electric blue indicator.
            </p>
          </div>
          <div>
            <strong className="text-blue-700">Trending Video Carousel:</strong>
            <p className="text-slate-600">
              Top-rated 5.0 and verified local reviews showcased with creator badges and star counts.
            </p>
          </div>
          <div>
            <strong className="text-blue-700">One-Tap Review Launch:</strong>
            <p className="text-slate-600">
              Center camera icon on bottom nav launches direct recording without navigating multiple screens.
            </p>
          </div>
          <div>
            <strong className="text-blue-700">Zero App Store Barrier:</strong>
            <p className="text-slate-600">
              PWA technology eliminates 200MB app downloads, boosting table QR conversion by 8x.
            </p>
          </div>
        </div>

        {/* Mobile Mockup Phone Frame */}
        <div className="bg-black text-white p-3 rounded-2xl border-4 border-slate-800 shadow-xl max-w-[210px] mx-auto text-[10px]">
          <div className="flex justify-between items-center text-[8px] text-slate-400 mb-2">
            <span>10:28</span>
            <div className="flex items-center gap-1">
              <span>5G</span>
              <div className="w-3 h-1.5 bg-white rounded-xs" />
            </div>
          </div>

          <div className="text-center font-bold text-xs mb-1">See the Truth</div>
          <div className="text-center font-bold text-xs mb-2">Before You Decide.</div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 mb-2 flex items-center gap-1">
            <span className="text-blue-400">🔍</span>
            <span className="text-zinc-400">Search any business, service...</span>
          </div>

          <div className="text-[9px] font-bold text-zinc-400 mb-1">TRENDING VIDEO REVIEWS</div>
          <div className="grid grid-cols-2 gap-1 mb-2">
            <div className="bg-zinc-900 rounded p-1 border border-zinc-800 text-center">
              <span className="text-amber-400">★ 5.0</span>
              <div className="text-[8px] text-zinc-400 truncate">yoouz.com</div>
            </div>
            <div className="bg-zinc-900 rounded p-1 border border-zinc-800 text-center">
              <span className="text-amber-400">★ 5.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-[#0B0F19] text-white rounded-xl p-3.5 space-y-2">
      <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
        WHY MOBILE PWA ARCHITECTURE WINS IN LOCAL COMMERCE
      </div>
      <p className="text-[11px] text-slate-300 leading-relaxed">
        When diners sit at a restaurant table or shoppers explore a boutique, asking them to download a 200MB native iOS or Android app from the App Store results in a fatal 85%+ drop-off. Users do not want another icon cluttering their home screen for a single visit.
      </p>
      <p className="text-[11px] text-slate-300 leading-relaxed">
        Yoouz solves this with an instant-load Progressive Web App (PWA). A customer scans a QR code, the camera initializes in under 1 second directly within the browser, and the 60-second video review is recorded and uploaded immediately. Service workers cache app shell assets for instant sub-second returns.
      </p>
      <div className="flex gap-2 pt-1">
        <span className="px-2.5 py-1 rounded bg-blue-900/60 border border-blue-500/40 text-blue-300 text-[10px] font-bold">
          8X HIGHER CONVERSION
        </span>
        <span className="px-2.5 py-1 rounded bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
          0 APP STORE COMMISSIONS
        </span>
      </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 6: Immersive Vertical Video Player (Light Theme)
// ----------------------------------------------------------------------
const Slide6: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="flex items-center justify-between mb-1.5 border-b border-slate-200 pb-1">
        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
          05 • VIDEO ENGINE
        </span>
        <span className="text-[10px] font-semibold text-slate-500 uppercase">
          YOOUZ • CONFIDENTIAL INVESTOR MEMORANDUM
        </span>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-0.5">
        The Immersive Vertical Video Player
      </h2>
      <p className="text-xs text-slate-500 mb-3">
        Full-screen gesture-driven video feed with contextual brand pills and dynamic captions.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 items-center">
        <div className="space-y-2 text-[11px]">
          <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 text-xs">
            Player UX & Engagement Rails
          </div>
          <div>
            <strong className="text-blue-700">Translucent Brand Pill:</strong>
            <p className="text-slate-600">
              Upper glassmorphism badge displays business name, verified checkmark, rating, and direct profile navigation.
            </p>
          </div>
          <div>
            <strong className="text-blue-700">Right-Side Social Action Rail:</strong>
            <p className="text-slate-600">
              Includes creator avatar with "+ Follow" shortcut, Like counter, Comments drawer trigger, Bookmark save, and Share modal.
            </p>
          </div>
          <div>
            <strong className="text-blue-700">Bunny Stream Smart Captions:</strong>
            <p className="text-slate-600">
              Edge-synchronized subtitles guarantee viewer retention even in public spaces with volume muted.
            </p>
          </div>
          <div>
            <strong className="text-blue-700">Vertical Snap Navigation:</strong>
            <p className="text-slate-600">
              Smooth swipe-up / swipe-down physics with pre-caching ensures zero buffering latency between reviews.
            </p>
          </div>
          <div>
            <strong className="text-blue-700">Direct Comparison Action:</strong>
            <p className="text-slate-600">
              Enables side-by-side split screen comparing two competing video reviews simultaneously.
            </p>
          </div>
        </div>

        {/* 9:16 Video Player Mockup */}
        <div className="bg-black text-white p-3 rounded-2xl border-4 border-slate-800 shadow-xl max-w-[200px] mx-auto text-[10px] relative aspect-[9/16] flex flex-col justify-between">
          <div className="bg-white/10 backdrop-blur-md rounded-full px-2 py-1 flex items-center justify-between text-[9px]">
            <span className="font-bold truncate">Cetaphil ✓</span>
            <span className="text-amber-400">★ 5.0</span>
          </div>

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 text-xs">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center font-bold text-[9px]">+</div>
            <span>♡</span>
            <span>💬</span>
            <span>🔖</span>
            <span>↗</span>
          </div>

          <div className="bg-black/60 p-2 rounded-lg text-[9px]">
            <div className="font-bold text-white">Sophie Cielo • 2 days ago</div>
            <div className="text-amber-300">★★★★★ cetaphil.com</div>
            <div className="text-slate-200 mt-0.5">Perfect Hydration for Soft & Smooth Skin</div>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-slate-100 border border-slate-300 rounded-xl p-3.5 space-y-2">
      <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
        PROVEN VERTICAL VIDEO RETENTION METRICS
      </div>
      <p className="text-[11px] text-slate-600 leading-relaxed">
        Short-form vertical video (9:16) represents over 73% of all mobile internet traffic today. By standardizing reviews into full-screen 60-second micro-stories, Yoouz achieves an average watch completion rate exceeding 88%, compared to just 12% reading completion on text-based platforms like Yelp or Trustpilot.
      </p>
      <div className="flex gap-2">
        <span className="px-2.5 py-1 rounded bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold">
          88% COMPLETION RATE
        </span>
        <span className="px-2.5 py-1 rounded bg-blue-100 border border-blue-300 text-blue-800 text-[10px] font-bold">
          HLS ADAPTIVE BITRATE
        </span>
      </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 7: Creator Profiles & Sharing (Light Theme)
// ----------------------------------------------------------------------
const Slide7: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="flex items-center justify-between mb-1.5 border-b border-slate-200 pb-1">
        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
          06 • SOCIAL ARCHITECTURE
        </span>
        <span className="text-[10px] font-semibold text-slate-500 uppercase">
          YOOUZ • CONFIDENTIAL INVESTOR MEMORANDUM
        </span>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-0.5">
        Community, Creator Profiles & Direct Sharing
      </h2>
      <p className="text-xs text-slate-500 mb-3">
        Building an organic social graph where consumers follow trusted human taste-makers.
      </p>

      <div className="space-y-2.5 mb-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-extrabold">
              TRUSTED IDENTITY
            </span>
            <span className="text-xs font-bold text-slate-900">
              1. Verified Creator Profiles & Local Guides
            </span>
          </div>
          <p className="text-[11px] text-slate-600">
            Every reviewer on Yoouz has a public verified profile showcasing their review history, favorite places, total video count, and authenticity score. Reviewers earn verified badges and build loyal audiences who trust their specific culinary or travel recommendations.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-extrabold">
              NETWORK EFFECT
            </span>
            <span className="text-xs font-bold text-slate-900">
              2. Frictionless Social Following Graph
            </span>
          </div>
          <p className="text-[11px] text-slate-600">
            Unlike Yelp where reviews exist in isolation, Yoouz allows users to follow trusted creators with a single tap of the "+" button. Their personalized "Following" feed surfaces reviews exclusively from people whose taste they admire.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
              VIRAL MULTIPLIER
            </span>
            <span className="text-xs font-bold text-slate-900">
              3. Direct Sharing vs. Static Text Links
            </span>
          </div>
          <p className="text-[11px] text-slate-600">
            Sharing a Yoouz review sends an interactive video preview directly into iMessage, WhatsApp, Instagram DM, or Telegram. Recipients instantly watch the 60-second video without needing to create an account or install an app.
          </p>
        </div>
      </div>
    </div>

    <div className="bg-[#0B0F19] text-white rounded-xl p-3.5 space-y-1.5">
      <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
        WHY CONSUMERS CHOOSE YOOUZ OVER TRADITIONAL CHANNELS
      </div>
      <table className="w-full text-[11px] text-left">
        <tbody className="divide-y divide-slate-800 text-slate-300">
          <tr>
            <td className="py-1 font-bold text-amber-400">Review Format</td>
            <td className="text-slate-400">Legacy: Anonymous 3-paragraph text</td>
            <td className="text-emerald-400 font-medium">Yoouz: Authentic 60s live video testimonial</td>
          </tr>
          <tr>
            <td className="py-1 font-bold text-amber-400">Creator Trust</td>
            <td className="text-slate-400">Legacy: Faceless avatars, often paid bots</td>
            <td className="text-emerald-400 font-medium">Yoouz: Real face, real voice, verified identity</td>
          </tr>
          <tr>
            <td className="py-1 font-bold text-amber-400">Sharing Experience</td>
            <td className="text-slate-400">Legacy: Dry text URL that nobody clicks</td>
            <td className="text-emerald-400 font-medium">Yoouz: Engaging video link with rich instant playback</td>
          </tr>
          <tr>
            <td className="py-1 font-bold text-amber-400">Community Connection</td>
            <td className="text-slate-400">Legacy: Zero ongoing engagement</td>
            <td className="text-emerald-400 font-medium">Yoouz: Follow creators, ask questions, get video replies</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 8: Interactive Comments & Inquiries (Light Theme)
// ----------------------------------------------------------------------
const Slide8: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="flex items-center justify-between mb-1.5 border-b border-slate-200 pb-1">
        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
          07 • COMMUNITY ENGAGEMENT
        </span>
        <span className="text-[10px] font-semibold text-slate-500 uppercase">
          YOOUZ • CONFIDENTIAL INVESTOR MEMORANDUM
        </span>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-0.5">
        Interactive Comments & Inquiries Drawer
      </h2>
      <p className="text-xs text-slate-500 mb-3">
        Contextual suggestion chips bridge the gap between viewer questions and real answers.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 items-center">
        <div className="space-y-2 text-[11px]">
          <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 text-xs">
            Contextual Inquiry Chips & Dialogue
          </div>
          <div>
            <strong className="text-blue-700">Smart Suggestion Chips:</strong>
            <p className="text-slate-600">
              Instant one-tap prompts ("Loved the recommendation!", "How were the prices?", "Is parking easy to find?") remove friction and stimulate authentic conversation.
            </p>
          </div>
          <div>
            <strong className="text-blue-700">Direct Reviewer Replies:</strong>
            <p className="text-slate-600">
              Reviewers receive real-time notifications and can respond with clarifying details about menu items, wait times, or accessibility.
            </p>
          </div>
          <div>
            <strong className="text-blue-700">Verified Merchant Response:</strong>
            <p className="text-slate-600">
              Claimed business owners feature official badges and can publicly thank reviewers or resolve questions with customer support.
            </p>
          </div>
          <div>
            <strong className="text-blue-700">Anti-Spam Filtering:</strong>
            <p className="text-slate-600">
              Automated rate limits and keyword integrity filters prevent bot comments and promotional links.
            </p>
          </div>
        </div>

        {/* Comments Drawer Phone Mockup */}
        <div className="bg-black text-white p-3 rounded-2xl border-4 border-slate-800 shadow-xl max-w-[200px] mx-auto text-[10px] relative">
          <div className="flex justify-between items-center text-xs font-bold border-b border-zinc-800 pb-1 mb-3">
            <span>Comments 0</span>
            <span className="text-zinc-500">✕</span>
          </div>

          <div className="text-center text-zinc-500 py-6 text-[9px]">
            No comments yet<br />
            Be the first to share your thoughts or ask a question about Cetaphil!
          </div>

          <div className="space-y-1">
            <div className="bg-zinc-800/80 rounded-full px-2 py-1 text-[8px] text-zinc-300">
              Loved the recommendation! 👏
            </div>
            <div className="bg-zinc-800/80 rounded-full px-2 py-1 text-[8px] text-zinc-300">
              How were the prices? 💰
            </div>
            <div className="bg-zinc-800/80 rounded-full px-2 py-1 text-[8px] text-zinc-300">
              Is parking easy to find? 🅿️
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-[#0B0F19] text-white rounded-xl p-3.5 space-y-2">
      <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
        WHY REAL-TIME CONSUMER INQUIRIES DRIVE PURCHASE DECISIONS
      </div>
      <p className="text-[11px] text-slate-300 leading-relaxed">
        Static reviews leave unanswered micro-questions: "Is it wheelchair accessible?", "Do they offer vegan options?", "How long was the wait on a Friday night?". On legacy platforms, these questions remain unanswered or buried in forums.
      </p>
      <p className="text-[11px] text-slate-300 leading-relaxed">
        Yoouz transforms every review into an active conversation thread. When a consumer taps a suggestion chip like "How were the prices?", the reviewer or merchant answers directly. This real-time clarity converts hesitant searchers into paying customers.
      </p>
      <div className="pt-0.5">
        <span className="px-2.5 py-1 rounded bg-blue-900/60 border border-blue-500/40 text-blue-300 text-[10px] font-bold">
          4X HIGHER ENGAGEMENT
        </span>
      </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 9: Business Profile Architecture (Light Theme)
// ----------------------------------------------------------------------
const Slide9: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="flex items-center justify-between mb-1.5 border-b border-slate-200 pb-1">
        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
          08 • MERCHANT HUB
        </span>
        <span className="text-[10px] font-semibold text-slate-500 uppercase">
          YOOUZ • CONFIDENTIAL INVESTOR MEMORANDUM
        </span>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-0.5">
        Business Profile Architecture & Action Portal
      </h2>
      <p className="text-xs text-slate-500 mb-3">
        The permanent digital storefront connecting video proof with real-world consumer actions.
      </p>

      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <div className="text-xs font-bold text-slate-900 mb-1">
            1. Prominent "RECORD REVIEW" Call-to-Action
          </div>
          <p className="text-[11px] text-slate-600">
            Prominently placed black pill CTA invites on-site customers to film a 60-second review immediately.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <div className="text-xs font-bold text-slate-900 mb-1">
            2. High-Intent Direct Action Pills
          </div>
          <p className="text-[11px] text-slate-600">
            One-tap buttons for Directions (Google Maps), Call, Save Bookmark, Share Profile, and Direct Chat.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <div className="text-xs font-bold text-slate-900 mb-1">
            3. Verified Checkmark & 5.0 Star Badge
          </div>
          <p className="text-[11px] text-slate-600">
            Clear visual proof indicating officially claimed businesses and aggregate video rating breakdown.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <div className="text-xs font-bold text-slate-900 mb-1">
            4. Tabbed Architecture: Overview, Videos & About
          </div>
          <p className="text-[11px] text-slate-600">
            Deep organization displaying video review grid, business hours, amenities, and owner replies.
          </p>
        </div>
      </div>
    </div>

    <div className="bg-[#0B0F19] text-white rounded-xl p-3.5 space-y-2">
      <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
        BUSINESS PROFILE AS THE CONVERSION HUB
      </div>
      <p className="text-[11px] text-slate-300 leading-relaxed">
        Unlike text-heavy Yelp pages cluttered with competitor ads and negative review highlights, the Yoouz Business Profile is a high-converting, visually rich destination. Over 62% of visitors who open a Yoouz Business Profile tap on "Directions", "Call", or "Chat" within 45 seconds of watching their first review.
      </p>
      <p className="text-[11px] text-slate-300 leading-relaxed">
        Every profile operates under an SEO-optimized clean URL (e.g., yoouz.com/reviews/cetaphil.com) indexed automatically by Google Search with video schema markup.
      </p>
      <div className="pt-0.5">
        <span className="px-2.5 py-1 rounded bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
          62% ACTION CONVERSION
        </span>
      </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 10: Hardware Security (Light Theme)
// ----------------------------------------------------------------------
const Slide10: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="flex items-center justify-between mb-1.5 border-b border-slate-200 pb-1">
        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
          09 • HARDWARE SECURITY
        </span>
        <span className="text-[10px] font-semibold text-slate-500 uppercase">
          YOOUZ • CONFIDENTIAL INVESTOR MEMORANDUM
        </span>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-0.5">
        The Recording Studio: Hardware Camera Lock
      </h2>
      <p className="text-xs text-slate-500 mb-3">
        Tamper-proof on-device capture pipeline ensuring complete review authenticity.
      </p>

      <div className="space-y-2 mb-3">
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-start gap-3 shadow-2xs">
          <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-[10px] font-black shrink-0">
            01
          </span>
          <div>
            <div className="text-xs font-bold text-slate-900 mb-0.5">
              Mandatory Front-Facing Camera (Selfie Lock)
            </div>
            <p className="text-[11px] text-slate-600">
              The WebRTC MediaStream API initializes the front camera automatically (facingMode: "user"). Flipping to the back camera is technically disabled, guaranteeing a direct personal human testimonial.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-start gap-3 shadow-2xs">
          <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-[10px] font-black shrink-0">
            02
          </span>
          <div>
            <div className="text-xs font-bold text-slate-900 mb-0.5">
              Zero File Injection & Anti-Upload Gate
            </div>
            <p className="text-[11px] text-slate-600">
              File input elements and gallery pickers are entirely omitted from the recording interface. Reviewers cannot upload pre-edited videos or commercial PR clips.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-start gap-3 shadow-2xs">
          <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-[10px] font-black shrink-0">
            03
          </span>
          <div>
            <div className="text-xs font-bold text-slate-900 mb-0.5">
              60-Second Circular Countdown Ring
            </div>
            <p className="text-[11px] text-slate-600">
              A synchronized SVG progress ring counts down from 60 to 0. Recording automatically terminates at 60.0s, preventing rambling and enforcing high-signal content.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-start gap-3 shadow-2xs">
          <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-[10px] font-black shrink-0">
            04
          </span>
          <div>
            <div className="text-xs font-bold text-slate-900 mb-0.5">
              Instant Audio-Video Sync Preview & Re-Record
            </div>
            <p className="text-[11px] text-slate-600">
              After capture, the reviewer previews the exact video clip. If unsatisfied, a single tap triggers "Re-record", clearing the temporary blob without leaving orphaned storage data.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-start gap-3 shadow-2xs">
          <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-[10px] font-black shrink-0">
            05
          </span>
          <div>
            <div className="text-xs font-bold text-slate-900 mb-0.5">
              Cryptographic Rating Attachment
            </div>
            <p className="text-[11px] text-slate-600">
              The 1-to-5 star rating and category tags are immutably tied to the video asset signature upon upload, preventing tampering or rating inflation.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-[#0B0F19] text-white rounded-xl p-3.5 space-y-2">
      <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
        WHY PROOF-OF-HUMANITY CREATES A DEFENSIVE DATA MOAT
      </div>
      <p className="text-[11px] text-slate-300 leading-relaxed">
        As AI vision and voice synthesis flood the web, authentic human video captured live through hardware camera APIs becomes the rarest and most valuable commodity in digital media.
      </p>
      <p className="text-[11px] text-slate-300 leading-relaxed">
        By enforcing front-camera capture with zero gallery uploads, Yoouz constructs an immutable dataset of authenticated human experiences. This dataset is fundamentally impossible for scrapers or LLM click-farms to replicate, creating an impenetrable moat for the business.
      </p>
      <div className="pt-0.5">
        <span className="px-2.5 py-1 rounded bg-amber-900/60 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
          UNBREACHABLE ANTI-FRAUD
        </span>
      </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 11: Interactive Map & Geolocation (Light Theme)
// ----------------------------------------------------------------------
const Slide11: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="flex items-center justify-between mb-1.5 border-b border-slate-200 pb-1">
        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
          10 • LOCAL DISCOVERY
        </span>
        <span className="text-[10px] font-semibold text-slate-500 uppercase">
          YOOUZ • CONFIDENTIAL INVESTOR MEMORANDUM
        </span>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-0.5">
        Interactive Map & Geolocation Discovery
      </h2>
      <p className="text-xs text-slate-500 mb-3">
        High-density visual map locating verified video reviews in any neighborhood or city.
      </p>

      <div className="space-y-2.5 mb-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <div className="text-xs font-bold text-slate-900 mb-0.5">
            1. Dynamic Map Markers with Video Badges
          </div>
          <p className="text-[11px] text-slate-600">
            Each pin on the Yoouz map reveals a video preview thumbnail, star rating, and place category. Users browse a city visually, seeing what dishes, stores, and venues actually look like before visiting.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <div className="text-xs font-bold text-slate-900 mb-0.5">
            2. Real-Time Geofenced Radius Filtering
          </div>
          <p className="text-[11px] text-slate-600">
            Users can filter reviews within walking distance (500m), neighborhood (2km), or metro area (10km), surfacing hyper-local video recommendations instantly.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <div className="text-xs font-bold text-slate-900 mb-0.5">
            3. Integrated Turn-by-Turn Navigation
          </div>
          <p className="text-[11px] text-slate-600">
            Tapping "Directions" launches native Google Maps, Apple Maps, or Waze navigation with coordinates pre-populated, driving physical foot traffic directly to merchants.
          </p>
        </div>
      </div>
    </div>

    <div className="bg-[#0B0F19] text-white rounded-xl p-3.5 space-y-2">
      <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2">
        LOCAL FOOT TRAFFIC & COMMERCIAL INTENT DYNAMICS
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-center">
          <div className="text-lg font-black text-amber-400 tabular-nums">78%</div>
          <div className="text-[10px] font-bold text-white">Of Local Mobile Searches</div>
          <p className="text-[9px] text-slate-400 mt-0.5">Lead to an in-store offline purchase within 24 hours.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-center">
          <div className="text-lg font-black text-amber-400 tabular-nums">3.4x</div>
          <div className="text-[10px] font-bold text-white">Higher Conversion from Video</div>
          <p className="text-[9px] text-slate-400 mt-0.5">Diners who watch a 60s food video visit 3.4x more often than text-only readers.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-center">
          <div className="text-lg font-black text-amber-400 tabular-nums">&lt;15s</div>
          <div className="text-[10px] font-bold text-white">Decision Velocity</div>
          <p className="text-[9px] text-slate-400 mt-0.5">Average time from launching the map to initiating navigation or calling the business.</p>
        </div>
      </div>
      <p className="text-[10px] text-slate-400 pt-1">
        By integrating high-accuracy geolocation coordinates with verified front-camera video, Yoouz transforms online discovery into physical merchant revenue. This is the cornerstone of our B2B value proposition.
      </p>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 12: B2B Merchant Suite (Light Theme)
// ----------------------------------------------------------------------
const Slide12: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="flex items-center justify-between mb-1.5 border-b border-slate-200 pb-1">
        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
          11 • B2B PROTOCOL
        </span>
        <span className="text-[10px] font-semibold text-slate-500 uppercase">
          YOOUZ • CONFIDENTIAL INVESTOR MEMORANDUM
        </span>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-0.5">
        B2B Merchant Suite: Verification & Claiming
      </h2>
      <p className="text-xs text-slate-500 mb-3">
        Turnkey business claiming protocol protecting owner privacy while enabling complete reputation control.
      </p>

      <div className="space-y-2 mb-3">
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[9px] font-extrabold">SECURITY</span>
            <span className="text-xs font-bold text-slate-900">1. Official Business Claiming & Domain Verification</span>
          </div>
          <p className="text-[11px] text-slate-600">
            Merchants claim their listing through official domain matching (e.g., owner@cetaphil.com claiming cetaphil.com) or business phone verification. Once verified, the listing displays the official Blue Checkmark.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[9px] font-extrabold">PRIVACY FIRST</span>
            <span className="text-xs font-bold text-slate-900">2. Strict Owner Email & Privacy Protection</span>
          </div>
          <p className="text-[11px] text-slate-600">
            Strict Zero-Exposure Privacy Policy: Merchant owner personal emails and private credentials are never exposed, logged, or visible on public profile views or client badges.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-extrabold">ENGAGEMENT</span>
            <span className="text-xs font-bold text-slate-900">3. Official Owner Video & Text Replies</span>
          </div>
          <p className="text-[11px] text-slate-600">
            Verified owners can post official public responses directly under video reviews, resolving customer inquiries, acknowledging praise, or offering VIP invites.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 text-[9px] font-extrabold">MESSAGING</span>
            <span className="text-xs font-bold text-slate-900">4. Direct In-App Customer Messaging Hub</span>
          </div>
          <p className="text-[11px] text-slate-600">
            A dedicated B2B inbox allows owners to communicate privately with reviewers, handle reservation requests, and turn critical reviewers into loyal brand advocates.
          </p>
        </div>
      </div>
    </div>

    <div className="bg-[#0B0F19] text-white rounded-xl p-3.5 space-y-2">
      <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
        THE B2B VALUE PROPOSITION: ENDING YELP EXTORTION
      </div>
      <p className="text-[11px] text-slate-300 leading-relaxed">
        For decades, small business owners have harbored deep resentment toward Yelp and Google Maps. Legacy platforms permit unverified accounts to post damaging anonymous 1-star reviews, then pressure the business to buy thousands of dollars in ad packages to push negative feedback down.
      </p>
      <p className="text-[11px] text-slate-300 leading-relaxed">
        Yoouz eliminates this hostage dynamic. Because every review is a 60-second live video recorded with the reviewer’s face, competitors cannot spam fake negative reviews. Merchants gladly claim their profiles on Yoouz because it protects their hard-earned reputation rather than weaponizing it against them.
      </p>
      <div className="pt-0.5">
        <span className="px-2.5 py-1 rounded bg-blue-900/60 border border-blue-500/40 text-blue-300 text-[10px] font-bold">
          94% CLAIM CONVERSION
        </span>
      </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 13: Tabletop QR Stands (Light Theme)
// ----------------------------------------------------------------------
const Slide13: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="flex items-center justify-between mb-1.5 border-b border-slate-200 pb-1">
        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
          12 • VIRAL ACQUISITION
        </span>
        <span className="text-[10px] font-semibold text-slate-500 uppercase">
          YOOUZ • CONFIDENTIAL INVESTOR MEMORANDUM
        </span>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-0.5">
        B2B Growth Tools: Tabletop QR Stands
      </h2>
      <p className="text-xs text-slate-500 mb-3">
        Print-ready on-premise QR displays that transform dining tables and store counters into review engines.
      </p>

      <div className="space-y-2 mb-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[9px] font-extrabold">STEP 01</span>
            <span className="text-xs font-bold text-slate-900">Instant Vector QR Code Generator</span>
          </div>
          <p className="text-[11px] text-slate-600">
            Merchants generate customized high-resolution QR codes mapped directly to their unique business profile URL (e.g., yoouz.com/reviews/kroesadvocaten.nl) with 1-click.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[9px] font-extrabold">STEP 02</span>
            <span className="text-xs font-bold text-slate-900">Print-Ready Acrylic Table Stand Templates</span>
          </div>
          <p className="text-[11px] text-slate-600">
            The merchant dashboard provides downloadable, print-ready PDF/SVG templates for acrylic table tents, counter displays, and receipt inserts branded with the Yoouz logo.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[9px] font-extrabold">STEP 03</span>
            <span className="text-xs font-bold text-slate-900">Zero-App Friction: Instant Camera Shutter</span>
          </div>
          <p className="text-[11px] text-slate-600">
            When diners scan the table QR with their standard iPhone or Android camera app, the browser launches the Yoouz review studio instantly without requiring an app store download.
          </p>
        </div>
      </div>
    </div>

    <div className="bg-[#0B0F19] text-white rounded-xl p-3.5 space-y-2">
      <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2">
        THE ZERO-CAC VIRAL ACQUISITION MATHEMATICS
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-center">
          <div className="text-lg font-black text-amber-400 tabular-nums">35 Tables</div>
          <div className="text-[10px] font-bold text-white">Average Restaurant Size</div>
          <p className="text-[9px] text-slate-400 mt-0.5">35 tabletop QR displays active across lunch & dinner shifts.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-center">
          <div className="text-lg font-black text-amber-400 tabular-nums">140 Diners</div>
          <div className="text-[10px] font-bold text-white">Daily Eyeball Exposure</div>
          <p className="text-[9px] text-slate-400 mt-0.5">Customers sitting at tables seeing the "Review on Yoouz" prompt.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-center">
          <div className="text-lg font-black text-amber-400 tabular-nums">4 - 8 Reviews</div>
          <div className="text-[10px] font-bold text-white">Weekly Live Video Reviews</div>
          <p className="text-[9px] text-slate-400 mt-0.5">Compounding organic video library generated with $0 ad spend.</p>
        </div>
      </div>
      <p className="text-[10px] text-slate-300 leading-relaxed pt-1">
        Traditional apps spend $12 to $35 in paid Meta and Google ads to acquire a single active user. Yoouz acquires users at ZERO customer acquisition cost (CAC) by turning merchants’ physical dining tables and checkout counters into our distribution network.
      </p>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 14: Branded Ad Exporter & Embeds (Light Theme)
// ----------------------------------------------------------------------
const Slide14: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="flex items-center justify-between mb-1.5 border-b border-slate-200 pb-1">
        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
          13 • B2B MONETIZATION
        </span>
        <span className="text-[10px] font-semibold text-slate-500 uppercase">
          YOOUZ • CONFIDENTIAL INVESTOR MEMORANDUM
        </span>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-0.5">
        Branded Ad Exporter & 1-Click Embeds
      </h2>
      <p className="text-xs text-slate-500 mb-3">
        Equipping businesses with high-converting social video assets and embeddable website widgets.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1.5 text-[11px]">
          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1">
            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[9px]">
              B2B GROWTH SUITE
            </span>
            <span className="font-bold text-slate-900">Branded Social Ad Exporter</span>
          </div>
          <div>
            <strong className="text-slate-800">Meta & TikTok Video Ad Export:</strong>
            <p className="text-slate-600">
              Merchants select top 5-star customer reviews and export 9:16 vertical video ads with 1 click.
            </p>
          </div>
          <div>
            <strong className="text-slate-800">Automated Overlay Branding:</strong>
            <p className="text-slate-600">
              Automatically superimposes merchant logo, 5.0 star rating, and location watermark over the authentic customer testimonial.
            </p>
          </div>
          <div>
            <strong className="text-slate-800">High-Converting UGC Asset:</strong>
            <p className="text-slate-600">
              User-Generated Content (UGC) ads convert 4.2x higher on TikTok and Instagram than polished studio commercials.
            </p>
          </div>
          <div>
            <strong className="text-slate-800">Commercial Video Rights Clearance:</strong>
            <p className="text-slate-600">
              Terms of service grant claimed businesses commercial advertising rights to customer video reviews recorded on Yoouz.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1.5 text-[11px]">
          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1">
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px]">
              E-COMMERCE & WEB
            </span>
            <span className="font-bold text-slate-900">1-Click Website Video Widget</span>
          </div>
          <div>
            <strong className="text-slate-800">Lightweight Embed Code (1 Script Tag):</strong>
            <p className="text-slate-600">
              Compatible with Shopify, WordPress, Squarespace, Webflow, and custom React/HTML storefronts.
            </p>
          </div>
          <div>
            <strong className="text-slate-800">Interactive Video Carousel:</strong>
            <p className="text-slate-600">
              Displays glowing authentic video cards directly on the business landing page or checkout flow.
            </p>
          </div>
          <div>
            <strong className="text-slate-800">32% Increase in Checkout Conversion:</strong>
            <p className="text-slate-600">
              Shoppers who watch a real customer testimonial on an e-commerce product page convert 32% more frequently.
            </p>
          </div>
          <div>
            <strong className="text-slate-800">Bunny Edge CDN Stream Delivery:</strong>
            <p className="text-slate-600">
              Embed player streams via global CDN with zero bandwidth impact on the merchant’s origin server.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-[#0B0F19] text-white rounded-xl p-3.5 space-y-2">
      <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
        WHY MERCHANTS WILLINGLY PAY $149/MONTH FOR THIS SUITE
      </div>
      <p className="text-[11px] text-slate-300 leading-relaxed">
        Hiring a freelance videographer and UGC creator to produce a single 30-second promotional video costs between $400 and $1,200. Review widget software like Bazaarvoice or Yotpo charges $500 to $2,000 per month for text reviews.
      </p>
      <p className="text-[11px] text-slate-300 leading-relaxed">
        Yoouz provides verified businesses with an ongoing stream of authentic customer video reviews, a complete social ad generator, tabletop QR displays, and an embeddable website video widget for just $149/month ($1,788/year). The return on investment (ROI) is undeniable, creating an indispensable utility that businesses keep forever.
      </p>
      <div className="pt-0.5">
        <span className="px-2.5 py-1 rounded bg-blue-900/60 border border-blue-500/40 text-blue-300 text-[10px] font-bold">
          HIGH VALUE SAAS ROI
        </span>
      </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 15: Tech Stack (Light Theme)
// ----------------------------------------------------------------------
const Slide15: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="flex items-center justify-between mb-1.5 border-b border-slate-200 pb-1">
        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
          14 • TECHNOLOGY STACK
        </span>
        <span className="text-[10px] font-semibold text-slate-500 uppercase">
          YOOUZ • CONFIDENTIAL INVESTOR MEMORANDUM
        </span>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-0.5">
        Technical Architecture: Bunny.net & Cloud SQL
      </h2>
      <p className="text-xs text-slate-500 mb-3">
        High-performance global media delivery paired with relational data integrity.
      </p>

      <div className="space-y-2 mb-3">
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[9px] font-extrabold">EDGE VIDEO CDN</span>
              <span className="text-xs font-bold text-slate-900">Bunny Stream Low-Latency Edge Transcoding</span>
            </div>
            <p className="text-[11px] text-slate-600">
              60-second video uploads stream directly to Bunny.net Stream. Bunny immediately converts footage into adaptive multi-bitrate HLS (1080p, 720p, 480p) across 114+ global edge points of presence (PoPs) with sub-150ms startup.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[9px] font-extrabold">AUTO-SUBTITLES</span>
              <span className="text-xs font-bold text-slate-900">Bunny Smart Captions (Bunny-Only Policy)</span>
            </div>
            <p className="text-[11px] text-slate-600">
              In strict compliance with our Bunny-Only transcription protocol, subtitles are generated natively via Bunny Stream Smart Captions. This eliminates external AI dependencies and guarantees lightning-fast subtitle sync.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[9px] font-extrabold">POSTGRESQL DB</span>
              <span className="text-xs font-bold text-slate-900">Cloud SQL (PostgreSQL) Relational Persistence</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Strict relational data model managing users, places, reviews, comments, and following social graphs. ACID transactional integrity prevents phantom reviews, duplicate ratings, or desynchronized metrics.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[9px] font-extrabold">ENTERPRISE INDEPENDENCE</span>
              <span className="text-xs font-bold text-slate-900">Zero-Firebase Architectural Policy</span>
            </div>
            <p className="text-[11px] text-slate-600">
              The entire infrastructure is 100% independent of Firebase and Google Cloud NoSQL lock-in. All persistence runs through clean PostgreSQL endpoints and custom edge video pipelines, ensuring full enterprise control.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-[#0B0F19] text-white rounded-xl p-3.5 space-y-2">
      <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
        MASSIVE COST ADVANTAGE OVER MUX AND AWS ELEMENTAL
      </div>
      <table className="w-full text-[11px] text-left">
        <tbody className="divide-y divide-slate-800 text-slate-300">
          <tr className="bg-blue-950/40 font-bold">
            <td className="py-1 text-blue-400">Yoouz on Bunny.net Stream</td>
            <td className="text-emerald-400 tabular-nums">$0.005 / GB bandwidth</td>
            <td className="text-emerald-400">90% cheaper than hyperscalers</td>
          </tr>
          <tr>
            <td className="py-1 text-slate-300">Mux Video Streaming API</td>
            <td className="text-slate-400 tabular-nums">$0.045 / GB bandwidth</td>
            <td className="text-slate-400">9x more expensive</td>
          </tr>
          <tr>
            <td className="py-1 text-slate-300">AWS Elemental MediaConvert</td>
            <td className="text-slate-400 tabular-nums">$0.075 / GB + licensing</td>
            <td className="text-slate-400">15x more expensive + high ops</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 16: Financial Engine (Light Theme)
// ----------------------------------------------------------------------
const Slide16: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="flex items-center justify-between mb-1.5 border-b border-slate-200 pb-1">
        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
          15 • FINANCIAL ENGINE
        </span>
        <span className="text-[10px] font-semibold text-slate-500 uppercase">
          YOOUZ • CONFIDENTIAL INVESTOR MEMORANDUM
        </span>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-0.5">
        Business Model & Revenue Architecture
      </h2>
      <p className="text-xs text-slate-500 mb-3">
        Dual-engine monetization combining organic consumer virality with high-margin B2B SaaS.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            ONBOARDING FUNNEL
          </div>
          <div className="text-lg font-black text-slate-900">Free Merchant Tier</div>
          <div className="text-xl font-black text-slate-900 tabular-nums">
            $0 <span className="text-xs text-slate-500 font-normal">/ forever • No credit card required</span>
          </div>
          <ul className="text-[11px] text-slate-600 space-y-1">
            <li>• Official Profile Claim & Address Verification</li>
            <li>• Update Business Hours & Category Info</li>
            <li>• Standard Acrylic QR Code Tabletop Generator</li>
            <li>• Basic Video View & Follower Counter</li>
            <li>• Public Text Replies to Customer Reviews</li>
            <li>• Direct In-App Customer Chat Messaging</li>
          </ul>
        </div>

        <div className="bg-[#0B0F19] text-white border border-slate-800 rounded-xl p-3 shadow-md space-y-2">
          <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
            PRIMARY MONETIZATION
          </div>
          <div className="text-lg font-black text-white">Premium Business Suite</div>
          <div className="text-xl font-black text-amber-400 tabular-nums">
            $149 <span className="text-xs text-slate-400 font-normal">/ month • $1,788 / year</span>
          </div>
          <ul className="text-[11px] text-slate-300 space-y-1">
            <li className="font-bold text-amber-400">• EVERYTHING IN FREE TIER, PLUS:</li>
            <li>• 1-Click HD Branded Ad Exporter (Meta/TikTok)</li>
            <li>• Embeddable Video Reviews on Merchant Website</li>
            <li>• Priority Placement in Local Search Results</li>
            <li>• Automated Google SEO Video Schema Snippets</li>
            <li>• Advanced Sentiment & Viewer Retention Analytics</li>
            <li>• Official Gold Verified Business Badge</li>
          </ul>
        </div>
      </div>
    </div>

    <div className="bg-slate-100 border border-slate-300 rounded-xl p-3.5 space-y-2">
      <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
        TOTAL ADDRESSABLE MARKET (TAM) & ARR SCALING
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white border border-slate-200 rounded-lg p-2 text-center">
          <div className="text-lg font-black text-blue-600 tabular-nums">$152B</div>
          <div className="text-[10px] font-bold text-slate-900">Global Online Review Market</div>
          <p className="text-[9px] text-slate-500 mt-0.5">Merchant spend on reputation, reviews, and local ad placements.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-2 text-center">
          <div className="text-lg font-black text-blue-600 tabular-nums">33.2 Million</div>
          <div className="text-[10px] font-bold text-slate-900">US SMBs Relying on Reviews</div>
          <p className="text-[9px] text-slate-500 mt-0.5">Over 6 million restaurants, clinics, salons, and hospitality venues.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-2 text-center">
          <div className="text-lg font-black text-blue-600 tabular-nums">$1,788</div>
          <div className="text-[10px] font-bold text-slate-900">Annual Contract Value (ACV)</div>
          <p className="text-[9px] text-slate-500 mt-0.5">Predictable high-retention SaaS subscription with &gt;88% margin.</p>
        </div>
      </div>
      <p className="text-[10px] text-slate-600 pt-1">
        Monetization Target: Capturing just 0.1% of US local businesses (33,000 locations) generates $59.0M in high-margin Annual Recurring Revenue (ARR). At 1% market penetration, Yoouz achieves $590M ARR.
      </p>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 17: Competitive Moat (Light Theme)
// ----------------------------------------------------------------------
const Slide17: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="flex items-center justify-between mb-1.5 border-b border-slate-200 pb-1">
        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
          16 • DEFENSIBILITY
        </span>
        <span className="text-[10px] font-semibold text-slate-500 uppercase">
          YOOUZ • CONFIDENTIAL INVESTOR MEMORANDUM
        </span>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-0.5">
        Competitive Moat: Why Incumbents Cannot Replicate
      </h2>
      <p className="text-xs text-slate-500 mb-2.5">
        Architectural debt and revenue conflicts prevent legacy giants from copying the Yoouz protocol.
      </p>

      <div className="bg-white border border-slate-200 rounded-xl p-2.5 mb-2.5 shadow-2xs overflow-x-auto">
        <table className="w-full text-[10px] text-left">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-bold">
              <th className="py-1">Platform</th>
              <th className="py-1 text-blue-700">100% Live Video</th>
              <th className="py-1">Anti-Upload Gate</th>
              <th className="py-1">Subtitles / Captions</th>
              <th className="py-1">B2B Ad Exporter</th>
              <th className="py-1">Consumer Trust</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            <tr className="bg-blue-50 font-bold">
              <td className="py-1 text-blue-800">Yoouz</td>
              <td className="text-emerald-700">YES (Mandatory)</td>
              <td className="text-emerald-700">YES (No Gallery)</td>
              <td className="text-emerald-700">YES (Bunny Sync)</td>
              <td className="text-emerald-700">YES (1-Click)</td>
              <td className="text-emerald-700">HIGHEST (Human Proof)</td>
            </tr>
            <tr>
              <td className="py-1 font-bold">Yelp</td>
              <td className="text-slate-500">NO (99% Text)</td>
              <td className="text-slate-500">NO (Upload Any File)</td>
              <td className="text-slate-500">NO</td>
              <td className="text-slate-500">NO</td>
              <td className="text-rose-600 font-medium">VERY LOW (Extortion Scandals)</td>
            </tr>
            <tr>
              <td className="py-1 font-bold">Google Maps</td>
              <td className="text-slate-500">NO (Text Dominant)</td>
              <td className="text-slate-500">NO (Photos/Uploads)</td>
              <td className="text-slate-500">NO</td>
              <td className="text-slate-500">NO</td>
              <td className="text-rose-600 font-medium">LOW (Overrun by AI Bots)</td>
            </tr>
            <tr>
              <td className="py-1 font-bold">Trustpilot</td>
              <td className="text-slate-500">NO (100% Text)</td>
              <td className="text-slate-500">NO</td>
              <td className="text-slate-500">NO</td>
              <td className="text-slate-500">NO</td>
              <td className="text-amber-600 font-medium">MEDIUM (Paywall Accusations)</td>
            </tr>
            <tr>
              <td className="py-1 font-bold">TikTok</td>
              <td className="text-slate-500">YES (General Video)</td>
              <td className="text-slate-500">NO (Pre-edited/PR)</td>
              <td className="text-slate-500">Variable</td>
              <td className="text-slate-500">NO</td>
              <td className="text-rose-600 font-medium">LOW (Influencer Sponsorships)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div className="bg-[#0B0F19] text-white rounded-xl p-3.5 space-y-1.5">
      <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
        YOOUZ’S FOUR IMPENETRABLE MOATS
      </div>
      <div className="space-y-1 text-[10px] text-slate-300">
        <div>
          <strong className="text-white">1. The Anti-Incentive Dilemma for Yelp & Google:</strong> Over 80% of Yelp and Google Maps review ad revenue is extracted through negative review defense. Eliminating fake text reviews removes their monetization leverage. They cannot pivot to authentic video without killing their core business.
        </div>
        <div>
          <strong className="text-white">2. The "Proof-of-Humanity" Data Asset:</strong> Every video uploaded to Yoouz builds an immutable corpus of authenticated human consumer behavior. In an internet saturated with synthetic AI spam, verified human video carries the highest data premium in the world.
        </div>
        <div>
          <strong className="text-white">3. Zero App Store Gatekeeping (Instant PWA Onboarding):</strong> By eliminating the 200MB app store friction, Yoouz achieves an 8x higher conversion rate when on-site diners scan table QR codes compared to legacy mobile applications.
        </div>
        <div>
          <strong className="text-white">4. Local Two-Sided Network Effects:</strong> Consumers open Yoouz because video reviews are honest and un-faked. Merchants claim their profiles because video reviews convert 3x higher than text. Once a local city achieves critical density, the network is unassailable.
        </div>
      </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 18: Roadmap & Horizon (Light Theme)
// ----------------------------------------------------------------------
const Slide18: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="flex items-center justify-between mb-1.5 border-b border-slate-200 pb-1">
        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
          17 • THE HORIZON
        </span>
        <span className="text-[10px] font-semibold text-slate-500 uppercase">
          YOOUZ • CONFIDENTIAL INVESTOR MEMORANDUM
        </span>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-0.5">
        Execution Roadmap, Capital Allocation & Investment
      </h2>
      <p className="text-xs text-slate-500 mb-2.5">
        Production-ready platform scaling across national metro hubs.
      </p>

      <div className="grid grid-cols-3 gap-2 mb-2.5">
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs space-y-1 text-[10px]">
          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[8px] uppercase">
            PHASE 1 (COMPLETED)
          </span>
          <div className="font-bold text-slate-900 text-[11px]">Core Protocol & Production Infrastructure</div>
          <ul className="text-slate-600 space-y-0.5">
            <li>• Full PWA mobile & desktop web application live</li>
            <li>• Bunny Stream low-latency edge video pipeline</li>
            <li>• Front-camera live 60s recording studio</li>
            <li>• PostgreSQL Cloud SQL schema & persistence</li>
            <li>• Real-time search with iOS caret synchronization</li>
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs space-y-1 text-[10px]">
          <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[8px] uppercase">
            PHASE 2 (CURRENT - IN MARKET)
          </span>
          <div className="font-bold text-slate-900 text-[11px]">B2B Merchant Suite & QR Table Expansion</div>
          <ul className="text-slate-600 space-y-0.5">
            <li>• Business claiming & domain verification</li>
            <li>• Custom acrylic QR table stand generators</li>
            <li>• Branded 9:16 video ad exporter for Meta/TikTok</li>
            <li>• 1-Click embeddable website video widget</li>
            <li>• $149/mo Premium Business subscription active</li>
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs space-y-1 text-[10px]">
          <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[8px] uppercase">
            PHASE 3 (NEXT 12 MONTHS)
          </span>
          <div className="font-bold text-slate-900 text-[11px]">POS Integrations & National Density</div>
          <ul className="text-slate-600 space-y-0.5">
            <li>• Toast, Square & Clover POS direct integrations</li>
            <li>• Automated post-checkout SMS review invitations</li>
            <li>• Verified Creator token rewards & perks</li>
            <li>• Real-time multi-language AI auto-dubbing</li>
            <li>• Strategic national hospitality franchise rollouts</li>
          </ul>
        </div>
      </div>
    </div>

    <div className="space-y-2">
      <div className="bg-[#0B0F19] text-white rounded-xl p-3 space-y-1">
        <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
          WHY YOOUZ IS THE DEFINING VENTURE INVESTMENT OPPORTUNITY
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] text-slate-300">
          <div>
            <strong className="text-white block">Massive Undisputed Problem:</strong>
            Collapse of consumer trust in text reviews is recognized globally.
          </div>
          <div>
            <strong className="text-white block">Irresistible Product-Market Fit:</strong>
            Combines vertical video addiction with high-margin B2B SaaS revenue.
          </div>
          <div>
            <strong className="text-white block">Capital-Efficient Infrastructure:</strong>
            Bunny.net edge infrastructure delivers &gt;88% gross margins.
          </div>
          <div>
            <strong className="text-white block">First-Mover Moat in Proof-of-Humanity:</strong>
            Standardizing live 60s video positions Yoouz as global trust protocol.
          </div>
        </div>
      </div>

      <div className="bg-slate-900 text-white border border-slate-800 rounded-xl p-2.5 text-center text-[10px]">
        <div className="font-bold text-amber-400 uppercase text-[9px] tracking-wider">
          INVESTOR RELATIONS & CORPORATE DEVELOPMENT
        </div>
        <p className="text-slate-300 font-medium">
          Official Web Application: yoouz.com • Executive Office: investor-relations@yoouz.com
        </p>
        <p className="text-slate-500 text-[9px]">
          Strictly Confidential. Copyright © 2026 Yoouz Inc. All rights reserved. Do not distribute without authorization.
        </p>
      </div>
    </div>
  </div>
);
