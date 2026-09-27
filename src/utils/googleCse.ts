/**
 * Yoouz Enterprise - Google Custom Search Engine (CSE) Client-Side Search Bridge
 * 
 * This module provides a 100% free, unlimited, and client-side Google search query resolution
 * mechanism that runs completely inside the user's browser, bypassing backend API key quotas and rate limits.
 * 
 * Features:
 * - Direct official Google CSE element execution (native searchCallbacks & programmatic DOM trigger).
 * - Always takes the 100% genuine FIRST organic result from Google.
 * - STRICT AD AND WIKIPEDIA FILTERING: Never takes Wikipedia pages or ads as business websites.
 * - Non-destructive and safe: Never hides document.body or corrupts Google CSE elements.
 */

// Global registry of disallowed non-business domains
export const DISALLOWED_SEARCH_DOMAINS = [
  "wikipedia.org", "wikimedia.org", "wiktionary.org",
  "google.com", "google.co.il", "google.co.uk", "google.ca", "google.de", "google.fr", "google.it", "google.es", "google.nl", "google.be", "google.ch", "google.at", "google.pl", "google.co.jp", "google.co.in",
  "news.google.com", "news.google.co.il", "news.google.co.uk", "news.google.ca", "news.google.de", "news.google.fr",
  "duckduckgo.com", "bing.com", "yahoo.com", "yandex.com", "baidu.com", "search.com",
  "youtube.com", "youtu.be", "vimeo.com", "dailymotion.com",
  "facebook.com", "instagram.com", "twitter.com", "x.com", "linkedin.com", "tiktok.com", "pinterest.com", "snapchat.com",
  "yelp.com", "tripadvisor.com", "foursquare.com", "yellowpages.com", "zocdoc.com", "glassdoor.com", "indeed.com",
  "doubleclick.net", "googleadservices.com", "adservice.google.com", "pagead2.googlesyndication.com",
  "wordpress.com", "wix.com", "squarespace.com", "webflow.com", "shopify.com", "github.com", "gitlab.com",
  "medium.com", "blogger.com", "blogspot.com", "yoouz.com"
];

export function isAllowedOrganicUrl(rawHref: string): boolean {
  if (!rawHref || !rawHref.startsWith("http")) return false;
  const lowerHref = rawHref.toLowerCase();

  // Strict check: Block advertisements, tracking redirects, and ad clicks
  if (
    lowerHref.includes("google.com/aclk") ||
    lowerHref.includes("googleadservices.com") ||
    lowerHref.includes("doubleclick.net") ||
    lowerHref.includes("/aclk") ||
    lowerHref.includes("adservice") ||
    lowerHref.includes("pagead") ||
    lowerHref.includes("googleads") ||
    lowerHref.includes("duckduckgo.com/l/?") ||
    lowerHref.includes("bing.com/aclick")
  ) {
    return false;
  }

  let domain = "";
  try {
    domain = new URL(rawHref).hostname.replace(/^www\./i, "").toLowerCase();
  } catch (e) {
    return false;
  }

  if (!domain || !domain.includes(".")) return false;

  // Reject Punycode / IDN squatter domains
  if (domain.includes("xn--")) return false;

  // Strictly block Wikipedia, search engines, social networks, and directories
  const isDisallowed = DISALLOWED_SEARCH_DOMAINS.some(b => domain === b || domain.endsWith("." + b));
  if (isDisallowed) return false;

  return true;
}

export function extractTargetUrl(titleLink: HTMLAnchorElement | null): string | null {
  if (!titleLink) return null;

  // A. Check data-ctorig attribute (Google CSE's clean original URL attribute)
  const ctOrig = titleLink.getAttribute("data-ctorig") || (titleLink.dataset ? titleLink.dataset.ctorig : null);
  if (ctOrig && ctOrig.startsWith("http") && !ctOrig.includes("google.com/url")) {
    return ctOrig;
  }

  // B. Check href attribute
  let href = titleLink.getAttribute("href") || titleLink.href || "";
  if (!href) return null;

  // C. Unwrap Google redirect URLs (e.g. https://www.google.com/url?q=https://example.com/&sa=U...)
  if (href.includes("/url?") || href.includes("google.com/url") || href.includes("google.co.") || href.includes("google.")) {
    try {
      const parsed = new URL(href, window.location.origin);
      const target = parsed.searchParams.get("q") || parsed.searchParams.get("url");
      if (target && target.startsWith("http") && !target.includes("google.com")) {
        return target;
      }
    } catch (e) {}
  }

  if (href.startsWith("http")) return href;
  return null;
}

// Track currently active query resolver to handle race conditions cleanly
let activeQueryToken = 0;

