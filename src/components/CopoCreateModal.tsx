import React, { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { SpecialStarSelector } from "./SpecialStarSelector";
import {
  X,
  Camera,
  RotateCcw,
  Check,
  AlertCircle,
  Loader2,
  Smartphone,
  Copy,
  Sparkles,
  AtSign,
  ShieldCheck
} from "lucide-react";
import { Place, UserProfile, VideoReview } from "../types";
import { getPlaceLogoUrl, getCleanLogoUrl, KNOWN_BRAND_LOGOS, KNOWN_BRAND_BANNERS, isBadBanner } from "../utils/logoUtils";
import {
  formatBusinessName,
  resolveSafeAuthor,
  getSafeAvatarUrl,
  extractCleanDomain,
  getEffectivePlaceDescription,
  KNOWN_OFFICIAL_NAMES,
  getPlaceSlug
} from "../utils/placeUtils";
import { CopoMobileSearchView } from "./CopoMobileSearchView";
import { triggerHaptic } from "../utils/haptics";
import { useLanguage } from "../i18n/LanguageContext";
import { getRoundedRating } from "./CopoStarRating";

interface CopoCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  places: Place[];
  videos?: VideoReview[];
  preselectedPlace?: Place | null;
  onPublishVideoReview: (review: VideoReview) => void;
  currentUser?: UserProfile | null;
  onUpdateUserProfile?: (user: UserProfile) => void;
  onAddPlace?: (place: Place) => void;
  onStartBackgroundUpload?: (placeName: string, progress: number) => void;
  onUpdateBackgroundUpload?: (progress: number) => void;
  onCompleteBackgroundUpload?: () => void;
}

