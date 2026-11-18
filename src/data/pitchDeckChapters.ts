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

export interface PitchChapter {
  page: number;
  shortTitle: string;
  kicker: string;
  headline: string;
  subheadline: string;
  imagePath: string;
  mobileImagePath?: string;
  frameMode: "desktop" | "mobile" | "embed";
  imageCaption: string;
  callouts: PitchCallout[];
  metrics: PitchMetric[];
}

export interface ClaimedPortfolioEntity {
  name: string;
  domain: string;
  category: string;
  status: string;
  highlights: string;
}

export const ANONYMOUS_CLAIMED_ENTITIES: ClaimedPortfolioEntity[] = [
  {
    name: "Yoouz Official",
    domain: "yoouz.com",
    category: "Trust & Visual Review Platform",
    status: "Verified & Claimed",
    highlights: "Live Photo Reviews · Website Embed Active",
  },
  {
    name: "Anything Virtual",
    domain: "anythingvirtual.net",
    category: "Digital Services & Technology",
    status: "Verified & Claimed",
    highlights: "Claimed Business Portal · Owner Shield On",
  },
  {
    name: "Wolt",
    domain: "wolt.com",
    category: "Food Delivery & Quick Commerce",
    status: "Auto-Indexed + Embed Ready",
    highlights: "5.0 Whole-Star Proof · 75+ Languages",
  },
  {
    name: "Lerner & Rowe Injury Attorneys",
    domain: "lernerandrowe.com",
    category: "Legal Services",
    status: "Auto-Indexed Profile",
    highlights: "Structured Brand Hub · SEO Photo Index",
  },
  {
    name: "Sephora",
    domain: "sephora.com",
    category: "Beauty & Luxury Retail",
    status: "Auto-Indexed Profile",
    highlights: "Trending Feed · Product Proof Gallery",
  },
  {
    name: "Books & Beans",
    domain: "booksandbeans.co.uk",
    category: "Coffee & Independent Bakery",
    status: "Auto-Indexed Profile",
    highlights: "Verified U/FSQUT7 Photo Reviews",
  },
  {
    name: "Jollibee",
    domain: "jollibee.com.ph",
    category: "Quick Service Hospitality",
    status: "Auto-Indexed Profile",
    highlights: "Verified U/FCC8RS Photo Reviews",
  },
  {
    name: "Hotel Julien",
    domain: "hotel-julien.com",
    category: "Boutique Luxury Hotel",
    status: "Auto-Indexed Profile",
    highlights: "Room & Guest Experience Photo Proof",
  },
];

