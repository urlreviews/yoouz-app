/**
 * Yoouz Enterprise - Google Custom Search Engine (CSE) Client-Side Search Bridge
 * 
 * Runs client-side in the user's browser to execute official Google CSE queries.
 * Intelligently prioritizes authentic official business websites over directory scrapers,
 * aggregators, social networks, and Wikipedia.
 */

export const DISALLOWED_SEARCH_DOMAINS = [
  // Wikis & Search engines
  "wikipedia.org", "wikimedia.org", "wiktionary.org",
  "google.com", "google.co.il", "google.co.uk", "google.ca", "google.de", "google.fr", "google.it", "google.es", "google.nl", "google.be", "google.ch", "google.at", "google.pl", "google.co.jp", "google.co.in", "google.ae",
  "news.google.com", "news.google.co.il", "news.google.co.uk", "news.google.ca", "news.google.de", "news.google.fr",
  "duckduckgo.com", "bing.com", "yahoo.com", "yandex.com", "baidu.com", "search.com", "ask.com",
  "youtube.com", "youtu.be", "vimeo.com", "dailymotion.com",

  // Social networks
  "facebook.com", "instagram.com", "twitter.com", "x.com", "linkedin.com", "tiktok.com", "pinterest.com", "snapchat.com",

  // Business directories & Aggregators (Global, US, UK, EU, Israeli, UAE)
  "bestprosintown.com", "findglocal.com", "birdeye.com", "buildzoom.com", "porch.com", "angi.com", "angieslist.com",
  "thumbtack.com", "houzz.com", "homeadvisor.com", "expertise.com", "bark.com", "usplaces.com", "yellowbook.com",
  "localdatabase.com", "patch.com", "yellowbot.com", "citysearch.com", "ezlocal.com", "merchantcircle.com",
  "topratedlocal.com", "cylex.us", "cylex.com", "cylex-israel.com", "cylex-bedrijvensgids.be", "cylex-uk.co.uk",
  "hotfrog.com", "showmelocal.com", "local.com", "kudzu.com", "bizwiki.com", "manta.com", "opengovus.com",
  "alignable.com", "nextdoor.com", "trustpilot.com", "sitejabber.com", "provenexpert.com", "bbb.org", "dnb.com", "dnb.co.il",
  "hakkolasakim.com", "din.co.il", "d.co.il", "checkid.co.il", "guidestar.org.il", "myleague.co.il", 
  "top10.co.il", "opentenders.co.il", "bhol.co.il", "zap.co.il", "t.co.il", "b144.co.il", "index.co.il", 
  "asakim.co.il", "israelbusiness.co.il", "bizpages.org", "find-open.com", "find-open.co.il", "infobel.com", "infobel.ae", 
  "chamber.org.il", "duns100.co.il", "yelp.com", "tripadvisor.com", "foursquare.com", "yellowpages.com", "yellowpages.ae", 
  "yellowpages.ca", "yell.com", "whitepages.com", "superpages.com", "dexknows.com", "zocdoc.com", "glassdoor.com", "indeed.com",
  
  // Legal directories
  "lawyer-il.co.il", "lawyers.org.il", "israelbar.org.il", "psakdin.co.il", "rasham.co.il", "lawyer.co.il",
  "legaladviceme.com", "findlaw.com", "lawyers.com", "justia.com", "martindale.com", "hg.org", "avvo.com", 
  "superlawyers.com", "legal500.com", "chambers.com", "bestlawyers.com", "lawyer.com", "usnews.com",

  // Review portals & B2B directories
  "clutch.co", "goodfirms.co", "zoominfo.com", "crunchbase.com", "pitchbook.com", "apollo.io", "lusha.com", "owler.com", "craft.co",
  "dubaibizdirectory.com", "chamberofcommerce.com", "mapquest.com", "waze.com", "kompass.com", "europages.com",
  "opencorporates.com", "corporationwiki.com", "companieshouse.gov.uk", "sunbiz.org", "bizapedia.com",
  "localemirates.com", "2gis.ae", "2gis.com", "yalwa.ae", "yalwa.com", "cybo.com", "tuugo.ae", "tuugo.com", "yello.ae", "b2bhint.com",

  // News portals
  "themarker.com", "calcalist.co.il", "ynet.co.il", "mako.co.il", "haaretz.co.il", "globes.co.il", "maariv.co.il", "walla.co.il",

  // Ad networks & Platforms
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

  const isDisallowed = DISALLOWED_SEARCH_DOMAINS.some(b => domain === b || domain.endsWith("." + b) || domain.includes(b));
  if (isDisallowed) return false;

  return true;
}

/**
 * Scores a candidate URL against the search query to identify the official business domain
 */
