import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, limit } from "../lib/firebase";
import { db } from '../lib/firebase';
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
  CheckCircle2,
  Image as ImageIcon,
  SlidersHorizontal,
  Filter,
  Mail,
  UserPlus,
  UserCheck,
  MessageSquare,
  MessageSquareOff,
  ShieldAlert,
  Building2,
  ArrowRight,
  ExternalLink,
  Flag,
  Heart
} from "lucide-react";
import { Place, VideoReview, UserProfile } from "../types";
import { getPlaceLogoUrl, getCleanLogoUrl } from "../utils/logoUtils";
import { isPlaceReviewMatch, formatBusinessName } from "../utils/placeUtils";
import { resolveVideoPosterUrl } from "../utils/videoUtils";
import { CopoVideoThumbnail } from "./CopoVideoThumbnail";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { CopoBusinessPricingModal } from "./CopoBusinessPricingModal";
import { CopoShareModal } from "./CopoShareModal";
import { CopoBusinessClaimModal } from "./CopoBusinessClaimModal";
import { SEOTags } from "./SEOTags";
import { triggerHaptic } from "../utils/haptics";
import { useSwipeDownToDismiss } from "../hooks/useSwipeDownToDismiss";

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
  const [activeTab, setActiveTab] = useState<"overview" | "reviews" | "about">("overview");
  const [showHoursDropdown, setShowHoursDropdown] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState("");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [showUnclaimedChatModal, setShowUnclaimedChatModal] = useState(false);
  const [claimAsOwner, setClaimAsOwner] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [bannerError, setBannerError] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);

  const contentRef = React.useRef<HTMLDivElement>(null);

  // Reset image errors when place changes
  useEffect(() => {
    setBannerError(false);
    setLogoError(false);
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
     place.address.includes(".net"))
  );
  const displayAddress = isAddressUrl ? null : place.address;

  const rawPlaceVideos = allVideos.filter((v) => isPlaceReviewMatch(v, place));

  // Compute dynamic stats based on actual video reviews
  const dynamicReviewCount = rawPlaceVideos.length;
  const dynamicAvgRating = dynamicReviewCount > 0 
    ? rawPlaceVideos.reduce((acc, v) => acc + v.rating, 0) / dynamicReviewCount 
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

  // Check if photos are authentic place photos
  const allPhotos = Array.from(
    new Set([
      place.bannerUrl,
      place.ogImage,
      ...(place.photos || [])
    ])
  ).filter((p): p is string => {
    if (!p || p.startsWith("blob:") || p.startsWith("data:")) return false;
    // Always preserve bannerUrl, ogImage or logoUrl if they are the only assets
    if (p === place.bannerUrl || p === place.ogImage || p === place.logoUrl) return true;
    const lower = p.toLowerCase();
    // Only filter out obvious small icons if we have other photos
    if (lower.includes("favicon") || lower.includes(".ico")) {
      return false;
    }
    return true;
  });

  const hasAuthenticPhoto = allPhotos.length > 0;

  const drawerDomain = React.useMemo(() => {
    if (place.brandDomain) return place.brandDomain;
    if (place.website) {
      try {
        return new URL(place.website).hostname.replace(/^www\./, "");
      } catch {
        return null;
      }
    }
    return null;
  }, [place]);

  const primaryLogoUrl = React.useMemo(() => {
    if (place.logoUrl) return getCleanLogoUrl(place.logoUrl, drawerDomain);
    if (place.avatarUrl && !place.avatarUrl.includes("favicons")) return getCleanLogoUrl(place.avatarUrl, drawerDomain);
    if (drawerDomain) return getCleanLogoUrl(null, drawerDomain);
    if (place.avatarUrl) return getCleanLogoUrl(place.avatarUrl, drawerDomain);
    if (hasAuthenticPhoto) return allPhotos[0];
    return null;
  }, [place, drawerDomain, hasAuthenticPhoto, allPhotos]);

  // Genuine check filters
  const hasGenuinePhone = Boolean(
    place.phone &&
    place.phone.trim() !== "" &&
    !place.phone.includes("555") &&
    !place.phone.includes("019-2834")
  );

  const hasGenuineWebsite = Boolean(
    place.website &&
    place.website.trim() !== "" &&
    !place.website.includes("maps.google.com")
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
  const subscriptionPlan = place.subscriptionPlan || "basic";
  const isClaimed = Boolean(
    place.isClaimed ||
    (place.claimedByEmail && place.claimedByEmail.trim() !== "") ||
    subscriptionPlan === "pro" ||
    subscriptionPlan === "premium"
  );
  const hasUpgraded = subscriptionPlan === "pro" || subscriptionPlan === "premium" || (typeof window !== 'undefined' && localStorage.getItem('demo_cta_type') !== null);

  const isUserOwner = Boolean(
    currentUser &&
    (currentUser.email === "4samet@gmail.com" || 
     (place.claimedByEmail && currentUser.email === place.claimedByEmail) ||
     (place.staffEmails && currentUser.email && place.staffEmails.includes(currentUser.email)))
  );

  const openEditModal = () => {
    setEditPhone(hasGenuinePhone ? (place.phone || "") : "");
    setEditWebsite(hasGenuineWebsite ? (place.website || "") : "");
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
    setClaimAsOwner(false);
    setModalStep(1);
    setShowHoursHelper(false);
    setIsEditModalOpen(true);
  };

  const handleSaveBusinessInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdatePlace) {
      const updated: Place = {
        ...place,
        phone: editPhone.trim(),
        website: editWebsite.trim(),
        openingHours: editHours.trim(),
        address: editAddress.trim(),
        description: editDescription.trim(),
        email: editEmail.trim(),
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
    // If it has a website/domain, search ONLY by the domain to prevent Google Maps from failing to find it
    const query = place.brandDomain || place.website 
      ? (place.brandDomain || place.website)
      : `${formatBusinessName(place.name)}, ${place.address || place.city}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query.trim())}`;
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
        className={`fixed inset-x-0 bottom-0 md:bottom-auto md:inset-auto md:relative w-full md:w-[350px] lg:w-[430px] h-[100dvh] md:h-[100dvh] bg-zinc-950 md:bg-white rounded-none text-white md:text-zinc-900 flex flex-col shadow-none md:shadow-lg border-r border-zinc-800 md:border-zinc-200 shrink-0 overflow-hidden animate-in slide-in-from-bottom md:slide-in-from-left duration-200 select-none overscroll-contain transition-transform ${isEditModalOpen ? "z-[90] md:z-[90]" : "z-50 md:z-20"}`}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
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
        {/* Close / Exit Button Group */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-30">
          {/* Report Place Button */}
          {onOpenReport && place && (
            <button
              id="btn-report-place"
              onClick={() => {
                triggerHaptic("light");
                onOpenReport({ type: "place", placeName: place.name, placeId: place.id });
              }}
              className="w-9 h-9 rounded-full bg-zinc-900/90 md:bg-white/95 shadow-lg flex items-center justify-center text-zinc-300 md:text-zinc-600 hover:text-red-500 md:hover:text-red-600 hover:bg-zinc-800 md:hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer border border-zinc-750 md:border-zinc-200"
              title="Report inaccurate info"
            >
              <Flag className="w-4 h-4" />
            </button>
          )}

          {/* Share Button */}
          <button
            id="btn-share-place"
            onClick={() => {
              triggerHaptic("light");
              handleShare();
            }}
            className="w-9 h-9 rounded-full bg-zinc-900/90 md:bg-white/95 shadow-lg flex items-center justify-center text-zinc-200 md:text-zinc-800 hover:bg-zinc-800 md:hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer border border-zinc-750 md:border-zinc-200"
            title="Share Business"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Close Button */}
          <button
            id="btn-close-place-drawer"
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-zinc-900/90 md:bg-white/95 shadow-lg flex items-center justify-center text-zinc-200 md:text-zinc-800 hover:bg-zinc-800 md:hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer border border-zinc-750 md:border-zinc-200"
            title="Close business page"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {copiedNotification && (
          <div className="absolute top-14 right-3 bg-zinc-900 text-white text-xs px-3 py-1.5 rounded-md shadow-lg z-40 animate-in fade-in">
            {copiedNotification}
          </div>
        )}

        {hasAuthenticPhoto && !bannerError ? (
          <div className="absolute inset-0 w-full h-full bg-zinc-900 md:bg-zinc-100 relative overflow-hidden flex items-center justify-center group">
            {/* Blurred Background to fill the space without zooming the main image heavily */}
            <img
              src={allPhotos[0]}
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-50 scale-125"
              referrerPolicy="no-referrer"
            />
            {/* Foreground Banner Image - Contained properly */}
            <img
              src={allPhotos[0]}
              alt={formatBusinessName(place.name)}
              className="relative z-10 w-full h-full object-contain p-0"
              referrerPolicy="no-referrer"
              onError={() => setBannerError(true)}
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

        {/* Overlapping Business Logo/Avatar Badge - Official High-Res Brand Logo */}
        <CopoBrandLogo
          domain={place.brandDomain}
          name={formatBusinessName(place.name)}
          website={place.website}
          logoUrl={place.logoUrl}
          bannerUrl={place.bannerUrl || place.ogImage}
          className="absolute -bottom-10 sm:-bottom-12 left-6 w-24 h-24 sm:w-32 sm:h-32 rounded-[24px] sm:rounded-[28px] border-[4px] sm:border-[5px] border-zinc-950 md:border-white bg-white shadow-2xl flex items-center justify-center z-20 p-2 ring-1 ring-black/10"
          imageClassName="w-full h-full object-contain rounded-[16px] sm:rounded-[18px] [image-rendering:-webkit-optimize-contrast]"
          fallbackTextClassName="font-black text-3xl sm:text-5xl text-white drop-shadow-md"
        />
      </div>

      {/* Business Title & Star Rating Header */}
      <div className="px-6 pt-14 pb-3 bg-zinc-950 md:bg-white">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0 flex-1 pr-2">
            <h2 className="text-2xl font-bold text-white md:text-zinc-900 tracking-tight leading-tight [overflow-wrap:anywhere] flex items-center flex-wrap gap-x-1.5">
              <span>{formatBusinessName(place.name)}</span>
              {isClaimed && (
                <span title="Verified Business" className="inline-flex">
                  <CheckCircle2 className="w-5 h-5 fill-[#1a73e8] text-white shrink-0" />
                </span>
              )}
            </h2>
          </div>

          {/* Business Follow Button - High-end standard placement */}
          {onToggleFollowPlace && (
            <button
              onClick={() => onToggleFollowPlace(place.id)}
              className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0 border border-transparent ${
                place.isFollowed
                  ? "bg-zinc-800 md:bg-zinc-100 text-zinc-100 md:text-zinc-800 border-zinc-700 md:border-zinc-300 hover:bg-zinc-700 md:hover:bg-zinc-200"
                  : "bg-[#1a73e8] text-white hover:bg-blue-700 shadow-blue-900/20"
              }`}
            >
              {place.isFollowed ? (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Follow</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap text-sm">
          <div className="flex items-center gap-1">
            <span className="font-bold text-white md:text-zinc-900">{dynamicAvgRating.toFixed(1)}</span>
            <div className="flex items-center text-[#fbbc04]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.floor(dynamicAvgRating)
                      ? "fill-[#fbbc04] text-[#fbbc04]"
                      : "text-zinc-700 md:text-zinc-200"
                  }`}
                />
              ))}
            </div>
          </div>
          <span className="text-zinc-400 md:text-zinc-500 font-medium">
            ({dynamicReviewCount.toLocaleString()} {dynamicReviewCount === 1 ? "review" : "reviews"})
          </span>
          <span className="text-zinc-700 md:text-zinc-300">·</span>
          {place.website ? (
            <a 
              href={place.website} 
              target="_blank" 
              rel="noreferrer" 
              className="text-blue-400 md:text-[#1a73e8] hover:underline font-medium truncate max-w-[140px]"
            >
              {place.website.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "")}
            </a>
          ) : (
            <span className="text-zinc-400 md:text-zinc-500 font-medium">{place.category || "Establishment"}</span>
          )}
          
          {((place.city && place.city !== "Online") || place.country) && (
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-700 md:text-zinc-300">·</span>
              <span className="text-zinc-400 md:text-zinc-500 text-xs font-medium">
                {place.city !== "Online" ? place.city : ""}{place.city && place.city !== "Online" && place.country ? ", " : ""}{place.country}
              </span>
            </div>
          )}
        </div>
      </div>

        {/* Google Maps Tabs: Overview | Reviews | About */}
      <div className="flex items-center border-b border-zinc-800 md:border-zinc-200 bg-zinc-950 md:bg-white px-5 text-sm font-semibold text-zinc-400 md:text-zinc-500">
        <button
          onClick={() => handleTabClick("overview")}
          className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === "overview"
              ? "border-[#1a73e8] text-blue-400 md:text-[#1a73e8] font-bold"
              : "border-transparent hover:text-zinc-200 md:hover:text-zinc-800"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => handleTabClick("reviews")}
          className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === "reviews"
              ? "border-[#1a73e8] text-blue-400 md:text-[#1a73e8] font-bold"
              : "border-transparent hover:text-zinc-200 md:hover:text-zinc-800"
          }`}
        >
          <span>Reviews</span>
          <span className="px-1.5 py-0.5 rounded-full bg-blue-950/60 md:bg-blue-50 text-blue-300 md:text-[#1a73e8] text-xs font-bold border border-blue-800/60 md:border-blue-100">
            {rawPlaceVideos.length}
          </span>
        </button>
        <button
          onClick={() => handleTabClick("about")}
          className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === "about"
              ? "border-[#1a73e8] text-blue-400 md:text-[#1a73e8] font-bold"
              : "border-transparent hover:text-zinc-200 md:hover:text-zinc-800"
          }`}
        >
          About
        </button>
      </div>

        {/* Main Content Area */}
        <div ref={contentRef} className="flex-1 overflow-y-auto divide-y divide-zinc-850 md:divide-zinc-100 bg-zinc-950 md:bg-white" style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>
          {/* Action Buttons Row */}
          <div className="px-5 py-3.5 flex items-center justify-around text-center bg-zinc-900/60 md:bg-zinc-50/80 border-b border-zinc-800 md:border-zinc-100 gap-2">
            <button
              onClick={handleOpenDirections}
              className="flex flex-col items-center gap-1.5 text-xs text-blue-400 md:text-[#1a73e8] hover:scale-105 transition-transform group shrink-0 min-w-[58px] cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-[#1a73e8] text-white flex items-center justify-center shadow-md">
                <Navigation className="w-5 h-5 fill-white" />
              </div>
              <span className="font-semibold text-[11px] text-zinc-300 md:text-zinc-800">Directions</span>
            </button>

            <button
              onClick={() => onToggleGrabPlace && onToggleGrabPlace(place)}
              className="flex flex-col items-center gap-1.5 text-xs text-blue-400 md:text-[#1a73e8] hover:scale-105 transition-transform group shrink-0 min-w-[58px] cursor-pointer"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                  isSaved
                    ? "bg-emerald-600 text-white shadow-emerald-900/20"
                    : "bg-zinc-800 md:bg-[#e8f0fe] text-zinc-300 md:text-[#1a73e8] border border-zinc-700 md:border-[#d2e3fc]"
                }`}
              >
                {isSaved ? (
                  <BookmarkCheck className="w-5 h-5 fill-white" />
                ) : (
                  <Bookmark className="w-5 h-5" />
                )}
              </div>
              <span className="font-semibold text-[11px] text-zinc-300 md:text-zinc-800">
                {isSaved ? "Saved" : "Save"}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("reviews")}
              className="flex flex-col items-center gap-1.5 text-xs text-blue-400 md:text-[#1a73e8] hover:scale-105 transition-transform group shrink-0 min-w-[58px] cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-[#1a73e8] text-white flex items-center justify-center shadow-md shadow-[#1a73e8]/25">
                <Video className="w-5 h-5" />
              </div>
              <span className="font-semibold text-[11px] text-zinc-300 md:text-zinc-800">Video Reviews</span>
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
                    setCopiedNotification("This is your business listing. Customer messages appear in your Messages inbox.");
                    setTimeout(() => setCopiedNotification(""), 4000);
                    return;
                  }

                  onStartChat(place.claimedByEmail || place.id, place.name, getPlaceLogoUrl(place));
                }}
                className="flex flex-col items-center gap-1.5 text-xs text-blue-400 md:text-[#1a73e8] hover:scale-105 transition-transform group shrink-0 min-w-[58px] cursor-pointer"
                title={`Chat with ${formatBusinessName(place.name)}`}
              >
                <div className="w-10 h-10 rounded-full bg-zinc-800 md:bg-[#e8f0fe] text-zinc-300 md:text-[#1a73e8] border border-zinc-700 md:border-[#d2e3fc] flex items-center justify-center shadow-sm">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <span className="font-semibold text-[11px] text-zinc-300 md:text-zinc-800">Chat</span>
              </button>
            )}
          </div>
          
          {/* CTA Row - Only rendered when business has upgraded or owner is viewing */}
          {(hasUpgraded || isUserOwner) && (
            <div className="px-5 py-3.5 border-b border-zinc-800 md:border-zinc-100">
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
                      style={{ backgroundColor: storedColor }}
                      className="w-full py-3 hover:opacity-90 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all block text-center"
                    >
                      <span>{ctaLabel}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>
                  );
                })()
              ) : isUserOwner ? (
                <button 
                  onClick={() => setIsPricingModalOpen(true)}
                  className="w-full py-3 bg-zinc-800 md:bg-zinc-100 hover:bg-zinc-700 md:hover:bg-zinc-200 text-zinc-100 md:text-zinc-900 font-bold text-sm rounded-xl border border-zinc-700 md:border-zinc-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-zinc-400 md:text-zinc-500" />
                  <span>Unlock Call-To-Action (CTA) Button</span>
                </button>
              ) : null}
            </div>
          )}
          
          {copiedNotification && (
            <div className="px-4 py-2 bg-emerald-50 text-emerald-800 text-xs font-semibold text-center border-y border-emerald-200 animate-in fade-in">
              {copiedNotification}
            </div>
          )}
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="divide-y divide-zinc-800 md:divide-zinc-100">
              {/* Clickable About Summary (Switch to About Tab) */}
              <div 
                onClick={() => handleTabClick("about")}
                className="px-5 py-4 hover:bg-zinc-900 md:hover:bg-zinc-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 md:text-zinc-400">About this business</p>
                    <p className="text-xs text-zinc-300 md:text-zinc-600 line-clamp-2 leading-relaxed">
                      {place.description || "Verified Yoouz business listing with authentic video reviews from real users."}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-zinc-500 md:text-zinc-400 -rotate-90 mt-4 group-hover:text-blue-400 md:group-hover:text-[#1a73e8] transition-colors" />
                </div>
              </div>

              {/* Video Reviews Featured on Overview Tab (Small Video Previews Grid) */}
              <div className="p-5 space-y-3 bg-zinc-900/40 md:bg-zinc-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-[#1a73e8]" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-white md:text-zinc-900">
                      Video Reviews ({rawPlaceVideos.length})
                    </h3>
                  </div>
                  {rawPlaceVideos.length > 0 && (
                    <button
                      onClick={() => handleTabClick("reviews")}
                      className="text-[11px] font-bold text-blue-400 md:text-[#1a73e8] hover:underline cursor-pointer"
                    >
                      See all ({rawPlaceVideos.length})
                    </button>
                  )}
                </div>

                {rawPlaceVideos.length === 0 ? (
                  <div className="bg-zinc-900 md:bg-white rounded-2xl p-6 text-center border border-zinc-800 md:border-zinc-200/80 space-y-3">
                    <div className="w-10 h-10 rounded-full bg-blue-950/60 md:bg-blue-50 text-blue-400 md:text-[#1a73e8] flex items-center justify-center mx-auto">
                      <Video className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white md:text-zinc-800">No video reviews yet</p>
                      <p className="text-[11px] text-zinc-400 md:text-zinc-500">Be the first creator to post a video review for {formatBusinessName(place.name)}!</p>
                    </div>
                    <button
                      onClick={() => onRecordForPlace(place)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1a73e8] text-white font-bold text-xs shadow-sm hover:bg-[#1557b0] active:scale-95 transition-all cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Post Video Review</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-1.5">
                      {rawPlaceVideos.slice(0, 6).map((v) => {
                        const displayViews = v.likes * 14 + 12;
                        const formattedViews =
                          displayViews >= 1000
                            ? `${(displayViews / 1000).toFixed(1)}k`
                            : `${displayViews}`;
                        const posterUrl = resolveVideoPosterUrl(v);

                        return (
                          <div
                            key={v.id}
                            onClick={() => onSelectVideo(v.id)}
                            className="relative aspect-[3/4] rounded-lg overflow-hidden bg-zinc-900 cursor-pointer group transition-all transform active:scale-95 shadow-2xs hover:opacity-90 ring-1 ring-zinc-800 md:ring-zinc-200/50"
                          >
                            <CopoVideoThumbnail
                              video={v}
                              alt={v.caption || v.placeName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/25 pointer-events-none" />

                            {/* Rating Badge */}
                            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[9px] font-black text-amber-400 flex items-center gap-0.5 shadow-xs">
                              <Star className="w-2.5 h-2.5 fill-amber-400" />
                              <span>{v.rating ? v.rating.toFixed(1) : "5.0"}</span>
                            </div>

                            {/* Bottom Play count */}
                            <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-white text-[10px] font-bold drop-shadow-sm">
                              <Play className="w-2.5 h-2.5 fill-white" />
                              <span>{formattedViews}</span>
                            </div>

                            {/* Author name */}
                            {v.author?.name && (
                              <div className="absolute bottom-1.5 right-1.5 max-w-[65%] text-right text-[9px] text-white/90 truncate font-bold drop-shadow-sm">
                                {v.author.name}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => onRecordForPlace(place)}
                      className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 md:bg-white border border-zinc-800 md:border-zinc-200 text-zinc-200 md:text-zinc-800 hover:bg-zinc-850 md:hover:bg-zinc-50 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs active:scale-98 transition-all cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-[#1a73e8]" />
                      <span>Record Video Review</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Collapsed Info Toggle */}
              {!showDetailedInfo ? (
                <div 
                  onClick={() => setShowDetailedInfo(true)}
                  className="px-5 py-4 flex items-center justify-between hover:bg-zinc-900 md:hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Info className="w-5 h-5 text-[#1a73e8]" />
                    <span className="text-sm font-bold text-white md:text-zinc-800">Business Details</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-zinc-500 md:text-zinc-400" />
                </div>
              ) : (
                <>
                  <div 
                    onClick={() => setShowDetailedInfo(false)}
                    className="px-5 py-4 flex items-center justify-between hover:bg-zinc-900 md:hover:bg-zinc-50 transition-colors cursor-pointer bg-zinc-900/50 md:bg-zinc-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <Info className="w-5 h-5 text-[#1a73e8]" />
                      <span className="text-sm font-bold text-white md:text-zinc-800">Hide Details</span>
                    </div>
                    <ChevronUp className="w-4 h-4 text-zinc-500 md:text-zinc-400" />
                  </div>
                  
                  {/* Address Line */}
                  <div className="px-5 py-3.5 flex items-start justify-between gap-3 hover:bg-zinc-900 md:hover:bg-zinc-50 transition-colors animate-in slide-in-from-top-1 duration-200">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-[#1a73e8] shrink-0 mt-0.5" />
                      <div className="text-xs space-y-0.5">
                        <p className="text-zinc-200 md:text-zinc-800 font-medium leading-relaxed">
                          {displayAddress || "Address not provided"}
                        </p>
                        {place.locatedIn && !isAddressUrl && (
                          <p className="text-zinc-400 md:text-zinc-500 text-[11px]">Located in: {place.locatedIn}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hours Line */}
                  <div className="px-5 py-3.5 hover:bg-zinc-900 md:hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-[#1a73e8] shrink-0" />
                        <div className="text-xs">
                          {hasGenuineHours ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-emerald-400 md:text-emerald-700 font-bold">Open</span>
                              <span className="text-zinc-300 md:text-zinc-700 ml-1">⋅ {place.openingHours}</span>
                            </div>
                          ) : (
                            <span className="text-zinc-500">Hours not provided</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>


                  {/* Website Line */}
                  <div className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-zinc-900 md:hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center gap-3 truncate w-full">
                      <Globe className="w-5 h-5 text-[#1a73e8] shrink-0" />
                      {hasUpgraded ? (
                        hasGenuineWebsite ? (
                          <a
                            href={place.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-400 md:text-[#1a73e8] hover:underline font-medium truncate"
                          >
                            {place.website?.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "")}
                          </a>
                        ) : (
                          <span className="text-xs text-zinc-500">Website not provided</span>
                        )
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs text-zinc-600 md:text-zinc-400 blur-[3px] select-none">www.example.com</span>
                          {isUserOwner && (
                            <button onClick={() => setIsPricingModalOpen(true)} className="text-[10px] bg-amber-950/60 md:bg-amber-50 text-amber-300 md:text-amber-700 px-2 py-1 rounded-full border border-amber-800/60 md:border-amber-200 font-bold flex items-center gap-1 shrink-0">
                              <Lock className="w-3 h-3" />
                              Unlock Link
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Phone Line */}
                  <div className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-zinc-900 md:hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-[#1a73e8] shrink-0" />
                      {hasGenuinePhone ? (
                        <a
                          href={`tel:${place.phone}`}
                          className="text-xs text-white md:text-zinc-900 hover:text-blue-400 md:hover:text-[#1a73e8] font-bold"
                        >
                          {place.phone}
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-500">Phone not provided</span>
                      )}
                    </div>
                  </div>

                  {/* Email Line */}
                  <div className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-zinc-900 md:hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center gap-3 truncate">
                      <Mail className="w-5 h-5 text-[#1a73e8] shrink-0" />
                      {place.email && place.email.trim() !== "" ? (
                        <a
                          href={`mailto:${place.email}`}
                          className="text-xs text-blue-400 md:text-[#1a73e8] hover:underline font-medium truncate"
                        >
                          {place.email}
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-500">Email not provided</span>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Plus Code Line if valid */}
              {hasGenuinePlusCode && (
                <div className="px-5 py-3.5 flex items-center gap-3 hover:bg-zinc-900 md:hover:bg-zinc-50 transition-colors">
                  <div className="w-5 h-5 flex items-center justify-center text-[#1a73e8] font-black text-sm shrink-0">
                    ⁘
                  </div>
                  <span className="text-xs text-zinc-400 md:text-zinc-600 font-mono">{place.plusCode}</span>
                </div>
              )}

              {/* Claim / Edit Business CTA Inline Row */}
              {!place.isClaimed ? (
                <div
                  onClick={() => {
                    if (onClaimBusiness) {
                      onClaimBusiness(place);
                    } else {
                      openEditModal();
                    }
                  }}
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-zinc-900 md:hover:bg-zinc-50 transition-colors cursor-pointer border-t border-zinc-800 md:border-zinc-100"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-[#1a73e8] shrink-0" />
                    <span className="text-xs text-zinc-200 md:text-zinc-800 font-bold">Claim this business</span>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-950/60 md:bg-[#e8f0fe] text-blue-300 md:text-[#1a73e8] border border-blue-800/60 md:border-[#d2e3fc] font-bold">
                    Claim
                  </span>
                </div>
              ) : (
                <div className="px-5 py-3.5 flex items-center justify-between hover:bg-zinc-900 md:hover:bg-zinc-50 transition-colors border-t border-zinc-800 md:border-zinc-100">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 md:text-emerald-600 shrink-0" />
                    <span className="text-xs text-zinc-400 md:text-zinc-500 font-medium">Business claimed</span>
                  </div>
                  {isUserOwner ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsPricingModalOpen(true)}
                        className="text-[10px] px-2.5 py-1 rounded-full bg-amber-950/60 md:bg-amber-50 text-amber-300 md:text-amber-700 border border-amber-800/60 md:border-amber-200 font-bold hover:bg-amber-900/60 md:hover:bg-amber-100 transition-colors flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3" /> Plan: {subscriptionPlan.toUpperCase()}
                      </button>
                      <button
                        onClick={openEditModal}
                        className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-950/60 md:bg-emerald-50 text-emerald-300 md:text-emerald-700 border border-emerald-800/60 md:border-emerald-200 font-bold hover:bg-emerald-900/60 md:hover:bg-emerald-100 transition-colors"
                      >
                        Edit Details
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-zinc-850 md:bg-zinc-100 text-zinc-400 md:text-zinc-500 font-bold">
                      Verified
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
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 md:text-zinc-400">
                    Sort & Filter Reviews ({placeVideos.length})
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-1.5">
                  <button 
                    onClick={() => setReviewSort("latest")}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${reviewSort === "latest" ? "bg-white md:bg-zinc-950 border-white md:border-zinc-950 text-zinc-950 md:text-white shadow-xs" : "bg-zinc-900 md:bg-white border-zinc-800 md:border-zinc-200 text-zinc-300 md:text-zinc-600 hover:bg-zinc-850 md:hover:bg-zinc-50"}`}
                  >
                    Latest
                  </button>
                  <button 
                    onClick={() => setReviewSort("popular")}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${reviewSort === "popular" ? "bg-white md:bg-zinc-950 border-white md:border-zinc-950 text-zinc-950 md:text-white shadow-xs" : "bg-zinc-900 md:bg-white border-zinc-800 md:border-zinc-200 text-zinc-300 md:text-zinc-600 hover:bg-zinc-850 md:hover:bg-zinc-50"}`}
                  >
                    Most Liked
                  </button>
                  <button 
                    onClick={() => setReviewSort("highest")}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${reviewSort === "highest" ? "bg-white md:bg-zinc-950 border-white md:border-zinc-950 text-zinc-950 md:text-white shadow-xs" : "bg-zinc-900 md:bg-white border-zinc-800 md:border-zinc-200 text-zinc-300 md:text-zinc-600 hover:bg-zinc-850 md:hover:bg-zinc-50"}`}
                  >
                    Highest Rated
                  </button>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  <button 
                    onClick={() => setStarFilter("all")}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition-all border shrink-0 ${starFilter === "all" ? "bg-[#1a73e8] border-[#1a73e8] text-white" : "bg-zinc-900 md:bg-white border-zinc-800 md:border-zinc-200 text-zinc-300 md:text-zinc-600"}`}
                  >
                    All
                  </button>
                  {[5, 4, 3, 2, 1].map(stars => (
                    <button 
                      key={stars}
                      onClick={() => setStarFilter(stars)}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition-all border flex items-center gap-1 shrink-0 ${starFilter === stars ? "bg-[#1a73e8] border-[#1a73e8] text-white" : "bg-zinc-900 md:bg-white border-zinc-800 md:border-zinc-200 text-zinc-300 md:text-zinc-600"}`}
                    >
                      {stars} <Star className={`w-2.5 h-2.5 ${starFilter === stars ? "fill-white" : "fill-amber-400 text-amber-400"}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* 3-Column Video Reviews Grid */}
              {placeVideos.length === 0 ? (
                <div className="bg-zinc-900 md:bg-white rounded-2xl p-6 text-center border border-zinc-800 md:border-zinc-200 text-zinc-400 md:text-zinc-500 text-xs">
                  No video reviews match this filter.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {placeVideos.map((v) => {
                    const displayViews = v.likes * 14 + 12;
                    const formattedViews =
                      displayViews >= 1000
                        ? `${(displayViews / 1000).toFixed(1)}k`
                        : `${displayViews}`;
                    const posterUrl = resolveVideoPosterUrl(v);

                    return (
                      <div
                        key={v.id}
                        onClick={() => {
                          onSelectVideo(v.id);
                        }}
                        className="relative aspect-[3/4] rounded-lg overflow-hidden bg-zinc-900 cursor-pointer group transition-all transform active:scale-95 shadow-2xs hover:opacity-90 ring-1 ring-zinc-800 md:ring-zinc-200/50"
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
                        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[9px] font-black text-amber-400 flex items-center gap-0.5 shadow-xs">
                          <Star className="w-2.5 h-2.5 fill-amber-400" />
                          <span>{v.rating ? v.rating.toFixed(1) : "5.0"}</span>
                        </div>

                        {/* Bottom Left Play count */}
                        <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-white text-[10px] font-bold drop-shadow-sm">
                          <Play className="w-2.5 h-2.5 fill-white" />
                          <span>{formattedViews}</span>
                        </div>

                        {/* Author name */}
                        {v.author?.name && (
                          <div className="absolute bottom-1.5 right-1.5 max-w-[65%] text-right text-[9px] text-white/90 truncate font-bold drop-shadow-sm">
                            {v.author.name}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Record Review CTA */}
              <div className="pt-4 text-center border-t border-zinc-800 md:border-zinc-100">
                <button 
                  onClick={() => onRecordForPlace(place)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a73e8] text-white font-bold text-xs shadow-md shadow-[#1a73e8]/20 hover:bg-[#1557b0] active:scale-95 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Record Video Review</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: ABOUT */}
          {activeTab === "about" && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white md:text-zinc-900 flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#1a73e8]" />
                  <span>About {formatBusinessName(place.name)}</span>
                </h3>
                {isUserOwner && (
                  <button
                    onClick={openEditModal}
                    className="text-xs text-blue-400 md:text-[#1a73e8] font-bold hover:underline flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {/* Full Description & URL Metadata */}
              <div className="p-4 rounded-2xl bg-zinc-900 md:bg-zinc-50 border border-zinc-800 md:border-zinc-200/80 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 md:text-[#1a73e8] block">
                  Business Description
                </span>
                <p className="text-xs text-zinc-300 md:text-zinc-700 leading-relaxed font-medium">
                  {place.description ||
                    "Verified Yoouz business listing with authentic video reviews from real users."}
                </p>
              </div>

              {/* Maps Integration */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-zinc-200 md:text-zinc-800">Location Map</h4>
                  <button onClick={handleOpenDirections} className="text-[10px] text-blue-400 md:text-[#1a73e8] font-bold hover:underline flex items-center gap-1">
                    <Navigation className="w-3 h-3" />
                    Get Directions
                  </button>
                </div>
                <div className="w-full h-[200px] rounded-2xl overflow-hidden border border-zinc-800 md:border-zinc-200/80 bg-zinc-900 md:bg-zinc-50 cursor-pointer relative group" onClick={handleOpenDirections}>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 md:group-hover:bg-black/5 transition-colors z-10 flex items-center justify-center pointer-events-none">
                     <div className="bg-zinc-900 md:bg-white px-3 py-1.5 rounded-full shadow-lg text-[10px] font-bold text-blue-400 md:text-[#1a73e8] opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">Open in Maps</div>
                  </div>
                  <iframe 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    style={{ border: 0, pointerEvents: 'none' }} 
                    referrerPolicy="no-referrer-when-downgrade" 
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(place.name + ', ' + (place.address || place.city || ''))}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                    title="Google Maps Location"
                  />
                </div>
                {place.address && (
                   <div className="flex items-start gap-2 mt-3 p-3 bg-zinc-900 md:bg-zinc-50 rounded-xl border border-zinc-800 md:border-zinc-100">
                     <MapPin className="w-4 h-4 text-[#1a73e8] shrink-0 mt-0.5" />
                     <p className="text-xs text-zinc-300 md:text-zinc-700 font-medium">{place.address}</p>
                   </div>
                )}
              </div>

              <div className="pt-2 space-y-2">
                <h4 className="text-xs font-bold text-zinc-200 md:text-zinc-800">Accessibility & Services</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(place.amenities || ["Wheelchair accessible entrance", "Public Reception", "Verified Listing"]).map(
                    (amenity, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-lg bg-zinc-900 md:bg-zinc-100 text-xs text-zinc-300 md:text-zinc-700 font-medium border border-zinc-800 md:border-transparent"
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
                  <ShieldCheck className="w-4 h-4 text-emerald-500 md:text-emerald-600" />
                  <h4 className="text-xs font-bold text-zinc-200 md:text-zinc-800">Management & Staff</h4>
                </div>
                
                <div className="p-4 rounded-2xl bg-zinc-900 md:bg-zinc-50 border border-zinc-800 md:border-zinc-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-950/60 md:bg-emerald-100 flex items-center justify-center">
                        <UserCheck className="w-4 h-4 text-emerald-400 md:text-emerald-600" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-bold text-white md:text-zinc-800">Verified Management</p>
                        <p className="text-[10px] text-zinc-400 md:text-zinc-500">Authorized to manage this profile</p>
                      </div>
                    </div>
                  </div>

                  {place.staffEmails && place.staffEmails.length > 0 && (
                    <div className="pt-2 space-y-2 border-t border-zinc-800 md:border-zinc-200/50">
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 md:text-zinc-400">Recognized Staff</p>
                      <div className="flex flex-wrap gap-2">
                        {place.staffEmails.map((email, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 bg-zinc-850 md:bg-white border border-zinc-800 md:border-zinc-200 px-2.5 py-1 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-medium text-zinc-300 md:text-zinc-600">{email.split('@')[0]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!place.isClaimed && (
                    <button
                      onClick={() => setIsClaimModalOpen(true)}
                      className="w-full py-2.5 rounded-xl bg-blue-950/60 md:bg-blue-50/80 border border-blue-800/60 md:border-blue-200 text-[11px] font-bold text-blue-300 md:text-[#1a73e8] hover:bg-blue-900/60 md:hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-300 md:text-[#1a73e8]" />
                      Claim & Verify Business Listing
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

      {/* EDIT / CLAIM BUSINESS MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">
                  {modalStep === 1 ? "Suggest Edits" : "Claim & Verify Business"}
                </h3>
                <p className="text-xs text-zinc-500 truncate max-w-[280px]">{formatBusinessName(place.name)}</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Progress bar */}
            {!place.isClaimed && (
              <div className="flex items-center gap-2 my-4 px-1 shrink-0">
                <div 
                  onClick={() => setModalStep(1)}
                  className="flex-1 flex flex-col gap-1 cursor-pointer"
                >
                  <div className={`h-1.5 rounded-full transition-colors ${modalStep === 1 ? 'bg-[#1a73e8]' : 'bg-[#e8f0fe]'}`} />
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${modalStep === 1 ? 'text-[#1a73e8]' : 'text-zinc-400'}`}>
                    1. Suggest Edits
                  </span>
                </div>
                <div 
                  onClick={() => setModalStep(2)}
                  className="flex-1 flex flex-col gap-1 cursor-pointer"
                >
                  <div className={`h-1.5 rounded-full transition-colors ${modalStep === 2 ? 'bg-[#1a73e8]' : 'bg-zinc-200'}`} />
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${modalStep === 2 ? 'text-[#1a73e8]' : 'text-zinc-400'}`}>
                    2. Claim Business
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
                      <label className="font-bold text-zinc-700">Address</label>
                      {editAddress && (
                        <button
                          type="button"
                          onClick={() => setEditAddress("")}
                          className="text-[10px] text-red-500 hover:underline font-semibold cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder="e.g. 100 Main St, San Francisco, CA"
                      className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a73e8] bg-zinc-50 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-zinc-700 block mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="+1 415-555-0100"
                        className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a73e8] bg-zinc-50 focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-zinc-700 block mb-1">Website</label>
                      <input
                        type="url"
                        value={editWebsite}
                        onChange={(e) => setEditWebsite(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a73e8] bg-zinc-50 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Email Address (Optional)</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="e.g. contact@business.com"
                      className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a73e8] bg-zinc-50 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-zinc-700">Opening Hours</label>
                      <button
                        type="button"
                        onClick={() => setShowHoursHelper(!showHoursHelper)}
                        className="text-[10px] text-[#1a73e8] hover:underline font-bold flex items-center gap-1 cursor-pointer animate-pulse"
                      >
                        🕒 {showHoursHelper ? "Hide Picker Helper" : "Open Picker Helper"}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editHours}
                      onChange={(e) => setEditHours(e.target.value)}
                      placeholder="e.g. Mon-Fri: 9:00 AM - 6:00 PM"
                      className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a73e8] bg-zinc-50 focus:bg-white transition-all"
                    />
                    
                    {/* Visual helper is now collapsible, so it doesn't take unneeded vertical space */}
                    {showHoursHelper && (
                      <div className="mt-2 p-2.5 bg-[#f8fafd] border border-[#d2e3fc] rounded-2xl space-y-2 animate-in slide-in-from-top-1 duration-150">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-zinc-500 font-medium">Quick Presets:</span>
                          <button
                            type="button"
                            onClick={() => setEditHours("Available 24/7")}
                            className="px-2 py-1 bg-white hover:bg-zinc-100 text-[10px] text-zinc-700 font-bold border border-zinc-200 rounded-lg transition-colors cursor-pointer"
                          >
                            Available 24/7
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditHours("Mon-Fri: 9:00 AM - 6:00 PM")}
                            className="px-2 py-1 bg-white hover:bg-zinc-100 text-[10px] text-zinc-700 font-bold border border-zinc-200 rounded-lg transition-colors cursor-pointer"
                          >
                            Mon-Fri 9AM-6PM
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditHours("Mon-Sat: 10:00 AM - 8:00 PM")}
                            className="px-2 py-1 bg-white hover:bg-zinc-100 text-[10px] text-zinc-700 font-bold border border-zinc-200 rounded-lg transition-colors cursor-pointer"
                          >
                            Mon-Sat 10AM-8PM
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-zinc-200/60">
                          <div>
                            <span className="text-[9px] text-zinc-500 block mb-0.5 font-bold">Days</span>
                            <select
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val) setEditHours(`${val}: 9:00 AM - 6:00 PM`);
                              }}
                              className="w-full p-1 bg-white border border-zinc-200 rounded-lg text-[10px] focus:outline-none cursor-pointer"
                            >
                              <option value="">Select...</option>
                              <option value="Mon-Fri">Mon-Fri</option>
                              <option value="Mon-Sat">Mon-Sat</option>
                              <option value="Mon-Sun">Mon-Sun</option>
                              <option value="Daily">Daily</option>
                            </select>
                          </div>
                          <div>
                            <span className="text-[9px] text-zinc-500 block mb-0.5 font-bold">Open From</span>
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
                              className="w-full p-1 bg-white border border-zinc-200 rounded-lg text-[10px] focus:outline-none cursor-pointer"
                            >
                              <option value="9:00 AM">9:00 AM</option>
                              <option value="8:00 AM">8:00 AM</option>
                              <option value="10:00 AM">10:00 AM</option>
                              <option value="11:00 AM">11:00 AM</option>
                              <option value="12:00 PM">12:00 PM</option>
                            </select>
                          </div>
                          <div>
                            <span className="text-[9px] text-zinc-500 block mb-0.5 font-bold">Close At</span>
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
                              className="w-full p-1 bg-white border border-zinc-200 rounded-lg text-[10px] focus:outline-none cursor-pointer"
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
                      <label className="font-bold text-zinc-700">Description</label>
                      {editDescription && (
                        <button
                          type="button"
                          onClick={() => setEditDescription("")}
                          className="text-[10px] text-red-500 hover:underline font-semibold cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={3}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Brief description of the business..."
                      className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a73e8] bg-zinc-50 focus:bg-white transition-all"
                    />
                  </div>

                  {/* Step 1 Footer buttons */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-100 mt-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="px-3.5 py-2 rounded-xl text-zinc-500 font-bold hover:bg-zinc-100 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="px-3.5 py-2 rounded-xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200 font-bold transition-colors cursor-pointer"
                      >
                        Save Edits
                      </button>
                      {!place.isClaimed && (
                        <button
                          type="button"
                          onClick={() => setModalStep(2)}
                          className="px-4 py-2 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold shadow-md shadow-[#1a73e8]/25 transition-all cursor-pointer flex items-center gap-1"
                        >
                          Next: Claim ➔
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
                  <div className="p-4 bg-[#f8fafd] border border-[#d2e3fc] rounded-2xl flex items-start gap-3">
                    <ShieldCheck className="w-6 h-6 text-[#1a73e8] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-zinc-900 text-sm">Verify Ownership</h4>
                      <p className="text-zinc-600 leading-relaxed text-[11px]">
                        To verify that you own <strong className="text-zinc-800">{formatBusinessName(place.name)}</strong>, please insert this verification tag into the HTML head section of your home page:
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
                          className="absolute right-2 top-2 p-1.5 bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-zinc-700 text-[10px] font-bold cursor-pointer transition-all"
                        >
                          {copiedTag ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-500 italic">
                        Tip: Our crawler will look for this meta tag on {place.website || "your website"} to automatically activate your official badge.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#e8f0fe]/40 border border-[#d2e3fc]/60 rounded-2xl space-y-2">
                    <h5 className="font-bold text-[#1a73e8] text-[10px] uppercase tracking-wider">Owner Advantages:</h5>
                    <ul className="space-y-1.5 text-[11px] text-zinc-600">
                      <li className="flex items-start gap-1.5">
                        <span className="text-[#1a73e8] font-bold">✓</span>
                        <span><strong>Blue Verification Badge</strong>: Show clients your listing is official.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-[#1a73e8] font-bold">✓</span>
                        <span><strong>Respond to Reviews</strong>: Engage directly with customers with your "Owner" badge next to answers.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-[#1a73e8] font-bold">✓</span>
                        <span><strong>Lock Information</strong>: Prevent standard viewers from overwriting key business coordinates.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-2">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={claimAsOwner}
                        onChange={(e) => setClaimAsOwner(e.target.checked)}
                        className="mt-0.5 rounded border-zinc-300 text-[#1a73e8] focus:ring-[#1a73e8] cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-zinc-800 block">I am the authorized owner / manager</span>
                        <span className="text-[10px] text-zinc-500 block leading-tight">
                          I confirm I represent this business and have authorization to claim it.
                        </span>
                      </div>
                    </label>

                    {claimAsOwner && !currentUser && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[10px] font-semibold leading-normal animate-in fade-in duration-150">
                        ⚠ You must sign in to claim this business. Please close this modal and sign in using the button at the top right first.
                      </div>
                    )}
                  </div>

                  {/* Step 2 Footer buttons */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-100 mt-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setModalStep(1)}
                      className="px-3.5 py-2 rounded-xl text-zinc-600 font-bold hover:bg-zinc-100 transition-colors cursor-pointer"
                    >
                      ← Back to Edits
                    </button>
                    <button
                      type="submit"
                      disabled={!claimAsOwner || (claimAsOwner && !currentUser)}
                      className="px-5 py-2 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold shadow-md shadow-[#1a73e8]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      Verify & Claim Business
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Google-style Share Modal Popup */}
      <CopoShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareUrl={`${window.location.origin}/place/${place.id}`}
        title={formatBusinessName(place.name)}
        subtitle="Business Location"
      />
    </aside>

      {isPricingModalOpen && (
        <CopoBusinessPricingModal 
          currentPlan={subscriptionPlan}
          onSelectPlan={(plan) => {
            alert(`Redirecting to upgrade flow for ${plan} plan...`);
            setIsPricingModalOpen(false);
          }}
          onClose={() => setIsPricingModalOpen(false)}
        />
      )}

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
          <div className="w-full max-w-md bg-zinc-900 md:bg-white rounded-3xl border border-zinc-800 md:border-zinc-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center shadow-inner">
                <MessageSquareOff className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
                  <ShieldAlert className="w-3 h-3" />
                  <span>Unclaimed Business</span>
                </div>
                <h3 className="text-xl font-black text-white md:text-zinc-900 tracking-tight">
                  Direct Messaging Unavailable
                </h3>
                <p className="text-xs text-zinc-300 md:text-zinc-600 leading-relaxed font-medium">
                  <span className="font-bold text-white md:text-zinc-950">{formatBusinessName(place.name)}</span> has not claimed their official page on Reviuz yet, so they cannot receive or reply to customer messages.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 md:bg-zinc-50 border border-zinc-800 md:border-zinc-200 text-left space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400 md:text-[#1a73e8]">
                  <Building2 className="w-4 h-4" />
                  <span>Are you the owner or manager?</span>
                </div>
                <p className="text-[11px] text-zinc-400 md:text-zinc-600 leading-relaxed font-medium">
                  Claim this listing with your official business email to activate 1-on-1 customer messaging, reply to video reviews, and showcase your profile.
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
                  className="w-full py-3 px-4 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-xs shadow-md shadow-[#1a73e8]/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Claim & Verify Business</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>

                <button
                  onClick={() => setShowUnclaimedChatModal(false)}
                  className="w-full py-2.5 px-4 rounded-xl text-zinc-400 hover:text-white md:hover:text-zinc-900 text-xs font-bold transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
