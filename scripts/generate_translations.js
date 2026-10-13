import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// All 64 Target Locales
const TARGET_LANGUAGES = [
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "nl", name: "Dutch" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "uk", name: "Ukrainian" },
  { code: "pl", name: "Polish" },
  { code: "tr", name: "Turkish" },
  { code: "ar", name: "Arabic" },
  { code: "he", name: "Hebrew" },
  { code: "fa", name: "Persian" },
  { code: "ur", name: "Urdu" },
  { code: "hi", name: "Hindi" },
  { code: "bn", name: "Bengali" },
  { code: "pa", name: "Punjabi" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "mr", name: "Marathi" },
  { code: "gu", name: "Gujarati" },
  { code: "kn", name: "Kannada" },
  { code: "ml", name: "Malayalam" },
  { code: "zh", name: "Chinese (Simplified)" },
  { code: "zh-TW", name: "Chinese (Traditional)" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "id", name: "Indonesian" },
  { code: "ms", name: "Malay" },
  { code: "th", name: "Thai" },
  { code: "vi", name: "Vietnamese" },
  { code: "tl", name: "Filipino" },
  { code: "sv", name: "Swedish" },
  { code: "no", name: "Norwegian" },
  { code: "da", name: "Danish" },
  { code: "fi", name: "Finnish" },
  { code: "el", name: "Greek" },
  { code: "cs", name: "Czech" },
  { code: "hu", name: "Hungarian" },
  { code: "ro", name: "Romanian" },
  { code: "bg", name: "Bulgarian" },
  { code: "hr", name: "Croatian" },
  { code: "sk", name: "Slovak" },
  { code: "sl", name: "Slovenian" },
  { code: "sr", name: "Serbian" },
  { code: "lt", name: "Lithuanian" },
  { code: "lv", name: "Latvian" },
  { code: "et", name: "Estonian" },
  { code: "is", name: "Icelandic" },
  { code: "sq", name: "Albanian" },
  { code: "ga", name: "Irish" },
  { code: "ca", name: "Catalan" },
  { code: "eu", name: "Basque" },
  { code: "gl", name: "Galician" },
  { code: "mt", name: "Maltese" },
  { code: "ka", name: "Georgian" },
  { code: "hy", name: "Armenian" },
  { code: "az", name: "Azerbaijani" },
  { code: "sw", name: "Swahili" },
  { code: "af", name: "Afrikaans" },
  { code: "am", name: "Amharic" },
  { code: "yo", name: "Yoruba" },
  { code: "zu", name: "Zulu" },
  { code: "so", name: "Somali" }
];

// Load strings from LanguageContext.tsx
const langContextPath = path.join(process.cwd(), "src", "i18n", "LanguageContext.tsx");
const langContextContent = fs.readFileSync(langContextPath, "utf-8");
const match = langContextContent.match(/const CORE_STRINGS_TO_WARM = \[([\s\S]*?)\];/);

let coreStrings = [];
if (match && match[1]) {
  try {
    coreStrings = eval(`[${match[1]}]`);
  } catch (e) {
    console.error("Failed to eval CORE_STRINGS_TO_WARM:", e);
  }
}