export function scoreCandidateUrl(url: string, query: string): number {
  if (!url || !isAllowedOrganicUrl(url)) return -1000;
  
  let score = 50;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch (e) {
    return -1000;
  }

  const hostname = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  const domainRoot = hostname.split(".")[0];
  const pathname = parsed.pathname.toLowerCase();

  // Disallow directory path patterns immediately
  if (
    pathname.includes("/ca/") ||
    pathname.includes("/us/") ||
    pathname.includes("/uk/") ||
    pathname.includes("/ny/") ||
    pathname.includes("/fl/") ||
    pathname.includes("/tx/") ||
    pathname.includes("/city/") ||
    pathname.includes("/location/") ||
    pathname.includes("/lawyers/") ||
    pathname.includes("/attorneys/") ||
    pathname.includes("/profile/") ||
    pathname.includes("/listing/") ||
    pathname.includes("/business/") ||
    pathname.includes("/company/") ||
    pathname.includes("/biz/") ||
    pathname.includes("/pros/") ||
    pathname.includes("/contractors/") ||
    pathname.includes("/plumbers/") ||
    pathname.includes("/reviews/") ||
    pathname.includes("-077-") ||
    pathname.includes("-03-") ||
    pathname.includes("-05") ||
    /\d{7,}/.test(pathname)
  ) {
    // If hostname doesn't match the brand keywords, this is 100% an aggregator profile
    score -= 800;
  }

  // 1. Extract core brand keywords (filter out generic category words & locations)
  const genericWords = new Set([
    "and", "the", "in", "at", "of", "for", "group", "services", "service", "ltd", "inc", "llc", "corp", "co",
    "plumber", "plumbers", "plumbing", "contractor", "contractors", "electrician", "electricians", "cleaners",
    "lawyer", "lawyers", "law", "firm", "attorney", "attorneys", "dentist", "dentists", "dental",
    "doctor", "doctors", "clinic", "hospital", "hotel", "hotels", "motel", "resort",
    "san", "diego", "los", "angeles", "new", "york", "chicago", "houston", "london", "paris", "dubai", "tel", "aviv",
    "משרד", "עורך", "דין", "עורכי", "נוטריון", "משפטים", "עסקים", "ישראל", "תל", "אביב", "ירושלים", "חיפה"
  ]);

  const allQueryWords = query
    .toLowerCase()
    .replace(/[^a-z0-9\u0590-\u05FF\u0600-\u06FF\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length >= 2);

  const brandWords = allQueryWords.filter(w => w.length >= 3 && !genericWords.has(w));
  const wordsToMatch = brandWords.length > 0 ? brandWords : allQueryWords.filter(w => w.length >= 3);

  let matchedBrandWords = 0;
  for (const word of wordsToMatch) {
    if (hostname.includes(word) || domainRoot.includes(word)) {
      matchedBrandWords++;
      score += 250; // High reward for matching brand keyword in domain
    }
  }

  // Exact brand compound match (e.g. "eliterooter" in "eliterootersocal.com" or "thcgent" in "thcgent.be")
  if (wordsToMatch.length >= 2) {
    const combinedBrand = wordsToMatch.join("");
    if (hostname.includes(combinedBrand)) {
      score += 400;
    }
  }

  // If none of the brand words matched in the hostname, heavily penalize non-root domains
  if (wordsToMatch.length > 0 && matchedBrandWords === 0) {
    score -= 400;
  }

  // 2. Root domain vs deep directory path
  if (pathname === "/" || pathname === "" || pathname.split("/").filter(Boolean).length <= 1) {
    score += 60; // Clean homepage / root domain
  } else {
    score -= 100;
  }

  return score;
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
 * Queries Google CSE client-side and resolves with the authentic official business URL
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
    const candidates = new Set<string>();

    const cleanup = () => {
      if (pollInterval) clearInterval(pollInterval);
      if (timeoutId) clearTimeout(timeoutId);
      if (observer) observer.disconnect();
      cseResultCallbacks.delete(handleCseResults);
    };

    const finishWithBestCandidate = () => {
      if (resolved) return;
      resolved = true;
      cleanup();

      const candidateList = Array.from(candidates);
      if (candidateList.length === 0) {
        resolve(null);
        return;
      }

      // Sort candidate URLs by relevance score
      candidateList.sort((a, b) => scoreCandidateUrl(b, cleanQ) - scoreCandidateUrl(a, cleanQ));
      const best = candidateList[0];
      const bestScore = scoreCandidateUrl(best, cleanQ);

      if (bestScore >= 50) {
        console.info(`[Google CSE] Selected best authentic URL (score ${bestScore}): ${best}`);
        resolve(best);
      } else {
        console.warn(`[Google CSE] Highest candidate scored below confidence threshold (${bestScore}): ${best}. Rejecting directory/unmatched results.`);
        resolve(null);
      }
    };

    // 1. Listen for results from Google's native search callbacks
    const handleCseResults = (results: any[]) => {
      if (resolved || !results || !Array.isArray(results) || results.length === 0) return;
      for (let i = 0; i < results.length; i++) {
        const item = results[i];
        const targetUrl = item.url || item.unescapedUrl || (item.richSnippet?.cseImage?.src ? item.url : null);
        if (targetUrl && isAllowedOrganicUrl(targetUrl)) {
          candidates.add(targetUrl);
          // If this URL is an exact brand match, finish immediately!
          if (scoreCandidateUrl(targetUrl, cleanQ) >= 150) {
            finishWithBestCandidate();
            return;
          }
        }
      }

      if (candidates.size > 0) {
        // Allow tiny 150ms buffer to collect any additional anchors, then finish
        setTimeout(finishWithBestCandidate, 150);
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

      // 3. MutationObserver for DOM updates
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
              candidates.add(rawHref);
              if (scoreCandidateUrl(rawHref, cleanQ) >= 150) {
                finishWithBestCandidate();
                return;
              }
            }
          }
        });
        observer.observe(container, { childList: true, subtree: true, attributes: true });
      } catch (err) {}
    }

    // 4. Polling backup
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
            candidates.add(rawHref);
            if (scoreCandidateUrl(rawHref, cleanQ) >= 150) {
              finishWithBestCandidate();
              return;
            }
          }
        }
      }

      if (candidates.size > 0) {
        finishWithBestCandidate();
      }
    }, 100);

    // 5. Max timeout
    timeoutId = setTimeout(() => {
      finishWithBestCandidate();
    }, 3500);
  });
}
