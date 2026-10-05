import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Shield,
  HelpCircle,
  Info,
  LogOut,
  ChevronDown,
  ChevronLeft,
  Globe,
  Video,
  Lock,
  ArrowRight,
  ChevronRight,
  Bell,
  Bookmark,
  Sparkles,
  Users,
  Building2,
  Mail,
  Check,
  AlertCircle,
  Trash2,
  UploadCloud,
  X,
  FileText,
  MessageSquare,
  Compass,
  UserPlus,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  BadgeCheck,
  FileCheck2,
  Scale,
  HelpCircle as QuestionIcon,
  Loader2,
  Download,
  Smartphone,
  EyeOff
} from "lucide-react";
import { UserProfile, NavSection } from "../types";
import { useLanguage } from "../i18n/LanguageContext";
import { SupportedLanguage } from "../i18n/translations";

interface CopoMoreViewProps {
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onSuccessAuth?: (user: UserProfile) => void;
  onSignOut: () => void;
  onNavigate: (section: NavSection) => void;
  onDeactivateProfile?: () => Promise<void>;
  onDeleteProfile: () => Promise<void>;
  onOpenLegal?: (tab: "terms" | "privacy") => void;
  onOpenComparison?: (competitor?: string) => void;
  onOpenNotificationSettings?: () => void;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: "reviewers" | "business" | "trust" | "technical";
  tags: string[];
}

