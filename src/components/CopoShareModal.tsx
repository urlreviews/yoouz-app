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
  Send,
  Search,
  Globe
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

// Authentic community contacts for the top row
const DEFAULT_COMMUNITY_CONTACTS = [
  { id: "c1", name: "Sophie Eats", handle: "sophie_eats", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80", verified: true },
  { id: "c2", name: "Alex Rover", handle: "alex_travels", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80", verified: true },
  { id: "c3", name: "Marcus Chen", handle: "marcus_foodie", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80", verified: false },
  { id: "c4", name: "Elena Style", handle: "elena_ny", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80", verified: true },
  { id: "c5", name: "David K.", handle: "david_taste", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&h=120&q=80", verified: false },
  { id: "c6", name: "Maya Lopez", handle: "maya_reviews", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&h=120&q=80", verified: true },
  { id: "c7", name: "Liam V.", handle: "liam_coffee", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&h=120&q=80", verified: false }
];

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
  const [activeView, setActiveView] = useState<"sheet" | "embed" | "preview">("sheet");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [sentContactId, setSentContactId] = useState<string | null>(null);

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      triggerHaptic("success");
      setCopied(true);
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

  const handleDirectSendToContact = (contact: typeof DEFAULT_COMMUNITY_CONTACTS[0]) => {
    triggerHaptic("medium");
    setSentContactId(contact.id);
    navigator.clipboard?.writeText?.(shareUrl).catch(() => {});
    setTimeout(() => {
      setSentContactId(null);
    }, 2500);
  };

  const shareText = isVideoMode && video
    ? `Watch ${video.author.name}'s authentic 60-second video review of ${video.placeName || "Business"} on Yoouz:`
    : `Check out ${title} on Yoouz — Authentic 60-second video reviews:`;

  // Authentic circular social apps with vivid brand colors matching TikTok/Instagram share sheets
  const socialChannels = [
    {
      id: "whatsapp",
      name: "WhatsApp",
      bg: "bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-emerald-500/20",
      icon: (
        <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 1.977 14.07 1.9 12.01 1.9c-5.44 0-9.866 4.372-9.87 9.802 0 1.714.453 3.39 1.31 4.88l-.994 3.63 3.734-.972h-.143zm11.367-7.584c-.321-.16-1.897-.938-2.185-1.043-.289-.104-.499-.158-.709.158-.21.317-.812 1.044-.995 1.254-.183.21-.366.237-.687.077-.321-.16-1.353-.499-2.577-1.59-1.002-.892-1.63-1.997-1.83-2.333-.2-.336-.022-.518.139-.677.145-.143.321-.374.482-.56.16-.187.214-.32.321-.534.107-.214.053-.4-.027-.56-.08-.16-.709-1.708-.971-2.339-.255-.612-.514-.53-.709-.54-.183-.009-.393-.011-.603-.011s-.552.079-.841.395c-.289.317-1.103 1.079-1.103 2.63s1.129 3.051 1.287 3.262c.158.21 2.22 3.391 5.377 4.754.752.325 1.339.519 1.797.665.755.24 1.443.206 1.987.125.606-.09 1.897-.775 2.16-1.485.263-.709.263-1.316.184-1.442-.079-.126-.289-.205-.61-.365z" />
        </svg>
      ),
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`
    },
    {
      id: "telegram",
      name: "Telegram",
      bg: "bg-[#229ED9] hover:bg-[#1f8fc4] text-white shadow-sky-500/20",
      icon: (
        <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.945z" />
        </svg>
      ),
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
    },
    {
      id: "messenger",
      name: "Messenger",
      bg: "bg-gradient-to-tr from-[#0084FF] to-[#00C6FF] text-white shadow-blue-500/20",
      icon: (
        <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.615 4.47 8.653V24l4.088-2.244c1.077.299 2.222.464 3.442.464 6.627 0 12-4.974 12-11.109C24 4.974 18.627 0 12 0zm1.192 14.962l-3.056-3.26-5.964 3.26 6.562-6.966 3.13 3.26 5.89-3.26-6.562 6.966z" />
        </svg>
      ),
      url: `https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&app_id=291494419107518&redirect_uri=${encodeURIComponent(shareUrl)}`
    },
    {
      id: "x",
      name: "X (Twitter)",
      bg: "bg-black text-white ring-1 ring-zinc-700 shadow-zinc-900/50",
      icon: (
        <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
    },
    {
      id: "facebook",
      name: "Facebook",
      bg: "bg-[#1877F2] hover:bg-[#166fe5] text-white shadow-blue-600/20",
      icon: <Facebook className="w-6 h-6 text-white fill-current" />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    },
    {
      id: "gmail",
      name: "Gmail",
      bg: "bg-[#EA4335] hover:bg-[#d93025] text-white shadow-red-500/20",
      icon: (
        <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
          <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
        </svg>
      ),
      url: `https://mail.google.com/mail/?view=cm&fs=1&tf=1&su=${encodeURIComponent(title || "Yoouz")}&body=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`
    },
    {
      id: "outlook",
      name: "Outlook",
      bg: "bg-[#0078D4] hover:bg-[#006cbd] text-white shadow-blue-500/20",
      icon: (
        <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
          <path d="M22.125 4.5H13.5v3.667L24 12V6.375C24 5.344 23.156 4.5 22.125 4.5zM13.5 15.833V19.5h8.625C23.156 19.5 24 18.656 24 17.625V12l-10.5 3.833zm-2.25-13.833H1.875C.844 2 0 2.844 0 3.875v16.25C0 21.156.844 22 1.875 22h9.375C12.281 22 13.125 21.156 13.125 20.125V3.875C13.125 2.844 12.281 2 11.25 2zm-2.734 14.125c-.484 0-.914-.109-1.289-.328-.375-.219-.664-.523-.867-.914-.203-.391-.305-.836-.305-1.336 0-.5.102-.945.305-1.336.203-.391.492-.695.867-.914.375-.219.805-.328 1.289-.328.492 0 .922.109 1.289.328.367.219.656.523.867.914.211.391.316.836.316 1.336 0 .5-.105.945-.316 1.336-.211.391-.5.695-.867.914-.367.219-.797.328-1.289.328zm0-1.477c.305 0 .547-.102.727-.305.18-.203.27-.477.27-.82 0-.336-.09-.609-.27-.82-.18-.211-.422-.316-.727-.316-.297 0-.539.105-.727.316-.188.211-.281.484-.281.82 0 .344.094.617.281.82.188.203.43.305.727.305z" />
        </svg>
      ),
      url: `https://outlook.live.com/owa/?path=/mail/action/compose&subject=${encodeURIComponent(title || "Yoouz")}&body=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      bg: "bg-[#0A66C2] hover:bg-[#095196] text-white shadow-blue-700/20",
      icon: <Linkedin className="w-5 h-5 text-white fill-current" />,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    },
    {
      id: "reddit",
      name: "Reddit",
      bg: "bg-[#FF4500] hover:bg-[#e03d00] text-white shadow-orange-500/20",
      icon: (
        <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.703zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.688-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
        </svg>
      ),
      url: `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title || "Yoouz Video Review")}`
    }
  ];

  // Action Tools Row (Embed, Social Card, Open Web, Report)
  const actionTools = [
    {
      id: "embed",
      name: "Embed Code",
      icon: <Code className="w-5 h-5 text-blue-400" />,
      onClick: () => setActiveView("embed")
    },
    {
      id: "preview",
      name: "Social Card",
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
      onClick: () => setActiveView("preview")
    },
    {
      id: "open",
      name: "Open Link",
      icon: <ExternalLink className="w-5 h-5 text-zinc-300" />,
      onClick: () => {
        window.open(shareUrl, "_blank", "noopener,noreferrer");
      }
    },
    ...(onOpenReport ? [{
      id: "report",
      name: "Report",
      icon: <Flag className="w-5 h-5 text-red-400" />,
      onClick: () => {
        onClose();
        onOpenReport(video);
      }
    }] : [])
  ];

  const filteredContacts = searchQuery.trim()
    ? DEFAULT_COMMUNITY_CONTACTS.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.handle.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : DEFAULT_COMMUNITY_CONTACTS;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex flex-col justify-end sm:justify-center sm:items-center bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 text-white"
    >
      {/* Background click to dismiss */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {/* Pop-up Drawer Card: Mobile Bottom Sheet + Desktop Floating Dialog */}
      <div 
        className="relative z-10 w-full sm:max-w-[480px] bg-zinc-900/95 backdrop-blur-2xl rounded-t-[28px] sm:rounded-3xl shadow-2xl border-t sm:border border-zinc-800 flex flex-col max-h-[85vh] sm:max-h-[88vh] overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-250 text-white pb-safe"
        style={{
          transform: dragOffsetY > 0 ? `translateY(${dragOffsetY}px)` : undefined,
          transition: dragOffsetY === 0 ? "transform 0.2s ease-out" : "none"
        }}
        onClick={(e) => e.stopPropagation()}
        {...swipeProps}
      >
        {/* Top Drag Indicator Pill */}
        <div className="pt-2.5 pb-1 flex justify-center shrink-0 cursor-grab active:cursor-grabbing sm:hidden">
          <div className="w-10 h-1.5 rounded-full bg-zinc-700/80" />
        </div>

        {/* Header (TikTok/Instagram style) */}
        <div className="px-4 pt-1.5 pb-3 flex items-center justify-between border-b border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              type="button"
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                showSearch ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
              title="Search contacts"
            >
              <Search className="w-4 h-4" />
            </button>
            <h3 className="font-bold text-white text-base tracking-tight">
              {activeView === "embed" ? "Embed Video" : activeView === "preview" ? "Social Card Preview" : "Send to"}
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            {activeView !== "sheet" && (
              <button
                onClick={() => setActiveView("sheet")}
                className="text-xs font-semibold text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-zinc-800 transition"
              >
                Back
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar Input (if toggled) */}
        {showSearch && activeView === "sheet" && (
          <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-950/60 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-700/80 rounded-xl focus-within:border-blue-500">
              <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <input
                type="text"
                placeholder="Search friends or contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-zinc-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="overflow-y-auto flex-1 overscroll-contain min-h-0 divide-y divide-zinc-800/60">
          {activeView === "sheet" ? (
            <>
              {/* ROW 1: Quick Send to Community Friends / Contacts */}
              <div className="py-3 pl-4">
                <div className="flex items-center justify-between pr-4 mb-2.5">
                  <span className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase">Direct Share</span>
                  {sentContactId && (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 animate-in fade-in">
                      <Check className="w-3 h-3 text-emerald-400" /> Link shared!
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 overflow-x-auto pb-1.5 pr-4 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none]">
                  {filteredContacts.map((contact) => {
                    const isSent = sentContactId === contact.id;
                    return (
                      <button
                        key={contact.id}
                        onClick={() => handleDirectSendToContact(contact)}
                        className="group flex flex-col items-center shrink-0 w-[68px] cursor-pointer focus:outline-none"
                      >
                        <div className="relative mb-1.5">
                          <img
                            src={contact.avatar}
                            alt={contact.name}
                            className={`w-13 h-13 rounded-full object-cover ring-2 transition duration-200 group-hover:scale-105 ${
                              isSent ? "ring-emerald-400" : "ring-zinc-700/80 group-hover:ring-white"
                            }`}
                          />
                          {isSent ? (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg animate-in zoom-in-50">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                              <Send className="w-2.5 h-2.5 text-blue-400" />
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-zinc-300 group-hover:text-white truncate w-full text-center leading-tight">
                          {contact.name.split(" ")[0]}
                        </span>
                        <span className="text-[9px] text-zinc-500 truncate w-full text-center">
                          @{contact.handle}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ROW 2: Vibrant Circular Social & Chat Channels (WhatsApp, Messenger, X, etc.) */}
              <div className="py-3.5 pl-4">
                <div className="flex items-center justify-between pr-4 mb-2.5">
                  <span className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase">Social & Messaging</span>
                  {copied && (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 animate-in fade-in">
                      <Check className="w-3 h-3 text-emerald-400" /> Link copied!
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 overflow-x-auto pb-2 pr-4 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none]">
                  {/* First item: Copy Link */}
                  <button
                    onClick={handleCopy}
                    className="group flex flex-col items-center shrink-0 w-[68px] cursor-pointer focus:outline-none"
                  >
                    <div className={`w-13 h-13 rounded-full flex items-center justify-center shadow-md transition duration-200 group-hover:scale-105 mb-1.5 ${
                      copied ? "bg-emerald-500 text-black" : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
                    }`}>
                      {copied ? <Check className="w-6 h-6 stroke-[3]" /> : <Copy className="w-6 h-6" />}
                    </div>
                    <span className="text-[11px] font-medium text-zinc-300 group-hover:text-white truncate w-full text-center">
                      {copied ? "Copied!" : "Copy link"}
                    </span>
                  </button>

                  {/* Native Device Share */}
                  {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                    <button
                      onClick={handleNativeShare}
                      className="group flex flex-col items-center shrink-0 w-[68px] cursor-pointer focus:outline-none"
                    >
                      <div className="w-13 h-13 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20 transition duration-200 group-hover:scale-105 mb-1.5">
                        <Send className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-medium text-zinc-300 group-hover:text-white truncate w-full text-center">
                        Device Share
                      </span>
                    </button>
                  )}

                  {/* App Buttons */}
                  {socialChannels.map((channel) => (
                    <a
                      key={channel.id}
                      href={channel.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col items-center shrink-0 w-[68px] cursor-pointer focus:outline-none"
                    >
                      <div className={`w-13 h-13 rounded-full flex items-center justify-center shadow-md transition duration-200 group-hover:scale-105 mb-1.5 ${channel.bg}`}>
                        {channel.icon}
                      </div>
                      <span className="text-[11px] font-medium text-zinc-300 group-hover:text-white truncate w-full text-center">
                        {channel.name}
                      </span>
                    </a>
                  ))}
                </div>
              </div>

              {/* ROW 3: Quick Action Tools (Embed, Social Card, Report) */}
              <div className="py-3 pl-4">
                <span className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase block mb-2.5">Tools & Options</span>
                <div className="flex items-center gap-3 overflow-x-auto pb-1.5 pr-4 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none]">
                  {actionTools.map((action) => (
                    <button
                      key={action.id}
                      onClick={action.onClick}
                      className="group flex flex-col items-center shrink-0 w-[68px] cursor-pointer focus:outline-none"
                    >
                      <div className="w-12 h-12 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center shadow-sm transition duration-200 group-hover:scale-105 mb-1.5">
                        {action.icon}
                      </div>
                      <span className="text-[11px] font-medium text-zinc-400 group-hover:text-white truncate w-full text-center">
                        {action.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* BOTTOM: Compact Direct Copy & Preview Pill */}
              <div className="p-4 bg-zinc-950/60">
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5 shadow-inner">
                  <div className="w-7 h-7 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0 ml-1">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    onFocus={(e) => e.target.select()}
                    className="flex-1 bg-transparent px-1 py-1 text-xs text-zinc-300 font-mono focus:outline-none select-all truncate min-w-0"
                  />
                  <button
                    onClick={handleCopy}
                    type="button"
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-sm ${
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
            </>
          ) : activeView === "embed" ? (
            /* Inline Embed Video Code View */
            <div className="p-4 sm:p-5 space-y-4 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-800/50 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-200/90 leading-relaxed">
                  <span className="font-bold text-white">Embed on Any Website:</span> Paste this responsive HTML snippet into your WordPress, Shopify, Webflow, or Squarespace page.
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">HTML iFrame Snippet</p>
                  {embedCopied && (
                    <span className="text-[11px] font-bold text-emerald-400 animate-in fade-in flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Copied HTML!
                    </span>
                  )}
                </div>
                <div className="relative bg-zinc-950 border border-zinc-800 rounded-xl p-3">
                  <pre className="text-[11px] font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap break-all pr-2 max-h-24">
                    {iframeEmbedCode}
                  </pre>
                </div>
                <div className="flex items-center justify-between pt-1 gap-2">
                  <a
                    href={embedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors truncate"
                  >
                    <span>Test embed player in new tab</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                  <button
                    onClick={handleCopyEmbed}
                    type="button"
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-md ${
                      embedCopied
                        ? "bg-emerald-500 text-black"
                        : "bg-white text-black hover:bg-zinc-200 active:scale-95"
                    }`}
                  >
                    {embedCopied ? (
                      <>
                        <Check className="w-4 h-4 text-black stroke-[3]" />
                        <span>Copied HTML!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Embed Live Preview */}
              <div className="pt-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Live Player Preview</p>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl flex justify-center p-3">
                  <iframe
                    src={embedUrl}
                    title="Yoouz Embed Preview"
                    className="w-full max-w-[260px] h-[340px] rounded-xl border-0 bg-black shadow-lg"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Social Card Preview View */
            <div className="p-4 sm:p-5 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Social Media Preview Card</p>
                <a
                  href={previewImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
                >
                  <span>Open Full Card</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {isSquarePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 p-3.5 flex items-center gap-3.5 shadow-inner">
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
                <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-inner group max-h-48 flex items-center justify-center">
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

        {/* Footer / Done button */}
        <div className="px-4 py-2.5 bg-zinc-950/80 border-t border-zinc-800/80 flex items-center justify-between shrink-0">
          <p className="text-[10px] text-zinc-500 font-medium">Yoouz • Real People. Real Reviews.</p>
          <button
            onClick={onClose}
            className="px-5 py-1.5 text-xs font-bold text-zinc-200 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors cursor-pointer border border-zinc-700"
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
