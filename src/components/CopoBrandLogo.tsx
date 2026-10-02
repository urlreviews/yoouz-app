import React, { useState, useMemo, useEffect } from "react";
import { extractDomain, KNOWN_BRAND_LOGOS, getProxiedImageUrl, isFaviconUrl, isGenericOrPlaceholderLogo } from "../utils/logoUtils";
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
}

// Global in-memory cache to lock verified brand logos across browser transitions
const KNOWN_LOADED_LOGOS = new Set<string>();
const LOCKED_DOMAIN_LOGOS = new Map<string, string>();

export const CopoBrandLogo: React.FC<CopoBrandLogoProps> = ({
  domain,
  name,
  website,
  logoUrl,
  className = "w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white shadow-2xl overflow-hidden flex items-center justify-center p-2 z-30 ring-1 ring-black/10",
  imageClassName = "w-full h-full object-contain rounded-xl",
  loading = "eager",
  fetchPriority = "high",
  onLoad
}) => {
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);

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

  // Is Yoouz
  const isYoouz = useMemo(() => {
    const cd = cleanDomain;
    const cn = (name || "").toLowerCase().trim();
    return cd === "yoouz.com" || cd === "yoouz" || cn === "yoouz" || cn === "yoouz.com";
  }, [cleanDomain, name]);

  // Build candidate fallback array for authentic brand logos
  const candidateUrls = useMemo(() => {
    if (isYoouz) return ["/favicon.svg"];

    const candidates: string[] = [];

    // 0. Locked verified domain logo from previous successful load
    if (cleanDomain && LOCKED_DOMAIN_LOGOS.has(cleanDomain)) {
      const locked = LOCKED_DOMAIN_LOGOS.get(cleanDomain)!;
      if (!isGenericOrPlaceholderLogo(locked)) {
        candidates.push(locked);
      }
    }

    // 1. Direct match in KNOWN_BRAND_LOGOS
    if (cleanDomain && KNOWN_BRAND_LOGOS[cleanDomain]) {
      const known = KNOWN_BRAND_LOGOS[cleanDomain];
      if (!isGenericOrPlaceholderLogo(known)) {
        candidates.push(known);
      }
    }

    // 2. Explicit custom logo URL from place data/metadata (Strictly reject fake or default builder icons)
    if (
      logoUrl &&
      logoUrl.trim() !== "" &&
      !isGenericOrPlaceholderLogo(logoUrl) &&
      !isFaviconUrl(logoUrl)
    ) {
      candidates.push(logoUrl);
    }

    // 3. High-res Google Favicon / domain logo proxy
    if (cleanDomain && cleanDomain.includes(".")) {
      candidates.push(`/api/favicon?domain=${encodeURIComponent(cleanDomain)}`);
    }

    // Filter duplicates and any generic placeholders
    return Array.from(new Set(candidates.filter(u => u && !isGenericOrPlaceholderLogo(u))));
  }, [isYoouz, cleanDomain, logoUrl]);

  // Current src candidate
  const currentSrc = candidateUrls[candidateIdx] || null;

  // Reset index when domain/logoUrl changes
  useEffect(() => {
    setCandidateIdx(0);
    if (currentSrc && KNOWN_LOADED_LOGOS.has(currentSrc)) {
      setImgLoaded(true);
    } else {
      setImgLoaded(false);
    }
  }, [cleanDomain, logoUrl]);

  // Dedicated Yoouz emblem
  if (isYoouz) {
    return (
      <div className={className} id="copo-brand-logo-yoouz">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={imageClassName}>
          <rect width="24" height="24" rx="6" fill="#09090b" />
          <rect x="0.5" y="0.5" width="23" height="23" rx="5.5" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="0.8" />
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#ffffff" />
        </svg>
      </div>
    );
  }

  // Display Name / Domain Title for wordmark fallback
  const displayName = (name || cleanDomain || "Business").trim();
  const shortTitle = displayName.length > 22 ? displayName.substring(0, 20) + "…" : displayName;

  return (
    <div className={`relative overflow-hidden bg-white ${className}`}>
      {currentSrc && candidateIdx < candidateUrls.length ? (
        <img
          key={currentSrc}
          src={currentSrc}
          alt={displayName}
          loading={loading}
          fetchPriority={fetchPriority}
          decoding="async"
          className={`${imageClassName} relative z-10 w-full h-full object-contain transition-opacity duration-150 ${
            imgLoaded ? "opacity-100" : "opacity-90"
          }`}
          referrerPolicy="no-referrer"
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth <= 1 && img.naturalHeight <= 1) {
              setCandidateIdx((prev) => prev + 1);
              return;
            }
            if (currentSrc) {
              KNOWN_LOADED_LOGOS.add(currentSrc);
              if (cleanDomain && !LOCKED_DOMAIN_LOGOS.has(cleanDomain)) {
                LOCKED_DOMAIN_LOGOS.set(cleanDomain, currentSrc);
              }
            }
            setImgLoaded(true);
            onLoad?.();
          }}
          onError={() => {
            // Cascade to next candidate image URL in the chain if this candidate fails
            setCandidateIdx((prev) => prev + 1);
          }}
        />
      ) : (
        /* Official Brand Wordmark Typography Fallback - Clean, bold, authentic wordmark tile */
        <div className="w-full h-full flex flex-col items-center justify-center bg-white p-2 text-center select-none">
          <span className="font-extrabold text-zinc-950 tracking-tight text-[11px] sm:text-xs uppercase leading-snug line-clamp-2 px-1">
            {formatBusinessName(shortTitle)}
          </span>
        </div>
      )}
    </div>
  );
};
