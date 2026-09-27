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
 * - Fully non-destructive: Never removes or mutates Google CSE DOM nodes to avoid crashing the engine.
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

  // 1. Locate or create the hidden container for the Google CSE widget
  let container = document.getElementById("yoouz-hidden-cse-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "yoouz-hidden-cse-container";
    container.className = "opacity-0 pointer-events-none fixed";
    container.style.cssText = "top: -9999px; left: -9999px; width: 400px; height: 400px; overflow: hidden; z-index: -9999;";
    
    const searchDiv = document.createElement("div");
    searchDiv.className = "gcse-search";
    searchDiv.setAttribute("data-gname", "yoouz_search");
    
    container.appendChild(searchDiv);
    document.body.appendChild(container);
  }

  // Guarantee hide styles are present in document
  if (!document.getElementById("yoouz-cse-hide-style")) {
    const style = document.createElement("style");
    style.id = "yoouz-cse-hide-style";
    style.textContent = `
      .gsc-modal-background-image,
      .gsc-modal-background-image-visible,
      .gsc-results-wrapper-overlay,
      .gsc-results-wrapper-visible,
      .gsc-overflow-hidden {
        position: fixed !important;
        top: -9999px !important;
        left: -9999px !important;
        width: 1px !important;
        height: 1px !important;
        opacity: 0 !important;
        pointer-events: none !important;
        z-index: -9999 !important;
        overflow: hidden !important;
      }
    `;
    document.head.appendChild(style);
  }

  // 2. Inject Google CSE Script dynamically if not already loaded
  if (!document.querySelector('script[src*="cse.google.com"]')) {
    console.info("[Google CSE] Injecting Google CSE script...");
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://cse.google.com/cse.js?cx=e41632212e69a4efd";
    document.head.appendChild(script);
  }

  let inputEl: HTMLInputElement | null = null;
  let buttonEl: HTMLElement | null = null;
  const maxWait = 5000;
  const startTime = Date.now();

  // 3. Wait for the Google CSE search elements to be rendered in the DOM
  const waitForCseRender = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        if (!container) {
          clearInterval(interval);
          reject(new Error("Container vanished."));
          return;
        }
        inputEl = container.querySelector("input.gsc-input") as HTMLInputElement;
        buttonEl = container.querySelector("button.gsc-search-button, input.gsc-search-button") as HTMLElement;

        if (inputEl && buttonEl) {
          clearInterval(interval);
          resolve();
        } else if (Date.now() - startTime > maxWait) {
          clearInterval(interval);
          reject(new Error("Timeout waiting for Google CSE to render interface elements."));
        }
      }, 100);
    });
  };

  try {
    await waitForCseRender();
  } catch (err) {
    console.warn("[Google CSE Error] Interface rendering failed:", err);
  }

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
        return; // Stale query from previous search
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

    // 4. Register official callback listener for Google CSE searchCallbacks
    const handleNativeResults = (results: any[]) => {
      if (resolved || !results || !Array.isArray(results) || results.length === 0) return;
      
      // Loop sequentially to guarantee we take the FIRST authentic organic website (100% like Google)
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

    // 5. Trigger search execution via official CSE element API + button click
    if (inputEl) {
      inputEl.value = cleanQ;
      inputEl.dispatchEvent(new Event("input", { bubbles: true }));
      inputEl.dispatchEvent(new Event("change", { bubbles: true }));
      inputEl.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", keyCode: 13, code: "Enter", bubbles: true }));
    }

    try {
      const gnameEl = (window as any).google?.search?.cse?.element?.getElement("yoouz_search");
      if (gnameEl && typeof gnameEl.execute === "function") {
        gnameEl.execute(cleanQ);
      } else {
        const cseElements = (window as any).google?.search?.cse?.element?.getAllElements();
        if (cseElements) {
          Object.values(cseElements).forEach((el: any) => {
            if (el && typeof el.execute === "function") {
              el.execute(cleanQ);
            }
          });
        }
      }
    } catch (e) {}

    if (buttonEl) {
      buttonEl.click();
    }

    // 6. Parallel DOM polling watcher (NON-DESTRUCTIVE: reads without deleting nodes)
    const checkStartTime = Date.now();
    pollInterval = setInterval(() => {
      if (resolved) {
        cleanup();
        return;
      }

      // Query result containers in DOM
      const resultContainers = document.querySelectorAll(
        ".gsc-resultsRoot .gsc-webResult, .gsc-results .gsc-webResult, .gsc-expansionArea .gsc-webResult, .gsc-webResult.gsc-result"
      );

      if (resultContainers && resultContainers.length > 0) {
        for (let i = 0; i < resultContainers.length; i++) {
          const resultEl = resultContainers[i] as HTMLElement;

          // Skip ad blocks and promotions
          const isAd = 
            resultEl.closest(".gsc-adBlock") || 
            resultEl.closest(".gsc-adBlockVertical") || 
            resultEl.closest(".gsc-adBlockHorizontal") || 
            resultEl.closest(".gsc-adsArea") ||
            resultEl.classList.contains("gsc-adBlock") ||
            resultEl.classList.contains("gsc-promotion") ||
            resultEl.querySelector(".gs-promotion") ||
            resultEl.querySelector("[class*=\"adBlock\"]") ||
            resultEl.querySelector("[class*=\"promotion\"]");

          if (isAd) continue;

          // Find anchor tag for the organic result title
          const titleLink = (resultEl.querySelector("a.gs-title") || resultEl.querySelector("a[data-ctorig]") || resultEl.querySelector("a[href]")) as HTMLAnchorElement;
          if (titleLink) {
            const rawHref = extractTargetUrl(titleLink);
            if (rawHref && isAllowedOrganicUrl(rawHref)) {
              console.info(`[Google CSE DOM Watcher] Extracted 1st organic result from DOM:`, rawHref);
              finish(rawHref);
              return;
            }
          }
        }
      }

      // Fail-safe timeout after 4.5 seconds
      if (Date.now() - checkStartTime > 4500) {
        finish(null);
      }
    }, 75);
  });
}
