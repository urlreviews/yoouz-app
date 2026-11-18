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

async function prepareCrispPngBuffer(webPath: string): Promise<Buffer | null> {
  try {
    const absPath = resolveDiskAssetPath(webPath);
    if (!fs.existsSync(absPath)) return null;
    return await sharp(absPath)
      .resize(1600, 1200, { fit: "inside", withoutEnlargement: true })
      .png({ quality: 92 })
      .toBuffer();
  } catch {
    return null;
  }
}

export async function generateVisualPitchPdfBuffer(): Promise<Buffer> {
  const imageBuffers = await Promise.all(
    PITCH_CHAPTERS.map((ch) => prepareCrispPngBuffer(ch.imagePath))
  );

  return new Promise((resolve, reject) => {
    try {
      // A4 Landscape (841.89 x 595.28 pt) — clean wide executive slide ratio
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 0,
        info: {
          Title: "Yoouz Investor Pitch Deck (20 Chapters · Live Photo Proof)",
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
          .text("INVESTOR PITCH DECK  ·  1 LIVE PHOTO = 1,000 WORDS", 78, 14);

        doc
          .font("Helvetica-Bold")
          .fontSize(8.5)
          .fillColor("#FFFFFF")
          .text(`${pageStr} / ${totalStr}`, pageW - 110, 14, {
            width: 82,
            align: "right",
          });

        // Kicker & Headline
        doc.font("Helvetica-Bold").fontSize(8).fillColor("#F59E0B").text(chapter.kicker, 28, 50);

        doc
          .font("Helvetica-Bold")
          .fontSize(15)
          .fillColor("#FFFFFF")
          .text(chapter.headline, 28, 63, { width: pageW - 56, lineGap: 1.4 });

        const subY = Math.max(88, doc.y + 4);
        doc
          .font("Helvetica")
          .fontSize(8.4)
          .fillColor("#D4D4D8")
          .text(chapter.subheadline, 28, subY, { width: pageW - 56, lineGap: 1.4 });

        // Content Two-Column Split below header: Left Visual Proof Frame, Right 4 Callout Cards
        const bodyTop = Math.max(134, doc.y + 10);
        const bodyBottomMargin = 62;
        const bodyH = pageH - bodyTop - bodyBottomMargin;

        const leftW = 456;
        const rightX = 28 + leftW + 14;
        const rightW = pageW - rightX - 28;

        // Left Visual Proof Box (100% Fit Without Distortion or Cropping)
        doc.roundedRect(28, bodyTop, leftW, bodyH, 8).fillAndStroke("#111215", "#27272A");

        const innerH = bodyH - 22;

        if (chapter.page === 2) {
          // Slide 02: Market Opportunity (TAM / SAM / SOM) — 3 Clean Dark-Mode Metric Cards
          const pad = 12;
          const cardGap = 8;
          const cH = Math.floor((innerH - pad * 2 - cardGap * 2) / 3);
          const cards = [
            {
              tag: "01 · TOTAL ADDRESSABLE MARKET (TAM)",
              badge: "Global Scope",
              val: "$15.8B+",
              sub: "Global Online Review & Local Discovery Market",
              desc: "Consumer review platforms, reputation management SaaS, local search discovery & e-commerce proof widgets across 75+ languages.",
              highlight: false,
            },
            {
              tag: "02 · SERVICEABLE AVAILABLE MARKET (SAM)",
              badge: "85M+ Venues",
              val: "$4.2B+",
              sub: "Addressable SMB & Multi-Location Venues Worldwide",
              desc: "Restaurants, cafes, hotels, clinics, salons, legal firms & D2C brands actively competing on visual trust & local rankings.",
              highlight: false,
            },
            {
              tag: "03 · INITIAL PRE-SEED TARGET (SOM)",
              badge: "Immediate Wedge",
              val: "1,000 Venues (~$1.2M+ ARR)",
              sub: "Initial 1,000-Venue Pre-Seed Target Cohort",
              desc: "High-frequency hospitality, dining & retail merchants onboarded via free counter QR standees and self-serve SaaS claiming.",
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
              .fontSize(7.2)
              .fillColor("#A1A1AA")
              .text(item.tag, 28 + pad + 12, cy + 9, { width: 260, lineBreak: false });
            doc
              .font("Helvetica-Bold")
              .fontSize(7.2)
              .fillColor("#F59E0B")
              .text(item.badge, 28 + leftW - pad - 110, cy + 9, { width: 98, align: "right" });
            doc
              .font("Helvetica-Bold")
              .fontSize(16)
              .fillColor("#FFFFFF")
              .text(item.val, 28 + pad + 12, cy + 22, { width: leftW - pad * 2 - 24, lineBreak: false });
            doc
              .font("Helvetica-Bold")
              .fontSize(8)
              .fillColor("#F59E0B")
              .text(item.sub, 28 + pad + 12, cy + 43, { width: leftW - pad * 2 - 24, lineBreak: false });
            doc
              .font("Helvetica")
              .fontSize(7.4)
              .fillColor("#D4D4D8")
              .text(item.desc, 28 + pad + 12, cy + 56, {
                width: leftW - pad * 2 - 24,
                lineGap: 1.2,
              });
          });
        } else if (chapter.page === 3) {
          // Slide 03: Competitive Landscape Matrix — 5 Criteria Table
          const pad = 12;
          const tableX = 28 + pad;
          const tableY = bodyTop + pad;
          const tableW = leftW - pad * 2;
          const tableH = innerH - pad * 2;
          const headerH = 28;
          const rowH = Math.floor((tableH - headerH) / 5);

          const colW = [112, 134, 96, 90];
          doc.roundedRect(tableX, tableY, tableW, tableH, 6).fillAndStroke("#09090B", "#27272A");
          doc.rect(tableX, tableY, tableW, headerH).fill("#18181B");

          // Highlight Yoouz Column
          doc
            .rect(tableX + colW[0], tableY, colW[1], tableH)
            .fillAndStroke("#141519", "#3F3F46");

          const headers = [
            "CRITERIA",
            "YOOUZ (LIVE PHOTO)",
            "GOOGLE / YELP / TP",
            "VIDEO TOOLS",
          ];
          let cx = tableX;
          headers.forEach((h, hIdx) => {
            doc
              .font("Helvetica-Bold")
              .fontSize(6.8)
              .fillColor(hIdx === 1 ? "#F59E0B" : "#E4E4E7")
              .text(h, cx + 6, tableY + 10, { width: colW[hIdx] - 12, lineBreak: false });
            cx += colW[hIdx];
          });

          const rows = [
            [
              "1. AI & Fake Review Immunity",
              "100% Live OS Camera Only (0% Gallery Uploads)",
              "Fails — AI text bots & stock uploads",
              "Partial — Staged scripts & uploads",
            ],
            [
              "2. 3-Second Live Capture",
              "Yes — 1 Photo + 1–5 Whole Stars in 3s",
              "No — Multi-sentence text essays",
              "No — 99% drop-off speaking on cam",
            ],
            [
              "3. Zero Signup / No App Download",
              "Yes — Auto U/XXXXXX + Optional Passkey",
              "No — Mandatory email & password wall",
              "No — Multi-step forms & mic prompts",
            ],
            [
              "4. In-Store Counter QR Loop",
              "Yes — Opens Business Front Page -> 1-Tap",
              "Broken — Drops users at login walls",
              "Fails — Guests won't film in public",
            ],
            [
              "5. Google Page-1 Visual SEO",
              "Yes — Original JPEGs + 75+ Lang Schema",
              "Generic text snippets / walled garden",
              "Heavy video embeds slow page load",
            ],
          ];

          rows.forEach((r, rIdx) => {
            const ry = tableY + headerH + rIdx * rowH;
            doc.rect(tableX, ry, tableW, 0.6).fill("#27272A");
            let rcx = tableX;
            r.forEach((cell, cIdx) => {
              doc
                .font(cIdx <= 1 ? "Helvetica-Bold" : "Helvetica")
                .fontSize(6.9)
                .fillColor(cIdx === 0 ? "#FFFFFF" : cIdx === 1 ? "#F59E0B" : "#A1A1AA")
                .text(cell, rcx + 6, ry + 8, {
                  width: colW[cIdx] - 12,
                  lineGap: 1.1,
                });
              rcx += colW[cIdx];
            });
          });
        } else if (chapter.page === 4) {
          // Slide 04: Go-To-Market & $0 CAC Distribution Playbook — 2x2 Grid
          const pad = 12;
          const gap = 8;
          const boxW = Math.floor((leftW - pad * 2 - gap) / 2);
          const boxH = Math.floor((innerH - pad * 2 - gap) / 2);
          const steps = [
            {
              num: "01",
              tag: "Offline Foot Traffic",
              title: "Free Print-Ready Counter QR Standees",
              desc: "Local cafes, restaurants, clinics & shops place Yoouz QR cards on tables and counters. Guests scan -> land on business front page -> snap a 3s photo at $0 CAC.",
              foot: "CAC: $0 · Merchant-Funded Display",
            },
            {
              num: "02",
              tag: "Zero Cold-Start Supply",
              title: "Autonomous Indexing of Brands & Venues",
              desc: "Any searched URL or street business is auto-scraped on demand—extracting logos, cover banners, and clean review routes before merchants ever sign up.",
              foot: "194+ Profiles Live in Production Beta",
            },
            {
              num: "03",
              tag: "Global Search Moat",
              title: "Google Page-1 SEO Across 75+ Languages",
              desc: "Original customer JPEGs + Schema.org AggregateRating JSON-LD auto-publish across 75+ localized routes (/es, /fr, /de, /ar, /ja) to capture organic search traffic.",
              foot: "75+ Native Hreflang Language Routes",
            },
            {
              num: "04",
              tag: "B2B SaaS Monetization",
              title: "Self-Serve Claiming Into Paid SaaS",
              desc: "Business owners discover their active Yoouz profile ranking on Google with real customer photos, claim ownership at yoouz.com/business, and upgrade to $49–$149/mo.",
              foot: "High-Intent Inbound SaaS Conversion",
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
              .fontSize(6.8)
              .fillColor("#F59E0B")
              .text(st.tag, bx + 38, by + 14, { width: boxW - 48, align: "right" });
            doc
              .font("Helvetica-Bold")
              .fontSize(8.8)
              .fillColor("#FFFFFF")
              .text(st.title, bx + 10, by + 36, { width: boxW - 20, lineGap: 1.1 });
            doc
              .font("Helvetica")
              .fontSize(7.2)
              .fillColor("#D4D4D8")
              .text(st.desc, bx + 10, by + 62, { width: boxW - 20, lineGap: 1.2 });
            doc
              .font("Helvetica-Bold")
              .fontSize(6.8)
              .fillColor("#A1A1AA")
              .text(st.foot, bx + 10, by + boxH - 18, { width: boxW - 20, lineBreak: false });
          });
        } else if (chapter.page === 5) {
          // Slide 05: Business Model & SaaS Economics — 3 Pricing Cards + ~95%+ Margin Bar
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
              name: "Free Auto-Indexed Discovery",
              bullets: [
                "· Auto-built profile, logo & banner",
                "· Unlimited 3s customer photos",
                "· 1–5 whole-star score aggregation",
                "· 75+ language Google SEO indexing",
              ],
              highlight: false,
            },
            {
              tier: "TIER 02 · CLAIMED PRO",
              price: "$49",
              unit: "/ month",
              name: "Claimed Business Pro",
              bullets: [
                "· Anonymous Verified Claimed badge",
                "· Official pinned owner replies",
                "· Direct customer chat inbox",
                "· Counter QR standee kit + analytics",
              ],
              highlight: true,
            },
            {
              tier: "TIER 03 · GROWTH",
              price: "$149",
              unit: "/ month",
              name: "Growth & Website Widget",
              bullets: [
                "· Unlimited 1-line website embeds",
                "· Google AggregateRating JSON-LD",
                "· Multi-location brand management",
                "· Priority discovery feed placement",
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
              .fontSize(6.8)
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
            .fontSize(8)
            .fillColor("#F59E0B")
            .text("~95%+ SOFTWARE GROSS MARGIN ARCHITECTURE", 28 + pad + 12, by + 9, {
              width: leftW - pad * 2 - 24,
              lineBreak: false,
            });
          doc
            .font("Helvetica")
            .fontSize(7.2)
            .fillColor("#D4D4D8")
            .text(
              "~120 KB Sharp-compressed JPEGs on Bunny.net global CDN + Cloud SQL PostgreSQL (<$0.01 per 1,000 views).",
              28 + pad + 12,
              by + 23,
              { width: leftW - pad * 2 - 24, lineBreak: false }
            );
        } else if (chapter.page === 6) {
          // Slide 06: Founder Edge, Live Production Status & Pre-Seed Ask
          const pad = 12;
          const cardGap = 8;
          const cH = Math.floor((innerH - pad * 2 - cardGap * 2) / 3);
          const blocks = [
            {
              kicker: "01 · FOUNDER DOMAIN & ENGINEERING EDGE",
              title: "15 Years Luxury Hospitality Management + Solo Full-Stack Execution",
              desc: "15 years of frontline luxury hospitality management combined with solo full-stack engineering that shipped the entire Yoouz production platform in-house with $0 agency burn.",
              highlight: false,
            },
            {
              kicker: "02 · TRANSPARENT LIVE PRODUCTION STATUS",
              title: "Active Production Beta (194+ Indexed Profiles · 40+ Live Reviews)",
              desc: "Our 194+ indexed profiles and 40+ live photo reviews represent an active production beta at yoouz.com with early pilot venues testing QR standees, Passkeys, and website embeds.",
              highlight: false,
            },
            {
              kicker: "03 · PRE-SEED RAISE & USE OF FUNDS BREAKDOWN",
              title: "45% First 500 Venues · 35% Global SEO Scale · 20% Core Product Growth",
              desc: "1) Onboarding First 500 Venues via physical QR standee kits (45%)  ·  2) Global SEO & Indexing Scale across 75+ languages (35%)  ·  3) Core Product & SaaS Claiming Growth (20%).",
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
              .fontSize(7.2)
              .fillColor("#F59E0B")
              .text(b.kicker, 28 + pad + 12, cy + 9, { width: leftW - pad * 2 - 24, lineBreak: false });
            doc
              .font("Helvetica-Bold")
              .fontSize(9.5)
              .fillColor("#FFFFFF")
              .text(b.title, 28 + pad + 12, cy + 23, { width: leftW - pad * 2 - 24, lineBreak: false });
            doc
              .font("Helvetica")
              .fontSize(7.4)
              .fillColor("#D4D4D8")
              .text(b.desc, 28 + pad + 12, cy + 39, {
                width: leftW - pad * 2 - 24,
                lineGap: 1.3,
              });
          });
        } else {
          const imgBuf = imageBuffers[i];
          if (imgBuf) {
            try {
              doc.image(imgBuf, 36, bodyTop + 8, {
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
          .fontSize(7)
          .fillColor("#A1A1AA")
          .text(chapter.imageCaption, 36, bodyTop + bodyH - 15, {
            width: leftW - 16,
            lineBreak: false,
            ellipsis: true,
          });

        // Right Column: 4 Numbered Explanation Cards (plus compact extras on Chapters 8, 11, 19, 20)
        let curY = bodyTop;
        const gapY = 7;
        const hasExtraBox =
          chapter.page === 8 ||
          chapter.page === 11 ||
          chapter.page === 19 ||
          chapter.page === 20;
        const extraH = chapter.page === 20 ? 62 : hasExtraBox ? 54 : 0;
        const calloutAreaH = bodyH - (hasExtraBox ? extraH + gapY : 0);
        const cardH = Math.floor((calloutAreaH - gapY * 3) / 4);

        for (let cIdx = 0; cIdx < chapter.callouts.length; cIdx++) {
          const c = chapter.callouts[cIdx];
          doc.roundedRect(rightX, curY, rightW, cardH, 7).fillAndStroke("#111215", "#27272A");

          doc.roundedRect(rightX + 9, curY + 9, 20, 18, 4).fill("#FFFFFF");
          doc
            .font("Helvetica-Bold")
            .fontSize(8.5)
            .fillColor("#09090B")
            .text(c.id, rightX + 9, curY + 13.5, { width: 20, align: "center" });

          doc
            .font("Helvetica-Bold")
            .fontSize(8.6)
            .fillColor("#FFFFFF")
            .text(c.title, rightX + 36, curY + 9, { width: rightW - 46, lineBreak: false, ellipsis: true });

          doc
            .font("Helvetica")
            .fontSize(7.5)
            .fillColor("#D4D4D8")
            .text(c.description, rightX + 36, curY + 23, {
              width: rightW - 46,
              height: cardH - 28,
              lineGap: 1.2,
            });

          curY += cardH + gapY;
        }

        if (hasExtraBox) {
          doc.roundedRect(rightX, curY, rightW, extraH, 7).fillAndStroke("#141519", "#3F3F46");
          if (chapter.page === 8) {
            doc
              .font("Helvetica-Bold")
              .fontSize(7.4)
              .fillColor("#F59E0B")
              .text("QR FLOW: 1. Scan Standee  ->  2. Business Front Page Opens  ->  3. Tap Add Review", rightX + 10, curY + 9, {
                width: rightW - 20,
              });
            const subBoxY = Math.max(curY + 23, doc.y + 4);
            doc
              .font("Helvetica")
              .fontSize(7.2)
              .fillColor("#D4D4D8")
              .text(
                "Shoppers inspect real photos and whole-star scores before opening the hardware camera—driving peak review completion.",
                rightX + 10,
                subBoxY,
                { width: rightW - 20, lineGap: 1.2 }
              );
          } else if (chapter.page === 11) {
            doc
              .font("Helvetica-Bold")
              .fontSize(7.3)
              .fillColor("#F59E0B")
              .text("ZERO SIGN-UP: 1. Snap 3s Photo -> 2. Auto U/A4B6C8 -> 3. Optional 1-Time Passkey", rightX + 10, curY + 9, {
                width: rightW - 20,
              });
            const subBoxY = Math.max(curY + 23, doc.y + 4);
            doc
              .font("Helvetica")
              .fontSize(7.2)
              .fillColor("#D4D4D8")
              .text(
                "Users never create an account, email, or password upfront—after their first review, 1 optional Face ID tap locks their handle forever.",
                rightX + 10,
                subBoxY,
                { width: rightW - 20, lineGap: 1.2 }
              );
          } else if (chapter.page === 19) {
            const domains = ANONYMOUS_CLAIMED_ENTITIES.slice(0, 6)
              .map((e) => e.domain)
              .join("  ·  ");
            doc
              .font("Helvetica-Bold")
              .fontSize(7.5)
              .fillColor("#FFFFFF")
              .text("ACTIVE PORTFOLIO (100% ANONYMOUS OWNER BADGES)", rightX + 10, curY + 9, {
                width: rightW - 20,
              });
            const subBoxY = Math.max(curY + 23, doc.y + 4);
            doc
              .font("Helvetica")
              .fontSize(7.3)
              .fillColor("#D4D4D8")
              .text(domains, rightX + 10, subBoxY, { width: rightW - 20, lineGap: 1.2 });
          } else if (chapter.page === 20) {
            doc
              .font("Helvetica-Bold")
              .fontSize(7.3)
              .fillColor("#FFFFFF")
              .text("SAAS PRICING:  $0 Free  |  $49/mo Claimed Pro  |  $149/mo Growth & Embed", rightX + 10, curY + 10, {
                width: rightW - 20,
              });
            const subBoxY = Math.max(curY + 25, doc.y + 5);
            doc
              .font("Helvetica")
              .fontSize(7.2)
              .fillColor("#F59E0B")
              .text(
                "~95%+ Gross Margin via Bunny.net CDN (~120 KB photos) & Cloud SQL PostgreSQL.",
                rightX + 10,
                subBoxY,
                { width: rightW - 20, lineGap: 1.2 }
              );
          }
        }

        // Bottom 3-Column Metrics Strip
        const metricY = pageH - 50;
        const metricW = (pageW - 56 - 16) / 3;
        chapter.metrics.forEach((m, mIdx) => {
          const mx = 28 + mIdx * (metricW + 8);
          doc.roundedRect(mx, metricY, metricW, 38, 6).fillAndStroke("#111215", "#27272A");
          doc
            .font("Helvetica-Bold")
            .fontSize(6.8)
            .fillColor("#A1A1AA")
            .text(m.label.toUpperCase(), mx + 10, metricY + 7, { width: metricW - 20 });
          doc
            .font("Helvetica-Bold")
            .fontSize(8.4)
            .fillColor("#FFFFFF")
            .text(`${m.value}  ·  ${m.detail}`, mx + 10, metricY + 20, {
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
