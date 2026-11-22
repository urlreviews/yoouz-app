export interface PitchCallout {
  id: string;
  title: string;
  tag: string;
  description: string;
}

export interface PitchMetric {
  label: string;
  value: string;
  detail: string;
}

export interface PitchButtonGuideItem {
  control: string;
  location: string;
  action: string;
}

export type PitchActId = "thesis" | "product" | "scale";

export interface PitchChapter {
  page: number;
  act: PitchActId;
  actLabel: string;
  shortTitle: string;
  kicker: string;
  headline: string;
  subheadline: string;
  imagePath: string;
  mobileImagePath?: string;
  secondaryImagePath?: string;
  frameMode: "desktop" | "mobile" | "embed" | "dual" | "data";
  imageCaption: string;
  mobileCaption?: string;
  callouts: PitchCallout[];
  metrics: PitchMetric[];
  buttonGuide?: PitchButtonGuideItem[];
}

export interface ClaimedPortfolioEntity {
  name: string;
  domain: string;
  category: string;
  status: string;
  highlights: string;
}

export const PITCH_ACTS: { id: PitchActId; label: string; subtitle: string; range: string }[] = [
  {
    id: "thesis",
    label: "Act I · Investment Thesis",
    subtitle: "60-second executive case, market, moat & unit economics",
    range: "01–07",
  },
  {
    id: "product",
    label: "Act II · Live Product Tour",
    subtitle: "Every desktop & mobile screen, workflow & interactive control",
    range: "08–19",
  },
  {
    id: "scale",
    label: "Act III · Global Scale & Round",
    subtitle: "75+ language SEO, Bunny.net + Cloud SQL & Pre-Seed roadmap",
    range: "20–22",
  },
];

export const ANONYMOUS_CLAIMED_ENTITIES: ClaimedPortfolioEntity[] = [
  {
    name: "Yoouz Official",
    domain: "yoouz.com",
    category: "Trust & Visual Review Platform",
    status: "Verified & Claimed",
    highlights: "Live Photo Reviews · Website Embed Active · Anonymous Owner Badge",
  },
  {
    name: "Anything Virtual",
    domain: "anythingvirtual.net",
    category: "Digital Services & Technology",
    status: "Verified & Claimed",
    highlights: "Claimed Business Portal · Owner Shield On · Zero Public Email",
  },
  {
    name: "Sephora",
    domain: "sephora.com",
    category: "Beauty & Luxury Retail",
    status: "Auto-Indexed + Photo Proof",
    highlights: "5.0 Whole-Star Proof · 75+ Language Localized SEO Active",
  },
  {
    name: "Apple",
    domain: "apple.com",
    category: "Consumer Technology",
    status: "Auto-Indexed + Photo Proof",
    highlights: "Verified Customer Hardware Photos · Trending Discovery Feed",
  },
  {
    name: "Noma",
    domain: "noma.dk",
    category: "Fine Dining & Hospitality",
    status: "Auto-Indexed + Photo Proof",
    highlights: "5.0 Whole-Star Plated Proof · Trending Discovery Feed",
  },
  {
    name: "Books And Beans",
    domain: "booksandbeans.co.uk",
    category: "Independent Cafe & Bakery",
    status: "Auto-Indexed + Photo Proof",
    highlights: "5.0 Verified U/FSQUT7 Photo Proof · Local QR Ready",
  },
  {
    name: "Zara",
    domain: "zara.com",
    category: "Global Fashion Retail",
    status: "Auto-Indexed + Photo Proof",
    highlights: "5.0 In-Store Rack & Apparel Proof · 75+ Languages",
  },
  {
    name: "Auto Werkplaats Brugge",
    domain: "autowerkplaatsbrugge.be",
    category: "Automotive & Local Services",
    status: "Auto-Indexed + Photo Proof",
    highlights: "5.0 Live Workshop Bay Proof · Verified U/HE33FZ",
  },
  {
    name: "Wolt",
    domain: "wolt.com",
    category: "Food Delivery & Quick Commerce",
    status: "Auto-Indexed + Embed Ready",
    highlights: "5.0 Whole-Star Delivery Proof · 1-Line Storefront Widget",
  },
  {
    name: "Lerner & Rowe Injury Attorneys",
    domain: "lernerandrowe.com",
    category: "Legal Services",
    status: "Auto-Indexed Profile",
    highlights: "Structured Brand Hub · Google Page-1 Rich Snippet Ready",
  },
  {
    name: "Hotel Julien",
    domain: "hotel-julien.com",
    category: "Boutique Luxury Hospitality",
    status: "Auto-Indexed Profile",
    highlights: "Real Guest Room & Property Proof · Counter QR Ready",
  },
];

