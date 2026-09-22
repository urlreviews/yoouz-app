import { useCriticalImagesLoaded } from "../hooks/useCriticalImagesLoaded";
import React, { useState, useEffect } from "react";
import {
  X,
  MapPin,
  Star, Lock, Zap,
  Phone,
  Globe,
  Clock,
  Video,
  Play,
  Share2,
  Navigation,
  Bookmark,
  BookmarkCheck,
  Compass,
  Smartphone,
  ShieldCheck,
  History,
  Tag,
  Edit3,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  Camera,
  CheckCircle,
  CheckCircle2,
  Image as ImageIcon,
  SlidersHorizontal,
  Download,
  Filter,
  Mail,
  UserPlus,
  UserCheck,
  UserMinus,
  MessageSquare,
  MessageSquareOff,
  ShieldAlert,
  Building2,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Heart,
  Copy,
  Check,
  Flag
} from "lucide-react";
import { Place, VideoReview, UserProfile } from "../types";
import { getPlaceLogoUrl, getCleanLogoUrl, getProxiedImageUrl, getPlaceBannerUrl, KNOWN_LOADED_BANNERS } from "../utils/logoUtils";
import { isPlaceReviewMatch, formatBusinessName, getDisplayUrlAsDomain, getPlaceSlug, getDisplayViews, formatViewCount, extractCleanDomain, KNOWN_OFFICIAL_NAMES, getGoogleMapsDirectionsUrl, getGoogleMapsEmbedUrl } from "../utils/placeUtils";
import { resolveVideoPosterUrl } from "../utils/videoUtils";
import { CopoVideoThumbnail } from "./CopoVideoThumbnail";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { KNOWN_BRAND_BANNERS, KNOWN_BRAND_LOGOS } from "../utils/logoUtils";
import { CopoShareModal } from "./CopoShareModal";
import { CopoBusinessClaimModal } from "./CopoBusinessClaimModal";
import { SEOTags } from "./SEOTags";
import { triggerHaptic } from "../utils/haptics";
import { useSwipeDownToDismiss } from "../hooks/useSwipeDownToDismiss";
import { useLanguage } from "../i18n/LanguageContext";

interface CopoPlaceDrawerProps {
  place: Place | null;
  allVideos: VideoReview[];
  onClose: () => void;
  onSelectVideo: (videoId: string) => void;
  onRecordForPlace: (place: Place) => void;
  onToggleGrabPlace?: (place: Place) => void;
  onUpdatePlace?: (place: Place) => void;
  onToggleFollowPlace?: (placeId: string) => void;
  onOpenReport?: (target: { type: "place"; placeName: string; placeId: string }) => void;
  isSaved?: boolean;
  reviewSort?: "latest" | "oldest" | "highest" | "lowest" | "popular";
  onSortChange?: (sort: "latest" | "oldest" | "highest" | "lowest" | "popular") => void;
  starFilter?: number | "all";
  onStarFilterChange?: (stars: number | "all") => void;
  currentUser?: UserProfile | null;
  onStartChat?: (senderId: string, senderName: string, senderAvatar: string) => void;
  onClaimBusiness?: (place: Place) => void;
}

