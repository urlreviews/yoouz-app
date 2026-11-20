import React, { useState, useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { X, ShieldCheck, FileText, Scale, ExternalLink, Mail, CheckCircle2, Lock, Camera, Globe } from "lucide-react";
import { useSwipeDownToDismiss } from "../hooks/useSwipeDownToDismiss";

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
  const { t } = useLanguage();
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

  const { swipeProps, dragOffsetY } = useSwipeDownToDismiss({
    onDismiss: onClose,
    threshold: 60
  });

  if (!isOpen) return null;

  return (
    <div
      id="copo-legal-modal-backdrop"
      className="fixed inset-0 z-[400] bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="copo-legal-modal-container"
        style={{
          transform: dragOffsetY > 0 ? `translateY(${dragOffsetY}px)` : undefined,
          transition: dragOffsetY === 0 ? "transform 0.2s ease-out" : "none"
        }}
        className="bg-[#0c0c0f]/96 backdrop-blur-2xl rounded-none sm:rounded-[28px] max-w-3xl w-full h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[90vh] flex flex-col shadow-[0_24px_80px_rgba(0,0,0,0.9)] border-0 sm:border border-white/[0.1] overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-150 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Drag Indicator Pill for Mobile */}
        <div 
          className="h-8 flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing sm:hidden touch-none"
          {...swipeProps}
        >
          <div className="w-11 h-1 rounded-full bg-white/20" />
        </div>

        {/* Modal Header */}
        <div 
          className="px-6 pt-2 sm:pt-4 pb-4 border-b border-white/[0.08] flex items-center justify-between bg-[#08080b]/80 shrink-0 touch-pan-y"
          {...swipeProps}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-white shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-['Google_Sans',sans-serif]">
                {t("legal.title", "Yoouz Legal & Compliance")}
              </h2>
              <p className="text-[11px] text-zinc-400 font-medium">
                {t("legal.jurisdiction", "Governing Compliance & Data Protection")}
              </p>
            </div>
          </div>

          <button
            id="copo-legal-modal-close-btn"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.09] hidden sm:flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
            aria-label={t("common.close", "Close")}
            title={t("common.close", "Close")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 py-3 bg-[#08080b]/60 border-b border-white/[0.08] flex items-center gap-2 shrink-0">
          <button
            id="copo-legal-terms-tab-btn"
            onClick={() => setActiveTab("terms")}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer border ${
              activeTab === "terms"
                ? "bg-white text-zinc-950 border-white shadow-xs"
                : "bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/[0.08] border-white/[0.08]"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t("legal.termsTab", "Terms & Conditions")}</span>
          </button>

          <button
            id="copo-legal-privacy-tab-btn"
            onClick={() => setActiveTab("privacy")}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer border ${
              activeTab === "privacy"
                ? "bg-white text-zinc-950 border-white shadow-xs"
                : "bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/[0.08] border-white/[0.08]"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t("legal.privacyTab", "Privacy Policy")}</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-zinc-200 text-xs sm:text-sm leading-relaxed text-left select-text">
          {activeTab === "terms" ? (
            /* ========================================================================= */
            /* TERMS & CONDITIONS DOCUMENT */
            /* ========================================================================= */
            <article className="space-y-6">
              <header className="border-b border-zinc-800 pb-4 space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700 text-[10px] font-black uppercase tracking-wider mb-1">
                  {t("legal.officialAgreement", "Official Legal Agreement")}
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {t("legal.termsHeading", "Terms & Conditions for Yoouz")}
                </h1>
                <p className="text-xs text-zinc-200 font-semibold">
                  {t("legal.lastUpdated", "Last Updated: August 24, 2026")}
                </p>
              </header>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs sm:text-sm leading-relaxed">
                {t("legal.welcomeTerms", "Welcome to Yoouz. By accessing or using our platform, you agree to be bound by these Terms & Conditions. If you do not agree to these terms, please do not use Yoouz.")}
              </div>

              {/* Section 1 */}
              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-200 flex items-center justify-center text-xs font-black shrink-0">1</span>
                  {t("legal.sec1Title", "Description of Service")}
                </h3>
                <p className="text-zinc-200">
                  {t("legal.sec1Body", "Yoouz is a live photo review and discovery platform. Users can capture authentic photo reviews directly via their device camera with 1–5 whole-star ratings, and businesses can display these reviews within their profiles or via platform-provided tools.")}
                </p>
              </section>

              {/* Section 2 */}
              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-200 flex items-center justify-center text-xs font-black shrink-0">2</span>
                  {t("legal.sec2Title", "Anonymous Handles & Passkeys")}
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-zinc-200">
                  <li>{t("legal.sec2Item1", "Browsing Yoouz never creates an account. An anonymous handle (U/XXXXXX) is automatically created only when you publish a photo review or interact.")}</li>
                  <li>{t("legal.sec2Item2", "You can optionally save a Passkey so your device automatically restores your account on any new phone — no email or password needed.")}</li>
                </ul>
              </section>

              {/* Section 3 */}
              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-200 flex items-center justify-center text-xs font-black shrink-0">3</span>
                  {t("legal.sec3Title", "Live Photo Capture & Content Rules")}
                </h3>
                <div className="space-y-2.5 pl-1">
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <p className="font-bold text-white mb-0.5">{t("legal.noUploadsTitle", "No Gallery Uploads")}</p>
                    <p className="text-zinc-200">
                      {t("legal.noUploadsBody", "All reviews must be captured live through the Yoouz web application camera interface. Uploading saved photos from device galleries or external libraries is strictly prohibited.")}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <p className="font-bold text-white mb-0.5">{t("legal.standardsTitle", "User Content Standards")}</p>
                    <p className="text-zinc-200">
                      {t("legal.standardsBody", "You retain personal accountability for the photo reviews you publish. You agree not to capture or publish content that is unlawful, defamatory, abusive, harassing, misleading, or infringing on third-party intellectual property rights.")}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <p className="font-bold text-white mb-0.5">{t("legal.licenseTitle", "Content License")}</p>
                    <p className="text-zinc-200">
                      {t("legal.licenseBody", "By publishing a photo review on Yoouz, you grant Yoouz a worldwide, non-exclusive, royalty-free license to host and display your review imagery on the platform.")}
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 4 */}
              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-200 flex items-center justify-center text-xs font-black shrink-0">4</span>
                  {t("legal.sec4Title", "Business Accounts & Intellectual Property Protection")}
                </h3>
                <div className="space-y-2 text-zinc-200">
                  <p>
                    <strong className="text-white">{t("legal.noOwnership", "No Ownership Transfer:")}</strong> {t("legal.noOwnershipBody", "Businesses utilizing Yoouz do not own the photo reviews captured by users.")}
                  </p>
                  <p>
                    <strong className="text-white">{t("legal.streamingAccess", "Platform-Only Display:")}</strong> {t("legal.streamingAccessBody", "Businesses are granted a limited, revocable, non-transferable right to display consumer photo reviews exclusively through Yoouz's authorized platform interface or official embedding tools.")}
                  </p>
                  <p>
                    <strong className="text-white">{t("legal.antiPiracy", "Anti-Piracy & Anti-Scraping:")}</strong> {t("legal.antiPiracyBody", "Businesses and users are strictly prohibited from scraping, ripping, harvesting, or re-hosting review assets from Yoouz onto unauthorized external websites or third-party servers.")}
                  </p>
                  <p>
                    <strong className="text-white">{t("legal.futureFeatures", "Future Features and Monetization:")}</strong> {t("legal.futureFeaturesBody", "Advanced business tools, analytics, custom widgets, or higher-tier embedding features may be subject to future paid subscription tiers. Yoouz reserves the right to modify, restrict, or gate business features at any time.")}
                  </p>
                </div>
              </section>

              {/* Section 5: Account Deactivation and Deletion Requests */}
              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-200 flex items-center justify-center text-xs font-black shrink-0">5</span>
                  {t("legal.sec5TitleDeactivation", "Account Deactivation & Deletion Requests")}
                </h3>
                <div className="space-y-2 text-zinc-200">
                  <p>
                    {t("legal.sec5DeactivationBody", "Users may request to deactivate or permanently delete their account and personal profile at any time by submitting a formal request through the in-app Account Settings request form. To protect authentic user reviews and prevent fraudulent or accidental account wipeouts, deletion requests are securely verified and processed by our compliance desk within 24 to 48 hours without requiring public email communication.")}
                  </p>
                  <p>
                    {t("legal.sec5DeactivationPurge", "Upon completed review and verification of the deletion request, the user's account records, authentication credentials, and personal profile data are permanently eradicated across our database and storage systems.")}
                  </p>
                </div>
              </section>

              {/* Section 6 */}
              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-200 flex items-center justify-center text-xs font-black shrink-0">6</span>
                  {t("legal.sec5Title", "Limitation of Liability")}
                </h3>
                <p className="text-zinc-200">
                  {t("legal.sec5Body", "Yoouz is provided on an 'as is' and 'as available' basis. We do not guarantee uninterrupted platform availability and are not liable for user-generated content or damages arising from the use of our services.")}
                </p>
              </section>

              {/* Section 7 */}
              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-200 flex items-center justify-center text-xs font-black shrink-0">7</span>
                  {t("legal.sec6Title", "Changes to Terms")}
                </h3>
                <p className="text-zinc-200">
                  {t("legal.sec6Body", "We reserve the right to modify these Terms & Conditions at any time. Continued use of Yoouz after changes constitutes your acceptance of the updated terms.")}
                </p>
              </section>

              {/* Section 8 */}
              <section className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-white space-y-2">
                <h3 className="text-sm font-black flex items-center gap-2 text-white">
                  <Globe className="w-4 h-4 text-white" />
                  {t("legal.sec7Title", "Governing Law & Jurisdiction")}
                </h3>
                <p className="text-xs text-zinc-200 leading-relaxed">
                  {t("legal.sec7Body", "These terms are governed by applicable privacy regulations and digital service guidelines. Any legal inquiry or proceeding arising from these terms shall be submitted through our official platform compliance desk.")}
                </p>
              </section>
            </article>
          ) : (
            /* ========================================================================= */
            /* PRIVACY POLICY DOCUMENT */
            /* ========================================================================= */
            <article className="space-y-6">
              <header className="border-b border-zinc-800 pb-4 space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-[10px] font-black uppercase tracking-wider mb-1">
                  {t("legal.privacyArchitecture", "Privacy & Security Compliant")}
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {t("legal.privacyHeading", "Privacy Policy for Yoouz")}
                </h1>
                <p className="text-xs text-zinc-200 font-semibold">
                  {t("legal.lastUpdated", "Last Updated: August 24, 2026")}
                </p>
              </header>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs sm:text-sm leading-relaxed">
                {t("legal.welcomePrivacy", "Welcome to Yoouz ('we,' 'our,' or 'us'). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website and web application.")}
              </div>

              {/* Section 1 */}
              <section className="space-y-3">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-white" />
                  {t("legal.privSec1Title", "Information We Collect")}
                </h3>
                <p className="text-zinc-200">
                  {t("legal.privSec1Subtitle", "When you interact with Yoouz, we collect limited personal data to provide and secure your account:")}
                </p>
                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                    <p className="font-bold text-white">{t("legal.accountInfoTitle", "Anonymous Handles & Passkeys")}</p>
                    <p className="text-zinc-200">
                      {t("legal.accountInfoBody", "We do not collect personal emails or passwords for reviewer accounts. Your anonymous U/XXXXXX handle is created only when you publish or interact. If you tap 'Save Passkey', we store only a public key so you can restore your account on another device.")}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-zinc-200" />
                      {t("legal.cameraMicTitle", "Live Camera Data")}
                    </p>
                    <p className="text-zinc-200">
                      {t("legal.cameraMicBody", "Yoouz allows you to capture photo reviews directly through your device's live camera interface. We do not access or accept saved photo library uploads. Camera frames are accessed strictly in real-time during your active capture session.")}
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 2 */}
              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  {t("legal.privSec2Title", "How We Use Your Information")}
                </h3>
                <p className="text-zinc-200">{t("legal.privSec2Subtitle", "We use the information we collect to:")}</p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-200">
                  <li>{t("legal.privSec2Item1", "Provision and manage your on-action anonymous U/XXXXXX reviewer profile and custom bio.")}</li>
                  <li>{t("legal.privSec2Item2", "Verify your Passkey so you can restore your account when switching devices.")}</li>
                  <li>{t("legal.privSec2Item3", "Process, host, and display your live-captured photo reviews on the platform.")}</li>
                  <li>{t("legal.privSec2Item4", "Maintain platform security and prevent fraudulent activity.")}</li>
                </ul>
              </section>

              {/* Section 3 */}
              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-white" />
                  {t("legal.privSec3Title", "Data Sharing and Disclosure")}
                </h3>
                <p className="text-zinc-200">
                  {t("legal.privSec3Subtitle", "We do not sell, trade, or rent your personal information to third parties. We may share data only under the following circumstances:")}
                </p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-200">
                  <li>
                    <strong className="text-white">{t("legal.serviceProviders", "Service Providers:")}</strong> {t("legal.serviceProvidersBody", "With trusted backend and hosting infrastructure providers (such as bunny.net and PostgreSQL Cloud SQL) required to run our web application.")}
                  </li>
                  <li>
                    <strong className="text-white">{t("legal.legalCompliance", "Legal Compliance:")}</strong> {t("legal.legalComplianceBody", "If required to comply with applicable laws, regulations, or legal processes.")}
                  </li>
                </ul>
              </section>

              {/* Section 4 */}
              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-white" />
                  {t("legal.privSec4Title", "Data Security")}
                </h3>
                <p className="text-zinc-200">
                  {t("legal.privSec4Body", "We implement modern technical and organizational security measures (including encrypted transport via HTTPS and secure token-based authentication) to protect your data from unauthorized access, loss, or misuse.")}
                </p>
              </section>

              {/* Section 5 */}
              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-white" />
                  {t("legal.privSec5Title", "Your Rights and Choices")}
                </h3>
                <p className="text-zinc-200">{t("legal.privSec5Subtitle", "You have the right to:")}</p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-200">
                  <li>{t("legal.privSec5Item1", "Access the personal data we hold about you.")}</li>
                  <li>{t("legal.privSec5Item2", "Request the deactivation or permanent deletion of your account and personal data by submitting the in-app Account Deletion Request form in your profile settings.")}</li>
                  <li>{t("legal.privSec5Item3", "Withdraw your consent to data processing at any time through our automated in-app compliance request system without needing to send an email.")}</li>
                </ul>
              </section>

              {/* Section 6 */}
              <section className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-white" />
                  {t("legal.privSec6Title", "Privacy Officer & In-App Inquiries")}
                </h3>
                <p className="text-xs text-zinc-200 leading-relaxed">
                  {t("legal.privSec6BodyNoEmail", "If you have any questions about this Privacy Policy or wish to exercise your data privacy rights, you can submit an inquiry or account deletion request directly through the in-app Support Desk and Account Settings. All requests are securely routed to our privacy officers and processed within 24–48 hours.")}
                </p>
              </section>
            </article>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-white/[0.08] bg-[#08080b]/80 flex items-center justify-between text-xs text-zinc-400 shrink-0">
          <span className="font-medium text-[11px] text-zinc-400">
            {t("legal.copyright", "© 2026 Yoouz Inc. All rights reserved.")}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            {t("common.close", "Close")}
          </button>
        </div>
      </div>
    </div>
  );
};
