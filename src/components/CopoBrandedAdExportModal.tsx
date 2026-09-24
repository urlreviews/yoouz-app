import React, { useState } from 'react';
import {
  X,
  Download,
  CheckCircle,
  Star,
  Loader2
} from 'lucide-react';
import { VideoReview, Place } from '../types';
import { exportBrandedAdVideo, BrandedExportProgress } from '../utils/brandedVideoExporter';
import { getProxiedImageUrl } from '../utils/logoUtils';

interface CopoBrandedAdExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: VideoReview | null;
  place?: Place | { name?: string; rating?: number; reviewsCount?: number; logoUrl?: string; website?: string };
}

export const CopoBrandedAdExportModal: React.FC<CopoBrandedAdExportModalProps> = ({
  isOpen,
  onClose,
  video,
  place
}) => {
  const [exportState, setExportState] = useState<BrandedExportProgress>({
    status: 'idle',
    progress: 0,
    message: '',
  });
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !video) return null;

  const placeName = place?.name || video.placeName || 'Yoouz';
  const authorName = video.author?.name || (video as any)?.authorName || 'Steven Akan';
  const rawRating = typeof video.rating === 'number' && !isNaN(video.rating) ? video.rating : (Number(video.rating) || 5.0);
  const ratingScore = rawRating.toFixed(1);
  const ratingNum = Math.round(Number(ratingScore));
  const avatarUrl = (video.author as any)?.avatarUrl || video.author?.avatar || (video as any).authorAvatar || "";
  const placeLogoUrl = place?.logoUrl || video.placeLogoUrl || (video as any).logoUrl || "";

  const rawTargetDomain =
    (video as any)?.placeDomain ||
    place?.website ||
    ((place as any)?.id && (place as any).id.includes('.') ? (place as any).id : null) ||
    (video.placeName && video.placeName.includes('.') ? video.placeName.toLowerCase() : null) ||
    ((placeName || 'yoouz').toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
  let targetDomain = (rawTargetDomain || 'yoouz.com').toLowerCase().trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].split('?')[0];
  if (!targetDomain.includes('.')) targetDomain += '.com';

  const handleDownloadVideo = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportState({
      status: 'initializing',
      progress: 10,
      message: 'Preparing Ultra-HD video...',
    });

    await exportBrandedAdVideo(video, place, (progress) => {
      setExportState(progress);
    });

    setIsExporting(false);
  };

  return (
    <div 
      id="branded-video-export-modal" 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-sm sm:max-w-md bg-zinc-950 border border-zinc-800/90 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <Star className="w-4 h-4 fill-white text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Download Video Review</h3>
              <p className="text-[11px] text-zinc-400">Ultra-HD with Full Branding</p>
            </div>
          </div>
          <button
            id="close-export-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center border border-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-zinc-300">
          
          {/* EXACT SHARE CARD PREVIEW (100% IDENTICAL TO SHARE MODAL) */}
          <div className="relative w-full rounded-2xl overflow-hidden border border-zinc-750/90 bg-zinc-950 shadow-xl select-none group">
            <div className="relative aspect-[16/9] w-full overflow-hidden flex items-center justify-center bg-black">
              {/* Clean video thumbnail */}
              <img
                src={getProxiedImageUrl(video.thumbnailUrl || '')}
                alt={placeName}
                className="absolute inset-0 w-full h-full object-cover filter brightness-95"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/api/avatar?name=' + encodeURIComponent(placeName) + '&background=27272a&color=fff&size=128';
                }}
              />

              {/* Ambient dark gradient vignette matching Share Card */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/60 pointer-events-none" />

              {/* TOP LEFT: Business Squircle Logo & Rating Pill (Matches Screenshot 3) */}
              <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-2 px-2.5 py-1.5 rounded-2xl bg-black/85 backdrop-blur-md border border-white/20 shadow-lg min-w-0 max-w-[70%]">
                {/* Left Squircle Logo Container */}
                <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-white/25 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                  {placeLogoUrl ? (
                    <img src={placeLogoUrl} alt={placeName} className="w-6 h-6 object-contain" />
                  ) : (
                    <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  )}
                </div>
                {/* Text column */}
                <div className="flex flex-col min-w-0 justify-center">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-white text-xs font-bold truncate leading-tight">{placeName}</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs">
                      <svg className="w-2 h-2 text-zinc-950 stroke-[2.8]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                  <div className="flex items-center gap-1 leading-tight mt-0.5">
                    <span className="text-amber-400 text-[10px]">★</span>
                    <span className="text-amber-400 text-[11px] font-bold">{ratingScore}</span>
                  </div>
                </div>
              </div>

              {/* CENTER: Play Button overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-black/55 backdrop-blur-md border border-white/40 flex items-center justify-center text-white shadow-2xl transition-transform group-hover:scale-105">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-white ml-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>

              {/* BOTTOM LEFT: Reviewer Profile Pill (Matches Screenshot 4) */}
              <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-black/85 backdrop-blur-md border border-white/20 shadow-lg min-w-0 max-w-[75%] pointer-events-none">
                {/* Circular Avatar */}
                <div className="w-9 h-9 rounded-full overflow-hidden border border-white/30 bg-lime-600 shrink-0 shadow-xs flex items-center justify-center">
                  {avatarUrl ? (
                    <img
                      src={getProxiedImageUrl(avatarUrl)}
                      alt={authorName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = `/api/avatar?name=${encodeURIComponent(authorName)}&background=65a30d&color=fff&bold=true&size=128`;
                      }}
                    />
                  ) : (
                    <span className="text-white text-sm font-bold">{authorName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                {/* 3 Lines of Text */}
                <div className="flex flex-col min-w-0 justify-center">
                  {/* Line 1: By AuthorName + Verified badge */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-white text-xs font-bold truncate leading-tight">By {authorName}</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs">
                      <svg className="w-2 h-2 text-zinc-950 stroke-[2.8]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                  {/* Line 2: 5 Stars */}
                  <div className="flex items-center gap-0.5 leading-none my-0.5">
                    {[1, 2, 3, 4, 5].map((starIdx) => (
                      <span
                        key={starIdx}
                        className={`text-[10px] ${starIdx <= ratingNum ? 'text-amber-400' : 'text-zinc-600'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  {/* Line 3: Video review for domain */}
                  <span className="text-zinc-400 text-[10px] leading-tight truncate">
                    Video review for {targetDomain}
                  </span>
                </div>
              </div>

              {/* BOTTOM RIGHT: yoouz.com watermark badge with red live dot */}
              <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white shrink-0 shadow-md pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span>yoouz.com</span>
              </div>

            </div>
          </div>

          {/* Progress Bar (Visible when exporting) */}
          {isExporting && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-300 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                  <span>{exportState.message || 'Rendering video...'}</span>
                </span>
                <span className="font-bold text-white font-mono">{exportState.progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${exportState.progress}%` }}
                />
              </div>
            </div>
          )}

          {exportState.status === 'completed' && !isExporting && (
            <div className="flex items-center gap-2 text-xs text-white font-medium bg-white/10 py-2 px-3 rounded-xl border border-white/20 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Video downloaded successfully!</span>
            </div>
          )}

          {/* Single Main Action Button */}
          <button
            id="download-branded-ad-btn"
            onClick={handleDownloadVideo}
            disabled={isExporting}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl ${
              isExporting
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
                : 'bg-white hover:bg-zinc-100 text-black active:scale-98'
            }`}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                <span>Rendering Video ({exportState.progress}%)...</span>
              </>
            ) : exportState.status === 'completed' ? (
              <>
                <Download className="w-4 h-4 text-black" />
                <span>Re-Download Video</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-black" />
                <span>Download Video</span>
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  );
};
