import React, { useState, useEffect, useRef } from "react";
import {
  X,
  CheckCircle,
  Star,
  Share2,
  UserPlus,
  UserCheck,
  ShieldCheck,
  MessageSquare,
  Camera,
  Edit3,
  Trash2,
  MoreVertical,
  Eye,
  AtSign,
  Check,
  Loader2,
  ThumbsUp,
  MapPin,
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Bell,
  Building2,
  ExternalLink,
  Flag,
  ShieldAlert,
  Shield,
  CheckCircle2,
  EyeOff,
  Users,
  Search,
  RefreshCw,
  ChevronRight,
  UserMinus,
  User,
  Calendar,
  KeyRound
} from "lucide-react";
import { registerFaceIdPasskey, restoreAccountWithPasskey, isDesktopPasskeyViewport } from "../lib/passkeyAuth";
import { VideoAuthor, VideoReview, UserProfile } from "../types";
import { isAuthorMatch, getDisplayUrlAsDomain, getDisplayViews, formatViewCount, KNOWN_COMMUNITY_USERS, getSafeAvatarUrl, resolveSafeAuthor, getPlaceSlug, normalizeLocationString, getReviewTime, formatCityCountry, extractCleanDomain, formatBusinessName } from "../utils/placeUtils";
import { resolveVideoPosterUrl } from "../utils/videoUtils";
import { getProxiedImageUrl } from "../utils/logoUtils";
import { preloadImage } from "../utils/preloadUtils";
import { CopoVideoThumbnail } from "./CopoVideoThumbnail";
import { CopoShareModal } from "./CopoShareModal";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { getRoundedRating } from "./CopoStarRating";
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
  onDeactivateProfile?: () => Promise<void>;
  onDeleteProfile?: () => Promise<void>;
  isSaved?: boolean;
  onToggleSaveCreator?: (author: VideoAuthor) => void;
  onOpenNotificationSettings?: () => void;
  onOpenPlace?: (placeId: string) => void;
  onOpenCreator?: (author: VideoAuthor) => void;
  places?: any[];
  onToggleFollowPlace?: (placeId: string) => void;
  onOpenPasskeyModal?: (mode: "save" | "restore") => void;
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
  onDeactivateProfile,
  onDeleteProfile,
  isSaved: propIsSaved,
  onToggleSaveCreator,
  onOpenNotificationSettings,
  onOpenPlace,
  onOpenCreator,
  places = [],
  onToggleFollowPlace,
  onOpenPasskeyModal
}) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const { t, currentLanguageMeta } = useLanguage();
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isDeletionRequestModalOpen, setIsDeletionRequestModalOpen] = useState(false);
  const [deletionReason, setDeletionReason] = useState("I no longer use this account");
  const [deletionNotes, setDeletionNotes] = useState("");
  const [isSubmittingDeletion, setIsSubmittingDeletion] = useState(false);
  const [deletionSuccessToast, setDeletionSuccessToast] = useState(false);
  const [videoToDeleteInDrawer, setVideoToDeleteInDrawer] = useState<VideoReview | null>(null);
  const [copiedNotification, setCopiedNotification] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "reviews" | "about">("overview");
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Inline handle claim / edit, mobile bio editor & biometric passkey state (zero-friction for U/XXXXXX accounts)
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "saved" | "error">("idle");
  const [usernameMessage, setUsernameMessage] = useState("");
  const [inlineBioInput, setInlineBioInput] = useState("");
  const [inlineBioStatus, setInlineBioStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [inlineBioMessage, setInlineBioMessage] = useState("");
  const [isLinkingAccount, setIsLinkingAccount] = useState(false);
  const [isRestoringPasskey, setIsRestoringPasskey] = useState(false);
  const [linkStatusMsg, setLinkStatusMsg] = useState<string | null>(null);

  // Auto-redirect if this author is a official business to maintain a single canonical Place page
  useEffect(() => {
    if (!author?.name || !onOpenPlace) return;
    const authorLower = (author.name || "").toLowerCase().trim();
    const associatedPlaceId =
      authorLower === "yoouz" || authorLower === "@yoouz" || authorLower === "yoouz.com"
        ? "yoouz.com"
        : authorLower === "legal 500" || authorLower === "legal500" || authorLower === "legal500.com"
        ? "legal500.com"
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

  const isGuestPreview = Boolean(author && (author.id === "guest_preview" || author.userId === "guest_preview"));
  const isOwner = Boolean(
    isGuestPreview || (author && currentUser && isAuthorMatch({ author: author } as any, currentUser))
  );

  const ensureOwnerAccountProvisioned = async (): Promise<{ id: string; name: string } | null> => {
    const existingId = currentUser?.id || (currentUser as any)?.uid;
    if (existingId && existingId !== "guest_preview") {
      return { id: existingId, name: currentUser?.name || existingId };
    }
    try {
      const res = await fetch("/api/auth/anonymous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.user) {
          setLiveUserProfile((prev) => ({ ...(prev || {}), ...data.user }));
          localStorage.setItem("copo_user_profile", JSON.stringify(data.user));
          localStorage.setItem("yoouz_current_user", JSON.stringify(data.user));
          window.dispatchEvent(new CustomEvent("copo-profile-updated", { detail: data.user }));
          return { id: data.user.id || data.user.uid, name: data.user.name };
        }
      }
    } catch {}
    return null;
  };

  useEffect(() => {
    if (isOwner && currentUser) {
      setEditName(currentUser.name || "");
      setEditBio(currentUser.bio || "");
      setInlineBioInput(currentUser.bio || "");
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

  // Live username availability check for owner's inline identity card
  useEffect(() => {
    if (!isOwner) return;
    const clean = usernameInput.trim().replace(/^@/, "");
    const currentClean = (currentUser?.name || "").trim().replace(/^@/, "");
    if (!clean || clean.toLowerCase() === currentClean.toLowerCase()) {
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
          `/api/user/check-username?username=${encodeURIComponent(clean)}&currentUserId=${encodeURIComponent(currentUser?.id || currentUser?.uid || "")}`
        );
        const data = await res.json();
        if (cancelled) return;
        if (data.available) {
          setUsernameStatus("available");
          setUsernameMessage(`@${data.normalized} is available`);
        } else {
          setUsernameStatus("taken");
          setUsernameMessage(data.error || "That username is already taken.");
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
  }, [usernameInput, isOwner, currentUser?.id, currentUser?.uid, currentUser?.name]);

  const handleSaveUsernameInline = async () => {
    if (!usernameInput.trim() || usernameStatus !== "available") return;
    setUsernameStatus("checking");
    const provisioned = await ensureOwnerAccountProvisioned();
    const uid = provisioned?.id;
    if (!uid) {
      setUsernameStatus("error");
      setUsernameMessage("Could not initialize account");
      return;
    }
    try {
      const res = await fetch("/api/user/update-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid, username: usernameInput.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        setUsernameStatus("taken");
        setUsernameMessage(data.error || "Could not update username");
        return;
      }
      if (data.user) {
        setLiveUserProfile((prev) => ({ ...(prev || {}), ...data.user }));
        localStorage.setItem("copo_user_profile", JSON.stringify(data.user));
        localStorage.setItem("yoouz_current_user", JSON.stringify(data.user));
        window.dispatchEvent(new CustomEvent("copo-profile-updated", { detail: data.user }));
        onUpdateProfile?.({ name: data.user.name, handle: data.user.handle } as any);
      }
      setUsernameStatus("saved");
      setUsernameMessage(`Handle updated to ${data.user?.name || usernameInput.trim()}`);
      triggerHaptic("success");
    } catch {
      setUsernameStatus("error");
      setUsernameMessage("Failed to save username");
    }
  };

  const handleSaveBioInline = async () => {
    if (inlineBioStatus === "saving") return;
    const cleanBio = inlineBioInput.trim().slice(0, 240);
    setInlineBioStatus("saving");
    setInlineBioMessage("");
    const provisioned = await ensureOwnerAccountProvisioned();
    const uid = provisioned?.id;
    if (!uid) {
      setInlineBioStatus("error");
      setInlineBioMessage("Could not initialize account");
      return;
    }
    try {
      const res = await fetch("/api/user/update-bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid, bio: cleanBio })
      });
      const data = await res.json();
      if (!res.ok) {
        setInlineBioStatus("error");
        setInlineBioMessage(data.error || "Could not save bio");
        return;
      }
      const updatedUser = data.user || { ...(currentUser || {}), bio: cleanBio };
      setEditBio(cleanBio);
      setLiveUserProfile((prev) => ({ ...(prev || {}), ...updatedUser, bio: cleanBio }));
      localStorage.setItem("copo_user_profile", JSON.stringify(updatedUser));
      localStorage.setItem("yoouz_current_user", JSON.stringify(updatedUser));
      window.dispatchEvent(new CustomEvent("copo-profile-updated", { detail: updatedUser }));
      onUpdateProfile?.({ bio: cleanBio } as any);
      setInlineBioStatus("saved");
      setInlineBioMessage("Bio saved to your profile");
      triggerHaptic("success");
      setTimeout(() => {
        setInlineBioStatus("idle");
      }, 2500);
    } catch {
      setInlineBioStatus("error");
      setInlineBioMessage("Network error while saving bio");
    }
  };

  // Live-sync open profile drawer when desktop Passkey QR handoff completes
  useEffect(() => {
    if (!isOwner) return;
    const handleProfileUpdated = (e: Event) => {
      const updated = (e as CustomEvent)?.detail;
      if (updated && typeof updated === "object") {
        setLiveUserProfile((prev) => ({ ...(prev || {}), ...updated }));
        if (typeof updated.bio === "string") {
          setInlineBioInput(updated.bio);
          setEditBio(updated.bio);
        }
        if (updated.passkeyProtected) {
          setLinkStatusMsg("Passkey saved! Your account is now backed up.");
        }
      }
    };
    window.addEventListener("copo-profile-updated", handleProfileUpdated as EventListener);
    return () => window.removeEventListener("copo-profile-updated", handleProfileUpdated as EventListener);
  }, [isOwner]);

  const handleRegisterPasskeyInline = async () => {
    if (isDesktopPasskeyViewport() && onOpenPasskeyModal) {
      onOpenPasskeyModal("save");
      return;
    }
    if (isLinkingAccount) return;
    setIsLinkingAccount(true);
    setLinkStatusMsg(null);
    const provisioned = await ensureOwnerAccountProvisioned();
    const uid = provisioned?.id;
    if (!uid) {
      setIsLinkingAccount(false);
      setLinkStatusMsg("Could not initialize account.");
      return;
    }
    try {
      const result = await registerFaceIdPasskey({
        id: uid,
        name: provisioned?.name || currentUser?.name || uid
      });
      if (result.success && result.user) {
        setLiveUserProfile((prev) => ({ ...(prev || {}), ...result.user }));
        onUpdateProfile?.({
          name: result.user.name,
          avatar: result.user.avatar,
          bio: result.user.bio
        } as any);
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

  const handleRestorePasskeyInline = async () => {
    if (isDesktopPasskeyViewport() && onOpenPasskeyModal) {
      onOpenPasskeyModal("restore");
      return;
    }
    if (isRestoringPasskey) return;
    const uid = currentUser?.id || (currentUser as any)?.uid || "";
    setIsRestoringPasskey(true);
    setLinkStatusMsg(null);
    try {
      const result = await restoreAccountWithPasskey(uid);
      if (result.success && result.user) {
        setLiveUserProfile((prev) => ({ ...(prev || {}), ...result.user }));
        setInlineBioInput(result.user.bio || "");
        setEditBio(result.user.bio || "");
        onUpdateProfile?.({
          name: result.user.name,
          avatar: result.user.avatar,
          bio: result.user.bio
        } as any);
        setLinkStatusMsg(`Restored account ${result.user.name}.`);
        triggerHaptic("success");
      } else if (!result.cancelled) {
        setLinkStatusMsg(result.error || "No passkey found on this device.");
      }
    } catch {
      setLinkStatusMsg("Could not restore account.");
    } finally {
      setIsRestoringPasskey(false);
    }
  };

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
  const [liveUserProfile, setLiveUserProfile] = useState<{ avatar?: string; banner?: string; bio?: string; name?: string; location?: string; city?: string; state?: string; country?: string } | null>(() => {
    return resolveTargetProfile(author, isOwner, currentUser, allUsers, allVideos);
  });

  const isPasskeyProtected = Boolean(
    (isOwner && (currentUser as any)?.passkeyProtected) ||
    (liveUserProfile as any)?.passkeyProtected ||
    (author as any)?.passkeyProtected
  );

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
          setLiveUserProfile((prev) => {
            const next = { ...(prev || {}), ...matched };
            // Never downgrade or flap location to an incomplete prefix string for the same location
            if (prev?.location && (!matched.location || (matched.location && prev.location.toLowerCase().startsWith(matched.location.toLowerCase()) && prev.location.length > matched.location.length))) {
              next.location = prev.location;
            }
            return next;
          });
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
        setLiveUserProfile((prev) => {
          const next = { ...(prev || {}), ...p };
          if (prev?.location && (!p.location || (p.location && prev.location.toLowerCase().startsWith(p.location.toLowerCase()) && prev.location.length > p.location.length))) {
            next.location = prev.location;
          }
          return next;
        });
      }
    };
    window.addEventListener("copo-profile-updated", handleProfileUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener("copo-profile-updated", handleProfileUpdate);
    };
  }, [author?.name, allUsers, isOwner, currentUser, allVideos]);

  if (!author) return null;

  // Filter videos belonging to this author, sorted latest-first
  const authorVideos = allVideos
    .filter((v) => isAuthorMatch(v, author))
    .sort((a, b) => getReviewTime(b) - getReviewTime(a));

  // Check if any video by this author contains a genuine Google / high-res avatar
  const videoWithAuthenticAvatar = authorVideos.find((v) => {
    const a = v.author?.avatar;
    return (
      a &&
      typeof a === "string" &&
      (a.includes("googleusercontent.com") || a.startsWith("data:image/") || (!a.includes("ui-avatars") && !a.includes("dicebear") && !a.includes("unsplash") && !a.includes("/api/videos/") && !a.includes(".mp4") && !a.includes("rev-")))
    );
  });

  const isVerifiedReviewer = false;
  const totalLikes = authorVideos.reduce((acc, v) => acc + (typeof v.likes === 'number' ? v.likes : (v.likesCount || 0)), 0);
  const avgRating =
    authorVideos.length > 0
      ? (authorVideos.reduce((acc, v) => acc + v.rating, 0) / authorVideos.length).toFixed(1)
      : "—";

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

  const rawDisplayName = isOwner && currentUser?.name
    ? currentUser.name
    : (liveUserProfile?.name || safeCreator.name || author.name || "Reviewer");
  const displayName = rawDisplayName.includes("@") ? rawDisplayName.split("@")[0] : rawDisplayName;

  const rawLocation = isOwner && currentUser?.location
    ? currentUser.location
    : (liveUserProfile?.location || safeCreator.location || author.location || (KNOWN_COMMUNITY_USERS[(author.name || "").replace(/^@+/, "").trim().toLowerCase()]?.location));

  const displayLocation = normalizeLocationString(
    rawLocation,
    isOwner ? currentUser?.city : (liveUserProfile?.city || safeCreator.city || author.city),
    isOwner ? (currentUser as any)?.state : (liveUserProfile?.state || (safeCreator as any)?.state || (author as any)?.state),
    isOwner ? currentUser?.country : (liveUserProfile?.country || safeCreator.country || author.country)
  );

  const displayBio = (isOwner && currentUser?.bio !== undefined ? currentUser.bio.trim() : "")
    || (liveUserProfile?.bio && liveUserProfile.bio.trim() ? liveUserProfile.bio : "")
    || (safeCreator?.bio && safeCreator.bio.trim() ? safeCreator.bio : "")
    || (author?.bio && author.bio.trim() ? author.bio : "");

  // Eagerly prewarm and GPU-decode user banner and avatar
  useEffect(() => {
    if (effectiveBanner) preloadImage(getProxiedImageUrl(effectiveBanner), "high");
    if (effectiveAvatar) preloadImage(getProxiedImageUrl(effectiveAvatar), "high");
  }, [effectiveBanner, effectiveAvatar]);

  // Check if profile is business vs consumer user
  const userRole = (isOwner && (currentUser as any)?.role) || (liveUserProfile as any)?.role || (author as any)?.role || 'user';
  const isBusinessProfile = userRole === 'business' || (author as any)?.type === 'place' || (liveUserProfile as any)?.type === 'place';

  // Extract or calculate member since date
  const KNOWN_USER_JOIN_DATES: Record<string, string> = {
    "ben": "2025-09-01",
    "steven": "2026-10-01"
  };
  const rawCreatedAt = (isOwner && (currentUser as any)?.createdAt) || (liveUserProfile as any)?.createdAt || (author as any)?.createdAt;
  const memberSinceStr = (() => {
    let dateObj = new Date();
    
    // Check for hardcoded fallback first
    const authorName = (author?.name || "").toLowerCase().trim();
    if (!rawCreatedAt && KNOWN_USER_JOIN_DATES[authorName]) {
      dateObj = new Date(KNOWN_USER_JOIN_DATES[authorName]);
    } else if (rawCreatedAt) {
      const parsed = new Date(rawCreatedAt);
      if (!isNaN(parsed.getTime())) {
        dateObj = parsed;
      } else if (typeof rawCreatedAt === 'number') {
        dateObj = new Date(rawCreatedAt);
      }
    }
    
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
  })();

  // Real-time follow state calculation
  const authorNameKey = (author?.name || "").toLowerCase().trim();
  const authorHandleKey = (author?.handle || author?.name || "").replace(/^@+/, "").toLowerCase().trim();

  const isFollowed = currentUser?.followedAuthors
    ? currentUser.followedAuthors.some((h) => {
        const cleanH = h.replace(/^@+/, "").toLowerCase().trim();
        return cleanH === authorNameKey || cleanH === authorHandleKey;
      })
    : Boolean(author?.isFollowed);

  // Live user matching in allUsers registry
  const liveUserFromRegistry = (allUsers || []).find((u) => {
    const uName = (u.name || "").toLowerCase().trim();
    const uHandle = (u.handle || "").replace(/^@+/, "").toLowerCase().trim();
    const uEmail = (u.email || "").toLowerCase().trim();
    return (
      (authorNameKey && (uName === authorNameKey || uHandle === authorNameKey || uEmail === authorNameKey)) ||
      (authorHandleKey && (uName === authorHandleKey || uHandle === authorHandleKey || uEmail === authorHandleKey))
    );
  });

  const liveFollowersList = Array.isArray(liveUserFromRegistry?.followers)
    ? liveUserFromRegistry.followers
    : (Array.isArray((author as any)?.followers) ? (author as any).followers : []);

  const liveFollowingList = Array.isArray(liveUserFromRegistry?.followedAuthors)
    ? liveUserFromRegistry.followedAuthors
    : (Array.isArray((author as any)?.followedAuthors) ? (author as any).followedAuthors : []);

  // Social Network Modal State (Followers & Following)
  const [socialModalTab, setSocialModalOpen] = useState<"followers" | "following" | null>(null);
  const [socialData, setSocialData] = useState<{ followers: any[]; following: any[]; followersCount: number; followingCount: number } | null>(null);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [socialSearch, setSocialSearch] = useState("");
  const [hoveredUnfollowModalUser, setHoveredUnfollowModalUser] = useState<string | null>(null);
  const [followingFilter, setFollowingFilter] = useState<"all" | "reviewers" | "businesses">("all");
  const [hoveredUnfollowPlace, setHoveredUnfollowPlace] = useState<string | null>(null);

  const isInvalidName = (name?: string) => {
    if (!name) return true;
    const s = String(name).toLowerCase().trim().replace(/^@+/, "");
    return (
      s.includes("yoouz") ||
      s.includes("member") ||
      s.includes("reviewer") ||
      s.includes("registered user") ||
      s.includes("david") ||
      s === "user" ||
      s === "community member" ||
      s === "community reviewer"
    );
  };

  const rawFollowers = socialData?.followers || liveFollowersList;
  const filteredFollowers = rawFollowers.filter((u: any) => {
    if (!u) return false;
    const nameStr = typeof u === 'string' ? u : (u.name || u.id || u.handle || "");
    return Boolean(nameStr) && !isInvalidName(nameStr);
  });

  const rawFollowing = socialData?.following || liveFollowingList;
  const filteredFollowing = rawFollowing.filter((u: any) => {
    if (!u) return false;
    const nameStr = typeof u === 'string' ? u : (u.name || u.id || u.handle || "");
    return Boolean(nameStr) && !isInvalidName(nameStr);
  });

  const effectiveFollowersCount = Math.max(
    filteredFollowers.length,
    typeof socialData?.followersCount === 'number' ? socialData.followersCount : 0,
    typeof liveUserFromRegistry?.followersCount === 'number' ? liveUserFromRegistry.followersCount : (Array.isArray(liveUserFromRegistry?.followers) ? liveUserFromRegistry.followers.length : 0),
    Array.isArray((author as any)?.followers) ? (author as any).followers.length : 0
  );

  const effectiveFollowingCount = Math.max(
    filteredFollowing.length,
    typeof socialData?.followingCount === 'number' ? socialData.followingCount : 0,
    typeof liveUserFromRegistry?.followingCount === 'number' ? liveUserFromRegistry.followingCount : (Array.isArray(liveUserFromRegistry?.followedAuthors) ? liveUserFromRegistry.followedAuthors.length : 0),
    Array.isArray((author as any)?.followedAuthors) ? (author as any).followedAuthors.length : 0
  );

  const targetHandle = safeCreator?.handle?.replace(/^@+/, '') || safeCreator?.name || author?.handle?.replace(/^@+/, '') || author?.name || author?.id || "";

  const fetchSocialNetwork = async () => {
    if (!targetHandle) return;
    setIsSocialLoading(true);
    try {
      const res = await fetch(`/api/users/social-network?handle=${encodeURIComponent(targetHandle)}`);
      const data = await res.json();
      if (data && data.success) {
        setSocialData(data);
      }
    } catch (e) {
      console.warn("Error loading social network:", e);
    } finally {
      setIsSocialLoading(false);
    }
  };

  useEffect(() => {
    if (author && targetHandle) {
      fetchSocialNetwork();
    }
  }, [author?.name, author?.id, targetHandle]);

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
    let finalBanner = editBanner || currentUser?.banner;

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

    // If user selected a new banner (base64), upload it directly to Bunny CDN storage
    if (editBanner && editBanner.startsWith('data:image/')) {
      setIsSavingProfile(true);
      try {
        const uploadBannerRes = await fetch('/api/user/upload-banner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: editBanner,
            type: 'banner',
            userId: `${currentUser?.email || currentUser?.name || 'user'}_banner`
          })
        });
        const bannerData = await uploadBannerRes.json();
        if (bannerData.bannerUrl || bannerData.url) {
          finalBanner = bannerData.bannerUrl || bannerData.url;
        }
      } catch (bannerErr) {
        console.warn("Banner upload to Bunny CDN fallback:", bannerErr);
      } finally {
        setIsSavingProfile(false);
      }
    }

    let activeUid = currentUser?.uid || currentUser?.id;
    let activeName = currentUser?.name;
    if (!activeUid) {
      const provisioned = await ensureOwnerAccountProvisioned();
      if (provisioned) {
        activeUid = provisioned.id;
        activeName = provisioned.name;
      }
    }

    const finalCleanName = editName.trim() || activeName || "Reviewer";
    const updatedProfile = {
      name: finalCleanName,
      handle: finalCleanName,
      bio: editBio.trim(),
      avatar: finalAvatar,
      banner: finalBanner,
      location: combinedLocation,
      city: editCity.trim(),
      state: editState.trim(),
      country: editCountry.trim()
    };

    setLiveUserProfile((prev) => ({
      ...(prev || {}),
      ...updatedProfile
    }));

    // Instantly save to BunnyDB live for all users across the platform
    const canonicalEmail = currentUser?.email && currentUser.email.includes("@") ? currentUser.email.trim().toLowerCase() : "";
    const userDocId = canonicalEmail || activeUid || "user_me";
    const savePayload = {
      ...currentUser,
      ...updatedProfile,
      uid: userDocId,
      id: userDocId,
      email: canonicalEmail || currentUser?.email || "",
      updatedAt: new Date().toISOString()
    };

    fetch('/api/users/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(savePayload)
    }).catch((e) => console.warn("BunnyDB /api/users/update-profile notice:", e));

    fetch('/api/user/update-bio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio: editBio.trim() })
    }).catch((e) => console.warn("BunnyDB /api/user/update-bio notice:", e));

    fetch(`/api/nosql/users/${encodeURIComponent(userDocId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: savePayload })
    }).catch((e) => console.warn("BunnyDB /api/nosql/users notice:", e));

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
        tabIndex={0}
        style={dragOffsetY > 0 ? { transform: `translateY(${dragOffsetY}px)`, transition: 'none' } : undefined}
        className="fixed inset-x-0 bottom-0 md:bottom-auto md:inset-auto md:relative z-50 md:z-20 w-full max-w-full md:w-[360px] lg:w-[420px] h-[100dvh] md:h-full max-h-[100dvh] bg-[#050506] text-white flex flex-col shadow-none md:shadow-2xl border-r border-white/[0.08] shrink-0 overflow-hidden overscroll-none outline-none animate-in slide-in-from-bottom md:slide-in-from-left duration-200 transition-transform"
        onWheel={(e) => {
          e.stopPropagation();
          if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
            contentRef.current.scrollTop += e.deltaY;
          }
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (contentRef.current) {
            if (e.key === 'ArrowDown') {
              contentRef.current.scrollTop += 60;
            } else if (e.key === 'ArrowUp') {
              contentRef.current.scrollTop -= 60;
            } else if (e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
              contentRef.current.scrollTop += 300;
            } else if (e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) {
              contentRef.current.scrollTop -= 300;
            }
          }
        }}
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
          className="relative h-36 sm:h-40 w-full shrink-0 flex items-center justify-center bg-[#050506] touch-pan-y"
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
            <div className="absolute inset-0 w-full h-full bg-[#0a0a0d] relative overflow-hidden flex items-center justify-center group">
              {(() => {
                const resolvedBanner = getProxiedImageUrl(effectiveBanner);
                const extRef = /^https?:\/\//i.test(resolvedBanner) ? "no-referrer" : undefined;
                return (
                  <>
                    <img
                      src={resolvedBanner}
                      alt=""
                      loading="eager"
                      decoding="sync"
                      fetchPriority="high"
                      className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-50 scale-125"
                      referrerPolicy={extRef}
                    />
                    <img
                      src={resolvedBanner}
                      alt="Banner"
                      loading="eager"
                      decoding="sync"
                      fetchPriority="high"
                      className="relative z-10 w-full h-full object-cover p-0"
                      referrerPolicy={extRef}
                    />
                  </>
                );
              })()}
              <div className="absolute inset-0 bg-[linear-gradient(to_top,#050506_0%,rgba(5,5,6,0.68)_38%,rgba(0,0,0,0.22)_100%)] z-20 pointer-events-none" />
            </div>
          ) : (
            <div className="absolute inset-0 w-full h-full bg-[#0a0a0e] overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.08),transparent_68%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(232,199,138,0.06),transparent_55%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,#050506_0%,rgba(5,5,6,0.55)_45%,transparent_100%)]" />
            </div>
          )}

          {/* Top Right Action Group - Settings menu for Owner & Visitor Actions for Guests */}
          <div className="absolute top-[calc(0.75rem+env(safe-area-inset-top,0px))] right-3 flex items-center gap-2 z-30">
            <button
              id="btn-creator-share-top"
              onClick={() => {
                triggerHaptic("light");
                handleShare();
              }}
              className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xl shadow-xl flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer border border-white/15"
              title={t("profile.shareProfile", "Share Profile")}
            >
              <Share2 className="w-4 h-4" />
            </button>

            <div className="relative" ref={settingsMenuRef}>
              <button
                id="btn-creator-profile-settings"
                onClick={() => setIsSettingsMenuOpen((prev) => !prev)}
                className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xl shadow-xl flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer border border-white/15"
                title={isOwner ? t("profile.accountSettings", "Account & Settings") : t("profile.moreOptions", "More Options")}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isSettingsMenuOpen && (
                <div className="absolute right-0 top-11 w-56 bg-[#0c0c0f]/96 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/[0.1] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {isOwner ? (
                    <>
                      <button
                        onClick={() => {
                          setIsSettingsMenuOpen(false);
                          setIsEditModalOpen(true);
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-medium text-zinc-200 hover:bg-white/[0.07] hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4 text-zinc-300" />
                        <span>{t("profile.editProfile", "Edit Profile")}</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsSettingsMenuOpen(false);
                          handleShare();
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-medium text-zinc-200 hover:bg-white/[0.07] hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Share2 className="w-4 h-4 text-zinc-300" />
                        <span>{t("profile.shareProfileLink", "Share Profile Link")}</span>
                      </button>

                      {onOpenNotificationSettings && (
                        <button
                          id="btn-creator-notification-settings"
                          onClick={() => {
                            setIsSettingsMenuOpen(false);
                            onOpenNotificationSettings();
                          }}
                          className="w-full px-4 py-2.5 text-left text-xs font-medium text-zinc-200 hover:bg-white/[0.07] hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <Bell className="w-4 h-4 text-zinc-300" />
                          <span>{t("profile.notificationPreferences", "Notification Preferences")}</span>
                        </button>
                      )}

                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setIsSettingsMenuOpen(false);
                          handleShare();
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-medium text-zinc-200 hover:bg-white/[0.07] hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Share2 className="w-4 h-4 text-zinc-300" />
                        <span>{t("profile.shareProfileLink", "Share Profile Link")}</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsSettingsMenuOpen(false);
                          handleToggleSaveCreator();
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-medium text-zinc-200 hover:bg-white/[0.07] hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        {isSaved ? (
                          <>
                            <BookmarkCheck className="w-4 h-4 text-[#E8C78A]" />
                            <span>{t("profile.savedReviewer", "Remove from Saved")}</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-4 h-4 text-zinc-300" />
                            <span>{t("profile.saveReviewer", "Save Reviewer")}</span>
                          </>
                        )}
                      </button>

                      {onOpenReport && (
                        <button
                          id="btn-report-creator-menu"
                          onClick={() => {
                            setIsSettingsMenuOpen(false);
                            triggerHaptic("medium");
                            if (author) onOpenReport(author);
                          }}
                          className="w-full px-4 py-2.5 text-left text-xs font-medium text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-white/[0.08]"
                        >
                          <Flag className="w-4 h-4 text-red-400" />
                          <span>{t("profile.reportReviewer", "Report or Block Reviewer")}</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {copiedNotification && (
            <div className="absolute top-14 right-3 bg-[#141418] text-white text-xs px-3 py-1.5 rounded-full shadow-lg z-40 animate-in fade-in border border-white/[0.12]">
              {copiedNotification}
            </div>
          )}

          {/* Overlapping Circular User Avatar (Clearly differentiates People = circle vs Brands = rounded square) */}
          <div className="absolute -bottom-9 left-5 w-[76px] h-[76px] sm:w-[84px] sm:h-[84px] rounded-full border-[4px] border-[#050506] bg-[#121216] shadow-[0_12px_32px_rgba(0,0,0,0.65)] flex items-center justify-center z-20 ring-1 ring-white/[0.14] overflow-hidden group">
            {!avatarImgError ? (() => {
              const creatorAvatarSrc = getSafeAvatarUrl(effectiveAvatar, displayName, author.handle);
              return (
                <img
                  src={creatorAvatarSrc}
                  alt={displayName}
                  loading="eager"
                  decoding="sync"
                  fetchPriority="high"
                  className="w-full h-full object-cover rounded-full [image-rendering:-webkit-optimize-contrast]"
                  referrerPolicy={/^https?:\/\//i.test(creatorAvatarSrc) ? "no-referrer" : undefined}
                  onError={() => setAvatarImgError(true)}
                />
              );
            })() : (
              <div
                className="w-full h-full rounded-full flex items-center justify-center shadow-inner select-none"
                style={{ backgroundColor: getAvatarColor(displayName || author.name || "User", author.handle).bg }}
              >
                <span className="font-bold text-3xl text-white drop-shadow-md font-sans">
                  {getFirstLetter(displayName || author.name || "User")}
                </span>
              </div>
            )}

            {isOwner && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
                title={t("profile.changePhoto", "Change Photo")}
              >
                <Camera className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Creator Details Header */}
        <div className="px-5 pt-11 sm:pt-12 pb-2 bg-[#050506]">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0 flex-1 pr-2">
              <h2 className="text-2xl font-semibold text-white tracking-[-0.03em] leading-tight [overflow-wrap:anywhere] inline-flex items-center gap-2 flex-wrap font-['Google_Sans',sans-serif]" dir="auto">
                <bdi dir="auto">{displayName || ""}</bdi>
                {isPasskeyProtected && (
                  <span title="Verified Reviewer (Passkey Protected)" className="inline-flex shrink-0">
                    <CheckCircle className="w-5 h-5 fill-white text-[#050506] shrink-0" />
                  </span>
                )}
                {isOwner && !isPasskeyProtected && (
                  <button
                    type="button"
                    onClick={handleRegisterPasskeyInline}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8C78A]/12 hover:bg-[#E8C78A]/20 border border-[#E8C78A]/30 text-[#E8C78A] text-[11px] font-semibold tracking-normal cursor-pointer transition-colors"
                    title="Save a passkey to back up your account"
                  >
                    <KeyRound className="w-3 h-3 text-[#E8C78A] shrink-0" />
                    <span>Save Passkey</span>
                  </button>
                )}
              </h2>
            </div>

            {/* Primary Action Button (Follow for other users) */}
            {!isOwner && (
              <button
                onClick={() => onToggleFollow(author.name)}
                className={`px-4 py-2 rounded-full font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                  isFollowed
                    ? "bg-white/[0.06] text-zinc-100 border-white/[0.12] hover:bg-white/[0.12]"
                    : "bg-white text-zinc-950 hover:bg-zinc-200 border-white shadow-[0_4px_16px_rgba(255,255,255,0.12)]"
                }`}
              >
                {isFollowed ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-zinc-200" />
                    <span>{t("common.following", "Following")}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{t("common.follow", "Follow")}</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="space-y-2">
            {/* Clean Stats Row */}
            <div className="flex items-center gap-3.5 text-sm flex-wrap text-zinc-300 tabular-nums">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-white text-[15px]">{authorVideos.length}</span>
                <span className="text-zinc-400 text-xs font-normal">
                  {authorVideos.length === 1 ? t("common.photoReview", "Photo Review") : t("common.photoReviews", "Photo Reviews")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => { setSocialModalOpen("followers"); fetchSocialNetwork(); }}
                className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition cursor-pointer group"
              >
                <span className="font-semibold text-white text-[15px] group-hover:underline">{effectiveFollowersCount}</span>
                <span className="text-zinc-400 text-xs font-normal group-hover:underline">{t("profile.followers", "Followers")}</span>
              </button>
              <button
                type="button"
                onClick={() => { setSocialModalOpen("following"); fetchSocialNetwork(); }}
                className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition cursor-pointer group"
              >
                <span className="font-semibold text-white text-[15px] group-hover:underline">{effectiveFollowingCount}</span>
                <span className="text-zinc-400 text-xs font-normal group-hover:underline">{t("profile.following", "Following")}</span>
              </button>
            </div>

            {/* Bio preview right inside the profile header so it's immediately visible on mobile */}
            {displayBio ? (
              <p className="text-xs text-zinc-300 leading-relaxed pt-1 break-words">
                {displayBio}
              </p>
            ) : null}

            {/* Premium Metadata Bar: Location & Joined Date */}
            {(displayLocation || (!isBusinessProfile && memberSinceStr)) && (
              <div className="flex items-center gap-3.5 text-xs text-zinc-400 font-normal flex-wrap pt-2 mt-1.5 border-t border-white/[0.06]">
                {displayLocation ? (
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="truncate">{displayLocation}</span>
                  </div>
                ) : null}

                {!isBusinessProfile && memberSinceStr ? (
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span>
                      {t("profile.memberSince", "Member since")} {memberSinceStr}
                    </span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Flagship Liquid-Glass Segmented Control: Overview | Reviews | About */}
        <div className="px-5 py-2.5 bg-[#050506] shrink-0">
          <div className="grid grid-cols-3 p-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => handleTabClick("overview")}
              className={`py-1.5 rounded-full text-xs transition-all cursor-pointer text-center ${
                activeTab === "overview"
                  ? "bg-white text-zinc-950 font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-white font-medium"
              }`}
            >
              {t("profile.overviewTab", "Overview")}
            </button>
            <button
              type="button"
              onClick={() => handleTabClick("reviews")}
              className={`py-1.5 rounded-full text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "reviews"
                  ? "bg-white text-zinc-950 font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-white font-medium"
              }`}
            >
              <span>{t("common.photoReviews", "Reviews")}</span>
              <span
                className={`text-[11px] tabular-nums ${
                  activeTab === "reviews" ? "text-zinc-600 font-semibold" : "text-zinc-500"
                }`}
              >
                {authorVideos.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleTabClick("about")}
              className={`py-1.5 rounded-full text-xs transition-all cursor-pointer text-center ${
                activeTab === "about"
                  ? "bg-white text-zinc-950 font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-white font-medium"
              }`}
            >
              {t("profile.aboutTab", "About")}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div 
          ref={contentRef} 
          tabIndex={0}
          className="flex-1 min-h-0 min-w-0 w-full max-w-full overflow-y-auto overflow-x-hidden overscroll-y-contain overscroll-x-none touch-pan-y bg-[#050506] focus:outline-none scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent" 
          style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
        >
          {/* Tab 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="px-5 py-3 space-y-5">
              {/* Action Buttons Row */}
              <div className="py-1 flex items-center justify-between sm:justify-around text-center bg-transparent gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x no-scrollbar whitespace-nowrap">
                <button
                  id="btn-save-creator"
                  onClick={handleToggleSaveCreator}
                  className="flex flex-col items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-all group shrink-0 min-w-[54px] sm:min-w-[58px] cursor-pointer"
                  title={isSaved ? t("profile.savedReviewer", "Saved Reviewer") : t("profile.saveReviewer", "Save Reviewer")}
                >
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors border ${
                      isSaved
                        ? "bg-[#E8C78A]/15 border-[#E8C78A]/45 text-[#E8C78A]"
                        : "bg-white/[0.05] text-zinc-100 border-white/[0.09] group-hover:bg-white/[0.11] group-hover:border-white/[0.18]"
                    }`}
                  >
                    {isSaved ? (
                      <BookmarkCheck className="w-[18px] h-[18px] fill-current" />
                    ) : (
                      <Bookmark className="w-[18px] h-[18px] stroke-[1.9]" />
                    )}
                  </div>
                  <span className="font-medium text-[11px]">
                    {isSaved ? t("profile.saved", "Saved") : t("profile.save", "Save")}
                  </span>
                </button>

                <button
                  id="btn-creator-video-reviews"
                  onClick={() => {
                    triggerHaptic("light");
                    handleTabClick("reviews");
                  }}
                  className="flex flex-col items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-all group shrink-0 min-w-[54px] sm:min-w-[58px] cursor-pointer"
                  title={t("profile.viewPhotoReviews", "View Photo Reviews")}
                >
                  <div className="w-11 h-11 rounded-full bg-white/[0.05] group-hover:bg-white/[0.11] group-hover:border-white/[0.18] text-zinc-100 flex items-center justify-center border border-white/[0.09] transition-all">
                    <Camera className="w-[18px] h-[18px] stroke-[1.9]" />
                  </div>
                  <span className="font-medium text-[11px]">{t("place.reviews", "Reviews")}</span>
                </button>

                <button
                  id="btn-share-creator-action"
                  onClick={() => {
                    triggerHaptic("light");
                    handleShare();
                  }}
                  className="flex flex-col items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-all group shrink-0 min-w-[54px] sm:min-w-[58px] cursor-pointer"
                  title={t("profile.shareProfile", "Share Profile")}
                >
                  <div className="w-11 h-11 rounded-full bg-white/[0.05] group-hover:bg-white/[0.11] group-hover:border-white/[0.18] text-zinc-100 flex items-center justify-center border border-white/[0.09] transition-all">
                    <Share2 className="w-[18px] h-[18px] stroke-[1.9]" />
                  </div>
                  <span className="font-medium text-[11px]">{t("common.share", "Share")}</span>
                </button>

                {!isOwner && onStartChat && (
                  <button
                    id="btn-chat-creator-action"
                    onClick={() => {
                      triggerHaptic("light");
                      onStartChat(author.userId || author.id || author.name, displayName, effectiveAvatar);
                    }}
                    className="flex flex-col items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-all group shrink-0 min-w-[54px] sm:min-w-[58px] cursor-pointer"
                    title={t("common.chat", "Message")}
                  >
                    <div className="w-11 h-11 rounded-full bg-white/[0.05] group-hover:bg-white/[0.11] group-hover:border-white/[0.18] text-zinc-100 flex items-center justify-center border border-white/[0.09] transition-all">
                      <MessageSquare className="w-[18px] h-[18px] stroke-[1.9]" />
                    </div>
                    <span className="font-medium text-[11px]">{t("common.chat", "Message")}</span>
                  </button>
                )}
              </div>

              {/* Badges & Status Section */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-white/[0.03] p-3.5 rounded-2xl border border-white/[0.08]">
                  <span className="text-[11px] font-medium text-zinc-400 block mb-1">{t("profile.avgRatingGiven", "Average Rating")}</span>
                  <span className="text-sm font-semibold text-white flex items-center gap-1.5 tabular-nums">
                    {avgRating !== "—" ? (
                      <>
                        <Star className="w-4 h-4 fill-[#E8C78A] text-[#E8C78A]" />
                        <span>{avgRating}</span>
                        <span className="text-zinc-500 text-xs font-normal">/ 5.0</span>
                      </>
                    ) : (
                      <span className="text-zinc-400 font-semibold">—</span>
                    )}
                  </span>
                </div>
                <div className="bg-white/[0.03] p-3.5 rounded-2xl border border-white/[0.08]">
                  <span className="text-[11px] font-medium text-zinc-400 block mb-1">{t("profile.totalReviews", "Total Reviews")}</span>
                  <span className="text-sm font-semibold text-white flex items-center gap-1.5 tabular-nums">
                    <Camera className="w-4 h-4 text-zinc-400" />
                    <span>{authorVideos.length} {authorVideos.length === 1 ? t("feed.photo", "Photo") : t("feed.photos", "Photos")}</span>
                  </span>
                </div>
              </div>

              {/* Photo Reviews Preview Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 tabular-nums">
                    <Camera className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{t("place.reviews", "Photo Reviews")} ({authorVideos.length})</span>
                  </h3>
                  {authorVideos.length > 0 && (
                    <button
                      onClick={() => handleTabClick("reviews")}
                      className="text-xs font-medium text-zinc-400 hover:text-white cursor-pointer transition-colors"
                    >
                      {t("common.seeAll", "See all")}
                    </button>
                  )}
                </div>

                {authorVideos.length === 0 ? (
                  <div className="bg-white/[0.02] rounded-2xl p-6 text-center border border-white/[0.08] text-zinc-400 text-xs">
                    {t("profile.memberCommentsActivity", "Active community member · Participates via comments & likes on business pages.")}
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
                          className={`relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#0a0a0d] cursor-pointer group transition-all transform active:scale-95 shadow-md ring-1 ring-white/[0.08] ${
                            isCurrentActive
                              ? "ring-2 ring-white"
                              : "hover:opacity-95 hover:ring-white/[0.2]"
                          }`}
                        >
                          <CopoVideoThumbnail
                            video={v}
                            alt={v.placeName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent pointer-events-none" />
                          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-semibold text-white flex items-center gap-0.5 border border-white/[0.12]">
                            <Star className="w-2.5 h-2.5 fill-[#E8C78A] text-[#E8C78A]" />
                            <span>{getRoundedRating(v.rating || 5)}</span>
                          </div>
                          {/* Bottom Meta Info - Business Name & Views */}
                          <div className="absolute bottom-2 left-2 right-2 flex flex-col justify-end gap-0.5 pointer-events-none z-10">
                            <span className="text-[10px] text-white font-bold drop-shadow-md truncate">
                              {v.placeName || formatBusinessName(v.placeId) || "Business"}
                            </span>
                            <div className="flex items-center gap-1 text-zinc-300 text-[9px] font-semibold drop-shadow-md">
                              <Eye className="w-2.5 h-2.5 shrink-0" />
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
            <div className="px-5 py-3 space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-zinc-300 tabular-nums">
                  {t("profile.allPhotoReviews", "All Photo Reviews")} ({authorVideos.length})
                </h3>
              </div>

              {authorVideos.length === 0 ? (
                <div className="bg-white/[0.025] rounded-2xl p-8 text-center border border-white/[0.08] text-zinc-400 text-xs">
                  {t("profile.memberCommentsActivity", "Active community member · Participates via comments & likes on business pages.")}
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
                        className={`relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#0a0a0d] cursor-pointer group transition-all transform active:scale-95 shadow-lg ring-1 ring-white/[0.08] ${
                          isCurrentActive
                            ? "ring-2 ring-white"
                            : "hover:opacity-95 hover:ring-white/[0.2]"
                        }`}
                      >
                        <CopoVideoThumbnail
                          video={v}
                          alt={v.placeName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent pointer-events-none" />
                        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-semibold text-white flex items-center gap-0.5 border border-white/[0.12] tabular-nums">
                          <Star className="w-2.5 h-2.5 fill-[#E8C78A] text-[#E8C78A]" />
                          <span>{getRoundedRating(v.rating || 5)}</span>
                        </div>
                        {onDeleteVideo && (isOwner || (currentUser && isAuthorMatch(v, currentUser))) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setVideoToDeleteInDrawer(v);
                            }}
                            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 hover:bg-red-600/90 text-zinc-200 hover:text-white backdrop-blur-xs transition-colors z-10 cursor-pointer shadow-xs"
                            title={t("feed.deleteReview", "Delete photo review")}
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                        {/* Bottom Meta Info - Business Name & Views */}
                        <div className="absolute bottom-2 left-2 right-2 flex flex-col justify-end gap-0.5 pointer-events-none z-10">
                          <span className="text-[10.5px] text-white font-semibold drop-shadow-md truncate">
                            {v.placeName || formatBusinessName(v.placeId) || "Business"}
                          </span>
                          <div className="flex items-center gap-1 text-zinc-300 text-[9.5px] font-medium drop-shadow-md tabular-nums">
                            <Eye className="w-2.5 h-2.5 shrink-0" />
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
            <div className="px-5 py-3 space-y-5">
              {displayBio ? (
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                  <h3 className="text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{t("profile.aboutUser", `About ${displayName || "User"}`, { name: displayName || "User" })}</span>
                  </h3>
                  <p className="text-zinc-300 text-[13px] leading-relaxed font-normal">
                    {displayBio}
                  </p>
                </div>
              ) : null}

              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-zinc-300">
                  {t("profile.communityStats", "Community Stats")}
                </h3>
                <div className="grid grid-cols-2 gap-2.5 tabular-nums">
                  <button
                    type="button"
                    onClick={() => { setSocialModalOpen("followers"); fetchSocialNetwork(); }}
                    className="bg-white/[0.03] hover:bg-white/[0.06] p-3.5 rounded-2xl border border-white/[0.08] transition text-left cursor-pointer group"
                  >
                    <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200 block mb-1">{t("profile.followers", "Followers")}</span>
                    <span className="text-base font-semibold text-white">{effectiveFollowersCount}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSocialModalOpen("following"); fetchSocialNetwork(); }}
                    className="bg-white/[0.03] hover:bg-white/[0.06] p-3.5 rounded-2xl border border-white/[0.08] transition text-left cursor-pointer group"
                  >
                    <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200 block mb-1">{t("profile.following", "Following")}</span>
                    <span className="text-base font-semibold text-white">{effectiveFollowingCount}</span>
                  </button>
                  <div className="bg-white/[0.03] p-3.5 rounded-2xl border border-white/[0.08]">
                    <span className="text-[11px] font-medium text-zinc-400 block mb-1">{t("profile.totalLikes", "Total Likes")}</span>
                    <span className="text-base font-semibold text-white">{totalLikes}</span>
                  </div>
                  <div className="bg-white/[0.03] p-3.5 rounded-2xl border border-white/[0.08]">
                    <span className="text-[11px] font-medium text-zinc-400 block mb-1">{t("profile.totalPhotos", "Total Photos")}</span>
                    <span className="text-base font-semibold text-white">{authorVideos.length}</span>
                  </div>
                  <div className="bg-white/[0.03] p-3.5 rounded-2xl border border-white/[0.08]">
                    <span className="text-[11px] font-medium text-zinc-400 block mb-1">{t("profile.avgRatingGiven", "Avg Rating Given")}</span>
                    <span className="text-base font-semibold text-white inline-flex items-center gap-1.5">
                      {avgRating !== "—" ? (
                        <>
                          <Star className="w-3.5 h-3.5 fill-[#E8C78A] text-[#E8C78A] shrink-0" />
                          <span>{avgRating}</span>
                        </>
                      ) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Account Deletion Request Modal (Dark Mode) */}
      {isDeletionRequestModalOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsDeletionRequestModalOpen(false)}
        >
          <div
            className="bg-zinc-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-800 space-y-4 animate-in zoom-in-95 duration-150 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 flex items-center justify-center mx-auto shadow-inner">
              <Shield className="w-6 h-6 text-zinc-300" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-white">{t("profile.requestDeletionTitle", "Request Account Deletion")}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {t("profile.requestDeletionNotice", "Please select a reason below. Our support team will review and process your account deletion within 24–48 hours.")}
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  {t("profile.reasonLabel", "Reason")}
                </label>
                <select
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 transition-colors"
                >
                  <option value="I no longer use this account">{t("profile.reason1", "I no longer use this account")}</option>
                  <option value="Privacy concerns">{t("profile.reason2", "Privacy concerns")}</option>
                  <option value="Created by mistake">{t("profile.reason3", "Created by mistake")}</option>
                  <option value="Temporary break">{t("profile.reason4", "Temporary break")}</option>
                  <option value="Other reason">{t("profile.reason5", "Other reason")}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  {t("profile.notesLabel", "Additional Notes (Optional)")}
                </label>
                <textarea
                  value={deletionNotes}
                  onChange={(e) => setDeletionNotes(e.target.value)}
                  rows={2}
                  maxLength={300}
                  placeholder={t("profile.notesPlaceholder", "Tell us if there is anything we can help with...")}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeletionRequestModalOpen(false)}
                disabled={isSubmittingDeletion}
                className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-xs font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsSubmittingDeletion(true);
                  try {
                    await fetch("/api/account/deletion-request", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        userId: author?.userId || author?.id || currentUser?.uid || currentUser?.id,
                        userName: author?.name || currentUser?.name,
                        userEmail: author?.email || currentUser?.email,
                        reason: deletionReason,
                        details: deletionNotes.trim()
                      })
                    });
                  } catch (e) {
                    console.error("Deletion request error:", e);
                  } finally {
                    setIsSubmittingDeletion(false);
                    setIsDeletionRequestModalOpen(false);
                    setDeletionSuccessToast(true);
                    setTimeout(() => setDeletionSuccessToast(false), 5000);
                  }
                }}
                disabled={isSubmittingDeletion}
                className="flex-1 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-black transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmittingDeletion ? t("common.submitting", "Submitting...") : t("profile.submitRequest", "Submit Request")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Toast */}
      {deletionSuccessToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 border border-zinc-700 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 max-w-sm">
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <p className="text-xs font-semibold leading-snug text-zinc-200">
            {t("profile.deletionRequestSuccess", "Your account deletion request has been submitted. Our team will process it within 24–48 hours.")}
          </p>
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
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[24px] sm:rounded-[28px] border-[4px] border-zinc-950 md:border-zinc-800 bg-zinc-900 shadow-2xl flex items-center justify-center relative p-2 ring-1 ring-white/15 overflow-hidden group">
                    {(() => {
                      const isCustomImage = (url?: string) => Boolean(
                        url &&
                        typeof url === "string" &&
                        !url.includes("/api/avatar") &&
                        !url.startsWith("data:image/svg+xml") &&
                        !url.includes("ui-avatars")
                      );
                      const activePhoto = isCustomImage(editAvatar) ? editAvatar : isCustomImage(currentUser?.avatar) ? currentUser?.avatar : isCustomImage(effectiveAvatar) ? effectiveAvatar : null;
                      const activeName = editName || displayName || currentUser?.name || author.name || "User";

                      return activePhoto ? (
                        <img
                          src={activePhoto}
                          alt="Profile avatar preview"
                          className="w-full h-full object-cover rounded-[16px] sm:rounded-[18px] group-hover:scale-105 transition-transform duration-200"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div
                          className="w-full h-full rounded-[16px] sm:rounded-[18px] flex items-center justify-center shadow-inner select-none"
                          style={{ backgroundColor: getAvatarColor(activeName, (currentUser as any)?.handle || author.handle || (currentUser as any)?.email).bg }}
                        >
                          <span className="font-black text-3xl sm:text-4xl text-white drop-shadow-md font-sans">
                            {getFirstLetter(activeName)}
                          </span>
                        </div>
                      );
                    })()}
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white rounded-[24px] sm:rounded-[28px]">
                      <Camera className="w-6 h-6" />
                    </div>
                  </div>
                  <button type="button" className="absolute -bottom-1 -right-1 p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full shadow-lg transition-colors cursor-pointer border border-zinc-700 z-10"><Camera className="w-3.5 h-3.5" /></button>
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
                      <img src={getProxiedImageUrl(editBanner || currentUser?.banner)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" referrerPolicy="no-referrer" />
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
                  placeholder={t("profile.namePlaceholder", "Your Name")}
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
                    <span className="text-xs font-medium text-zinc-200 group-hover:text-white flex items-center gap-1.5">
                      <span>{currentLanguageMeta.flag}</span>
                      <span>{currentLanguageMeta.name}</span>
                    </span>
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

              {/* Account Settings: Passkey & Request Deletion */}
              <div className="pt-3 border-t border-zinc-800 space-y-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                  {t("profile.accountSettings", "Account Settings")}
                </span>

                {/* Passkey inside Edit Profile */}
                <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-zinc-200 shrink-0" />
                      <p className="text-xs font-bold text-zinc-200">Passkey</p>
                    </div>
                    {isPasskeyProtected && (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] font-bold text-zinc-200">
                        Saved
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    Keep your account across devices with one tap.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      disabled={isLinkingAccount}
                      onClick={handleRegisterPasskeyInline}
                      className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                        isPasskeyProtected
                          ? "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-200"
                          : "bg-white hover:bg-zinc-200 border-white text-zinc-950"
                      }`}
                    >
                      <KeyRound className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {isLinkingAccount
                          ? "Saving..."
                          : isPasskeyProtected
                          ? "Update Passkey"
                          : "Save Passkey"}
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={isRestoringPasskey}
                      onClick={handleRestorePasskeyInline}
                      className="flex-1 py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isRestoringPasskey ? "animate-spin" : ""}`} />
                      <span>
                        {isRestoringPasskey ? "Checking..." : "Restore Account"}
                      </span>
                    </button>
                  </div>
                  {linkStatusMsg && (
                    <p className="text-[11px] font-semibold text-zinc-200">
                      {linkStatusMsg}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700/80 transition-colors">
                  <div className="space-y-0.5 pr-2">
                    <p className="text-xs font-bold text-zinc-200">{t("profile.requestDeletionTitle", "Request Account Deletion")}</p>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      {t("profile.requestDeletionDesc", "Submit a request to permanently delete your account & profile.")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setIsDeletionRequestModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs"
                  >
                    {t("profile.requestBtn", "Request")}
                  </button>
                </div>
              </div>
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
        isCreatorProfile={true}
        isAuthorVerified={isPasskeyProtected}
        onOpenReport={onOpenReport ? () => onOpenReport(author) : undefined}
      />

      {/* Video Delete Confirmation Modal */}
      {videoToDeleteInDrawer && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={(e) => e.stopPropagation()}>
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-white tracking-tight">{t("feed.deleteReviewTitle", "Delete Photo Review?")}</h3>
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
                  const targetVid = videoToDeleteInDrawer;
                  const vidId = targetVid.id;
                  setVideoToDeleteInDrawer(null);
                  if (vidId && onDeleteVideo && (isOwner || (currentUser && isAuthorMatch(targetVid, currentUser)))) {
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

      {/* SOCIAL NETWORK MODAL (FOLLOWERS & FOLLOWING) */}
      {socialModalTab && (
        <div className="fixed inset-0 z-[120] bg-zinc-950 text-white flex flex-col overflow-hidden animate-in fade-in duration-200 select-none">
          <div className="w-full max-w-2xl mx-auto flex flex-col h-full overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60 shrink-0">
              <div className="min-w-0 pr-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSocialModalOpen(null)}
                  className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white flex items-center justify-center transition cursor-pointer shrink-0 border border-zinc-800 shadow-sm active:scale-95"
                  title={t("common.back", "Back")}
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                </button>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2 truncate">
                    <Users className="w-5 h-5 text-zinc-300 shrink-0" />
                    <span className="truncate">{displayName}</span>
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium truncate mt-0.5">
                    {t("profile.manageSocialDesc", "Manage followers and reviewers on Yoouz")}
                  </p>
                </div>
              </div>

            </div>

            {/* Pill Tabs: Followers | Following */}
            <div className="p-3.5 sm:p-4 bg-zinc-950 border-b border-zinc-800/60 space-y-3 shrink-0">
              <div className="grid grid-cols-2 p-1 bg-zinc-900/90 rounded-2xl border border-zinc-800 shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    setSocialModalOpen("followers");
                    setSocialSearch("");
                  }}
                  className={`py-2 px-3 text-center text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    socialModalTab === "followers"
                      ? "bg-white text-zinc-950 shadow-sm"
                      : "text-zinc-300 hover:text-white"
                  }`}
                >
                  <span>{t("profile.followers", "Followers")}</span>
                  <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${socialModalTab === "followers" ? "bg-zinc-200 text-zinc-950" : "bg-zinc-800 text-zinc-300"}`}>
                    {effectiveFollowersCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSocialModalOpen("following");
                    setSocialSearch("");
                  }}
                  className={`py-2 px-3 text-center text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    socialModalTab === "following"
                      ? "bg-white text-zinc-950 shadow-sm"
                      : "text-zinc-300 hover:text-white"
                  }`}
                >
                  <span>{t("profile.following", "Following")}</span>
                  <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${socialModalTab === "following" ? "bg-zinc-200 text-zinc-950" : "bg-zinc-800 text-zinc-300"}`}>
                    {effectiveFollowingCount}
                  </span>
                </button>
              </div>

              {/* Search Filter */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={socialSearch}
                  onChange={(e) => setSocialSearch(e.target.value)}
                  placeholder={socialModalTab === "following" ? t("profile.searchFollowingPlaceholder", "Search followed businesses or reviewers...") : t("profile.searchFollowersPlaceholder", "Search followers by name...")}
                  className="w-full pl-10 pr-9 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-medium"
                />
                {socialSearch && (
                  <button
                    type="button"
                    onClick={() => setSocialSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer p-1 rounded-full hover:bg-zinc-800 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sub-Filters inside Following: All, Businesses, Reviewers */}
              {socialModalTab === "following" && (
                <div className="flex items-center gap-1.5 overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x no-scrollbar py-0.5">
                  <button
                    onClick={() => setFollowingFilter("all")}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                      followingFilter === "all"
                        ? "bg-white text-zinc-950 border-white shadow-xs font-bold"
                        : "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800"
                    }`}
                  >
                    All ({effectiveFollowingCount})
                  </button>
                  <button
                    onClick={() => setFollowingFilter("businesses")}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap border flex items-center gap-1.5 ${
                      followingFilter === "businesses"
                        ? "bg-white text-zinc-950 border-white shadow-xs font-bold"
                        : "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{t("profile.businesses", "Businesses")}</span>
                  </button>
                  <button
                    onClick={() => setFollowingFilter("reviewers")}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap border flex items-center gap-1.5 ${
                      followingFilter === "reviewers"
                        ? "bg-white text-zinc-950 border-white shadow-xs font-bold"
                        : "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800"
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{t("profile.reviewers", "Reviewers")}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Users List Container */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-2 no-scrollbar min-h-[260px]">
              {isSocialLoading ? (
                <div className="py-12 text-center text-xs text-zinc-400 flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-zinc-300 animate-spin" />
                  <span>Loading {socialModalTab}...</span>
                </div>
              ) : (() => {
                const isYoouzMemberStr = (str?: string) => {
                  if (!str) return false;
                  const s = String(str).toLowerCase().trim().replace(/^@+/, "");
                  return (
                    s.includes("yoouz") ||
                    s.includes("member") ||
                    s.includes("reviewer") ||
                    s.includes("registered user") ||
                    s.includes("david") ||
                    s === "user" ||
                    s === "community member" ||
                    s === "community reviewer"
                  );
                };

                const rawList = socialModalTab === "followers" ? (socialData?.followers || []) : (socialData?.following || []);
                const filtered = rawList
                  .filter((u: any) => !isYoouzMemberStr(u.name) && !isYoouzMemberStr(u.id) && !isYoouzMemberStr(u.handle))
                  .filter((u: any) => {
                    if (!socialSearch.trim()) return true;
                    const q = socialSearch.toLowerCase();
                    return (u.name || "").toLowerCase().includes(q) || (u.location || "").toLowerCase().includes(q);
                  });

                const finalFiltered = filtered.filter((u: any) => {
                  if (socialModalTab !== "following" || followingFilter === "all") return true;
                  const isPl = u.type === "place" || places.some((p: any) => p.id === u.id || (p.name && u.name && p.name.toLowerCase() === u.name.toLowerCase()));
                  return followingFilter === "businesses" ? isPl : !isPl;
                });

                if (finalFiltered.length === 0) {
                  return (
                    <div className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 text-center text-zinc-400 space-y-2">
                      <Users className="w-8 h-8 text-zinc-600 mx-auto" />
                      <p className="font-bold text-white text-sm">
                        {socialSearch ? "No matching members found" : `No ${socialModalTab} yet`}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {socialSearch ? `No user matches "${socialSearch}". Try another search.` : `When users appear in ${socialModalTab}, they will be listed here.`}
                      </p>
                    </div>
                  );
                }

                return finalFiltered.map((u: any, idx: number) => {
                  if (!u || !u.name || isYoouzMemberStr(u.name)) return null;
                  const nameStr = u.name;
                  const isPlace = u.type === "place" || places.some((p: any) => p.id === u.id || (p.name && nameStr && p.name.toLowerCase() === nameStr.toLowerCase()));
                  const cleanDomain = extractCleanDomain(u.website || u.id || nameStr);
                  const formattedTitle = formatBusinessName(nameStr);
                  const safeAvatar = getSafeAvatarUrl(u.avatar, nameStr, u.handle || nameStr);
                  const locationStr = u.location ? formatCityCountry(u.location) : (u.city ? `${u.city}${u.country ? `, ${u.country}` : ''}` : "");

                  const matchingVideos = (allVideos || []).filter((v) => {
                    if (isPlace) {
                      return v.placeId === u.id || v.placeName?.toLowerCase() === nameStr.toLowerCase() || (v.placeWebsite && cleanDomain && extractCleanDomain(v.placeWebsite) === cleanDomain);
                    }
                    const vAuthName = (v.author?.name || "").toLowerCase().trim();
                    const vAuthHandle = (v.author?.handle || "").replace(/^@+/, "").toLowerCase().trim();
                    const targetN = nameStr.toLowerCase().trim();
                    const targetH = (u.handle || "").replace(/^@+/, "").toLowerCase().trim();
                    return (targetN && vAuthName === targetN) || (targetH && vAuthHandle === targetH);
                  });
                  const videoCount = matchingVideos.length;
                  let dynamicRating = 5.0;
                  if (isPlace && matchingVideos.length > 0) {
                    const sum = matchingVideos.reduce((acc, v) => acc + (v.rating || 5), 0);
                    dynamicRating = Number((sum / matchingVideos.length).toFixed(1));
                  } else if (isPlace) {
                    const foundP = places.find((p: any) => p.id === u.id || p.name?.toLowerCase() === nameStr.toLowerCase());
                    if (foundP && typeof foundP.rating === "number") dynamicRating = foundP.rating;
                  }

                  const isMemberFollowed = currentUser?.followedAuthors
                    ? currentUser.followedAuthors.some((h) => {
                        const cleanH = h.replace(/^@+/, "").toLowerCase().trim();
                        return cleanH === nameStr.toLowerCase().trim() || (u.handle && cleanH === u.handle.replace(/^@+/, "").toLowerCase().trim());
                      })
                    : false;

                  const isSelf = currentUser
                    ? ((currentUser.name && nameStr.toLowerCase().trim() === currentUser.name.toLowerCase().trim()) ||
                       (currentUser.email && u.email && u.email.toLowerCase().trim() === currentUser.email.toLowerCase().trim()))
                    : false;

                  const isHoveredUnfollow = (isPlace ? hoveredUnfollowPlace === (u.id || nameStr) : hoveredUnfollowModalUser === nameStr);

                  return (
                    <div
                      key={u.id || idx}
                      onClick={() => {
                        setSocialModalOpen(null);
                        if (isPlace && onOpenPlace) {
                          onOpenPlace(u.id || nameStr);
                        } else if (onOpenCreator) {
                          onOpenCreator({
                            name: nameStr,
                            handle: u.handle || `@${nameStr.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
                            avatar: safeAvatar,
                            location: locationStr,
                            isVerified: false
                          });
                        }
                      }}
                      className="bg-zinc-900/70 hover:bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-zinc-700 p-3.5 sm:p-4 shadow-sm transition-all flex items-center justify-between gap-3.5 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                        {isPlace ? (
                          <CopoBrandLogo
                            domain={cleanDomain}
                            name={formattedTitle}
                            website={u.website}
                            logoUrl={u.logoUrl || u.avatar}
                            className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white p-1.5 border border-zinc-200/60 shrink-0 shadow-xs flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform ring-1 ring-white/10"
                            imageClassName="w-full h-full object-contain rounded-md [image-rendering:-webkit-optimize-contrast]"
                            fallbackTextClassName="font-extrabold text-xs text-zinc-950"
                          />
                        ) : (
                          <img
                            src={safeAvatar}
                            alt={nameStr}
                            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border border-zinc-800 shrink-0 group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.src = getSafeAvatarUrl(null, nameStr, u.handle || nameStr);
                            }}
                          />
                        )}

                        <div className="min-w-0 flex-1 text-left">
                          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                            <h4 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-zinc-200 transition-colors">
                              {isPlace ? formattedTitle : nameStr}
                            </h4>
                            {(isPlace || Boolean(u.passkeyProtected)) && (
                              <CheckCircle2 className="w-3.5 h-3.5 fill-white text-zinc-950 shrink-0" />
                            )}
                            {isPlace && (
                              <span className="bg-zinc-800 text-zinc-300 text-[9.5px] font-bold px-1.5 py-0.5 rounded border border-zinc-700 uppercase tracking-wider shrink-0">
                                {t("profile.business", "Business")}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5 text-xs text-zinc-300 font-medium mt-0.5 min-w-0">
                            {isPlace ? (
                              <div className="flex items-center gap-1.5 shrink-0">
                                {videoCount > 0 ? (
                                  <>
                                    <span className="text-[#E8C78A] font-bold flex items-center gap-0.5 shrink-0">
                                      <Star className="w-3 h-3 fill-[#E8C78A] text-[#E8C78A]" />
                                      {dynamicRating.toFixed(1)}
                                    </span>
                                    <span className="text-zinc-600 shrink-0">·</span>
                                    <span className="shrink-0">
                                      {videoCount} {videoCount === 1 ? t("common.photoReview", "photo review") : t("common.photoReviews", "photo reviews")}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-zinc-400 text-xs shrink-0">0 photo reviews</span>
                                )}
                              </div>
                            ) : (
                              <span className="shrink-0 text-zinc-300 text-xs font-medium">
                                {`${videoCount} ${videoCount === 1 ? "photo review" : "photo reviews"}`}
                              </span>
                            )}

                            {locationStr && (
                              <>
                                <span className="hidden sm:inline text-zinc-600 shrink-0">·</span>
                                <span className="text-[11px] sm:text-xs text-zinc-400 sm:text-zinc-300 flex items-center gap-1 mt-0.5 sm:mt-0 truncate min-w-0">
                                  <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                                  <span className="truncate">{locationStr}</span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      {!isSelf && (
                        <button
                          type="button"
                          onMouseEnter={() => {
                            if (isPlace) setHoveredUnfollowPlace(u.id || nameStr);
                            else setHoveredUnfollowModalUser(nameStr);
                          }}
                          onMouseLeave={() => {
                            if (isPlace) setHoveredUnfollowPlace(null);
                            else setHoveredUnfollowModalUser(null);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isPlace && onToggleFollowPlace) {
                              onToggleFollowPlace(u.id || nameStr);
                            } else {
                              const targetH = u.handle || nameStr || u.id;
                              if (targetH && onToggleFollow) {
                                onToggleFollow(targetH);
                                setTimeout(() => fetchSocialNetwork(), 300);
                              }
                            }
                          }}
                          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs whitespace-nowrap active:scale-95 ${
                            isMemberFollowed
                              ? isHoveredUnfollow
                                ? "bg-red-500/15 text-red-400 border border-red-500/30"
                                : "bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700"
                              : "bg-white text-zinc-950 hover:bg-zinc-200 border border-white"
                          }`}
                        >
                          {isMemberFollowed ? (
                            isHoveredUnfollow ? (
                              <>
                                <UserMinus className="w-3.5 h-3.5" />
                                <span>Unfollow</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5 text-zinc-300" />
                                <span>Following</span>
                              </>
                            )
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Follow</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                });
              })()}
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
