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
  Flag,
  Camera,
  Edit3,
  Trash2,
  LogOut,
  MoreVertical,
  Play,
  ThumbsUp,
  MapPin
} from "lucide-react";
import { VideoAuthor, VideoReview, UserProfile } from "../types";
import { isAuthorMatch } from "../utils/placeUtils";
import { resolveVideoPosterUrl } from "../utils/videoUtils";
import { CopoVideoThumbnail } from "./CopoVideoThumbnail";
import { CopoShareModal } from "./CopoShareModal";
import { CountrySelector } from "./CountrySelector";
import { SearchableComboSelector } from "./SearchableComboSelector";
import { countries } from "../utils/countries";
import { locationData } from "../utils/locationData";
import { triggerHaptic } from "../utils/haptics";
import { useSwipeDownToDismiss } from "../hooks/useSwipeDownToDismiss";

interface CopoCreatorDrawerProps {
  author: VideoAuthor | null;
  allVideos: VideoReview[];
  currentUser?: UserProfile | null;
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
}

export const CopoCreatorDrawer: React.FC<CopoCreatorDrawerProps> = ({
  author,
  allVideos,
  currentUser,
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
  onDeleteProfile
}) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
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

  if (!author) return null;

  // Filter videos belonging to this author
  const authorVideos = allVideos.filter((v) => isAuthorMatch(v, author));

  const totalLikes = authorVideos.reduce((acc, v) => acc + v.likes + (v.isLiked ? 1 : 0), 0);
  const avgRating =
    authorVideos.length > 0
      ? (authorVideos.reduce((acc, v) => acc + v.rating, 0) / authorVideos.length).toFixed(1)
      : "5.0";

  // Find real avatar
  const recordedFaceThumbnail = authorVideos.find((v) => v.thumbnailUrl && !v.thumbnailUrl.includes("dicebear") && !v.thumbnailUrl.includes("unsplash"))?.thumbnailUrl;
  let effectiveAvatar = isOwner && currentUser 
    ? currentUser.avatar 
    : (author.avatar && !author.avatar.includes("dicebear") && !author.avatar.includes("unsplash")
      ? author.avatar
      : (recordedFaceThumbnail || author.avatar));

  if (!effectiveAvatar || effectiveAvatar.includes("unsplash") || effectiveAvatar.includes("dicebear")) {
    const isBizRiv = (author.name || "").toLowerCase().includes("biz") || (author.name || "").toLowerCase().includes("louis");
    effectiveAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name || "User")}&background=${isBizRiv ? "059669" : "1a73e8"}&color=fff&bold=true&size=128`;
  }


  let effectiveBanner = isOwner && currentUser?.banner 
    ? currentUser.banner 
    : author?.banner;

  const handleShare = () => {
    setIsShareModalOpen(true);
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

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = currentUser?.name || "Reviewer";
    
    // Construct premium location string from structured fields
    const locParts = [editCity.trim(), editState.trim(), editCountry.trim()].filter(Boolean);
    const combinedLocation = locParts.join(", ");

    if (onUpdateProfile) {
      onUpdateProfile({
        name: cleanName,
        bio: editBio.trim(),
        avatar: editAvatar || currentUser?.avatar,
        banner: editBanner || currentUser?.banner,
        location: combinedLocation
      });
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
        }} 
      />

      <aside
        id="google-maps-creator-panel"
        style={dragOffsetY > 0 ? { transform: `translateY(${dragOffsetY}px)`, transition: 'none' } : undefined}
        className="fixed inset-x-0 bottom-0 md:bottom-auto md:inset-auto md:relative z-50 md:z-20 w-full md:w-[350px] lg:w-[430px] h-[100dvh] md:h-[100dvh] bg-zinc-950 md:bg-white text-white md:text-zinc-900 flex flex-col shadow-none md:shadow-lg border-r border-zinc-800 md:border-zinc-200 shrink-0 overflow-hidden animate-in slide-in-from-bottom md:slide-in-from-left duration-200 select-none overscroll-contain transition-transform"
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
          className="relative h-44 w-full bg-zinc-950 md:bg-gradient-to-r md:from-blue-600 md:via-indigo-600 md:to-blue-800 shrink-0 touch-pan-y"
        >
          {effectiveBanner && (
            <img src={effectiveBanner} className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
          )}
          <div className="absolute inset-0 bg-black/20" />

          {/* Verified Top Contributor Badge */}
          <div className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-[#1a73e8] text-[11px] font-bold text-white flex items-center gap-1.5 shadow-md">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Yoouz Top Reviewer</span>
          </div>

          {/* Top Right Action Group */}
          <div className="absolute top-3.5 right-3.5 flex items-center gap-2 z-20">
            {/* Share button */}
            <button
              id="btn-share-creator-profile"
              onClick={() => {
                triggerHaptic("light");
                handleShare();
              }}
              className="w-9 h-9 rounded-full bg-zinc-900/90 md:bg-white/95 shadow-md flex items-center justify-center text-zinc-100 md:text-zinc-800 hover:bg-zinc-850 md:hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer border border-zinc-700/60 md:border-zinc-200"
              title="Share Profile"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Non-owner: Report Creator */}
            {!isOwner && onOpenReport && (
              <button
                id="btn-report-creator-profile"
                onClick={() => {
                  triggerHaptic("light");
                  onOpenReport(author);
                }}
                className="w-9 h-9 rounded-full bg-zinc-900/90 md:bg-white/95 shadow-md flex items-center justify-center text-zinc-300 md:text-zinc-600 hover:text-red-400 md:hover:text-red-600 hover:bg-zinc-850 md:hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer border border-zinc-700/60 md:border-zinc-200"
                title="Report creator"
              >
                <Flag className="w-4 h-4" />
              </button>
            )}

            {/* Owner: Settings & Account Menu */}
            {isOwner && (
              <div className="relative" ref={settingsMenuRef}>
                <button
                  id="btn-creator-profile-settings"
                  onClick={() => setIsSettingsMenuOpen((prev) => !prev)}
                  className="w-9 h-9 rounded-full bg-zinc-900/90 md:bg-white/95 shadow-md flex items-center justify-center text-zinc-100 md:text-zinc-800 hover:bg-zinc-850 md:hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer border border-zinc-700/60 md:border-zinc-200"
                  title="Account & Settings"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {isSettingsMenuOpen && (
                  <div className="absolute right-0 top-11 w-52 bg-zinc-900 md:bg-white rounded-2xl shadow-xl border border-zinc-800 md:border-zinc-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      onClick={() => {
                        setIsSettingsMenuOpen(false);
                        setIsEditModalOpen(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-zinc-200 md:text-zinc-800 hover:bg-zinc-800 md:hover:bg-zinc-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4 text-zinc-400 md:text-zinc-500" />
                      <span>Edit Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsSettingsMenuOpen(false);
                        handleShare();
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-zinc-200 md:text-zinc-800 hover:bg-zinc-800 md:hover:bg-zinc-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 text-zinc-400 md:text-zinc-500" />
                      <span>Share Profile Link</span>
                    </button>

                    {onSignOut && (
                      <button
                        onClick={() => {
                          setIsSettingsMenuOpen(false);
                          onSignOut();
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-bold text-zinc-200 md:text-zinc-800 hover:bg-zinc-800 md:hover:bg-zinc-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-zinc-400 md:text-zinc-500" />
                        <span>Sign Out</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Close button */}
            <button
              id="btn-close-creator-panel"
              onClick={() => {
                triggerHaptic("light");
                onClose();
              }}
              className="w-9 h-9 rounded-full bg-zinc-900/90 md:bg-white/95 shadow-md flex items-center justify-center text-zinc-100 md:text-zinc-800 hover:bg-zinc-850 md:hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer border border-zinc-700/60 md:border-zinc-200"
              title="Close creator profile"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Avatar overlapping bottom of banner */}
          <div className="absolute -bottom-7 left-6 w-20 h-20 rounded-full border-4 border-zinc-950 md:border-white bg-zinc-950 md:bg-white shadow-lg overflow-hidden group">
            <img
              src={effectiveAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name || "User")}&background=1a73e8&color=fff`}
              alt={author.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {isOwner && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Change Photo"
              >
                <Camera className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Creator Details Header */}
        <div className="px-6 pt-10 pb-4 bg-zinc-950 md:bg-white border-b border-zinc-800 md:border-zinc-200">
          <div className="flex items-start justify-between">
            <div className="min-w-0 pr-2 pt-1">
              <h2 className="text-xl font-black text-white md:text-zinc-900 tracking-tight leading-tight flex flex-wrap items-center gap-1.5">
                <span className="break-words max-w-full" style={{ wordBreak: 'break-word' }}>{isOwner && currentUser ? currentUser.name : author.name}</span>
                <CheckCircle className="w-4 h-4 fill-[#1a73e8] text-white shrink-0 mt-0.5" />
              </h2>
              {isOwner && currentUser?.location ? (
                <p className="text-xs text-zinc-400 md:text-zinc-500 font-semibold flex items-center gap-1 mt-1.5">
                  <MapPin className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                  <span>{currentUser.location}</span>
                </p>
              ) : author?.location ? (
                <p className="text-xs text-zinc-400 md:text-zinc-500 font-semibold flex items-center gap-1 mt-1.5">
                  <MapPin className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                  <span>{author.location}</span>
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isOwner ? (
                <button
                  id="btn-edit-profile-action"
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-4 py-2 rounded-full font-bold text-xs bg-white md:bg-zinc-900 text-zinc-950 md:text-white hover:bg-zinc-100 md:hover:bg-zinc-800 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onToggleFollow(author.name)}
                    className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                      author.isFollowed
                        ? "bg-zinc-900 md:bg-zinc-100 text-zinc-200 md:text-zinc-800 border border-zinc-800 md:border-zinc-300 hover:bg-zinc-850 md:hover:bg-zinc-200"
                        : "bg-[#1a73e8] text-white hover:bg-[#1557b0]"
                    }`}
                  >
                    {author.isFollowed ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400 md:text-emerald-600" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>

                  {onStartChat && (
                    <button
                      onClick={() => onStartChat(author.name, author.name, effectiveAvatar)}
                      className="px-4 py-2 rounded-full font-bold text-xs bg-zinc-900 md:bg-white text-blue-400 md:text-[#1a73e8] border border-zinc-800 md:border-zinc-300 hover:bg-zinc-850 md:hover:bg-zinc-50 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-zinc-850 md:border-zinc-100 text-sm">
            <div>
              <span className="font-black text-white md:text-zinc-950">
                {(author.followersCount || 0) + (author.isFollowed ? 1 : 0)}
              </span>
              <span className="text-zinc-400 md:text-zinc-500 ml-1 text-xs font-semibold">Followers</span>
            </div>
            <div>
              <span className="font-black text-white md:text-zinc-950">{authorVideos.length}</span>
              <span className="text-zinc-400 md:text-zinc-500 ml-1 text-xs font-semibold">Reviews</span>
            </div>
            <div>
              <span className="font-black text-white md:text-zinc-950">{totalLikes}</span>
              <span className="text-zinc-400 md:text-zinc-500 ml-1 text-xs font-semibold">Likes</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-zinc-950 md:bg-zinc-50 p-4 space-y-4">
          {/* Bio Card */}
          <div className="bg-zinc-900 md:bg-white rounded-[24px] p-4.5 shadow-xs border border-zinc-800 md:border-zinc-200 space-y-3.5">
            <div className="flex items-start justify-between">
              <h3 className="text-[11px] font-black uppercase tracking-wider text-zinc-500 md:text-zinc-400">
                Reviewer Bio
              </h3>
              {isOwner && (
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-blue-400 md:text-[#1a73e8] hover:underline text-xs font-bold cursor-pointer"
                >
                  Edit
                </button>
              )}
            </div>
            <p className="text-zinc-300 md:text-zinc-800 text-xs leading-relaxed font-medium">
              {isOwner && currentUser?.bio
                ? currentUser.bio
                : author.bio || (author as any).bio || "Food explorer linking real businesses and authentic video reviews."}
            </p>

            <div className="pt-2.5 border-t border-zinc-800 md:border-zinc-100 grid grid-cols-2 gap-2.5">
              <div className="bg-zinc-950/60 md:bg-zinc-50 p-2.5 rounded-xl border border-zinc-800/80 md:border-zinc-100">
                <span className="text-[9px] font-bold text-zinc-500 md:text-zinc-400 uppercase tracking-wider block mb-0.5">Average Rating Given</span>
                <span className="text-xs font-black text-white md:text-zinc-950 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {avgRating} ⭐
                </span>
              </div>
              <div className="bg-zinc-950/60 md:bg-zinc-50 p-2.5 rounded-xl border border-zinc-800/80 md:border-zinc-100">
                <span className="text-[9px] font-bold text-zinc-500 md:text-zinc-400 uppercase tracking-wider block mb-0.5">Total Reviews</span>
                <span className="text-xs font-black text-white md:text-zinc-950 flex items-center gap-1">
                  <Video className="w-3.5 h-3.5 text-blue-400 md:text-blue-600" />
                  {authorVideos.length} {authorVideos.length === 1 ? "Video" : "Videos"}
                </span>
              </div>
            </div>

            <div className="pt-1.5 border-t border-zinc-800 md:border-zinc-100 flex items-center gap-2 text-blue-400 md:text-[#1a73e8]">
              <div className="w-4 h-4 rounded-full bg-blue-950/60 md:bg-blue-50 flex items-center justify-center">
                <ShieldCheck className="w-3 h-3 text-blue-400 md:text-[#1a73e8]" />
              </div>
              <span className="text-[11px] font-bold text-zinc-300 md:text-zinc-700">Yoouz Verified Top Contributor</span>
            </div>
          </div>

          {/* TikTok-Style 3-Column Video Reviews Grid */}
          <div className="pt-2">
            {/* Grid Tabs Header */}
            <div className="flex items-center justify-center border-b border-zinc-800 md:border-zinc-200 mb-2">
              <div className="flex items-center gap-1 py-2 px-6 border-b-2 border-white md:border-zinc-900 text-white md:text-zinc-900 font-bold text-xs">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M3 4h4v16H3V4zm7 0h4v16h-4V4zm7 0h4v16h-4V4z" />
                </svg>
                <span className="ml-1 text-[11px] font-black uppercase tracking-wider">
                  Reviews ({authorVideos.length})
                </span>
              </div>
            </div>

            {authorVideos.length === 0 ? (
              <div className="bg-zinc-900 md:bg-white rounded-2xl p-6 text-center border border-zinc-800 md:border-zinc-200 text-zinc-400 md:text-zinc-500 text-xs">
                No video reviews published yet.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 px-0.5">
                {authorVideos.map((v) => {
                  const isCurrentActive = v.id === activeVideoId;
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
                      className={`relative aspect-[3/4] rounded-lg overflow-hidden bg-zinc-900 cursor-pointer group transition-all transform active:scale-95 shadow-2xs ring-1 ring-zinc-800 md:ring-zinc-200/50 ${
                        isCurrentActive
                          ? "ring-2 ring-[#1a73e8]"
                          : "hover:opacity-90"
                      }`}
                    >
                      {/* Video Thumbnail / Preview without any center icon */}
                      <CopoVideoThumbnail
                        video={v}
                        alt={v.placeName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                      />

                      {/* Dark Gradient Overlay for bottom text */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/25 pointer-events-none" />

                      {/* Top Left: Star Rating */}
                      <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[9px] font-black text-amber-400 flex items-center gap-0.5 shadow-xs">
                        <Star className="w-2.5 h-2.5 fill-amber-400" />
                        <span>{v.rating ? v.rating.toFixed(1) : "5.0"}</span>
                      </div>

                      {/* Bottom Left: TikTok Style Play Count */}
                      <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-white text-[10px] font-bold drop-shadow-sm">
                        <Play className="w-2.5 h-2.5 fill-white" />
                        <span>{formattedViews}</span>
                      </div>

                      {/* Place Name on Hover / subtle tag */}
                      <div className="absolute bottom-1.5 right-1.5 max-w-[50%] text-right text-[8.5px] text-zinc-300 truncate font-medium drop-shadow-xs">
                        {v.placeName}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Delete Account / Profile Confirmation Modal */}
      {isDeleteAccountModalOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsDeleteAccountModalOpen(false)}
        >
          <div
            className="bg-zinc-900 md:bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-800 md:border-zinc-200 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-950/50 md:bg-red-50 text-red-400 md:text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-white md:text-zinc-900">Delete Profile & Account?</h3>
              <p className="text-xs text-zinc-400 md:text-zinc-500 leading-relaxed">
                This will permanently delete your Yoouz profile, saved places, and reviewer account. This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteAccountModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-800 md:border-zinc-200 text-xs font-bold text-zinc-300 md:text-zinc-700 hover:bg-zinc-800 md:hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsDeleteAccountModalOpen(false);
                  if (onDeleteProfile) {
                    await onDeleteProfile();
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-zinc-900 md:bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-800 md:border-zinc-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-zinc-800 md:border-zinc-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-white md:text-zinc-950">Edit Profile</h3>
                <p className="text-[11px] text-zinc-400 md:text-zinc-500 font-medium">Update your public profile details</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-zinc-400 hover:text-zinc-200 md:hover:text-zinc-600 hover:bg-zinc-800 md:hover:bg-zinc-100 p-1.5 rounded-full transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Profile Photo Uploader */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-blue-600 shadow-md relative">
                    <img src={editAvatar || currentUser?.avatar} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Camera className="w-6 h-6" />
                    </div>
                  </div>
                  <button type="button" className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors cursor-pointer"><Camera className="w-3.5 h-3.5" /></button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-zinc-200 md:text-zinc-700">Profile Picture</span>
                  <p className="text-[10px] text-zinc-400">Click to upload a custom JPG or PNG</p>
                </div>
                {avatarError && <p className="text-xs text-red-400 md:text-red-500 font-semibold">{avatarError}</p>}
              </div>

              {/* Banner Photo Uploader */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative group cursor-pointer w-full" onClick={() => bannerInputRef.current?.click()}>
                  <div className="w-full h-32 rounded-2xl overflow-hidden border-2 border-indigo-600 shadow-md relative bg-zinc-950 md:bg-zinc-100">
                    {editBanner || currentUser?.banner ? (
                      <img src={editBanner || currentUser?.banner} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-zinc-950 md:bg-gradient-to-r md:from-blue-600 md:via-indigo-600 md:to-blue-800" />
                    )}
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Camera className="w-6 h-6" />
                    </div>
                  </div>
                  <button type="button" className="absolute bottom-2 right-2 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-colors cursor-pointer"><Camera className="w-3.5 h-3.5" /></button>
                  <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={handleBannerChange} />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-zinc-200 md:text-zinc-700">Cover Banner</span>
                  <p className="text-[10px] text-zinc-400">Click to upload a custom JPG or PNG</p>
                </div>
                {bannerError && <p className="text-xs text-red-400 md:text-red-500 font-semibold">{bannerError}</p>}
              </div>
              {/* Name Field (Read-only) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 md:text-zinc-500">Name</label>
                <div className="px-4 py-3 bg-zinc-950 md:bg-zinc-50 border border-zinc-800 md:border-zinc-200 rounded-2xl">
                  <span className="text-sm font-semibold text-zinc-300 md:text-zinc-600">{currentUser?.name || "Reviewer"}</span>
                </div>
              </div>

              {/* Bio Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 md:text-zinc-500">Bio</label>
                  <span className="text-[10px] font-bold text-zinc-400">{editBio.length} / 160</span>
                </div>
                <textarea 
                  value={editBio} 
                  onChange={(e) => setEditBio(e.target.value.slice(0, 160))} 
                  rows={3} 
                  placeholder="Introduce yourself to other reviewers! What are your favorite places, foods, or hobbies?"
                  className="w-full bg-zinc-950 md:bg-zinc-50 border border-zinc-800 md:border-zinc-200 rounded-2xl p-4 text-sm text-white md:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all placeholder:text-zinc-500 md:placeholder:text-zinc-400" 
                />
              </div>

              {/* Structured Location Fields */}
              <div className="space-y-3">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 md:text-zinc-500 block mb-1">Location</label>
                
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide pl-1 block">Country</span>
                  <CountrySelector 
                    value={editCountry} 
                    onChange={(country) => {
                      setEditCountry(country);
                      setEditCity("");
                      setEditState("");
                    }} 
                  />
                </div>

                {editCountry && (() => {
                  const countryConfig = locationData[editCountry];
                  const hasStates = countryConfig?.hasStates || false;
                  const stateLabel = countryConfig?.stateLabel || "State / Prov";
                  const stateOptions = countryConfig?.states || [];

                  let cityOptions: string[] = [];
                  if (countryConfig) {
                    if (Array.isArray(countryConfig.cities)) {
                      cityOptions = countryConfig.cities;
                    } else {
                      if (editState) {
                        cityOptions = countryConfig.cities[editState] || [];
                      } else {
                        cityOptions = Object.values(countryConfig.cities).flat();
                      }
                    }
                  }

                  return (
                    <div className="grid grid-cols-2 gap-3 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                      {hasStates ? (
                        <>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide pl-1 block">{stateLabel}</span>
                            <SearchableComboSelector
                              value={editState}
                              onChange={(val) => {
                                setEditState(val);
                                if (countryConfig && !Array.isArray(countryConfig.cities)) {
                                  const allowedCities = countryConfig.cities[val] || [];
                                  const primaryCity = allowedCities.find(c => c.toLowerCase() === val.toLowerCase());
                                  if (primaryCity) {
                                    setEditCity(primaryCity);
                                  } else if (allowedCities.length === 1) {
                                    setEditCity(allowedCities[0]);
                                  } else if (editCity && !allowedCities.includes(editCity)) {
                                    setEditCity("");
                                  }
                                }
                              }}
                              options={stateOptions}
                              placeholder={`e.g. ${stateOptions[0] || "NY"}`}
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide pl-1 block">City</span>
                            <SearchableComboSelector
                              value={editCity}
                              onChange={setEditCity}
                              options={cityOptions}
                              placeholder={
                                cityOptions.length > 0
                                  ? `e.g. ${cityOptions[0]}`
                                  : editState
                                    ? `e.g. City in ${editState}`
                                    : "e.g. New York"
                              }
                            />
                          </div>
                        </>
                      ) : (
                        <div className="space-y-1 col-span-2">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide pl-1 block">City</span>
                          <SearchableComboSelector
                            value={editCity}
                            onChange={setEditCity}
                            options={cityOptions}
                            placeholder={cityOptions.length > 0 ? `e.g. ${cityOptions[0]}` : "e.g. Paris"}
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Actions & Buttons */}
              <div className="flex gap-3 pt-3 border-t border-zinc-800 md:border-zinc-100">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 rounded-2xl border border-zinc-800 md:border-zinc-200 text-sm font-bold text-zinc-300 md:text-zinc-700 hover:bg-zinc-800 md:hover:bg-zinc-50 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-2xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors cursor-pointer">Save Changes</button>
              </div>

              {/* Account Management & Danger Zone (Industry Standard Best Practice) */}
              {onDeleteProfile && (
                <div className="pt-3 border-t border-zinc-800 md:border-zinc-100 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 md:text-zinc-400 block">
                    Account Management
                  </span>
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-red-950/40 md:bg-red-50/70 border border-red-900/50 md:border-red-100">
                    <div className="space-y-0.5 pr-2">
                      <p className="text-xs font-bold text-red-200 md:text-red-950">Delete Profile & Account</p>
                      <p className="text-[11px] text-red-300/80 md:text-red-700/80 leading-snug">
                        Permanently remove your profile, videos, and review data.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditModalOpen(false);
                        setIsDeleteAccountModalOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-zinc-900 md:bg-white border border-red-800 md:border-red-200 text-red-400 md:text-red-600 hover:bg-red-600 hover:text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs"
                    >
                      Delete
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
        shareUrl={`${window.location.origin}/creator/${(author.name || "user").replace(/\s+/g, "").toLowerCase()}`}
        title={author.name}
        subtitle="Reviewer Profile"
      />
    </>
  );
};
