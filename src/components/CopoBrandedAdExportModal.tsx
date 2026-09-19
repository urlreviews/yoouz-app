import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  CheckCircle,
  Star,
  Sparkles,
  Link,
  Copy,
  Check,
  Loader2,
  ShieldCheck,
  Video
} from 'lucide-react';
import { VideoReview, Place } from '../types';
import { exportBrandedAdVideo, BrandedExportProgress } from '../utils/brandedVideoExporter';
import { getPlaceSlug } from '../utils/placeUtils';

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
    status: 'initializing',
    progress: 0,
    message: 'Preparing Ultra-HD video pipeline...',
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);

  useEffect(() => {
    if (isOpen && video && !isExporting && exportState.status !== 'completed') {
      // Auto start export when modal opens
      handleStartExport();
    }
  }, [isOpen, video]);

  if (!isOpen || !video) return null;

  const placeName = place?.name || video.placeName || 'Yoouz Verified';
  const authorName = video.author?.name || 'Verified Customer';
  const rawRating = typeof video.rating === 'number' && !isNaN(video.rating) ? video.rating : (Number(video.rating) || 5.0);
  const placeSlug = getPlaceSlug(place || { name: placeName, id: video.placeId });
  const adDestinationUrl = `https://www.yoouz.com/v/${placeSlug}`;

  const handleStartExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportState({
      status: 'initializing',
      progress: 5,
      message: 'Preparing Ultra-HD video canvas...',
    });

    const result = await exportBrandedAdVideo(video, place, (progress) => {
      setExportState(progress);
    });

    setIsExporting(false);
  };

  const handleCopyAdLink = () => {
    navigator.clipboard.writeText(adDestinationUrl);
    setIsCopiedLink(true);
    setTimeout(() => setIsCopiedLink(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Dark Mode Yoouz Branding */}
        <div className="px-6 py-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-white/20 flex items-center justify-center text-white shadow-lg">
              <Star className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Branded Video for Ads</span>
                <span className="text-[10px] bg-white/10 text-white font-extrabold px-2.5 py-0.5 rounded-full border border-white/20 uppercase tracking-wider">
                  Ultra-HD MP4
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Ready for Meta (Instagram & Facebook), TikTok & Google Ads
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center border border-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-zinc-300">
          
          {/* Burned-in Feature Elements in Studio Dark Mode */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-300" />
                Baked-in Video Elements
              </span>
              <span className="text-white bg-white/10 px-2 py-0.5 rounded-full border border-white/15 text-[11px] font-bold">
                100% Ad Compliant
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <span>Top Venue Header</span>
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="text-[11px] text-zinc-400 truncate">
                  {placeName} • ⭐ {rawRating.toFixed(1)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <span>Author & Rating</span>
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="text-[11px] text-zinc-400 truncate">
                  By {authorName} • 5 Stars
                </div>
              </div>

              <div className="col-span-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-white/20 flex items-center justify-center shrink-0">
                    <Star className="w-3.5 h-3.5 fill-white text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Trust Watermark</div>
                    <div className="text-[11px] text-zinc-400">
                      Powered by <span className="text-white font-bold">yoouz.com</span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md font-mono border border-zinc-700/60">
                  Audio & Stereo Preserved
                </span>
              </div>
            </div>
          </div>

          {/* Progress / Status Display */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-300 flex items-center gap-2">
                {isExporting ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : exportState.status === 'completed' ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : (
                  <Sparkles className="w-4 h-4 text-zinc-300" />
                )}
                <span>{exportState.message}</span>
              </span>
              <span className="font-bold text-white font-mono">{exportState.progress}%</span>
            </div>

            {/* High Contrast Dark Mode Progress Bar */}
            <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <div
                className={`h-full transition-all duration-300 ${
                  exportState.status === 'completed'
                    ? 'bg-white'
                    : exportState.status === 'error'
                    ? 'bg-red-500'
                    : 'bg-gradient-to-r from-zinc-200 via-white to-zinc-400'
                }`}
                style={{ width: `${exportState.progress}%` }}
              />
            </div>
          </div>

          {/* Campaign Destination Link for Ads */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-zinc-300" />
                Ad Campaign Destination URL
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">TikTok / Meta Ads CTA</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Paste this link into your ad campaign settings so viewers directly open your business profile, menu, and customer video reviews on Yoouz:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={adDestinationUrl}
                className="w-full bg-black/60 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono select-all focus:outline-none"
              />
              <button
                onClick={handleCopyAdLink}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  isCopiedLink
                    ? 'bg-white text-black'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                }`}
              >
                {isCopiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-800/80 bg-zinc-900/60 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            onClick={handleStartExport}
            disabled={isExporting}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xl ${
              isExporting
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
                : 'bg-white hover:bg-zinc-200 text-black active:scale-95'
            }`}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                <span>Generating Ultra-HD Video ({exportState.progress}%)...</span>
              </>
            ) : exportState.status === 'completed' ? (
              <>
                <Download className="w-4 h-4 text-black" />
                <span>Re-Download Video</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-black" />
                <span>Start Video Generation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
