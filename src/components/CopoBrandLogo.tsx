import React, { useState, useMemo, useEffect } from "react";
import { Building2 } from "lucide-react";
import { extractDomain, KNOWN_BRAND_LOGOS, getProxiedImageUrl, isFaviconUrl, isGenericOrPlaceholderLogo, isBadBanner, isWhiteOrInvertedLogo, isCrossBrandPortfolioLogo, checkImageNeedsDarkContrast } from "../utils/logoUtils";
import { isValidDomainUrl, formatBusinessName } from "../utils/placeUtils";

interface CopoBrandLogoProps {
  domain?: string | null;
  name?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  className?: string;
  imageClassName?: string;
  fallbackTextClassName?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
  onLoad?: () => void;
  onError?: () => void;
}

// Global in-memory cache to lock verified brand logos across browser transitions
const KNOWN_LOADED_LOGOS = new Set<string>();
const LOCKED_DOMAIN_LOGOS = new Map<string, string>();

export const CopoBrandLogo: React.FC<CopoBrandLogoProps> = ({
  domain,
  name,
  website,
  logoUrl,
  bannerUrl,
  className = "w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white overflow-hidden flex items-center justify-center p-1 sm:p-1.5 z-30",
  imageClassName = "w-full h-full object-contain rounded-xl",
  fallbackTextClassName,
  loading = "eager",
  fetchPriority = "high",
  onLoad,
  onError
}) => {
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [needsDarkContrast, setNeedsDarkContrast] = useState(false);
  const prevDomainRef = React.useRef<string>("");
  const failedUrlsRef = React.useRef<Set<string>>(new Set());
  const imgRef = React.useRef<HTMLImageElement | null>(null);

  // Clean domain extraction
  const resolvedDomain = useMemo(() => {
    if (domain && isValidDomainUrl(domain)) return extractDomain(domain);
    if (website && isValidDomainUrl(website)) return extractDomain(website);
    if (logoUrl && isValidDomainUrl(logoUrl) && !logoUrl.includes("brandfetch")) return extractDomain(logoUrl);
    if (name && isValidDomainUrl(name)) return extractDomain(name);
    return null;
  }, [domain, website, logoUrl, name]);

  const cleanDomain = useMemo(() => {
    return (resolvedDomain || "").replace(/^www\./, "").toLowerCase().trim();
  }, [resolvedDomain]);

  // Reset failed URLs and loadedSrc ONLY when switching to a different business domain
  const domainIdentity = cleanDomain || (name || "").toLowerCase().trim();
  if (prevDomainRef.current !== domainIdentity) {
    prevDomainRef.current = domainIdentity;
    failedUrlsRef.current.clear();
  }

  // Is Yoouz
  const isYoouz = useMemo(() => {
    const cd = cleanDomain;
    const cn = (name || "").toLowerCase().trim();
    const cl = (logoUrl || "").toLowerCase().trim();
    const cw = (website || "").toLowerCase().trim();
    return (
      cd === "yoouz.com" ||
      cd === "yoouz" ||
      cd.includes("yoouz") ||
      cn === "yoouz" ||
      cn === "yoouz.com" ||
      cn.includes("yoouz") ||
      cl.includes("yoouz") ||
      cl === "/favicon.svg" ||
      cl.includes("yoouz.com/favicon.svg") ||
      cw.includes("yoouz.com")
    );
  }, [cleanDomain, name, logoUrl, website]);

  // Build candidate fallback array for authentic brand logos
  const candidateUrls = useMemo(() => {
    if (isYoouz) return ["/favicon.svg"];

    const candidates: string[] = [];

    const isBrokenSvg = (u?: string | null) => Boolean(u && (u.includes("lg%3Ahidden") || u.includes("lg:hidden") || isWhiteOrInvertedLogo(u) || isCrossBrandPortfolioLogo(u, cleanDomain)));
    const proxiedBannerUrl = bannerUrl ? getProxiedImageUrl(bannerUrl) : null;
    const isSameAsBanner = (u?: string | null): boolean => {
      if (!u || !bannerUrl) return false;
      return u === bannerUrl || u === proxiedBannerUrl || getProxiedImageUrl(u) === proxiedBannerUrl;
    };

    // 0. Direct match for verified high-resolution vector brand logos takes absolute precedence!
    if (cleanDomain) {
      const strippedDomain = cleanDomain.replace(/^www\./, "");
      if (KNOWN_BRAND_LOGOS[cleanDomain] && !isGenericOrPlaceholderLogo(KNOWN_BRAND_LOGOS[cleanDomain])) {
        const proxiedKnown = getProxiedImageUrl(KNOWN_BRAND_LOGOS[cleanDomain]);
        if (proxiedKnown) candidates.push(proxiedKnown);
        candidates.push(KNOWN_BRAND_LOGOS[cleanDomain]);
      } else if (KNOWN_BRAND_LOGOS[strippedDomain] && !isGenericOrPlaceholderLogo(KNOWN_BRAND_LOGOS[strippedDomain])) {
        const proxiedKnown = getProxiedImageUrl(KNOWN_BRAND_LOGOS[strippedDomain]);
        if (proxiedKnown) candidates.push(proxiedKnown);
        candidates.push(KNOWN_BRAND_LOGOS[strippedDomain]);
      }
    }

    // 1. Explicit rich standalone brand logo URL from place data/metadata (must not be a duplicate of bannerUrl or low-res icon)
    const isLowResFavicon = Boolean(logoUrl && (isFaviconUrl(logoUrl) || logoUrl.includes("/api/favicon") || logoUrl.includes("duckduckgo.com/ip3") || logoUrl.includes("icons.duckduckgo.com")));

    if (
      logoUrl &&
      logoUrl.trim() !== "" &&
      !isSameAsBanner(logoUrl) &&
      !isGenericOrPlaceholderLogo(logoUrl) &&
      !isBrokenSvg(logoUrl) &&
      !isLowResFavicon
    ) {
      const proxiedLogo = getProxiedImageUrl(logoUrl);
      if (proxiedLogo) candidates.push(proxiedLogo);
      if (logoUrl !== proxiedLogo) candidates.push(logoUrl);
    }

    // 2. Locked verified authentic standalone brand logo from previous successful load (excluding banner copies)
    if (cleanDomain && LOCKED_DOMAIN_LOGOS.has(cleanDomain)) {
      const locked = LOCKED_DOMAIN_LOGOS.get(cleanDomain)!;
      if (!isSameAsBanner(locked) && !isGenericOrPlaceholderLogo(locked) && !isBrokenSvg(locked) && !locked.includes("/api/favicon")) {
        candidates.push(locked);
      }
    }

    // 3. Live website official logo & favicon extractor (/api/favicon scrapes the official website logo first, and falls back to the website's clean favicon — NEVER the banner)
    if (cleanDomain && cleanDomain.includes(".")) {
      candidates.push(`/api/favicon?domain=${encodeURIComponent(cleanDomain)}`);
    }

    // 4. Fallback explicit logoUrl if it was a favicon or icon (and not a banner copy)
    if (
      logoUrl &&
      logoUrl.trim() !== "" &&
      !isSameAsBanner(logoUrl) &&
      !isGenericOrPlaceholderLogo(logoUrl) &&
      !isBrokenSvg(logoUrl)
    ) {
      const proxiedLogo = getProxiedImageUrl(logoUrl);
      if (proxiedLogo && !candidates.includes(proxiedLogo)) candidates.push(proxiedLogo);
      if (logoUrl !== proxiedLogo && !candidates.includes(logoUrl)) candidates.push(logoUrl);
    }

    // 5. High-resolution 256px favicon fallback (never use the banner image inside the logo box)
    if (cleanDomain && cleanDomain.includes(".")) {
      const gstaticFavicon = `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${encodeURIComponent(cleanDomain)}&size=256`;
      const googleFavicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(cleanDomain)}&sz=256`;
      if (!candidates.includes(gstaticFavicon)) candidates.push(gstaticFavicon);
      if (!candidates.includes(googleFavicon)) candidates.push(googleFavicon);
    }

    // Filter duplicates, generic placeholders, and URLs that already failed for this domain
    return Array.from(new Set(candidates.filter(u => u && !isSameAsBanner(u) && !isGenericOrPlaceholderLogo(u) && !isBrokenSvg(u) && !failedUrlsRef.current.has(u))));
  }, [isYoouz, cleanDomain, logoUrl, bannerUrl]);

  // Current src candidate
  const currentSrc = candidateUrls[candidateIdx] || candidateUrls[0] || null;

  // Always render the full-frame logo with object-contain so logos look bold, prestigious, and fill the container cleanly
  const activeImageClass = imageClassName;
  const loadedImageClass = imageClassName;

  // Reset state when switching to a different business domain
  useEffect(() => {
    const locked = cleanDomain ? LOCKED_DOMAIN_LOGOS.get(cleanDomain) : null;
    setCandidateIdx(0);
    if (locked && !failedUrlsRef.current.has(locked)) {
      setLoadedSrc(locked);
      setImgLoaded(true);
    } else {
      setLoadedSrc(null);
      setImgLoaded(false);
    }
  }, [domainIdentity, cleanDomain]);

  // When logoUrl updates for the SAME domain, try the new primary candidate without blanking out loadedSrc
  const primaryCandidate = candidateUrls[0] || null;
  useEffect(() => {
    if (!primaryCandidate) return;
    if (primaryCandidate === loadedSrc) {
      setCandidateIdx(0);
      setImgLoaded(true);
      return;
    }
    if (!failedUrlsRef.current.has(primaryCandidate)) {
      setCandidateIdx(0);
      // Only clear imgLoaded if we don't already have a verified loadedSrc to display
      if (!loadedSrc) {
        setImgLoaded(false);
      }
    }
  }, [primaryCandidate, loadedSrc]);

  // Helper to verify loaded image dimensions:
  // - Rejects 1x1 transparent proxy fallback pixels
  // - Accepts SVGs, standard square logos, horizontal/vertical wordmark logos, and clean website favicons (>= 16x16)
  const isAcceptableLogoDimensions = (w: number, h: number, src: string): boolean => {
    if (w <= 1 || h <= 1) return false;
    const isSvg = Boolean(src.includes(".svg") || src.startsWith("data:image/svg") || src.includes("image/svg+xml") || src.includes("/api/brand-logo"));
    if (isSvg) return true;
    if (w >= 48 && h >= 48) return true;
    if (Math.max(w, h) >= 64 && Math.min(w, h) >= 12) return true;
    if (w >= 16 && h >= 16) return true;
    return false;
  };

  // Synchronously handle images that are already complete in browser memory cache
  useEffect(() => {
    const img = imgRef.current;
    if (img && currentSrc && img.complete && img.naturalWidth > 0) {
      if (isAcceptableLogoDimensions(img.naturalWidth, img.naturalHeight, currentSrc)) {
        const darkNeeded = checkImageNeedsDarkContrast(img, currentSrc);
        setNeedsDarkContrast(darkNeeded);
        KNOWN_LOADED_LOGOS.add(currentSrc);
        if (cleanDomain && !currentSrc.includes("/api/favicon") && !currentSrc.includes("google.com/s2/favicons")) {
          LOCKED_DOMAIN_LOGOS.set(cleanDomain, currentSrc);
        }
        setLoadedSrc(currentSrc);
        setImgLoaded(true);
        onLoad?.();
      }
    }
  }, [currentSrc, cleanDomain, candidateIdx, candidateUrls.length, onLoad]);

  // Dedicated Yoouz emblem
  if (isYoouz) {
    const isFullRound = Boolean(className?.includes("rounded-full"));
    const shapeRadius = isFullRound ? "rounded-full" : (className?.includes("rounded-2xl") ? "rounded-2xl" : "rounded-xl");
    const cleanCls = className
      ? className
          .replace(/\bbg-\S+/g, "")
          .replace(/\bp-\S+/g, "")
          .replace(/\bborder-\S+/g, "")
      : "";
    return (
      <div
        className={`relative flex items-center justify-center ${shapeRadius} bg-zinc-950 border border-white/20 shadow-sm shrink-0 overflow-hidden [print-color-adjust:exact] [-webkit-print-color-adjust:exact] print:bg-zinc-950 print:border-zinc-800 ${cleanCls}`}
        id="copo-brand-logo-yoouz"
      >
        <svg viewBox="0 0 24 24" className="w-full h-full p-[14%] fill-white print:fill-white [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
          <path d="M12 3.8l2.32 4.7 5.18 0.75-3.75 3.65 0.88 5.16L12 15.62l-4.63 2.44 0.88-5.16-3.75-3.65 5.18-0.75L12 3.8z" fill="#ffffff" />
        </svg>
      </div>
    );
  }

  // Display Name / Domain Title for wordmark fallback
  const displayName = (name || cleanDomain || "Business").trim();
  const brandInitial = (displayName.replace(/^(https?:\/\/)?(www\.)?/, "").charAt(0) || "B").toUpperCase();
  const hasVisibleLogo = Boolean(imgLoaded || loadedSrc);
  const contrastFilterClass = needsDarkContrast ? "brightness-[0.08]" : "";

  return (
    <div className={`relative overflow-hidden bg-transparent [print-color-adjust:exact] [-webkit-print-color-adjust:exact] ${className}`}>
      {/* Keep the last verified loaded logo visible on screen while any updated candidate loads so the logo never flashes empty */}
      {loadedSrc && loadedSrc !== currentSrc ? (
        <img
          src={loadedSrc}
          alt={displayName}
          className={`${loadedImageClass} ${contrastFilterClass} absolute inset-0 z-10 w-full h-full opacity-100 [print-color-adjust:exact] [-webkit-print-color-adjust:exact]`}
          referrerPolicy="no-referrer"
        />
      ) : null}
      {currentSrc && candidateIdx < candidateUrls.length ? (
        <img
          ref={imgRef}
          key={currentSrc}
          src={currentSrc}
          alt={displayName}
          loading={loading}
          fetchPriority={fetchPriority}
          decoding="async"
          className={`${activeImageClass} ${contrastFilterClass} relative z-20 w-full h-full transition-opacity duration-200 [print-color-adjust:exact] [-webkit-print-color-adjust:exact] ${
            currentSrc === loadedSrc || (imgLoaded && !loadedSrc) ? "opacity-100" : "opacity-0"
          }`}
          referrerPolicy="no-referrer"
          onLoad={(e) => {
            const img = e.currentTarget;
            if (!currentSrc || !isAcceptableLogoDimensions(img.naturalWidth, img.naturalHeight, currentSrc)) {
              if (currentSrc) failedUrlsRef.current.add(currentSrc);
              setCandidateIdx((prev) => {
                const next = prev + 1;
                if (next >= candidateUrls.length && !loadedSrc) onError?.();
                return next;
              });
              return;
            }
            const darkNeeded = checkImageNeedsDarkContrast(img, currentSrc);
            setNeedsDarkContrast(darkNeeded);
            if (currentSrc) {
              KNOWN_LOADED_LOGOS.add(currentSrc);
              if (cleanDomain && !currentSrc.includes("/api/favicon") && !currentSrc.includes("google.com/s2/favicons")) {
                LOCKED_DOMAIN_LOGOS.set(cleanDomain, currentSrc);
              }
              setLoadedSrc(currentSrc);
            }
            setImgLoaded(true);
            onLoad?.();
          }}
          onError={() => {
            if (currentSrc) failedUrlsRef.current.add(currentSrc);
            setCandidateIdx((prev) => {
              const next = prev + 1;
              if (next >= candidateUrls.length && !loadedSrc) onError?.();
              return next;
            });
          }}
        />
      ) : null}
      {/* Fallback skeleton or initial - never flash fake black B while image is loading */}
      {!hasVisibleLogo && (
        <div className={`absolute inset-0 flex items-center justify-center ${currentSrc && candidateIdx < candidateUrls.length ? "z-0" : "z-10"}`}>
          {currentSrc && candidateIdx < candidateUrls.length ? (
            <div className="w-full h-full bg-zinc-800/20 animate-pulse rounded-xl" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-800/40 text-zinc-400 font-bold select-none">
              <span className={fallbackTextClassName || "text-zinc-300 tracking-wider"}>{brandInitial}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
