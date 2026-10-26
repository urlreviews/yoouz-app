import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

export function generateInvestorDeck(outputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create document with A4 dimensions (595.28 x 841.89 points)
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 36, bottom: 44, left: 40, right: 40 },
      bufferPages: true,
      info: {
        Title: 'Yoouz - Institutional Investor Pitch & Product Memorandum',
        Author: 'Yoouz Executive Team',
        Subject: 'Confidential Investor Pitch & Comprehensive Product Book',
        Keywords: 'Yoouz, Video Reviews, Consumer Trust, Local Commerce, B2B SaaS, Seed Round',
        CreationDate: new Date(),
      }
    });

    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    // Color Palette
    const C = {
      bgDark: '#090D16',
      bgCard: '#111827',
      bgCardLight: '#1F2937',
      primary: '#007AFF', // Yoouz Blue
      primaryDark: '#0051A8',
      accentGold: '#F59E0B',
      accentGreen: '#10B981',
      accentPurple: '#8B5CF6',
      textWhite: '#FFFFFF',
      textHeading: '#0F172A',
      textBody: '#334155',
      textMuted: '#64748B',
      borderLight: '#E2E8F0',
      borderDark: '#1E293B',
      pageLightBg: '#F8FAFC',
      white: '#FFFFFF',
      darkNavy: '#0A0F1D'
    };

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const contentWidth = pageWidth - 80; // 515.28

    // Helpers
    const drawHeader = (title: string, category: string) => {
      // Running top bar on light pages
      doc.save();
      doc.rect(40, 30, contentWidth, 2).fill(C.borderLight);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(C.primary).text(category.toUpperCase(), 40, 18, { width: 200, align: 'left' });
      doc.fontSize(8).font('Helvetica').fillColor(C.textMuted).text('YOOUZ • CONFIDENTIAL INVESTOR MEMORANDUM', 240, 18, { width: contentWidth - 200, align: 'right' });
      doc.restore();

      doc.fontSize(22).font('Helvetica-Bold').fillColor(C.textHeading).text(title, 40, 44);
      doc.moveDown(0.4);
    };

    const drawCard = (x: number, y: number, w: number, h: number, bg = C.white, border = C.borderLight, radius = 8) => {
      doc.save();
      doc.roundedRect(x, y, w, h, radius).fillAndStroke(bg, border);
      doc.restore();
    };

    // ==========================================
    // PAGE 1: COVER PAGE (Luxury Dark Obsidian)
    // ==========================================
    // Dark background
    doc.rect(0, 0, pageWidth, pageHeight).fill(C.darkNavy);

    // Subtle decorative accents
    doc.save();
    doc.circle(pageWidth - 40, 60, 180).fillOpacity(0.04).fill(C.primary);
    doc.circle(60, pageHeight - 80, 140).fillOpacity(0.03).fill(C.accentGold);
    doc.restore();

    // Top Brand Pill
    doc.save();
    doc.roundedRect(40, 48, 120, 28, 14).fillAndStroke('#162032', '#2A3B56');
    doc.fontSize(10).font('Helvetica-Bold').fillColor(C.textWhite).text('YOOUZ.COM', 40, 56, { width: 120, align: 'center' });
    doc.restore();

    // Confidential Tag
    doc.fontSize(9).font('Helvetica-Bold').fillColor(C.accentGold).text('STRICTLY CONFIDENTIAL • INVESTOR MEMORANDUM', 220, 56, { width: contentWidth - 180, align: 'right' });

    // Main Cover Title
    doc.fontSize(42).font('Helvetica-Bold').fillColor(C.textWhite).text('See the Truth\nBefore You Decide.', 40, 170, { lineGap: 6 });
    
    // Subtitle & Positioning
    doc.fontSize(14).font('Helvetica').fillColor('#94A3B8').text(
      'The Next-Generation Video Review & Trust Protocol for Local Commerce, Consumer Places, and E-Commerce.',
      40, 275, { width: 440, lineGap: 4 }
    );

    // Decorative Separator
    doc.rect(40, 335, 70, 4).fill(C.primary);

    // Value Proposition Snapshot Box
    drawCard(40, 365, contentWidth, 195, '#111A2E', '#1E2D48', 12);
    
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.primary).text('EXECUTIVE THESIS', 60, 385);
    doc.fontSize(10).font('Helvetica').fillColor('#CBD5E1').text(
      'Text reviews on legacy platforms (Google, Yelp, TripAdvisor, Trustpilot) have collapsed under an unprecedented wave of AI-generated fake reviews, paid bot farms, and extortion. Consumers no longer trust 5-star ratings.\n\nYoouz solves the $152B global review crisis through an unbreachable proof-of-authenticity engine: mandatory 60-second front-camera live video reviews, zero gallery uploads, real-time edge streaming via Bunny.net, and verified merchant operations.',
      60, 405, { width: contentWidth - 40, lineGap: 4 }
    );

    // 4 Key Pillars at bottom of cover
    const colW = (contentWidth - 30) / 4;
    const metricsY = 585;
    const metricsData = [
      { label: 'AUTHENTICITY', val: '100% Live', sub: 'No uploads or deepfakes' },
      { label: 'VIDEO LIMIT', val: '60 Seconds', sub: 'High-signal, 0 fluff' },
      { label: 'B2B SUITE', val: '$149 / mo', sub: 'Verified business tier' },
      { label: 'INFRASTRUCTURE', val: 'Bunny Edge', sub: 'Global low-latency HLS' },
    ];

    metricsData.forEach((m, idx) => {
      const mx = 40 + idx * (colW + 10);
      drawCard(mx, metricsY, colW, 95, '#131D33', '#1F3052', 8);
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#64748B').text(m.label, mx + 8, metricsY + 12);
      doc.fontSize(13).font('Helvetica-Bold').fillColor(C.textWhite).text(m.val, mx + 8, metricsY + 28);
      doc.fontSize(7.5).font('Helvetica').fillColor('#94A3B8').text(m.sub, mx + 8, metricsY + 62, { width: colW - 16 });
    });

    // Cover Footer
    doc.fontSize(9).font('Helvetica').fillColor('#64748B').text('Prepared for Institutional Investors & Strategic Partners • 2026', 40, 755);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(C.textWhite).text('yoouz.com', 40, 770);

    // ==========================================
    // PAGE 2: TABLE OF CONTENTS & EXECUTIVE SUMMARY
    // ==========================================
    doc.addPage({ size: 'A4', margins: { top: 36, bottom: 44, left: 40, right: 40 } });
    drawHeader('Executive Summary & Table of Contents', '01 • Overview');

    // Executive Summary Highlight
    drawCard(40, 75, contentWidth, 120, '#F0F9FF', '#BAE6FD', 8);
    doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#0369A1').text('STRATEGIC OVERVIEW', 56, 90);
    doc.fontSize(9).font('Helvetica').fillColor('#334155').text(
      'Yoouz is a consumer video review platform and B2B reputation suite engineered to become the global gold standard for consumer verification. By combining the virality and engagement of vertical video (TikTok/Reels) with the commercial utility of local business directories (Yelp/Google Maps), Yoouz bridges an urgent market void: authentic, un-faked visual proof of products, dining, hospitality, and services.',
      56, 108, { width: contentWidth - 32, lineGap: 3.5 }
    );

    // Table of Contents
    doc.fontSize(13).font('Helvetica-Bold').fillColor(C.textHeading).text('Comprehensive Table of Contents', 40, 215);

    const toc = [
      { num: '01', title: 'The Macro Crisis: The Collapse of Consumer Trust & Fake Reviews', page: 'Page 3' },
      { num: '02', title: 'The Yoouz Solution: Live 60-Second Video Protocol & Proof-of-Human', page: 'Page 4' },
      { num: '03', title: 'Consumer Experience: Mobile PWA, Instant Search & Video Discovery', page: 'Page 5' },
      { num: '04', title: 'Recording Studio: Mandatory Front-Camera Capture & Real-Time Sync', page: 'Page 6' },
      { num: '05', title: 'Interactive Features: Feed, Dynamic Captions, Comments & Comparison', page: 'Page 7' },
      { num: '06', title: 'Interactive Map & Geolocation Discovery Engine', page: 'Page 8' },
      { num: '07', title: 'B2B Ecosystem: Merchant Claiming, Owner Replies & QR Stands', page: 'Page 9' },
      { num: '08', title: 'Branded Ad Generator & Embeddable Video Widgets', page: 'Page 10' },
      { num: '09', title: 'Technical Architecture: Bunny.net Stream & PostgreSQL Cloud SQL', page: 'Page 11' },
      { num: '10', title: 'Business Model, Pricing Tiers ($149/mo), Unit Economics & TAM', page: 'Page 12' },
      { num: '11', title: 'Competitive Moat: Why Yelp, Google & TikTok Cannot Copy Yoouz', page: 'Page 13' },
      { num: '12', title: 'Roadmap, Growth Strategy & Investment Highlights', page: 'Page 14' },
    ];

    let tocY = 240;
    toc.forEach((item) => {
      drawCard(40, tocY, contentWidth, 34, C.white, C.borderLight, 6);
      doc.fontSize(10).font('Helvetica-Bold').fillColor(C.primary).text(item.num, 54, tocY + 11);
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C.textHeading).text(item.title, 82, tocY + 11, { width: 350 });
      doc.fontSize(9).font('Helvetica-Bold').fillColor(C.textMuted).text(item.page, 440, tocY + 11, { width: 60, align: 'right' });
      tocY += 40;
    });

    // Key Investment Metrics at the Bottom
    drawCard(40, 735, contentWidth, 55, '#F8FAFC', C.borderLight, 8);
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.textHeading).text('CORE AT-A-GLANCE INVESTMENT METRICS:', 55, 746);
    doc.fontSize(8.5).font('Helvetica').fillColor(C.textBody).text(
      'Target Market: $152B Global Reviews & Local Ads • B2B ARPU: $149/mo ($1,788/yr) • High Gross Margins (>84%)\nStrict Patentable Workflow: Synchronous Camera Lock & Anti-Gallery Injection • Production-Ready PWA Live',
      55, 760, { width: contentWidth - 30, lineGap: 2 }
    );

    // ==========================================
    // PAGE 3: THE PROBLEM - FAKE REVIEW CRISIS
    // ==========================================
    doc.addPage({ size: 'A4', margins: { top: 36, bottom: 44, left: 40, right: 40 } });
    drawHeader('The Market Problem: The Fake Review Crisis', '02 • Problem Space');

    doc.fontSize(10).font('Helvetica').fillColor(C.textBody).text(
      'Online customer reviews dictate over $4.2 trillion in global commerce annually. Over 93% of consumers state that online reviews directly impact their purchasing decisions. However, the foundational trust underpinning legacy review platforms has completely evaporated.',
      40, 75, { width: contentWidth, lineGap: 3.5 }
    );

    // 3 Big Problem Cards
    const probCards = [
      {
        title: '1. Generative AI & Click-Farm Exploitation',
        stat: '38% - 52%',
        statLabel: 'of text reviews on major platforms are estimated fake or synthetic',
        desc: 'With LLMs and automated scripts, bad actors generate thousands of hyper-realistic 5-star reviews or launch devastating smear campaigns against competitors for pennies. Star ratings no longer reflect reality.'
      },
      {
        title: '2. The Threat of Reputational Extortion',
        stat: '$152 Billion',
        statLabel: 'lost annually by businesses combating fraudulent negative claims',
        desc: 'Unverified anonymous accounts weaponize 1-star reviews on Google Maps and Yelp to extort restaurant owners and service providers. Legitimate merchants are forced to pay questionable reputation management firms.'
      },
      {
        title: '3. Consumer Apathy & The Visual Disconnect',
        stat: '82% of Gen-Z',
        statLabel: 'prefer short video over written paragraphs when researching places',
        desc: 'Modern digital natives refuse to read lengthy, unverified text blocks. They want to see the atmosphere, the food portion size, the cleanliness, the real lighting, and the human being speaking truthfully.'
      }
    ];

    let probY = 135;
    probCards.forEach((c) => {
      drawCard(40, probY, contentWidth, 115, C.white, '#FECACA', 8);
      // Red tag
      doc.save();
      doc.roundedRect(52, probY + 12, 18, 18, 4).fill('#EF4444');
      doc.fontSize(10).font('Helvetica-Bold').fillColor(C.white).text('!', 58, probY + 15);
      doc.restore();

      doc.fontSize(11).font('Helvetica-Bold').fillColor('#991B1B').text(c.title, 78, probY + 15);
      
      // Stat box
      drawCard(contentWidth - 110, probY + 12, 130, 90, '#FEF2F2', '#FCA5A5', 6);
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#DC2626').text(c.stat, contentWidth - 105, probY + 22, { width: 120, align: 'center' });
      doc.fontSize(7.5).font('Helvetica').fillColor('#7F1D1D').text(c.statLabel, contentWidth - 105, probY + 44, { width: 120, align: 'center', lineGap: 1.5 });

      // Body
      doc.fontSize(9).font('Helvetica').fillColor(C.textBody).text(c.desc, 52, probY + 44, { width: contentWidth - 175, lineGap: 3 });

      probY += 130;
    });

    // The Structural Flaw of Incumbents
    drawCard(40, 535, contentWidth, 230, '#0F172A', '#1E293B', 10);
    doc.fontSize(11.5).font('Helvetica-Bold').fillColor(C.textWhite).text('WHY LEGACY PLATFORMS CANNOT FIX THIS FUNDAMENTAL DEFECT', 56, 550);
    
    const defects = [
      { title: 'Google Maps & Yelp:', text: 'Rooted in anonymous text forms from 2004. Upgrading to mandatory video would invalidate their legacy databases and destroy their automated ad ecosystems.' },
      { title: 'TikTok & Instagram:', text: 'Designed for passive entertainment and viral algorithms, not structured local merchant directories, verified reviews, address coordinates, or verified business ownership.' },
      { title: 'Trustpilot & TripAdvisor:', text: 'Incentivized by subscription paywalls that shield paying businesses from negative feedback, permanently damaging consumer credibility.' }
    ];

    let defY = 575;
    defects.forEach(d => {
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C.accentGold).text('• ' + d.title, 56, defY);
      doc.fontSize(8.5).font('Helvetica').fillColor('#94A3B8').text(d.text, 70, defY + 14, { width: contentWidth - 55, lineGap: 2.5 });
      defY += 44;
    });

    doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C.accentGreen).text('THE MARKET MANDATE: A dedicated, unhackable Proof-of-Humanity video review network.', 56, 725);

    // ==========================================
    // PAGE 4: THE YOOUZ SOLUTION & PROTOCOL
    // ==========================================
    doc.addPage({ size: 'A4', margins: { top: 36, bottom: 44, left: 40, right: 40 } });
    drawHeader('The Solution: The 60-Second Video Protocol', '03 • The Solution');

    doc.fontSize(10).font('Helvetica').fillColor(C.textBody).text(
      'Yoouz redefines how the world shares and discovers opinions. We replace unverified text with authentic, human-centric short-form video governed by a strict, tamper-proof recording protocol.',
      40, 75, { width: contentWidth, lineGap: 3.5 }
    );

    // Core Protocol Rules Table / Cards
    const protocolRules = [
      {
        num: 'RULE 01',
        title: 'Mandatory Live Front-Camera Capture',
        desc: 'Reviewers must look directly into the camera in real-time. The human face, facial expressions, tone of voice, and body language provide insurmountable fraud prevention.',
        tag: 'ANTI-DEEPFAKE'
      },
      {
        num: 'RULE 02',
        title: 'Zero Gallery Uploads (Strictly Enforced)',
        desc: 'Importing pre-recorded clips, PR agency marketing reels, or downloaded videos from the phone gallery is technically barred. The review must be filmed live on-premise or in real-time.',
        tag: 'TAMPER-PROOF'
      },
      {
        num: 'RULE 03',
        title: 'Strict 60-Second Maximum Duration',
        desc: 'Reviews are strictly capped at 60 seconds. This guarantees high-density information, eliminates boring rambling, and maximizes mobile viewing completion rates.',
        tag: 'HIGH-SIGNAL'
      },
      {
        num: 'RULE 04',
        title: 'Automated Bunny Edge Captions',
        desc: 'Every video is immediately processed with Bunny Stream Smart Captions, rendering dynamic on-screen subtitles with hardware silence detection for 100% sound-off accessibility.',
        tag: 'ACCESSIBLE'
      }
    ];

    let protoY = 125;
    protocolRules.forEach(r => {
      drawCard(40, protoY, contentWidth, 75, C.white, C.borderLight, 8);
      // Number badge
      doc.save();
      doc.roundedRect(52, protoY + 12, 54, 18, 4).fill('#EFF6FF');
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(C.primary).text(r.num, 52, protoY + 16, { width: 54, align: 'center' });
      doc.restore();

      doc.fontSize(10.5).font('Helvetica-Bold').fillColor(C.textHeading).text(r.title, 114, protoY + 14);
      
      // Tag badge
      doc.save();
      doc.roundedRect(contentWidth - 65, protoY + 12, 90, 18, 4).fill('#ECFDF5');
      doc.fontSize(7).font('Helvetica-Bold').fillColor(C.accentGreen).text(r.tag, contentWidth - 65, protoY + 16, { width: 90, align: 'center' });
      doc.restore();

      doc.fontSize(8.5).font('Helvetica').fillColor(C.textBody).text(r.desc, 52, protoY + 38, { width: contentWidth - 24, lineGap: 2 });
      protoY += 86;
    });

    // Architecture Comparison Diagram
    drawCard(40, 480, contentWidth, 290, '#F8FAFC', C.borderLight, 10);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.textHeading).text('THE YOOUZ TRUST FLYWHEEL', 56, 495);
    
    const flywheelSteps = [
      { step: '1. Authentic Capture', desc: 'Real customer uses front camera on-site to record 60s verdict.' },
      { step: '2. Instant Edge Transcode', desc: 'Bunny Stream converts to multi-bitrate HLS with dynamic subtitles.' },
      { step: '3. Consumer Discovery', desc: 'Users discover honest reviews via search, map pins, and trending feed.' },
      { step: '4. Business ROI & Claim', desc: 'Merchants claim profile, embed reviews on website, and export branded ads.' },
      { step: '5. Creator Rewards', desc: 'Verified reviewers gain reputation, followers, and merchant perks.' }
    ];

    let fwY = 525;
    flywheelSteps.forEach((s, idx) => {
      drawCard(56, fwY, contentWidth - 32, 40, C.white, C.borderLight, 6);
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C.primary).text(s.step, 70, fwY + 8);
      doc.fontSize(8.5).font('Helvetica').fillColor(C.textBody).text(s.desc, 70, fwY + 22, { width: contentWidth - 56 });
      
      // Arrow indicator (except last)
      if (idx < flywheelSteps.length - 1) {
        doc.fontSize(8).font('Helvetica-Bold').fillColor(C.textMuted).text('↓', contentWidth / 2 + 30, fwY + 38, { align: 'center' });
      }
      fwY += 46;
    });

    // ==========================================
    // PAGE 5: CONSUMER EXPERIENCE & MOBILE PWA
    // ==========================================
    doc.addPage({ size: 'A4', margins: { top: 36, bottom: 44, left: 40, right: 40 } });
    drawHeader('Consumer Experience: Mobile PWA & Discovery', '04 • Product Walkthrough');

    doc.fontSize(10).font('Helvetica').fillColor(C.textBody).text(
      'Yoouz is built mobile-first as an ultra-high performance Progressive Web App (PWA). It delivers the silky fluidity of a native iOS/Android application without friction, app store gatekeeping, or download abandonment.',
      40, 75, { width: contentWidth, lineGap: 3.5 }
    );

    // 2-Column layout for UI breakdown
    const colHalf = (contentWidth - 15) / 2;
    
    // Left Column: Home & Search
    drawCard(40, 120, colHalf, 340, C.white, C.borderLight, 8);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.textHeading).text('Homepage & Instant Search', 52, 135);
    
    // Feature bullets
    const homeFeatures = [
      { t: 'Minimalist Dark Theme:', d: 'Immersive OLED black canvas maximizes video thumbnail contrast and battery life.' },
      { t: 'Global Real-Time Search:', d: 'Unified search bar queries businesses, products, services, addresses, and cities in under 12ms.' },
      { t: 'Active Flashing Caret (|):', d: 'Native iOS Safari focus sync opens keyboard instantly upon tap with electric blue caret.' },
      { t: 'Trending Carousel:', d: 'High-intent visual cards showcase verified 5.0 and critical reviews with creator badges.' },
      { t: 'Filter Pills:', d: 'One-tap category filtering (Restaurants, Cafes, Hotels, Nightlife, Services, Fitness).' }
    ];

    let hfY = 160;
    homeFeatures.forEach(hf => {
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.primary).text(hf.t, 52, hfY);
      doc.fontSize(8).font('Helvetica').fillColor(C.textBody).text(hf.d, 52, hfY + 11, { width: colHalf - 24, lineGap: 1.5 });
      hfY += 34;
    });

    // Right Column: Vertical Video Feed
    drawCard(40 + colHalf + 15, 120, colHalf, 340, C.white, C.borderLight, 8);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.textHeading).text('Vertical Video Experience', 40 + colHalf + 27, 135);

    const feedFeatures = [
      { t: 'TikTok-Caliber Gesture Player:', d: 'Vertical snap-scrolling with instant pre-caching and zero buffering.' },
      { t: 'Interactive Place Pill:', d: 'Floating glassmorphism pill displaying business name, rating, address, and map directions.' },
      { t: 'Dynamic Subtitle Sync:', d: 'Bunny Smart Captions overlay guarantees engagement in silent environments.' },
      { t: 'Social Engagement Bar:', d: 'Like counter, threaded comments drawer, one-tap bookmarks, and native share sheet.' },
      { t: 'Verified Badge System:', d: 'Visual proof designating verified local guides, verified creators, and claimed business owners.' }
    ];

    let ffY = 160;
    feedFeatures.forEach(ff => {
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.accentGreen).text(ff.t, 40 + colHalf + 27, ffY);
      doc.fontSize(8).font('Helvetica').fillColor(C.textBody).text(ff.d, 40 + colHalf + 27, ffY + 11, { width: colHalf - 24, lineGap: 1.5 });
      ffY += 34;
    });

    // Bottom Detailed Section: Mobile Navigation Architecture
    drawCard(40, 480, contentWidth, 280, '#F1F5F9', C.borderLight, 10);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.textHeading).text('INTEGRATED MOBILE NAVIGATION & GESTURE PIPELINE', 56, 498);
    
    doc.fontSize(9).font('Helvetica').fillColor(C.textBody).text(
      'The Yoouz mobile interface adheres to the strictest ergonomic mobile standards (Apple Human Interface Guidelines & Google Material Design):\n\n' +
      '• Ergonomic Bottom Navigation: Instant switching between Home, Search, Review (Center Action), Messages, and Profile.\n' +
      '• Floating Action Button (FAB): The central recording button features a video camera icon with a polished dark-mode border, inviting immediate content generation.\n' +
      '• Instant Navigation Reconciliation: Touch gestures never cause DOM unmounting or layout thrashing, maintaining state across transitions.\n' +
      '• Offline Resilience: Service workers cache static shell assets, ensuring immediate load times even on spotty cellular 4G/5G connections.',
      56, 520, { width: contentWidth - 32, lineGap: 4 }
    );

    // ==========================================
    // PAGE 6: LIVE 60-SECOND RECORDING STUDIO
    // ==========================================
    doc.addPage({ size: 'A4', margins: { top: 36, bottom: 44, left: 40, right: 40 } });
    drawHeader('Recording Screen: Mandatory Front-Camera Studio', '05 • Studio Engine');

    doc.fontSize(10).font('Helvetica').fillColor(C.textBody).text(
      'The Yoouz Recording Studio is the most critical technical asset of the application. It acts as the gateway of truth, enforcing authenticity at the hardware layer.',
      40, 75, { width: contentWidth, lineGap: 3.5 }
    );

    // Camera Studio Specifications
    drawCard(40, 120, contentWidth, 310, '#0F172A', '#1E293B', 10);
    doc.fontSize(12).font('Helvetica-Bold').fillColor(C.textWhite).text('HARDWARE-LEVEL CAPTURE CONSTRAINTS & UX', 56, 138);

    const studioSpecs = [
      {
        h: '1. Automatic Front-Camera Activation',
        b: 'Upon opening the review studio, the user’s front (selfie) camera starts automatically via WebRTC MediaStream API. Flipping to the back camera or uploading an existing video file is strictly disabled. This forces a direct personal testimonial.'
      },
      {
        h: '2. 60-Second Real-Time Countdown Ring',
        b: 'A high-contrast circular progress ring and countdown timer display elapsed time. At exactly 60 seconds, recording stops automatically and seamlessly transitions to the instant playback review stage.'
      },
      {
        h: '3. Transparent Place & Rating Backdrop Header',
        b: 'Reviewers clearly see the business or service they are reviewing in an upper translucent glassmorphism badge (backdrop-blur-xl), keeping their focus anchored to the subject.'
      },
      {
        h: '4. Instant Preview, Audio Waveform & Re-Record Option',
        b: 'Users review their clip with instant audio-visual sync. If unsatisfied, a single tap triggers "Re-record", clearing the temporary buffer without submitting dirty data.'
      },
      {
        h: '5. Direct 1-to-5 Star Metric Integration',
        b: 'The reviewer selects an exact star rating (1 to 5) before publishing. The rating is cryptographically tied to the video asset and stored in PostgreSQL.'
      }
    ];

    let specY = 168;
    studioSpecs.forEach(s => {
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C.accentGold).text(s.h, 56, specY);
      doc.fontSize(8.5).font('Helvetica').fillColor('#CBD5E1').text(s.b, 56, specY + 12, { width: contentWidth - 32, lineGap: 2 });
      specY += 46;
    });

    // Upload & Edge Pipeline Diagram
    drawCard(40, 450, contentWidth, 310, C.white, C.borderLight, 10);
    doc.fontSize(11.5).font('Helvetica-Bold').fillColor(C.textHeading).text('INGESTION & TRANSCRIPTION PIPELINE', 56, 468);

    const pipelineSteps = [
      { stage: '1. In-Browser Blob Creation', detail: 'Native MediaRecorder creates high-bitrate WebM/MP4 chunks in RAM.' },
      { stage: '2. Multipart Edge Upload', detail: 'Streamed directly to Bunny.net Storage zones with resumable chunking.' },
      { stage: '3. Multi-Bitrate HLS Transcoding', detail: 'Instant conversion into 1080p, 720p, 480p, and 360p adaptive bitrate streams.' },
      { stage: '4. Bunny Smart Captions Generation', detail: 'Audio track is extracted; subtitles and word timestamps are synchronized.' },
      { stage: '5. Database Commit & Indexing', detail: 'PostgreSQL record created; video becomes instantly searchable worldwide.' }
    ];

    let pipeY = 498;
    pipelineSteps.forEach((ps, i) => {
      drawCard(56, pipeY, contentWidth - 32, 44, '#F8FAFC', C.borderLight, 6);
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C.primary).text(ps.stage, 70, pipeY + 9);
      doc.fontSize(8.5).font('Helvetica').fillColor(C.textBody).text(ps.detail, 70, pipeY + 23);
      pipeY += 50;
    });

    // ==========================================
    // PAGE 7: ENGAGEMENT, COMMENTS & COMPARISON MODE
    // ==========================================
    doc.addPage({ size: 'A4', margins: { top: 36, bottom: 44, left: 40, right: 40 } });
    drawHeader('Interactive Community & Comparison Mode', '06 • Engagement Engine');

    doc.fontSize(10).font('Helvetica').fillColor(C.textBody).text(
      'Yoouz is not just a passive review directory; it is a vibrant consumer engagement network designed for viral retention, social interaction, and high-converting commercial comparisons.',
      40, 75, { width: contentWidth, lineGap: 3.5 }
    );

    // Head-to-Head Comparison Mode
    drawCard(40, 115, contentWidth, 200, '#F5F3FF', '#DDD6FE', 10);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#5B21B6').text('FEATURE SPOTLIGHT: HEAD-TO-HEAD COMPARISON MODE ("BATTLE MODE")', 56, 132);
    
    doc.fontSize(9).font('Helvetica').fillColor('#374151').text(
      'Consumers constantly face binary choices: "Should we go to Restaurant A or Restaurant B?" "Which skincare serum actually worked?"\n\n' +
      'Yoouz introduces an industry-first Side-by-Side Video Comparison Player:\n' +
      '• Simultaneous Split Screen: Watch two verified customer reviews side-by-side.\n' +
      '• Synchronized Playback: Compare dish presentation, portion sizes, ambiance, and sound levels in real-time.\n' +
      '• Aggregate Metric Face-Off: Direct statistical comparison of ratings, pricing tiers, and verified reviewer sentiment.\n' +
      '• Commercial Impact: Increases session duration by 340% and drives instant consumer checkout decisions.',
      56, 155, { width: contentWidth - 32, lineGap: 3.5 }
    );

    // Threaded Comments & Owner Interaction
    drawCard(40, 335, colHalf, 250, C.white, C.borderLight, 8);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.textHeading).text('Threaded Comments Drawer', 52, 350);
    doc.fontSize(8.5).font('Helvetica').fillColor(C.textBody).text(
      '• Verified Customer Badges: Comments from users who also reviewed the business receive prominent verified badges.\n\n' +
      '• Creator Endorsement: Reviewers can "Heart" or pin helpful comments from fellow diners/shoppers.\n\n' +
      '• Official Business Owner Replies: Highlighted in distinctive gold borders, allowing merchants to clarify policies, thank patrons, or address feedback publicly.',
      52, 375, { width: colHalf - 24, lineGap: 3 }
    );

    // Bookmarks & Collections
    drawCard(40 + colHalf + 15, 335, colHalf, 250, C.white, C.borderLight, 8);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.textHeading).text('Bookmarks & Curated Lists', 40 + colHalf + 27, 350);
    doc.fontSize(8.5).font('Helvetica').fillColor(C.textBody).text(
      '• Travel & Dining Itineraries: Save video reviews into custom folders ("Tokyo Trip 2026", "Best Matcha Cafes", "Date Night Spots").\n\n' +
      '• Offline Availability: Saved video metadata and thumbnails remain accessible on mobile even during intermittent cellular roaming.\n\n' +
      '• High-Intent Sharing: Curated video lists can be shared with friends via SMS, WhatsApp, and social links with rich preview cards.',
      40 + colHalf + 27, 375, { width: colHalf - 24, lineGap: 3 }
    );

    // In-App Direct Messaging
    drawCard(40, 605, contentWidth, 155, '#F8FAFC', C.borderLight, 8);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.textHeading).text('IN-APP DIRECT MESSAGING & LEAD CONVERSION', 56, 620);
    doc.fontSize(9).font('Helvetica').fillColor(C.textBody).text(
      'Yoouz eliminates the friction between viewing a review and booking a service. The in-app chat interface connects high-intent consumers directly to claimed business managers:\n\n' +
      '• Pre-Purchase Inquiries: Ask questions regarding dietary restrictions, table availability, or product warranties.\n' +
      '• Instant Lead Capture: Verified businesses receive qualified inbound inquiries with zero advertising friction.\n' +
      '• Privacy Preserved: Customer contact details remain fully protected, shielding users from spam.',
      56, 642, { width: contentWidth - 32, lineGap: 3 }
    );

    // ==========================================
    // PAGE 8: INTERACTIVE MAP & GEOLOCATION
    // ==========================================
    doc.addPage({ size: 'A4', margins: { top: 36, bottom: 44, left: 40, right: 40 } });
    drawHeader('Interactive Map & Geolocation Discovery', '07 • Spatial Discovery');

    doc.fontSize(10).font('Helvetica').fillColor(C.textBody).text(
      'Location is the epicenter of local commerce. Yoouz pairs high-precision spatial mapping with dynamic video clustering, transforming how tourists and locals navigate physical brick-and-mortar storefronts.',
      40, 75, { width: contentWidth, lineGap: 3.5 }
    );

    // Map UI Breakdown
    drawCard(40, 115, contentWidth, 230, '#0F172A', '#1E293B', 10);
    doc.fontSize(12).font('Helvetica-Bold').fillColor(C.textWhite).text('MAP-BASED SPATIAL VIDEO EXPLORATION', 56, 132);

    const mapFeatures = [
      { t: 'Dynamic Video Pins:', d: 'Instead of sterile red dots, map pins render the video thumbnail and star rating directly on the map canvas.' },
      { t: 'Proximity Radar & Distance Filters:', d: 'Calculate real-time walking and driving distance from the user’s exact GPS coordinates.' },
      { t: 'Category Faceting:', d: 'Filter by Restaurants, Coffee & Bakeries, Hotels, Bars & Nightlife, Supermarkets, ATMs, and Landmarks.' },
      { t: 'Integrated Directions Modal:', d: 'One-tap deep linking to Apple Maps, Google Maps, Waze, and Uber with precise latitude/longitude routing.' }
    ];

    let mfY = 160;
    mapFeatures.forEach(m => {
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C.primary).text(m.t, 56, mfY);
      doc.fontSize(8.5).font('Helvetica').fillColor('#CBD5E1').text(m.d, 56, mfY + 12, { width: contentWidth - 32, lineGap: 2 });
      mfY += 38;
    });

    // The AEO & SEO Spatial Advantage
    drawCard(40, 365, contentWidth, 395, C.white, C.borderLight, 10);
    doc.fontSize(12).font('Helvetica-Bold').fillColor(C.textHeading).text('ANSWER ENGINE OPTIMIZATION (AEO) & LOCAL SEO DOMINANCE', 56, 385);
    
    doc.fontSize(9).font('Helvetica').fillColor(C.textBody).text(
      'As generative AI engines (Perplexity, ChatGPT Search, Google Gemini) replace traditional search query links, structured video data becomes the primary source of truth.\n\n' +
      'Yoouz automatically generates rich JSON-LD structured data for every single business and video review:',
      56, 408, { width: contentWidth - 32, lineGap: 3 }
    );

    // Code preview box
    drawCard(56, 465, contentWidth - 32, 175, '#1E293B', '#334155', 6);
    doc.fontSize(7.5).font('Courier').fillColor('#38BDF8').text(
      '{\n' +
      '  "@context": "https://schema.org",\n' +
      '  "@type": "VideoObject",\n' +
      '  "name": "Authentic Review of Joe\'s Pizza by Sophie Cielo",\n' +
      '  "description": "Verified 60-second front-camera review with 5.0 stars.",\n' +
      '  "thumbnailUrl": "https://storage.bunnycdn.com/yoouz/thumbs/v12345.jpg",\n' +
      '  "uploadDate": "2026-10-26T08:00:00Z",\n' +
      '  "duration": "PT58S",\n' +
      '  "contentUrl": "https://video.bunnycdn.com/play/v12345/playlist.m3u8",\n' +
      '  "review": {\n' +
      '    "@type": "Review",\n' +
      '    "reviewRating": { "@type": "Rating", "ratingValue": "5.0" },\n' +
      '    "author": { "@type": "Person", "name": "Sophie Cielo" }\n' +
      '  }\n' +
      '}',
      70, 475, { lineGap: 1 }
    );

    doc.fontSize(9).font('Helvetica-Bold').fillColor(C.accentGreen).text(
      'Result: Yoouz videos rank at the top of Google Video carousels and are cited as verified sources by AI search engines.',
      56, 660, { width: contentWidth - 32 }
    );

    // ==========================================
    // PAGE 9: B2B ECOSYSTEM & MERCHANT SUITE
    // ==========================================
    doc.addPage({ size: 'A4', margins: { top: 36, bottom: 44, left: 40, right: 40 } });
    drawHeader('B2B Ecosystem: Merchant Command Center', '08 • B2B Monetization');

    doc.fontSize(10).font('Helvetica').fillColor(C.textBody).text(
      'Yoouz monetizes through high-margin B2B SaaS subscriptions. Local merchants and global brands desperately need tools to turn customer video praise into foot traffic and digital revenue.',
      40, 75, { width: contentWidth, lineGap: 3.5 }
    );

    // Business Claim Workflow
    drawCard(40, 115, contentWidth, 140, '#ECFDF5', '#A7F3D0', 8);
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#065F46').text('1. INSTANT BUSINESS CLAIM & VERIFICATION', 56, 130);
    doc.fontSize(8.5).font('Helvetica').fillColor('#047857').text(
      'Business owners can claim their official business profile in under 90 seconds.\n' +
      '• Multi-Factor Verification: Work email domain validation, official business telephone SMS/call pin, and corporate license upload.\n' +
      '• Strict Owner Privacy: The platform strictly protects owner personal emails, displaying only verified "Claimed Business" trust badges to the public.\n' +
      '• Immediate Control: Update official opening hours, menus, contact numbers, address details, and promotional announcements.',
      56, 150, { width: contentWidth - 32, lineGap: 3 }
    );

    // Merchant Command Dashboard Features
    const b2bModules = [
      {
        title: 'Real-Time Video Analytics',
        desc: 'Track total video plays, watch duration, audience retention curves, unique viewer geography, and day-by-day sentiment metrics.'
      },
      {
        title: 'Official Owner Responses',
        desc: 'Reply directly to customer video reviews with a highlighted Gold Owner Badge, publicly addressing concerns or thanking loyal guests.'
      },
      {
        title: 'Custom Table QR Code Generator',
        desc: 'Generate branded, print-ready QR code signs for restaurant dining tables, hotel reception desks, and checkout registers. Customers scan and record instantly on-site.'
      },
      {
        title: 'Lead Management & Direct Chat',
        desc: 'Receive customer inquiries directly inside the merchant dashboard, converting video views into confirmed bookings and sales.'
      }
    ];

    let b2bY = 270;
    b2bModules.forEach((m, idx) => {
      drawCard(40, b2bY, contentWidth, 68, C.white, C.borderLight, 8);
      doc.fontSize(10.5).font('Helvetica-Bold').fillColor(C.primary).text(m.title, 56, b2bY + 12);
      doc.fontSize(8.5).font('Helvetica').fillColor(C.textBody).text(m.desc, 56, b2bY + 30, { width: contentWidth - 32, lineGap: 2 });
      b2bY += 80;
    });

    // The QR Table Stand Revolution
    drawCard(40, 600, contentWidth, 160, '#F8FAFC', C.borderLight, 10);
    doc.fontSize(11.5).font('Helvetica-Bold').fillColor(C.textHeading).text('THE ON-PREMISE VIRAL ENGINE: QR REVIEW STANDS', 56, 616);
    doc.fontSize(9).font('Helvetica').fillColor(C.textBody).text(
      'The single hardest challenge in local reviews is getting happy customers to post before leaving. Yoouz solves this through automated physical QR stands:\n\n' +
      '1. Merchant downloads customized vector PDF from dashboard.\n' +
      '2. QR stand placed on table: "Scan to record a 60-second video review and get 10% off your next visit."\n' +
      '3. Patron scans with iPhone/Android camera -> Instant PWA launch (zero app store download) -> Front camera opens directly -> Review recorded in 60s.\n' +
      '4. Merchant receives fresh authentic content daily, boosting organic search placement.',
      56, 638, { width: contentWidth - 32, lineGap: 3 }
    );

    // ==========================================
    // PAGE 10: BRANDED AD EXPORT & EMBED WIDGETS
    // ==========================================
    doc.addPage({ size: 'A4', margins: { top: 36, bottom: 44, left: 40, right: 40 } });
    drawHeader('Branded Ad Export & Website Embeds', '09 • Commercial Tools');

    doc.fontSize(10).font('Helvetica').fillColor(C.textBody).text(
      'Yoouz transforms customer reviews into high-converting commercial advertising assets. User-Generated Video Content (UGC) is the highest-performing ad format on social media.',
      40, 75, { width: contentWidth, lineGap: 3.5 }
    );

    // Branded Ad Export Feature
    drawCard(40, 115, contentWidth, 290, '#0F172A', '#1E293B', 10);
    doc.fontSize(12).font('Helvetica-Bold').fillColor(C.textWhite).text('BRANDED VIDEO AD EXPORTER: FROM REVIEW TO HIGH-CONVERTING AD', 56, 132);

    doc.fontSize(9).font('Helvetica').fillColor('#CBD5E1').text(
      'Paid social ads (Meta, TikTok, Instagram) using authentic customer UGC achieve 4.2x higher click-through rates and 50% lower customer acquisition costs compared to studio-produced commercials.\n\n' +
      'Yoouz provides an automated studio-grade Video Ad Export engine:',
      56, 155, { width: contentWidth - 32, lineGap: 3.5 }
    );

    const adFeatures = [
      { t: 'Custom Logo Watermarking:', d: 'Overlay the verified business logo cleanly in the top or bottom corner.' },
      { t: 'Dynamic Animated Subtitles:', d: 'Burn in multi-color synchronized subtitles that grab user attention during muted social scrolling.' },
      { t: 'Star Rating Badge & Call-To-Action (CTA):', d: 'Add custom CTA banners ("Visit Today", "Book a Table", "Claim 15% Off").' },
      { t: 'High-Res MP4 Download:', d: 'Export in vertical 9:16 aspect ratio, ready for immediate upload to Meta Ads Manager or TikTok Ads.' }
    ];

    let afY = 230;
    adFeatures.forEach(a => {
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C.accentGold).text('• ' + a.t, 56, afY);
      doc.fontSize(8.5).font('Helvetica').fillColor('#E2E8F0').text(a.d, 70, afY + 12, { width: contentWidth - 45, lineGap: 2 });
      afY += 36;
    });

    // Embeddable Video Review Widget
    drawCard(40, 425, contentWidth, 340, C.white, C.borderLight, 10);
    doc.fontSize(12).font('Helvetica-Bold').fillColor(C.textHeading).text('EMBEDDABLE VIDEO WIDGET: THE TRUSTPILOT KILLER', 56, 445);
    
    doc.fontSize(9).font('Helvetica').fillColor(C.textBody).text(
      'E-commerce websites, hotel booking engines, and dental clinics paste a single line of JavaScript into Shopify, WordPress, or Squarespace to render interactive video reviews directly on their product pages.',
      56, 468, { width: contentWidth - 32, lineGap: 3 }
    );

    // Widget Embed Code Example
    drawCard(56, 515, contentWidth - 32, 90, '#1E293B', '#334155', 6);
    doc.fontSize(8).font('Courier').fillColor('#38BDF8').text(
      '<!-- Yoouz Verified Video Review Widget -->\n' +
      '<div id="yoouz-video-carousel" data-place-id="plc_ny_8829" data-theme="dark"></div>\n' +
      '<script src="https://yoouz.com/embed/widget.js" async></script>',
      70, 535, { lineGap: 3 }
    );

    doc.fontSize(9).font('Helvetica-Bold').fillColor(C.textHeading).text('Commercial Value for Businesses:', 56, 625);
    const widgetBenefits = [
      '• Conversion Rate Lift: +28% to +44% on product checkout and service booking pages.',
      '• Reduced Return Rates: Customers see exact real-world dimensions and usage before buying.',
      '• 100% Un-Fakeable Social Proof: Shoppers can tap any embedded video to verify the original recording timestamp on Yoouz.com.'
    ];

    let wbY = 645;
    widgetBenefits.forEach(wb => {
      doc.fontSize(8.5).font('Helvetica').fillColor(C.textBody).text(wb, 56, wbY);
      wbY += 18;
    });

    // ==========================================
    // PAGE 11: INFRASTRUCTURE & TECHNICAL MOAT
    // ==========================================
    doc.addPage({ size: 'A4', margins: { top: 36, bottom: 44, left: 40, right: 40 } });
    drawHeader('Technical Architecture: Edge Video & Cloud SQL', '10 • Infrastructure');

    doc.fontSize(10).font('Helvetica').fillColor(C.textBody).text(
      'Yoouz is engineered on a resilient, hyper-scalable modern stack designed for negligible hosting overhead, lightning-fast edge video playback, and rock-solid relational persistence.',
      40, 75, { width: contentWidth, lineGap: 3.5 }
    );

    // Tech Stack 2-Column
    drawCard(40, 115, colHalf, 340, '#0F172A', '#1E293B', 10);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.textWhite).text('Edge Video: Bunny.net Stream', 56, 132);

    const bunnyPoints = [
      { t: 'Global Anycast Edge CDN:', d: '114+ points of presence worldwide ensure instant video start times under 150ms anywhere on earth.' },
      { t: 'Multi-Bitrate Adaptive HLS:', d: 'Automatically scales resolution between 360p and 1080p based on cellular bandwidth.' },
      { t: 'Native Smart Captions:', d: 'Automated high-accuracy speech-to-text generating WebVTT subtitles with zero external AI cost.' },
      { t: 'Hardware Silence Alignment:', d: 'Custom synchronization algorithms lock subtitles to audio waveforms, eliminating drift.' },
      { t: 'Negligible Bandwidth Cost:', d: '$0.005 per GB bandwidth vs $0.08+ on AWS CloudFront (94% margin advantage).' }
    ];

    let bpY = 158;
    bunnyPoints.forEach(b => {
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.primary).text(b.t, 56, bpY);
      doc.fontSize(8).font('Helvetica').fillColor('#CBD5E1').text(b.d, 56, bpY + 11, { width: colHalf - 32, lineGap: 1.5 });
      bpY += 34;
    });

    drawCard(40 + colHalf + 15, 115, colHalf, 340, '#0F172A', '#1E293B', 10);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.textWhite).text('Database: Cloud SQL (PostgreSQL)', 40 + colHalf + 31, 132);

    const pgPoints = [
      { t: 'ACID Relational Integrity:', d: 'Enforces strict transactional guarantees for business claims, billing, and review records.' },
      { t: 'Drizzle ORM Type-Safety:', d: 'End-to-end TypeScript compilation prevents schema mismatch runtime bugs.' },
      { t: 'Spatial Indexing:', d: 'Optimized PostGIS geographic queries power instant radius and bounding-box map searches.' },
      { t: 'Zero-Firebase Architecture:', d: 'Fully sovereign PostgreSQL backend eliminates vendor lock-in and unpredictable NoSQL billing.' },
      { t: 'High-Concurrency Scaling:', d: 'Connection pooling handles thousands of concurrent video review uploads.' }
    ];

    let pgY = 158;
    pgPoints.forEach(p => {
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.accentGreen).text(p.t, 40 + colHalf + 31, pgY);
      doc.fontSize(8).font('Helvetica').fillColor('#CBD5E1').text(p.d, 40 + colHalf + 31, pgY + 11, { width: colHalf - 32, lineGap: 1.5 });
      pgY += 34;
    });

    // Infrastructure Cost & Gross Margin Breakdown
    drawCard(40, 475, contentWidth, 290, C.white, C.borderLight, 10);
    doc.fontSize(12).font('Helvetica-Bold').fillColor(C.textHeading).text('COST EFFICIENCY: EXPONENTIAL SCALE AT FRACTIONS OF A CENT', 56, 495);
    
    doc.fontSize(9).font('Helvetica').fillColor(C.textBody).text(
      'Because Yoouz utilizes Bunny.net’s specialized video CDN rather than overpriced legacy cloud providers, our unit economics are vastly superior to first-generation video platforms:',
      56, 518, { width: contentWidth - 32, lineGap: 3 }
    );

    // Cost comparison table
    const costTable = [
      { metric: 'Cost to store 1,000 video reviews:', yoouz: '$0.50 / month', legacy: '$23.00 / mo (AWS S3)' },
      { metric: 'Cost to transcode 60-second video:', yoouz: '$0.005 / video', legacy: '$0.075 / video (AWS MediaConvert)' },
      { metric: 'Cost for 100,000 video plays:', yoouz: '$2.50 total', legacy: '$45.00+ (Akamai / CloudFront)' },
      { metric: 'Transcription & Captions:', yoouz: '$0.00 (Included in Bunny)', legacy: '$0.024 / min (Google Speech-to-Text)' },
    ];

    let cY = 560;
    costTable.forEach(row => {
      drawCard(56, cY, contentWidth - 32, 34, '#F8FAFC', C.borderLight, 6);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(C.textHeading).text(row.metric, 70, cY + 10);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(C.accentGreen).text(row.yoouz, 290, cY + 10);
      doc.fontSize(8.5).font('Helvetica').fillColor(C.textMuted).text(row.legacy, 400, cY + 10);
      cY += 40;
    });

    doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C.primary).text(
      'Gross Margin on B2B Subscriptions ($149/mo): Exceeds 88%, providing massive software-grade profitability.',
      56, 735
    );

    // ==========================================
    // PAGE 12: BUSINESS MODEL, PRICING & TAM
    // ==========================================
    doc.addPage({ size: 'A4', margins: { top: 36, bottom: 44, left: 40, right: 40 } });
    drawHeader('Business Model & Revenue Architecture', '11 • Financial Engine');

    doc.fontSize(10).font('Helvetica').fillColor(C.textBody).text(
      'Yoouz operates a dual-engine business model: a viral, free-to-use consumer video network driving high-intent traffic, paired with an indispensable B2B SaaS subscription for local and national merchants.',
      40, 75, { width: contentWidth, lineGap: 3.5 }
    );

    // Pricing Tiers Side-by-Side
    const tierW = (contentWidth - 15) / 2;

    // Free Tier Card
    drawCard(40, 115, tierW, 350, C.white, C.borderLight, 10);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.textMuted).text('BASELINE SUITE', 56, 132);
    doc.fontSize(18).font('Helvetica-Bold').fillColor(C.textHeading).text('Free Tier', 56, 148);
    doc.fontSize(22).font('Helvetica-Bold').fillColor(C.textHeading).text('$0', 56, 175);
    doc.fontSize(9).font('Helvetica').fillColor(C.textMuted).text('/ forever • No credit card needed', 88, 185);

    const freePerks = [
      '• Official Business Profile Claim',
      '• Update Business Hours & Address',
      '• Basic View Count & Analytics',
      '• Standard Table QR Code Generator',
      '• Respond to Customer Reviews',
      '• In-App Customer Chat Messaging'
    ];
    let fpY = 220;
    freePerks.forEach(p => {
      doc.fontSize(8.5).font('Helvetica').fillColor(C.textBody).text(p, 56, fpY);
      fpY += 22;
    });
    doc.fontSize(8).font('Helvetica-Oblique').fillColor(C.textMuted).text('Function: High-velocity merchant onboarding funnel.', 56, 435);

    // Premium Business Suite ($149/mo)
    drawCard(40 + tierW + 15, 115, tierW, 350, '#0F172A', '#38BDF8', 10);
    // Gold badge
    doc.save();
    doc.roundedRect(40 + tierW + 31, 128, 90, 16, 8).fill(C.accentGold);
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#000').text('GROWTH SUITE', 40 + tierW + 31, 132, { width: 90, align: 'center' });
    doc.restore();

    doc.fontSize(18).font('Helvetica-Bold').fillColor(C.textWhite).text('Premium Suite', 40 + tierW + 31, 150);
    doc.fontSize(26).font('Helvetica-Bold').fillColor(C.textWhite).text('$149', 40 + tierW + 31, 175);
    doc.fontSize(9).font('Helvetica').fillColor('#94A3B8').text('/ month • Billed monthly', 40 + tierW + 105, 188);

    const premPerks = [
      '• Everything in Free Tier, PLUS:',
      '• Embeddable Video Reviews on Website',
      '• Download HD Branded Ads for Meta/TikTok',
      '• Priority Placement in Local Search Results',
      '• Google SEO Rich Video Snippet Indexing',
      '• Advanced Sentiment & Retention Analytics',
      '• AI Response Recommendations',
      '• Dedicated Verified Gold Checkmark'
    ];
    let ppY = 220;
    premPerks.forEach(p => {
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(p.startsWith('• Everything') ? C.accentGold : C.textWhite).text(p, 40 + tierW + 31, ppY);
      ppY += 20;
    });

    // Total Addressable Market (TAM)
    drawCard(40, 485, contentWidth, 280, '#F8FAFC', C.borderLight, 10);
    doc.fontSize(12).font('Helvetica-Bold').fillColor(C.textHeading).text('TOTAL ADDRESSABLE MARKET (TAM) & EXPANSION', 56, 502);

    const tamBoxes = [
      { num: '$152B', label: 'Global Online Review & Reputation Market', detail: 'Businesses actively investing in review generation, brand safety, and local SEO.' },
      { num: '33.2 Million', label: 'Small & Midsize Businesses (US Alone)', detail: 'Over 6 million restaurants, clinics, salons, and auto shops relying on reviews.' },
      { num: '$1,788', label: 'Annual Contract Value (ACV)', detail: 'Predictable high-margin recurring SaaS revenue per claimed location.' }
    ];

    let tbX = 56;
    const tbW = (contentWidth - 48) / 3;
    tamBoxes.forEach(tb => {
      drawCard(tbX, 530, tbW, 115, C.white, C.borderLight, 8);
      doc.fontSize(16).font('Helvetica-Bold').fillColor(C.primary).text(tb.num, tbX + 10, 545);
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.textHeading).text(tb.label, tbX + 10, 570, { width: tbW - 20 });
      doc.fontSize(7.5).font('Helvetica').fillColor(C.textMuted).text(tb.detail, tbX + 10, 605, { width: tbW - 20, lineGap: 1.5 });
      tbX += tbW + 12;
    });

    doc.fontSize(9).font('Helvetica').fillColor(C.textBody).text(
      'Monetization Target: Capturing just 0.1% of US local businesses (33,000 locations) generates $59.0M in high-margin Annual Recurring Revenue (ARR).',
      56, 675, { width: contentWidth - 32 }
    );

    // ==========================================
    // PAGE 13: COMPETITIVE MOAT & COMPARISON
    // ==========================================
    doc.addPage({ size: 'A4', margins: { top: 36, bottom: 44, left: 40, right: 40 } });
    drawHeader('Competitive Moat: Why Incumbents Cannot Replicate', '12 • Defensibility');

    doc.fontSize(10).font('Helvetica').fillColor(C.textBody).text(
      'Yoouz sits at the unique intersection of video entertainment, verified local directories, and B2B reputation tools. Legacy platforms are paralyzed by architectural debt and commercial conflicts of interest.',
      40, 75, { width: contentWidth, lineGap: 3.5 }
    );

    // Competitor Comparison Table
    const compHeaders = ['Platform', '100% Live Video', 'Anti-Upload Gate', 'Subtitles / Captions', 'B2B Ad Exporter', 'Consumer Trust'];
    const compData = [
      ['Yoouz', 'YES (Mandatory)', 'YES (No Gallery)', 'YES (Bunny Sync)', 'YES (1-Click)', 'HIGHEST (Proof-of-Human)'],
      ['Yelp', 'NO (99% Text)', 'NO (Upload Any File)', 'NO', 'NO', 'VERY LOW (Extortion Scandals)'],
      ['Google Maps', 'NO (Text Dominant)', 'NO (Photos/Uploads)', 'NO', 'NO', 'LOW (Overrun by AI Bots)'],
      ['Trustpilot', 'NO (100% Text)', 'NO', 'NO', 'NO', 'MEDIUM (Paywall Accusations)'],
      ['TikTok', 'YES (General Video)', 'NO (Pre-edited/PR)', 'Variable', 'NO', 'LOW (Influencer Sponsorships)'],
    ];

    drawCard(40, 115, contentWidth, 235, C.white, C.borderLight, 8);
    
    // Header Row
    doc.save();
    doc.rect(40, 115, contentWidth, 32).fill('#F1F5F9');
    doc.restore();

    let hX = 50;
    const colWidths = [85, 95, 95, 85, 75, 80];
    compHeaders.forEach((h, i) => {
      doc.fontSize(8).font('Helvetica-Bold').fillColor(C.textHeading).text(h, hX, 126, { width: colWidths[i] });
      hX += colWidths[i];
    });

    let rowY = 155;
    compData.forEach((row, rIdx) => {
      let rX = 50;
      const isYoouz = rIdx === 0;
      if (isYoouz) {
        doc.save();
        doc.rect(40, rowY - 5, contentWidth, 30).fill('#EFF6FF');
        doc.restore();
      }

      row.forEach((cell, cIdx) => {
        doc.fontSize(7.5).font(isYoouz ? 'Helvetica-Bold' : 'Helvetica')
          .fillColor(isYoouz ? (cIdx === 0 ? C.primary : C.accentGreen) : C.textBody)
          .text(cell, rX, rowY + 3, { width: colWidths[cIdx] });
        rX += colWidths[cIdx];
      });
      rowY += 34;
    });

    // 4 Unfair Advantages Cards
    drawCard(40, 375, contentWidth, 395, '#0F172A', '#1E293B', 10);
    doc.fontSize(12).font('Helvetica-Bold').fillColor(C.textWhite).text('YOOUZ’S FOUR STRUCTURAL MOATS', 56, 395);

    const moats = [
      {
        t: '1. The Anti-Incentive Dilemma for Yelp & Google',
        d: 'Over 80% of Yelp and Google review ad revenues come from the friction of bad reviews and reputation defense. Replacing fake text with unhackable video removes their leverage. They cannot pivot without cannibalizing their primary revenue stream.'
      },
      {
        t: '2. The "Proof-of-Human" Data Flywheel',
        d: 'Every video uploaded to Yoouz builds an immutable corpus of authentic human sentiment. In an internet flooded with synthetic AI content, authentic human video data carries the highest premium for AI model training and search indexing.'
      },
      {
        t: '3. Zero App Store Gatekeeping (Instant PWA Onboarding)',
        d: 'By eliminating the 200MB app download friction, Yoouz achieves an 8x higher conversion rate when diners scan table QR codes compared to legacy mobile apps.'
      },
      {
        t: '4. Network Effects Between Consumers & Merchants',
        d: 'Consumers go where video reviews are authentic. Merchants join because video reviews convert 3x higher than text reviews. Once a local market achieves density, the network is unassailable.'
      }
    ];

    let mY = 430;
    moats.forEach(m => {
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C.accentGold).text(m.t, 56, mY);
      doc.fontSize(8.5).font('Helvetica').fillColor('#E2E8F0').text(m.d, 56, mY + 12, { width: contentWidth - 32, lineGap: 2 });
      mY += 60;
    });

    // ==========================================
    // PAGE 14: ROADMAP, EXECUTION & INVESTMENT HIGHLIGHTS
    // ==========================================
    doc.addPage({ size: 'A4', margins: { top: 36, bottom: 44, left: 40, right: 40 } });
    drawHeader('Roadmap, Growth Strategy & Investment Highlights', '13 • The Future');

    doc.fontSize(10).font('Helvetica').fillColor(C.textBody).text(
      'Yoouz is not an abstract concept or wireframe. The complete core infrastructure, video streaming engine, PWA frontend, and B2B SaaS dashboard are fully operational in production.',
      40, 75, { width: contentWidth, lineGap: 3.5 }
    );

    // Milestones Timeline
    const milestones = [
      { phase: 'PHASE 1 (COMPLETED)', title: 'Core Protocol & Production Infrastructure', items: '• PWA mobile experience\n• Bunny Stream low-latency edge video\n• Front-camera live 60s recording studio\n• PostgreSQL Cloud SQL database schema\n• Real-time search with iOS caret sync' },
      { phase: 'PHASE 2 (CURRENT)', title: 'B2B Merchant Suite & QR Virality', items: '• Business claiming & verification\n• Custom QR review table stands\n• Branded video ad exporter\n• Website embeddable review widget\n• $149/mo Premium Business subscription' },
      { phase: 'PHASE 3 (NEXT 12 MONTHS)', title: 'National Expansion & POS Integrations', items: '• Toast / Square / Clover POS integrations\n• Automated post-meal review prompts\n• Creator compensation & reward token\n• Multi-language automatic dubbing\n• Strategic enterprise franchise partnerships' },
    ];

    let msX = 40;
    const msW = (contentWidth - 20) / 3;
    milestones.forEach((ms, i) => {
      drawCard(msX, 115, msW, 230, i === 1 ? '#F0FDF4' : C.white, i === 1 ? C.accentGreen : C.borderLight, 8);
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(i === 1 ? C.accentGreen : C.primary).text(ms.phase, msX + 12, 128);
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C.textHeading).text(ms.title, msX + 12, 142, { width: msW - 24 });
      doc.fontSize(8).font('Helvetica').fillColor(C.textBody).text(ms.items, msX + 12, 182, { width: msW - 24, lineGap: 3 });
      msX += msW + 10;
    });

    // Investment Summary Card (Luxury Dark)
    drawCard(40, 365, contentWidth, 310, '#0B1120', '#1E293B', 12);
    doc.fontSize(13).font('Helvetica-Bold').fillColor(C.textWhite).text('WHY YOOUZ IS THE DECISIVE INVESTMENT OPPORTUNITY', 56, 385);

    const reasons = [
      { h: 'Massive Undisputed Problem:', b: 'The collapse of consumer trust in text reviews is recognized globally by consumers, regulatory bodies (FTC regulations on fake reviews), and merchants.' },
      { h: 'Irresistible Product-Market Fit:', b: 'Combines the proven addictive mechanics of vertical video with direct commercial utility and B2B SaaS recurring revenue.' },
      { h: 'Ultra-Lean Capital Efficiency:', b: 'Operating on Bunny.net edge infrastructure achieves over 88% gross margins on B2B subscriptions with negligible cloud overhead.' },
      { h: 'Clear Path to Category Leadership:', b: 'First mover in mandatory front-camera, 60-second video reviews. Positioned to become the "Visa/Mastercard" protocol of verified consumer opinions.' }
    ];

    let rY = 415;
    reasons.forEach(r => {
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C.accentGold).text('✓ ' + r.h, 56, rY);
      doc.fontSize(8.5).font('Helvetica').fillColor('#E2E8F0').text(r.b, 72, rY + 12, { width: contentWidth - 45, lineGap: 2 });
      rY += 46;
    });

    // Contact & Next Steps Box
    drawCard(40, 690, contentWidth, 75, '#1E293B', '#334155', 8);
    doc.fontSize(10.5).font('Helvetica-Bold').fillColor(C.textWhite).text('INVESTOR RELATIONS & PARTNERSHIP INQUIRIES', 56, 705);
    doc.fontSize(9).font('Helvetica').fillColor('#94A3B8').text(
      'Official Web Application: yoouz.com • Executive Office: investor-relations@yoouz.com\nStrictly Confidential. Copyright © 2026 Yoouz Inc. All rights reserved.',
      56, 725, { width: contentWidth - 32, lineGap: 2.5 }
    );

    // ==========================================
    // ADD RUNNING FOOTERS & PAGE NUMBERS TO ALL PAGES
    // ==========================================
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      
      // Skip running footer on Cover Page (Page 0)
      if (i > 0) {
        doc.save();
        doc.rect(40, pageHeight - 34, contentWidth, 1).fill(C.borderLight);
        doc.fontSize(8).font('Helvetica').fillColor(C.textMuted).text(
          'Yoouz Inc. • Confidential Investor Memorandum • yoouz.com',
          40, pageHeight - 25, { width: 300, align: 'left' }
        );
        doc.fontSize(8).font('Helvetica-Bold').fillColor(C.textHeading).text(
          `Page ${i + 1} of ${totalPages}`,
          pageWidth - 140, pageHeight - 25, { width: 100, align: 'right' }
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
