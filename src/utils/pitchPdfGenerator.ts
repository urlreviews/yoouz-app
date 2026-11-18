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
          Title: "Yoouz Investor Pitch Deck (15 Chapters · Live Photo Proof)",
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
          .text(`PAGE ${pageStr} OF ${totalPages}`, pageW - 110, 14, {
            width: 82,
            align: "right",
          });

        // Kicker & Headline
        doc.font("Helvetica-Bold").fontSize(8).fillColor("#F59E0B").text(chapter.kicker, 28, 50);

        doc
          .font("Helvetica-Bold")
          .fontSize(15.5)
          .fillColor("#FFFFFF")
          .text(chapter.headline, 28, 63, { width: pageW - 56, lineGap: 1.5 });

        const subY = Math.max(88, doc.y + 4);
        doc
          .font("Helvetica")
          .fontSize(8.5)
          .fillColor("#D4D4D8")
          .text(chapter.subheadline, 28, subY, { width: pageW - 56, lineGap: 1.5 });

        // Content Two-Column Split below header: Left Visual Proof Frame, Right 4 Callout Cards
        const bodyTop = Math.max(134, doc.y + 12);
        const bodyBottomMargin = 62;
        const bodyH = pageH - bodyTop - bodyBottomMargin;

        const leftW = 456;
        const rightX = 28 + leftW + 14;
        const rightW = pageW - rightX - 28;

        // Left Visual Proof Box (100% Fit Without Distortion or Cropping)
        doc.roundedRect(28, bodyTop, leftW, bodyH, 8).fillAndStroke("#111215", "#27272A");

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

        // Right Column: 4 Numbered Explanation Cards (plus compact extras on Chapters 3, 14, 15)
        let curY = bodyTop;
        const gapY = 7;
        const hasExtraBox = chapter.page === 3 || chapter.page === 6 || chapter.page === 14 || chapter.page === 15;
        const extraH = chapter.page === 15 ? 62 : (hasExtraBox ? 54 : 0);
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
            .fontSize(8.8)
            .fillColor("#FFFFFF")
            .text(c.title, rightX + 36, curY + 9, { width: rightW - 46, lineBreak: false, ellipsis: true });

          doc
            .font("Helvetica")
            .fontSize(7.6)
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
          if (chapter.page === 3) {
            doc
              .font("Helvetica-Bold")
              .fontSize(7.4)
              .fillColor("#F59E0B")
              .text("QR FLOW: 1. Scan Standee  ->  2. Business Front Page Opens  ->  3. Tap Add Review", rightX + 10, curY + 9, {
                width: rightW - 20,
              });
            const subY = Math.max(curY + 23, doc.y + 4);
            doc
              .font("Helvetica")
              .fontSize(7.2)
              .fillColor("#D4D4D8")
              .text(
                "Shoppers inspect real photos and whole-star scores before opening the hardware camera—driving peak review completion.",
                rightX + 10,
                subY,
                { width: rightW - 20, lineGap: 1.2 }
              );
          } else if (chapter.page === 6) {
            doc
              .font("Helvetica-Bold")
              .fontSize(7.3)
              .fillColor("#F59E0B")
              .text("ZERO SIGN-UP: 1. Snap 3s Photo -> 2. Auto U/A4B6C8 -> 3. Optional 1-Time Passkey", rightX + 10, curY + 9, {
                width: rightW - 20,
              });
            const subY = Math.max(curY + 23, doc.y + 4);
            doc
              .font("Helvetica")
              .fontSize(7.2)
              .fillColor("#D4D4D8")
              .text(
                "Users never create an account, email, or password upfront—after their first review, 1 optional Face ID tap locks their handle forever.",
                rightX + 10,
                subY,
                { width: rightW - 20, lineGap: 1.2 }
              );
          } else if (chapter.page === 14) {
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
            const subY = Math.max(curY + 23, doc.y + 4);
            doc
              .font("Helvetica")
              .fontSize(7.3)
              .fillColor("#D4D4D8")
              .text(domains, rightX + 10, subY, { width: rightW - 20, lineGap: 1.2 });
          } else if (chapter.page === 15) {
            doc
              .font("Helvetica-Bold")
              .fontSize(7.3)
              .fillColor("#FFFFFF")
              .text("SAAS PRICING:  $0 Free  |  $49/mo Claimed Pro  |  $149/mo Growth & Embed", rightX + 10, curY + 10, {
                width: rightW - 20,
              });
            const subY = Math.max(curY + 25, doc.y + 5);
            doc
              .font("Helvetica")
              .fontSize(7.2)
              .fillColor("#F59E0B")
              .text(
                "~95%+ Gross Margin via Bunny.net CDN (~120 KB photos) & Cloud SQL PostgreSQL.",
                rightX + 10,
                subY,
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
