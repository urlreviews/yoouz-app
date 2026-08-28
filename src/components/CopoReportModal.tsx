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
    icon: <FileWarning className="w-5 h-5 text-amber-500" />,
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
    icon: <ShieldAlert className="w-5 h-5 text-red-500" />,
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
    icon: <UserX className="w-5 h-5 text-rose-500" />,
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
    icon: <Flame className="w-5 h-5 text-purple-500" />,
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
    icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
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
    icon: <Lock className="w-5 h-5 text-blue-500" />,
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
    icon: <Flag className="w-5 h-5 text-indigo-500" />,
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
    icon: <Send className="w-5 h-5 text-emerald-500" />,
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
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [additionalDetails, setAdditionalDetails] = useState<string>("");
  const [reporterEmail, setReporterEmail] = useState<string>(currentUser?.email || "");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

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

  const handleClose = () => {
    setSelectedCategory(null);
    setSelectedSubcategory("");
    setAdditionalDetails("");
    setIsSubmitted(false);
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;

    setIsSubmitting(true);

    const reportPayload = {
      targetType: target.type,
      videoId: target.video?.id || null,
      videoCaption: target.video?.caption || null,
      placeName: target.placeName || target.video?.placeName || null,
      placeId: target.placeId || target.video?.placeId || null,
      reportedAuthor: target.author?.name || target.video?.author.name || null,
      reportedHandle: target.author?.name || target.video?.author.name || null,
      category: selectedCategory.title,
      subcategory: selectedSubcategory,
      details: additionalDetails.trim(),
      reporterEmail: reporterEmail || currentUser?.email || "Anonymous",
      recipient: "report@yoouz.com",
      timestamp: new Date().toISOString()
    };

    console.info("Dispatching Report to report@yoouz.com:", reportPayload);

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
    }, 600);
  };

  const getMailtoUrl = () => {
    const subject = encodeURIComponent(
      `[Yoouz Report] ${selectedCategory?.title || "Community Violation"} - ${
        target.placeName || target.video?.placeName || target.author?.name || "Content"
      }`
    );
    const body = encodeURIComponent(
      `Hello Yoouz Moderation Team,\n\nI would like to report the following content:\n\n` +
        `• Target Type: ${target.type}\n` +
        `• Place / Business: ${target.placeName || target.video?.placeName || "N/A"}\n` +
        `• Creator Handle: ${target.author?.name || target.video?.author.name || "N/A"}\n` +
        `• Video ID: ${target.video?.id || "N/A"}\n` +
        `• Category: ${selectedCategory?.title || "N/A"}\n` +
        `• Specific Scenario: ${selectedSubcategory || "N/A"}\n` +
        `• Additional Context: ${additionalDetails || "None provided"}\n` +
        `• Reported by: ${reporterEmail || "Anonymous"}\n` +
        `• Timestamp: ${new Date().toLocaleString()}\n\n` +
        `Thank you for keeping Yoouz authentic and safe.`
    );
    return `mailto:report@yoouz.com?subject=${subject}&body=${body}`;
  };

  return (
    <div
      id="yoouz-report-modal-overlay"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overscroll-contain select-none"
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
        className="w-full max-w-lg md:max-w-3xl lg:max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in zoom-in-95 duration-200 overscroll-contain select-text"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/90 shrink-0">
          <div className="flex items-center gap-3">
            {selectedCategory && !isSubmitted && (
              <button
                onClick={handleBack}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/60 transition-colors cursor-pointer"
                title="Back to categories"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0">
              <Flag className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 leading-tight">
                {isSubmitted ? "Report Submitted" : "Report Content"}
              </h3>
              <p className="text-[11px] text-zinc-500">
                Community Standards • Human moderation & safety review
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors cursor-pointer"
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
            <div className="mb-4 p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between gap-3 text-xs text-zinc-600">
              <div className="flex items-center gap-3 min-w-0">
                {target.video?.thumbnailUrl ? (
                  <img
                    src={target.video.thumbnailUrl}
                    alt="Video preview"
                    className="w-10 h-10 rounded-lg object-cover shrink-0 border border-zinc-200"
                  />
                ) : target.author?.avatar ? (
                  <img
                    src={target.author.avatar}
                    alt="Author avatar"
                    className="w-10 h-10 rounded-full object-cover shrink-0 border border-zinc-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-zinc-200 flex items-center justify-center shrink-0">
                    <Flag className="w-4 h-4 text-zinc-500" />
                  </div>
                )}
                <div className="truncate">
                  <p className="font-bold text-zinc-900 truncate">
                    {target.placeName || target.video?.placeName || target.author?.name || "Video Review"}
                  </p>
                  <p className="text-zinc-500 text-[11px] truncate">
                    {target.author?.name || target.video?.author.name || "By Verified Reviewer"}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-200/80 text-zinc-700 text-[10px] font-bold uppercase tracking-wider shrink-0">
                {target.type}
              </span>
            </div>
          )}

          {/* State 1: Category Selection - 2-Column Grid on Desktop */}
          {!selectedCategory && !isSubmitted && (
            <div className="flex flex-col gap-2">
              <div>
                <h4 className="text-sm font-bold text-zinc-900">What's the issue?</h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Select a category that best describes why this content violates Yoouz community standards.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-2">
                {REPORT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat)}
                    className="w-full flex items-start gap-3 p-3 sm:p-3.5 rounded-xl border border-zinc-200/90 hover:border-blue-400 hover:bg-blue-50/30 text-left transition-all group cursor-pointer bg-white hover:shadow-xs"
                  >
                    <div className="p-2 rounded-lg bg-zinc-100 group-hover:bg-white group-hover:shadow-xs transition-colors shrink-0 mt-0.5">
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs sm:text-sm font-bold text-zinc-900 group-hover:text-[#1a73e8] transition-colors truncate">
                          {cat.title}
                        </p>
                        <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-[#1a73e8] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                      </div>
                      <p className="text-[11px] text-zinc-500 line-clamp-2 mt-0.5 leading-snug">
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
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                    <div className="p-1.5 rounded-lg bg-white shadow-3xs">{selectedCategory.icon}</div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-blue-950 truncate">{selectedCategory.title}</h4>
                      <p className="text-[11px] text-blue-800/80 line-clamp-1">{selectedCategory.description}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-2">
                      Please select a specific reason:
                    </label>
                    <div className="flex flex-col gap-2">
                      {selectedCategory.subcategories.map((sub, idx) => (
                        <label
                          key={idx}
                          className={`flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl border cursor-pointer transition-all ${
                            selectedSubcategory === sub
                              ? "border-[#1a73e8] bg-blue-50/40 text-zinc-900 font-medium shadow-3xs"
                              : "border-zinc-200 hover:border-zinc-300 bg-white text-zinc-700"
                          }`}
                        >
                          <input
                            type="radio"
                            name="reportSubcategory"
                            value={sub}
                            checked={selectedSubcategory === sub}
                            onChange={() => setSelectedSubcategory(sub)}
                            className="w-4 h-4 text-[#1a73e8] focus:ring-blue-500 shrink-0"
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
                      <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                        Additional Details & Timestamps (Optional)
                      </label>
                      <textarea
                        rows={4}
                        value={additionalDetails}
                        onChange={(e) => setAdditionalDetails(e.target.value)}
                        placeholder="E.g., At 0:14 the video shows false pricing, or this business closed in 2024..."
                        className="w-full px-3.5 py-2.5 text-xs text-zinc-900 bg-white rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-zinc-400"
                      />
                    </div>

                    {/* Reporter Contact */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                        Your Email (for updates regarding this report)
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={reporterEmail}
                          onChange={(e) => setReporterEmail(e.target.value)}
                          placeholder="your.email@example.com"
                          className="w-full pl-9 pr-3 py-2.5 text-xs text-zinc-900 bg-white rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-zinc-400"
                        />
                        <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-4 py-2.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !selectedSubcategory}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#1a73e8] hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span>Submitting...</span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Report</span>
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
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3 animate-in zoom-in-50 duration-300">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-zinc-900">Thank You for Reporting</h4>
              <p className="text-xs text-zinc-600 mt-1 max-w-sm">
                Your report has been received and routed directly to our Trust & Safety Moderation team.
              </p>

              <div className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 my-4 text-left text-xs text-zinc-700 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Reason:</span>
                  <span className="font-semibold text-zinc-900">{selectedCategory?.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Category:</span>
                  <span className="text-zinc-800 text-[11px] truncate max-w-[200px]">
                    {selectedSubcategory}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Investigation Turnaround:</span>
                  <span className="font-bold text-emerald-600">Within 24 Hours</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full">
                {onBlockOrHide && (
                  <button
                    onClick={() => {
                      onBlockOrHide(target);
                      handleClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-xs font-semibold text-zinc-700 transition-colors"
                  >
                    <EyeOff className="w-4 h-4 text-zinc-500" />
                    <span>Hide this video from my feed</span>
                  </button>
                )}

                <a
                  href={getMailtoUrl()}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-blue-600 hover:bg-blue-50 text-xs font-semibold transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send additional evidence or notes</span>
                </a>

                <button
                  onClick={handleClose}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold transition-all mt-1"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
