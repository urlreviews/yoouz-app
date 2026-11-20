import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const BASE_URL = 'http://127.0.0.1:3000';
const OUT_DIR = path.resolve(process.cwd(), 'public', 'pitch-assets', 'v2');
const CHROMIUM_EXEC = '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell';

fs.mkdirSync(OUT_DIR, { recursive: true });

async function savePair(page, name) {
  const pngPath = path.join(OUT_DIR, `${name}.png`);
  const webpPath = path.join(OUT_DIR, `${name}.webp`);
  const buf = await page.screenshot({
    type: 'png',
    animations: 'disabled',
  });
  await sharp(buf).png({ compressionLevel: 8 }).toFile(pngPath);
  await sharp(buf).webp({ quality: 92 }).toFile(webpPath);
  console.log(`Captured ${name}.png & .webp (${Math.round(buf.length / 1024)} KB raw)`);
}

async function waitForReactApp(page, expectedText, extraMs = 1200) {
  // Wait until SSR SEO fallback article & instant shell are replaced by mounted React UI
  await page
    .waitForFunction(
      (needle) => {
        const hasFallbackArticle = Boolean(document.querySelector('#root main article'));
        const hasInstantShell = Boolean(document.getElementById('yoouz-instant-shell'));
        if (hasFallbackArticle || hasInstantShell) return false;
        const buttons = document.querySelectorAll('button');
        if (buttons.length < 2) return false;
        if (needle) {
          const text = (document.body?.innerText || '').toLowerCase();
          return text.includes(needle.toLowerCase());
        }
        return true;
      },
      expectedText || '',
      { timeout: 45000 }
    )
    .catch((e) => console.warn(`Wait timeout for "${expectedText}" on ${page.url()}: ${e.message}`));

  // Ensure visible images finish decoding
  await page.evaluate(async () => {
    const imgs = Array.from(document.querySelectorAll('img'));
    await Promise.all(
      imgs.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise((res) => {
          img.addEventListener('load', res, { once: true });
          img.addEventListener('error', res, { once: true });
          setTimeout(res, 5000);
        });
      })
    );
  });
  await page.waitForTimeout(extraMs);
}

const WOLT_SESSION = {
  businessEmail: 'team@wolt.com',
  placeId: 'wolt.com',
  placeName: 'Wolt',
  domain: 'wolt.com',
  website: 'https://wolt.com',
  logoUrl: '/uploads/brand-assets/logos/wolt.com.svg',
  verifiedAt: new Date().toISOString(),
  role: 'business_owner',
  verificationMethod: 'business_email_code',
  token: 'demo-verified-session',
};

