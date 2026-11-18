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
      "Text reviews across Google, Yelp, and Trustpilot are overrun by AI-generated spam and anonymous copy-paste bots. Asking everyday shoppers to speak on camera fails at scale. Yoouz captures undeniable proof in 3 seconds: 1 real-time hardware camera photo + 1 to 5 solid whole stars.",
    imagePath: "/pitch-assets/v2/01-home-discovery.png",
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
    shortTitle: "Universal Search & Zero-Signup Auto-Scraping",
    kicker: "02 · AUTONOMOUS INDEXING ENGINE",
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
    page: 3,
    shortTitle: "QR Scan Flow -> Business Profile Front Page",
    kicker: "03 · PHYSICAL-TO-DIGITAL QR JOURNEY",
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
    page: 4,
    shortTitle: "Native Hardware Camera Capture (Zero Gallery Uploads)",
    kicker: "04 · ANTI-SPOOFING HARDWARE PROTOCOL",
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
    page: 5,
    shortTitle: "Auto U/XXXXXX Profile & Persistent Handle",
    kicker: "05 · ZERO-FRICTION IDENTITY ARCHITECTURE",
    headline: "Zero Registration Walls: Instant U/XXXXXX Handle With Custom @Username Persistence.",
    subheadline:
      "Most review platforms lose over 70% of mobile contributors at email verification and password walls. Yoouz auto-provisions a cryptographic U/XXXXXX community profile the moment a user publishes, likes, saves, or comments—editable anytime with zero lost history.",
    imagePath: "/pitch-assets/v2/05-uhandle-profile.png",
    frameMode: "desktop",
    imageCaption: "Live Member Profile (U/FCC8RS on jollibee.com.ph) — Provisioned Automatically Without Email or Password",
    callouts: [
      {
        id: "01",
        title: "On-Action Automatic Handle Provisioning",
        tag: "U/FCC8RS Auto-Created",
        description:
          "First contribution instantly generates a clean community handle (such as U/FCC8RS or U/FSQUT7) stored securely so momentum never stalls.",
      },
      {
        id: "02",
        title: "Rename to Any Custom @Username Anytime",
        tag: "History Follows You",
        description:
          "Contributors can replace U/XXXXXX with their real name or public alias anytime—every prior photo review, follower, and like updates automatically.",
      },
      {
        id: "03",
        title: "Complete Community Showcase Tabs",
        tag: "Overview · Reviews · About",
        description:
          "Each member earns a structured portfolio showing average rating given, total live photo reviews, follower graph, and saved activity.",
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
      { label: "Sign-Up Wall Drop-Off", value: "Eliminated", detail: "Zero email or OTP delay to contribute" },
      { label: "Identity Continuity", value: "100% Synced", detail: "Custom @username updates past reviews" },
      { label: "Privacy Default", value: "Anonymous Start", detail: "No personal email ever shown publicly" },
    ],
  },
  {
    page: 6,
    shortTitle: "1-Tap Face ID / WebAuthn Passkey Lock",
    kicker: "06 · BIOMETRIC PASSKEY SECURITY & VERIFIED BADGE",
    headline: "1-Tap Face ID Passkey Protection: Own Your Handle Forever & Unlock the Verified Checkmark.",
    subheadline:
      "Once a user builds reputation on their U/XXXXXX or custom profile, they upgrade to hardware-backed WebAuthn Passkey login in one tap. No passwords to forget, no phishing risk, full cross-device recovery, and instant white Verified badge eligibility.",
    imagePath: "/pitch-assets/v2/06-passkey-settings.png",
    frameMode: "desktop",
    imageCaption: "Account Security & Passkey Settings (yoouz.com/more) — Hardware-Backed WebAuthn Face ID & Touch ID",
    callouts: [
      {
        id: "01",
        title: "FIDO2 / WebAuthn Hardware Passkey Flow",
        tag: "Face ID · Touch ID",
        description:
          "Pairs directly with Apple Face ID, Touch ID, Windows Hello, or Android biometrics—eliminating credential stuffing and bot account farms.",
      },
      {
        id: "02",
        title: "Permanent Verified Reviewer Checkmark",
        tag: "Trusted Identity Badge",
        description:
          "Biometrically secured reviewers earn the crisp white Verified checkmark next to their handle across trending feeds and search cards.",
      },
      {
        id: "03",
        title: "Instant Cross-Device Session Sync",
        tag: "iCloud / Google Passkey",
        description:
          "Sign in seamlessly across iPhone Safari, desktop Chrome, and the installed Yoouz PWA with a single biometric glance.",
      },
      {
        id: "04",
        title: "Full User Control & Privacy Settings",
        tag: "75+ Languages & Controls",
        description:
          "From one unified preferences panel, users manage Passkeys, notification controls, language switcher, and account portability.",
      },
    ],
    metrics: [
      { label: "Password Reliance", value: "Zero Passwords", detail: "Cryptographic FIDO2 hardware keys" },
      { label: "Login Latency", value: "< 1 Second", detail: "Single biometric Face ID / Touch ID tap" },
      { label: "Sybil Bot Defense", value: "Hardware Bound", detail: "Stops scripted fake reviewer farms" },
    ],
  },
  {
    page: 7,
    shortTitle: "Business Profile Hub & 5 Conversion Actions",
    kicker: "07 · COMPLETE BUSINESS STOREFRONT",
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
    page: 8,
    shortTitle: "Community Photo Canvas, Comments & Action Rail",
    kicker: "08 · ENGAGEMENT & REAL-TIME DIALOGUE",
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
    page: 9,
    shortTitle: "Direct Messages & Real-Time Notifications",
    kicker: "09 · CUSTOMER RETENTION & CHAT INBOX",
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
    page: 10,
    shortTitle: "Interactive Website Embed Widget & Schema.org SEO",
    kicker: "10 · MERCHANT WEBSITE EMBED ENGINE",
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
    page: 11,
    shortTitle: "Physical POS QR Stands & Offline Growth Flywheel",
    kicker: "11 · $0 CAC PHYSICAL DISTRIBUTION",
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
    page: 12,
    shortTitle: "Business Claiming Portal & Owner Privacy",
    kicker: "12 · B2B MERCHANT PORTAL",
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
    page: 13,
    shortTitle: "Google Page-1 Photo SEO Across 75+ Languages",
    kicker: "13 · ORGANIC SEARCH & GLOBAL DISTRIBUTION ENGINE",
    headline: "Built for Google Page 1: Native Photo Indexing & Full Localization Across 75+ Languages.",
    subheadline:
      "Search engines reward original, fresh visual evidence paired with structured Schema.org markup. Every claimed and auto-scraped business page on Yoouz publishes clean canonical routes in 75+ languages—putting real customer photos on Page 1 when buyers search a brand.",
    imagePath: "/pitch-assets/v2/13-seo-localized-page.png",
    frameMode: "desktop",
    imageCaption: "Live Localized Business Page (/es/reviews/wolt.com) — 'Reseñas con Fotos' With Structured Photo Metadata",
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
    page: 14,
    shortTitle: "Live Traction & Claimed Businesses Showcase",
    kicker: "14 · REAL MARKET TRACTION & PORTFOLIO PROOF",
    headline: "Real Businesses Already Claimed, Indexed & Collecting Live Customer Proof Today.",
    subheadline:
      "This is not a slideware concept. Yoouz already runs in full production with claimed merchant accounts (such as yoouz.com and anythingvirtual.net) alongside 194+ auto-indexed companies across legal, dining, hospitality, beauty, and technology—all strictly privacy-protected.",
    imagePath: "/pitch-assets/v2/14-claimed-businesses.png",
    frameMode: "desktop",
    imageCaption: "Verified Business Showcase (yoouz.com/reviews/sephora.com) — Real Customer Proof & Anonymous Business Shield",
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
    page: 15,
    shortTitle: "B2B SaaS Model & Bunny.net Unit Economics",
    kicker: "15 · MONETIZATION, COMPETITIVE MOAT & ECONOMICS",
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
