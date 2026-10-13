import { SupportedLanguage, SUPPORTED_LANGUAGES } from "./translations";

// Set of lowercase supported language codes for O(1) matching
const VALID_LANG_CODES = new Set<string>(
  SUPPORTED_LANGUAGES.map((l) => l.code.toLowerCase())
);

/**
 * Extracts any locale prefix from a given pathname.
 * Example:
 *   "/fr/search" => { locale: "fr", pathWithoutLocale: "/search" }
 *   "/nl/business/sample" => { locale: "nl", pathWithoutLocale: "/business/sample" }
 *   "/es" or "/es/" => { locale: "es", pathWithoutLocale: "/" }
 *   "/search" => { locale: null, pathWithoutLocale: "/search" }
 *   "/@yoouz" => { locale: null, pathWithoutLocale: "/@yoouz" }
 *   "/fr/@yoouz" => { locale: "fr", pathWithoutLocale: "/@yoouz" }
 */
export function parseLocaleFromPath(pathname: string): {
  locale: SupportedLanguage | null;
  pathWithoutLocale: string;
} {
  if (!pathname || typeof pathname !== "string") {
    return { locale: null, pathWithoutLocale: "/" };
  }

  const clean = pathname.startsWith("/") ? pathname : "/" + pathname;
  const segments = clean.split("/").filter(Boolean);

  if (segments.length === 0) {
    return { locale: null, pathWithoutLocale: "/" };
  }

  const firstSeg = segments[0].toLowerCase();
  if (VALID_LANG_CODES.has(firstSeg)) {
    const matched = SUPPORTED_LANGUAGES.find((l) => l.code.toLowerCase() === firstSeg);
    const remaining = segments.slice(1).join("/");
    return {
      locale: (matched?.code || firstSeg) as SupportedLanguage,
      pathWithoutLocale: remaining ? "/" + remaining : "/"
    };
  }

  return { locale: null, pathWithoutLocale: clean };
}

/**
 * Builds a localized path keeping or adding the language prefix.
 * Automatically cleans any existing locale prefix before prepending the new target locale.
 * If locale is "en", returns the clean path (e.g. "/search").
 * If locale is non-English (e.g. "fr", "nl", "lv"), returns "/fr/search", "/nl/search", "/lv/search".
 */
export function buildLocalizedPath(
  path: string,
  locale: SupportedLanguage | string,
  includeEnPrefix: boolean = false
): string {
  if (!path || typeof path !== "string") {
    return "/";
  }

  // 1. Strip any existing locale prefix first to avoid duplicate prefixes (e.g. /lv/lv/more)
  const { pathWithoutLocale } = parseLocaleFromPath(path);
  const normPath = pathWithoutLocale.startsWith("/") ? pathWithoutLocale : "/" + pathWithoutLocale;
  const targetCode = (locale || "en").toLowerCase();

  // 2. English (default canonical): clean un-prefixed URLs like /search, /notifications, /
  if (targetCode === "en" && !includeEnPrefix) {
    return normPath;
  }

  // 3. For all other languages: prefix with /lang
  if (normPath === "/") {
    return `/${targetCode}`;
  }
  return `/${targetCode}${normPath}`;
}

/**
 * Synchronizes the current window URL with the target language.
 * E.g., if user is on /search and changes language to 'fr', updates URL to /fr/search.
 * If on /fr/search and changes to 'nl', updates URL to /nl/search.
 * If on /fr/search and changes to 'en', updates URL to /search.
 */
export function syncUrlWithLanguage(
  targetLanguage: SupportedLanguage | string,
  replace: boolean = false
): void {
  if (typeof window === "undefined") return;

  const currentPath = window.location.pathname;
  const { pathWithoutLocale } = parseLocaleFromPath(currentPath);
  const newPath = buildLocalizedPath(pathWithoutLocale, targetLanguage);
  const newFullUrl = `${newPath}${window.location.search}${window.location.hash}`;

  if (window.location.pathname !== newPath) {
    try {
      if (replace) {
        window.history.replaceState(window.history.state, "", newFullUrl);
      } else {
        window.history.pushState(window.history.state, "", newFullUrl);
      }
    } catch (e) {
      console.warn("[i18n URL] Failed to update URL:", e);
    }
  }
}
