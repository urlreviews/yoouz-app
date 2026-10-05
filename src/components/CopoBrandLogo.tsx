import React, { useState, useMemo, useEffect } from "react";
import { Building2 } from "lucide-react";
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
  className = "w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white overflow-hidden flex items-center justify-center p-2 z-30",
  imageClassName = "w-full h-full object-contain rounded-xl",
  fallbackTextClassName,
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
      cl.includes("favicon.svg") ||
      cw.includes("yoouz.com")
    );
  }, [cleanDomain, name, logoUrl, website]);

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
    if (cleanDomain) {
      const strippedDomain = cleanDomain.replace(/^www\./, "");
      if (KNOWN_BRAND_LOGOS[cleanDomain] && !isGenericOrPlaceholderLogo(KNOWN_BRAND_LOGOS[cleanDomain])) {
        candidates.push(KNOWN_BRAND_LOGOS[cleanDomain]);
      } else if (KNOWN_BRAND_LOGOS[strippedDomain] && !isGenericOrPlaceholderLogo(KNOWN_BRAND_LOGOS[strippedDomain])) {
        candidates.push(KNOWN_BRAND_LOGOS[strippedDomain]);
      }
    }

    // 2. Explicit custom logo URL from place data/metadata (Strictly reject fake or default builder icons)
    if (
      logoUrl &&
      logoUrl.trim() !== "" &&
      !isGenericOrPlaceholderLogo(logoUrl) &&
      (!isFaviconUrl(logoUrl) || logoUrl.includes("/api/favicon") || logoUrl.includes("favicon.svg"))
    ) {
      candidates.push(logoUrl);
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
    const cleanCls = className
      ? className
          .replace(/\bbg-\S+/g, "")
          .replace(/\bp-\S+/g, "")
          .replace(/\bborder-\S+/g, "")
      : "";
    return (
      <div
        className={`relative flex items-center justify-center rounded-xl bg-zinc-950 border border-white/20 shadow-sm shrink-0 overflow-hidden ${cleanCls}`}
        id="copo-brand-logo-yoouz"
      >
        <svg viewBox="0 0 24 24" className="w-full h-full p-[14%] fill-white">
          <path d="M12 3.8l2.32 4.7 5.18 0.75-3.75 3.65 0.88 5.16L12 15.62l-4.63 2.44 0.88-5.16-3.75-3.65 5.18-0.75L12 3.8z" fill="#ffffff" />
        </svg>
      </div>
    );
  }

  // Display Name / Domain Title for wordmark fallback
  const displayName = (name || cleanDomain || "Business").trim();
  const shortTitle = displayName.length > 22 ? displayName.substring(0, 20) + "…" : displayName;

  return (
    <div className={`relative overflow-hidden bg-transparent ${className}`}>
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
        <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-300">
          {displayName && displayName !== "Business" ? (
            <span className={`font-black uppercase select-none ${fallbackTextClassName || "text-xs text-white"}`}>
              {displayName.charAt(0)}
            </span>
          ) : (
            <Building2 className="w-1/2 h-1/2 opacity-75 text-zinc-400" />
          )}
        </div>
      )}
    </div>
  );
};
