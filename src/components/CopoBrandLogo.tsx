import React, { useState, useMemo, useEffect } from "react";
import { extractDomain, KNOWN_BRAND_LOGOS, getProxiedImageUrl } from "../utils/logoUtils";
import { isValidDomainUrl } from "../utils/placeUtils";

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
}

// Global in-memory cache to prevent re-fetching and eliminate flicker during view transitions
const KNOWN_LOADED_LOGOS = new Set<string>();

export const CopoBrandLogo: React.FC<CopoBrandLogoProps> = ({
  domain,
  name,
  website,
  logoUrl,
  bannerUrl,
  className = "w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden flex items-center justify-center p-2 z-30 ring-1 ring-white/10",
  imageClassName = "w-full h-full object-contain rounded-xl [image-rendering:-webkit-optimize-contrast]",
  fallbackTextClassName = "font-black text-2xl sm:text-3xl text-white drop-shadow-sm",
  loading = "lazy",
  fetchPriority = "auto"
}) => {
  const [hasError, setHasError] = useState(false);
  const [triedFaviconFallback, setTriedFaviconFallback] = useState(false);

  // Extract clean domain from any source
  const resolvedDomain = useMemo(() => {
    if (domain && isValidDomainUrl(domain)) return extractDomain(domain);
    if (website && isValidDomainUrl(website)) return extractDomain(website);
    if (logoUrl && !logoUrl.includes("brandfetch.io") && !logoUrl.startsWith("/api/") && isValidDomainUrl(logoUrl)) return extractDomain(logoUrl);
    if (name && isValidDomainUrl(name)) return extractDomain(name);
    return null;
  }, [domain, website, logoUrl, name]);

  // Check if target is Yoouz
  const isYoouz = useMemo(() => {
    const cleanD = (resolvedDomain || "").toLowerCase().trim();
    const cleanN = (typeof name === "string" ? name : "").toLowerCase().trim();
    return (
      cleanD === "yoouz.com" ||
      cleanD === "www.yoouz.com" ||
      cleanD === "yoouz" ||
      cleanN === "yoouz" ||
      cleanN === "yoouz.com"
    );
  }, [resolvedDomain, name]);

  const googleFaviconUrl = useMemo(() => {
    if (isYoouz) return null;
    if (resolvedDomain && isValidDomainUrl(resolvedDomain)) {
      return `/api/favicon?domain=${resolvedDomain}`;
    }
    return null;
  }, [resolvedDomain, isYoouz]);

  const effectiveSrc = useMemo(() => {
    if (isYoouz) return "/favicon.svg";

    // 0. Known high quality vector/authentic logo by domain ALWAYS takes top priority
    const cleanDomain = (resolvedDomain || "").replace(/^www\./, "").toLowerCase().trim();
    if (cleanDomain && KNOWN_BRAND_LOGOS[cleanDomain]) {
      return getProxiedImageUrl(KNOWN_BRAND_LOGOS[cleanDomain]);
    }
    if (resolvedDomain && KNOWN_BRAND_LOGOS[resolvedDomain]) {
      return getProxiedImageUrl(KNOWN_BRAND_LOGOS[resolvedDomain]);
    }
    const cleanName = (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleanName && KNOWN_BRAND_LOGOS[cleanName]) {
      return getProxiedImageUrl(KNOWN_BRAND_LOGOS[cleanName]);
    }

    // 1. Explicit clean Logo URL from place record or metadata
    if (
      logoUrl &&
      !logoUrl.includes("brandfetch.io") &&
      logoUrl !== "data:;" &&
      !logoUrl.startsWith("data:;") &&
      !logoUrl.includes("LogoHeader") &&
      !logoUrl.includes("1024x170") &&
      !logoUrl.includes("tap/0.png") &&
      !logoUrl.includes("icons/tap") &&
      (logoUrl.startsWith("/") || logoUrl.startsWith("http://") || logoUrl.startsWith("https://") || logoUrl.startsWith("data:image"))
    ) {
      return getProxiedImageUrl(logoUrl);
    }

    // 2. High-resolution authentic favicon endpoint
    if (googleFaviconUrl) {
      return googleFaviconUrl;
    }

    return null;
  }, [isYoouz, resolvedDomain, logoUrl, name, googleFaviconUrl]);

  const currentSrc = useMemo(() => {
    if (isYoouz) return "/favicon.svg";
    if (hasError) return null;
    if (triedFaviconFallback && googleFaviconUrl) {
      return googleFaviconUrl;
    }
    const base = effectiveSrc || googleFaviconUrl;
    if (!base) return null;
    return getProxiedImageUrl(base);
  }, [isYoouz, hasError, triedFaviconFallback, googleFaviconUrl, effectiveSrc]);

  const isKnownLoaded = currentSrc ? KNOWN_LOADED_LOGOS.has(currentSrc) : false;
  const [imgLoaded, setImgLoaded] = useState<boolean>(isKnownLoaded);

  const lastSrcRef = React.useRef<string | null>(null);

  // Reset error & fallback state ONLY when the effective image source actually changes
  useEffect(() => {
    if (currentSrc !== lastSrcRef.current) {
      setHasError(false);
      setTriedFaviconFallback(false);
      
      // If we already have this logo in our global "known loaded" set, don't blink to placeholder
      if (currentSrc && KNOWN_LOADED_LOGOS.has(currentSrc)) {
        setImgLoaded(true);
      } else {
        setImgLoaded(false);
      }
      
      lastSrcRef.current = currentSrc;
    }
  }, [currentSrc, resolvedDomain, logoUrl, name]);

  useEffect(() => {
    if (currentSrc && KNOWN_LOADED_LOGOS.has(currentSrc)) {
      setImgLoaded(true);
    }
  }, [currentSrc]);

  const initialLetter = useMemo(() => {
    const candidate = name || resolvedDomain || "B";
    const clean = candidate.replace(/^(https?:\/\/)?(www\.)?/, "").trim();
    return (clean.charAt(0) || "B").toUpperCase();
  }, [name, resolvedDomain]);

  const initials = useMemo(() => {
    if (!name) return initialLetter;
    const words = name.trim().split(/\s+/).filter(w => !w.toLowerCase().includes("cleaning") && !w.toLowerCase().includes("services") && !w.toLowerCase().includes("inc") && !w.toLowerCase().includes("llc"));
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    return (name.trim().charAt(0) || "B").toUpperCase();
  }, [name, initialLetter]);

  const hasPosition =
    className.includes("absolute") ||
    className.includes("relative") ||
    className.includes("fixed") ||
    className.includes("sticky");
  const hasOverflow = className.includes("overflow-");

  const containerClasses = [
    !hasPosition ? "relative" : "",
    !hasOverflow ? "overflow-hidden" : "",
    className
  ].filter(Boolean).join(" ");

  // Dedicated Yoouz emblem (rendered only after all hooks are declared)
  if (isYoouz) {
    return (
      <div className={className} id="copo-brand-logo-yoouz">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={imageClassName}
          aria-label="Yoouz"
        >
          <rect width="24" height="24" rx="6" fill="#09090b" />
          <rect x="0.5" y="0.5" width="23" height="23" rx="5.5" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="0.8" />
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill="#ffffff"
          />
        </svg>
      </div>
    );
  }

  const isFavicon = !logoUrl || logoUrl.includes("favicon") || logoUrl.includes(".ico");
  const shouldAttemptImage = !hasError && !!currentSrc && !isFavicon;

  return (
    <div className={containerClasses}>
      {/* 1. Universal Premium Minimalist Business Emblem Fallback (Elegant Monogram / Initials on Premium Dark-Zinc Gradient) */}
      {(!shouldAttemptImage || !imgLoaded || hasError) && (
        <div className={`absolute inset-0 w-full h-full flex items-center justify-center select-none bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800/60 rounded-xl ${imageClassName}`}>
          <span className="font-extrabold text-white text-2xl sm:text-4xl tracking-wide select-none uppercase drop-shadow-md">
            {initials}
          </span>
        </div>
      )}

      {/* 2. Primary Brand Logo / Favicon Layer (Crisp, authentic, completely unobstructed on clean canvas) */}
      {shouldAttemptImage && (
        <img
          src={currentSrc}
          alt={name || "Brand Logo"}
          loading={loading}
          fetchPriority={fetchPriority}
          decoding="async"
          className={`${imageClassName} relative z-10 transition-opacity duration-150 ${
            imgLoaded ? "opacity-100" : "opacity-0"
          }`}
          referrerPolicy="no-referrer"
          onLoad={() => {
            if (currentSrc) KNOWN_LOADED_LOGOS.add(currentSrc);
            setImgLoaded(true);
          }}
          onError={() => {
            if (!triedFaviconFallback && googleFaviconUrl && currentSrc !== googleFaviconUrl) {
              setTriedFaviconFallback(true);
              setImgLoaded(false);
            } else {
              setHasError(true);
            }
          }}
        />
      )}
    </div>
  );
};
