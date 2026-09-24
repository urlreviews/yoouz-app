import React, { useState } from 'react';
import {
  X,
  Download,
  CheckCircle,
  Star,
  Loader2,
  ShieldCheck,
  Check
} from 'lucide-react';
import { VideoReview, Place } from '../types';
import { exportBrandedAdVideo, BrandedExportProgress } from '../utils/brandedVideoExporter';
import { getProxiedImageUrl } from '../utils/logoUtils';
import { formatRecordedDate } from '../utils/dateUtils';

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
  const avatarUrl = (video.author as any)?.avatarUrl || video.author?.avatar || (video as any).authorAvatar || "";

  // Exact reviews count logic from exporter to match branding
  let reviewsCount = 1;
  if (typeof (place as any)?.reviewsCount === 'number' && (place as any).reviewsCount > 0) {
    reviewsCount = (place as any).reviewsCount;
  } else if (typeof (place as any)?.reviewCount === 'number' && (place as any).reviewCount > 0) {
    reviewsCount = (place as any).reviewCount;
  } else if (typeof (video as any).reviewsCount === 'number' && (video as any).reviewsCount > 0) {
    reviewsCount = (video as any).reviewsCount;
  }

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
        className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800/90 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
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
        <div className="p-5 space-y-5 text-zinc-300">
          
          {/* HIGH-FIDELITY SOCIAL PREVIEW CARD (Matches exported 9:16 vertical video & actual burned-in overlays!) */}
          <div className="w-[180px] aspect-[9/16] mx-auto rounded-2xl overflow-hidden border border-zinc-750/90 bg-zinc-950 shadow-xl relative select-none group">
            <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-black">
              {/* Clean video thumbnail */}
              <img
                src={getProxiedImageUrl(video.thumbnailUrl || '')}
                alt={placeName}
                className="absolute inset-0 w-full h-full object-cover filter brightness-95"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/api/avatar?name=' + encodeURIComponent(placeName) + '&background=27272a&color=fff&size=128';
                }}
              />

              {/* Ambient dark gradient vignette to match canvas overlay drawing perfectly */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/55 pointer-events-none" />

              {/* TOP LEFT PILL: Place details matching Canvas */}
              <div className="absolute top-4 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/20 shadow-md max-w-[85%]">
                <div className="w-5 h-5 rounded bg-zinc-950 border border-white/20 flex items-center justify-center shrink-0">
                  <Star className="w-2.5 h-2.5 fill-white text-white" />
                </div>
                <div className="min-w-0 flex flex-col leading-none">
                  <span className="text-white text-[9px] font-black truncate flex items-center gap-0.5">
                    {placeName}
                    <span className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-white text-black text-[5.5px] font-bold">✓</span>
                  </span>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <span className="text-amber-400 text-[8px] font-bold">★ {rawRating.toFixed(1)}</span>
                    <span className="text-zinc-400 text-[7px] font-medium">({reviewsCount})</span>
                  </div>
                </div>
              </div>

              {/* TOP RIGHT PILL: Powered by Yoouz matching Canvas */}
              <div className="absolute top-4 right-3 flex items-center gap-1 px-1.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 shadow-md">
                <div className="w-3.5 h-3.5 rounded bg-zinc-950 border border-white/20 flex items-center justify-center shrink-0">
                  <Star className="w-1.5 h-1.5 fill-white text-white" />
                </div>
                <span className="text-[7px] text-zinc-300 font-medium whitespace-nowrap leading-none">
                  Powered by <strong className="text-white font-black">yoouz</strong>
                </span>
              </div>

              {/* CENTER: Play Button overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="w-10 h-10 rounded-full bg-black/55 backdrop-blur-md border border-white/35 flex items-center justify-center text-white shadow-2xl transition-transform group-hover:scale-105">
                  <svg className="w-4 h-4 fill-white ml-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>

              {/* BOTTOM LEFT OVERLAYS: Matches Canvas bottom overlays exactly! */}
              <div className="absolute bottom-4 left-3 right-3 text-left leading-normal pointer-events-none z-10">
                {/* Row 1: By Author */}
                <div className="flex items-center gap-1">
                  <span className="text-white text-[11px] font-black drop-shadow-md leading-none">
                    By {authorName}
                  </span>
                  <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-white text-black text-[7px] font-black shadow-xs leading-none">✓</span>
                </div>

                {/* Row 2: Star rating and Date */}
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex items-center gap-0.5 leading-none">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-[8.5px] leading-none ${i < Math.round(rawRating) ? 'text-amber-400' : 'text-zinc-600/80'}`}>★</span>
                    ))}
                  </div>
                  <span className="text-white/90 text-[8.5px] font-bold drop-shadow-sm flex items-center gap-0.5 leading-none">
                    🕒 {formatRecordedDate(video.recordedAt, video.createdAtMs) || '3 days ago'}
                  </span>
                </div>

                {/* Row 3: Caption/Video review for */}
                <p className="text-white/95 text-[9px] font-semibold leading-tight drop-shadow-md mt-1 line-clamp-1">
                  {video.caption?.trim() || `Video review for ${placeName}`}
                </p>
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