export const PITCH_CHAPTERS: PitchChapter[] = [
  {
    page: 1,
    shortTitle: "The 5-Second Hook: 1 Photo = 1,000 Words",
    kicker: "01 · EXECUTIVE SUMMARY & CORE THESIS",
    headline: "A Picture Is Worth 1,000 Words. One Live Photo Replaces Fake Text Reviews.",
    subheadline:
      "Text reviews across Google, Yelp, and Trustpilot are overrun by AI-generated spam, fake bots, and recycled stock photos. Yoouz eliminates text-only and gallery-upload reviews completely: every review requires 1 real-time hardware camera photo + 1 to 5 solid whole stars captured in 3 seconds.",
    imagePath: "/pitch-assets/v2/01-home-discovery.png",
    mobileImagePath: "/pitch-assets/v2/08-mobile-home.png",
    frameMode: "desktop",
    imageCaption: "Live Production Desktop View (yoouz.com) — Universal Search, Trending Photo Proof Feed & Zero Sign-Up Friction",
    callouts: [
      {
        id: "01",
        title: "Home Discovery & Universal Search Hero",
        tag: "See the Truth Before You Decide",
        description:
          "Visitors land immediately on real customer photo proof across food delivery, legal, retail, and hospitality—searching any street address or website domain with zero registration wall.",
      },
      {
        id: "02",
        title: "Translucent Verified Business Backdrop Pill",
        tag: "Backdrop-Blur Brand Header",
        description:
          "Every photo card anchors the business squircle logo, Verified checkmark, exact aggregate whole-star rating, and live review count cleanly in a dark glass pill overlay.",
      },
      {
        id: "03",
        title: "Real Customer Photo Canvas & Attribution",
        tag: "1 Live Photo · Whole Stars",
        description:
          "Unedited real-world delivery bags, plated food, retail hauls, and venues paired with the reviewer handle, exact relative timestamp, and direct link to the business front page.",
      },
      {
        id: "04",
        title: "Instant + Add Review Launch Button",
        tag: "3-Second Hardware Capture",
        description:
          "Single-tap conversion entry in the left sidebar and bottom navigation bar built to turn happy customers into verified contributors on the spot.",
      },
    ],
    metrics: [
      { label: "Review Creation Time", value: "3 Seconds", detail: "1 live camera photo + whole-star tap" },
      { label: "Gallery / Fake Uploads", value: "0% Allowed", detail: "Strict native hardware camera capture" },
      { label: "Visual Proof Density", value: "1,000 Words", detail: "Instant unspoofable visit confirmation" },
    ],
  },
  {
    page: 2,
    shortTitle: "Market Opportunity (TAM / SAM / SOM)",
    kicker: "02 · MARKET OPPORTUNITY (TAM / SAM / SOM)",
    headline: "Rebuilding the Multi-Billion-Dollar Global Online Review & Local Discovery Economy.",
    subheadline:
      "Generative AI has broken consumer trust in legacy text reviews overnight—creating an urgent, multi-billion-dollar market shift toward unspoofable, hardware-captured visual proof across global e-commerce and local venues.",
    imagePath: "/pitch-assets/v2/01-home-discovery.png",
    frameMode: "desktop",
    imageCaption: "Yoouz Market Opportunity Breakdown — Global Online Review & Local Discovery TAM, Addressable SMB & Multi-Location SAM, and Initial 1,000-Venue Pre-Seed SOM",
    callouts: [
      {
        id: "01",
        title: "The AI Trust Collapse Creates an Immediate Replacement Cycle",
        tag: "$15.8B+ Global TAM",
        description:
          "Consumers and search engines no longer trust anonymous text stars. Every business paying for reputation software or review widgets needs verifiable visual proof.",
      },
      {
        id: "02",
        title: "85M+ Physical & Digital Storefronts Competing on Visual Proof",
        tag: "$4.2B+ Addressable SAM",
        description:
          "Restaurants, cafés, hotels, clinics, salons, legal practices, and D2C brands rely on authentic customer photos to win local discovery and checkout conversion.",
      },
      {
        id: "03",
        title: "Focused Pre-Seed Wedge: First 1,000 High-Frequency Venues",
        tag: "1,000-Venue SOM Target",
        description:
          "Capturing our initial 1,000 hospitality, dining, and retail venues via counter QR standees and self-serve claiming establishes dense local network effects and ~$1.2M+ ARR.",
      },
      {
        id: "04",
        title: "Zero Geographic Ceiling From Day One",
        tag: "75+ Languages · Global URLs",
        description:
          "Because Yoouz auto-indexes any domain or street venue worldwide across 75+ languages, our addressable market scales across North America, Europe, MENA, and APAC simultaneously.",
      },
    ],
    metrics: [
      { label: "Total Addressable Market (TAM)", value: "$15.8B+", detail: "Global online review & local discovery market" },
      { label: "Serviceable Market (SAM)", value: "$4.2B+", detail: "Addressable SMB & multi-location venues worldwide" },
      { label: "Pre-Seed Target (SOM)", value: "1,000 Venues", detail: "Initial high-velocity merchant cohort (~$1.2M+ ARR)" },
    ],
  },
  {
    page: 3,
    shortTitle: "Competitive Landscape Matrix",
    kicker: "03 · COMPETITIVE LANDSCAPE MATRIX",
    headline: "Why Yoouz Wins: Unspoofable 3-Second Live Photos Without App Downloads or Friction.",
    subheadline:
      "Legacy review platforms are flooded with AI-generated fake text, recycled stock photos, and painful signup walls. Yoouz solves trust at the point of experience: 1 live hardware camera photo + 1–5 solid whole stars in under 3 seconds.",
    imagePath: "/pitch-assets/v2/01-home-discovery.png",
    frameMode: "desktop",
    imageCaption: "Competitive Architecture Comparison — Yoouz Live Photo Protocol vs. Legacy Review Platforms (Google / Trustpilot / Yelp)",
    callouts: [
      {
        id: "01",
        title: "100% Immune to AI Text Bots & Recycled Gallery Uploads",
        tag: "Hardware Shutter Only",
        description:
          "While Google, Trustpilot, and Yelp permit paste-able AI text and old camera-roll images, Yoouz enforces live OS hardware camera capture on every single review.",
      },
      {
        id: "02",
        title: "3-Second Live Photo vs. High-Friction Text Essays",
        tag: "Zero Reviewer Fatigue",
        description:
          "Writing paragraph essays on a phone keyboard fails at scale. Anyone will snap 1 photo of their table, meal, or purchase in 3 seconds directly on on-site hardware.",
      },
      {
        id: "03",
        title: "Zero Signup & Zero App Download Required",
        tag: "Instant U/XXXXXX + Passkey",
        description:
          "Competitors force reviewers through email/password walls that kill 70%+ of mobile traffic. Yoouz publishes in 3 seconds with an automatic U/XXXXXX handle and optional 1-time Face ID Passkey.",
      },
      {
        id: "04",
        title: "In-Store Counter QR Loop + Google Page-1 Visual SEO",
        tag: "Offline-to-Online Moat",
        description:
          "Scanning a Yoouz counter QR code opens the Business Front Page first for instant social proof, while every published photo fuels Google Page-1 rich snippets across 75+ languages.",
      },
    ],
    metrics: [
      { label: "AI & Gallery Spoofing", value: "0% Possible", detail: "Strict live hardware camera protocol" },
      { label: "Time to Publish Review", value: "3 Seconds", detail: "10x faster than typing text essays" },
      { label: "Upfront Login Drop-Off", value: "0% Friction", detail: "No email, password, or app download" },
    ],
  },
  {
    page: 4,
    shortTitle: "Go-To-Market & $0 CAC Distribution Playbook",
    kicker: "04 · GO-TO-MARKET & $0 CAC DISTRIBUTION PLAYBOOK",
    headline: "How Yoouz Scales Globally With $0 Paid Ads Through Four Compounding Organic Loops.",
    subheadline:
      "Instead of burning capital on paid user acquisition, Yoouz turns physical merchant foot traffic, autonomous web indexing, and multilingual Google Image & SERP rankings into a self-reinforcing B2B2C growth engine.",
    imagePath: "/pitch-assets/v2/03-qr-business-front.png",
    frameMode: "desktop",
    imageCaption: "Yoouz $0 CAC Distribution Flywheel — Counter QR Standees -> Auto-Indexed Profiles -> 75+ Language Google Page-1 SEO -> Self-Serve SaaS Claiming",
    callouts: [
      {
        id: "01",
        title: "Free Print-Ready Counter & Table QR Standees for Local Shops",
        tag: "Loop 01 · Physical Foot Traffic",
        description:
          "Cafes, restaurants, clinics, and boutiques place free print-ready Yoouz QR standees at tables and checkout counters—turning daily walk-in guests into live photo contributors at $0 CAC.",
      },
      {
        id: "02",
        title: "Autonomous Indexing of Global Brands & Physical Venues",
        tag: "Loop 02 · Zero Cold-Start",
        description:
          "Our scraping engine builds rich profiles, logos, and banners on demand for any searched URL or street venue worldwide—creating review-ready supply before merchants ever sign up.",
      },
      {
        id: "03",
        title: "Google Page-1 Visual SEO Across 75+ Languages",
        tag: "Loop 03 · Organic Search Capture",
        description:
          "Fresh, original customer JPEGs paired with Schema.org AggregateRating markup and 75+ localized language routes (/es, /fr, /de, /ar, /ja) rank organically for high-intent '[Brand] reviews' searches.",
      },
      {
        id: "04",
        title: "Self-Serve Merchant Claiming Converting Free Traffic Into Paid SaaS",
        tag: "Loop 04 · B2B Monetization",
        description:
          "As customer photos and Google traffic accumulate on a free auto-indexed page, business owners claim their profile at yoouz.com/business and upgrade to $49–$149/mo SaaS plans.",
      },
    ],
    metrics: [
      { label: "Paid Ad Dependency", value: "$0 CAC", detail: "100% organic QR + SEO distribution loops" },
      { label: "Global SEO Reach", value: "75+ Languages", detail: "Automated hreflang & Schema.org routes" },
      { label: "B2B Conversion Trigger", value: "Inbound Claim", detail: "Merchants upgrade to manage live traffic" },
    ],
  },
  {
    page: 5,
    shortTitle: "Business Model & SaaS Economics",
    kicker: "05 · BUSINESS MODEL & SAAS ECONOMICS",
    headline: "Predictable B2B Recurring SaaS With ~95%+ Software Gross Margins.",
    subheadline:
      "Every business worldwide starts on our $0 Free Auto-Indexed tier to maximize directory density and SEO reach, then upgrades self-serve to $49/mo Claimed Business Pro or $149/mo Growth & Website Widget—powered by ultra-lean ~120 KB photo delivery on Bunny.net CDN.",
    imagePath: "/pitch-assets/v2/12-business-portal.png",
    frameMode: "desktop",
    imageCaption: "Yoouz B2B SaaS Pricing Architecture — $0 Free Auto-Indexed Discovery, $49/mo Claimed Business Pro & $149/mo Growth & Website Widget (~95%+ Gross Margin)",
    callouts: [
      {
        id: "01",
        title: "$0 / mo — Free Auto-Indexed Discovery Tier",
        tag: "Top-of-Funnel Supply Moat",
        description:
          "Every company receives an auto-generated public profile, logo, banner, whole-star score, and unlimited customer live photo reviews to compound organic search traffic.",
      },
      {
        id: "02",
        title: "$49 / mo — Claimed Business Pro Tier",
        tag: "Core SMB Subscription",
        description:
          "Unlocks the Verified Claimed Badge, Official Pinned Owner Replies, Direct Customer Chat Inbox, Profile Analytics, and Print-Ready Counter QR Standee Kits.",
      },
      {
        id: "03",
        title: "$149 / mo — Growth & Website Widget Tier",
        tag: "High-Converting Storefront Widget",
        description:
          "Includes Unlimited 1-Line Website Photo Review Carousels, automatic Google AggregateRating JSON-LD rich snippets, multi-location management, and priority category placement.",
      },
      {
        id: "04",
        title: "~95%+ Software Gross Margins via ~120 KB Photo Architecture",
        tag: "Bunny.net CDN + Cloud SQL",
        description:
          "Because Yoouz compresses each live photo to ~120 KB on Bunny.net global edge storage with Cloud SQL PostgreSQL metadata, bandwidth and storage cost fractions of a cent per merchant.",
      },
    ],
    metrics: [
      { label: "SaaS Pricing Tiers", value: "$0 / $49 / $149", detail: "Free Discovery · Claimed Pro · Growth Widget" },
      { label: "Software Gross Margin", value: "~95%+", detail: "~120 KB Bunny.net CDN + Cloud SQL stack" },
      { label: "Payback Period", value: "Immediate", detail: "$0 CAC organic inbound merchant claiming" },
    ],
  },
  {
    page: 6,
    shortTitle: "Founder Edge, Production Status & Pre-Seed Ask",
    kicker: "06 · FOUNDER EDGE, LIVE PRODUCTION STATUS & PRE-SEED ASK",
    headline: "15 Years Luxury Hospitality Domain Mastery + Solo Full-Stack Execution. Live in Production Today.",
    subheadline:
      "Built 100% in-house by a founder combining 15 years of frontline luxury hospitality management with end-to-end full-stack engineering. Yoouz is not a prototype—our production beta is already live at yoouz.com with 194+ indexed profiles, 40+ live photo reviews, and early pilot venues.",
    imagePath: "/pitch-assets/v2/14-claimed-businesses.png",
    frameMode: "desktop",
    imageCaption: "Founder-Led Execution & Pre-Seed Capital Allocation — Active Production Beta (194+ Indexed Profiles · 40+ Live Photo Reviews) Scaling to First 500 Venues",
    callouts: [
      {
        id: "01",
        title: "Founder Edge: 15 Years Luxury Hospitality + Solo Full-Stack Engineer",
        tag: "Insider Operational DNA",
        description:
          "Deep firsthand knowledge of how restaurants, hotels, and service venues win guest trust—combined with solo full-stack engineering execution that shipped the entire platform with zero agency burn.",
      },
      {
        id: "02",
        title: "Live Production Beta Status: 194+ Profiles & 40+ Live Reviews",
        tag: "Active Pilot Venues",
        description:
          "Our 194+ indexed profiles and 40+ live photo reviews represent an active production beta at yoouz.com with early pilot venues testing QR standees, Passkeys, and website embeds in the wild.",
      },
      {
        id: "03",
        title: "Use of Funds #1 & #2: First 500 Venues (45%) + Global SEO Scale (35%)",
        tag: "80% Growth & Distribution",
        description:
          "Capital goes directly into deploying physical counter QR kits to onboard our first 500 active venues (45%) and scaling autonomous indexing & Google Page-1 SEO across 75+ languages (35%).",
      },
      {
        id: "04",
        title: "Use of Funds #3: Core Product & Merchant SaaS Velocity (20%)",
        tag: "High-Leverage Runway",
        description:
          "Expands self-serve merchant claiming automation, Shopify/Webflow 1-click embed plugins, and Bunny.net + Cloud SQL edge performance to convert pilot traction into recurring ARR.",
      },
    ],
    metrics: [
      { label: "Founder Background", value: "15 Yrs + Dev", detail: "Luxury hospitality ops + solo full-stack builder" },
      { label: "Current Stage", value: "Production Beta", detail: "194+ indexed profiles · 40+ live reviews · early pilots" },
      { label: "Pre-Seed Milestone", value: "First 500 Venues", detail: "QR rollout, global SEO scale & SaaS conversion" },
    ],
  },
  {
    page: 7,
    shortTitle: "Universal Search & Zero-Signup Auto-Scraping",
    kicker: "07 · AUTONOMOUS INDEXING ENGINE",
    headline: "Search Any Street Venue or Global URL—Profiles Build Automatically Without Sign-Up.",
    subheadline:
      "Businesses do not need to register or fill out onboarding forms to exist on Yoouz. Our autonomous scraping infrastructure resolves any searched website URL or physical business on demand—extracting logos, cover banners, category metadata, and clean slugs in seconds.",
    imagePath: "/pitch-assets/v2/02-search-autoscraping.png",
    frameMode: "desktop",
    imageCaption: "Live Search & Auto-Indexed Directory (yoouz.com/search) — Every Website & Street Business Resolved Automatically",
    callouts: [
      {
        id: "01",
        title: "Global URL & Physical Venue Resolution",
        tag: "Any Domain Worldwide",
        description:
          "Whether a consumer searches wolt.com, sephora.com, a neighborhood bakery, or a regional law firm, Yoouz resolves a canonical business route instantly.",
      },
      {
        id: "02",
        title: "Autonomous Logo & Banner Extraction",
        tag: "Zero Merchant Setup",
        description:
          "Our scraping pipeline automatically fetches official brand marks, high-resolution cover banners, clean business titles, and verified metadata on first lookup.",
      },
      {
        id: "03",
        title: "Cold-Start Chicken-and-Egg Solved",
        tag: "194+ Pre-Indexed Profiles",
        description:
          "Every company worldwide is review-ready on Day 1. Supply grows organically from customer searches long before the business claims its dashboard.",
      },
      {
        id: "04",
        title: "Multi-Vertical Filter & Instant Preview",
        tag: "Places + Live Photos",
        description:
          "Results unify business cards, live star aggregates, and contributed customer photos inside one crisp Dark Obsidian search experience.",
      },
    ],
    metrics: [
      { label: "Business Onboarding Required", value: "Zero Sign-Up", detail: "Auto-built profile banner & logo" },
      { label: "Addressable Index", value: "Global Web + Local", detail: "Any public website domain or venue" },
      { label: "Profile Provisioning", value: "Automated", detail: "Structured slug ready for SEO & QR" },
    ],
  },
  {
    page: 8,
    shortTitle: "QR Scan Flow -> Business Profile Front Page",
    kicker: "08 · PHYSICAL-TO-DIGITAL QR JOURNEY",
    headline: "Scan Any Yoouz QR Code -> Land Straight on the Business Profile Front Page.",
    subheadline:
      "Never ambushing visitors with a cold camera shutter. When a customer scans a Yoouz QR code on a table tent, receipt, or desktop modal, their phone opens the full Business Profile front page first (yoouz.com/reviews/wolt.com) so they see real photos and trust signals before tapping Add Review.",
    imagePath: "/pitch-assets/v2/03-qr-business-front.png",
    mobileImagePath: "/pitch-assets/v2/11-mobile-business-front.png",
    frameMode: "desktop",
    imageCaption: "QR Code Destination (yoouz.com/reviews/wolt.com) — Opens Business Profile Front Page First Where Visitors Tap Add Review",
    callouts: [
      {
        id: "01",
        title: "QR Code Lands on Business Front Page First",
        tag: "yoouz.com/reviews/{slug}",
        description:
          "Scanning a tabletop or desktop QR code routes directly to that merchant's rich public front page—not a jarring blank camera modal.",
      },
      {
        id: "02",
        title: "Immediate Social Proof & Whole-Star Context",
        tag: "5.0 Whole-Star Summary",
        description:
          "Customers see the brand banner, Verified badge, Follow toggle, and real customer photos immediately, creating natural confidence to contribute.",
      },
      {
        id: "03",
        title: "Prominent White Add Review CTA Button",
        tag: "1-Tap Camera Transition",
        description:
          "High-contrast Add Review button sits cleanly under the rating header. Tapping it transitions effortlessly into native live camera capture.",
      },
      {
        id: "04",
        title: "Seamless Desktop-to-Mobile Continuity",
        tag: "Cross-Device Flow",
        description:
          "Desktop shoppers inspect photos on a 27-inch screen, scan the profile QR code, land on the exact mobile front page, and snap a review in seconds.",
      },
    ],
    metrics: [
      { label: "QR Landing Route", value: "Business Profile", detail: "Full trust context before capture" },
      { label: "Add Review Trigger", value: "1 Tap on Profile", detail: "Clear user intent before camera opens" },
      { label: "Conversion Lift", value: "Highest Intent", detail: "Shoppers see peer photos first" },
    ],
  },
  {
    page: 9,
    shortTitle: "Native Hardware Camera Capture (Zero Gallery Uploads)",
    kicker: "09 · ANTI-SPOOFING HARDWARE PROTOCOL",
    headline: "Hardware Camera Only. Zero Gallery Uploads. Published in Under 3 Seconds.",
    subheadline:
      "Once the reviewer taps Add Review on the business profile, mobile enforces capture='environment' to invoke the phone's real hardware camera directly—completely blocking old camera-roll screenshots, stolen web images, and AI uploads.",
    imagePath: "/pitch-assets/v2/04-mobile-camera-flow.png",
    frameMode: "mobile",
    imageCaption: "Mobile Live Camera Modal — Tapping Add Review Launches Native Camera Only (Strict Zero Gallery Upload Enforcement)",
    callouts: [
      {
        id: "01",
        title: "Strict Native Camera Enforcement",
        tag: "No Gallery Picker",
        description:
          "Photo library browsing is disabled by protocol. Every single Yoouz review originates from a live physical shutter press on location or at delivery.",
      },
      {
        id: "02",
        title: "1 to 5 Solid Whole-Star Tap Standard",
        tag: "No Ambiguous Half-Stars",
        description:
          "Clean, unambiguous whole-star rating (1 to 5 solid amber stars) pairs with the live photo with zero mandatory essay writing.",
      },
      {
        id: "03",
        title: "Instant Retake or Publish Photo Review",
        tag: "Sub-3s Workflow",
        description:
          "Users preview their native HDR photo right away, retake cleanly if blurry, or tap the crisp white Publish Photo Review button.",
      },
      {
        id: "04",
        title: "Sharp Server-Side EXIF & GPS Scrubbing",
        tag: "~120 KB Bunny.net JPEG",
        description:
          "On upload, our backend strips personal EXIF location headers for privacy while compressing high-DPI JPEGs onto global Bunny.net edge nodes.",
      },
    ],
    metrics: [
      { label: "Camera-Roll Uploads", value: "0% Permitted", detail: "Hardware shutter required every time" },
      { label: "Privacy Scrubbing", value: "100% Stripped", detail: "EXIF GPS removed automatically on ingest" },
      { label: "Asset Edge Weight", value: "~120 KB Avg", detail: "Near-zero Bunny.net delivery latency" },
    ],
  },
  {
    page: 10,
    shortTitle: "Auto U/XXXXXX Profile & Persistent Handle",
    kicker: "10 · ZERO-FRICTION IDENTITY ARCHITECTURE",
    headline: "No Account Creation Needed: Snap & Publish in 3 Seconds, Get an Instant U/XXXXXX Handle.",
    subheadline:
      "Legacy review sites lose over 70% of mobile reviewers at email, password, and OTP verification walls. On Yoouz, users never create an account upfront—they simply snap a live photo and rate 1–5 stars in a couple of seconds, and Yoouz automatically provisions their persistent U/XXXXXX profile on the spot.",
    imagePath: "/pitch-assets/v2/05-uhandle-profile.png",
    frameMode: "desktop",
    imageCaption: "Live Member Profile (U/FCC8RS on jollibee.com.ph) — Provisioned Automatically on First Photo Review With Zero Email or Password",
    callouts: [
      {
        id: "01",
        title: "Publish First in 3 Seconds—Zero Account Wall",
        tag: "No Email · No Password",
        description:
          "Customers never fill out registration forms before contributing. They snap 1 live photo, tap 1–5 whole stars, and their review is live immediately under an auto-assigned handle like U/FCC8RS or U/A4B6C8.",
      },
      {
        id: "02",
        title: "1-Time Optional Passkey Prompt After First Action",
        tag: "Optional Face ID Lock",
        description:
          "Right after their first photo review—for the first time only—users get a non-intrusive option to save a Face ID / Touch ID Passkey on their phone to keep that account forever.",
      },
      {
        id: "03",
        title: "Rename to Any Custom @Username Anytime",
        tag: "History Follows You",
        description:
          "Contributors can keep their anonymous U/XXXXXX handle or switch to a custom @username anytime—every prior photo review, follower, and like updates automatically.",
      },
      {
        id: "04",
        title: "1-Tap Direct Chat & Follow Networking",
        tag: "Save · Share · Chat",
        description:
          "Shoppers follow trusted local taste-makers and message real reviewers directly to verify sizing, wait times, or service quality.",
      },
    ],
    metrics: [
      { label: "Upfront Sign-Up Friction", value: "0 Seconds", detail: "Snap & publish immediately without login" },
      { label: "Identity Continuity", value: "100% Synced", detail: "Auto U/XXXXXX or custom @username" },
      { label: "Privacy Default", value: "Anonymous Start", detail: "No personal email ever shown publicly" },
    ],
  },
  {
    page: 11,
    shortTitle: "1-Tap Face ID / WebAuthn Passkey Lock",
    kicker: "11 · 1-TIME OPTIONAL PHONE PASSKEY & VERIFIED BADGE",
    headline: "No Email, No Password—Ever. Optional 1-Time Face ID Passkey on Phone Locks Your Handle Forever.",
    subheadline:
      "After a user publishes their first photo review in seconds without creating an account, Yoouz offers a 1-time optional Face ID / Touch ID Passkey prompt right on their phone ('Passkey for yoouz.com · U/A4B6C8'). One glance binds their handle to their device's Secure Enclave and unlocks the Verified checkmark.",
    imagePath: "/pitch-assets/v2/06-passkey-settings.png",
    frameMode: "desktop",
    imageCaption: "Dual Proof Stage — Live U/XXXXXX Community Profile ('Save Face ID 1-Time') + Native iOS 'Passkey for yoouz.com (U/A4B6C8)' Sheet",
    callouts: [
      {
        id: "01",
        title: "Native Phone Passkey Sheet ('Passkey for yoouz.com')",
        tag: "U/A4B6C8 · Face ID Continue",
        description:
          "Uses native iOS Face ID and Android Biometric WebAuthn directly in Safari/Chrome. Users tap 'Continue' once with Face ID—zero passwords to invent, type, or reset.",
      },
      {
        id: "02",
        title: "1-Time Optional Upgrade After Instant Review",
        tag: "Save Face ID (1-Time)",
        description:
          "Passkey enrollment is never a blocker before taking a photo. It appears as a 1-time optional upgrade after contribution or inside the user's U/XXXXXX profile drawer.",
      },
      {
        id: "03",
        title: "Permanent Verified Reviewer Checkmark",
        tag: "Hardware-Bound Trust",
        description:
          "Securing a U/XXXXXX or custom profile with a hardware Passkey awards the white Verified checkmark next to the user's name across all reviews and comments.",
      },
      {
        id: "04",
        title: "Community Member vs. Business Profile Separation",
        tag: "Commenters & Reviewers",
        description:
          "Visiting any community member (even comment-only users) opens their real member profile—never a generic guest page and never allowing photo reviews about a person.",
      },
    ],
    metrics: [
      { label: "Email / Password Fields", value: "0 Required", detail: "100% passwordless FIDO2 / WebAuthn" },
      { label: "Passkey Setup Time", value: "1 Glance (1x)", detail: "Optional 1-time Face ID tap after review" },
      { label: "Sybil Bot Defense", value: "Hardware Bound", detail: "Stops scripted fake reviewer farms" },
    ],
  },
  {
    page: 12,
    shortTitle: "Business Profile Hub & 5 Conversion Actions",
    kicker: "12 · COMPLETE BUSINESS STOREFRONT",
    headline: "One Unified Hub Turning Customer Photo Proof Into Calls, Directions, Saves & Chat.",
    subheadline:
      "Every local business and online brand receives an institutional-grade conversion hub—featuring a wide cover banner, squircle logo, aggregate star rating, structured tabs, and five immediate customer action buttons.",
    imagePath: "/pitch-assets/v2/06-business-profile-hub.png",
    frameMode: "desktop",
    imageCaption: "Live Business Hub (yoouz.com/reviews/lernerandrowe.com) — Banner, Logo, Whole-Star Rating & 5 Direct Action Buttons",
    callouts: [
      {
        id: "01",
        title: "Cohesive Brand Hero & Verified Checkmark",
        tag: "Banner · Squircle Logo",
        description:
          "Displays the company cover artwork, crisp squircle avatar, domain badge, Follow button, and clear Claimed / Auto-Indexed status.",
      },
      {
        id: "02",
        title: "5 High-Intent Merchant Action Buttons",
        tag: "Directions · Call · Save · Share · Chat",
        description:
          "Turns high-trust viewers into paying customers right inside the profile: launch maps directions, dial phone, bookmark, share URL, or start direct chat.",
      },
      {
        id: "03",
        title: "Overview, Photo Reviews & About Architecture",
        tag: "Multi-Tab Storefront",
        description:
          "Organizes highlighted featured photos, star-rating filters (5-star down to 1-star), sort controls, and complete About metadata.",
      },
      {
        id: "04",
        title: "Integrated Claim This Business Funnel",
        tag: "B2B Conversion Hook",
        description:
          "Prominent claiming entry empowers real business owners to verify domain ownership and unlock analytics and website embed tools.",
      },
    ],
    metrics: [
      { label: "Direct Action Suite", value: "5 Native CTAs", detail: "Directions, Call, Save, Share, Chat" },
      { label: "Star Filtering", value: "Whole-Star Sort", detail: "Latest, Highest, Lowest & Popular" },
      { label: "Conversion Intent", value: "Zero Redirect Leaks", detail: "Actionable right beside visual proof" },
    ],
  },
  {
    page: 13,
    shortTitle: "Community Photo Canvas, Comments & Action Rail",
    kicker: "13 · ENGAGEMENT & REAL-TIME DIALOGUE",
    headline: "Threaded Comments, Helpful Likes, Bookmarks & Cross-Platform Sharing Built Around Every Photo.",
    subheadline:
      "Yoouz transforms solitary star ratings into living community proof. Shoppers inspect the full-bleed photo, ask questions inside threaded comment drawers, read official business replies, and bookmark places for later.",
    imagePath: "/pitch-assets/v2/07-comments-social-rail.png",
    mobileImagePath: "/pitch-assets/v2/08-mobile-home.png",
    frameMode: "desktop",
    imageCaption: "Live Photo Review + Threaded Comments Drawer (yoouz.com/reviews/wolt.com) — Full-Bleed Canvas & 5-Button Action Rail",
    callouts: [
      {
        id: "01",
        title: "5-Button Thumb-First Action Rail",
        tag: "Follow · Like · Comment · Save · Share",
        description:
          "High-contrast floating circular controls let viewers follow trusted contributors, upvote helpful photos, bookmark places, and share cleanly.",
      },
      {
        id: "02",
        title: "Live Threaded Q&A & Owner Replies",
        tag: "Community + Merchant",
        description:
          "Shoppers ask practical questions on parking, delivery freshness, or sizing—while verified owners pin official responses at the top.",
      },
      {
        id: "03",
        title: "Zero-Flicker Preloaded Bunny.net Delivery",
        tag: "Instant Photo Decoding",
        description:
          "Every image preloads smoothly with aspect-locked framing so desktop and mobile Safari users never experience black frames when swiping.",
      },
      {
        id: "04",
        title: "Keyboard & Swipe Discovery Loop",
        tag: "Desktop + Mobile PWA",
        description:
          "Full-viewport vertical feed with instant next/previous stepping drives deep session dwell times across trending businesses.",
      },
    ],
    metrics: [
      { label: "Social Loops", value: "5 Action Signals", detail: "Follow, Like, Comment, Save, Share" },
      { label: "Merchant Interaction", value: "Pinned Replies", detail: "Verified business responses in thread" },
      { label: "Frame Render", value: "Zero Black Flash", detail: "Instant Bunny CDN edge pre-decoding" },
    ],
  },
  {
    page: 14,
    shortTitle: "Direct Messages & Real-Time Notifications",
    kicker: "14 · CUSTOMER RETENTION & CHAT INBOX",
    headline: "Built-In Direct Messaging Connecting Shoppers With Reviewers and Verified Businesses.",
    subheadline:
      "Closing the loop between discovery and transaction. Shoppers message merchants directly before booking or ordering, while contributors receive instant notifications on replies, likes, and new followers.",
    imagePath: "/pitch-assets/v2/09-messages-direct-chat.png",
    frameMode: "desktop",
    imageCaption: "Direct Messages Workspace (yoouz.com/messages) — Real-Time Customer-to-Business & Peer Conversations",
    callouts: [
      {
        id: "01",
        title: "1-Click Chat From Any Business Profile",
        tag: "Pre-Purchase Confidence",
        description:
          "Prospective buyers start an inquiry straight from a venue's 5-action strip—no hunting for contact forms or buried support addresses.",
      },
      {
        id: "02",
        title: "Instant Reviewer-to-Shopper Advice",
        tag: "Peer Verification",
        description:
          "Real community members share follow-up context on product durability or service quality inside clean encrypted inbox threads.",
      },
      {
        id: "03",
        title: "Unified Notification Bell & Activity Stream",
        tag: "Unread Badge Alerts",
        description:
          "Real-time badges notify contributors and merchants when a new comment, heart, follower, or direct message arrives.",
      },
      {
        id: "04",
        title: "Strict Spam & Block Protection",
        tag: "Report & Privacy Controls",
        description:
          "Built-in reporting and privacy blocking safeguards keep direct channels safe for both consumers and verified teams.",
      },
    ],
    metrics: [
      { label: "Inquiry Friction", value: "1-Tap Chat", detail: "Direct from business hub or profile" },
      { label: "Retention Driver", value: "Live Inbox Alerts", detail: "Re-engages contributors organically" },
      { label: "Privacy Shield", value: "No Exposed Emails", detail: "100% in-app handle routing" },
    ],
  },
  {
    page: 15,
    shortTitle: "Interactive Website Embed Widget & Schema.org SEO",
    kicker: "15 · MERCHANT WEBSITE EMBED ENGINE",
    headline: "1-Line Interactive Photo Widget That Lives Right on Any Merchant Website.",
    subheadline:
      "Businesses embed Yoouz's live verified photo carousel directly on their homepage, checkout, or Shopify store—boosting buyer trust on-site while injecting rich Schema.org AggregateRating JSON-LD metadata for Google search stars. Test the live widget right below.",
    imagePath: "/pitch-assets/v2/10b-embed-standalone.png",
    frameMode: "embed",
    imageCaption: "Interactive Merchant Storefront Simulation — Live Working Yoouz Embed Carousel Across Wolt, Sephora & Lerner & Rowe",
    callouts: [
      {
        id: "01",
        title: "1-Line Responsive Iframe Deployment",
        tag: "Shopify · Webflow · Custom",
        description:
          "Drops cleanly into any HTML page or e-commerce theme in 60 seconds with automatic mobile responsiveness and swipe arrows.",
      },
      {
        id: "02",
        title: "Live Business Header, Verified Pill & Stars",
        tag: "Dynamic Real-Time Sync",
        description:
          "Every new photo review published by a customer updates inside the merchant's website embed immediately without manual curation.",
      },
      {
        id: "03",
        title: "Built-In AggregateRating Schema.org Snippet",
        tag: "Google Rich Snippets",
        description:
          "Includes copy-ready structured JSON-LD linking the embedded proof back to the canonical Yoouz URL to strengthen Google SERP click-through rate.",
      },
      {
        id: "04",
        title: "High-Intent 'Add Review' Loop on Merchant Site",
        tag: "Owned Audience Flywheel",
        description:
          "Turns every merchant's existing website traffic into new Yoouz contributors and brand awareness at zero customer acquisition cost.",
      },
    ],
    metrics: [
      { label: "Integration Effort", value: "60 Seconds", detail: "Single iframe + JSON-LD paste" },
      { label: "On-Site Conversion", value: "Live Social Proof", detail: "Customer photos directly beside CTA" },
      { label: "Embed Compatibility", value: "Universal Web", detail: "Shopify, WordPress, Next.js & HTML" },
    ],
  },
  {
    page: 16,
    shortTitle: "Physical POS QR Stands & Offline Growth Flywheel",
    kicker: "16 · $0 CAC PHYSICAL DISTRIBUTION",
    headline: "Table Tents, Receipt Slips & QR Standees: Offline Foot Traffic Feeds Online Proof Daily.",
    subheadline:
      "Restaurants, cafes, clinics, salons, and hotels place custom Yoouz QR displays at checkout counters and dining tables. Happy guests scan once, land on the live business front page, tap Add Review, and generate fresh authentic photos every single day.",
    imagePath: "/pitch-assets/v2/11-mobile-business-front.png",
    frameMode: "mobile",
    imageCaption: "Mobile QR Scan Landing Screen (yoouz.com/reviews/wolt.com) — Instant Front-Page Trust & 1-Tap Add Review Launch",
    callouts: [
      {
        id: "01",
        title: "Ready-to-Print Counter & Table QR Kits",
        tag: "Zero-Friction Deployment",
        description:
          "Verified businesses generate high-resolution print-ready QR posters and counter cards directly inside their merchant kit.",
      },
      {
        id: "02",
        title: "Real-World Moment of Peak Delight",
        tag: "At-Table / Delivery Bag",
        description:
          "Capturing the customer while the coffee, meal, or unboxing is right in front of them yields 10x higher completion than post-visit email surveys.",
      },
      {
        id: "03",
        title: "Self-Reinforcing Compounding Supply",
        tag: "$0 Marginal CAC",
        description:
          "Every scanned customer sees existing photos on the business front page, adds one more live photo, and expands Yoouz's brand footprint.",
      },
      {
        id: "04",
        title: "Tamper-Resistant Local Authenticity",
        tag: "On-Premise Proof",
        description:
          "Combined with hardware-only camera rules, QR standees ensure reviews reflect real physical inventory and real in-store service.",
      },
    ],
    metrics: [
      { label: "Acquisition Channel", value: "Physical QR POS", detail: "Tables, receipts, checkout & packaging" },
      { label: "Customer Cost (CAC)", value: "$0 Organic", detail: "Merchants distribute Yoouz in-store" },
      { label: "Mobile Load Speed", value: "< 0.8s PWA", detail: "Zero App Store download barrier" },
    ],
  },
  {
    page: 17,
    shortTitle: "Business Claiming Portal & Owner Privacy",
    kicker: "17 · B2B MERCHANT PORTAL",
    headline: "Verify Your Business in Minutes: Unlock Analytics, Official Replies & Strict Privacy Controls.",
    subheadline:
      "At yoouz.com/business, domain owners and venue operators claim their pre-indexed page to take command of their brand presence—responding to reviews, launching website embeds, and monitoring engagement while personal owner emails remain 100% hidden from public view.",
    imagePath: "/pitch-assets/v2/12-business-portal.png",
    frameMode: "desktop",
    imageCaption: "Yoouz for Business Portal (yoouz.com/business) — Self-Serve Claiming, Brand Controls & Privacy-Protected Ownership",
    callouts: [
      {
        id: "01",
        title: "Instant Pre-Indexed Business Search & Claim",
        tag: "yoouz.com/business",
        description:
          "Merchants type their brand or domain, inspect existing customer photo reviews, and initiate domain/business verification in seconds.",
      },
      {
        id: "02",
        title: "Official Owner Shield & Pinned Responses",
        tag: "Verified Owner Reply",
        description:
          "Claimed businesses post verified owner responses directly inside comment drawers, turning public feedback into visible service excellence.",
      },
      {
        id: "03",
        title: "Strict Personal Email Privacy Architecture",
        tag: "Zero Public Email Leak",
        description:
          "Public profiles display an anonymous 'Business Claimed' badge only—never exposing owner personal email addresses anywhere on client views.",
      },
      {
        id: "04",
        title: "Actionable Traffic & Engagement Analytics",
        tag: "Views · Calls · Directions",
        description:
          "Merchants track profile visits, photo impressions, website embed clicks, call taps, and customer sentiment trends over time.",
      },
    ],
    metrics: [
      { label: "Public Owner Privacy", value: "100% Anonymous", detail: "Personal emails never displayed publicly" },
      { label: "Verification Path", value: "Self-Serve Portal", detail: "Claim domain or physical storefront" },
      { label: "Merchant Upsell", value: "High-Intent Funnel", detail: "Existing photo traction drives upgrades" },
    ],
  },
  {
    page: 18,
    shortTitle: "Google Page-1 Photo SEO Across 75+ Languages",
    kicker: "18 · ORGANIC SEARCH & GLOBAL DISTRIBUTION ENGINE",
    headline: "Built for Google Page 1: Native Photo Indexing & Full Localization Across 75+ Languages.",
    subheadline:
      "Search engines reward original, fresh visual evidence paired with structured Schema.org markup. Every claimed and auto-scraped business page on Yoouz publishes clean canonical routes in 75+ languages—putting real customer photos on Page 1 when buyers search a brand.",
    imagePath: "/pitch-assets/v2/13-seo-localized-page.png",
    frameMode: "desktop",
    imageCaption: "Live Localized Business Page (/es/reviews/sephora.com) — 'Descripción general · Reseñas con Fotos · Información' With Structured SEO Metadata",
    callouts: [
      {
        id: "01",
        title: "Google Loves Fresh Original Photos",
        tag: "Image + Rich Snippets",
        description:
          "High-contrast, real-world customer JPEGs with semantic alt attributes, OpenGraph cards, and structured Schema.org data target Google Page-1 brand queries.",
      },
      {
        id: "02",
        title: "75+ Language Path Prefix Engine",
        tag: "/es · /fr · /de · /ja · /ar",
        description:
          "Every business route automatically renders localized UI headings ('Reseñas con Fotos', 'Avis Photo', 'Foto-Bewertungen') and hreflang signals globally.",
      },
      {
        id: "03",
        title: "Zero-Duplicate Canonical + Sitemap Architecture",
        tag: "robots.txt · XML Feeds",
        description:
          "Dynamic server-side meta injection ensures bots crawl exact titles, whole-star aggregate scores, and photo thumbnails immediately.",
      },
      {
        id: "04",
        title: "Zero Paid Ads Needed for User Acquisition",
        tag: "Compounding Organic Moat",
        description:
          "When shoppers Google '[Brand] reviews' or '[Brand] photos', Yoouz captures high-intent search clicks directly into the platform flywheel.",
      },
    ],
    metrics: [
      { label: "Localized Languages", value: "75+ Native", detail: "Automatic hreflang & UI translation" },
      { label: "Search Acquisition", value: "Google Page-1", detail: "Schema.org + original JPEG assets" },
      { label: "International Readiness", value: "Day-1 Global", detail: "Zero per-country manual rebuilds" },
    ],
  },
  {
    page: 19,
    shortTitle: "Live Traction & Claimed Businesses Showcase",
    kicker: "19 · REAL MARKET TRACTION & PORTFOLIO PROOF",
    headline: "Real Businesses Already Claimed, Indexed & Collecting Live Customer Proof Today.",
    subheadline:
      "This is not a slideware concept. Yoouz already runs in full production with claimed merchant accounts (such as yoouz.com and anythingvirtual.net) alongside 194+ auto-indexed companies across legal, dining, hospitality, beauty, and technology—all strictly privacy-protected.",
    imagePath: "/pitch-assets/v2/14-claimed-businesses.png",
    frameMode: "desktop",
    imageCaption: "Live Production Showcase (yoouz.com/reviews/booksandbeans.co.uk) — Verified 5.0-Star Customer Photo Proof by U/FSQUT7",
    callouts: [
      {
        id: "01",
        title: "Active Claimed Business Accounts",
        tag: "Verified & Live",
        description:
          "Verified businesses already onboarded onto the Yoouz Business Portal with full claim badges and owner response privileges active.",
      },
      {
        id: "02",
        title: "194+ Cross-Industry Live Entities",
        tag: "Multi-Vertical Proof",
        description:
          "Production index spans food delivery (wolt.com), beauty retail (sephora.com), law firms (lernerandrowe.com), hotels (hotel-julien.com), and tech.",
      },
      {
        id: "03",
        title: "Strict Owner Anonymity Standard",
        tag: "Privacy-Safe Badge",
        description:
          "Claimed badges confirm authenticity publicly without revealing private account emails or personal administrator identities anywhere.",
      },
      {
        id: "04",
        title: "Production-Hardened Multi-Browser Reliability",
        tag: "Desktop + iOS Safari",
        description:
          "Engineered with edge preloading and cache-safe Bunny.net assets so photo cards load cleanly across Chrome, Desktop, and Mobile Safari.",
      },
    ],
    metrics: [
      { label: "Indexed Businesses", value: "194+ Entities", detail: "Multi-vertical production directory" },
      { label: "Live Photo Reviews", value: "40+ Seeded & Live", detail: "Real customer captures with stars" },
      { label: "Owner Email Exposure", value: "0% Public", detail: "Strict anonymous claim standard" },
    ],
  },
  {
    page: 20,
    shortTitle: "B2B SaaS Model & Bunny.net Unit Economics",
    kicker: "20 · MONETIZATION, COMPETITIVE MOAT & ECONOMICS",
    headline: "High-Margin B2B SaaS With Ultra-Lightweight ~120 KB Photo Economics on Bunny.net.",
    subheadline:
      "Every business profile starts free to maximize global supply and Google SEO reach, then converts cleanly into $49/month Claimed Pro and $149/month Growth & Website Embed subscriptions—backed by sub-penny ~120 KB JPEG storage on Bunny.net CDN and Cloud SQL PostgreSQL.",
    imagePath: "/pitch-assets/v2/15-mobile-pwa-feed.png",
    frameMode: "mobile",
    imageCaption: "Ultra-Fast Mobile PWA Experience — Sub-Second ~120 KB Bunny.net Photo Delivery & High-Margin B2B SaaS Conversion",
    callouts: [
      {
        id: "01",
        title: "Tier 01 — Free Auto-Indexed Discovery ($0/mo)",
        tag: "Unlimited Supply Moat",
        description:
          "Every company worldwide gets an auto-built profile banner, logo, whole-star score, and unlimited customer photo reviews to fuel organic SEO growth.",
      },
      {
        id: "02",
        title: "Tier 02 — Claimed Business Pro ($49/mo)",
        tag: "Core Recurring SaaS",
        description:
          "Unlocks Verified Owner Badge, Official Pinned Replies, Direct Customer Chat Inbox, Engagement Analytics, and Tabletop QR Stand Kit.",
      },
      {
        id: "03",
        title: "Tier 03 — Growth & Website Widget ($149/mo)",
        tag: "Conversion & Multi-Site",
        description:
          "Adds Unlimited Website Embed Carousels, Schema.org Rich Snippet Sync, Branded Ad Card Exporter, and Priority Category Placement.",
      },
      {
        id: "04",
        title: "Software-Grade Gross Margin (~95%+ Margin)",
        tag: "Bunny.net CDN + Cloud SQL",
        description:
          "Serving compressed ~120 KB WebP/JPEG photos over Bunny.net edge CDN costs fractions of a cent per thousand views—scaling profitably from Day 1.",
      },
    ],
    metrics: [
      { label: "Payload Per Photo Review", value: "~120 KB", detail: "Edge-cached JPEG via Bunny.net CDN" },
      { label: "Core SaaS ARPU", value: "$49 – $149/mo", detail: "Claimed Pro & Website Embed Tiers" },
      { label: "Infrastructure Stack", value: "Bunny + Cloud SQL", detail: "Ultra-lean global edge architecture" },
    ],
  },
];