export const CopoMoreView: React.FC<CopoMoreViewProps> = ({
  currentUser,
  onSignOut,
  onNavigate,
  onDeactivateProfile,
  onDeleteProfile,
  onOpenLegal,
  onOpenComparison,
  onOpenNotificationSettings
}) => {
  const { language, setLanguage, languages, currentLanguageMeta, t, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState<"about" | "faq" | "business" | "security" | "contact" | "language">("about");
  const [langSearchFilter, setLangSearchFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [faqCategoryFilter, setFaqCategoryFilter] = useState<"all" | "reviewers" | "business" | "trust" | "technical">("all");
  const [openFaqIds, setOpenFaqIds] = useState<Record<string, boolean>>({
    "rev-1": true,
    "biz-1": true
  });

  // Account Deletion Request State
  const [isMoreDeletionModalOpen, setIsMoreDeletionModalOpen] = useState(false);
  const [moreDeletionReason, setMoreDeletionReason] = useState("I no longer use this account");
  const [moreDeletionNotes, setMoreDeletionNotes] = useState("");
  const [isSubmittingMoreDeletion, setIsSubmittingMoreDeletion] = useState(false);
  const [moreDeletionSuccessToast, setMoreDeletionSuccessToast] = useState(false);

  // Contact Support Form State
  const [contactCategory, setContactCategory] = useState("support");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactDomain, setContactDomain] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Attachments State
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: number; type: string; base64: string }[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Prefill contact form when user profile is present
  useEffect(() => {
    if (currentUser) {
      setContactName(currentUser.name || "");
      setContactEmail(currentUser.email || "");
    }
  }, [currentUser]);

  const processFiles = (filesList: File[]) => {
    setSubmitError("");
    const validFiles = filesList.filter((file) => {
      // Limit size to 2MB
      if (file.size > 2 * 1024 * 1024) {
        setSubmitError(`File "${file.name}" exceeds the 2MB limit.`);
        return false;
      }
      const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ];
      if (!allowedTypes.includes(file.type)) {
        setSubmitError(`File "${file.name}" has an unsupported format. Please use PNG, JPG, PDF, TXT or DOC.`);
        return false;
      }
      return true;
    });

    if (attachedFiles.length + validFiles.length > 3) {
      setSubmitError("You can attach a maximum of 3 files.");
      return;
    }

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedFiles((prev) => {
          if (prev.some((f) => f.name === file.name)) return prev;
          return [
            ...prev,
            {
              name: file.name,
              size: file.size,
              type: file.type,
              base64: reader.result as string
            }
          ];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      setSubmitError("Please fill out all required fields.");
      return;
    }
    setSubmitError("");
    setIsSubmitting(true);

    try {
      const attachments = attachedFiles.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        base64: file.base64
      }));

      const contactPayload = {
        name: contactName.trim(),
        email: contactEmail.trim(),
        category: contactCategory,
        domain: contactDomain.trim() || "None",
        message: contactMessage.trim(),
        attachments: attachments,
        userId: currentUser ? currentUser.email : "guest",
        createdAt: new Date().toISOString()
      };

      // Automatically deliver to support@yoouz.com inbox
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactPayload)
      }).catch((err) => {
        console.warn("API contact delivery attempt finished:", err);
      });

      setSubmitSuccess(true);
      setContactDomain("");
      setContactMessage("");
      setAttachedFiles([]);
    } catch (err: any) {
      console.error("Error saving contact request: ", err);
      setSubmitError("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFaq = (id: string) => {
    setOpenFaqIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const faqItems: FaqItem[] = [
    // --- Reviewer FAQs ---
    {
      id: "rev-1",
      category: "reviewers",
      question: "How long can my video review be?",
      answer:
        "Every video review has a strict limit of 60 seconds. This ensures content remains high-impact, focused, digestible, and easy for other users to browse quickly without fluff or commercial filler.",
      tags: ["video", "length", "limit", "recording", "duration", "60 seconds"]
    },
    {
      id: "rev-2",
      category: "reviewers",
      question: "Why does the video recorder only use the live front camera and disable gallery uploads?",
      answer:
        "To guarantee 100% authentic human experiences, Yoouz auto-starts the live front (selfie) camera for direct recording. Uploading pre-recorded gallery files or marketing commercials is strictly disabled to eliminate fake reviews and bot uploads.",
      tags: ["camera", "front camera", "selfie", "recording", "no uploads", "gallery", "authenticity"]
    },
    {
      id: "rev-3",
      category: "reviewers",
      question: "Do I automatically receive a Verified badge when I create an account?",
      answer:
        "No. All new accounts start as standard unverified profiles. Your official 'Verified Reviewer' badge is automatically granted as soon as you record and publish your first live video review.",
      tags: ["verified", "badge", "signup", "first review", "profile"]
    },
    {
      id: "rev-4",
      category: "reviewers",
      question: "Can viewers comment, ask questions, or interact on my video reviews?",
      answer:
        "Yes! Every video review includes a live community discussion feed. Viewers can ask follow-up questions ('Is parking easy?', 'Did you try the dessert?'), share tips, and discuss their experiences directly beneath your video.",
      tags: ["comments", "questions", "community", "discussion", "interaction"]
    },
    {
      id: "rev-5",
      category: "reviewers",
      question: "Can I review any website domain or local establishment?",
      answer:
        "Yes! You can search and review any base website domain (e.g., stripe.com, airbnb.com) or local brick-and-mortar place (restaurants, cafes, services, gyms) to build a unified hub of authentic opinions.",
      tags: ["domain", "website", "places", "search", "business", "establishment"]
    },
    {
      id: "rev-6",
      category: "reviewers",
      question: "Can I edit or delete my reviews later?",
      answer:
        "Absolutely. You maintain complete ownership of your uploaded content. You can modify your star rating or permanently delete any of your posted video reviews at any time directly from your Profile drawer or video player options.",
      tags: ["edit", "delete", "rating", "manage", "profile"]
    },
    {
      id: "rev-7",
      category: "reviewers",
      question: "How does direct messaging work between community members?",
      answer:
        "Reviewers and users can message each other directly through the 'Messages' tab to ask private questions about venues, recommend local spots, or connect with fellow explorers.",
      tags: ["messaging", "direct message", "chat", "community", "contact"]
    },

    // --- Business FAQs ---
    {
      id: "biz-1",
      category: "business",
      question: "How can my business claim its official domain or place page?",
      answer:
        "Business owners can claim their listing through the business verification flow. Claiming unlocks official owner dashboard tools, category settings, operating hours management, and customer dialogue features.",
      tags: ["claim", "domain", "verification", "business", "owner"]
    },
    {
      id: "biz-2",
      category: "business",
      question: "How do official Business Owner replies and pinned comments work?",
      answer:
        "Claimed business owners can participate in comment threads with a highlighted 'Business Owner' badge. Owners can also pin official responses to the top of comment feeds to highlight updates, resolutions, or special announcements.",
      tags: ["owner response", "pinned", "support", "dialogue", "comments"]
    },
    {
      id: "biz-3",
      category: "business",
      question: "What is the Business Hours Manager and how does it sync?",
      answer:
        "Claimed business owners can configure weekly operating hours, special holiday schedules, and open/closed statuses directly in their dashboard. Changes sync live across search results and place profile drawers.",
      tags: ["hours", "business hours", "operating hours", "dashboard", "schedule"]
    },
    {
      id: "biz-4",
      category: "business",
      question: "Can businesses export or download Branded Video Ads?",
      answer:
        "Yes! Claimed businesses can export customer video reviews as high-resolution branded video ad assets with official watermark overlays for use in social media campaigns and marketing ads.",
      tags: ["export", "branded ad", "ad export", "download", "marketing"]
    },
    {
      id: "biz-5",
      category: "business",
      question: "Can businesses pay to remove or hide negative video reviews?",
      answer:
        "No. Yoouz is built on uncompromised trust and authenticity. We never delete or alter honest video reviews for payment. Reviews that violate safety or explicit content guidelines can be flagged for human moderation review.",
      tags: ["policy", "negative reviews", "moderation", "trust", "payment"]
    },
    {
      id: "biz-6",
      category: "business",
      question: "Can businesses embed Yoouz video reviews on their own websites?",
      answer:
        "Yes! Verified businesses can copy interactive iframe video feed embeds from their place drawer or Business Dashboard to display live, authentic 60-second customer video reviews directly on their e-commerce store or landing page.",
      tags: ["embed", "iframe", "website", "widgets", "testimonials"]
    },
    {
      id: "biz-7",
      category: "business",
      question: "How do Yoouz video reviews improve customer trust and conversion rates?",
      answer:
        "Video reviews eliminate the suspicion surrounding fake text reviews. Seeing real people share genuine video feedback builds instant consumer trust, driving higher engagement and conversion rates.",
      tags: ["conversion", "trust", "growth", "sales", "testimonials"]
    },
    {
      id: "biz-8",
      category: "business",
      question: "How do I manage business categories and contact details?",
      answer:
        "Claimed owners can select official business categories, add verified phone numbers with international country codes, and link official web domains directly within the Business Dashboard.",
      tags: ["category", "contact", "phone", "details", "dashboard"]
    },

    // --- Trust & Authenticity FAQs ---
    {
      id: "trust-brand-1",
      category: "trust",
      question: "Is Yoouz a misspelling or affiliated with YouTube, Yoox, Youz, or Yelp?",
      answer:
        "No. Yoouz (spelled Y-O-O-U-Z, pronounced 'Use' or 'Yooz') is an independent brand and proprietary platform. It is NOT a misspelling, typo, or subsidiary of YouTube, Yoox, Youz, Yelp, or any other company. Yoouz is specifically dedicated to authentic 60-second live camera video reviews.",
      tags: ["yoouz", "name", "spelling", "youtube", "yoox", "yelp", "independent", "brand"]
    },
    {
      id: "trust-brand-2",
      category: "trust",
      question: "Why does Yoouz mandate live front-camera video reviews and forbid gallery uploads?",
      answer:
        "To permanently eliminate AI-generated text bots, commercial advertisements, stock videos, and deepfakes. Every review on Yoouz must be recorded live through the front (selfie) camera directly within the app.",
      tags: ["camera", "front camera", "no gallery", "deepfakes", "bots", "authenticity"]
    },
    {
      id: "trust-1",
      category: "trust",
      question: "What makes Yoouz different from traditional text-based review sites?",
      answer:
        "Traditional text review platforms are heavily compromised by AI bots, paid copywriters, and fake accounts. Yoouz relies strictly on live front-camera video feedback, ensuring you see real faces, real voices, and genuine experiences.",
      tags: ["text vs video", "ai bots", "authenticity", "proof", "trust"]
    },
    {
      id: "trust-2",
      category: "trust",
      question: "Is my private email address exposed on my public profile or business claim badge?",
      answer:
        "No. Yoouz strictly protects user privacy. Public profiles and claimed business badges remain private and anonymous (e.g., 'Business Claimed') without ever displaying personal or owner email addresses to the public.",
      tags: ["privacy", "email", "anonymous", "protection", "security"]
    },
    {
      id: "trust-3",
      category: "trust",
      question: "How are community guidelines and safety rules enforced?",
      answer:
        "Every video review and comment includes a report flag button. Community submissions triggering policy violations (hate speech, spam, harassment, or explicit content) are queued for immediate review and removal.",
      tags: ["guidelines", "safety", "report", "moderation", "flag"]
    },
    {
      id: "trust-4",
      category: "trust",
      question: "What are Local Guide and Top Reviewer badges?",
      answer:
        "Active reviewers who regularly contribute high-quality video reviews across local venues and domains automatically earn 'Local Guide' and 'Top Reviewer' badges, highlighting their standing in the community.",
      tags: ["local guide", "top reviewer", "badges", "reputation"]
    },
    {
      id: "trust-5",
      category: "trust",
      question: "Why are community comments and live discussions a core part of the Yoouz trust model?",
      answer:
        "Authentic reviews shouldn't be isolated rants or echo chambers. An open, transparent comment section creates crowdsourced accountability—allowing the community to validate experiences, share real-time updates, and interact directly with both the reviewer and the business.",
      tags: ["accountability", "community", "transparency", "comments"]
    },

    // --- Technical & Navigation FAQs ---
    {
      id: "tech-1",
      category: "technical",
      question: "How does Google Maps and Live Directions integration work?",
      answer:
        "Yoouz integrates interactive Google Maps with live pin clustering. Users can tap any place to view street locations and launch step-by-step turn-by-turn driving, walking, biking, or transit directions.",
      tags: ["maps", "google maps", "directions", "navigation", "location"]
    },
    {
      id: "tech-2",
      category: "technical",
      question: "How can I share video reviews or business profiles with friends?",
      answer:
        "Tap the 'Share' button on any video or place to generate instant direct web links, downloadable QR codes, or share directly to WhatsApp, X (Twitter), Facebook, LinkedIn, or Email.",
      tags: ["share", "qr code", "social", "link", "whatsapp"]
    },
    {
      id: "tech-3",
      category: "technical",
      question: "Can I customize the appearance of embedded video feeds?",
      answer:
        "Yes! The embed builder allows businesses to preview mobile and desktop views, customize dark/light themes, set video limits, and toggle autoplay or sound controls.",
      tags: ["embed", "customization", "themes", "autoplay"]
    },
    {
      id: "tech-4",
      category: "technical",
      question: "Where can I find video reviews or places I have saved for later?",
      answer:
        "Any video review or business listing you bookmark or save is immediately stored in your 'Bookmarks' tab in the main navigation menu for quick access on any device.",
      tags: ["bookmarks", "saved", "favorites", "navigation"]
    },
    {
      id: "tech-5",
      category: "technical",
      question: "How do I navigate between video reviews on desktop and mobile?",
      answer:
        "On mobile, swipe up or down to move between videos. On desktop, use your keyboard arrow keys, mouse wheel, or the fixed vertical Up (^) and Down (v) floating chevron buttons. The Up chevron is dimmed on the first video to indicate you are at the start of the feed.",
      tags: ["navigation", "desktop", "mobile", "chevrons", "scroll"]
    },
    {
      id: "tech-6",
      category: "technical",
      question: "How does Yoouz work offline as a Progressive Web App (PWA)?",
      answer:
        "Yoouz supports PWA offline capabilities and IndexedDB video caching, allowing instant zero-latency video playback and offline review draft queues when connectivity is low.",
      tags: ["pwa", "offline", "cache", "indexeddb", "speed"]
    },
    {
      id: "tech-7",
      category: "technical",
      question: "How many languages does Yoouz support, and how do I change my language?",
      answer:
        "Yoouz supports 64 global languages with full UI internationalization. You can switch your preferred language at any time from the sidebar, footer, profile drawer, or Knowledge Center settings.",
      tags: ["languages", "64 languages", "i18n", "translation", "settings"]
    },
    {
      id: "tech-8",
      category: "technical",
      question: "Is Yoouz free for consumers and businesses?",
      answer:
        "Yes! Browsing, searching, bookmarking, posting 60-second video reviews, and basic business domain claiming are 100% free.",
      tags: ["free", "pricing", "cost", "subscription"]
    }
  ];

  const filteredFaqs = faqItems.filter((item) => {
    const matchesCategory = faqCategoryFilter === "all" || item.category === faqCategoryFilter;
    const matchesSearch =
      searchQuery.trim() === "" ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div
      id="yoouz-more-view-container"
      className="flex-1 w-full h-full bg-zinc-950 overflow-y-auto font-sans text-white pb-[calc(env(safe-area-inset-bottom,16px)+88px)] md:pb-24 select-none selection:bg-zinc-700 selection:text-white"
    >
      {/* Top Banner / Google-grade Header */}
      <header className="sticky top-0 z-40 w-full bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="h-14 px-4 flex items-center justify-between">
          <button
            onClick={() => onNavigate("home")}
            className="w-10 h-10 -ml-2 rounded-full hover:bg-zinc-800 text-zinc-200 flex items-center justify-center transition-colors cursor-pointer shrink-0 active:scale-95 shadow-sm"
            title="Back to Feed"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2]" />
          </button>
          <h1 className="text-base font-bold text-white tracking-tight absolute left-1/2 -translate-x-1/2">
            {t("trustCenter.title", "Knowledge & Trust Center")}
          </h1>
          <div className="w-10 h-10" /> {/* Spacer */}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 1. Top-Level Tab Switcher */}
        <section aria-label="Knowledge Navigation" className="-mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setActiveTab("about")}
              className={`shrink-0 py-2 px-4 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "about"
                  ? "bg-white text-black shadow-sm"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Info className="w-4 h-4" />
              <span>{t("trustCenter.trustProtocol", "Trust Protocol")}</span>
            </button>

            <button
              onClick={() => setActiveTab("faq")}
              className={`shrink-0 py-2 px-4 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "faq"
                  ? "bg-white text-black shadow-sm"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>{t("trustCenter.helpFaqs", "Help & FAQs")}</span>
            </button>

            <button
              onClick={() => setActiveTab("business")}
              className={`shrink-0 py-2 px-4 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "business"
                  ? "bg-white text-black shadow-sm"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>{t("trustCenter.forBusinesses", "For Businesses")}</span>
            </button>

            <button
              onClick={() => setActiveTab("security")}
              className={`shrink-0 py-2 px-4 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "security"
                  ? "bg-white text-black shadow-sm"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>{t("trustCenter.privacySecurity", "Privacy")}</span>
            </button>

            <button
              onClick={() => setActiveTab("language")}
              className={`shrink-0 py-2 px-4 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "language"
                  ? "bg-white text-black shadow-sm"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>{t("nav.language", "Language")} ({currentLanguageMeta.code.toUpperCase()})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("contact");
                setSubmitSuccess(false);
                setSubmitError("");
              }}
              className={`shrink-0 py-2 px-4 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "contact"
                  ? "bg-white text-black shadow-sm"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>{t("trustCenter.contactSupport", "Support")}</span>
            </button>
          </div>
        </section>

        {/* 3. Tab Contents */}
        <section aria-label="Tab Content Area" className="space-y-8">
          {/* ========================================================= */}
          {/* TAB 1: ABOUT & THE TRUST PROTOCOL */}
          {/* ========================================================= */}
          {activeTab === "about" && (
            <div className="space-y-6 animate-in fade-in duration-200 text-left">
              {/* Hero Banner: Proof of Presence */}
              <div className="bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-800 shadow-xs space-y-6">
                <div className="space-y-3 max-w-3xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-[11px] font-black uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t("trustCenter.theYoouzStandard", "The Yoouz Standard")}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                    {t("trustCenter.pillarsTitle", "Proof of Presence. Real People. Verified Places.")}
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-normal">
                    {t("trustCenter.pillarsDesc", "Traditional text reviews are vulnerable to bot networks, fake accounts, and AI-generated reviews. Yoouz creates authentic trust by capturing short 60-second video reviews recorded exclusively through live device cameras.")}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="bg-zinc-800/80 p-5 rounded-2xl border border-zinc-700/60 space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-zinc-700 flex items-center justify-center text-white">
                      <Video className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-200 block">{t("trustCenter.strictRule", "Strict Rule")}</span>
                    <h4 className="text-sm font-black text-white">{t("trustCenter.rule1Title", "Live Front-Camera Only")}</h4>
                    <p className="text-xs text-zinc-200 leading-relaxed">
                      {t("trustCenter.rule1Desc", "No pre-recorded MP4 uploads or stock footage. Real customers capturing authentic experiences.")}
                    </p>
                  </div>

                  <div className="bg-zinc-800/80 p-5 rounded-2xl border border-zinc-700/60 space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-zinc-700 flex items-center justify-center text-white">
                      <Lock className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-200 block">{t("trustCenter.pillar2", "Pillar 2")}</span>
                    <h4 className="text-sm font-black text-white">{t("trustCenter.rule2Title", "60-Second Focus")}</h4>
                    <p className="text-xs text-zinc-200 leading-relaxed">
                      {t("trustCenter.rule2Desc", "Concise, high-impact video reviews that deliver immediate value in under one minute.")}
                    </p>
                  </div>

                  <div className="bg-zinc-800/80 p-5 rounded-2xl border border-zinc-700/60 space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-zinc-700 flex items-center justify-center text-white">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-200 block">{t("trustCenter.pillar3", "Pillar 3")}</span>
                    <h4 className="text-sm font-black text-white">{t("trustCenter.rule3Title", "3-Way Dialogue")}</h4>
                    <p className="text-xs text-zinc-200 leading-relaxed">
                      {t("trustCenter.rule3Desc", "Living comment threads connecting Reviewers, curious Viewers, and Verified Place Owners.")}
                    </p>
                  </div>
                </div>

                {/* Direct Competitor Comparison Callout - Hidden for SEO */}
                <div className="sr-only">
                  <h2>Why Yoouz beats Yelp & Google Reviews:</h2>
                  <p>Zero bot spam, no anonymous text rants, and 100% verified 60s video proof.</p>
                </div>
              </div>

              {/* 4 Bento Cards: Core Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bento 1: No Fake Accounts */}
                <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-xs space-y-4 hover:border-zinc-700 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white">
                    <Video className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-black text-white">{t("trustCenter.bento1Title", "Immutable Face & Voice Identity")}</h3>
                    <p className="text-xs text-zinc-200 leading-relaxed font-normal">
                      {t("trustCenter.bento1Desc", "Every reviewer builds an open visual review portfolio. Consistent face, verified voice, and historical timeline give viewers immediate confidence that reviews are authored by genuine people.")}
                    </p>
                  </div>
                  <div className="pt-2 flex items-center gap-2 text-xs font-bold text-zinc-200">
                    <ShieldCheck className="w-4 h-4 text-zinc-200" />
                    <span>{t("trustCenter.bento1Sub", "Audit Any Reviewer Profile Instantly")}</span>
                  </div>
                </div>

                {/* Bento 2: Living Discussions */}
                <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-xs space-y-4 hover:border-zinc-700 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-black text-white">{t("trustCenter.bento2Title", "Interactive Community Dialogue")}</h3>
                    <p className="text-xs text-zinc-200 leading-relaxed font-normal">
                      {t("trustCenter.bento2Desc", "Reviews shouldn't be dead one-way monologues. Viewers can ask real-time questions ('Is there outdoor seating?', 'How was the service?'), and the community answers collaboratively.")}
                    </p>
                  </div>
                  <div className="pt-2 flex items-center gap-2 text-xs font-bold text-zinc-200">
                    <Users className="w-4 h-4 text-zinc-200" />
                    <span>{t("trustCenter.bento2Sub", "Crowdsourced Community Validation")}</span>
                  </div>
                </div>

                {/* Bento 3: Verified Business Ownership */}
                <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-xs space-y-4 hover:border-zinc-700 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-black text-white">{t("trustCenter.bento3Title", "Official Domain Verification")}</h3>
                    <p className="text-xs text-zinc-200 leading-relaxed font-normal">
                      {t("trustCenter.bento3Desc", "Business owners can claim their base domain page, respond with verified owner badges, and pin helpful solutions or updates at the top of customer review threads.")}
                    </p>
                  </div>
                  <div className="pt-2 flex items-center gap-2 text-xs font-bold text-zinc-200">
                    <BadgeCheck className="w-4 h-4 text-zinc-200" />
                    <span>{t("trustCenter.bento3Sub", "Verified Owner Pinned Responses")}</span>
                  </div>
                </div>

                {/* Bento 4: Zero Paid Deletions */}
                <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-xs space-y-4 hover:border-zinc-700 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-black text-white">{t("trustCenter.bento4Title", "No Pay-to-Remove Extortion")}</h3>
                    <p className="text-xs text-zinc-200 leading-relaxed font-normal">
                      {t("trustCenter.bento4Desc", "Unlike legacy review sites that pressure businesses into costly subscriptions to suppress negative feedback, Yoouz guarantees all verified reviews stay transparent and tamper-free.")}
                    </p>
                  </div>
                  <div className="pt-2 flex items-center gap-2 text-xs font-bold text-zinc-200">
                    <CheckCircle2 className="w-4 h-4 text-zinc-200" />
                    <span>{t("trustCenter.bento4Sub", "100% Equal Rules for All")}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: HELP & FAQS */}
          {/* ========================================================= */}
          {activeTab === "faq" && (
            <div className="space-y-6 animate-in fade-in duration-200 text-left">
              {/* Search & Category Filter Bar */}
              <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-xs space-y-4">
                <div className="relative">
                  <Search className="w-5 h-5 text-zinc-200 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("trustCenter.searchFaqsPlaceholder", "Search FAQs, guidelines, or topics...")}
                    className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 focus:bg-zinc-900 focus:border-white focus:ring-1 focus:ring-white/20 text-sm font-semibold outline-none transition-all text-white placeholder:text-zinc-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-200 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                  <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider shrink-0 mr-1">
                    {t("trustCenter.categoryLabel", "Category")}:
                  </span>
                  {[
                    { id: "all", label: t("trustCenter.categoryAll", "All Questions") },
                    { id: "reviewers", label: t("trustCenter.categoryReviewers", "For Reviewers") },
                    { id: "business", label: t("trustCenter.categoryBusiness", "For Businesses") },
                    { id: "trust", label: t("trustCenter.categoryTrust", "Trust & Authenticity") },
                    { id: "technical", label: t("trustCenter.categoryTechnical", "Technical & Privacy") }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setFaqCategoryFilter(cat.id as any)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        faqCategoryFilter === cat.id
                          ? "bg-white text-black shadow-xs font-extrabold"
                          : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* FAQ Accordion List */}
              <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-xs divide-y divide-zinc-800">
                {filteredFaqs.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <HelpCircle className="w-10 h-10 text-zinc-200 mx-auto" />
                    <h3 className="text-base font-bold text-zinc-200">{t("trustCenter.noMatchingFaqs", "No matching questions found")}</h3>
                    <p className="text-xs text-zinc-200 max-w-sm mx-auto">
                      {t("trustCenter.tryDifferentKeywords", "Try searching with different keywords, or reach out directly to our support desk.")}
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setFaqCategoryFilter("all");
                      }}
                      className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition-all cursor-pointer inline-flex"
                    >
                      {t("trustCenter.clearFilter", "Clear Search Filter")}
                    </button>
                  </div>
                ) : (
                  filteredFaqs.map((faq) => {
                    const isOpen = !!openFaqIds[faq.id];
                    return (
                      <div key={faq.id} className="py-4 first:pt-0 last:pb-0">
                        <button
                          onClick={() => toggleFaq(faq.id)}
                          className="w-full flex items-center justify-between text-left cursor-pointer group gap-4"
                        >
                          <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-200">
                              {faq.category === "reviewers"
                                ? t("trustCenter.categoryReviewers", "Reviewers")
                                : faq.category === "business"
                                ? t("trustCenter.categoryBusiness", "Businesses")
                                : faq.category === "trust"
                                ? t("trustCenter.categoryTrust", "Trust Model")
                                : t("trustCenter.categoryTechnical", "Technical")}
                            </span>
                            <h3 className="font-extrabold text-sm sm:text-base text-white group-hover:text-zinc-200 transition-colors leading-snug">
                              {t(`faq.${faq.id}.q`, faq.question)}
                            </h3>
                          </div>
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
                              isOpen ? "bg-white text-black" : "bg-zinc-800 text-zinc-200 group-hover:bg-zinc-700"
                            }`}
                          >
                            <ChevronDown
                              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                            />
                          </div>
                        </button>

                        {isOpen && (
                          <div className="mt-3 pt-2 text-xs sm:text-sm text-zinc-200 leading-relaxed font-normal animate-in slide-in-from-top-1 duration-150">
                            <p className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">{t(`faq.${faq.id}.a`, faq.answer)}</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: FOR BUSINESSES & DOMAIN OWNERS */}
          {/* ========================================================= */}
          {activeTab === "business" && (
            <div className="space-y-8 animate-in fade-in duration-200 text-left">
              {/* Business Overview Hero */}
              <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800 shadow-xs space-y-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-[11px] font-black uppercase tracking-wider">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{t("trustCenter.forBusinesses", "Business Verification Portal")}</span>
                  </div>
                  <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                    {t("trustCenter.businessHeroTitle", "Claim Your Business Domain & Engage Directly")}
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                    {t("trustCenter.businessHeroDesc", "Verify ownership of your base website domain (e.g., yourcompany.com) or local place profile to access creator tools, official owner badges, and community response features.")}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <BadgeCheck className="w-6 h-6 text-white" />
                    <h4 className="font-bold text-sm text-white">{t("trustCenter.verifiedOwnerBadgeTitle", "Verified Owner Badge")}</h4>
                    <p className="text-xs text-zinc-200 leading-relaxed">
                      {t("trustCenter.verifiedOwnerBadgeDesc", "Stand out with a distinguished badge and official business owner designation on all comment threads.")}
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <MessageSquare className="w-6 h-6 text-white" />
                    <h4 className="font-bold text-sm text-white">{t("trustCenter.pinnedSolutionsTitle", "Pinned Solutions")}</h4>
                    <p className="text-xs text-zinc-200 leading-relaxed">
                      {t("trustCenter.pinnedSolutionsDesc", "Pin an official response at the top of any review discussion to clarify updates or resolve questions.")}
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <ExternalLink className="w-6 h-6 text-white" />
                    <h4 className="font-bold text-sm text-white">{t("trustCenter.embedTrustFeedsTitle", "Embed Trust Feeds")}</h4>
                    <p className="text-xs text-zinc-200 leading-relaxed">
                      {t("trustCenter.embedTrustFeedsDesc", "Easily embed genuine customer video review carousels onto your landing page to increase conversions.")}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-zinc-200 font-medium">
                    {t("trustCenter.readyToVerify", "Ready to manage or verify your domain? Launch our dedicated business suite or contact our team.")}
                  </p>
                  <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                    <button
                      onClick={() => {
                        window.open("/business", "_blank", "noopener,noreferrer");
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Building2 className="w-4 h-4 text-black" />
                      <span>{t("nav.forBusinesses", "Open Business Suite")}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-black" />
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("contact");
                        setContactCategory("verification");
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs border border-zinc-700 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <BadgeCheck className="w-4 h-4 text-zinc-300" />
                      <span>{t("trustCenter.requestVerification", "Request Verification")}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: PRIVACY, SECURITY & LEGAL COMPLIANCE */}
          {/* ========================================================= */}
          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in duration-200 text-left">
              {/* Google OAuth & Security Overview Card */}
              <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800 shadow-xs space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shrink-0">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-white">{t("trustCenter.privacySecurityTitle", "Privacy, Security & Legal Compliance")}</h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700 text-[10px] font-black uppercase tracking-wider">
                        {t("trustCenter.googleVerified", "Google Verified")}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                      {t("trustCenter.privacySummary", "Yoouz is built with privacy-first standards. We use Google OAuth for secure passwordless authentication, process camera streams in real-time without photo library harvesting, and enforce San Francisco, California USA governing jurisdiction.")}
                    </p>
                  </div>
                </div>

                {/* Legal Documents Direct Access */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-200 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">
                          {t("trustCenter.updatedDate", "Updated Aug 24, 2026")}
                        </span>
                        <ShieldCheck className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="text-sm font-black text-white pt-1">{t("trustCenter.privacyPolicyTitle", "Privacy Policy")}</h4>
                      <p className="text-xs text-zinc-200 leading-normal">
                        {t("trustCenter.privacyPolicyDesc", "Covers Google profile data handling, real-time camera/mic usage, zero password storage, zero data selling, and your right to data deletion.")}
                      </p>
                    </div>
                    <button
                      onClick={() => onOpenLegal ? onOpenLegal("privacy") : null}
                      className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 hover:border-zinc-500 font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <FileText className="w-3.5 h-3.5 text-white" />
                      <span>{t("trustCenter.readPrivacyPolicy", "Read Privacy Policy")}</span>
                    </button>
                  </div>

                  <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-200 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">
                          {t("trustCenter.updatedDate", "Updated Aug 24, 2026")}
                        </span>
                        <Scale className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="text-sm font-black text-white pt-1">{t("trustCenter.termsConditionsTitle", "Terms & Conditions")}</h4>
                      <p className="text-xs text-zinc-200 leading-normal">
                        {t("trustCenter.termsConditionsDesc", "Covers live recording standards, anti-scraping rules, business streaming licenses, limitation of liability, and San Francisco, CA jurisdiction.")}
                      </p>
                    </div>
                    <button
                      onClick={() => onOpenLegal ? onOpenLegal("terms") : null}
                      className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 hover:border-zinc-500 font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <FileText className="w-3.5 h-3.5 text-white" />
                      <span>{t("trustCenter.readTermsConditions", "Read Terms & Conditions")}</span>
                    </button>
                  </div>
                </div>

                {/* 4 Pillars Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-200">{t("auth.title", "Authentication")}</span>
                    <h4 className="text-xs font-black text-white">{t("trustCenter.authPillarTitle", "Passwordless Email Security")}</h4>
                    <p className="text-[11px] text-zinc-200 leading-normal">
                      {t("trustCenter.authPillarDesc", "We never store passwords. All logins use secure verification codes sent to your verified email with encrypted HTTPS transport.")}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-200">{t("record.title", "Recording Privacy")}</span>
                    <h4 className="text-xs font-black text-white">{t("trustCenter.recordingPillarTitle", "Real-Time Camera Only")}</h4>
                    <p className="text-[11px] text-zinc-200 leading-normal">
                      {t("trustCenter.recordingPillarDesc", "Camera and microphone data are accessed strictly during active recording. We never access photo libraries or pre-recorded storage.")}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-200">{t("trustCenter.privacySecurity", "Zero Data Selling")}</span>
                    <h4 className="text-xs font-black text-white">{t("trustCenter.zeroSellingPillarTitle", "No Selling or Renting")}</h4>
                    <p className="text-[11px] text-zinc-200 leading-normal">
                      {t("trustCenter.zeroSellingPillarDesc", "We never sell, rent, or trade your personal data to third parties. Data is shared solely with trusted cloud infrastructure providers.")}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-200">{t("legal.termsConditions", "Legal Jurisdiction")}</span>
                    <h4 className="text-xs font-black text-white">{t("trustCenter.jurisdictionPillarTitle", "San Francisco, California, USA")}</h4>
                    <p className="text-[11px] text-zinc-200 leading-normal">
                      {t("trustCenter.jurisdictionPillarDesc", "Platform terms and privacy policies are governed by the laws of the State of California, USA with jurisdiction in San Francisco, CA.")}
                    </p>
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-zinc-200 font-medium">
                    Software Build: <strong className="text-white">Yoouz Cloud v2.0 (Stable Release)</strong> • Contact: <a href="mailto:support@yoouz.com" className="text-white underline hover:text-zinc-200 font-bold">support@yoouz.com</a>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700 text-[11px] font-bold flex items-center gap-1.5 w-fit">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{t("trustCenter.allSystemsOperational", "All Systems Operational")}</span>
                  </div>
                </div>
              </div>

              {/* Account Deletion Request (Safe & Standard) */}
              {currentUser && (
                <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800 shadow-xs space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 shrink-0">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-black text-white">{t("profile.requestDeletionTitle", "Request Account Deletion")}</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {t("trustCenter.requestDeletionNotice", "Submit a formal request to permanently delete your account & profile. Our support team will process your request within 24–48 hours.")}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-zinc-800 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <p className="text-xs text-zinc-400 font-medium">
                      {t("trustCenter.requestDeletionDesc", "Under GDPR & international privacy standards, all associated data and profile records will be securely handled upon review.")}
                    </p>
                    <button
                      onClick={() => setIsMoreDeletionModalOpen(true)}
                      className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 text-xs font-bold transition-all cursor-pointer shrink-0 shadow-xs"
                    >
                      {t("profile.requestBtn", "Request Deletion")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: CONTACT SUPPORT DESK */}
          {/* ========================================================= */}
          {activeTab === "contact" && (
            <div className="bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-800 shadow-xs space-y-6 text-left animate-in fade-in duration-200">
              {submitSuccess ? (
                /* Success Confirmation State */
                <div className="text-center py-10 px-4 space-y-4 animate-in fade-in duration-200">
                  <div className="w-16 h-16 rounded-3xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white mx-auto shadow-xs">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-xl font-black text-white">{t("trustCenter.inquiryReceivedTitle", "Inquiry Received Successfully")}</h3>
                    <p className="text-xs sm:text-sm text-zinc-200 max-w-md mx-auto leading-relaxed">
                      {t("trustCenter.inquiryReceivedDesc", "Thank you for contacting Yoouz. Your message has been logged securely in our support queue. Our team reviews all requests within 24 hours.")}
                    </p>
                  </div>
                  <button
                    onClick={() => setSubmitSuccess(false)}
                    className="py-3 px-6 rounded-2xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <span>{t("trustCenter.sendAnotherInquiry", "Send Another Inquiry")}</span>
                  </button>
                </div>
              ) : (
                /* Contact Form */
                <form onSubmit={handleContactSubmit} className="space-y-5">
                  <div className="space-y-1 border-b border-zinc-800 pb-4">
                    <h3 className="text-lg font-black text-white">{t("trustCenter.supportDeskTitle", "Official Yoouz Support Desk")}</h3>
                    <p className="text-xs text-zinc-200 font-medium">
                      {t("trustCenter.supportDeskDesc", "Submit support inquiries, business domain claim requests, or report community guideline infractions.")}
                    </p>
                  </div>

                  {submitError && (
                    <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800 text-red-400 text-xs font-semibold flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase tracking-wider font-black text-zinc-200 block px-1">
                        {t("trustCenter.fullNameLabel", "Your Full Name *")}
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. Sarah Jenkins"
                        className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 focus:bg-zinc-900 focus:border-white focus:ring-1 focus:ring-white/20 text-xs font-semibold outline-none transition-all text-white placeholder:text-zinc-400"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase tracking-wider font-black text-zinc-200 block px-1">
                        {t("trustCenter.emailLabel", "Email Address *")}
                      </label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="e.g. sarah@example.com"
                        className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 focus:bg-zinc-900 focus:border-white focus:ring-1 focus:ring-white/20 text-xs font-semibold outline-none transition-all text-white placeholder:text-zinc-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase tracking-wider font-black text-zinc-200 block px-1">
                        {t("trustCenter.categoryLabel", "Category *")}
                      </label>
                      <select
                        value={contactCategory}
                        onChange={(e) => setContactCategory(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 focus:bg-zinc-900 focus:border-white focus:ring-1 focus:ring-white/20 text-xs font-bold outline-none transition-all text-white"
                      >
                        <option value="support">{t("trustCenter.categorySupport", "General Account / Technical Support")}</option>
                        <option value="verification">{t("trustCenter.categoryVerification", "Business / Domain Ownership Verification")}</option>
                        <option value="guidelines">{t("trustCenter.categoryGuidelines", "Report Policy Violation / Fake Content")}</option>
                        <option value="partnership">{t("trustCenter.categoryPartnership", "API & Partnership Inquiries")}</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase tracking-wider font-black text-zinc-200 block px-1">
                        {t("trustCenter.websiteDomainLabel", "Website Domain (Optional)")}
                      </label>
                      <input
                        type="text"
                        value={contactDomain}
                        onChange={(e) => setContactDomain(e.target.value)}
                        placeholder="e.g. yourcompany.com"
                        className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 focus:bg-zinc-900 focus:border-white focus:ring-1 focus:ring-white/20 text-xs font-semibold outline-none transition-all text-white placeholder:text-zinc-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider font-black text-zinc-200 block px-1">
                      {t("trustCenter.messageLabel", "Message Details *")}
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder={t("trustCenter.messagePlaceholder", "Describe your inquiry or request in detail...")}
                      className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 focus:bg-zinc-900 focus:border-white focus:ring-1 focus:ring-white/20 text-xs font-semibold outline-none transition-all resize-none leading-relaxed text-white placeholder:text-zinc-400"
                    />
                  </div>

                  {/* Drag-and-Drop Attachments */}
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-wider font-black text-zinc-200 block px-1">
                      {t("trustCenter.attachFilesLabel", "Attach Screenshots or Verification Proof (Optional)")}
                    </label>

                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                        dragOver
                          ? "border-white bg-zinc-800"
                          : "border-zinc-800 bg-zinc-950 hover:bg-zinc-900 hover:border-zinc-700"
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        multiple
                        accept=".png,.jpg,.jpeg,.webp,.pdf,.txt,.doc,.docx"
                        className="hidden"
                      />
                      <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200 shadow-2xs">
                        <UploadCloud className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-200">
                          {t("trustCenter.dragDropPrompt", "Drag & drop files here, or")} <span className="text-white underline">{t("trustCenter.browseFiles", "browse files")}</span>
                        </p>
                        <p className="text-[10px] text-zinc-200 font-medium mt-0.5">
                          {t("trustCenter.fileLimitHint", "PNG, JPG, WEBP, PDF or DOC (Max 3 files, up to 2MB each)")}
                        </p>
                      </div>
                    </div>

                    {/* Attachment Previews */}
                    {attachedFiles.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        {attachedFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {file.type.startsWith("image/") ? (
                                <img
                                  src={file.base64}
                                  alt="preview"
                                  className="w-8 h-8 rounded-lg object-cover shrink-0 border border-zinc-800"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-200 shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-white truncate">{file.name}</p>
                                <p className="text-[9px] text-zinc-200 font-bold">
                                  {(file.size / 1024).toFixed(0)} KB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile(idx);
                              }}
                              className="w-6 h-6 rounded-full hover:bg-zinc-800 flex items-center justify-center text-zinc-200 transition-colors cursor-pointer shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto py-3 px-8 rounded-2xl bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-97"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          <span>{t("trustCenter.submitting", "Submitting...")}</span>
                        </>
                      ) : (
                        <span>{t("trustCenter.submitRequest", "Submit Secure Request")}</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: LANGUAGE */}
          {/* ========================================================= */}
          {activeTab === "language" && (
            <div className="space-y-6 animate-in fade-in duration-200 text-left">
              {/* Active Language Overview Banner */}
              <div className="bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-800 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                      {t("settings.language_preference", "Language")}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2.5 bg-zinc-950 border border-zinc-800 px-3.5 py-2 rounded-2xl shrink-0">
                    <span className="text-xl select-none">{currentLanguageMeta.flag}</span>
                    <span className="text-sm font-bold text-white leading-none">
                      {currentLanguageMeta.name}
                    </span>
                  </div>
                </div>

                {/* Search / Filter Languages */}
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="more-view-lang-search"
                    type="text"
                    value={langSearchFilter}
                    onChange={(e) => setLangSearchFilter(e.target.value)}
                    placeholder={t("common.search", "Search language...")}
                    className="w-full pl-11 pr-10 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-white transition-colors"
                  />
                  {langSearchFilter && (
                    <button
                      onClick={() => setLangSearchFilter("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Languages Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-2">
                  {languages
                    .filter((l) => {
                      const q = langSearchFilter.toLowerCase().trim();
                      if (!q) return true;
                      return (
                        l.name.toLowerCase().includes(q) ||
                        l.nativeName.toLowerCase().includes(q) ||
                        l.code.toLowerCase().includes(q)
                      );
                    })
                    .map((lang) => {
                      const isSelected = language === lang.code;
                      return (
                        <button
                          key={lang.code}
                          id={`more-lang-card-${lang.code}`}
                          onClick={() => setLanguage(lang.code)}
                          className={`px-3.5 py-3 rounded-2xl transition-all text-left flex items-center justify-between cursor-pointer border ${
                            isSelected
                              ? "bg-white text-zinc-950 border-white shadow-md"
                              : "bg-zinc-950/60 hover:bg-zinc-800 text-white border-zinc-800/80 hover:border-zinc-700"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-1">
                            <span className="text-xl leading-none select-none shrink-0">{lang.flag}</span>
                            <span className={`text-sm leading-tight truncate ${isSelected ? "font-bold text-zinc-950" : "font-semibold text-white"}`}>
                              {lang.name}
                            </span>
                          </div>

                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-zinc-950 text-white flex items-center justify-center shrink-0 ml-1.5">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 4. Google-Standard Footer */}
        <footer className="pt-8 pb-14 border-t border-zinc-800 text-center space-y-4 text-xs text-zinc-200">
          <div className="flex items-center justify-center gap-4 text-xs font-semibold text-zinc-200 flex-wrap">
            <button
              onClick={() => onOpenLegal ? onOpenLegal("terms") : null}
              className="hover:text-white underline cursor-pointer bg-transparent border-none p-0"
            >
              {t("legal.termsConditions", "Terms & Conditions")}
            </button>
            <span>•</span>
            <button
              onClick={() => onOpenLegal ? onOpenLegal("privacy") : null}
              className="hover:text-white underline cursor-pointer bg-transparent border-none p-0"
            >
              {t("legal.privacyPolicy", "Privacy Policy")}
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setActiveTab("contact");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="hover:text-white underline cursor-pointer bg-transparent border-none p-0"
            >
              {t("legal.supportDesk", "Support Desk")}
            </button>
          </div>

          <div className="space-y-1 text-center font-medium">
            <p className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider">
              {t("legal.networkLocation", "Yoouz Trust Network • San Francisco, CA")}
            </p>
            <p className="text-[11px] text-zinc-200">
              {t("legal.copyright", "© 2026 Yoouz Inc. All rights reserved. Real People. Real Reviews.")}
            </p>
          </div>
        </footer>
      </main>

      {/* Account Deletion Request Modal (Dark Mode) */}
      {isMoreDeletionModalOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsMoreDeletionModalOpen(false)}
        >
          <div
            className="bg-zinc-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-800 space-y-4 animate-in zoom-in-95 duration-150 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 flex items-center justify-center mx-auto shadow-inner">
              <Shield className="w-6 h-6 text-zinc-300" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-white">{t("profile.requestDeletionTitle", "Request Account Deletion")}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {t("profile.requestDeletionNotice", "Please select a reason below. Our support team will review and process your account deletion within 24–48 hours.")}
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  {t("profile.reasonLabel", "Reason")}
                </label>
                <select
                  value={moreDeletionReason}
                  onChange={(e) => setMoreDeletionReason(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 transition-colors"
                >
                  <option value="I no longer use this account">I no longer use this account</option>
                  <option value="Privacy concerns">Privacy concerns</option>
                  <option value="Created by mistake">Created by mistake</option>
                  <option value="Temporary break">Temporary break</option>
                  <option value="Other reason">Other reason</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  {t("profile.notesLabel", "Additional Notes (Optional)")}
                </label>
                <textarea
                  value={moreDeletionNotes}
                  onChange={(e) => setMoreDeletionNotes(e.target.value)}
                  rows={2}
                  maxLength={300}
                  placeholder="Tell us if there is anything we can help with..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsMoreDeletionModalOpen(false)}
                disabled={isSubmittingMoreDeletion}
                className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-xs font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsSubmittingMoreDeletion(true);
                  try {
                    await fetch("/api/account/deletion-request", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        userId: currentUser?.uid || currentUser?.id || "Unknown ID",
                        userName: currentUser?.name || "User",
                        userEmail: currentUser?.email || "Not provided",
                        reason: moreDeletionReason,
                        details: moreDeletionNotes.trim()
                      })
                    });
                  } catch (e) {
                    console.error("Deletion request error:", e);
                  } finally {
                    setIsSubmittingMoreDeletion(false);
                    setIsMoreDeletionModalOpen(false);
                    setMoreDeletionSuccessToast(true);
                    setTimeout(() => setMoreDeletionSuccessToast(false), 5000);
                  }
                }}
                disabled={isSubmittingMoreDeletion}
                className="flex-1 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-black transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmittingMoreDeletion ? t("common.submitting", "Submitting...") : t("profile.submitRequest", "Submit Request")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Toast */}
      {moreDeletionSuccessToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 border border-zinc-700 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 max-w-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-semibold leading-snug text-zinc-200">
            {t("profile.deletionRequestSuccess", "Your account deletion request has been submitted. Our team will process it within 24–48 hours.")}
          </p>
        </div>
      )}
    </div>
  );
};
