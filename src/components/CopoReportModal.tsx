import React, { useState, useEffect } from "react";
import {
  X,
  Flag,
  AlertTriangle,
  ShieldAlert,
  FileWarning,
  UserX,
  Lock,
  Flame,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Mail,
  Send,
  EyeOff
} from "lucide-react";
import { VideoReview, UserProfile, VideoAuthor } from "../types";
import { useSwipeDownToDismiss } from "../hooks/useSwipeDownToDismiss";
import { useLanguage } from "../i18n/LanguageContext";

export interface ReportTarget {
  type: "video" | "user" | "place";
  video?: VideoReview | null;
  author?: VideoAuthor | null;
  placeName?: string;
  placeId?: string;
}

interface CopoReportModalProps {
  isOpen: boolean;
  target: ReportTarget | null;
  currentUser?: UserProfile | null;
  onClose: () => void;
  onBlockOrHide?: (target: ReportTarget) => void;
}

interface ReportCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  subcategories: string[];
}

const REPORT_CATEGORIES: ReportCategory[] = [
  {
    id: "fake_review",
    title: "Fake or inauthentic review",
    description: "Never visited this location, paid promotion undisclosed, competitor attack",
    icon: <FileWarning className="w-5 h-5" />,
    subcategories: [
      "Reviewer did not visit or use this business",
      "Undisclosed paid sponsorship or incentivized review",
      "Competitor sabotage or coordinated review bombing",
      "AI-generated or bot review"
    ]
  },
  {
    id: "scam_fraud",
    title: "Scam, fraud or misleading information",
    description: "Phishing links, deceptive pricing, fake addresses or deceptive business claims",
    icon: <ShieldAlert className="w-5 h-5" />,
    subcategories: [
      "Fraudulent business or financial scam",
      "Phishing URL or impersonation of official brand",
      "Deceptive pricing or false promises",
      "Dangerous medical or safety misinformation"
    ]
  },
  {
    id: "harassment_hate",
    title: "Harassment, hate speech or bullying",
    description: "Targeting business staff, racist/sexist slurs, targeted personal attacks",
    icon: <UserX className="w-5 h-5" />,
    subcategories: [
      "Harassment targeting employees, owners or other customers",
      "Hate speech based on race, religion, gender or nationality",
      "Threats of violence, blackmail or extortion",
      "Cyberbullying or derogatory remarks"
    ]
  },
  {
    id: "nudity_adult",
    title: "Nudity, sexual or adult content",
    description: "Sexually explicit behavior, nudity, or adult solicitation",
    icon: <Flame className="w-5 h-5" />,
    subcategories: [
      "Sexually suggestive or explicit video",
      "Nudity or exposed adult content",
      "Promoting adult services or explicit external links",
      "Content involving minors inappropriately"
    ]
  },
  {
    id: "violence_dangerous",
    title: "Violence, dangerous acts or illegal activity",
    description: "Physical altercations, vandalism, weapon display, illegal conduct",
    icon: <AlertTriangle className="w-5 h-5" />,
    subcategories: [
      "Physical fight, brawl or assault at business venue",
      "Vandalism or property damage",
      "Dangerous driving or reckless behavior",
      "Displaying weapons or promoting illegal substances"
    ]
  },
  {
    id: "privacy_doxxing",
    title: "Privacy violation or doxxing",
    description: "Sharing private phone numbers, home addresses, or secret recordings",
    icon: <Lock className="w-5 h-5" />,
    subcategories: [
      "Exposing private personal phone number, address or email",
      "Filming people without consent in private areas (e.g. restrooms)",
      "Displaying credit card, banking, or ID documents",
      "Publishing confidential business trade secrets"
    ]
  },
  {
    id: "copyright_stolen",
    title: "Filming a screen or copyrighted audio",
    description: "Recording a computer/TV screen, broadcast playback, or unauthorized music",
    icon: <Flag className="w-5 h-5" />,
    subcategories: [
      "Filming a TV, computer monitor, or secondary device screen",
      "Playing unauthorized commercial copyrighted audio/music",
      "Impersonating another creator, staff member, or business",
      "Recording in unauthorized private or restricted areas"
    ]
  },
  {
    id: "spam_commercial",
    title: "Spam, crypto or unrelated advertising",
    description: "Unrelated product promotion, repetitive spam comments, external affiliate links",
    icon: <Send className="w-5 h-5" />,
    subcategories: [
      "Crypto, forex, or gambling promotion",
      "Spamming repetitive promotional messages",
      "Unrelated product promotion irrelevant to the venue"
    ]
  }
];

