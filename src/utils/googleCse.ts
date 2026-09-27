/**
 * Yoouz Enterprise - Google Custom Search Engine (CSE) Client-Side Search Bridge
 * 
 * This module provides a 100% free, unlimited, and client-side Google search query resolution
 * mechanism that runs completely inside the user's browser, bypassing backend API key quotas and rate limits.
 * 
 * Features:
 * - Direct DOM search execution inside a hidden, isolated Google CSE widget container.
 * - Robust client-side load balancing (runs from the user's personal IP).
 * - Multi-layered STRICT AD-FILTERING to guarantee that ad URLs are never scraped.
 */

export async function queryGoogleCseForUrl(query: string): Promise<string | null> {
  const cleanQ = query.trim();
  if (!cleanQ || cleanQ.length < 2) return null;

  console.info(`[Google CSE] Initiating free client-side query resolution for: "${cleanQ}"`);

  // 1. Locate or create the hidden container for the Google CSE widget
  let container = document.getElementById("yoouz-hidden-cse-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "yoouz-hidden-cse-container";
    container.className = "opacity-0 pointer-events-none fixed";
    // Place far off-screen to keep the layout absolutely pristine and beautiful
    container.style.cssText = "top: -9999px; left: -9999px; width: 400px; height: 400px; overflow: hidden; z-index: -9999;";
    
    const searchDiv = document.createElement("div");
    searchDiv.className = "gcse-search";
    
    container.appendChild(searchDiv);
    document.body.appendChild(container);

    // 2. Inject Google CSE Script dynamically if not already loaded
    if (!document.querySelector('script[src*="cse.google.com"]')) {
      console.info("[Google CSE] Injecting Google CSE script...");
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://cse.google.com/cse.js?cx=e41632212e69a4efd";
      document.head.appendChild(script);
    }
  }

  let inputEl: HTMLInputElement | null = null;
  let buttonEl: HTMLElement | null = null;
  const maxWait = 6000; // 6 seconds max element render wait
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
      }, 150);
    });
  };

  try {
    await waitForCseRender();
  } catch (err) {
    console.warn("[Google CSE Error] Interface rendering failed:", err);
    return null;
  }

  if (!inputEl || !buttonEl) return null;

  // 4. Input the search query programmatically and dispatch input/change events
  inputEl.value = cleanQ;
  inputEl.dispatchEvent(new Event("input", { bubbles: true }));
  inputEl.dispatchEvent(new Event("change", { bubbles: true }));

  // 5. Trigger search execution
  buttonEl.click();
  console.info("[Google CSE] Search execution triggered programmatically.");

  // 6. Monitor and wait for organic search results to appear (Strictly skipping Ads)
  return new Promise((resolve) => {
    const checkStartTime = Date.now();
    const resultCheckInterval = setInterval(() => {
      if (!container) {
        clearInterval(resultCheckInterval);
        resolve(null);
        return;
      }

      // Google CSE renders web result components under ".gsc-webResult" or ".gsc-result"
      const results = container.querySelectorAll(".gsc-webResult, .gsc-result");
      if (results && results.length > 0) {
        
        // Loop through candidate elements to find the first 100% organic website link
        for (let i = 0; i < results.length; i++) {
          const resultEl = results[i] as HTMLElement;

          // STRICT AD DETECTION CHECK (Ignore promotional components and ad blocks completely)
          const isAdBlock = 
            resultEl.closest(".gsc-adBlock") || 
            resultEl.closest(".gsc-adBlockVertical") || 
            resultEl.closest(".gsc-adBlockHorizontal") || 
            resultEl.closest(".gsc-adsArea") ||
            resultEl.classList.contains("gsc-adBlock") ||
            resultEl.classList.contains("gsc-promotion") ||
            resultEl.querySelector(".gs-promotion") ||
            resultEl.querySelector("[class*=\"adBlock\"]") ||
            resultEl.querySelector("[class*=\"promotion\"]") ||
            resultEl.innerHTML.toLowerCase().includes("ad-delivery") ||
            resultEl.innerHTML.toLowerCase().includes("doubleclick") ||
            resultEl.innerHTML.toLowerCase().includes("googleadservices");

          if (isAdBlock) {
            console.info("[Google CSE ad-filter] Detected and successfully skipped advertisement container.");
            continue;
          }

          // Fetch the title link anchor which contains the actual destination website
          const titleLink = resultEl.querySelector("a.gs-title") as HTMLAnchorElement;
          if (titleLink) {
            // Google CSE often uses 'data-ctorig' to store the genuine original website URL
            const href = titleLink.getAttribute("data-ctorig") || titleLink.href || "";
            
            if (href && href.startsWith("http")) {
              const lowerHref = href.toLowerCase();

              // Double-check URL to block redirects or search engine redirects
              if (
                !lowerHref.includes("google.com/aclk") && 
                !lowerHref.includes("googleadservices.com") &&
                !lowerHref.includes("doubleclick.net") &&
                !lowerHref.includes("duckduckgo.com") &&
                !lowerHref.includes("yandex.com") &&
                !lowerHref.includes("bing.com")
              ) {
                console.info(`[Google CSE Success] Extracted first organic URL: "${href}"`);
                clearInterval(resultCheckInterval);
                resolve(href);
                return;
              }
            }
          }
        }
      }

      // Fail-safe timeout after 8 seconds of polling
      if (Date.now() - checkStartTime > 8000) {
        console.warn("[Google CSE Timeout] Polling results timed out. No organic URL was extracted.");
        clearInterval(resultCheckInterval);
        resolve(null);
      }
    }, 200);
  });
}
