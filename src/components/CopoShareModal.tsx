import React, { useState, useEffect, useRef } from "react";
// Yoouz Share Modal - Authentic iOS/Android Dark Mode Share Sheet System
import { createPortal } from "react-dom";
import {
  X,
  ArrowLeft,
  Facebook,
  Mail,
  Copy,
  Check,
  Share2,
  Flag,
  Code,
  ExternalLink,
  Sparkles,
  Globe,
  MessageSquare,
  Smartphone,
  ChevronRight,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  Bookmark,
  Download,
  ShieldCheck,
  CheckCircle2,
  CheckCircle,
  MapPin,
  Star
} from "lucide-react";
import { VideoReview, UserProfile } from "../types";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { getProxiedImageUrl, KNOWN_BRAND_BANNERS, YOOUZ_LOGO_DATA_URI } from "../utils/logoUtils";
import { extractCleanDomain, formatBusinessName, getPlaceSlug, resolveSafeAuthor, getSafeAvatarUrl } from "../utils/placeUtils";
import { getAvatarColor, generateGoogleLetterAvatarSvg } from "../lib/avatar";
import { useSwipeDownToDismiss } from "../hooks/useSwipeDownToDismiss";
import { triggerHaptic } from "../utils/haptics";
import { useLanguage } from "../i18n/LanguageContext";
import { INITIAL_SEED_VIDEOS } from "../data/seedReviews";

interface CopoShareModalProps {
  // Mode A: General Share
  isOpen?: boolean;
  shareUrl?: string;
  title?: string;
  subtitle?: string;
  logoUrl?: string;
  avatarUrl?: string;
  domain?: string;
  website?: string;
  bannerUrl?: string;
  handle?: string;
  isCreatorProfile?: boolean;
  isBusinessProfile?: boolean;
  rating?: number;
  reviewsCount?: number;
  reviewCount?: number;

  // Mode B: Video Share (Backward Compatibility)
  video?: VideoReview | null;
  currentUser?: UserProfile | null;
  onClose: () => void;
  onOpenReport?: (item?: any) => void;
  onShareIncrement?: (videoId: string, nextSharesCount?: number) => void;
}

