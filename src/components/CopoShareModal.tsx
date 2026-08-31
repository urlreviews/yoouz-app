import React, { useState } from "react";
import { createPortal } from "react-dom";
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
import { CopoBrandLogo } from "./CopoBrandLogo";
import { extractCleanDomain, formatBusinessName } from "../utils/placeUtils";

interface CopoShareModalProps {
  // Mode A: General Share
  isOpen?: boolean;
  shareUrl?: string;
  title?: string;
  subtitle?: string;
  logoUrl?: string;
  avatarUrl?: string;
  domain?: string;
  website?: string;
  bannerUrl?: string;

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
  logoUrl: explicitLogoUrl,
  avatarUrl: explicitAvatarUrl,
  domain: explicitDomain,
  website: explicitWebsite,
  bannerUrl: explicitBannerUrl,
  video,
  onClose,
  onOpenReport
}) => {
  const [copied, setCopied] = useState(false);

  // Determine active states based on general share or video share
  const isVideoMode = Boolean(video);
  const isOpen = isVideoMode ? Boolean(video) : Boolean(explicitIsOpen);
  
  if (!isOpen) return null;

  const getCleanHandle = (author?: any) => {
    if (!author) return "user";
    const raw = (author.handle || author.name || "user")
      .replace(/^@+/, "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9_-]/g, "")
      .replace(/-+/g, "-");
    return raw || "user";
  };

  const shareUrl = isVideoMode && video
    ? `${window.location.origin}/@${getCleanHandle(video.author)}/video/${video.id}?ref=x`
    : (explicitShareUrl ? explicitShareUrl.trim().replace(/\s+/g, "%20") : window.location.origin);

  const title = isVideoMode && video
    ? `${video.author?.name || "Reviewer"}'s 60s review of ${video.placeName || "Business"}`
    : (explicitTitle || "Yoouz - Real People. Real Reviews.");

  const subtitle = isVideoMode && video
    ? "Authentic 60-Second Video Review"
    : (explicitSubtitle || "Share link");

  const isBusiness = !isVideoMode && (
    subtitle?.toLowerCase().includes("business") || 
    shareUrl.includes("/place/")
  );

  const isCreator = !isVideoMode && (
    subtitle?.toLowerCase().includes("reviewer") || 
    subtitle?.toLowerCase().includes("profile") || 
    shareUrl.includes("/@")
  );

  const isSquarePreview = isBusiness || isCreator;

  // Resolve metadata assets
  const resolvedDomain = explicitDomain || extractCleanDomain(explicitWebsite || (shareUrl.includes("/place/") ? shareUrl.split("/place/")[1] : title));
  const resolvedLogoUrl = explicitLogoUrl || (isVideoMode && video ? ((video as any).placeLogo || video.placeLogoUrl || (video as any).logoUrl) : undefined);
  const resolvedAvatarUrl = explicitAvatarUrl || (isVideoMode && video?.author ? video.author.avatar : undefined);
  const resolvedWebsite = explicitWebsite || (isVideoMode && video ? (video as any).website : undefined);
  const resolvedBannerUrl = explicitBannerUrl || (isVideoMode && video ? (video as any).bannerUrl : undefined);

  let previewImageUrl = "/api/og-image.png?v=12";
  if (isVideoMode && video) {
    previewImageUrl = `/api/og-image.png?type=video&id=${encodeURIComponent(video.id)}&placeName=${encodeURIComponent(formatBusinessName(video.placeName || "Business"))}&author=${encodeURIComponent(video.author?.name || "Reviewer")}&rating=${video.rating || 5}&caption=${encodeURIComponent(video.caption || "")}&v=12`;
  } else if (isBusiness) {
    previewImageUrl = `/api/og-image.png?type=place&name=${encodeURIComponent(formatBusinessName(title))}&domain=${encodeURIComponent(resolvedDomain)}${resolvedLogoUrl ? `&logoUrl=${encodeURIComponent(resolvedLogoUrl)}` : ""}${resolvedWebsite ? `&website=${encodeURIComponent(resolvedWebsite)}` : ""}&v=12`;
  } else if (isCreator) {
    const cleanHandle = (shareUrl.split("/@")[1] || title).replace(/^@+/, "");
    previewImageUrl = `/api/og-image.png?type=creator&name=${encodeURIComponent(title)}&handle=${encodeURIComponent(cleanHandle)}${resolvedAvatarUrl ? `&avatarUrl=${encodeURIComponent(resolvedAvatarUrl)}` : ""}&v=12`;
  }

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
    : `Check out ${title} on Yoouz — Authentic 60-second video reviews:`;

  const socialShares = [
    {
      name: "Facebook",
      icon: <Facebook className="w-5 h-5 text-white" />,
      color: "hover:bg-zinc-800 border-zinc-800",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    },
    {
      name: "WhatsApp",
      icon: (
        <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 1.977 14.07 1.9 12.01 1.9c-5.44 0-9.866 4.372-9.87 9.802 0 1.714.453 3.39 1.31 4.88l-.994 3.63 3.734-.972h-.143zm11.367-7.584c-.321-.16-1.897-.938-2.185-1.043-.289-.104-.499-.158-.709.158-.21.317-.812 1.044-.995 1.254-.183.21-.366.237-.687.077-.321-.16-1.353-.499-2.577-1.59-1.002-.892-1.63-1.997-1.83-2.333-.2-.336-.022-.518.139-.677.145-.143.321-.374.482-.56.16-.187.214-.32.321-.534.107-.214.053-.4-.027-.56-.08-.16-.709-1.708-.971-2.339-.255-.612-.514-.53-.709-.54-.183-.009-.393-.011-.603-.011s-.552.079-.841.395c-.289.317-1.103 1.079-1.103 2.63s1.129 3.051 1.287 3.262c.158.21 2.22 3.391 5.377 4.754.752.325 1.339.519 1.797.665.755.24 1.443.206 1.987.125.606-.09 1.897-.775 2.16-1.485.263-.709.263-1.316.184-1.442-.079-.126-.289-.205-.61-.365z" />
        </svg>
      ),
      color: "hover:bg-zinc-800 border-zinc-800",
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`
    },
    {
      name: "X",
      icon: (
        <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      color: "hover:bg-zinc-800 border-zinc-800",
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
    },
    {
      name: "LinkedIn",
      icon: <Linkedin className="w-5 h-5 text-white" />,
      color: "hover:bg-zinc-800 border-zinc-800",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    },
    {
      name: "TikTok",
      icon: (
        <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298 0 .59.043.87.127V9.41a6.33 6.33 0 0 0-.87-.06A6.34 6.34 0 0 0 3.1 15.69a6.34 6.34 0 0 0 10.82 4.48c.18-.18.35-.37.49-.57V10.7a8.28 8.28 0 0 0 5.18 1.83v-3.47a4.85 4.85 0 0 1-.0-.37z" />
        </svg>
      ),
      color: "hover:bg-zinc-800 border-zinc-800",
      url: `https://www.tiktok.com/`
    },
    {
      name: "Email",
      icon: <Mail className="w-5 h-5 text-zinc-300" />,
      color: "hover:bg-zinc-800 border-zinc-800",
      url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`
    }
  ];

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overscroll-contain text-white"
      onKeyDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      {/* Background click to close */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {/* Modal Card */}
      <div 
        className="relative z-10 w-full max-w-[480px] max-h-[88vh] flex flex-col bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200 text-white"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-zinc-800 text-white flex items-center justify-center border border-zinc-700 shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">Share</h3>
              {subtitle && <p className="text-xs text-zinc-400 font-medium">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            title="Close share dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto min-h-0 flex-1 overscroll-contain">
          {/* Target Title Card */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Sharing link to</p>
            <h4 className="font-bold text-white text-sm sm:text-base mt-0.5 line-clamp-1">{title}</h4>
            {shareUrl.includes('ais-dev') && (
              <div className="mt-2.5 p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg flex items-start gap-2">
                <svg className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-[10px] text-zinc-300 font-medium leading-relaxed">
                  You are sharing a development link (`ais-dev`). To see rich social cards on WhatsApp/iMessage/X, share your <b>Published App URL</b>.
                </p>
              </div>
            )}
          </div>

          {/* Direct Copy Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Copy direct link</p>
              {copied && <span className="text-[11px] font-bold text-emerald-400 animate-in fade-in">Copied to clipboard!</span>}
            </div>
            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl p-1.5 focus-within:border-zinc-700 transition">
              <input
                type="text"
                readOnly
                value={shareUrl}
                onFocus={(e) => e.target.select()}
                className="flex-1 bg-transparent px-2.5 py-1 text-xs text-zinc-300 font-mono focus:outline-none select-all truncate min-w-0"
              />
              <button
                onClick={handleCopy}
                type="button"
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm ${
                  copied
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-zinc-950 hover:bg-zinc-200 active:scale-95"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied</span>
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

          {/* Social Icons row */}
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2.5">Share on social media</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {socialShares.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center justify-center py-2.5 px-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800/80 hover:border-zinc-700 shadow-sm transition-all duration-200 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 group-hover:bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform mb-1.5">
                    {social.icon}
                  </div>
                  <span className="text-[10px] font-bold text-zinc-300 tracking-tight">{social.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Social Card Preview Section */}
          <div className="space-y-1.5 pb-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Social Card Preview</p>
              <a
                href={previewImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition"
              >
                Open Full Card ↗
              </a>
            </div>

            {isSquarePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 p-3 flex items-center gap-3.5 shadow-inner">
                {isBusiness ? (
                  <div className="w-14 h-14 rounded-xl border border-zinc-700/80 bg-white shadow-md overflow-hidden flex items-center justify-center p-1.5 shrink-0 ring-1 ring-white/10">
                    <CopoBrandLogo
                      domain={resolvedDomain}
                      name={title}
                      website={resolvedWebsite}
                      logoUrl={resolvedLogoUrl}
                      bannerUrl={resolvedBannerUrl}
                      className="w-full h-full flex items-center justify-center"
                      imageClassName="w-full h-full object-contain [image-rendering:-webkit-optimize-contrast]"
                      fallbackTextClassName="font-black text-xl text-zinc-900"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full border-2 border-zinc-700 bg-zinc-900 shadow-md overflow-hidden flex items-center justify-center shrink-0 relative ring-2 ring-zinc-800">
                    {resolvedAvatarUrl ? (
                      <img
                        src={resolvedAvatarUrl}
                        alt={title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=27272a&color=fff&bold=true&size=128`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-lg">
                        {title.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">yoouz.com</span>
                  <h5 className="font-bold text-white text-xs sm:text-sm truncate mt-0.5">{title}</h5>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5 font-medium leading-tight">
                    {isBusiness 
                      ? `Authentic 60s video reviews & ratings for ${title}. Real People. Real Reviews.` 
                      : `Authentic 60s video reviews & recommendations by ${title}.`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-inner group max-h-44 sm:max-h-48 flex items-center justify-center">
                <img
                  src={previewImageUrl}
                  alt="Social Media Preview Card"
                  className="w-full h-auto max-h-44 sm:max-h-48 object-cover transition duration-300 group-hover:scale-[1.01]"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between shrink-0">
          {onOpenReport ? (
            <button
              onClick={() => {
                onClose();
                onOpenReport(video);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report this content</span>
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer border border-zinc-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
};

