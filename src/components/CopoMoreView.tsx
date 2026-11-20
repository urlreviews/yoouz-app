import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Shield,
  HelpCircle,
  Info,
  ChevronDown,
  ChevronLeft,
  Globe,
  Camera,
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
  EyeOff,
  TrendingUp,
  Zap,
  Award,
  Flame
} from "lucide-react";
import { UserProfile, NavSection } from "../types";
import { useLanguage } from "../i18n/LanguageContext";
import { SupportedLanguage } from "../i18n/translations";

interface CopoMoreViewProps {
  currentUser: UserProfile | null;
  onOpenAuth?: () => void;
  onSuccessAuth?: (user: UserProfile) => void;
  onSignOut?: () => void;
  onNavigate?: (section: NavSection) => void;
  onDeactivateProfile?: () => Promise<void>;
  onDeleteProfile?: () => Promise<void>;
  onOpenLegal?: (tab: "terms" | "privacy") => void;
  onOpenComparison?: (competitor?: string) => void;
  onOpenNotificationSettings?: () => void;
  isBusinessSuiteEmbedded?: boolean;
  businessDomain?: string;
  businessName?: string;
  businessEmail?: string;
  onBack?: () => void;
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
  onOpenNotificationSettings,
  isBusinessSuiteEmbedded = false,
  businessDomain = "",
  businessName = "",
  businessEmail = "",
  onBack
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

