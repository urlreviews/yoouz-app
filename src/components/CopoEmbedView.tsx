import React, { useState, useRef, useEffect } from "react";
import { VideoReview, Place, VideoAuthor } from "../types";
import { getPlaceSlug, formatBusinessName, resolveSafeAuthor, getSafeAvatarUrl } from "../utils/placeUtils";
import { getPlaceLogoUrl, getCleanLogoUrl } from "../utils/logoUtils";
import { useGlobalMute, ensureSharedAudioContextUnlocked } from "../hooks/useGlobalMute";
import { resolvePlayableVideoSource, resolveVideoPosterUrl } from "../utils/videoUtils";
import { formatRecordedDate } from "../utils/dateUtils";
import { generateGoogleLetterAvatarSvg } from "../lib/avatar";
import {
  CheckCircle,
  Star,
  Video,
  Volume2,
  VolumeX,
  Play,
  Pause,
  MessageCircle,
  Share2,
  Heart,
  Bookmark,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Plus,
  Check,
  Clock,
  X,
  Flag
} from "lucide-react";

interface CopoEmbedViewProps {
  embedId: string;
  places: Place[];
  videos: VideoReview[];
  currentUser?: any;
  onOpenComments?: (video: VideoReview) => void;
  onOpenShare?: (video: VideoReview) => void;
  onRecordReview?: (place?: Place) => void;
  onOpenAuth?: () => void;
}

