/**
 * Yoouz Enterprise - Google Custom Search Engine (CSE) Client-Side Search Bridge
 * 
 * Runs client-side in the user's browser to execute official Google CSE queries.
 * Strictly takes the authentic 1st organic result from Google search index.
 * Rejects ads, search engines, tracking redirects, and Wikipedia.
 */

export const DISALLOWED_SEARCH_DOMAINS = [
  "wikipedia.org", "wikimedia.org", "wiktionary.org",
  "google.com", "google.co.il", "google.co.uk", "google.ca", "google.de", "google.fr", "google.it", "google.es", "google.nl", "google.be", "google.ch", "google.at", "google.pl", "google.co.jp", "google.co.in", "google.ae",
  "news.google.com", "news.google.co.il", "news.google.co.uk", "news.google.ca", "news.google.de", "news.google.fr",
  "duckduckgo.com", "bing.com", "yahoo.com", "yandex.com", "baidu.com", "search.com", "ask.com",
  "youtube.com", "youtu.be", "vimeo.com", "dailymotion.com",
  "facebook.com", "instagram.com", "twitter.com", "x.com", "linkedin.com", "tiktok.com", "pinterest.com", "snapchat.com",
  "yelp.com", "tripadvisor.com", "foursquare.com", "yellowpages.com", "yellowpages.ae", "yellowpages.ca", "yell.com", "zocdoc.com", "glassdoor.com", "indeed.com",
  "legaladviceme.com", "findlaw.com", "lawyers.com", "justia.com", "martindale.com", "hg.org", "avvo.com", "superlawyers.com",
  "clutch.co", "goodfirms.co", "trustpilot.com", "sitejabber.com", "bbb.org", "dnb.com", "zoominfo.com", "crunchbase.com",
  "dubaibizdirectory.com", "chamberofcommerce.com", "mapquest.com", "waze.com", "kompass.com", "europages.com",
  "doubleclick.net", "googleadservices.com", "adservice.google.com", "pagead2.googlesyndication.com",
  "wordpress.com", "wix.com", "squarespace.com", "webflow.com", "shopify.com", "github.com", "gitlab.com",
  "medium.com", "blogger.com", "blogspot.com", "yoouz.com"
];

export function isAllowedOrganicUrl(rawHref: string): boolean {
  if (!rawHref || typeof rawHref !== "string" || !rawHref.startsWith("http")) return false;
  const lowerHref = rawHref.toLowerCase();

  // Block ads, tracking redirects, and search engine link wrappers
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
  if (domain.includes("xn--")) return false;

  const isDisallowed = DISALLOWED_SEARCH_DOMAINS.some(b => domain === b || domain.endsWith("." + b));
  if (isDisallowed) return false;

  return true;
}

export function extractTargetUrl(titleLink: HTMLAnchorElement | null): string | null {
  if (!titleLink) return null;

  const ctOrig = titleLink.getAttribute("data-ctorig") || (titleLink.dataset ? titleLink.dataset.ctorig : null);
  if (ctOrig && ctOrig.startsWith("http") && !ctOrig.includes("google.com/url")) {
    return ctOrig;
  }

  let href = titleLink.getAttribute("href") || titleLink.href || "";
  if (!href) return null;

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

let activeQueryToken = 0;
const cseResultCallbacks = new Set<(results: any[], query?: string) => void>();

// Register global bridge once for all Google CSE search events
if (typeof window !== "undefined") {
  (window as any).__yoouzDispatchCseResults = (results: any[], query?: string) => {
    cseResultCallbacks.forEach(cb => {
      try {
        cb(results, query);
      } catch (err) {
        console.warn("[Google CSE Callback Dispatch Error]", err);
      }
    });
  };
}

/**
 * Ensures Google CSE script and elements are initialized in the DOM
 */
export function ensureCseLoaded(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      resolve(false);
      return;
    }

    if (!document.querySelector('script[src*="cse.google.com"]')) {
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://cse.google.com/cse.js?cx=e41632212e69a4efd";
      document.head.appendChild(script);
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      const g = (window as any).google?.search?.cse?.element;
      if (g) {
        clearInterval(checkInterval);
        resolve(true);
        return;
      }
      if (Date.now() - startTime > 3000) {
        clearInterval(checkInterval);
        resolve(false);
      }
    }, 50);
  });
}

/**
 * Queries Google CSE client-side and resolves with the authentic 1st organic result URL
 */
