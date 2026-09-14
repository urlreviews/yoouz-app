import React, { useState, useEffect, useRef } from "react";
import {
  X,
  CheckCircle,
  Star,
  Video,
  Share2,
  UserPlus,
  UserCheck,
  ShieldCheck,
  MessageSquare,
  Camera,
  Edit3,
  Trash2,
  LogOut,
  MoreVertical,
  Play,
  ThumbsUp,
  MapPin,
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Bell,
  Building2,
  ExternalLink
} from "lucide-react";
import { VideoAuthor, VideoReview, UserProfile } from "../types";
import { isAuthorMatch, getDisplayUrlAsDomain, getDisplayViews, formatViewCount, KNOWN_COMMUNITY_USERS, getSafeAvatarUrl, resolveSafeAuthor, getPlaceSlug } from "../utils/placeUtils";
import { resolveVideoPosterUrl } from "../utils/videoUtils";
import { CopoVideoThumbnail } from "./CopoVideoThumbnail";
import { CopoShareModal } from "./CopoShareModal";
import { CountrySelector } from "./CountrySelector";
import { SearchableComboSelector } from "./SearchableComboSelector";
import { countries } from "../utils/countries";
import { locationData } from "../utils/locationData";
import { Country, State, City } from "country-state-city";
import { generateGoogleLetterAvatarSvg, getFirstLetter, getAvatarColor } from "../lib/avatar";
import { triggerHaptic } from "../utils/haptics";
import { useSwipeDownToDismiss } from "../hooks/useSwipeDownToDismiss";
import { useLanguage } from "../i18n/LanguageContext";
import { LanguageSelectorModal } from "./LanguageSelectorModal";
import { Globe } from "lucide-react";

interface CopoCreatorDrawerProps {
  author: VideoAuthor | null;
  allVideos: VideoReview[];
  currentUser?: UserProfile | null;
  allUsers?: any[];
  activeVideoId?: string;
  onClose: () => void;
  onSelectVideo: (videoId: string) => void;
  onToggleFollow: (handle: string) => void;
  onStartChat?: (senderId: string, senderName: string, senderAvatar: string) => void;
  onUpdateProfile?: (updated: { name?: string; bio?: string; avatar?: string; banner?: string; location?: string }) => void;
  onOpenReport?: (author: VideoAuthor) => void;
  onRecordReview?: (place: any) => void;
  onDeleteVideo?: (videoId: string) => void;
  onSignOut?: () => void;
  onDeleteProfile?: () => Promise<void>;
  isSaved?: boolean;
  onToggleSaveCreator?: (author: VideoAuthor) => void;
  onOpenNotificationSettings?: () => void;
  onOpenPlace?: (placeId: string) => void;
}

