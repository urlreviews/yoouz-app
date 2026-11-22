import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import sharp from "sharp";
import {
  PITCH_CHAPTERS,
  ANONYMOUS_CLAIMED_ENTITIES,
} from "../data/pitchDeckChapters";

function resolveDiskAssetPath(webPath: string): string {
  const clean = webPath.replace(/^\/+/, "");
  return path.join(process.cwd(), "public", clean);
}

async function prepareCrispPngBuffer(
  webPath?: string,
  maxW = 1400,
  maxH = 1000
): Promise<Buffer | null> {
  if (!webPath) return null;
  try {
    const absPath = resolveDiskAssetPath(webPath);
    if (!fs.existsSync(absPath)) return null;
    return await sharp(absPath)
      .resize(maxW, maxH, { fit: "inside", withoutEnlargement: true })
      .png({ quality: 90 })
      .toBuffer();
  } catch {
    return null;
  }
}

export async function generateVisualPitchPdfBuffer(): Promise<Buffer> {
  const preparedImages = await Promise.all(
    PITCH_CHAPTERS.map(async (ch) => {
      const primary =
        ch.frameMode !== "data"
          ? await prepareCrispPngBuffer(ch.imagePath, 1300, 900)
          : null;
      const mobile =
        ch.frameMode !== "data" && ch.mobileImagePath
          ? await prepareCrispPngBuffer(ch.mobileImagePath, 600, 1200)
          : null;
      return { primary, mobile };
    })
  );

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 0,
        info: {
          Title: "Yoouz Investor Pitch Deck (22 Chapters · Live Photo Proof)",
          Author: "Yoouz",
          Subject: "Institutional Investor Presentation — 1 Live Camera Photo = 1,000 Words",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageW = doc.page.width;
      const pageH = doc.page.height;
      const totalPages = PITCH_CHAPTERS.length;
      const totalStr = totalPages < 10 ? `0${totalPages}` : `${totalPages}`;

      for (let i = 0; i < PITCH_CHAPTERS.length; i++) {
        if (i > 0) doc.addPage({ size: "A4", layout: "landscape", margin: 0 });
        const chapter = PITCH_CHAPTERS[i];
        const pageStr = chapter.page < 10 ? `0${chapter.page}` : `${chapter.page}`;

        // Deep Obsidian Canvas (#09090B)
        doc.rect(0, 0, pageW, pageH).fill("#09090B");

        // Top Header Ribbon
        doc.rect(0, 0, pageW, 38).fill("#111215");
        doc.rect(0, 38, pageW, 1).fill("#27272A");

        doc.font("Helvetica-Bold").fontSize(10.5).fillColor("#FFFFFF").text("YOOUZ", 28, 13);
        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor("#A1A1AA")
          .text(
            `INVESTOR PITCH DECK  ·  ${chapter.actLabel.toUpperCase()}  ·  1 LIVE PHOTO = 1,000 WORDS`,
            78,
            14
          );

        doc
          .font("Helvetica-Bold")
          .fontSize(8.5)
          .fillColor("#FFFFFF")
          .text(`${pageStr} / ${totalStr}`, pageW - 110, 14, {
            width: 82,
            align: "right",
          });

        // Kicker & Headline
        doc.font("Helvetica-Bold").fontSize(8).fillColor("#F59E0B").text(chapter.kicker, 28, 49);

        doc
          .font("Helvetica-Bold")
          .fontSize(14.5)
          .fillColor("#FFFFFF")
          .text(chapter.headline, 28, 62, { width: pageW - 56, lineGap: 1.3 });

        const subY = Math.max(85, doc.y + 4);
        doc
          .font("Helvetica")
          .fontSize(8.2)
          .fillColor("#D4D4D8")
          .text(chapter.subheadline, 28, subY, { width: pageW - 56, lineGap: 1.35 });

        // Content Two-Column Split below header
        const bodyTop = Math.max(130, doc.y + 9);
        const bodyBottomMargin = 60;
        const bodyH = pageH - bodyTop - bodyBottomMargin;

        const leftW = 468;
        const rightX = 28 + leftW + 14;
        const rightW = pageW - rightX - 28;

        // Left Visual Proof Box
        doc.roundedRect(28, bodyTop, leftW, bodyH, 8).fillAndStroke("#111215", "#27272A");
        const innerH = bodyH - 22;

        if (chapter.page === 2) {
          // Slide 02: Why Live Photo Beats Text & Video
          const pad = 12;
          const tX = 28 + pad;
          const tY = bodyTop + pad;
          const tW = leftW - pad * 2;
          const tH = innerH - pad * 2;
          const headerH = 28;
          const rowH = Math.floor((tH - headerH) / 5);
          const colW = [110, 128, 102, 104];

          doc.roundedRect(tX, tY, tW, tH, 6).fillAndStroke("#09090B", "#27272A");
          doc.rect(tX, tY, tW, headerH).fill("#18181B");
          doc.rect(tX + colW[0], tY, colW[1], tH).fillAndStroke("#141519", "#3F3F46");

          const headers = ["DIMENSION", "LIVE PHOTO (YOOUZ)", "LEGACY TEXT", "VIDEO REVIEWS"];
          let cx = tX;
          headers.forEach((h, hIdx) => {
            doc
              .font("Helvetica-Bold")
              .fontSize(6.7)
              .fillColor(hIdx === 1 ? "#F59E0B" : "#E4E4E7")
              .text(h, cx + 6, tY + 10, { width: colW[hIdx] - 12, lineBreak: false });
            cx += colW[hIdx];
          });

          const rows = [
            ["Capture Time", "3 Seconds (1 Snap)", "2–5 Min Typing", "60–120s + Retakes"],
            ["AI & Bot Immunity", "100% Hardware Gate", "0% — LLM Flooded", "High Shyness Friction"],
            ["Buyer Scan Speed", "0.2s Glance (Silent)", "Slow Paragraph Read", "Requires Audio / Time"],
            ["Edge Asset Cost", "~120 KB (~95%+ GM)", "Tiny, Low Trust", "30 MB+ Streaming Burn"],
            ["Google Visual SEO", "Native Google Images", "Generic Text Snippet", "Heavy Slow Embeds"],
          ];

          rows.forEach((r, rIdx) => {
            const ry = tY + headerH + rIdx * rowH;
            doc.rect(tX, ry, tW, 0.6).fill("#27272A");
            let rcx = tX;
            r.forEach((cell, cIdx) => {
              doc
                .font(cIdx <= 1 ? "Helvetica-Bold" : "Helvetica")
                .fontSize(6.9)
                .fillColor(cIdx === 0 ? "#FFFFFF" : cIdx === 1 ? "#F59E0B" : "#A1A1AA")
                .text(cell, rcx + 6, ry + 10, { width: colW[cIdx] - 12, lineGap: 1.1 });
              rcx += colW[cIdx];
            });
          });
        } else if (chapter.page === 3) {
          // Slide 03: Market Opportunity (TAM / SAM / SOM)
          const pad = 12;
          const cardGap = 8;
          const cH = Math.floor((innerH - pad * 2 - cardGap * 2) / 3);
          const cards = [
            {
              tag: "01 · TOTAL ADDRESSABLE MARKET (TAM)",
              badge: "Global Scope",
              val: "$15.8B+",
              sub: "Global Online Review & Local Discovery Economy",
              desc: "Consumer review platforms, reputation SaaS, local search discovery & e-commerce proof widgets across 75+ languages.",
              highlight: false,
            },
            {
              tag: "02 · SERVICEABLE AVAILABLE MARKET (SAM)",
              badge: "85M+ Venues",
              val: "$4.2B+",
              sub: "Addressable Multi-Location & SMB Storefronts Worldwide",
              desc: "Restaurants, hotels, clinics, salons, legal firms & D2C brands actively competing on visual proof & local rankings.",
              highlight: false,
            },
            {
              tag: "03 · INITIAL PRE-SEED TARGET (SOM)",
              badge: "Immediate Wedge",
              val: "1,000 Venues (~$1.2M+ ARR)",
              sub: "Initial High-Velocity Hospitality, Dining & Retail Cohort",
              desc: "Onboarded via free counter QR standees and self-serve claiming at $49–$149/mo SaaS with $0 paid-ad CAC.",
              highlight: true,
            },
          ];

          cards.forEach((item, idx) => {
            const cy = bodyTop + pad + idx * (cH + cardGap);
            doc
              .roundedRect(28 + pad, cy, leftW - pad * 2, cH, 6)
              .fillAndStroke("#09090B", item.highlight ? "#FFFFFF" : "#27272A");
            doc
              .font("Helvetica-Bold")
              .fontSize(7.1)
              .fillColor("#A1A1AA")
              .text(item.tag, 28 + pad + 12, cy + 9, { width: 260, lineBreak: false });
            doc
              .font("Helvetica-Bold")
              .fontSize(7.1)
              .fillColor("#F59E0B")
              .text(item.badge, 28 + leftW - pad - 110, cy + 9, { width: 98, align: "right" });
            doc
              .font("Helvetica-Bold")
              .fontSize(15.5)
              .fillColor("#FFFFFF")
              .text(item.val, 28 + pad + 12, cy + 22, { width: leftW - pad * 2 - 24, lineBreak: false });
            doc
              .font("Helvetica-Bold")
              .fontSize(8)
              .fillColor("#F59E0B")
              .text(item.sub, 28 + pad + 12, cy + 43, { width: leftW - pad * 2 - 24, lineBreak: false });
            doc
              .font("Helvetica")
              .fontSize(7.3)
              .fillColor("#D4D4D8")
              .text(item.desc, 28 + pad + 12, cy + 56, {
                width: leftW - pad * 2 - 24,
                lineGap: 1.2,
              });
          });
        } else if (chapter.page === 4) {
          // Slide 04: Competitive Moat Matrix
          const pad = 12;
          const tableX = 28 + pad;
          const tableY = bodyTop + pad;
          const tableW = leftW - pad * 2;
          const tableH = innerH - pad * 2;
          const headerH = 26;
          const rowH = Math.floor((tableH - headerH) / 6);
          const colW = [110, 140, 98, 96];

          doc.roundedRect(tableX, tableY, tableW, tableH, 6).fillAndStroke("#09090B", "#27272A");
          doc.rect(tableX, tableY, tableW, headerH).fill("#18181B");
          doc.rect(tableX + colW[0], tableY, colW[1], tableH).fillAndStroke("#141519", "#3F3F46");

          const headers = ["STRUCTURAL MOAT", "YOOUZ (LIVE PHOTO)", "GOOGLE MAPS", "TRUSTPILOT / YELP"];
          let cx = tableX;
          headers.forEach((h, hIdx) => {
            doc
              .font("Helvetica-Bold")
              .fontSize(6.6)
              .fillColor(hIdx === 1 ? "#F59E0B" : "#E4E4E7")
              .text(h, cx + 6, tableY + 9, { width: colW[hIdx] - 12, lineBreak: false });
            cx += colW[hIdx];
          });

          const rows = [
            ["1. AI & Bot Immunity", "100% Live Hardware Camera", "LLM text spam & stock pics", "Paid bot farms & brokers"],
            ["2. Creation Velocity", "3 Seconds (Photo + Stars)", "Slow text essays", "Multi-step written forms"],
            ["3. Login Friction", "Zero Signup (Auto U/ID)", "Mandatory Google login", "Mandatory email signup"],
            ["4. Counter QR Loop", "Opens Profile -> 1-Tap Snap", "Breaks at login screen", "Zero physical POS loop"],
            ["5. Viral Share Cards", "1200×630 Unboxed + ★ Yoouz", "Plain map pin link", "Text-only link preview"],
            ["6. Global Visual SEO", "75+ Lang JPEGs + Schema", "Walled garden snippets", "Pay-to-play ad walls"],
          ];

          rows.forEach((r, rIdx) => {
            const ry = tableY + headerH + rIdx * rowH;
            doc.rect(tableX, ry, tableW, 0.6).fill("#27272A");
            let rcx = tableX;
            r.forEach((cell, cIdx) => {
              doc
                .font(cIdx <= 1 ? "Helvetica-Bold" : "Helvetica")
                .fontSize(6.7)
                .fillColor(cIdx === 0 ? "#FFFFFF" : cIdx === 1 ? "#F59E0B" : "#A1A1AA")
                .text(cell, rcx + 6, ry + 7, { width: colW[cIdx] - 12, lineGap: 1.05 });
              rcx += colW[cIdx];
            });
          });
        } else if (chapter.page === 5) {
          // Slide 05: $0 CAC Distribution Playbook — 2x2 Grid
          const pad = 12;
          const gap = 8;
          const boxW = Math.floor((leftW - pad * 2 - gap) / 2);
          const boxH = Math.floor((innerH - pad * 2 - gap) / 2);
          const steps = [
            {
              num: "01",
              tag: "Offline Foot Traffic",
              title: "Free Counter & Table QR Standees",
              desc: "Cafes, hotels, restaurants & shops place print-ready Yoouz QR kits at tables and checkouts. Guests scan -> see peer photos -> snap in 3s.",
              foot: "CAC: $0 · Merchant-Funded Distribution",
            },
            {
              num: "02",
              tag: "Zero Cold-Start Supply",
              title: "Autonomous Brand & Venue Indexer",
              desc: "Any searched website or local venue auto-builds a rich page with official logo, banner & clean /reviews/{slug} URL before merchants sign up.",
              foot: "543+ Indexed Profiles Live Today",
            },
            {
              num: "03",
              tag: "Visual SEO + Share Cards",
              title: "75+ Lang SEO & Viral Share Cards",
              desc: "Original JPEGs + AggregateRating Schema rank on Google Page 1 across 75+ languages while every shared link renders a crisp ★ Yoouz card.",
              foot: "Compounding Organic Search & Messaging",
            },
            {
              num: "04",
              tag: "B2B SaaS Conversion",
              title: "Inbound Self-Serve SaaS Claiming",
              desc: "Business owners discover live customer photos and search impressions on their free profile, claim at yoouz.com/business, and upgrade to $49–$149/mo.",
              foot: "High-Intent Inbound Merchant Pull",
            },
          ];

          steps.forEach((st, sIdx) => {
            const col = sIdx % 2;
            const row = Math.floor(sIdx / 2);
            const bx = 28 + pad + col * (boxW + gap);
            const by = bodyTop + pad + row * (boxH + gap);
            doc
              .roundedRect(bx, by, boxW, boxH, 6)
              .fillAndStroke("#09090B", sIdx === 3 ? "#FFFFFF" : "#27272A");
            doc.roundedRect(bx + 10, by + 10, 22, 18, 4).fill(sIdx === 3 ? "#F59E0B" : "#FFFFFF");
            doc
              .font("Helvetica-Bold")
              .fontSize(8)
              .fillColor("#09090B")
              .text(st.num, bx + 10, by + 14.5, { width: 22, align: "center" });
            doc
              .font("Helvetica-Bold")
              .fontSize(6.7)
              .fillColor("#F59E0B")
              .text(st.tag, bx + 38, by + 14, { width: boxW - 48, align: "right" });
            doc
              .font("Helvetica-Bold")
              .fontSize(8.7)
              .fillColor("#FFFFFF")
              .text(st.title, bx + 10, by + 35, { width: boxW - 20, lineGap: 1.1 });
            doc
              .font("Helvetica")
              .fontSize(7.1)
              .fillColor("#D4D4D8")
              .text(st.desc, bx + 10, by + 60, { width: boxW - 20, lineGap: 1.2 });
            doc
              .font("Helvetica-Bold")
              .fontSize(6.7)
              .fillColor("#A1A1AA")
              .text(st.foot, bx + 10, by + boxH - 17, { width: boxW - 20, lineBreak: false });
          });
        } else if (chapter.page === 6) {
          // Slide 06: B2B SaaS Pricing Ladder + ~95%+ Margin Bar
          const pad = 12;
          const gap = 8;
          const bannerH = 44;
          const cardsH = innerH - pad * 2 - bannerH - gap;
          const colW = Math.floor((leftW - pad * 2 - gap * 2) / 3);
          const tiers = [
            {
              tier: "TIER 01 · DISCOVERY",
              price: "$0",
              unit: "/ forever",
              name: "Free Auto-Indexed",
              bullets: [
                "· Auto-built logo & banner",
                "· Unlimited 3s customer photos",
                "· 1–5 whole-star score",
                "· 75+ language Google SEO",
              ],
              highlight: false,
            },
            {
              tier: "TIER 02 · CLAIMED PRO",
              price: "$49",
              unit: "/ month",
              name: "Claimed Business Pro",
              bullets: [
                "· Anonymous Claimed shield",
                "· Official pinned replies",
                "· Direct customer chat inbox",
                "· QR standee kit + analytics",
              ],
              highlight: true,
            },
            {
              tier: "TIER 03 · GROWTH",
              price: "$149",
              unit: "/ month",
              name: "Growth & Embed Suite",
              bullets: [
                "· Unlimited 1-line embeds",
                "· AggregateRating JSON-LD",
                "· Multi-location dashboard",
                "· Priority discovery boost",
              ],
              highlight: false,
            },
          ];

          tiers.forEach((t, tIdx) => {
            const tx = 28 + pad + tIdx * (colW + gap);
            const ty = bodyTop + pad;
            doc
              .roundedRect(tx, ty, colW, cardsH, 6)
              .fillAndStroke("#09090B", t.highlight ? "#FFFFFF" : "#27272A");
            doc
              .font("Helvetica-Bold")
              .fontSize(6.7)
              .fillColor(t.highlight ? "#F59E0B" : "#A1A1AA")
              .text(t.tier, tx + 10, ty + 10, { width: colW - 20, lineBreak: false });
            doc
              .font("Helvetica-Bold")
              .fontSize(18)
              .fillColor("#FFFFFF")
              .text(`${t.price} `, tx + 10, ty + 24, { continued: true })
              .font("Helvetica")
              .fontSize(8)
              .fillColor("#A1A1AA")
              .text(t.unit);
            doc
              .font("Helvetica-Bold")
              .fontSize(8)
              .fillColor("#F59E0B")
              .text(t.name, tx + 10, ty + 50, { width: colW - 20 });
            doc
              .font("Helvetica")
              .fontSize(7.1)
              .fillColor("#D4D4D8")
              .text(t.bullets.join("\n"), tx + 10, ty + 72, {
                width: colW - 20,
                lineGap: 4,
              });
          });

          const by = bodyTop + pad + cardsH + gap;
          doc
            .roundedRect(28 + pad, by, leftW - pad * 2, bannerH, 6)
            .fillAndStroke("#141519", "#3F3F46");
          doc
            .font("Helvetica-Bold")
            .fontSize(7.8)
            .fillColor("#F59E0B")
            .text("~95%+ SOFTWARE GROSS MARGIN ARCHITECTURE", 28 + pad + 12, by + 9, {
              width: leftW - pad * 2 - 24,
              lineBreak: false,
            });
          doc
            .font("Helvetica")
            .fontSize(7.1)
            .fillColor("#D4D4D8")
            .text(
              "~120 KB Sharp-compressed JPEGs on Bunny.net global edge CDN + Cloud SQL PostgreSQL (<$0.01 per 1,000 impressions).",
              28 + pad + 12,
              by + 23,
              { width: leftW - pad * 2 - 24, lineBreak: false }
            );
        } else if (chapter.page === 7) {
          // Slide 07: Founder Edge, Live Traction & Pre-Seed Allocation
          const pad = 12;
          const cardGap = 8;
          const cH = Math.floor((innerH - pad * 2 - cardGap * 2) / 3);
          const blocks = [
            {
              kicker: "01 · FOUNDER DOMAIN & ENGINEERING EDGE",
              title: "15 Years Luxury Hospitality Management + Solo Full-Stack Builder",
              desc: "Deep frontline hospitality operational mastery paired with solo full-stack engineering that shipped the entire consumer PWA, B2B portal, SEO & Bunny.net CDN stack with $0 agency burn.",
              highlight: false,
            },
            {
              kicker: "02 · LIVE PRODUCTION TRACTION ON YOOUZ.COM",
              title: "543+ Indexed Brands · 62 Live Customer Photo Reviews · Claimed Portals",
              desc: "Live production proof spanning Apple, Sephora, IKEA, NIVEA, Philips, Sony, Wolt, Zara, Hotel Julien & Lerner & Rowe—plus active Passkeys, 1200×630 OG cards & embed widgets.",
              highlight: false,
            },
            {
              kicker: "03 · PRE-SEED CAPITAL ALLOCATION",
              title: "45% First 500 Venues · 35% Global SEO Scale · 20% Product & SaaS Velocity",
              desc: "45% Counter QR kit rollout across first 500 venues  ·  35% Autonomous indexing & 75+ language Google Page-1 SEO  ·  20% Shopify/Webflow 1-click embeds & self-serve billing.",
              highlight: true,
            },
          ];

          blocks.forEach((b, bIdx) => {
            const cy = bodyTop + pad + bIdx * (cH + cardGap);
            doc
              .roundedRect(28 + pad, cy, leftW - pad * 2, cH, 6)
              .fillAndStroke("#09090B", b.highlight ? "#FFFFFF" : "#27272A");
            doc
              .font("Helvetica-Bold")
              .fontSize(7.1)
              .fillColor("#F59E0B")
              .text(b.kicker, 28 + pad + 12, cy + 9, { width: leftW - pad * 2 - 24, lineBreak: false });
            doc
              .font("Helvetica-Bold")
              .fontSize(9.2)
              .fillColor("#FFFFFF")
              .text(b.title, 28 + pad + 12, cy + 23, { width: leftW - pad * 2 - 24, lineBreak: false });
            doc
              .font("Helvetica")
              .fontSize(7.3)
              .fillColor("#D4D4D8")
              .text(b.desc, 28 + pad + 12, cy + 38, {
                width: leftW - pad * 2 - 24,
                lineGap: 1.25,
              });
          });
        } else if (chapter.page === 21) {
          // Slide 21: Ultra-Lean Cloud Architecture (Bunny.net + Cloud SQL)
          const pad = 12;
          const gap = 8;
          const boxH = Math.floor((innerH - pad * 2 - gap * 3) / 4);
          const layers = [
            {
              step: "LAYER 01 · CLIENT CAPTURE",
              title: "Native Hardware Camera + Passwordless WebAuthn Passkey",
              desc: "Strict capture='environment' shutter (0% gallery uploads) + iOS Face ID / Android Biometric FIDO2 identity.",
            },
            {
              step: "LAYER 02 · MEDIA PIPELINE",
              title: "Express + Sharp Server-Side EXIF Scrubber & 1200×630 OG Engine",
              desc: "Strips private GPS headers automatically, compresses HDR photos to ~120 KB JPEGs, and composites live social share cards.",
            },
            {
              step: "LAYER 03 · GLOBAL EDGE CDN",
              title: "Bunny.net Edge Storage & Pull Zone (119+ Global PoPs)",
              desc: "Sub-100ms photo delivery worldwide at fractions of a cent per 1,000 impressions—enabling ~95%+ software gross margins.",
            },
            {
              step: "LAYER 04 · RELATIONAL CORE",
              title: "Cloud SQL (PostgreSQL) + Drizzle ORM + SSR 75-Lang SEO",
              desc: "ACID relational tables for 543+ brands, atomic like counters, comments, messages, and Schema.org JSON-LD injection.",
            },
          ];

          layers.forEach((l, idx) => {
            const ly = bodyTop + pad + idx * (boxH + gap);
            doc
              .roundedRect(28 + pad, ly, leftW - pad * 2, boxH, 6)
              .fillAndStroke("#09090B", idx === 2 ? "#FFFFFF" : "#27272A");
            doc
              .font("Helvetica-Bold")
              .fontSize(6.9)
              .fillColor("#F59E0B")
              .text(l.step, 28 + pad + 12, ly + 8, { width: leftW - pad * 2 - 24, lineBreak: false });
            doc
              .font("Helvetica-Bold")
              .fontSize(8.8)
              .fillColor("#FFFFFF")
              .text(l.title, 28 + pad + 12, ly + 20, { width: leftW - pad * 2 - 24, lineBreak: false });
            doc
              .font("Helvetica")
              .fontSize(7.1)
              .fillColor("#D4D4D8")
              .text(l.desc, 28 + pad + 12, ly + 33, { width: leftW - pad * 2 - 24, lineGap: 1.15 });
          });
        } else if (chapter.page === 22) {
          // Slide 22: Live Active Portfolio Table + 18-Month Roadmap
          const pad = 12;
          const tX = 28 + pad;
          const tY = bodyTop + pad;
          const tW = leftW - pad * 2;
          const tH = innerH - pad * 2;
          const headerH = 24;
          const visibleRows = ANONYMOUS_CLAIMED_ENTITIES.slice(0, 8);
          const rowH = Math.floor((tH - headerH) / visibleRows.length);
          const colW = [110, 96, 108, 130];

          doc.roundedRect(tX, tY, tW, tH, 6).fillAndStroke("#09090B", "#27272A");
          doc.rect(tX, tY, tW, headerH).fill("#18181B");

          const headers = ["BRAND / ENTITY", "DOMAIN", "STATUS (ANONYMOUS)", "LIVE PROOF HIGHLIGHTS"];
          let cx = tX;
          headers.forEach((h, hIdx) => {
            doc
              .font("Helvetica-Bold")
              .fontSize(6.5)
              .fillColor(hIdx === 2 ? "#F59E0B" : "#E4E4E7")
              .text(h, cx + 6, tY + 8, { width: colW[hIdx] - 10, lineBreak: false });
            cx += colW[hIdx];
          });

          visibleRows.forEach((ent, rIdx) => {
            const ry = tY + headerH + rIdx * rowH;
            doc.rect(tX, ry, tW, 0.5).fill("#27272A");
            const cells = [ent.name, ent.domain, ent.status, ent.highlights];
            let rcx = tX;
            cells.forEach((cell, cIdx) => {
              doc
                .font(cIdx === 0 || cIdx === 2 ? "Helvetica-Bold" : "Helvetica")
                .fontSize(6.6)
                .fillColor(cIdx === 0 ? "#FFFFFF" : cIdx === 2 ? "#F59E0B" : "#D4D4D8")
                .text(cell, rcx + 6, ry + 7, {
                  width: colW[cIdx] - 10,
                  lineBreak: false,
                  ellipsis: true,
                });
              rcx += colW[cIdx];
            });
          });
        } else {
          // Live Product Screenshot Stage — Side-by-Side Desktop + Mobile when both exist!
          const imgs = preparedImages[i];
          if (imgs?.primary && imgs?.mobile) {
            const stagePad = 10;
            const mobileW = 108;
            const gap = 10;
            const deskW = leftW - stagePad * 2 - mobileW - gap;
            const stageH = bodyH - 36;

            // Desktop screenshot frame
            doc
              .roundedRect(28 + stagePad, bodyTop + 8, deskW, stageH, 6)
              .fillAndStroke("#09090B", "#27272A");
            try {
              doc.image(imgs.primary, 28 + stagePad + 3, bodyTop + 11, {
                fit: [deskW - 6, stageH - 6],
                align: "center",
                valign: "center",
              });
            } catch {}

            // Mobile iPhone frame right beside Desktop
            const mobX = 28 + stagePad + deskW + gap;
            doc
              .roundedRect(mobX, bodyTop + 8, mobileW, stageH, 10)
              .fillAndStroke("#050507", "#3F3F46");
            try {
              doc.image(imgs.mobile, mobX + 4, bodyTop + 12, {
                fit: [mobileW - 8, stageH - 8],
                align: "center",
                valign: "center",
              });
            } catch {}
          } else if (imgs?.primary) {
            try {
              doc.image(imgs.primary, 36, bodyTop + 8, {
                fit: [leftW - 16, bodyH - 34],
                align: "center",
                valign: "center",
              });
            } catch {}
          }
        }

        // Caption strip along bottom of Left Visual Proof Box
        doc.rect(28, bodyTop + bodyH - 22, leftW, 22).fill("#09090B");
        doc
          .font("Helvetica")
          .fontSize(6.9)
          .fillColor("#A1A1AA")
          .text(chapter.imageCaption, 36, bodyTop + bodyH - 15, {
            width: leftW - 16,
            lineBreak: false,
            ellipsis: true,
          });

        // Right Column: 4 Numbered Callout Cards + Optional Compact Button Guide Strip
        let curY = bodyTop;
        const gapY = 6.5;
        const hasGuide = Boolean(chapter.buttonGuide && chapter.buttonGuide.length > 0);
        const guideH = hasGuide ? 52 : 0;
        const calloutAreaH = bodyH - (hasGuide ? guideH + gapY : 0);
        const cardH = Math.floor((calloutAreaH - gapY * 3) / 4);

        for (let cIdx = 0; cIdx < chapter.callouts.length; cIdx++) {
          const c = chapter.callouts[cIdx];
          doc.roundedRect(rightX, curY, rightW, cardH, 7).fillAndStroke("#111215", "#27272A");

          doc.roundedRect(rightX + 9, curY + 8, 20, 17, 4).fill("#FFFFFF");
          doc
            .font("Helvetica-Bold")
            .fontSize(8)
            .fillColor("#09090B")
            .text(c.id, rightX + 9, curY + 12.5, { width: 20, align: "center" });

          doc
            .font("Helvetica-Bold")
            .fontSize(8.3)
            .fillColor("#FFFFFF")
            .text(c.title, rightX + 35, curY + 8, {
              width: rightW - 44,
              lineBreak: false,
              ellipsis: true,
            });

          doc
            .font("Helvetica")
            .fontSize(7.25)
            .fillColor("#D4D4D8")
            .text(c.description, rightX + 35, curY + 21, {
              width: rightW - 44,
              height: Math.max(24, cardH - 25),
              lineGap: 1.15,
            });

          curY += cardH + gapY;
        }

        if (hasGuide && chapter.buttonGuide) {
          doc.roundedRect(rightX, curY, rightW, guideH, 7).fillAndStroke("#141519", "#3F3F46");
          doc
            .font("Helvetica-Bold")
            .fontSize(6.8)
            .fillColor("#F59E0B")
            .text("INTERACTIVE CONTROLS ON THIS SCREEN", rightX + 10, curY + 7, {
              width: rightW - 20,
              lineBreak: false,
            });
          const summaryControls = chapter.buttonGuide
            .slice(0, 3)
            .map((b) => `${b.control}: ${b.action}`)
            .join("  ·  ");
          doc
            .font("Helvetica")
            .fontSize(6.75)
            .fillColor("#D4D4D8")
            .text(summaryControls, rightX + 10, curY + 19, {
              width: rightW - 20,
              height: guideH - 22,
              lineGap: 1.15,
            });
        }

        // Bottom 3-Column Metrics Strip
        const metricY = pageH - 48;
        const metricW = (pageW - 56 - 16) / 3;
        chapter.metrics.forEach((m, mIdx) => {
          const mx = 28 + mIdx * (metricW + 8);
          doc.roundedRect(mx, metricY, metricW, 36, 6).fillAndStroke("#111215", "#27272A");
          doc
            .font("Helvetica-Bold")
            .fontSize(6.6)
            .fillColor("#A1A1AA")
            .text(m.label.toUpperCase(), mx + 10, metricY + 6, { width: metricW - 20 });
          doc
            .font("Helvetica-Bold")
            .fontSize(8.2)
            .fillColor("#FFFFFF")
            .text(`${m.value}  ·  ${m.detail}`, mx + 10, metricY + 18.5, {
              width: metricW - 20,
              lineBreak: false,
              ellipsis: true,
            });
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
    path.join(process.cwd(), "public", "Yoouz_Visual_Investor_Pitch_Deck.pdf"),
    path.join(process.cwd(), "public", "Yoouz_Investor_Pitch_Memorandum.pdf"),
    path.join(process.cwd(), "public", "Yoouz_Institutional_Investor_Memorandum.pdf"),
    path.join(
      process.cwd(),
      "public",
      "assets",
      "aistudio",
      "Yoouz_Institutional_Investor_Memorandum_pdf_ce4b9c13.pdf"
    ),
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