export const CopoEmbedView: React.FC<CopoEmbedViewProps> = ({
  embedId,
  places,
  videos,
  currentUser,
  onOpenComments,
  onOpenShare,
  onRecordReview,
  onOpenAuth
}) => {
  const [isMuted, , , toggleMute] = useGlobalMute();
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [bookmarkedMap, setBookmarkedMap] = useState<Record<string, boolean>>({});
  const [followedMap, setFollowedMap] = useState<Record<string, boolean>>({});
  const [progressPct, setProgressPct] = useState<number>(0);
  const [showHeartBurst, setShowHeartBurst] = useState<boolean>(false);
  const [moreMenuVideo, setMoreMenuVideo] = useState<VideoReview | null>(null);
  const lastTapRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Check if running inside an iframe or standalone
  const isFramed = React.useMemo(() => {
    try {
      return typeof window !== "undefined" && window.self !== window.top;
    } catch (e) {
      return true;
    }
  }, []);

  // Check if embedId matches a specific video directly
  const specificVideo = React.useMemo(() => {
    if (!embedId) return null;
    const clean = embedId.toLowerCase().trim();
    return videos.find((v) => v && (v.id === embedId || v.id.toLowerCase() === clean)) || null;
  }, [videos, embedId]);

  // Normalize embed ID / slug
  let cleanSlug = (embedId || "yoouz.com").toLowerCase().trim();
  if (specificVideo) {
    cleanSlug = getPlaceSlug(specificVideo.placeId || specificVideo.placeName);
  } else if (cleanSlug.includes("place-custom") || cleanSlug.includes("yoouz")) {
    cleanSlug = "yoouz.com";
  }

  // Resolve target place
  const targetPlace: Place = React.useMemo(() => {
    const found = places.find((p) => {
      const pSlug = getPlaceSlug(p);
      return (
        pSlug === cleanSlug ||
        p.id === cleanSlug ||
        p.name.toLowerCase().trim() === cleanSlug ||
        (p.website && getPlaceSlug(p.website) === cleanSlug)
      );
    });

    if (found) return found;

    // Fallback default business synthesis if not in places array
    const isYoouz = cleanSlug === "yoouz.com" || cleanSlug === "yoouz";
    return {
      id: isYoouz ? "yoouz.com" : cleanSlug,
      name: isYoouz ? "Yoouz" : cleanSlug.split(".")[0].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      rating: 5.0,
      totalReviews: 0,
      website: isYoouz ? "https://yoouz.com" : `https://www.${cleanSlug}`,
      logoUrl: isYoouz
        ? "/icon-512.png"
        : getCleanLogoUrl(`https://www.${cleanSlug}`) || `https://logo.clearbit.com/${cleanSlug}`,
      isClaimed: true
    } as Place;
  }, [places, cleanSlug]);

  // Filter videos belonging strictly to this business
  const matchingVideos = React.useMemo(() => {
    const matched = videos.filter((v) => {
      if (!v) return false;
      if (cleanSlug === "yoouz.com" || cleanSlug === "yoouz") {
        return (
          v.placeId === "yoouz.com" ||
          v.placeId === "place-custom-yoouz-com" ||
          v.placeId === "place-custom" ||
          (v.placeName && v.placeName.toLowerCase().includes("yoouz"))
        );
      }
      const vSlug = getPlaceSlug(v.placeId || v.placeName);
      return (
        vSlug === cleanSlug ||
        v.placeId === cleanSlug ||
        (v.placeName && v.placeName.toLowerCase().trim() === cleanSlug)
      );
    });

    // If a specific video was targeted by ID, prioritize it first
    if (specificVideo && matched.some((v) => v.id === specificVideo.id)) {
      return [specificVideo, ...matched.filter((v) => v.id !== specificVideo.id)];
    }

    return matched;
  }, [videos, cleanSlug, specificVideo]);

  const currentVideo = matchingVideos[currentIndex] || null;

  // Video Autoplay & Mute Handling
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    videoEl.muted = isMuted;

    if (isPlaying) {
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          setIsPlaying(false);
        });
      }
    } else {
      videoEl.pause();
    }
  }, [currentIndex, isPlaying, isMuted, currentVideo]);

  const handleTogglePlay = () => {
    ensureSharedAudioContextUnlocked();
    setIsPlaying((prev) => !prev);
  };

  const handleVideoTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300 && currentVideo) {
      // Double tap to like
      setLikedMap((prev) => ({ ...prev, [currentVideo.id]: true }));
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 800);
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;
    handleTogglePlay();
  };

  const handleNextVideo = () => {
    if (matchingVideos.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % matchingVideos.length);
    setIsPlaying(true);
  };

  const handlePrevVideo = () => {
    if (matchingVideos.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + matchingVideos.length) % matchingVideos.length);
    setIsPlaying(true);
  };

  const handleToggleLike = (id: string) => {
    setLikedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const averageRating = React.useMemo(() => {
    if (matchingVideos.length === 0) return targetPlace.rating || 5.0;
    const sum = matchingVideos.reduce((acc, v) => acc + (v.rating || 5), 0);
    return Number((sum / matchingVideos.length).toFixed(1));
  }, [matchingVideos, targetPlace.rating]);

  return (
    <div className="w-full h-full min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-sans select-none antialiased">
      {/* Container: edge-to-edge inside iframes, centered phone card standalone */}
      <div
        className={`w-full h-full flex flex-col relative bg-zinc-950 overflow-hidden ${
          isFramed
            ? "rounded-none border-0"
            : "max-w-[420px] max-h-[100dvh] sm:h-[94vh] sm:max-h-[850px] sm:rounded-3xl sm:border sm:border-zinc-850 sm:shadow-2xl"
        }`}
      >
        {/* Top Progress Bar Scrubber */}
        {currentVideo && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-40">
            <div
              className="h-full bg-white transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(255,255,255,0.9)]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}

        {/* TOP OVERLAY HEADER: Business Profile Pill & Controls */}
        <div className="absolute top-0 left-0 right-0 z-40 p-3 pt-3.5 bg-gradient-to-b from-black/85 via-black/45 to-transparent flex items-center justify-between gap-2.5 pointer-events-none">
          <a
            href={targetPlace.website || "https://yoouz.com"}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-black/65 hover:bg-black/90 backdrop-blur-2xl border border-white/20 hover:border-white/40 text-white transition-all max-w-[280px] sm:max-w-[340px] text-left cursor-pointer shadow-xl active:scale-[0.98] min-w-0"
          >
            <img
              src={targetPlace.logoUrl || getPlaceLogoUrl(targetPlace)}
              alt={targetPlace.name}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-contain border border-white/25 bg-zinc-900/90 shrink-0 p-1 shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/icon-512.png";
              }}
            />
            <div className="min-w-0 flex-1 py-0.5">
              <span className="truncate flex items-center gap-1 leading-tight font-black text-[13px] sm:text-[14px] text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                <span className="truncate">{targetPlace.name}</span>
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white text-black shrink-0" />
              </span>
              <div className="flex items-center gap-1 text-[10px] text-amber-400 font-extrabold leading-none mt-0.5">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 shrink-0" />
                <span>{averageRating.toFixed(1)}</span>
                <span className="text-zinc-300 font-normal">({matchingVideos.length} {matchingVideos.length === 1 ? 'review' : 'reviews'})</span>
              </div>
            </div>
          </a>

          <div className="pointer-events-auto flex items-center gap-2">
            {/* Top Right Sound Mute / Unmute Button */}
            <button
              type="button"
              onClick={() => {
                ensureSharedAudioContextUnlocked();
                toggleMute();
              }}
              className="w-10 h-10 rounded-full bg-black/65 hover:bg-black/90 active:scale-90 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer shadow-xl"
              title={isMuted ? "Unmute sound" : "Mute sound"}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white stroke-[2.2] shrink-0" />
              ) : (
                <Volume2 className="w-5 h-5 text-white stroke-[2.2]" />
              )}
            </button>
          </div>
        </div>

        {/* MAIN MEDIA CONTENT AREA */}
        {currentVideo ? (() => {
          const safeAuthor = resolveSafeAuthor(currentVideo, currentUser);
          const isFollowed = followedMap[safeAuthor.name] || safeAuthor.isFollowed;

          return (
            <div className="relative flex-1 w-full h-full bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                src={resolvePlayableVideoSource(currentVideo)}
                poster={resolveVideoPosterUrl(currentVideo)}
                playsInline
                loop
                muted={isMuted}
                onClick={handleVideoTap}
                onTimeUpdate={(e) => {
                  const el = e.currentTarget;
                  if (el.duration) {
                    setProgressPct((el.currentTime / el.duration) * 100);
                  }
                }}
                className="w-full h-full object-cover cursor-pointer"
              />

              {/* Center Play Indicator */}
              {!isPlaying && (
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="absolute inset-0 m-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white cursor-pointer active:scale-90 hover:scale-105 transition-all duration-200 relative group shadow-2xl bg-black/50 hover:bg-black/75 backdrop-blur-xl border border-white/20 z-20"
                >
                  <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white translate-x-0.5" />
                </button>
              )}

              {/* Double Tap Heart Burst Animation */}
              {showHeartBurst && (
                <div className="absolute inset-0 m-auto w-24 h-24 flex items-center justify-center z-30 pointer-events-none animate-ping">
                  <Heart className="w-20 h-20 fill-rose-500 text-rose-500 drop-shadow-[0_0_20px_rgba(244,63,94,0.8)]" />
                </div>
              )}

              {/* RIGHT SIDE ACTION COLUMN (Matches Main App Video Feed Card) */}
              <aside className="absolute right-3 bottom-14 z-40 flex flex-col items-center gap-2.5 sm:gap-3 text-white pointer-events-auto shrink-0 mb-1">
                {/* Creator Avatar with Follow Badge */}
                <div className="relative group/avatar mb-0.5">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full p-0.5 border border-white/30 overflow-hidden bg-black shadow-xl">
                    <img
                      src={getSafeAvatarUrl(safeAuthor.avatar, safeAuthor.name, safeAuthor.handle)}
                      alt={safeAuthor.name}
                      className="w-full h-full object-cover rounded-full"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.src = generateGoogleLetterAvatarSvg(safeAuthor.name || "User", 128, safeAuthor.handle || safeAuthor.name);
                      }}
                    />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFollowedMap((prev) => ({ ...prev, [safeAuthor.name]: !prev[safeAuthor.name] }));
                    }}
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-md hover:scale-110 active:scale-90 transition-transform cursor-pointer border-2 border-zinc-950"
                    title={isFollowed ? "Following" : "Follow"}
                  >
                    {isFollowed ? (
                      <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                    ) : (
                      <Plus className="w-3 h-3 text-black stroke-[3]" />
                    )}
                  </button>
                </div>

                {/* Like Button */}
                <button
                  onClick={() => handleToggleLike(currentVideo.id)}
                  className="flex flex-col items-center gap-1 group cursor-pointer active:scale-90 transition"
                >
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/65 backdrop-blur-2xl border border-white/20 hover:border-white/50 flex items-center justify-center shadow-lg transition ${
                      likedMap[currentVideo.id]
                        ? "bg-rose-500/20 text-rose-500 border-rose-500/40"
                        : "text-white"
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${likedMap[currentVideo.id] ? "fill-rose-500 text-rose-500" : ""}`} />
                  </div>
                  <span className="text-[11px] font-extrabold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
                    {(currentVideo.likes || 0) + (likedMap[currentVideo.id] ? 1 : 0)}
                  </span>
                </button>

                {/* Comments Button */}
                <button
                  onClick={() => onOpenComments?.(currentVideo)}
                  className="flex flex-col items-center gap-1 group cursor-pointer active:scale-90 transition"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/65 backdrop-blur-2xl border border-white/20 hover:border-white/50 flex items-center justify-center shadow-lg text-white transition">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-extrabold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
                    {currentVideo.commentsCount || currentVideo.comments?.length || 0}
                  </span>
                </button>

                {/* Bookmark / Save Button */}
                <button
                  onClick={() => setBookmarkedMap((prev) => ({ ...prev, [currentVideo.id]: !prev[currentVideo.id] }))}
                  className="flex flex-col items-center gap-1 group cursor-pointer active:scale-90 transition"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/65 backdrop-blur-2xl border border-white/20 hover:border-white/50 flex items-center justify-center shadow-lg text-white transition">
                    <Bookmark className={`w-5 h-5 ${bookmarkedMap[currentVideo.id] ? "fill-amber-400 text-amber-400" : ""}`} />
                  </div>
                  <span className="text-[11px] font-extrabold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
                    {(currentVideo.bookmarksCount || 0) + (bookmarkedMap[currentVideo.id] ? 1 : 0)}
                  </span>
                </button>

                {/* Share Button */}
                <button
                  onClick={() => onOpenShare?.(currentVideo)}
                  className="flex flex-col items-center gap-1 group cursor-pointer active:scale-90 transition"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/65 backdrop-blur-2xl border border-white/20 hover:border-white/50 flex items-center justify-center shadow-lg text-white transition">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-extrabold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
                    {(currentVideo.sharesCount || 0)}
                  </span>
                </button>

                {/* More Options (...) Button */}
                <button
                  onClick={() => setMoreMenuVideo(currentVideo)}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/65 backdrop-blur-2xl border border-white/20 hover:border-white/50 flex items-center justify-center shadow-lg text-white transition active:scale-90 cursor-pointer"
                  title="More options"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>

                {/* Prev / Next Carousel Navigation Arrows */}
                {matchingVideos.length > 1 && (
                  <div className="flex flex-col gap-1.5 pt-1">
                    <button
                      onClick={handlePrevVideo}
                      className="w-8 h-8 rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-md active:scale-90 transition cursor-pointer"
                      title="Previous Video"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNextVideo}
                      className="w-8 h-8 rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-md active:scale-90 transition cursor-pointer"
                      title="Next Video"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </aside>

              {/* BOTTOM LEFT AUTHOR & CAPTION METADATA */}
              <footer className="absolute left-3 bottom-12 right-16 z-40 flex flex-col gap-1 pointer-events-auto text-left">
                <div className="flex items-center gap-1.5 font-extrabold text-white text-[15px] sm:text-[16px] drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                  <span className="whitespace-nowrap truncate leading-tight">By {safeAuthor.name}</span>
                  {safeAuthor.isVerified && (
                    <CheckCircle className="w-4 h-4 fill-white text-black inline shrink-0" />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < Math.round(currentVideo.rating || 5)
                            ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                            : "fill-zinc-600/70 text-zinc-200/80"
                        }`}
                      />
                    ))}
                  </div>
                  {(currentVideo.recordedAt || currentVideo.createdAtMs) && (
                    <span className="text-white/90 text-[11.5px] font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-white/80 shrink-0" />
                      <span>{formatRecordedDate(currentVideo.recordedAt, currentVideo.createdAtMs)}</span>
                    </span>
                  )}
                </div>

                {currentVideo.caption && (
                  <p className="text-white/95 text-xs font-medium line-clamp-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] mt-0.5">
                    {currentVideo.caption}
                  </p>
                )}

                {currentVideo.dishOrItem && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[10px] font-semibold text-white w-fit mt-0.5">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>{currentVideo.dishOrItem}</span>
                  </div>
                )}
              </footer>

              {/* BOTTOM PROGRESS SCRUBBER BAR */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-40">
                <div
                  className="h-full bg-white transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(255,255,255,0.9)]"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          );
        })() : (
          /* EMPTY STATE WHEN NO VIDEO REVIEWS ARE FOUND FOR THIS BUSINESS */
          <div className="flex-1 w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-6 text-center space-y-5">
            <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 p-2.5 shadow-2xl flex items-center justify-center">
              <img
                src={targetPlace.logoUrl || getPlaceLogoUrl(targetPlace)}
                alt={targetPlace.name}
                className="w-full h-full rounded-xl object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/icon-512.png";
                }}
              />
            </div>

            <div className="space-y-1.5 max-w-xs">
              <div className="flex items-center justify-center gap-1.5">
                <h3 className="text-lg font-black text-white tracking-tight">{targetPlace.name}</h3>
                <CheckCircle className="w-4 h-4 fill-white text-black shrink-0" />
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                No video reviews recorded yet. Be the first customer to share a live 60-second video review!
              </p>
            </div>

            <button
              onClick={() => onRecordReview?.(targetPlace)}
              className="px-5 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-700/80 hover:bg-zinc-800 hover:border-zinc-500 text-white text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-xl shadow-black/50 cursor-pointer"
            >
              <Video className="w-4 h-4 text-white shrink-0 stroke-[2.5]" />
              <span>Record 60s Video Review</span>
            </button>
          </div>
        )}

        {/* BOTTOM BRANDING FOOTER */}
        <div className="w-full bg-black/95 border-t border-zinc-900 px-3.5 py-2.5 shrink-0 z-30 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            <span className="font-medium text-zinc-300">Live Sync Powered by Yoouz</span>
          </div>

          <a
            href="https://yoouz.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-zinc-400 hover:text-white transition flex items-center gap-1"
          >
            <span>yoouz.com</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* MORE OPTIONS BOTTOM MODAL */}
      {moreMenuVideo && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-zinc-900 border border-zinc-800 p-4 space-y-3 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-sm font-bold text-white">Review Options</span>
              <button
                onClick={() => setMoreMenuVideo(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  onOpenShare?.(moreMenuVideo);
                  setMoreMenuVideo(null);
                }}
                className="w-full py-3 px-4 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 flex items-center gap-3 text-sm font-semibold text-white transition cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-zinc-300" />
                <span>Share Review</span>
              </button>

              <button
                onClick={() => {
                  setBookmarkedMap((prev) => ({ ...prev, [moreMenuVideo.id]: !prev[moreMenuVideo.id] }));
                  setMoreMenuVideo(null);
                }}
                className="w-full py-3 px-4 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 flex items-center gap-3 text-sm font-semibold text-white transition cursor-pointer"
              >
                <Bookmark className="w-4 h-4 text-zinc-300" />
                <span>{bookmarkedMap[moreMenuVideo.id] ? "Remove Bookmark" : "Save / Bookmark"}</span>
              </button>

              <button
                onClick={() => {
                  setMoreMenuVideo(null);
                }}
                className="w-full py-3 px-4 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 flex items-center gap-3 text-sm font-semibold text-rose-400 transition cursor-pointer"
              >
                <Flag className="w-4 h-4 text-rose-400" />
                <span>Report Review</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
