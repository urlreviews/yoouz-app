import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  SupportedLanguage,
  LanguageMeta,
  SUPPORTED_LANGUAGES,
  translations,
  TranslationSchema
} from "./translations";
import { UNIVERSAL_PAGE_TRANSLATIONS } from "./locales/universal";

interface LanguageContextType {
  language: SupportedLanguage;
  isRTL: boolean;
  setLanguage: (lang: SupportedLanguage) => void;
  currentLanguageMeta: LanguageMeta;
  languages: LanguageMeta[];
  t: (keyPath: string, fallbackOrParams?: string | Record<string, string | number>, params?: Record<string, string | number>) => string;
  translateText: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "yoouz_user_language_preference";
const ALL_STORAGE_KEYS = ["yoouz_user_language_preference", "copo_language", "yoouz_language"];

function detectBestLanguage(): SupportedLanguage {
  try {
    // 1. Check all local storage keys for explicit user selection
    for (const key of ALL_STORAGE_KEYS) {
      const saved = localStorage.getItem(key);
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        return saved as SupportedLanguage;
      }
    }

    // 2. Check saved cookie
    if (typeof document !== "undefined" && document.cookie) {
      const match = document.cookie.match(/yoouz_lang=([a-z]{2,5})/i);
      if (match && match[1] && SUPPORTED_LANGUAGES.some((l) => l.code === match[1].toLowerCase())) {
        return match[1].toLowerCase() as SupportedLanguage;
      }
    }

    // 3. Check logged in user profile in storage
    const userKeys = ["copo_user", "yoouz_user", "copo_logged_in_user"];
    for (const uKey of userKeys) {
      const raw = localStorage.getItem(uKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const userLang = parsed?.language || parsed?.preferredLanguage || parsed?.locale;
          if (userLang && SUPPORTED_LANGUAGES.some((l) => l.code === userLang.toLowerCase())) {
            return userLang.toLowerCase() as SupportedLanguage;
          }
        } catch (e) {}
      }
    }

    // 4. Fallback to browser language
    const browserLangs = navigator.languages || [navigator.language || "en"];
    for (const raw of browserLangs) {
      const code = raw.toLowerCase().split("-")[0];
      const match = SUPPORTED_LANGUAGES.find((l) => l.code === code);
      if (match) return match.code;
    }
  } catch (err) {
    console.warn("Language detection notice:", err);
  }
  return "en";
}

