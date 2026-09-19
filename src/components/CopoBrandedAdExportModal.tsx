import React, { useState } from 'react';
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
  FileVideo,
  ShieldCheck
} from 'lucide-react';
import { VideoReview, Place } from '../types';
import { exportBrandedAdVideo, downloadOriginalLosslessVideo, BrandedExportProgress } from '../utils/brandedVideoExporter';
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
    status: 'idle',
    progress: 0,
    message: '',
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadingRaw, setIsDownloadingRaw] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);

  if (!isOpen || !video) return null;

  const placeName = place?.name || video.placeName || 'Yoouz';
  const placeSlug = getPlaceSlug(place || { name: placeName, id: video.placeId });
  const adDestinationUrl = `https://www.yoouz.com/v/${placeSlug}`;

  const handleDownloadBranded = async () => {
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

  const handleDownloadRaw = async () => {
    if (isDownloadingRaw) return;
    setIsDownloadingRaw(true);
    try {
      await downloadOriginalLosslessVideo(video, place);
    } finally {
      setIsDownloadingRaw(false);
    }
  };

  const handleCopyAdLink = () => {
    navigator.clipboard.writeText(adDestinationUrl);
    setIsCopiedLink(true);
    setTimeout(() => setIsCopiedLink(false), 2500);
  };

  return (
    <div 
      id="branded-video-export-modal" 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-zinc-950 border border-zinc-800/90 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Clean Header */}
        <div className="px-6 py-5 border-b border-zinc-800/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <Star className="w-4 h-4 fill-white text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Download Video Review</h3>
              <p className="text-[11px] text-zinc-400">High-Resolution Ad Formats</p>
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
        <div className="p-6 space-y-4 text-zinc-300">
          
          {/* Card 1: Primary Branded Ad Video */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 space-y-3.5 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Branded for Ads</span>
                  <span className="text-[9px] bg-white text-black font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    Ultra-HD MP4
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Includes venue pill, star rating & watermark for TikTok, Meta & Reels
                </p>
              </div>
            </div>

            {/* Progress Bar (Visible while exporting or upon completion) */}
            {isExporting && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-300 flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                    <span>{exportState.message || 'Rendering video...'}</span>
                  </span>
                  <span className="font-bold text-white font-mono">{exportState.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className="h-full bg-white transition-all duration-300"
                    style={{ width: `${exportState.progress}%` }}
                  />
                </div>
              </div>
            )}

            {exportState.status === 'completed' && !isExporting && (
              <div className="flex items-center gap-1.5 text-[11px] text-white font-medium bg-white/5 py-1.5 px-3 rounded-lg border border-white/10">
                <CheckCircle className="w-3.5 h-3.5 text-white shrink-0" />
                <span>Video downloaded successfully!</span>
              </div>
            )}

            <button
              id="download-branded-ad-btn"
              onClick={handleDownloadBranded}
              disabled={isExporting}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                isExporting
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
                  : 'bg-white hover:bg-zinc-200 text-black active:scale-98'
              }`}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500" />
                  <span>Rendering Branded Video ({exportState.progress}%)...</span>
                </>
              ) : exportState.status === 'completed' ? (
                <>
                  <Download className="w-3.5 h-3.5 text-black" />
                  <span>Re-Download Branded Video (MP4)</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-black" />
                  <span>Download Branded Video (MP4)</span>
                </>
              )}
            </button>
          </div>

          {/* Card 2: Original Raw Master */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center shrink-0">
                <FileVideo className="w-3.5 h-3.5 text-zinc-300" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">Original Raw Video</div>
                <div className="text-[10px] text-zinc-400 truncate">Clean capture without overlays</div>
              </div>
            </div>

            <button
              id="download-raw-video-btn"
              onClick={handleDownloadRaw}
              disabled={isDownloadingRaw}
              className="py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-[11px] border border-zinc-700 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
            >
              {isDownloadingRaw ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-white" />
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <Download className="w-3 h-3 text-white" />
                  <span>Download Raw</span>
                </>
              )}
            </button>
          </div>

          {/* Card 3: Ad Campaign Destination URL */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Link className="w-3 h-3 text-zinc-400" />
                Ad Campaign Link
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">Meta / TikTok CTA</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={adDestinationUrl}
                className="w-full bg-black/60 border border-zinc-700/80 rounded-xl px-3 py-1.5 text-xs text-zinc-200 font-mono select-all focus:outline-none"
              />
              <button
                id="copy-ad-link-btn"
                onClick={handleCopyAdLink}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  isCopiedLink
                    ? 'bg-white text-black'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                }`}
              >
                {isCopiedLink ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Simple Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800/70 bg-zinc-900/40 flex items-center justify-end">
          <button
            id="close-modal-bottom-btn"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