async function run() {
  const browser = await chromium.launch({
    executablePath: CHROMIUM_EXEC,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    // ---------------------------------------------------------
    // 1. DESKTOP CONTEXT (1440 x 900)
    // ---------------------------------------------------------
    const desktopCtx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      colorScheme: 'dark',
    });
    await desktopCtx.addInitScript(() => {
      try {
        localStorage.setItem('yoouz_scratch_users_v6', 'done');
      } catch {}
    });
    const page = await desktopCtx.newPage();

    // 01: Home Discovery (New Obsidian Top-Nav Homepage)
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await waitForReactApp(page, 'Live Photo Proof', 1200);
    await savePair(page, '01-home-discovery');

    // 02: Instant Live Search Dropdown (wait for results & spinner clear)
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();
    await searchInput.click();
    await searchInput.fill('seph');
    await page.waitForTimeout(1800);
    await savePair(page, '02-search-autoscraping');
    await page.keyboard.press('Escape').catch(() => {});

    // 06: Business Profile Hub (Wolt)
    await page.goto(`${BASE_URL}/reviews/wolt.com`, { waitUntil: 'domcontentloaded' });
    await waitForReactApp(page, 'Wolt', 1800);
    await savePair(page, '06-business-profile-hub');

    // 03: Tabletop QR Standee Modal on Wolt Business Hub
    const qrClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const qr = btns.find((b) => {
        const label = `${b.getAttribute('title') || ''} ${b.getAttribute('aria-label') || ''}`.toLowerCase();
        return label.includes('qr') || Boolean(b.querySelector('svg.lucide-qr-code'));
      });
      if (qr) {
        qr.click();
        return true;
      }
      return false;
    });
    console.log('Desktop QR clicked:', qrClicked);
    await page.waitForTimeout(1200);
    await savePair(page, '03-qr-business-front');
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(500);

    // 07: Comments & Social Rail on Wolt Business Hub
    await page.goto(`${BASE_URL}/reviews/wolt.com`, { waitUntil: 'domcontentloaded' });
    await waitForReactApp(page, 'Wolt', 1500);
    const commentClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find((b) => {
        const label = `${b.getAttribute('title') || ''} ${b.getAttribute('aria-label') || ''}`.toLowerCase();
        return label.includes('comment') || Boolean(b.querySelector('svg.lucide-message-circle'));
      });
      if (target) {
        target.click();
        return true;
      }
      return false;
    });
    console.log('Desktop comment clicked:', commentClicked);
    await page.waitForTimeout(1300);
    await savePair(page, '07-comments-social-rail');

    // 05 & 06-passkey-live-app: Auto-Assigned U/XXXXXX Profile & Passkey Page
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded' });
    await waitForReactApp(page, 'U/', 1600);
    await savePair(page, '06-passkey-live-app');
    await savePair(page, '05-uhandle-profile');

    // 09: Direct Messaging (New Top-Nav Obsidian UI)
    await page.goto(`${BASE_URL}/messages`, { waitUntil: 'domcontentloaded' });
    await waitForReactApp(page, 'Messages', 1500);
    await savePair(page, '09-messages-direct-chat');

    // 13: Localized Spanish SEO Page (/es/reviews/sephora.com)
    await page.goto(`${BASE_URL}/es/reviews/sephora.com`, { waitUntil: 'domcontentloaded' });
    await waitForReactApp(page, 'Sephora', 1800);
    await savePair(page, '13-seo-localized-page');

    // 14: Claimed Businesses & Live Proof Showcase (Books And Beans)
    await page.goto(`${BASE_URL}/reviews/booksandbeans.co.uk`, { waitUntil: 'domcontentloaded' });
    await waitForReactApp(page, 'Books And Beans', 1600);
    await savePair(page, '14-claimed-businesses');

    await desktopCtx.close();

    // ---------------------------------------------------------
    // 2. DESKTOP BUSINESS DASHBOARD CONTEXT (Verified Wolt Session)
    // ---------------------------------------------------------
    const bizCtx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      colorScheme: 'dark',
    });
    await bizCtx.addInitScript((session) => {
      try {
        localStorage.setItem('yoouz_scratch_users_v6', 'done');
        localStorage.setItem('copo_business_verified_session', JSON.stringify(session));
      } catch {}
    }, WOLT_SESSION);
    const bizPage = await bizCtx.newPage();
    await bizPage.goto(`${BASE_URL}/business`, { waitUntil: 'domcontentloaded' });
    await waitForReactApp(bizPage, 'Wolt', 2200);
    await savePair(bizPage, '12-business-portal');
    await bizCtx.close();

    // ---------------------------------------------------------
    // 3. EMBED WIDGET STANDALONE (640 x 820)
    // ---------------------------------------------------------
    const embedCtx = await browser.newContext({
      viewport: { width: 640, height: 820 },
      deviceScaleFactor: 1,
      colorScheme: 'dark',
    });
    await embedCtx.addInitScript(() => {
      try {
        localStorage.setItem('yoouz_scratch_users_v6', 'done');
      } catch {}
    });
    const embedPage = await embedCtx.newPage();
    await embedPage.goto(`${BASE_URL}/?embed=wolt.com`, { waitUntil: 'domcontentloaded' });
    await waitForReactApp(embedPage, 'Wolt', 1800);
    await savePair(embedPage, '10b-embed-standalone');
    await embedCtx.close();

    // ---------------------------------------------------------
    // 4. MOBILE PWA CONTEXT (390 x 844 @ 2x DPR)
    // ---------------------------------------------------------
    const mobileCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      colorScheme: 'dark',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    });
    await mobileCtx.addInitScript(() => {
      try {
        localStorage.setItem('yoouz_scratch_users_v6', 'done');
      } catch {}
    });
    const mPage = await mobileCtx.newPage();

    // 08: Mobile PWA Home
    await mPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await waitForReactApp(mPage, 'Live Photo Proof', 1400);
    await savePair(mPage, '08-mobile-home');

    // 08b: Brand-New Apple/Google Mobile Navigation Drawer
    const menuClicked = await mPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('header button'));
      const target = btns.find((b) => {
        const rect = b.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        const lbl = `${b.getAttribute('aria-label') || ''} ${b.getAttribute('title') || ''}`.toLowerCase();
        return lbl.includes('menu') || lbl.includes('open');
      }) || btns.filter((b) => b.getBoundingClientRect().width > 0).pop();
      if (target) {
        target.click();
        return true;
      }
      return false;
    });
    console.log('Mobile drawer clicked:', menuClicked);
    await mPage.waitForTimeout(900);
    await savePair(mPage, '08b-mobile-drawer');

    // 11: Mobile Business Front (Wolt)
    await mPage.goto(`${BASE_URL}/reviews/wolt.com`, { waitUntil: 'domcontentloaded' });
    await waitForReactApp(mPage, 'Wolt', 1800);
    await savePair(mPage, '11-mobile-business-front');

    // 04: Mobile 3-Second Native Camera Flow
    const camClicked = await mPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const visibleAdd = btns.find((b) => {
        const rect = b.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        return /add review/i.test(b.innerText || '');
      });
      if (visibleAdd) {
        visibleAdd.click();
        return true;
      }
      return false;
    });
    console.log('Mobile Add Review clicked:', camClicked);
    await mPage.waitForTimeout(1200);
    await savePair(mPage, '04-mobile-camera-flow');

    // 15: Mobile PWA Full-Bleed Photo Feed (Sephora)
    await mPage.goto(`${BASE_URL}/reviews/sephora.com`, { waitUntil: 'domcontentloaded' });
    await waitForReactApp(mPage, 'Sephora', 1800);
    await savePair(mPage, '15-mobile-pwa-feed');
    await mobileCtx.close();

    // ---------------------------------------------------------
    // 5. MOBILE PWA BUSINESS DASHBOARD (Verified Wolt Session)
    // ---------------------------------------------------------
    const mBizCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      colorScheme: 'dark',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    });
    await mBizCtx.addInitScript((session) => {
      try {
        localStorage.setItem('yoouz_scratch_users_v6', 'done');
        localStorage.setItem('copo_business_verified_session', JSON.stringify(session));
      } catch {}
    }, WOLT_SESSION);
    const mBizPage = await mBizCtx.newPage();
    await mBizPage.goto(`${BASE_URL}/business`, { waitUntil: 'domcontentloaded' });
    await waitForReactApp(mBizPage, 'Wolt', 2200);
    await savePair(mBizPage, '12b-business-portal-mobile');
    await mBizCtx.close();

    // ---------------------------------------------------------
    // 6. COMPOSITE 06-passkey-settings (New App + iPhone Passkey)
    // ---------------------------------------------------------
    const leftImgPath = path.join(OUT_DIR, '06-passkey-live-app.png');
    const rightImgPath = path.join(OUT_DIR, '06-iphone-passkey-prompt.png');
    if (fs.existsSync(leftImgPath) && fs.existsSync(rightImgPath)) {
      const leftResized = await sharp(leftImgPath).resize(880, 560, { fit: 'cover' }).toBuffer();
      const rightResized = await sharp(rightImgPath).resize(460, 560, { fit: 'cover' }).toBuffer();
      const compositeBuf = await sharp({
        create: {
          width: 1440,
          height: 680,
          channels: 4,
          background: { r: 7, g: 7, b: 9, alpha: 1 },
        },
      })
        .composite([
          { input: leftResized, left: 40, top: 60 },
          { input: rightResized, left: 940, top: 60 },
        ])
        .png({ compressionLevel: 8 })
        .toBuffer();

      await sharp(compositeBuf).png({ compressionLevel: 8 }).toFile(path.join(OUT_DIR, '06-passkey-settings.png'));
      await sharp(compositeBuf).webp({ quality: 92 }).toFile(path.join(OUT_DIR, '06-passkey-settings.webp'));
      console.log('Composited 06-passkey-settings.png & .webp');
    }

    console.log('ALL 19 PITCH ASSETS CAPTURED SUCCESSFULLY.');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
