import React, { useState } from "react";
import {
  Bookmark,
  BookmarkMinus,
  Star,
  Play,
  LayoutGrid,
  List,
  Trash2,
  Compass,
  MapPin,
  ChevronLeft
} from "lucide-react";
import { VideoReview, UserProfile } from "../types";
import { CopoVideoThumbnail } from "./CopoVideoThumbnail";
import { CopoAuthPrompt } from "./CopoGoogleAuthModal";

interface CopoBookmarksViewProps {
  bookmarkedVideos: VideoReview[];
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
  onOpenHelp?: () => void;
  onOpenLegal?: (tab: "terms" | "privacy") => void;
  onSelectVideo: (videoId: string) => void;
  onRemoveBookmark?: (videoId: string) => void;
  onNavigateHome?: () => void;
  onSuccessAuth?: (userData: { name: string; email: string; avatar: string }) => void;
}

type ViewMode = "grid" | "list";

export const CopoBookmarksView: React.FC<CopoBookmarksViewProps> = ({
  bookmarkedVideos,
  currentUser,
  onOpenAuth,
  onOpenHelp,
  onOpenLegal,
  onSelectVideo,
  onRemoveBookmark,
  onNavigateHome,
  onSuccessAuth
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Unauthenticated Gating View
  if (!currentUser) {
    return (
      <div className="flex-1 h-full overflow-y-auto bg-zinc-950 md:bg-white text-white md:text-zinc-900 flex flex-col justify-between pb-32 md:pb-6" >
        <CopoAuthPrompt
          intent="bookmarks"
          onOpenHelp={onOpenHelp}
          onOpenLegal={onOpenLegal}
          onSuccess={onSuccessAuth}
          isFullPage={true}
        />
      </div>
    );
  }

  // Helper to clean up any raw URL addresses in list views
  const cleanDisplayAddress = (address: string) => {
    if (!address) return "San Francisco";
    if (
      address.startsWith("http") ||
      address.includes("www.") ||
      address.includes(".com") ||
      address.includes(".fr") ||
      address.includes(".io")
    ) {
      return address.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "");
    }
    return address;
  };

  // Quick unsave handler
  const handleUnsave = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop navigation click
    if (onRemoveBookmark) {
      onRemoveBookmark(videoId);
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-zinc-950 md:bg-zinc-50 text-white md:text-zinc-900 p-4 md:p-8 select-none" style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800 md:border-zinc-200">
          <div className="flex items-center gap-3">
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="w-9 h-9 rounded-full bg-zinc-900 md:bg-zinc-100 hover:bg-zinc-800 md:hover:bg-zinc-200 text-zinc-300 md:text-zinc-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 active:scale-95 shadow-sm border border-zinc-800 md:border-zinc-200"
                title="Back to Feed"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
            )}
            <div className="w-10 h-10 rounded-full bg-zinc-900 md:bg-[#e8f0fe] text-blue-400 md:text-[#1a73e8] flex items-center justify-center shadow-xs border border-zinc-800 md:border-blue-100">
              <Bookmark className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white md:text-zinc-900 tracking-tight">Saved Bucket List</h2>
              <p className="text-xs text-zinc-400 md:text-zinc-500 font-medium">
                {bookmarkedVideos.length > 0
                  ? `You have curated ${bookmarkedVideos.length} visual recommendation${bookmarkedVideos.length > 1 ? "s" : ""}`
                  : "Curate your private visual guide"}
              </p>
            </div>
          </div>

          {/* Grid/List View Toggles */}
          {bookmarkedVideos.length > 0 && (
            <div className="flex items-center gap-2.5">
              <div className="bg-zinc-900 md:bg-zinc-100 p-1 rounded-lg flex items-center border border-zinc-800 md:border-zinc-200">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                    viewMode === "grid"
                      ? "bg-zinc-800 md:bg-white text-blue-400 md:text-[#1a73e8] shadow-xs"
                      : "text-zinc-400 md:text-zinc-500 hover:text-white md:hover:text-zinc-800"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                    viewMode === "list"
                      ? "bg-zinc-800 md:bg-white text-blue-400 md:text-[#1a73e8] shadow-xs"
                      : "text-zinc-400 md:text-zinc-500 hover:text-white md:hover:text-zinc-800"
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Saved Feed Container */}
        {bookmarkedVideos.length > 0 ? (
          viewMode === "grid" ? (
            /* ================= GRID VIEW ================= */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {bookmarkedVideos.map((video) => (
                <div
                  key={`saved-grid-${video.id}`}
                  onClick={() => onSelectVideo(video.id)}
                  className="group relative aspect-[9/15] rounded-2xl overflow-hidden bg-black border border-zinc-800 md:border-zinc-200 cursor-pointer shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all"
                >
                  {/* Video Thumbnail */}
                  <CopoVideoThumbnail
                    video={video}
                    alt={video.caption}
                    className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300 pointer-events-none"
                  />

                  {/* Dark gradient scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />

                  {/* Rating Badge */}
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-xs text-[10px] font-bold text-amber-300 flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    <span>{video.rating.toFixed(1)}</span>
                  </div>

                  {/* Direct Unsave Action */}
                  <button
                    onClick={(e) => handleUnsave(video.id, e)}
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 hover:bg-red-600/90 hover:scale-105 text-white flex items-center justify-center transition-all cursor-pointer opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    title="Remove from saved"
                  >
                    <BookmarkMinus className="w-4 h-4" />
                  </button>

                  {/* Metadata labels bottom */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="font-bold text-xs truncate leading-snug">{video.placeName}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-300 mt-1">
                      <span className="truncate">{video.author.name}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-400 shrink-0" />
                      <span className="shrink-0">{video.placeCategory}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ================= LIST VIEW ================= */
            <div className="space-y-3">
              {bookmarkedVideos.map((video) => (
                <div
                  key={`saved-list-${video.id}`}
                  onClick={() => onSelectVideo(video.id)}
                  className="group bg-zinc-900 md:bg-white rounded-2xl border border-zinc-800 md:border-zinc-200 p-4 hover:bg-zinc-800/80 md:hover:bg-zinc-50/80 cursor-pointer transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    
                    {/* Visual video thumbnail as left icon */}
                    <div className="relative w-12 h-16 rounded-xl overflow-hidden bg-black border border-zinc-800 md:border-zinc-200 shrink-0 shadow-xs">
                      <CopoVideoThumbnail
                        video={video}
                        alt={video.caption}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                      />
                      <div className="absolute inset-0 bg-black/15 pointer-events-none" />
                    </div>

                    {/* Metadata details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white md:text-zinc-900 text-sm truncate leading-snug">
                          {video.placeName}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-zinc-800 md:bg-zinc-100 text-zinc-300 md:text-zinc-500 text-[10px] font-bold border border-zinc-700 md:border-zinc-100 shrink-0">
                          {video.placeCategory}
                        </span>
                      </div>

                      {/* Location or rating */}
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400 md:text-zinc-500 mt-1">
                        <div className="flex items-center text-amber-400 md:text-amber-500 font-bold shrink-0">
                          <Star className="w-3.5 h-3.5 fill-current mr-0.5" />
                          <span>{video.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-zinc-600 md:text-zinc-300">|</span>
                        <div className="flex items-center gap-0.5 truncate text-[11px] font-medium">
                          <MapPin className="w-3 h-3 text-zinc-500 md:text-zinc-400" />
                          <span className="truncate">{cleanDisplayAddress(video.placeAddress || video.placeCity)}</span>
                        </div>
                      </div>

                      {/* Author / recommender */}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <img
                          src={video.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(video.author.name || "User")}&background=1a73e8&color=fff`}
                          alt={video.author.name}
                          className="w-4.5 h-4.5 rounded-full border border-zinc-800 md:border-zinc-100"
                        />
                        <span className="text-[10px] text-zinc-500 md:text-zinc-400 font-bold">
                          Recommended by <span className="text-zinc-300 md:text-zinc-600 hover:underline">{video.author.name}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions right */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => handleUnsave(video.id, e)}
                      className="p-2 rounded-full hover:bg-red-950/50 md:hover:bg-red-50 text-zinc-400 hover:text-red-400 md:hover:text-red-600 border border-zinc-800 md:border-zinc-200 hover:border-red-900/50 md:hover:border-red-100 transition-all cursor-pointer"
                      title="Unsave"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* ================= EMPTY STATE ================= */
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-zinc-900 md:bg-white rounded-3xl border border-zinc-800 md:border-zinc-200 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-zinc-800 md:bg-blue-50 border border-zinc-700 md:border-blue-100 flex items-center justify-center text-blue-400 md:text-[#1a73e8] mb-5 animate-pulse">
              <Bookmark className="w-7 h-7 fill-current" />
            </div>
            <h3 className="font-extrabold text-white md:text-zinc-800 text-base mb-1">
              Curate your private bucket list
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed font-semibold mb-6">
              Tap the bookmark icon on any video review in the discover feed to save locations or dining guides to your personal map!
            </p>

            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="px-5 py-2.5 rounded-full text-xs font-bold bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-md shadow-[#1a73e8]/25 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Discover amazing places</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
