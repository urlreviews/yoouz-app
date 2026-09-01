import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Facebook,
  Mail,
  Copy,
  Check,
  Share2,
  Flag,
  Linkedin,
  Code,
  ExternalLink,
  Sparkles,
  Globe,
  MessageSquare,
  Smartphone
} from "lucide-react";
import { VideoReview } from "../types";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { extractCleanDomain, formatBusinessName } from "../utils/placeUtils";
import { useSwipeDownToDismiss } from "../hooks/useSwipeDownToDismiss";
import { triggerHaptic } from "../utils/haptics";

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
  const [embedCopied, setEmbedCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"share" | "embed" | "preview">("share");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const { swipeProps, dragOffsetY } = useSwipeDownToDismiss({
    onDismiss: onClose,
    threshold: 60
  });

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

  const rawShareUrl = isVideoMode && video
    ? `${window.location.origin}/@${getCleanHandle(video.author)}/video/${video.id}?ref=x`
    : (explicitShareUrl ? explicitShareUrl.trim().replace(/\s+/g, "%20") : window.location.origin);

  const shareUrl = rawShareUrl.replace(/\/place\/www-/g, '/place/');

  // Generate Embed URLs and Code
  const embedVideoId = video?.id || (shareUrl.includes('/video/') ? shareUrl.split('/video/')[1]?.split('?')[0] : null);
  const embedUrl = embedVideoId ? `${window.location.origin}/embed/video/${embedVideoId}` : `${window.location.origin}/embed`;
  const iframeEmbedCode = `<iframe src="${embedUrl}" width="360" height="640" style="border:0;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.5);" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(iframeEmbedCode);
      triggerHaptic("success");
      setEmbedCopied(true);
      showToast("Embed code copied to clipboard");
      setTimeout(() => setEmbedCopied(false), 2000);
    } catch (err) {
      console.warn("Failed to copy embed code:", err);
    }
  };

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

  const shareText = isVideoMode && video
    ? `Watch ${video.author.name}'s authentic 60-second video review of ${video.placeName || "Business"} on Yoouz:`
    : `Check out ${title} on Yoouz — Authentic 60-second video reviews:`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      triggerHaptic("success");
      setCopied(true);
      showToast("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.warn("Failed to copy link:", err);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl
        });
        triggerHaptic("success");
      } catch (err) {
        console.log("Share dismissed:", err);
      }
    } else {
      handleCopy();
    }
  };

  const handleTikTokShare = async () => {
    triggerHaptic("light");
    await handleCopy();
    showToast("Link copied! Opening TikTok...");
    setTimeout(() => {
      window.open("https://www.tiktok.com", "_blank", "noopener,noreferrer");
    }, 600);
  };

  // Sleek, consistent dark mode share channels
  const sharePlatforms = [
    {
      id: "facebook",
      name: "Facebook",
      icon: <Facebook className="w-5 h-5 text-zinc-200 group-hover:text-white" />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    },
    {
      id: "tiktok",
      name: "TikTok",
      icon: (
        <svg className="w-5 h-5 fill-current text-zinc-200 group-hover:text-white" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      ),
      onClick: handleTikTokShare
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: <Linkedin className="w-5 h-5 text-zinc-200 group-hover:text-white" />,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    },
    {
      id: "reddit",
      name: "Reddit",
      icon: (
        <svg className="w-5 h-5 fill-current text-zinc-200 group-hover:text-white" viewBox="0 0 24 24">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.703zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.688-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
        </svg>
      ),
      url: `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title || "Yoouz Video Review")}`
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: (
        <svg className="w-5 h-5 fill-current text-zinc-200 group-hover:text-white" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 1.977 14.07 1.9 12.01 1.9c-5.44 0-9.866 4.372-9.87 9.802 0 1.714.453 3.39 1.31 4.88l-.994 3.63 3.734-.972h-.143zm11.367-7.584c-.321-.16-1.897-.938-2.185-1.043-.289-.104-.499-.158-.709.158-.21.317-.812 1.044-.995 1.254-.183.21-.366.237-.687.077-.321-.16-1.353-.499-2.577-1.59-1.002-.892-1.63-1.997-1.83-2.333-.2-.336-.022-.518.139-.677.145-.143.321-.374.482-.56.16-.187.214-.32.321-.534.107-.214.053-.4-.027-.56-.08-.16-.709-1.708-.971-2.339-.255-.612-.514-.53-.709-.54-.183-.009-.393-.011-.603-.011s-.552.079-.841.395c-.289.317-1.103 1.079-1.103 2.63s1.129 3.051 1.287 3.262c.158.21 2.22 3.391 5.377 4.754.752.325 1.339.519 1.797.665.755.24 1.443.206 1.987.125.606-.09 1.897-.775 2.16-1.485.263-.709.263-1.316.184-1.442-.079-.126-.289-.205-.61-.365z" />
        </svg>
      ),
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`
    },
    {
      id: "x",
      name: "X (Twitter)",
      icon: (
        <svg className="w-4.5 h-4.5 fill-current text-zinc-200 group-hover:text-white" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
    },
    {
      id: "telegram",
      name: "Telegram",
      icon: (
        <svg className="w-5 h-5 fill-current text-zinc-200 group-hover:text-white" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.945z" />
        </svg>
      ),
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
    },
    {
      id: "messenger",
      name: "Messenger",
      icon: (
        <svg className="w-5 h-5 fill-current text-zinc-200 group-hover:text-white" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.615 4.47 8.653V24l4.088-2.244c1.077.299 2.222.464 3.442.464 6.627 0 12-4.974 12-11.109C24 4.974 18.627 0 12 0zm1.192 14.962l-3.056-3.26-5.964 3.26 6.562-6.966 3.13 3.26 5.89-3.26-6.562 6.966z" />
        </svg>
      ),
      url: `https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&app_id=291494419107518&redirect_uri=${encodeURIComponent(shareUrl)}`
    },
    {
      id: "email",
      name: "Email",
      icon: <Mail className="w-5 h-5 text-zinc-200 group-hover:text-white" />,
      url: `mailto:?subject=${encodeURIComponent(title || "Yoouz")}&body=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`
    }
  ];

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex flex-col justify-end sm:justify-center sm:items-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200 text-white"
    >
      {/* Background click to dismiss */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {/* Main Dialog Card: Mobile Bottom Sheet + Desktop Floating Dialog */}
      <div 
        className="relative z-10 w-full sm:max-w-[500px] bg-zinc-950/95 backdrop-blur-2xl rounded-t-[28px] sm:rounded-3xl shadow-2xl border-t sm:border border-zinc-800/80 flex flex-col max-h-[88vh] sm:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-250 text-white pb-safe"
        style={{
          transform: dragOffsetY > 0 ? `translateY(${dragOffsetY}px)` : undefined,
          transition: dragOffsetY === 0 ? "transform 0.2s ease-out" : "none"
        }}
        onClick={(e) => e.stopPropagation()}
        {...swipeProps}
      >
        {/* Top Drag Indicator Pill for Mobile */}
        <div className="pt-2.5 pb-1 flex justify-center shrink-0 cursor-grab active:cursor-grabbing sm:hidden">
          <div className="w-10 h-1.5 rounded-full bg-zinc-700/80" />
        </div>

        {/* Modal Header */}
        <div className="px-5 pt-3 pb-3 flex items-center justify-between border-b border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">
                {isVideoMode ? "Share Review" : "Share"}
              </h3>
              <p className="text-[11px] text-zinc-400 font-medium truncate max-w-[240px] sm:max-w-[300px]">
                {title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* View Selection Tabs (Share Link vs Embed vs Social Card) */}
        <div className="px-5 pt-3 pb-2 shrink-0">
          <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl">
            <button
              onClick={() => setActiveTab("share")}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "share"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Link</span>
            </button>
            <button
              onClick={() => setActiveTab("embed")}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "embed"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Embed</span>
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "preview"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>
        </div>

        {/* Toast Feedback Notification Banner */}
        {toastMessage && (
          <div className="mx-5 mb-2 py-1.5 px-3 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs font-medium flex items-center justify-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
            <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Main Tab Body */}
        <div className="overflow-y-auto flex-1 overscroll-contain min-h-0 px-5 py-2 space-y-4">
          {activeTab === "share" ? (
            <>
              {/* Context Summary Pill */}
              <div className="p-3 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 flex items-center gap-3">
                {isBusiness ? (
                  <div className="w-11 h-11 rounded-xl border border-zinc-700/80 bg-white shadow-sm overflow-hidden flex items-center justify-center p-1 shrink-0">
                    <CopoBrandLogo
                      domain={resolvedDomain}
                      name={title}
                      website={resolvedWebsite}
                      logoUrl={resolvedLogoUrl}
                      bannerUrl={resolvedBannerUrl}
                      className="w-full h-full flex items-center justify-center"
                      imageClassName="w-full h-full object-contain"
                      fallbackTextClassName="font-bold text-base text-zinc-900"
                    />
                  </div>
                ) : resolvedAvatarUrl ? (
                  <img
                    src={resolvedAvatarUrl}
                    alt={title}
                    className="w-11 h-11 rounded-full object-cover border border-zinc-700 shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=27272a&color=fff&bold=true&size=128`;
                    }}
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate">{title}</h4>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">{subtitle}</p>
                </div>
              </div>

              {/* Direct Link Copy Input Bar */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Direct Link
                </label>
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5 shadow-inner">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    onFocus={(e) => e.target.select()}
                    className="flex-1 bg-transparent px-2.5 py-1 text-xs text-zinc-300 font-mono focus:outline-none select-all truncate min-w-0"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                      <button
                        onClick={handleNativeShare}
                        type="button"
                        className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer border border-zinc-700/60"
                        title="Native Device Share"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={handleCopy}
                      type="button"
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                        copied
                          ? "bg-emerald-500 text-black font-extrabold"
                          : "bg-white text-zinc-950 hover:bg-zinc-200 active:scale-95"
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
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
              </div>

              {/* Social Channels Grid (Sleek Dark Mode Buttons) */}
              <div className="space-y-2 pt-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Share To Platform
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                  {sharePlatforms.map((platform) => {
                    const content = (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800/90 flex items-center justify-center text-zinc-300 group-hover:text-white group-hover:border-zinc-700 group-hover:bg-zinc-800 transition mb-1.5 shadow-sm">
                          {platform.icon}
                        </div>
                        <span className="text-xs font-medium text-zinc-300 group-hover:text-white truncate max-w-full">
                          {platform.name}
                        </span>
                      </>
                    );

                    if (platform.onClick) {
                      return (
                        <button
                          key={platform.id}
                          onClick={platform.onClick}
                          className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/70 hover:border-zinc-700 text-center transition cursor-pointer active:scale-98"
                        >
                          {content}
                        </button>
                      );
                    }

                    return (
                      <a
                        key={platform.id}
                        href={platform.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/70 hover:border-zinc-700 text-center transition cursor-pointer active:scale-98"
                      >
                        {content}
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Auxiliary Actions (Open in Browser, Report) */}
              <div className="pt-2 flex items-center justify-between border-t border-zinc-800/60">
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in new tab</span>
                </a>

                {onOpenReport && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenReport(video);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-red-400/90 hover:text-red-300 transition font-medium cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Report</span>
                  </button>
                )}
              </div>
            </>
          ) : activeTab === "embed" ? (
            /* Inline Embed Video Code View */
            <div className="space-y-4 animate-in fade-in duration-150 py-1">
              <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-900/40 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-300 leading-relaxed">
                  <span className="font-bold text-white">Embed Anywhere:</span> Paste this responsive HTML snippet into your WordPress, Shopify, Webflow, or custom site.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">HTML iFrame Code</span>
                  {embedCopied && (
                    <span className="text-[11px] font-bold text-emerald-400 animate-in fade-in flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Copied!
                    </span>
                  )}
                </div>
                <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                  <pre className="text-[11px] font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap break-all pr-2 max-h-24">
                    {iframeEmbedCode}
                  </pre>
                </div>
                <div className="flex items-center justify-between pt-1 gap-2">
                  <a
                    href={embedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 transition truncate"
                  >
                    <span>Test player</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                  <button
                    onClick={handleCopyEmbed}
                    type="button"
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-md ${
                      embedCopied
                        ? "bg-emerald-500 text-black font-black"
                        : "bg-white text-black hover:bg-zinc-200 active:scale-95"
                    }`}
                  >
                    {embedCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Copied HTML!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Embed Live Preview */}
              <div className="pt-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">Live Player Preview</span>
                <div className="rounded-2xl border border-zinc-800 bg-black overflow-hidden shadow-2xl flex justify-center p-3">
                  <iframe
                    src={embedUrl}
                    title="Yoouz Embed Preview"
                    className="w-full max-w-[260px] h-[320px] rounded-xl border-0 bg-black shadow-lg"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Social Card Preview View */
            <div className="space-y-4 animate-in fade-in duration-150 py-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Social Preview Card</span>
                <a
                  href={previewImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
                >
                  <span>Open Full Image</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {isSquarePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/80 p-4 flex items-center gap-3.5 shadow-inner">
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
                <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-black shadow-inner group max-h-48 flex items-center justify-center">
                  <img
                    src={previewImageUrl}
                    alt="Social Media Preview Card"
                    className="w-full h-auto max-h-48 object-cover transition duration-300 group-hover:scale-[1.01]"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-zinc-950 border-t border-zinc-800/80 flex items-center justify-between shrink-0">
          <p className="text-[10px] text-zinc-500 font-medium">Yoouz • Real People. Real Reviews.</p>
          <button
            onClick={onClose}
            className="px-5 py-1.5 text-xs font-bold text-zinc-200 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer border border-zinc-700/80"
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
