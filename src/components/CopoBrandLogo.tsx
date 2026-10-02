import React, { useState, useMemo, useEffect } from "react";
import { extractDomain, KNOWN_BRAND_LOGOS, getProxiedImageUrl, isFaviconUrl } from "../utils/logoUtils";
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

  // Build candidate fallback array for authentic brand logos (NO fake text monograms)
  const candidateUrls = useMemo(() => {
    if (isYoouz) return ["/favicon.svg"];

    const candidates: string[] = [];

    // 0. Locked verified domain logo from previous successful load
    if (cleanDomain && LOCKED_DOMAIN_LOGOS.has(cleanDomain)) {
      candidates.push(LOCKED_DOMAIN_LOGOS.get(cleanDomain)!);
    }

    // 1. Direct match in KNOWN_BRAND_LOGOS
    if (cleanDomain && KNOWN_BRAND_LOGOS[cleanDomain]) {
      candidates.push(KNOWN_BRAND_LOGOS[cleanDomain]);
    }

    // 2. Explicit custom logo URL from place data/metadata
    if (
      logoUrl &&
      logoUrl.trim() !== "" &&
      logoUrl !== "data:;" &&
      !logoUrl.startsWith("data:;") &&
      !logoUrl.includes("tap/0.png") &&
      !logoUrl.includes("icons/tap")
    ) {
      candidates.push(logoUrl);
    }

    // 3. Google High-Res 256px Brand Icon
    if (cleanDomain && cleanDomain.includes(".")) {
      candidates.push(`https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${cleanDomain}&size=256`);
      candidates.push(`https://logo.clearbit.com/${cleanDomain}`);
      candidates.push(`https://icons.duckduckgo.com/ip3/${cleanDomain}.ico`);
    }

    // Filter duplicates & proxy non-data URLs
    const unique = Array.from(new Set(candidates.filter(Boolean)));
    return unique.map((u) => getProxiedImageUrl(u));
  }, [isYoouz, cleanDomain, logoUrl]);

  // Current src candidate
  const currentSrc = candidateUrls[candidateIdx] || candidateUrls[0] || null;

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

  return (
    <div className={`relative overflow-hidden bg-white ${className}`}>
      {currentSrc ? (
        <img
          key={currentSrc}
          src={currentSrc}
          alt={name || cleanDomain || "Business Logo"}
          loading={loading}
          fetchPriority={fetchPriority}
          decoding="async"
          className={`${imageClassName} relative z-10 w-full h-full object-contain transition-opacity duration-150 ${
            imgLoaded ? "opacity-100" : "opacity-90"
          }`}
          referrerPolicy="no-referrer"
          onLoad={() => {
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
            if (candidateIdx + 1 < candidateUrls.length) {
              setCandidateIdx((prev) => prev + 1);
            }
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-white">
          <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0h4" />
          </svg>
        </div>
      )}
    </div>
  );
};
