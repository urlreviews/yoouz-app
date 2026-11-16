import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  SupportedLanguage,
  LanguageMeta,
  SUPPORTED_LANGUAGES,
  translations,
  TranslationSchema
} from "./translations";
import { UNIVERSAL_PAGE_TRANSLATIONS } from "./locales/universal";
import universalAllJson from "./locales/universal_all.json";
import { parseLocaleFromPath, buildLocalizedPath, syncUrlWithLanguage } from "./urlLocalization";

interface LanguageContextType {
  language: SupportedLanguage;
  isRTL: boolean;
  setLanguage: (lang: SupportedLanguage) => void;
  currentLanguageMeta: LanguageMeta;
  languages: LanguageMeta[];
  t: (keyPath: string, fallbackOrParams?: string | Record<string, string | number>, params?: Record<string, string | number>) => string;
  translateText: (text: string) => string;
  localizedPath: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "yoouz_user_language_preference";
const ALL_STORAGE_KEYS = ["yoouz_user_language_preference", "copo_language", "yoouz_language"];

function detectBestLanguage(): SupportedLanguage {
  try {
    // 0. Check URL pathname first (e.g. /fr/search, /nl/search, /es/discover)
    if (typeof window !== "undefined") {
      const { locale } = parseLocaleFromPath(window.location.pathname);
      if (locale) return locale;
    }

    // 1. Check all local storage keys for explicit user selection
    for (const key of ALL_STORAGE_KEYS) {
      const saved = localStorage.getItem(key);
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        return saved as SupportedLanguage;
      }
    }

    // 2. Check saved cookie
    if (typeof document !== "undefined" && document.cookie) {
      const match = document.cookie.match(/yoouz_lang=([a-z]{2,5})/i);
      if (match && match[1] && SUPPORTED_LANGUAGES.some((l) => l.code === match[1].toLowerCase())) {
        return match[1].toLowerCase() as SupportedLanguage;
      }
    }

    // 3. Check logged in user profile in storage
    const userKeys = ["copo_user", "yoouz_user", "copo_logged_in_user"];
    for (const uKey of userKeys) {
      const raw = localStorage.getItem(uKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const userLang = parsed?.language || parsed?.preferredLanguage || parsed?.locale;
          if (userLang && SUPPORTED_LANGUAGES.some((l) => l.code === userLang.toLowerCase())) {
            return userLang.toLowerCase() as SupportedLanguage;
          }
        } catch (e) {}
      }
    }

    // 4. Fallback to browser language
    const browserLangs = navigator.languages || [navigator.language || "en"];
    for (const raw of browserLangs) {
      const code = raw.toLowerCase().split("-")[0];
      const match = SUPPORTED_LANGUAGES.find((l) => l.code === code);
      if (match) return match.code;
    }
  } catch (err) {
    console.warn("Language detection notice:", err);
  }
  return "en";
}