export async function queryGoogleCseForUrl(query: string): Promise<string | null> {
  const cleanQ = query.trim();
  if (!cleanQ || cleanQ.length < 2) return null;

  const currentToken = ++activeQueryToken;
  console.info(`[Google CSE] Initiating Google search for: "${cleanQ}" (token #${currentToken})`);

  // Wait for CSE initialization
  await ensureCseLoaded();

  return new Promise((resolve) => {
    let resolved = false;
    let pollInterval: any = null;
    let observer: MutationObserver | null = null;
    let timeoutId: any = null;

    const cleanup = () => {
      if (pollInterval) clearInterval(pollInterval);
      if (timeoutId) clearTimeout(timeoutId);
      if (observer) observer.disconnect();
      cseResultCallbacks.delete(handleCseResults);
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
        console.info(`[Google CSE] Successfully resolved 1st organic result for "${cleanQ}": ${resultUrl}`);
      } else {
        console.warn(`[Google CSE] No organic result found for "${cleanQ}"`);
      }
      resolve(resultUrl);
    };

    // 1. Listen for results from Google's native search callbacks
    const handleCseResults = (results: any[], searchQ?: string) => {
      if (resolved || !results || !Array.isArray(results) || results.length === 0) return;
      for (let i = 0; i < results.length; i++) {
        const item = results[i];
        const targetUrl = item.url || item.unescapedUrl || (item.richSnippet?.cseImage?.src ? item.url : null);
        if (targetUrl && isAllowedOrganicUrl(targetUrl)) {
          console.info(`[Google CSE Native Listener] Result [${i}]:`, targetUrl);
          finish(targetUrl);
          return;
        }
      }
    };

    cseResultCallbacks.add(handleCseResults);

    // 2. Trigger search execution
    try {
      const g = (window as any).google?.search?.cse?.element;
      if (g) {
        const namedEl = g.getElement("yoouz_search") || (g.getAllElements && Object.values(g.getAllElements())[0]);
        if (namedEl && typeof namedEl.execute === "function") {
          namedEl.execute(cleanQ);
        }
      }
    } catch (e) {
      console.warn("[Google CSE] execute error:", e);
    }

    // Secondary trigger: Fill the hidden search input and submit
    const container = document.getElementById("yoouz-hidden-cse-container");
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

      // 3. MutationObserver for instant sub-millisecond response when Google updates the DOM
      try {
        observer = new MutationObserver(() => {
          if (resolved) return;
          const candidateAnchors = container.querySelectorAll("a.gs-title, .gsc-resultsRoot a, .gsc-webResult a, a[data-ctorig]");
          for (let i = 0; i < candidateAnchors.length; i++) {
            const anchor = candidateAnchors[i] as HTMLAnchorElement;
            const isAd = anchor.closest(".gsc-adBlock, .gsc-adBlockVertical, .gsc-adsArea, .gsc-promotion");
            if (isAd) continue;

            const rawHref = extractTargetUrl(anchor);
            if (rawHref && isAllowedOrganicUrl(rawHref)) {
              console.info(`[Google CSE DOM Observer] Extracted:`, rawHref);
              finish(rawHref);
              return;
            }
          }
        });
        observer.observe(container, { childList: true, subtree: true, attributes: true });
      } catch (err) {}
    }

    // 4. Polling backup
    const startTime = Date.now();
    pollInterval = setInterval(() => {
      if (resolved) {
        cleanup();
        return;
      }

      const candidateAnchors = document.querySelectorAll(
        "#yoouz-hidden-cse-container a.gs-title, #yoouz-hidden-cse-container .gsc-webResult a, .gsc-resultsRoot a.gs-title, a[data-ctorig]"
      );

      if (candidateAnchors && candidateAnchors.length > 0) {
        for (let i = 0; i < candidateAnchors.length; i++) {
          const anchor = candidateAnchors[i] as HTMLAnchorElement;
          const isAd = anchor.closest(".gsc-adBlock, .gsc-adBlockVertical, .gsc-adsArea, .gsc-promotion");
          if (isAd) continue;

          const rawHref = extractTargetUrl(anchor);
          if (rawHref && isAllowedOrganicUrl(rawHref)) {
            finish(rawHref);
            return;
          }
        }
      }

      const visibleUrls = document.querySelectorAll("#yoouz-hidden-cse-container .gs-visibleUrl, .gsc-resultsRoot .gs-visibleUrl");
      if (visibleUrls && visibleUrls.length > 0) {
        for (let i = 0; i < visibleUrls.length; i++) {
          const text = (visibleUrls[i].textContent || "").trim();
          if (text && text.includes(".") && !text.includes(" ")) {
            const candidateUrl = text.startsWith("http") ? text : `https://${text}`;
            if (isAllowedOrganicUrl(candidateUrl)) {
              finish(candidateUrl);
              return;
            }
          }
        }
      }
    }, 60);

    // 5. Max timeout of 3.5s
    timeoutId = setTimeout(() => {
      finish(null);
    }, 3500);
  });
}
