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
  BarChart3,
  Globe,
  Database,
  TrendingUp,
  Award,
  Users,
  Target,
  DollarSign
} from "lucide-react";

interface SlideProps {
  pageNum: number;
}

export const InvestorPitchSlide: React.FC<SlideProps> = ({ pageNum }) => {
  return (
    <div className="w-full h-full bg-[#080a0f] text-slate-100 p-6 sm:p-9 flex flex-col justify-between font-sans border border-zinc-800/80 shadow-2xl relative overflow-hidden select-none">
      {/* Background Ambient Glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

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

      {/* Uniform Running Footer across all slides */}
      <div className="pt-3 mt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 font-medium relative z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-zinc-300 font-semibold tracking-wide">YOOUZ INC.</span>
          <span>·</span>
          <span>Yoouz Pitch Deck & Strategic Memorandum</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Page {pageNum} of 18</span>
          <span>·</span>
          <span className="text-blue-400 font-mono">yoouz.com/pitch</span>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// Slide 1: Executive Thesis
// ----------------------------------------------------------------------
const Slide1: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold tracking-widest text-blue-400 uppercase">
          01 · EXECUTIVE THESIS
        </span>
        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-semibold tracking-wide">
          SERIES SEED
        </span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight mb-2">
        The Verified Video Review & Local Discovery Protocol
      </h1>
      <p className="text-sm sm:text-base text-zinc-400 font-medium mb-6">
        Building the Trust Layer for Global Local Commerce
      </p>

      <div className="bg-[#0f131f] border border-zinc-800 rounded-xl p-4 sm:p-5 mb-6 space-y-3">
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
          Commerce faces an unprecedented <strong className="text-white">$152B fake review crisis</strong> fueled by automated LLM text generation, reputational extortion, and unverified reviews. Traditional platforms fail because static text is trivially fabricated.
        </p>
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
          <strong className="text-blue-400">Yoouz solves this crisis</strong> through an unbreachable hardware-level protocol: mandatory 60-second front-camera live video reviews, zero gallery uploads, and instant edge streaming via Bunny.net.
        </p>
      </div>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-[#0f131f] border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Authenticity</div>
        <div className="text-xl font-bold text-emerald-400 tabular-nums">100% Live</div>
        <div className="text-[11px] text-zinc-400 mt-1">Zero gallery uploads, front camera only</div>
      </div>

      <div className="bg-[#0f131f] border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Video Protocol</div>
        <div className="text-xl font-bold text-blue-400 tabular-nums">60 Seconds</div>
        <div className="text-[11px] text-zinc-400 mt-1">High-signal, maximum retention format</div>
      </div>

      <div className="bg-[#0f131f] border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">B2B Suite</div>
        <div className="text-xl font-bold text-purple-400 tabular-nums">$149 / mo</div>
        <div className="text-[11px] text-zinc-400 mt-1">Claiming, table QR stands & ad exports</div>
      </div>

      <div className="bg-[#0f131f] border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Infrastructure</div>
        <div className="text-xl font-bold text-cyan-400 tabular-nums">Bunny Edge</div>
        <div className="text-[11px] text-zinc-400 mt-1">Low-cost multi-bitrate HLS streaming</div>
      </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 2: Table of Contents & Structure
// ----------------------------------------------------------------------
const Slide2: React.FC = () => {
  const sections = [
    "01. Executive Thesis & Foundational Mandate",
    "02. Strategic Overview & Table of Contents",
    "03. The Market Problem: Fake Review Crisis",
    "04. The Solution: 60-Second Video Protocol",
    "05. Consumer Experience: Mobile PWA",
    "06. Immersive Vertical Video Player",
    "07. Community, Creators & Sharing",
    "08. Interactive Comments & Inquiries",
    "09. Business Profile & Action Portal",
    "10. Recording Studio: Camera Lock",
    "11. Interactive Map & Geolocation",
    "12. B2B Merchant Suite & Claiming",
    "13. B2B Growth: Tabletop QR Stands",
    "14. Branded Ad Exporter & Embeds",
    "15. Tech Stack: Bunny.net & Cloud SQL",
    "16. Business Model & Revenue Projections",
    "17. Competitive Moat & Matrix",
    "18. Execution Roadmap & Investment"
  ];

  return (
    <div className="flex flex-col justify-between h-full py-1">
      <div>
        <div className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-2">
          02 · DOCUMENT STRUCTURE
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">Strategic Overview & Table of Contents</h2>
        <p className="text-xs text-zinc-400 mb-4">
          Complete 18-Section Breakdown of the Yoouz Technology and Business Platform
        </p>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
          {sections.map((sec, i) => (
            <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-[#0f131f] border border-zinc-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              <span className="text-xs text-zinc-300 font-medium truncate">{sec}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-800/40 rounded-xl p-3 flex items-center justify-around text-center">
        <div>
          <div className="text-[10px] text-zinc-400 font-bold uppercase">Target TAM</div>
          <div className="text-base font-bold text-white tabular-nums">$152B</div>
        </div>
        <div className="w-px h-6 bg-zinc-800" />
        <div>
          <div className="text-[10px] text-zinc-400 font-bold uppercase">B2B SaaS ACV</div>
          <div className="text-base font-bold text-blue-400 tabular-nums">$1,788 / yr</div>
        </div>
        <div className="w-px h-6 bg-zinc-800" />
        <div>
          <div className="text-[10px] text-zinc-400 font-bold uppercase">US SMB Target</div>
          <div className="text-base font-bold text-emerald-400 tabular-nums">33.2 Million</div>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// Slide 3: The Market Problem
// ----------------------------------------------------------------------
const Slide3: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="text-xs font-bold tracking-widest text-red-400 uppercase mb-2">
        03 · MARKET OPPORTUNITY
      </div>
      <h2 className="text-2xl font-bold text-white mb-1">The $152B Global Fake Review Crisis</h2>
      <p className="text-xs text-zinc-400 mb-5">
        How Legacy Review Platforms Lost Consumer Trust in the Generative AI Era
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-[#161218] border border-red-900/40 rounded-xl p-4">
          <div className="text-2xl font-black text-red-400 mb-1 tabular-nums">42% - 54%</div>
          <div className="text-xs font-bold text-white mb-1.5">AI Fake Text Reviews</div>
          <p className="text-[11px] text-zinc-400 leading-normal">
            LLMs generate convincing fake text reviews at scale, overwhelming Google Maps, Tripadvisor, and Yelp.
          </p>
        </div>

        <div className="bg-[#161218] border border-amber-900/40 rounded-xl p-4">
          <div className="text-2xl font-black text-amber-400 mb-1 tabular-nums">~$152 Billion</div>
          <div className="text-xs font-bold text-white mb-1.5">Annual Extortion Loss</div>
          <p className="text-[11px] text-zinc-400 leading-normal">
            Merchants suffer from negative review blackmail, unverified claims, and pay-to-remove scheme dynamics.
          </p>
        </div>

        <div className="bg-[#161218] border border-blue-900/40 rounded-xl p-4">
          <div className="text-2xl font-black text-blue-400 mb-1 tabular-nums">84%</div>
          <div className="text-xs font-bold text-white mb-1.5">Gen-Z Disconnect</div>
          <p className="text-[11px] text-zinc-400 leading-normal">
            Modern consumers reject static text stars, demanding immersive, short-form vertical video proof.
          </p>
        </div>
      </div>
    </div>

    <div className="bg-[#0f131f] border border-zinc-800 rounded-xl p-4">
      <div className="text-xs font-bold text-white mb-2 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-blue-400" />
        Why Legacy Incumbents Are Paralyzed
      </div>
      <div className="grid grid-cols-2 gap-3 text-[11px] text-zinc-300">
        <div className="p-2 rounded bg-zinc-900/80 border border-zinc-800">
          <strong className="text-white block mb-0.5">Google Maps & Yelp:</strong>
          Cannot enforce mandatory video without destroying 95%+ of their legacy text review volume.
        </div>
        <div className="p-2 rounded bg-zinc-900/80 border border-zinc-800">
          <strong className="text-white block mb-0.5">TikTok & Instagram:</strong>
          Lack structured local discovery, map indexing, verified merchant tools, and hardware fraud locks.
        </div>
      </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 4: The Solution: 60-Second Protocol
// ----------------------------------------------------------------------
const Slide4: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-2">
        04 · PRODUCT VISION
      </div>
      <h2 className="text-2xl font-bold text-white mb-1">The 60-Second Video Protocol</h2>
      <p className="text-xs text-zinc-400 mb-4">
        Hardware-Enforced Authenticity and High-Signal Local Video Discovery
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#0f131f] border border-zinc-800 rounded-xl p-3.5">
          <div className="text-xs font-bold text-blue-400 mb-1">1. Live Front Camera Lock</div>
          <p className="text-[11px] text-zinc-300">
            WebRTC stream locks directly to front camera. Zero gallery uploads or pre-recorded file injection permitted.
          </p>
        </div>

        <div className="bg-[#0f131f] border border-zinc-800 rounded-xl p-3.5">
          <div className="text-xs font-bold text-emerald-400 mb-1">2. Strict 60-Second Cap</div>
          <p className="text-[11px] text-zinc-300">
            Forces concise, high-signal reviews. Yields an 88% completion rate vs 22% for long videos.
          </p>
        </div>

        <div className="bg-[#0f131f] border border-zinc-800 rounded-xl p-3.5">
          <div className="text-xs font-bold text-purple-400 mb-1">3. Bunny Smart Captions</div>
          <p className="text-[11px] text-zinc-300">
            Automatic multi-language subtitle rendering for 100% silent-mode accessibility in public settings.
          </p>
        </div>

        <div className="bg-[#0f131f] border border-zinc-800 rounded-xl p-3.5">
          <div className="text-xs font-bold text-amber-400 mb-1">4. Verified Geolocation Pin</div>
          <p className="text-[11px] text-zinc-300">
            Location validation confirms reviewer is physically at or near business premises.
          </p>
        </div>
      </div>
    </div>

    <div className="bg-[#0f131f] border border-zinc-800 rounded-xl p-3.5 text-center">
      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">The 5-Step Trust Flywheel</div>
      <div className="flex items-center justify-between text-xs font-medium text-zinc-200 px-2">
        <span className="p-2 rounded bg-zinc-900 border border-zinc-800">1. Live Capture</span>
        <ArrowRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span className="p-2 rounded bg-zinc-900 border border-zinc-800">2. Bunny Edge</span>
        <ArrowRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span className="p-2 rounded bg-zinc-900 border border-zinc-800">3. Captions</span>
        <ArrowRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span className="p-2 rounded bg-zinc-900 border border-zinc-800">4. Map Feed</span>
        <ArrowRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span className="p-2 rounded bg-zinc-900 border border-zinc-800 text-blue-400">5. B2B Leads</span>
      </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 5: Consumer Experience PWA
// ----------------------------------------------------------------------
const Slide5: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-2">
        05 · CONSUMER PWA
      </div>
      <h2 className="text-2xl font-bold text-white mb-1">Consumer Experience & Discovery</h2>
      <p className="text-xs text-zinc-400 mb-4">
        Instant Web Access with Zero App Store Download Friction
      </p>

      <div className="space-y-3 mb-5">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0f131f] border border-zinc-800">
          <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-white">Zero-Install Progressive Web App (PWA)</div>
            <p className="text-[11px] text-zinc-300">
              Loads in under 1.2 seconds from any web link or QR code with full offline caching and instant video playback.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0f131f] border border-zinc-800">
          <Layers className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-white">Category & Vibe Taxonomy Filters</div>
            <p className="text-[11px] text-zinc-300">
              Quick-select filters for Restaurants, Nightlife, Coffee, Beauty, Services, and Specialty Shops.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0f131f] border border-zinc-800">
          <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-white">Personalized Local Feed Engine</div>
            <p className="text-[11px] text-zinc-300">
              Algorithm prioritizes verified local, trending, and highly engageable 60-second video reviews nearby.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-3 text-center">
      <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl">
        <div className="text-xl font-extrabold text-emerald-400 tabular-nums">3.4x</div>
        <div className="text-[10px] text-zinc-400 font-medium mt-0.5">Higher Conversion vs Native App Store</div>
      </div>

      <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl">
        <div className="text-xl font-extrabold text-blue-400 tabular-nums">&lt; 1.2s</div>
        <div className="text-[10px] text-zinc-400 font-medium mt-0.5">First Contentful Paint on Mobile</div>
      </div>

      <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl">
        <div className="text-xl font-extrabold text-purple-400 tabular-nums">100%</div>
        <div className="text-[10px] text-zinc-400 font-medium mt-0.5">Cross-Platform iOS & Android</div>
      </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 6: Immersive Vertical Video Player
// ----------------------------------------------------------------------
const Slide6: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-2">
        06 · VIDEO PLAYER
      </div>
      <h2 className="text-2xl font-bold text-white mb-1">The Immersive Vertical Video Player</h2>
      <p className="text-xs text-zinc-400 mb-4">
        High-Engagement Short-Form Video Optimized for Local Commerce
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl">
          <div className="text-xs font-bold text-white mb-1">Edge HLS Streaming</div>
          <p className="text-[11px] text-zinc-300">
            Powered by Bunny.net adaptive bitrate HLS encoding for instant 0ms perceived buffering even on cellular data.
          </p>
        </div>

        <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl">
          <div className="text-xs font-bold text-white mb-1">Smart Subtitles</div>
          <p className="text-[11px] text-zinc-300">
            Automated captions overlay with customizable font styles for high comprehension in muted browser sessions.
          </p>
        </div>

        <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl">
          <div className="text-xs font-bold text-white mb-1">Floating Place Pill</div>
          <p className="text-[11px] text-zinc-300">
            Translucent backdrop showing merchant name, distance, star rating, and direct action triggers.
          </p>
        </div>

        <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl">
          <div className="text-xs font-bold text-white mb-1">Engagement Rails</div>
          <p className="text-[11px] text-zinc-300">
            1-tap Likes, Bookmarks, Direct Sharing, and Interactive Inquiry Drawer directly on video frame.
          </p>
        </div>
      </div>
    </div>

    <div className="bg-[#0f131f] border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between text-center">
      <div className="flex-1">
        <div className="text-lg font-bold text-emerald-400 tabular-nums">88%</div>
        <div className="text-[10px] text-zinc-400 uppercase font-semibold">Video Completion</div>
      </div>
      <div className="w-px h-8 bg-zinc-800" />
      <div className="flex-1">
        <div className="text-lg font-bold text-blue-400 tabular-nums">0 ms</div>
        <div className="text-[10px] text-zinc-400 uppercase font-semibold">Perceived Latency</div>
      </div>
      <div className="w-px h-8 bg-zinc-800" />
      <div className="flex-1">
        <div className="text-lg font-bold text-purple-400 tabular-nums">100%</div>
        <div className="text-[10px] text-zinc-400 uppercase font-semibold">Mute-Friendly</div>
      </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 7: Creator Profiles & Sharing
// ----------------------------------------------------------------------
const Slide7: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-2">
        07 · SOCIAL & COMMUNITY
      </div>
      <h2 className="text-2xl font-bold text-white mb-1">Creator Profiles & Viral Sharing</h2>
      <p className="text-xs text-zinc-400 mb-4">
        Empowering Authentic Local Reviewers & Local Ambassadors
      </p>

      <div className="space-y-2.5 mb-4">
        <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl">
          <div className="text-xs font-bold text-white">Public Reviewer Passports</div>
          <p className="text-[11px] text-zinc-300">
            Verified reviewer badges, total video views, helpfulness score, and curated bookmarked local spots.
          </p>
        </div>

        <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl">
          <div className="text-xs font-bold text-white">1-Click Social Exports</div>
          <p className="text-[11px] text-zinc-300">
            Seamless video exports to Instagram Stories, TikTok, WhatsApp, and iMessage with deep links back to Yoouz.
          </p>
        </div>
      </div>
    </div>

    <div className="bg-[#0f131f] border border-zinc-800 rounded-xl p-3 overflow-hidden">
      <div className="text-[10px] font-bold text-zinc-400 uppercase mb-2">Platform Comparison Matrix</div>
      <table className="w-full text-[11px] text-left">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-400">
            <th className="py-1">Feature</th>
            <th className="py-1 text-blue-400">Yoouz</th>
            <th className="py-1">Yelp / Google</th>
            <th className="py-1">TikTok</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
          <tr>
            <td className="py-1.5 font-medium">Format</td>
            <td className="text-blue-400 font-bold">60s Live Video</td>
            <td>Static Text</td>
            <td>Unverified Video</td>
          </tr>
          <tr>
            <td className="py-1.5 font-medium">Verification</td>
            <td className="text-blue-400 font-bold">Hardware Lock</td>
            <td>None (Text)</td>
            <td>None (Uploads)</td>
          </tr>
          <tr>
            <td className="py-1.5 font-medium">B2B Intent</td>
            <td className="text-blue-400 font-bold">Direct Action</td>
            <td>Ad Banners</td>
            <td>Entertainment</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 8: Interactive Comments & Inquiries Drawer
// ----------------------------------------------------------------------
const Slide8: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-2">
        08 · USER ENGAGEMENT
      </div>
      <h2 className="text-2xl font-bold text-white mb-1">Interactive Comments & Inquiries Drawer</h2>
      <p className="text-xs text-zinc-400 mb-4">
        Turning Casual Review Viewers into Verified Paying Customers
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl">
          <div className="text-xs font-bold text-blue-400 mb-1">Contextual Inquiry Chips</div>
          <p className="text-[11px] text-zinc-300">
            1-tap prompts like "Is reservation needed?", "Parking situation?", "Best dish to order?".
          </p>
        </div>

        <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl">
          <div className="text-xs font-bold text-emerald-400 mb-1">Owner Reply Threads</div>
          <p className="text-[11px] text-zinc-300">
            Verified merchant badge for official responses directly inside video comments.
          </p>
        </div>

        <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl">
          <div className="text-xs font-bold text-purple-400 mb-1">Push Notifications</div>
          <p className="text-[11px] text-zinc-300">
            Instant updates when an inquiry receives an official response from merchant.
          </p>
        </div>
      </div>
    </div>

    <div className="bg-[#0f131f] border border-zinc-800 rounded-xl p-4 flex items-center justify-around text-center">
      <div>
        <div className="text-2xl font-extrabold text-blue-400 tabular-nums">4x</div>
        <div className="text-[10px] text-zinc-400 font-medium">Higher Comment Engagement Rate</div>
      </div>
      <div className="w-px h-10 bg-zinc-800" />
      <div>
        <div className="text-2xl font-extrabold text-emerald-400 tabular-nums">68%</div>
        <div className="text-[10px] text-zinc-400 font-medium">Inquiry-to-In-Store Visit Rate</div>
      </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 9: Business Profile & Action Portal
// ----------------------------------------------------------------------
const Slide9: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-2">
        09 · B2B PORTAL
      </div>
      <h2 className="text-2xl font-bold text-white mb-1">Business Profile Architecture & Action Portal</h2>
      <p className="text-xs text-zinc-400 mb-4">
        Convert High-Intent Video Traffic Into Bookings & Direct Revenue
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-white">Google Directions & Navigation</div>
            <p className="text-[11px] text-zinc-300">Instant 1-tap route mapping to the physical location.</p>
          </div>
        </div>

        <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl flex items-start gap-2.5">
          <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-white">Direct Phone & WhatsApp</div>
            <p className="text-[11px] text-zinc-300">Direct hotline connection for instant reservations or orders.</p>
          </div>
        </div>

        <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl flex items-start gap-2.5">
          <Globe className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-white">Official Website & Menu Portal</div>
            <p className="text-[11px] text-zinc-300">Direct link to merchant's external booking engine.</p>
          </div>
        </div>

        <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-white">Claim & Verify Badge</div>
            <p className="text-[11px] text-zinc-300">Clear ownership badge building consumer trust.</p>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-[#0f131f] border border-zinc-800 rounded-xl p-3.5 text-center">
      <div className="text-2xl font-black text-emerald-400 tabular-nums">62% Action Conversion Rate</div>
      <div className="text-xs text-zinc-400 font-medium mt-0.5">
        From Video Review Impression to Directions, Phone Calls, or Web Clicks
      </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 10: Recording Studio Hardware Lock
// ----------------------------------------------------------------------
const Slide10: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="text-xs font-bold tracking-widest text-emerald-400 uppercase mb-2">
        10 · ANTI-FRAUD ENGINE
      </div>
      <h2 className="text-2xl font-bold text-white mb-1">The Recording Studio: Hardware Camera Lock</h2>
      <p className="text-xs text-zinc-400 mb-4">
        Unbreachable Anti-Fraud Infrastructure Built Directly into the PWA
      </p>

      <div className="space-y-2.5 mb-4">
        <div className="p-2.5 bg-[#0f131f] border border-zinc-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold text-white">1. Hardware Camera Enforcement</span>
          </div>
          <span className="text-[11px] text-zinc-400">Direct WebRTC getUserMedia front-camera lock</span>
        </div>

        <div className="p-2.5 bg-[#0f131f] border border-zinc-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-xs font-bold text-white">2. No Gallery Uploads</span>
          </div>
          <span className="text-[11px] text-zinc-400">Prohibits pre-recorded file system uploads</span>
        </div>

        <div className="p-2.5 bg-[#0f131f] border border-zinc-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-xs font-bold text-white">3. Hard 60-Second Cap</span>
          </div>
          <span className="text-[11px] text-zinc-400">Automatic capture termination & timer</span>
        </div>

        <div className="p-2.5 bg-[#0f131f] border border-zinc-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-xs font-bold text-white">4. Audio Waveform & Captions</span>
          </div>
          <span className="text-[11px] text-zinc-400">Real-time transcription via Bunny Smart Captions</span>
        </div>
      </div>
    </div>

    <div className="bg-[#0f131f] border border-zinc-800 rounded-xl p-3 text-center">
      <div className="text-xs font-bold text-white">Unbreachable Proof-of-Authenticity Moat</div>
      <div className="text-[11px] text-zinc-400 mt-0.5">
        Prevents synthetic media, deepfakes, and automated text spam at the hardware layer.
      </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 11: Interactive Map & Geolocation Discovery
// ----------------------------------------------------------------------
const Slide11: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-2">
        11 · GEOLOCATION
      </div>
      <h2 className="text-2xl font-bold text-white mb-1">Interactive Map & Geolocation Discovery</h2>
      <p className="text-xs text-zinc-400 mb-4">
        Real-Time Local Discovery Engine Powered by Mapbox / Google Maps
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl">
          <div className="text-xs font-bold text-white mb-1">Dynamic Video Pins</div>
          <p className="text-[11px] text-zinc-300">
            Map markers showing video preview thumbnails of top-rated local places.
          </p>
        </div>

        <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl">
          <div className="text-xs font-bold text-white mb-1">Proximity Radius Filter</div>
          <p className="text-[11px] text-zinc-300">
            1mi, 5mi, 10mi radius sliders tuned for immediate local intent discovery.
          </p>
        </div>

        <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl">
          <div className="text-xs font-bold text-white mb-1">Instant Drawer Sheet</div>
          <p className="text-[11px] text-zinc-300">
            Sliding drawer presenting verified video reviews for any selected map pin.
          </p>
        </div>
      </div>
    </div>

    <div className="bg-[#0f131f] border border-zinc-800 rounded-xl p-4 flex items-center justify-around text-center">
      <div>
        <div className="text-2xl font-black text-blue-400 tabular-nums">78%</div>
        <div className="text-[10px] text-zinc-400 font-medium">Discover Places Within 2 Miles</div>
      </div>
      <div className="w-px h-10 bg-zinc-800" />
      <div>
        <div className="text-2xl font-black text-emerald-400 tabular-nums">&lt; 15s</div>
        <div className="text-[10px] text-zinc-400 font-medium">Average Time-to-Decision</div>
      </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 12: B2B Merchant Suite: Claiming
// ----------------------------------------------------------------------
const Slide12: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="text-xs font-bold tracking-widest text-purple-400 uppercase mb-2">
        12 · B2B MERCHANT SUITE
      </div>
      <h2 className="text-2xl font-bold text-white mb-1">Verification & Claiming Protocol</h2>
      <p className="text-xs text-zinc-400 mb-4">
        Empowering Business Owners to Control Their Digital Reputation
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl">
          <div className="text-xs font-bold text-white mb-1">1-Click Business Claiming</div>
          <p className="text-[11px] text-zinc-300">Phone or document verification granting full admin portal access.</p>
        </div>

        <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl">
          <div className="text-xs font-bold text-white mb-1">Official Verified Badge</div>
          <p className="text-[11px] text-zinc-300">High-trust blue badge signaling official management to consumers.</p>
        </div>

        <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl">
          <div className="text-xs font-bold text-white mb-1">Customer Inquiry Hub</div>
          <p className="text-[11px] text-zinc-300">Respond directly to customer video inquiries and questions.</p>
        </div>

        <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl">
          <div className="text-xs font-bold text-white mb-1">Ending Review Extortion</div>
          <p className="text-[11px] text-zinc-300">Protection against illegitimate negative claims via video proof.</p>
        </div>
      </div>
    </div>

    <div className="bg-[#0f131f] border border-zinc-800 rounded-xl p-3.5 text-center">
      <div className="text-2xl font-extrabold text-purple-400 tabular-nums">94% Retention Rate</div>
      <div className="text-xs text-zinc-400 font-medium mt-0.5">
        Claimed Merchants Retain Paid SaaS Subscriptions After 30 Days
      </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 13: B2B Growth Tools: Tabletop QR Stands
// ----------------------------------------------------------------------
const Slide13: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="text-xs font-bold tracking-widest text-emerald-400 uppercase mb-2">
        13 · PHYSICAL GROWTH
      </div>
      <h2 className="text-2xl font-bold text-white mb-1">Tabletop QR Stands & Zero-CAC Review Loops</h2>
      <p className="text-xs text-zinc-400 mb-4">
        Generating On-Premise Authentic Video Reviews at Scale
      </p>

      <div className="space-y-2.5 mb-4">
        <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl flex items-center gap-3">
          <QrCode className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="text-xs font-bold text-white">1. Acrylic Tabletop QR Stand</div>
            <p className="text-[11px] text-zinc-300">Placed on restaurant tables or checkout counters with custom merchant QR code.</p>
          </div>
        </div>

        <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl flex items-center gap-3">
          <Zap className="w-5 h-5 text-blue-400 shrink-0" />
          <div>
            <div className="text-xs font-bold text-white">2. Instant Scan (No App Download)</div>
            <p className="text-[11px] text-zinc-300">Diner scans QR code and opens 60s recording studio instantly in mobile browser.</p>
          </div>
        </div>

        <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl flex items-center gap-3">
          <Video className="w-5 h-5 text-purple-400 shrink-0" />
          <div>
            <div className="text-xs font-bold text-white">3. Live Video Review Created</div>
            <p className="text-[11px] text-zinc-300">Customer records 60s video in exchange for instant perk or loyalty point.</p>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-[#0f131f] border border-zinc-800 rounded-xl p-3 text-center">
      <div className="text-xs font-bold text-emerald-400">Zero-CAC Economics</div>
      <div className="text-xs text-zinc-300 mt-1">
        35 Tables · 140 Daily Diners · <strong>4 - 8 Verified Video Reviews Daily</strong> per Merchant
      </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 14: Branded Ad Exporter & 1-Click Embeds
// ----------------------------------------------------------------------
const Slide14: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-2">
        14 · MARKETING TOOLS
      </div>
      <h2 className="text-2xl font-bold text-white mb-1">Branded Ad Exporter & 1-Click Embeds</h2>
      <p className="text-xs text-zinc-400 mb-4">
        Turn Customer Video Reviews Into Multi-Channel High-Converting Ads
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3.5 bg-[#0f131f] border border-zinc-800 rounded-xl">
          <div className="text-xs font-bold text-white mb-1">Branded Video Ad Exporter</div>
          <p className="text-[11px] text-zinc-300 leading-normal">
            Export customer video reviews with custom merchant logo overlays and discount watermarks optimized for TikTok & Instagram Ads.
          </p>
        </div>

        <div className="p-3.5 bg-[#0f131f] border border-zinc-800 rounded-xl">
          <div className="text-xs font-bold text-white mb-1">1-Click Website Widget</div>
          <p className="text-[11px] text-zinc-300 leading-normal">
            Lightweight JS snippet to embed video reviews on merchant's Shopify, WooCommerce, or custom site.
          </p>
        </div>
      </div>
    </div>

    <div className="bg-[#0f131f] border border-zinc-800 rounded-xl p-4 flex items-center justify-around text-center">
      <div>
        <div className="text-2xl font-black text-blue-400 tabular-nums">10x</div>
        <div className="text-[10px] text-zinc-400 font-medium">Ad Return vs Static Banners</div>
      </div>
      <div className="w-px h-10 bg-zinc-800" />
      <div>
        <div className="text-2xl font-black text-emerald-400 tabular-nums">&lt; 5 min</div>
        <div className="text-[10px] text-zinc-400 font-medium">Embed Setup Time</div>
      </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 15: Tech Architecture & Cost Advantage
// ----------------------------------------------------------------------
const Slide15: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="text-xs font-bold tracking-widest text-cyan-400 uppercase mb-2">
        15 · INFRASTRUCTURE
      </div>
      <h2 className="text-2xl font-bold text-white mb-1">Technical Architecture: Bunny.net & Cloud SQL</h2>
      <p className="text-xs text-zinc-400 mb-4">
        High-Performance Edge Streaming Engine Built for Extreme Margin Efficiency
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl">
          <div className="text-xs font-bold text-cyan-400 mb-0.5">Bunny.net Stream</div>
          <p className="text-[11px] text-zinc-300">Ultra-low cost edge video encoding & global CDN delivery.</p>
        </div>

        <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl">
          <div className="text-xs font-bold text-cyan-400 mb-0.5">Bunny Smart Captions</div>
          <p className="text-[11px] text-zinc-300">Automated AI transcription and subtitle generation.</p>
        </div>

        <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl">
          <div className="text-xs font-bold text-blue-400 mb-0.5">Cloud SQL (PostgreSQL)</div>
          <p className="text-[11px] text-zinc-300">High-concurrency store for places, reviews, and user accounts.</p>
        </div>

        <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl">
          <div className="text-xs font-bold text-purple-400 mb-0.5">Bunny NoSQL Storage</div>
          <p className="text-[11px] text-zinc-300">Scalable document/KV store for fast metadata caching.</p>
        </div>
      </div>
    </div>

    <div className="bg-[#0f131f] border border-zinc-800 rounded-xl p-3">
      <div className="text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Cost Advantage Comparison</div>
      <table className="w-full text-[11px] text-left">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-400">
            <th className="py-0.5">Provider</th>
            <th className="py-0.5">Bandwidth / GB</th>
            <th className="py-0.5">Encoding</th>
            <th className="py-0.5">Gross Margin</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
          <tr>
            <td className="py-1 font-bold text-cyan-400">Bunny.net</td>
            <td className="text-cyan-400 font-mono">$0.005 / GB</td>
            <td className="text-cyan-400">Included Free</td>
            <td className="text-emerald-400 font-bold">88% Margin</td>
          </tr>
          <tr>
            <td className="py-1">Mux Video</td>
            <td className="font-mono">$0.045 / GB</td>
            <td>$0.06 / min</td>
            <td>42% Margin</td>
          </tr>
          <tr>
            <td className="py-1">AWS CloudFront</td>
            <td className="font-mono">$0.075 / GB</td>
            <td>$0.015 / min</td>
            <td>28% Margin</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 16: Business Model & Revenue Projections
// ----------------------------------------------------------------------
const Slide16: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="text-xs font-bold tracking-widest text-emerald-400 uppercase mb-2">
        16 · FINANCIAL MODEL
      </div>
      <h2 className="text-2xl font-bold text-white mb-1">Business Model & Revenue Architecture</h2>
      <p className="text-xs text-zinc-400 mb-4">
        Scalable B2B SaaS Subscriptions and High-Margin Revenue Loops
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-[#0f131f] border border-zinc-800 rounded-xl">
          <div className="text-xs font-bold text-zinc-400 mb-1">FREE TIER ($0 / mo)</div>
          <ul className="text-[11px] text-zinc-300 space-y-1">
            <li>· Basic business listing & profile</li>
            <li>· View public video reviews</li>
            <li>· Reply to customer comments</li>
          </ul>
        </div>

        <div className="p-3 bg-[#0f131f] border border-blue-500/40 rounded-xl">
          <div className="text-xs font-bold text-blue-400 mb-1">PREMIUM PRO ($149 / mo)</div>
          <ul className="text-[11px] text-zinc-300 space-y-1">
            <li>· Tabletop QR stand physical kit</li>
            <li>· Branded video ad exporter & widgets</li>
            <li>· Priority video feed placement</li>
            <li>· Direct call / direction lead buttons</li>
          </ul>
        </div>
      </div>
    </div>

    <div className="bg-[#0f131f] border border-zinc-800 rounded-xl p-3.5 flex items-center justify-around text-center">
      <div>
        <div className="text-xs text-zinc-400 font-bold uppercase">TAM</div>
        <div className="text-lg font-bold text-white tabular-nums">$152 Billion</div>
      </div>
      <div className="w-px h-8 bg-zinc-800" />
      <div>
        <div className="text-xs text-zinc-400 font-bold uppercase">US SMB Market</div>
        <div className="text-lg font-bold text-blue-400 tabular-nums">33.2 Million</div>
      </div>
      <div className="w-px h-8 bg-zinc-800" />
      <div>
        <div className="text-xs text-zinc-400 font-bold uppercase">Target ARR (0.1% Pen)</div>
        <div className="text-lg font-bold text-emerald-400 tabular-nums">$59 Million</div>
      </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 17: Competitive Moat & Matrix
// ----------------------------------------------------------------------
const Slide17: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="text-xs font-bold tracking-widest text-amber-400 uppercase mb-2">
        17 · COMPETITIVE MOAT
      </div>
      <h2 className="text-2xl font-bold text-white mb-1">Why Incumbents Cannot Replicate Yoouz</h2>
      <p className="text-xs text-zinc-400 mb-3">
        Structural Innovator's Dilemma Protecting Yoouz Market Position
      </p>

      <div className="bg-[#0f131f] border border-zinc-800 rounded-xl p-3 mb-3">
        <table className="w-full text-[11px] text-left">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="py-1">Capability</th>
              <th className="py-1 text-blue-400 font-bold">Yoouz</th>
              <th className="py-1">Yelp</th>
              <th className="py-1">Google Maps</th>
              <th className="py-1">TikTok</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
            <tr>
              <td className="py-1 font-medium">Mandatory Live Video</td>
              <td className="text-emerald-400 font-bold">YES</td>
              <td className="text-red-400">NO</td>
              <td className="text-red-400">NO</td>
              <td className="text-red-400">NO</td>
            </tr>
            <tr>
              <td className="py-1 font-medium">Hardware Camera Lock</td>
              <td className="text-emerald-400 font-bold">YES</td>
              <td className="text-red-400">NO</td>
              <td className="text-red-400">NO</td>
              <td className="text-red-400">NO</td>
            </tr>
            <tr>
              <td className="py-1 font-medium">Zero-Gallery Uploads</td>
              <td className="text-emerald-400 font-bold">YES</td>
              <td className="text-red-400">NO</td>
              <td className="text-red-400">NO</td>
              <td className="text-red-400">NO</td>
            </tr>
            <tr>
              <td className="py-1 font-medium">Integrated B2B SaaS</td>
              <td className="text-emerald-400 font-bold">YES</td>
              <td>Ad-Only</td>
              <td>Ad-Only</td>
              <td>Influencers</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-300">
      <div className="p-2 bg-[#0f131f] border border-zinc-800 rounded-lg">
        <strong className="text-white block">Innovator's Dilemma:</strong>
        Google/Yelp cannot enforce live video without destroying 95%+ of text submission volume.
      </div>
      <div className="p-2 bg-[#0f131f] border border-zinc-800 rounded-lg">
        <strong className="text-white block">Zero-CAC QR Loop:</strong>
        Self-sustaining physical deployment on restaurant tables drives organic reviews.
      </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Slide 18: Roadmap & Capital Allocation
// ----------------------------------------------------------------------
const Slide18: React.FC = () => (
  <div className="flex flex-col justify-between h-full py-1">
    <div>
      <div className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-2">
        18 · ROADMAP & INVESTMENT
      </div>
      <h2 className="text-2xl font-bold text-white mb-1">Execution Roadmap & Investment Opportunity</h2>
      <p className="text-xs text-zinc-400 mb-4">
        Capital Allocation to Drive 10x Network Growth and Market Expansion
      </p>

      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <div className="p-3 bg-[#0f131f] border border-emerald-500/40 rounded-xl">
          <div className="text-[10px] font-bold text-emerald-400 uppercase mb-1">Phase 1 · COMPLETED</div>
          <div className="text-xs font-bold text-white mb-1">Core Protocol & PWA</div>
          <p className="text-[10px] text-zinc-300">
            Hardware recording lock, Bunny.net edge integration, Cloud SQL database, B2B portal.
          </p>
        </div>

        <div className="p-3 bg-[#0f131f] border border-blue-500/40 rounded-xl">
          <div className="text-[10px] font-bold text-blue-400 uppercase mb-1">Phase 2 · CURRENT (Q1 2026)</div>
          <div className="text-xs font-bold text-white mb-1">Tabletop QR Rollout</div>
          <p className="text-[10px] text-zinc-300">
            Rollout in top 5 metro markets, merchant claim campaign, ad exporter launch.
          </p>
        </div>

        <div className="p-3 bg-[#0f131f] border border-purple-500/40 rounded-xl">
          <div className="text-[10px] font-bold text-purple-400 uppercase mb-1">Phase 3 · NEXT 12 MONTHS</div>
          <div className="text-xs font-bold text-white mb-1">Nationwide Expansion</div>
          <p className="text-[10px] text-zinc-300">
            Nationwide scale, enterprise multi-location portal, developer API ecosystem.
          </p>
        </div>
      </div>
    </div>

    <div className="bg-[#0f131f] border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between">
      <div>
        <div className="text-xs font-bold text-white">Capital Allocation</div>
        <div className="text-[11px] text-zinc-400 mt-0.5">45% Sales & Field Acquisition · 30% Tech & Edge · 25% Operations</div>
      </div>
      <div className="text-right">
        <div className="text-xs font-bold text-blue-400">investors@yoouz.com</div>
        <div className="text-[10px] text-zinc-500 font-mono">yoouz.com/pitch</div>
      </div>
    </div>
  </div>
);