export const PITCH_CHAPTERS: PitchChapter[] = [
  // =========================================================================
  // ACT I · INVESTMENT THESIS (01–07)
  // =========================================================================
  {
    page: 1,
    act: "thesis",
    actLabel: "Act I · Investment Thesis",
    shortTitle: "Executive Thesis: 1 Live Photo = 1,000 Words",
    kicker: "01 · EXECUTIVE SUMMARY & CATEGORY THESIS",
    headline: "One Live Camera Photo Replaces 1,000 Words of Fake Text Reviews.",
    subheadline:
      "Generative AI has destroyed trust in text reviews across Google, Yelp, and Trustpilot overnight. Yoouz replaces fakeable essays and camera-roll uploads with a single unspoofable primitive: 1 live hardware camera photo + 1 to 5 solid whole stars captured in 3 seconds—with zero signup wall.",
    imagePath: "/pitch-assets/v3/home-desktop.png",
    mobileImagePath: "/pitch-assets/v3/home-mobile.png",
    frameMode: "dual",
    imageCaption: "Live Production Desktop (1440px) — yoouz.com Universal Search, Category Pills & Live Photo Proof Feed",
    mobileCaption: "Live Production Mobile PWA (390px) — Dark Obsidian Feed + Floating Liquid-Glass Camera Dock",
    callouts: [
      {
        id: "01",
        title: "Unspoofable Visual Proof at the Point of Experience",
        tag: "Hardware Camera Only",
        description:
          "Text essays and gallery uploads are blocked completely. Every Yoouz review is a real-time photograph of the actual product, meal, hotel room, or storefront captured on hardware.",
      },
      {
        id: "02",
        title: "3-Second Contribution Velocity With Zero Account Wall",
        tag: "No Email · No Password",
        description:
          "Shoppers snap 1 photo, tap 1–5 solid whole stars, and publish immediately. Yoouz auto-provisions a persistent U/XXXXXX handle and offers a 1-time optional Face ID Passkey afterward.",
      },
      {
        id: "03",
        title: "Autonomous Global Supply Across 543+ Indexed Brands",
        tag: "Zero Cold-Start Problem",
        description:
          "Searching any website domain or physical street venue auto-builds its verified-style brand page with logo, cover banner, and SEO route before the merchant ever signs up.",
      },
      {
        id: "04",
        title: "~95%+ Gross Margin B2B SaaS on Lean Photo Infrastructure",
        tag: "$0 / $49 / $149 Monthly SaaS",
        description:
          "Every live photo compresses to ~120 KB on Bunny.net global edge CDN backed by Cloud SQL PostgreSQL—unlocking software-grade gross margins with $0 paid-ad CAC.",
      },
    ],
    metrics: [
      { label: "Review Creation Time", value: "3 Seconds", detail: "1 live camera photo + 1–5 whole stars" },
      { label: "Fake Text & Gallery Uploads", value: "0% Allowed", detail: "Strict native hardware shutter protocol" },
      { label: "Live Production Index", value: "543+ Brands", detail: "62 live photo reviews · 75+ languages" },
    ],
    buttonGuide: [
      { control: "Universal Search Bar", location: "Hero Center", action: "Resolves any brand, street venue, or URL (e.g. sephora.com) instantly." },
      { control: "Category Filter Pills", location: "Below Search", action: "Filters live photo proof by All, Hotels, Restaurants, Products, Services, or Places." },
      { control: "Live Photo Cards", location: "Main Grid", action: "Opens the edge-to-edge Photo Reel with 5-button social rail and threaded comments." },
      { control: "+ Add Review / White Camera", location: "Top Bar & Mobile Dock", action: "Launches the 3-second native live camera capture workflow immediately." },
    ],
  },
  {
    page: 2,
    act: "thesis",
    actLabel: "Act I · Investment Thesis",
    shortTitle: "Why Live Photos Beat Both Fake Text & Video Reviews",
    kicker: "02 · THE FORMAT BREAKTHROUGH (WHY LIVE PHOTO WINS)",
    headline: "Text Is Dead to AI. Video Is Too Heavy to Record. Live Photo Hits the Golden Sweet Spot.",
    subheadline:
      "Legacy platforms bet on text (now flooded by LLM spam). Video review startups failed because 98% of customers refuse to speak on camera in public and streaming costs crush margins. One live photo delivers instant visual proof in 0.2 seconds at 1/250th the infrastructure cost.",
    imagePath: "/pitch-assets/v3/reel-desktop.png",
    mobileImagePath: "/pitch-assets/v3/reel-mobile.png",
    frameMode: "data",
    imageCaption: "Format Economics & Behavioral Comparison — Why 3-Second Live Photo Proof Beats Legacy Text and Heavy Video Platforms",
    callouts: [
      {
        id: "01",
        title: "10x Higher Customer Completion Rate Than Video or Essays",
        tag: "Zero Camera Shyness",
        description:
          "Consumers will not film a 30-second monologue in a restaurant or type 3 paragraphs on a phone. Everyone already takes a 1-second photo of their meal, hotel room, or unboxing.",
      },
      {
        id: "02",
        title: "0.2-Second Glanceable Buyer Verification",
        tag: "Instant Decision Speed",
        description:
          "Shoppers scan 8 real customer photos in 3 seconds—no headphones required, no buffering, no scrubbing through 45-second talking-head clips.",
      },
      {
        id: "03",
        title: "250x Lower Cloud Storage & Bandwidth Cost (~120 KB vs. 30 MB)",
        tag: "~95%+ Gross Margin Driver",
        description:
          "Sharp-compressed ~120 KB JPEGs on Bunny.net CDN cost fractions of a penny per 10,000 impressions, eliminating video transcoding and streaming burn permanently.",
      },
      {
        id: "04",
        title: "Direct Google Images & Page-1 SERP Indexing",
        tag: "Visual SEO Multiplier",
        description:
          "Original high-DPI customer JPEGs with structured Schema.org metadata rank natively across Google Search, Google Images, and AI answer engines across 75+ languages.",
      },
    ],
    metrics: [
      { label: "Buyer Scan Speed", value: "0.2 Seconds", detail: "Instant visual truth with audio off" },
      { label: "Asset Edge Weight", value: "~120 KB JPEG", detail: "250x lighter than video streaming" },
      { label: "AI Spoof Resistance", value: "Hardware Only", detail: "Live OS camera shutter enforcement" },
    ],
  },
  {
    page: 3,
    act: "thesis",
    actLabel: "Act I · Investment Thesis",
    shortTitle: "Market Opportunity (TAM / SAM / SOM)",
    kicker: "03 · MARKET OPPORTUNITY (TAM / SAM / SOM)",
    headline: "Capturing the $15.8B+ Global Shift From Fake Text Reviews to Verifiable Visual Proof.",
    subheadline:
      "Every local storefront, hotel, restaurant, clinic, and D2C brand depends on customer reviews to win discovery and checkout conversion. As AI spam erodes legacy platforms, Yoouz enters with an unspoofable global visual standard—starting with our high-velocity 1,000-venue Pre-Seed cohort.",
    imagePath: "/pitch-assets/v3/home-desktop.png",
    frameMode: "data",
    imageCaption: "Yoouz Market Sizing — $15.8B+ Global TAM, $4.2B+ Addressable SMB SAM, and 1,000-Venue Pre-Seed SOM (~$1.2M+ ARR)",
    callouts: [
      {
        id: "01",
        title: "$15.8B+ Global Online Review & Local Discovery Economy",
        tag: "Total Addressable Market (TAM)",
        description:
          "Encompasses global consumer review directories, B2B reputation management SaaS, local discovery ads, and e-commerce social-proof widgets worldwide.",
      },
      {
        id: "02",
        title: "$4.2B+ Addressable Multi-Location & SMB Visual Trust Market",
        tag: "Serviceable Market (SAM)",
        description:
          "85M+ restaurants, boutique hotels, retail stores, clinics, salons, and online brands actively paying for review capture, SEO snippets, and storefront conversion tools.",
      },
      {
        id: "03",
        title: "First 1,000 High-Frequency Venues = ~$1.2M+ ARR Wedge",
        tag: "Pre-Seed SOM Target",
        description:
          "Deploying free counter QR standees into 1,000 hospitality, dining, and retail venues creates dense local network effects and converts self-serve merchants at $49–$149/mo.",
      },
      {
        id: "04",
        title: "Borderless Architecture Ready Across 75+ Languages Today",
        tag: "Global Day-One Scale",
        description:
          "Unlike city-by-city legacy directories, Yoouz's autonomous domain indexer and 75+ localized hreflang routes scale across North America, Europe, MENA, and APAC simultaneously.",
      },
    ],
    metrics: [
      { label: "Total Addressable Market", value: "$15.8B+", detail: "Global review & local discovery economy" },
      { label: "Serviceable Market (SAM)", value: "$4.2B+", detail: "85M+ physical & digital storefronts" },
      { label: "Pre-Seed Wedge (SOM)", value: "1,000 Venues", detail: "~$1.2M+ ARR initial merchant cohort" },
    ],
  },
  {
    page: 4,
    act: "thesis",
    actLabel: "Act I · Investment Thesis",
    shortTitle: "Competitive Landscape & Structural Moat",
    kicker: "04 · COMPETITIVE LANDSCAPE MATRIX",
    headline: "Why Incumbents Cannot Copy Yoouz Without Cannibalizing Their Legacy Databases.",
    subheadline:
      "Google Maps, Trustpilot, and Yelp are locked into billions of legacy text reviews, mandatory login walls, and pay-to-play ad models. Yoouz is purpose-built from the ground up around 3-second hardware camera proof, passwordless Passkeys, and $0 CAC physical QR loops.",
    imagePath: "/pitch-assets/v3/business-hub-desktop.png",
    frameMode: "data",
    imageCaption: "Structural Architecture Matrix — Yoouz Live Photo Protocol vs. Google Maps, Trustpilot & Yelp Across 6 Moats",
    callouts: [
      {
        id: "01",
        title: "100% Immune to LLM Review Farms & Stock Photo Uploads",
        tag: "Structural Trust Moat",
        description:
          "Incumbents rely on heuristic moderation to fight infinite AI text spam. Yoouz eliminates the attack vector at capture by requiring a live hardware shutter press.",
      },
      {
        id: "02",
        title: "Zero-Signup 3-Second Flow vs. 70% Login Drop-Off",
        tag: "10x Conversion Advantage",
        description:
          "Google, Yelp, and Trustpilot block mobile guests behind mandatory account forms. Yoouz publishes in 3 seconds with an automatic U/XXXXXX handle and optional 1-time Face ID.",
      },
      {
        id: "03",
        title: "Offline Counter QR Loop That Opens Social Proof First",
        tag: "Physical Distribution Moat",
        description:
          "Scanning a Yoouz QR standee opens the live Business Profile first—displaying real peer photos that trigger natural trust before 1-tap camera capture.",
      },
      {
        id: "04",
        title: "Unboxed Viral Share Cards & 1-Line Storefront Widgets",
        tag: "Owned Brand Multiplier",
        description:
          "Every shared Yoouz review renders a rich 1200×630 photo card with the ★ Yoouz mark across WhatsApp, iMessage, and Telegram—turning customers into organic brand ambassadors.",
      },
    ],
    metrics: [
      { label: "AI & Gallery Spoofing", value: "0% Possible", detail: "Strict native camera hardware gate" },
      { label: "Upfront Login Drop-Off", value: "0% Friction", detail: "Zero email, password, or app download" },
      { label: "Viral Share Attribution", value: "100% Branded", detail: "★ Yoouz mark on every shared photo card" },
    ],
  },
  {
    page: 5,
    act: "thesis",
    actLabel: "Act I · Investment Thesis",
    shortTitle: "Go-To-Market & $0 CAC Growth Flywheel",
    kicker: "05 · GO-TO-MARKET & $0 CAC DISTRIBUTION PLAYBOOK",
    headline: "Four Compounding Organic Growth Loops Scaling Globally With $0 Paid Ads.",
    subheadline:
      "Instead of burning venture capital on Google or Meta ads, Yoouz turns merchant physical foot traffic, autonomous web scraping, 75+ language visual SEO, and unboxed social share cards into a self-reinforcing B2B2C acquisition engine.",
    imagePath: "/pitch-assets/v3/qr-modal-desktop.png",
    frameMode: "data",
    imageCaption: "Yoouz $0 CAC Distribution Flywheel — Counter QR Standees -> Auto-Indexed Profiles -> 75+ Language Visual SEO -> Inbound SaaS Claiming",
    callouts: [
      {
        id: "01",
        title: "Loop 1 · Free Print-Ready Counter & Table QR Standees",
        tag: "Offline Foot Traffic -> Supply",
        description:
          "Restaurants, cafes, boutiques, and clinics place print-ready Yoouz QR kits at tables and checkout counters—converting daily walk-in guests into live photo reviewers at $0 CAC.",
      },
      {
        id: "02",
        title: "Loop 2 · Autonomous Indexing of Any Brand or Venue Worldwide",
        tag: "Zero Cold-Start Supply",
        description:
          "Searching any URL or physical business automatically scrapes its official logo, cover banner, and metadata—making every business on Earth review-ready on Day 1.",
      },
      {
        id: "03",
        title: "Loop 3 · Google Page-1 Visual SEO + Viral 1200×630 Share Cards",
        tag: "75+ Languages + WhatsApp/iMessage",
        description:
          "Fresh customer JPEGs with Schema.org AggregateRating rank across 75+ localized routes, while every shared link carries the crisp ★ Yoouz photo card across messaging apps.",
      },
      {
        id: "04",
        title: "Loop 4 · Inbound Self-Serve Merchant Claiming Into Recurring SaaS",
        tag: "High-Intent B2B Conversion",
        description:
          "Business owners see live customer photos and organic search impressions on their free Yoouz profile, claim ownership at yoouz.com/business, and upgrade to $49–$149/mo.",
      },
    ],
    metrics: [
      { label: "Paid Acquisition Spend", value: "$0 CAC", detail: "100% organic QR, SEO & social share loops" },
      { label: "Localized SEO Reach", value: "75+ Languages", detail: "Automated hreflang & rich star snippets" },
      { label: "B2B Upgrade Trigger", value: "Live Proof Pull", detail: "Merchants claim active organic traffic" },
    ],
  },
  {
    page: 6,
    act: "thesis",
    actLabel: "Act I · Investment Thesis",
    shortTitle: "B2B SaaS Business Model & ~95%+ Gross Margins",
    kicker: "06 · BUSINESS MODEL & UNIT ECONOMICS",
    headline: "Predictable B2B Recurring SaaS With ~95%+ Software Gross Margins.",
    subheadline:
      "Every business starts on our $0 Free Auto-Indexed tier to maximize global directory coverage and SEO density, then upgrades self-serve to $49/mo Claimed Business Pro or $149/mo Growth & Website Widget—backed by ultra-lean ~120 KB Bunny.net photo delivery.",
    imagePath: "/pitch-assets/v3/business-portal-desktop.png",
    frameMode: "data",
    imageCaption: "Yoouz B2B SaaS Tier Architecture — $0 Free Discovery, $49/mo Claimed Pro & $149/mo Growth Widget (~95%+ Gross Margin)",
    callouts: [
      {
        id: "01",
        title: "$0 / mo · Free Auto-Indexed Discovery Tier",
        tag: "Global Supply Engine",
        description:
          "Auto-generated public storefront with brand logo, cover banner, whole-star aggregate score, and unlimited customer live photo reviews to compound organic search traffic.",
      },
      {
        id: "02",
        title: "$49 / mo · Claimed Business Pro Tier",
        tag: "Core SMB Subscription",
        description:
          "Unlocks the Anonymous Verified Claimed Badge, Official Pinned Owner Replies, Direct Customer Chat Inbox, 7D/30D/90D Impression Analytics, and Custom Counter QR Kits.",
      },
      {
        id: "03",
        title: "$149 / mo · Growth & Website Widget Suite",
        tag: "Storefront Conversion Engine",
        description:
          "Unlocks Unlimited 1-Line Website Photo Review Carousels, automatic Google AggregateRating JSON-LD rich snippets, multi-location dashboards, and priority discovery placement.",
      },
      {
        id: "04",
        title: "~95%+ Software Gross Margins via ~120 KB Photo Stack",
        tag: "Bunny.net CDN + Cloud SQL",
        description:
          "Compressing each hardware photo to ~120 KB on Bunny.net edge storage with Cloud SQL PostgreSQL keeps COGS below $0.01 per 1,000 review views—zero video streaming drag.",
      },
    ],
    metrics: [
      { label: "SaaS Pricing Ladder", value: "$0 / $49 / $149", detail: "Free Discovery · Claimed Pro · Growth Widget" },
      { label: "Software Gross Margin", value: "~95%+", detail: "~120 KB Bunny.net CDN + Cloud SQL stack" },
      { label: "CAC Payback Period", value: "Month 1", detail: "Inbound merchant claiming from live pages" },
    ],
  },
  {
    page: 7,
    act: "thesis",
    actLabel: "Act I · Investment Thesis",
    shortTitle: "Live Traction, Founder Edge & Pre-Seed Ask",
    kicker: "07 · LIVE PRODUCTION TRACTION, FOUNDER EDGE & PRE-SEED ASK",
    headline: "15 Years Luxury Hospitality Mastery + Solo Full-Stack Execution. Live at yoouz.com Today.",
    subheadline:
      "Not a slideware concept—Yoouz is fully engineered and live in production today with 543+ indexed businesses, 62 live customer photo reviews across global brands, native WebAuthn Passkeys, dynamic 1200×630 OG share cards, and a full self-serve B2B Business Portal.",
    imagePath: "/pitch-assets/v3/business-portal-desktop.png",
    mobileImagePath: "/pitch-assets/v3/business-portal-mobile.png",
    frameMode: "data",
    imageCaption: "Founder-Led Production Execution & Pre-Seed Capital Allocation — Scaling From Active Production Beta to First 500–1,000 Venues",
    callouts: [
      {
        id: "01",
        title: "Founder Edge: 15 Years Luxury Hospitality + Full-Stack Builder",
        tag: "Zero Agency Burn",
        description:
          "15 years leading frontline luxury hospitality operations paired with solo full-stack engineering execution that shipped the entire consumer PWA, B2B portal, SEO engine, and CDN stack in-house.",
      },
      {
        id: "02",
        title: "Live Production Beta Metrics Right Now on yoouz.com",
        tag: "543+ Brands · 62 Live Photos",
        description:
          "Live customer photo proof spanning Apple, Noma, Books And Beans, Zara, Sephora, Auto Werkplaats Brugge, Wolt, Hotel Julien, and Lerner & Rowe—plus claimed merchant dashboards live in production.",
      },
      {
        id: "03",
        title: "Pre-Seed Allocation: 45% First 500 Venues + 35% Global SEO Scale",
        tag: "80% Distribution & Supply",
        description:
          "45% funds physical counter QR standee rollout across our first 500 hospitality, dining, and retail venues; 35% scales autonomous domain indexing & 75+ language Google Page-1 SEO.",
      },
      {
        id: "04",
        title: "20% Core Product & 1-Click Merchant SaaS Velocity",
        tag: "Shopify · Webflow · Stripe Billing",
        description:
          "Expands 1-click Shopify/Webflow embed apps, automated domain claim verification, and conversion analytics to turn inbound merchant claims into predictable ARR.",
      },
    ],
    metrics: [
      { label: "Founder DNA", value: "15 Yrs + Dev", detail: "Luxury hospitality ops + solo full-stack engineer" },
      { label: "Live Production Index", value: "543+ / 62", detail: "543+ indexed businesses · 62 live photo reviews" },
      { label: "Pre-Seed Milestone", value: "500–1K Venues", detail: "QR rollout, global SEO & $1.2M+ ARR path" },
    ],
  },

  // =========================================================================
  // ACT II · COMPLETE LIVE PRODUCT TOUR — DESKTOP & MOBILE (08–19)
  // =========================================================================
  {
    page: 8,
    act: "product",
    actLabel: "Act II · Live Product Tour",
    shortTitle: "Home Discovery & Category Photo Feed",
    kicker: "08 · LIVE PRODUCT TOUR · HOME DISCOVERY",
    headline: "Zero Sign-Up Wall: Real Customer Photo Proof Immediately Above the Fold.",
    subheadline:
      "Visitors on Desktop (1440px) and Mobile PWA (390px) land straight on a clean obsidian discovery canvas—combining universal URL/brand search, instant vertical category pills, and a high-contrast grid of verified live photo reviews.",
    imagePath: "/pitch-assets/v3/home-desktop.png",
    mobileImagePath: "/pitch-assets/v3/home-mobile.png",
    frameMode: "dual",
    imageCaption: "Desktop Home Discovery (yoouz.com) — Top Navigation Bar, Search Hero, Category Pills & 5-Column Photo Proof Grid",
    mobileCaption: "Mobile PWA Home (390px) — Zero-Obstruction 2-Column Photo Grid & Floating Liquid-Glass Camera Dock",
    callouts: [
      {
        id: "01",
        title: "Clean Obsidian Visual Hierarchy (Apple/Google Craft)",
        tag: "Zero Visual Noise",
        description:
          "Every distracting badge or paragraph snippet is stripped away so the real customer photograph, solid gold 1–5 whole-star score, and verified business squircle logo command instant attention.",
      },
      {
        id: "02",
        title: "Instant Vertical Category Filtering",
        tag: "Hotels · Restaurants · Products · Services",
        description:
          "Single-tap category pills filter live photo proof across hospitality, dining, retail products, and local services without full page reloads.",
      },
      {
        id: "03",
        title: "Thumb-First Liquid-Glass Mobile Dock",
        tag: "Home · Search · Camera · Messages · Profile",
        description:
          "Mobile anchors the signature pure-white circular Camera button dead-center so any shopper can snap a 3-second photo review from anywhere in the app with one thumb tap.",
      },
      {
        id: "04",
        title: "Subtle Trust Footer & Persistent Brand Integrity",
        tag: "Real Customers · Photo Reviews Only · 100% Authentic",
        description:
          "Reinforces Yoouz's core promise cleanly across desktop and mobile without blocking a single pixel of the photo proof cards.",
      },
    ],
    metrics: [
      { label: "First-Paint Clarity", value: "< 0.8s Load", detail: "Bunny.net edge WebP/JPEG photo cards" },
      { label: "Sign-Up Wall", value: "None", detail: "100% open discovery & search on arrival" },
      { label: "Mobile Dock Access", value: "1-Tap Camera", detail: "Center white shutter always in thumb reach" },
    ],
    buttonGuide: [
      { control: "Search Input + White Arrow", location: "Hero Center", action: "Opens live search across 543+ indexed brands or auto-scrapes any pasted domain URL." },
      { control: "Category Pills (All / Hotels / Restaurants...)", location: "Below Search Bar", action: "Filters the live photo feed immediately by industry vertical." },
      { control: "Explore All ->", location: "Section Header Right", action: "Launches the full-screen vertical Photo Reel starting from the newest live review." },
      { control: "Top-Right Bell & Menu (=)", location: "Header Right", action: "Opens real-time activity notifications or the instant zero-flash navigation drawer." },
      { control: "Center White Camera Button", location: "Mobile Bottom Dock / Desktop Header", action: "Triggers the 3-second live hardware photo capture flow." },
    ],
  },
  {
    page: 9,
    act: "product",
    actLabel: "Act II · Live Product Tour",
    shortTitle: "Universal Search & Zero-Signup Auto-Scraping",
    kicker: "09 · LIVE PRODUCT TOUR · UNIVERSAL SEARCH & AUTO-INDEXER",
    headline: "Type Any Brand, Street Venue, or Website URL—Auto-Built in Seconds.",
    subheadline:
      "Businesses never have to register to appear on Yoouz. Typing any brand name or pasting any global domain (e.g. zara.com, sephora.com, or a neighborhood restaurant) resolves a structured business profile with official logo, cover banner, and live photo proof automatically.",
    imagePath: "/pitch-assets/v3/search-desktop.png",
    mobileImagePath: "/pitch-assets/v3/search-mobile.png",
    frameMode: "dual",
    imageCaption: "Desktop Live Search Dropdown — Instant Type-Ahead Across Brands, Domains, Categories & Whole-Star Ratings",
    mobileCaption: "Mobile Full-Screen Search Overlay — Clean Unclipped Input, Instant Trending Brands & Global URL Lookup",
    callouts: [
      {
        id: "01",
        title: "Zero-Truncation Input & Instant Type-Ahead",
        tag: "Search Place, Brand, or URL",
        description:
          "Engineered for crisp single-line legibility on both 390px phones and 1440px desktops—returning instant brand matches with squircle logos, verified checkmarks, and review counts.",
      },
      {
        id: "02",
        title: "Autonomous Domain Scraping Engine",
        tag: "No Merchant Onboarding Required",
        description:
          "If a searched website is not yet in our database, Yoouz's server scraper automatically extracts its clean brand title, official logo, high-res banner, and canonical `/reviews/{domain}` URL.",
      },
      {
        id: "03",
        title: "Trending on Yoouz Quick Discovery",
        tag: "High-Intent Brand Shortcuts",
        description:
          "Surfaces top trending verified brands (Apple, Noma, Sephora, Zara, Books And Beans, Wolt) so first-time visitors immediately see real customer photos in 1 tap.",
      },
      {
        id: "04",
        title: "Solves the Marketplace Cold-Start Forever",
        tag: "Infinite Global Addressable Supply",
        description:
          "Every company with a website or street address on Earth is instantly reviewable on Yoouz—converting consumer searches directly into permanent SEO supply.",
      },
    ],
    metrics: [
      { label: "Merchant Setup Needed", value: "Zero", detail: "Auto-indexed logo, banner & URL slug" },
      { label: "Search Latency", value: "Instant", detail: "Real-time type-ahead + on-demand scrape" },
      { label: "Global Coverage", value: "Any Domain", detail: "Works for local shops & Fortune 500 alike" },
    ],
    buttonGuide: [
      { control: "Search Input Field", location: "Top Bar / Overlay", action: "Accepts any business name, local venue, or raw website domain (e.g. sephora.com)." },
      { control: "Cancel Button", location: "Mobile Search Top-Right", action: "Instantly closes the mobile search overlay back to the active screen." },
      { control: "Trending Brand Rows", location: "Search Results List", action: "Jumps directly to that brand's full Business Profile Hub with live photo proof." },
      { control: "White Submit Arrow (->)", location: "Search Bar Right", action: "Triggers immediate autonomous domain resolution and redirects to the canonical profile." },
    ],
  },
  {
    page: 10,
    act: "product",
    actLabel: "Act II · Live Product Tour",
    shortTitle: "Full-Bleed Photo Reel & 5-Button Social Rail",
    kicker: "10 · LIVE PRODUCT TOUR · IMMERSIVE PHOTO REEL",
    headline: "Edge-to-Edge Live Photo Proof With Real-Time Likes, Comments, Saves & Attribution.",
    subheadline:
      "Tapping any review card opens Yoouz's signature full-bleed Photo Reel. Every frame displays the unedited customer photograph, top-right ★ Yoouz platform mark, verified business header, solid 5-star rating, and a 5-button engagement rail persisted directly to Cloud SQL.",
    imagePath: "/pitch-assets/v3/reel-desktop.png",
    mobileImagePath: "/pitch-assets/v3/reel-mobile.png",
    frameMode: "dual",
    imageCaption: "Desktop Photo Reel — Full-Height Verified Photo Canvas, Brand Pill Overlay, ★ Yoouz Mark & Floating Action Rail",
    mobileCaption: "Mobile Full-Bleed Photo Reel — Swipe-Up Vertical Feed, Top-Right ★ Yoouz Attribution & Thumb-First Rail",
    callouts: [
      {
        id: "01",
        title: "Top-Right ★ Yoouz Platform Attribution Mark",
        tag: "Screenshot & Embed Branding",
        description:
          "A subtle translucent dark-glass `★ Yoouz` mark sits cleanly in the top-right corner of every photo review—so every screenshot, social share, or Google Images result carries Yoouz branding.",
      },
      {
        id: "02",
        title: "Persistent Database Likes & Real-Time Counters",
        tag: "Cloud SQL Backed",
        description:
          "Tapping the Heart icon immediately animates and writes to Cloud SQL PostgreSQL with optimistic UI synchronization—preserving exact like state and counts across sessions and devices.",
      },
      {
        id: "03",
        title: "5-Button Thumb-First Engagement Rail",
        tag: "Follow · Like · Comment · Save · Share",
        description:
          "Shoppers follow trusted reviewers, upvote helpful photo proof, ask live questions in threaded comments, bookmark venues to their Saved list, or launch the native Share Sheet.",
      },
      {
        id: "04",
        title: "Zero-Flicker Bunny.net Edge Preloading",
        tag: "Instant Swipe Stepping",
        description:
          "Adjacent photos pre-decode seamlessly in memory so vertical swiping on iOS Safari and arrow-key stepping on Desktop never show a black loading frame.",
      },
    ],
    metrics: [
      { label: "Interactive Signals", value: "5 Actions", detail: "Follow, Like, Comment, Save, Share" },
      { label: "Like Persistence", value: "100% Real DB", detail: "Atomic PostgreSQL count & user state" },
      { label: "Brand Attribution", value: "★ Yoouz Mark", detail: "Visible on every reel, share & embed" },
    ],
    buttonGuide: [
      { control: "Business Logo + Name Overlay", location: "Bottom-Left of Photo", action: "Opens the full Business Profile Hub (Website, Directions, Call, All Reviews)." },
      { control: "Reviewer Handle (Review by...)", location: "Below Business Name", action: "Opens the contributor's public Member Profile and full photo history." },
      { control: "Heart (Like) Button", location: "Right Action Rail", action: "Toggles red heart and persists exact like count atomically in Cloud SQL." },
      { control: "Comment Bubble", location: "Right Action Rail", action: "Opens the live threaded Q&A drawer with official pinned business owner replies." },
      { control: "Bookmark & Share Buttons", location: "Right Action Rail", action: "Saves the photo review to your profile or opens the native Share Sheet." },
    ],
  },
  {
    page: 11,
    act: "product",
    actLabel: "Act II · Live Product Tour",
    shortTitle: "Unboxed Share Sheet & 1200×630 Dynamic OG Cards",
    kicker: "11 · LIVE PRODUCT TOUR · VIRAL SHARE & SOCIAL PREVIEW ENGINE",
    headline: "Every Shared Link Renders a Crisp Unboxed Photo Card Across WhatsApp, iMessage & X.",
    subheadline:
      "When a user taps Share, Yoouz presents an Apple-grade native bottom sheet previewing the exact unboxed 1200×630 OpenGraph image rendered live by our server—featuring the real photo edge-to-edge, solid gold stars, business squircle logo, and the ★ Yoouz mark.",
    imagePath: "/pitch-assets/v3/share-desktop.png",
    mobileImagePath: "/pitch-assets/v3/share-mobile.png",
    secondaryImagePath: "/pitch-assets/v3/og-card-sample.png",
    frameMode: "dual",
    imageCaption: "Desktop Share Modal — Clean Unboxed Preview Card + 1-Click WhatsApp, WA Business, Messages, Mail, Telegram & Utility Actions",
    mobileCaption: "Mobile iOS-Style Share Sheet — Exact Visual Match to the Live 1200×630 Server-Rendered OG Card",
    callouts: [
      {
        id: "01",
        title: "Unboxed Edge-to-Edge Photo Preview (Zero Clutter)",
        tag: "Matches Live OG Card 1:1",
        description:
          "Stripped away clunky legacy boxed layouts. The share sheet displays the clean unboxed customer photo with bottom scrim typography and top-right ★ Yoouz badge—matching WhatsApp & iMessage previews pixel-for-pixel.",
      },
      {
        id: "02",
        title: "Server-Rendered 1200×630 PNG OG Engine",
        tag: "Sharp + SVG Compositor",
        description:
          "Every review URL dynamically serves a crisp 1200×630 PNG OpenGraph card with the live Bunny.net photo, brand squircle logo, Verified checkmark, and exact 1–5 whole-star rating.",
      },
      {
        id: "03",
        title: "1-Tap Distribution Across 5 Major Messaging Apps",
        tag: "WhatsApp · WA Biz · Messages · Mail · Telegram",
        description:
          "Color-coded native app icons plus Copy Link, OS Native Share Sheet, Bookmark Save, Open Direct Link, and Report tools maximize frictionless word-of-mouth sharing.",
      },
      {
        id: "04",
        title: "Free Viral Brand Impression on Every Single Share",
        tag: "Organic Growth Loop",
        description:
          "Every time a customer sends a product or restaurant recommendation to a friend, the recipient sees verified visual proof stamped with ★ Yoouz—driving zero-cost repeat visits.",
      },
    ],
    metrics: [
      { label: "OG Social Image", value: "1200×630 PNG", detail: "Live server-rendered per review URL" },
      { label: "Direct Channels", value: "5 Messaging Apps", detail: "WhatsApp, WA Biz, Messages, Mail, Telegram" },
      { label: "Preview Parity", value: "100% Identical", detail: "In-app sheet matches social link card" },
    ],
    buttonGuide: [
      { control: "Unboxed Photo Preview Card", location: "Top of Share Sheet", action: "Shows the exact live visual card recipients will see in WhatsApp, iMessage, or Telegram." },
      { control: "WhatsApp / WA Biz / Messages / Mail / Telegram", location: "Primary Row", action: "Launches that messaging app pre-populated with the canonical Yoouz review link." },
      { control: "Copy / Share / Save / Open / Report", location: "Secondary Utility Row", action: "Copies URL to clipboard, invokes OS share sheet, bookmarks, opens direct URL, or flags content." },
      { control: "Done / Close (X)", location: "Bottom & Top-Right", action: "Dismisses the share sheet cleanly back to the exact photo frame." },
    ],
  },
  {
    page: 12,
    act: "product",
    actLabel: "Act II · Live Product Tour",
    shortTitle: "Business Profile Storefront Hub & 6 Conversion CTAs",
    kicker: "12 · LIVE PRODUCT TOUR · COMPLETE BUSINESS STOREFRONT",
    headline: "One Unified Conversion Hub Turning Real Customer Photos Into Website Clicks, Calls & Visits.",
    subheadline:
      "Every auto-indexed or claimed business receives a flagship public storefront at yoouz.com/reviews/{domain}—pairing a widescreen cover banner, squircle brand logo, aggregate rating box, prominent white Add Review CTA, and six direct customer action buttons.",
    imagePath: "/pitch-assets/v3/business-hub-desktop.png",
    mobileImagePath: "/pitch-assets/v3/business-hub-mobile.png",
    frameMode: "dual",
    imageCaption: "Desktop Business Storefront (yoouz.com/reviews/sephora.com) — Split Hub Header + Interactive Photo Proof Gallery",
    mobileCaption: "Mobile Business Storefront (390px) — Cover Banner, Squircle Logo, Add Review Pill & 6 Direct Action Icons",
    callouts: [
      {
        id: "01",
        title: "Institutional Brand Header & Aggregate Score Card",
        tag: "Banner · Squircle Logo · Verified Check",
        description:
          "Combines the business's cover artwork, crisp squircle avatar, domain badge, Follow button, and clean 5.0 whole-star aggregate score card.",
      },
      {
        id: "02",
        title: "Single Pure-White Focal CTA: Add Review",
        tag: "Maximum Visual Contrast",
        description:
          "Following Apple HIG single-focal-button discipline, the crisp white Add Review pill commands immediate conversion intent right inside the rating card.",
      },
      {
        id: "03",
        title: "6 Direct Revenue & Conversion Actions",
        tag: "Website · Directions · Call · Save · Share · Chat",
        description:
          "Shoppers move directly from viewing verified photo proof to visiting the brand's site, launching maps directions, calling, bookmarking, sharing, or opening direct chat.",
      },
      {
        id: "04",
        title: "Photo Reviews / About Tabs + Claim Funnel",
        tag: "Structured Consumer + B2B Hub",
        description:
          "Separates filterable customer photo galleries from structured About details (hours, address, website, phone) and includes a quiet 'Claim this business' trigger for owners.",
      },
    ],
    metrics: [
      { label: "Direct Action Suite", value: "6 Native CTAs", detail: "Website, Directions, Call, Save, Share, Chat" },
      { label: "Primary Focal CTA", value: "1-Tap Camera", detail: "Pure-white Add Review pill in rating card" },
      { label: "Canonical Route", value: "/reviews/{slug}", detail: "Clean SEO URL for every brand worldwide" },
    ],
    buttonGuide: [
      { control: "QR / Share / Report Icons", location: "Banner Top-Right", action: "Opens the business's printable QR Standee modal, Share sheet, or Report dialog." },
      { control: "+ Follow Button", location: "Beside Brand Name", action: "Follows the business for new live photo review updates in your Following feed." },
      { control: "White Add Review Pill", location: "Inside Rating Card", action: "Launches the 3-second native camera capture flow directly for this business." },
      { control: "Website / Directions / Call / Save / Share / Chat", location: "6-Icon Action Strip", action: "Executes direct high-intent customer actions right from the profile." },
      { control: "Photo Reviews / About Segmented Control", location: "Mid-Page Tabs", action: "Switches between the live photo proof grid and verified venue metadata + Claim CTA." },
    ],
  },
  {
    page: 13,
    act: "product",
    actLabel: "Act II · Live Product Tour",
    shortTitle: "Physical-to-Digital QR Standee & Table Tent Flow",
    kicker: "13 · LIVE PRODUCT TOUR · OFFLINE-TO-ONLINE QR ENGINE",
    headline: "Print-Ready Counter QR Kits That Open Social Proof First—Then Capture in 1 Tap.",
    subheadline:
      "Every business profile on Yoouz automatically generates a customizable, print-ready QR code modal. Placing it on dining tables, hotel desks, receipts, or packaging turns everyday physical foot traffic into verified live photo reviews at $0 CAC.",
    imagePath: "/pitch-assets/v3/qr-modal-desktop.png",
    mobileImagePath: "/pitch-assets/v3/business-hub-mobile.png",
    frameMode: "dual",
    imageCaption: "Live Business QR Standee Modal (Desktop) — Instant Scannable QR Code, Print Standee Export & Brand Customization",
    mobileCaption: "Mobile Scan Destination — Lands on the Full Business Front Page First So Guests See Peer Photos Before Tapping Add Review",
    callouts: [
      {
        id: "01",
        title: "Lands on Business Front Page First (Never a Cold Camera)",
        tag: "Trust-First QR Architecture",
        description:
          "Unlike clunky survey forms that ambush guests, scanning a Yoouz QR opens the rich Business Profile front page first—showing peer photos and whole stars that inspire instant participation.",
      },
      {
        id: "02",
        title: "1-Click Print-Ready Table Tents & Counter Cards",
        tag: "Built Into Every Business Page",
        description:
          "Merchants download crisp high-resolution QR standee graphics directly from their profile header or Business Portal—ready to print for counters, menus, and delivery bags.",
      },
      {
        id: "03",
        title: "Captures Guests at the Moment of Peak Delight",
        tag: "10x Higher Response Rate",
        description:
          "Catching customers right when their coffee, plated dish, or luxury purchase is in front of them converts vastly higher than ignored post-visit email surveys.",
      },
      {
        id: "04",
        title: "Seamless Desktop-to-Mobile Cross-Device Handoff",
        tag: "Desktop Browser -> iPhone Camera",
        description:
          "Desktop visitors clicking Add Review or the QR icon simply point their phone camera at the screen to transition straight into mobile hardware capture.",
      },
    ],
    metrics: [
      { label: "QR Acquisition Cost", value: "$0 CAC", detail: "Merchant-placed physical touchpoints" },
      { label: "QR Landing Route", value: "Business Hub", detail: "Full visual context before 1-tap camera" },
      { label: "Print Export", value: "High-Res Ready", detail: "Table tents, counter cards & packaging" },
    ],
    buttonGuide: [
      { control: "QR Icon Button", location: "Business Banner Top-Right", action: "Opens the live scannable QR Code modal for any indexed or claimed business." },
      { control: "Customize / Style Toggle", location: "Inside QR Modal", action: "Customizes standee headline, dark/light print card styling, and call-to-action text." },
      { control: "Download / Print Standee", location: "QR Modal Primary CTA", action: "Exports a print-ready high-DPI card for checkout counters, tables, or receipts." },
      { control: "Copy Direct Profile Link", location: "QR Modal Secondary Action", action: "Copies the canonical yoouz.com/reviews/{slug} link for SMS or email receipts." },
    ],
  },
  {
    page: 14,
    act: "product",
    actLabel: "Act II · Live Product Tour",
    shortTitle: "Instant Native Camera Capture (Front or Back · Zero Gallery)",
    kicker: "14 · LIVE PRODUCT TOUR · ANTI-SPOOFING INSTANT CAMERA PROTOCOL",
    headline: "1 Tap Opens the Phone Camera Instantly—Front or Back. Zero Gallery Uploads.",
    subheadline:
      "There is zero intermediate 'Open Camera' gate. Tapping Add Review launches the phone's native hardware camera immediately—letting customers shoot the building, meal, product, or a selfie together with the place using either the front or rear lens, then tap 1–5 solid whole stars and publish in under 3 seconds.",
    imagePath: "/pitch-assets/v3/business-hub-desktop.png",
    mobileImagePath: "/pitch-assets/v3/camera-mobile.png",
    frameMode: "dual",
    imageCaption: "Desktop QR Handoff & Business Context — Guides Desktop Shoppers Straight Into Mobile Native Camera Capture",
    mobileCaption: "Instant Post-Shutter Rating & Publish Stage — Camera Opens Directly on Tap, Followed by 1–5 Whole Stars & Publish",
    callouts: [
      {
        id: "01",
        title: "Zero Intermediate Screen: Native Camera Opens on 1 Tap",
        tag: "Instant Hardware Shutter",
        description:
          "Tapping Add Review triggers the iOS/Android native camera immediately with zero extra modal steps. Users freely use the rear lens (food, room, storefront, product) or front lens (selfie at the venue).",
      },
      {
        id: "02",
        title: "0% Camera-Roll, Screenshot, or AI Uploads Permitted",
        tag: "Strict Live Capture Only",
        description:
          "Photo library browsing is blocked by protocol. Every single Yoouz review originates from a real physical shutter press captured live in the moment.",
      },
      {
        id: "03",
        title: "Instant 1–5 Solid Whole-Star Tap + Publish Preview",
        tag: "Sub-3-Second Completion",
        description:
          "The millisecond the shutter snaps, Yoouz shows the crisp full-bleed photo preview with 1–5 solid gold stars, a quick Retake button, and the pure-white Publish Photo Review pill.",
      },
      {
        id: "04",
        title: "Server-Side Sharp EXIF & GPS Privacy Scrubbing",
        tag: "~120 KB Bunny.net JPEG",
        description:
          "On publish, Sharp automatically strips private GPS location headers and device metadata while compressing high-DPI JPEGs onto Bunny.net global edge nodes.",
      },
    ],
    metrics: [
      { label: "Camera Launch Delay", value: "0 Extra Taps", detail: "Opens native front/rear camera immediately" },
      { label: "Gallery / AI Uploads", value: "0% Permitted", detail: "Strict live hardware shutter enforcement" },
      { label: "EXIF GPS Privacy", value: "100% Scrubbed", detail: "Stripped automatically on server ingest" },
    ],
    buttonGuide: [
      { control: "Add Review Pill / Dock Camera", location: "Business Hub & Bottom Dock", action: "Launches the phone's native camera app immediately (front or rear lens, zero gallery picker)." },
      { control: "1–5 Solid Gold Stars", location: "Post-Shutter Preview", action: "Sets an unmistakable whole-star rating (1 to 5) with tactile haptic feedback." },
      { control: "Retake Photo", location: "Preview Stage", action: "Re-opens the native camera instantly if the customer wants a sharper shot." },
      { control: "Publish Photo Review", location: "Primary White Pill", action: "Scrubs EXIF via Sharp, uploads ~120 KB JPEG to Bunny.net, and publishes live instantly." },
    ],
  },
  {
    page: 15,
    act: "product",
    actLabel: "Act II · Live Product Tour",
    shortTitle: "Zero-Signup U/XXXXXX Profile & 1-Time Face ID Passkey",
    kicker: "15 · LIVE PRODUCT TOUR · PASSWORDLESS WEBAUTHN IDENTITY",
    headline: "Zero Email. Zero Passwords. Auto U/XXXXXX Handle Locked Forever With 1 Face ID Glance.",
    subheadline:
      "Reviewers never hit a signup form before posting. Publishing their first 3-second photo automatically creates a persistent U/XXXXXX profile—followed by a non-intrusive, 1-time optional iOS Face ID / Android Biometric Passkey prompt that binds their identity to hardware and awards the Verified checkmark.",
    imagePath: "/pitch-assets/v3/profile-desktop.png",
    mobileImagePath: "/pitch-assets/v3/profile-mobile.png",
    secondaryImagePath: "/pitch-assets/v3/iphone-passkey-prompt.png",
    frameMode: "dual",
    imageCaption: "Live Member Profile (Desktop) — Auto-Provisioned U/XXXXXX Handle, Photo Reviews, Saved Places, Following & Passkey Shield",
    mobileCaption: "Native iOS Face ID Passkey Sheet ('Passkey for yoouz.com') + Mobile Profile View — 1-Tap Hardware Lock",
    callouts: [
      {
        id: "01",
        title: "Publish First, Never Register Upfront",
        tag: "Instant U/XXXXXX Handle",
        description:
          "Eliminates the #1 conversion killer in consumer apps. First-time visitors contribute in 3 seconds and receive an instant persistent profile (e.g. U/9D9CY7) automatically.",
      },
      {
        id: "02",
        title: "Native iOS Face ID & Android Biometric Passkey (WebAuthn)",
        tag: "FIDO2 Hardware Security",
        description:
          "One optional Face ID glance saves a cryptographic Passkey in iCloud Keychain or Google Password Manager—restoring the user's entire review history across devices with zero passwords.",
      },
      {
        id: "03",
        title: "Hardware-Bound Verified Reviewer Checkmark",
        tag: "Sybil & Bot Farm Defense",
        description:
          "Passkey-secured reviewers earn the crisp white Verified checkmark across all reviews and comments—making scripted fake reviewer farms economically impossible.",
      },
      {
        id: "04",
        title: "Rename to Any Custom @Username Anytime",
        tag: "Full History Continuity",
        description:
          "Users can stay pseudonymous as U/XXXXXX or claim a custom @username anytime—every past photo review, like, follower, and message syncs automatically.",
      },
    ],
    metrics: [
      { label: "Email / Password Forms", value: "0 Required", detail: "100% passwordless FIDO2 / WebAuthn" },
      { label: "Passkey Setup Time", value: "1 Glance (1x)", detail: "Optional Face ID prompt after first review" },
      { label: "Cross-Device Restore", value: "1-Tap Biometric", detail: "Syncs via iCloud Keychain & Google Passkeys" },
    ],
    buttonGuide: [
      { control: "Save / Restore with Passkey", location: "Profile Banner & Menu Drawer", action: "Triggers native Face ID / Touch ID WebAuthn to bind or restore the account." },
      { control: "Edit Profile / @Handle", location: "Profile Header", action: "Renames the auto-generated U/XXXXXX handle to a custom display name or @username." },
      { control: "Reviews / Saved / Following Tabs", location: "Profile Navigation", action: "Displays all published photo reviews, bookmarked venues, and followed brands/reviewers." },
      { control: "Share Profile / Direct Chat", location: "Public Member Header", action: "Lets shoppers share a trusted taste-maker's profile or message them directly." },
    ],
  },
  {
    page: 16,
    act: "product",
    actLabel: "Act II · Live Product Tour",
    shortTitle: "Instant Mobile PWA Drawer & Home Screen App",
    kicker: "16 · LIVE PRODUCT TOUR · NATIVE-FEEL MOBILE PWA ARCHITECTURE",
    headline: "Zero-Flash Instant Navigation Drawer & 1-Tap Home Screen Install—No App Store Tax.",
    subheadline:
      "Engineered to feel indistinguishable from a native iOS/Android app right inside Safari and Chrome. Opening the top-right menu drawer renders instantaneously with zero black-screen flash, housing Passkey controls, activity shortcuts, Yoouz for Business, and 1-tap PWA install.",
    imagePath: "/pitch-assets/v3/home-desktop.png",
    mobileImagePath: "/pitch-assets/v3/drawer-mobile.png",
    frameMode: "dual",
    imageCaption: "Unified Cross-Platform Architecture — Desktop Shell & Instant Mobile PWA Slide-Out Menu Drawer",
    mobileCaption: "Mobile Navigation Drawer (390px) — Zero-Flash Instant Open, Passkey Shortcut, Business Portal & PWA Install",
    callouts: [
      {
        id: "01",
        title: "Zero-Flash GPU-Accelerated Drawer Transitions",
        tag: "Instantaneous 60fps Response",
        description:
          "Architected without heavy backdrop-blur reflows or delayed portal mounts—so tapping the top-right menu icon reveals every action on the very first frame with zero black flicker.",
      },
      {
        id: "02",
        title: "Grouped Apple-Settings Card Architecture",
        tag: "Identity · Social · Business · System",
        description:
          "Cleanly groups Your Profile + Passkey, Following / Saved / Notifications / Messages, Yoouz for Business claiming, Notification preferences, and Settings & About.",
      },
      {
        id: "03",
        title: "1-Tap Full-Screen Home Screen PWA Install",
        tag: "Zero App Store Friction",
        description:
          "Skip the 60% App Store download drop-off. Customers scan a QR code, use the full app immediately in browser, and optionally pin Yoouz to their iPhone or Android home screen.",
      },
      {
        id: "04",
        title: "Anchored Trust Footer Inside Drawer",
        tag: "Live Photos Only · Real Proof · Global",
        description:
          "Keeps Privacy, Terms, About, and Yoouz's authenticity pillars accessible without cluttering the primary discovery canvas.",
      },
    ],
    metrics: [
      { label: "App Store Friction", value: "0 MB Download", detail: "Instant mobile web + installable PWA" },
      { label: "Drawer Open Speed", value: "0ms Flash", detail: "Instant GPU-composited slide transition" },
      { label: "Navigation Depth", value: "1-Tap Access", detail: "Profile, Passkey, Business & Install" },
    ],
    buttonGuide: [
      { control: "Two-Line Menu Button (=)", location: "Mobile Header Top-Right", action: "Opens the zero-flash slide-out menu drawer immediately." },
      { control: "Your Profile + Passkey Card", location: "Drawer Top Group", action: "Jumps to personal review history or triggers 1-tap Face ID Passkey backup/restore." },
      { control: "Following / Saved / Notifications / Messages", location: "Drawer Social Group", action: "Opens core retention streams with live unread badges." },
      { control: "Yoouz for Business", location: "Drawer Merchant Group", action: "Launches the self-serve business claiming & analytics portal (yoouz.com/business)." },
      { control: "Install Yoouz App", location: "Drawer Bottom CTA", action: "Triggers native Add-to-Home-Screen PWA installation for full-screen launch." },
    ],
  },
  {
    page: 17,
    act: "product",
    actLabel: "Act II · Live Product Tour",
    shortTitle: "Direct Messages & Real-Time Retention Loop",
    kicker: "17 · LIVE PRODUCT TOUR · DIRECT MESSAGING & NOTIFICATIONS",
    headline: "Built-In Direct Chat Connecting High-Intent Shoppers With Businesses & Real Reviewers.",
    subheadline:
      "Closing the gap between visual discovery and real-world purchase. Shoppers message verified businesses directly to check availability or book—or ask fellow reviewers quick follow-up questions—inside a private, spam-protected in-app inbox.",
    imagePath: "/pitch-assets/v3/messages-desktop.png",
    mobileImagePath: "/pitch-assets/v3/messages-mobile.png",
    frameMode: "dual",
    imageCaption: "Desktop Direct Messages Workspace (yoouz.com/messages) — Split Conversation List & Real-Time Chat Thread",
    mobileCaption: "Mobile Direct Messages Inbox (390px) — Clean Obsidian Messaging Stream With Instant Unread Badges",
    callouts: [
      {
        id: "01",
        title: "1-Tap Pre-Purchase Chat From Any Business Hub",
        tag: "Instant Lead Capture",
        description:
          "Shoppers tap Chat right inside a venue's 6-button conversion strip to ask about table bookings, stock, or delivery—converting visual trust directly into merchant revenue.",
      },
      {
        id: "02",
        title: "Peer-to-Peer Reviewer Verification",
        tag: "Ask Real Customers",
        description:
          "Buyers message real photo contributors to ask honest follow-up questions on product durability, room noise, or sizing—deepening community retention.",
      },
      {
        id: "03",
        title: "Real-Time Notification Bell & Unread Counters",
        tag: "Organic Re-Engagement",
        description:
          "Instant unread pills across the top header and mobile bottom dock bring contributors and merchants back whenever a new like, comment, follower, or chat message arrives.",
      },
      {
        id: "04",
        title: "100% Private In-App Routing (Zero Exposed Emails)",
        tag: "Strict Privacy Shield",
        description:
          "All conversations route strictly through Yoouz handles and business IDs—never exposing personal owner or reviewer email addresses publicly.",
      },
    ],
    metrics: [
      { label: "Chat Launch Friction", value: "1 Tap", detail: "Direct from any business or member profile" },
      { label: "Retention Driver", value: "Live Badges", detail: "Real-time notifications across desktop & PWA" },
      { label: "Personal Email Exposure", value: "0% Public", detail: "100% handle-routed private messaging" },
    ],
    buttonGuide: [
      { control: "Messages Icon (Envelope)", location: "Desktop Top Nav / Mobile Bottom Dock", action: "Opens the unified inbox with live unread message count badge." },
      { control: "Search Conversations", location: "Inbox Top", action: "Filters active customer-to-business and peer reviewer threads instantly." },
      { control: "Chat CTA on Business Hub", location: "Business 6-Action Strip", action: "Starts a direct inquiry thread with that verified business." },
      { control: "Block / Report Controls", location: "Thread Header Menu", action: "Protects both consumers and merchant teams from unsolicited spam." },
    ],
  },
  {
    page: 18,
    act: "product",
    actLabel: "Act II · Live Product Tour",
    shortTitle: "1-Line Website Embed Widget (Interactive Live Sandbox)",
    kicker: "18 · LIVE PRODUCT TOUR · B2B STOREFRONT EMBED ENGINE",
    headline: "1-Line Live Photo Review Carousel That Turns Any Merchant Website Into Visual Proof.",
    subheadline:
      "Merchants on the $149/mo Growth tier paste one lightweight iframe snippet into Shopify, Webflow, WordPress, or custom checkouts. Every new customer photo auto-syncs live onto their site alongside Google AggregateRating Schema.org JSON-LD. Test the working widget below.",
    imagePath: "/pitch-assets/v3/embed-standalone.png",
    frameMode: "embed",
    imageCaption: "Live Working Yoouz Website Embed Sandbox — Switch Between Sephora, Apple & Wolt to Test Real-Time Customer Photo Carousels",
    callouts: [
      {
        id: "01",
        title: "60-Second 1-Line Iframe Deployment",
        tag: "Shopify · Webflow · WordPress · Custom",
        description:
          "Drops cleanly into any homepage, product page, or checkout sidebar with automatic responsive sizing, mouse drag, touch swipe, and keyboard arrow controls.",
      },
      {
        id: "02",
        title: "Auto-Syncing Real Customer Photos + ★ Yoouz Trust Seal",
        tag: "Zero Manual Curation",
        description:
          "The moment a customer publishes a new 3-second photo review on Yoouz, it appears live inside the merchant's embedded storefront widget automatically.",
      },
      {
        id: "03",
        title: "Built-In AggregateRating Schema.org JSON-LD Snippet",
        tag: "Google Search Star Snippets",
        description:
          "Ships with copy-ready structured JSON-LD linking the embedded visual proof back to the canonical Yoouz URL—boosting organic Google click-through rates.",
      },
      {
        id: "04",
        title: "Turns Every Merchant's Website Traffic Into Yoouz Growth",
        tag: "B2B2C Viral Multiplier",
        description:
          "Includes a clean 'Add Review' CTA and subtle Yoouz trust link—converting each paying merchant's existing web traffic into new Yoouz users at $0 CAC.",
      },
    ],
    metrics: [
      { label: "Install Time", value: "60 Seconds", detail: "Single responsive iframe + JSON-LD paste" },
      { label: "Pricing Tier", value: "$149 / mo", detail: "Flagship Growth & Website Widget SaaS tier" },
      { label: "Sync Latency", value: "Real-Time", detail: "New customer photos update automatically" },
    ],
    buttonGuide: [
      { control: "Storefront Switcher Pills", location: "Sandbox Header (Below)", action: "Switches the live working embed preview across Sephora, Apple, and Wolt." },
      { control: "Left / Right Carousel Arrows", location: "Inside Live Widget", action: "Steps smoothly through verified customer photo reviews with drag & swipe support." },
      { control: "Business Logo & Rating Header", location: "Widget Top Bar", action: "Displays real aggregate whole-star rating and links to the verified Yoouz profile." },
      { control: "Copy 1-Line Embed Code", location: "Sandbox Footer", action: "Copies the exact production iframe + Schema.org snippet ready for merchant sites." },
    ],
  },
  {
    page: 19,
    act: "product",
    actLabel: "Act II · Live Product Tour",
    shortTitle: "Self-Serve B2B Business Portal & Analytics Suite",
    kicker: "19 · LIVE PRODUCT TOUR · B2B MERCHANT DASHBOARD",
    headline: "Claim in Minutes: Real-Time Impressions, Rating Trends, Owner Replies & Strict Privacy.",
    subheadline:
      "At yoouz.com/business, domain owners and venue managers claim their pre-indexed brand hub to unlock a full SaaS command center—tracking 7D/30D/90D photo review impressions, responding officially to reviews, exporting QR standees, and keeping personal owner emails 100% hidden from public view.",
    imagePath: "/pitch-assets/v3/business-portal-desktop.png",
    mobileImagePath: "/pitch-assets/v3/business-portal-mobile.png",
    frameMode: "dual",
    imageCaption: "Desktop B2B Business Dashboard (yoouz.com/business) — Live Impressions Chart, Verified Reviews KPI, Rating Score & Sidebar Suite",
    mobileCaption: "Mobile B2B Merchant Portal (390px) — Full 7D/30D/90D/All Analytics, Reviews, Messages & QR Code Dock",
    callouts: [
      {
        id: "01",
        title: "Executive KPI Cards & Interactive Trend Charts",
        tag: "7D · 30D · 90D · All Ranges",
        description:
          "Merchants monitor Photo Review Impressions, Verified Photo Review counts, and Overall Rating movement in a clean dark-mode executive dashboard on desktop and mobile.",
      },
      {
        id: "02",
        title: "Official Pinned Owner Replies & Direct Chat Inbox",
        tag: "Turn Feedback Into Loyalty",
        description:
          "Claimed teams post official Verified Owner replies directly inside review comment threads and answer customer pre-purchase chats from one unified workspace.",
      },
      {
        id: "03",
        title: "Built-In QR Standee Generator & Website Embed Manager",
        tag: "Self-Serve Growth Toolkit",
        description:
          "Dedicated sidebar modules let operators download counter QR cards, edit business hours/cover artwork, and activate 1-line website embed carousels in seconds.",
      },
      {
        id: "04",
        title: "Strict Anonymous Owner Privacy Architecture",
        tag: "Zero Personal Email Leaks",
        description:
          "Public profiles display an anonymous 'Business Claimed' shield only—personal owner emails are strictly isolated server-side and never exposed to public clients.",
      },
    ],
    metrics: [
      { label: "Dashboard Modules", value: "6 Core Tools", detail: "Overview, Reviews, Messages, QR, Embed, Profile" },
      { label: "Owner Email Privacy", value: "100% Hidden", detail: "Zero personal email exposure on public views" },
      { label: "Mobile Management", value: "Full Parity", detail: "Manage reviews & chats from any phone" },
    ],
    buttonGuide: [
      { control: "7D / 30D / 90D / All Segmented Bar", location: "Dashboard Top", action: "Updates impression counts, verified review metrics, and performance graphs live." },
      { control: "Impressions / Reviews / Rating Tabs", location: "Analytics Card", action: "Toggles the interactive SVG trend visualization between core merchant KPIs." },
      { control: "Overview / Reviews / Messages / QR Code / Embed", location: "Left Sidebar & Mobile Dock", action: "Navigates across every B2B merchant management workflow." },
      { control: "View Public Page", location: "Header / Sidebar", action: "Opens the live customer-facing storefront (yoouz.com/reviews/{domain}) in 1 click." },
    ],
  },

  // =========================================================================
  // ACT III · GLOBAL SCALE, ARCHITECTURE & ROUND (20–22)
  // =========================================================================
  {
    page: 20,
    act: "scale",
    actLabel: "Act III · Global Scale & Round",
    shortTitle: "Google Page-1 Visual SEO Across 75+ Languages",
    kicker: "20 · GLOBAL ORGANIC DISTRIBUTION ENGINE",
    headline: "Engineered for Google Page 1: Original Photo Indexing Across 75+ Localized Languages.",
    subheadline:
      "Search engines and AI answer engines heavily reward fresh, original user-generated photographs backed by clean Schema.org markup. Every Yoouz business profile automatically generates localized routes (/es, /fr, /de, /ar, /ja, and 70+ more) with full hreflang sitemaps and dynamic OG tags.",
    imagePath: "/pitch-assets/v3/seo-localized-desktop.png",
    mobileImagePath: "/pitch-assets/v3/seo-localized-mobile.png",
    frameMode: "dual",
    imageCaption: "Live Spanish Localized Route (yoouz.com/es/reviews/sephora.com) — Full UI, Schema.org & Metadata Translation",
    mobileCaption: "Mobile Localized SEO Page (/es/reviews/sephora.com) — Native RTL/LTR Support Across 75+ Global Languages",
    callouts: [
      {
        id: "01",
        title: "75+ Automated Localized Language Routes",
        tag: "/es · /fr · /de · /tr · /ar · /ja · /zh...",
        description:
          "Every business page renders localized titles, descriptions, UI labels, and bidirectional hreflang links automatically—capturing high-intent '[Brand] reviews' searches globally.",
      },
      {
        id: "02",
        title: "Server-Side SSR Meta Tags + Schema.org AggregateRating",
        tag: "Rich Star Snippets on Google",
        description:
          "Express injects structured LocalBusiness, Product, and AggregateRating JSON-LD directly into initial HTML so Googlebot, Bing, and social crawlers index exact ratings immediately.",
      },
      {
        id: "03",
        title: "Original High-DPI JPEGs Capture Google Images Traffic",
        tag: "Visual Search Advantage",
        description:
          "Unlike text-only review directories, every Yoouz review creates an original real-world photograph tagged with brand and category context—winning Google Images slots organically.",
      },
      {
        id: "04",
        title: "Compounding Long-Tail Traffic Moat at Zero Ad Spend",
        tag: "Every New Photo Fuels SEO",
        description:
          "Each 3-second customer photo refreshes page freshness signals for search crawlers, driving free buyer traffic back into Yoouz and increasing inbound merchant claim conversion.",
      },
    ],
    metrics: [
      { label: "Localized Languages", value: "75+ Native", detail: "Full RTL & LTR hreflang route architecture" },
      { label: "Structured Markup", value: "Schema.org", detail: "AggregateRating & ImageObject JSON-LD" },
      { label: "Search Acquisition", value: "$0 Paid Ads", detail: "Compounding Page-1 & Google Images traffic" },
    ],
    buttonGuide: [
      { control: "Language Route Prefix (/es, /fr, /de...)", location: "Canonical URL", action: "Serves fully localized UI, SEO titles, meta tags, and Schema.org markup automatically." },
      { control: "Language Selector", location: "Settings / Footer", action: "Lets global travelers switch UI language across 75+ supported locales instantly." },
    ],
  },
  {
    page: 21,
    act: "scale",
    actLabel: "Act III · Global Scale & Round",
    shortTitle: "Ultra-Lean Architecture: Bunny.net CDN + Cloud SQL",
    kicker: "21 · INFRASTRUCTURE & MARGIN ARCHITECTURE",
    headline: "Built for Global Scale & ~95%+ Gross Margins: Bunny.net Global Edge + Cloud SQL PostgreSQL.",
    subheadline:
      "No bloated third-party BaaS tax, no expensive video transcoding pipelines, and no legacy database lock-in. Yoouz runs on a razor-lean full-stack TypeScript/Express server, Cloud SQL (PostgreSQL) relational persistence, and Bunny.net global edge storage.",
    imagePath: "/pitch-assets/v3/home-desktop.png",
    mobileImagePath: "/pitch-assets/v3/reel-mobile.png",
    frameMode: "data",
    imageCaption: "Production Stack Blueprint — Express SSR + Sharp EXIF Pipeline + Bunny.net Global Edge CDN + Cloud SQL PostgreSQL",
    callouts: [
      {
        id: "01",
        title: "Bunny.net Global Edge Storage & Pull Zone CDN",
        tag: "119+ Global PoPs · ~120 KB Photos",
        description:
          "Every live camera photo is Sharp-compressed to ~120 KB and distributed across Bunny.net's ultra-low-cost global edge network—delivering sub-100ms photo loads worldwide at pennies per TB.",
      },
      {
        id: "02",
        title: "Cloud SQL (PostgreSQL) Relational Persistence",
        tag: "ACID Integrity · Drizzle ORM",
        description:
          "All 543+ business profiles, live photo reviews, atomic like counters, threaded comments, Passkey WebAuthn credentials, and direct messages run on structured PostgreSQL.",
      },
      {
        id: "03",
        title: "Sharp Server-Side Image & 1200×630 OG Pipeline",
        tag: "EXIF Scrubbing + Live Social Cards",
        description:
          "A single high-throughput Node.js/Sharp media layer strips private GPS headers on upload and dynamically renders branded 1200×630 social preview PNGs on demand.",
      },
      {
        id: "04",
        title: "Passwordless FIDO2 / WebAuthn Security Core",
        tag: "Zero Password Breaches Possible",
        description:
          "Cryptographic public-key Passkeys bound to device Secure Enclaves eliminate password tables, credential stuffing, and SMS OTP costs completely.",
      },
    ],
    metrics: [
      { label: "Photo Delivery Cost", value: "< $0.01 / 1K", detail: "Bunny.net global edge (~120 KB avg)" },
      { label: "Database Engine", value: "Cloud SQL PG", detail: "ACID relational tables + atomic counters" },
      { label: "Gross Margin Profile", value: "~95%+ SaaS", detail: "Zero video streaming or SMS OTP burn" },
    ],
  },
  {
    page: 22,
    act: "scale",
    actLabel: "Act III · Global Scale & Round",
    shortTitle: "Active Brand Portfolio, 18-Month Roadmap & Pre-Seed Close",
    kicker: "22 · LIVE PORTFOLIO, 18-MONTH ROADMAP & PRE-SEED PARTNERSHIP",
    headline: "Production-Ready Global Trust Infrastructure—Scaling to 1,000+ Venues & $1.2M+ ARR.",
    subheadline:
      "Yoouz has already de-risked the hardest engineering, visual craft, SEO, and anti-spoofing hurdles in production. Pre-Seed capital accelerates physical QR standee distribution, 75+ language SEO capture, and self-serve B2B SaaS conversion.",
    imagePath: "/pitch-assets/v3/business-hub-desktop.png",
    mobileImagePath: "/pitch-assets/v3/business-portal-mobile.png",
    frameMode: "data",
    imageCaption: "Live Active Portfolio (100% Anonymous Owner Badges) + 18-Month Pre-Seed Execution Milestones",
    callouts: [
      {
        id: "01",
        title: "Months 1–6 · First 250–500 Pilot Venues via Counter QR Kits",
        tag: "High-Density Local Loops",
        description:
          "Deploy print-ready counter & table QR standees across flagship dining, hospitality, beauty, and retail districts—proving repeatable $0 CAC review velocity per venue.",
      },
      {
        id: "02",
        title: "Months 6–12 · Self-Serve SaaS Ramp & 1-Click Shopify/Webflow Apps",
        tag: "$49 Pro & $149 Widget Tiers",
        description:
          "Convert high-traffic auto-indexed brands into paying Claimed Pro and Website Widget subscribers via automated domain verification and 1-click e-commerce embed plugins.",
      },
      {
        id: "03",
        title: "Months 12–18 · 1,000+ Paying Venues & Seed-Ready ~$1.2M+ ARR",
        tag: "Global 75+ Language Compounding",
        description:
          "Scale organic Google Page-1 and Google Images footprint to hundreds of thousands of indexed brands—positioning Yoouz as the global visual review standard for Series Seed/A.",
      },
      {
        id: "04",
        title: "Ready for Immediate Live Product Walkthrough & Due Diligence",
        tag: "Test Live at yoouz.com Right Now",
        description:
          "Every screen in this deck is live in production today—scan any business QR, snap a 3-second photo review, test Face ID Passkey, or drop our 1-line embed into any webpage.",
      },
    ],
    metrics: [
      { label: "Live Production Proof", value: "543+ / 62", detail: "Indexed businesses & live customer photos" },
      { label: "18-Month ARR Target", value: "$1.2M+ ARR", detail: "1,000+ paying Pro & Widget merchants" },
      { label: "Live Verification", value: "yoouz.com", detail: "Test desktop, mobile PWA & embed live" },
    ],
  },
];
