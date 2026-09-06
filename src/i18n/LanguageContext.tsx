import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  SupportedLanguage,
  LanguageMeta,
  SUPPORTED_LANGUAGES,
  translations,
  TranslationSchema
} from "./translations";

interface LanguageContextType {
  language: SupportedLanguage;
  isRTL: boolean;
  setLanguage: (lang: SupportedLanguage) => void;
  currentLanguageMeta: LanguageMeta;
  languages: LanguageMeta[];
  t: (keyPath: string, fallbackOrParams?: string | Record<string, string | number>, params?: Record<string, string | number>) => string;
  translateText: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "yoouz_user_language_preference";

function detectBestLanguage(): SupportedLanguage {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
      return saved as SupportedLanguage;
    }

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
  "Review Any Business or Website", "Paste a business URL below to see short video reviews or record your own.",
  "Search another business or website", "Verified Web Listing", "Discover Reviewers", "Search reviewer by name...",
  "Proof of Presence. Real People. Verified Places.", "The Yoouz Standard",
  "Traditional text reviews are vulnerable to bot networks, fake accounts, and AI-generated reviews. Yoouz creates authentic trust by capturing short 60-second video reviews recorded exclusively through live device cameras.",
  "Strict Rule", "Live Front-Camera Only", "No pre-recorded MP4 uploads or stock footage. Real customers capturing authentic experiences.",
  "Pillar 2", "60-Second Focus", "Concise, high-impact video reviews that deliver immediate value in under one minute.",
  "Pillar 3", "3-Way Dialogue", "Living comment threads connecting Reviewers, curious Viewers, and Verified Place Owners.",
  "Immutable Face & Voice Identity", "Every reviewer builds an open visual review portfolio. Consistent face, verified voice, and historical timeline give viewers immediate confidence that reviews are authored by genuine people.",
  "Audit Any Reviewer Profile Instantly", "Interactive Community Dialogue", "Reviews shouldn't be dead one-way monologues. Viewers can ask real-time questions ('Is there outdoor seating?', 'How was the service?'), and the community answers collaboratively.",
  "Crowdsourced Community Validation", "Official Domain Verification", "Business owners can claim their base domain page, respond with verified owner badges, and pin helpful solutions or updates at the top of customer review threads.",
  "Verified Owner Pinned Responses", "No Pay-to-Remove Extortion", "Unlike legacy review sites that pressure businesses into costly subscriptions to suppress negative feedback, Yoouz guarantees all verified reviews stay transparent and tamper-free.",
  "100% Equal Rules for All", "Search FAQs, guidelines, or topics...", "All Questions", "For Reviewers", "For Businesses", "Trust & Authenticity", "Technical & Privacy",
  "Claim Your Business Domain & Engage Directly", "Verify ownership of your base website domain (e.g., yourcompany.com) or local place profile to access creator tools, official owner badges, and community response features.",
  "Verified Owner Badge", "Stand out with a distinguished badge and official business owner designation on all comment threads.",
  "Pinned Solutions", "Pin an official response at the top of any review discussion to clarify updates or resolve questions.",
  "Embed Trust Feeds", "Easily embed genuine customer video review carousels onto your landing page to increase conversions.",
  "Request Domain Verification", "Privacy, Security & Legal Compliance", "Google Verified",
  "Read Privacy Policy", "Read Terms & Conditions", "Official Yoouz Support Desk", "Submit support inquiries, business domain claim requests, or report community guideline infractions.",
  "Your Full Name", "Email Address", "Category", "General Account / Technical Support", "Business / Domain Ownership Verification",
  "Report Policy Violation / Fake Content", "API & Partnership Inquiries", "Website Domain (Optional)", "Message Details",
  "Describe your inquiry or request in detail...", "Send Message", "Inquiry Received Successfully", "Send Another Inquiry",
  "All Systems Operational", "Software Build", "Languages Available", "Feed", "Search Results", "Tap card to view profile",
  "Community Reviewer", "View & Manage Profile", "Join the Community", "Sign In / Register", "Menu & Features",
  "How long can my video review be?", "Can viewers and other users comment or ask questions on my video reviews?",
  "Can I review any website domain or local establishment?", "How do I earn the 'Verified Reviewer' status and badges?",
  "Can I edit or delete my reviews?", "How can my business claim its official domain page?",
  "How does the interactive comments section benefit verified businesses?", "Can businesses pay to remove negative reviews?",
  "How can Yoouz reviews help my conversion rate?", "What makes Yoouz different from text-based review sites?",
  "Why are community comments and live discussions a core part of the Yoouz trust model?",
  "Is Yoouz free to use for both consumers and businesses?", "How is my account and video data secured?"
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
    if (trimmed.length > 500) return; // skip overly long paragraphs
    pendingBatchRef.current.add(trimmed);
    if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
    batchTimerRef.current = setTimeout(flushBatch, 80);
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

  const setLanguage = useCallback((newLang: SupportedLanguage) => {
    if (!SUPPORTED_LANGUAGES.some((l) => l.code === newLang)) return;
    setLanguageState(newLang);
    currentLangRef.current = newLang;
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {}
    // Load cached translations for new language if not in state
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

      // 2. Dynamic cache lookup by keyPath or by englishText
      const langCache = dynamicCache[language] || loadSavedTranslations(language);
      if (typeof val !== "string" || !val) {
        if (langCache[keyPath]) {
          val = langCache[keyPath];
        } else if (langCache[englishText]) {
          val = langCache[englishText];
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

  return (
    <LanguageContext.Provider
      value={{
        language,
        isRTL,
        setLanguage,
        currentLanguageMeta,
        languages: SUPPORTED_LANGUAGES,
        t,
        translateText
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
