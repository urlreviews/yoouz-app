import React, { useState, useEffect } from "react";
import { X, ShieldCheck, FileText, Scale, ExternalLink, Mail, CheckCircle2, Lock, Camera, Globe } from "lucide-react";

export type LegalDocType = "privacy" | "terms";

interface CopoLegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalDocType;
}

export const CopoLegalModal: React.FC<CopoLegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = "terms",
}) => {
  const [activeTab, setActiveTab] = useState<LegalDocType>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="copo-legal-modal-backdrop"
      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="copo-legal-modal-container"
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-200/90 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1a73e8] shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-zinc-950 font-['Google_Sans',sans-serif]">
                Yoouz Legal & Compliance
              </h2>
              <p className="text-[11px] text-zinc-400 font-medium">
                Governing Jurisdiction: San Francisco, California, USA
              </p>
            </div>
          </div>

          <button
            id="copo-legal-modal-close-btn"
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
            aria-label="Close legal modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 pb-2 bg-zinc-50/70 border-b border-zinc-200 flex items-center gap-2 shrink-0">
          <button
            id="copo-legal-terms-tab-btn"
            onClick={() => setActiveTab("terms")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "terms"
                ? "bg-white text-zinc-950 shadow-xs border border-zinc-200"
                : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
            }`}
          >
            <FileText className="w-4 h-4 text-[#1a73e8]" />
            <span>Terms & Conditions</span>
          </button>

          <button
            id="copo-legal-privacy-tab-btn"
            onClick={() => setActiveTab("privacy")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "privacy"
                ? "bg-white text-zinc-950 shadow-xs border border-zinc-200"
                : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Privacy Policy</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-zinc-700 text-xs sm:text-sm leading-relaxed text-left select-text">
          {activeTab === "terms" ? (
            /* ========================================================================= */
            /* TERMS & CONDITIONS DOCUMENT */
            /* ========================================================================= */
            <article className="space-y-6">
              <header className="border-b border-zinc-200 pb-4 space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1a73e8] text-[10px] font-black uppercase tracking-wider mb-1">
                  Official Legal Agreement
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
                  Terms & Conditions for Yoouz
                </h1>
                <p className="text-xs text-zinc-400 font-semibold">
                  Last Updated: August 24, 2026
                </p>
              </header>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-zinc-800 text-xs sm:text-sm leading-relaxed">
                Welcome to <strong>Yoouz</strong>. By accessing or using our platform, you agree to be bound by these Terms & Conditions. If you do not agree to these terms, please do not use Yoouz.
              </div>

              {/* Section 1 */}
              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-black text-zinc-950 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center text-xs font-black shrink-0">1</span>
                  Description of Service
                </h3>
                <p className="text-zinc-600">
                  Yoouz is a video review and discovery platform. Users can record authentic reviews directly via their device camera, and businesses can display or stream these reviews within their profiles or via platform-provided tools.
                </p>
              </section>

              {/* Section 2 */}
              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-black text-zinc-950 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center text-xs font-black shrink-0">2</span>
                  Account Registration
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-zinc-600">
                  <li>You must authenticate using an authorized sign-in provider (such as Google Sign-In) to create an account.</li>
                  <li>You are responsible for maintaining the security of your account and restricting unauthorized access to your device.</li>
                </ul>
              </section>

              {/* Section 3 */}
              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-black text-zinc-950 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center text-xs font-black shrink-0">3</span>
                  Live Video Recording & Content Rules
                </h3>
                <div className="space-y-2.5 pl-1">
                  <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                    <p className="font-bold text-zinc-900 mb-0.5">No File Uploads</p>
                    <p className="text-zinc-600">
                      All reviews must be recorded live through the Yoouz web application camera interface. Uploading pre-recorded video files from device storage or external libraries is strictly prohibited.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                    <p className="font-bold text-zinc-900 mb-0.5">User Content Standards</p>
                    <p className="text-zinc-600">
                      You retain personal accountability for the reviews you record. You agree not to record or publish content that is unlawful, defamatory, abusive, harassing, misleading, or infringing on third-party intellectual property rights.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                    <p className="font-bold text-zinc-900 mb-0.5">Content License</p>
                    <p className="text-zinc-600">
                      By recording a review on Yoouz, you grant Yoouz a worldwide, non-exclusive, royalty-free license to host, display, and stream your video content on the platform.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 4 */}
              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-black text-zinc-950 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center text-xs font-black shrink-0">4</span>
                  Business Accounts & Intellectual Property Protection
                </h3>
                <div className="space-y-2 text-zinc-600">
                  <p>
                    <strong className="text-zinc-900">No Ownership Transfer:</strong> Businesses utilizing Yoouz do not own the video files recorded by users.
                  </p>
                  <p>
                    <strong className="text-zinc-900">Streaming-Only Access:</strong> Businesses are granted a limited, revocable, non-transferable right to display consumer reviews exclusively through Yoouz&apos;s authorized platform interface or official embedding tools.
                  </p>
                  <p>
                    <strong className="text-zinc-900">Anti-Piracy & Anti-Scraping:</strong> Businesses and users are strictly prohibited from screen-recording, ripping, downloading, harvesting, or stealing video files from Yoouz to re-host them on external websites or third-party servers.
                  </p>
                  <p>
                    <strong className="text-zinc-900">Future Features and Monetization:</strong> Advanced business tools, analytics, custom widgets, or higher-tier embedding features may be subject to future paid subscription tiers. Yoouz reserves the right to modify, restrict, or gate business features at any time.
                  </p>
                </div>
              </section>

              {/* Section 5 */}
              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-black text-zinc-950 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center text-xs font-black shrink-0">5</span>
                  Limitation of Liability
                </h3>
                <p className="text-zinc-600">
                  Yoouz is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We do not guarantee uninterrupted platform availability and are not liable for user-generated content or damages arising from the use of our services.
                </p>
              </section>

              {/* Section 6 */}
              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-black text-zinc-950 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center text-xs font-black shrink-0">6</span>
                  Changes to Terms
                </h3>
                <p className="text-zinc-600">
                  We reserve the right to modify these Terms & Conditions at any time. Continued use of Yoouz after changes constitutes your acceptance of the updated terms.
                </p>
              </section>

              {/* Section 7 */}
              <section className="p-4 rounded-2xl bg-zinc-900 text-white space-y-2">
                <h3 className="text-sm font-black flex items-center gap-2 text-white">
                  <Globe className="w-4 h-4 text-blue-400" />
                  Governing Law & Jurisdiction
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  These terms are governed by the laws of the State of California, USA, without regard to its conflict of law provisions. Any legal action or proceeding arising from these terms shall be brought exclusively in the courts located in <strong className="text-white">San Francisco, California, USA</strong>.
                </p>
              </section>
            </article>
          ) : (
            /* ========================================================================= */
            /* PRIVACY POLICY DOCUMENT */
            /* ========================================================================= */
            <article className="space-y-6">
              <header className="border-b border-zinc-200 pb-4 space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider mb-1">
                  Google OAuth Compliant
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
                  Privacy Policy for Yoouz
                </h1>
                <p className="text-xs text-zinc-400 font-semibold">
                  Last Updated: August 24, 2026
                </p>
              </header>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-zinc-800 text-xs sm:text-sm leading-relaxed">
                Welcome to <strong>Yoouz</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website and web application.
              </div>

              {/* Section 1 */}
              <section className="space-y-3">
                <h3 className="text-sm sm:text-base font-black text-zinc-950 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#1a73e8]" />
                  Information We Collect
                </h3>
                <p className="text-zinc-600">
                  When you interact with Yoouz, we collect limited personal data to provide and secure your account:
                </p>
                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
                    <p className="font-bold text-zinc-900">Account Information via Google Sign-In</p>
                    <p className="text-zinc-600">
                      When you log in using Google OAuth, we receive your basic Google account profile data, which includes your name, email address, and profile picture. We do not collect or store passwords.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
                    <p className="font-bold text-zinc-900 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-zinc-700" />
                      Camera and Microphone Data
                    </p>
                    <p className="text-zinc-600">
                      Yoouz allows you to record video reviews directly through your device&apos;s camera interface. We do not access or accept pre-recorded files or photo library uploads. Camera and microphone data are accessed strictly in real-time during your active recording session to capture and generate your live video review.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 2 */}
              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-black text-zinc-950 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  How We Use Your Information
                </h3>
                <p className="text-zinc-600">We use the information we collect to:</p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-600">
                  <li>Create and manage your Yoouz user account.</li>
                  <li>Authenticate your identity securely via Google.</li>
                  <li>Process, host, and display your live-recorded video reviews on the platform.</li>
                  <li>Maintain platform security and prevent fraudulent activity.</li>
                </ul>
              </section>

              {/* Section 3 */}
              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-black text-zinc-950 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  Data Sharing and Disclosure
                </h3>
                <p className="text-zinc-600">
                  We do not sell, trade, or rent your personal information to third parties. We may share data only under the following circumstances:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-600">
                  <li>
                    <strong className="text-zinc-900">Service Providers:</strong> With trusted backend and hosting infrastructure providers (such as Google Cloud and Supabase/Firebase) required to run our web application.
                  </li>
                  <li>
                    <strong className="text-zinc-900">Legal Compliance:</strong> If required to comply with applicable laws, regulations, or legal processes.
                  </li>
                </ul>
              </section>

              {/* Section 4 */}
              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-black text-zinc-950 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600" />
                  Data Security
                </h3>
                <p className="text-zinc-600">
                  We implement modern technical and organizational security measures (including encrypted transport via HTTPS and secure token-based authentication) to protect your data from unauthorized access, loss, or misuse.
                </p>
              </section>

              {/* Section 5 */}
              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-black text-zinc-950 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-600" />
                  Your Rights and Choices
                </h3>
                <p className="text-zinc-600">You have the right to:</p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-600">
                  <li>Access the personal data we hold about you.</li>
                  <li>Request the correction or deletion of your account and associated review data.</li>
                  <li>Withdraw your consent to data processing at any time by deleting your account.</li>
                </ul>
              </section>

              {/* Section 6 */}
              <section className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                <h3 className="text-sm font-black text-zinc-950 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#1a73e8]" />
                  Contact Us
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  If you have any questions about this Privacy Policy, you can contact our privacy officer at{" "}
                  <a
                    href="mailto:support@yoouz.com"
                    className="font-bold text-[#1a73e8] hover:underline"
                  >
                    support@yoouz.com
                  </a>
                  .
                </p>
              </section>
            </article>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs text-zinc-500 shrink-0">
          <span className="font-semibold text-[11px] text-zinc-400">
            © 2026 Yoouz Inc. • San Francisco, CA
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