export async function queryGoogleCseForUrl(query: string): Promise<string | null> {
  const cleanQ = query.trim();
  if (!cleanQ || cleanQ.length < 2) return null;

  const currentToken = ++activeQueryToken;
  console.info(`[Google CSE] Initiating free client-side query resolution #${currentToken} for: "${cleanQ}"`);

  // Ensure container exists
  let container = document.getElementById("yoouz-hidden-cse-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "yoouz-hidden-cse-container";
    container.className = "opacity-0 pointer-events-none fixed";
    container.style.cssText = "top: -9999px; left: -9999px; width: 400px; height: 400px; overflow: hidden; z-index: -9999;";
    document.body.appendChild(container);
  }

  // Inject Google CSE script if missing
  if (!document.querySelector('script[src*="cse.google.com"]')) {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://cse.google.com/cse.js?cx=e41632212e69a4efd";
    document.head.appendChild(script);
  }

  // Wait for Google CSE element API to be initialized (up to 3.5s)
  const waitForCseElement = (): Promise<any> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const g = (window as any).google?.search?.cse?.element;
        if (g) {
          const el = g.getElement("yoouz_search") || (g.getAllElements && Object.values(g.getAllElements())[0]);
          if (el && typeof el.execute === "function") {
            clearInterval(interval);
            resolve(el);
            return;
          }
        }
        if (container) {
          const inputEl = container.querySelector("input.gsc-input") as HTMLInputElement;
          if (inputEl) {
            clearInterval(interval);
            resolve(null);
            return;
          }
        }
        if (Date.now() - startTime > 3500) {
          clearInterval(interval);
          resolve(null);
        }
      }, 50);
    });
  };

  const cseEl = await waitForCseElement();

  return new Promise((resolve) => {
    let resolved = false;
    let pollInterval: any = null;

    const cleanup = () => {
      if (pollInterval) clearInterval(pollInterval);
      if ((window as any).__yoouzOnCseResults === handleNativeResults) {
        (window as any).__yoouzOnCseResults = null;
      }
    };

    const finish = (resultUrl: string | null) => {
      if (resolved) return;
      if (currentToken !== activeQueryToken) {
        cleanup();
        resolve(null);
        return;
      }
      resolved = true;
      cleanup();
      if (resultUrl) {
        console.info(`[Google CSE Success] Extracted 1st organic result for "${cleanQ}": ${resultUrl}`);
      } else {
        console.warn(`[Google CSE] No organic result found for "${cleanQ}"`);
      }
      resolve(resultUrl);
    };

    // 1. Native searchCallbacks listener
    const handleNativeResults = (results: any[]) => {
      if (resolved || !results || !Array.isArray(results) || results.length === 0) return;
      for (let i = 0; i < results.length; i++) {
        const item = results[i];
        const targetUrl = item.url || item.unescapedUrl;
        if (targetUrl && isAllowedOrganicUrl(targetUrl)) {
          console.info(`[Google CSE Native Callback] Got 1st organic result at index ${i}:`, targetUrl);
          finish(targetUrl);
          return;
        }
      }
    };

    (window as any).__yoouzOnCseResults = handleNativeResults;

    // 2. Trigger search execution
    try {
      if (cseEl && typeof cseEl.execute === "function") {
        cseEl.execute(cleanQ);
      } else {
        const g = (window as any).google?.search?.cse?.element;
        if (g && typeof g.getElement === "function") {
          const namedEl = g.getElement("yoouz_search");
          if (namedEl && typeof namedEl.execute === "function") {
            namedEl.execute(cleanQ);
          }
        }
      }
    } catch (e) {}

    // Fallback: input typing and button click
    if (container) {
      const inputEl = container.querySelector("input.gsc-input") as HTMLInputElement;
      const buttonEl = container.querySelector("button.gsc-search-button, input.gsc-search-button") as HTMLElement;
      if (inputEl) {
        inputEl.value = cleanQ;
        inputEl.dispatchEvent(new Event("input", { bubbles: true }));
        inputEl.dispatchEvent(new Event("change", { bubbles: true }));
      }
      if (buttonEl) {
        buttonEl.click();
      }
    }

    // 3. Parallel DOM polling watcher (queries both hidden container and document results)
    const checkStartTime = Date.now();
    pollInterval = setInterval(() => {
      if (resolved) {
        cleanup();
        return;
      }

      const candidateAnchors = document.querySelectorAll(
        "#yoouz-hidden-cse-container a.gs-title, .gsc-resultsRoot a.gs-title, .gsc-webResult a.gs-title, a[data-ctorig]"
      );

      if (candidateAnchors && candidateAnchors.length > 0) {
        for (let i = 0; i < candidateAnchors.length; i++) {
          const anchor = candidateAnchors[i] as HTMLAnchorElement;
          const resultEl = anchor.closest(".gsc-webResult, .gsc-result, .gs-result");
          if (resultEl) {
            const isAd = 
              resultEl.closest(".gsc-adBlock") || 
              resultEl.closest(".gsc-adBlockVertical") || 
              resultEl.closest(".gsc-adsArea") ||
              resultEl.classList.contains("gsc-adBlock") ||
              resultEl.classList.contains("gsc-promotion");
            if (isAd) continue;
          }

          const rawHref = extractTargetUrl(anchor);
          if (rawHref && isAllowedOrganicUrl(rawHref)) {
            console.info(`[Google CSE DOM Watcher] Extracted 1st organic result:`, rawHref);
            finish(rawHref);
            return;
          }
        }
      }

      // 4.5 seconds timeout
      if (Date.now() - checkStartTime > 4500) {
        finish(null);
      }
    }, 60);
  });
}
