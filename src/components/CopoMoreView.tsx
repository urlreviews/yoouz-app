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
  Youtube,
  Instagram,
  Linkedin,
  Facebook,
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
  Smartphone
} from "lucide-react";
import { UserProfile, NavSection } from "../types";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "../lib/firebase";

interface CopoMoreViewProps {
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onSuccessAuth?: (user: UserProfile) => void;
  onSignOut: () => void;
  onNavigate: (section: NavSection) => void;
  onDeleteProfile: () => Promise<void>;
  onOpenLegal?: (tab: "terms" | "privacy") => void;
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
  onDeleteProfile,
  onOpenLegal
}) => {
  const [activeTab, setActiveTab] = useState<"about" | "faq" | "business" | "security" | "contact">("about");
  const [searchQuery, setSearchQuery] = useState("");
  const [faqCategoryFilter, setFaqCategoryFilter] = useState<"all" | "reviewers" | "business" | "trust" | "technical">("all");
  const [openFaqIds, setOpenFaqIds] = useState<Record<string, boolean>>({
    "rev-1": true,
    "biz-1": true
  });

  // Delete Confirmation Modal State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteInputText, setDeleteInputText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

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

      await addDoc(collection(db, "contact_requests"), {
        name: contactName.trim(),
        email: contactEmail.trim(),
        category: contactCategory,
        domain: contactDomain.trim() || "None",
        message: contactMessage.trim(),
        attachments: attachments,
        userId: currentUser ? currentUser.email : "guest",
        createdAt: serverTimestamp()
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
    {
      id: "rev-1",
      category: "reviewers",
      question: "How long can my video review be?",
      answer:
        "Every video review has a strict limit of 60 seconds. This ensures content remains high-impact, focused, digestible, and easy for other users to browse quickly without fluff or scripted commercials.",
      tags: ["video", "length", "limit", "recording", "duration"]
    },
    {
      id: "rev-2",
      category: "reviewers",
      question: "Can viewers and other users comment or ask questions on my video reviews?",
      answer:
        "Yes! Unlike traditional review platforms where reviews sit as dead, static text, every Yoouz video review features a live community discussion feed. Viewers can ask you follow-up questions ('Did you try the dessert?', 'Is parking easy?'), share their own tips, and discuss their experiences directly underneath your video.",
      tags: ["comments", "questions", "community", "discussion"]
    },
    {
      id: "rev-3",
      category: "reviewers",
      question: "Can I review any website domain or local establishment?",
      answer:
        "Yes! You can search and review any valid base website domain (e.g., airbnb.com, stripe.com) or local brick-and-mortar place (restaurants, gyms, cafes, services). This helps create a single centralized hub of user opinions.",
      tags: ["domain", "website", "places", "search", "business"]
    },
    {
      id: "rev-4",
      category: "reviewers",
      question: "How do I earn the 'Verified Reviewer' status and badges?",
      answer:
        "Users who post genuine, live front-camera reviews that receive positive community feedback, bookmarks, and engagement automatically receive verification badges and higher discovery ranking.",
      tags: ["verified", "badge", "ranking", "trust"]
    },
    {
      id: "rev-5",
      category: "reviewers",
      question: "Can I edit or delete my reviews?",
      answer:
        "Absolutely. You have full ownership of your uploads. You can modify your star rating or delete any of your posted video reviews at any time directly from your Profile page or the video player controls.",
      tags: ["edit", "delete", "rating", "manage", "profile"]
    },
    // Business FAQs
    {
      id: "biz-1",
      category: "business",
      question: "How can my business claim its official domain page?",
      answer:
        "Businesses can verify their ownership of a base domain to unlock official response tools, pin verified announcements to customer video reviews, and showcase verified achievements directly to potential customers.",
      tags: ["claim", "domain", "verification", "business", "owner"]
    },
    {
      id: "biz-2",
      category: "business",
      question: "How does the interactive comments section benefit verified businesses?",
      answer:
        "Verified business owners can join the conversation directly with a distinguished 'Business Owner' badge. You can answer customer questions in real time, provide updates, or pin an official response at the top of the comment feed to address feedback constructively.",
      tags: ["owner response", "pinned", "support", "dialogue"]
    },
    {
      id: "biz-3",
      category: "business",
      question: "Can businesses pay to remove negative reviews?",
      answer:
        "No. Yoouz is founded on absolute trust and authenticity. We never delete or hide negative video reviews for payment. If a review violates our safety, spam, or explicit content policies, it can be flagged for immediate human review.",
      tags: ["policy", "negative reviews", "moderation", "trust"]
    },
    {
      id: "biz-4",
      category: "business",
      question: "How can Yoouz reviews help my conversion rate?",
      answer:
        "Authentic customer video reviews build unparalleled trust. Verified businesses can share and embed Yoouz testimonial feeds to showcase genuine user experiences.",
      tags: ["conversion", "embed", "testimonials", "growth"]
    },
    // Trust FAQs
    {
      id: "trust-1",
      category: "trust",
      question: "What makes Yoouz different from text-based review sites?",
      answer:
        "Traditional text reviews are heavily prone to manipulation, paid bots, and AI-generated copy. By requiring short, authentic video formats with proof of face and voice, Yoouz guarantees you are seeing real people sharing honest experiences.",
      tags: ["text vs video", "ai bots", "authenticity", "proof"]
    },
    {
      id: "trust-2",
      category: "trust",
      question: "Why are community comments and live discussions a core part of the Yoouz trust model?",
      answer:
        "Authentic reviews shouldn't be isolated rants or echo chambers. An open, transparent comment section creates crowdsourced accountability—allowing the community to validate experiences, share real-time updates, and interact directly with both the reviewer and the business.",
      tags: ["accountability", "community", "transparency"]
    },
    // Technical FAQs
    {
      id: "tech-1",
      category: "technical",
      question: "Is Yoouz free to use for both consumers and businesses?",
      answer:
        "Yes, Yoouz is 100% free to browse, search, bookmark, and upload 60-second video reviews. Basic verification for businesses and domain discovery is also completely free.",
      tags: ["free", "pricing", "cost", "subscription"]
    },
    {
      id: "tech-2",
      category: "technical",
      question: "How is my account and video data secured?",
      answer:
        "Your profile and video reviews are safeguarded with industry-standard encryption and strict privacy controls. Only you have permission to edit or remove your content.",
      tags: ["security", "privacy", "protection"]
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
      className="flex-1 w-full h-full bg-zinc-950 md:bg-[#f8fafd] overflow-y-auto font-sans text-white md:text-zinc-900 pb-[calc(env(safe-area-inset-bottom,16px)+88px)] md:pb-24 select-none selection:bg-[#1a73e8]/20 selection:text-[#1a73e8]"
    >
      {/* Top Banner / Google-grade Header */}
      <header className="bg-zinc-900/90 md:bg-white/90 border-b border-zinc-800 md:border-zinc-200/80 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate("home")}
                className="w-9 h-9 rounded-full bg-zinc-800 md:bg-zinc-100 hover:bg-zinc-700 md:hover:bg-zinc-200 text-zinc-300 md:text-zinc-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 active:scale-95 shadow-sm"
                title="Back to Feed"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 md:bg-blue-50 border border-blue-500/20 md:border-blue-200/60 text-blue-400 md:text-[#1a73e8] text-[11px] font-black tracking-wide uppercase">
                    Yoouz Hub
                  </span>
                  <span className="text-xs text-zinc-400 font-semibold">• Trust, Verification & Support</span>
                </div>
                <h1 className="text-xl sm:text-3xl font-black text-white md:text-zinc-950 tracking-tight mt-0.5">
                  Knowledge & Trust Center
                </h1>
              </div>
            </div>

            {/* Quick Navigation Action Chips */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <button
                onClick={() => onNavigate("search")}
                className="px-3.5 py-1.5 rounded-full bg-zinc-800 md:bg-zinc-100 hover:bg-zinc-700 md:hover:bg-zinc-200 text-zinc-200 md:text-zinc-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Search className="w-3.5 h-3.5 text-zinc-400 md:text-zinc-500" />
                <span>Search</span>
              </button>
              <button
                onClick={() => onNavigate("discover")}
                className="px-3.5 py-1.5 rounded-full bg-zinc-800 md:bg-zinc-100 hover:bg-zinc-700 md:hover:bg-zinc-200 text-zinc-200 md:text-zinc-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Compass className="w-3.5 h-3.5 text-zinc-400 md:text-zinc-500" />
                <span>Discover</span>
              </button>
              {currentUser && (
                <button
                  onClick={() => onNavigate("profile")}
                  className="px-3.5 py-1.5 rounded-full bg-blue-500/20 md:bg-blue-50 hover:bg-blue-500/30 md:hover:bg-blue-100 text-blue-400 md:text-[#1a73e8] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>My Profile</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* 1. Account Section: Shown if signed in */}
        {currentUser && (
          <section aria-label="Account Overview">
            <div className="bg-zinc-900 md:bg-white rounded-3xl p-6 border border-zinc-800 md:border-zinc-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={
                      currentUser.avatar ||
                      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80"
                    }
                    alt={currentUser.name || "User Avatar"}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500/40 md:border-[#1a73e8]/30 shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#1a73e8] text-white rounded-full flex items-center justify-center shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-black text-white md:text-zinc-950 truncate">{currentUser.name || "Reviewer"}</h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 md:bg-emerald-50 border border-emerald-800/60 md:border-emerald-200 text-emerald-400 md:text-emerald-700 text-[10px] font-black tracking-wide uppercase flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 md:text-zinc-500 font-medium truncate">{currentUser.email}</p>
                  <p className="text-[11px] text-zinc-400 font-medium">
                    Verified Member • Active Contributor
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 flex-wrap">
                <button
                  onClick={() => onNavigate("profile")}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-zinc-800 md:bg-zinc-100 hover:bg-zinc-700 md:hover:bg-zinc-200 text-zinc-200 md:text-zinc-800 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5 text-zinc-400 md:text-zinc-600" />
                  <span>Edit Profile</span>
                </button>
                <button
                  onClick={onSignOut}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-zinc-800 md:border-zinc-200 hover:bg-red-950/40 md:hover:bg-red-50 hover:border-red-800 md:hover:border-red-200 text-red-400 md:text-zinc-700 md:hover:text-red-600 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* 2. Top-Level Tab Switcher (Google Material Design Style) */}
        <section aria-label="Knowledge Navigation">
          <div className="bg-zinc-900 md:bg-white rounded-2xl p-1.5 border border-zinc-800 md:border-zinc-200/90 shadow-2xs flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("about")}
              className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "about"
                  ? "bg-[#1a73e8] text-white shadow-sm"
                  : "text-zinc-400 md:text-zinc-600 hover:text-white md:hover:text-zinc-950 hover:bg-zinc-800 md:hover:bg-zinc-50"
              }`}
            >
              <Info className="w-4 h-4" />
              <span>Trust Protocol</span>
            </button>

            <button
              onClick={() => setActiveTab("faq")}
              className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "faq"
                  ? "bg-[#1a73e8] text-white shadow-sm"
                  : "text-zinc-400 md:text-zinc-600 hover:text-white md:hover:text-zinc-950 hover:bg-zinc-800 md:hover:bg-zinc-50"
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Help & FAQs</span>
            </button>

            <button
              onClick={() => setActiveTab("business")}
              className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "business"
                  ? "bg-[#1a73e8] text-white shadow-sm"
                  : "text-zinc-400 md:text-zinc-600 hover:text-white md:hover:text-zinc-950 hover:bg-zinc-800 md:hover:bg-zinc-50"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>For Businesses</span>
            </button>

            <button
              onClick={() => setActiveTab("security")}
              className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "security"
                  ? "bg-[#1a73e8] text-white shadow-sm"
                  : "text-zinc-400 md:text-zinc-600 hover:text-white md:hover:text-zinc-950 hover:bg-zinc-800 md:hover:bg-zinc-50"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Privacy & Security</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("contact");
                setSubmitSuccess(false);
                setSubmitError("");
              }}
              className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "contact"
                  ? "bg-[#1a73e8] text-white shadow-sm"
                  : "text-zinc-400 md:text-zinc-600 hover:text-white md:hover:text-zinc-950 hover:bg-zinc-800 md:hover:bg-zinc-50"
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Contact Support</span>
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
              {/* Hero Banner: Proof of Presence (Clean Google-Grade Light Card) */}
              <div className="bg-zinc-900 md:bg-white rounded-3xl p-6 sm:p-8 border border-zinc-800 md:border-zinc-200 shadow-xs space-y-6">
                <div className="space-y-3 max-w-3xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 md:bg-blue-50 border border-blue-500/20 md:border-blue-200 text-blue-400 md:text-[#1a73e8] text-[11px] font-black uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>The Yoouz Standard</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white md:text-zinc-950 tracking-tight leading-snug">
                    Proof of Presence. Real People. Verified Places.
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-400 md:text-zinc-600 leading-relaxed font-normal">
                    Traditional text reviews are vulnerable to bot networks, fake accounts, and AI-generated reviews. Yoouz creates authentic trust by capturing short 60-second video reviews recorded exclusively through live device cameras.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="bg-zinc-800/80 md:bg-blue-50/70 p-5 rounded-2xl border border-zinc-700/60 md:border-blue-150/70 space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 md:bg-blue-100 flex items-center justify-center text-blue-400 md:text-blue-600">
                      <Video className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 md:text-blue-700 block">Strict Rule</span>
                    <h4 className="text-sm font-black text-white md:text-zinc-950">Live Front-Camera Only</h4>
                    <p className="text-xs text-zinc-400 md:text-zinc-600 leading-relaxed">
                      No pre-recorded MP4 uploads or stock footage. Real customers capturing authentic experiences.
                    </p>
                  </div>

                  <div className="bg-zinc-800/80 md:bg-amber-50/70 p-5 rounded-2xl border border-zinc-700/60 md:border-amber-150/70 space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 md:bg-amber-100 flex items-center justify-center text-amber-400 md:text-amber-700">
                      <Lock className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 md:text-amber-700 block">Pillar 2</span>
                    <h4 className="text-sm font-black text-white md:text-zinc-950">60-Second Focus</h4>
                    <p className="text-xs text-zinc-400 md:text-zinc-600 leading-relaxed">
                      Concise, high-impact video reviews that deliver immediate value in under one minute.
                    </p>
                  </div>

                  <div className="bg-zinc-800/80 md:bg-emerald-50/70 p-5 rounded-2xl border border-zinc-700/60 md:border-emerald-150/70 space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 md:bg-emerald-100 flex items-center justify-center text-emerald-400 md:text-emerald-700">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 md:text-emerald-700 block">Pillar 3</span>
                    <h4 className="text-sm font-black text-white md:text-zinc-950">3-Way Dialogue</h4>
                    <p className="text-xs text-zinc-400 md:text-zinc-600 leading-relaxed">
                      Living comment threads connecting Reviewers, curious Viewers, and Verified Place Owners.
                    </p>
                  </div>
                </div>
              </div>

              {/* 4 Bento Cards: Core Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bento 1: No Fake Accounts */}
                <div className="bg-zinc-900 md:bg-white rounded-3xl p-6 border border-zinc-800 md:border-zinc-200 shadow-xs space-y-4 hover:border-zinc-700 md:hover:border-zinc-300 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 md:bg-blue-50 border border-blue-500/20 md:border-blue-100 flex items-center justify-center text-blue-400 md:text-[#1a73e8]">
                    <Video className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-black text-white md:text-zinc-950">Immutable Face & Voice Identity</h3>
                    <p className="text-xs text-zinc-400 md:text-zinc-500 leading-relaxed font-normal">
                      Every reviewer builds an open visual review portfolio. Consistent face, verified voice, and historical timeline give viewers immediate confidence that reviews are authored by genuine people.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center gap-2 text-xs font-bold text-blue-400 md:text-[#1a73e8]">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Audit Any Reviewer Profile Instantly</span>
                  </div>
                </div>

                {/* Bento 2: Living Discussions */}
                <div className="bg-zinc-900 md:bg-white rounded-3xl p-6 border border-zinc-800 md:border-zinc-200 shadow-xs space-y-4 hover:border-zinc-700 md:hover:border-zinc-300 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 md:bg-indigo-50 border border-indigo-500/20 md:border-indigo-100 flex items-center justify-center text-indigo-400 md:text-indigo-600">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-black text-white md:text-zinc-950">Interactive Community Dialogue</h3>
                    <p className="text-xs text-zinc-400 md:text-zinc-500 leading-relaxed font-normal">
                      Reviews shouldn't be dead one-way monologues. Viewers can ask real-time questions ('Is there outdoor seating?', 'How was the service?'), and the community answers collaboratively.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center gap-2 text-xs font-bold text-indigo-400 md:text-indigo-600">
                    <Users className="w-4 h-4" />
                    <span>Crowdsourced Community Validation</span>
                  </div>
                </div>

                {/* Bento 3: Verified Business Ownership */}
                <div className="bg-zinc-900 md:bg-white rounded-3xl p-6 border border-zinc-800 md:border-zinc-200 shadow-xs space-y-4 hover:border-zinc-700 md:hover:border-zinc-300 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 md:bg-emerald-50 border border-emerald-500/20 md:border-emerald-100 flex items-center justify-center text-emerald-400 md:text-emerald-600">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-black text-white md:text-zinc-950">Official Domain Verification</h3>
                    <p className="text-xs text-zinc-400 md:text-zinc-500 leading-relaxed font-normal">
                      Business owners can claim their base domain page, respond with verified owner badges, and pin helpful solutions or updates at the top of customer review threads.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center gap-2 text-xs font-bold text-emerald-400 md:text-emerald-600">
                    <BadgeCheck className="w-4 h-4" />
                    <span>Verified Owner Pinned Responses</span>
                  </div>
                </div>

                {/* Bento 4: Zero Paid Deletions */}
                <div className="bg-zinc-900 md:bg-white rounded-3xl p-6 border border-zinc-800 md:border-zinc-200 shadow-xs space-y-4 hover:border-zinc-700 md:hover:border-zinc-300 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 md:bg-amber-50 border border-amber-500/20 md:border-amber-100 flex items-center justify-center text-amber-400 md:text-amber-600">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-black text-white md:text-zinc-950">No Pay-to-Remove Extortion</h3>
                    <p className="text-xs text-zinc-400 md:text-zinc-500 leading-relaxed font-normal">
                      Unlike legacy review sites that pressure businesses into costly subscriptions to suppress negative feedback, Yoouz guarantees all verified reviews stay transparent and tamper-free.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center gap-2 text-xs font-bold text-amber-400 md:text-amber-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>100% Equal Rules for All</span>
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
              <div className="bg-zinc-900 md:bg-white rounded-3xl p-6 border border-zinc-800 md:border-zinc-200 shadow-xs space-y-4">
                <div className="relative">
                  <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search FAQs, guidelines, or topics..."
                    className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-zinc-800 md:bg-zinc-50 border border-zinc-700 md:border-zinc-200 focus:bg-zinc-800/80 md:focus:bg-white focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/15 text-sm font-semibold outline-none transition-all text-white md:text-zinc-900 placeholder:text-zinc-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-zinc-700 md:bg-zinc-200 hover:bg-zinc-600 md:hover:bg-zinc-300 flex items-center justify-center text-zinc-300 md:text-zinc-600 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider shrink-0 mr-1">
                    Category:
                  </span>
                  {[
                    { id: "all", label: "All Questions" },
                    { id: "reviewers", label: "For Reviewers" },
                    { id: "business", label: "For Businesses" },
                    { id: "trust", label: "Trust & Authenticity" },
                    { id: "technical", label: "Technical & Privacy" }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setFaqCategoryFilter(cat.id as any)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        faqCategoryFilter === cat.id
                          ? "bg-[#1a73e8] text-white shadow-xs"
                          : "bg-zinc-800 md:bg-zinc-100 hover:bg-zinc-700 md:hover:bg-zinc-200 text-zinc-300 md:text-zinc-700"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* FAQ Accordion List */}
              <div className="bg-zinc-900 md:bg-white rounded-3xl p-6 border border-zinc-800 md:border-zinc-200 shadow-xs divide-y divide-zinc-800 md:divide-zinc-100">
                {filteredFaqs.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <HelpCircle className="w-10 h-10 text-zinc-500 md:text-zinc-300 mx-auto" />
                    <h3 className="text-base font-bold text-zinc-300 md:text-zinc-800">No matching questions found</h3>
                    <p className="text-xs text-zinc-400 md:text-zinc-500 max-w-sm mx-auto">
                      Try searching with different keywords, or reach out directly to our support desk.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setFaqCategoryFilter("all");
                      }}
                      className="px-4 py-2 rounded-xl bg-zinc-800 md:bg-zinc-100 hover:bg-zinc-700 md:hover:bg-zinc-200 text-zinc-200 md:text-zinc-800 font-bold text-xs transition-all cursor-pointer inline-flex"
                    >
                      Clear Search Filter
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
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 md:text-[#1a73e8]">
                              {faq.category === "reviewers"
                                ? "Reviewers"
                                : faq.category === "business"
                                ? "Businesses"
                                : faq.category === "trust"
                                ? "Trust Model"
                                : "Technical"}
                            </span>
                            <h3 className="font-extrabold text-sm sm:text-base text-white md:text-zinc-900 group-hover:text-blue-400 md:group-hover:text-[#1a73e8] transition-colors leading-snug">
                              {faq.question}
                            </h3>
                          </div>
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
                              isOpen ? "bg-blue-500/20 md:bg-blue-50 text-blue-400 md:text-[#1a73e8]" : "bg-zinc-800 md:bg-zinc-100 text-zinc-400 group-hover:bg-zinc-700 md:group-hover:bg-zinc-200"
                            }`}
                          >
                            <ChevronDown
                              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                            />
                          </div>
                        </button>

                        {isOpen && (
                          <div className="mt-3 pt-2 text-xs sm:text-sm text-zinc-300 md:text-zinc-600 leading-relaxed font-normal animate-in slide-in-from-top-1 duration-150">
                            <p className="bg-zinc-800 md:bg-zinc-50 p-4 rounded-2xl border border-zinc-700 md:border-zinc-150/70">{faq.answer}</p>
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
              <div className="bg-zinc-900 md:bg-white rounded-3xl p-8 border border-zinc-800 md:border-zinc-200 shadow-xs space-y-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 md:bg-emerald-50 border border-emerald-500/20 md:border-emerald-200 text-emerald-400 md:text-emerald-700 text-[11px] font-black uppercase tracking-wider">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Business Verification Portal</span>
                  </div>
                  <h2 className="text-xl sm:text-3xl font-black text-white md:text-zinc-950 tracking-tight">
                    Claim Your Business Domain & Engage Directly
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-400 md:text-zinc-600 leading-relaxed">
                    Verify ownership of your base website domain (e.g., yourcompany.com) or local place profile to access creator tools, official owner badges, and community response features.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-5 rounded-2xl bg-zinc-800 md:bg-zinc-50 border border-zinc-700 md:border-zinc-200 space-y-2">
                    <BadgeCheck className="w-6 h-6 text-emerald-400 md:text-emerald-600" />
                    <h4 className="font-bold text-sm text-white md:text-zinc-900">Verified Owner Badge</h4>
                    <p className="text-xs text-zinc-400 md:text-zinc-500 leading-relaxed">
                      Stand out with a distinguished blue checkmark and official business owner badge on all comment threads.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-zinc-800 md:bg-zinc-50 border border-zinc-700 md:border-zinc-200 space-y-2">
                    <MessageSquare className="w-6 h-6 text-blue-400 md:text-[#1a73e8]" />
                    <h4 className="font-bold text-sm text-white md:text-zinc-900">Pinned Solutions</h4>
                    <p className="text-xs text-zinc-400 md:text-zinc-500 leading-relaxed">
                      Pin an official response at the top of any review discussion to clarify updates or resolve questions.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-zinc-800 md:bg-zinc-50 border border-zinc-700 md:border-zinc-200 space-y-2">
                    <ExternalLink className="w-6 h-6 text-indigo-400 md:text-indigo-600" />
                    <h4 className="font-bold text-sm text-white md:text-zinc-900">Embed Trust Feeds</h4>
                    <p className="text-xs text-zinc-400 md:text-zinc-500 leading-relaxed">
                      Easily embed genuine customer video review carousels onto your landing page to increase conversions.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800 md:border-zinc-150 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-zinc-400 md:text-zinc-500 font-medium">
                    Ready to verify your domain? Contact our verification team with your domain details.
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab("contact");
                      setContactCategory("verification");
                    }}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/15 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <BadgeCheck className="w-4 h-4" />
                    <span>Request Domain Verification</span>
                  </button>
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
              <div className="bg-zinc-900 md:bg-white rounded-3xl p-8 border border-zinc-800 md:border-zinc-200 shadow-xs space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 md:bg-blue-50 border border-blue-500/20 md:border-blue-100 flex items-center justify-center text-blue-400 md:text-[#1a73e8] shrink-0">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-white md:text-zinc-950">Privacy, Security & Legal Compliance</h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 md:bg-emerald-50 text-emerald-400 md:text-emerald-700 border border-emerald-500/20 md:border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                        Google Verified
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-400 md:text-zinc-500 leading-relaxed">
                      Yoouz is built with privacy-first standards. We use Google OAuth for secure passwordless authentication, process camera streams in real-time without photo library harvesting, and enforce San Francisco, California USA governing jurisdiction.
                    </p>
                  </div>
                </div>

                {/* Legal Documents Direct Access */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-5 rounded-2xl bg-zinc-800 md:bg-zinc-50 border border-zinc-700 md:border-zinc-200 space-y-3 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 md:text-emerald-700 bg-emerald-500/10 md:bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-500/20 md:border-emerald-200">
                          Updated Aug 24, 2026
                        </span>
                        <ShieldCheck className="w-4 h-4 text-emerald-400 md:text-emerald-600" />
                      </div>
                      <h4 className="text-sm font-black text-white md:text-zinc-900 pt-1">Privacy Policy</h4>
                      <p className="text-xs text-zinc-400 md:text-zinc-500 leading-normal">
                        Covers Google profile data handling, real-time camera/mic usage, zero password storage, zero data selling, and your right to data deletion.
                      </p>
                    </div>
                    <button
                      onClick={() => onOpenLegal ? onOpenLegal("privacy") : null}
                      className="w-full py-2.5 px-4 rounded-xl bg-zinc-700 md:bg-white hover:bg-zinc-600 md:hover:bg-zinc-100 text-white md:text-zinc-900 border border-zinc-600 md:border-zinc-300 hover:border-zinc-500 md:hover:border-zinc-400 font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-400 md:text-[#1a73e8]" />
                      <span>Read Privacy Policy</span>
                    </button>
                  </div>

                  <div className="p-5 rounded-2xl bg-zinc-800 md:bg-zinc-50 border border-zinc-700 md:border-zinc-200 space-y-3 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 md:text-blue-700 bg-blue-500/10 md:bg-blue-50 px-2 py-0.5 rounded-full border border-blue-500/20 md:border-blue-200">
                          Updated Aug 24, 2026
                        </span>
                        <Scale className="w-4 h-4 text-blue-400 md:text-[#1a73e8]" />
                      </div>
                      <h4 className="text-sm font-black text-white md:text-zinc-900 pt-1">Terms & Conditions</h4>
                      <p className="text-xs text-zinc-400 md:text-zinc-500 leading-normal">
                        Covers live recording standards, anti-scraping rules, business streaming licenses, limitation of liability, and San Francisco, CA jurisdiction.
                      </p>
                    </div>
                    <button
                      onClick={() => onOpenLegal ? onOpenLegal("terms") : null}
                      className="w-full py-2.5 px-4 rounded-xl bg-zinc-700 md:bg-white hover:bg-zinc-600 md:hover:bg-zinc-100 text-white md:text-zinc-900 border border-zinc-600 md:border-zinc-300 hover:border-zinc-500 md:hover:border-zinc-400 font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-400 md:text-[#1a73e8]" />
                      <span>Read Terms & Conditions</span>
                    </button>
                  </div>
                </div>

                {/* 4 Pillars Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="p-4 rounded-2xl bg-zinc-800/60 md:bg-zinc-50/70 border border-zinc-700/60 md:border-zinc-200/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Authentication</span>
                    <h4 className="text-xs font-black text-white md:text-zinc-900">Google OAuth 2.0 Security</h4>
                    <p className="text-[11px] text-zinc-400 md:text-zinc-500 leading-normal">
                      We never store passwords. All logins use trusted Google Sign-In with cryptographic access tokens and encrypted HTTPS transport.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-800/60 md:bg-zinc-50/70 border border-zinc-700/60 md:border-zinc-200/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Recording Privacy</span>
                    <h4 className="text-xs font-black text-white md:text-zinc-900">Real-Time Camera Only</h4>
                    <p className="text-[11px] text-zinc-400 md:text-zinc-500 leading-normal">
                      Camera and microphone data are accessed strictly during active recording. We never access photo libraries or pre-recorded storage.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-800/60 md:bg-zinc-50/70 border border-zinc-700/60 md:border-zinc-200/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Zero Data Selling</span>
                    <h4 className="text-xs font-black text-white md:text-zinc-900">No Selling or Renting</h4>
                    <p className="text-[11px] text-zinc-400 md:text-zinc-500 leading-normal">
                      We never sell, rent, or trade your personal data to third parties. Data is shared solely with trusted cloud infrastructure providers.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-800/60 md:bg-zinc-50/70 border border-zinc-700/60 md:border-zinc-200/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Legal Jurisdiction</span>
                    <h4 className="text-xs font-black text-white md:text-zinc-900">San Francisco, California, USA</h4>
                    <p className="text-[11px] text-zinc-400 md:text-zinc-500 leading-normal">
                      Platform terms and privacy policies are governed by the laws of the State of California, USA with jurisdiction in San Francisco, CA.
                    </p>
                  </div>
                </div>

                <div className="border-t border-zinc-800 md:border-zinc-150 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-zinc-400 md:text-zinc-500 font-medium">
                    Software Build: <strong className="text-white md:text-zinc-800">Yoouz Cloud v2.0 (Stable Release)</strong> • Contact: <a href="mailto:support@yoouz.com" className="text-blue-400 md:text-[#1a73e8] hover:underline font-bold">support@yoouz.com</a>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-emerald-500/10 md:bg-emerald-50 text-emerald-400 md:text-emerald-700 border border-emerald-500/20 md:border-emerald-200 text-[11px] font-bold flex items-center gap-1.5 w-fit">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>All Systems Operational</span>
                  </div>
                </div>
              </div>

              {/* Danger Zone: Account Deletion (Only for signed in user) */}
              {currentUser && (
                <div className="bg-zinc-900 md:bg-white rounded-3xl p-8 border border-rose-900/50 md:border-rose-200 shadow-xs space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 md:bg-rose-50 border border-rose-500/20 md:border-rose-100 flex items-center justify-center text-rose-400 md:text-rose-600 shrink-0">
                      <Trash2 className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-black text-white md:text-zinc-950">Danger Zone: Delete Account Profile</h3>
                      <p className="text-xs text-zinc-400 md:text-zinc-500 leading-relaxed">
                        Permanently erase your user profile details, bio, avatar, and cached session information. This action cannot be reversed.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-rose-900/40 md:border-rose-100 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <p className="text-xs text-zinc-400 md:text-zinc-500 font-medium">
                      Confirming will sign you out immediately and purge your profile record.
                    </p>
                    <button
                      onClick={() => {
                        setIsDeleteConfirmOpen(true);
                        setDeleteInputText("");
                      }}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/15 transition-all cursor-pointer shrink-0"
                    >
                      Delete Account
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
            <div className="bg-zinc-900 md:bg-white rounded-3xl p-6 sm:p-8 border border-zinc-800 md:border-zinc-200 shadow-xs space-y-6 text-left animate-in fade-in duration-200">
              {submitSuccess ? (
                /* Success Confirmation State */
                <div className="text-center py-10 px-4 space-y-4 animate-in fade-in duration-200">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 md:bg-emerald-50 border border-emerald-500/20 md:border-emerald-200 flex items-center justify-center text-emerald-400 md:text-emerald-600 mx-auto shadow-xs">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-xl font-black text-white md:text-zinc-950">Inquiry Received Successfully</h3>
                    <p className="text-xs sm:text-sm text-zinc-400 md:text-zinc-500 max-w-md mx-auto leading-relaxed">
                      Thank you for contacting Yoouz. Your message has been logged securely in our support queue. Our team reviews all requests within 24 hours.
                    </p>
                  </div>
                  <button
                    onClick={() => setSubmitSuccess(false)}
                    className="py-3 px-6 rounded-2xl bg-zinc-800 md:bg-zinc-900 hover:bg-zinc-700 md:hover:bg-zinc-800 text-white font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <span>Send Another Inquiry</span>
                  </button>
                </div>
              ) : (
                /* Contact Form */
                <form onSubmit={handleContactSubmit} className="space-y-5">
                  <div className="space-y-1 border-b border-zinc-800 md:border-zinc-150 pb-4">
                    <h3 className="text-lg font-black text-white md:text-zinc-950">Official Yoouz Support Desk</h3>
                    <p className="text-xs text-zinc-400 md:text-zinc-500 font-medium">
                      Submit support inquiries, business domain claim requests, or report community guideline infractions.
                    </p>
                  </div>

                  {submitError && (
                    <div className="p-4 rounded-2xl bg-red-950/40 md:bg-red-50 border border-red-800 md:border-red-200 text-red-400 md:text-red-700 text-xs font-semibold flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase tracking-wider font-black text-zinc-400 md:text-zinc-500 block px-1">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. Sarah Jenkins"
                        className="w-full px-4 py-3 rounded-2xl bg-zinc-800 md:bg-zinc-50 border border-zinc-700 md:border-zinc-200 focus:bg-zinc-800/80 md:focus:bg-white focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/15 text-xs font-semibold outline-none transition-all text-white md:text-zinc-900 placeholder:text-zinc-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase tracking-wider font-black text-zinc-400 md:text-zinc-500 block px-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="e.g. sarah@example.com"
                        className="w-full px-4 py-3 rounded-2xl bg-zinc-800 md:bg-zinc-50 border border-zinc-700 md:border-zinc-200 focus:bg-zinc-800/80 md:focus:bg-white focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/15 text-xs font-semibold outline-none transition-all text-white md:text-zinc-900 placeholder:text-zinc-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase tracking-wider font-black text-zinc-400 md:text-zinc-500 block px-1">
                        Category *
                      </label>
                      <select
                        value={contactCategory}
                        onChange={(e) => setContactCategory(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-zinc-800 md:bg-zinc-50 border border-zinc-700 md:border-zinc-200 focus:bg-zinc-800/80 md:focus:bg-white focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/15 text-xs font-bold outline-none transition-all text-white md:text-zinc-900"
                      >
                        <option value="support">General Account / Technical Support</option>
                        <option value="verification">Business / Domain Ownership Verification</option>
                        <option value="guidelines">Report Policy Violation / Fake Content</option>
                        <option value="partnership">API & Partnership Inquiries</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase tracking-wider font-black text-zinc-400 md:text-zinc-500 block px-1">
                        Website Domain (Optional)
                      </label>
                      <input
                        type="text"
                        value={contactDomain}
                        onChange={(e) => setContactDomain(e.target.value)}
                        placeholder="e.g. yourcompany.com"
                        className="w-full px-4 py-3 rounded-2xl bg-zinc-800 md:bg-zinc-50 border border-zinc-700 md:border-zinc-200 focus:bg-zinc-800/80 md:focus:bg-white focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/15 text-xs font-semibold outline-none transition-all text-white md:text-zinc-900 placeholder:text-zinc-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider font-black text-zinc-400 md:text-zinc-500 block px-1">
                      Message Details *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Describe your inquiry or request in detail..."
                      className="w-full px-4 py-3 rounded-2xl bg-zinc-800 md:bg-zinc-50 border border-zinc-700 md:border-zinc-200 focus:bg-zinc-800/80 md:focus:bg-white focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/15 text-xs font-semibold outline-none transition-all resize-none leading-relaxed text-white md:text-zinc-900 placeholder:text-zinc-500"
                    />
                  </div>

                  {/* Drag-and-Drop Attachments */}
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-wider font-black text-zinc-400 md:text-zinc-500 block px-1">
                      Attach Screenshots or Verification Proof (Optional)
                    </label>

                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                        dragOver
                          ? "border-[#1a73e8] bg-blue-500/10 md:bg-blue-50/50"
                          : "border-zinc-700 md:border-zinc-200 bg-zinc-800/60 md:bg-zinc-50 hover:bg-zinc-800 md:hover:bg-zinc-100/50 hover:border-zinc-600 md:hover:border-zinc-300"
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
                      <div className="w-10 h-10 rounded-2xl bg-zinc-800 md:bg-white border border-zinc-700 md:border-zinc-200 flex items-center justify-center text-zinc-300 md:text-zinc-500 shadow-2xs">
                        <UploadCloud className="w-5 h-5 text-blue-400 md:text-[#1a73e8]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-200 md:text-zinc-800">
                          Drag & drop files here, or <span className="text-blue-400 md:text-[#1a73e8] underline">browse files</span>
                        </p>
                        <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                          PNG, JPG, WEBP, PDF or DOC (Max 3 files, up to 2MB each)
                        </p>
                      </div>
                    </div>

                    {/* Attachment Previews */}
                    {attachedFiles.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        {attachedFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-800 md:bg-zinc-50 border border-zinc-700 md:border-zinc-200 text-xs gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {file.type.startsWith("image/") ? (
                                <img
                                  src={file.base64}
                                  alt="preview"
                                  className="w-8 h-8 rounded-lg object-cover shrink-0 border border-zinc-700 md:border-zinc-200"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-zinc-700 md:bg-zinc-100 flex items-center justify-center text-zinc-300 md:text-zinc-500 shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-white md:text-zinc-800 truncate">{file.name}</p>
                                <p className="text-[9px] text-zinc-400 font-bold">
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
                              className="w-6 h-6 rounded-full hover:bg-zinc-700 md:hover:bg-zinc-200 flex items-center justify-center text-zinc-400 md:text-zinc-500 transition-colors cursor-pointer shrink-0"
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
                      className="w-full sm:w-auto py-3 px-8 rounded-2xl bg-[#1a73e8] hover:bg-[#1557b0] disabled:bg-zinc-800 md:disabled:bg-zinc-300 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-97"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <span>Submit Secure Request</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </section>

        {/* 4. Google-Standard Footer */}
        <footer className="pt-10 border-t border-zinc-800 md:border-zinc-200/80 text-center space-y-4 text-xs text-zinc-400 md:text-zinc-500">
          <div className="flex items-center justify-center gap-3">
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-full bg-zinc-900 md:bg-white hover:bg-red-950/40 md:hover:bg-red-50 border border-zinc-800 md:border-zinc-200 text-zinc-400 md:text-zinc-500 hover:text-red-400 md:hover:text-red-600 flex items-center justify-center transition-all shadow-3xs cursor-pointer"
              title="YouTube"
            >
              <Youtube className="w-4 h-4" />
            </a>
            <a
              href="https://x.com"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-full bg-zinc-900 md:bg-white hover:bg-zinc-800 md:hover:bg-zinc-100 border border-zinc-800 md:border-zinc-200 text-zinc-400 md:text-zinc-600 hover:text-white md:hover:text-zinc-950 flex items-center justify-center transition-all shadow-3xs cursor-pointer"
              title="X"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-full bg-zinc-900 md:bg-white hover:bg-zinc-800 md:hover:bg-zinc-100 border border-zinc-800 md:border-zinc-200 text-zinc-400 md:text-zinc-600 hover:text-white md:hover:text-zinc-950 flex items-center justify-center transition-all shadow-3xs cursor-pointer"
              title="TikTok"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298 0 .59.04.87.12V9.4a6.34 6.34 0 0 0-6.63 6.31A6.34 6.34 0 0 0 10.06 22a6.34 6.34 0 0 0 6.32-6.33V9.58a8.28 8.28 0 0 0 4.88 1.58V7.71a4.83 4.83 0 0 1-1.67-1.02z" />
              </svg>
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-full bg-zinc-900 md:bg-white hover:bg-pink-950/40 md:hover:bg-pink-50 border border-zinc-800 md:border-zinc-200 text-zinc-400 md:text-zinc-500 hover:text-pink-400 md:hover:text-pink-600 flex items-center justify-center transition-all shadow-3xs cursor-pointer"
              title="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-full bg-zinc-900 md:bg-white hover:bg-blue-950/40 md:hover:bg-blue-50 border border-zinc-800 md:border-zinc-200 text-zinc-400 md:text-zinc-500 hover:text-blue-400 md:hover:text-[#0077b5] flex items-center justify-center transition-all shadow-3xs cursor-pointer"
              title="LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs font-semibold text-zinc-400 md:text-zinc-500 pt-1 flex-wrap">
            <button
              onClick={() => onOpenLegal ? onOpenLegal("terms") : null}
              className="hover:text-white md:hover:text-zinc-900 underline cursor-pointer bg-transparent border-none p-0"
            >
              Terms & Conditions
            </button>
            <span>•</span>
            <button
              onClick={() => onOpenLegal ? onOpenLegal("privacy") : null}
              className="hover:text-white md:hover:text-zinc-900 underline cursor-pointer bg-transparent border-none p-0"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setActiveTab("contact");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="hover:text-white md:hover:text-zinc-900 underline cursor-pointer bg-transparent border-none p-0"
            >
              Support Desk
            </button>
          </div>

          <div className="space-y-1 text-center font-medium">
            <p className="text-[11px] font-bold text-zinc-500 md:text-zinc-400 uppercase tracking-wider">
              Yoouz Trust Network • San Francisco, CA
            </p>
            <p className="text-[11px] text-zinc-500 md:text-zinc-400">
              © 2026 Yoouz Inc. All rights reserved. Real People. Real Reviews..
            </p>
          </div>
        </footer>
      </main>

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 md:bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-800 md:border-zinc-200 space-y-5 animate-in zoom-in-95 duration-150 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 md:bg-rose-50 border border-rose-500/20 md:border-rose-100 flex items-center justify-center text-rose-400 md:text-rose-600 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-white md:text-zinc-950">Confirm Profile Deletion</h3>
              <p className="text-xs text-zinc-400 md:text-zinc-500 font-medium leading-relaxed">
                This is a permanent operation. To delete profile <strong className="text-white md:text-zinc-900">{currentUser?.email}</strong>, please type <strong className="text-white md:text-zinc-900 select-all">DELETE</strong> below.
              </p>
            </div>

            <input
              type="text"
              value={deleteInputText}
              onChange={(e) => setDeleteInputText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full bg-zinc-800 md:bg-zinc-50 border border-zinc-700 md:border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-center font-bold tracking-widest text-white md:text-zinc-900 focus:outline-none focus:border-rose-500"
            />

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 md:border-zinc-200 text-zinc-300 md:text-zinc-700 text-xs font-bold hover:bg-zinc-800 md:hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteInputText !== "DELETE" || isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await onDeleteProfile();
                    setIsDeleteConfirmOpen(false);
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-zinc-800 md:disabled:bg-zinc-100 disabled:text-zinc-500 md:disabled:text-zinc-400 text-white text-xs font-bold shadow-md shadow-rose-600/15 transition-all cursor-pointer"
              >
                {isDeleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
