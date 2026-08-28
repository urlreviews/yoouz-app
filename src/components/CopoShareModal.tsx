import React, { useState } from "react";
import {
  X,
  Facebook,
  Twitter,
  Mail,
  Copy,
  Check,
  Share2,
  Flag,
  Linkedin
} from "lucide-react";
import { VideoReview } from "../types";

interface CopoShareModalProps {
  // Mode A: General Share
  isOpen?: boolean;
  shareUrl?: string;
  title?: string;
  subtitle?: string;

  // Mode B: Video Share (Backward Compatibility)
  video?: VideoReview | null;

  // Common
  onClose: () => void;
  onOpenReport?: (video?: VideoReview | null) => void;
}

export const CopoShareModal: React.FC<CopoShareModalProps> = ({
  isOpen: explicitIsOpen,
  shareUrl: explicitShareUrl,
  title: explicitTitle,
  subtitle: explicitSubtitle,
  video,
  onClose,
  onOpenReport
}) => {
  const [copied, setCopied] = useState(false);

  // Determine active states based on general share or video share
  const isVideoMode = Boolean(video);
  const isOpen = isVideoMode ? Boolean(video) : Boolean(explicitIsOpen);
  
  if (!isOpen) return null;

  const shareUrl = isVideoMode && video
    ? `${window.location.origin}/@${video.author?.name || video.author?.name?.replace(/\s+/g, "").toLowerCase() || "user"}/video/${video.id}`
    : (explicitShareUrl || window.location.origin);

  const title = isVideoMode && video
    ? `${video.author.name}'s 60s review of ${video.placeName || "Business"}`
    : (explicitTitle || "Yoouz - Real People. Real Reviews.");

  const subtitle = isVideoMode && video
    ? "Authentic 60-Second Video Review"
    : (explicitSubtitle || "Share link");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Failed to copy link:", err);
    }
  };

  const shareText = isVideoMode && video
    ? `Watch ${video.author.name}'s authentic 60-second video review of ${video.placeName || "Business"} on Yoouz:`
    : "Discover places and websites with authentic 60-second video reviews on Yoouz:";

  const socialShares = [
    {
      name: "Facebook",
      icon: <Facebook className="w-5 h-5 text-blue-600" />,
      color: "hover:bg-blue-50 border-blue-100",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    },
    {
      name: "WhatsApp",
      icon: (
        <svg className="w-5 h-5 text-emerald-600 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 1.977 14.07 1.9 12.01 1.9c-5.44 0-9.866 4.372-9.87 9.802 0 1.714.453 3.39 1.31 4.88l-.994 3.63 3.734-.972h-.143zm11.367-7.584c-.321-.16-1.897-.938-2.185-1.043-.289-.104-.499-.158-.709.158-.21.317-.812 1.044-.995 1.254-.183.21-.366.237-.687.077-.321-.16-1.353-.499-2.577-1.59-1.002-.892-1.63-1.997-1.83-2.333-.2-.336-.022-.518.139-.677.145-.143.321-.374.482-.56.16-.187.214-.32.321-.534.107-.214.053-.4-.027-.56-.08-.16-.709-1.708-.971-2.339-.255-.612-.514-.53-.709-.54-.183-.009-.393-.011-.603-.011s-.552.079-.841.395c-.289.317-1.103 1.079-1.103 2.63s1.129 3.051 1.287 3.262c.158.21 2.22 3.391 5.377 4.754.752.325 1.339.519 1.797.665.755.24 1.443.206 1.987.125.606-.09 1.897-.775 2.16-1.485.263-.709.263-1.316.184-1.442-.079-.126-.289-.205-.61-.365z" />
        </svg>
      ),
      color: "hover:bg-emerald-50 border-emerald-100",
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`
    },
    {
      name: "X",
      icon: (
        <svg className="w-5 h-5 fill-current text-zinc-900" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      color: "hover:bg-zinc-100 border-zinc-200",
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
    },
    {
      name: "LinkedIn",
      icon: <Linkedin className="w-5 h-5 text-sky-700" />,
      color: "hover:bg-sky-50 border-sky-100",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    },
    {
      name: "TikTok",
      icon: (
        <svg className="w-5 h-5 fill-current text-black" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298 0 .59.043.87.127V9.41a6.33 6.33 0 0 0-.87-.06A6.34 6.34 0 0 0 3.1 15.69a6.34 6.34 0 0 0 10.82 4.48c.18-.18.35-.37.49-.57V10.7a8.28 8.28 0 0 0 5.18 1.83v-3.47a4.85 4.85 0 0 1-.0-.37z" />
        </svg>
      ),
      color: "hover:bg-zinc-100 border-zinc-200",
      url: `https://www.tiktok.com/`
    },
    {
      name: "Email",
      icon: <Mail className="w-5 h-5 text-zinc-600" />,
      color: "hover:bg-zinc-100 border-zinc-200",
      url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overscroll-contain"
      onKeyDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div 
        className="relative w-full max-w-[480px] bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden animate-in zoom-in-95 duration-200 overscroll-contain"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 text-base">Share</h3>
              {subtitle && <p className="text-xs text-zinc-500 font-medium">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
            title="Close share dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Target Title Card */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Sharing link to</p>
            <h4 className="font-bold text-zinc-800 text-base mt-1 line-clamp-1">{title}</h4>
            {shareUrl.includes('ais-dev') && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <svg className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                  You are sharing a private development link (`ais-dev`). Social media platforms cannot bypass the security wall to load the custom preview image. To see beautiful rich previews on social media, share your <b>Published App URL</b>.
                </p>
              </div>
            )}
          </div>

          {/* Social Icons row */}
          <div>
            <p className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider mb-3.5">Share on social media</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {socialShares.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center justify-center py-3.5 px-2 rounded-2xl bg-white hover:bg-blue-50/50 border border-zinc-200/90 hover:border-blue-300 shadow-3xs hover:shadow-2xl transition-all duration-200 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-zinc-50 group-hover:bg-white flex items-center justify-center shadow-3xs group-hover:scale-110 transition-transform mb-2">
                    {social.icon}
                  </div>
                  <span className="text-[11px] font-bold text-zinc-700 tracking-tight">{social.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Direct Copy Section */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Copy direct link</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-xs text-zinc-600 font-mono truncate select-all">
                {shareUrl}
              </div>
              <button
                onClick={handleCopy}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  copied
                    ? "bg-emerald-600 text-white"
                    : "bg-[#1a73e8] text-white hover:bg-[#1557b0]"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
          {onOpenReport ? (
            <button
              onClick={() => {
                onClose();
                onOpenReport(video);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-red-600 transition-colors cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report this content</span>
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
