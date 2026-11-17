import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import sharp from "sharp";

interface SlideCallout {
  num: string;
  title: string;
  desc: string;
}

interface PdfSlideSpec {
  pageNum: number;
  kicker: string;
  title: string;
  subtitle: string;
  imagePath: string;
  secondaryImagePath?: string;
  imageCaption: string;
  callouts: SlideCallout[];
  bottomMetrics: Array<{ label: string; value: string }>;
}

const SLIDE_SPECS: PdfSlideSpec[] = [
  {
    pageNum: 1,
    kicker: "PAGE 01 · EXECUTIVE SUMMARY & CORE THESIS",
    title: "A Picture Is Worth 1,000 Words. One Live Photo Replaces Fake Text Reviews.",
    subtitle:
      "Text reviews on Google, Yelp, and Trustpilot are flooded with AI bots and fake paragraphs. Video reviews fail because 99% of customers refuse to film a 60s selfie in public. Yoouz captures undeniable proof in 3 seconds: 1 live camera photo + 1–5 solid whole stars.",
    imagePath: "public/pitch-assets/screen-6-home-feed.png",
    secondaryImagePath: "public/pitch-assets/screen-1-wolt-full.png",
    imageCaption: "Live Yoouz Production Screens — Home Discovery (Left) & Full-Bleed Photo Review Feed on wolt.com (Right)",
    callouts: [
      {
        num: "01",
        title: "Home Discovery & Universal Search Bar ('See the Truth Before You Decide')",
        desc: "Visitors browse trending live photo reviews immediately and search any local venue, brand, or URL worldwide with zero sign-up wall.",
      },
      {
        num: "02",
        title: "Verified Business Pill (Top Backdrop Overlay)",
        desc: "Translucent dark glass pill at the top of every photo review displaying the official brand logo, verified checkmark, whole-star score, and review count.",
      },
      {
        num: "03",
        title: "100% Live Photo Canvas & Reviewer Attribution",
        desc: "Full-bleed customer photo paired with the reviewer's handle (U/XXXXXX or custom name), accurate relative timestamp, 5-star badge, and clickable domain.",
      },
      {
        num: "04",
        title: "5-Button Vertical Social Action Rail",
        desc: "Thumb-friendly action rail for following the reviewer (+), liking (9), opening threaded comments (3), bookmarking/saving (3), and sharing (2).",
      },
    ],
    bottomMetrics: [
      { label: "Review Creation Time", value: "3 Seconds (1 Photo)" },
      { label: "Gallery / Fake Uploads", value: "0% Allowed (Camera Only)" },
      { label: "Visual Proof Density", value: "1 Photo = 1,000 Words" },
    ],
  },
  {
    pageNum: 2,
    kicker: "PAGE 02 · ZERO-UPLOAD NATIVE CAMERA PROTOCOL",
    title: "How a Photo Review Works: Native Camera -> Whole Stars -> Published.",
    subtitle:
      "Every customer already snaps photos of their meal, coffee, hotel room, or purchase. Yoouz turns that natural 3-second habit into a verified review—launching the phone's native camera directly while strictly blocking gallery uploads.",
    imagePath: "public/pitch-assets/screen-2-desktop-qr-modal.png",
    secondaryImagePath: "public/pitch-assets/screen-4-mobile-camera-modal.png",
    imageCaption: "Live Yoouz Capture Screens — Desktop QR Camera Handoff (Left) & Mobile 'Snap a Native Photo' Launch (Right)",
    callouts: [
      {
        num: "01",
        title: "Desktop-to-Mobile QR Camera Handoff ('Add Live Photo Review')",
        desc: "Clicking '+ Add Review' on desktop displays an instant QR code pre-linked to that business so the user's phone camera opens the review screen in 1 second.",
      },
      {
        num: "02",
        title: "Mobile Native Camera Launch ('Open Camera' — No Gallery Uploads)",
        desc: "Tapping 'Open Camera' launches the iOS/Android native camera app directly for full HDR and stabilization—with zero option to upload old gallery photos.",
      },
      {
        num: "03",
        title: "Full-Screen Photo Preview & 1–5 Solid Whole-Star Rating",
        desc: "Users preview their captured photo, tap 1, 2, 3, 4, or 5 solid whole stars (zero half-stars, zero text required), or tap 'Retake'.",
      },
      {
        num: "04",
        title: "1-Tap 'Publish Photo Review' & Server-Side EXIF Privacy Stripping",
        desc: "Tapping 'Publish Photo Review' strips private EXIF/GPS tracking data via Sharp and publishes a ~120 KB optimized JPEG to Bunny.net CDN.",
      },
    ],
    bottomMetrics: [
      { label: "Gallery Roll Uploads", value: "Strictly Blocked" },
      { label: "Star Rating Standard", value: "1–5 Solid Whole Stars" },
      { label: "Privacy & Optimization", value: "Sharp EXIF Strip (~120 KB)" },
    ],
  },
  {
    pageNum: 3,
    kicker: "PAGE 03 · ZERO-FRICTION IDENTITY & BIOMETRIC PASSKEY",
    title: "No Email, No Password, No Magic Link: Auto U/XXXXXX Handle -> Face ID Passkey.",
    subtitle:
      "Legacy platforms lose 70%+ of reviewers at sign-up walls and magic-link delays. On Yoouz, an automatic U/XXXXXX member profile is created on action, customizable anytime and locked forever via 1-tap Face ID Passkey.",
    imagePath: "public/pitch-assets/screen-7-creator-u-handle.png",
    secondaryImagePath: "uploads/photos/rev_jollibee_food_04_jollibee_com_ph.jpg",
    imageCaption: "Live Automatic Member Profile Drawer (U/FCC8RS on jollibee.com.ph) — Zero Email, Password, or Magic Link Required",
    callouts: [
      {
        num: "01",
        title: "On-Action Automatic Guest-to-Member Profile (U/XXXXXX)",
        desc: "Zero sign-up is required to browse. Publishing a photo review, liking, commenting, or saving automatically generates a unique U/XXXXXX member profile.",
      },
      {
        num: "02",
        title: "Claim or Change Custom @Username Anytime (Always Saved)",
        desc: "Right after publishing or anytime inside their Profile Drawer, users can change U/XXXXXX to any custom username—and it stays permanently saved everywhere.",
      },
      {
        num: "03",
        title: "1-Tap Biometric Face ID / Passkey Account Lock",
        desc: "Tapping 'Save Face ID (1-Time)' stores a WebAuthn Passkey in Apple iCloud Keychain or Android Biometrics—remembering the account across phones without passwords.",
      },
      {
        num: "04",
        title: "Verified Reviewer Checkmark (✓) & Full Creator Hub",
        desc: "Saving a Passkey unlocks the official white Verified Reviewer badge (✓) and powers their complete profile drawer (Reviews, Followers, Following, Chat).",
      },
    ],
    bottomMetrics: [
      { label: "Passwords or Magic Links", value: "Zero Required" },
      { label: "Default Privacy Identity", value: "Auto U/XXXXXX Handle" },
      { label: "Account Persistence", value: "1-Tap Face ID Passkey" },
    ],
  },
  {
    pageNum: 4,
    kicker: "PAGE 04 · INTERACTIVE BUSINESS PROFILE & CONVERSION DOCK",
    title: "Every Business & Website Becomes an Actionable Conversion Hub.",
    subtitle:
      "Alongside every photo review on desktop—and as a full native screen on mobile—Yoouz renders a dedicated Business Profile Drawer with verified brand assets, aggregate whole-star score, and 5 direct customer conversion buttons.",
    imagePath: "public/pitch-assets/screen-1-wolt-full.png",
    secondaryImagePath: "public/pitch-assets/screen-3-mobile-view.png",
    imageCaption: "Live Business Profile Hub for Wolt (wolt.com) — Desktop 3-Column View (Left) & Mobile PWA View (Right)",
    callouts: [
      {
        num: "01",
        title: "Official Brand Banner, Squircle Logo & '+ Follow'",
        desc: "Displays high-resolution cover banner, official brand logo inside a squircle frame, verified badge, clickable domain link, and '+ Follow' button.",
      },
      {
        num: "02",
        title: "Aggregate Star Score & Primary 'ADD REVIEW' Button",
        desc: "High-contrast white 'ADD REVIEW' CTA directly below the 5.0 star rating launches the photo review flow pre-tagged to that exact business.",
      },
      {
        num: "03",
        title: "Overview · Photo Reviews · About Navigation Tabs",
        desc: "Lets customers switch seamlessly between the business summary, the complete grid of verified customer photo reviews, and location/website details.",
      },
      {
        num: "04",
        title: "5-Button Customer Conversion Dock (Directions, Call, Save, Share, Chat)",
        desc: "Converts visual discovery into immediate business revenue: GPS Directions, 1-Tap Phone Call, Bookmark Save, Social/QR Share, and Direct Business Chat.",
      },
    ],
    bottomMetrics: [
      { label: "Direct Conversion Actions", value: "Directions · Call · Save · Share · Chat" },
      { label: "Profile Navigation", value: "Overview · Photo Reviews · About" },
      { label: "Camera Context", value: "1-Tap Pre-Tagged Launch" },
    ],
  },
  {
    pageNum: 5,
    kicker: "PAGE 05 · VERIFIED SOCIAL PROOF & MICRO-CONVERSATIONS",
    title: "Real Human Questions, Verified Reviewer Replies & Accurate Timestamps.",
    subtitle:
      "When shoppers see an authentic photo, they ask specific questions ('broth didnt spill at all?'). Yoouz highlights replies from the actual photo Reviewer and enforces strict chronological timestamp accuracy.",
    imagePath: "public/pitch-assets/screen-5-wolt-comments.png",
    imageCaption: "Live Threaded Comments Drawer Open on yoouz.com/reviews/wolt.com — Chronological Timestamps & Reviewer Badge",
    callouts: [
      {
        num: "01",
        title: "Right-Hand Threaded Comments Drawer ('Comments 3 · Top | Newest')",
        desc: "Opens alongside the photo review without interrupting viewing, featuring instant switching between Top-liked comments and Newest activity.",
      },
      {
        num: "02",
        title: "Short, Natural Human Remarks with Realistic Timing",
        desc: "Real conversational comments ('22 mins is impressive for ramen', 'broth didnt spill at all?') with chronologically newer timestamps than the photo.",
      },
      {
        num: "03",
        title: "Official 'Reviewer' Badge on Photo Author Replies",
        desc: "When the original photo author replies ('sealed lid held up great'), Yoouz displays a verified 'Reviewer' badge so shoppers know the answer is authentic.",
      },
      {
        num: "04",
        title: "Live Comment Bar & Full Admin Console Sync",
        desc: "Every new comment, reply, like, save, and share is persisted to dedicated database tables with live millisecond timestamps.",
      },
    ],
    bottomMetrics: [
      { label: "Live Seeded Catalog", value: "40 Verified Photo Reviews" },
      { label: "Database Interactions", value: "318 Likes · 111 Saves · 74 Comments" },
      { label: "Timestamp Engine", value: "100% Chronological Sync" },
    ],
  },
  {
    pageNum: 6,
    kicker: "PAGE 06 · UNIVERSAL LOCAL + WEB DISCOVERY ENGINE",
    title: "Every Physical Street Venue & Global Website Indexed in One Platform.",
    subtitle:
      "Unlike Yelp (local venues only) or Trustpilot (web domains only), Yoouz indexes every physical business AND every global website—automatically resolving brand logos, banners, and 75+ language SEO.",
    imagePath: "uploads/photos/rev_sephora_cosmetics_15_sephora_com.jpg",
    secondaryImagePath: "uploads/photos/rev_noma_34_noma_dk.jpg",
    imageCaption: "Multi-Industry Photo Coverage — Global E-Commerce & Cosmetics (Sephora) to Fine Dining & Local Services (Noma)",
    callouts: [
      {
        num: "01",
        title: "Hospitality, Dining & Local Cafes (Noma, Hotel Julien, Maki Cafe)",
        desc: "Diners and travelers browse real, unfiltered table and room photos before booking—eliminating staged marketing photography.",
      },
      {
        num: "02",
        title: "High-Trust Professional Services (Legal, Medical, Dental, Auto)",
        desc: "Covers high-value local services where trust matters most: injury attorneys, medical clinics, physiotherapy practices, pharmacies, and auto repair.",
      },
      {
        num: "03",
        title: "Global E-Commerce, Delivery & Consumer Tech (wolt.com, sephora.com, flipper.net)",
        desc: "Shoppers snap live unboxing and delivery photos for any online domain—automatically scraping official logos, cover banners, and metadata.",
      },
      {
        num: "04",
        title: "Automated 75+ Language SEO & Dynamic OpenGraph Cards",
        desc: "Every business page generates structured Schema.org AggregateRating markup, localized hreflang URLs, and custom social preview cards.",
      },
    ],
    bottomMetrics: [
      { label: "Indexed Business Scope", value: "Local Venues + Global Domains" },
      { label: "International SEO Support", value: "75+ Languages + JSON-LD" },
      { label: "Brand Asset Resolution", value: "Auto Logo & Banner Scraper" },
    ],
  },
  {
    pageNum: 7,
    kicker: "PAGE 07 · ZERO-CAC B2B DISTRIBUTION & PRIVACY-FIRST CLAIMING",
    title: "Every Claimed Business Becomes a Zero-CAC User Acquisition Channel.",
    subtitle:
      "Business owners claim their profile via work email, display physical Yoouz QR Review Stands on tables and counters, and embed live photo review carousels on their websites—driving continuous organic growth at $0 CAC.",
    imagePath: "public/pitch-assets/screen-9-business-portal.png",
    secondaryImagePath: "public/pitch-assets/screen-2-desktop-qr-modal.png",
    imageCaption: "Official Yoouz Business Portal (yoouz.com/business) & Point-of-Sale QR Code Camera Handoff",
    callouts: [
      {
        num: "01",
        title: "Yoouz Business Portal & Strict Owner Privacy",
        desc: "Merchants sign in with their work domain email to claim their profile. Public pages show the verified badge while owner personal emails remain 100% hidden.",
      },
      {
        num: "02",
        title: "Physical Tabletop & Checkout QR Review Stands ($0 CAC Loop)",
        desc: "Claimed businesses place QR table tents and counter stickers at checkout. Customers scan and snap 1 live photo in 3 seconds with zero app download.",
      },
      {
        num: "03",
        title: "Merchant Dashboard: Analytics, Owner Replies & Direct Chat",
        desc: "Owners track real-time engagement metrics, reply publicly to customer photo reviews, and message customers directly.",
      },
      {
        num: "04",
        title: "Embeddable Website Trust Widget & Branded Social Export",
        desc: "Merchants embed live Yoouz photo reviews directly on their checkout pages and export high-resolution branded social proof cards.",
      },
    ],
    bottomMetrics: [
      { label: "Customer Acquisition Cost", value: "$0 Organic QR Loop" },
      { label: "Owner Email Privacy", value: "100% Private & Hidden" },
      { label: "Merchant Integration", value: "1-Line JS Website Widget" },
    ],
  },
  {
    pageNum: 8,
    kicker: "PAGE 08 · UNIT ECONOMICS, B2B SAAS TIERS & DEFENSIVE MOATS",
    title: "10x Higher Review Conversion at 98.5% Lower Infrastructure Cost.",
    subtitle:
      "By focusing exclusively on Sharp-optimized live photos (~120 KB) on Bunny.net CDN and Cloud SQL instead of heavy video streams (10+ MB), Yoouz eliminates video transcoding overhead and delivers 92%+ B2B SaaS gross margins.",
    imagePath: "uploads/photos/rev_hotel_julien_27_hotel_julien_com.jpg",
    secondaryImagePath: "uploads/photos/rev_zara_apparel_01_zara_com.jpg",
    imageCaption: "Scalable Edge Architecture — ~120 KB Sharp JPEGs on Bunny.net CDN + Cloud SQL + High-Margin B2B SaaS Subscriptions",
    callouts: [
      {
        num: "01",
        title: "98.5% Lower Infrastructure Footprint (Zero Video Bloat)",
        desc: "An optimized photo review is ~120 KB vs. 10+ MB for video—eliminating video transcoding queues and HLS streaming bandwidth costs completely.",
      },
      {
        num: "02",
        title: "Claimed Business Pro Subscription ($49 / month per location)",
        desc: "Core recurring B2B tier unlocking the Verified Business badge, Direct Customer Chat Inbox, Official Owner Replies, Analytics, and QR Stand Kit.",
      },
      {
        num: "03",
        title: "Growth & E-Commerce Widget Tier ($149 / month)",
        desc: "Designed for online brands and multi-location venues: unlimited website embed carousels, social ad card exports, and priority category placement.",
      },
      {
        num: "04",
        title: "Four Compounding Defensive Moats",
        desc: "(1) Zero-upload native camera, (2) Zero-password U/XXXXXX + Face ID Passkey identity, (3) Physical QR stand viral loop, (4) Unified local + web directory.",
      },
    ],
    bottomMetrics: [
      { label: "Infra Cost vs. Video", value: "98.5% Lower Storage/CDN" },
      { label: "Target Gross Margin", value: "92%+ B2B SaaS Margin" },
      { label: "B2B SaaS Tiers", value: "$0 Free · $49/mo Pro · $149/mo Growth" },
    ],
  },
];

