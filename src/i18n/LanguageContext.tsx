import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
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

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(detectBestLanguage);

  const currentLanguageMeta = useMemo(() => {
    return (
      SUPPORTED_LANGUAGES.find((l) => l.code === language) ||
      SUPPORTED_LANGUAGES[0]
    );
  }, [language]);

  const isRTL = currentLanguageMeta.direction === "rtl";

  const setLanguage = useCallback((newLang: SupportedLanguage) => {
    if (!SUPPORTED_LANGUAGES.some((l) => l.code === newLang)) return;
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // safe fallback
    }
  }, []);

  // Update HTML root attributes for accessibility & SEO
  // Maintain 'ltr' document direction to preserve consistent video player, navigation, and hamburger layout across all languages (including RTL)
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = "ltr";
    
    // Update or create hreflang & og:locale meta tags for SEO
    let metaLocale = document.querySelector('meta[property="og:locale"]');
    if (!metaLocale) {
      metaLocale = document.createElement("meta");
      metaLocale.setAttribute("property", "og:locale");
      document.head.appendChild(metaLocale);
    }
    metaLocale.setAttribute("content", language);

    // Synchronize hreflang tags for all 16 supported languages
    const currentBaseUrl = window.location.origin + window.location.pathname;
    SUPPORTED_LANGUAGES.forEach((l) => {
      let hreflangLink = document.querySelector(`link[rel="alternate"][hreflang="${l.code}"]`);
      if (!hreflangLink) {
        hreflangLink = document.createElement("link");
        hreflangLink.setAttribute("rel", "alternate");
        hreflangLink.setAttribute("hreflang", l.code);
        document.head.appendChild(hreflangLink);
      }
      hreflangLink.setAttribute("href", `${currentBaseUrl}?lang=${l.code}`);
    });

    // x-default hreflang
    let defaultHreflang = document.querySelector('link[rel="alternate"][hreflang="x-default"]');
    if (!defaultHreflang) {
      defaultHreflang = document.createElement("link");
      defaultHreflang.setAttribute("rel", "alternate");
      defaultHreflang.setAttribute("hreflang", "x-default");
      document.head.appendChild(defaultHreflang);
    }
    defaultHreflang.setAttribute("href", currentBaseUrl);
  }, [language, isRTL]);

  /**
   * Fast translation helper.
   * Usage: t('nav.home') or t('common.just_now')
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

      const keys = keyPath.split(".");
      let val: any = (translations as any)[language];
      for (const k of keys) {
        if (val && typeof val === "object" && k in val) {
          val = val[k];
        } else {
          val = undefined;
          break;
        }
      }

      // Fallback to English dictionary if key is missing in active language
      if (typeof val !== "string") {
        let enVal: any = translations.en;
        for (const k of keys) {
          if (enVal && typeof enVal === "object" && k in enVal) {
            enVal = enVal[k];
          } else {
            enVal = undefined;
            break;
          }
        }
        val = typeof enVal === "string" ? enVal : fallback || keyPath;
      }

      // Replace variables like {count} or {name}
      if (actualParams && typeof val === "string") {
        Object.entries(actualParams).forEach(([paramKey, paramVal]) => {
          val = (val as string).replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramVal));
        });
      }

      return typeof val === "string" ? val : fallback || keyPath;
    },
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
        t
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
