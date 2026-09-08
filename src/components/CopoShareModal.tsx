import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ArrowLeft,
  Facebook,
  Mail,
  Copy,
  Check,
  Share2,
  Flag,
  Code,
  ExternalLink,
  Sparkles,
  Globe,
  MessageSquare,
  Smartphone,
  Link2
} from "lucide-react";
import { VideoReview } from "../types";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { extractCleanDomain, formatBusinessName } from "../utils/placeUtils";
import { useSwipeDownToDismiss } from "../hooks/useSwipeDownToDismiss";
import { triggerHaptic } from "../utils/haptics";
import { useLanguage } from "../i18n/LanguageContext";

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
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"share" | "embed" | "preview">("share");
  const [embedLayout, setEmbedLayout] = useState<"reel" | "card" | "widget">("reel");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Determine active states based on general share or video share
  const isVideoMode = Boolean(video);
  const isOpen = isVideoMode ? Boolean(video) : Boolean(explicitIsOpen);

  // Reset copied states and messages whenever the modal opens or changes target
  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      setEmbedCopied(false);
      setToastMessage(null);
    }
  }, [isOpen, explicitShareUrl, video?.id]);

  // Lock background body scroll cleanly and handle Escape key whenever modal is active
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const { swipeProps, dragOffsetY } = useSwipeDownToDismiss({
    onDismiss: onClose,
    threshold: 60
  });

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

  // Generate Embed URLs and Code
  const embedVideoId = video?.id || (shareUrl.includes('/video/') ? shareUrl.split('/video/')[1]?.split('?')[0] : null);
  const embedPlaceId = isBusiness && shareUrl.includes('/place/') ? shareUrl.split('/place/')[1]?.split('?')[0] : null;
  
  let embedUrl = `${window.location.origin}/embed`;
  if (embedVideoId) {
    embedUrl = `${window.location.origin}/embed/video/${embedVideoId}`;
  } else if (embedPlaceId) {
    embedUrl = `${window.location.origin}/embed/place/${embedPlaceId}`;
  }

  const iframeWidth = embedLayout === "widget" ? "100%" : embedLayout === "card" ? "320" : "360";
  const iframeHeight = embedLayout === "widget" ? "520" : embedLayout === "card" ? "480" : "640";
  const iframeEmbedCode = `<iframe src="${embedUrl}?layout=${embedLayout}" width="${iframeWidth}" height="${iframeHeight}" style="border:0;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.5);" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;

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
    let success = false;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
        success = true;
      }
    } catch (err) {
      console.warn("Primary clipboard writeText failed, trying fallback:", err);
    }

    if (!success) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        textArea.setAttribute("readonly", "");
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
        success = true;
      } catch (fallbackErr) {
        console.warn("Clipboard fallback copy failed:", fallbackErr);
      }
    }

    triggerHaptic("success");
    setCopied(true);
    showToast("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2400);
  };

  const handleNativeShare = async () => {
    triggerHaptic("medium");
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl
        });
        triggerHaptic("success");
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const openAppOrUrl = (deepLink: string, webFallback: string, name?: string) => {
    triggerHaptic("medium");
    const isMobile = typeof navigator !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && deepLink) {
      // Direct deep link launch to physical mobile application
      window.location.href = deepLink;
      setTimeout(() => {
        // Safe fallback if the physical app isn't installed
        window.open(webFallback, "_blank", "noopener,noreferrer");
      }, 1400);
    } else {
      window.open(webFallback, "_blank", "noopener,noreferrer");
    }
  };

  // Master list of all share channels with explicit URL scheme intents and web fallbacks
  const allSharePlatforms = [
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: (
        <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 1.977 14.07 1.9 12.01 1.9c-5.44 0-9.866 4.372-9.87 9.802 0 1.714.453 3.39 1.31 4.88l-.994 3.63 3.734-.972h-.143zm11.367-7.584c-.321-.16-1.897-.938-2.185-1.043-.289-.104-.499-.158-.709.158-.21.317-.812 1.044-.995 1.254-.183.21-.366.237-.687.077-.321-.16-1.353-.499-2.577-1.59-1.002-.892-1.63-1.997-1.83-2.333-.2-.336-.022-.518.139-.677.145-.143.321-.374.482-.56.16-.187.214-.32.321-.534.107-.214.053-.4-.027-.56-.08-.16-.709-1.708-.971-2.339-.255-.612-.514-.53-.709-.54-.183-.009-.393-.011-.603-.011s-.552.079-.841.395c-.289.317-1.103 1.079-1.103 2.63s1.129 3.051 1.287 3.262c.158.21 2.22 3.391 5.377 4.754.752.325 1.339.519 1.797.665.755.24 1.443.206 1.987.125.606-.09 1.897-.775 2.16-1.485.263-.709.263-1.316.184-1.442-.079-.126-.289-.205-.61-.365z" />
        </svg>
      ),
      onClick: () => openAppOrUrl(`whatsapp://send?text=${encodeURIComponent(shareText + "\n" + shareUrl)}`, `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + "\n" + shareUrl)}`, "WhatsApp")
    },
    {
      id: "wabusiness",
      name: "WA Business",
      icon: (
        <div className="relative flex items-center justify-center">
          <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 1.977 14.07 1.9 12.01 1.9c-5.44 0-9.866 4.372-9.87 9.802 0 1.714.453 3.39 1.31 4.88l-.994 3.63 3.734-.972h-.143z" />
          </svg>
          <span className="absolute -top-1 -right-1 text-[9px] font-black bg-zinc-200 text-zinc-950 rounded-full w-3 h-3 flex items-center justify-center leading-none">+</span>
        </div>
      ),
      onClick: () => openAppOrUrl(`whatsapp://send?text=${encodeURIComponent(shareText + "\n" + shareUrl)}`, `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + "\n" + shareUrl)}`, "WA Business")
    },
    {
      id: "messenger",
      name: "Messenger",
      icon: (
        <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.615 4.47 8.653V24l4.088-2.244c1.077.299 2.222.464 3.442.464 6.627 0 12-4.974 12-11.109C24 4.974 18.627 0 12 0zm1.192 14.962l-3.056-3.26-5.964 3.26 6.562-6.966 3.13 3.26 5.89-3.26-6.562 6.966z" />
        </svg>
      ),
      onClick: () => openAppOrUrl(`fb-messenger://share?link=${encodeURIComponent(shareUrl)}`, `https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&app_id=291494419107518&redirect_uri=${encodeURIComponent(shareUrl)}`, "Messenger")
    },
    {
      id: "telegram",
      name: "Telegram",
      icon: (
        <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.945z" />
        </svg>
      ),
      onClick: () => openAppOrUrl(`tg://msg_url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, "Telegram")
    },
    {
      id: "line",
      name: "Line",
      icon: (
        <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
        </svg>
      ),
      onClick: () => openAppOrUrl(`line://msg/text/${encodeURIComponent(shareText + "\n" + shareUrl)}`, `https://line.me/R/msg/text/?${encodeURIComponent(shareText + "\n" + shareUrl)}`, "Line")
    },
    {
      id: "x",
      name: "X (Twitter)",
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      onClick: () => openAppOrUrl(`twitter://post?message=${encodeURIComponent(shareText + "\n" + shareUrl)}`, `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, "X")
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: <Facebook className="w-5.5 h-5.5" />,
      onClick: () => openAppOrUrl(`fb://facewebmodal/f?href=${encodeURIComponent(shareUrl)}`, `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, "Facebook")
    },
    {
      id: "reddit",
      name: "Reddit",
      icon: (
        <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.703zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.688-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
        </svg>
      ),
      onClick: () => window.open(`https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title || shareText)}`, "_blank", "noopener,noreferrer")
    },
    {
      id: "sms",
      name: "Messages",
      icon: <MessageSquare className="w-5.5 h-5.5" />,
      onClick: () => {
        triggerHaptic("medium");
        window.location.href = `sms:?&body=${encodeURIComponent(shareText + "\n" + shareUrl)}`;
      }
    },
    {
      id: "email",
      name: "Email",
      icon: <Mail className="w-5.5 h-5.5" />,
      onClick: () => {
        window.location.href = `mailto:?subject=${encodeURIComponent(title || "Yoouz Video Review")}&body=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`;
      }
    }
  ];

  // Mobile Shelf 1: Direct Messaging & Fast Actions (100% Dark Mode)
  const mobileMessagingPlatforms = [
    {
      id: "copy",
      name: copied ? "Copied" : "Copy link",
      icon: copied ? <Check className="w-5.5 h-5.5 stroke-[2.5] text-white" /> : <Link2 className="w-5.5 h-5.5 stroke-[2.2]" />,
      onClick: handleCopy
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: allSharePlatforms.find((p) => p.id === "whatsapp")?.icon,
      onClick: allSharePlatforms.find((p) => p.id === "whatsapp")?.onClick
    },
    {
      id: "wabusiness",
      name: "WA Business",
      icon: allSharePlatforms.find((p) => p.id === "wabusiness")?.icon,
      onClick: allSharePlatforms.find((p) => p.id === "wabusiness")?.onClick
    },
    {
      id: "line",
      name: "Line",
      icon: allSharePlatforms.find((p) => p.id === "line")?.icon,
      onClick: allSharePlatforms.find((p) => p.id === "line")?.onClick
    },
    {
      id: "messenger",
      name: "Messenger",
      icon: allSharePlatforms.find((p) => p.id === "messenger")?.icon,
      onClick: allSharePlatforms.find((p) => p.id === "messenger")?.onClick
    },
    {
      id: "telegram",
      name: "Telegram",
      icon: allSharePlatforms.find((p) => p.id === "telegram")?.icon,
      onClick: allSharePlatforms.find((p) => p.id === "telegram")?.onClick
    },
    {
      id: "sms",
      name: "Messages",
      icon: <MessageSquare className="w-5 h-5" />,
      onClick: allSharePlatforms.find((p) => p.id === "sms")?.onClick
    }
  ];

  // Mobile Shelf 2: Social Networks & Broadcast Channels (100% Dark Mode)
  const mobileSocialPlatforms = [
    {
      id: "x",
      name: "X (Twitter)",
      icon: allSharePlatforms.find((p) => p.id === "x")?.icon,
      onClick: allSharePlatforms.find((p) => p.id === "x")?.onClick
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: allSharePlatforms.find((p) => p.id === "facebook")?.icon,
      onClick: allSharePlatforms.find((p) => p.id === "facebook")?.onClick
    },
    {
      id: "reddit",
      name: "Reddit",
      icon: allSharePlatforms.find((p) => p.id === "reddit")?.icon,
      onClick: allSharePlatforms.find((p) => p.id === "reddit")?.onClick
    },
    {
      id: "email",
      name: "Email",
      icon: allSharePlatforms.find((p) => p.id === "email")?.icon,
      onClick: allSharePlatforms.find((p) => p.id === "email")?.onClick
    }
  ];

  const modalContent = (
    <div 
      id="yoouz-share-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="yoouz-share-modal-title"
      className="fixed inset-0 z-[99999] flex flex-col justify-end sm:justify-center sm:items-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200 text-white overscroll-contain select-none p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Background click to dismiss */}
      <div className="absolute inset-0 cursor-pointer" />

      {/* Main Dialog Card: Mobile Full Screen Sheet + Desktop Floating Dialog */}
      <div 
        id="yoouz-share-modal-dialog"
        className="relative z-10 w-full sm:max-w-[480px] h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[90vh] bg-zinc-950 sm:bg-zinc-950/98 backdrop-blur-2xl rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border border-zinc-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 text-white pb-safe select-text overscroll-contain"
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          transform: dragOffsetY > 0 ? `translateY(${dragOffsetY}px)` : undefined,
          transition: dragOffsetY === 0 ? "transform 0.2s ease-out" : "none"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Drag Indicator Pill for Mobile (Signature Top Black/Dark Line like Comments) */}
        <div 
          className="h-8 flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing sm:hidden touch-none"
          {...swipeProps}
        >
          <div className="w-12 h-1.5 rounded-full bg-zinc-700" />
        </div>

        {/* Modal Header */}
        <div 
          className="px-5 pt-2 sm:pt-3 pb-3 flex items-center justify-between border-b border-zinc-800/80 shrink-0 touch-pan-y"
          {...swipeProps}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 sm:hidden flex items-center justify-center text-zinc-200 hover:text-white shrink-0 active:scale-95 cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 hidden sm:flex items-center justify-center text-zinc-200">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 id="yoouz-share-modal-title" className="font-bold text-white text-base leading-tight">
                {isVideoMode ? t("shareModal.shareReview", "Share Review") : t("shareModal.share", "Share")}
              </h3>
              <p className="text-[11px] text-zinc-400 font-medium truncate max-w-[240px] sm:max-w-[300px]">
                {title}
              </p>
            </div>
          </div>

          <button
            id="btn-close-share-desktop"
            onClick={onClose}
            className="w-8 h-8 rounded-full hidden sm:flex items-center justify-center text-zinc-300 hover:text-white bg-zinc-850 hover:bg-zinc-700 border border-zinc-700/80 hover:border-zinc-500 transition-all cursor-pointer shadow-xs shrink-0 active:scale-95"
            title="Close share dialog (Esc)"
            aria-label="Close"
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
                  ? "bg-zinc-800 text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{t("shareModal.shareLink", "Share Link")}</span>
            </button>
            <button
              onClick={() => setActiveTab("embed")}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "embed"
                  ? "bg-zinc-800 text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>{t("shareModal.embed", "Embed")}</span>
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "preview"
                  ? "bg-zinc-800 text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t("shareModal.preview", "Preview")}</span>
            </button>
          </div>
        </div>

        {/* Toast Feedback Notification Banner */}
        {toastMessage && (
          <div className="mx-5 mb-2 py-2 px-3.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-xs font-medium flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150 shadow-md">
            <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Main Tab Body (Smoothly scrollable on desktop and mobile) */}
        <div 
          className="overflow-y-auto flex-1 overscroll-contain min-h-0 px-5 py-2.5 sm:py-3 space-y-3.5 sm:space-y-4 pb-4 sm:pb-5 scroll-smooth [scrollbar-width:thin] [scrollbar-color:#3f3f46_transparent]"
        >
          {activeTab === "share" ? (
            <>
              {/* Context Summary Pill */}
              <div className="p-2.5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 flex items-center gap-3">
                {isBusiness ? (
                  <div className="w-10 h-10 rounded-xl border border-zinc-700/80 bg-white shadow-2xs overflow-hidden flex items-center justify-center p-1 shrink-0">
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
                    className="w-10 h-10 rounded-full object-cover border border-zinc-700 shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = `/api/avatar?name=${encodeURIComponent(title)}&background=27272a&color=fff&bold=true&size=128`;
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate">{title}</h4>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">{subtitle}</p>
                </div>
              </div>

              {/* Direct Link Copy Input Bar */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  {t("shareModal.directLink", "Direct Link")}
                </label>
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5 shadow-inner">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    onFocus={(e) => e.target.select()}
                    className="flex-1 bg-transparent px-2.5 py-1 text-xs text-zinc-200 font-mono focus:outline-none select-all truncate min-w-0"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                      <button
                        onClick={handleNativeShare}
                        type="button"
                        className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white transition cursor-pointer border border-zinc-700/60"
                        title={t("shareModal.nativeDeviceShare", "Native Device Share")}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={handleCopy}
                      type="button"
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                        copied
                          ? "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600 active:scale-95"
                          : "bg-white text-zinc-950 hover:bg-zinc-200 active:scale-95"
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                          <span>{t("shareModal.copied", "Copied")}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{t("shareModal.copy", "Copy")}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Desktop 5-Column Compact, Premium Dark Grid */}
              <div className="hidden sm:block space-y-2 pt-0.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  {t("shareModal.shareToPlatform", "Share to Platform")}
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {allSharePlatforms.map((platform) => (
                    <button
                      key={platform.id}
                      onClick={platform.onClick}
                      type="button"
                      className="group flex flex-col items-center justify-center py-2.5 px-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800/90 hover:border-zinc-700 text-center transition-all cursor-pointer active:scale-95 shadow-2xs hover:shadow-xs"
                      title={platform.name}
                    >
                      <div className="w-8.5 h-8.5 rounded-lg bg-zinc-900 border border-zinc-800/90 flex items-center justify-center text-zinc-300 group-hover:text-white group-hover:border-zinc-600 group-hover:bg-zinc-800 transition mb-1 shadow-2xs">
                        {platform.icon}
                      </div>
                      <span className="text-[11px] font-medium text-zinc-300 group-hover:text-white truncate max-w-full leading-tight">
                        {platform.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Shelf 1: Circular Quick Actions & Messaging Apps */}
              <div className="sm:hidden space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-zinc-200 uppercase tracking-wider block">
                    {t("shareModal.sendTo", "Send to")}
                  </label>
                  {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                    <button
                      onClick={handleNativeShare}
                      className="text-[11px] font-semibold text-zinc-200 hover:text-white transition cursor-pointer flex items-center gap-1"
                    >
                      <Smartphone className="w-3 h-3 text-zinc-200" />
                      <span>{t("shareModal.systemApps", "System apps")}</span>
                    </button>
                  )}
                </div>

                <div 
                  className="flex items-start gap-3.5 overflow-x-auto no-scrollbar py-1 px-1 scroll-smooth overscroll-contain"
                  onWheel={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                >
                  {mobileMessagingPlatforms.map((platform) => (
                    <button
                      key={platform.id}
                      onClick={platform.onClick}
                      type="button"
                      className="group flex flex-col items-center gap-1.5 shrink-0 focus:outline-none cursor-pointer transition-transform active:scale-95"
                      title={platform.name}
                    >
                      <div className={`w-13 h-13 rounded-full ${platform.id === 'copy' && copied ? 'bg-zinc-800 border-zinc-600 text-white shadow-md' : 'bg-zinc-900 border-zinc-800/90 text-zinc-200'} border flex items-center justify-center group-hover:text-white group-hover:border-zinc-700 group-active:bg-zinc-800 transition-all duration-200 shadow-sm`}>
                        {platform.icon}
                      </div>
                      <span className="text-[11px] font-medium text-zinc-200 group-hover:text-white text-center truncate max-w-[64px] leading-tight select-none">
                        {platform.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Shelf 2: Circular Social Platforms */}
              <div className="sm:hidden space-y-2 pt-0.5">
                <label className="text-[10px] font-bold text-zinc-200 uppercase tracking-wider block">
                  {t("shareModal.shareTo", "Share to")}
                </label>

                <div 
                  className="flex items-start gap-3.5 overflow-x-auto no-scrollbar py-1 px-1 scroll-smooth overscroll-contain"
                  onWheel={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                >
                  {mobileSocialPlatforms.map((platform) => (
                    <button
                      key={platform.id}
                      onClick={platform.onClick}
                      type="button"
                      className="group flex flex-col items-center gap-1.5 shrink-0 focus:outline-none cursor-pointer transition-transform active:scale-95"
                      title={platform.name}
                    >
                      <div className="w-13 h-13 rounded-full bg-zinc-900 border border-zinc-800/90 flex items-center justify-center text-zinc-200 group-hover:text-white group-hover:border-zinc-700 group-active:bg-zinc-800 transition-all duration-200 shadow-sm">
                        {platform.icon}
                      </div>
                      <span className="text-[11px] font-medium text-zinc-200 group-hover:text-white text-center truncate max-w-[64px] leading-tight select-none">
                        {platform.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Auxiliary Actions (Open in Browser, Report) */}
              <div className="pt-3 pb-1 mt-1 flex items-center justify-between border-t border-zinc-800/80">
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors font-medium cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{t("shareModal.openNewTab", "Open in new tab")}</span>
                </a>

                {onOpenReport && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenReport(video);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-red-400/90 hover:text-red-300 transition-colors font-medium cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>{t("shareModal.report", "Report")}</span>
                  </button>
                )}
              </div>
            </>
          ) : activeTab === "embed" ? (
            /* Inline Embed Video Code View */
            <div className="space-y-4 animate-in fade-in duration-150 py-1">
              <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-900/40 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-200 leading-relaxed">
                  <span className="font-bold text-white">{t("shareModal.embedAnywhere", "Embed Anywhere:")}</span> {t("shareModal.embedDesc", "Paste this responsive HTML snippet into your WordPress, Shopify, Webflow, or custom website.")}
                </p>
              </div>

              {/* Format Selector */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-wider">{t("shareModal.embedLayout", "Embed Layout")}</span>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setEmbedLayout("reel")}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      embedLayout === "reel"
                        ? "bg-white text-black shadow"
                        : "text-zinc-200 hover:text-white"
                    }`}
                  >
                    <span>📱 9:16 {t("shareModal.reel", "Reel")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmbedLayout("card")}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      embedLayout === "card"
                        ? "bg-white text-black shadow"
                        : "text-zinc-200 hover:text-white"
                    }`}
                  >
                    <span>🎴 {t("shareModal.card", "Card")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmbedLayout("widget")}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      embedLayout === "widget"
                        ? "bg-white text-black shadow"
                        : "text-zinc-200 hover:text-white"
                    }`}
                  >
                    <span>🌐 {t("shareModal.fullWidth", "Full Width")}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-wider">{t("shareModal.htmlCode", "HTML iFrame Code")}</span>
                  {embedCopied && (
                    <span className="text-[11px] font-bold text-zinc-200 animate-in fade-in flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-white" /> {t("shareModal.copied", "Copied!")}
                    </span>
                  )}
                </div>
                <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                  <pre className="text-[11px] font-mono text-zinc-200 overflow-x-auto whitespace-pre-wrap break-all pr-2 max-h-24">
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
                    <span>{t("shareModal.testPlayer", "Test player")}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                  <button
                    onClick={handleCopyEmbed}
                    type="button"
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-md ${
                      embedCopied
                        ? "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600 active:scale-95"
                        : "bg-white text-black hover:bg-zinc-200 active:scale-95"
                    }`}
                  >
                    {embedCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                        <span>{t("shareModal.copiedHtml", "Copied HTML!")}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{t("shareModal.copyCode", "Copy Code")}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Embed Live Preview in Realistic Smartphone Frame */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-wider">{t("shareModal.livePlayerPreview", "Live Player Preview")}</span>
                  <span className="text-[10px] font-medium text-zinc-200">{t("shareModal.interactiveMobilePlayer", "Interactive 9:16 Mobile Player")}</span>
                </div>
                <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 overflow-hidden shadow-2xl flex justify-center p-4">
                  <div className="relative w-full max-w-[280px] sm:max-w-[310px] aspect-[9/16] h-[490px] sm:h-[550px] rounded-[24px] border-4 border-zinc-800 bg-black overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                    <iframe
                      src={`${embedUrl}?layout=${embedLayout}`}
                      title="Yoouz Embed Preview"
                      className="w-full h-full border-0 bg-black"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Social Card Preview View */
            <div className="space-y-4 animate-in fade-in duration-150 py-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-wider">{t("shareModal.socialPreviewCard", "Social Preview Card")}</span>
                <a
                  href={previewImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
                >
                  <span>{t("shareModal.openFullImage", "Open Full Image")}</span>
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
                            (e.currentTarget as HTMLImageElement).src = `/api/avatar?name=${encodeURIComponent(title)}&background=27272a&color=fff&bold=true&size=128`;
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
                    <span className="text-[9px] font-bold text-zinc-200 uppercase tracking-wider">yoouz.com</span>
                    <h5 className="font-bold text-white text-xs sm:text-sm truncate mt-0.5">{title}</h5>
                    <p className="text-[11px] text-zinc-200 line-clamp-2 mt-0.5 font-medium leading-tight">
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
          <p className="text-[10px] text-zinc-200 font-medium">Yoouz • Real People. Real Reviews.</p>
          <button
            onClick={onClose}
            className="px-5 py-1.5 text-xs font-bold text-zinc-200 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer border border-zinc-700/80"
          >
            {t("common.done", "Done")}
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