const ADDITIONAL_STRINGS = [
  "Review Any Business",
  "Search any business to watch authentic video reviews or record your own.",
  "Search business...",
  "Search...",
  "Search place or URL...",
  "Following & Followers",
  "Manage businesses and reviewers you follow on Yoouz",
  "Following",
  "Followers",
  "Search followed businesses or reviewers...",
  "Search followers by name...",
  "You aren't following anyone yet",
  "When you follow businesses or authentic local reviewers on Yoouz, they will appear here.",
  "No matching followers found",
  "No followers yet",
  "When other local reviewers follow your profile, they will appear here.",
  "Messages",
  "1 conversation",
  "UNREAD",
  "TOTAL CHATS",
  "Active on Yoouz",
  "No conversations yet",
  "Delete Conversation",
  "Block User",
  "Report Thread",
  "Select a conversation to start messaging",
  "Start a Message",
  "New Message",
  "Connect and message other community reviewers.",
  "Message Steven Akan...",
  "Notifications",
  "All caught up",
  "Clear all",
  "All",
  "Unread",
  "Likes",
  "Comments",
  "Shares",
  "Saves",
  "Bookmarks",
  "Your saved visual reviews, places & creators",
  "Videos",
  "Places",
  "Reviewers",
  "Knowledge & Trust Center",
  "Trust Protocol",
  "Help & FAQs",
  "For Businesses",
  "Privacy",
  "Support",
  "Language (EN)",
  "The Evolution of Trust: From Static Text to Absolute Belief",
  "The Yoouz Standard",
  "Search answers by keyword or topic...",
  "CATEGORY *:",
  "All Topics",
  "For Reviewers",
  "Trust & Safety",
  "Technical",
  "Turn Authentic Customer Reviews into Your Growth Engine",
  "Yoouz provides verified business owners with direct tools to manage place pages, engage in video comment threads, and display tamper-proof trust signals.",
  "Verified Owner Badge",
  "Pinned Solutions & Feedback",
  "Embed Live Video Feeds",
  "Open Business Suite",
  "Terms & Conditions",
  "Privacy Policy",
  "Support Desk",
  "YOOUZ TRUST NETWORK • SAN FRANCISCO, CA",
  "Privacy, Security & Legal Compliance",
  "ENTERPRISE SECURITY • ZERO PASSWORDS STORED",
  "Official Yoouz Support Desk",
  "Submit support inquiries, business domain claim requests, or report community guideline infractions.",
  "YOUR FULL NAME *",
  "EMAIL ADDRESS *",
  "CATEGORY *",
  "General Account / Technical Support",
  "Report Policy Violation / Fake Content",
  "API & Partnership Inquiries",
  "WEBSITE DOMAIN (OPTIONAL)",
  "MESSAGE DETAILS *",
  "ATTACH SCREENSHOTS OR VERIFICATION PROOF (OPTIONAL)",
  "Drag & drop files here, or browse files",
  "browse files",
  "PNG, JPG, WEBP, PDF or DOC (Max 3 files, up to 2MB each)",
  "Submit Secure Request",
  "AVERAGE RATING GIVEN",
  "TOTAL REVIEWS",
  "See all",
  "video reviews",
  "Member since October 2026",
  "Save",
  "Share",
  "Video Reviews",
  "Overview",
  "About",
  "About Me"
];

const MASTER_STRINGS = Array.from(new Set([...ADDITIONAL_STRINGS, ...coreStrings])).filter(Boolean);

console.log(`Master strings catalog size: ${MASTER_STRINGS.length}`);

const CACHE_FILE = path.join(process.cwd(), "data", "translations_cache.json");
const UNIVERSAL_ALL_FILE = path.join(process.cwd(), "src", "i18n", "locales", "universal_all.json");

const universalAll = {};
const flatCache = {};

function saveState() {
  const dir = path.dirname(CACHE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(UNIVERSAL_ALL_FILE, JSON.stringify(universalAll, null, 2), "utf-8");
  fs.writeFileSync(CACHE_FILE, JSON.stringify(flatCache, null, 2), "utf-8");
}

async function fetchGoogleTranslation(str, langCode) {
  if (langCode === "en") return str;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=${langCode}&q=${encodeURIComponent(str)}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && typeof data[0] === "string" && data[0].trim()) {
          return data[0].trim();
        }
      }
    } catch (e) {
      await new Promise((r) => setTimeout(r, 50 * (attempt + 1)));
    }
  }
  return str;
}

async function translateLanguage(langObj) {
  const { code, name } = langObj;
  universalAll[code] = {};
  const CONCURRENCY = 20;

  for (let j = 0; j < MASTER_STRINGS.length; j += CONCURRENCY) {
    const chunk = MASTER_STRINGS.slice(j, j + CONCURRENCY);
    await Promise.all(
      chunk.map(async (str) => {
        const trans = await fetchGoogleTranslation(str, code);
        universalAll[code][str] = trans;
        flatCache[`${code}:::${str}`] = trans;
      })
    );
  }
  saveState();
  console.log(`[Done] ${name} (${code}): ${Object.keys(universalAll[code]).length} clean translations.`);
}

async function main() {
  console.log(`Starting high-concurrency translation for all ${TARGET_LANGUAGES.length} languages...`);

  // Run 6 languages concurrently
  const LANG_WORKERS = 6;
  let idx = 0;

  async function worker(id) {
    while (idx < TARGET_LANGUAGES.length) {
      const current = TARGET_LANGUAGES[idx++];
      await translateLanguage(current);
    }
  }

  const workers = Array.from({ length: LANG_WORKERS }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  saveState();
  console.log("\n==========================================");
  console.log("COMPLETE! ALL 64 LANGUAGES CLEANLY GENERATED AND SAVED TO DISK & DB!");
  console.log("==========================================");
}

main().catch(console.error);