export const CopoCreatorDrawer: React.FC<CopoCreatorDrawerProps> = ({
  author,
  allVideos,
  currentUser,
  allUsers,
  activeVideoId,
  onClose,
  onSelectVideo,
  onToggleFollow,
  onStartChat,
  onUpdateProfile,
  onOpenReport,
  onRecordReview,
  onDeleteVideo,
  onSignOut,
  onDeleteProfile,
  isSaved: propIsSaved,
  onToggleSaveCreator,
  onOpenNotificationSettings,
  onOpenPlace
}) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const { t, currentLanguageMeta } = useLanguage();
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [videoToDeleteInDrawer, setVideoToDeleteInDrawer] = useState<VideoReview | null>(null);
  const [copiedNotification, setCopiedNotification] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "reviews" | "about">("overview");
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Auto-redirect if this author is a business to maintain a single canonical Place page
  useEffect(() => {
    if (!author?.name || !onOpenPlace) return;
    const authorLower = (author.name || "").toLowerCase().trim();
    const associatedPlaceId =
      authorLower === "yoouz" || authorLower === "@yoouz" || authorLower === "yoouz.com" || authorLower.includes("yoouz")
        ? "yoouz.com"
        : authorLower === "legal 500" || authorLower === "legal500" || authorLower.includes("legal500")
        ? "legal500.com"
        : authorLower.includes(".")
        ? authorLower.replace(/^www\./, "").trim()
        : null;

    if (associatedPlaceId) {
      onOpenPlace(associatedPlaceId);
      if (onClose) onClose();
    }
  }, [author?.name, onOpenPlace, onClose]);

  const [localIsSaved, setLocalIsSaved] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("yoouz_saved_creators");
      if (saved && author?.name) {
        const list: string[] = JSON.parse(saved);
        return list.includes(author.name.toLowerCase());
      }
    } catch (e) {}
    return false;
  });

  const isSaved = propIsSaved !== undefined ? propIsSaved : localIsSaved;

  const handleToggleSaveCreator = () => {
    triggerHaptic("light");
    if (!author?.name) return;

    if (onToggleSaveCreator) {
      onToggleSaveCreator(author);
      const willBeSaved = !isSaved;
      setCopiedNotification(
        willBeSaved
          ? t("profile.savedReviewer", "Saved reviewer to bookmarks")
          : t("profile.removedSaved", "Removed reviewer from Saved")
      );
      setTimeout(() => setCopiedNotification(""), 3000);
      return;
    }

    try {
      const saved = localStorage.getItem("yoouz_saved_creators");
      let list: string[] = saved ? JSON.parse(saved) : [];
      const cleanName = author.name.toLowerCase();
      let nextState = false;
      if (list.includes(cleanName)) {
        list = list.filter((n) => n !== cleanName);
        nextState = false;
        setCopiedNotification(t("profile.removedSaved", "Removed reviewer from Saved"));
      } else {
        list.push(cleanName);
        nextState = true;
        setCopiedNotification(t("profile.savedReviewer", "Saved reviewer to bookmarks"));
      }
      localStorage.setItem("yoouz_saved_creators", JSON.stringify(list));
      setLocalIsSaved(nextState);
      setTimeout(() => setCopiedNotification(""), 3000);
    } catch (e) {}
  };
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editBanner, setEditBanner] = useState("");
  const [bannerError, setBannerError] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [avatarImgError, setAvatarImgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);

  const isOwner = Boolean(author && currentUser && isAuthorMatch({ author: author } as any, currentUser));

  useEffect(() => {
    if (isOwner && currentUser) {
      setEditName(currentUser.name || "");
      setEditBio(currentUser.bio || "");
      setEditBanner(currentUser.banner || "");
      setEditAvatar(currentUser.avatar || "");
      const loc = currentUser.location || "";
      setEditLocation(loc);

      const parts = loc.split(",").map(p => p.trim()).filter(Boolean);
      if (parts.length >= 3) {
        setEditCity(parts[0]);
        setEditState(parts[1]);
        const parsedCountry = countries.find(c => c.toLowerCase() === parts[2].toLowerCase()) || parts[2];
        setEditCountry(parsedCountry);
      } else if (parts.length === 2) {
        const isSecondPartCountry = countries.some(c => c.toLowerCase() === parts[1].toLowerCase());
        if (isSecondPartCountry) {
          setEditCity(parts[0]);
          setEditState("");
          setEditCountry(countries.find(c => c.toLowerCase() === parts[1].toLowerCase()) || parts[1]);
        } else {
          setEditCity(parts[0]);
          setEditState(parts[1]);
          setEditCountry("");
        }
      } else if (parts.length === 1) {
        const isCountry = countries.some(c => c.toLowerCase() === parts[0].toLowerCase());
        if (isCountry) {
          setEditCity("");
          setEditState("");
          setEditCountry(countries.find(c => c.toLowerCase() === parts[0].toLowerCase()) || parts[0]);
        } else {
          setEditCity(parts[0]);
          setEditState("");
          setEditCountry("");
        }
      } else {
        setEditCity("");
        setEditState("");
        setEditCountry("");
      }
    }
  }, [isOwner, currentUser]);

  // Close settings dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target as Node)) {
        setIsSettingsMenuOpen(false);
      }
    };
    if (isSettingsMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSettingsMenuOpen]);

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

  // Helper to synchronously resolve the best initial profile matching the author
  const resolveTargetProfile = (
    targetAuthor: VideoAuthor | null,
    isProfileOwner: boolean,
    user: any,
    userList?: any[],
    videosList?: any[]
  ) => {
    if (isProfileOwner && user) return user;
    if (!targetAuthor) return null;
    const authorIdentifier = (targetAuthor.name || "").replace(/^@+/, "").trim().toLowerCase();
    if (!authorIdentifier) return targetAuthor;

    // 1. Check passed userList
    if (userList && userList.length > 0) {
      const matched = userList.find((u: any) => {
        const uName = (u.name || "").trim().toLowerCase();
        const uHandle = (u.handle || "").replace(/^@+/, "").trim().toLowerCase();
        const uEmail = (u.email || "").split("@")[0].toLowerCase();
        return uName === authorIdentifier || uHandle === authorIdentifier || uEmail === authorIdentifier;
      });
      if (matched) return matched;
    }

    // 2. Check KNOWN_COMMUNITY_USERS
    const known = KNOWN_COMMUNITY_USERS[authorIdentifier];
    if (known) {
      return {
        ...targetAuthor,
        ...known,
        location: targetAuthor.location || known.location
      };
    }

    // 3. Check videos for matching author with location
    if (videosList && videosList.length > 0) {
      const matchVid = videosList.find((v) => isAuthorMatch(v, targetAuthor) && (v.author?.location || v.author?.avatar));
      if (matchVid?.author) {
        return {
          ...targetAuthor,
          ...matchVid.author,
          location: targetAuthor.location || matchVid.author.location
        };
      }
    }

    // 4. Check localStorage
    try {
      const savedUsers = localStorage.getItem("yoouz_all_users");
      if (savedUsers) {
        const parsed = JSON.parse(savedUsers);
        if (Array.isArray(parsed)) {
          const matched = parsed.find((u: any) => {
            const uName = (u.name || "").trim().toLowerCase();
            const uHandle = (u.handle || "").replace(/^@+/, "").trim().toLowerCase();
            const uEmail = (u.email || "").split("@")[0].toLowerCase();
            return uName === authorIdentifier || uHandle === authorIdentifier || uEmail === authorIdentifier;
          });
          if (matched) return matched;
        }
      }
      if (isProfileOwner) {
        const savedProfile = localStorage.getItem("copo_user_profile");
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          const pName = (parsed.name || "").trim().toLowerCase();
          if (pName === authorIdentifier) return parsed;
        }
      }
    } catch (e) {}

    return targetAuthor;
  };

  // State to hold live fetched user profile for this creator (initialized synchronously to prevent location blinking)
  const [liveUserProfile, setLiveUserProfile] = useState<{ avatar?: string; banner?: string; bio?: string; name?: string; location?: string } | null>(() => {
    return resolveTargetProfile(author, isOwner, currentUser, allUsers, allVideos);
  });

  useEffect(() => {
    if (!author) return;
    const authorIdentifier = (author.name || "").replace(/^@+/, "").trim().toLowerCase();
    if (!authorIdentifier) return;

    // Immediately sync with synchronous resolution first to prevent any visual delay
    const initialMatch = resolveTargetProfile(author, isOwner, currentUser, allUsers, allVideos);
    if (initialMatch) {
      setLiveUserProfile(initialMatch);
    }

    if (isOwner && currentUser) {
      setLiveUserProfile((prev) => ({ ...(prev || {}), ...currentUser }));
    }

    let isMounted = true;
    fetch(`/api/nosql/users`)
      .then((res) => res.json())
      .then((usersList) => {
        if (!isMounted || !Array.isArray(usersList)) return;
        const matched = usersList.find((u: any) => {
          const uName = (u.name || "").trim().toLowerCase();
          const uHandle = (u.handle || "").replace(/^@+/, "").trim().toLowerCase();
          const uEmail = (u.email || "").split("@")[0].toLowerCase();
          return uName === authorIdentifier || uHandle === authorIdentifier || uEmail === authorIdentifier;
        });
        if (matched && isMounted) {
          setLiveUserProfile((prev) => ({ ...(prev || {}), ...matched }));
        }
      })
      .catch(() => {});

    // Listen for live global profile updates
    const handleProfileUpdate = (e: any) => {
      const p = e?.detail;
      if (!p) return;
      const pName = (p.name || "").trim().toLowerCase();
      const pHandle = (p.handle || "").replace(/^@+/, "").trim().toLowerCase();
      const pEmail = (p.email || "").split("@")[0].toLowerCase();
      if (pName === authorIdentifier || pHandle === authorIdentifier || pEmail === authorIdentifier) {
        setLiveUserProfile((prev) => ({ ...(prev || {}), ...p }));
      }
    };
    window.addEventListener("copo-profile-updated", handleProfileUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener("copo-profile-updated", handleProfileUpdate);
    };
  }, [author?.name, allUsers, isOwner, currentUser, allVideos]);

  if (!author) return null;

  // Filter videos belonging to this author
  const authorVideos = allVideos.filter((v) => isAuthorMatch(v, author));

  // Check if any video by this author contains a genuine Google / high-res avatar
  const videoWithAuthenticAvatar = authorVideos.find((v) => {
    const a = v.author?.avatar;
    return (
      a &&
      typeof a === "string" &&
      (a.includes("googleusercontent.com") || a.startsWith("data:image/") || (!a.includes("ui-avatars") && !a.includes("dicebear") && !a.includes("unsplash") && !a.includes("/api/videos/") && !a.includes(".mp4") && !a.includes("rev-")))
    );
  });

  const totalLikes = authorVideos.reduce((acc, v) => acc + v.likes + (v.isLiked ? 1 : 0), 0);
  const avgRating =
    authorVideos.length > 0
      ? (authorVideos.reduce((acc, v) => acc + v.rating, 0) / authorVideos.length).toFixed(1)
      : "5.0";

  // Resolve genuine profile author & avatar with unified resolver (guarantees 100% parity with video feed)
  const safeCreator = resolveSafeAuthor(
    {
      author: {
        ...author,
        avatar: liveUserProfile?.avatar || (isOwner && currentUser?.avatar ? currentUser.avatar : author.avatar),
        name: liveUserProfile?.name || (isOwner && currentUser?.name ? currentUser.name : author.name),
        bio: liveUserProfile?.bio || author.bio,
        banner: liveUserProfile?.banner || author.banner,
        location: liveUserProfile?.location || author.location || (KNOWN_COMMUNITY_USERS[(author.name || "").replace(/^@+/, "").trim().toLowerCase()]?.location)
      },
      userId: (author as any)?.userId || (isOwner ? currentUser?.email : undefined),
      userEmail: (author as any)?.email || (isOwner ? currentUser?.email : undefined)
    },
    isOwner ? currentUser : null,
    allUsers || (liveUserProfile ? [liveUserProfile] : [])
  );

  const effectiveAvatar = isOwner && currentUser?.avatar
    ? currentUser.avatar
    : (liveUserProfile?.avatar || safeCreator.avatar || author.avatar);

  const effectiveBanner = isOwner && currentUser?.banner 
    ? currentUser.banner 
    : (liveUserProfile?.banner || safeCreator.banner || author?.banner);

  const displayName = isOwner && currentUser?.name
    ? currentUser.name
    : (liveUserProfile?.name || safeCreator.name || author.name || "Reviewer");

  const displayLocation = isOwner && currentUser?.location
    ? currentUser.location
    : (liveUserProfile?.location || safeCreator.location || author.location || (KNOWN_COMMUNITY_USERS[(author.name || "").replace(/^@+/, "").trim().toLowerCase()]?.location));

  const displayBio = isOwner && typeof currentUser?.bio === 'string'
    ? currentUser.bio
    : (liveUserProfile?.bio || safeCreator.bio || author?.bio || "");

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleTabClick = (tab: "overview" | "reviews" | "about") => {
    setActiveTab(tab);
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setBannerError("Please select a valid image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setBannerError("Image file must be under 8MB.");
      return;
    }
    setBannerError("");
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        // Banners can be wider
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          try {
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.85);
            setEditBanner(compressedBase64);
          } catch (err) {
            setBannerError("Failed to process image.");
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select a valid image file.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setAvatarError("Image file must be under 8MB.");
      return;
    }

    setAvatarError("");
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 256;
        const MAX_HEIGHT = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          try {
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.85);
            setEditAvatar(compressedBase64);
          } catch (err) {
            setAvatarError("Failed to process image.");
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = editName.trim() || currentUser?.name || "Reviewer";
    
    // Construct premium location string from structured fields
    const locParts = [editCity.trim(), editState.trim(), editCountry.trim()].filter(Boolean);
    const combinedLocation = locParts.join(", ");

    let finalAvatar = editAvatar || currentUser?.avatar;

    // If user selected a new photo (base64), upload it directly to Bunny CDN storage
    if (editAvatar && editAvatar.startsWith('data:image/')) {
      setIsSavingProfile(true);
      try {
        const uploadRes = await fetch('/api/user/upload-avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: editAvatar,
            userId: currentUser?.email || currentUser?.name || 'user'
          })
        });
        const uploadData = await uploadRes.json();
        if (uploadData.avatarUrl) {
          finalAvatar = uploadData.avatarUrl;
        }
      } catch (uploadErr) {
        console.warn("Avatar upload to Bunny CDN fallback:", uploadErr);
      } finally {
        setIsSavingProfile(false);
      }
    }

    const updatedProfile = {
      name: cleanName,
      bio: editBio.trim(),
      avatar: finalAvatar,
      banner: editBanner || currentUser?.banner,
      location: combinedLocation
    };

    setLiveUserProfile((prev) => ({
      ...(prev || {}),
      ...updatedProfile
    }));

    if (onUpdateProfile) {
      onUpdateProfile(updatedProfile);
    }
    setIsEditModalOpen(false);
  };

  const { dragOffsetY, swipeProps } = useSwipeDownToDismiss({
    onDismiss: onClose,
    threshold: 60
  });

  return (
    <>
      {/* Mobile Backdrop (Bottom Sheet) */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200" 
        onClick={() => {
          triggerHaptic("light");
          onClose();
        }} />

      <aside
        id="google-maps-creator-panel"
        style={dragOffsetY > 0 ? { transform: `translateY(${dragOffsetY}px)`, transition: 'none' } : undefined}
        className="fixed inset-x-0 bottom-0 md:bottom-auto md:inset-auto md:relative z-50 md:z-20 w-full md:w-[350px] lg:w-[430px] h-[100dvh] md:h-[100dvh] bg-zinc-950 md:bg-zinc-900 text-white md:text-white flex flex-col shadow-none md:shadow-lg border-r border-zinc-800 md:border-zinc-800 shrink-0 overflow-hidden animate-in slide-in-from-bottom md:slide-in-from-left duration-200 select-none overscroll-contain transition-transform"
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
          {/* Top-Left Back Button (Both Desktop & Mobile) */}
          <button
            id="btn-close-creator-panel"
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="absolute top-[calc(0.75rem+env(safe-area-inset-top,0px))] left-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xl shadow-xl flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer border border-white/15 z-30"
            title={t("common.back", "Back to previous page")}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {effectiveBanner ? (
            <div className="absolute inset-0 w-full h-full bg-zinc-900 md:bg-zinc-900 relative overflow-hidden flex items-center justify-center group">
              <img
                src={effectiveBanner}
                alt=""
                className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-50 scale-125"
                referrerPolicy="no-referrer"
              />
              <img
                src={effectiveBanner}
                alt="Banner"
                className="relative z-10 w-full h-full object-cover p-0"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/25 z-20 pointer-events-none" />
            </div>
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-zinc-950 via-slate-900 to-zinc-950 flex flex-col items-center justify-center overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:32px_32px]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.15),transparent_70%)]" />
              <div className="px-3.5 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm z-10 shadow-sm">
                <span className="text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase select-none">
                  {author.isLocalGuide ? t("profile.verifiedTopReviewer", "Verified Top Reviewer") : t("profile.verifiedReviewer", "Verified Reviewer")}
                </span>
              </div>
            </div>
          )}

          {/* Top Right Action Group - Only for Profile Owner Settings */}
          {isOwner && (
            <div className="absolute top-[calc(0.75rem+env(safe-area-inset-top,0px))] right-3 flex items-center gap-2 z-30">
              <div className="relative" ref={settingsMenuRef}>
                <button
                  id="btn-creator-profile-settings"
                  onClick={() => setIsSettingsMenuOpen((prev) => !prev)}
                  className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xl shadow-xl flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer border border-white/15"
                  title={t("profile.accountSettings", "Account & Settings")}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {isSettingsMenuOpen && (
                  <div className="absolute right-0 top-11 w-52 bg-zinc-900 rounded-2xl shadow-xl border border-zinc-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      onClick={() => {
                        setIsSettingsMenuOpen(false);
                        setIsEditModalOpen(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-zinc-200 hover:bg-zinc-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4 text-zinc-200" />
                      <span>{t("profile.editProfile", "Edit Profile")}</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsSettingsMenuOpen(false);
                        handleShare();
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-zinc-200 hover:bg-zinc-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 text-zinc-200" />
                      <span>{t("profile.shareProfileLink", "Share Profile Link")}</span>
                    </button>

                    {onOpenNotificationSettings && (
                      <button
                        id="btn-creator-notification-settings"
                        onClick={() => {
                          setIsSettingsMenuOpen(false);
                          onOpenNotificationSettings();
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-bold text-zinc-200 hover:bg-zinc-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Bell className="w-4 h-4 text-zinc-200" />
                        <span>Notification Preferences</span>
                      </button>
                    )}

                    {onSignOut && (
                      <button
                        onClick={() => {
                          setIsSettingsMenuOpen(false);
                          onSignOut();
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-bold text-zinc-200 hover:bg-zinc-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-zinc-200" />
                        <span>{t("profile.signOut", "Sign Out")}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {copiedNotification && (
            <div className="absolute top-14 right-3 bg-zinc-900 text-white text-xs px-3 py-1.5 rounded-md shadow-lg z-40 animate-in fade-in border border-zinc-800">
              {copiedNotification}
            </div>
          )}

          {/* Overlapping Creator Avatar - Exact squircle shape and styling matching Business Profile Logo */}
          <div className="absolute -bottom-10 sm:-bottom-12 left-6 w-24 h-24 sm:w-32 sm:h-32 rounded-[24px] sm:rounded-[28px] border-[4px] sm:border-[5px] border-zinc-950 md:border-zinc-800 bg-zinc-900 shadow-2xl flex items-center justify-center z-20 p-2 sm:p-3 ring-1 ring-white/15 overflow-hidden group">
            {effectiveAvatar && !effectiveAvatar.includes("/api/avatar") && !effectiveAvatar.startsWith("data:image/svg+xml") && !avatarImgError ? (
              <img
                src={effectiveAvatar}
                alt={displayName}
                className="w-full h-full object-cover rounded-[16px] sm:rounded-[18px] [image-rendering:-webkit-optimize-contrast]"
                referrerPolicy="no-referrer"
                onError={() => setAvatarImgError(true)}
              />
            ) : (
              <div
                className="w-full h-full rounded-[16px] sm:rounded-[18px] flex items-center justify-center shadow-inner select-none"
                style={{ backgroundColor: getAvatarColor(displayName || author.name || "User").bg }}
              >
                <span className="font-black text-3xl sm:text-5xl text-white drop-shadow-md font-sans">
                  {getFirstLetter(displayName || author.name || "User")}
                </span>
              </div>
            )}

            {isOwner && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-[24px] sm:rounded-[28px]"
                title={t("profile.changePhoto", "Change Photo")}
              >
                <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Creator Details Header */}
        <div className="px-6 pt-14 pb-3 bg-zinc-950 md:bg-zinc-900">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0 flex-1 pr-2">
              <h2 className="text-2xl font-bold text-white tracking-tight leading-tight [overflow-wrap:anywhere]">
                {(() => {
                  const name = displayName || "";
                  const words = name.split(" ");
                  const lastWord = words.pop();
                  return (
                    <>
                      {words.length > 0 && <span>{words.join(" ")} </span>}
                      <span className="whitespace-nowrap inline-flex items-center gap-1.5 align-bottom">
                        <span className="break-words max-w-full" style={{ wordBreak: 'break-word' }}>{lastWord}</span>
                        <span title={t("profile.verifiedReviewer", "Verified Reviewer")} className="inline-flex">
                          <CheckCircle className="w-5 h-5 fill-white text-black shrink-0" />
                        </span>
                      </span>
                    </>
                  );
                })()}
              </h2>
            </div>

            {/* Primary Action Button (Follow for other users) */}
            {!isOwner && (
              <button
                onClick={() => onToggleFollow(author.name)}
                className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0 border ${
                  author.isFollowed
                    ? "bg-zinc-800 text-zinc-100 border-zinc-700 hover:bg-zinc-700"
                    : "bg-white text-zinc-950 hover:bg-zinc-200 border-white"
                }`}
              >
                {author.isFollowed ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-zinc-200" />
                    <span>{t("profile.following", "Following")}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{t("profile.follow", "Follow")}</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-x-2 gap-y-1 flex-wrap text-sm text-zinc-300 min-h-[22px]">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-zinc-200 font-medium">
                {authorVideos.length} {authorVideos.length === 1 ? t("place.review", "review") : t("place.reviews", "reviews")}
              </span>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-200 font-medium">
                {(author.followersCount || 0) + (author.isFollowed ? 1 : 0)} {t("profile.followers", "followers")}
              </span>
            </div>
            {displayLocation && (
              <div className="flex items-center gap-1.5 min-w-0 max-w-full">
                <span className="text-zinc-700 hidden sm:inline">·</span>
                <span className="text-zinc-300 text-xs font-medium flex items-center gap-1 truncate">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate">{displayLocation}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Google Maps Tabs: Overview | Reviews | About */}
        <div className="flex items-center border-b border-zinc-800 bg-zinc-950 px-5 text-sm font-semibold text-zinc-200 shrink-0">
          <button
            onClick={() => handleTabClick("overview")}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === "overview"
                ? "border-white text-white font-bold"
                : "border-transparent hover:text-zinc-200"
            }`}
          >
            {t("profile.overviewTab", "Overview")}
          </button>
          <button
            onClick={() => handleTabClick("reviews")}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "reviews"
                ? "border-white text-white font-bold"
                : "border-transparent hover:text-zinc-200"
            }`}
          >
            <span>{t("place.reviews", "Reviews")}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-200 text-xs font-bold border border-zinc-700">
              {authorVideos.length}
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
            {t("profile.aboutTab", "About")}
          </button>
        </div>

        {/* Main Content Area */}
        <div ref={contentRef} className="flex-1 overflow-y-auto divide-y divide-zinc-800 bg-zinc-950" style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>
          {/* Action Buttons Row */}
          <div className="px-5 py-3.5 flex items-center justify-around text-center bg-zinc-900/60 border-b border-zinc-800 gap-2">
            {onStartChat ? (
              <button
                id="btn-chat-creator"
                onClick={() => {
                  triggerHaptic("light");
                  onStartChat(author.name, author.name, effectiveAvatar);
                }}
                className="flex flex-col items-center gap-1.5 text-xs text-zinc-200 hover:text-white hover:scale-105 transition-transform group shrink-0 min-w-[58px] cursor-pointer"
                title={`${t("profile.chatWith", "Chat with")} ${author.name}`}
              >
                <div className="w-10 h-10 rounded-full bg-zinc-800 group-hover:bg-zinc-700 text-zinc-200 flex items-center justify-center shadow-md border border-zinc-700">
                  <MessageSquare className="w-5 h-5 text-zinc-200" />
                </div>
                <span className="font-semibold text-[11px] text-zinc-200">{t("profile.chat", "Chat")}</span>
              </button>
            ) : null}

            <button
              id="btn-save-creator"
              onClick={handleToggleSaveCreator}
              className="flex flex-col items-center gap-1.5 text-xs text-zinc-200 hover:text-white hover:scale-105 transition-transform group shrink-0 min-w-[58px] cursor-pointer"
              title={isSaved ? t("profile.savedReviewer", "Saved Reviewer") : t("profile.saveReviewer", "Save Reviewer")}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-colors ${
                  isSaved
                    ? "bg-white text-zinc-950"
                    : "bg-zinc-800 text-zinc-200 border border-zinc-700 group-hover:bg-zinc-700"
                }`}
              >
                {isSaved ? (
                  <BookmarkCheck className="w-5 h-5 fill-zinc-950" />
                ) : (
                  <Bookmark className="w-5 h-5" />
                )}
              </div>
              <span className="font-semibold text-[11px] text-zinc-200">
                {isSaved ? t("profile.saved", "Saved") : t("profile.save", "Save")}
              </span>
            </button>

            <button
              id="btn-creator-video-reviews"
              onClick={() => {
                triggerHaptic("light");
                handleTabClick("reviews");
              }}
              className="flex flex-col items-center gap-1.5 text-xs text-zinc-200 hover:text-white hover:scale-105 transition-transform group shrink-0 min-w-[58px] cursor-pointer"
              title={t("profile.viewVideoReviews", "View Video Reviews")}
            >
              <div className="w-10 h-10 rounded-full bg-zinc-800 group-hover:bg-zinc-700 text-zinc-200 flex items-center justify-center shadow-md border border-zinc-700">
                <Video className="w-5 h-5 text-zinc-200" />
              </div>
              <span className="font-semibold text-[11px] text-zinc-200">{t("place.reviews", "Video Reviews")}</span>
            </button>

            <button
              id="btn-share-creator-action"
              onClick={() => {
                triggerHaptic("light");
                handleShare();
              }}
              className="flex flex-col items-center gap-1.5 text-xs text-zinc-200 hover:text-white hover:scale-105 transition-transform group shrink-0 min-w-[58px] cursor-pointer"
              title={t("profile.shareProfile", "Share Profile")}
            >
              <div className="w-10 h-10 rounded-full bg-zinc-800 group-hover:bg-zinc-700 text-zinc-200 flex items-center justify-center shadow-md border border-zinc-700">
                <Share2 className="w-5 h-5 text-zinc-200" />
              </div>
              <span className="font-semibold text-[11px] text-zinc-200">{t("common.share", "Share")}</span>
            </button>
          </div>

          {/* Tab 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="divide-y divide-zinc-800">
              {/* About This Reviewer Section */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-zinc-200 uppercase tracking-wider">
                    {t("profile.aboutThisReviewer", "About This Reviewer")}
                  </h3>
                </div>
                <p className="text-zinc-200 text-sm leading-relaxed font-normal">
                  {displayBio}
                </p>

                {/* Badges / Status Card */}
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <div className="bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800">
                    <span className="text-[9px] font-bold text-zinc-200 uppercase tracking-wider block mb-0.5">{t("profile.avgRatingGiven", "Average Rating Given")}</span>
                    <span className="text-sm font-black text-white flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>{avgRating}</span>
                      <span className="text-zinc-200 text-xs font-normal">/ 5.0</span>
                    </span>
                  </div>
                  <div className="bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800">
                    <span className="text-[9px] font-bold text-zinc-200 uppercase tracking-wider block mb-0.5">{t("profile.totalReviews", "Total Reviews")}</span>
                    <span className="text-sm font-black text-white flex items-center gap-1">
                      <Video className="w-4 h-4 text-zinc-200" />
                      <span>{authorVideos.length} {authorVideos.length === 1 ? t("feed.video", "Video") : t("feed.videos", "Videos")}</span>
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2 text-zinc-200">
                  <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-200" />
                  </div>
                  <span className="text-xs font-bold text-zinc-200">{t("profile.verifiedTopContributor", "Yoouz Verified Top Contributor")}</span>
                </div>
              </div>

              {/* Video Reviews Preview Section */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-zinc-200" />
                    <span>{t("place.reviews", "Video Reviews")} ({authorVideos.length})</span>
                  </h3>
                  {authorVideos.length > 0 && (
                    <button
                      onClick={() => handleTabClick("reviews")}
                      className="text-xs font-bold text-zinc-200 hover:text-white hover:underline cursor-pointer"
                    >
                      {t("common.seeAll", "See all")} ({authorVideos.length})
                    </button>
                  )}
                </div>

                {authorVideos.length === 0 ? (
                  <div className="bg-zinc-900/60 rounded-2xl p-6 text-center border border-zinc-800 text-zinc-200 text-xs">
                    {t("profile.noVideosYet", "No video reviews published yet.")}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {authorVideos.slice(0, 6).map((v) => {
                      const isCurrentActive = v.id === activeVideoId;
                      const displayViews = getDisplayViews(v);
                      const formattedViews = formatViewCount(displayViews);

                      return (
                        <div
                          key={v.id}
                          onClick={() => onSelectVideo(v.id)}
                          className={`relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900 cursor-pointer group transition-all transform active:scale-95 shadow-md ring-1 ring-zinc-800 ${
                            isCurrentActive
                              ? "ring-2 ring-white"
                              : "hover:opacity-90"
                          }`}
                        >
                          <CopoVideoThumbnail
                            video={v}
                            alt={v.placeName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none" />
                          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[9px] font-black text-white flex items-center gap-0.5 shadow-xs">
                            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                            <span>{v.rating ? v.rating.toFixed(1) : "5.0"}</span>
                          </div>
                          <div className="absolute bottom-1.5 left-1.5 right-1.5 flex flex-col justify-end gap-0.5 pointer-events-none">
                            <div className="text-[9px] text-zinc-100 font-bold drop-shadow-md leading-tight truncate">
                              {getDisplayUrlAsDomain(v)}
                            </div>
                            <div className="flex items-center gap-1 text-white text-[10px] font-black drop-shadow-md">
                              <Play className="w-2.5 h-2.5 fill-white" />
                              <span>{formattedViews}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: REVIEWS */}
          {activeTab === "reviews" && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-zinc-200 uppercase tracking-wider">
                  {t("profile.allVideoReviews", "All Video Reviews")} ({authorVideos.length})
                </h3>
              </div>

              {authorVideos.length === 0 ? (
                <div className="bg-zinc-900/60 rounded-2xl p-8 text-center border border-zinc-800 text-zinc-200 text-xs">
                  {t("profile.noVideosYet", "No video reviews published yet.")}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {authorVideos.map((v) => {
                    const isCurrentActive = v.id === activeVideoId;
                    const displayViews = getDisplayViews(v);
                    const formattedViews = formatViewCount(displayViews);

                    return (
                      <div
                        key={v.id}
                        onClick={() => onSelectVideo(v.id)}
                        className={`relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900 cursor-pointer group transition-all transform active:scale-95 shadow-md ring-1 ring-zinc-800 ${
                          isCurrentActive
                            ? "ring-2 ring-white"
                            : "hover:opacity-90"
                        }`}
                      >
                        <CopoVideoThumbnail
                          video={v}
                          alt={v.placeName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none" />
                        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[9px] font-black text-white flex items-center gap-0.5 shadow-xs">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          <span>{v.rating ? v.rating.toFixed(1) : "5.0"}</span>
                        </div>
                        {isOwner && onDeleteVideo && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setVideoToDeleteInDrawer(v);
                            }}
                            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 hover:bg-red-600/90 text-zinc-200 hover:text-white backdrop-blur-xs transition-colors z-10 cursor-pointer shadow-xs"
                            title={t("feed.deleteVideo", "Delete video review")}
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                        <div className="absolute bottom-1.5 left-1.5 right-1.5 flex flex-col justify-end gap-0.5 pointer-events-none">
                          <div className="text-[9px] text-zinc-100 font-bold drop-shadow-md leading-tight truncate">
                            {getDisplayUrlAsDomain(v)}
                          </div>
                          <div className="flex items-center gap-1 text-white text-[10px] font-black drop-shadow-md">
                            <Play className="w-2.5 h-2.5 fill-white" />
                            <span>{formattedViews}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: ABOUT */}
          {activeTab === "about" && (
            <div className="p-5 space-y-5">
              <div>
                <h3 className="text-xs font-black text-zinc-200 uppercase tracking-wider mb-2">
                  {t("profile.reviewerBio", "Reviewer Biography")}
                </h3>
                <p className="text-zinc-200 text-sm leading-relaxed">
                  {displayBio}
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-800 space-y-3">
                <h3 className="text-xs font-black text-zinc-200 uppercase tracking-wider">
                  {t("profile.communityStats", "Community Stats")}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800">
                    <span className="text-[10px] font-bold text-zinc-200 uppercase block mb-1">{t("profile.followers", "Followers")}</span>
                    <span className="text-base font-black text-white">{(author.followersCount || 0) + (author.isFollowed ? 1 : 0)}</span>
                  </div>
                  <div className="bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800">
                    <span className="text-[10px] font-bold text-zinc-200 uppercase block mb-1">{t("profile.totalLikes", "Total Likes")}</span>
                    <span className="text-base font-black text-white">{totalLikes}</span>
                  </div>
                  <div className="bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800">
                    <span className="text-[10px] font-bold text-zinc-200 uppercase block mb-1">{t("profile.totalVideos", "Total Videos")}</span>
                    <span className="text-base font-black text-white">{authorVideos.length}</span>
                  </div>
                  <div className="bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800">
                    <span className="text-[10px] font-bold text-zinc-200 uppercase block mb-1">{t("profile.avgRatingGiven", "Avg Rating Given")}</span>
                    <span className="text-base font-black text-white">{avgRating} ⭐</span>
                  </div>
                </div>
              </div>

              {displayLocation && (
                <div className="pt-4 border-t border-zinc-800 space-y-1">
                  <h3 className="text-xs font-black text-zinc-200 uppercase tracking-wider mb-1">
                    {t("common.location", "Location")}
                  </h3>
                  <p className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-zinc-200" />
                    <span>{displayLocation}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Delete Account / Profile Confirmation Modal */}
      {isDeleteAccountModalOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsDeleteAccountModalOpen(false)}
        >
          <div
            className="bg-zinc-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-800 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-200 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-white">{t("profile.deleteAccountTitle", "Delete Profile & Account?")}</h3>
              <p className="text-xs text-zinc-200 leading-relaxed">
                {t("profile.deleteAccountDesc", "This will permanently delete your Yoouz profile, saved places, and reviewer account. This action cannot be undone.")}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteAccountModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-xs font-bold text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsDeleteAccountModalOpen(false);
                  if (onDeleteProfile) {
                    await onDeleteProfile();
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer border border-zinc-700"
              >
                {t("profile.deleteAccount", "Delete Account")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-zinc-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-800 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-white">{t("profile.editProfile", "Edit Profile")}</h3>
                <p className="text-[11px] text-zinc-200 font-medium">{t("profile.updateProfileDesc", "Update your public profile details")}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-zinc-200 hover:text-white hover:bg-zinc-800 p-1.5 rounded-full transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Profile Photo Uploader */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-24 h-24 rounded-[20px] overflow-hidden border-2 border-zinc-700 bg-zinc-900 shadow-md relative flex items-center justify-center p-1.5 ring-1 ring-white/10">
                    {editAvatar || (currentUser?.avatar && !currentUser.avatar.includes("/api/avatar") && !currentUser.avatar.startsWith("data:image/svg+xml")) ? (
                      <img
                        src={editAvatar || currentUser?.avatar}
                        alt="Profile avatar preview"
                        className="w-full h-full object-cover rounded-[14px] group-hover:scale-105 transition-transform duration-200"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div
                        className="w-full h-full rounded-[14px] flex items-center justify-center shadow-inner select-none"
                        style={{ backgroundColor: getAvatarColor(editName || currentUser?.name || "User").bg }}
                      >
                        <span className="font-black text-3xl text-white drop-shadow-md font-sans">
                          {getFirstLetter(editName || currentUser?.name || "User")}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white rounded-[20px]">
                      <Camera className="w-6 h-6" />
                    </div>
                  </div>
                  <button type="button" className="absolute -bottom-1 -right-1 p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full shadow-lg transition-colors cursor-pointer border border-zinc-700"><Camera className="w-3.5 h-3.5" /></button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-zinc-200">{t("profile.profilePicture", "Profile Picture")}</span>
                  <p className="text-[10px] text-zinc-200">{t("profile.uploadCustomPhoto", "Click to upload a custom JPG or PNG")}</p>
                </div>
                {avatarError && <p className="text-xs text-zinc-200 font-semibold">{avatarError}</p>}
              </div>

              {/* Banner Photo Uploader */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative group cursor-pointer w-full" onClick={() => bannerInputRef.current?.click()}>
                  <div className="w-full h-32 rounded-2xl overflow-hidden border-2 border-zinc-700 shadow-md relative bg-zinc-950">
                    {editBanner || currentUser?.banner ? (
                      <img src={editBanner || currentUser?.banner} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-zinc-900" />
                    )}
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Camera className="w-6 h-6" />
                    </div>
                  </div>
                  <button type="button" className="absolute bottom-2 right-2 p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full shadow-lg transition-colors cursor-pointer border border-zinc-700"><Camera className="w-3.5 h-3.5" /></button>
                  <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={handleBannerChange} />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-zinc-200">{t("profile.coverBanner", "Cover Banner")}</span>
                  <p className="text-[10px] text-zinc-200">{t("profile.uploadCustomBanner", "Click to upload a custom JPG or PNG")}</p>
                </div>
                {bannerError && <p className="text-xs text-zinc-200 font-semibold">{bannerError}</p>}
              </div>
              {/* Name Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-200">{t("profile.displayName", "Display Name")}</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value.slice(0, 50))}
                  placeholder="Your Name"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500 transition-all placeholder:text-zinc-400"
                />
              </div>

              {/* Bio Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-200">{t("profile.bio", "Bio")}</label>
                  <span className="text-[10px] font-bold text-zinc-200">{editBio.length} / 160</span>
                </div>
                <textarea 
                  value={editBio} 
                  onChange={(e) => setEditBio(e.target.value.slice(0, 160))} 
                  rows={3} 
                  placeholder={t("profile.bioPlaceholder", "Introduce yourself to other reviewers! What are your favorite places, foods, or hobbies?")}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500 transition-all placeholder:text-zinc-400" 
                />
              </div>

              {/* Structured Location Fields */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-200">{t("common.location", "Location")}</label>
                
                <CountrySelector 
                  value={editCountry} 
                  onChange={(country) => {
                    setEditCountry(country);
                    setEditCity("");
                    setEditState("");
                  }} />

                {editCountry && (() => {
                  const selectedCountryObj = Country.getAllCountries().find(c => c.name === editCountry);
                  const isoCode = selectedCountryObj?.isoCode || "";
                  
                  const statesObj = State.getStatesOfCountry(isoCode);
                  const hasStates = statesObj.length > 0;
                  const stateOptions = statesObj.map(s => s.name);
                  const stateLabel = t("profile.regionProvince", "Region / Province");
                  
                  let cityOptions: string[] = [];
                  if (editState) {
                    const selectedState = statesObj.find(s => s.name === editState);
                    if (selectedState) {
                       const stateCities = City.getCitiesOfState(isoCode, selectedState.isoCode).map(c => c.name);
                       cityOptions = stateCities.length > 0 ? stateCities : (City.getCitiesOfCountry(isoCode)?.map(c => c.name) || []);
                    } else {
                       cityOptions = City.getCitiesOfCountry(isoCode)?.map(c => c.name) || [];
                    }
                  } else {
                    cityOptions = City.getCitiesOfCountry(isoCode)?.map(c => c.name) || [];
                  }
                  const uniqueCityOptions = Array.from(new Set(cityOptions));

                  return (
                    <div className="grid grid-cols-2 gap-3 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                      {hasStates ? (
                        <>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-wide pl-1 block">{stateLabel}</span>
                            <SearchableComboSelector
                              value={editState}
                              onChange={(val) => {
                                setEditState(val);
                                setEditCity(""); // Reset city when region changes
                              }}
                              options={stateOptions}
                              placeholder={stateLabel}
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-wide pl-1 block">{t("profile.city", "City")}</span>
                            <SearchableComboSelector
                              value={editCity}
                              onChange={setEditCity}
                              options={uniqueCityOptions}
                              placeholder={t("profile.selectCity", "Select City")}
                            />
                          </div>
                        </>
                      ) : (
                        <div className="col-span-2 space-y-1">
                          <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-wide pl-1 block">{t("profile.city", "City")}</span>
                          <SearchableComboSelector
                            value={editCity}
                            onChange={setEditCity}
                            options={uniqueCityOptions}
                            placeholder={t("profile.selectCity", "Select City")}
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* App Language & Localization Option */}
              <div className="pt-2 border-t border-zinc-800 space-y-1.5">
                <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-wide pl-1 block">
                  {t("profile.languageRegion", "Language & Region")}
                </span>
                <button
                  type="button"
                  onClick={() => setIsLangModalOpen(true)}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-zinc-200 group-hover:text-white" />
                    <div>
                      <p className="text-xs font-bold text-zinc-200 group-hover:text-white">{t("profile.appLanguage", "App Language")}</p>
                      <p className="text-[11px] text-zinc-200">{currentLanguageMeta.flag} {currentLanguageMeta.nativeName} ({currentLanguageMeta.name})</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded bg-zinc-800 text-zinc-200 font-mono uppercase border border-zinc-700">
                    {currentLanguageMeta.code}
                  </span>
                </button>
              </div>

              {/* Actions & Buttons */}
              <div className="flex gap-3 pt-3 border-t border-zinc-800">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 rounded-2xl border border-zinc-800 text-sm font-bold text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer">{t("common.cancel", "Cancel")}</button>
                <button type="submit" className="flex-1 py-3 rounded-2xl bg-white text-zinc-950 text-sm font-bold hover:bg-zinc-200 transition-colors cursor-pointer">{t("common.save", "Save Changes")}</button>
              </div>

              {/* Account Management & Danger Zone */}
              {onDeleteProfile && (
                <div className="pt-3 border-t border-zinc-800 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-200 block">
                    {t("profile.accountManagement", "Account Management")}
                  </span>
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                    <div className="space-y-0.5 pr-2">
                      <p className="text-xs font-bold text-zinc-200">{t("profile.deleteAccountTitle", "Delete Profile & Account")}</p>
                      <p className="text-[11px] text-zinc-200 leading-snug">
                        {t("profile.deleteAccountDesc", "Permanently remove your profile, videos, and review data.")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditModalOpen(false);
                        setIsDeleteAccountModalOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 hover:bg-zinc-800 hover:text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs"
                    >
                      {t("common.delete", "Delete")}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      <CopoShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareUrl={`${window.location.origin}/@${((safeCreator as any).handle || author.handle || author.name || "user").replace(/^@+/, "").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "").replace(/-+/g, "-") || "user"}`}
        title={displayName}
        subtitle={t("profile.reviewerProfile", "Reviewer Profile")}
        avatarUrl={effectiveAvatar}
        bannerUrl={effectiveBanner}
      />

      {/* Video Delete Confirmation Modal */}
      {videoToDeleteInDrawer && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={(e) => e.stopPropagation()}>
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-white tracking-tight">{t("feed.deleteVideoTitle", "Delete Video Review?")}</h3>
              <p className="text-xs text-zinc-200 leading-relaxed">
                {t("feed.deleteVideoConfirm", "This will permanently delete your review for")} <span className="text-zinc-200 font-semibold">{videoToDeleteInDrawer.placeName || "this place"}</span> {t("feed.deleteVideoGlobal", "globally from all feeds, databases, and storage.")}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVideoToDeleteInDrawer(null)}
                className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-sm transition-colors cursor-pointer"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  const vidId = videoToDeleteInDrawer.id;
                  setVideoToDeleteInDrawer(null);
                  if (vidId && onDeleteVideo) {
                    onDeleteVideo(vidId);
                  }
                }}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-lg shadow-red-600/30 cursor-pointer"
              >
                {t("common.delete", "Delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Language Selector Modal */}
      <LanguageSelectorModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
      />
    </>
  );
};