export const CopoReportModal: React.FC<CopoReportModalProps> = ({
  isOpen,
  target,
  currentUser,
  onClose,
  onBlockOrHide
}) => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [additionalDetails, setAdditionalDetails] = useState<string>("");
  const [reporterEmail, setReporterEmail] = useState<string>(currentUser?.email || "");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [reportReferenceId, setReportReferenceId] = useState<string>("");

  const handleClose = () => {
    setSelectedCategory(null);
    setSelectedSubcategory("");
    setAdditionalDetails("");
    setIsSubmitted(false);
    setIsSubmitting(false);
    setReportReferenceId("");
    onClose();
  };

  // Swiping hook MUST be called unconditionally before any early returns to avoid React error #310
  const { swipeProps, dragOffsetY } = useSwipeDownToDismiss({
    onDismiss: handleClose,
    threshold: 60
  });

  // Prevent background page & video feed scrolling when Report modal is active
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !target) return null;

  const handleSelectCategory = (cat: ReportCategory) => {
    setSelectedCategory(cat);
    setSelectedSubcategory(cat.subcategories[0] || "");
  };

  const handleBack = () => {
    if (selectedCategory) {
      setSelectedCategory(null);
      setSelectedSubcategory("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;

    setIsSubmitting(true);

    const holderName = target.author?.name || target.video?.author?.name || "Unknown Creator";
    const holderHandle = target.author?.handle || target.video?.author?.handle || target.video?.author?.name || "unknown";
    const holderId = target.author?.id || target.video?.author?.id || "N/A";
    const holderEmail = (target.author as any)?.email || (target.video?.author as any)?.email || null;

    const reportPayload = {
      targetType: target.type,
      videoId: target.video?.id || null,
      videoCaption: target.video?.caption || null,
      videoUrl: target.video?.id ? `${window.location.origin}/video/${target.video.id}` : null,
      videoHolder: {
        name: holderName,
        handle: holderHandle,
        id: holderId,
        email: holderEmail
      },
      placeName: target.placeName || target.video?.placeName || null,
      placeId: target.placeId || target.video?.placeId || null,
      reportedAuthor: holderName,
      category: selectedCategory.title,
      subcategory: selectedSubcategory,
      details: additionalDetails.trim(),
      reporterEmail: reporterEmail.trim() || currentUser?.email || "Anonymous",
      reporterName: currentUser?.name || "Yoouz Community Member",
      reporterId: currentUser?.id || currentUser?.email || "guest",
      recipient: "support@yoouz.com",
      timestamp: new Date().toISOString()
    };

    console.info("Dispatching automated report to support@yoouz.com:", reportPayload);

    try {
      const resp = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportPayload)
      });
      const data = await resp.json().catch(() => ({}));
      if (data?.reportId) {
        setReportReferenceId(data.reportId);
      }
    } catch (apiErr) {
      console.warn("Could not dispatch via /api/reports, falling back to local storage:", apiErr);
    }

    // Persist to local moderation storage log
    try {
      const existingReports = JSON.parse(localStorage.getItem("yoouz_submitted_reports") || "[]");
      existingReports.push(reportPayload);
      localStorage.setItem("yoouz_submitted_reports", JSON.stringify(existingReports));
    } catch (err) {
      console.warn("Could not write report to local cache", err);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 400);
  };

  const getMailtoUrl = () => {
    const subject = encodeURIComponent(
      `[Yoouz Report] ${selectedCategory?.title || "Community Violation"} - ${
        target.placeName || target.video?.placeName || target.author?.name || "Content"
      }`
    );
    const body = encodeURIComponent(
      `Hello Yoouz Support & Moderation Team (support@yoouz.com),\n\nI would like to report the following content:\n\n` +
        `• Target Type: ${target.type}\n` +
        `• Place / Business: ${target.placeName || target.video?.placeName || "N/A"}\n` +
        `• Creator / Holder: ${target.author?.name || target.video?.author?.name || "N/A"}\n` +
        `• Video ID: ${target.video?.id || "N/A"}\n` +
        `• Category: ${selectedCategory?.title || "N/A"}\n` +
        `• Scenario: ${selectedSubcategory || "N/A"}\n` +
        `• Additional Context: ${additionalDetails || "None provided"}\n` +
        `• Reported by: ${reporterEmail || "Anonymous"}\n` +
        `• Timestamp: ${new Date().toLocaleString()}\n\n` +
        `Thank you for keeping Yoouz authentic and safe.`
    );
    return `mailto:support@yoouz.com?subject=${subject}&body=${body}`;
  };

  return (
    <div
      id="yoouz-report-modal-overlay"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overscroll-contain select-none"
      onClick={handleClose}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div
        id="yoouz-report-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)", transform: dragOffsetY > 0 ? `translateY(${dragOffsetY}px)` : undefined,
          transition: dragOffsetY === 0 ? "transform 0.2s ease-out" : "none"
        }}
        className="w-full sm:max-w-lg md:max-w-3xl lg:max-w-4xl h-[100dvh] sm:h-auto bg-zinc-900 rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border border-zinc-800 overflow-hidden flex flex-col max-h-[100dvh] sm:max-h-[90vh] my-0 sm:my-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 overscroll-contain select-text text-white"
      >
        {/* Top Drag Indicator Pill for Mobile (Signature Top Black/Dark Line like Comments) */}
        <div 
          className="h-8 flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing sm:hidden touch-none"
          {...swipeProps}
        >
          <div className="w-12 h-1.5 rounded-full bg-zinc-700" />
        </div>

        {/* Header */}
        <div 
          className="flex items-center justify-between px-6 pt-2 sm:pt-4 pb-4 border-b border-zinc-800 bg-zinc-950 shrink-0 touch-pan-y"
          {...swipeProps}
        >
          <div className="flex items-center gap-3">
            {selectedCategory && !isSubmitted && (
              <button
                onClick={handleBack}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Back to categories"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200 shrink-0">
              <Flag className="w-4 h-4 text-zinc-200" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {isSubmitted ? t("reportModal.submittedTitle", "Report Submitted") : t("reportModal.title", "Report Content")}
              </h3>
              <p className="text-[11px] text-zinc-200">
                {t("reportModal.standardsSubtitle", "Community Standards • Human moderation & safety review")}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full hidden sm:flex items-center justify-center text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div 
          className="flex-1 overflow-y-auto p-4 sm:p-6 overscroll-contain scroll-smooth"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {/* Target Preview Context Banner */}
          {!isSubmitted && (
            <div className="mb-4 p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3 text-xs text-zinc-200">
              <div className="flex items-center gap-3 min-w-0">
                {target.video?.thumbnailUrl ? (
                  <img
                    src={target.video.thumbnailUrl}
                    alt="Video preview"
                    className="w-10 h-10 rounded-lg object-cover shrink-0 border border-zinc-800"
                  />
                ) : target.author?.avatar ? (
                  <img
                    src={target.author.avatar}
                    alt="Author avatar"
                    className="w-10 h-10 rounded-full object-cover shrink-0 border border-zinc-800"
                   onError={(e) => { const target = e.currentTarget as HTMLImageElement; if (!target.src.includes('/api/avatar')) { target.src = '/api/avatar?name=User&background=27272a&color=fff'; } }} />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                    <Flag className="w-4 h-4 text-zinc-200" />
                  </div>
                )}
                <div className="truncate">
                  <p className="font-bold text-white truncate">
                    {target.placeName || target.video?.placeName || target.author?.name || t("reportModal.videoReview", "Video Review")}
                  </p>
                  <p className="text-zinc-200 text-[11px] truncate">
                    {target.author?.name || target.video?.author.name || t("reportModal.byVerifiedReviewer", "By Verified Reviewer")}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-200 text-[10px] font-bold uppercase tracking-wider shrink-0">
                {target.type}
              </span>
            </div>
          )}

          {/* State 1: Category Selection - 2-Column Grid on Desktop */}
          {!selectedCategory && !isSubmitted && (
            <div className="flex flex-col gap-2">
              <div>
                <h4 className="text-sm font-bold text-white">{t("reportModal.whatsIssue", "What's the issue?")}</h4>
                <p className="text-xs text-zinc-200 mt-0.5">
                  {t("reportModal.selectCategoryDesc", "Select a category that best describes why this content violates Yoouz community standards.")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-2">
                {REPORT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat)}
                    className="w-full flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/50 text-left transition-all group cursor-pointer bg-zinc-950/70"
                  >
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800/90 text-zinc-200 group-hover:text-amber-400 group-hover:border-zinc-700 group-hover:bg-zinc-800/90 transition-all flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs sm:text-sm font-bold text-white group-hover:text-white transition-colors truncate">
                          {cat.title}
                        </p>
                        <ChevronRight className="w-4 h-4 text-zinc-200 group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                      </div>
                      <p className="text-[11px] text-zinc-200 group-hover:text-zinc-200 line-clamp-2 mt-0.5 leading-snug">
                        {cat.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* State 2: Subcategory & Details Form - 2 Columns on Desktop */}
          {selectedCategory && !isSubmitted && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left Column: Category Summary & Specific Reasons */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 text-amber-400 flex items-center justify-center shrink-0">{selectedCategory.icon}</div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">{selectedCategory.title}</h4>
                      <p className="text-[11px] text-zinc-200 line-clamp-1">{selectedCategory.description}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-200 mb-2">
                      {t("reportModal.selectSpecificReason", "Please select a specific reason:")}
                    </label>
                    <div className="flex flex-col gap-2">
                      {selectedCategory.subcategories.map((sub, idx) => (
                        <label
                          key={idx}
                          className={`flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl border cursor-pointer transition-all ${
                            selectedSubcategory === sub
                              ? "border-zinc-600 bg-zinc-800/80 text-white font-medium shadow-sm"
                              : "border-zinc-800/80 hover:border-zinc-700 bg-zinc-950/60 text-zinc-200"
                          }`}
                        >
                          <input
                            type="radio"
                            name="reportSubcategory"
                            value={sub}
                            checked={selectedSubcategory === sub}
                            onChange={() => setSelectedSubcategory(sub)}
                            className="w-4 h-4 text-amber-400 accent-amber-500 focus:ring-amber-500/20 shrink-0 bg-zinc-900 border-zinc-700 cursor-pointer"
                          />
                          <span className="text-xs leading-snug">{sub}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Additional Details & Reporter Email */}
                <div className="flex flex-col justify-between gap-4">
                  <div className="flex flex-col gap-3">
                    {/* Additional Context TextArea */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-200 mb-1.5">
                        {t("reportModal.additionalDetailsLabel", "Additional Details & Timestamps (Optional)")}
                      </label>
                      <textarea
                        rows={4}
                        value={additionalDetails}
                        onChange={(e) => setAdditionalDetails(e.target.value)}
                        placeholder={t("reportModal.additionalPlaceholder", "E.g., At 0:14 the video shows false pricing, or this business closed in 2024...")}
                        className="w-full px-3.5 py-2.5 text-xs text-white bg-zinc-950/80 rounded-xl border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-zinc-700 transition-all placeholder:text-zinc-400"
                      />
                    </div>

                    {/* Reporter Contact */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-200 mb-1.5">
                        {t("reportModal.yourEmailLabel", "Your Email (for updates regarding this report)")}
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={reporterEmail}
                          onChange={(e) => setReporterEmail(e.target.value)}
                          placeholder="your.email@example.com"
                          className="w-full pl-9 pr-3 py-2.5 text-xs text-white bg-zinc-950/80 rounded-xl border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-zinc-700 transition-all placeholder:text-zinc-400"
                        />
                        <Mail className="w-4 h-4 text-zinc-200 absolute left-3 top-3" />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:text-white rounded-xl hover:bg-zinc-800/80 transition-colors cursor-pointer"
                    >
                      {t("common.back", "Back")}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !selectedSubcategory}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-zinc-200 disabled:opacity-40 disabled:hover:bg-white text-zinc-950 text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span>{t("common.loading", "Submitting...")}</span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>{t("reportModal.submitReport", "Submit Report")}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* State 3: Submitted Confirmation Receipt */}
          {isSubmitted && (
            <div className="flex flex-col items-center text-center py-4 px-2">
              <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 mb-3 animate-in zoom-in-50 duration-300 shadow-md">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold text-white">{t("reportModal.thankYouTitle", "Thank You for Reporting")}</h4>
              <p className="text-xs text-zinc-200 mt-1 max-w-sm">
                {t("reportModal.reportDelivered", "Your report has been automatically delivered to")} <strong className="text-zinc-200">support@yoouz.com</strong> {t("reportModal.forReview", "for immediate Trust & Safety moderation review.")}
              </p>

              <div className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 my-4 text-left text-xs text-zinc-200 flex flex-col gap-2">
                {reportReferenceId && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-200">{t("reportModal.referenceId", "Report Reference ID:")}</span>
                    <span className="font-mono text-[11px] text-sky-400 font-semibold">{reportReferenceId}</span>
                  </div>
                )}
                {target.video?.id && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-200">{t("reportModal.videoId", "Video ID:")}</span>
                    <span className="font-mono text-[11px] text-zinc-200">{target.video.id}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-zinc-200">{t("reportModal.reasonLabel", "Reason:")}</span>
                  <span className="font-semibold text-white">{selectedCategory?.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-200">{t("reportModal.categoryLabel", "Category:")}</span>
                  <span className="text-zinc-200 text-[11px] truncate max-w-[200px]">
                    {selectedSubcategory}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-200">{t("reportModal.dispatchedTo", "Dispatched To:")}</span>
                  <span className="font-semibold text-emerald-400">support@yoouz.com</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-200">{t("reportModal.investigationTurnaround", "Investigation Turnaround:")}</span>
                  <span className="font-bold text-white">{t("reportModal.within24Hours", "Within 24 Hours")}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full">
                {onBlockOrHide && (
                  <button
                    onClick={() => {
                      onBlockOrHide(target);
                      handleClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
                  >
                    <EyeOff className="w-4 h-4 text-zinc-200" />
                    <span>{t("reportModal.hideVideoFeed", "Hide this video from my feed")}</span>
                  </button>
                )}

                <a
                  href={getMailtoUrl()}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-zinc-200 hover:text-white hover:bg-zinc-800 text-xs font-semibold transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{t("reportModal.sendAdditionalEvidence", "Send additional evidence or notes")}</span>
                </a>

                <button
                  onClick={handleClose}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition-all mt-1 cursor-pointer shadow-md"
                >
                  {t("common.done", "Done")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
