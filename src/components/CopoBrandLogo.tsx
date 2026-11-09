import React, { useState, useMemo, useEffect } from "react";
import { Building2 } from "lucide-react";
import { extractDomain, KNOWN_BRAND_LOGOS, getProxiedImageUrl, isFaviconUrl, isGenericOrPlaceholderLogo, isBadBanner, isWhiteOrInvertedLogo } from "../utils/logoUtils";
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
  className = "w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white overflow-hidden flex items-center justify-center p-2 z-30",
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

    const isBrokenSvg = (u?: string | null) => Boolean(u && (u.includes("lg%3Ahidden") || u.includes("lg:hidden") || isWhiteOrInvertedLogo(u)));

    // 0. Explicit rich brand logo URL from place data/metadata
    const isLowResFavicon = Boolean(logoUrl && (isFaviconUrl(logoUrl) || logoUrl.includes("/api/favicon")));

    // 0. Explicit rich brand logo URL from place data/metadata (only when NOT a blurry low-res favicon)
    if (
      logoUrl &&
      logoUrl.trim() !== "" &&
      !isGenericOrPlaceholderLogo(logoUrl) &&
      !isBrokenSvg(logoUrl) &&
      !isLowResFavicon
    ) {
      const proxiedLogo = getProxiedImageUrl(logoUrl);
      if (proxiedLogo) candidates.push(proxiedLogo);
      if (logoUrl !== proxiedLogo) candidates.push(logoUrl);
    }

    // 1. Direct match in KNOWN_BRAND_LOGOS
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

    // 2. Locked verified authentic brand logo from previous successful load
    if (cleanDomain && LOCKED_DOMAIN_LOGOS.has(cleanDomain)) {
      const locked = LOCKED_DOMAIN_LOGOS.get(cleanDomain)!;
      if (!isGenericOrPlaceholderLogo(locked) && !isBrokenSvg(locked) && !locked.includes("/api/favicon")) {
        candidates.push(locked);
      }
    }

    // 3. Mutual Fallback Policy: If no standalone logo is available or if the logo fails to load,
    // fall back to the place's authentic banner image so the logo is identical to the banner (never a fake gray monogram).
    if (
      bannerUrl &&
      bannerUrl.trim() !== "" &&
      !isBadBanner(bannerUrl) &&
      !isGenericOrPlaceholderLogo(bannerUrl) &&
      !bannerUrl.includes("/api/brand-banner") &&
      !bannerUrl.includes("/api/favicon")
    ) {
      const proxiedBanner = getProxiedImageUrl(bannerUrl);
      if (proxiedBanner) candidates.push(proxiedBanner);
      if (bannerUrl !== proxiedBanner) candidates.push(bannerUrl);
    }

    // 4. Guaranteed authentic domain favicon/logo proxy
    if (cleanDomain && cleanDomain.includes(".")) {
      candidates.push(`/api/favicon?domain=${encodeURIComponent(cleanDomain)}`);
    }

    // 5. Fallback explicit logoUrl if it was a favicon or icon
    if (
      logoUrl &&
      logoUrl.trim() !== "" &&
      !isGenericOrPlaceholderLogo(logoUrl) &&
      !isBrokenSvg(logoUrl)
    ) {
      const proxiedLogo = getProxiedImageUrl(logoUrl);
      if (proxiedLogo && !candidates.includes(proxiedLogo)) candidates.push(proxiedLogo);
      if (logoUrl !== proxiedLogo && !candidates.includes(logoUrl)) candidates.push(logoUrl);
    }

    // Filter duplicates, generic placeholders, and URLs that already failed for this domain
    return Array.from(new Set(candidates.filter(u => u && !isGenericOrPlaceholderLogo(u) && !isBrokenSvg(u) && !failedUrlsRef.current.has(u))));
  }, [isYoouz, cleanDomain, logoUrl, bannerUrl]);

  // Current src candidate
  const currentSrc = candidateUrls[candidateIdx] || candidateUrls[0] || null;

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

  // When logoUrl or bannerUrl updates for the SAME domain, try the new primary candidate without blanking out loadedSrc
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
  // - Accepts SVGs, standard square logos (>= 48x48), and horizontal/vertical wordmark logos (e.g. 230x23 where max dimension >= 64 and min dimension >= 12)
  const isAcceptableLogoDimensions = (w: number, h: number, src: string, isLastCandidate: boolean): boolean => {
    if (w <= 1 || h <= 1) return false;
    const isSvg = Boolean(src.includes(".svg") || src.startsWith("data:image/svg") || src.includes("image/svg+xml") || src.includes("/api/brand-logo"));
    if (isSvg) return true;
    if (w >= 48 && h >= 48) return true;
    if (Math.max(w, h) >= 64 && Math.min(w, h) >= 12) return true;
    if (isLastCandidate && w >= 16 && h >= 16) return true;
    return false;
  };

  // Synchronously handle images that are already complete in browser memory cache
  useEffect(() => {
    const img = imgRef.current;
    if (img && currentSrc && img.complete && img.naturalWidth > 0) {
      const isLast = candidateIdx + 1 >= candidateUrls.length;
      if (isAcceptableLogoDimensions(img.naturalWidth, img.naturalHeight, currentSrc, isLast)) {
        KNOWN_LOADED_LOGOS.add(currentSrc);
        if (cleanDomain && !currentSrc.includes("/api/favicon")) {
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

  return (
    <div className={`relative overflow-hidden bg-transparent [print-color-adjust:exact] [-webkit-print-color-adjust:exact] ${className}`}>
      {/* Keep the last verified loaded logo visible on screen while any updated candidate loads so the logo never flashes empty */}
      {loadedSrc && loadedSrc !== currentSrc ? (
        <img
          src={loadedSrc}
          alt={displayName}
          className={`${loadedImageClass} absolute inset-0 z-10 w-full h-full opacity-100 [print-color-adjust:exact] [-webkit-print-color-adjust:exact]`}
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
          className={`${activeImageClass} relative z-20 w-full h-full transition-opacity duration-200 [print-color-adjust:exact] [-webkit-print-color-adjust:exact] ${
            currentSrc === loadedSrc || (imgLoaded && !loadedSrc) ? "opacity-100" : "opacity-0"
          }`}
          referrerPolicy="no-referrer"
          onLoad={(e) => {
            const img = e.currentTarget;
            const isLast = candidateIdx + 1 >= candidateUrls.length;
            if (!currentSrc || !isAcceptableLogoDimensions(img.naturalWidth, img.naturalHeight, currentSrc, isLast)) {
              if (currentSrc) failedUrlsRef.current.add(currentSrc);
              setCandidateIdx((prev) => {
                const next = prev + 1;
                if (next >= candidateUrls.length && !loadedSrc) onError?.();
                return next;
              });
              return;
            }
            if (currentSrc) {
              KNOWN_LOADED_LOGOS.add(currentSrc);
              if (cleanDomain && !currentSrc.includes("/api/favicon")) {
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