async function prepareImageBuffer(relPath: string, width: number, height: number): Promise<Buffer | null> {
  try {
    const absPath = path.join(process.cwd(), relPath);
    if (!fs.existsSync(absPath)) return null;
    return await sharp(absPath)
      .resize(width, height, { fit: "cover", position: "center" })
      .jpeg({ quality: 90 })
      .toBuffer();
  } catch {
    return null;
  }
}

export async function generateVisualPitchPdfBuffer(): Promise<Buffer> {
  const primaryBuffers = await Promise.all(
    SLIDE_SPECS.map((s) =>
      prepareImageBuffer(
        s.imagePath,
        s.secondaryImagePath ? 520 : 960,
        s.secondaryImagePath ? 360 : 540
      )
    )
  );
  const secondaryBuffers = await Promise.all(
    SLIDE_SPECS.map((s) =>
      s.secondaryImagePath ? prepareImageBuffer(s.secondaryImagePath, 520, 360) : Promise.resolve(null)
    )
  );

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 0,
        autoFirstPage: false,
        info: {
          Title: "Yoouz — Visual Investor Pitch Deck (1 Live Photo = 1,000 Words)",
          Author: "Yoouz",
          Subject: "Live Photo Review Platform & B2B Trust Ecosystem",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageW = 595.28;
      const pageH = 841.89;

      for (let i = 0; i < SLIDE_SPECS.length; i++) {
        const spec = SLIDE_SPECS[i];
        doc.addPage({ size: "A4", margin: 0 });

        // Natural Dark Mode Obsidian Background (#09090B)
        doc.rect(0, 0, pageW, pageH).fill("#09090B");

        // Top Header Bar (Black & White Monochrome)
        doc.rect(0, 0, pageW, 44).fill("#111215");
        doc.rect(0, 44, pageW, 1).fill("#27272A");

        doc.font("Helvetica-Bold").fontSize(11).fillColor("#FFFFFF").text("YOOUZ", 32, 16);
        doc
          .font("Helvetica")
          .fontSize(8.5)
          .fillColor("#A1A1AA")
          .text("INVESTOR PITCH DECK  ·  1 LIVE PHOTO = 1,000 WORDS", 86, 17.5);
        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor("#FFFFFF")
          .text(`0${spec.pageNum} / 08`, pageW - 72, 17, { width: 40, align: "right" });

        // Kicker
        doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#D4D4D8").text(spec.kicker, 32, 62);

        // Main Headline
        doc
          .font("Helvetica-Bold")
          .fontSize(18.5)
          .fillColor("#FFFFFF")
          .text(spec.title, 32, 78, { width: pageW - 64, lineGap: 2 });

        // Subtitle
        const subtitleY = doc.y + 6;
        doc
          .font("Helvetica")
          .fontSize(9.2)
          .fillColor("#D4D4D8")
          .text(spec.subtitle, 32, subtitleY, { width: pageW - 64, lineGap: 2 });

        // Clean Unobstructed Visual Screenshot Frame (Zero Overlapping Circles)
        const imgBoxY = 168;
        const imgBoxH = 244;
        const imgBoxW = pageW - 64;

        doc.roundedRect(32, imgBoxY, imgBoxW, imgBoxH, 10).fillAndStroke("#111215", "#27272A");

        const pBuf = primaryBuffers[i];
        const sBuf = secondaryBuffers[i];

        if (pBuf && sBuf) {
          const halfW = (imgBoxW - 24) / 2;
          try {
            doc.image(pBuf, 40, imgBoxY + 8, { width: halfW, height: imgBoxH - 34 });
            doc.image(sBuf, 40 + halfW + 8, imgBoxY + 8, { width: halfW, height: imgBoxH - 34 });
          } catch {}
        } else if (pBuf) {
          try {
            doc.image(pBuf, 40, imgBoxY + 8, { width: imgBoxW - 16, height: imgBoxH - 34 });
          } catch {}
        }

        // Image caption bar inside bottom of frame
        doc.rect(32, imgBoxY + imgBoxH - 22, imgBoxW, 22).fill("#09090B");
        doc
          .font("Helvetica-Bold")
          .fontSize(7.5)
          .fillColor("#A1A1AA")
          .text(spec.imageCaption, 42, imgBoxY + imgBoxH - 15, { width: imgBoxW - 20 });

        // Section Label for Annotated Callouts
        const calloutStartY = imgBoxY + imgBoxH + 18;
        doc
          .font("Helvetica-Bold")
          .fontSize(8.5)
          .fillColor("#FFFFFF")
          .text("COMPLETE SCREEN & WORKFLOW BREAKDOWN", 32, calloutStartY);

        // 4 Numbered Callout Cards (Black & White Monochrome)
        let curY = calloutStartY + 16;
        for (let cIdx = 0; cIdx < spec.callouts.length; cIdx++) {
          const c = spec.callouts[cIdx];
          const cardH = 66;
          doc.roundedRect(32, curY, pageW - 64, cardH, 8).fillAndStroke("#111215", "#27272A");

          // White badge with black number
          doc.roundedRect(42, curY + 11, 24, 22, 5).fill("#FFFFFF");
          doc
            .font("Helvetica-Bold")
            .fontSize(9.5)
            .fillColor("#09090B")
            .text(c.num, 42, curY + 17, { width: 24, align: "center" });

          // Callout Title & Description
          doc
            .font("Helvetica-Bold")
            .fontSize(10.2)
            .fillColor("#FFFFFF")
            .text(c.title, 76, curY + 11, { width: pageW - 120 });
          doc
            .font("Helvetica")
            .fontSize(8.8)
            .fillColor("#D4D4D8")
            .text(c.desc, 76, curY + 27, { width: pageW - 120, lineGap: 1.5 });

          curY += cardH + 8;
        }

        // Bottom 3-Column Key Metric Strip
        const metricY = pageH - 74;
        const metricW = (pageW - 64 - 16) / 3;
        spec.bottomMetrics.forEach((m, mIdx) => {
          const mx = 32 + mIdx * (metricW + 8);
          doc.roundedRect(mx, metricY, metricW, 44, 6).fillAndStroke("#111215", "#27272A");
          doc
            .font("Helvetica")
            .fontSize(7.5)
            .fillColor("#A1A1AA")
            .text(m.label.toUpperCase(), mx + 10, metricY + 9, { width: metricW - 20 });
          doc
            .font("Helvetica-Bold")
            .fontSize(10)
            .fillColor("#FFFFFF")
            .text(m.value, mx + 10, metricY + 23, { width: metricW - 20 });
        });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export async function writeVisualPitchPdfFiles(): Promise<Buffer> {
  const buf = await generateVisualPitchPdfBuffer();
  const targets = [
    path.join(process.cwd(), "public", "Yoouz_Institutional_Investor_Memorandum.pdf"),
    path.join(process.cwd(), "public", "Yoouz_Investor_Pitch_Memorandum.pdf"),
    path.join(process.cwd(), "public", "assets", "aistudio", "Yoouz_Institutional_Investor_Memorandum_pdf_ce4b9c13.pdf"),
  ];
  for (const t of targets) {
    try {
      const dir = path.dirname(t);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(t, buf);
    } catch {}
  }
  return buf;
}