export const CopoCreateModal: React.FC<CopoCreateModalProps> = ({
  isOpen,
  onClose,
  places,
  videos,
  preselectedPlace,
  onPublishVideoReview,
  currentUser,
  onUpdateUserProfile,
  onAddPlace,
  onStartBackgroundUpload,
  onUpdateBackgroundUpload,
  onCompleteBackgroundUpload
}) => {
  const { t } = useLanguage();

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(preselectedPlace || null);
  const [rating, setRating] = useState<number>(0);
  const [isSearchingMetadata, setIsSearchingMetadata] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Desktop QR handoff detection
  const [isDesktopViewport, setIsDesktopViewport] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const isMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
    return window.innerWidth >= 768 && !isMobileUA;
  });
  const [qrCopied, setQrCopied] = useState(false);

  // Native Camera & Captured Photo states (Mobile)
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [capturedPhotoBlob, setCapturedPhotoBlob] = useState<Blob | null>(null);

  // Publishing & Inline Anonymous Onboarding states
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  const [publishStage, setPublishStage] = useState("Preparing live photo...");
  const [postSubmitOnboarding, setPostSubmitOnboarding] = useState(false);
  const [publishedReview, setPublishedReview] = useState<VideoReview | null>(null);

  // Username & 1-tap linking inside post-submit onboarding
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "saved" | "error">("idle");
  const [usernameMessage, setUsernameMessage] = useState("");
  const [isLinkingAccount, setIsLinkingAccount] = useState(false);
  const [pendingLinkProvider, setPendingLinkProvider] = useState<"google" | "apple" | null>(null);
  const [linkEmailInput, setLinkEmailInput] = useState("");
  const [linkStatusMsg, setLinkStatusMsg] = useState<string | null>(null);

  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const isPublishingRef = useRef(false);

  // Track viewport size cleanly
  useEffect(() => {
    const updateDevice = () => {
      const isMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
      setIsDesktopViewport(window.innerWidth >= 768 && !isMobileUA);
    };
    window.addEventListener("resize", updateDevice);
    return () => window.removeEventListener("resize", updateDevice);
  }, []);

  // Sync preselectedPlace on open
  useEffect(() => {
    if (isOpen) {
      setSelectedPlace(preselectedPlace || null);
      setRating(0);
      setCapturedPhotoUrl(null);
      setCapturedPhotoBlob(null);
      setIsProcessingPhoto(false);
      setErrorMessage(null);
      setPostSubmitOnboarding(false);
      setPublishedReview(null);
      setUsernameInput("");
      setUsernameStatus("idle");
      setUsernameMessage("");
      setLinkStatusMsg(null);
    }
  }, [isOpen, preselectedPlace]);

  const handleCloseModal = () => {
    if (capturedPhotoUrl) {
      try {
        URL.revokeObjectURL(capturedPhotoUrl);
      } catch {}
    }
    setCapturedPhotoUrl(null);
    setCapturedPhotoBlob(null);
    setIsProcessingPhoto(false);
    setPostSubmitOnboarding(false);
    setPublishedReview(null);
    onClose();
  };

  const optimizeCapturedPhoto = async (file: File): Promise<Blob> => {
    const maxEdge = 2000;
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("Image decode fallback"));
        el.src = objectUrl;
      });
      const srcW = img.naturalWidth || img.width;
      const srcH = img.naturalHeight || img.height;
      if (!srcW || !srcH) return file;

      const scale = Math.min(1, maxEdge / Math.max(srcW, srcH));
      const targetW = Math.max(1, Math.round(srcW * scale));
      const targetH = Math.max(1, Math.round(srcH * scale));

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;
      ctx.drawImage(img, 0, 0, targetW, targetH);

      const jpegBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92)
      );
      return jpegBlob || file;
    } catch {
      return file;
    } finally {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {}
    }
  };

  const handleNativeCameraChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset value immediately so retaking always triggers onChange cleanly
    e.target.value = "";
    if (!file) return;

    if (file.type && !file.type.startsWith("image/") && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name || "")) {
      setErrorMessage("Please take a photo using your phone camera.");
      return;
    }

    setErrorMessage(null);
    setIsProcessingPhoto(true);
    triggerHaptic("medium");

    try {
      const preparedBlob = await optimizeCapturedPhoto(file);
      const nextPreviewUrl = URL.createObjectURL(preparedBlob);
      if (capturedPhotoUrl) {
        try {
          URL.revokeObjectURL(capturedPhotoUrl);
        } catch {}
      }
      setCapturedPhotoBlob(preparedBlob);
      setCapturedPhotoUrl(nextPreviewUrl);
      setRating(0);
    } catch {
      setErrorMessage("Could not process captured photo. Please try taking it again.");
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleSearchMetadata = async (domain: string) => {
    if (!domain.trim()) return;
    setIsSearchingMetadata(true);
    setErrorMessage(null);

    try {
      const cleanDomain = domain.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase();
      const placeId = cleanDomain;
      let foundPlace = places.find(
        (p) => p.id === placeId || p.brandDomain === cleanDomain || p.id === cleanDomain.replace(/[^a-zA-Z0-9]/g, "-")
      );

      const resp = await fetch(`/api/url-metadata?url=${encodeURIComponent(domain)}`, {
        signal: AbortSignal.timeout(10000)
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.title || data.domain) {
          const fetchedLogo = data.logo || (data.domain ? getCleanLogoUrl(null, data.domain) || "" : "");
          const fetchedBanner = data.image || "";
          const resolvedName =
            (cleanDomain && KNOWN_OFFICIAL_NAMES[cleanDomain]) ||
            (data.domain && KNOWN_OFFICIAL_NAMES[data.domain]) ||
            formatBusinessName(data.siteName || data.title, data.domain || domain) ||
            formatBusinessName(data.domain || domain) ||
            data.domain ||
            domain;

          const isFallbackLogo = (u?: string) =>
            !u || u.includes("/api/favicon") || u.startsWith("data:;") || u.includes("tap/0.png") || u.includes("tap/default");
          const resolvedLogo = !isFallbackLogo(fetchedLogo)
            ? fetchedLogo
            : !isFallbackLogo(foundPlace?.logoUrl)
            ? foundPlace?.logoUrl || ""
            : fetchedLogo || foundPlace?.logoUrl || "";

          if (!foundPlace) {
            foundPlace = {
              id: placeId,
              name: resolvedName,
              category: data.category || "Website",
              categoryType: "all",
              address: data.address || "",
              city: data.city || "",
              country: data.country || "",
              lat: data.lat || 0,
              lng: data.lng || 0,
              rating: 5,
              totalReviews: 1,
              ratingDistribution: { stars5: 1, stars4: 0, stars3: 0, stars2: 0, stars1: 0 },
              avatarUrl: resolvedLogo,
              logoUrl: resolvedLogo,
              bannerUrl: fetchedBanner,
              photos: fetchedBanner ? [fetchedBanner] : [],
              openingHours: "Available 24/7",
              isOpen: true,
              phone: data.phone || "",
              email: data.email || "",
              website: data.url || domain,
              priceRange: "N/A",
              plusCode: "",
              description: getEffectivePlaceDescription({
                id: placeId,
                name: resolvedName,
                category: data.category || "Website",
                city: data.city || "",
                country: data.country || "",
                website: data.url || domain,
                domain: data.domain || domain,
                description: data.description
              }),
              popularKeywords: [],
              amenities: [],
              topDishes: [],
              brandDomain: data.domain
            };
          }
        }
      }

      if (!foundPlace) {
        foundPlace = {
          id: placeId || `custom-${Date.now()}`,
          name: formatBusinessName(domain, cleanDomain) || domain,
          brandDomain: cleanDomain.includes(".") ? cleanDomain : undefined,
          category: "Website",
          categoryType: "all",
          address: cleanDomain.includes(".") ? cleanDomain : "Verified Business",
          city: "Online",
          lat: 0,
          lng: 0,
          rating: 5,
          totalReviews: 1,
          ratingDistribution: { stars5: 1, stars4: 0, stars3: 0, stars2: 0, stars1: 0 },
          avatarUrl: getCleanLogoUrl(null, cleanDomain) || "",
          logoUrl: getCleanLogoUrl(null, cleanDomain) || "",
          bannerUrl: "",
          photos: [],
          openingHours: "Available 24/7",
          isOpen: true,
          phone: "",
          website: cleanDomain.includes(".") ? `https://${cleanDomain}` : `https://${cleanDomain}.com`,
          priceRange: "$$",
          plusCode: "",
          description: `Verified business profile for ${domain}`,
          popularKeywords: [],
          amenities: [],
          topDishes: []
        };
      }

      onAddPlace?.(foundPlace);
      setSelectedPlace(foundPlace);
    } catch (err) {
      setErrorMessage("Could not load details for this place.");
    } finally {
      setIsSearchingMetadata(false);
    }
  };

  const handlePublish = async () => {
    if (isPublishing || isPublishingRef.current) return;
    if (!selectedPlace) {
      setErrorMessage("Please select a business or place.");
      return;
    }
    if (!capturedPhotoBlob) {
      setErrorMessage("Please capture a live photo first.");
      return;
    }
    if (rating < 1 || rating > 5) {
      setErrorMessage("Please select 1 to 5 stars using the star rating selector.");
      return;
    }

    const wholeStars = getRoundedRating(rating);
    setIsPublishing(true);
    isPublishingRef.current = true;
    setErrorMessage(null);
    setPublishProgress(20);
    setPublishStage("Uploading live photo...");
    onStartBackgroundUpload?.(selectedPlace.name, 20);

    const reviewId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Ensure active user (silently provision anonymous if missing)
    let activeAuthUser = currentUser;
    if (!activeAuthUser) {
      try {
        const stored = localStorage.getItem("copo_user_profile") || localStorage.getItem("copo_user");
        if (stored) activeAuthUser = JSON.parse(stored);
      } catch {}
    }
    if (!activeAuthUser) {
      try {
        const anonRes = await fetch("/api/auth/anonymous", { method: "POST" });
        if (anonRes.ok) {
          const anonData = await anonRes.json();
          if (anonData?.user) {
            activeAuthUser = anonData.user;
            onUpdateUserProfile?.(anonData.user);
            localStorage.setItem("copo_user_profile", JSON.stringify(anonData.user));
          }
        }
      } catch {}
    }

    const placeDomain = extractCleanDomain(selectedPlace.website || selectedPlace.name || selectedPlace.id);
    const cleanPlaceName =
      (placeDomain && KNOWN_OFFICIAL_NAMES[placeDomain]) ||
      formatBusinessName(selectedPlace.name || placeDomain, placeDomain) ||
      selectedPlace.name;

    const resolvedPlaceLogo =
      placeDomain && KNOWN_BRAND_LOGOS[placeDomain]
        ? KNOWN_BRAND_LOGOS[placeDomain]
        : selectedPlace.logoUrl && !selectedPlace.logoUrl.startsWith("data:;") && !selectedPlace.logoUrl.includes("tap/0.png")
        ? selectedPlace.logoUrl
        : selectedPlace.avatarUrl && !selectedPlace.avatarUrl.startsWith("data:;") && !selectedPlace.avatarUrl.includes("tap/0.png")
        ? selectedPlace.avatarUrl
        : getPlaceLogoUrl(selectedPlace) || "";

    const resolvedPlaceBanner =
      selectedPlace.bannerUrl || selectedPlace.ogImage || (placeDomain && KNOWN_BRAND_BANNERS[placeDomain]) || "";

    const reviewerName = activeAuthUser?.username || activeAuthUser?.name || "U/ANON";
    const resolvedAuthor = resolveSafeAuthor(
      {
        author: {
          name: reviewerName,
          avatar: activeAuthUser?.avatar || ""
        },
        userId: activeAuthUser?.id || activeAuthUser?.email,
        userEmail: activeAuthUser?.email
      },
      activeAuthUser
    );

    let uploadedPhotoUrl = "";
    try {
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") resolve(reader.result);
          else reject(new Error("Could not encode captured photo."));
        };
        reader.onerror = () => reject(new Error("Could not read captured photo."));
        reader.readAsDataURL(capturedPhotoBlob);
      });

      setPublishProgress(55);
      onUpdateBackgroundUpload?.(55);
      setPublishStage("Stripping metadata & securing photo...");

      const uploadResp = await fetch("/api/photos/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          reviewId,
          placeId: selectedPlace.id,
          userId: activeAuthUser?.id || activeAuthUser?.uid || "anon"
        })
      });
      if (!uploadResp.ok) {
        const errPayload = await uploadResp.json().catch(() => ({}));
        throw new Error(errPayload?.error || "Photo upload failed");
      }
      const uploadJson = await uploadResp.json();
      uploadedPhotoUrl = uploadJson.photoUrl || "";
      if (!uploadedPhotoUrl) {
        throw new Error("Server did not return a valid photo URL");
      }
    } catch (uploadErr: any) {
      setIsPublishing(false);
      isPublishingRef.current = false;
      setPublishProgress(0);
      onCompleteBackgroundUpload?.();
      setErrorMessage(uploadErr?.message || "Failed to upload photo. Please check your connection and try again.");
      triggerHaptic("heavy");
      return;
    }

    setPublishProgress(85);
    onUpdateBackgroundUpload?.(85);
    setPublishStage("Publishing photo review...");

    const finalReview: VideoReview = {
      id: reviewId,
      mediaType: "photo",
      photoUrl: uploadedPhotoUrl,
      thumbnailUrl: uploadedPhotoUrl,
      videoUrl: "",
      userId: activeAuthUser?.id || activeAuthUser?.email || "guest",
      userEmail: activeAuthUser?.email || "",
      createdAtMs: Date.now(),
      isLocalUpload: true,
      placeId: selectedPlace.id,
      placeName: cleanPlaceName,
      placeCategory: selectedPlace.category || "General",
      placeAddress:
        selectedPlace.address && selectedPlace.address !== "Verified Location"
          ? selectedPlace.address
          : selectedPlace.city && selectedPlace.city !== "Online"
          ? selectedPlace.city
          : "",
      placeCity: selectedPlace.city && selectedPlace.city !== "Online" ? selectedPlace.city : "",
      placeCountry: (selectedPlace as any).country || "",
      placePhone: (selectedPlace as any).phone || "",
      placeEmail: (selectedPlace as any).email || "",
      placeRating: wholeStars,
      placeWebsite: selectedPlace.website || (placeDomain ? `https://${placeDomain}` : ""),
      placeLogoUrl: resolvedPlaceLogo,
      placeBannerUrl: resolvedPlaceBanner,
      placeDescription: getEffectivePlaceDescription(selectedPlace) || selectedPlace.description || "",
      authorName: reviewerName,
      authorAvatar: resolvedAuthor.avatar || getSafeAvatarUrl(activeAuthUser?.avatar, reviewerName),
      author: {
        name: reviewerName,
        handle: resolvedAuthor.handle || `@${reviewerName.replace(/^U\//i, "u_").toLowerCase().replace(/[^a-z0-9_]/g, "")}`,
        avatar: resolvedAuthor.avatar || getSafeAvatarUrl(activeAuthUser?.avatar, reviewerName),
        isLocalGuide: true,
        videoReviewCount: 1,
        photosCount: 1,
        isVerified: true
      },
      rating: wholeStars,
      durationSeconds: 0,
      likes: 0,
      isLiked: false,
      commentsCount: 0,
      comments: [],
      bookmarksCount: 0,
      isBookmarked: false,
      repostsCount: 0,
      views: 1,
      viewsCount: 1,
      sharesCount: 0,
      tags: [selectedPlace.category || "Review"],
      recordedAt: "Just now",
      isLandscape: false,
      aspectRatio: "portrait",
      isReady: true,
      isProcessing: false
    } as VideoReview;

    try {
      await fetch("/api/videos/save-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalReview),
        signal: AbortSignal.timeout(10000)
      });
    } catch {}

    fetch(`/api/nosql/videoReviews/${reviewId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: finalReview, merge: true })
    }).catch(() => {});

    try {
      const existingSaved = localStorage.getItem("yoouz_local_created_reviews");
      let list: any[] = [];
      if (existingSaved) {
        try {
          list = JSON.parse(existingSaved);
        } catch {}
      }
      if (!Array.isArray(list)) list = [];
      list = [finalReview, ...list.filter((v: any) => v && v.id !== finalReview.id)].slice(0, 50);
      localStorage.setItem("yoouz_local_created_reviews", JSON.stringify(list));
    } catch {}

    if (selectedPlace?.id) {
      const updatedPlaceData: Record<string, any> = {
        ...selectedPlace,
        id: selectedPlace.id,
        totalReviews: (selectedPlace.totalReviews || 0) + 1,
        rating: wholeStars
      };
      if (!updatedPlaceData.bannerUrl || isBadBanner(updatedPlaceData.bannerUrl)) delete updatedPlaceData.bannerUrl;
      if (!updatedPlaceData.ogImage || isBadBanner(updatedPlaceData.ogImage)) delete updatedPlaceData.ogImage;
      fetch(`/api/nosql/places/${selectedPlace.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: updatedPlaceData, merge: true })
      }).catch(() => {});
    }

    setPublishProgress(100);
    setPublishStage("Published!");
    onUpdateBackgroundUpload?.(100);
    onCompleteBackgroundUpload?.();
    setIsPublishing(false);
    isPublishingRef.current = false;
    onPublishVideoReview(finalReview);

    // If anonymous user, show inline zero-friction username & account link step
    if (activeAuthUser?.isAnonymous) {
      setPublishedReview(finalReview);
      setPostSubmitOnboarding(true);
    } else {
      handleCloseModal();
    }
  };

  // Live username availability check
  useEffect(() => {
    if (!postSubmitOnboarding) return;
    const clean = usernameInput.trim().replace(/^@/, "");
    if (!clean) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      return;
    }
    if (clean.length < 3) {
      setUsernameStatus("error");
      setUsernameMessage("At least 3 characters");
      return;
    }

    let cancelled = false;
    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/user/check-username?username=${encodeURIComponent(clean)}&currentUserId=${encodeURIComponent(currentUser?.id || "")}`
        );
        const data = await res.json();
        if (cancelled) return;
        if (data.available) {
          setUsernameStatus("available");
          setUsernameMessage(`@${data.normalized} is available`);
        } else {
          setUsernameStatus("taken");
          setUsernameMessage(data.error || "Username is already taken");
        }
      } catch {
        if (!cancelled) {
          setUsernameStatus("error");
          setUsernameMessage("Could not check availability");
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [usernameInput, postSubmitOnboarding, currentUser?.id]);

  const handleSaveUsername = async () => {
    if (!currentUser?.id || !usernameInput.trim() || usernameStatus !== "available") return;
    setUsernameStatus("checking");
    try {
      const res = await fetch("/api/user/update-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, username: usernameInput.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        setUsernameStatus("taken");
        setUsernameMessage(data.error || "Could not update username");
        return;
      }
      if (data.user) {
        onUpdateUserProfile?.(data.user);
        localStorage.setItem("copo_user_profile", JSON.stringify(data.user));
      }
      setUsernameStatus("saved");
      setUsernameMessage(`Updated to ${data.user?.name || usernameInput.trim()}`);
      triggerHaptic("success");
    } catch {
      setUsernameStatus("error");
      setUsernameMessage("Failed to save username");
    }
  };

  const handleConfirmQuickLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = linkEmailInput.trim().toLowerCase();
    if (!currentUser?.id || !pendingLinkProvider || !cleanEmail.includes("@") || isLinkingAccount) return;
    setIsLinkingAccount(true);
    setLinkStatusMsg(null);
    try {
      const res = await fetch("/api/auth/link-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymousUserId: currentUser.id,
          provider: pendingLinkProvider,
          email: cleanEmail,
          name: currentUser.name
        })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        onUpdateUserProfile?.(data.user);
        localStorage.setItem("copo_user_profile", JSON.stringify(data.user));
        setLinkStatusMsg(`Linked to ${pendingLinkProvider === "google" ? "Google" : "Apple"} cleanly!`);
        setPendingLinkProvider(null);
        setLinkEmailInput("");
        triggerHaptic("success");
      } else {
        setLinkStatusMsg(data.error || "Could not link account right now.");
      }
    } catch {
      setLinkStatusMsg("Network error while linking account.");
    } finally {
      setIsLinkingAccount(false);
    }
  };

  if (!isOpen) return null;

  // DESKTOP: Clean QR Code Mobile Handoff Modal
  if (isDesktopViewport && !postSubmitOnboarding) {
    const placeParam = selectedPlace ? `&place=${encodeURIComponent(getPlaceSlug(selectedPlace.id))}` : "";
    const qrUrl = `${typeof window !== "undefined" ? window.location.origin : "https://yoouz.com"}/?addReview=1${placeParam}`;

    return (
      <div
        id="copo-create-review-modal"
        className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200"
        onClick={handleCloseModal}
      >
        <div
          className="relative w-full max-w-[440px] bg-zinc-950 rounded-[32px] border border-zinc-800 shadow-2xl p-6 sm:p-8 text-white space-y-6 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleCloseModal}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title={t("common.close", "Close")}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto shadow-lg">
            <Smartphone className="w-7 h-7 text-white" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-black tracking-tight text-white">Add Live Photo Review</h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xs mx-auto">
              Point your phone camera at the QR code below to snap a live photo review and rate{" "}
              {selectedPlace ? formatBusinessName(selectedPlace.name) : "any business"} in seconds.
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl inline-flex flex-col items-center justify-center shadow-2xl mx-auto">
            <QRCodeSVG value={qrUrl} size={200} level="M" includeMargin={false} />
          </div>

          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(qrUrl).catch(() => {});
                setQrCopied(true);
                triggerHaptic("light");
                setTimeout(() => setQrCopied(false), 2000);
              }}
              className="w-full py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {qrCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
              <span>{qrCopied ? "Mobile Camera Link Copied" : "Copy Mobile Camera Link"}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MOBILE STEP 1: Business / Place Selection (when not preselected)
  if (!selectedPlace && !postSubmitOnboarding) {
    return (
      <CopoMobileSearchView
        places={places}
        videos={videos || []}
        searchMode="review"
        autoFocusSearch={true}
        onSelectVideo={() => {}}
        onOpenPlace={(placeIdOrDomain) => {
          const clean = extractCleanDomain(placeIdOrDomain) || placeIdOrDomain;
          const matched = places.find(
            (p) =>
              p.id.toLowerCase() === clean.toLowerCase() ||
              p.id.toLowerCase() === placeIdOrDomain.toLowerCase() ||
              (p.brandDomain && p.brandDomain.toLowerCase() === clean.toLowerCase()) ||
              (p.website && p.website.toLowerCase().includes(clean.toLowerCase())) ||
              (p.name && p.name.toLowerCase() === placeIdOrDomain.toLowerCase())
          );
          if (matched) {
            setSelectedPlace(matched);
            setRating(0);
          } else {
            handleSearchMetadata(placeIdOrDomain);
          }
        }}
        onRecordForPlace={(place) => {
          setSelectedPlace(place);
          setRating(0);
        }}
        onAddPlace={onAddPlace}
        onClose={handleCloseModal}
      />
    );
  }

  return (
    <div
      id="copo-create-review-modal"
      className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-0 md:p-6 overflow-hidden animate-in fade-in duration-200"
    >
      <div className="relative w-full h-full md:h-[780px] md:max-h-[90vh] max-w-[440px] bg-zinc-950 md:rounded-[36px] overflow-hidden shadow-2xl flex flex-col border border-white/10">
        {/* Native HTML5 Mobile Camera Input (forces iOS Safari & Android Chrome to open native phone camera app directly) */}
        <input
          ref={nativeCameraInputRef}
          id="native-camera-capture-input"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleNativeCameraChange}
          className="sr-only"
          aria-label="Open native camera to take review photo"
        />

        {/* POST-SUBMIT ZERO-FRICTION ONBOARDING (Anonymous -> Optional Username / Google or Apple Link) */}
        {postSubmitOnboarding && publishedReview ? (
          <div className="flex flex-col h-full w-full bg-zinc-950 p-6 justify-between overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-black uppercase tracking-wider">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Photo Review Live</span>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 flex items-center justify-center cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5 my-auto py-4">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 mx-auto overflow-hidden shadow-xl">
                  <img
                    src={publishedReview.photoUrl || publishedReview.thumbnailUrl}
                    alt={publishedReview.placeName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h2 className="text-xl font-black text-white tracking-tight">Claim Your Reviewer Handle</h2>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
                  Your review is live under <span className="text-white font-bold">{currentUser?.name || "your anonymous ID"}</span>. Choose a custom handle or link an account—or tap Done to keep browsing.
                </p>
              </div>

              {/* Optional Custom Username */}
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Custom Username (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <AtSign className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="yourhandle"
                      maxLength={24}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-white text-sm font-semibold text-white outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={usernameStatus !== "available"}
                    onClick={handleSaveUsername}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-bold text-xs transition-colors cursor-pointer shrink-0"
                  >
                    {usernameStatus === "checking" ? "..." : usernameStatus === "saved" ? "Saved" : "Claim"}
                  </button>
                </div>
                {usernameMessage && (
                  <p
                    className={`text-[11px] font-semibold ${
                      usernameStatus === "available" || usernameStatus === "saved" ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {usernameMessage}
                  </p>
                )}
              </div>

              {/* 1-Tap Account Linking */}
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Protect Your Reviews Across Devices</span>
                </div>
                {!pendingLinkProvider ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={isLinkingAccount}
                      onClick={() => { setPendingLinkProvider("google"); setLinkStatusMsg(null); }}
                      className="py-2.5 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Save with Google
                    </button>
                    <button
                      type="button"
                      disabled={isLinkingAccount}
                      onClick={() => { setPendingLinkProvider("apple"); setLinkStatusMsg(null); }}
                      className="py-2.5 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Save with Apple
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleConfirmQuickLink} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        required
                        value={linkEmailInput}
                        onChange={(e) => setLinkEmailInput(e.target.value)}
                        placeholder={`Enter your ${pendingLinkProvider === "google" ? "Google" : "Apple"} email`}
                        className="flex-1 px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white outline-none focus:border-white"
                      />
                      <button
                        type="submit"
                        disabled={isLinkingAccount}
                        className="px-3.5 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs cursor-pointer disabled:opacity-50"
                      >
                        {isLinkingAccount ? "..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingLinkProvider(null)}
                        className="p-2.5 rounded-xl bg-zinc-800 text-zinc-300 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                )}
                {linkStatusMsg && (
                  <p className={`text-[11px] font-semibold ${linkStatusMsg.includes("cleanly") ? "text-emerald-400" : "text-rose-400"}`}>
                    {linkStatusMsg}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCloseModal}
              className="w-full py-3.5 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-sm transition-all cursor-pointer shadow-xl"
            >
              Done
            </button>
          </div>
        ) : capturedPhotoUrl ? (
          /* PREVIEW STAGE: Native Captured Photo + Retake + SpecialStarSelector (1-5) + Publish */
          <div className="relative w-full h-full bg-black flex flex-col justify-between overflow-hidden">
            <img
              src={capturedPhotoUrl}
              alt="Captured review preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-transparent to-black/95 pointer-events-none" />

            {/* Top Bar */}
            <div className="relative z-20 flex items-center justify-between gap-2 p-4 pt-5">
              <div className="px-3.5 py-2 rounded-full bg-black/65 backdrop-blur-xl border border-white/20 text-white flex items-center gap-2.5 min-w-0">
                <CopoBrandLogo
                  domain={selectedPlace?.brandDomain || extractCleanDomain(selectedPlace?.website || selectedPlace?.id || selectedPlace?.name)}
                  name={selectedPlace?.name}
                  website={selectedPlace?.website}
                  logoUrl={selectedPlace?.logoUrl || selectedPlace?.avatarUrl}
                  bannerUrl={selectedPlace?.bannerUrl || selectedPlace?.ogImage}
                  className="w-6 h-6 rounded-lg bg-white overflow-hidden flex items-center justify-center shrink-0 p-0.5"
                  imageClassName="w-full h-full object-contain"
                  fallbackTextClassName="font-extrabold text-[10px] text-zinc-950"
                />
                <span className="font-extrabold text-xs truncate">
                  {formatBusinessName(selectedPlace?.name, selectedPlace?.brandDomain || selectedPlace?.website, selectedPlace?.id)}
                </span>
              </div>

              <button
                type="button"
                disabled={isPublishing}
                onClick={handleCloseModal}
                className="w-10 h-10 rounded-full bg-black/65 hover:bg-black/90 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center cursor-pointer shrink-0 disabled:opacity-50"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom Controls: Error + SpecialStarSelector + Retake/Publish */}
            <div className="relative z-20 p-4 pb-[max(20px,calc(env(safe-area-inset-bottom,0px)+16px))] space-y-3">
              {errorMessage && (
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-red-950/90 border border-red-700/70 text-red-200 text-xs font-semibold backdrop-blur-xl">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <SpecialStarSelector
                value={rating}
                onChange={(next) => {
                  setRating(next);
                  setErrorMessage(null);
                }}
                disabled={isPublishing}
                label="Rate This Place (1–5 Whole Stars)"
              />

              {isPublishing ? (
                <div className="p-4 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-white/15 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {publishStage}
                    </span>
                    <span>{publishProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-300 rounded-full"
                      style={{ width: `${publishProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="native-camera-capture-input"
                    onClick={() => {
                      triggerHaptic("light");
                      setErrorMessage(null);
                      if (nativeCameraInputRef.current) {
                        nativeCameraInputRef.current.value = "";
                      }
                    }}
                    className="px-5 py-3.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 backdrop-blur-xl border border-white/20 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all select-none"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Retake</span>
                  </label>

                  <button
                    type="button"
                    disabled={rating < 1}
                    onClick={handlePublish}
                    className={`flex-1 py-3.5 px-5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl ${
                      rating >= 1
                        ? "bg-white hover:bg-zinc-100 text-zinc-950 cursor-pointer"
                        : "bg-zinc-800/80 text-zinc-500 border border-white/10 cursor-not-allowed"
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Publish Photo Review</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* NATIVE CAMERA LAUNCH STAGE: Opens iOS/Android phone camera app directly */
          <div className="relative w-full h-full bg-zinc-950 flex flex-col justify-between overflow-hidden">
            {/* Top Place Pill & Close */}
            <div className="relative z-20 flex items-center justify-between gap-2 p-4 pt-5">
              <button
                type="button"
                onClick={() => setSelectedPlace(null)}
                className="px-3.5 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 backdrop-blur-xl border border-white/15 text-white flex items-center gap-2.5 min-w-0 cursor-pointer transition-colors"
                title="Change business"
              >
                <CopoBrandLogo
                  domain={selectedPlace?.brandDomain || extractCleanDomain(selectedPlace?.website || selectedPlace?.id || selectedPlace?.name)}
                  name={selectedPlace?.name}
                  website={selectedPlace?.website}
                  logoUrl={selectedPlace?.logoUrl || selectedPlace?.avatarUrl}
                  bannerUrl={selectedPlace?.bannerUrl || selectedPlace?.ogImage}
                  className="w-6 h-6 rounded-lg bg-white overflow-hidden flex items-center justify-center shrink-0 p-0.5"
                  imageClassName="w-full h-full object-contain"
                  fallbackTextClassName="font-extrabold text-[10px] text-zinc-950"
                />
                <span className="font-extrabold text-xs truncate">
                  {formatBusinessName(selectedPlace?.name, selectedPlace?.brandDomain || selectedPlace?.website, selectedPlace?.id)}
                </span>
              </button>

              <button
                type="button"
                onClick={handleCloseModal}
                className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 backdrop-blur-xl border border-white/15 text-white flex items-center justify-center cursor-pointer shrink-0"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Center Prompt + Native Camera Launch CTA */}
            <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-6 text-center space-y-6">
              {isProcessingPhoto || isSearchingMetadata ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                  <p className="text-sm font-bold text-white">Preparing your photo...</p>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl">
                    <Camera className="w-9 h-9 text-white" />
                  </div>

                  <div className="space-y-2 max-w-xs">
                    <h2 className="text-2xl font-black text-white tracking-tight">
                      Snap a Native Photo
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                      Opens your phone&apos;s camera app directly for full native quality, HDR, and stabilization.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="w-full max-w-xs p-3 rounded-2xl bg-red-950/90 border border-red-800 text-red-200 text-xs font-medium text-center flex items-center justify-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <label
                    htmlFor="native-camera-capture-input"
                    id="btn-capture-live-photo"
                    onClick={() => {
                      triggerHaptic("medium");
                      setErrorMessage(null);
                      if (nativeCameraInputRef.current) {
                        nativeCameraInputRef.current.value = "";
                      }
                    }}
                    className="w-full max-w-xs py-4 px-6 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-base flex items-center justify-center gap-2.5 shadow-[0_12px_32px_rgba(255,255,255,0.18)] active:scale-95 transition-all cursor-pointer select-none"
                  >
                    <Camera className="w-5 h-5 stroke-[2.5]" />
                    <span>Open Camera</span>
                  </label>
                </>
              )}
            </div>

            <div className="px-6 pb-[max(28px,calc(env(safe-area-inset-bottom,0px)+20px))] text-center">
              <p className="text-[11px] font-medium text-zinc-500">
                1 live photo + 1–5 whole stars • No text required
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
