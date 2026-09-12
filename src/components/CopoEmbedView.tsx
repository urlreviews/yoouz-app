import React, { useState, useRef, useEffect } from "react";
import { VideoReview, Place, VideoAuthor } from "../types";
import { getPlaceSlug, formatBusinessName } from "../utils/placeUtils";
import { getPlaceLogoUrl, getCleanLogoUrl } from "../utils/logoUtils";
import { useGlobalMute, ensureSharedAudioContextUnlocked } from "../hooks/useGlobalMute";
import { resolvePlayableVideoSource, resolveVideoPosterUrl } from "../utils/videoUtils";
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
  ChevronUp,
  ChevronDown,
  Sparkles,
  ExternalLink
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
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Normalize embed ID / slug
  let cleanSlug = (embedId || "yoouz.com").toLowerCase().trim();
  if (cleanSlug.includes("place-custom") || cleanSlug.includes("yoouz")) {
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
      rating: 4.9,
      totalReviews: 12,
      website: `https://www.${cleanSlug}`,
      logoUrl: isYoouz
        ? "https://www.yoouz.com/icon-512.png"
        : getCleanLogoUrl(`https://www.${cleanSlug}`) || `https://logo.clearbit.com/${cleanSlug}`,
      isClaimed: true
    } as Place;
  }, [places, cleanSlug]);

  // Filter videos belonging strictly to this business
  const matchingVideos = React.useMemo(() => {
    return videos.filter((v) => {
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
  }, [videos, cleanSlug]);

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

  return (
    <div className="w-full h-full min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-sans select-none">
      {/* Container Box matching 9:16 aspect ratio or responsive iframe */}
      <div className="w-full h-full max-w-[440px] max-h-[100dvh] flex flex-col relative bg-zinc-950 shadow-2xl overflow-hidden sm:rounded-3xl border border-zinc-900">
        
        {/* TOP OVERLAY HEADER: Business Info & Record Review CTA */}
        <div className="absolute top-0 left-0 right-0 z-30 p-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-2 shadow-lg">
            <img
              src={targetPlace.logoUrl || getPlaceLogoUrl(targetPlace)}
              alt={targetPlace.name}
              className="w-8 h-8 rounded-xl object-cover border border-white/15 bg-zinc-900 shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://www.yoouz.com/icon-512.png";
              }}
            />
            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-1">
                <span className="font-bold text-xs text-white truncate max-w-[130px] sm:max-w-[160px]">
                  {targetPlace.name}
                </span>
                <CheckCircle className="w-3.5 h-3.5 fill-white text-black shrink-0" />
              </div>
              <div className="flex items-center gap-1 text-[11px] text-zinc-300">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="font-bold">{targetPlace.rating.toFixed(1)}</span>
                <span className="text-zinc-400">({matchingVideos.length} reviews)</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onRecordReview?.(targetPlace)}
            className="px-3 py-2 rounded-2xl bg-white text-black hover:bg-zinc-100 text-xs font-bold flex items-center gap-1.5 transition-transform active:scale-95 shadow-lg shrink-0 cursor-pointer"
          >
            <Video className="w-3.5 h-3.5 text-black shrink-0" />
            <span>Review</span>
          </button>
        </div>

        {/* MAIN MEDIA CONTENT AREA */}
        {currentVideo ? (
          <div className="relative flex-1 w-full h-full bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              src={resolvePlayableVideoSource(currentVideo)}
              poster={resolveVideoPosterUrl(currentVideo)}
              playsInline
              loop
              muted={isMuted}
              onClick={handleTogglePlay}
              className="w-full h-full object-cover cursor-pointer"
            />

            {/* Play / Pause Center Indicator Overlay */}
            {!isPlaying && (
              <button
                onClick={handleTogglePlay}
                className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-2xl transition-transform active:scale-90 z-20 cursor-pointer"
              >
                <Play className="w-6 h-6 fill-white translate-x-0.5" />
              </button>
            )}

            {/* RIGHT SIDE CONTROLS OVERLAY */}
            <div className="absolute right-3 bottom-20 z-30 flex flex-col items-center gap-4">
              {/* Mute / Unmute Button */}
              <button
                onClick={() => {
                  ensureSharedAudioContextUnlocked();
                  toggleMute();
                }}
                className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white flex items-center justify-center shadow-lg hover:bg-black/80 transition cursor-pointer"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-white" />}
              </button>

              {/* Like Button */}
              <button
                onClick={() => handleToggleLike(currentVideo.id)}
                className="flex flex-col items-center gap-1 group cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center shadow-lg transition ${likedMap[currentVideo.id] ? "bg-rose-500/20 text-rose-500 border-rose-500/40" : "text-white"}`}>
                  <Heart className={`w-4.5 h-4.5 ${likedMap[currentVideo.id] ? "fill-rose-500 text-rose-500" : ""}`} />
                </div>
                <span className="text-[10px] font-bold text-white drop-shadow">
                  {(currentVideo.likes || 0) + (likedMap[currentVideo.id] ? 1 : 0)}
                </span>
              </button>

              {/* Comments Button */}
              <button
                onClick={() => onOpenComments?.(currentVideo)}
                className="flex flex-col items-center gap-1 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white flex items-center justify-center shadow-lg transition hover:bg-black/80">
                  <MessageCircle className="w-4.5 h-4.5" />
                </div>
                <span className="text-[10px] font-bold text-white drop-shadow">
                  {currentVideo.commentsCount || currentVideo.comments?.length || 0}
                </span>
              </button>

              {/* Share Button */}
              <button
                onClick={() => onOpenShare?.(currentVideo)}
                className="flex flex-col items-center gap-1 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white flex items-center justify-center shadow-lg transition hover:bg-black/80">
                  <Share2 className="w-4.5 h-4.5" />
                </div>
                <span className="text-[10px] font-bold text-white drop-shadow">Share</span>
              </button>

              {/* Prev / Next Video Carousel Navigation */}
              {matchingVideos.length > 1 && (
                <div className="flex flex-col gap-1.5 pt-2">
                  <button
                    onClick={handlePrevVideo}
                    className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white flex items-center justify-center shadow-md active:scale-90 transition cursor-pointer"
                    title="Previous Video"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextVideo}
                    className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white flex items-center justify-center shadow-md active:scale-90 transition cursor-pointer"
                    title="Next Video"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* BOTTOM LEFT AUTHOR & CAPTION OVERLAY */}
            <div className="absolute left-3 bottom-12 right-16 z-30 space-y-1.5 text-left bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2 rounded-2xl pointer-events-auto">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-white tracking-tight drop-shadow-md">
                  By {currentVideo.author?.name || "Verified Customer"}
                </span>
                <CheckCircle className="w-4 h-4 fill-white text-black shrink-0" />
              </div>

              {currentVideo.caption && (
                <p className="text-xs text-zinc-200 line-clamp-2 leading-snug drop-shadow-md font-medium">
                  {currentVideo.caption}
                </p>
              )}

              {currentVideo.dishOrItem && (
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[10px] font-semibold text-white">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>{currentVideo.dishOrItem}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* EMPTY STATE WHEN NO VIDEO REVIEWS ARE FOUND FOR THIS BUSINESS */
          <div className="flex-1 w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-6 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 p-2 shadow-2xl flex items-center justify-center">
              <img
                src={targetPlace.logoUrl || getPlaceLogoUrl(targetPlace)}
                alt={targetPlace.name}
                className="w-full h-full rounded-xl object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://www.yoouz.com/icon-512.png";
                }}
              />
            </div>

            <div className="space-y-1 max-w-xs">
              <div className="flex items-center justify-center gap-1.5">
                <h3 className="text-lg font-bold text-white tracking-tight">{targetPlace.name}</h3>
                <CheckCircle className="w-4 h-4 fill-white text-black shrink-0" />
              </div>
              <p className="text-xs text-zinc-400">
                No video reviews recorded yet. Be the first customer to share a live 60-second video review!
              </p>
            </div>

            <button
              onClick={() => onRecordReview?.(targetPlace)}
              className="px-5 py-2.5 rounded-2xl bg-white text-black hover:bg-zinc-100 text-xs font-black flex items-center gap-2 transition active:scale-95 shadow-xl cursor-pointer"
            >
              <Video className="w-4 h-4 text-black shrink-0" />
              <span>Record 60s Video Review</span>
            </button>
          </div>
        )}

        {/* BOTTOM BRANDING FOOTER */}
        <div className="w-full bg-black/90 border-t border-zinc-900 px-3 py-2 shrink-0 z-30 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            <span className="font-medium text-zinc-300">Live Sync Powered by Yoouz</span>
          </div>

          <a
            href="https://www.yoouz.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-zinc-400 hover:text-white transition flex items-center gap-1"
          >
            <span>yoouz.com</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