// Pre-load saved translations from localStorage for instant 0ms rendering
function loadSavedTranslations(lang: string): Record<string, string> {
  if (typeof window === "undefined" || lang === "en") return {};
  try {
    const raw = localStorage.getItem(`yoouz_i18n_cache_${lang}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) return parsed;
    }
  } catch (e) {}
  return {};
}

// Core texts to immediately translate & cache when user chooses any of the 64 languages
const CORE_STRINGS_TO_WARM = [
  "Home", "Search", "Discover", "Following", "Messages", "Notifications", "Bookmarks", "Business", "Profile", "More",
  "Paste a business URL below to see short video reviews or record your own.",
  "Search another business or website", "Search any business or website...", "Search place or URL...",
  "Review Any Business", "Search any business to watch authentic video reviews or record your own.",
  "Search business...",
  "Recent Searches", "Trending Searches", "Clear All", "No recent searches", "Overview", "Reviews", "About", "Contact", "Support",
  "Verified Web Listing", "Discover Reviewers", "Search reviewer by name...",
  "Syncing details...", "View Business", "Search business...",
  "Please select a business from the list or search with a valid website domain.",
  "Proof of Presence. Real People. Verified Places.", "The Yoouz Standard",
  "Traditional text reviews are vulnerable to bot networks, fake accounts, and AI-generated reviews. Yoouz creates authentic trust by capturing short 60-second video reviews recorded exclusively through live device cameras.",
  "Strict Rule", "Live Front-Camera Only", "No pre-recorded MP4 uploads or stock footage. Real customers capturing authentic experiences.",
  "Pillar 2", "60-Second Focus", "Concise, high-impact video reviews that deliver immediate value in under one minute.",
  "Pillar 3", "3-Way Dialogue", "Living comment threads connecting Reviewers, curious Viewers, and Verified Place Owners.",
  "Immutable Face & Voice Identity", "Every reviewer builds an open visual review portfolio. Consistent face, verified voice, and historical timeline give viewers immediate confidence that reviews are authored by genuine people.",
  "Audit Any Reviewer Profile Instantly", "Interactive Community Dialogue", "Reviews shouldn't be dead one-way monologues. Viewers can ask real-time questions ('Is there outdoor seating?', 'How was the service?'), and the community answers collaboratively.",
  "Crowdsourced Community Validation", "Official Domain Verification", "Business owners can claim their base domain page, respond with verified owner badges, and pin helpful solutions or updates at the top of customer review threads.",
  "Verified Owner Pinned Responses", "No Pay-to-Remove Extortion", "Unlike legacy review sites that pressure businesses into costly subscriptions to suppress negative feedback, Yoouz guarantees all verified reviews stay transparent and tamper-free.",
  "100% Equal Rules for All", "Search FAQs, guidelines, or topics...", "All Questions", "For Reviewers", "For Businesses", "Trust & Authenticity", "Technical & Privacy",
  "Claim Your Business Domain & Engage Directly", "Verify ownership of your base website domain (e.g., yourcompany.com) or local place profile to access creator tools, official owner badges, and community response features.",
  "Verified Owner Badge", "Stand out with a distinguished badge and official business owner designation on all comment threads.",
  "Pinned Solutions", "Pin an official response at the top of any review discussion to clarify updates or resolve questions.",
  "Embed Trust Feeds", "Easily embed genuine customer video review carousels onto your landing page to increase conversions.",
  "Request Domain Verification", "Privacy, Security & Legal Compliance", "Google Verified",
  "Following & Followers", "Manage businesses and reviewers you follow on Yoouz",
  "Followers", "Search followed businesses or reviewers...", "Search followers by name...",
  "You aren't following anyone yet", "When you follow businesses or authentic local reviewers on Yoouz, they will appear here.",
  "No matching followers found", "No followers yet", "When other local reviewers follow your profile, they will appear here.",
  "video review", "video reviews", "Unfollow", "Verified Reviewer", "Verified Top Reviewer", "Community Member",
  "Edit Profile", "Share Profile", "Message", "Follow", "Following", "Bio", "Location", "Joined",
  "Overview", "Reviews", "About", "About Me", "Save Changes", "Cancel", "City", "State/Province", "Country",
  "Your saved visual reviews, places & creators", "Videos", "Places", "Reviewers",
  "No video reviews saved yet", "Tap the bookmark icon in any video's options menu to save it.",
  "No saved places yet", "Grab places you want to visit from the map or review screens to build your bucket list.",
  "No saved reviewers yet", "Save trusted local guides & creators to instantly track their latest visual reviews.",
  "Business Place", "Explore Map", "Find Reviewers", "Discover Reviews",
  "All", "Unread", "Messages", "Likes", "Comments", "Shares", "Followers", "Saves",
  "new updates", "All caught up", "Mark read", "Clear all", "Notification Preferences",
  "Notifications are paused", "In-app notifications are paused in your preferences.",
  "No notifications", "View all notifications", "Notification Settings",
  "You're all caught up! Community updates and video review activity will appear here.",
  "Search chats or reviewers...", "UNREAD", "TOTAL CHATS", "Active on Yoouz", "No conversations yet",
  "Delete Conversation", "Block User", "Report Thread", "Select a conversation to start messaging",
  "Start a Message", "New Message", "Connect and message other community reviewers.",
  "Message community members & reviewers on Yoouz", "Message official business profiles on Yoouz",
  "Search member by name or handle...", "Search business by name, category, or city...",
  "Search community members", "Search businesses & members", "Chat", "Delete this conversation?",
  "message", "messages", "You have blocked {name}", "Message {name}...",
  "Read Privacy Policy", "Read Terms & Conditions", "Official Yoouz Support Desk", "Submit support inquiries, business domain claim requests, or report community guideline infractions.",
  "Your Full Name", "Email Address", "Category", "General Account / Technical Support", "Business / Domain Ownership Verification",
  "Report Policy Violation / Fake Content", "API & Partnership Inquiries", "Website Domain (Optional)", "Message Details",
  "Describe your inquiry or request in detail...", "Send Message", "Inquiry Received Successfully", "Send Another Inquiry",
  "All Systems Operational", "Software Build", "Languages Available", "Feed", "Search Results", "Tap card to view profile",
  "Community Reviewer", "View & Manage Profile", "Join the Community", "Sign In / Register", "Menu & Features",
  // All FAQ Questions & Answers
  "How long can my video review be?",
  "Every video review has a strict limit of 60 seconds. This ensures content remains high-impact, focused, digestible, and easy for other users to browse quickly without fluff or commercial filler.",
  "Why does the video recorder only use the live front camera and disable gallery uploads?",
  "To guarantee 100% authentic human experiences, Yoouz enforces Proof of Presence™ by auto-starting the live front (selfie) camera for direct recording. Uploading pre-recorded gallery files, marketing commercials, or stock video is strictly disabled to eliminate fake reviews and bot uploads.",
  "Do I need professional equipment or video editing skills to leave a review?",
  "Not at all. Yoouz is built for raw, spontaneous, authentic moments. All you need is your smartphone. Open the live front camera, share your genuine feedback for 30–60 seconds, and publish. No studio lighting, script reading, or video editing is needed.",
  "Do I automatically receive a Verified badge when I create an account?",
  "No. All new accounts start as standard unverified profiles. Your official 'Verified Reviewer' badge is automatically granted as soon as you record and publish your first live video review.",
  "Can viewers comment, ask questions, or interact on my video reviews?",
  "Yes! Every video review includes a live 3-way community discussion feed. Viewers can ask follow-up questions ('Is parking easy?', 'Did you try the dessert?'), share tips, and discuss their experiences directly beneath your video.",
  "Can I review any website domain or local establishment?",
  "Yes! You can search and review any base website domain (e.g., stripe.com, airbnb.com) or local brick-and-mortar place (restaurants, cafes, services, gyms) to build a unified hub of authentic opinions.",
  "Can I edit or delete my reviews later?",
  "Absolutely. You maintain complete ownership of your uploaded content. You can modify your star rating or permanently delete any of your posted video reviews at any time directly from your Profile drawer or video player options.",
  "How does direct messaging work between community members?",
  "Reviewers and users can message each other directly through the 'Messages' tab to ask private questions about venues, recommend local spots, or connect with fellow explorers.",
  "What is included in the Yoouz Premium Business Suite ($149/mo)?",
  "The Yoouz Premium Business Suite ($149/mo or $99/mo annual) provides a comprehensive enterprise growth stack: Verified Business Badge, Priority Search Placement in local search results, Live Website Review Widget with automated Google Rich Snippets SEO Schema, HD Branded Video Ad Exporter with watermark overlays, Pinned Owner Video Replies, Direct Messaging Lead Capture, Table & Window QR Standees, and Real-Time Analytics.",
  "How does the Yoouz Premium Suite improve Google Search SEO & Rich Snippets?",
  "When you embed your Yoouz video review widget on your website, our system automatically generates Schema.org JSON-LD structured data. This allows search engines like Google to render star ratings and video thumbnails directly in organic search results, increasing organic click-through rates (CTR) by up to 35%.",
  "Can businesses export customer video reviews as branded social media ads?",
  "Yes! Premium Suite subscribers can export customer 60-second video reviews as high-definition branded video ad assets with your official venue logo overlay, subtitles, and watermark—ready to run on Instagram Reels, TikTok, Facebook Ads, or YouTube Shorts.",
  "Are there any contracts, hidden fees, or cancellation lock-ins?",
  "No. Yoouz Premium Business Suite is completely flexible with zero setup fees and zero cancellation penalties. You can upgrade, pause, or switch plans anytime with 1-click in your Business Dashboard.",
  "How can my business claim its official domain or place page?",
  "Business owners can claim their listing in less than 2 minutes through the business verification flow. Claiming unlocks official owner dashboard tools, category settings, operating hours management, and customer dialogue features.",
  "Why do live video reviews convert so much higher than traditional text reviews?",
  "Written reviews are treated as quick signals that users skim with skepticism, whereas video reviews are multi-sensory experiences. When customers see real human facial expressions and hear sincere vocal enthusiasm, brand trust multiplies up to 20x. Video delivers unscripted proof that dramatically accelerates purchasing decisions.",
  "Why are authentic customer video reviews 9.8x more trusted than paid influencer endorsements?",
  "Modern consumers are fatigue-blind to sponsored ads. Unscripted 60-second video reviews from everyday customers carry authentic social proof because reviewers have no financial incentive to flatter, making them almost 10x more trustworthy than paid influencers.",
  "How do video reviews reduce product return rates and customer misunderstandings?",
  "Text reviews often create ambiguous expectations. A 60-second video walkthrough shows true sizing, atmosphere, portion sizes, or build quality in natural light, aligning customer expectations before purchase and drastically lowering return rates.",
  "Why are 60-second video testimonials replacing long, written case studies for businesses?",
  "Modern buyers rarely read lengthy PDF case studies or 1,000-word written posts. A concise 60-second video where a client highlights their problem, timeline, and measurable outcome delivers the full value proposition in under a minute.",
  "How can businesses use QR codes to capture in-person video testimonials on the spot?",
  "Verified businesses can download branded QR table tents, counter cards, and receipt stickers from their dashboard. When customers scan the code, it launches the live 60-second front-camera review recorder instantly with the place pre-tagged.",
  "Can businesses embed Yoouz video reviews on their own websites?",
  "Yes! Verified businesses can copy responsive iframe video feed embeds from their place drawer or Business Dashboard to display live, authentic 60-second customer video reviews directly on their e-commerce store, Shopify site, or landing page.",
  "Can businesses export or download Branded Video Ads?",
  "Yes! Claimed businesses can export customer video reviews as high-resolution branded video ad assets with official watermark overlays for use in social media campaigns, Instagram stories, TikTok ads, and marketing campaigns.",
  "Can businesses pay to remove or hide negative video reviews?",
  "No. Yoouz is built on uncompromised trust and authenticity. We never delete or alter honest video reviews for payment. Reviews that violate safety or explicit content guidelines can be flagged for human moderation review, and owners can post pinned video replies to provide transparent resolutions.",
  "How do official Business Owner replies and pinned comments work?",
  "Claimed business owners can participate in comment threads with a highlighted 'Business Owner' badge. Owners can also pin official responses to the top of comment feeds to highlight updates, resolutions, or special announcements.",
  "What is the Business Hours Manager and how does it sync?",
  "Claimed business owners can configure weekly operating hours, special holiday schedules, and open/closed statuses directly in their dashboard. Changes sync live across search results and place profile drawers.",
  "How do I manage business categories and contact details?",
  "Claimed owners can select official business categories, add verified phone numbers with international country codes, and link official web domains directly within the Business Dashboard.",
  "Why do video reviews outperform traditional text feedback so drastically?",
  "Written reviews are treated as quick signals to be scanned, whereas video testimonials are experienced through multi-sensory human processing. Humans are hardwired to evaluate vocal tone, facial micro-expressions, and sincerity. People retain 80% to 95% of a video message compared to only 10% to 20% of text, turning skepticism into confident belief.",
  "How does Yoouz eliminate fake reviews, AI bots, and automated spam?",
  "With AI copywriters and bot farms making written text reviews effortless to manufacture, Yoouz enforces Proof of Presence™. Every review must be captured live through the device camera in the moment, completely eliminating pre-recorded video uploads, third-party stock footage, and automated text bots.",
  "How does live video review capture protect businesses from competitor smear campaigns and review extortion?",
  "On legacy text review sites, unethical competitors or anonymous trolls can easily create dozens of burner accounts to post damaging 1-star text complaints. Yoouz neutralizes this threat through Proof of Presence™—requiring real individuals to show their face and speak live on camera, dismantling anonymous trolling and malicious smear attacks.",
  "When should text be used versus video on a platform?",
  "Text reviews provide efficient, scannable proof when speed and volume outweigh the need for deep trust. However, when a purchase feels like an investment, involves a high-ticket service, or requires unwavering credibility, video testimonials act as essential trust anchors that dismantle customer skepticism.",
  "Is my private email address exposed on my public profile or business claim badge?",
  "No. Yoouz strictly protects user privacy. Public profiles and claimed business badges remain private and anonymous (e.g., 'Business Claimed') without ever displaying personal or owner email addresses to the public.",
  "Is Yoouz a misspelling or affiliated with YouTube, Yoox, Youz, or Yelp?",
  "No. Yoouz (spelled Y-O-O-U-Z, pronounced 'Use' or 'Yooz') is an independent brand and proprietary platform. It is NOT a misspelling, typo, or subsidiary of YouTube, Yoox, Youz, Yelp, or any other company. Yoouz is specifically dedicated to authentic 60-second live camera video reviews.",
  "How are community guidelines and safety rules enforced?",
  "Every video review and comment includes a report flag button. Community submissions triggering policy violations (hate speech, spam, harassment, or explicit content) are queued for immediate review and removal.",
  "What are Verified Reviewer and Top Reviewer badges?",
  "Active reviewers who regularly contribute high-quality video reviews across local venues and domains automatically earn 'Verified Reviewer' and 'Top Reviewer' badges, highlighting their standing in the community.",
  "How do video reviews impact Google Search, Google Maps, and AI answer engines?",
  "Modern search engines (like Google) and AI discovery engines (Perplexity, ChatGPT, Gemini) prioritize rich, verified user-generated video content. Yoouz profiles and 60-second video reviews produce high dwell times and structured Schema.org VideoObject metadata that help businesses rank prominently in local map packs and AI search overviews.",
  "How do video testimonials improve Google search rankings and generate Video Rich Snippets?",
  "Video generates significantly higher dwell time and lower bounce rates—two primary Google ranking metrics. Every Yoouz video is structured with Schema.org/VideoObject and Review metadata, enabling search engines to surface interactive video thumbnails, star ratings, and timestamps in Google Search and Google Video results.",
  "Do video reviews help businesses appear in Google AI Overviews, ChatGPT, and Perplexity?",
  "Yes. Generative AI engines look for verified entity signals rather than easily faked text snippets. Because Yoouz ties reviews to real human faces, authentic vocal transcripts, and geolocation, AI engines reference Yoouz reviews as primary proof when answering local and brand queries.",
  "How does Google Maps and Live Directions integration work?",
  "Yoouz integrates interactive Google Maps with live pin clustering. Users can tap any place to view street locations and launch step-by-step turn-by-turn driving, walking, biking, or transit directions.",
  "How can I share video reviews or business profiles with friends?",
  "Tap the 'Share' button on any video or place to generate instant direct web links, downloadable QR codes, or share directly to WhatsApp, X (Twitter), Facebook, LinkedIn, or Email.",
  "Can I customize the appearance of embedded video feeds?",
  "Yes! The embed builder allows businesses to preview mobile and desktop views, customize dark/light themes, set video limits, and toggle autoplay or sound controls.",
  "Where can I find video reviews or places I have saved for later?",
  "Any video review or business listing you bookmark or save is immediately stored in your 'Bookmarks' tab in the main navigation menu for quick access on any device.",
  "How do I navigate between video reviews on desktop and mobile?",
  "On mobile, swipe up or down to move between videos. On desktop, use your keyboard arrow keys, mouse wheel, or the fixed vertical Up (^) and Down (v) floating chevron buttons. The Up chevron is dimmed on the first video to indicate you are at the start of the feed.",
  "How does Yoouz work offline as a Progressive Web App (PWA)?",
  "Yoouz supports PWA offline capabilities and IndexedDB video caching, allowing instant zero-latency video playback and offline review draft queues when connectivity is low.",
  "How many languages does Yoouz support, and how do I change my language?",
  "Yoouz supports 64 global languages with full UI internationalization. You can switch your preferred language at any time from the sidebar, footer, profile drawer, or Knowledge Center settings.",
  "Is Yoouz free for consumers and businesses?",
  "Yes. Browsing, discovering local venues, posting authentic 60-second video reviews, and venue profile claiming are included for all users and business operators with no hidden fees.",
  // Terms & Conditions & Privacy Policy Full Text
  "Yoouz Legal & Compliance",
  "Governing Jurisdiction: San Francisco, California, USA",
  "Terms & Conditions",
  "Privacy Policy",
  "Official Legal Agreement",
  "Terms & Conditions for Yoouz",
  "Last Updated: August 24, 2026",
  "Welcome to Yoouz. By accessing or using our platform, you agree to be bound by these Terms & Conditions. If you do not agree to these terms, please do not use Yoouz.",
  "Description of Service",
  "Yoouz is a video review and discovery platform. Users can record authentic reviews directly via their device camera, and businesses can display or stream these reviews within their profiles or via platform-provided tools.",
  "Account Registration",
  "You must authenticate using your verified email address to create an account.",
  "You are responsible for maintaining the security of your account and restricting unauthorized access to your device.",
  "Live Video Recording & Content Rules",
  "No File Uploads",
  "All reviews must be recorded live through the Yoouz web application camera interface. Uploading pre-recorded video files from device storage or external libraries is strictly prohibited.",
  "User Content Standards",
  "You retain personal accountability for the reviews you record. You agree not to record or publish content that is unlawful, defamatory, abusive, harassing, misleading, or infringing on third-party intellectual property rights.",
  "Content License",
  "By recording a review on Yoouz, you grant Yoouz a worldwide, non-exclusive, royalty-free license to host, display, and stream your video content on the platform.",
  "Business Accounts & Intellectual Property Protection",
  "No Ownership Transfer:",
  "Businesses utilizing Yoouz do not own the video files recorded by users.",
  "Streaming-Only Access:",
  "Businesses are granted a limited, revocable, non-transferable right to display consumer reviews exclusively through Yoouz's authorized platform interface or official embedding tools.",
  "Anti-Piracy & Anti-Scraping:",
  "Businesses and users are strictly prohibited from screen-recording, ripping, downloading, harvesting, or stealing video files from Yoouz to re-host them on external websites or third-party servers.",
  "Future Features and Monetization:",
  "Advanced business tools, analytics, custom widgets, or higher-tier embedding features may be subject to future paid subscription tiers. Yoouz reserves the right to modify, restrict, or gate business features at any time.",
  "Account Deactivation & Deletion Requests",
  "Users may request to deactivate or permanently delete their account and personal profile at any time by submitting a formal request through the in-app Account Settings request form. To protect authentic user reviews and prevent fraudulent or accidental account wipeouts, deletion requests are securely verified and processed by our compliance desk within 24 to 48 hours without requiring public email communication.",
  "Upon completed review and verification of the deletion request, the user's account records, authentication credentials, and personal profile data are permanently eradicated across our database and storage systems.",
  "Limitation of Liability",
  "Yoouz is provided on an 'as is' and 'as available' basis. We do not guarantee uninterrupted platform availability and are not liable for user-generated content or damages arising from the use of our services.",
  "Changes to Terms",
  "We reserve the right to modify these Terms & Conditions at any time. Continued use of Yoouz after changes constitutes your acceptance of the updated terms.",
  "Governing Law & Jurisdiction",
  "These terms are governed by the laws of the State of California, USA, without regard to its conflict of law provisions. Any legal action or proceeding arising from these terms shall be brought exclusively in the courts located in San Francisco, California, USA.",
  "Privacy & Security Compliant",
  "Privacy Policy for Yoouz",
  "Welcome to Yoouz ('we,' 'our,' or 'us'). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website and web application.",
  "Information We Collect",
  "When you interact with Yoouz, we collect limited personal data to provide and secure your account:",
  "Account Information & Verified Email",
  "When you log in using your verified email address, we receive your account profile data, which includes your name, email address, and profile picture. We do not collect or store passwords.",
  "Camera and Microphone Data",
  "Yoouz allows you to record video reviews directly through your device's camera interface. We do not access or accept pre-recorded files or photo library uploads. Camera and microphone data are accessed strictly in real-time during your active recording session to capture and generate your live video review.",
  "How We Use Your Information",
  "We use the information we collect to:",
  "Create and manage your Yoouz user account.",
  "Authenticate your identity securely via passwordless email verification.",
  "Process, host, and display your live-recorded video reviews on the platform.",
  "Maintain platform security and prevent fraudulent activity.",
  "Data Sharing and Disclosure",
  "We do not sell, trade, or rent your personal information to third parties. We may share data only under the following circumstances:",
  "Service Providers:",
  "With trusted backend and hosting infrastructure providers (such as bunny.net and PostgreSQL Cloud SQL) required to run our web application.",
  "Legal Compliance:",
  "If required to comply with applicable laws, regulations, or legal processes.",
  "Data Security",
  "We implement modern technical and organizational security measures (including encrypted transport via HTTPS and secure token-based authentication) to protect your data from unauthorized access, loss, or misuse.",
  "Your Rights and Choices",
  "You have the right to:",
  "Access the personal data we hold about you.",
  "Request the deactivation or permanent deletion of your account and personal data by submitting the in-app Account Deletion Request form in your profile settings.",
  "Withdraw your consent to data processing at any time through our automated in-app compliance request system without needing to send an email.",
  "Privacy Officer & In-App Inquiries",
  "If you have any questions about this Privacy Policy or wish to exercise your data privacy rights, you can submit an inquiry or account deletion request directly through the in-app Support Desk and Account Settings. All requests are securely routed to our privacy officers and processed within 24–48 hours."
];

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(detectBestLanguage);
  const [dynamicCache, setDynamicCache] = useState<Record<string, Record<string, string>>>(() => ({
    [language]: loadSavedTranslations(language)
  }));
  const [, setTick] = useState<number>(0);

  const pendingBatchRef = useRef<Set<string>>(new Set());
  const batchTimerRef = useRef<any>(null);
  const currentLangRef = useRef<string>(language);
  currentLangRef.current = language;

  const currentLanguageMeta = useMemo(() => {
    return (
      SUPPORTED_LANGUAGES.find((l) => l.code === language) ||
      SUPPORTED_LANGUAGES[0]
    );
  }, [language]);

  const isRTL = currentLanguageMeta.direction === "rtl";

  // Batch fetcher via /api/translate backed by Gemini 3.8 Flash
  const flushBatch = useCallback(async () => {
    const lang = currentLangRef.current;
    if (lang === "en") {
      pendingBatchRef.current.clear();
      return;
    }
    const texts = Array.from(pendingBatchRef.current);
    pendingBatchRef.current.clear();
    if (texts.length === 0) return;

    try {
      const resp = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texts,
          targetLang: lang,
          targetLangName: currentLanguageMeta.name
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data && data.translations && Object.keys(data.translations).length > 0) {
          setDynamicCache((prev) => {
            const currentForLang = { ...(prev[lang] || loadSavedTranslations(lang)) };
            let changed = false;
            for (const [orig, trans] of Object.entries(data.translations)) {
              if (typeof trans === "string" && trans.trim()) {
                currentForLang[orig] = trans.trim();
                changed = true;
              }
            }
            if (!changed) return prev;
            try {
              localStorage.setItem(`yoouz_i18n_cache_${lang}`, JSON.stringify(currentForLang));
            } catch (e) {}
            return { ...prev, [lang]: currentForLang };
          });
          setTick((t) => t + 1);
        }
      }
    } catch (err) {
      console.warn("[i18n] Translation network error:", err);
    }
  }, [currentLanguageMeta.name]);

  const scheduleTranslation = useCallback((text: string) => {
    if (!text || typeof text !== "string" || text.trim().length === 0) return;
    const trimmed = text.trim();
    if (trimmed.length > 2500) return; // Allow complete paragraphs and articles
    pendingBatchRef.current.add(trimmed);
    if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
    batchTimerRef.current = setTimeout(flushBatch, 30);
  }, [flushBatch]);

  // Warm up core strings when language changes
  useEffect(() => {
    if (language === "en") return;
    const existing = dynamicCache[language] || loadSavedTranslations(language);
    const missing = CORE_STRINGS_TO_WARM.filter((s) => !existing[s]);
    if (missing.length > 0) {
      missing.forEach((s) => pendingBatchRef.current.add(s));
      if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
      batchTimerRef.current = setTimeout(flushBatch, 50);
    }
  }, [language, flushBatch]);

  const setLanguage = useCallback((newLang: SupportedLanguage) => {
    if (!SUPPORTED_LANGUAGES.some((l) => l.code === newLang)) return;
    setLanguageState(newLang);
    currentLangRef.current = newLang;

    // 1. Persist across all local storage keys & cookies for instant client retention
    try {
      ALL_STORAGE_KEYS.forEach((key) => {
        localStorage.setItem(key, newLang);
      });
      document.cookie = `yoouz_lang=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}

    // 2. Sync with logged in user profile in local storage
    try {
      const userKeys = ["copo_user", "yoouz_user", "copo_logged_in_user"];
      userKeys.forEach((uKey) => {
        const raw = localStorage.getItem(uKey);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            parsed.language = newLang;
            parsed.preferredLanguage = newLang;
            localStorage.setItem(uKey, JSON.stringify(parsed));
          } catch (e) {}
        }
      });
    } catch (e) {}

    // 3. Sync language preference with server database backend
    try {
      const rawUser = localStorage.getItem("copo_user") || localStorage.getItem("yoouz_user");
      if (rawUser) {
        const uObj = JSON.parse(rawUser);
        if (uObj && (uObj.id || uObj.email || uObj.uid)) {
          fetch("/api/users/language", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: uObj.id || uObj.uid,
              userEmail: uObj.email,
              language: newLang
            })
          }).catch(() => {});
        }
      }
    } catch (e) {}

    // 4. Load cached translations for new language if not in state
    setDynamicCache((prev) => {
      if (prev[newLang]) return prev;
      return { ...prev, [newLang]: loadSavedTranslations(newLang) };
    });
  }, []);

  // Update HTML root attributes for accessibility & SEO
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = "ltr";
    
    let metaLocale = document.querySelector('meta[property="og:locale"]');
    if (!metaLocale) {
      metaLocale = document.createElement("meta");
      metaLocale.setAttribute("property", "og:locale");
      document.head.appendChild(metaLocale);
    }
    metaLocale.setAttribute("content", language);
  }, [language]);

  /**
   * Universal translation helper for all 64 languages.
   * Looks up static translations, cached translations, or queues AI auto-translation.
   */
  const t = useCallback(
    (
      keyPath: string,
      fallbackOrParams?: string | Record<string, string | number>,
      params?: Record<string, string | number>
    ): string => {
      let fallback = "";
      let actualParams: Record<string, string | number> | undefined;

      if (typeof fallbackOrParams === "string") {
        fallback = fallbackOrParams;
        actualParams = params;
      } else if (typeof fallbackOrParams === "object") {
        actualParams = fallbackOrParams;
      }

      // English base string determination
      let englishText = fallback;
      const keys = keyPath.split(".");
      let enVal: any = translations.en;
      for (const k of keys) {
        if (enVal && typeof enVal === "object" && k in enVal) {
          enVal = enVal[k];
        } else {
          enVal = undefined;
          break;
        }
      }
      if (typeof enVal === "string" && enVal) {
        englishText = enVal;
      }
      if (!englishText) {
        englishText = fallback || keyPath;
      }

      if (language === "en") {
        let res = englishText;
        if (actualParams) {
          Object.entries(actualParams).forEach(([paramKey, paramVal]) => {
            res = res.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramVal));
          });
        }
        return res;
      }

      // 1. Static Dictionary lookup
      let val: any = (translations as any)[language];
      for (const k of keys) {
        if (val && typeof val === "object" && k in val) {
          val = val[k];
        } else {
          val = undefined;
          break;
        }
      }

      // Check flat key lookup in static dictionary if nested traversal failed
      if (typeof val !== "string" || !val) {
        const langObj = (translations as any)[language];
        if (langObj && typeof langObj === "object") {
          if (typeof langObj[keyPath] === "string" && langObj[keyPath]) {
            val = langObj[keyPath];
          } else if (typeof langObj[englishText] === "string" && langObj[englishText]) {
            val = langObj[englishText];
          }
        }
      }

      // 2. Dynamic cache lookup by keyPath or by englishText
      const langCache = dynamicCache[language] || loadSavedTranslations(language);
      if (typeof val !== "string" || !val) {
        if (langCache[keyPath]) {
          val = langCache[keyPath];
        } else if (langCache[englishText]) {
          val = langCache[englishText];
        } else if (UNIVERSAL_PAGE_TRANSLATIONS[language]?.[englishText]) {
          val = UNIVERSAL_PAGE_TRANSLATIONS[language][englishText];
        } else if (UNIVERSAL_PAGE_TRANSLATIONS[language]?.[keyPath]) {
          val = UNIVERSAL_PAGE_TRANSLATIONS[language][keyPath];
        }
      }

      // 3. Queue for auto-translation if still missing
      if (typeof val !== "string" || !val) {
        if (englishText && !langCache[englishText]) {
          scheduleTranslation(englishText);
        }
        val = englishText;
      }

      // 4. Interpolate params
      if (actualParams && typeof val === "string") {
        Object.entries(actualParams).forEach(([paramKey, paramVal]) => {
          val = (val as string).replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramVal));
        });
      }

      return typeof val === "string" ? val : englishText;
    },
    [language, dynamicCache, scheduleTranslation]
  );

  const translateText = useCallback((text: string) => {
    return t(text, text);
  }, [t]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        isRTL,
        setLanguage,
        currentLanguageMeta,
        languages: SUPPORTED_LANGUAGES,
        t,
        translateText
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
