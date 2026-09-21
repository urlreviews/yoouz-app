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
        <div className="p-6 space-y-5 text-zinc-300">
          
          {/* Summary Features Pill */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
                Included Video Overlays
              </span>
              <span className="text-[10px] bg-white/10 text-white font-bold px-2 py-0.5 rounded-full border border-white/15">
                Ready for Social & Ads
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-zinc-300 bg-zinc-950/70 px-3 py-2 rounded-xl border border-zinc-800/80">
                <span className="text-[11px] text-zinc-400">Venue & Rating</span>
                <span className="font-semibold text-white truncate max-w-[170px] flex items-center gap-1 text-[11px]">
                  {placeName} • ⭐ {rawRating.toFixed(1)}
                </span>
              </div>

              <div className="flex items-center justify-between text-zinc-300 bg-zinc-950/70 px-3 py-2 rounded-xl border border-zinc-800/80">
                <span className="text-[11px] text-zinc-400">Reviewer & Stars</span>
                <span className="font-semibold text-white truncate max-w-[170px] text-[11px]">
                  By {authorName} ✓
                </span>
              </div>

              <div className="flex items-center justify-between text-zinc-300 bg-zinc-950/70 px-3 py-2 rounded-xl border border-zinc-800/80">
                <span className="text-[11px] text-zinc-400">Trust Watermark</span>
                <span className="font-bold text-white text-[11px]">
                  Powered by yoouz.com
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar (Visible when exporting) */}
          {isExporting && (
            <div className="space-y-1.5">
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
            <div className="flex items-center gap-2 text-xs text-white font-medium bg-white/10 py-2 px-3 rounded-xl border border-white/20">
              <CheckCircle className="w-4 h-4 text-white shrink-0" />
              <span>Video downloaded successfully!</span>
            </div>
          )}

          {/* Single Main Action Button */}
          <button
            id="download-branded-ad-btn"
            onClick={handleDownloadVideo}
            disabled={isExporting}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl ${
              isExporting
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
                : 'bg-white hover:bg-zinc-200 text-black active:scale-98'
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