export const CopoPlaceDrawer: React.FC<CopoPlaceDrawerProps> = ({
  place,
  allVideos,
  onClose,
  onSelectVideo,
  onRecordForPlace,
  onToggleGrabPlace,
  onUpdatePlace,
  onToggleFollowPlace,
  onOpenReport,
  isSaved = false,
  reviewSort: controlledSort,
  onSortChange,
  starFilter: controlledStarFilter,
  onStarFilterChange,
  currentUser = null,
  onStartChat,
  onClaimBusiness,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"overview" | "reviews" | "about">("overview");
  const [showHoursDropdown, setShowHoursDropdown] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState("");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [showUnclaimedChatModal, setShowUnclaimedChatModal] = useState(false);
  const [claimAsOwner, setClaimAsOwner] = useState(false);
  const [bannerError, setBannerError] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  
  // Instantly load the banner and logo into memory BEFORE rendering the UI
  // to avoid the network fetch flicker.
  const criticalImagesLoaded = useCriticalImagesLoaded([place.bannerUrl, place.logoUrl], 1500);

  const [logoError, setLogoError] = useState(false);
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);
  const [fetchedBannerUrl, setFetchedBannerUrl] = useState<string | null>(null);
  const [isHoveredUnfollow, setIsHoveredUnfollow] = useState(false);

  const contentRef = React.useRef<HTMLDivElement>(null);
  const fetchedTargetUrlsRef = React.useRef<Set<string>>(new Set());

  // Reset image errors and banner state when place changes
  useEffect(() => {
    setBannerError(false);
    setPhotoIndex(0);
    setLogoError(false);
    setFetchedBannerUrl(null);
    fetchedTargetUrlsRef.current.clear();
  }, [place?.id]);

  // Tab switching with scroll to top
  const handleTabClick = (tab: "overview" | "reviews" | "about") => {
    setActiveTab(tab);
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Edit state fields
  const [editPhone, setEditPhone] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editHours, setEditHours] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editLogoUrl, setEditLogoUrl] = useState("");
  const [editBannerUrl, setEditBannerUrl] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [showHoursHelper, setShowHoursHelper] = useState(false);
  const [copiedTag, setCopiedTag] = useState(false);

  // Review Sort & Filter State (Controlled or Uncontrolled)
  const [localReviewSort, setLocalReviewSort] = useState<"latest" | "oldest" | "highest" | "lowest" | "popular">("latest");
  const [localStarFilter, setLocalStarFilter] = useState<number | "all">("all");

  const reviewSort = controlledSort ?? localReviewSort;
  const starFilter = controlledStarFilter ?? localStarFilter;

  const setReviewSort = (s: "latest" | "oldest" | "highest" | "lowest" | "popular") => {
    if (onSortChange) onSortChange(s);
    else setLocalReviewSort(s);
  };

  const setStarFilter = (sf: number | "all") => {
    if (onStarFilterChange) onStarFilterChange(sf);
    else setLocalStarFilter(sf);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    
return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!place) return null;

  const isAddressUrl = Boolean(
    place.address && 
    (place.address.startsWith("http://") || 
     place.address.startsWith("https://") || 
     place.address.includes("www.") || 
     place.address.includes(".com") ||
     place.address.includes(".fr") ||
     place.address.includes(".co.il") ||
     place.address.includes(".net") ||
     place.address.toLowerCase().startsWith("official domain:") ||
     place.address.toLowerCase().includes("online") ||
     place.address.toLowerCase().includes("global headquarters"))
  );
  const displayAddress = (isAddressUrl || !place.address || place.address.trim() === "") ? null : place.address;

  const isYoouz = place.id === 'yoouz.com' || (place.name && place.name.toLowerCase() === 'yoouz') || place.brandDomain === 'yoouz.com' || (place.website && place.website.includes('yoouz.com'));

  const hasPhysicalLocation = !isYoouz && Boolean(
    (displayAddress && displayAddress.trim() !== "") ||
    (place.city && 
     place.city.trim() !== "" && 
     !["online", "global", "worldwide", "global headquarters", "n/a"].includes(place.city.toLowerCase().trim()))
  );

  const rawPlaceVideos = allVideos.filter((v) => isPlaceReviewMatch(v, place));

  // Compute dynamic stats based on actual video reviews
  const dynamicReviewCount = rawPlaceVideos.length;
  const dynamicAvgRating = dynamicReviewCount > 0 
    ? rawPlaceVideos.reduce((acc, v) => acc + (v.rating || 5), 0) / dynamicReviewCount 
    : (place.rating || 5.0);

  const placeVideos = React.useMemo(() => {
    let list = [...rawPlaceVideos];

    // Filter by star rating
    if (starFilter !== "all") {
      list = list.filter((v) => Math.round(v.rating) === starFilter);
    }

    // Sort order
    list.sort((a, b) => {
      const timeA = a.createdAtMs || (a.recordedAt ? new Date(a.recordedAt).getTime() : 0) || 0;
      const timeB = b.createdAtMs || (b.recordedAt ? new Date(b.recordedAt).getTime() : 0) || 0;

      if (reviewSort === "latest") {
        return timeB - timeA;
      }
      if (reviewSort === "oldest") {
        return timeA - timeB;
      }
      if (reviewSort === "highest") {
        return b.rating - a.rating;
      }
      if (reviewSort === "lowest") {
        return a.rating - b.rating;
      }
      if (reviewSort === "popular") {
        return b.likes - a.likes;
      }
      return 0;
    });

    return list;
  }, [rawPlaceVideos, starFilter, reviewSort]);

  const drawerDomain = React.useMemo(() => {
    if (place.brandDomain) return extractCleanDomain(place.brandDomain);
    if (place.website) {
      const d = extractCleanDomain(place.website);
      if (d && d.includes(".")) return d;
    }
    const cleanFromId = extractCleanDomain(place.id);
    if (cleanFromId && cleanFromId.includes(".")) return cleanFromId;
    const cleanFromName = extractCleanDomain(place.name);
    if (cleanFromName && cleanFromName.includes(".")) return cleanFromName;
    return null;
  }, [place]);

  // Clean, official human-readable business name for the Place Page and Drawer
  const displayedPlaceName = React.useMemo(() => {
    // 1. If any video review for this place has a clean, formatted multi-word placeName, prioritize it!
    const matchingVid = (rawPlaceVideos || []).find(
      (v) => v.placeName && v.placeName.trim() !== "" && !v.placeName.includes(".com") && v.placeName.trim().length > 2
    );
    if (matchingVid?.placeName) {
      const formatted = formatBusinessName(matchingVid.placeName);
      if (formatted && formatted.length > 2 && !formatted.includes(".com")) return formatted;
    }
    // 2. Check KNOWN_OFFICIAL_NAMES for drawerDomain or place.id
    if (drawerDomain && KNOWN_OFFICIAL_NAMES[drawerDomain]) {
      return KNOWN_OFFICIAL_NAMES[drawerDomain];
    }
    const cleanId = extractCleanDomain(place?.id || "");
    if (cleanId && KNOWN_OFFICIAL_NAMES[cleanId]) {
      return KNOWN_OFFICIAL_NAMES[cleanId];
    }
    // 3. Format place.name
    const formatted = formatBusinessName(place?.name);
    if (formatted && !formatted.includes(".com") && formatted.trim() !== "") {
      return formatted;
    }
    return formatBusinessName(place?.id) || place?.name || "";
  }, [rawPlaceVideos, place?.name, place?.id, drawerDomain]);

  const effectiveWebsite = React.useMemo(() => {
    if (place.website && place.website.trim() !== "" && !place.website.includes("maps.google.com")) {
      const w = place.website.trim();
      return w.startsWith("http://") || w.startsWith("https://") ? w : `https://${w}`;
    }
    if (drawerDomain) {
      return `https://${drawerDomain}`;
    }
    if (place.brandDomain) {
      const d = extractCleanDomain(place.brandDomain);
      if (d) return `https://${d}`;
    }
    const cleanFromId = extractCleanDomain(place.id);
    if (cleanFromId && cleanFromId.includes(".")) {
      return `https://${cleanFromId}`;
    }
    return null;
  }, [place, drawerDomain]);

  const displayWebsiteClean = React.useMemo(() => {
    if (!effectiveWebsite) return null;
    return effectiveWebsite.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "");
  }, [effectiveWebsite]);

  // Check if any video review for this place has a high quality banner or logo
  const reviewBannerUrl = React.useMemo(() => {
    if (place.bannerUrl && !place.bannerUrl.startsWith("blob:") && place.bannerUrl.trim() !== "" && !place.bannerUrl.includes("unsplash.com") && !place.bannerUrl.includes("placeholder") && !place.bannerUrl.includes("mock")) return place.bannerUrl;
    if (place.ogImage && !place.ogImage.startsWith("blob:") && place.ogImage.trim() !== "" && !place.ogImage.includes("unsplash.com") && !place.ogImage.includes("placeholder") && !place.ogImage.includes("mock")) return place.ogImage;
    for (const v of rawPlaceVideos) {
      const b = (v as any).placeBannerUrl || (v as any).bannerUrl || (v as any).ogImage;
      if (b && typeof b === "string" && !b.startsWith("blob:") && (b.startsWith("http://") || b.startsWith("https://") || b.startsWith("/api/") || b.startsWith("data:image/"))) {
        if (!b.includes("unsplash.com") && !b.includes("placeholder") && !b.includes("mock")) return b;
      }
    }
    for (const v of (allVideos || [])) {
      if (isPlaceReviewMatch(v, place)) {
        const b = (v as any).placeBannerUrl || (v as any).bannerUrl || (v as any).ogImage;
        if (b && typeof b === "string" && !b.startsWith("blob:") && (b.startsWith("http://") || b.startsWith("https://") || b.startsWith("/api/") || b.startsWith("data:image/"))) {
          if (!b.includes("unsplash.com") && !b.includes("placeholder") && !b.includes("mock")) return b;
        }
      }
    }
    return null;
  }, [place, rawPlaceVideos, allVideos]);

  // Background auto-enrichment: Fetch and sync rich metadata & business description from URL
  useEffect(() => {
    const targetUrl = place.website || (drawerDomain ? `https://${drawerDomain}` : null);
    
    if (!targetUrl || fetchedTargetUrlsRef.current.has(targetUrl)) {
      return;
    }

    const isGenericDesc = !place.description ||
      place.description.includes("Verified video review destination") ||
      place.description.includes("Verified Yoouz business listing") ||
      place.description.includes("Verified Google Maps") ||
      place.description === "No description available.";

    const isGenericName = !place.name ||
      place.name === place.brandDomain ||
      place.name === drawerDomain ||
      place.name.toLowerCase().includes("hostinger") ||
      place.name.toLowerCase().includes("untitled") ||
      place.name.toLowerCase() === "website";

    const needsBanner = !reviewBannerUrl && !place.bannerUrl && !place.ogImage;
    const hasValidLogo = Boolean(
      place.logoUrl &&
      place.logoUrl.trim() !== "" &&
      !place.logoUrl.startsWith("data:;") &&
      !place.logoUrl.includes("760X310") &&
      !place.logoUrl.includes("fallback")
    );
    const needsLogo = !hasValidLogo;

    if (targetUrl && (isGenericDesc || isGenericName || needsBanner || needsLogo)) {
      fetchedTargetUrlsRef.current.add(targetUrl);
      let isMounted = true;
      fetch(`/api/url-metadata?url=${encodeURIComponent(targetUrl)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (isMounted && data) {
            if (data.image) {
              setFetchedBannerUrl(data.image);
            }
            if (onUpdatePlace && (data.image || (data.logo && !hasValidLogo) || data.title || data.description)) {
              onUpdatePlace({
                ...place,
                name: (data.title && isGenericName) ? data.title : place.name,
                description: (data.description && isGenericDesc) ? data.description : (place.description || data.description || ""),
                bannerUrl: place.bannerUrl || data.image || "",
                ogImage: place.ogImage || data.image || "",
                logoUrl: hasValidLogo ? place.logoUrl : (data.logo || place.logoUrl || ""),
                avatarUrl: hasValidLogo ? place.avatarUrl : (data.logo || place.avatarUrl || ""),
                brandDomain: place.brandDomain || data.domain || drawerDomain || undefined,
                photos: data.image ? Array.from(new Set([...(place.photos || []), data.image])) : place.photos
              });
            }
          }
        })
        .catch(() => {});
      return () => {
        isMounted = false;
      };
    }
  }, [place.id, place.website, drawerDomain, reviewBannerUrl, onUpdatePlace]);

  const isYoouzPlace = drawerDomain === "yoouz.com" || drawerDomain === "yoouz" || (place?.name && place.name.toLowerCase() === "yoouz");
  const YOOUZ_CDN_BANNER = "https://rev1.b-cdn.net/banners/yoouz_brand_banner.jpg";

  // Helper to check for broken/placeholder/stale banners
  const isBadBanner = (url?: string | null) => {
    if (!url) return true;
    const u = url.toLowerCase();
    return u.includes('yoouz.com/og-banner.png') || u.includes('placeholder') || u.includes('mock') || u.includes('unsplash.com') || u.includes('1789810172562');
  };

  const cleanBannerUrl = !isBadBanner(place.bannerUrl) ? place.bannerUrl : (isYoouzPlace ? YOOUZ_CDN_BANNER : "");
  const cleanOgImage = !isBadBanner(place.ogImage) ? place.ogImage : (isYoouzPlace ? YOOUZ_CDN_BANNER : "");
  const cleanReviewBanner = !isBadBanner(reviewBannerUrl) ? reviewBannerUrl : "";
  const cleanFetchedBanner = !isBadBanner(fetchedBannerUrl) ? fetchedBannerUrl : "";

  const effectiveBanner =
    cleanBannerUrl ||
    cleanOgImage ||
    cleanReviewBanner ||
    cleanFetchedBanner ||
    (drawerDomain && KNOWN_BRAND_BANNERS[drawerDomain]) ||
    (drawerDomain && KNOWN_BRAND_BANNERS[`www.${drawerDomain}`]) ||
    getPlaceBannerUrl(place) ||
    (isYoouzPlace ? YOOUZ_CDN_BANNER : "") ||
    "";

  // Check if photos are authentic place photos
  const allPhotos = Array.from(
    new Set([
      effectiveBanner,
      cleanBannerUrl,
      cleanOgImage,
      ...(place.photos || []).filter(p => !isBadBanner(p)),
      (drawerDomain && KNOWN_BRAND_BANNERS[drawerDomain]),
      (drawerDomain && KNOWN_BRAND_BANNERS[`www.${drawerDomain}`]),
      getPlaceBannerUrl(place),
      (isYoouzPlace ? YOOUZ_CDN_BANNER : "")
    ])
  ).filter((p): p is string => {
    if (!p || p.startsWith("blob:")) return false;
    if (p.startsWith("data:image/")) return true;
    if (isBadBanner(p)) return false;
    if (p === effectiveBanner || p === cleanBannerUrl || p === cleanOgImage || p === YOOUZ_CDN_BANNER) return true;
    const lower = p.toLowerCase();
    if (lower.includes("favicon") || lower.includes(".ico")) {
      return false;
    }
    return true;
  });

  const hasAuthenticPhoto = allPhotos.length > 0;

  const primaryLogoUrl = React.useMemo(() => {
    if (drawerDomain === "yoouz.com" || drawerDomain === "yoouz" || (place.name && place.name.toLowerCase() === "yoouz")) return "/favicon.svg";
    if (drawerDomain && KNOWN_BRAND_LOGOS[drawerDomain]) return KNOWN_BRAND_LOGOS[drawerDomain];

    // Priority 1: Canonical place record logo (ignoring wide header banners)
    const canonicalPlaceLogo = getPlaceLogoUrl(place) || place.logoUrl || place.avatarUrl;
    if (canonicalPlaceLogo && !canonicalPlaceLogo.startsWith("data:;") && canonicalPlaceLogo.trim() !== "" && !canonicalPlaceLogo.includes("LogoHeader") && !canonicalPlaceLogo.includes("1024x170")) {
      return getCleanLogoUrl(canonicalPlaceLogo, drawerDomain);
    }

    // Priority 2: Video review logo
    const matchingVidWithLogo = rawPlaceVideos.find((v) => Boolean(v.placeLogoUrl && !v.placeLogoUrl.startsWith("data:;") && v.placeLogoUrl.trim() !== "" && !v.placeLogoUrl.includes("LogoHeader") && !v.placeLogoUrl.includes("1024x170")));
    if (matchingVidWithLogo?.placeLogoUrl) {
      return getCleanLogoUrl(matchingVidWithLogo.placeLogoUrl, drawerDomain);
    }

    if (drawerDomain) return getCleanLogoUrl(null, drawerDomain);
    return null;
  }, [place, drawerDomain, rawPlaceVideos]);

  // Genuine check filters
  const hasGenuinePhone = Boolean(
    place.phone &&
    place.phone.trim() !== "" &&
    !place.phone.includes("555") &&
    !place.phone.includes("019-2834")
  );

  const hasGenuineWebsite = Boolean(
    effectiveWebsite &&
    effectiveWebsite.trim() !== "" &&
    !effectiveWebsite.includes("maps.google.com")
  );

  const hasGenuineHours = Boolean(
    place.openingHours &&
    place.openingHours.trim() !== "" &&
    place.openingHours !== "Open 24 hours"
  );

  const hasGenuinePlusCode = Boolean(
    place.plusCode &&
    place.plusCode.trim() !== "" &&
    !place.plusCode.includes("849VC9FW")
  );
  const isClaimedLocally = (() => {
    try {
      if (typeof window === "undefined") return false;
      const claimedList = JSON.parse(localStorage.getItem("copo_claimed_places") || "[]");
      if (Array.isArray(claimedList)) {
        if (claimedList.includes(place.id) || (place.brandDomain && claimedList.includes(place.brandDomain))) {
          return true;
        }
      }
      const rawSession = localStorage.getItem("copo_business_verified_session");
      if (rawSession) {
        const sess = JSON.parse(rawSession);
        if (
          sess &&
          (sess.placeId === place.id ||
            sess.placeId === place.brandDomain ||
            (sess.domain &&
              (place.id.includes(sess.domain) ||
                (place.website && place.website.includes(sess.domain)))))
        ) {
          return true;
        }
      }
    } catch (e) {}
    return false;
  })();

  const isYoouzBusiness =
    place.id === "yoouz.com" ||
    place.id === "yoouz-com" ||
    (place.name && place.name.toLowerCase() === "yoouz") ||
    (place.brandDomain && place.brandDomain.toLowerCase() === "yoouz.com");

  const isClaimed = Boolean(
    isYoouzBusiness ||
    isClaimedLocally ||
    (place.isClaimed && (isYoouzBusiness || (place.claimedByEmail && place.claimedByEmail !== "info@yoouz.com")))
  );

  const isUserOwner = Boolean(
    (currentUser &&
      ((place.claimedByEmail && currentUser.email === place.claimedByEmail) ||
       (place.ownerId && currentUser.id === place.ownerId) ||
       (place.staffEmails && currentUser.email && place.staffEmails.includes(currentUser.email)))) ||
    (() => {
      try {
        if (typeof window === "undefined") return false;
        const rawSession = localStorage.getItem("copo_business_verified_session");
        if (rawSession) {
          const sess = JSON.parse(rawSession);
          if (
            sess &&
            (sess.placeId === place.id ||
              sess.placeId === place.brandDomain ||
              (sess.domain &&
                (place.id.includes(sess.domain) ||
                  (place.website && place.website.includes(sess.domain)))))
          ) {
            return true;
          }
        }
      } catch (e) {}
      return false;
    })()
  );

  const hasUpgraded = Boolean(isClaimed || (place.subscriptionPlan && place.subscriptionPlan !== "free"));

  const openEditModal = () => {
    setEditPhone(hasGenuinePhone ? (place.phone || "") : "");
    setEditWebsite(effectiveWebsite || place.website || "");
    setEditHours(hasGenuineHours ? (place.openingHours || "") : "");
    
    // Clear URL-based fallback addresses so they can enter a real clean address
    const isAddressUrl = place.address && (place.address.startsWith("http") || place.address.includes("www."));
    setEditAddress(isAddressUrl ? "" : (place.address || ""));
    
    // Default description should be clean unless it came from real URL metadata description.
    // (If it is the default filler description, clear it so it starts empty!)
    const isDefaultDescription = place.description && (
      place.description.includes("Verified Yoouz business listing") || 
      place.description.includes("Verified Google Maps business listing") || 
      place.description === "No description available."
    );
    setEditDescription(isDefaultDescription ? "" : (place.description || ""));
    
    setEditEmail(place.email || "");
    setEditLogoUrl(place.logoUrl || "");
    setEditBannerUrl(place.bannerUrl || "");
    setClaimAsOwner(false);
    setModalStep(1);
    setShowHoursHelper(false);
    setIsEditModalOpen(true);
  };

  const handleSaveBusinessInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdatePlace) {
      const cleanWebsite = editWebsite.trim();
      const updated: Place = {
        ...place,
        phone: editPhone.trim(),
        website: cleanWebsite,
        brandDomain: cleanWebsite ? extractCleanDomain(cleanWebsite) : place.brandDomain,
        openingHours: editHours.trim(),
        address: editAddress.trim(),
        description: editDescription.trim(),
        email: editEmail.trim(),
        logoUrl: editLogoUrl,
        bannerUrl: editBannerUrl,
        isClaimed: place.isClaimed || (claimAsOwner && !!currentUser),
        claimedByEmail: place.claimedByEmail || (claimAsOwner && currentUser ? currentUser.email : undefined),
        isSavedToProfile: true
      };
      onUpdatePlace(updated);
    }
    setIsEditModalOpen(false);
    setCopiedNotification(
      claimAsOwner && currentUser 
        ? "Business claimed and updated successfully!" 
        : "Business information updated successfully!"
    );
    setTimeout(() => setCopiedNotification(""), 3000);
  };

  const handleClaimOrEditClick = () => {
    if (place.isClaimed) {
      if (currentUser && currentUser.email === place.claimedByEmail) {
        openEditModal();
      } else {
        setCopiedNotification("This business is claimed. Only the verified owner can edit details.");
        setTimeout(() => setCopiedNotification(""), 4000);
      }
    } else {
      openEditModal();
    }
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleOpenDirections = () => {
    const url = getGoogleMapsDirectionsUrl(place, displayedPlaceName);
    window.open(url, "_blank");
  };

  const { dragOffsetY, swipeProps } = useSwipeDownToDismiss({
    onDismiss: onClose,
    threshold: 60
  });

  return (
    <>
      {/* Mobile Backdrop (Bottom Sheet) */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200 ${isEditModalOpen ? "hidden" : "block"}`} 
        onClick={() => {
          triggerHaptic("light");
          onClose();
        }} 
      />

      <aside
        id="google-maps-business-panel"
        style={dragOffsetY > 0 ? { transform: `translateY(${dragOffsetY}px)`, transition: 'none' } : undefined}
        className={`fixed inset-x-0 bottom-0 md:bottom-auto md:inset-auto md:relative w-full md:w-[350px] lg:w-[430px] h-[100dvh] md:h-[100dvh] bg-zinc-950 md:bg-zinc-900 rounded-none text-white md:text-white flex flex-col shadow-none md:shadow-lg border-r border-zinc-800 md:border-zinc-800 shrink-0 overflow-hidden animate-in slide-in-from-bottom md:slide-in-from-left duration-200 select-none overscroll-contain transition-transform ${isEditModalOpen ? "z-[90] md:z-[90]" : "z-50 md:z-20"}`}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full w-full">
        {/* Mobile Pull Handle Indicator */}
        <div 
          {...swipeProps}
          className="absolute top-0 left-0 right-0 h-8 flex items-center justify-center z-30 md:hidden cursor-grab active:cursor-grabbing touch-none"
        >
          <div className="w-12 h-1.5 bg-white/60 rounded-full shadow-md mix-blend-difference" />
        </div>

        {/* Top Header Banner */}
        <div 
          {...swipeProps}
          className="relative h-48 w-full shrink-0 flex items-center justify-center bg-zinc-950 touch-pan-y"
        >
        {/* Top-Left Back / Close Button (Both Desktop & Mobile) */}
        <button
          id="btn-close-place-drawer"
          onClick={() => {
            triggerHaptic("light");
            onClose();
          }}
          className="absolute top-[calc(0.75rem+env(safe-area-inset-top,0px))] left-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xl shadow-xl flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer border border-white/15 z-30"
          title={t("common.back", "Back to previous page")}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Top-Right Header Actions: Share & Report / Flag */}
        <div className="absolute top-[calc(0.75rem+env(safe-area-inset-top,0px))] right-3 flex items-center gap-2 z-30">
          <button
            onClick={() => {
              triggerHaptic("light");
              handleShare();
            }}
            className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xl shadow-xl flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer border border-white/15"
            title={t("place.shareBusiness", "Share Business")}
          >
            <Share2 className="w-4 h-4" />
          </button>
          {onOpenReport && (
            <button
              id="btn-report-business-header"
              onClick={() => {
                triggerHaptic("medium");
                onOpenReport({
                  type: "place",
                  placeName: displayedPlaceName,
                  placeId: place.id
                });
              }}
              className="w-9 h-9 rounded-full bg-black/60 hover:bg-red-500/80 backdrop-blur-xl shadow-xl flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer border border-white/15"
              title={t("place.reportBusiness", "Report or Flag Business")}
            >
              <Flag className="w-4 h-4 text-white" />
            </button>
          )}
        </div>

        {copiedNotification && (
          <div className="absolute top-14 right-3 bg-zinc-900 text-white text-xs px-3 py-1.5 rounded-md shadow-lg z-40 animate-in fade-in">
            {copiedNotification}
          </div>
        )}

        {hasAuthenticPhoto && !bannerError ? (
          <div className="absolute inset-0 w-full h-full bg-black overflow-hidden flex items-center justify-center group">
            {/* Full Widescreen Edge-to-Edge Banner Image */}
            <img
              src={getProxiedImageUrl(allPhotos[photoIndex] || allPhotos[0])}
              alt={displayedPlaceName}
              loading="eager"
              decoding="sync"
              fetchPriority="high"
              className="absolute inset-0 w-full h-full object-cover p-0 z-10"
              referrerPolicy="no-referrer"
              onLoad={() => {
                const currentSrc = getProxiedImageUrl(allPhotos[photoIndex] || allPhotos[0]);
                if (currentSrc) KNOWN_LOADED_BANNERS.add(currentSrc);
              }}
              onError={() => {
                if (photoIndex + 1 < allPhotos.length) {
                  setPhotoIndex(prev => prev + 1);
                } else {
                  setBannerError(true);
                }
              }}
            />
            {/* Subtle overlay */}
            <div className="absolute inset-0 bg-black/5 z-20 pointer-events-none" />
          </div>
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-zinc-950 via-slate-900 to-zinc-950 flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:32px_32px]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.15),transparent_70%)]" />
            <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm z-10">
              <span className="text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase select-none">Verified Listing</span>
            </div>
          </div>
        )}

        {/* Overlapping Business Logo - Clean white squircle frame matching video player & search */}
        <div className="absolute -bottom-10 sm:-bottom-12 left-6 w-24 h-24 sm:w-32 sm:h-32 rounded-[24px] sm:rounded-[28px] border-[4px] sm:border-[5px] border-zinc-950 md:border-zinc-900 bg-white shadow-2xl flex items-center justify-center z-20 p-2 sm:p-2.5 ring-1 ring-white/20 overflow-hidden group">
          <CopoBrandLogo
            domain={drawerDomain || place.brandDomain}
            name={displayedPlaceName}
            website={place.website}
            logoUrl={primaryLogoUrl || place.logoUrl}
            bannerUrl={effectiveBanner || place.bannerUrl || place.ogImage}
            className="w-full h-full flex items-center justify-center overflow-hidden bg-transparent"
            imageClassName="w-full h-full object-contain rounded-[16px] sm:rounded-[20px]"
            fallbackTextClassName="font-black text-3xl sm:text-5xl text-zinc-950"
          />
        </div>
      </div>

      {/* Business Title & Star Rating Header */}
      <div className="px-6 pt-14 pb-3 bg-zinc-950 md:bg-zinc-900">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0 flex-1 pr-2">
            <h2 className="text-2xl font-bold text-white md:text-white tracking-tight leading-tight line-clamp-2 [overflow-wrap:anywhere]">
              {displayedPlaceName || ""}
              <CheckCircle className="inline-block w-[22px] h-[22px] ml-1.5 align-text-bottom fill-white text-black shrink-0 relative -top-[2px]" />
            </h2>
          </div>

          {/* Business Follow Button - High-end standard placement */}
          {onToggleFollowPlace && (
            <button
              onClick={() => onToggleFollowPlace(place.id)}
              onMouseEnter={() => setIsHoveredUnfollow(true)}
              onMouseLeave={() => setIsHoveredUnfollow(false)}
              className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0 border whitespace-nowrap active:scale-95 ${
                place.isFollowed
                  ? isHoveredUnfollow
                    ? "bg-red-500/15 text-red-400 border-red-500/30"
                    : "bg-zinc-800 text-zinc-100 border-zinc-700 hover:bg-zinc-700"
                  : "bg-white text-zinc-950 hover:bg-zinc-200 border-white"
              }`}
              title={place.isFollowed ? (isHoveredUnfollow ? t("business.unfollowTitle", "Unfollow this business") : t("business.followingTitle", "You are following this business")) : t("business.followTitle", "Follow this business")}
            >
              {place.isFollowed ? (
                isHoveredUnfollow ? (
                  <>
                    <UserMinus className="w-3.5 h-3.5" />
                    <span>{t("business.unfollow", "Unfollow")}</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-zinc-200" />
                    <span>{t("business.following", "Following")}</span>
                  </>
                )
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t("business.follow", "Follow")}</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap text-sm">
          <div className="flex items-center gap-1">
            <span className="font-bold text-white md:text-white">{dynamicAvgRating.toFixed(1)}</span>
            <div className="flex items-center text-zinc-200 gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.round(dynamicAvgRating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-zinc-800 text-zinc-800"
                  }`}
                />
              ))}
            </div>
          </div>
          <span className="text-zinc-200 font-medium">
            ({dynamicReviewCount.toLocaleString()} {dynamicReviewCount === 1 ? t("place.review", "review") : t("place.reviews", "reviews")})
          </span>
          {place.category && (
            <>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-300 font-medium px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs">
                {place.category}
              </span>
            </>
          )}
          {effectiveWebsite && (
            <>
              <span className="text-zinc-700">·</span>
              <a 
                href={effectiveWebsite} 
                target="_blank" 
                rel="noreferrer" 
                className="text-zinc-200 hover:text-white hover:underline font-medium truncate max-w-[180px]"
              >
                {displayWebsiteClean}
              </a>
            </>
          )}
          
          {(() => {
            if (isYoouz) return null;
            const invalidLocations = ["online", "global", "worldwide", "global headquarters", "n/a"];
            const validCity = place.city && !invalidLocations.includes(place.city.toLowerCase().trim()) ? place.city.trim() : "";
            const validCountry = place.country && !invalidLocations.includes(place.country.toLowerCase().trim()) ? place.country.trim() : "";
            if (!validCity && !validCountry) return null;
            return (
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-700">·</span>
                <span className="text-zinc-200 text-xs font-medium">
                  {validCity}{validCity && validCountry ? ", " : ""}{validCountry}
                </span>
              </div>
            );
          })()}
        </div>
      </div>

        {/* Google Maps Tabs: Overview | Reviews | About */}
      <div className="flex items-center border-b border-zinc-800 bg-zinc-950 px-5 text-sm font-semibold text-zinc-200">
        <button
          onClick={() => handleTabClick("overview")}
          className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === "overview"
              ? "border-white text-white font-bold"
              : "border-transparent hover:text-zinc-200"
          }`}
        >
          {t("place.overview", "Overview")}
        </button>
        <button
          onClick={() => handleTabClick("reviews")}
          className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === "reviews"
              ? "border-white text-white font-bold"
              : "border-transparent hover:text-zinc-200"
          }`}
        >
          <span>{t("place.reviews", "Video Reviews")}</span>
          <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-200 text-xs font-bold border border-zinc-700">
            {rawPlaceVideos.length}
          </span>
        </button>
        <button
          onClick={() => handleTabClick("about")}
          className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === "about"
              ? "border-white text-white font-bold"
              : "border-transparent hover:text-zinc-200"
          }`}
        >
          {t("place.about", "About")}
        </button>
      </div>

        {/* Main Content Area */}
        <div ref={contentRef} className="flex-1 overflow-y-auto divide-y divide-zinc-800 bg-zinc-950" style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>
          {/* Action Buttons Row */}
          <div className="px-4 py-3.5 flex items-center justify-around text-center bg-zinc-900/60 border-b border-zinc-800 gap-1 sm:gap-2">
            {hasPhysicalLocation ? (
              <button
                onClick={handleOpenDirections}
                className="flex flex-col items-center gap-1.5 text-xs text-white hover:text-white hover:scale-105 transition-transform group shrink-0 min-w-[52px] cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-zinc-800 text-white border border-zinc-700 flex items-center justify-center shadow-sm group-hover:bg-zinc-700 transition-colors">
                  <Navigation className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-[11px] text-white">{t("place.directions", "Directions")}</span>
              </button>
            ) : place.website ? (
              <a
                href={place.website.startsWith("http") ? place.website : `https://${place.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 text-xs text-white hover:text-white hover:scale-105 transition-transform group shrink-0 min-w-[52px] cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-zinc-800 text-white border border-zinc-700 flex items-center justify-center shadow-sm group-hover:bg-zinc-700 transition-colors">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-[11px] text-white">{t("place.website", "Website")}</span>
              </a>
            ) : null}

            <button
              onClick={() => onToggleGrabPlace && onToggleGrabPlace(place)}
              className="flex flex-col items-center gap-1.5 text-xs text-white hover:text-white hover:scale-105 transition-transform group shrink-0 min-w-[52px] cursor-pointer"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-colors ${
                  isSaved
                    ? "bg-amber-500 text-zinc-950"
                    : "bg-zinc-800 text-white border border-zinc-700 group-hover:bg-zinc-700"
                }`}
              >
                {isSaved ? (
                  <BookmarkCheck className="w-5 h-5 fill-zinc-950 text-zinc-950" />
                ) : (
                  <Bookmark className="w-5 h-5 text-white" />
                )}
              </div>
              <span className="font-bold text-[11px] text-white">
                {isSaved ? t("place.saved", "Saved") : t("place.save", "Save")}
              </span>
            </button>

            <button
              id="btn-share-place"
              onClick={() => {
                triggerHaptic("light");
                handleShare();
              }}
              className="flex flex-col items-center gap-1.5 text-xs text-white hover:text-white hover:scale-105 transition-transform group shrink-0 min-w-[52px] cursor-pointer"
              title={t("place.shareBusiness", "Share Business")}
            >
              <div className="w-10 h-10 rounded-full bg-zinc-800 text-white border border-zinc-700 flex items-center justify-center shadow-sm">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-[11px] text-white">{t("common.share", "Share")}</span>
            </button>

            <button
              onClick={() => setActiveTab("reviews")}
              className="flex flex-col items-center gap-1.5 text-xs text-white hover:text-white hover:scale-105 transition-transform group shrink-0 min-w-[52px] cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-zinc-800 text-white border border-zinc-700 flex items-center justify-center shadow-sm">
                <Video className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-[11px] text-white">{t("place.videoReviews", "Video Reviews")}</span>
            </button>

            {onStartChat && (
              <button
                id="btn-chat-business"
                onClick={() => {
                  triggerHaptic("light");
                  if (!isClaimed) {
                    setShowUnclaimedChatModal(true);
                    return;
                  }

                  if (isUserOwner) {
                    setCopiedNotification(t("place.ownerChatNotice", "This is your business listing. Customer messages appear in your Messages inbox."));
                    setTimeout(() => setCopiedNotification(""), 4000);
                    return;
                  }

                  onStartChat(place.id, place.name, getPlaceLogoUrl(place));
                }}
                className="flex flex-col items-center gap-1.5 text-xs text-white hover:text-white hover:scale-105 transition-transform group shrink-0 min-w-[52px] cursor-pointer"
                title={`${t("place.chatWith", "Chat with")} ${displayedPlaceName}`}
              >
                <div className="w-10 h-10 rounded-full bg-zinc-800 text-white border border-zinc-700 flex items-center justify-center shadow-sm">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-[11px] text-white">{t("place.chat", "Chat")}</span>
              </button>
            )}

            {onOpenReport && (
              <button
                id="btn-report-business-row"
                onClick={() => {
                  triggerHaptic("medium");
                  onOpenReport({
                    type: "place",
                    placeName: displayedPlaceName,
                    placeId: place.id
                  });
                }}
                className="flex flex-col items-center gap-1.5 text-xs text-white hover:text-red-400 hover:scale-105 transition-transform group shrink-0 min-w-[52px] cursor-pointer"
                title={t("place.reportBusiness", "Report / Flag Business")}
              >
                <div className="w-10 h-10 rounded-full bg-zinc-800 text-white border border-zinc-700 flex items-center justify-center shadow-sm group-hover:border-red-500/50 group-hover:bg-red-500/10 transition-colors">
                  <Flag className="w-4 h-4 text-white group-hover:text-red-400 transition-colors" />
                </div>
                <span className="font-bold text-[11px] text-white group-hover:text-red-400 transition-colors">{t("common.report", "Report")}</span>
              </button>
            )}
          </div>
          
          {/* CTA Row - Only rendered when business has upgraded or owner is viewing */}
          {(hasUpgraded || isUserOwner) && (
            <div className="px-5 py-3.5 border-b border-zinc-800 md:border-zinc-800">
              {hasUpgraded ? (
                (() => {
                  const ctaType = typeof window !== 'undefined' ? (localStorage.getItem('demo_cta_type') || 'book_now') : 'book_now';
                  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('demo_cta_url') : '';
                  const storedLabel = typeof window !== 'undefined' ? localStorage.getItem('demo_cta_label') : '';
                  const storedColor = typeof window !== 'undefined' ? (localStorage.getItem('demo_cta_color') || '#1a73e8') : '#1a73e8';
                  const isPhone = ctaType.includes('call') || storedUrl?.startsWith('tel:') || ctaType === 'emergency_call';
                  const ctaUrl = storedUrl || (isPhone && (place as any).phone ? `tel:${(place as any).phone}` : (hasGenuineWebsite ? place.website : "#"));
                  const ctaLabel = storedLabel || ctaType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                  
                  return (
                    <a 
                      href={isPhone && !ctaUrl.startsWith('tel:') ? `tel:${ctaUrl}` : (ctaUrl || "#")} 
                      target={isPhone ? "_self" : "_blank"} 
                      rel="noreferrer"
                      className="w-full py-3 hover:bg-zinc-200 bg-white text-zinc-950 font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all block text-center"
                    >
                      <span>{ctaLabel}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>
                  );
                })()
              ) : null}
            </div>
          )}
          
          {copiedNotification && (
            <div className="px-4 py-2 bg-zinc-800 text-white text-xs font-semibold text-center border-y border-zinc-700 animate-in fade-in">
              {copiedNotification}
            </div>
          )}
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="divide-y divide-zinc-800">
              {/* Clickable About Summary (Switch to About Tab) */}
              <div 
                onClick={() => handleTabClick("about")}
                className="px-5 py-4 hover:bg-zinc-900 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-200">{t("place.aboutThisBusiness", "About this business")}</p>
                    <p className="text-xs text-zinc-200 line-clamp-2 leading-relaxed">
                      {place.description || t("place.defaultDescription", "Verified Yoouz business listing with authentic video reviews from real users.")}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-zinc-200 -rotate-90 mt-4 group-hover:text-white transition-colors" />
                </div>
              </div>

              {/* Video Reviews Featured on Overview Tab (Small Video Previews Grid) */}
              <div className="p-5 space-y-3 bg-zinc-900/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-zinc-200" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                      {t("place.videoReviews", "Video Reviews")} ({rawPlaceVideos.length})
                    </h3>
                  </div>
                  {rawPlaceVideos.length > 0 && (
                    <button
                      onClick={() => handleTabClick("reviews")}
                      className="text-[11px] font-bold text-zinc-200 hover:text-white hover:underline cursor-pointer"
                    >
                      {t("place.seeAll", "See all")} ({rawPlaceVideos.length})
                    </button>
                  )}
                </div>

                {rawPlaceVideos.length === 0 ? (
                  <div className="bg-zinc-900 rounded-2xl p-6 text-center border border-zinc-800 space-y-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 text-zinc-200 flex items-center justify-center mx-auto">
                      <Video className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white">{t("place.noReviewsYet", "No video reviews yet")}</p>
                      <p className="text-[11px] text-zinc-200">{t("place.beFirstCreator", "Be the first creator to post a video review for")} {displayedPlaceName}!</p>
                    </div>
                    <button
                      onClick={() => onRecordForPlace(place)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-xs shadow-sm active:scale-95 transition-all cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{t("place.postVideoReview", "Post Video Review")}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-1.5">
                      {rawPlaceVideos.slice(0, 6).map((v) => {
                        const displayViews = getDisplayViews(v);
                        const formattedViews = formatViewCount(displayViews);
                        const posterUrl = resolveVideoPosterUrl(v);

                        return (
                          <div
                            key={v.id}
                            onClick={() => onSelectVideo(v.id)}
                            className="relative aspect-[3/4] rounded-lg overflow-hidden bg-zinc-900 cursor-pointer group transition-all transform active:scale-95 shadow-2xs hover:opacity-90 ring-1 ring-zinc-800"
                          >
                            <CopoVideoThumbnail
                              video={v}
                              alt={v.caption || v.placeName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/25 pointer-events-none" />

                            {/* Rating Badge */}
                            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[9px] font-black text-white flex items-center gap-0.5 shadow-xs border border-white/10">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              <span>{v.rating ? v.rating.toFixed(1) : "5.0"}</span>
                            </div>

                            {/* Bottom Meta Info (2-Line Domain + Views - Clean & Premium) */}
                            <div className="absolute bottom-1.5 left-1.5 right-1.5 flex flex-col justify-end gap-0.5 pointer-events-none z-10">
                              <span className="text-[9.5px] text-zinc-100 font-bold drop-shadow-md leading-[1.15] line-clamp-2 break-all">
                                {getDisplayUrlAsDomain(v)}
                              </span>
                              <div className="flex items-center gap-1 text-white text-[10px] font-black drop-shadow-md">
                                <Play className="w-2.5 h-2.5 fill-white shrink-0" />
                                <span>{formattedViews}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => onRecordForPlace(place)}
                      className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-850 hover:text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xs active:scale-98 transition-all cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-zinc-200" />
                      <span>{t("place.recordVideoReview", "Record Video Review")}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Collapsed Info Toggle */}
              {!showDetailedInfo ? (
                <div 
                  onClick={() => setShowDetailedInfo(true)}
                  className="px-5 py-4 flex items-center justify-between hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Info className="w-5 h-5 text-zinc-200" />
                    <span className="text-sm font-bold text-white">{t("place.businessDetails", "Business Details")}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-zinc-200" />
                </div>
              ) : (
                <>
                  <div 
                    onClick={() => setShowDetailedInfo(false)}
                    className="px-5 py-4 flex items-center justify-between hover:bg-zinc-900 transition-colors cursor-pointer bg-zinc-900/50"
                  >
                    <div className="flex items-center gap-3">
                      <Info className="w-5 h-5 text-zinc-200" />
                      <span className="text-sm font-bold text-white">{t("place.hideDetails", "Hide Details")}</span>
                    </div>
                    <ChevronUp className="w-4 h-4 text-zinc-200" />
                  </div>
                  
                  {/* Address Line */}
                  {displayAddress && (
                    <div className="px-5 py-3.5 flex items-start justify-between gap-3 hover:bg-zinc-900 transition-colors animate-in slide-in-from-top-1 duration-200">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-zinc-200 shrink-0 mt-0.5" />
                        <div className="text-xs space-y-0.5">
                          <p className="text-zinc-200 font-medium leading-relaxed">
                            {displayAddress}
                          </p>
                          {place.locatedIn && !isAddressUrl && (
                            <p className="text-zinc-200 text-[11px]">{t("place.locatedIn", "Located in")}: {place.locatedIn}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Hours Line */}
                  <div className="px-5 py-3.5 hover:bg-zinc-900 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-zinc-200 shrink-0" />
                        <div className="text-xs">
                          {hasGenuineHours ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-white font-bold">{t("place.open", "Open")}</span>
                              <span className="text-zinc-200 ml-1">⋅ {place.openingHours}</span>
                            </div>
                          ) : (
                            <span className="text-zinc-200">{t("place.hoursNotProvided", "Hours not provided")}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>


                  {/* Website Line */}
                  <div className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-zinc-900 transition-colors">
                    <div className="flex items-center gap-3 truncate w-full">
                      <Globe className="w-5 h-5 text-zinc-200 shrink-0" />
                      {effectiveWebsite ? (
                        <a
                          href={effectiveWebsite}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 hover:underline font-medium truncate flex items-center gap-1.5"
                        >
                          <span className="truncate">{displayWebsiteClean}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-zinc-200 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-200">{t("place.websiteNotProvided", "Website not provided")}</span>
                      )}
                    </div>
                  </div>

                  {/* Phone Line */}
                  <div className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-zinc-900 transition-colors">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-zinc-200 shrink-0" />
                      {hasGenuinePhone ? (
                        <a
                          href={`tel:${place.phone}`}
                          className="text-xs text-white hover:text-zinc-200 font-bold"
                        >
                          {place.phone}
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-200">{t("place.phoneNotProvided", "Phone not provided")}</span>
                      )}
                    </div>
                  </div>

                  {/* Email Line */}
                  <div className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-zinc-900 transition-colors">
                    <div className="flex items-center gap-3 truncate">
                      <Mail className="w-5 h-5 text-zinc-200 shrink-0" />
                      {place.email && place.email.trim() !== "" ? (
                        <a
                          href={`mailto:${place.email}`}
                          className="text-xs text-zinc-200 hover:text-white hover:underline font-medium truncate"
                        >
                          {place.email}
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-200">{t("place.emailNotProvided", "Email not provided")}</span>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Plus Code Line if valid */}
              {hasGenuinePlusCode && (
                <div className="px-5 py-3.5 flex items-center gap-3 hover:bg-zinc-900 transition-colors">
                  <div className="w-5 h-5 flex items-center justify-center text-zinc-200 font-black text-sm shrink-0">
                    ⁘
                  </div>
                  <span className="text-xs text-zinc-200 font-mono">{place.plusCode}</span>
                </div>
              )}



              {/* Claim / Edit Business CTA Inline Row */}
              {!isClaimed ? (
                <div
                  onClick={() => {
                    if (onClaimBusiness) {
                      onClaimBusiness(place);
                    } else {
                      setIsClaimModalOpen(true);
                    }
                  }}
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-zinc-900 transition-colors cursor-pointer border-t border-zinc-800"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-zinc-400 shrink-0" />
                    <div>
                      <span className="text-xs text-zinc-200 font-semibold block">{t("place.claimThisBusiness", "Claim this business")}</span>
                      <span className="text-[11px] text-zinc-400 block">{t("place.claimSubtitle", "Verify ownership to edit & manage this profile")}</span>
                    </div>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-white text-zinc-950 font-bold hover:bg-zinc-200 transition-colors shadow-sm shrink-0">
                    {t("place.claim", "Claim")}
                  </span>
                </div>
              ) : (
                <div className="px-5 py-3.5 flex items-center justify-between hover:bg-zinc-900 transition-colors border-t border-zinc-800">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-zinc-300 shrink-0" />
                    <div>
                      <span className="text-xs text-zinc-100 font-semibold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-zinc-300" />
                        {t("place.businessClaimed", "Business Claimed")}
                      </span>
                      <span className="text-[11px] text-zinc-400 block">
                        {t("place.claimedDesc", "Official claimed listing on Yoouz")}
                      </span>
                    </div>
                  </div>
                  {isUserOwner ? (
                    <button
                      onClick={openEditModal}
                      className="text-[11px] px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700 font-bold hover:bg-zinc-700 transition-colors cursor-pointer"
                    >
                      {t("place.editDetails", "Edit Details")}
                    </button>
                  ) : (
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-zinc-800/80 border border-zinc-700 text-zinc-300 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3 text-zinc-300" /> {t("place.verified", "Claimed")}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VIDEO REVIEWS - TikTok-Style 3-Column Grid */}
          {activeTab === "reviews" && (
            <div className="p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {/* Premium Sort & Filter Options */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-200 md:text-zinc-200">
                    {t("place.sortFilterReviews", "Sort & Filter Reviews")} ({placeVideos.length})
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-1.5">
                  <button 
                    onClick={() => setReviewSort("latest")}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${reviewSort === "latest" ? "bg-white text-zinc-950 border-white shadow-xs" : "bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:text-zinc-200"}`}
                  >
                    {t("place.latest", "Latest")}
                  </button>
                  <button 
                    onClick={() => setReviewSort("popular")}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${reviewSort === "popular" ? "bg-white text-zinc-950 border-white shadow-xs" : "bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:text-zinc-200"}`}
                  >
                    {t("place.mostLiked", "Most Liked")}
                  </button>
                  <button 
                    onClick={() => setReviewSort("highest")}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${reviewSort === "highest" ? "bg-white text-zinc-950 border-white shadow-xs" : "bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:text-zinc-200"}`}
                  >
                    {t("place.highestRated", "Highest Rated")}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  <button 
                    onClick={() => setStarFilter("all")}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition-all border shrink-0 ${starFilter === "all" ? "bg-white border-white text-zinc-950" : "bg-zinc-900 border-zinc-800 text-zinc-200 hover:text-zinc-200"}`}
                  >
                    {t("place.all", "All")}
                  </button>
                  {[5, 4, 3, 2, 1].map(stars => (
                    <button 
                      key={stars}
                      onClick={() => setStarFilter(stars)}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition-all border flex items-center gap-1 shrink-0 ${starFilter === stars ? "bg-white border-white text-zinc-950" : "bg-zinc-900 border-zinc-800 text-zinc-200 hover:text-zinc-200"}`}
                    >
                      {stars} <Star className={`w-2.5 h-2.5 ${starFilter === stars ? "fill-zinc-950 text-zinc-950" : "fill-amber-400 text-amber-400"}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* 3-Column Video Reviews Grid */}
              {placeVideos.length === 0 ? (
                <div className="bg-zinc-900 rounded-2xl p-6 text-center border border-zinc-800 text-zinc-200 text-xs">
                  {t("place.noReviewsMatchFilter", "No video reviews match this filter.")}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {placeVideos.map((v) => {
                    const displayViews = getDisplayViews(v);
                    const formattedViews = formatViewCount(displayViews);
                    const posterUrl = resolveVideoPosterUrl(v);

                    return (
                      <div
                        key={v.id}
                        onClick={() => {
                          onSelectVideo(v.id);
                        }}
                        className="relative aspect-[3/4] rounded-lg overflow-hidden bg-zinc-900 cursor-pointer group transition-all transform active:scale-95 shadow-2xs hover:opacity-90 ring-1 ring-zinc-800"
                      >
                        {/* Video Thumbnail */}
                        <CopoVideoThumbnail
                          video={v}
                          alt={v.caption || v.placeName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                        />

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/25 pointer-events-none" />

                        {/* Rating Badge */}
                        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[9px] font-black text-white flex items-center gap-0.5 shadow-xs border border-white/10">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          <span>{v.rating ? v.rating.toFixed(1) : "5.0"}</span>
                        </div>

                        {/* Bottom Meta Info (2-Line Domain + Views - Clean & Premium) */}
                        <div className="absolute bottom-1.5 left-1.5 right-1.5 flex flex-col justify-end gap-0.5 pointer-events-none z-10">
                          <span className="text-[9.5px] text-zinc-100 font-bold drop-shadow-md leading-[1.15] line-clamp-2 break-all">
                            {getDisplayUrlAsDomain(v)}
                          </span>
                          <div className="flex items-center gap-1 text-white text-[10px] font-black drop-shadow-md">
                            <Play className="w-2.5 h-2.5 fill-white shrink-0" />
                            <span>{formattedViews}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Record Review CTA */}
              <div className="pt-4 text-center border-t border-zinc-800">
                <button 
                  onClick={() => onRecordForPlace(place)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>{t("place.recordVideoReview", "Record Video Review")}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: ABOUT */}
          {activeTab === "about" && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Info className="w-4 h-4 text-zinc-200" />
                  <span>{t("place.about", "About")} {displayedPlaceName}</span>
                </h3>
                {isUserOwner && (
                  <button
                    onClick={openEditModal}
                    className="text-xs text-zinc-200 hover:text-white font-bold hover:underline flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{t("common.edit", "Edit")}</span>
                  </button>
                )}
              </div>

              {/* Business Category (if provided) */}
              {place.category && (
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                    {t("place.businessCategory", "Business Category")}
                  </span>
                  <p className="text-sm text-white font-semibold">
                    {place.category}
                  </p>
                </div>
              )}

              {/* Full Description & URL Metadata */}
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-200 block">
                  {t("place.businessDescription", "Business Description")}
                </span>
                <p className="text-xs text-zinc-200 leading-relaxed font-medium">
                  {place.description ||
                    t("place.defaultDescription", "Verified Yoouz business listing with authentic video reviews from real users.")}
                </p>
              </div>

              {/* Maps Integration for physical places, or Online Presence for websites */}
              {hasPhysicalLocation ? (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-zinc-200">{t("place.locationMap", "Location Map")}</h4>
                    <button onClick={handleOpenDirections} className="text-[10px] text-zinc-200 hover:text-white font-bold hover:underline flex items-center gap-1">
                      <Navigation className="w-3 h-3" />
                      {t("place.getDirections", "Get Directions")}
                    </button>
                  </div>
                  <div className="w-full h-[200px] rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 cursor-pointer relative group" onClick={handleOpenDirections}>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors z-10 flex items-center justify-center pointer-events-none">
                       <div className="bg-zinc-900 px-3 py-1.5 rounded-full shadow-lg text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">{t("place.openInMaps", "Open in Maps")}</div>
                    </div>
                    <iframe 
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      style={{ border: 0, pointerEvents: 'none' }} 
                      referrerPolicy="no-referrer-when-downgrade" 
                      src={getGoogleMapsEmbedUrl(place, displayedPlaceName)}
                      title="Google Maps Location"
                    />
                  </div>
                  {displayAddress && (
                     <div className="flex items-start gap-2 mt-3 p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                       <MapPin className="w-4 h-4 text-zinc-200 shrink-0 mt-0.5" />
                       <p className="text-xs text-zinc-200 font-medium">{displayAddress}</p>
                     </div>
                  )}
                </div>
              ) : place.website ? (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-zinc-200">{t("place.onlinePresence", "Online Presence")}</h4>
                  </div>
                  <a
                    href={place.website.startsWith("http") ? place.website : `https://${place.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-zinc-900/80 hover:bg-zinc-900 rounded-2xl border border-zinc-800 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-white/20 flex items-center justify-center shrink-0 p-1 overflow-hidden">
                        <CopoBrandLogo
                          domain={drawerDomain || place.brandDomain}
                          name={displayedPlaceName}
                          website={place.website}
                          logoUrl={primaryLogoUrl || place.logoUrl}
                          bannerUrl={effectiveBanner || place.bannerUrl || place.ogImage}
                          className="w-full h-full rounded-lg flex items-center justify-center overflow-hidden bg-transparent"
                          imageClassName="w-full h-full object-contain rounded-lg"
                          fallbackTextClassName="font-black text-xs text-zinc-950"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">{t("place.visitOfficialWebsite", "Visit Official Website")}</p>
                        <p className="text-xs text-zinc-400 truncate max-w-[200px] sm:max-w-xs">{displayWebsiteClean || place.website}</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                  </a>
                </div>
              ) : null}

              <div className="pt-2 space-y-2">
                <h4 className="text-xs font-bold text-zinc-200">{t("place.accessibilityServices", "Accessibility & Services")}</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(place.amenities || ["Wheelchair accessible entrance", "Public Reception", "Verified Listing"]).map(
                    (amenity, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-lg bg-zinc-900 text-xs text-zinc-200 font-medium border border-zinc-800"
                      >
                        ✓ {amenity}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Staff & Ownership - Premium Section */}
              <div className="pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-zinc-200" />
                  <h4 className="text-xs font-bold text-zinc-200">{t("place.managementStaff", "Management & Staff")}</h4>
                </div>
                
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                        <UserCheck className="w-4 h-4 text-zinc-200" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-bold text-white">{t("place.verifiedManagement", "Verified Management")}</p>
                        <p className="text-[10px] text-zinc-200">{t("place.authorizedManage", "Authorized to manage this profile")}</p>
                      </div>
                    </div>
                  </div>

                  {place.staffEmails && place.staffEmails.length > 0 && (
                    <div className="pt-2 space-y-2 border-t border-zinc-800">
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-200">{t("place.recognizedStaff", "Recognized Staff")}</p>
                      <div className="flex flex-wrap gap-2">
                        {place.staffEmails.map((email, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 bg-zinc-850 border border-zinc-800 px-2.5 py-1 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                            <span className="text-[10px] font-medium text-zinc-200">{email.split('@')[0]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isClaimed && (
                    <button
                      onClick={() => setIsClaimModalOpen(true)}
                      className="w-full py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-[11px] font-bold text-zinc-200 hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-zinc-200" />
                      {t("place.claimVerifyListing", "Claim & Verify Business Listing")}
                    </button>
                  )}
                </div>
              </div>

              {onOpenReport && (
                <div className="pt-2">
                  <button
                    id="btn-report-business-about"
                    onClick={() => {
                      triggerHaptic("medium");
                      onOpenReport({
                        type: "place",
                        placeName: displayedPlaceName,
                        placeId: place.id
                      });
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-900/60 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/30 text-zinc-300 hover:text-red-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>{t("place.reportInaccurate", "Report inaccurate info or flag business")}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      {/* EDIT / CLAIM BUSINESS MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs text-white">
          <div className="w-full max-w-md bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-800 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] text-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {modalStep === 1 ? t("place.suggestEdits", "Suggest Edits") : t("place.claimVerifyBusiness", "Claim & Verify Business")}
                </h3>
                <p className="text-xs text-zinc-200 truncate max-w-[280px]">{displayedPlaceName}</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-200 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Progress bar */}
            {!isClaimed && (
              <div className="flex items-center gap-2 my-4 px-1 shrink-0">
                <div 
                  onClick={() => setModalStep(1)}
                  className="flex-1 flex flex-col gap-1 cursor-pointer"
                >
                  <div className={`h-1.5 rounded-full transition-colors ${modalStep === 1 ? 'bg-white' : 'bg-zinc-800'}`} />
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${modalStep === 1 ? 'text-white' : 'text-zinc-200'}`}>
                    {t("place.stepSuggestEdits", "1. Suggest Edits")}
                  </span>
                </div>
                <div 
                  onClick={() => setModalStep(2)}
                  className="flex-1 flex flex-col gap-1 cursor-pointer"
                >
                  <div className={`h-1.5 rounded-full transition-colors ${modalStep === 2 ? 'bg-white' : 'bg-zinc-800'}`} />
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${modalStep === 2 ? 'text-white' : 'text-zinc-200'}`}>
                    {t("place.stepClaimBusiness", "2. Claim Business")}
                  </span>
                </div>
              </div>
            )}

            {/* Scrollable Modal Content */}
            <div className="overflow-y-auto py-2 flex-1 pr-1 -mr-1">
              {modalStep === 1 ? (
                /* STEP 1: SUGGEST EDITS FORM */
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    // Just Suggest Edits immediately, set claimAsOwner to false
                    setClaimAsOwner(false);
                    handleSaveBusinessInfo(e);
                  }} 
                  className="space-y-4 text-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-zinc-200">{t("place.address", "Address")}</label>
                      {editAddress && (
                        <button
                          type="button"
                          onClick={() => setEditAddress("")}
                          className="text-[10px] text-zinc-200 hover:text-white hover:underline font-semibold cursor-pointer"
                        >
                          {t("common.clear", "Clear")}
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder="e.g. 100 Main St, San Francisco, CA"
                      className="w-full px-3 py-2.5 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-500 bg-zinc-950 text-white placeholder:text-zinc-400 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-zinc-200 block mb-1">{t("place.phoneNumber", "Phone Number")}</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="+1 415-555-0100"
                        className="w-full px-3 py-2.5 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-500 bg-zinc-950 text-white placeholder:text-zinc-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-zinc-200 block mb-1">{t("place.website", "Website")}</label>
                      <input
                        type="url"
                        value={editWebsite}
                        onChange={(e) => setEditWebsite(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-3 py-2.5 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-500 bg-zinc-950 text-white placeholder:text-zinc-400 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-zinc-200 block mb-1">{t("place.emailAddressOptional", "Email Address (Optional)")}</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="e.g. contact@business.com"
                      className="w-full px-3 py-2.5 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-500 bg-zinc-950 text-white placeholder:text-zinc-400 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-zinc-200 block mb-1">{t("place.logo", "Logo")}</label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setIsUploadingLogo(true);
                              const reader = new FileReader();
                              reader.onload = async (ev) => {
                                try {
                                  const base64 = ev.target?.result as string;
                                  const targetId = place.id || 'yoouz.com';
                                  const uploadRes = await fetch("/api/business/upload-image", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ imageBase64: base64, imageType: "logo", placeId: targetId })
                                  });
                                  if (uploadRes.ok) {
                                    const data = await uploadRes.json();
                                    setEditLogoUrl(data.imageUrl || base64);
                                  } else {
                                    setEditLogoUrl(base64);
                                  }
                                } catch (err) {
                                  console.error("Logo upload failed", err);
                                } finally {
                                  setIsUploadingLogo(false);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                          id="logo-upload"
                        />
                        <label htmlFor="logo-upload" className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-zinc-700 rounded-xl bg-zinc-950 text-zinc-200 hover:border-zinc-500 cursor-pointer transition-all">
                          <ImageIcon className="w-4 h-4" />
                          <span className="text-xs truncate">{isUploadingLogo ? t("common.uploading", "Uploading...") : editLogoUrl ? t("common.changeLogo", "Change Logo") : t("common.uploadLogo", "Upload Logo")}</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="font-bold text-zinc-200 block mb-1">{t("place.banner", "Cover Banner")}</label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setIsUploadingBanner(true);
                              const reader = new FileReader();
                              reader.onload = async (ev) => {
                                try {
                                  const base64 = ev.target?.result as string;
                                  const targetId = place.id || 'yoouz.com';
                                  const uploadRes = await fetch("/api/business/upload-image", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ imageBase64: base64, imageType: "banner", placeId: targetId })
                                  });
                                  if (uploadRes.ok) {
                                    const data = await uploadRes.json();
                                    setEditBannerUrl(data.imageUrl || base64);
                                  } else {
                                    setEditBannerUrl(base64);
                                  }
                                } catch (err) {
                                  console.error("Banner upload failed", err);
                                } finally {
                                  setIsUploadingBanner(false);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                          id="banner-upload"
                        />
                        <label htmlFor="banner-upload" className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-zinc-700 rounded-xl bg-zinc-950 text-zinc-200 hover:border-zinc-500 cursor-pointer transition-all">
                          <ImageIcon className="w-4 h-4" />
                          <span className="text-xs truncate">{isUploadingBanner ? t("common.uploading", "Uploading...") : editBannerUrl ? t("common.changeBanner", "Change Banner") : t("common.uploadBanner", "Upload Banner")}</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-zinc-200">{t("place.openingHours", "Opening Hours")}</label>
                      <button
                        type="button"
                        onClick={() => setShowHoursHelper(!showHoursHelper)}
                        className="text-[10px] text-zinc-200 hover:text-white hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        🕒 {showHoursHelper ? t("place.hidePickerHelper", "Hide Picker Helper") : t("place.openPickerHelper", "Open Picker Helper")}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editHours}
                      onChange={(e) => setEditHours(e.target.value)}
                      placeholder="e.g. Mon-Fri: 9:00 AM - 6:00 PM"
                      className="w-full px-3 py-2.5 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-500 bg-zinc-950 text-white placeholder:text-zinc-400 transition-all"
                    />
                    
                    {/* Visual helper is now collapsible */}
                    {showHoursHelper && (
                      <div className="mt-2 p-2.5 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2 animate-in slide-in-from-top-1 duration-150">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-zinc-200 font-medium">{t("place.quickPresets", "Quick Presets:")}</span>
                          <button
                            type="button"
                            onClick={() => setEditHours("Available 24/7")}
                            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-200 font-bold border border-zinc-700 rounded-lg transition-colors cursor-pointer"
                          >
                            {t("place.available247", "Available 24/7")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditHours("Mon-Fri: 9:00 AM - 6:00 PM")}
                            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-200 font-bold border border-zinc-700 rounded-lg transition-colors cursor-pointer"
                          >
                            {t("place.monFriHours", "Mon-Fri 9AM-6PM")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditHours("Mon-Sat: 10:00 AM - 8:00 PM")}
                            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-200 font-bold border border-zinc-700 rounded-lg transition-colors cursor-pointer"
                          >
                            {t("place.monSatHours", "Mon-Sat 10AM-8PM")}
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-zinc-800">
                          <div>
                            <span className="text-[9px] text-zinc-200 block mb-0.5 font-bold">{t("place.days", "Days")}</span>
                            <select
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val) setEditHours(`${val}: 9:00 AM - 6:00 PM`);
                              }}
                              className="w-full p-1 bg-zinc-900 border border-zinc-700 rounded-lg text-[10px] text-white focus:outline-none cursor-pointer"
                            >
                              <option value="">{t("place.select", "Select...")}</option>
                              <option value="Mon-Fri">Mon-Fri</option>
                              <option value="Mon-Sat">Mon-Sat</option>
                              <option value="Mon-Sun">Mon-Sun</option>
                              <option value="Daily">Daily</option>
                            </select>
                          </div>
                          <div>
                            <span className="text-[9px] text-zinc-200 block mb-0.5 font-bold">{t("place.openFrom", "Open From")}</span>
                            <select
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditHours((prev) => {
                                  const parts = prev.split(":");
                                  const days = parts[0]?.trim() || "Mon-Fri";
                                  const rest = parts.slice(1).join(":").trim();
                                  const close = rest.split("-")[1]?.trim() || "6:00 PM";
                                  return `${days}: ${val} - ${close}`;
                                });
                              }}
                              className="w-full p-1 bg-zinc-900 border border-zinc-700 rounded-lg text-[10px] text-white focus:outline-none cursor-pointer"
                            >
                              <option value="9:00 AM">9:00 AM</option>
                              <option value="8:00 AM">8:00 AM</option>
                              <option value="10:00 AM">10:00 AM</option>
                              <option value="11:00 AM">11:00 AM</option>
                              <option value="12:00 PM">12:00 PM</option>
                            </select>
                          </div>
                          <div>
                            <span className="text-[9px] text-zinc-200 block mb-0.5 font-bold">{t("place.closeAt", "Close At")}</span>
                            <select
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditHours((prev) => {
                                  const parts = prev.split(":");
                                  const days = parts[0]?.trim() || "Mon-Fri";
                                  const rest = parts.slice(1).join(":").trim();
                                  const open = rest.split("-")[0]?.trim() || "9:00 AM";
                                  return `${days}: ${open} - ${val}`;
                                });
                              }}
                              className="w-full p-1 bg-zinc-900 border border-zinc-700 rounded-lg text-[10px] text-white focus:outline-none cursor-pointer"
                            >
                              <option value="6:00 PM">6:00 PM</option>
                              <option value="5:00 PM">5:00 PM</option>
                              <option value="7:00 PM">7:00 PM</option>
                              <option value="8:00 PM">8:00 PM</option>
                              <option value="9:00 PM">9:00 PM</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-zinc-200">{t("place.description", "Description")}</label>
                      {editDescription && (
                        <button
                          type="button"
                          onClick={() => setEditDescription("")}
                          className="text-[10px] text-zinc-200 hover:text-white hover:underline font-semibold cursor-pointer"
                        >
                          {t("common.clear", "Clear")}
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={3}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Brief description of the business..."
                      className="w-full px-3 py-2.5 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-500 bg-zinc-950 text-white placeholder:text-zinc-400 transition-all"
                    />
                  </div>

                  {/* Step 1 Footer buttons */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-800 mt-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="px-3.5 py-2 rounded-xl text-zinc-200 font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      {t("common.cancel", "Cancel")}
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="px-3.5 py-2 rounded-xl bg-zinc-800 text-zinc-200 hover:bg-zinc-700 font-bold transition-colors cursor-pointer border border-zinc-700"
                      >
                        {t("place.saveEdits", "Save Edits")}
                      </button>
                      {!isClaimed && (
                        <button
                          type="button"
                          onClick={() => setModalStep(2)}
                          className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold shadow-md transition-all cursor-pointer flex items-center gap-1"
                        >
                          {t("place.nextClaim", "Next: Claim ➔")}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              ) : (
                /* STEP 2: CLAIM & VERIFICATION */
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (claimAsOwner && !currentUser) return;
                    handleSaveBusinessInfo(e);
                  }} 
                  className="space-y-4 text-xs"
                >
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-start gap-3">
                    <ShieldCheck className="w-6 h-6 text-zinc-200 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-white text-sm">{t("place.verifyOwnership", "Verify Ownership")}</h4>
                      <p className="text-zinc-200 leading-relaxed text-[11px]">
                        {t("place.verifyOwnershipPrompt", "To verify that you own")} <strong className="text-white">{displayedPlaceName}</strong>, {t("place.insertTagPrompt", "please insert this verification tag into the HTML head section of your home page:")}
                      </p>
                      
                      <div className="mt-3 p-3 bg-zinc-900 rounded-xl text-[10px] font-mono text-zinc-200 break-all border border-zinc-800 relative group">
                        <span className="block pr-10">{`<meta name="yoouz-verification" content="verify_${place.id || 'business'}" />`}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`<meta name="yoouz-verification" content="verify_${place.id || 'business'}" />`);
                            setCopiedTag(true);
                            setTimeout(() => setCopiedTag(false), 2000);
                          }}
                          className="absolute right-2 top-2 p-1.5 bg-zinc-800 text-zinc-200 hover:text-white rounded-lg border border-zinc-700 text-[10px] font-bold cursor-pointer transition-all"
                        >
                          {copiedTag ? t("common.copied", "Copied!") : t("common.copy", "Copy")}
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-200 italic">
                        {t("place.crawlerTip", "Tip: Our crawler will look for this meta tag on your website to automatically activate your official badge.")}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2">
                    <h5 className="font-bold text-white text-[10px] uppercase tracking-wider">{t("place.ownerAdvantages", "Owner Advantages:")}</h5>
                    <ul className="space-y-1.5 text-[11px] text-zinc-200">
                      <li className="flex items-start gap-1.5">
                        <span className="text-white font-bold">✓</span>
                        <span><strong className="text-white">{t("place.advBadgeTitle", "Verification Badge")}</strong>: {t("place.advBadgeDesc", "Show clients your listing is official.")}</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-white font-bold">✓</span>
                        <span><strong className="text-white">{t("place.advRespondTitle", "Respond to Reviews")}</strong>: {t("place.advRespondDesc", "Engage directly with customers with your 'Owner' badge next to answers.")}</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-white font-bold">✓</span>
                        <span><strong className="text-white">{t("place.advLockTitle", "Lock Information")}</strong>: {t("place.advLockDesc", "Prevent standard viewers from overwriting key business coordinates.")}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={claimAsOwner}
                        onChange={(e) => setClaimAsOwner(e.target.checked)}
                        className="mt-0.5 rounded border-zinc-700 text-white focus:ring-zinc-400 cursor-pointer bg-zinc-900"
                      />
                      <div>
                        <span className="font-bold text-white block">{t("place.authorizedOwnerCheck", "I am the authorized owner / manager")}</span>
                        <span className="text-[10px] text-zinc-200 block leading-tight">
                          {t("place.authorizedOwnerDesc", "I confirm I represent this business and have authorization to claim it.")}
                        </span>
                      </div>
                    </label>

                    {claimAsOwner && !currentUser && (
                      <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-200 text-[10px] font-semibold leading-normal animate-in fade-in duration-150">
                        {t("place.mustSignInClaim", "⚠ You must sign in to claim this business. Please close this modal and sign in using the button at the top right first.")}
                      </div>
                    )}
                  </div>

                  {/* Step 2 Footer buttons */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-800 mt-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setModalStep(1)}
                      className="px-3.5 py-2 rounded-xl text-zinc-200 font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      {t("place.backToEdits", "← Back to Edits")}
                    </button>
                    <button
                      type="submit"
                      disabled={!claimAsOwner || (claimAsOwner && !currentUser)}
                      className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      {t("place.verifyClaimBusiness", "Verify & Claim Business")}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      
      </div>
    </aside>

      {/* Google-style Share Modal Popup */}
      <CopoShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareUrl={`${window.location.origin}/place/${getPlaceSlug(place)}`}
        title={displayedPlaceName}
        subtitle={t("place.businessLocation", "Business Location")}
        logoUrl={place.logoUrl || primaryLogoUrl || undefined}
        domain={drawerDomain || extractCleanDomain(place.website || place.id) || undefined}
        website={place.website || undefined}
        bannerUrl={place.bannerUrl || place.ogImage || undefined}
      />

      {/* Business Claim & Verification Modal via Resend */}
      <CopoBusinessClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        places={place ? [place] : []}
        selectedPlace={place}
        onSuccess={(session) => {
          if (onUpdatePlace && place) {
            onUpdatePlace({
              ...place,
              isClaimed: true,
              claimedByEmail: session.businessEmail
            });
          }
          setIsClaimModalOpen(false);
        }}
      />

      {/* Unclaimed Business Chat Notice Modal */}
      {showUnclaimedChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 mx-auto flex items-center justify-center shadow-inner">
                <MessageSquareOff className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-200 text-[10px] font-bold uppercase tracking-wider border border-zinc-700">
                  <ShieldAlert className="w-3 h-3" />
                  <span>{t("place.unclaimedBusiness", "Unclaimed Business")}</span>
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  {t("place.directMessagingUnavailable", "Direct Messaging Unavailable")}
                </h3>
                <p className="text-xs text-zinc-200 leading-relaxed font-medium">
                  <span className="font-bold text-white">{displayedPlaceName}</span> {t("place.unclaimedChatNotice", "has not claimed their official page on Yoouz yet, so they cannot receive or reply to customer messages.")}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-left space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Building2 className="w-4 h-4" />
                  <span>{t("place.areYouOwner", "Are you the owner or manager?")}</span>
                </div>
                <p className="text-[11px] text-zinc-200 leading-relaxed font-medium">
                  {t("place.claimListingPrompt", "Claim this listing with your official business email to activate 1-on-1 customer messaging, reply to video reviews, and showcase your profile.")}
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowUnclaimedChatModal(false);
                    if (onClaimBusiness) {
                      onClaimBusiness(place);
                    } else {
                      setIsClaimModalOpen(true);
                    }
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t("place.claimVerifyBusiness", "Claim & Verify Business")}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>

                <button
                  onClick={() => setShowUnclaimedChatModal(false)}
                  className="w-full py-2.5 px-4 rounded-xl text-zinc-200 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {t("common.dismiss", "Dismiss")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}; // End of CopoPlaceDrawer