// Pre-load saved translations from localStorage for instant 0ms rendering
function loadSavedTranslations(lang: string): Record<string, string> {
  if (typeof window === "undefined" || lang === "en") return {};
  try {
    const raw = localStorage.getItem(`yoouz_i18n_cache_${lang}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) return parsed;
    }
  } catch (e) {}
  return {};
}

// Core texts to immediately translate & cache when user chooses any of the 64 languages
const CORE_STRINGS_TO_WARM = [
  "Home", "Search", "Discover", "Following", "Messages", "Notifications", "Bookmarks", "Business", "Profile", "More",
  "Add Review", "Snap a live photo review in seconds.",
  "Paste a business URL below to see photo reviews or add your own.",
  "Search another business or website", "Search any business or website...", "Search place or URL...",
  "Review Any Business", "Search any business to explore real photo reviews or snap your own.",
  "Search business...",
  "Recent Searches", "Trending Searches", "Clear All", "No recent searches", "Overview", "Reviews", "About", "Contact", "Support",
  "Verified Web Listing", "Discover Reviewers", "Search reviewer by name...",
  "Syncing details...", "View Business",
  "Please select a business from the list or search with a valid website domain.",
  "Proof of Presence. Real People. Visual Proof.", "The Yoouz Standard",
  "Traditional text reviews are vulnerable to bot networks, fake accounts, and AI-generated spam. Yoouz creates instant trust by capturing live photo reviews snapped exclusively through device cameras with clear whole-number 1–5 star ratings.",
  "Strict Rule", "Live Camera Only", "No gallery uploads or pre-saved photos. Real customers capturing authentic visual proof in the moment.",
  "Pillar 2", "Whole-Star Clarity", "Strictly 1 to 5 solid stars on every single review—zero confusing half-star guesswork.",
  "Pillar 3", "3-Way Dialogue", "Living comment threads connecting Reviewers, curious Viewers, and Verified Place Owners.",
  "Anonymous ID & Username Freedom", "Every visitor gets an instant U/XXXXXX ID with zero login friction and can claim a custom handle anytime, building an open visual review portfolio.",
  "Audit Any Reviewer Profile Instantly", "Interactive Community Dialogue", "Reviews shouldn't be dead one-way monologues. Viewers can ask real-time questions ('Is there outdoor seating?', 'How was the service?'), and the community answers collaboratively.",
  "Crowdsourced Community Validation", "Official Domain Verification", "Business owners can claim their base domain page, respond with verified owner badges, and pin helpful solutions or updates at the top of customer review threads.",
  "Verified Owner Pinned Responses", "No Pay-to-Remove Extortion", "Unlike legacy review sites that pressure businesses into costly subscriptions to suppress negative feedback, Yoouz guarantees all verified reviews stay transparent and tamper-free.",
  "100% Equal Rules for All", "Search FAQs, guidelines, or topics...", "All Questions", "For Reviewers", "For Businesses", "Trust & Authenticity", "Technical & Privacy",
  "Claim Your Business Domain & Engage Directly", "Verify ownership of your base website domain (e.g., yourcompany.com) or local place profile to access creator tools, official owner badges, and community response features.",
  "Verified Owner Badge", "Stand out with a distinguished badge and official business owner designation on all comment threads.",
  "Pinned Solutions", "Pin an official response at the top of any review discussion to clarify updates or resolve questions.",
  "Embed Trust Feeds", "Easily embed genuine customer photo review carousels onto your landing page to increase conversions.",
  "Request Domain Verification", "Privacy, Security & Legal Compliance", "Google Verified",
  "Following & Followers", "Manage businesses and reviewers you follow on Yoouz",
  "Followers", "Search followed businesses or reviewers...", "Search followers by name...",
  "You aren't following anyone yet", "When you follow businesses or authentic local reviewers on Yoouz, they will appear here.",
  "No matching followers found", "No followers yet", "When other local reviewers follow your profile, they will appear here.",
  "photo review", "photo reviews", "Unfollow", "Verified Reviewer", "Verified Top Reviewer", "Community Member",
  "Edit Profile", "Share Profile", "Message", "Follow", "Following", "Bio", "Location", "Joined",
  "About Me", "Save Changes", "Cancel", "City", "State/Province", "Country",
  "Your saved visual reviews, places & creators", "Photos", "Places", "Reviewers",
  "No photo reviews saved yet", "Tap the bookmark icon in any photo review's options menu to save it.",
  "No saved places yet", "Grab places you want to visit from the map or review screens to build your bucket list.",
  "No saved reviewers yet", "Save trusted local guides & creators to instantly track their latest photo reviews.",
  "Business Place", "Explore Map", "Find Reviewers", "Discover Reviews",
  "All", "Unread", "Likes", "Comments", "Shares", "Saves",
  "new updates", "All caught up", "Mark read", "Clear all", "Notification Preferences",
  "Notifications are paused", "In-app notifications are paused in your preferences.",
  "No notifications", "View all notifications", "Notification Settings",
  "You're all caught up! Community updates and photo review activity will appear here.",
  "Search chats or reviewers...", "UNREAD", "TOTAL CHATS", "Active on Yoouz", "No conversations yet",
  "Delete Conversation", "Block User", "Report Thread", "Select a conversation to start messaging",
  "Start a Message", "New Message", "Connect and message other community reviewers.",
  "Message community members & reviewers on Yoouz", "Message official business profiles on Yoouz",
  "Search member by name or handle...", "Search business by name, category, or city...",
  "Search community members", "Search businesses & members", "Chat", "Delete this conversation?",
  "message", "messages", "You have blocked {name}", "Message {name}...",
  "Read Privacy Policy", "Read Terms & Conditions", "Official Yoouz Support Desk", "Submit support inquiries, business domain claim requests, or report community guideline infractions.",
  "Your Full Name", "Email Address", "Category", "General Account / Technical Support", "Business / Domain Ownership Verification",
  "Report Policy Violation / Fake Content", "API & Partnership Inquiries", "Website Domain (Optional)", "Message Details",
  "Describe your inquiry or request in detail...", "Send Message", "Inquiry Received Successfully", "Send Another Inquiry",
  "All Systems Operational", "Software Build", "Languages Available", "Feed", "Search Results", "Tap card to view profile",
  "Community Reviewer", "View & Manage Profile", "Menu & Features",
  // All FAQ Questions & Answers
  "How fast is it to post a photo review on Yoouz?",
  "Every review takes just seconds: open the live camera, snap one clear photo with the rear or front lens, pick 1 to 5 solid stars, and publish. No lengthy forms, titles, or gallery uploads.",
  "Why does Yoouz only use the live camera and disable gallery uploads?",
  "To guarantee 100% authentic in-person proof, Yoouz enforces Proof of Presence™ by launching the live rear or front camera directly in your browser. Uploading pre-saved gallery files, stock photos, or downloaded images is strictly disabled.",
  "Why does Yoouz only allow whole-number 1 to 5 star ratings?",
  "Each individual review uses strict whole integers (1, 2, 3, 4, or 5 solid stars) so ratings are immediate, decisive, and clutter-free with zero half-star ambiguity.",
  "Do I need to create an account or sign in before browsing or reviewing?",
  "No! Yoouz assigns every visitor a zero-friction anonymous ID (U/XXXXXX) automatically. You can pick a custom username or link Google/Apple later anytime to preserve your history.",
  "Can viewers comment, ask questions, or interact on my photo reviews?",
  "Yes! Every photo review includes a live 3-way community discussion feed. Viewers can ask follow-up questions ('Is parking easy?', 'Did you try the dessert?'), share tips, and discuss their experiences.",
  "Can I review any website domain or local establishment?",
  "Yes! You can search and review any base website domain (e.g., stripe.com, airbnb.com) or local brick-and-mortar place (restaurants, cafes, services, gyms) to build a unified hub of visual proof.",
  "Can I edit or delete my reviews later?",
  "Absolutely. You maintain complete ownership of your content. You can update your whole-star rating or permanently delete any of your posted photo reviews at any time directly from your Profile drawer or review options.",
  "How does direct messaging work between community members?",
  "Reviewers and users can message each other directly through the 'Messages' tab to ask private questions about venues, recommend local spots, or connect with fellow explorers.",
  "What is included in the Yoouz Premium Business Suite ($149/mo)?",
  "The Yoouz Premium Business Suite ($149/mo or $99/mo annual) provides a comprehensive enterprise growth stack: Verified Business Badge, Priority Search Placement in local search results, Live Website Review Widget with automated Google Rich Snippets SEO Schema, Branded Photo Review Exporter with watermark overlays, Pinned Owner Replies, Direct Messaging Lead Capture, Table & Window QR Standees, and Real-Time Analytics.",
  "How does the Yoouz Premium Suite improve Google Search SEO & Rich Snippets?",
  "When you embed your Yoouz photo review widget on your website, our system automatically generates Schema.org JSON-LD structured data. This allows search engines like Google to render star ratings and visual review previews directly in organic search results.",
  "Can businesses export customer photo reviews as branded social assets?",
  "Yes! Premium Suite subscribers can export customer photo reviews as high-resolution branded assets with your official venue logo overlay and watermark—ready to share on Instagram, TikTok, or Facebook.",
  "Are there any contracts, hidden fees, or cancellation lock-ins?",
  "No. Yoouz Premium Business Suite is completely flexible with zero setup fees and zero cancellation penalties. You can upgrade, pause, or switch plans anytime with 1-click in your Business Dashboard.",
  "How can my business claim its official domain or place page?",
  "Business owners can claim their listing in less than 2 minutes through the business verification flow. Claiming unlocks official owner dashboard tools, category settings, operating hours management, and customer dialogue features.",
  "Why do live photo reviews convert so much higher than traditional text reviews?",
  "Written reviews are treated as quick signals that users skim with skepticism, whereas live camera photos deliver instant visual proof. Real lighting, real food, real atmosphere, and whole-star scores eliminate guesswork.",
  "Why are authentic customer photo reviews more trusted than paid influencer posts?",
  "Modern consumers are fatigue-blind to staged sponsored posts. Live camera photos from everyday customers carry genuine social proof because they are snapped on the spot without gallery filters or studio editing.",
  "How do photo reviews reduce product return rates and customer misunderstandings?",
  "Text reviews often create ambiguous expectations. A live photo shows true sizing, atmosphere, portion sizes, or build quality in natural light, aligning expectations before purchase.",
  "How can businesses use QR codes to capture in-person photo reviews on the spot?",
  "Verified businesses can download branded QR table tents, counter cards, and receipt stickers from their dashboard. When customers scan the code, it launches the live camera photo review flow instantly with the place pre-tagged.",
  "Can businesses embed Yoouz photo reviews on their own websites?",
  "Yes! Verified businesses can copy responsive iframe photo review carousels from their place drawer or Business Dashboard to display live customer photo reviews directly on their Shopify site, store, or landing page.",
  "Can businesses export or download Branded Review Cards?",
  "Yes! Claimed businesses can export customer photo reviews as high-resolution branded assets with official watermark overlays for use in social media campaigns and marketing.",
  "Can businesses pay to remove or hide negative photo reviews?",
  "No. Yoouz is built on uncompromised trust and authenticity. We never delete or alter honest photo reviews for payment. Reviews that violate safety guidelines can be flagged for moderation, and owners can post pinned replies.",
  "How do official Business Owner replies and pinned comments work?",
  "Claimed business owners can participate in comment threads with a highlighted 'Business Owner' badge and pin official responses to top of threads.",
  "What is the Business Hours Manager and how does it sync?",
  "Claimed business owners can configure weekly operating hours, holiday schedules, and open/closed statuses directly in their dashboard.",
  "How do I manage business categories and contact details?",
  "Claimed owners can select official business categories, add verified phone numbers, and link official web domains directly within the Business Dashboard.",
  "How does Yoouz eliminate fake reviews, AI bots, and automated spam?",
  "With AI copywriters making written text reviews effortless to manufacture, Yoouz enforces Proof of Presence™. Every review must be captured live through the device camera in the moment, completely eliminating gallery uploads and automated text bots.",
  "Is my private email address exposed on my public profile or business claim badge?",
  "No. Yoouz strictly protects user privacy. Consumer accounts default to anonymous IDs (U/XXXXXX), and claimed business badges never display personal email addresses publicly.",
  "Is Yoouz a misspelling or affiliated with YouTube, Yoox, Youz, or Yelp?",
  "No. Yoouz (spelled Y-O-O-U-Z, pronounced 'Use' or 'Yooz') is an independent brand and proprietary platform dedicated to live camera photo reviews.",
  "How are community guidelines and safety rules enforced?",
  "Every photo review and comment includes a report flag button for rapid moderation of spam, harassment, or policy violations.",
  "How does Google Maps and Live Directions integration work?",
  "Yoouz integrates interactive Google Maps with live pin clustering so users can locate spots and launch directions anytime.",
  "How can I share photo reviews or business profiles with friends?",
  "Tap the 'Share' button on any photo review or place to generate direct web links, downloadable QR codes, or share directly to WhatsApp, X (Twitter), Facebook, LinkedIn, or Email.",
  "How do I navigate between photo reviews on desktop and mobile?",
  "On mobile, swipe up or down in the full-screen vertical feed. On desktop, use your keyboard arrow keys, mouse wheel, or the floating Up and Down navigation controls.",
  "How does Yoouz work offline as a Progressive Web App (PWA)?",
  "Yoouz supports PWA offline capabilities and fast CDN edge caching via bunny.net for instant vertical feed browsing.",
  "How many languages does Yoouz support, and how do I change my language?",
  "Yoouz supports 64 global languages with full UI internationalization from the sidebar, profile drawer, or Knowledge Center settings.",
  "Is Yoouz free for consumers and businesses?",
  "Yes. Browsing the vertical photo feed, discovering local venues, posting live camera photo reviews, and claiming places are included with no hidden fees.",
  // Terms & Conditions & Privacy Policy Full Text
  "Yoouz Legal & Compliance",
  "Governing Compliance & Data Protection",
  "Terms & Conditions",
  "Privacy Policy",
  "Official Legal Agreement",
  "Terms & Conditions for Yoouz",
  "Last Updated: November 16, 2026",
  "Welcome to Yoouz. By accessing or using our platform, you agree to be bound by these Terms & Conditions. If you do not agree to these terms, please do not use Yoouz.",
  "Description of Service",
  "Yoouz is a live photo review and discovery platform. Users can snap authentic photo reviews directly via their device camera, and businesses can display these reviews within their profiles or via platform-provided tools.",
  "Account & Anonymous Identity",
  "Visitors receive an automatic anonymous identifier (U/XXXXXX) and may optionally set a username or link Google/Apple to preserve their history.",
  "Live Camera Capture & Content Rules",
  "No Gallery Uploads",
  "All reviews must be captured live through the Yoouz web application camera interface. Uploading saved photos from device galleries or external libraries is strictly prohibited.",
  "User Content Standards",
  "You retain personal accountability for the photo reviews you publish. You agree not to capture or publish content that is unlawful, defamatory, abusive, harassing, misleading, or infringing on third-party rights.",
  "Content License",
  "By publishing a photo review on Yoouz, you grant Yoouz a worldwide, non-exclusive, royalty-free license to host and display your photo review content on the platform.",
  "Business Accounts & Intellectual Property Protection",
  "No Ownership Transfer:",
  "Businesses utilizing Yoouz do not own the photos captured by users.",
  "Authorized Display Only:",
  "Businesses are granted a limited, revocable, non-transferable right to display consumer photo reviews exclusively through Yoouz's authorized platform interface or official embedding tools.",
  "Anti-Piracy & Anti-Scraping:",
  "Businesses and users are strictly prohibited from scraping, ripping, harvesting, or re-hosting review photos from Yoouz without permission.",
  "Future Features and Monetization:",
  "Advanced business tools, analytics, custom widgets, or higher-tier embedding features may be subject to paid subscription tiers.",
  "Limitation of Liability",
  "Yoouz is provided on an 'as is' and 'as available' basis. We do not guarantee uninterrupted platform availability and are not liable for user-generated content.",
  "Changes to Terms",
  "We reserve the right to modify these Terms & Conditions at any time. Continued use of Yoouz constitutes acceptance of updated terms.",
  "Governing Law & Jurisdiction",
  "These terms are governed by applicable privacy regulations and digital service guidelines.",
  "Privacy & Security Compliant",
  "Privacy Policy for Yoouz",
  "Welcome to Yoouz ('we,' 'our,' or 'us'). We respect your privacy and are committed to protecting your personal data.",
  "Information We Collect",
  "Anonymous Identifiers & Optional Linked Accounts",
  "Consumers use an automatic anonymous U/XXXXXX identifier with an optional username. If you optionally link Google or Apple, we store your linked email securely to preserve your history without exposing it publicly.",
  "Live Camera Data",
  "Yoouz accesses your device camera strictly in real-time when you open the Add Review flow to snap a single live photo. We do not read or upload your device photo gallery.",
  "How We Use Your Information",
  "Create and preserve your U/XXXXXX profile and optional username.",
  "Process, host, and display your live camera photo reviews on bunny.net and our local database.",
  "Maintain platform security and prevent automated spam.",
  "Data Sharing and Disclosure",
  "We do not sell, trade, or rent your personal information to third parties.",
  "Data Security",
  "We implement modern encryption (HTTPS) and secure token-based session handling to protect your data.",
  "Privacy Officer & In-App Inquiries",
  "If you have any questions about this Privacy Policy, you can submit an inquiry directly through the in-app Support Desk."
];

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(detectBestLanguage);
  const [dynamicCache, setDynamicCache] = useState<Record<string, Record<string, string>>>(() => ({
    [language]: loadSavedTranslations(language)
  }));
  const [, setTick] = useState<number>(0);

  const pendingBatchRef = useRef<Set<string>>(new Set());
  const batchTimerRef = useRef<any>(null);
  const currentLangRef = useRef<string>(language);
  currentLangRef.current = language;

  const currentLanguageMeta = useMemo(() => {
    return (
      SUPPORTED_LANGUAGES.find((l) => l.code === language) ||
      SUPPORTED_LANGUAGES[0]
    );
  }, [language]);

  const isRTL = currentLanguageMeta.direction === "rtl";

  // Batch fetcher via /api/translate backed by Gemini 3.8 Flash
  const flushBatch = useCallback(async () => {
    const lang = currentLangRef.current;
    if (lang === "en") {
      pendingBatchRef.current.clear();
      return;
    }
    const texts = Array.from(pendingBatchRef.current);
    pendingBatchRef.current.clear();
    if (texts.length === 0) return;

    try {
      const resp = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texts,
          targetLang: lang,
          targetLangName: currentLanguageMeta.name
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data && data.translations && Object.keys(data.translations).length > 0) {
          setDynamicCache((prev) => {
            const currentForLang = { ...(prev[lang] || loadSavedTranslations(lang)) };
            let changed = false;
            for (const [orig, trans] of Object.entries(data.translations)) {
              if (typeof trans === "string" && trans.trim()) {
                currentForLang[orig] = trans.trim();
                changed = true;
              }
            }
            if (!changed) return prev;
            try {
              localStorage.setItem(`yoouz_i18n_cache_${lang}`, JSON.stringify(currentForLang));
            } catch (e) {}
            return { ...prev, [lang]: currentForLang };
          });
          setTick((t) => t + 1);
        }
      }
    } catch (err) {
      console.warn("[i18n] Translation network error:", err);
    }
  }, [currentLanguageMeta.name]);

  const scheduleTranslation = useCallback((text: string) => {
    if (!text || typeof text !== "string" || text.trim().length === 0) return;
    const trimmed = text.trim();
    if (trimmed.length > 2500) return; // Allow complete paragraphs and articles
    pendingBatchRef.current.add(trimmed);
    if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
    batchTimerRef.current = setTimeout(flushBatch, 30);
  }, [flushBatch]);

  // Warm up core strings when language changes
  useEffect(() => {
    if (language === "en") return;
    const existing = dynamicCache[language] || loadSavedTranslations(language);
    const missing = CORE_STRINGS_TO_WARM.filter((s) => !existing[s]);
    if (missing.length > 0) {
      missing.forEach((s) => pendingBatchRef.current.add(s));
      if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
      batchTimerRef.current = setTimeout(flushBatch, 50);
    }
  }, [language, flushBatch]);

  // Browser Back/Forward navigation sync with URL language
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === "undefined") return;
      const { locale } = parseLocaleFromPath(window.location.pathname);
      const targetLang = locale || "en";
      if (targetLang !== currentLangRef.current) {
        setLanguageState(targetLang as SupportedLanguage);
        currentLangRef.current = targetLang;
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const setLanguage = useCallback((newLang: SupportedLanguage) => {
    if (!SUPPORTED_LANGUAGES.some((l) => l.code === newLang)) return;
    setLanguageState(newLang);
    currentLangRef.current = newLang;

    // 0. Synchronize URL prefix (e.g. /fr/search, /nl/search) for SEO & deep linking
    syncUrlWithLanguage(newLang);

    // 1. Persist across all local storage keys & cookies for instant client retention
    try {
      ALL_STORAGE_KEYS.forEach((key) => {
        localStorage.setItem(key, newLang);
      });
      document.cookie = `yoouz_lang=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}

    // 2. Sync with logged in user profile in local storage
    try {
      const userKeys = ["copo_user", "yoouz_user", "copo_logged_in_user"];
      userKeys.forEach((uKey) => {
        const raw = localStorage.getItem(uKey);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            parsed.language = newLang;
            parsed.preferredLanguage = newLang;
            localStorage.setItem(uKey, JSON.stringify(parsed));
          } catch (e) {}
        }
      });
    } catch (e) {}

    // 3. Sync language preference with server database backend
    try {
      const rawUser = localStorage.getItem("copo_user") || localStorage.getItem("yoouz_user");
      if (rawUser) {
        const uObj = JSON.parse(rawUser);
        if (uObj && (uObj.id || uObj.email || uObj.uid)) {
          fetch("/api/users/language", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: uObj.id || uObj.uid,
              userEmail: uObj.email,
              language: newLang
            })
          }).catch(() => {});
        }
      }
    } catch (e) {}

    // 4. Load cached translations for new language if not in state
    setDynamicCache((prev) => {
      if (prev[newLang]) return prev;
      return { ...prev, [newLang]: loadSavedTranslations(newLang) };
    });
  }, []);

  // Update HTML root attributes for accessibility & SEO
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = "ltr";
    
    let metaLocale = document.querySelector('meta[property="og:locale"]');
    if (!metaLocale) {
      metaLocale = document.createElement("meta");
      metaLocale.setAttribute("property", "og:locale");
      document.head.appendChild(metaLocale);
    }
    metaLocale.setAttribute("content", language);
  }, [language]);

  /**
   * Universal translation helper for all 64 languages.
   * Looks up static translations, cached translations, or queues AI auto-translation.
   */
  const t = useCallback(
    (
      keyPath: string,
      fallbackOrParams?: string | Record<string, string | number>,
      params?: Record<string, string | number>
    ): string => {
      let fallback = "";
      let actualParams: Record<string, string | number> | undefined;

      if (typeof fallbackOrParams === "string") {
        fallback = fallbackOrParams;
        actualParams = params;
      } else if (typeof fallbackOrParams === "object") {
        actualParams = fallbackOrParams;
      }

      // English base string determination
      let englishText = fallback;
      const keys = keyPath.split(".");
      let enVal: any = translations.en;
      for (const k of keys) {
        if (enVal && typeof enVal === "object" && k in enVal) {
          enVal = enVal[k];
        } else {
          enVal = undefined;
          break;
        }
      }
      if (typeof enVal === "string" && enVal) {
        englishText = enVal;
      }
      if (!englishText) {
        englishText = fallback || keyPath;
      }

      if (language === "en") {
        let res = englishText;
        if (actualParams) {
          Object.entries(actualParams).forEach(([paramKey, paramVal]) => {
            res = res.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramVal));
          });
        }
        return res;
      }

      // 1. Static Dictionary lookup
      let val: any = (translations as any)[language];
      for (const k of keys) {
        if (val && typeof val === "object" && k in val) {
          val = val[k];
        } else {
          val = undefined;
          break;
        }
      }

      // Check flat key lookup in static dictionary if nested traversal failed
      if (typeof val !== "string" || !val) {
        const langObj = (translations as any)[language];
        if (langObj && typeof langObj === "object") {
          if (typeof langObj[keyPath] === "string" && langObj[keyPath]) {
            val = langObj[keyPath];
          } else if (typeof langObj[englishText] === "string" && langObj[englishText]) {
            val = langObj[englishText];
          }
        }
      }

      // 2. Dynamic cache lookup by keyPath or by englishText or by fallback
      const langCache = dynamicCache[language] || loadSavedTranslations(language);
      const universalAllDict = (universalAllJson as Record<string, Record<string, string>>)[language];
      if (typeof val !== "string" || !val) {
        if (langCache[keyPath]) {
          val = langCache[keyPath];
        } else if (langCache[englishText]) {
          val = langCache[englishText];
        } else if (fallback && langCache[fallback]) {
          val = langCache[fallback];
        } else if (universalAllDict?.[englishText]) {
          val = universalAllDict[englishText];
        } else if (fallback && universalAllDict?.[fallback]) {
          val = universalAllDict[fallback];
        } else if (universalAllDict?.[keyPath]) {
          val = universalAllDict[keyPath];
        } else if (UNIVERSAL_PAGE_TRANSLATIONS[language]?.[englishText]) {
          val = UNIVERSAL_PAGE_TRANSLATIONS[language][englishText];
        } else if (fallback && UNIVERSAL_PAGE_TRANSLATIONS[language]?.[fallback]) {
          val = UNIVERSAL_PAGE_TRANSLATIONS[language][fallback];
        } else if (UNIVERSAL_PAGE_TRANSLATIONS[language]?.[keyPath]) {
          val = UNIVERSAL_PAGE_TRANSLATIONS[language][keyPath];
        } else if (universalAllDict) {
          // Case-insensitive / trimmed match across universalAllDict
          const queryClean = (englishText || fallback || "").trim().toLowerCase();
          if (queryClean) {
            for (const [k, v] of Object.entries(universalAllDict)) {
              if (k.trim().toLowerCase() === queryClean) {
                val = v;
                break;
              }
            }
          }
        }
      }

      // 3. Queue for auto-translation if still missing
      if (typeof val !== "string" || !val) {
        if (englishText && !langCache[englishText]) {
          scheduleTranslation(englishText);
        }
        val = englishText;
      }

      // 4. Interpolate params
      if (actualParams && typeof val === "string") {
        Object.entries(actualParams).forEach(([paramKey, paramVal]) => {
          val = (val as string).replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramVal));
        });
      }

      return typeof val === "string" ? val : englishText;
    },
    [language, dynamicCache, scheduleTranslation]
  );

  const translateText = useCallback((text: string) => {
    return t(text, text);
  }, [t]);

  const localizedPath = useCallback(
    (path: string) => buildLocalizedPath(path, language),
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        isRTL,
        setLanguage,
        currentLanguageMeta,
        languages: SUPPORTED_LANGUAGES,
        t,
        translateText,
        localizedPath
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
