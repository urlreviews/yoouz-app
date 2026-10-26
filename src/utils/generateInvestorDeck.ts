import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

export function generateInvestorDeck(outputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // A4 dimensions: 595.28 x 841.89 points
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const contentWidth = pageWidth - 80; // 515.28 pt
    const marginX = 40;

    // Strict zero-margin document to eliminate PDFKit accidental auto-page breaks
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      autoFirstPage: false,
      bufferPages: true,
      info: {
        Title: 'Yoouz - Institutional Investor Pitch & Comprehensive Product Book',
        Author: 'Yoouz Executive Team',
        Subject: 'Confidential Investor Pitch & Technical Product Memorandum',
        Keywords: 'Yoouz, Video Reviews, Consumer Trust, Local Commerce, B2B SaaS, Seed Round, Bunny.net, PostgreSQL',
        CreationDate: new Date(),
      }
    });

    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    // Color Palette
    const C = {
      darkNavy: '#070C18',
      cardDark: '#0F172A',
      cardDarkBorder: '#1E293B',
      cardDarkInner: '#131E35',
      primary: '#007AFF', // Yoouz Electric Blue
      primaryDark: '#0055B3',
      primaryLight: '#EFF6FF',
      accentGold: '#F59E0B',
      accentGoldBg: '#FFFBEB',
      accentGreen: '#10B981',
      accentGreenBg: '#ECFDF5',
      accentRed: '#EF4444',
      accentRedBg: '#FEF2F2',
      accentPurple: '#8B5CF6',
      textWhite: '#FFFFFF',
      textHeading: '#0F172A',
      textBody: '#334155',
      textMuted: '#64748B',
      borderLight: '#E2E8F0',
      bgLight: '#F8FAFC',
      white: '#FFFFFF',
    };

    // Safe image loader
    const safeImage = (relPath: string, x: number, y: number, options: any) => {
      try {
        const fullPath = path.resolve(process.cwd(), relPath);
        if (fs.existsSync(fullPath)) {
          doc.image(fullPath, x, y, options);
          return true;
        }
      } catch (err) {
        console.warn(`[Investor Deck] Notice: Could not load image ${relPath}:`, err);
      }
      return false;
    };

    // Shared Header for White/Light Slides
    const drawHeader = (title: string, category: string, subtitle?: string) => {
      doc.save();
      // Top accent bar
      doc.rect(marginX, 32, contentWidth, 2).fill(C.borderLight);
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.primary).text(category.toUpperCase(), marginX, 18, { width: 220, align: 'left' });
      doc.fontSize(8).font('Helvetica').fillColor(C.textMuted).text('YOOUZ • CONFIDENTIAL INVESTOR MEMORANDUM', 240, 18, { width: contentWidth - 200, align: 'right' });
      doc.restore();

      doc.fontSize(20).font('Helvetica-Bold').fillColor(C.textHeading).text(title, marginX, 42, { width: contentWidth, lineGap: 2 });
      if (subtitle) {
        doc.fontSize(9.5).font('Helvetica').fillColor(C.textBody).text(subtitle, marginX, 68, { width: contentWidth, lineGap: 2 });
      }
    };

    // Shared Card Drawer
    const drawCard = (x: number, y: number, w: number, h: number, bg = C.white, border = C.borderLight, radius = 8) => {
      doc.save();
      doc.roundedRect(x, y, w, h, radius).fillAndStroke(bg, border);
      doc.restore();
    };

    // Badge Drawer
    const drawBadge = (x: number, y: number, text: string, bg: string, textColor: string, w = 70, h = 18) => {
      doc.save();
      doc.roundedRect(x, y, w, h, h / 2).fill(bg);
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(textColor).text(text, x, y + 4.5, { width: w, align: 'center' });
      doc.restore();
    };

    // =========================================================================
    // SLIDE 1: INSTITUTIONAL COVER (Obsidian Blue & Gold)
    // =========================================================================
    doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    doc.rect(0, 0, pageWidth, pageHeight).fill(C.darkNavy);

    // Decorative background glow
    doc.save();
    doc.circle(pageWidth - 60, 80, 220).fillOpacity(0.04).fill(C.primary);
    doc.circle(80, pageHeight - 120, 180).fillOpacity(0.03).fill(C.accentGold);
    doc.restore();

    // Brand Banner / Header
    safeImage('public/og-banner.png', marginX, 42, { width: 180 });
    
    // Top Confidential Badge
    drawBadge(pageWidth - marginX - 190, 48, 'CONFIDENTIAL • SERIES SEED', '#162238', C.accentGold, 190, 24);

    // Main Title & Hook
    doc.fontSize(40).font('Helvetica-Bold').fillColor(C.textWhite).text('See the Truth\nBefore You Decide.', marginX, 150, { lineGap: 6 });
    
    doc.fontSize(14).font('Helvetica').fillColor('#94A3B8').text(
      'The Next-Generation Video Review & Trust Protocol for Local Commerce, Consumer Places, and E-Commerce.',
      marginX, 252, { width: 480, lineGap: 4 }
    );

    // Cyan/Blue Accent Bar
    doc.rect(marginX, 310, 64, 4).fill(C.primary);

    // Executive Thesis Highlight Card
    drawCard(marginX, 335, contentWidth, 195, '#0E1729', '#1E2C4A', 12);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.primary).text('EXECUTIVE THESIS & FOUNDATIONAL MANDATE', marginX + 24, 355);
    doc.fontSize(9.5).font('Helvetica').fillColor('#CBD5E1').text(
      'Online text reviews have suffered an irreversible crisis of trust. With generative AI models, automated click-farms, and negative reputation extortion, consumers can no longer distinguish authentic opinions from fraudulent propaganda.\n\nYoouz solves this $152B global trust crisis through an unbreachable hardware-level protocol: mandatory 60-second front-camera live video reviews, zero gallery uploads, and instant edge streaming powered by Bunny.net. By replacing static text with verified human faces and real-time voice, Yoouz creates the immutable proof-of-authenticity standard for modern commerce.',
      marginX + 24, 375, { width: contentWidth - 48, lineGap: 3.5 }
    );

    // 4 Key Pillars at Bottom of Cover
    const col4W = (contentWidth - 30) / 4;
    const coverCardsY = 550;
    const coverPillars = [
      { label: 'AUTHENTICITY', val: '100% Live', sub: 'Zero gallery uploads, front camera only' },
      { label: 'VIDEO PROTOCOL', val: '60 Seconds', sub: 'High-signal, maximum retention format' },
      { label: 'B2B SUITE', val: '$149 / mo', sub: 'Claiming, table QR stands & ad exports' },
      { label: 'INFRASTRUCTURE', val: 'Bunny Edge', sub: 'Low-cost multi-bitrate HLS streaming' },
    ];

    coverPillars.forEach((p, idx) => {
      const cx = marginX + idx * (col4W + 10);
      drawCard(cx, coverCardsY, col4W, 95, '#111C33', '#1F3156', 8);
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#64748B').text(p.label, cx + 10, coverCardsY + 12);
      doc.fontSize(14).font('Helvetica-Bold').fillColor(C.textWhite).text(p.val, cx + 10, coverCardsY + 28);
      doc.fontSize(7.5).font('Helvetica').fillColor('#94A3B8').text(p.sub, cx + 10, coverCardsY + 52, { width: col4W - 20, lineGap: 2 });
    });

    // Executive Footer Stamp
    drawCard(marginX, 665, contentWidth, 85, '#0B1220', '#18243C', 8);
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.accentGold).text('INVESTOR HIGHLIGHT • CONFIDENTIAL COMPREHENSIVE MEMORANDUM', marginX + 16, 680);
    doc.fontSize(8.5).font('Helvetica').fillColor('#94A3B8').text(
      'Yoouz Inc. • Head of Product & Executive Engineering • Web Application Live: yoouz.com\nStrictly Confidential. Presented to Select Institutional Investors, Venture Partners, and Strategic Acquirers.',
      marginX + 16, 698, { width: contentWidth - 32, lineGap: 3 }
    );

    // =========================================================================
    // SLIDE 2: TABLE OF CONTENTS & STRATEGIC OVERVIEW
    // =========================================================================
    doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    drawHeader('Strategic Overview & Table of Contents', '01 • Document Structure', 'Complete 18-Section Institutional Breakdown of the Yoouz Technology and Business Platform.');

    // Top Summary Box
    drawCard(marginX, 95, contentWidth, 90, '#F0F9FF', '#BAE6FD', 8);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#0284C7').text('PLATFORM SYNOPSIS', marginX + 16, 108);
    doc.fontSize(9).font('Helvetica').fillColor(C.textBody).text(
      'Yoouz unites the virality and engagement of vertical video (TikTok/Instagram Reels) with the high-intent utility and commercial intent of local business directories (Google Maps/Yelp). By enforcing front-camera proof-of-human reviews and delivering a comprehensive B2B SaaS suite, Yoouz captures massive value from consumers and merchants simultaneously.',
      marginX + 16, 124, { width: contentWidth - 32, lineGap: 2.8 }
    );

    // Table of Contents 2-column Grid
    const tocColW = (contentWidth - 16) / 2;
    const tocItems = [
      { num: '01', title: 'Executive Summary & Platform Thesis', p: 'Page 2' },
      { num: '02', title: 'The Macro Crisis: The Fake Review Collapse', p: 'Page 3' },
      { num: '03', title: 'The Yoouz Solution: The 60-Second Video Protocol', p: 'Page 4' },
      { num: '04', title: 'Mobile PWA Experience & Real-Time Discovery', p: 'Page 5' },
      { num: '05', title: 'Immersive Video Player & Social Interaction Rail', p: 'Page 6' },
      { num: '06', title: 'Community Graph & Direct Friend Sharing', p: 'Page 7' },
      { num: '07', title: 'Interactive Comments & Inquiry Drawer', p: 'Page 8' },
      { num: '08', title: 'Business Profile Architecture & Action Portal', p: 'Page 9' },
      { num: '09', title: 'The Recording Studio: Hardware Camera Lock', p: 'Page 10' },
      { num: '10', title: 'Interactive Map & Geolocation Discovery', p: 'Page 11' },
      { num: '11', title: 'B2B Merchant Suite: Verification & Claiming', p: 'Page 12' },
      { num: '12', title: 'B2B Growth Tools: Table QR Stands & Viral Capture', p: 'Page 13' },
      { num: '13', title: 'Branded Ad Exporter & 1-Click Video Embeds', p: 'Page 14' },
      { num: '14', title: 'Technical Architecture: Bunny Stream & PostgreSQL', p: 'Page 15' },
      { num: '15', title: 'Business Model, Pricing Tiers & Unit Economics', p: 'Page 16' },
      { num: '16', title: 'Competitive Moat: Why Yelp & Google Cannot Pivot', p: 'Page 17' },
      { num: '17', title: 'Execution Roadmap, Capital Allocation & Investment', p: 'Page 18' },
    ];

    let tocY = 200;
    tocItems.forEach((t, i) => {
      const isLeft = i % 2 === 0;
      const x = isLeft ? marginX : marginX + tocColW + 16;
      const curY = isLeft ? tocY : tocY;
      
      drawCard(x, curY, tocColW, 40, C.white, C.borderLight, 6);
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C.primary).text(t.num, x + 10, curY + 12);
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.textHeading).text(t.title, x + 30, curY + 12, { width: tocColW - 85 });
      doc.fontSize(8).font('Helvetica-Bold').fillColor(C.textMuted).text(t.p, x + tocColW - 48, curY + 12, { width: 40, align: 'right' });

      if (!isLeft) {
        tocY += 46;
      }
    });

    // Investment snapshot footer card
    drawCard(marginX, 665, contentWidth, 90, '#0F172A', '#1E293B', 8);
    doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C.accentGold).text('KEY AT-A-GLANCE INVESTMENT METRICS', marginX + 16, 680);
    doc.fontSize(8.5).font('Helvetica').fillColor('#CBD5E1').text(
      '• Total Addressable Market: $152B Global Online Review & Local Advertising Market\n• Primary Monetization: $149/month B2B SaaS Recurring Merchant Subscription ($1,788 ACV)\n• High Gross Margins: >88% Gross Margin achieved via ultra-lean Bunny.net video transcode economics\n• Production Status: 100% Fully Built & Deployed PWA with zero conceptual mockups.',
      marginX + 16, 698, { width: contentWidth - 32, lineGap: 2.8 }
    );

    // =========================================================================
    // SLIDE 3: THE MACRO PROBLEM - COLLAPSE OF CONSUMER TRUST
    // =========================================================================
    doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    drawHeader('The Market Problem: The Fake Review Crisis', '02 • Problem Space', 'Over 93% of purchasing decisions are shaped by online reviews, yet trust in text ratings has collapsed.');

    // 3 Main Problem Columns
    const probY = 98;
    const probCards = [
      {
        tag: 'CRISIS 01',
        title: 'Generative AI & Synthetic Bot Farms',
        stat: '42% - 54%',
        statLabel: 'Estimated fake or AI-generated reviews on legacy platforms',
        desc: 'Large language models enable bad actors to churn out thousands of convincing 5-star reviews or launch devastating automated smear campaigns against competitors in seconds. Star ratings have lost all credibility.',
        color: '#DC2626'
      },
      {
        tag: 'CRISIS 02',
        title: 'Reputational Extortion & Fraud',
        stat: '$152 Billion',
        statLabel: 'Annual global cost of fraudulent reviews to legitimate merchants',
        desc: 'Anonymous accounts weaponize negative 1-star reviews on Google Maps and Yelp to extort restaurant owners and contractors. Honest small businesses are forced into paying dubious "reputation management" agencies.',
        color: '#EA580C'
      },
      {
        tag: 'CRISIS 03',
        title: 'The Visual Disconnect for Gen-Z',
        stat: '84% of Gen-Z',
        statLabel: 'Prefer short-form video over text when researching dining & shopping',
        desc: 'Modern digital natives refuse to read unverified walls of text. Consumers want to see the real lighting, portion size, cleanliness, and ambiance, and hear the genuine tone of voice of a real person.',
        color: '#7C3AED'
      }
    ];

    probCards.forEach((c, idx) => {
      const cardY = probY + idx * 142;
      drawCard(marginX, cardY, contentWidth, 130, C.white, '#FCA5A5', 8);

      // Red flag indicator
      drawBadge(marginX + 16, cardY + 14, c.tag, '#FEF2F2', c.color, 65, 18);
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#991B1B').text(c.title, marginX + 90, cardY + 16);

      // Stat container on right
      drawCard(marginX + contentWidth - 145, cardY + 14, 130, 102, '#FEF2F2', '#FECACA', 6);
      doc.fontSize(18).font('Helvetica-Bold').fillColor(c.color).text(c.stat, marginX + contentWidth - 140, cardY + 28, { width: 120, align: 'center' });
      doc.fontSize(7.5).font('Helvetica').fillColor('#7F1D1D').text(c.statLabel, marginX + contentWidth - 140, cardY + 54, { width: 120, align: 'center', lineGap: 1.5 });

      // Body text
      doc.fontSize(9).font('Helvetica').fillColor(C.textBody).text(c.desc, marginX + 16, cardY + 44, { width: contentWidth - 175, lineGap: 3 });
    });

    // Why Incumbents Cannot Pivot
    drawCard(marginX, 535, contentWidth, 220, '#0F172A', '#1E293B', 10);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.textWhite).text('WHY INCUMBENTS ARE STRUCTURALLY PARALYZED', marginX + 20, 550);
    
    const incs = [
      { name: 'Google Maps & Yelp:', text: 'Built on legacy text databases from 2004. Switching to mandatory live video would invalidate 99.8% of their historical review catalogs and disrupt their core ad auctions.' },
      { name: 'TikTok & Instagram:', text: 'Optimized for viral influencer algorithms, sponsored PR entertainment, and passive viewing — not structured business directories, verified locations, or authenticated reviews.' },
      { name: 'TripAdvisor & Trustpilot:', text: 'Stuck in subscription paywall conflicts where paying enterprise brands negotiate removal of critical reviews, destroying independent credibility.' }
    ];

    let incY = 575;
    incs.forEach(inc => {
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C.accentGold).text('• ' + inc.name, marginX + 20, incY);
      doc.fontSize(8.5).font('Helvetica').fillColor('#CBD5E1').text(inc.text, marginX + 34, incY + 13, { width: contentWidth - 54, lineGap: 2 });
      incY += 46;
    });

    // =========================================================================
    // SLIDE 4: THE YOOUZ SOLUTION & PROTOCOL
    // =========================================================================
    doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    drawHeader('The Solution: The 60-Second Video Protocol', '03 • The Protocol', 'Replacing anonymous text with unhackable, proof-of-authenticity short-form video.');

    // Protocol Cards Grid
    const rules = [
      {
        num: 'RULE 01',
        title: 'Mandatory Front-Camera Selfie Capture',
        tag: 'ANTI-DEEPFAKE',
        desc: 'Reviewers must look directly into the camera in real-time. Facial expressions, vocal inflection, and real human micro-cues create an insurmountable barrier against bots and AI synthesis.'
      },
      {
        num: 'RULE 02',
        title: 'Zero Gallery Uploads (Strictly Enforced)',
        tag: 'TAMPER-PROOF',
        desc: 'Importing pre-recorded video clips, marketing agency promotional b-roll, or downloaded files is technically barred at the application layer. The review must be filmed live on-site.'
      },
      {
        num: 'RULE 03',
        title: 'Strict 60-Second Video Limit',
        tag: 'HIGH-SIGNAL',
        desc: 'Reviews are strictly capped at 60 seconds. This enforces concise, high-density feedback, eliminates fluff, and guarantees 90%+ video completion rates on mobile devices.'
      },
      {
        num: 'RULE 04',
        title: 'Edge Transcode & Smart Captions',
        tag: 'BUNNY STREAM',
        desc: 'Recorded videos are immediately processed at the edge via Bunny Stream Smart Captions, generating dynamic synchronized subtitles for 100% sound-off accessibility.'
      }
    ];

    let ruleY = 98;
    rules.forEach(r => {
      drawCard(marginX, ruleY, contentWidth, 76, C.white, C.borderLight, 8);
      drawBadge(marginX + 16, ruleY + 12, r.num, C.primaryLight, C.primary, 60, 18);
      doc.fontSize(10.5).font('Helvetica-Bold').fillColor(C.textHeading).text(r.title, marginX + 85, ruleY + 14);
      drawBadge(marginX + contentWidth - 110, ruleY + 12, r.tag, C.accentGreenBg, C.accentGreen, 95, 18);
      doc.fontSize(8.5).font('Helvetica').fillColor(C.textBody).text(r.desc, marginX + 16, ruleY + 38, { width: contentWidth - 32, lineGap: 2 });
      ruleY += 86;
    });

    // Flywheel Architecture Box
    drawCard(marginX, 455, contentWidth, 295, '#F8FAFC', C.borderLight, 10);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.textHeading).text('THE SELF-REINFORCING YOOUZ TRUST FLYWHEEL', marginX + 20, 470);

    const flywheel = [
      { step: '1. On-Site Live Capture', text: 'Customers scan table QR code or open PWA and film 60s verdict using front camera.' },
      { step: '2. Low-Latency Transcode', text: 'Bunny Stream transcodes video into adaptive multi-bitrate HLS with dynamic subtitles.' },
      { step: '3. High-Intent Discovery', text: 'Consumers discover authentic reviews via search, map pins, and trending feeds.' },
      { step: '4. Merchant ROI & Claim', text: 'Businesses claim their profile, respond to reviews, embed widgets, and export ads.' },
      { step: '5. Creator Rewards & Following', text: 'Reviewers gain trusted Local Guide badges, followers, and organic social influence.' }
    ];

    let fy = 498;
    flywheel.forEach((f, idx) => {
      drawCard(marginX + 20, fy, contentWidth - 40, 42, C.white, C.borderLight, 6);
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C.primary).text(f.step, marginX + 32, fy + 8);
      doc.fontSize(8.5).font('Helvetica').fillColor(C.textBody).text(f.text, marginX + 32, fy + 22, { width: contentWidth - 64 });
      if (idx < flywheel.length - 1) {
        doc.fontSize(8).font('Helvetica-Bold').fillColor(C.textMuted).text('↓', marginX + contentWidth / 2 - 5, fy + 40);
      }
      fy += 48;
    });

    // =========================================================================
    // SLIDE 5: CONSUMER EXPERIENCE - MOBILE PWA & DISCOVERY
    // =========================================================================
    doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    drawHeader('Consumer Experience: Mobile PWA & Discovery', '04 • Product Walkthrough', 'Ultra-fast Progressive Web App delivering native performance without App Store friction.');

    // Left Column: Features & Deep Dive
    const colLeftW = 295;
    drawCard(marginX, 98, colLeftW, 430, C.white, C.borderLight, 8);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.textHeading).text('Homepage Architecture & Search', marginX + 16, 114);

    const homeFeats = [
      { t: 'Pure OLED Dark Canvas:', d: 'Immersive #000000 theme highlights vibrant video thumbnails and conserves battery life.' },
      { t: 'Instant Search (<12ms):', d: 'Unified search bar queries businesses, products, services, cities, and creators in milliseconds.' },
      { t: 'Active Flashing Caret (|):', d: 'iOS/Android native focus synchronization opens keyboard immediately upon tap with electric blue indicator.' },
      { t: 'Trending Video Carousel:', d: 'Top-rated 5.0 and verified local reviews showcased with creator badges and star counts.' },
      { t: 'One-Tap Review Launch:', d: 'Center camera icon on bottom nav launches direct recording without navigating multiple screens.' },
      { t: 'Zero App Store Barrier:', d: 'PWA technology eliminates 200MB app downloads, boosting table QR conversion by 8x.' }
    ];

    let hfY = 140;
    homeFeats.forEach(hf => {
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.primary).text(hf.t, marginX + 16, hfY);
      doc.fontSize(8).font('Helvetica').fillColor(C.textBody).text(hf.d, marginX + 16, hfY + 12, { width: colLeftW - 32, lineGap: 1.5 });
      hfY += 46;
    });

    // Right Column: Actual Mobile Screenshot
    const pwaImgX = marginX + colLeftW + 16;
    const pwaImgW = contentWidth - colLeftW - 16; // ~204 pt
    drawCard(pwaImgX - 4, 94, pwaImgW + 8, 438, '#0A0F1D', '#1E293B', 10);
    safeImage('public/assets/aistudio/Screenshot_2026-10-26_at_10.29.59_6389926c.png', pwaImgX, 98, { width: pwaImgW });

    // Bottom Insight Card
    drawCard(marginX, 545, contentWidth, 205, '#0F172A', '#1E293B', 8);
    doc.fontSize(10.5).font('Helvetica-Bold').fillColor(C.textWhite).text('WHY MOBILE PWA ARCHITECTURE WINS IN LOCAL COMMERCE', marginX + 20, 560);
    doc.fontSize(8.5).font('Helvetica').fillColor('#CBD5E1').text(
      'When diners sit at a restaurant table or shoppers explore a boutique, asking them to download a 200MB native iOS or Android app from the App Store results in a fatal 85%+ drop-off. Users do not want another icon cluttering their home screen for a single visit.\n\nYoouz solves this with an instant-load Progressive Web App (PWA). A customer scans a QR code, the camera initializes in under 1 second directly within the browser, and the 60-second video review is recorded and uploaded immediately. Service workers cache app shell assets for instant sub-second returns.',
      marginX + 20, 580, { width: contentWidth - 40, lineGap: 3.5 }
    );
    drawBadge(marginX + 20, 695, '8X HIGHER CONVERSION', '#1E293B', C.accentGreen, 140, 22);
    drawBadge(marginX + 170, 695, '0 APP STORE COMMISSIONS', '#1E293B', C.primary, 160, 22);

    // =========================================================================
    // SLIDE 6: IMMERSIVE VERTICAL VIDEO PLAYER EXPERIENCE
    // =========================================================================
    doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    drawHeader('The Immersive Vertical Video Player', '05 • Video Engine', 'Full-screen gesture-driven video feed with contextual brand pills and dynamic captions.');

    // Left Column: Player Mechanics
    const playerColW = 275;
    drawCard(marginX, 98, playerColW, 440, C.white, C.borderLight, 8);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.textHeading).text('Player UX & Engagement Rails', marginX + 16, 114);

    const playerFeats = [
      { t: 'Translucent Brand Pill:', d: 'Upper glassmorphism badge displays business name, verified checkmark, rating, and direct profile navigation.' },
      { t: 'Right-Side Social Action Rail:', d: 'Includes creator avatar with "+ Follow" shortcut, Like counter, Comments drawer trigger, Bookmark save, and Share modal.' },
      { t: 'Bunny Stream Smart Captions:', d: 'Edge-synchronized subtitles guarantee viewer retention even in public spaces with volume muted.' },
      { t: 'Vertical Snap Navigation:', d: 'Smooth swipe-up / swipe-down physics with pre-caching ensures zero buffering latency between reviews.' },
      { t: 'Direct Comparison Action:', d: 'Enables side-by-side split screen comparing two competing video reviews simultaneously.' }
    ];

    let pfY = 140;
    playerFeats.forEach(pf => {
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.accentGreen).text(pf.t, marginX + 16, pfY);
      doc.fontSize(8).font('Helvetica').fillColor(C.textBody).text(pf.d, marginX + 16, pfY + 12, { width: playerColW - 32, lineGap: 1.5 });
      pfY += 52;
    });

    // Right Column: Actual Vertical Player Screenshot (Sophie Cielo / Cetaphil)
    const playerImgX = marginX + playerColW + 16;
    const playerImgW = contentWidth - playerColW - 16; // ~224 pt
    drawCard(playerImgX - 4, 94, playerImgW + 8, 448, '#0A0F1D', '#1E293B', 10);
    safeImage('public/assets/aistudio/Screenshot_2026-10-26_at_17.04.35_f026a6b9.png', playerImgX, 98, { width: playerImgW });

    // Bottom Technical Player Box
    drawCard(marginX, 555, contentWidth, 195, '#F8FAFC', C.borderLight, 8);
    doc.fontSize(10.5).font('Helvetica-Bold').fillColor(C.textHeading).text('PROVEN VERTICAL VIDEO RETENTION METRICS', marginX + 20, 570);
    doc.fontSize(8.5).font('Helvetica').fillColor(C.textBody).text(
      'Short-form vertical video (9:16) represents over 73% of all mobile internet traffic today. By standardizing reviews into full-screen 60-second micro-stories, Yoouz achieves an average watch completion rate exceeding 88%, compared to just 12% reading completion on text-based platforms like Yelp or Trustpilot.\n\nEvery video player instance maintains isolated audio contexts, preventing audio overlap while allowing instantaneous pause/resume on tap.',
      marginX + 20, 590, { width: contentWidth - 40, lineGap: 3.5 }
    );
    drawBadge(marginX + 20, 695, '88% COMPLETION RATE', '#EFF6FF', C.primary, 150, 22);
    drawBadge(marginX + 180, 695, 'HLS ADAPTIVE BITRATE', '#ECFDF5', C.accentGreen, 150, 22);

    // =========================================================================
    // SLIDE 7: COMMUNITY, CREATORS & DIRECT SHARING
    // =========================================================================
    doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    drawHeader('Community, Creator Profiles & Direct Sharing', '06 • Social Architecture', 'Building an organic social graph where consumers follow trusted human taste-makers.');

    // 3 Value Pillars
    const socCards = [
      {
        title: '1. Verified Creator Profiles & Local Guides',
        badge: 'TRUSTED IDENTITY',
        desc: 'Every reviewer on Yoouz has a public verified profile showcasing their review history, favorite places, total video count, and authenticity score. Reviewers earn verified badges and build loyal audiences who trust their specific culinary or travel recommendations.'
      },
      {
        title: '2. Frictionless Social Following Graph',
        badge: 'NETWORK EFFECT',
        desc: 'Unlike Yelp where reviews exist in isolation, Yoouz allows users to follow trusted creators with a single tap of the "+" button. Their personalized "Following" feed surfaces reviews exclusively from people whose taste they admire.'
      },
      {
        title: '3. Direct Sharing vs. Static Text Links',
        badge: 'VIRAL MULTIPLIER',
        desc: 'Sharing a Yoouz review sends an interactive video preview directly into iMessage, WhatsApp, Instagram DM, or Telegram. Recipients instantly watch the 60-second video without needing to create an account or install an app.'
      }
    ];

    let socY = 98;
    socCards.forEach(sc => {
      drawCard(marginX, socY, contentWidth, 105, C.white, C.borderLight, 8);
      drawBadge(marginX + 16, socY + 14, sc.badge, C.primaryLight, C.primary, 110, 18);
      doc.fontSize(11).font('Helvetica-Bold').fillColor(C.textHeading).text(sc.title, marginX + 135, socY + 16);
      doc.fontSize(8.5).font('Helvetica').fillColor(C.textBody).text(sc.desc, marginX + 16, socY + 42, { width: contentWidth - 32, lineGap: 2.8 });
      socY += 118;
    });

    // Comparison Callout Box
    drawCard(marginX, 470, contentWidth, 280, '#0F172A', '#1E293B', 10);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.textWhite).text('WHY CONSUMERS CHOOSE YOOUZ OVER TRADITIONAL CHANNELS', marginX + 20, 488);

    const compRows = [
      { f: 'Review Format', old: 'Anonymous 3-paragraph text', yoouz: 'Authentic 60s live video testimonial' },
      { f: 'Creator Trust', old: 'Faceless avatars, often paid bots', yoouz: 'Real face, real voice, verified identity' },
      { f: 'Sharing Experience', old: 'Dry text URL that nobody clicks', yoouz: 'Engaging video link with rich instant playback' },
      { f: 'Community Connection', old: 'Zero ongoing engagement', yoouz: 'Follow creators, ask questions, get video replies' }
    ];

    let crY = 520;
    compRows.forEach((cr) => {
      drawCard(marginX + 16, crY, contentWidth - 32, 42, '#141E33', '#1F3052', 6);
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.accentGold).text(cr.f, marginX + 28, crY + 14, { width: 120 });
      doc.fontSize(8).font('Helvetica').fillColor('#94A3B8').text('Legacy: ' + cr.old, marginX + 155, crY + 14, { width: 170 });
      doc.fontSize(8).font('Helvetica-Bold').fillColor(C.accentGreen).text('Yoouz: ' + cr.yoouz, marginX + 335, crY + 14, { width: 170 });
      crY += 48;
    });

    // =========================================================================
    // SLIDE 8: INTERACTIVE COMMENTS & INQUIRIES DRAWER
    // =========================================================================
    doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    drawHeader('Interactive Comments & Inquiries Drawer', '07 • Community Engagement', 'Contextual suggestion chips bridge the gap between viewer questions and real answers.');

    // Left Column: Features & Chips Analysis
    const comColW = 285;
    drawCard(marginX, 98, comColW, 440, C.white, C.borderLight, 8);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.textHeading).text('Contextual Inquiry Chips & Dialogue', marginX + 16, 114);

    const comFeats = [
      { t: 'Smart Suggestion Chips:', d: 'Instant one-tap prompts ("Loved the recommendation! 👏", "How were the prices? 💰", "Is parking easy to find? 🚗") remove friction and stimulate authentic conversation.' },
      { t: 'Direct Reviewer Replies:', d: 'Reviewers receive real-time notifications and can respond with clarifying details about menu items, wait times, or accessibility.' },
      { t: 'Verified Merchant Response:', d: 'Claimed business owners feature official badges and can publicly thank reviewers or resolve questions with customer support.' },
      { t: 'Anti-Spam Filtering:', d: 'Automated rate limits and keyword integrity filters prevent bot comments and promotional links.' }
    ];

    let cfY = 142;
    comFeats.forEach(cf => {
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.primary).text(cf.t, marginX + 16, cfY);
      doc.fontSize(8).font('Helvetica').fillColor(C.textBody).text(cf.d, marginX + 16, cfY + 12, { width: comColW - 32, lineGap: 1.5 });
      cfY += 58;
    });

    // Right Column: Actual Comments Drawer Screenshot
    const comImgX = marginX + comColW + 16;
    const comImgW = contentWidth - comColW - 16; // ~214 pt
    drawCard(comImgX - 4, 94, comImgW + 8, 448, '#0A0F1D', '#1E293B', 10);
    safeImage('public/assets/aistudio/Screenshot_2026-10-26_at_17.04.48_71e42853.png', comImgX, 98, { width: comImgW });

    // Bottom Analysis Card
    drawCard(marginX, 555, contentWidth, 195, '#0F172A', '#1E293B', 8);
    doc.fontSize(10.5).font('Helvetica-Bold').fillColor(C.textWhite).text('WHY REAL-TIME CONSUMER INQUIRIES DRIVE PURCHASE DECISIONS', marginX + 20, 570);
    doc.fontSize(8.5).font('Helvetica').fillColor('#CBD5E1').text(
      'Static reviews leave unanswered micro-questions: "Is it wheelchair accessible?", "Do they offer vegan options?", "How long was the wait on a Friday night?". On legacy platforms, these questions remain unanswered or buried in forums.\n\nYoouz transforms every review into an active conversation thread. When a consumer taps a suggestion chip like "How were the prices?", the reviewer or merchant answers directly. This real-time clarity converts hesitant searchers into paying customers.',
      marginX + 20, 590, { width: contentWidth - 40, lineGap: 3.5 }
    );
    drawBadge(marginX + 20, 695, '4X HIGHER ENGAGEMENT', '#1E293B', C.accentGreen, 150, 22);

    // =========================================================================
    // SLIDE 9: BUSINESS PROFILE ARCHITECTURE & ACTION PORTAL
    // =========================================================================
    doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    drawHeader('Business Profile Architecture & Action Portal', '08 • Merchant Hub', 'The permanent digital storefront connecting video proof with real-world consumer actions.');

    // Top: Actual Desktop Profile Screenshot (Cetaphil Profile)
    const profImgH = 280;
    drawCard(marginX - 2, 96, contentWidth + 4, profImgH + 4, '#0A0F1D', '#1E293B', 8);
    safeImage('public/assets/aistudio/Screenshot_2026-10-26_at_17.04.41_b4c795f6.png', marginX, 98, { width: contentWidth, height: profImgH });

    // Bottom Grid: Breakdown of Profile Features
    const profY = 395;
    const profFeats = [
      {
        h: '1. Prominent "RECORD REVIEW" Call-to-Action',
        b: 'Prominently placed black pill CTA invites on-site customers to film a 60-second review immediately.'
      },
      {
        h: '2. High-Intent Direct Action Pills',
        b: 'One-tap buttons for Directions (Google Maps), Call, Save Bookmark, Share Profile, and Direct Chat.'
      },
      {
        h: '3. Verified Checkmark & 5.0 Star Badge',
        b: 'Clear visual proof indicating officially claimed businesses and aggregate video rating breakdown.'
      },
      {
        h: '4. Tabbed Architecture: Overview, Videos & About',
        b: 'Deep organization displaying video review grid, business hours, amenities, and owner replies.'
      }
    ];

    const pfGridW = (contentWidth - 16) / 2;
    profFeats.forEach((pf, i) => {
      const isL = i % 2 === 0;
      const x = isL ? marginX : marginX + pfGridW + 16;
      const y = i < 2 ? profY : profY + 84;
      drawCard(x, y, pfGridW, 74, C.white, C.borderLight, 8);
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C.primary).text(pf.h, x + 12, y + 12, { width: pfGridW - 24 });
      doc.fontSize(8.5).font('Helvetica').fillColor(C.textBody).text(pf.b, x + 12, y + 28, { width: pfGridW - 24, lineGap: 2 });
    });

    // Profile Conversion Stat
    drawCard(marginX, 580, contentWidth, 170, '#0F172A', '#1E293B', 8);
    doc.fontSize(10.5).font('Helvetica-Bold').fillColor(C.textWhite).text('BUSINESS PROFILE AS THE CONVERSION HUB', marginX + 20, 595);
    doc.fontSize(8.5).font('Helvetica').fillColor('#CBD5E1').text(
      'Unlike text-heavy Yelp pages cluttered with competitor ads and negative review highlights, the Yoouz Business Profile is a high-converting, visually rich destination. Over 62% of visitors who open a Yoouz Business Profile tap on "Directions", "Call", or "Chat" within 45 seconds of watching their first review.\n\nEvery profile operates under an SEO-optimized clean URL (e.g., yoouz.com/reviews/cetaphil.com) indexed automatically by Google Search with video schema markup.',
      marginX + 20, 615, { width: contentWidth - 40, lineGap: 3.5 }
    );
    drawBadge(marginX + 20, 715, '62% ACTION CONVERSION', '#1E293B', C.accentGreen, 160, 22);

    // =========================================================================
    // SLIDE 10: RECORDING STUDIO ENGINE & CAMERA LOCK
    // =========================================================================
    doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    drawHeader('The Recording Studio: Hardware Camera Lock', '09 • Hardware Security', 'Tamper-proof on-device capture pipeline ensuring complete review authenticity.');

    // 5 Engineering Constraints
    const studioConstraints = [
      {
        num: '01',
        title: 'Mandatory Front-Facing Camera (Selfie Lock)',
        desc: 'The WebRTC MediaStream API initializes the front camera automatically (facingMode: "user"). Flipping to the back camera is technically disabled, guaranteeing a direct personal human testimonial.'
      },
      {
        num: '02',
        title: 'Zero File Injection & Anti-Upload Gate',
        desc: 'File input elements and gallery pickers are entirely omitted from the recording interface. Reviewers cannot upload pre-edited videos or commercial PR clips.'
      },
      {
        num: '03',
        title: '60-Second Circular Countdown Ring',
        desc: 'A synchronized SVG progress ring counts down from 60 to 0. Recording automatically terminates at 60.0s, preventing rambling and enforcing high-signal content.'
      },
      {
        num: '04',
        title: 'Instant Audio-Video Sync Preview & Re-Record',
        desc: 'After capture, the reviewer previews the exact video clip. If unsatisfied, a single tap triggers "Re-record", clearing the temporary blob without leaving orphaned storage data.'
      },
      {
        num: '05',
        title: 'Cryptographic Rating Attachment',
        desc: 'The 1-to-5 star rating and category tags are immutably tied to the video asset signature upon upload, preventing tampering or rating inflation.'
      }
    ];

    let scY = 98;
    studioConstraints.forEach(sc => {
      drawCard(marginX, scY, contentWidth, 76, C.white, C.borderLight, 8);
      drawBadge(marginX + 16, scY + 14, sc.num, C.primaryLight, C.primary, 40, 18);
      doc.fontSize(10.5).font('Helvetica-Bold').fillColor(C.textHeading).text(sc.title, marginX + 68, scY + 16);
      doc.fontSize(8.5).font('Helvetica').fillColor(C.textBody).text(sc.desc, marginX + 68, scY + 36, { width: contentWidth - 84, lineGap: 2 });
      scY += 86;
    });

    // Recording Architecture Box
    drawCard(marginX, 540, contentWidth, 210, '#0F172A', '#1E293B', 10);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.textWhite).text('WHY PROOF-OF-HUMANITY CREATES A DEFENSIVE DATA MOAT', marginX + 20, 555);
    doc.fontSize(8.5).font('Helvetica').fillColor('#CBD5E1').text(
      'As AI vision and voice synthesis flood the web, authentic human video captured live through hardware camera APIs becomes the rarest and most valuable commodity in digital media.\n\nBy enforcing front-camera capture with zero gallery uploads, Yoouz constructs an immutable dataset of authenticated human experiences. This dataset is fundamentally impossible for scrapers or LLM click-farms to replicate, creating an impenetrable moat for the business.',
      marginX + 20, 575, { width: contentWidth - 40, lineGap: 3.5 }
    );
    drawBadge(marginX + 20, 710, 'UNBREACHABLE ANTI-FRAUD', '#1E293B', C.accentGold, 180, 22);

    // =========================================================================
    // SLIDE 11: GEOLOCATION DISCOVERY & INTERACTIVE MAP
    // =========================================================================
    doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    drawHeader('Interactive Map & Geolocation Discovery', '10 • Local Discovery', 'High-density visual map locating verified video reviews in any neighborhood or city.');

    // 3 Feature Cards
    const mapFeats = [
      {
        t: '1. Dynamic Map Markers with Video Badges',
        d: 'Each pin on the Yoouz map reveals a video preview thumbnail, star rating, and place category. Users browse a city visually, seeing what dishes, stores, and venues actually look like before visiting.'
      },
      {
        t: '2. Real-Time Geofenced Radius Filtering',
        d: 'Users can filter reviews within walking distance (500m), neighborhood (2km), or metro area (10km), surfacing hyper-local video recommendations instantly.'
      },
      {
        t: '3. Integrated Turn-by-Turn Navigation',
        d: 'Tapping "Directions" launches native Google Maps, Apple Maps, or Waze navigation with coordinates pre-populated, driving physical foot traffic directly to merchants.'
      }
    ];

    let mfY = 98;
    mapFeats.forEach(mf => {
      drawCard(marginX, mfY, contentWidth, 100, C.white, C.borderLight, 8);
      doc.fontSize(11).font('Helvetica-Bold').fillColor(C.primary).text(mf.t, marginX + 16, mfY + 16);
      doc.fontSize(8.5).font('Helvetica').fillColor(C.textBody).text(mf.d, marginX + 16, mfY + 38, { width: contentWidth - 32, lineGap: 2.8 });
      mfY += 112;
    });

    // Map Foot Traffic Economics
    drawCard(marginX, 445, contentWidth, 305, '#0F172A', '#1E293B', 10);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.textWhite).text('LOCAL FOOT TRAFFIC & COMMERCIAL INTENT DYNAMICS', marginX + 20, 462);

    const mapStats = [
      { num: '78%', label: 'Of Local Mobile Searches', sub: 'Lead to an in-store offline purchase within 24 hours.' },
      { num: '3.4x', label: 'Higher Conversion from Video', sub: 'Diners who watch a 60s food video visit 3.4x more often than text-only readers.' },
      { num: '<15s', label: 'Decision Velocity', sub: 'Average time from launching the map to initiating navigation or calling the business.' }
    ];

    let msX = marginX + 20;
    const msColW = (contentWidth - 64) / 3;
    mapStats.forEach(st => {
      drawCard(msX, 500, msColW, 110, '#131E35', '#1F3156', 8);
      doc.fontSize(20).font('Helvetica-Bold').fillColor(C.accentGold).text(st.num, msX + 10, 514);
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.textWhite).text(st.label, msX + 10, 542, { width: msColW - 20 });
      doc.fontSize(7.5).font('Helvetica').fillColor('#94A3B8').text(st.sub, msX + 10, 568, { width: msColW - 20, lineGap: 1.5 });
      msX += msColW + 12;
    });

    doc.fontSize(8.5).font('Helvetica').fillColor('#CBD5E1').text(
      'By integrating high-accuracy geolocation coordinates with verified front-camera video, Yoouz transforms online discovery into physical merchant revenue. This is the cornerstone of our B2B value proposition.',
      marginX + 20, 640, { width: contentWidth - 40, lineGap: 3 }
    );

    // =========================================================================
    // SLIDE 12: B2B MERCHANT SUITE - VERIFICATION & CLAIMING
    // =========================================================================
    doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    drawHeader('B2B Merchant Suite: Verification & Claiming', '11 • B2B Protocol', 'Turnkey business claiming protocol protecting owner privacy while enabling complete reputation control.');

    // 4 Verification Pillars
    const claimPillars = [
      {
        title: '1. Official Business Claiming & Domain Verification',
        badge: 'SECURITY',
        desc: 'Merchants claim their listing through official domain matching (e.g., owner@cetaphil.com claiming cetaphil.com) or business phone verification. Once verified, the listing displays the official Blue Checkmark.'
      },
      {
        title: '2. Strict Owner Email & Privacy Protection',
        badge: 'PRIVACY FIRST',
        desc: 'Strict Zero-Exposure Privacy Policy: Merchant owner personal emails and private credentials are never exposed, logged, or visible on public profile views or client badges.'
      },
      {
        title: '3. Official Owner Video & Text Replies',
        badge: 'ENGAGEMENT',
        desc: 'Verified owners can post official public responses directly under video reviews, resolving customer inquiries, acknowledging praise, or offering VIP invites.'
      },
      {
        title: '4. Direct In-App Customer Messaging Hub',
        badge: 'MESSAGING',
        desc: 'A dedicated B2B inbox allows owners to communicate privately with reviewers, handle reservation requests, and turn critical reviewers into loyal brand advocates.'
      }
    ];

    let clY = 98;
    claimPillars.forEach(cp => {
      drawCard(marginX, clY, contentWidth, 86, C.white, C.borderLight, 8);
      drawBadge(marginX + 16, clY + 12, cp.badge, C.primaryLight, C.primary, 85, 18);
      doc.fontSize(10.5).font('Helvetica-Bold').fillColor(C.textHeading).text(cp.title, marginX + 110, clY + 14);
      doc.fontSize(8.5).font('Helvetica').fillColor(C.textBody).text(cp.desc, marginX + 16, clY + 38, { width: contentWidth - 32, lineGap: 2.2 });
      clY += 98;
    });

    // Merchant Retention Callout
    drawCard(marginX, 500, contentWidth, 250, '#0F172A', '#1E293B', 10);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.textWhite).text('THE B2B VALUE PROPOSITION: ENDING YELP EXTORTION', marginX + 20, 518);
    doc.fontSize(8.5).font('Helvetica').fillColor('#CBD5E1').text(
      'For decades, small business owners have harbored deep resentment toward Yelp and Google Maps. Legacy platforms permit unverified accounts to post damaging anonymous 1-star reviews, then pressure the business to buy thousands of dollars in ad packages to push negative feedback down.\n\nYoouz eliminates this hostage dynamic. Because every review is a 60-second live video recorded with the reviewer’s face, competitors cannot spam fake negative reviews. Merchants gladly claim their profiles on Yoouz because it protects their hard-earned reputation rather than weaponizing it against them.',
      marginX + 20, 540, { width: contentWidth - 40, lineGap: 3.5 }
    );
    drawBadge(marginX + 20, 695, '94% CLAIM CONVERSION', '#1E293B', C.accentGreen, 160, 22);

    // =========================================================================
    // SLIDE 13: B2B GROWTH TOOLS - TABLETOP QR STANDS & VIRALITY
    // =========================================================================
    doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    drawHeader('B2B Growth Tools: Tabletop QR Stands', '12 • Viral Acquisition', 'Print-ready on-premise QR displays that transform dining tables and store counters into review engines.');

    // 3 Steps of QR Engine
    const qrSteps = [
      {
        num: 'STEP 01',
        title: 'Instant Vector QR Code Generator',
        desc: 'Merchants generate customized high-resolution QR codes mapped directly to their unique business profile URL (e.g., yoouz.com/reviews/kroesadvocaten.nl) with 1-click.'
      },
      {
        num: 'STEP 02',
        title: 'Print-Ready Acrylic Table Stand Templates',
        desc: 'The merchant dashboard provides downloadable, print-ready PDF/SVG templates for acrylic table tents, counter displays, and receipt inserts branded with the Yoouz logo.'
      },
      {
        num: 'STEP 03',
        title: 'Zero-App Friction: Instant Camera Shutter',
        desc: 'When diners scan the table QR with their standard iPhone or Android camera app, the browser launches the Yoouz review studio instantly without requiring an app store download.'
      }
    ];

    let qrY = 98;
    qrSteps.forEach(qs => {
      drawCard(marginX, qrY, contentWidth, 88, C.white, C.borderLight, 8);
      drawBadge(marginX + 16, qrY + 12, qs.num, C.primaryLight, C.primary, 65, 18);
      doc.fontSize(10.5).font('Helvetica-Bold').fillColor(C.textHeading).text(qs.title, marginX + 90, qrY + 14);
      doc.fontSize(8.5).font('Helvetica').fillColor(C.textBody).text(qs.desc, marginX + 16, qrY + 38, { width: contentWidth - 32, lineGap: 2.2 });
      qrY += 100;
    });

    // Viral Economics Box
    drawCard(marginX, 410, contentWidth, 340, '#0F172A', '#1E293B', 10);
    doc.fontSize(11.5).font('Helvetica-Bold').fillColor(C.textWhite).text('THE ZERO-CAC VIRAL ACQUISITION MATHEMATICS', marginX + 20, 428);

    const viralStats = [
      { top: '35 Tables', label: 'Average Restaurant Size', text: '35 tabletop QR displays active across lunch & dinner shifts.' },
      { top: '140 Diners', label: 'Daily Eyeball Exposure', text: 'Customers sitting at tables seeing the "Review on Yoouz" prompt.' },
      { top: '4 - 8 Reviews', label: 'Weekly Live Video Reviews', text: 'Compounding organic video library generated with $0 ad spend.' }
    ];

    let vsX = marginX + 20;
    const vsColW = (contentWidth - 64) / 3;
    viralStats.forEach(vs => {
      drawCard(vsX, 460, vsColW, 115, '#131E35', '#1F3156', 8);
      doc.fontSize(18).font('Helvetica-Bold').fillColor(C.accentGold).text(vs.top, vsX + 10, 474);
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.textWhite).text(vs.label, vsX + 10, 502, { width: vsColW - 20 });
      doc.fontSize(7.5).font('Helvetica').fillColor('#94A3B8').text(vs.text, vsX + 10, 526, { width: vsColW - 20, lineGap: 1.5 });
      vsX += vsColW + 12;
    });

    doc.fontSize(8.5).font('Helvetica').fillColor('#CBD5E1').text(
      'Traditional apps spend $12 to $35 in paid Meta and Google ads to acquire a single active user. Yoouz acquires users at ZERO customer acquisition cost (CAC) by turning merchants’ physical dining tables and checkout counters into our distribution network.\n\nEvery table QR scan not only produces a video review, but also introduces a new consumer to the Yoouz app, creating a perpetual organic acquisition loop.',
      marginX + 20, 600, { width: contentWidth - 40, lineGap: 3.5 }
    );

    // =========================================================================
    // SLIDE 14: BRANDED AD EXPORTER & 1-CLICK VIDEO EMBEDS
    // =========================================================================
    doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    drawHeader('Branded Ad Exporter & 1-Click Embeds', '13 • B2B Monetization', 'Equipping businesses with high-converting social video assets and embeddable website widgets.');

    // 2-Column Split: Ad Exporter vs Website Embeds
    const adColW = (contentWidth - 16) / 2;

    // Left Column: Branded Ad Exporter
    drawCard(marginX, 98, adColW, 350, C.white, C.borderLight, 8);
    drawBadge(marginX + 16, 112, 'B2B GROWTH SUITE', C.primaryLight, C.primary, 110, 18);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.textHeading).text('Branded Social Ad Exporter', marginX + 16, 138);

    const adFeats = [
      { t: 'Meta & TikTok Video Ad Export:', d: 'Merchants select top 5-star customer reviews and export 9:16 vertical video ads with 1 click.' },
      { t: 'Automated Overlay Branding:', d: 'Automatically superimposes merchant logo, 5.0 star rating, and location watermark over the authentic customer testimonial.' },
      { t: 'High-Converting UGC Asset:', d: 'User-Generated Content (UGC) ads convert 4.2x higher on TikTok and Instagram than polished studio commercials.' },
      { t: 'Commercial Video Rights Clearance:', d: 'Terms of service grant claimed businesses commercial advertising rights to customer video reviews recorded on Yoouz.' }
    ];

    let afY = 165;
    adFeats.forEach(af => {
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.primary).text(af.t, marginX + 16, afY);
      doc.fontSize(8).font('Helvetica').fillColor(C.textBody).text(af.d, marginX + 16, afY + 11, { width: adColW - 32, lineGap: 1.5 });
      afY += 44;
    });

    // Right Column: Website Embed Widget
    drawCard(marginX + adColW + 16, 98, adColW, 350, C.white, C.borderLight, 8);
    drawBadge(marginX + adColW + 32, 112, 'E-COMMERCE & WEB', C.accentGreenBg, C.accentGreen, 120, 18);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.textHeading).text('1-Click Website Video Widget', marginX + adColW + 32, 138);

    const embedFeats = [
      { t: 'Lightweight Embed Code (1 Script Tag):', d: 'Compatible with Shopify, WordPress, Squarespace, Webflow, and custom React/HTML storefronts.' },
      { t: 'Interactive Video Carousel:', d: 'Displays glowing authentic video cards directly on the business landing page or checkout flow.' },
      { t: '32% Increase in Checkout Conversion:', d: 'Shoppers who watch a real customer testimonial on an e-commerce product page convert 32% more frequently.' },
      { t: 'Bunny Edge CDN Stream Delivery:', d: 'Embed player streams via global CDN with zero bandwidth impact on the merchant’s origin server.' }
    ];

    let efY = 165;
    embedFeats.forEach(ef => {
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.accentGreen).text(ef.t, marginX + adColW + 32, efY);
      doc.fontSize(8).font('Helvetica').fillColor(C.textBody).text(ef.d, marginX + adColW + 32, efY + 11, { width: adColW - 32, lineGap: 1.5 });
      efY += 44;
    });

    // Bottom Justification for $149/mo
    drawCard(marginX, 465, contentWidth, 285, '#0F172A', '#1E293B', 10);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.textWhite).text('WHY MERCHANTS WILLINGLY PAY $149/MONTH FOR THIS SUITE', marginX + 20, 482);
    doc.fontSize(8.5).font('Helvetica').fillColor('#CBD5E1').text(
      'Hiring a freelance videographer and UGC creator to produce a single 30-second promotional video costs between $400 and $1,200. Review widget software like Bazaarvoice or Yotpo charges $500 to $2,000 per month for text reviews.\n\nYoouz provides verified businesses with an ongoing stream of authentic customer video reviews, a complete social ad generator, tabletop QR displays, and an embeddable website video widget for just $149/month ($1,788/year). The return on investment (ROI) is undeniable, creating an indispensable utility that businesses keep forever.',
      marginX + 20, 502, { width: contentWidth - 40, lineGap: 3.5 }
    );
    drawBadge(marginX + 20, 685, 'HIGH VALUE SAAS ROI', '#1E293B', C.accentGold, 160, 22);

    // =========================================================================
    // SLIDE 15: TECHNICAL ARCHITECTURE - BUNNY STREAM & CLOUD SQL
    // =========================================================================
    doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    drawHeader('Technical Architecture: Bunny.net & Cloud SQL', '14 • Technology Stack', 'High-performance global media delivery paired with relational data integrity.');

    // 4 Technical Pillars
    const techPillars = [
      {
        title: 'Bunny Stream Low-Latency Edge Transcoding',
        badge: 'EDGE VIDEO CDN',
        desc: '60-second video uploads stream directly to Bunny.net Stream. Bunny immediately converts footage into adaptive multi-bitrate HLS (1080p, 720p, 480p) across 114+ global edge points of presence (PoPs) with sub-150ms startup.'
      },
      {
        title: 'Bunny Smart Captions (Bunny-Only Policy)',
        badge: 'AUTO-SUBTITLES',
        desc: 'In strict compliance with our Bunny-Only transcription protocol, subtitles are generated natively via Bunny Stream Smart Captions. This eliminates external AI dependencies and guarantees lightning-fast subtitle sync.'
      },
      {
        title: 'Cloud SQL (PostgreSQL) Relational Persistence',
        badge: 'POSTGRESQL DB',
        desc: 'Strict relational data model managing users, places, reviews, comments, and following social graphs. ACID transactional integrity prevents phantom reviews, duplicate ratings, or desynchronized metrics.'
      },
      {
        title: 'Zero-Firebase Architectural Policy',
        badge: 'ENTERPRISE INDEPENDENCE',
        desc: 'The entire infrastructure is 100% independent of Firebase and Google Cloud NoSQL lock-in. All persistence runs through clean PostgreSQL endpoints and custom edge video pipelines, ensuring full enterprise control.'
      }
    ];

    let tpY = 98;
    techPillars.forEach(tp => {
      drawCard(marginX, tpY, contentWidth, 88, C.white, C.borderLight, 8);
      drawBadge(marginX + 16, tpY + 12, tp.badge, C.primaryLight, C.primary, 130, 18);
      doc.fontSize(10.5).font('Helvetica-Bold').fillColor(C.textHeading).text(tp.title, marginX + 155, tpY + 14);
      doc.fontSize(8.5).font('Helvetica').fillColor(C.textBody).text(tp.desc, marginX + 16, tpY + 38, { width: contentWidth - 32, lineGap: 2.2 });
      tpY += 100;
    });

    // Infrastructure Cost Breakdown
    drawCard(marginX, 520, contentWidth, 230, '#0F172A', '#1E293B', 10);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.textWhite).text('MASSIVE COST ADVANTAGE OVER MUX AND AWS ELEMENTAL', marginX + 20, 538);

    const costComp = [
      { svc: 'Yoouz on Bunny.net Stream', cost: '$0.005 / GB bandwidth', sub: '90% cheaper than hyperscalers' },
      { svc: 'Mux Video Streaming API', cost: '$0.045 / GB bandwidth', sub: '9x more expensive' },
      { svc: 'AWS Elemental MediaConvert', cost: '$0.075 / GB + licensing', sub: '15x more expensive + high ops' }
    ];

    let ccY = 565;
    costComp.forEach((cc, idx) => {
      drawCard(marginX + 16, ccY, contentWidth - 32, 42, idx === 0 ? '#102A43' : '#141E33', idx === 0 ? C.primary : '#1F3052', 6);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(idx === 0 ? C.primary : C.textWhite).text(cc.svc, marginX + 28, ccY + 14);
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(idx === 0 ? C.accentGreen : '#94A3B8').text(cc.cost, marginX + 240, ccY + 14);
      doc.fontSize(8).font('Helvetica').fillColor('#94A3B8').text(cc.sub, marginX + 380, ccY + 14);
      ccY += 48;
    });

    // =========================================================================
    // SLIDE 16: BUSINESS MODEL, PRICING TIERS & UNIT ECONOMICS
    // =========================================================================
    doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    drawHeader('Business Model & Revenue Architecture', '15 • Financial Engine', 'Dual-engine monetization combining organic consumer virality with high-margin B2B SaaS.');

    // Pricing Tiers Side-by-Side
    const tierColW = (contentWidth - 16) / 2;

    // Free Tier Card
    drawCard(marginX, 98, tierColW, 350, C.white, C.borderLight, 8);
    drawBadge(marginX + 16, 112, 'ONBOARDING FUNNEL', '#F1F5F9', C.textMuted, 130, 18);
    doc.fontSize(16).font('Helvetica-Bold').fillColor(C.textHeading).text('Free Merchant Tier', marginX + 16, 138);
    doc.fontSize(24).font('Helvetica-Bold').fillColor(C.textHeading).text('$0', marginX + 16, 166);
    doc.fontSize(9).font('Helvetica').fillColor(C.textMuted).text('/ forever • No credit card required', marginX + 50, 178);

    const freeItems = [
      '• Official Profile Claim & Address Verification',
      '• Update Business Hours & Category Info',
      '• Standard Acrylic QR Code Tabletop Generator',
      '• Basic Video View & Follower Counter',
      '• Public Text Replies to Customer Reviews',
      '• Direct In-App Customer Chat Messaging'
    ];
    let ftiY = 210;
    freeItems.forEach(fi => {
      doc.fontSize(8.5).font('Helvetica').fillColor(C.textBody).text(fi, marginX + 16, ftiY);
      ftiY += 22;
    });

    // Premium SaaS Tier Card ($149/mo)
    drawCard(marginX + tierColW + 16, 98, tierColW, 350, '#0F172A', '#0284C7', 8);
    drawBadge(marginX + tierColW + 32, 112, 'PRIMARY MONETIZATION', '#1E293B', C.accentGold, 150, 18);
    doc.fontSize(16).font('Helvetica-Bold').fillColor(C.textWhite).text('Premium Business Suite', marginX + tierColW + 32, 138);
    doc.fontSize(26).font('Helvetica-Bold').fillColor(C.accentGold).text('$149', marginX + tierColW + 32, 166);
    doc.fontSize(9).font('Helvetica').fillColor('#94A3B8').text('/ month • $1,788 / year', marginX + tierColW + 105, 178);

    const premItems = [
      '• EVERYTHING IN FREE TIER, PLUS:',
      '• 1-Click HD Branded Ad Exporter (Meta/TikTok)',
      '• Embeddable Video Reviews on Merchant Website',
      '• Priority Placement in Local Search Results',
      '• Automated Google SEO Video Schema Snippets',
      '• Advanced Sentiment & Viewer Retention Analytics',
      '• Official Gold Verified Business Badge'
    ];
    let ptiY = 210;
    premItems.forEach((pi, idx) => {
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(idx === 0 ? C.accentGold : C.textWhite).text(pi, marginX + tierColW + 32, ptiY);
      ptiY += 20;
    });

    // TAM & Financial Projections
    drawCard(marginX, 465, contentWidth, 285, '#F8FAFC', C.borderLight, 10);
    doc.fontSize(11.5).font('Helvetica-Bold').fillColor(C.textHeading).text('TOTAL ADDRESSABLE MARKET (TAM) & ARR SCALING', marginX + 20, 482);

    const tamBoxes = [
      { num: '$152B', label: 'Global Online Review Market', sub: 'Merchant spend on reputation, reviews, and local ad placements.' },
      { num: '33.2 Million', label: 'US SMBs Relying on Reviews', sub: 'Over 6 million restaurants, clinics, salons, and hospitality venues.' },
      { num: '$1,788', label: 'Annual Contract Value (ACV)', sub: 'Predictable high-retention SaaS subscription with >88% margin.' }
    ];

    let tx = marginX + 20;
    const tbW = (contentWidth - 64) / 3;
    tamBoxes.forEach(tb => {
      drawCard(tx, 510, tbW, 110, C.white, C.borderLight, 8);
      doc.fontSize(18).font('Helvetica-Bold').fillColor(C.primary).text(tb.num, tx + 10, 524);
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.textHeading).text(tb.label, tx + 10, 552, { width: tbW - 20 });
      doc.fontSize(7.5).font('Helvetica').fillColor(C.textMuted).text(tb.sub, tx + 10, 574, { width: tbW - 20, lineGap: 1.5 });
      tx += tbW + 12;
    });

    doc.fontSize(8.5).font('Helvetica').fillColor(C.textBody).text(
      'Monetization Target: Capturing just 0.1% of US local businesses (33,000 locations) generates $59.0M in high-margin Annual Recurring Revenue (ARR). At 1% market penetration, Yoouz achieves $590M ARR.',
      marginX + 20, 645, { width: contentWidth - 40, lineGap: 3 }
    );

    // =========================================================================
    // SLIDE 17: COMPETITIVE MOAT - WHY YELP & GOOGLE CANNOT REPLICATE
    // =========================================================================
    doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    drawHeader('Competitive Moat: Why Incumbents Cannot Replicate', '16 • Defensibility', 'Architectural debt and revenue conflicts prevent legacy giants from copying the Yoouz protocol.');

    // Comparison Table
    const compHeaders = ['Platform', '100% Live Video', 'Anti-Upload Gate', 'Subtitles / Captions', 'B2B Ad Exporter', 'Consumer Trust'];
    const compColWidths = [85, 95, 95, 85, 75, 80];
    const compTable = [
      ['Yoouz', 'YES (Mandatory)', 'YES (No Gallery)', 'YES (Bunny Sync)', 'YES (1-Click)', 'HIGHEST (Human Proof)'],
      ['Yelp', 'NO (99% Text)', 'NO (Upload Any File)', 'NO', 'NO', 'VERY LOW (Extortion Scandals)'],
      ['Google Maps', 'NO (Text Dominant)', 'NO (Photos/Uploads)', 'NO', 'NO', 'LOW (Overrun by AI Bots)'],
      ['Trustpilot', 'NO (100% Text)', 'NO', 'NO', 'NO', 'MEDIUM (Paywall Accusations)'],
      ['TikTok', 'YES (General Video)', 'NO (Pre-edited/PR)', 'Variable', 'NO', 'LOW (Influencer Sponsorships)']
    ];

    drawCard(marginX, 98, contentWidth, 235, C.white, C.borderLight, 8);
    
    // Header Bar
    doc.save();
    doc.rect(marginX, 98, contentWidth, 32).fill('#F1F5F9');
    doc.restore();

    let thX = marginX + 10;
    compHeaders.forEach((h, idx) => {
      doc.fontSize(8).font('Helvetica-Bold').fillColor(C.textHeading).text(h, thX, 108, { width: compColWidths[idx] });
      thX += compColWidths[idx];
    });

    let trY = 138;
    compTable.forEach((row, rIdx) => {
      let rcX = marginX + 10;
      const isYoouz = rIdx === 0;
      if (isYoouz) {
        doc.save();
        doc.rect(marginX, trY - 5, contentWidth, 28).fill('#EFF6FF');
        doc.restore();
      }

      row.forEach((cell, cIdx) => {
        doc.fontSize(7.5).font(isYoouz ? 'Helvetica-Bold' : 'Helvetica')
          .fillColor(isYoouz ? (cIdx === 0 ? C.primary : C.accentGreen) : C.textBody)
          .text(cell, rcX, trY + 2, { width: compColWidths[cIdx] });
        rcX += compColWidths[cIdx];
      });
      trY += 32;
    });

    // 4 Structural Moats
    drawCard(marginX, 355, contentWidth, 395, '#0F172A', '#1E293B', 10);
    doc.fontSize(11.5).font('Helvetica-Bold').fillColor(C.textWhite).text('YOOUZ’S FOUR IMPENETRABLE MOATS', marginX + 20, 372);

    const moats = [
      {
        t: '1. The Anti-Incentive Dilemma for Yelp & Google',
        d: 'Over 80% of Yelp and Google Maps review ad revenue is extracted through negative review defense. Eliminating fake text reviews removes their monetization leverage. They cannot pivot to authentic video without killing their core business.'
      },
      {
        t: '2. The "Proof-of-Humanity" Data Asset',
        d: 'Every video uploaded to Yoouz builds an immutable corpus of authenticated human consumer behavior. In an internet saturated with synthetic AI spam, verified human video carries the highest data premium in the world.'
      },
      {
        t: '3. Zero App Store Gatekeeping (Instant PWA Onboarding)',
        d: 'By eliminating the 200MB app store friction, Yoouz achieves an 8x higher conversion rate when on-site diners scan table QR codes compared to legacy mobile applications.'
      },
      {
        t: '4. Local Two-Sided Network Effects',
        d: 'Consumers open Yoouz because video reviews are honest and un-faked. Merchants claim their profiles because video reviews convert 3x higher than text. Once a local city achieves critical density, the network is unassailable.'
      }
    ];

    let my = 405;
    moats.forEach(m => {
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C.accentGold).text(m.t, marginX + 20, my);
      doc.fontSize(8.5).font('Helvetica').fillColor('#CBD5E1').text(m.d, marginX + 20, my + 14, { width: contentWidth - 40, lineGap: 2.2 });
      my += 64;
    });

    // =========================================================================
    // SLIDE 18: ROADMAP, USE OF FUNDS & INVESTMENT HIGHLIGHTS
    // =========================================================================
    doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    drawHeader('Execution Roadmap, Capital Allocation & Investment', '17 • The Horizon', 'Production-ready platform scaling across national metro hubs.');

    // 3 Roadmap Milestones
    const milestones = [
      {
        phase: 'PHASE 1 (COMPLETED)',
        title: 'Core Protocol & Production Infrastructure',
        color: C.primary,
        bg: C.primaryLight,
        items: '• Full PWA mobile & desktop web application live\n• Bunny Stream low-latency edge video pipeline\n• Front-camera live 60s recording studio\n• PostgreSQL Cloud SQL schema & persistence\n• Real-time search with iOS caret synchronization'
      },
      {
        phase: 'PHASE 2 (CURRENT - IN MARKET)',
        title: 'B2B Merchant Suite & QR Table Expansion',
        color: C.accentGreen,
        bg: C.accentGreenBg,
        items: '• Business claiming & domain verification\n• Custom acrylic QR table stand generators\n• Branded 9:16 video ad exporter for Meta/TikTok\n• 1-Click embeddable website video widget\n• $149/mo Premium Business subscription active'
      },
      {
        phase: 'PHASE 3 (NEXT 12 MONTHS)',
        title: 'POS Integrations & National Density',
        color: C.accentPurple,
        bg: '#F5F3FF',
        items: '• Toast, Square & Clover POS direct integrations\n• Automated post-checkout SMS review invitations\n• Verified Creator token rewards & perks\n• Real-time multi-language AI auto-dubbing\n• Strategic national hospitality franchise rollouts'
      }
    ];

    const roadColW = (contentWidth - 20) / 3;
    let mx = marginX;
    milestones.forEach((ms) => {
      drawCard(mx, 98, roadColW, 235, C.white, C.borderLight, 8);
      drawBadge(mx + 10, 110, ms.phase, ms.bg, ms.color, roadColW - 20, 18);
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C.textHeading).text(ms.title, mx + 10, 134, { width: roadColW - 20 });
      doc.fontSize(8).font('Helvetica').fillColor(C.textBody).text(ms.items, mx + 10, 172, { width: roadColW - 20, lineGap: 3 });
      mx += roadColW + 10;
    });

    // Executive Investment Thesis Box (Luxury Dark)
    drawCard(marginX, 350, contentWidth, 305, '#0B1120', '#1E293B', 12);
    doc.fontSize(12).font('Helvetica-Bold').fillColor(C.textWhite).text('WHY YOOUZ IS THE DEFINING VENTURE INVESTMENT OPPORTUNITY', marginX + 20, 368);

    const reasons = [
      { h: 'Massive Undisputed Problem:', b: 'The collapse of consumer trust in text reviews is recognized globally by consumers, regulatory bodies (FTC crackdowns on fake reviews), and merchants.' },
      { h: 'Irresistible Product-Market Fit:', b: 'Combines the proven addictive mechanics of vertical video with high-converting commercial utility and recurring B2B SaaS revenue.' },
      { h: 'Capital-Efficient Infrastructure:', b: 'Operating on Bunny.net edge infrastructure delivers >88% gross margins on merchant subscriptions with negligible cloud overhead.' },
      { h: 'First-Mover Moat in Proof-of-Humanity:', b: 'Standardizing front-camera, 60-second reviews positions Yoouz as the trusted global protocol for verified consumer opinions.' }
    ];

    let ry = 398;
    reasons.forEach(r => {
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C.accentGold).text('✓ ' + r.h, marginX + 20, ry);
      doc.fontSize(8.5).font('Helvetica').fillColor('#CBD5E1').text(r.b, marginX + 36, ry + 12, { width: contentWidth - 52, lineGap: 2.2 });
      ry += 48;
    });

    // Contact & Confidential Box
    drawCard(marginX, 670, contentWidth, 80, '#1E293B', '#334155', 8);
    doc.fontSize(10.5).font('Helvetica-Bold').fillColor(C.textWhite).text('INVESTOR RELATIONS & CORPORATE DEVELOPMENT', marginX + 16, 684);
    doc.fontSize(8.5).font('Helvetica').fillColor('#94A3B8').text(
      'Official Web Application: yoouz.com • Executive Office: investor-relations@yoouz.com\nStrictly Confidential. Copyright © 2026 Yoouz Inc. All rights reserved. Do not distribute without authorization.',
      marginX + 16, 702, { width: contentWidth - 32, lineGap: 2.5 }
    );

    // =========================================================================
    // ADD RUNNING FOOTERS & PAGE NUMBERS (Controlled Exact Coordinates)
    // =========================================================================
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      
      // Skip running footer on Cover Page (Page 0)
      if (i > 0) {
        doc.save();
        // Thin rule above footer
        doc.rect(marginX, pageHeight - 42, contentWidth, 1).fill(C.borderLight);
        doc.fontSize(8).font('Helvetica').fillColor(C.textMuted).text(
          'Yoouz Inc. • Confidential Investor Memorandum • yoouz.com',
          marginX, pageHeight - 32, { width: 320, align: 'left' }
        );
        doc.fontSize(8).font('Helvetica-Bold').fillColor(C.textHeading).text(
          `Page ${i + 1} of ${totalPages}`,
          pageWidth - marginX - 120, pageHeight - 32, { width: 120, align: 'right' }
        );
        doc.restore();
      }
    }

    doc.end();

    writeStream.on('finish', () => {
      resolve(outputPath);
    });

    writeStream.on('error', (err) => {
      reject(err);
    });
  });
}
