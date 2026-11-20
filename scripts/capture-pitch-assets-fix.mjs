import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const BASE_URL = 'http://127.0.0.1:3000';
const OUT_DIR = path.resolve(process.cwd(), 'public', 'pitch-assets', 'v2');
const CHROMIUM_EXEC = '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell';

async function savePair(page, name) {
  const pngPath = path.join(OUT_DIR, `${name}.png`);
  const webpPath = path.join(OUT_DIR, `${name}.webp`);
  const buf = await page.screenshot({ type: 'png', animations: 'disabled' });
  await sharp(buf).png({ compressionLevel: 8 }).toFile(pngPath);
  await sharp(buf).webp({ quality: 92 }).toFile(webpPath);
  console.log(`Refreshed ${name}.png & .webp (${Math.round(buf.length / 1024)} KB raw)`);
}

async function waitForReactApp(page, expectedText, extraMs = 1200) {
  await page
    .waitForFunction(
      (needle) => {
        if (document.querySelector('#root main article')) return false;
        if (document.getElementById('yoouz-instant-shell')) return false;
        if (document.querySelectorAll('button').length < 2) return false;
        if (needle) {
          return (document.body?.innerText || '').toLowerCase().includes(needle.toLowerCase());
        }
        return true;
      },
      expectedText || '',
      { timeout: 35000 }
    )
    .catch((e) => console.warn(`Wait timeout "${expectedText}" on ${page.url()}: ${e.message}`));

  await page.evaluate(async () => {
    const imgs = Array.from(document.querySelectorAll('img'));
    await Promise.all(
      imgs.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise((res) => {
          img.addEventListener('load', res, { once: true });
          img.addEventListener('error', res, { once: true });
          setTimeout(res, 4000);
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
  logoUrl: '/uploads/brand-assets/logos/wolt.com.webp',
  verifiedAt: new Date().toISOString(),
  role: 'business_owner',
  verificationMethod: 'business_email_code',
  token: 'demo-verified-session',
};

const DEMO_USER_PROFILE = {
  id: 'usr_u_a4b6c8',
  uid: 'usr_u_a4b6c8',
  username: 'U/A4B6C8',
  handle: 'U/A4B6C8',
  displayName: 'U/A4B6C8',
  name: 'U/A4B6C8',
  email: '',
  isAnonymous: true,
  isVerified: false,
  createdAt: new Date().toISOString(),
  joinedAt: new Date().toISOString(),
};

async function run() {
  const browser = await chromium.launch({
    executablePath: CHROMIUM_EXEC,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    // 1. Desktop Business Dashboard (with valid wolt.com.webp logo!)
    const bizCtx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      colorScheme: 'dark',
    });
    await bizCtx.addInitScript((session) => {
      localStorage.setItem('yoouz_scratch_users_v6', 'done');
      localStorage.setItem('copo_business_verified_session', JSON.stringify(session));
    }, WOLT_SESSION);
    const bizPage = await bizCtx.newPage();
    await bizPage.goto(`${BASE_URL}/business`, { waitUntil: 'domcontentloaded' });
    await waitForReactApp(bizPage, 'Photo Review Impressions', 1600);
    await savePair(bizPage, '12-business-portal');
    await bizCtx.close();

    // 2. Desktop User Profile (05-uhandle-profile from live reviewer + 06-passkey-live-app from /profile)
    const userCtx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      colorScheme: 'dark',
    });
    await userCtx.addInitScript((user) => {
      localStorage.setItem('yoouz_scratch_users_v6', 'done');
      localStorage.setItem('copo_user_profile', JSON.stringify(user));
      localStorage.setItem('yoouz_current_user', JSON.stringify(user));
    }, DEMO_USER_PROFILE);
    const uPage = await userCtx.newPage();

    // 06-passkey-live-app: /profile with auto-assigned U/A4B6C8 + Save Face ID button
    await uPage.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded' });
    await waitForReactApp(uPage, 'U/A4B6C8', 1800);
    await savePair(uPage, '06-passkey-live-app');

    // 05-uhandle-profile: open live reviewer U/FSQUT7 from /reviews/booksandbeans.co.uk
    await uPage.goto(`${BASE_URL}/reviews/booksandbeans.co.uk`, { waitUntil: 'domcontentloaded' });
    await waitForReactApp(uPage, 'U/FSQUT7', 1600);
    const authorClicked = await uPage.evaluate(() => {
      const els = Array.from(document.querySelectorAll('button, a, span, div'));
      const target = els.find((el) => (el.innerText || '').trim().startsWith('U/FSQUT7') && el.getBoundingClientRect().width > 0);
      if (target) {
        (target.closest('button') || target).click();
        return true;
      }
      return false;
    });
    console.log('U/FSQUT7 profile clicked:', authorClicked);
    await uPage.waitForTimeout(1600);
    await savePair(uPage, '05-uhandle-profile');
    await userCtx.close();

    // 3. Mobile PWA: Business Dashboard (valid logo), Mobile Drawer, Full-Bleed Feed
    const mCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      colorScheme: 'dark',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    });
    await mCtx.addInitScript((session) => {
      localStorage.setItem('yoouz_scratch_users_v6', 'done');
      localStorage.setItem('copo_business_verified_session', JSON.stringify(session));
    }, WOLT_SESSION);
    const mPage = await mCtx.newPage();

    // 12b: Mobile Business Dashboard
    await mPage.goto(`${BASE_URL}/business`, { waitUntil: 'domcontentloaded' });
    await waitForReactApp(mPage, 'Photo Review Impressions', 1600);
    await savePair(mPage, '12b-business-portal-mobile');

    // 08b: Mobile Navigation Drawer (tap top-right 2-line hamburger icon on /)
    await mPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await waitForReactApp(mPage, 'Live Photo Proof', 1200);
    const drawerClicked = await mPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button')).filter((b) => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && r.top < 80 && r.left > 310;
      });
      // Rightmost top header button is the 2-line menu icon
      const rightmost = btns.sort((a, b) => b.getBoundingClientRect().left - a.getBoundingClientRect().left)[0];
      if (rightmost) {
        rightmost.click();
        return true;
      }
      return false;
    });
    console.log('Mobile drawer rightmost button clicked:', drawerClicked);
    await mPage.waitForTimeout(1000);
    await savePair(mPage, '08b-mobile-drawer');

    // 15: Mobile PWA Full-Bleed Photo Review Feed (tap Featured Review card on /reviews/sephora.com)
    await mPage.goto(`${BASE_URL}/reviews/sephora.com`, { waitUntil: 'domcontentloaded' });
    await waitForReactApp(mPage, 'Featured Reviews', 1400);
    const cardClicked = await mPage.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img')).filter((img) => {
        const r = img.getBoundingClientRect();
        return r.top > 450 && r.height > 120 && r.width > 90;
      });
      if (imgs[0]) {
        (imgs[0].closest('button') || imgs[0]).click();
        return true;
      }
      return false;
    });
    console.log('Mobile Sephora photo card clicked:', cardClicked);
    await mPage.waitForTimeout(1400);
    await savePair(mPage, '15-mobile-pwa-feed');
    await mCtx.close();

    // 4. Re-composite 06-passkey-settings with fresh 06-passkey-live-app + iPhone Passkey
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
      console.log('Re-composited 06-passkey-settings.png & .webp');
    }

    console.log('TARGETED REFRESH COMPLETE.');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Targeted capture failed:', err);
  process.exit(1);
});