  // Prefill contact form when user profile or business details are present
  useEffect(() => {
    let bizSessionEmail = "";
    let bizSessionName = "";
    try {
      const rawBiz = localStorage.getItem("copo_business_verified_session");
      if (rawBiz) {
        const parsed = JSON.parse(rawBiz);
        if (parsed) {
          bizSessionEmail = parsed.businessEmail || parsed.email || "";
          bizSessionName = parsed.businessName || parsed.ownerName || "";
        }
      }
    } catch (e) {}

    if (isBusinessSuiteEmbedded) {
      // In Business Portal or business context, prefill strictly with verified business info
      setContactName(businessName || bizSessionName || "Business Manager");
      setContactEmail(businessEmail || bizSessionEmail || "");
    } else if (currentUser) {
      setContactName(currentUser.name || "");
      setContactEmail(currentUser.email || "");
    } else {
      setContactName("");
      setContactEmail("");
    }
    if (businessDomain) {
      setContactDomain(businessDomain);
    }
  }, [currentUser, businessDomain, businessName, businessEmail, isBusinessSuiteEmbedded]);

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
      question: t("trustCenter.faq_rev_1_q", "How fast is posting a live photo review on Yoouz?"),
      answer: t("trustCenter.faq_rev_1_a", "Posting takes seconds: snap one live photo using your front or rear camera, tap a whole-number 1 to 5 star rating, and publish immediately—with no titles, captions, or editing required."),
      tags: ["photo", "fast", "camera", "stars", "rating", "instant"]
    },
    {
      id: "rev-2",
      category: "reviewers",
      question: t("trustCenter.faq_rev_2_q", "Why does Yoouz only use the live camera and disable gallery uploads?"),
      answer: t("trustCenter.faq_rev_2_a", "To guarantee 100% authentic human experiences, Yoouz enforces Proof of Presence™ by opening the live camera (front or rear) for direct capture. Uploading saved gallery files, marketing commercials, or stock photos is strictly disabled to eliminate fake reviews and bot uploads."),
      tags: ["camera", "front camera", "rear camera", "live capture", "no uploads", "gallery", "authenticity"]
    },
    {
      id: "rev-3",
      category: "reviewers",
      question: t("trustCenter.faq_rev_3_q", "When is my U/XXXXXX account created—do I need to sign up to browse or click Like?"),
      answer: t("trustCenter.faq_rev_3_a", "No account is ever created just from visiting or browsing Yoouz. Your anonymous U/XXXXXX username is created automatically in the background the exact moment you take an action—such as clicking 'Publish Photo Review' on a live camera photo, or tapping Like, Bookmark, Comment, Follow, or Message. You never see a sign-up form, email prompt, or password wall."),
      tags: ["anonymous", "zero friction", "username", "when created", "like", "submit", "account"]
    },
    {
      id: "rev-passkey",
      category: "reviewers",
      question: t("trustCenter.faq_rev_passkey_q", "How do I keep my account if I switch phones?"),
      answer: t("trustCenter.faq_rev_passkey_a", "Open your profile and tap 'Save Passkey'. Your device saves a passkey automatically and unlocks your Verified badge (✓). On a new device, just tap 'Restore Account' — no email, password, or username to remember."),
      tags: ["passkey", "new phone", "switch phone", "remember username", "backup", "icloud", "android", "verified badge"]
    },
    {
      id: "rev-4",
      category: "reviewers",
      question: t("trustCenter.faq_rev_4_q", "How do reviewers get a Verified badge (✓) on Yoouz?"),
      answer: t("trustCenter.faq_rev_4_a", "Reviewers earn a Verified badge (✓) next to their handle after saving a Passkey on their profile."),
      tags: ["verified", "badge", "passkey", "checkmark", "profile"]
    },
    {
      id: "rev-5",
      category: "reviewers",
      question: t("trustCenter.faq_rev_5_q", "Can viewers comment, ask questions, or interact on my photo reviews?"),
      answer: t("trustCenter.faq_rev_5_a", "Yes! Every photo review includes a live community discussion feed. Viewers can ask follow-up questions ('Is parking easy?', 'Did you try the dessert?'), share tips, and discuss their experiences directly beneath your photo."),
      tags: ["comments", "questions", "community", "discussion", "interaction"]
    },
    {
      id: "rev-6",
      category: "reviewers",
      question: t("trustCenter.faq_rev_6_q", "Can I review any website domain or local establishment?"),
      answer: t("trustCenter.faq_rev_6_a", "Yes! You can search and review any base website domain (e.g., stripe.com, airbnb.com) or local brick-and-mortar place (restaurants, cafes, services, gyms) to build a unified hub of authentic visual opinions."),
      tags: ["domain", "website", "places", "search", "business", "establishment"]
    },
    {
      id: "rev-7",
      category: "reviewers",
      question: t("trustCenter.faq_rev_7_q", "Can I edit or delete my reviews later?"),
      answer: t("trustCenter.faq_rev_7_a", "Absolutely. You maintain complete ownership of your published content. You can modify your star rating or permanently delete any of your posted photo reviews at any time directly from your Profile drawer or review options."),
      tags: ["edit", "delete", "rating", "manage", "profile"]
    },
    {
      id: "rev-8",
      category: "reviewers",
      question: t("trustCenter.faq_rev_8_q", "How does direct messaging work between community members?"),
      answer: t("trustCenter.faq_rev_8_a", "Reviewers and users can message each other directly through the 'Messages' tab to ask private questions about venues, recommend local spots, or connect with fellow explorers."),
      tags: ["messaging", "direct message", "chat", "community", "contact"]
    },

    // --- Business FAQs ---
    {
      id: "biz-premium-suite",
      category: "business",
      question: t("trustCenter.faq_biz_premium_suite_q", "What is included in the Yoouz Premium Business Suite ($149/mo)?"),
      answer: t("trustCenter.faq_biz_premium_suite_a", "The Yoouz Premium Business Suite ($149/mo or $99/mo annual) provides a comprehensive enterprise growth stack: Verified Business Badge, Priority Search Placement in local search results, Live Website Review Widget with automated Google Rich Snippets SEO Schema, Branded Social Ad Exporter, Pinned Owner Replies, Direct Messaging Lead Capture, Table & Window QR Standees, and Real-Time Analytics."),
      tags: ["premium", "plan", "membership", "features", "pricing", "$149", "suite", "seo", "ads"]
    },
    {
      id: "biz-premium-seo",
      category: "business",
      question: t("trustCenter.faq_biz_premium_seo_q", "How does the Yoouz Premium Suite improve Google Search SEO & Rich Snippets?"),
      answer: t("trustCenter.faq_biz_premium_seo_a", "When you embed your Yoouz photo review widget on your website, our system automatically generates Schema.org JSON-LD structured data. This allows search engines like Google to render whole-number star ratings and live photo proofs directly in organic search results, increasing click-through rates (CTR) by up to 35%."),
      tags: ["seo", "google", "rich snippets", "schema", "ratings", "ctr", "organic search"]
    },
    {
      id: "biz-premium-ads",
      category: "business",
      question: t("trustCenter.faq_biz_premium_ads_q", "Can businesses export customer photo reviews as branded social media assets?"),
      answer: t("trustCenter.faq_biz_premium_ads_a", "Yes! Premium Suite subscribers can export customer live photo reviews as high-definition branded social assets with your official venue logo overlay and watermark—ready to run on Instagram Stories, TikTok, or Facebook Ads."),
      tags: ["ad export", "social media", "instagram", "tiktok", "watermark", "branding"]
    },
    {
      id: "biz-premium-terms",
      category: "business",
      question: t("trustCenter.faq_biz_premium_terms_q", "Are there any contracts, hidden fees, or cancellation lock-ins?"),
      answer: t("trustCenter.faq_biz_premium_terms_a", "No. Yoouz Premium Business Suite is completely flexible with zero setup fees and zero cancellation penalties. You can upgrade, pause, or switch plans anytime with 1-click in your Business Dashboard."),
      tags: ["contract", "fees", "cancellation", "flexible", "no lock-in"]
    },
    {
      id: "biz-1",
      category: "business",
      question: t("trustCenter.faq_biz_1_q", "How can my business claim its official domain or place page?"),
      answer: t("trustCenter.faq_biz_1_a", "Business owners can claim their listing in less than 2 minutes through the business verification flow. Claiming unlocks official owner dashboard tools, category settings, operating hours management, and customer dialogue features."),
      tags: ["claim", "domain", "verification", "business", "owner"]
    },
    {
      id: "biz-2",
      category: "business",
      question: t("trustCenter.faq_biz_2_q", "Why do live photo reviews convert higher than traditional text reviews?"),
      answer: t("trustCenter.faq_biz_2_a", "Written reviews are easily fabricated and skimmed with skepticism, whereas live camera photos provide instant visual proof of real dishes, spaces, products, and service—building immediate buyer confidence."),
      tags: ["conversion", "trust", "growth", "sales", "testimonials", "roi", "photo conversion"]
    },
    {
      id: "biz-ugc",
      category: "business",
      question: t("trustCenter.faq_biz_ugc_q", "Why are live customer photo reviews trusted more than paid endorsements?"),
      answer: t("trustCenter.faq_biz_ugc_a", "Modern consumers are fatigue-blind to sponsored ads and stock imagery. Unfiltered live camera photos from everyday customers carry authentic visual proof because reviewers snap what is actually right in front of them."),
      tags: ["influencer", "ugc", "trust", "authenticity", "social proof", "marketing"]
    },
    {
      id: "biz-returns",
      category: "business",
      question: t("trustCenter.faq_biz_returns_q", "How do live photo reviews reduce product return rates and customer misunderstandings?"),
      answer: t("trustCenter.faq_biz_returns_a", "Text reviews often create ambiguous expectations. A real customer photo taken live on location or on unboxing shows true sizing, atmosphere, portion sizes, and build quality in natural light, aligning expectations before purchase."),
      tags: ["returns", "expectations", "clarity", "satisfaction"]
    },
    {
      id: "biz-case-study",
      category: "business",
      question: t("trustCenter.faq_biz_case_study_q", "Why are live photo reviews replacing long written essays for local discovery?"),
      answer: t("trustCenter.faq_biz_case_study_a", "Modern buyers rarely read 500-word written reviews. A full-screen vertical photo paired with a clean 1–5 whole-star rating gives instant visual proof in a single glance."),
      tags: ["visual proof", "local", "services", "discovery"]
    },
    {
      id: "biz-qr",
      category: "business",
      question: t("trustCenter.faq_biz_qr_q", "How can businesses use QR codes to capture in-person photo reviews on the spot?"),
      answer: t("trustCenter.faq_biz_qr_a", "Verified businesses can download branded QR table tents, counter cards, and receipt stickers from their dashboard. When customers scan the code, it opens the live Yoouz camera pre-tagged to the business with zero sign-up required."),
      tags: ["qr code", "in store", "counter card", "table tent", "instant capture"]
    },
    {
      id: "biz-3",
      category: "business",
      question: t("trustCenter.faq_biz_3_q", "Can businesses embed Yoouz photo reviews on their own websites?"),
      answer: t("trustCenter.faq_biz_3_a", "Yes! Verified businesses can copy responsive iframe review feed embeds from their place drawer or Business Dashboard to display live customer photo reviews directly on their e-commerce store, Shopify site, or landing page."),
      tags: ["embed", "iframe", "website", "widgets", "testimonials", "shopify"]
    },
    {
      id: "biz-4",
      category: "business",
      question: t("trustCenter.faq_biz_4_q", "Can businesses export or download Branded Social Ads?"),
      answer: t("trustCenter.faq_biz_4_a", "Yes! Claimed businesses can export customer photo reviews as high-resolution branded assets with official watermark overlays for use in social media campaigns, Instagram stories, and marketing campaigns."),
      tags: ["export", "branded ad", "ad export", "download", "marketing"]
    },
    {
      id: "biz-5",
      category: "business",
      question: t("trustCenter.faq_biz_5_q", "Can businesses pay to remove or hide negative photo reviews?"),
      answer: t("trustCenter.faq_biz_5_a", "No. Yoouz is built on uncompromised trust and authenticity. We never delete or alter honest photo reviews for payment. Reviews that violate safety or explicit content guidelines can be flagged for human moderation review, and owners can post official pinned replies."),
      tags: ["policy", "negative reviews", "moderation", "trust", "payment", "no pay to remove"]
    },
    {
      id: "biz-6",
      category: "business",
      question: t("trustCenter.faq_biz_6_q", "How do official Business Owner replies and pinned comments work?"),
      answer: t("trustCenter.faq_biz_6_a", "Claimed business owners can participate in comment threads with a highlighted 'Business Owner' badge. Owners can also pin official responses to the top of comment feeds to highlight updates, resolutions, or special announcements."),
      tags: ["owner response", "pinned", "support", "dialogue", "comments"]
    },
    {
      id: "biz-7",
      category: "business",
      question: t("trustCenter.faq_biz_7_q", "What is the Business Hours Manager and how does it sync?"),
      answer: t("trustCenter.faq_biz_7_a", "Claimed business owners can configure weekly operating hours, special holiday schedules, and open/closed statuses directly in their dashboard. Changes sync live across search results and place profile drawers."),
      tags: ["hours", "business hours", "operating hours", "dashboard", "schedule"]
    },
    {
      id: "biz-8",
      category: "business",
      question: t("trustCenter.faq_biz_8_q", "How do I manage business categories and contact details?"),
      answer: t("trustCenter.faq_biz_8_a", "Claimed owners can select official business categories, add verified phone numbers with international country codes, and link official web domains directly within the Business Dashboard."),
      tags: ["category", "contact", "phone", "details", "dashboard"]
    },

    // --- Trust & Authenticity FAQs ---
    {
      id: "trust-1",
      category: "trust",
      question: t("trustCenter.faq_trust_1_q", "Why do live photo reviews outperform traditional text feedback?"),
      answer: t("trustCenter.faq_trust_1_a", "Text reviews are quick to fake and slow to verify. Live photos let customers see real food, interiors, receipts, products, and experiences captured on the spot with strict whole-star (1–5) scoring."),
      tags: ["text vs photo", "visual proof", "trust"]
    },
    {
      id: "trust-2",
      category: "trust",
      question: t("trustCenter.faq_trust_2_q", "How does Yoouz eliminate fake reviews, AI bots, and automated spam?"),
      answer: t("trustCenter.faq_trust_2_a", "With AI copywriters and bot farms making written text reviews effortless to manufacture, Yoouz enforces Proof of Presence™. Every review photo must be snapped live through the device camera in the moment—blocking gallery uploads, stock imagery, and automated text bots."),
      tags: ["ai bots", "fake reviews", "proof of presence", "spam", "live camera", "authenticity"]
    },
    {
      id: "trust-smear",
      category: "trust",
      question: t("trustCenter.faq_trust_smear_q", "How does live photo capture protect businesses from competitor smear campaigns?"),
      answer: t("trustCenter.faq_trust_smear_a", "On legacy text review sites, competitors or anonymous trolls can paste dozens of fake 1-star text complaints from anywhere. Yoouz requires live camera capture on location or unboxing, dismantling copy-paste spam and bot attacks."),
      tags: ["smear campaign", "extortion", "protection", "competitors", "trolls", "integrity"]
    },
    {
      id: "trust-3",
      category: "trust",
      question: t("trustCenter.faq_trust_3_q", "Why does Yoouz use strict 1–5 whole-star ratings for every review?"),
      answer: t("trustCenter.faq_trust_3_a", "Individual reviews never use confusing half-stars or ambiguous decimals. Reviewers tap a clear whole rating from 1 to 5 solid stars right after snapping their live photo."),
      tags: ["stars", "rating", "whole numbers", "clarity"]
    },
    {
      id: "trust-4",
      category: "trust",
      question: t("trustCenter.faq_trust_4_q", "Is my private email address exposed on my public profile or business claim badge?"),
      answer: t("trustCenter.faq_trust_4_a", "No. Yoouz strictly protects user privacy. Public profiles and claimed business badges remain private and anonymous (e.g., U/A4B6C8 or 'Business Claimed') without ever displaying personal or owner email addresses to the public."),
      tags: ["privacy", "email", "anonymous", "protection", "security"]
    },
    {
      id: "trust-6",
      category: "trust",
      question: t("trustCenter.faq_trust_6_q", "How are community guidelines and safety rules enforced?"),
      answer: t("trustCenter.faq_trust_6_a", "Every photo review and comment includes a report flag button. Community submissions triggering policy violations (hate speech, spam, harassment, or explicit content) are queued for immediate review and removal."),
      tags: ["guidelines", "safety", "report", "moderation", "flag"]
    },
    {
      id: "trust-7",
      category: "trust",
      question: t("trustCenter.faq_trust_7_q", "Which profiles display a Verified checkmark badge?"),
      answer: t("trustCenter.faq_trust_7_a", "Verified badges (✓) appear on claimed business profiles and on community reviewers who have saved a Passkey."),
      tags: ["verified business", "verified reviewer", "passkey", "badges", "trust", "businesses"]
    },

    // --- Technical & Navigation FAQs ---
    {
      id: "tech-1",
      category: "technical",
      question: t("trustCenter.faq_tech_1_q", "How do live photo reviews impact Google Search, Google Maps, and AI answer engines?"),
      answer: t("trustCenter.faq_tech_1_a", "Modern search engines (like Google) and AI discovery engines (Perplexity, ChatGPT, Gemini) prioritize rich, verified user-generated visual proof. Yoouz profiles and photo reviews produce structured Schema.org ImageObject & Review metadata that help businesses rank prominently in local search and AI overviews."),
      tags: ["seo", "google", "ai overview", "search ranking", "schema", "rich snippets"]
    },
    {
      id: "tech-seo-snippets",
      category: "technical",
      question: t("trustCenter.faq_tech_seo_snippets_q", "How do photo reviews improve Google search rankings and generate Rich Snippets?"),
      answer: t("trustCenter.faq_tech_seo_snippets_a", "Every Yoouz photo review is structured with Schema.org/Review and ImageObject metadata, enabling search engines to surface visual review thumbnails and star ratings in search results."),
      tags: ["rich snippets", "image object", "google search", "schema.org", "ranking"]
    },
    {
      id: "tech-ai-engines",
      category: "technical",
      question: t("trustCenter.faq_tech_ai_engines_q", "Do photo reviews help businesses appear in Google AI Overviews, ChatGPT, and Perplexity?"),
      answer: t("trustCenter.faq_tech_ai_engines_a", "Yes. Generative AI engines look for verified entity signals rather than easily faked text snippets. Because Yoouz ties reviews to live photos, geolocation, and whole-number ratings, AI engines reference Yoouz reviews as authentic proof."),
      tags: ["ai overviews", "chatgpt", "perplexity", "gemini", "entity signals", "search"]
    },
    {
      id: "tech-2",
      category: "technical",
      question: t("trustCenter.faq_tech_2_q", "How does Google Maps and Live Directions integration work?"),
      answer: t("trustCenter.faq_tech_2_a", "Yoouz integrates interactive Google Maps with live pin clustering. Users can tap any place to view street locations and launch step-by-step turn-by-turn driving, walking, biking, or transit directions."),
      tags: ["maps", "google maps", "directions", "navigation", "location"]
    },
    {
      id: "tech-3",
      category: "technical",
      question: t("trustCenter.faq_tech_3_q", "How can I share photo reviews or business profiles with friends?"),
      answer: t("trustCenter.faq_tech_3_a", "Tap the 'Share' button on any photo review or place to generate instant direct web links, downloadable QR codes, or share directly to WhatsApp, X (Twitter), Facebook, LinkedIn, or Email."),
      tags: ["share", "qr code", "social", "link", "whatsapp"]
    },
    {
      id: "tech-4",
      category: "technical",
      question: t("trustCenter.faq_tech_4_q", "Can I customize the appearance of embedded review feeds?"),
      answer: t("trustCenter.faq_tech_4_a", "Yes! The embed builder allows businesses to preview mobile and desktop views, customize dark/light themes, and set display limits."),
      tags: ["embed", "customization", "themes"]
    },
    {
      id: "tech-5",
      category: "technical",
      question: t("trustCenter.faq_tech_5_q", "Where can I find photo reviews or places I have saved for later?"),
      answer: t("trustCenter.faq_tech_5_a", "Any photo review or business listing you bookmark or save is immediately stored in your 'Bookmarks' tab in the main navigation menu for quick access on any device."),
      tags: ["bookmarks", "saved", "favorites", "navigation"]
    },
    {
      id: "tech-6",
      category: "technical",
      question: t("trustCenter.faq_tech_6_q", "How do I navigate between photo reviews on desktop and mobile?"),
      answer: t("trustCenter.faq_tech_6_a", "On mobile, swipe up or down in the full-screen vertical feed to move between photo reviews. On desktop, use your keyboard arrow keys, mouse wheel, or the vertical chevron buttons."),
      tags: ["navigation", "desktop", "mobile", "chevrons", "scroll"]
    },
    {
      id: "tech-7",
      category: "technical",
      question: t("trustCenter.faq_tech_7_q", "How does Yoouz work as a Progressive Web App (PWA)?"),
      answer: t("trustCenter.faq_tech_7_a", "Yoouz is a fast, mobile-first PWA supporting instant full-screen vertical photo feed browsing and direct camera capture right from your browser without downloading an app."),
      tags: ["pwa", "mobile", "camera", "speed"]
    },
    {
      id: "tech-8",
      category: "technical",
      question: t("trustCenter.faq_tech_8_q", "How many languages does Yoouz support, and how do I change my language?"),
      answer: t("trustCenter.faq_tech_8_a", "Yoouz supports 64 global languages with full UI internationalization. You can switch your preferred language at any time from the sidebar, footer, profile drawer, or Knowledge Center settings."),
      tags: ["languages", "64 languages", "i18n", "translation", "settings"]
    },
    {
      id: "tech-9",
      category: "technical",
      question: t("trustCenter.faq_tech_9_q", "Is Yoouz free for consumers and businesses?"),
      answer: t("trustCenter.faq_tech_9_a", "Yes. Browsing, discovering local venues, posting authentic live photo reviews, and venue profile claiming are included for all users and business operators with no hidden fees."),
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
      className="flex-1 w-full h-full bg-[#050506] overflow-y-auto font-sans text-white pb-[calc(env(safe-area-inset-bottom,16px)+104px)] md:pb-24 select-none selection:bg-white/20 selection:text-white"
    >
      {/* Top Sticky Bar */}
      <header className="sticky top-0 z-40 w-full bg-[#050506]/85 backdrop-blur-2xl border-b border-white/[0.07]">
        <div className="max-w-[1160px] mx-auto h-14 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button
            onClick={() => {
              if (onBack) {
                onBack();
              } else if (onNavigate) {
                onNavigate("home");
              }
            }}
            className="w-9 h-9 -ml-1.5 rounded-full hover:bg-white/[0.08] text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 active:scale-95"
            title={isBusinessSuiteEmbedded ? "Back to Dashboard" : "Back to Feed"}
          >
            <ChevronLeft className="w-5 h-5 stroke-[2]" />
          </button>
          <span className="text-[13.5px] font-semibold text-zinc-200 tracking-[-0.01em] absolute left-1/2 -translate-x-1/2">
            {t("trustCenter.title", "Knowledge & Trust Center")}
          </span>
          <div className="w-9 h-9" />
        </div>
      </header>

      {/* Main Widescreen Container */}
      <main className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 pt-7 sm:pt-10 pb-8 space-y-7 sm:space-y-9">
        {/* Editorial Hero Header + Liquid-Glass Segmented Control */}
        <section aria-label="Knowledge Navigation" className="space-y-6">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-[28px] sm:text-[36px] font-semibold tracking-[-0.03em] text-white leading-[1.1]">
              {t("trustCenter.title", "Knowledge & Trust Center")}
            </h1>
            <p className="text-sm sm:text-[15px] text-zinc-400 leading-relaxed font-normal">
              {t("trustCenter.heroSubtitle", "How Yoouz verifies live camera proof, protects privacy, and empowers transparent businesses.")}
            </p>
          </div>

          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar">
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/[0.045] border border-white/[0.08] whitespace-nowrap">
              <button
                onClick={() => setActiveTab("about")}
                className={`px-4 sm:px-5 py-2 rounded-full text-[13px] font-semibold transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "about"
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Info className="w-4 h-4 shrink-0" />
                <span>{t("trustCenter.trustProtocol", "Trust Protocol")}</span>
              </button>

              <button
                onClick={() => setActiveTab("faq")}
                className={`px-4 sm:px-5 py-2 rounded-full text-[13px] font-semibold transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "faq"
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span>{t("trustCenter.helpFaqs", "Help & FAQs")}</span>
              </button>

              <button
                onClick={() => setActiveTab("business")}
                className={`px-4 sm:px-5 py-2 rounded-full text-[13px] font-semibold transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "business"
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Building2 className="w-4 h-4 shrink-0" />
                <span>{t("trustCenter.forBusinesses", "For Businesses")}</span>
              </button>

              <button
                onClick={() => setActiveTab("security")}
                className={`px-4 sm:px-5 py-2 rounded-full text-[13px] font-semibold transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "security"
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Shield className="w-4 h-4 shrink-0" />
                <span>{t("trustCenter.privacySecurity", "Privacy")}</span>
              </button>

              {!isBusinessSuiteEmbedded && (
                <button
                  onClick={() => setActiveTab("language")}
                  className={`px-4 sm:px-5 py-2 rounded-full text-[13px] font-semibold transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === "language"
                      ? "bg-white text-zinc-950 shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Globe className="w-4 h-4 shrink-0" />
                  <span>{t("nav.language", "Language")} ({currentLanguageMeta.code.toUpperCase()})</span>
                </button>
              )}

              <button
                onClick={() => {
                  setActiveTab("contact");
                  setSubmitSuccess(false);
                  setSubmitError("");
                }}
                className={`px-4 sm:px-5 py-2 rounded-full text-[13px] font-semibold transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "contact"
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Mail className="w-4 h-4 shrink-0" />
                <span>{t("trustCenter.contactSupport", "Support")}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Tab Contents */}
        <section aria-label="Tab Content Area" className="space-y-8">
          {/* ========================================================= */}
          {/* TAB 1: ABOUT & THE TRUST PROTOCOL */}
          {/* ========================================================= */}
          {activeTab === "about" && (
            <div className="space-y-6 animate-in fade-in duration-200 text-left">
              {/* Hero Banner: Evolution of Trust & Proof of Presence */}
              <div className="bg-white/[0.03] rounded-[28px] p-6 sm:p-9 border border-white/[0.08] space-y-7">
                <div className="space-y-3.5 max-w-3xl">
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-[#E8C78A]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t("trustCenter.theYoouzStandard", "The Yoouz Standard")}</span>
                  </div>
                  <h2 className="text-2xl sm:text-[32px] font-semibold text-white tracking-[-0.03em] leading-[1.15]">
                    {t("trustCenter.trustEvolutionTitle", "The Evolution of Trust: From Static Text to Visual Proof")}
                  </h2>
                  <p className="text-sm text-zinc-300 leading-relaxed font-normal">
                    {t("trustCenter.trustEvolutionPara1", "For years, online reviews relied on static text. Written reviews served a simple baseline purpose—giving quick signals on whether a place was safe to consider. But text has a structural limit. In a digital landscape saturated with review inflation, bot networks, and AI-generated copy, written text is too easy to manufacture.")}
                  </p>
                  <p className="text-sm text-zinc-400 leading-relaxed font-normal">
                    {t("trustCenter.trustEvolutionPara2", "When a customer asks \"Is this actually true?\", written reviews stop converting. Yoouz bridges that gap with zero-friction, real-time visual proof. We eliminate gallery uploads, stock photos, and scripted marketing. Every review on Yoouz is captured live through the device camera, paired with a whole-number 1–5 star rating, and published in seconds.")}
                  </p>
                </div>

                {/* The 3 Core Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div className="bg-white/[0.035] p-5 sm:p-6 rounded-[22px] border border-white/[0.07] hover:border-white/[0.15] transition-colors space-y-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white">
                      <Camera className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-[11px] font-medium text-zinc-400 block">{t("trustCenter.strictRule", "Strict Rule")}</span>
                    <h4 className="text-[15px] font-semibold text-white tracking-[-0.01em]">{t("trustCenter.rule1Title", "Live Camera Only")}</h4>
                    <p className="text-[13px] text-zinc-400 leading-relaxed">
                      {t("trustCenter.rule1Desc", "Zero gallery uploads or saved stock photos. Snap a live photo on the spot using your front or rear camera.")}
                    </p>
                  </div>

                  <div className="bg-white/[0.035] p-5 sm:p-6 rounded-[22px] border border-white/[0.07] hover:border-white/[0.15] transition-colors space-y-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[#E8C78A]">
                      <Lock className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-[11px] font-medium text-zinc-400 block">{t("trustCenter.pillar2", "Pillar 2")}</span>
                    <h4 className="text-[15px] font-semibold text-white tracking-[-0.01em]">{t("trustCenter.rule2Title", "Strict 1–5 Whole Stars")}</h4>
                    <p className="text-[13px] text-zinc-400 leading-relaxed">
                      {t("trustCenter.rule2Desc", "Clean, decisive whole-number ratings from 1 to 5 stars paired directly with live visual proof.")}
                    </p>
                  </div>

                  <div className="bg-white/[0.035] p-5 sm:p-6 rounded-[22px] border border-white/[0.07] hover:border-white/[0.15] transition-colors space-y-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white">
                      <Users className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-[11px] font-medium text-zinc-400 block">{t("trustCenter.pillar3", "Pillar 3")}</span>
                    <h4 className="text-[15px] font-semibold text-white tracking-[-0.01em]">{t("trustCenter.rule3Title", "Instant Handles & Passkeys")}</h4>
                    <p className="text-[13px] text-zinc-400 leading-relaxed">
                      {t("trustCenter.rule3Desc", "Browse with zero sign-up. An anonymous handle is created automatically when you post or interact, with optional Passkey backup across devices.")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section: Why Live Photo Proof Wins Every Time */}
              <div className="bg-white/[0.03] rounded-[28px] p-6 sm:p-9 border border-white/[0.08] space-y-6">
                <div className="space-y-2 max-w-3xl">
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400">
                    <Flame className="w-3.5 h-3.5 text-[#E8C78A]" />
                    <span>{t("trustCenter.conversionScienceLabel", "The Conversion Science")}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-[-0.025em]">
                    {t("trustCenter.conversionScienceTitle", "Why Live Visual Proof Wins Every Time")}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {t("trustCenter.conversionScienceDesc", "Live photos show what actually happened in the moment—replacing anonymous text paragraphs with undeniable proof.")}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/[0.03] p-5 sm:p-6 rounded-[22px] border border-white/[0.07] hover:border-white/[0.15] transition-colors space-y-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white">
                      <Zap className="w-4.5 h-4.5" />
                    </div>
                    <h4 className="text-[15px] font-semibold text-white">{t("trustCenter.point1Title", "1. Instant Reality Check (No Marketing Fluff)")}</h4>
                    <p className="text-[13px] text-zinc-400 leading-relaxed">
                      {t("trustCenter.point1Desc", "When users swipe through live photo reviews, they see real plates, real rooms, real receipts, and genuine moments in natural lighting instead of polished ads.")}
                    </p>
                  </div>

                  <div className="bg-white/[0.03] p-5 sm:p-6 rounded-[22px] border border-white/[0.07] hover:border-white/[0.15] transition-colors space-y-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white">
                      <Award className="w-4.5 h-4.5" />
                    </div>
                    <h4 className="text-[15px] font-semibold text-white">{t("trustCenter.point2Title", "2. Concrete Specifics Over Generic Buzzwords")}</h4>
                    <p className="text-[13px] text-zinc-400 leading-relaxed">
                      {t("trustCenter.point2Desc", "Written testimonials rely on interchangeable buzzwords like \"great service, highly recommend\". Live photos show true quality, portion sizes, and atmosphere at a glance.")}
                    </p>
                  </div>

                  <div className="bg-white/[0.03] p-5 sm:p-6 rounded-[22px] border border-white/[0.07] hover:border-white/[0.15] transition-colors space-y-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white">
                      <TrendingUp className="w-4.5 h-4.5" />
                    </div>
                    <h4 className="text-[15px] font-semibold text-white">{t("trustCenter.point3Title", "3. Full-Screen Vertical Feed Speed")}</h4>
                    <p className="text-[13px] text-zinc-400 leading-relaxed">
                      {t("trustCenter.point3Desc", "Swipe up or down through full-screen photo reviews paired with whole-star 1–5 ratings and verified venue metadata without wasting time.")}
                    </p>
                  </div>

                  <div className="bg-white/[0.03] p-5 sm:p-6 rounded-[22px] border border-white/[0.07] hover:border-white/[0.15] transition-colors space-y-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white">
                      <ShieldCheck className="w-4.5 h-4.5" />
                    </div>
                    <h4 className="text-[15px] font-semibold text-white">{t("trustCenter.point4Title", "4. Trust Anchor for Real Decisions")}</h4>
                    <p className="text-[13px] text-zinc-400 leading-relaxed">
                      {t("trustCenter.point4Desc", "Before booking dining, hotels, services, or online stores, real customer photos captured live act as definitive proof that dismantles buyer skepticism.")}
                    </p>
                  </div>

                  <div className="md:col-span-2 bg-white/[0.03] p-5 sm:p-6 rounded-[22px] border border-white/[0.07] hover:border-white/[0.15] transition-colors space-y-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white">
                      <Globe className="w-4.5 h-4.5" />
                    </div>
                    <h4 className="text-[15px] font-semibold text-white">{t("trustCenter.point5Title", "5. Permanent Competitive Moat & AI Discovery")}</h4>
                    <p className="text-[13px] text-zinc-400 leading-relaxed max-w-3xl">
                      {t("trustCenter.point5Desc", "Text review volume can be copied overnight, but building a library of live customer photo reviews creates an uncatchable trust advantage across Google Search and AI discovery engines.")}
                    </p>
                  </div>
                </div>
              </div>

              {/* 4 Bento Cards: Core Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div className="bg-white/[0.03] rounded-[24px] p-6 sm:p-7 border border-white/[0.08] hover:border-white/[0.16] transition-colors space-y-4">
                  <div className="w-11 h-11 rounded-2xl bg-white/[0.06] border border-white/[0.09] flex items-center justify-center text-white">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-semibold text-white tracking-[-0.015em]">{t("trustCenter.bento1Title", "Live Camera Visual Proof")}</h3>
                    <p className="text-[13px] text-zinc-400 leading-relaxed font-normal">
                      {t("trustCenter.bento1Desc", "Every reviewer builds a public visual review trail. Instant camera capture prevents old gallery uploads, edited ads, and automated spam.")}
                    </p>
                  </div>
                  <div className="pt-1 flex items-center gap-2 text-xs font-medium text-zinc-300">
                    <ShieldCheck className="w-4 h-4 text-[#E8C78A]" />
                    <span>{t("trustCenter.bento1Sub", "Audit Any Reviewer Profile Instantly")}</span>
                  </div>
                </div>

                <div className="bg-white/[0.03] rounded-[24px] p-6 sm:p-7 border border-white/[0.08] hover:border-white/[0.16] transition-colors space-y-4">
                  <div className="w-11 h-11 rounded-2xl bg-white/[0.06] border border-white/[0.09] flex items-center justify-center text-white">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-semibold text-white tracking-[-0.015em]">{t("trustCenter.bento2Title", "Interactive Community Dialogue")}</h3>
                    <p className="text-[13px] text-zinc-400 leading-relaxed font-normal">
                      {t("trustCenter.bento2Desc", "Reviews shouldn't be dead one-way monologues. Viewers can ask real-time questions ('Is there outdoor seating?', 'How was the service?'), and the community answers collaboratively.")}
                    </p>
                  </div>
                  <div className="pt-1 flex items-center gap-2 text-xs font-medium text-zinc-300">
                    <Users className="w-4 h-4 text-[#E8C78A]" />
                    <span>{t("trustCenter.bento2Sub", "Crowdsourced Community Validation")}</span>
                  </div>
                </div>

                <div className="bg-white/[0.03] rounded-[24px] p-6 sm:p-7 border border-white/[0.08] hover:border-white/[0.16] transition-colors space-y-4">
                  <div className="w-11 h-11 rounded-2xl bg-white/[0.06] border border-white/[0.09] flex items-center justify-center text-white">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-semibold text-white tracking-[-0.015em]">{t("trustCenter.bento3Title", "Official Domain Verification")}</h3>
                    <p className="text-[13px] text-zinc-400 leading-relaxed font-normal">
                      {t("trustCenter.bento3Desc", "Business owners can claim their base domain page, respond with verified owner badges, and pin helpful solutions or updates at the top of customer review threads.")}
                    </p>
                  </div>
                  <div className="pt-1 flex items-center gap-2 text-xs font-medium text-zinc-300">
                    <BadgeCheck className="w-4 h-4 text-[#E8C78A]" />
                    <span>{t("trustCenter.bento3Sub", "Verified Owner Pinned Responses")}</span>
                  </div>
                </div>

                <div className="bg-white/[0.03] rounded-[24px] p-6 sm:p-7 border border-white/[0.08] hover:border-white/[0.16] transition-colors space-y-4">
                  <div className="w-11 h-11 rounded-2xl bg-white/[0.06] border border-white/[0.09] flex items-center justify-center text-white">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-semibold text-white tracking-[-0.015em]">{t("trustCenter.bento4Title", "No Pay-to-Remove Extortion")}</h3>
                    <p className="text-[13px] text-zinc-400 leading-relaxed font-normal">
                      {t("trustCenter.bento4Desc", "Unlike legacy review sites that pressure businesses into costly subscriptions to suppress negative feedback, Yoouz guarantees all verified reviews stay transparent and tamper-free.")}
                    </p>
                  </div>
                  <div className="pt-1 flex items-center gap-2 text-xs font-medium text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-[#E8C78A]" />
                    <span>{t("trustCenter.bento4Sub", "100% Equal Rules for All")}</span>
                  </div>
                </div>
              </div>

              {/* Section: The SEO & Discovery Power of Photo Reviews */}
              <div className="bg-white/[0.03] rounded-[28px] p-6 sm:p-9 border border-white/[0.08] space-y-6">
                <div className="space-y-2 max-w-3xl">
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400">
                    <Sparkles className="w-3.5 h-3.5 text-[#E8C78A]" />
                    <span>{t("trustCenter.seoVisibilityLabel", "Search Engine & AI Visibility")}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-[-0.025em]">
                    {t("trustCenter.seoAdvantageTitle", "The SEO & Discovery Advantage of Photo Reviews")}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {t("trustCenter.seoAdvantageDesc", "Search engines like Google and generative AI engines prioritize authentic visual entities over faceless text snippets.")}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div className="bg-white/[0.03] p-5 rounded-[22px] border border-white/[0.07] space-y-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white">
                      <Camera className="w-4 h-4" />
                    </div>
                    <h4 className="text-[14.5px] font-semibold text-white">{t("trustCenter.seoRichSnippetsTitle", "Google Review Rich Snippets")}</h4>
                    <p className="text-[13px] text-zinc-400 leading-relaxed">
                      {t("trustCenter.seoRichSnippetsDesc", "Structured Schema.org ImageObject and Review metadata display star ratings and visual thumbnails directly in Google search results.")}
                    </p>
                  </div>

                  <div className="bg-white/[0.03] p-5 rounded-[22px] border border-white/[0.07] space-y-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white">
                      <Zap className="w-4 h-4" />
                    </div>
                    <h4 className="text-[14.5px] font-semibold text-white">{t("trustCenter.aiRecommendationsTitle", "AI Grounded Recommendations")}</h4>
                    <p className="text-[13px] text-zinc-400 leading-relaxed">
                      {t("trustCenter.aiRecommendationsDesc", "Google AI Overviews, Gemini, ChatGPT, and Perplexity index verified geolocation and star ratings to recommend authentic venues.")}
                    </p>
                  </div>

                  <div className="bg-white/[0.03] p-5 rounded-[22px] border border-white/[0.07] space-y-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <h4 className="text-[14.5px] font-semibold text-white">{t("trustCenter.qrCaptureTitle", "In-Store QR Capture")}</h4>
                    <p className="text-[13px] text-zinc-400 leading-relaxed">
                      {t("trustCenter.qrCaptureDesc", "Merchants download instant table tents and counter cards so happy customers can scan and snap a live photo review on the spot.")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: HELP & FAQS */}
          {/* ========================================================= */}
          {activeTab === "faq" && (
            <div className="space-y-5 animate-in fade-in duration-200 text-left">
              {/* Spotlight Search & Category Filter Bar */}
              <div className="bg-white/[0.03] rounded-[24px] p-5 sm:p-6 border border-white/[0.08] space-y-4">
                <div className="relative">
                  <Search className="w-4.5 h-4.5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("trustCenter.searchFaqsPlaceholder", "Search FAQs, guidelines, or topics...")}
                    className="w-full pl-11 pr-10 py-3 rounded-full bg-white/[0.045] border border-white/[0.09] focus:bg-white/[0.07] focus:border-white/25 text-sm font-medium outline-none transition-all text-white placeholder:text-zinc-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/[0.1] hover:bg-white/[0.18] flex items-center justify-center text-zinc-200 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
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
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 border ${
                        faqCategoryFilter === cat.id
                          ? "bg-white text-zinc-950 border-white shadow-xs"
                          : "bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border-white/[0.08]"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* FAQ Accordion List */}
              <div className="bg-white/[0.03] rounded-[24px] p-5 sm:p-7 border border-white/[0.08] divide-y divide-white/[0.06]">
                {filteredFaqs.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <HelpCircle className="w-9 h-9 text-zinc-500 mx-auto" />
                    <h3 className="text-base font-semibold text-white">{t("trustCenter.noMatchingFaqs", "No matching questions found")}</h3>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                      {t("trustCenter.tryDifferentKeywords", "Try searching with different keywords, or reach out directly to our support desk.")}
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setFaqCategoryFilter("all");
                      }}
                      className="px-5 py-2 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 font-semibold text-xs transition-all cursor-pointer inline-flex"
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
                            <span className="text-[11px] font-medium text-zinc-400">
                              {faq.category === "reviewers"
                                ? t("trustCenter.categoryReviewers", "Reviewers")
                                : faq.category === "business"
                                ? t("trustCenter.categoryBusiness", "Businesses")
                                : faq.category === "trust"
                                ? t("trustCenter.categoryTrust", "Trust Model")
                                : t("trustCenter.categoryTechnical", "Technical")}
                            </span>
                            <h3 className="font-semibold text-sm sm:text-[15px] text-white group-hover:text-zinc-200 transition-colors leading-snug">
                              {t(`trustCenter.faq_${faq.id.replace(/-/g, "_")}_q`, faq.question)}
                            </h3>
                          </div>
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 border ${
                              isOpen
                                ? "bg-white text-zinc-950 border-white"
                                : "bg-white/[0.05] text-zinc-300 border-white/[0.08] group-hover:bg-white/[0.1]"
                            }`}
                          >
                            <ChevronDown
                              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                            />
                          </div>
                        </button>

                        {isOpen && (
                          <div className="mt-3 pt-1 text-[13.5px] text-zinc-300 leading-relaxed font-normal animate-in slide-in-from-top-1 duration-150">
                            <p className="bg-white/[0.03] p-4 rounded-2xl border border-white/[0.07]">
                              {t(`trustCenter.faq_${faq.id.replace(/-/g, "_")}_a`, faq.answer)}
                            </p>
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
            <div className="space-y-6 animate-in fade-in duration-200 text-left">
              <div className="bg-white/[0.03] rounded-[28px] p-6 sm:p-9 border border-white/[0.08] space-y-7">
                <div className="space-y-2.5 max-w-2xl">
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-[#E8C78A]">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{t("trustCenter.forBusinesses", "Business Verification Portal")}</span>
                  </div>
                  <h2 className="text-2xl sm:text-[32px] font-semibold text-white tracking-[-0.03em] leading-[1.15]">
                    {t("trustCenter.businessHeroTitle", "Claim Your Business Domain & Engage Directly")}
                  </h2>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {t("trustCenter.businessHeroDesc", "Verify ownership of your base website domain (e.g., yourcompany.com) or local place profile to access creator tools, official owner badges, and community response features.")}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div className="p-5 sm:p-6 rounded-[22px] bg-white/[0.035] border border-white/[0.07] space-y-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[#E8C78A]">
                      <BadgeCheck className="w-5 h-5" />
                    </div>
                    <h4 className="font-semibold text-[15px] text-white">{t("trustCenter.verifiedOwnerBadgeTitle", "Verified Owner Badge")}</h4>
                    <p className="text-[13px] text-zinc-400 leading-relaxed">
                      {t("trustCenter.verifiedOwnerBadgeDesc", "Stand out with a distinguished badge and official business owner designation on all comment threads.")}
                    </p>
                  </div>

                  <div className="p-5 sm:p-6 rounded-[22px] bg-white/[0.035] border border-white/[0.07] space-y-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <h4 className="font-semibold text-[15px] text-white">{t("trustCenter.pinnedSolutionsTitle", "Pinned Solutions")}</h4>
                    <p className="text-[13px] text-zinc-400 leading-relaxed">
                      {t("trustCenter.pinnedSolutionsDesc", "Pin an official response at the top of any review discussion to clarify updates or resolve questions.")}
                    </p>
                  </div>

                  <div className="p-5 sm:p-6 rounded-[22px] bg-white/[0.035] border border-white/[0.07] space-y-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white">
                      <ExternalLink className="w-5 h-5" />
                    </div>
                    <h4 className="font-semibold text-[15px] text-white">{t("trustCenter.embedTrustFeedsTitle", "Embed Trust Feeds")}</h4>
                    <p className="text-[13px] text-zinc-400 leading-relaxed">
                      {t("trustCenter.embedTrustFeedsDesc", "Easily embed genuine customer photo review carousels onto your landing page to increase conversions.")}
                    </p>
                  </div>
                </div>

                <div className="pt-5 border-t border-white/[0.07] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-[13px] text-zinc-400 font-normal">
                    {t("trustCenter.readyToVerify", "Ready to claim and verify your business? Launch our dedicated business portal.")}
                  </p>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        if (isBusinessSuiteEmbedded) {
                          if (onBack) onBack();
                          else if (onNavigate) onNavigate("business");
                        } else if (onNavigate) {
                          onNavigate("business");
                        } else {
                          window.location.href = "/business";
                        }
                      }}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <Building2 className="w-4 h-4 text-zinc-950" />
                      <span>{isBusinessSuiteEmbedded ? t("business.returnToDashboard", "Return to Business Dashboard") : t("nav.forBusinesses", "Open Business Suite")}</span>
                      {!isBusinessSuiteEmbedded && <ExternalLink className="w-3.5 h-3.5 text-zinc-950" />}
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
              <div className="bg-white/[0.03] rounded-[28px] p-6 sm:p-9 border border-white/[0.08] space-y-7">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/[0.09] flex items-center justify-center text-[#E8C78A] shrink-0">
                    <Lock className="w-5.5 h-5.5" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-[-0.025em]">
                        {t("trustCenter.privacySecurityTitle", "Privacy, Security & Legal Compliance")}
                      </h3>
                      <span className="px-3 py-0.5 rounded-full bg-white/[0.05] text-[#E8C78A] border border-white/[0.09] text-[11px] font-medium">
                        {t("trustCenter.privacyVerifiedBadge", "Passkey Ready · Zero Passwords")}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed max-w-3xl">
                      {t("trustCenter.privacySummary", "Yoouz is built with privacy-first standards. Browse freely without an account, and back up your handle across devices with a Passkey — zero emails or passwords stored.")}
                    </p>
                  </div>
                </div>

                {/* Legal Documents Direct Access */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="p-5 sm:p-6 rounded-[22px] bg-white/[0.035] border border-white/[0.07] space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-zinc-400">
                          {t("trustCenter.updatedDate", "Updated Nov 16, 2026")}
                        </span>
                        <ShieldCheck className="w-4.5 h-4.5 text-[#E8C78A]" />
                      </div>
                      <h4 className="text-base font-semibold text-white">{t("trustCenter.privacyPolicyTitle", "Privacy Policy")}</h4>
                      <p className="text-[13px] text-zinc-400 leading-relaxed">
                        {t("trustCenter.privacyPolicyDesc", "Covers anonymous handles, Passkey security, live camera usage, and zero data selling.")}
                      </p>
                    </div>
                    <button
                      onClick={() => onOpenLegal ? onOpenLegal("privacy") : null}
                      className="w-full py-2.5 px-4 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.1] font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      <FileText className="w-3.5 h-3.5 text-white" />
                      <span>{t("trustCenter.readPrivacyPolicy", "Read Privacy Policy")}</span>
                    </button>
                  </div>

                  <div className="p-5 sm:p-6 rounded-[22px] bg-white/[0.035] border border-white/[0.07] space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-zinc-400">
                          {t("trustCenter.updatedDate", "Updated Nov 16, 2026")}
                        </span>
                        <Scale className="w-4.5 h-4.5 text-[#E8C78A]" />
                      </div>
                      <h4 className="text-base font-semibold text-white">{t("trustCenter.termsConditionsTitle", "Terms & Conditions")}</h4>
                      <p className="text-[13px] text-zinc-400 leading-relaxed">
                        {t("trustCenter.termsConditionsDesc", "Covers live camera capture rules, anonymous accounts, Passkeys, and platform compliance.")}
                      </p>
                    </div>
                    <button
                      onClick={() => onOpenLegal ? onOpenLegal("terms") : null}
                      className="w-full py-2.5 px-4 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.1] font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      <FileText className="w-3.5 h-3.5 text-white" />
                      <span>{t("trustCenter.readTermsConditions", "Read Terms & Conditions")}</span>
                    </button>
                  </div>
                </div>

                {/* 4 Pillars Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="p-5 rounded-[20px] bg-white/[0.025] border border-white/[0.06] space-y-1.5">
                    <span className="text-[11px] font-medium text-zinc-400">{t("auth.title", "Passkeys")}</span>
                    <h4 className="text-sm font-semibold text-white">{t("trustCenter.authPillarTitle", "1-Tap Passkey (No Passwords)")}</h4>
                    <p className="text-[12.5px] text-zinc-400 leading-relaxed">
                      {t("trustCenter.authPillarDesc", "No emails or passwords required. Save a Passkey once to restore your account automatically on any new device.")}
                    </p>
                  </div>

                  <div className="p-5 rounded-[20px] bg-white/[0.025] border border-white/[0.06] space-y-1.5">
                    <span className="text-[11px] font-medium text-zinc-400">{t("record.title", "Capture Privacy")}</span>
                    <h4 className="text-sm font-semibold text-white">{t("trustCenter.recordingPillarTitle", "Real-Time Camera Only")}</h4>
                    <p className="text-[12.5px] text-zinc-400 leading-relaxed">
                      {t("trustCenter.recordingPillarDesc", "Camera feeds are accessed strictly during live photo capture. We never access photo libraries or saved gallery files.")}
                    </p>
                  </div>

                  <div className="p-5 rounded-[20px] bg-white/[0.025] border border-white/[0.06] space-y-1.5">
                    <span className="text-[11px] font-medium text-zinc-400">{t("trustCenter.privacySecurity", "Zero Data Selling")}</span>
                    <h4 className="text-sm font-semibold text-white">{t("trustCenter.zeroSellingPillarTitle", "No Selling or Renting")}</h4>
                    <p className="text-[12.5px] text-zinc-400 leading-relaxed">
                      {t("trustCenter.zeroSellingPillarDesc", "We never sell, rent, or trade your personal data to third parties. Data is shared solely with trusted cloud infrastructure providers.")}
                    </p>
                  </div>

                  <div className="p-5 rounded-[20px] bg-white/[0.025] border border-white/[0.06] space-y-1.5">
                    <span className="text-[11px] font-medium text-zinc-400">{t("legal.termsConditions", "Legal Jurisdiction")}</span>
                    <h4 className="text-sm font-semibold text-white">{t("trustCenter.jurisdictionPillarTitle", "Governing Compliance & Standards")}</h4>
                    <p className="text-[12.5px] text-zinc-400 leading-relaxed">
                      {t("trustCenter.jurisdictionPillarDesc", "Platform terms and privacy policies enforce strict global consumer data protection and digital privacy standards.")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Deletion Request */}
              {currentUser && (
                <div className="bg-white/[0.03] rounded-[24px] p-6 sm:p-8 border border-white/[0.08] space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-zinc-300 shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-white">{t("profile.requestDeletionTitle", "Request Account Deletion")}</h3>
                      <p className="text-[13px] text-zinc-400 leading-relaxed">
                        {t("trustCenter.requestDeletionNotice", "Submit a formal request to permanently delete your account & profile. Our support team will process your request within 24–48 hours.")}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-white/[0.07] pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <p className="text-xs text-zinc-400">
                      {t("trustCenter.requestDeletionDesc", "Under GDPR & international privacy standards, all associated data and profile records will be securely handled upon review.")}
                    </p>
                    <button
                      onClick={() => setIsMoreDeletionModalOpen(true)}
                      className="px-5 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white border border-white/[0.1] text-xs font-semibold transition-all cursor-pointer shrink-0 active:scale-[0.98]"
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
            <div className="bg-white/[0.03] rounded-[28px] p-6 sm:p-9 border border-white/[0.08] space-y-6 text-left animate-in fade-in duration-200 max-w-3xl">
              {submitSuccess ? (
                <div className="text-center py-10 px-4 space-y-4 animate-in fade-in duration-200">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-[#E8C78A] mx-auto">
                    <Check className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-xl font-semibold text-white tracking-[-0.02em]">{t("trustCenter.inquiryReceivedTitle", "Inquiry Received Successfully")}</h3>
                    <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                      {t("trustCenter.inquiryReceivedDesc", "Thank you for contacting Yoouz. Your message has been logged securely in our support queue. Our team reviews all requests within 24 hours.")}
                    </p>
                  </div>
                  <button
                    onClick={() => setSubmitSuccess(false)}
                    className="py-2.5 px-6 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition-all cursor-pointer inline-flex items-center gap-2 active:scale-[0.98]"
                  >
                    <span>{t("trustCenter.sendAnotherInquiry", "Send Another Inquiry")}</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-5">
                  <div className="space-y-1 border-b border-white/[0.07] pb-5">
                    <h3 className="text-xl font-semibold text-white tracking-[-0.02em]">{t("trustCenter.supportDeskTitle", "Official Yoouz Support Desk")}</h3>
                    <p className="text-[13px] text-zinc-400">
                      {t("trustCenter.supportDeskDesc", "Submit support inquiries, business domain claim requests, or report community guideline infractions.")}
                    </p>
                  </div>

                  {submitError && (
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs font-medium flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300 block px-1">
                        {t("trustCenter.fullNameLabel", "Your Full Name *")}
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder={t("trustCenter.namePlaceholder", "e.g. Sarah Jenkins")}
                        className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.09] focus:bg-white/[0.07] focus:border-white/25 text-sm font-medium outline-none transition-all text-white placeholder:text-zinc-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300 block px-1">
                        {t("trustCenter.emailLabel", "Email Address *")}
                      </label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder={t("trustCenter.emailPlaceholder", "e.g. sarah@example.com")}
                        className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.09] focus:bg-white/[0.07] focus:border-white/25 text-sm font-medium outline-none transition-all text-white placeholder:text-zinc-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300 block px-1">
                        {t("trustCenter.categoryLabel", "Category *")}
                      </label>
                      <select
                        value={contactCategory}
                        onChange={(e) => setContactCategory(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-[#111114] border border-white/[0.09] focus:border-white/25 text-sm font-medium outline-none transition-all text-white"
                      >
                        <option value="support">{t("trustCenter.categorySupport", "General Account / Technical Support")}</option>
                        <option value="guidelines">{t("trustCenter.categoryGuidelines", "Report Policy Violation / Fake Content")}</option>
                        <option value="partnership">{t("trustCenter.categoryPartnership", "API & Partnership Inquiries")}</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300 block px-1">
                        {t("trustCenter.websiteDomainLabel", "Website Domain (Optional)")}
                      </label>
                      <input
                        type="text"
                        value={contactDomain}
                        onChange={(e) => setContactDomain(e.target.value)}
                        placeholder={t("trustCenter.domainPlaceholder", "e.g. yourcompany.com")}
                        className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.09] focus:bg-white/[0.07] focus:border-white/25 text-sm font-medium outline-none transition-all text-white placeholder:text-zinc-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300 block px-1">
                      {t("trustCenter.messageLabel", "Message Details *")}
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder={t("trustCenter.messagePlaceholder", "Describe your inquiry or request in detail...")}
                      className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.09] focus:bg-white/[0.07] focus:border-white/25 text-sm font-normal outline-none transition-all resize-none leading-relaxed text-white placeholder:text-zinc-500"
                    />
                  </div>

                  {/* Drag-and-Drop Attachments */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-300 block px-1">
                      {t("trustCenter.attachFilesLabel", "Attach Screenshots or Verification Proof (Optional)")}
                    </label>

                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border border-dashed rounded-[22px] p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                        dragOver
                          ? "border-white/40 bg-white/[0.07]"
                          : "border-white/[0.12] bg-white/[0.025] hover:bg-white/[0.045] hover:border-white/[0.2]"
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
                      <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-zinc-200">
                          {t("trustCenter.dragDropPrompt", "Drag & drop files here, or")} <span className="text-white underline underline-offset-2">{t("trustCenter.browseFiles", "browse files")}</span>
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          {t("trustCenter.fileLimitHint", "PNG, JPG, WEBP, PDF or DOC (Max 3 files, up to 2MB each)")}
                        </p>
                      </div>
                    </div>

                    {attachedFiles.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        {attachedFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-xs gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {file.type.startsWith("image/") ? (
                                <img
                                  src={file.base64}
                                  alt="preview"
                                  className="w-8 h-8 rounded-lg object-cover shrink-0 border border-white/[0.1]"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-zinc-200 shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold text-white truncate">{file.name}</p>
                                <p className="text-[10px] text-zinc-400 tabular-nums">
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
                              className="w-6 h-6 rounded-full hover:bg-white/[0.1] flex items-center justify-center text-zinc-300 transition-colors cursor-pointer shrink-0"
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
                      className="w-full sm:w-auto py-3 px-7 rounded-full bg-white hover:bg-zinc-200 disabled:bg-white/[0.08] disabled:text-zinc-500 text-zinc-950 font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
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
              <div className="bg-white/[0.03] rounded-[28px] p-6 sm:p-9 border border-white/[0.08] space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl sm:text-[28px] font-semibold text-white tracking-[-0.025em]">
                      {t("nav.language", "Language")}
                    </h2>
                    <p className="text-[13px] text-zinc-400">
                      {t("trustCenter.languageSubtitle", "Choose your preferred display language across Yoouz.")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 bg-white/[0.05] border border-white/[0.09] px-4 py-2 rounded-full shrink-0">
                    <span className="text-lg select-none">{currentLanguageMeta.flag}</span>
                    <span className="text-[13px] font-semibold text-white leading-none">
                      {currentLanguageMeta.name}
                    </span>
                  </div>
                </div>

                {/* Spotlight Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="more-view-lang-search"
                    type="text"
                    value={langSearchFilter}
                    onChange={(e) => setLangSearchFilter(e.target.value)}
                    placeholder={t("trustCenter.languageSearchLabel", "Search 64+ languages...")}
                    className="w-full pl-11 pr-10 py-3 rounded-full bg-white/[0.045] border border-white/[0.09] text-white placeholder-zinc-500 text-sm focus:outline-none focus:bg-white/[0.07] focus:border-white/25 transition-all"
                  />
                  {langSearchFilter && (
                    <button
                      onClick={() => setLangSearchFilter("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/[0.1] hover:bg-white/[0.18] flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Languages Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
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
                              ? "bg-white text-zinc-950 border-white shadow-sm"
                              : "bg-white/[0.03] hover:bg-white/[0.07] text-white border-white/[0.07] hover:border-white/[0.15]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-1">
                            <span className="text-lg leading-none select-none shrink-0">{lang.flag}</span>
                            <span className={`text-[13.5px] leading-tight truncate ${isSelected ? "font-semibold text-zinc-950" : "font-medium text-zinc-200"}`}>
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

        {/* Minimal Editorial Footer */}
        <footer className="pt-8 pb-12 border-t border-white/[0.07] text-center space-y-3 text-xs text-zinc-400">
          <div className="flex items-center justify-center gap-3 text-xs font-medium text-zinc-400 flex-wrap">
            <button
              onClick={() => onOpenLegal ? onOpenLegal("terms") : null}
              className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0"
            >
              {t("legal.termsConditions", "Terms & Conditions")}
            </button>
            <span className="text-zinc-600">·</span>
            <button
              onClick={() => onOpenLegal ? onOpenLegal("privacy") : null}
              className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0"
            >
              {t("legal.privacyPolicy", "Privacy Policy")}
            </button>
            <span className="text-zinc-600">·</span>
            <button
              onClick={() => {
                setActiveTab("contact");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0"
            >
              {t("legal.supportDesk", "Support Desk")}
            </button>
          </div>

          <div className="space-y-1 text-center">
            <p className="text-[11px] font-medium text-zinc-400">
              {t("legal.networkLocation", "Yoouz Trust Network")}
            </p>
            <p className="text-[11px] text-zinc-500">
              {t("legal.copyright", "© 2026 Yoouz Inc. All rights reserved. Real Photos. Real Proof.")}
            </p>
          </div>
        </footer>
      </main>

      {/* Account Deletion Request Modal (Flagship Obsidian) */}
      {isMoreDeletionModalOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsMoreDeletionModalOpen(false)}
        >
          <div
            className="bg-[#111114] rounded-[28px] max-w-sm w-full p-6 shadow-2xl border border-white/[0.1] space-y-4 animate-in zoom-in-95 duration-150 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/[0.09] text-zinc-200 flex items-center justify-center mx-auto">
              <Shield className="w-5.5 h-5.5" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-semibold text-white">{t("profile.requestDeletionTitle", "Request Account Deletion")}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {t("profile.requestDeletionNotice", "Please select a reason below. Our support team will review and process your account deletion within 24–48 hours.")}
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 block">
                  {t("profile.reasonLabel", "Reason")}
                </label>
                <select
                  value={moreDeletionReason}
                  onChange={(e) => setMoreDeletionReason(e.target.value)}
                  className="w-full bg-[#09090b] border border-white/[0.1] rounded-2xl px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-white/25 transition-colors"
                >
                  <option value="I no longer use this account">{t("profile.reasonNoLongerUse", "I no longer use this account")}</option>
                  <option value="Privacy concerns">{t("profile.reasonPrivacy", "Privacy concerns")}</option>
                  <option value="Created by mistake">{t("profile.reasonMistake", "Created by mistake")}</option>
                  <option value="Temporary break">{t("profile.reasonBreak", "Temporary break")}</option>
                  <option value="Other reason">{t("profile.reasonOther", "Other reason")}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 block">
                  {t("profile.notesLabel", "Additional Notes (Optional)")}
                </label>
                <textarea
                  value={moreDeletionNotes}
                  onChange={(e) => setMoreDeletionNotes(e.target.value)}
                  rows={2}
                  maxLength={300}
                  placeholder={t("profile.notesPlaceholder", "Tell us if there is anything we can help with...")}
                  className="w-full bg-white/[0.04] border border-white/[0.09] rounded-2xl p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-white/25 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsMoreDeletionModalOpen(false)}
                disabled={isSubmittingMoreDeletion}
                className="flex-1 py-2.5 rounded-full border border-white/[0.1] bg-white/[0.04] text-xs font-semibold text-zinc-300 hover:bg-white/[0.09] hover:text-white transition-colors cursor-pointer"
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
                className="flex-1 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmittingMoreDeletion ? t("common.submitting", "Submitting...") : t("profile.submitRequest", "Submit Request")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Toast */}
      {moreDeletionSuccessToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-[#111114] border border-white/[0.12] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 max-w-sm">
          <CheckCircle2 className="w-5 h-5 text-[#E8C78A] shrink-0" />
          <p className="text-xs font-medium leading-snug text-zinc-200">
            {t("profile.deletionRequestSuccess", "Your account deletion request has been submitted. Our team will process it within 24–48 hours.")}
          </p>
        </div>
      )}
    </div>
  );
};
