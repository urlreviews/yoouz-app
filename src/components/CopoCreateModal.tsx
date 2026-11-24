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
  AtSign,
  ShieldCheck,
  KeyRound
} from "lucide-react";
import { registerFaceIdPasskey } from "../lib/passkeyAuth";
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
  initialCapturedFile?: File | null;
  onRequestInstantCamera?: (place: Place) => boolean;
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
  onCompleteBackgroundUpload,
  initialCapturedFile,
  onRequestInstantCamera
}) => {
  const { t } = useLanguage();

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(preselectedPlace || null);
  const [rating, setRating] = useState<number>(0);
  const [isSearchingMetadata, setIsSearchingMetadata] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Desktop QR handoff detection (exclude mobile phones and touch tablets including iPadOS)
  const [isDesktopViewport, setIsDesktopViewport] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const ua = navigator.userAgent || "";
    const isMobileOrTabletUA =
      /Android|iPhone|iPad|iPod|Mobile/i.test(ua) ||
      (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    return window.innerWidth >= 768 && !isMobileOrTabletUA;
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

  // Username & 1-tap Face ID / Passkey inside post-submit onboarding
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "saved" | "error">("idle");
  const [usernameMessage, setUsernameMessage] = useState("");
  const [isLinkingAccount, setIsLinkingAccount] = useState(false);
  const [linkStatusMsg, setLinkStatusMsg] = useState<string | null>(null);

  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const isPublishingRef = useRef(false);
  const optimizedBlobPromiseRef = useRef<Promise<Blob> | null>(null);
  const draftReviewIdRef = useRef<string>("");
  const preUploadAbortRef = useRef<AbortController | null>(null);
  const preUploadPromiseRef = useRef<Promise<{ photoUrl: string; reviewId: string } | null> | null>(null);
  const lastConsumedInitialFileRef = useRef<File | null>(null);

  // Track viewport size cleanly
  useEffect(() => {
    const updateDevice = () => {
      const ua = navigator.userAgent || "";
      const isMobileOrTabletUA =
        /Android|iPhone|iPad|iPod|Mobile/i.test(ua) ||
        (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
      setIsDesktopViewport(window.innerWidth >= 768 && !isMobileOrTabletUA);
    };
    window.addEventListener("resize", updateDevice);
    return () => window.removeEventListener("resize", updateDevice);
  }, []);

  // Dismiss modal cleanly on Escape key (desktop keyboard standard)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPublishingRef.current) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const userClearedPlaceRef = useRef(false);
  const wasOpenRef = useRef(false);

  const cancelSpeculativePreUpload = () => {
    if (preUploadAbortRef.current) {
      try {
        preUploadAbortRef.current.abort();
      } catch {}
      preUploadAbortRef.current = null;
    }
    preUploadPromiseRef.current = null;
  };

  // Raw binary upload (zero +33% Base64 bloat, zero FileReader overhead)
  const uploadBinaryPhoto = async (
    blob: Blob,
    reviewId: string,
    placeId: string,
    userId: string,
    signal?: AbortSignal
  ): Promise<{ photoUrl: string; reviewId: string }> => {
    const qs = new URLSearchParams({
      reviewId,
      placeId: placeId || "place",
      userId: userId || "anon"
    }).toString();

    const uploadResp = await fetch(`/api/photos/upload?${qs}`, {
      method: "POST",
      headers: {
        "Content-Type": blob.type && blob.type.startsWith("image/") ? blob.type : "image/jpeg"
      },
      body: blob,
      signal
    });

    if (!uploadResp.ok) {
      const errPayload = await uploadResp.json().catch(() => ({}));
      throw new Error(errPayload?.error || "Photo upload failed");
    }
    const uploadJson = await uploadResp.json();
    const photoUrl = uploadJson?.photoUrl || uploadJson?.url || "";
    if (!photoUrl) {
      throw new Error("Server did not return a valid photo URL");
    }
    return { photoUrl, reviewId };
  };

  // Instant 0ms preview display + speculative background upload while user picks 1-5 stars
  const acceptCapturedFile = (file: File) => {
    if (file.type && !file.type.startsWith("image/") && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name || "")) {
      setErrorMessage("Please take a photo using your phone camera.");
      return;
    }

    cancelSpeculativePreUpload();
    setErrorMessage(null);
    setIsProcessingPhoto(false);
    triggerHaptic("medium");

    const instantUrl = URL.createObjectURL(file);
    setCapturedPhotoUrl((prev) => {
      if (prev && prev !== instantUrl) {
        try {
          URL.revokeObjectURL(prev);
        } catch {}
      }
      return instantUrl;
    });
    setCapturedPhotoBlob(file);
    setRating(0);

    const draftReviewId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    draftReviewIdRef.current = draftReviewId;
    const abortController = new AbortController();
    preUploadAbortRef.current = abortController;

    // 1. Optimize to crisp 2048px Retina JPEG silently in background
    const bgOptimize = optimizeCapturedPhoto(file)
      .then((preparedBlob) => {
        setCapturedPhotoBlob(preparedBlob);
        return preparedBlob;
      })
      .catch(() => file);
    optimizedBlobPromiseRef.current = bgOptimize;

    // 2. Speculatively pre-upload binary JPEG to Bunny CDN while user taps 1-5 stars (makes Post feel ~0.2s instant!)
    const targetPlaceId = selectedPlace?.id || preselectedPlace?.id || "place";
    const targetUserId = currentUser?.id || (currentUser as any)?.uid || "anon";
    preUploadPromiseRef.current = bgOptimize
      .then((preparedBlob) => {
        if (abortController.signal.aborted) return null;
        return uploadBinaryPhoto(preparedBlob, draftReviewId, targetPlaceId, targetUserId, abortController.signal);
      })
      .catch(() => null);
  };

  // Reset modal flow only on open transition, never when preselectedPlace asynchronously enriches
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      userClearedPlaceRef.current = false;
      setSelectedPlace(preselectedPlace || null);
      setRating(0);
      setIsProcessingPhoto(false);
      setErrorMessage(null);
      setPostSubmitOnboarding(false);
      setPublishedReview(null);
      setUsernameInput("");
      setUsernameStatus("idle");
      setUsernameMessage("");
      setLinkStatusMsg(null);
      optimizedBlobPromiseRef.current = null;
      cancelSpeculativePreUpload();

      if (initialCapturedFile) {
        lastConsumedInitialFileRef.current = initialCapturedFile;
        acceptCapturedFile(initialCapturedFile);
      } else {
        lastConsumedInitialFileRef.current = null;
        setCapturedPhotoUrl(null);
        setCapturedPhotoBlob(null);
      }
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, preselectedPlace, initialCapturedFile]);

  // If a new instant-camera file arrives while modal is already open, load it immediately in 0ms
  useEffect(() => {
    if (!isOpen || !initialCapturedFile || initialCapturedFile === lastConsumedInitialFileRef.current) return;
    lastConsumedInitialFileRef.current = initialCapturedFile;
    if (preselectedPlace) {
      setSelectedPlace(preselectedPlace);
    }
    acceptCapturedFile(initialCapturedFile);
  }, [isOpen, initialCapturedFile, preselectedPlace]);

  // Smoothly enrich selectedPlace metadata as server/website lookup completes without interrupting camera or rating
  useEffect(() => {
    if (!isOpen || !preselectedPlace || userClearedPlaceRef.current) return;
    setSelectedPlace((prev) => {
      if (!prev) return preselectedPlace;
      const prevDom = (extractCleanDomain(prev.website || prev.brandDomain || prev.id || "") || "").toLowerCase();
      const nextDom = (extractCleanDomain(preselectedPlace.website || preselectedPlace.brandDomain || preselectedPlace.id || "") || "").toLowerCase();
      const isSame = prev.id === preselectedPlace.id || (prevDom && nextDom && prevDom === nextDom);
      if (!isSame) return prev;
      if (prev.isSkeleton && !preselectedPlace.isSkeleton) return preselectedPlace;
      return {
        ...prev,
        ...preselectedPlace,
        logoUrl: preselectedPlace.logoUrl && !preselectedPlace.logoUrl.includes("/api/favicon")
          ? preselectedPlace.logoUrl
          : prev.logoUrl || preselectedPlace.logoUrl,
        name: preselectedPlace.name || prev.name
      };
    });
  }, [isOpen, preselectedPlace]);

  const handleCloseModal = () => {
    cancelSpeculativePreUpload();
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
    // 2048px Retina max edge matches server output 1:1 (zero double-downscale softness for Front & Back cameras)
    const maxEdge = 2048;
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
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, targetW, targetH);

      const jpegBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.93)
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
    acceptCapturedFile(file);
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

    const reviewId = draftReviewIdRef.current || `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Run anonymous user provisioning IN PARALLEL with awaiting speculative photo pre-upload
    const resolveAuthUserPromise = (async (): Promise<UserProfile | null> => {
      let activeAuthUser = currentUser && Number((currentUser as any)?.scratchVersion || 0) >= 6 ? currentUser : null;
      if (!activeAuthUser) {
        try {
          const stored = localStorage.getItem("copo_user_profile");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && Number(parsed.scratchVersion || 0) >= 6) {
              activeAuthUser = parsed;
            }
          }
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
              window.dispatchEvent(new CustomEvent("copo-profile-updated", { detail: anonData.user }));
            }
          }
        } catch {}
      }
      return activeAuthUser;
    })();

    let activeAuthUser: UserProfile | null = null;
    let uploadedPhotoUrl = "";
    try {
      const [resolvedUser, preUploaded] = await Promise.all([
        resolveAuthUserPromise,
        preUploadPromiseRef.current?.catch(() => null) || Promise.resolve(null)
      ]);
      activeAuthUser = resolvedUser;

      if (preUploaded && preUploaded.photoUrl) {
        // Speculative background upload already finished while user tapped stars — instant 0ms handoff!
        uploadedPhotoUrl = preUploaded.photoUrl;
        setPublishProgress(80);
        onUpdateBackgroundUpload?.(80);
      } else {
        setPublishProgress(45);
        onUpdateBackgroundUpload?.(45);
        setPublishStage("Uploading high-res photo...");
        const readyPhotoBlob = (await optimizedBlobPromiseRef.current?.catch(() => null)) || capturedPhotoBlob;
        const uploaded = await uploadBinaryPhoto(
          readyPhotoBlob,
          reviewId,
          selectedPlace.id,
          activeAuthUser?.id || (activeAuthUser as any)?.uid || "anon"
        );
        uploadedPhotoUrl = uploaded.photoUrl;
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

    setPublishProgress(88);
    onUpdateBackgroundUpload?.(88);
    setPublishStage("Publishing photo review...");

    const finalReview: VideoReview = {
      id: reviewId,
      mediaType: "photo",
      photoUrl: uploadedPhotoUrl,
      thumbnailUrl: uploadedPhotoUrl,
      photoDataUrl: "",
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
        isLocalGuide: false,
        videoReviewCount: 1,
        photosCount: 1,
        isVerified: false
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

    const { photoDataUrl: _omitBase64, ...leanReviewForPersist } = finalReview as any;

    try {
      await fetch("/api/videos/save-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leanReviewForPersist),
        keepalive: true,
        signal: AbortSignal.timeout(15000)
      });
    } catch {}

    fetch(`/api/nosql/videoReviews/${reviewId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: leanReviewForPersist, merge: true })
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
      list = [leanReviewForPersist, ...list.filter((v: any) => v && v.id !== finalReview.id)].slice(0, 50);
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
    if (clean.length < 2) {
      setUsernameStatus("error");
      setUsernameMessage("At least 2 characters");
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

  const handleRegisterPasskey = async () => {
    const uid = currentUser?.id || (currentUser as any)?.uid;
    if (!uid || isLinkingAccount) return;
    setIsLinkingAccount(true);
    setLinkStatusMsg(null);
    try {
      const result = await registerFaceIdPasskey({
        id: uid,
        name: currentUser?.name || uid
      });
      if (result.success && result.user) {
        onUpdateUserProfile?.(result.user);
        setLinkStatusMsg("Passkey saved! Your account is now backed up.");
        triggerHaptic("success");
      } else if (!result.cancelled) {
        setLinkStatusMsg(result.error || "Could not save passkey right now.");
      }
    } catch {
      setLinkStatusMsg("Could not save passkey right now.");
    } finally {
      setIsLinkingAccount(false);
    }
  };

  if (!isOpen) return null;

  // DESKTOP: Clean QR Code Mobile Handoff Modal
  if (isDesktopViewport && !postSubmitOnboarding) {
    const targetSlug = selectedPlace ? (getPlaceSlug(selectedPlace) || getPlaceSlug(selectedPlace.id) || selectedPlace.id) : "";
    const qrOrigin = typeof window !== "undefined" ? window.location.origin : "https://www.yoouz.com";
    const qrUrl = targetSlug
      ? `${qrOrigin}/reviews/${encodeURIComponent(targetSlug)}`
      : `${qrOrigin}/?addReview=1`;

    return (
      <div
        id="copo-create-review-modal"
        className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-200"
        onClick={handleCloseModal}
      >
        <div
          className="relative w-full max-w-[440px] bg-[#0c0c0f]/96 backdrop-blur-2xl rounded-[32px] border border-white/[0.1] shadow-[0_24px_80px_rgba(0,0,0,0.9)] p-6 sm:p-8 text-white space-y-6 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleCloseModal}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title={t("common.close", "Close")}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center mx-auto shadow-lg">
            <Smartphone className="w-7 h-7 text-white" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight text-white">Add Live Photo Review</h2>
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
              className="w-full py-3 px-4 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {qrCopied ? <Check className="w-4 h-4 text-[#E8C78A]" /> : <Copy className="w-4 h-4 text-zinc-400" />}
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
            // Immediately launch native phone camera inside this synchronous tap — zero extra screen
            if (onRequestInstantCamera && onRequestInstantCamera(matched)) {
              onClose();
              return;
            }
            setSelectedPlace(matched);
            setRating(0);
          } else {
            handleSearchMetadata(placeIdOrDomain);
          }
        }}
        onRecordForPlace={(place) => {
          // Immediately launch native phone camera inside this synchronous tap — zero extra screen
          if (onRequestInstantCamera && onRequestInstantCamera(place)) {
            onClose();
            return;
          }
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
      className="fixed inset-0 z-[200] bg-black/92 backdrop-blur-xl flex items-center justify-center p-0 md:p-6 overflow-hidden animate-in fade-in duration-200"
    >
      <div className="relative w-full h-full md:h-[780px] md:max-h-[90vh] max-w-[440px] bg-[#050506] md:rounded-[36px] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.92)] flex flex-col border border-white/[0.1]">
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

        {/* POST-SUBMIT ZERO-FRICTION ONBOARDING */}
        {postSubmitOnboarding && publishedReview ? (
          <div className="flex flex-col h-full w-full max-w-full bg-[#050506] p-6 justify-between overflow-y-auto overflow-x-hidden overscroll-y-contain overscroll-x-none touch-pan-y">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-white text-[11px] font-semibold">
                <Check className="w-3.5 h-3.5 text-[#E8C78A] stroke-[2.5]" />
                <span>Photo Review Live</span>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-11 h-11 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                title="Close"
                aria-label="Close"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="space-y-5 my-auto py-4">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.05] border border-white/[0.1] mx-auto overflow-hidden shadow-xl">
                  <img
                    src={publishedReview.photoUrl || publishedReview.thumbnailUrl}
                    alt={publishedReview.placeName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">Claim Your Reviewer Handle</h2>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
                  Your review is live under <span className="text-white font-semibold">{currentUser?.name || "your account"}</span>. Pick a handle, save a passkey, or tap Done.
                </p>
              </div>

              {/* Optional Custom Username */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                <label className="text-[11.5px] font-semibold text-zinc-300 block">
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
                      className="w-full pl-9 pr-3 py-2.5 rounded-full bg-white/[0.04] border border-white/[0.1] focus:border-white/30 text-[16px] md:text-sm font-medium text-white outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={usernameStatus !== "available"}
                    onClick={handleSaveUsername}
                    className="px-4 py-2.5 rounded-full bg-white hover:bg-zinc-200 disabled:bg-white/[0.06] disabled:text-zinc-500 text-zinc-950 font-semibold text-xs transition-colors cursor-pointer shrink-0"
                  >
                    {usernameStatus === "checking" ? "..." : usernameStatus === "saved" ? "Saved" : "Claim"}
                  </button>
                </div>
                {usernameMessage && (
                  <p
                    className={`text-[11px] font-semibold ${
                      usernameStatus === "available" || usernameStatus === "saved" ? "text-zinc-200" : "text-rose-400"
                    }`}
                  >
                    {usernameMessage}
                  </p>
                )}
              </div>

              {/* 1-Tap Passkey Account Backup */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2.5">
                <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-zinc-200">
                  <KeyRound className="w-3.5 h-3.5 text-[#E8C78A]" />
                  <span>Passkey</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Keep your account across devices — no email or password needed.
                </p>
                <button
                  type="button"
                  disabled={isLinkingAccount || Boolean((currentUser as any)?.passkeyProtected)}
                  onClick={handleRegisterPasskey}
                  className="w-full py-3 px-4 rounded-full bg-white hover:bg-zinc-200 disabled:bg-white/[0.06] disabled:text-zinc-400 disabled:border-white/[0.08] border border-white text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>
                    {(currentUser as any)?.passkeyProtected
                      ? "Passkey Saved"
                      : isLinkingAccount
                      ? "Saving..."
                      : "Save Passkey"}
                  </span>
                </button>
                {linkStatusMsg && (
                  <p className="text-[11px] font-semibold text-zinc-200">
                    {linkStatusMsg}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCloseModal}
              className="w-full py-3.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-sm transition-all cursor-pointer shadow-xl"
            >
              Done
            </button>
          </div>
        ) : capturedPhotoUrl ? (
          /* PREVIEW STAGE: Crisp Native Captured Photo + Elevated Star Selector + Retake & Publish */
          <div className="relative w-full h-full bg-black flex flex-col justify-between overflow-hidden">
            <img
              src={capturedPhotoUrl}
              alt="Captured review preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Measured Top & Bottom Scrims — keeps the photo vibrant & bright through the middle 60% */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/75 via-black/30 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-black/95 via-black/65 to-transparent pointer-events-none" />

            {/* Top Bar: Clean Business Context & 44px Close */}
            <div className="relative z-20 flex items-center justify-between gap-3 px-4 pt-[max(16px,env(safe-area-inset-top,16px))]">
              <div className="flex items-center gap-2.5 min-w-0 pr-3 py-1.5 pl-1.5 rounded-2xl bg-black/55 backdrop-blur-xl border border-white/15 text-white shadow-lg">
                <CopoBrandLogo
                  domain={selectedPlace?.brandDomain || extractCleanDomain(selectedPlace?.website || selectedPlace?.id || selectedPlace?.name)}
                  name={selectedPlace?.name}
                  website={selectedPlace?.website}
                  logoUrl={selectedPlace?.logoUrl || selectedPlace?.avatarUrl}
                  bannerUrl={selectedPlace?.bannerUrl || selectedPlace?.ogImage}
                  className="w-8 h-8 rounded-xl bg-white overflow-hidden flex items-center justify-center shrink-0 p-0.5"
                  imageClassName="w-full h-full object-contain"
                  fallbackTextClassName="font-extrabold text-[11px] text-zinc-950"
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-300 leading-none mb-0.5">
                    Reviewing
                  </p>
                  <p className="font-extrabold text-sm leading-tight truncate">
                    {formatBusinessName(selectedPlace?.name, selectedPlace?.brandDomain || selectedPlace?.website, selectedPlace?.id)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isPublishing}
                onClick={handleCloseModal}
                className="w-11 h-11 rounded-full bg-black/55 hover:bg-black/85 backdrop-blur-xl border border-white/15 text-white flex items-center justify-center cursor-pointer shrink-0 disabled:opacity-50 transition-colors active:scale-95"
                title="Close"
                aria-label="Close review preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom Controls: Error + SpecialStarSelector + Action Row */}
            <div className="relative z-20 px-4 pb-[max(20px,calc(env(safe-area-inset-bottom,0px)+16px))] space-y-3">
              {errorMessage && (
                <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl bg-red-950/90 border border-red-700/70 text-red-100 text-xs font-semibold backdrop-blur-xl">
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
                label="Rate your experience"
              />

              {isPublishing ? (
                <div className="p-4 rounded-2xl bg-zinc-950/95 backdrop-blur-2xl border border-white/15 space-y-2.5 shadow-2xl">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {publishStage}
                    </span>
                    <span className="tabular-nums">{publishProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-300 rounded-full"
                      style={{ width: `${publishProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <label
                    htmlFor="native-camera-capture-input"
                    onClick={() => {
                      triggerHaptic("light");
                      setErrorMessage(null);
                      if (nativeCameraInputRef.current) {
                        nativeCameraInputRef.current.value = "";
                      }
                    }}
                    className="min-h-[52px] px-5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/[0.16] text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all select-none shrink-0"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Retake</span>
                  </label>

                  <button
                    type="button"
                    disabled={rating < 1}
                    onClick={handlePublish}
                    className={`flex-1 min-h-[52px] px-5 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-2xl ${
                      rating >= 1
                        ? "bg-white hover:bg-zinc-200 text-zinc-950 cursor-pointer"
                        : "bg-white/[0.08] text-zinc-400 border border-white/[0.12] cursor-not-allowed"
                    }`}
                  >
                    {rating >= 1 && <Check className="w-4 h-4 stroke-[2.5]" />}
                    <span>{rating >= 1 ? "Publish Review" : "Tap 1–5 Stars to Publish"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* NATIVE CAMERA LAUNCH STAGE: Opens iOS/Android phone camera app directly */
          <div className="relative w-full h-full bg-[#050506] flex flex-col justify-between overflow-hidden">
            {/* Top Place Pill & Close */}
            <div className="relative z-20 flex items-center justify-between gap-2 p-4 pt-5">
              <button
                type="button"
                onClick={() => {
                  userClearedPlaceRef.current = true;
                  setSelectedPlace(null);
                }}
                className="px-3.5 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-xl border border-white/[0.12] text-white flex items-center gap-2.5 min-w-0 cursor-pointer transition-colors"
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
                <span className="font-semibold text-xs truncate">
                  {formatBusinessName(selectedPlace?.name, selectedPlace?.brandDomain || selectedPlace?.website, selectedPlace?.id)}
                </span>
              </button>

              <button
                type="button"
                onClick={handleCloseModal}
                className="w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-xl border border-white/[0.12] text-white flex items-center justify-center cursor-pointer shrink-0 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Center Prompt + Native Camera Launch CTA */}
            <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-6 text-center space-y-6">
              {isProcessingPhoto || isSearchingMetadata ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-3xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center shadow-2xl">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                  <p className="text-sm font-semibold text-white">Preparing your photo...</p>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-3xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center shadow-2xl">
                    <Camera className="w-9 h-9 text-white" />
                  </div>

                  <div className="space-y-2 max-w-xs">
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      Snap a Native Photo
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                      Opens your phone&apos;s camera app directly for full native quality, HDR, and stabilization.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="w-full max-w-xs p-3 rounded-2xl bg-red-950/90 border border-red-800/60 text-red-200 text-xs font-medium text-center flex items-center justify-center gap-2">
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
                    className="w-full max-w-xs py-4 px-6 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-[15px] flex items-center justify-center gap-2.5 shadow-[0_12px_32px_rgba(255,255,255,0.16)] active:scale-95 transition-all cursor-pointer select-none"
                  >
                    <Camera className="w-5 h-5 stroke-[2.25]" />
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