export const CopoShareModal: React.FC<CopoShareModalProps> = ({
  isOpen: propIsOpen,
  shareUrl: propShareUrl,
  title: propTitle,
  subtitle: propSubtitle,
  logoUrl: propLogoUrl,
  avatarUrl: propAvatarUrl,
  domain: propDomain,
  website: propWebsite,
  bannerUrl: propBannerUrl,
  handle: propHandle,
  isCreatorProfile: propIsCreatorProfile,
  isBusinessProfile: propIsBusinessProfile,
  rating: propRating,
  reviewsCount: propReviewsCount,
  reviewCount: propReviewCount,
  video,
  currentUser,
  onClose,
  onOpenReport,
  onShareIncrement
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [embedLayout, setEmbedLayout] = useState<"reel" | "card" | "widget">("reel");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active view: "sheet" (authentic iOS/Android share sheet), "apps" (full apps list with search), or "options" (embed & link options)
  const [activeView, setActiveView] = useState<"sheet" | "apps" | "options">("sheet");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Determine modal open state
  const isVideoMode = Boolean(video);
  const isModalOpen = propIsOpen !== undefined ? propIsOpen : isVideoMode;

  // Smooth swipe-to-dismiss hook
  const { dragOffsetY, swipeProps } = useSwipeDownToDismiss({
    onDismiss: onClose,
    threshold: 80
  });

  // Image loading & fallback states
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Unconditional ref hook for share deduplication
  const recordedSharesSet = useRef<Set<string>>(new Set());

  // Reset copied states and view on open
  useEffect(() => {
    if (isModalOpen) {
      setCopied(false);
      setEmbedCopied(false);
      setToastMessage(null);
      setActiveView("sheet");
      setSearchQuery("");
      setImageLoaded(false);
      setImageError(false);
    }
  }, [isModalOpen, video?.id]);

  const [isBookmarked, setIsBookmarked] = useState<boolean>(() => {
    if (!video) return false;
    try {
      const saved = localStorage.getItem("yoouz_bookmarked_reviews") || "[]";
      const list = JSON.parse(saved);
      return Array.isArray(list) && list.includes(video.id);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (video) {
      try {
        const saved = localStorage.getItem("yoouz_bookmarked_reviews") || "[]";
        const list = JSON.parse(saved);
        setIsBookmarked(Array.isArray(list) && list.includes(video.id));
      } catch {
        setIsBookmarked(false);
      }
    }
  }, [video?.id]);

  const handleBookmarkToggle = () => {
    if (!video) {
      triggerHaptic("medium");
      setIsBookmarked(!isBookmarked);
      setToastMessage(isBookmarked ? "Removed from Bookmarks" : "Saved to Bookmarks");
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }
    triggerHaptic("medium");
    const nextVal = !isBookmarked;
    setIsBookmarked(nextVal);
    try {
      const saved = localStorage.getItem("yoouz_bookmarked_reviews") || "[]";
      let list = JSON.parse(saved);
      if (!Array.isArray(list)) list = [];
      if (nextVal) {
        if (!list.includes(video.id)) list.push(video.id);
      } else {
        list = list.filter((id: string) => id !== video.id);
      }
      localStorage.setItem("yoouz_bookmarked_reviews", JSON.stringify(list));
      setToastMessage(nextVal ? "Saved to Bookmarks" : "Removed from Bookmarks");
      setTimeout(() => setToastMessage(null), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        if (activeView !== "sheet") {
          setActiveView("sheet");
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, activeView, onClose]);

  // Derive Canonical Share URL and Metadata
  const appOrigin = typeof window !== "undefined" ? window.location.origin : "https://yoouz.com";

  let shareUrl = "";
  let title = "";
  let subtitle = "";
  let isBusiness = false;
  let resolvedDomain = "";
  let resolvedWebsite = "";
  let resolvedLogoUrl: string | undefined = undefined;
  let resolvedAvatarUrl: string | undefined = undefined;
  let resolvedBannerUrl: string | undefined = undefined;

  let safeAuthor: any = null;
  if (isVideoMode && video) {
    safeAuthor = resolveSafeAuthor(video, currentUser);
    const rawDomain = video.placeWebsite || (video.placeId && video.placeId.includes('.') ? video.placeId : '') || (video.placeName && video.placeName.includes('.') ? video.placeName : '') || video.placeId || video.placeName || "";
    const domainSlug = getPlaceSlug(rawDomain || video);
    shareUrl = `${appOrigin}/review/${encodeURIComponent(domainSlug)}/${encodeURIComponent(video.id)}`;
    const placeName = formatBusinessName(video.placeName || (video.placeId ? extractCleanDomain(video.placeId) : "Business"));
    title = placeName;
    const authorName = safeAuthor?.name || video.author?.name || (video as any)?.authorName || "Verified Reviewer";
    resolvedDomain = extractCleanDomain(rawDomain);
    const authorReviewsCount = (video as any)?.author?.reviewCount || (video as any)?.authorReviewCount || 0;
    const cleanDomain = resolvedDomain || (video.placeWebsite ? extractCleanDomain(video.placeWebsite) : "") || title.toLowerCase();
    subtitle = authorReviewsCount > 0 
      ? `${authorReviewsCount} ${authorReviewsCount === 1 ? 'review' : 'reviews'} • Review for ${cleanDomain}`
      : `Review for ${cleanDomain}`;
    isBusiness = false;
    resolvedAvatarUrl = safeAuthor?.avatar || video.author?.avatar || (video as any)?.authorAvatar;
    resolvedWebsite = video.placeWebsite || "";
    resolvedLogoUrl = video.placeLogoUrl || (video as any)?.placeLogo || (video as any)?.logoUrl || (video as any)?.placeAvatarUrl || (video as any)?.businessLogo || (video as any)?.place?.logoUrl;
    resolvedBannerUrl = video.placeBannerUrl || (video as any)?.bannerUrl || (video as any)?.place?.bannerUrl;
  } else {
    shareUrl = propShareUrl || appOrigin;
    title = propTitle || "Yoouz - Real People. Real Reviews.";
    subtitle = propSubtitle || "Authentic 60-Second Video Reviews";
    isBusiness = Boolean(propIsBusinessProfile || propDomain || propWebsite || propLogoUrl);
    resolvedDomain = propDomain || (propWebsite ? extractCleanDomain(propWebsite) : "");
    resolvedWebsite = propWebsite || "";
    resolvedLogoUrl = propLogoUrl;
    resolvedAvatarUrl = propAvatarUrl;
    resolvedBannerUrl = propBannerUrl;
  }

  // Fallback background image (instant, zero-latency thumbnail)
  const localPreviewBg = isVideoMode && video
    ? (video.thumbnailUrl || (video as any).videoThumbnail || (video as any).videoPreviewUrl || resolvedBannerUrl || "")
    : (resolvedBannerUrl || (isBusiness && resolvedDomain && KNOWN_BRAND_BANNERS[resolvedDomain]) || "");

  const resolvedAuthorName = isVideoMode && video
    ? (safeAuthor?.name || video.author?.name || (video as any)?.authorName || "Verified Reviewer")
    : (title || "Community Reviewer");

  const ratingVal = isVideoMode && video?.rating ? Math.round(video.rating) : (propRating ? Math.round(propRating) : 5);

  // Helper to compute place rating & review count (matching live database and local storage)
  const placeStats = (() => {
    const cleanDomain = (resolvedDomain || (video?.placeWebsite ? extractCleanDomain(video.placeWebsite) : "") || title || "").toLowerCase();
    const cleanId = (video?.placeId || "").toLowerCase();
    let matching: any[] = [];
    try {
      const saved = localStorage.getItem("yoouz_video_reviews");
      const list = saved ? JSON.parse(saved) : [];
      if (Array.isArray(list) && list.length > 0) {
        matching = list.filter((v: any) => {
          const vDom = (v.placeWebsite || v.placeId || v.placeName || "").toLowerCase();
          return (cleanDomain && (vDom.includes(cleanDomain) || cleanDomain.includes(vDom))) || 
                 (cleanId && (vDom.includes(cleanId) || cleanId.includes(vDom)));
        });
      }
    } catch(e) {}
    if (matching.length === 0 && Array.isArray(INITIAL_SEED_VIDEOS)) {
      matching = INITIAL_SEED_VIDEOS.filter((v: any) => {
        const vDom = (v.placeWebsite || v.placeId || v.placeName || "").toLowerCase();
        return (cleanDomain && (vDom.includes(cleanDomain) || cleanDomain.includes(vDom))) || 
               (cleanId && (vDom.includes(cleanId) || cleanId.includes(vDom)));
      });
    }
    if (matching.length > 0) {
      const count = matching.length;
      const sum = matching.reduce((acc: number, item: any) => acc + (Number(item.rating) || 5), 0);
      const avg = Number((sum / count).toFixed(1));
      return { count, avgRating: avg, scoreStr: avg.toFixed(1) };
    }
    const fallbackCount = Number((video as any)?.placeReviewsCount || (video as any)?.place?.reviewsCount || propReviewsCount || propReviewCount || 1);
    const fallbackRating = Number((video as any)?.placeRating || video?.rating || propRating || 5.0);
    return { count: fallbackCount, avgRating: fallbackRating, scoreStr: fallbackRating.toFixed(1) };
  })();

  const relativeDateStr = (() => {
    const raw = (video as any)?.createdAt || (video as any)?.date;
    if (!raw) return "";
    try {
      const d = typeof raw === 'number' ? new Date(raw) : new Date(String(raw));
      if (isNaN(d.getTime())) return "";
      const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
      if (diffSec < 60) return "Just now";
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDay = Math.floor(diffHr / 24);
      if (diffDay < 7) return `${diffDay}d ago`;
      const diffWeek = Math.floor(diffDay / 7);
      if (diffWeek < 5) return `${diffWeek}w ago`;
      return `${Math.floor(diffDay / 30)}mo ago`;
    } catch (e) {
      return "";
    }
  })();

  // Pre-generate dynamic social preview image url (server generated composite)
  const previewImageUrl = `${appOrigin}/api/og?${
    isVideoMode && video
      ? `type=video&id=${encodeURIComponent(video.id)}&placeName=${encodeURIComponent(title)}&placeDomain=${encodeURIComponent(resolvedDomain || title)}&placeRating=${placeStats.scoreStr}&placeReviewsCount=${placeStats.count}&rating=${video.rating || 5}&author=${encodeURIComponent(resolvedAuthorName)}&v=26`
      : (isBusiness || propIsBusinessProfile)
      ? `type=place&name=${encodeURIComponent(title)}&domain=${encodeURIComponent(resolvedDomain || title)}&rating=${placeStats.scoreStr}&reviewsCount=${placeStats.count}${resolvedLogoUrl ? `&logoUrl=${encodeURIComponent(resolvedLogoUrl)}` : ''}${resolvedBannerUrl ? `&bannerUrl=${encodeURIComponent(resolvedBannerUrl)}` : ''}&v=26`
      : `type=creator&name=${encodeURIComponent(title)}&handle=${encodeURIComponent(resolvedDomain || title)}&v=26`
  }`;

  const isSquarePreview = isBusiness || (!isVideoMode && resolvedAvatarUrl);
  const resolvedSubtitle = subtitle || (isBusiness ? (resolvedDomain ? `${resolvedDomain} • Verified` : "") : "Authentic 60s Video Review");

  const resolvedTouchIcon = isVideoMode && video
    ? `${appOrigin}/api/touch-icon/video/${encodeURIComponent(video.id)}.png?placeName=${encodeURIComponent(title)}${resolvedDomain ? `&placeDomain=${encodeURIComponent(resolvedDomain)}` : ''}${resolvedLogoUrl ? `&logoUrl=${encodeURIComponent(resolvedLogoUrl)}` : ''}&v=9`
    : isBusiness
    ? `${appOrigin}/api/touch-icon/place/${encodeURIComponent(resolvedDomain || title)}.png?placeName=${encodeURIComponent(title)}${resolvedLogoUrl ? `&logoUrl=${encodeURIComponent(resolvedLogoUrl)}` : ''}&v=20`
    : `${appOrigin}/apple-touch-icon.png`;

  useEffect(() => {
    if (!isModalOpen || !resolvedTouchIcon) return;
    const updateLinkTag = (rel: string, href: string, extraAttrs?: Record<string, string>) => {
      try {
        let selector = `link[rel="${rel}"]`;
        if (extraAttrs?.sizes) selector += `[sizes="${extraAttrs.sizes}"]`;
        let tag = document.querySelector(selector) as HTMLLinkElement;
        if (!tag) {
          tag = document.createElement('link');
          tag.setAttribute('rel', rel);
          if (extraAttrs) {
            for (const [k, v] of Object.entries(extraAttrs)) {
              tag.setAttribute(k, v);
            }
          }
          document.head.appendChild(tag);
        }
        tag.href = href;
      } catch (e) {}
    };

    updateLinkTag('apple-touch-icon', resolvedTouchIcon, { sizes: '180x180' });
    updateLinkTag('apple-touch-icon', resolvedTouchIcon);
  }, [isModalOpen, resolvedTouchIcon]);

  const shareText = isVideoMode && video
    ? `Watch authentic 60s video review of ${title} by ${video.author?.name || "a local guide"} on Yoouz! ${video.rating ? `★ ${video.rating}/5` : ""}`
    : `Check out ${title} on Yoouz - Real People. Real Reviews.`;

  // Pre-generate embed codes
  const embedSlug = isVideoMode && video
    ? getPlaceSlug(video.placeId || video.placeName)
    : getPlaceSlug(propDomain || propTitle || "yoouz.com");
  const embedUrl = `${appOrigin}/embed/${encodeURIComponent(embedSlug)}`;

  const placeTitle = (title || 'Business').replace(/"/g, '\\"');
  const placeRating = Number(video?.rating || 5).toFixed(1);
  const reviewCount = video ? 1 : 8;

  const iframeEmbedCode = `<!-- Yoouz Authentic Video Reviews + Google Rich Snippet (Schema.org) -->
<div class="yoouz-video-embed" style="max-width:390px;margin:0 auto;">
  <iframe src="${embedUrl}" width="100%" height="520" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture; camera; microphone" style="width:100%; max-width:390px; height:520px; border-radius:24px; border:none; box-shadow:0 20px 40px rgba(0,0,0,0.5); overflow:hidden;" title="Verified Video Reviews for ${placeTitle} on Yoouz"></iframe>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    "itemReviewed": {
      "@type": "LocalBusiness",
      "name": "${placeTitle}",
      "url": "https://www.yoouz.com/place/${embedSlug}"
    },
    "ratingValue": "${placeRating}",
    "bestRating": "5",
    "worstRating": "1",
    "ratingCount": "${reviewCount}"
  }
  </script>
</div>`;

  // Resolve active logged-in user (from props or local storage)
  const getActiveUser = (): any => {
    if (currentUser) return currentUser;
    try {
      const stored = localStorage.getItem("copo_user_profile") || localStorage.getItem("copo_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.email || parsed.name || parsed.id || parsed.userId)) {
          return parsed;
        }
      }
    } catch (e) {}
    return null;
  };

  // Record share interaction to Bunny.net backend storage
  const recordShareAction = (platform: string = "general") => {
    const targetVideoId = video?.id;
    if (targetVideoId) {
      const shareKey = `${targetVideoId}_${platform}_${Math.floor(Date.now() / 3000)}`;
      if (recordedSharesSet.current.has(shareKey)) return;
      recordedSharesSet.current.add(shareKey);
      setTimeout(() => recordedSharesSet.current.delete(shareKey), 3000);

      // Optimistic local state update
      onShareIncrement?.(targetVideoId);

      const activeUser = getActiveUser();
      const userPayload = activeUser && (activeUser.email || activeUser.name || activeUser.id) ? {
        userId: activeUser.email || activeUser.userId || activeUser.id || "",
        userName: activeUser.name || "Steven Akan",
        userAvatar: getSafeAvatarUrl(activeUser.avatar, activeUser.name, activeUser.handle || activeUser.email),
        userEmail: activeUser.email || ""
      } : {
        userId: "",
        userName: "A Yoouz Member",
        userAvatar: YOOUZ_LOGO_DATA_URI,
        userEmail: ""
      };

      try {
        fetch("/api/interactions/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoId: targetVideoId,
            platform,
            ...userPayload
          })
        })
          .then((res) => res.json())
          .then((data) => {
            if (data && typeof data.shares === "number") {
              onShareIncrement?.(targetVideoId, data.shares);
            }
          })
          .catch(() => {});
      } catch (e) {}
    }
  };

  // Copy Link Handler
  const handleCopy = async () => {
    triggerHaptic("success");
    recordShareAction("copy_link");
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setToastMessage(t("shareModal.copiedLink", "Link copied to clipboard!"));
      setTimeout(() => setCopied(false), 2500);
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      setToastMessage(t("shareModal.copyError", "Failed to copy link"));
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Copy Embed Code Handler
  const handleCopyEmbed = async () => {
    triggerHaptic("success");
    recordShareAction("embed");
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(iframeEmbedCode);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = iframeEmbedCode;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setEmbedCopied(true);
      setToastMessage(t("shareModal.embedCopied", "HTML Embed code copied!"));
      setTimeout(() => setEmbedCopied(false), 2500);
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      setToastMessage(t("shareModal.copyError", "Failed to copy embed code"));
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Native OS System Share Trigger (Official Apple AirDrop / Android System Sheet)
  const handleNativeShare = async () => {
    triggerHaptic("medium");
    recordShareAction("native_share");
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl
        });
        onClose();
      } catch (err: any) {
        if (err.name !== "AbortError") {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  // Safe App Scheme Opener with Web Fallback
  const openAppOrUrl = (appScheme: string, webFallback: string, appName: string) => {
    triggerHaptic("medium");
    recordShareAction(appName || "social_app");
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = appScheme;
      setTimeout(() => {
        window.open(webFallback, "_blank", "noopener,noreferrer");
      }, 1400);
    } else {
      window.open(webFallback, "_blank", "noopener,noreferrer");
    }
  };

  // Master list of all share channels with authentic branding, URL schemes, and web fallbacks
  const allSharePlatforms = [
    {
      id: "whatsapp",
      name: "WhatsApp",
      category: "favorites",
      bgClass: "bg-[#25D366] text-white",
      icon: (
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 1.977 14.07 1.9 12.01 1.9c-5.44 0-9.866 4.372-9.87 9.802 0 1.714.453 3.39 1.31 4.88l-.994 3.63 3.734-.972h-.143zm11.367-7.584c-.321-.16-1.897-.938-2.185-1.043-.289-.104-.499-.158-.709.158-.21.317-.812 1.044-.995 1.254-.183.21-.366.237-.687.077-.321-.16-1.353-.499-2.577-1.59-1.002-.892-1.63-1.997-1.83-2.333-.2-.336-.022-.518.139-.677.145-.143.321-.374.482-.56.16-.187.214-.32.321-.534.107-.214.053-.4-.027-.56-.08-.16-.709-1.708-.971-2.339-.255-.612-.514-.53-.709-.54-.183-.009-.393-.011-.603-.011s-.552.079-.841.395c-.289.317-1.103 1.079-1.103 2.63s1.129 3.051 1.287 3.262c.158.21 2.22 3.391 5.377 4.754.752.325 1.339.519 1.797.665.755.24 1.443.206 1.987.125.606-.09 1.897-.775 2.16-1.485.263-.709.263-1.316.184-1.442-.079-.126-.289-.205-.61-.365z" />
        </svg>
      ),
      onClick: () => openAppOrUrl(`whatsapp://send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`, `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`, "WhatsApp")
    },
    {
      id: "wabusiness",
      name: "WA Biz",
      category: "favorites",
      bgClass: "bg-[#128C7E] text-white",
      icon: (
        <div className="relative flex items-center justify-center">
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 1.977 14.07 1.9 12.01 1.9c-5.44 0-9.866 4.372-9.87 9.802 0 1.714.453 3.39 1.31 4.88l-.994 3.63 3.734-.972h-.143zm11.367-7.584c-.321-.16-1.897-.938-2.185-1.043-.289-.104-.499-.158-.709.158-.21.317-.812 1.044-.995 1.254-.183.21-.366.237-.687.077-.321-.16-1.353-.499-2.577-1.59-1.002-.892-1.63-1.997-1.83-2.333-.2-.336-.022-.518.139-.677.145-.143.321-.374.482-.56.16-.187.214-.32.321-.534.107-.214.053-.4-.027-.56-.08-.16-.709-1.708-.971-2.339-.255-.612-.514-.53-.709-.54-.183-.009-.393-.011-.603-.011s-.552.079-.841.395c-.289.317-1.103 1.079-1.103 2.63s1.129 3.051 1.287 3.262c.158.21 2.22 3.391 5.377 4.754.752.325 1.339.519 1.797.665.755.24 1.443.206 1.987.125.606-.09 1.897-.775 2.16-1.485.263-.709.263-1.316.184-1.442-.079-.126-.289-.205-.61-.365z" />
          </svg>
          <span className="absolute -top-1 -right-1 text-[8px] font-black bg-white text-[#128C7E] rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none shadow-xs">B</span>
        </div>
      ),
      onClick: () => openAppOrUrl(`whatsapp://send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`, `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`, "WA Business")
    },
    {
      id: "sms",
      name: "Messages",
      category: "favorites",
      bgClass: "bg-[#34C759] text-white",
      icon: <MessageSquare className="w-6 h-6 fill-white stroke-white" />,
      onClick: () => {
        triggerHaptic("medium");
        window.location.href = `sms:?&body=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
      }
    },
    {
      id: "email",
      name: "Mail",
      category: "favorites",
      bgClass: "bg-[#007AFF] text-white",
      icon: <Mail className="w-6 h-6 stroke-[2.2] text-white" />,
      onClick: () => {
        window.location.href = `mailto:?subject=${encodeURIComponent(title || "Yoouz Video Review")}&body=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
      }
    },
    {
      id: "telegram",
      name: "Telegram",
      category: "suggestions",
      bgClass: "bg-[#2AABEE] text-white",
      icon: (
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.945z" />
        </svg>
      ),
      onClick: () => openAppOrUrl(`tg://msg_url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, "Telegram")
    },
    {
      id: "messenger",
      name: "Messenger",
      category: "suggestions",
      bgClass: "bg-gradient-to-tr from-[#0084FF] via-[#00C6FF] to-[#A033FF] text-white",
      icon: (
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.615 4.47 8.653V24l4.088-2.244c1.077.299 2.222.464 3.442.464 6.627 0 12-4.974 12-11.109C24 4.974 18.627 0 12 0zm1.192 14.962l-3.056-3.26-5.964 3.26 6.562-6.966 3.13 3.26 5.89-3.26-6.562 6.966z" />
        </svg>
      ),
      onClick: () => openAppOrUrl(`fb-messenger://share?link=${encodeURIComponent(shareUrl)}`, `https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&app_id=291494419107518&redirect_uri=${encodeURIComponent(shareUrl)}`, "Messenger")
    },
    {
      id: "line",
      name: "Line",
      category: "suggestions",
      bgClass: "bg-[#06C755] text-white",
      icon: (
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
        </svg>
      ),
      onClick: () => openAppOrUrl(`line://msg/text/${encodeURIComponent(`${shareText} ${shareUrl}`)}`, `https://line.me/R/msg/text/?${encodeURIComponent(`${shareText} ${shareUrl}`)}`, "Line")
    },
    {
      id: "x",
      name: "X",
      category: "suggestions",
      bgClass: "bg-black border border-zinc-700/80 text-white",
      icon: (
        <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      onClick: () => openAppOrUrl(`twitter://post?message=${encodeURIComponent(`${shareText} ${shareUrl}`)}`, `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, "X")
    },
    {
      id: "facebook",
      name: "Facebook",
      category: "suggestions",
      bgClass: "bg-[#1877F2] text-white",
      icon: <Facebook className="w-6 h-6 fill-current" />,
      onClick: () => openAppOrUrl(`fb://facewebmodal/f?href=${encodeURIComponent(shareUrl)}`, `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, "Facebook")
    },
    {
      id: "reddit",
      name: "Reddit",
      category: "suggestions",
      bgClass: "bg-[#FF4500] text-white",
      icon: (
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.703zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.688-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
        </svg>
      ),
      onClick: () => window.open(`https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title || shareText)}`, "_blank", "noopener,noreferrer")
    }
  ];

  // App row in the primary iOS/Android share sheet
  const primaryShelfApps = [
    ...allSharePlatforms.slice(0, 8),
    {
      id: "more",
      name: "More",
      category: "more",
      bgClass: "bg-zinc-800 border border-zinc-700/80 text-zinc-200 hover:text-white hover:bg-zinc-750",
      icon: <MoreHorizontal className="w-6 h-6 stroke-[2.2]" />,
      onClick: () => {
        triggerHaptic("medium");
        setActiveView("apps");
      }
    }
  ];

  // Action buttons (Row 2): Circular buttons matching the official iOS/Android sheet
  const actionButtons = [
    {
      id: "copy",
      name: copied ? "Copied" : t("shareModal.copyLinkShort", "Copy"),
      icon: copied ? <Check className="w-5.5 h-5.5 stroke-[2.5] text-emerald-400" /> : <Copy className="w-5.5 h-5.5 text-zinc-100" />,
      circleClass: copied
        ? "bg-emerald-950/90 border-emerald-500/80 text-emerald-300"
        : "bg-zinc-800/90 border-zinc-700/70 text-zinc-100 hover:bg-zinc-700",
      onClick: handleCopy
    },
    {
      id: "native-share",
      name: t("shareModal.systemShareShort", "Share"),
      icon: <Share2 className="w-5.5 h-5.5 text-zinc-100" />,
      circleClass: "bg-zinc-800/90 border-zinc-700/70 text-zinc-100 hover:bg-zinc-700",
      onClick: handleNativeShare
    },
    {
      id: "bookmark",
      name: isBookmarked ? "Saved" : "Save",
      icon: isBookmarked ? <Bookmark className="w-5.5 h-5.5 stroke-[2.5] text-amber-400 fill-amber-400" /> : <Bookmark className="w-5.5 h-5.5 text-zinc-100" />,
      circleClass: isBookmarked
        ? "bg-amber-950/90 border-amber-500/80 text-amber-300"
        : "bg-zinc-800/90 border-zinc-700/70 text-zinc-100 hover:bg-zinc-700",
      onClick: handleBookmarkToggle
    },
    {
      id: "open",
      name: t("shareModal.openTabShort", "Open"),
      icon: <ExternalLink className="w-5.5 h-5.5 text-zinc-100" />,
      circleClass: "bg-zinc-800/90 border-zinc-700/70 text-zinc-100 hover:bg-zinc-700",
      onClick: () => {
        triggerHaptic("light");
        window.open(shareUrl, "_blank", "noopener,noreferrer");
      }
    },
    {
      id: "report",
      name: t("shareModal.reportShort", "Report"),
      icon: <Flag className="w-5.5 h-5.5 text-zinc-100" />,
      circleClass: "bg-zinc-800/90 border-zinc-700/70 text-zinc-100 hover:bg-zinc-700",
      onClick: () => {
        triggerHaptic("medium");
        onClose();
        if (onOpenReport) {
          onOpenReport(video || { type: propIsCreatorProfile ? "user" : "place", title, url: shareUrl });
        } else {
          window.dispatchEvent(new CustomEvent("yoouz-open-report", {
            detail: {
              url: shareUrl,
              title: title,
              type: propIsCreatorProfile ? "user" : (isBusiness || propIsBusinessProfile ? "place" : "general")
            }
          }));
        }
      }
    }
  ];

  // Filtered apps for the "Apps" view
  const filteredApps = allSharePlatforms.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  if (!isModalOpen) return null;

  const modalContent = (
    <div 
      id="yoouz-share-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="yoouz-share-modal-title"
      className="fixed inset-0 z-[99999] flex flex-col justify-end sm:justify-center sm:items-center bg-black/80 backdrop-blur-md animate-in fade-in duration-150 text-white overscroll-contain select-none p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Background click to dismiss */}
      <div className="absolute inset-0 cursor-pointer" />

      {/* Main Dialog Card: Mobile Bottom Sheet + Desktop Centered Modal Card */}
      <div 
        id="yoouz-share-modal-dialog"
        className="relative z-10 w-full sm:w-[420px] max-h-[92vh] sm:max-h-[88vh] bg-zinc-900/98 backdrop-blur-2xl rounded-t-[28px] sm:rounded-[28px] shadow-2xl border-t sm:border border-zinc-800/90 flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 text-white pb-safe select-text overscroll-contain"
        style={{
          transform: dragOffsetY > 0 ? `translateY(${dragOffsetY}px)` : undefined,
          transition: dragOffsetY === 0 ? "transform 0.2s ease-out" : "none"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Drag Indicator Pill for Mobile */}
        <div 
          className="h-6 flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing sm:hidden touch-none pt-2"
          {...swipeProps}
        >
          <div className="w-10 h-1 rounded-full bg-zinc-600/90" />
        </div>

        {/* Toast Feedback Notification Banner */}
        {toastMessage && (
          <div className="mx-4 mt-2 py-2 px-3.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs font-medium flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150 shadow-md">
            <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* VIEW 1: Main iOS / Android Dark Mode Share Sheet */}
        {activeView === "sheet" && (
          <div className="p-4 sm:p-5 flex flex-col space-y-3.5 animate-in fade-in duration-150">
            {/* FULL SOCIAL PREVIEW CARD (Mobile & Desktop) */}
            <div className="relative w-full rounded-2xl overflow-hidden border border-zinc-750/90 bg-zinc-950 shadow-xl select-none group">
              {propIsCreatorProfile || (!isVideoMode && !isBusiness && !propIsBusinessProfile) ? (
                /* DEDICATED USER / REVIEWER PROFILE CARD (Single clean author squircle on bottom, matching profile header & banner) */
                <div className="relative aspect-[16/9] w-full overflow-hidden flex items-center justify-center bg-black">
                  {/* Banner Background: User's custom banner or signature dark blue grid banner */}
                  {(resolvedBannerUrl || propBannerUrl) ? (
                    <div className="absolute inset-0 w-full h-full bg-zinc-900 overflow-hidden flex items-center justify-center">
                      <img
                        src={getProxiedImageUrl(resolvedBannerUrl || propBannerUrl || "")}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <img
                        src={getProxiedImageUrl(resolvedBannerUrl || propBannerUrl || "")}
                        alt={title}
                        className="relative z-1 w-full h-full object-cover filter brightness-95"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-zinc-950 via-slate-900 to-zinc-950 flex flex-col items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:32px_32px]" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.18),transparent_70%)]" />
                    </div>
                  )}

                  {/* Dark Vignette Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/60 pointer-events-none" />

                  {/* BOTTOM BAR: Single Author Info with Frosted Glass Pill matching Screenshot 1 & 2 */}
                  <div className="absolute bottom-2.5 left-2.5 z-10 pointer-events-none max-w-[96%]">
                    <div className="flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-2xl bg-black/90 backdrop-blur-md border border-white/25 shadow-xl min-w-0">
                      {/* Profile Squircle Avatar Matching Profile Header */}
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-white/30 bg-zinc-900 shadow-xs flex items-center justify-center shrink-0">
                        {resolvedAvatarUrl ? (
                          <img
                            src={getProxiedImageUrl(resolvedAvatarUrl)}
                            alt={title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const dynamicColor = getAvatarColor(title, propHandle || resolvedDomain || title).bg.replace('#', '');
                              (e.currentTarget as HTMLImageElement).src = `/api/avatar?name=${encodeURIComponent(title)}&background=${dynamicColor}&color=fff&bold=true&size=128`;
                            }}
                          />
                        ) : (
                          <div 
                            className="w-full h-full flex items-center justify-center text-white text-sm font-bold"
                            style={{ backgroundColor: getAvatarColor(title, propHandle || resolvedDomain || title).bg }}
                          >
                            {title.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0 justify-center pr-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-white text-xs sm:text-[13px] font-bold whitespace-nowrap leading-tight">{title}</span>
                          {/* Dark Mode Verified Checkmark */}
                          <CheckCircle className="w-3.5 h-3.5 fill-white text-black shrink-0" />
                        </div>
                        <p className="text-zinc-300 text-[10.5px] sm:text-[11.5px] leading-tight whitespace-nowrap font-medium mt-0.5 opacity-90">
                          {resolvedSubtitle || t("profile.reviewerProfile", "Reviewer Profile")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : !isVideoMode && (isBusiness || propIsBusinessProfile) ? (
                /* DEDICATED BUSINESS PROFILE SHARE CARD (Full Cover Banner + Single Bottom Business Squircle Logo & Info) */
                <div className="relative aspect-[16/9] w-full overflow-hidden flex items-center justify-center bg-black">
                  {/* Banner Background: Business cover banner or cinematic gradient */}
                  {(resolvedBannerUrl || localPreviewBg) ? (
                    <div className="absolute inset-0 w-full h-full bg-zinc-900 overflow-hidden flex items-center justify-center">
                      <img
                        src={getProxiedImageUrl(resolvedBannerUrl || localPreviewBg || "")}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <img
                        src={getProxiedImageUrl(resolvedBannerUrl || localPreviewBg || "")}
                        alt={title}
                        className="relative z-1 w-full h-full object-cover filter brightness-95"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-zinc-950 via-slate-900 to-zinc-950 flex flex-col items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:32px_32px]" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.18),transparent_70%)]" />
                    </div>
                  )}

                  {/* Ambient dark gradient vignette to ensure absolute legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/60 pointer-events-none" />

                  {/* BOTTOM BAR: Sleek Business Profile Pill with Squircle Logo, Verified Badge, Rating & Reviews */}
                  <div className="absolute bottom-2.5 left-2.5 z-10 pointer-events-none max-w-[96%]">
                    <div className="flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-2xl bg-black/90 backdrop-blur-md border border-white/25 shadow-xl min-w-0">
                      {/* Business Squircle Logo Container Matching Profile Header */}
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-white/30 bg-white shadow-xs flex items-center justify-center p-1 shrink-0">
                        <CopoBrandLogo
                          domain={resolvedDomain || title}
                          name={title}
                          website={resolvedWebsite}
                          logoUrl={resolvedLogoUrl}
                          bannerUrl={resolvedBannerUrl}
                          className="w-full h-full flex items-center justify-center overflow-hidden bg-transparent"
                          imageClassName="w-full h-full object-contain rounded-lg"
                          fallbackTextClassName="font-black text-xs text-zinc-950"
                        />
                      </div>
                      <div className="flex flex-col min-w-0 justify-center pr-0.5">
                        {/* Line 1: Business Name + Dark Mode White Verified Checkmark */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-white text-xs sm:text-[13px] font-bold whitespace-nowrap leading-tight">{title}</span>
                          <CheckCircle className="w-3.5 h-3.5 fill-white text-black shrink-0" />
                        </div>
                        {/* Line 2: Rating Score Number + 5-Star Row + Total Reviews + Domain */}
                        <div className="flex items-center gap-1.5 text-[10.5px] sm:text-[11.5px] leading-tight whitespace-nowrap font-medium mt-0.5">
                          <span className="text-white font-bold text-xs">{placeStats.scoreStr}</span>
                          <div className="flex items-center gap-0.5 shrink-0">
                            {[1, 2, 3, 4, 5].map((starIdx) => {
                              const fillAmount = Math.max(0, Math.min(1, placeStats.avgRating - (starIdx - 1)));
                              return (
                                <div key={starIdx} className="relative w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0">
                                  {/* Background unfilled star */}
                                  <Star className="w-full h-full text-zinc-600 fill-zinc-800/80 stroke-zinc-600" />
                                  {/* Foreground filled star */}
                                  {fillAmount > 0 && (
                                    <div 
                                      className="absolute inset-0 overflow-hidden" 
                                      style={{ width: `${Math.round(fillAmount * 100)}%` }}
                                    >
                                      <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 fill-amber-400 shrink-0" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <span className="text-white font-medium">({placeStats.count} {placeStats.count === 1 ? 'review' : 'reviews'})</span>
                          <span className="text-zinc-400">•</span>
                          <span className="text-zinc-300 font-medium">{resolvedDomain || title}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* VIDEO REVIEW SHARE CARD */
                <div className="relative aspect-[16/9] w-full overflow-hidden flex items-center justify-center bg-black">
                  {/* Clean background thumbnail without duplicate image stacking */}
                  <img
                    src={getProxiedImageUrl(localPreviewBg || previewImageUrl)}
                    alt={title}
                    className="absolute inset-0 w-full h-full object-cover filter brightness-95"
                  />

                  {/* Ambient dark gradient vignette to ensure absolute legibility of all badges */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/60 pointer-events-none" />

                  {/* TOP BAR: Place pill with Business Logo, Place Name, Rating & Reviews Count */}
                  <div className="absolute top-2.5 left-2.5 z-10 flex items-center max-w-[96%] pointer-events-none">
                    <div className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-2xl bg-black/90 backdrop-blur-md border border-white/25 shadow-lg min-w-0">
                      {/* Business Squircle Logo Container with crisp white framing */}
                      <div className="w-8.5 h-8.5 rounded-xl bg-white border border-white/30 overflow-hidden flex items-center justify-center shrink-0 p-1 shadow-xs">
                        <CopoBrandLogo
                          domain={resolvedDomain || (video?.placeWebsite ? extractCleanDomain(video.placeWebsite) : "") || (video?.placeId ? extractCleanDomain(video.placeId) : "") || title}
                          name={title}
                          website={resolvedWebsite || video?.placeWebsite}
                          logoUrl={resolvedLogoUrl || video?.placeLogoUrl || (video as any)?.placeAvatarUrl || (video as any)?.businessLogo}
                          className="w-full h-full flex items-center justify-center overflow-hidden bg-transparent"
                          imageClassName="w-full h-full object-contain rounded-lg"
                          fallbackTextClassName="font-black text-[10px] text-zinc-950"
                        />
                      </div>
                      {/* Text Column */}
                      <div className="flex flex-col min-w-0 justify-center pr-0.5">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="text-white text-xs sm:text-[13px] font-bold whitespace-nowrap leading-tight">{title}</span>
                          <CheckCircle className="w-3.5 h-3.5 fill-white text-black shrink-0" />
                        </div>
                        <div className="flex items-center gap-1 leading-tight mt-0.5 whitespace-nowrap">
                          <span className="text-amber-400 text-xs font-black">★</span>
                          <span className="text-amber-400 text-xs font-bold">{placeStats.scoreStr}</span>
                          <span className="text-white text-[11px] font-bold ml-0.5">
                            ({placeStats.count} {placeStats.count === 1 ? 'review' : 'reviews'})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CENTER: Play Button for Videos */}
                  {isVideoMode && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-black/55 backdrop-blur-md border border-white/40 flex items-center justify-center text-white shadow-2xl transition-transform group-hover:scale-105">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-white ml-0.5" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* BOTTOM BAR: Author Info (Sleek Compact 2-Row: By Name • Date, 5 Stars domain.com) */}
                  <div className="absolute bottom-2.5 left-2.5 z-10 pointer-events-none max-w-[96%]">
                    {isVideoMode && video ? (
                      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-2xl bg-black/90 backdrop-blur-md border border-white/25 shadow-xl min-w-0">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/35 bg-zinc-800 shrink-0 shadow-xs flex items-center justify-center">
                          <img
                            src={getSafeAvatarUrl(resolvedAvatarUrl, resolvedAuthorName, safeAuthor?.handle)}
                            alt={resolvedAuthorName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.src = generateGoogleLetterAvatarSvg(resolvedAuthorName, 128, safeAuthor?.handle || resolvedAuthorName);
                            }}
                          />
                        </div>
                        <div className="flex flex-col min-w-0 justify-center pr-0.5">
                          {/* Line 1: By AuthorName + Verified badge */}
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-white text-xs font-bold whitespace-nowrap leading-tight">By {resolvedAuthorName}</span>
                            <CheckCircle className="w-3.5 h-3.5 fill-white text-black shrink-0" />
                          </div>
                          {/* Line 2: 5 Stars + Stark White Clean Domain */}
                          <div className="flex items-center gap-1.5 leading-none mt-0.5">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((starIdx) => (
                                <span
                                  key={starIdx}
                                  className={`text-[11px] ${starIdx <= Math.round(Number(video.rating || 5)) ? 'text-amber-400 font-black' : 'text-zinc-600'}`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <span className="text-white text-xs font-bold leading-tight whitespace-nowrap drop-shadow-sm tracking-tight">
                              {resolvedDomain || (video.placeWebsite ? extractCleanDomain(video.placeWebsite) : "") || title.toLowerCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Clean Business Location Pill */
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-xs text-white shadow-xs min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                        <span className="font-semibold truncate max-w-[220px]">
                          {resolvedSubtitle || t("place.businessLocation", "Business Location")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Hairline Divider */}
            <div className="border-t border-zinc-800/80 -mx-4 sm:-mx-5" />

            {/* Row 1: APPS Shelf (Horizontal Scroll of Squircles) */}
            <div>
              <div className="flex items-start gap-4 overflow-x-auto no-scrollbar py-1 px-1">
                {primaryShelfApps.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={app.onClick}
                    className="flex flex-col items-center group cursor-pointer shrink-0 w-16 focus:outline-hidden"
                  >
                    <div className={`w-14 h-14 rounded-[18px] flex items-center justify-center shadow-md transition-all group-hover:scale-105 active:scale-95 ${app.bgClass}`}>
                      {app.icon}
                    </div>
                    <span className="text-[11px] text-zinc-300 group-hover:text-white font-medium whitespace-nowrap text-center mt-1.5 transition-colors tracking-tight">
                      {app.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hairline Divider */}
            <div className="border-t border-zinc-800/80 -mx-4 sm:-mx-5" />

            {/* Row 2: ACTION BUTTONS (Horizontal Scroll of Circular Buttons) */}
            <div>
              <div className="flex items-start gap-4 overflow-x-auto no-scrollbar py-1 px-1">
                {actionButtons.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={action.onClick}
                    className="flex flex-col items-center group cursor-pointer shrink-0 w-16 focus:outline-hidden"
                  >
                    <div className={`w-13 h-13 rounded-full border flex items-center justify-center transition-all shadow-xs group-hover:scale-105 active:scale-95 ${action.circleClass}`}>
                      {action.icon}
                    </div>
                    <span className="text-[11px] text-zinc-300 group-hover:text-white font-medium whitespace-nowrap text-center mt-1.5 transition-colors tracking-tight">
                      {action.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hairline Divider & Bottom Done Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-zinc-850 hover:bg-zinc-800 border border-zinc-700/70 text-zinc-100 hover:text-white font-medium text-xs transition-colors cursor-pointer text-center"
              >
                {t("common.done", "Done")}
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: Full iOS Apps Sheet with Search */}
        {activeView === "apps" && (
          <div className="p-4 sm:p-5 flex flex-col space-y-3.5 animate-in fade-in duration-150 max-h-[85vh] overflow-y-auto">
            {/* Navigation Header */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveView("sheet")}
                className="flex items-center gap-1 text-zinc-300 hover:text-white text-xs font-semibold cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t("common.back", "Back")}</span>
              </button>
              <h3 className="font-bold text-white text-sm">
                {t("shareModal.apps", "Apps")}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 cursor-pointer"
              >
                {t("common.done", "Done")}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("shareModal.searchApps", "Search apps...")}
                className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-400 focus:outline-hidden focus:border-zinc-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Apps Grouped List */}
            <div className="space-y-4 pt-1">
              {/* Favorites Section */}
              {!searchQuery && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-1">
                    {t("shareModal.favorites", "Favorites")}
                  </span>
                  <div className="bg-zinc-850/70 border border-zinc-800 rounded-2xl divide-y divide-zinc-800 overflow-hidden">
                    <button
                      type="button"
                      onClick={handleNativeShare}
                      className="w-full flex items-center justify-between p-3 hover:bg-zinc-800/60 transition cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-750 flex items-center justify-center text-white shrink-0">
                          <Share2 className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-medium text-white">{t("shareModal.systemShare", "System Share (AirDrop / Nearby)")}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-500" />
                    </button>

                    {allSharePlatforms.filter((p) => p.category === "favorites").map((app) => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={app.onClick}
                        className="w-full flex items-center justify-between p-3 hover:bg-zinc-800/60 transition cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${app.bgClass}`}>
                            {app.icon}
                          </div>
                          <span className="text-xs font-medium text-white">{app.name}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions / Filtered Section */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-1">
                  {searchQuery ? t("shareModal.searchResults", "Search Results") : t("shareModal.suggestions", "Suggestions")}
                </span>
                <div className="bg-zinc-850/70 border border-zinc-800 rounded-2xl divide-y divide-zinc-800 overflow-hidden">
                  {filteredApps.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={app.onClick}
                      className="w-full flex items-center justify-between p-3 hover:bg-zinc-800/60 transition cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${app.bgClass}`}>
                          {app.icon}
                        </div>
                        <span className="text-xs font-medium text-white">{app.name}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-500" />
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="w-full flex items-center justify-between p-3 hover:bg-zinc-800/60 transition cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-750 flex items-center justify-center text-white shrink-0">
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </div>
                      <span className="text-xs font-medium text-white">
                        {copied ? t("shareModal.copied", "Copied Link!") : t("shareModal.copyLink", "Copy Link")}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: Options (Embed, Direct Link, Live Preview) */}
        {activeView === "options" && (
          <div className="p-4 sm:p-5 flex flex-col space-y-4 animate-in fade-in duration-150 max-h-[85vh] overflow-y-auto">
            {/* Navigation Header */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveView("sheet")}
                className="flex items-center gap-1 text-zinc-300 hover:text-white text-xs font-semibold cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t("common.back", "Back")}</span>
              </button>
              <h3 className="font-bold text-white text-sm">
                {t("shareModal.options", "Options & Embed")}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 cursor-pointer"
              >
                {t("common.done", "Done")}
              </button>
            </div>

            {/* Direct Link Box */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                {t("shareModal.directLink", "Direct Link")}
              </span>
              <div className="flex items-center gap-2 bg-zinc-850 border border-zinc-700/80 rounded-xl p-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="bg-transparent text-xs text-zinc-200 flex-1 outline-hidden select-all truncate px-1"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-zinc-750 hover:bg-zinc-700 text-xs font-semibold text-white flex items-center gap-1 shrink-0 transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                      <span>{t("shareModal.copied", "Copied")}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{t("shareModal.copy", "Copy")}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Embed Format Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                {t("shareModal.embedLayout", "Embed Layout")}
              </span>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setEmbedLayout("reel")}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                    embedLayout === "reel" ? "bg-zinc-800 text-white border border-zinc-700/80 shadow-md" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <span>9:16 Reel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEmbedLayout("card")}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                    embedLayout === "card" ? "bg-zinc-800 text-white border border-zinc-700/80 shadow-md" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <span>Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEmbedLayout("widget")}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                    embedLayout === "widget" ? "bg-zinc-800 text-white border border-zinc-700/80 shadow-md" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <span>Full Width</span>
                </button>
              </div>
            </div>

            {/* HTML iFrame Code Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  {t("shareModal.htmlCode", "HTML iFrame Code")}
                </span>
                {embedCopied && (
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[2.5]" /> {t("shareModal.copied", "Copied!")}
                  </span>
                )}
              </div>
              <div className="bg-zinc-850 border border-zinc-700/80 rounded-xl p-2.5">
                <pre className="text-[10.5px] font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap break-all max-h-20">
                  {iframeEmbedCode}
                </pre>
              </div>
              <div className="flex items-center justify-between pt-1">
                <a
                  href={embedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <span>{t("shareModal.testPlayer", "Test player")}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={handleCopyEmbed}
                  className="px-3.5 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  {embedCopied ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{embedCopied ? t("shareModal.copiedHtml", "Copied HTML!") : t("shareModal.copyCode", "Copy Code")}</span>
                </button>
              </div>
            </div>

            {/* Full Social Card Preview (1200x630 HD) */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  {t("shareModal.socialPreviewCard", "Social Preview")} (1200 × 630)
                </span>
                <div className="flex items-center gap-3">
                  <a
                    href={previewImageUrl}
                    download="yoouz-share-card.png"
                    className="text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{t("shareModal.downloadCard", "Download PNG")}</span>
                  </a>
                  <a
                    href={previewImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
                  >
                    <span>{t("shareModal.openFullImage", "Open Image")}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-zinc-750/90 bg-zinc-950 shadow-lg group">
                {/* Fallback local thumbnail if server image is loading or unavailable */}
                {localPreviewBg && (
                  <img
                    src={localPreviewBg}
                    alt={title}
                    className="absolute inset-0 w-full h-full object-cover filter brightness-90"
                  />
                )}
                <img
                  src={previewImageUrl}
                  alt="Social Preview Card"
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    if (localPreviewBg) {
                      (e.currentTarget as HTMLImageElement).src = localPreviewBg;
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
};
