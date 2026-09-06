import { nl } from "./locales/nl";
import { ja } from "./locales/ja";
import { ko } from "./locales/ko";
import { tr } from "./locales/tr";
import { id } from "./locales/id";
import { hi } from "./locales/hi";

export interface TranslationSchema {
  [key: string]: any;
  nav: {
    home: string;
    search: string;
    discover: string;
    following: string;
    messages: string;
    notifications: string;
    bookmarks: string;
    business: string;
    profile: string;
    more: string;
    record_review: string;
    language: string;
  };
  common: {
    back: string;
    close: string;
    save: string;
    cancel: string;
    confirm: string;
    delete: string;
    edit: string;
    share: string;
    search: string;
    loading: string;
    verified: string;
    follow: string;
    following: string;
    unfollow: string;
    directions: string;
    website: string;
    call: string;
    chat: string;
    view_all: string;
    see_more: string;
    see_less: string;
    copy_link: string;
    copied: string;
    report: string;
    settings: string;
    select_language: string;
    system_default: string;
    success: string;
    error: string;
    retry: string;
    just_now: string;
    ago: string;
    hours: string;
    days: string;
    minutes: string;
  };
  video: {
    by: string;
    unmute: string;
    mute: string;
    likes: string;
    comments: string;
    shares: string;
    bookmarks: string;
    no_reviews: string;
    record_first: string;
    exceptional: string;
    great: string;
    average: string;
    poor: string;
    terrible: string;
    more_options: string;
    delete_review: string;
    report_video: string;
  };
  place: {
    reviews: string;
    about: string;
    photos: string;
    menu: string;
    claim_business: string;
    suggest_edits: string;
    claimed: string;
    unclaimed: string;
    verified_location: string;
    total_reviews: string;
    rating: string;
    about_business: string;
    chat_unavailable: string;
  };
  record: {
    title: string;
    select_place: string;
    start_recording: string;
    stop_recording: string;
    re_record: string;
    publish_review: string;
    publishing: string;
    recording: string;
    time_left: string;
    face_not_detected: string;
    camera_permission: string;
    content_safety_violation: string;
    front_camera_only: string;
    one_minute_limit: string;
  };
  share: {
    share_title: string;
    share_subtitle: string;
    whatsapp: string;
    twitter: string;
    facebook: string;
    telegram: string;
    email: string;
    copy: string;
  };
  comments: {
    title: string;
    placeholder: string;
    post: string;
    reply: string;
    no_comments: string;
    be_first: string;
  };
  business: {
    for_businesses: string;
    claim_now: string;
    manage_profile: string;
    dashboard: string;
    analytics: string;
    upgrade: string;
  };
  trustCenter?: {
    hub?: string;
    subtitle?: string;
    title?: string;
    pillarsTitle?: string;
    pillarsDesc?: string;
    strictRule?: string;
    rule1Title?: string;
    rule1Desc?: string;
    pillar2?: string;
    rule2Title?: string;
    rule2Desc?: string;
    pillar3?: string;
    rule3Title?: string;
    rule3Desc?: string;
    trustProtocol?: string;
    helpFaqs?: string;
    forBusinesses?: string;
    privacySecurity?: string;
    contactSupport?: string;
    theYoouzStandard?: string;
    bento1Title?: string;
    bento1Desc?: string;
    bento1Sub?: string;
    bento2Title?: string;
    bento2Desc?: string;
    bento2Sub?: string;
    bento3Title?: string;
    bento3Desc?: string;
    bento3Sub?: string;
    bento4Title?: string;
    bento4Desc?: string;
    bento4Sub?: string;
    verifiedMember?: string;
    searchFaqsPlaceholder?: string;
    categoryAll?: string;
    categoryReviewers?: string;
    categoryBusiness?: string;
    categoryTrust?: string;
    categoryTechnical?: string;
    noMatchingFaqs?: string;
    tryDifferentKeywords?: string;
    clearFilter?: string;
    businessHeroTitle?: string;
    businessHeroDesc?: string;
    verifiedOwnerBadgeTitle?: string;
    verifiedOwnerBadgeDesc?: string;
    pinnedSolutionsTitle?: string;
    pinnedSolutionsDesc?: string;
    embedTrustFeedsTitle?: string;
    embedTrustFeedsDesc?: string;
    requestVerification?: string;
    readyToVerify?: string;
    privacySecurityTitle?: string;
    googleVerified?: string;
    privacySummary?: string;
    updatedDate?: string;
    privacyPolicyTitle?: string;
    privacyPolicyDesc?: string;
    readPrivacyPolicy?: string;
    termsConditionsTitle?: string;
    termsConditionsDesc?: string;
    readTermsConditions?: string;
    authPillarTitle?: string;
    authPillarDesc?: string;
    recordingPillarTitle?: string;
    recordingPillarDesc?: string;
    zeroSellingPillarTitle?: string;
    zeroSellingPillarDesc?: string;
    jurisdictionPillarTitle?: string;
    jurisdictionPillarDesc?: string;
    allSystemsOperational?: string;
    dangerZoneTitle?: string;
    dangerZoneDesc?: string;
    deleteAccountBtn?: string;
    deleteAccountWarning?: string;
    supportDeskTitle?: string;
    supportDeskDesc?: string;
    fullNameLabel?: string;
    emailLabel?: string;
    categoryLabel?: string;
    categorySupport?: string;
    categoryVerification?: string;
    categoryGuidelines?: string;
    categoryPartnership?: string;
    websiteDomainLabel?: string;
    messageLabel?: string;
    messagePlaceholder?: string;
    attachFilesLabel?: string;
    dragDropPrompt?: string;
    browseFiles?: string;
    fileLimitHint?: string;
    submitRequest?: string;
    submitting?: string;
    inquiryReceivedTitle?: string;
    inquiryReceivedDesc?: string;
    sendAnotherInquiry?: string;
    deleteConfirmTitle?: string;
    deleteConfirmDesc?: string;
    typeDeletePlaceholder?: string;
    permanentlyDelete?: string;
    deleting?: string;
    [key: string]: any;
  };
  discover?: {
    title?: string;
    searchPlaceholder?: string;
    searchResults?: string;
    tapToView?: string;
    noReviewersFound?: string;
    tryDifferentSearch?: string;
    reviews?: string;
    followers?: string;
    [key: string]: any;
  };
  auth?: {
    help?: string;
    signInTitle?: string;
    signInSubtitle?: string;
    recordTitle?: string;
    recordSubtitle?: string;
    followingTitle?: string;
    followingSubtitle?: string;
    messagesTitle?: string;
    messagesSubtitle?: string;
    notificationsTitle?: string;
    notificationsSubtitle?: string;
    bookmarksTitle?: string;
    bookmarksSubtitle?: string;
    profileTitle?: string;
    profileSubtitle?: string;
    commentTitle?: string;
    commentSubtitle?: string;
    claimTitle?: string;
    claimSubtitle?: string;
    checkEmail?: string;
    sentCodeTo?: string;
    completeProfileTitle?: string;
    completeProfileSubtitle?: string;
    emailAddress?: string;
    emailPlaceholder?: string;
    continueEmail?: string;
    invalidEmailError?: string;
    verificationCode?: string;
    digitsCount?: string;
    verifyCode?: string;
    changeEmail?: string;
    resendCode?: string;
    firstName?: string;
    lastName?: string;
    country?: string;
    city?: string;
    regionProvince?: string;
    selectCity?: string;
    completeProfileEnter?: string;
    termsAgreementPrefix?: string;
    termsOfService?: string;
    and?: string;
    privacyPolicy?: string;
    copyright?: string;
    [key: string]: any;
  };
  businessAuth?: {
    title?: string;
    subtitle?: string;
    workEmail?: string;
    htmlCodeTag?: string;
    instant?: string;
    emailPlaceholder?: string;
    continueMagicLink?: string;
    exit?: string;
    change?: string;
    switchToHtmlTag?: string;
    checkInbox?: string;
    codeSentTo?: string;
    verificationCode?: string;
    verifyCode?: string;
    resendCode?: string;
    htmlVerificationTitle?: string;
    searchPlaceLabel?: string;
    searchPlacePlaceholder?: string;
    pasteTagInstruction?: string;
    copyTag?: string;
    copied?: string;
    verifyDomain?: string;
    verifying?: string;
    [key: string]: any;
  };
  legal?: {
    termsConditions?: string;
    privacyPolicy?: string;
    supportDesk?: string;
    networkLocation?: string;
    copyright?: string;
    [key: string]: any;
  };
  settings?: {
    language_preference?: string;
    language_subtitle?: string;
    search_languages_placeholder?: string;
    [key: string]: any;
  };
}

export type SupportedLanguage =
  | "en"
  | "ar"
  | "es"
  | "fr"
  | "de"
  | "it"
  | "pt"
  | "ru"
  | "zh"
  | "zh-TW"
  | "ja"
  | "ko"
  | "hi"
  | "tr"
  | "he"
  | "nl"
  | "id"
  | "uk"
  | "pl"
  | "sv"
  | "no"
  | "da"
  | "fi"
  | "el"
  | "cs"
  | "hu"
  | "ro"
  | "bg"
  | "sr"
  | "hr"
  | "sk"
  | "sl"
  | "lt"
  | "lv"
  | "et"
  | "is"
  | "sq"
  | "ga"
  | "ca"
  | "eu"
  | "gl"
  | "mt"
  | "fa"
  | "ur"
  | "bn"
  | "pa"
  | "ta"
  | "te"
  | "mr"
  | "gu"
  | "kn"
  | "ml"
  | "th"
  | "vi"
  | "ms"
  | "tl"
  | "my"
  | "km"
  | "lo"
  | "ka"
  | "hy"
  | "az"
  | "kk"
  | "uz"
  | "mn"
  | "ne"
  | "si"
  | "sw"
  | "am"
  | "yo"
  | "ig"
  | "ha"
  | "zu"
  | "xh"
  | "af"
  | "so";

export interface LanguageMeta {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  direction: "ltr" | "rtl";
  flag: string;
  region: "Americas" | "Europe" | "Asia & Pacific" | "Middle East" | "Africa";
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  // --- Americas ---
  { code: "en", name: "English (US)", nativeName: "English", direction: "ltr", flag: "🇺🇸", region: "Americas" },
  { code: "es", name: "Spanish", nativeName: "Español", direction: "ltr", flag: "🇪🇸", region: "Americas" },
  { code: "pt", name: "Portuguese (Brazil)", nativeName: "Português (Brasil)", direction: "ltr", flag: "🇧🇷", region: "Americas" },
  { code: "fr", name: "French", nativeName: "Français", direction: "ltr", flag: "🇫🇷", region: "Americas" },

  // --- Europe ---
  { code: "de", name: "German", nativeName: "Deutsch", direction: "ltr", flag: "🇩🇪", region: "Europe" },
  { code: "it", name: "Italian", nativeName: "Italiano", direction: "ltr", flag: "🇮🇹", region: "Europe" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", direction: "ltr", flag: "🇳🇱", region: "Europe" },
  { code: "ru", name: "Russian", nativeName: "Русский", direction: "ltr", flag: "🇷🇺", region: "Europe" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", direction: "ltr", flag: "🇺🇦", region: "Europe" },
  { code: "pl", name: "Polish", nativeName: "Polski", direction: "ltr", flag: "🇵🇱", region: "Europe" },
  { code: "sv", name: "Swedish", nativeName: "Svenska", direction: "ltr", flag: "🇸🇪", region: "Europe" },
  { code: "no", name: "Norwegian", nativeName: "Norsk", direction: "ltr", flag: "🇳🇴", region: "Europe" },
  { code: "da", name: "Danish", nativeName: "Dansk", direction: "ltr", flag: "🇩🇰", region: "Europe" },
  { code: "fi", name: "Finnish", nativeName: "Suomi", direction: "ltr", flag: "🇫🇮", region: "Europe" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", direction: "ltr", flag: "🇬🇷", region: "Europe" },
  { code: "cs", name: "Czech", nativeName: "Čeština", direction: "ltr", flag: "🇨🇿", region: "Europe" },
  { code: "hu", name: "Hungarian", nativeName: "Magyar", direction: "ltr", flag: "🇭🇺", region: "Europe" },
  { code: "ro", name: "Romanian", nativeName: "Română", direction: "ltr", flag: "🇷🇴", region: "Europe" },
  { code: "bg", name: "Bulgarian", nativeName: "Български", direction: "ltr", flag: "🇧🇬", region: "Europe" },
  { code: "sr", name: "Serbian", nativeName: "Српски", direction: "ltr", flag: "🇷🇸", region: "Europe" },
  { code: "hr", name: "Croatian", nativeName: "Hrvatski", direction: "ltr", flag: "🇭🇷", region: "Europe" },
  { code: "sk", name: "Slovak", nativeName: "Slovenčina", direction: "ltr", flag: "🇸🇰", region: "Europe" },
  { code: "sl", name: "Slovenian", nativeName: "Slovenščina", direction: "ltr", flag: "🇸🇮", region: "Europe" },
  { code: "lt", name: "Lithuanian", nativeName: "Lietuvių", direction: "ltr", flag: "🇱🇹", region: "Europe" },
  { code: "lv", name: "Latvian", nativeName: "Latviešu", direction: "ltr", flag: "🇱🇻", region: "Europe" },
  { code: "et", name: "Estonian", nativeName: "Eesti", direction: "ltr", flag: "🇪🇪", region: "Europe" },
  { code: "is", name: "Icelandic", nativeName: "Íslenska", direction: "ltr", flag: "🇮🇸", region: "Europe" },
  { code: "sq", name: "Albanian", nativeName: "Shqip", direction: "ltr", flag: "🇦🇱", region: "Europe" },
  { code: "ga", name: "Irish", nativeName: "Gaeilge", direction: "ltr", flag: "🇮🇪", region: "Europe" },
  { code: "ca", name: "Catalan", nativeName: "Català", direction: "ltr", flag: "🇪🇸", region: "Europe" },
  { code: "eu", name: "Basque", nativeName: "Euskara", direction: "ltr", flag: "🇪🇸", region: "Europe" },
  { code: "gl", name: "Galician", nativeName: "Galego", direction: "ltr", flag: "🇪🇸", region: "Europe" },
  { code: "mt", name: "Maltese", nativeName: "Malti", direction: "ltr", flag: "🇲🇹", region: "Europe" },

  // --- Middle East & West Asia ---
  { code: "ar", name: "Arabic", nativeName: "العربية", direction: "rtl", flag: "🇦🇪", region: "Middle East" },
  { code: "he", name: "Hebrew", nativeName: "עברית", direction: "rtl", flag: "🇮🇱", region: "Middle East" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", direction: "ltr", flag: "🇹🇷", region: "Middle East" },
  { code: "fa", name: "Persian (Farsi)", nativeName: "فارسی", direction: "rtl", flag: "🇮🇷", region: "Middle East" },
  { code: "ur", name: "Urdu", nativeName: "اردو", direction: "rtl", flag: "🇵🇰", region: "Middle East" },
  { code: "ka", name: "Georgian", nativeName: "ქართული", direction: "ltr", flag: "🇬🇪", region: "Middle East" },
  { code: "hy", name: "Armenian", nativeName: "Հայերեն", direction: "ltr", flag: "🇦🇲", region: "Middle East" },
  { code: "az", name: "Azerbaijani", nativeName: "Azərbaycan", direction: "ltr", flag: "🇦🇿", region: "Middle East" },

  // --- Asia & Pacific ---
  { code: "zh", name: "Chinese (Simplified)", nativeName: "中文 (简体)", direction: "ltr", flag: "🇨🇳", region: "Asia & Pacific" },
  { code: "zh-TW", name: "Chinese (Traditional)", nativeName: "中文 (繁體)", direction: "ltr", flag: "🇹🇼", region: "Asia & Pacific" },
  { code: "ja", name: "Japanese", nativeName: "日本語", direction: "ltr", flag: "🇯🇵", region: "Asia & Pacific" },
  { code: "ko", name: "Korean", nativeName: "한국어", direction: "ltr", flag: "🇰🇷", region: "Asia & Pacific" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", direction: "ltr", flag: "🇮🇳", region: "Asia & Pacific" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", direction: "ltr", flag: "🇧🇩", region: "Asia & Pacific" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", direction: "ltr", flag: "🇮🇳", region: "Asia & Pacific" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", direction: "ltr", flag: "🇮🇳", region: "Asia & Pacific" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", direction: "ltr", flag: "🇮🇳", region: "Asia & Pacific" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", direction: "ltr", flag: "🇮🇳", region: "Asia & Pacific" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", direction: "ltr", flag: "🇮🇳", region: "Asia & Pacific" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", direction: "ltr", flag: "🇮🇳", region: "Asia & Pacific" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", direction: "ltr", flag: "🇮🇳", region: "Asia & Pacific" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", direction: "ltr", flag: "🇮🇩", region: "Asia & Pacific" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", direction: "ltr", flag: "🇲🇾", region: "Asia & Pacific" },
  { code: "th", name: "Thai", nativeName: "ไทย", direction: "ltr", flag: "🇹🇭", region: "Asia & Pacific" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", direction: "ltr", flag: "🇻🇳", region: "Asia & Pacific" },
  { code: "tl", name: "Filipino (Tagalog)", nativeName: "Filipino", direction: "ltr", flag: "🇵🇭", region: "Asia & Pacific" },
  { code: "my", name: "Burmese", nativeName: "မြန်မာဘာသာ", direction: "ltr", flag: "🇲🇲", region: "Asia & Pacific" },
  { code: "km", name: "Khmer", nativeName: "ភាសាខ្មែរ", direction: "ltr", flag: "🇰🇭", region: "Asia & Pacific" },
  { code: "lo", name: "Lao", nativeName: "ພາສາລາວ", direction: "ltr", flag: "🇱🇦", region: "Asia & Pacific" },
  { code: "kk", name: "Kazakh", nativeName: "Қазақ тілі", direction: "ltr", flag: "🇰🇿", region: "Asia & Pacific" },
  { code: "uz", name: "Uzbek", nativeName: "O'zbek tili", direction: "ltr", flag: "🇺🇿", region: "Asia & Pacific" },
  { code: "mn", name: "Mongolian", nativeName: "Монгол хэл", direction: "ltr", flag: "🇲🇳", region: "Asia & Pacific" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली", direction: "ltr", flag: "🇳🇵", region: "Asia & Pacific" },
  { code: "si", name: "Sinhala", nativeName: "සිංහල", direction: "ltr", flag: "🇱🇰", region: "Asia & Pacific" },

  // --- Africa ---
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", direction: "ltr", flag: "🇰🇪", region: "Africa" },
  { code: "am", name: "Amharic", nativeName: "አማርኛ", direction: "ltr", flag: "🇪🇹", region: "Africa" },
  { code: "yo", name: "Yoruba", nativeName: "Èdè Yorùbá", direction: "ltr", flag: "🇳🇬", region: "Africa" },
  { code: "ig", name: "Igbo", nativeName: "Asụsụ Igbo", direction: "ltr", flag: "🇳🇬", region: "Africa" },
  { code: "ha", name: "Hausa", nativeName: "Harshen Hausa", direction: "ltr", flag: "🇳🇬", region: "Africa" },
  { code: "zu", name: "Zulu", nativeName: "isiZulu", direction: "ltr", flag: "🇿🇦", region: "Africa" },
  { code: "xh", name: "Xhosa", nativeName: "isiXhosa", direction: "ltr", flag: "🇿🇦", region: "Africa" },
  { code: "af", name: "Afrikaans", nativeName: "Afrikaans", direction: "ltr", flag: "🇿🇦", region: "Africa" },
  { code: "so", name: "Somali", nativeName: "Soomaaliga", direction: "ltr", flag: "🇸🇴", region: "Africa" }
];

export const translations: Partial<Record<SupportedLanguage, TranslationSchema>> & { en: TranslationSchema } = {
  en: {
    nav: {
      home: "Home",
      search: "Search",
      discover: "Discover",
      following: "Following",
      messages: "Messages",
      notifications: "Notifications",
      bookmarks: "Bookmarks",
      business: "For Businesses",
      profile: "Profile",
      more: "More",
      record_review: "Review",
      language: "Language"
    },
    common: {
      back: "Back",
      close: "Close",
      save: "Save",
      cancel: "Cancel",
      confirm: "Confirm",
      delete: "Delete",
      edit: "Edit",
      share: "Share",
      search: "Search...",
      loading: "Loading...",
      verified: "Verified",
      follow: "Follow",
      following: "Following",
      unfollow: "Unfollow",
      directions: "Directions",
      website: "Website",
      call: "Call",
      chat: "Chat",
      view_all: "View All",
      see_more: "See more",
      see_less: "See less",
      copy_link: "Copy Link",
      copied: "Copied!",
      report: "Report",
      settings: "Settings",
      select_language: "Select Language",
      system_default: "System Default",
      success: "Success",
      error: "Error",
      retry: "Retry",
      just_now: "Just now",
      ago: "ago",
      hours: "hours",
      days: "days",
      minutes: "minutes"
    },
    video: {
      by: "By",
      unmute: "Tap to Unmute",
      mute: "Mute",
      likes: "Likes",
      comments: "Comments",
      shares: "Shares",
      bookmarks: "Bookmarks",
      no_reviews: "No video reviews yet",
      record_first: "Be the first creator to record a review!",
      exceptional: "5.0 • Exceptional",
      great: "4.0 • Great",
      average: "3.0 • Average",
      poor: "2.0 • Poor",
      terrible: "1.0 • Terrible",
      more_options: "More Options",
      delete_review: "Delete Review",
      report_video: "Report Inappropriate Video"
    },
    place: {
      reviews: "Video Reviews",
      about: "About",
      photos: "Photos",
      menu: "Menu",
      claim_business: "Claim & Verify Business",
      suggest_edits: "Suggest Edits",
      claimed: "Claimed & Verified",
      unclaimed: "Unclaimed Place",
      verified_location: "Verified Location",
      total_reviews: "total reviews",
      rating: "Rating",
      about_business: "About this business",
      chat_unavailable: "Direct Messaging Unavailable"
    },
    record: {
      title: "Record Video Review",
      select_place: "Select Business or Place",
      start_recording: "Record Review",
      stop_recording: "Stop Recording",
      re_record: "Re-record",
      publish_review: "Publish Review",
      publishing: "Publishing your review...",
      recording: "Recording live review...",
      time_left: "remaining",
      face_not_detected: "Face not detected in camera. Please face the front camera.",
      camera_permission: "Please allow camera permissions to record authentic video reviews.",
      content_safety_violation: "Content Safety Violation: Recording blocked for inappropriate visual content.",
      front_camera_only: "Front selfie camera required for verified reviews",
      one_minute_limit: "60s Max Limit"
    },
    share: {
      share_title: "Share",
      share_subtitle: "Share this video review with friends",
      whatsapp: "WhatsApp",
      twitter: "X (Twitter)",
      facebook: "Facebook",
      telegram: "Telegram",
      email: "Email",
      copy: "Copy Link"
    },
    comments: {
      title: "Comments",
      placeholder: "Add a friendly comment...",
      post: "Post",
      reply: "Reply",
      no_comments: "No comments yet",
      be_first: "Be the first to share your thoughts!"
    },
    business: {
      for_businesses: "Yoouz for Businesses",
      claim_now: "Claim Your Business Profile",
      manage_profile: "Manage Business",
      dashboard: "Owner Dashboard",
      analytics: "Video Insights",
      upgrade: "Upgrade Plan"
    },
    trustCenter: {
      hub: "Yoouz Hub",
      subtitle: "Trust, Verification & Support",
      title: "Knowledge & Trust Center",
      pillarsTitle: "Proof of Presence. Real People. Verified Places.",
      pillarsDesc: "Traditional text reviews are vulnerable to bot networks, fake accounts, and AI-generated reviews. Yoouz creates authentic trust by capturing short 60-second video reviews recorded exclusively through live device cameras.",
      strictRule: "STRICT RULE",
      rule1Title: "Live Front-Camera Only",
      rule1Desc: "No pre-recorded MP4 uploads or stock footage. Real customers capturing authentic experiences.",
      pillar2: "PILLAR 2",
      rule2Title: "60-Second Focus",
      rule2Desc: "Concise, high-impact video reviews that deliver immediate value in under one minute.",
      pillar3: "PILLAR 3",
      rule3Title: "3-Way Dialogue",
      rule3Desc: "Living comment threads connecting Reviewers, curious Viewers, and Verified Place Owners.",
      trustProtocol: "Trust Protocol",
      helpFaqs: "Help & FAQs",
      forBusinesses: "For Businesses",
      privacySecurity: "Privacy & Security",
      contactSupport: "Contact Support",
      theYoouzStandard: "The Yoouz Standard",
      bento1Title: "Immutable Face & Voice Identity",
      bento1Desc: "Every reviewer builds an open visual portfolio. Real face, verified voice, and transparent history give viewers instant confidence.",
      bento1Sub: "Inspect any profile immediately",
      bento2Title: "Interactive Community Dialogue",
      bento2Desc: "Reviews are not static one-way monologues. Viewers ask live questions and the community validates together.",
      bento2Sub: "Crowdsourced community validation",
      bento3Title: "Official Domain Verification",
      bento3Desc: "Place owners claim their domain, reply with verified badges, and pin official solutions.",
      bento3Sub: "Pinned owner responses",
      bento4Title: "No Pay-To-Remove Guarantee",
      bento4Desc: "Unlike legacy review portals, Yoouz guarantees all verified reviews stay transparent and tamper-proof.",
      bento4Sub: "100% equal rules for all",
      verifiedMember: "Verified Member • Active Contributor",
      searchFaqsPlaceholder: "Search answers by keyword or topic...",
      categoryAll: "All Topics",
      categoryReviewers: "For Reviewers",
      categoryBusiness: "For Businesses",
      categoryTrust: "Trust & Safety",
      categoryTechnical: "Technical",
      noMatchingFaqs: "No matching questions found",
      tryDifferentKeywords: "Try searching with different keywords or switch categories.",
      clearFilter: "Clear search query",
      businessHeroTitle: "Turn Authentic Customer Reviews into Your Growth Engine",
      businessHeroDesc: "Yoouz provides verified business owners with direct tools to manage place pages, engage in video comment threads, and display tamper-proof trust signals.",
      verifiedOwnerBadgeTitle: "Verified Owner Badge",
      verifiedOwnerBadgeDesc: "Verify your domain via DNS or HTML meta-tag to unlock exclusive official badges on all replies.",
      pinnedSolutionsTitle: "Pinned Solutions & Feedback",
      pinnedSolutionsDesc: "Pin resolution videos to address customer feedback transparently and build long-term reputation.",
      embedTrustFeedsTitle: "Embed Live Video Feeds",
      embedTrustFeedsDesc: "Showcase genuine 60-second video reviews directly on your website with zero-latency streaming widgets.",
      requestVerification: "Request Domain Verification",
      readyToVerify: "Ready to claim and verify your business?",
      privacySecurityTitle: "Google-Grade Privacy & Security Architecture",
      googleVerified: "Google OAuth • Zero Passwords Stored",
      privacySummary: "Yoouz is built with privacy-first standards. We use Google OAuth for secure passwordless authentication, process camera streams in real-time without photo library harvesting, and enforce San Francisco, California USA governing jurisdiction.",
      updatedDate: "Updated Aug 24, 2026",
      privacyPolicyTitle: "Privacy Policy",
      privacyPolicyDesc: "Covers Google profile data handling, real-time camera/mic usage, zero password storage, zero data selling, and your right to data deletion.",
      readPrivacyPolicy: "Read Privacy Policy",
      termsConditionsTitle: "Terms & Conditions",
      termsConditionsDesc: "Covers live recording standards, anti-scraping rules, business streaming licenses, limitation of liability, and San Francisco, CA jurisdiction.",
      readTermsConditions: "Read Terms & Conditions",
      authPillarTitle: "Passwordless Email Security",
      authPillarDesc: "We never store passwords. All logins use secure verification codes sent to your verified email with encrypted HTTPS transport.",
      recordingPillarTitle: "Real-Time Camera Only",
      recordingPillarDesc: "Camera and microphone data are accessed strictly during active recording. We never access photo libraries or pre-recorded storage.",
      zeroSellingPillarTitle: "No Selling or Renting",
      zeroSellingPillarDesc: "We never sell, rent, or trade your personal data to third parties. Data is shared solely with trusted cloud infrastructure providers.",
      jurisdictionPillarTitle: "San Francisco, California, USA",
      jurispillarDesc: "Platform terms and privacy policies are governed by the laws of the State of California, USA with jurisdiction in San Francisco, CA.",
      allSystemsOperational: "All Systems Operational",
      dangerZoneTitle: "Danger Zone: Delete Account Profile",
      dangerZoneDesc: "Permanently erase your user profile details, bio, avatar, and cached session information. This action cannot be reversed.",
      deleteAccountBtn: "Delete Account",
      deleteAccountWarning: "Confirming will sign you out immediately and purge your profile record.",
      supportDeskTitle: "Official Yoouz Support Desk",
      supportDeskDesc: "Submit support inquiries, business domain claim requests, or report community guideline infractions.",
      fullNameLabel: "Your Full Name *",
      emailLabel: "Email Address *",
      categoryLabel: "Category *",
      categorySupport: "General Account / Technical Support",
      categoryVerification: "Business / Domain Ownership Verification",
      categoryGuidelines: "Report Policy Violation / Fake Content",
      categoryPartnership: "API & Partnership Inquiries",
      websiteDomainLabel: "Website Domain (Optional)",
      messageLabel: "Message Details *",
      messagePlaceholder: "Describe your inquiry or request in detail...",
      attachFilesLabel: "Attach Screenshots or Verification Proof (Optional)",
      dragDropPrompt: "Drag & drop files here, or browse files",
      browseFiles: "browse files",
      fileLimitHint: "PNG, JPG, WEBP, PDF or DOC (Max 3 files, up to 2MB each)",
      submitRequest: "Submit Secure Request",
      submitting: "Submitting...",
      inquiryReceivedTitle: "Inquiry Received Successfully",
      inquiryReceivedDesc: "Thank you for contacting Yoouz. Your message has been logged securely in our support queue. Our team reviews all requests within 24 hours.",
      sendAnotherInquiry: "Send Another Inquiry",
      deleteConfirmTitle: "Confirm Profile Deletion",
      deleteConfirmDesc: "This is a permanent operation. To delete profile, please type DELETE below.",
      typeDeletePlaceholder: "Type DELETE to confirm",
      permanentlyDelete: "Permanently Delete",
      deleting: "Deleting..."
    },
    discover: {
      title: "Discover Reviewers",
      searchPlaceholder: "Search reviewer by name...",
      searchResults: "Search Results",
      tapToView: "Tap card to view profile",
      noReviewersFound: "No reviewers found",
      tryDifferentSearch: "Try searching with a different name.",
      reviews: "Reviews",
      followers: "Followers"
    },
    auth: {
      help: "Help",
      signInTitle: "Sign in to Yoouz",
      signInSubtitle: "Enter your email to receive a secure 6-digit confirmation code. Passwordless, instant, and private.",
      recordTitle: "Sign in to Record a Review",
      recordSubtitle: "Join verified creators sharing real 60-second video reviews across authentic local places.",
      followingTitle: "Sign in to Follow Reviewers",
      followingSubtitle: "Keep track of your favorite creators and discover new spots as they post reviews.",
      messagesTitle: "Sign in to Access Messages",
      messagesSubtitle: "Directly chat with reviewers and verified business owners across your community.",
      notificationsTitle: "Sign in for Live Notifications",
      notificationsSubtitle: "Stay updated when people like, comment, or interact with your video reviews.",
      bookmarksTitle: "Sign in to Save Places",
      bookmarksSubtitle: "Bookmark your favorite restaurants, cafés, and places to visit later.",
      profileTitle: "Sign in to Your Profile",
      profileSubtitle: "Access your published reviews, follower stats, and customize your creator profile.",
      commentTitle: "Sign in to Join the Discussion",
      commentSubtitle: "Share your thoughts, ask questions, and engage directly with the community.",
      claimTitle: "Sign in to Claim Business",
      claimSubtitle: "Verify ownership of your place, respond to video reviews, and engage customers.",
      checkEmail: "Check your email",
      sentCodeTo: "We sent a 6-digit confirmation code to",
      completeProfileTitle: "Complete your profile",
      completeProfileSubtitle: "Enter your name and location for verified reviews.",
      emailAddress: "Email Address",
      emailPlaceholder: "you@example.com",
      continueEmail: "Continue with Email",
      invalidEmailError: "Please enter a valid email address.",
      verificationCode: "6-Digit Verification Code",
      digitsCount: "digits",
      verifyCode: "Verify Code",
      changeEmail: "Change Email",
      resendCode: "Resend Code",
      firstName: "First Name",
      lastName: "Last Name",
      country: "Country",
      city: "City",
      regionProvince: "Region / Province",
      selectCity: "Select City",
      completeProfileEnter: "Complete Profile & Enter",
      termsAgreementPrefix: "By continuing, you agree to Yoouz's",
      termsOfService: "Terms of Service",
      and: "and",
      privacyPolicy: "Privacy Policy",
      copyright: "© 2026 Yoouz. Real People. Real Reviews."
    },
    businessAuth: {
      title: "Sign in to Yoouz Business",
      subtitle: "Claim your business, respond to video reviews, and engage customers as the verified owner.",
      workEmail: "Work Email",
      htmlCodeTag: "HTML Code Tag",
      instant: "Instant",
      emailPlaceholder: "you@yourcompany.com",
      continueMagicLink: "Continue with Magic Link",
      exit: "Exit",
      change: "Change",
      switchToHtmlTag: "Switch to HTML Code Tag verification",
      checkInbox: "Check Your Inbox",
      codeSentTo: "Enter the 6-digit verification code sent to",
      verificationCode: "Verification Code",
      verifyCode: "Verify Code",
      resendCode: "Resend Code",
      htmlVerificationTitle: "HTML Meta Tag Verification",
      searchPlaceLabel: "Search & Select Business to Claim",
      searchPlacePlaceholder: "Search your place name or address...",
      pasteTagInstruction: "Copy verification code and paste it inside the <head> tag of your website:",
      copyTag: "Copy Meta Tag",
      copied: "Copied!",
      verifyDomain: "Verify Domain Tag",
      verifying: "Verifying..."
    },
    legal: {
      termsConditions: "Terms & Conditions",
      privacyPolicy: "Privacy Policy",
      supportDesk: "Support Desk",
      networkLocation: "Yoouz Trust Network • San Francisco, CA",
      copyright: "© 2026 Yoouz Inc. All rights reserved. Real People. Real Reviews."
    },
    settings: {
      language_preference: "Language & Regional Settings",
      language_subtitle: "Switch instantly between 64 supported languages with full translation, RTL bidirectional rendering, and localized formatting.",
      search_languages_placeholder: "Search from 64 languages..."
    }
  },
  ar: {
    nav: {
      home: "الرئيسية",
      search: "بحث",
      discover: "استكشف",
      following: "المتابَعون",
      messages: "الرسائل",
      notifications: "الإشعارات",
      bookmarks: "المحفوظات",
      business: "للشركات والأعمال",
      profile: "الملف الشخصي",
      more: "المزيد",
      record_review: "تسجيل تقييم",
      language: "اللغة"
    },
    common: {
      back: "رجوع",
      close: "إغلاق",
      save: "حفظ",
      cancel: "إلغاء",
      confirm: "تأكيد",
      delete: "حذف",
      edit: "تعديل",
      share: "مشاركة",
      search: "بحث...",
      loading: "جاري التحميل...",
      verified: "موثق",
      follow: "متابعة",
      following: "تتابعه",
      unfollow: "إلغاء المتابعة",
      directions: "الاتجاهات",
      website: "الموقع",
      call: "اتصال",
      chat: "محادثة",
      view_all: "عرض الكل",
      see_more: "المزيد",
      see_less: "أقل",
      copy_link: "نسخ الرابط",
      copied: "تم النسخ!",
      report: "إبلاغ",
      settings: "الإعدادات",
      select_language: "اختر اللغة",
      system_default: "تلقائي حسب النظام",
      success: "تم بنجاح",
      error: "خطأ",
      retry: "إعادة المحاولة",
      just_now: "الآن",
      ago: "مضت",
      hours: "ساعات",
      days: "أيام",
      minutes: "دقائق"
    },
    video: {
      by: "بواسطة",
      unmute: "انقر للتشغيل الصوتي",
      mute: "كتم الصوت",
      likes: "الإعجابات",
      comments: "التعليقات",
      shares: "المشاركات",
      bookmarks: "المحفوظات",
      no_reviews: "لا توجد تقييمات فيديو حتى الآن",
      record_first: "كن أول صانع محتوى يسجل مراجعة فيديو!",
      exceptional: "5.0 • استثنائي",
      great: "4.0 • رائع",
      average: "3.0 • متوسط",
      poor: "2.0 • ضعيف",
      terrible: "1.0 • سيء جداً",
      more_options: "خيارات إضافية",
      delete_review: "حذف التقييم",
      report_video: "إبلاغ عن محتوى غير لائق"
    },
    place: {
      reviews: "مراجعات الفيديو",
      about: "حول المكان",
      photos: "الصور",
      menu: "القائمة",
      claim_business: "توثيق وملكية المكان",
      suggest_edits: "اقتراح تعديلات",
      claimed: "مكان موثق ومعتمد",
      unclaimed: "مكان غير موثق",
      verified_location: "موقع مؤكد",
      total_reviews: "إجمالي المراجعات",
      rating: "التقييم",
      about_business: "عن هذا النشاط التجاري",
      chat_unavailable: "المراسلة المباشرة غير متوفرة حالياً"
    },
    record: {
      title: "تسجيل مراجعة فيديو",
      select_place: "اختر النشاط التجاري أو المكان",
      start_recording: "تسجيل المراجعة",
      stop_recording: "إيقاف التسجيل",
      re_record: "إعادة التسجيل",
      publish_review: "نشر التقييم",
      publishing: "جاري نشر التقييم...",
      recording: "جاري التسجيل المباشر...",
      time_left: "متبقي",
      face_not_detected: "لم يتم التعرف على الوجه بالكاميرا. يرجى توجيه الكاميرا الأمامية للوجه.",
      camera_permission: "يرجى منح إذن الكاميرا لتسجيل مراجعات حقيقية.",
      content_safety_violation: "مخالفة معايير الأمان: تم حظر التسجيل لوجود محتوى غير لائق.",
      front_camera_only: "الكاميرا الأمامية فقط للمراجعات الموثوقة",
      one_minute_limit: "أقصى مدة 60 ثانية"
    },
    share: {
      share_title: "مشاركة",
      share_subtitle: "شارك تقييم الفيديو هذا مع أصدقائك",
      whatsapp: "واتساب",
      twitter: "إكس (تويتر)",
      facebook: "فيسبوك",
      telegram: "تيليجرام",
      email: "البريد الإلكتروني",
      copy: "نسخ الرابط"
    },
    comments: {
      title: "التعليقات",
      placeholder: "أضف تعليقاً إيجابياً ومفيداً...",
      post: "نشر",
      reply: "رد",
      no_comments: "لا توجد تعليقات حتى الآن",
      be_first: "كن أول من يشارك رأيه!"
    },
    business: {
      for_businesses: "يوز للأعمال والشركات",
      claim_now: "توثيق ملفك التجاري",
      manage_profile: "إدارة النشاط التجاري",
      dashboard: "لوحة تحكم المالك",
      analytics: "إحصائيات وتفاعل الفيديو",
      upgrade: "ترقية الخطة"
    },
    trustCenter: {
      hub: "مركز Yoouz",
      subtitle: "الثقة والتوثيق والدعم",
      title: "مركز المعرفة والثقة",
      pillarsTitle: "إثبات الحضور. أشخاص حقيقيون. أماكن موثقة.",
      pillarsDesc: "التقييمات النصية التقليدية معرضة للروبوتات والحسابات الوهمية والذكاء الاصطناعي. يصنع Yoouz ثقة حقيقية عبر مراجعات فيديو مدتها 60 ثانية يتم تسجيلها حصرياً عبر كاميرا الهاتف المباشرة.",
      strictRule: "قاعدة صارمة",
      rule1Title: "الكاميرا الأمامية المباشرة فقط",
      rule1Desc: "لا نقبل مقاطع الفيديو المسجلة مسبقاً أو لقطات الأرشيف. عملاء حقيقيون يوثقون تجارب حقيقية.",
      pillar2: "الركيزة 2",
      rule2Title: "تركيز 60 ثانية",
      rule2Desc: "مراجعات فيديو موجزة ومؤثرة تقدم قيمة فورية في أقل من دقيقة.",
      pillar3: "الركيزة 3",
      rule3Title: "حوار ثلاثي الاتجاه",
      rule3Desc: "سلاسل تعليقات حية تربط بين المراجعين والمشاهدين وأصحاب الأماكن المعتمدين.",
      trustProtocol: "بروتوكول الثقة",
      helpFaqs: "المساعدة والأسئلة الشائعة",
      forBusinesses: "للأنشطة التجارية",
      privacySecurity: "الخصوصية والأمان",
      contactSupport: "الاتصال بالدعم",
      theYoouzStandard: "معيار Yoouz",
      bento1Title: "هوية الوجه والصوت غير قابلة للتزييف",
      bento1Desc: "يبني كل مراجع سجلاً مرئياً مفتوحاً. الوجه الحقيقي والصوت الموثق يمنحان المشاهدين ثقة فورية.",
      bento1Sub: "فحص أي ملف شخصي فوراً",
      bento2Title: "حوار مجتمعي تفاعلي",
      bento2Desc: "التقييمات ليست أحادية الاتجاه. يطرح المشاهدون أسئلة فورية ويتحقق المجتمع معاً.",
      bento2Sub: "تحقق مجتمعي جماعي",
      bento3Title: "توثيق النطاق الرسمي",
      bento3Desc: "يوثق أصحاب الأعمال نطاقاتهم ويردون بشارات رسمية ويثبتون الحلول في أعلى المحادثة.",
      bento3Sub: "ردود المالك المثبتة",
      bento4Title: "ضمان عدم الدفع مقابل الحذف",
      bento4Desc: "على عكس المواقع القديمة، يضمن Yoouz بقاء جميع المراجعات المعتمدة شفافة وغير قابلة للتلاعب.",
      bento4Sub: "قواعد متساوية بنسبة 100% للجميع",
      verifiedMember: "عضو موثق • مساهم نشط",
      searchFaqsPlaceholder: "ابحث في الإجابات بالكلمة المفتاحية أو الموضوع...",
      categoryAll: "جميع الموضوعات",
      categoryReviewers: "للمراجعين",
      categoryBusiness: "للشركات",
      categoryTrust: "الثقة والأمان",
      categoryTechnical: "تقني",
      noMatchingFaqs: "لم يتم العثور على أسئلة مطابقة",
      tryDifferentKeywords: "جرب البحث بكلمات مختلفة أو غيّر الفئة.",
      clearFilter: "مسح البحث",
      businessHeroTitle: "حوّل تقييمات الفيديو الموثقة إلى محرك نموك",
      businessHeroDesc: "يوفر Yoouz لأصحاب الأعمال المعتمدين أدوات مباشرة لإدارة صفحات الأماكن والتفاعل مع العملاء.",
      verifiedOwnerBadgeTitle: "شارة المالك المعتمد",
      verifiedOwnerBadgeDesc: "وثق نطاقك عبر DNS أو كود HTML للحصول على شارات رسمية مميزة في جميع الردود.",
      pinnedSolutionsTitle: "الحلول والردود المثبتة",
      pinnedSolutionsDesc: "ثبت فيديوهات التوضيح للرد على استفسارات العملاء بشفافية وبناء سمعة طويلة الأمد.",
      embedTrustFeedsTitle: "تضمين خلاصات الفيديو المباشرة",
      embedTrustFeedsDesc: "اعرض مراجعات العملاء الحقيقية مدتها 60 ثانية مباشرة على موقعك بدون تأخير.",
      requestVerification: "طلب توثيق النطاق",
      readyToVerify: "جاهز لتوثيق نشاطك التجاري؟",
      privacySecurityTitle: "بنية خصوصية وأمان بمعايير جوجل",
      googleVerified: "تسجيل دخول Google • لا نخزن كلمات مرور",
      privacySummary: "تم بناء Yoouz وفقاً لأعلى معايير الخصوصية. نستخدم مصادقة Google الآمنة، ونعالج بث الكاميرا في الوقت الفعلي فقط دون الوصول إلى مكتبة الصور الخاصة بك، وتخضع خدماتنا لقوانين سان فرانسيسكو، كاليفورنيا.",
      updatedDate: "تحديث: أغسطس 2026",
      privacyPolicyTitle: "سياسة الخصوصية",
      privacyPolicyDesc: "تغطي معالجة بيانات الحساب، واستخدام الكاميرا والميكروفون المباشر، وعدم بيع البيانات إطلاقاً، وحقك في حذف الحساب.",
      readPrivacyPolicy: "قراءة سياسة الخصوصية",
      termsConditionsTitle: "الشروط والأحكام",
      termsConditionsDesc: "تغطي معايير التسجيل المباشر، وحظر جمع البيانات، ورخص البث، وحدود المسؤولية القانونية.",
      readTermsConditions: "قراءة الشروط والأحكام",
      authPillarTitle: "أمان البريد بدون كلمة مرور",
      authPillarDesc: "لا نخزن كلمات مرور أبداً. تتم عمليات تسجيل الدخول عبر رموز تأكيد آمنة ترسل إلى بريدك المعتمد.",
      recordingPillarTitle: "الكاميرا المباشرة فقط",
      recordingPillarDesc: "يتم الوصول إلى الكاميرا والميكروفون فقط أثناء التسجيل النشط. لا نصل أبداً إلى معرض الصور.",
      zeroSellingPillarTitle: "لا نبيع بياناتك أبداً",
      zeroSellingPillarDesc: "لا نقوم ببيع أو تأجير بياناتك الشخصية لأي طرف ثالث نهائياً.",
      jurisdictionPillarTitle: "سان فرانسيسكو، كاليفورنيا، الولايات المتحدة",
      jurispillarDesc: "تخضع شروط المنصة وسياسات الخصوصية لقوانين ولاية كاليفورنيا، الولايات المتحدة الأمريكية.",
      allSystemsOperational: "جميع الأنظمة تعمل بكفاءة",
      dangerZoneTitle: "منطقة الخطر: حذف الملف الشخصي",
      dangerZoneDesc: "حذف بيانات حسابك وصورتك وسجل جلساتك نهائياً. لا يمكن التراجع عن هذا الإجراء.",
      deleteAccountBtn: "حذف الحساب نهائياً",
      deleteAccountWarning: "التأكيد سيقوم بتسجيل خروجك فوراً وحذف ملفك الشخصي بالكامل.",
      supportDeskTitle: "مكتب دعم Yoouz الرسمي",
      supportDeskDesc: "أرسل استفسارات الدعم، أو طلبات توثيق النطاق، أو أبلغ عن مخالفات إرشادات المجتمع.",
      fullNameLabel: "الاسم الكامل *",
      emailLabel: "البريد الإلكتروني *",
      categoryLabel: "الفئة *",
      categorySupport: "دعم فني / استفسار عام",
      categoryVerification: "توثيق ملكية النشاط / النطاق",
      categoryGuidelines: "الإبلاغ عن محتوى مزيف أو مخالف",
      categoryPartnership: "استفسارات الشراكات والـ API",
      websiteDomainLabel: "نطاق الموقع (اختياري)",
      messageLabel: "تفاصيل الرسالة *",
      messagePlaceholder: "صف استفسارك أو طلبك بالتفصيل...",
      attachFilesLabel: "إرفاق لقطات شاشة أو إثبات توثيق (اختياري)",
      dragDropPrompt: "اسحب وأفلت الملفات هنا، أو تصفح الملفات",
      browseFiles: "تصفح الملفات",
      fileLimitHint: "PNG, JPG, WEBP, PDF أو DOC (بحد أقصى 3 ملفات، حتى 2MB لكل ملف)",
      submitRequest: "إرسال الطلب الآمن",
      submitting: "جارٍ الإرسال...",
      inquiryReceivedTitle: "تم استلام الطلب بنجاح",
      inquiryReceivedDesc: "شكراً لتواصلك مع Yoouz. تم تسجيل رسالتك بأمان في قائمة الانتظار. يراجع فريقنا جميع الطلبات خلال 24 ساعة.",
      sendAnotherInquiry: "إرسال طلب آخر",
      deleteConfirmTitle: "تأكيد حذف الحساب",
      deleteConfirmDesc: "هذه العملية نهائية. لحذف الحساب، يرجى كتابة DELETE أدناه.",
      typeDeletePlaceholder: "اكتب DELETE للتأكيد",
      permanentlyDelete: "حذف نهائي",
      deleting: "جارٍ الحذف..."
    },
    discover: {
      title: "اكتشف المراجعين",
      searchPlaceholder: "ابحث عن مراجع بالاسم...",
      searchResults: "نتائج البحث",
      tapToView: "اضغط لعرض الملف الشخصي",
      noReviewersFound: "لم يتم العثور على مراجعين",
      tryDifferentSearch: "جرب البحث باسم مختلف.",
      reviews: "مراجعات",
      followers: "متابعون"
    },
    auth: {
      help: "مساعدة",
      signInTitle: "تسجيل الدخول إلى Yoouz",
      signInSubtitle: "أدخل بريدك الإلكتروني لتلقي رمز تأكيد آمن مكون من 6 أرقام. فوري وبدون كلمة مرور.",
      recordTitle: "تسجيل الدخول لتسجيل مراجعة",
      recordSubtitle: "انضم إلى المراجعين الموثقين وشارك مراجعات فيديو حقيقية مدتها 60 ثانية.",
      followingTitle: "تسجيل الدخول لمتابعة المراجعين",
      followingSubtitle: "تابع منشئي المحتوى المفضلين لديك واكتشف أماكن جديدة لحظة نشر مراجعاتهم.",
      messagesTitle: "تسجيل الدخول للوصول إلى الرسائل",
      messagesSubtitle: "تواصل مباشرة مع المراجعين وأصحاب الأعمال المعتمدين.",
      notificationsTitle: "تسجيل الدخول للتنبيهات المباشرة",
      notificationsSubtitle: "ابق على اطلاع عند إعجاب الآخرين أو تعليقهم على مراجعاتك.",
      bookmarksTitle: "تسجيل الدخول لحفظ الأماكن",
      bookmarksSubtitle: "احفظ المطاعم والمقاهي المفضلة لديك لزيارتها لاحقاً.",
      profileTitle: "تسجيل الدخول إلى ملفك الشخصي",
      profileSubtitle: "تصفح مراجعاتك المنشورة، إحصائيات المتابعين، وخصص ملفك الشخصي.",
      commentTitle: "تسجيل الدخول للمشاركة في النقاش",
      commentSubtitle: "شارك أفكارك، اطرح الأسئلة وتفاعل مباشرة مع المجتمع.",
      claimTitle: "تسجيل الدخول لتوثيق نشاطك التجاري",
      claimSubtitle: "وثق ملكية مكانك، ورد على مراجعات الفيديو وتفاعل مع العملاء.",
      checkEmail: "تحقق من بريدك الإلكتروني",
      sentCodeTo: "أرسلنا رمز تأكيد مكون من 6 أرقام إلى",
      completeProfileTitle: "أكمل ملفك الشخصي",
      completeProfileSubtitle: "أدخل اسمك وموقعك للمراجعات الموثقة.",
      emailAddress: "البريد الإلكتروني",
      emailPlaceholder: "you@example.com",
      continueEmail: "المتابعة بالبريد الإلكتروني",
      invalidEmailError: "يرجى إدخال بريد إلكتروني صحيح.",
      verificationCode: "رمز التحقق المكون من 6 أرقام",
      digitsCount: "أرقام",
      verifyCode: "تحقق من الرمز",
      changeEmail: "تغيير البريد الإلكتروني",
      resendCode: "إعادة إرسال الرمز",
      firstName: "الاسم الأول",
      lastName: "اسم العائلة",
      country: "الدولة",
      city: "المدينة",
      regionProvince: "المنطقة / المحافظة",
      selectCity: "اختر المدينة",
      completeProfileEnter: "إكمال الملف والدخول",
      termsAgreementPrefix: "بالمتابعة، فإنك توافق على",
      termsOfService: "شروط الخدمة",
      and: "و",
      privacyPolicy: "سياسة الخصوصية",
      copyright: "© 2026 Yoouz. أشخاص حقيقيون. تقييمات حقيقية."
    },
    businessAuth: {
      title: "تسجيل الدخول إلى Yoouz للأعمال",
      subtitle: "وثق نشاطك التجاري، ورد على مراجعات الفيديو وتفاعل مع العملاء كمالك معتمد.",
      workEmail: "البريد الإلكتروني للعمل",
      htmlCodeTag: "كود HTML Meta Tag",
      instant: "فوري",
      emailPlaceholder: "you@yourcompany.com",
      continueMagicLink: "المتابعة بالرابط السحري",
      exit: "خروج",
      change: "تغيير",
      switchToHtmlTag: "التحويل للتوثيق عبر كود HTML",
      checkInbox: "تحقق من بريدك الوارد",
      codeSentTo: "أدخل رمز التحقق المكون من 6 أرقام المرسل إلى",
      verificationCode: "رمز التحقق",
      verifyCode: "تأكيد الرمز",
      resendCode: "إعادة إرسال الرمز",
      htmlVerificationTitle: "التوثيق عبر كود HTML Meta Tag",
      searchPlaceLabel: "ابحث واختر النشاط التجاري لتوثيقه",
      searchPlacePlaceholder: "ابحث باسم المكان أو العنوان...",
      pasteTagInstruction: "انسخ كود التوثيق والصقه داخل وسم <head> في موقعك الإلكتروني:",
      copyTag: "نسخ كود Meta Tag",
      copied: "تم النسخ!",
      verifyDomain: "توثيق كود النطاق",
      verifying: "جارٍ التحقق..."
    },
    legal: {
      termsConditions: "الشروط والأحكام",
      privacyPolicy: "سياسة الخصوصية",
      supportDesk: "مكتب الدعم",
      networkLocation: "شبكة ثقة Yoouz • سان فرانسيسكو، كاليفورنيا",
      copyright: "© 2026 Yoouz Inc. جميع الحقوق محفوظة. أشخاص حقيقيون. تقييمات حقيقية."
    },
    settings: {
      language_preference: "إعدادات اللغة والمنطقة",
      language_subtitle: "التبديل فوراً بين 64 لغة مدعومة مع ترجمة كاملة ودعم الكتابة من اليمين لليسار (RTL).",
      search_languages_placeholder: "ابحث من بين 64 لغة..."
    }
  },
  es: {
    nav: {
      home: "Inicio",
      search: "Buscar",
      discover: "Descubrir",
      following: "Siguiendo",
      messages: "Mensajes",
      notifications: "Notificaciones",
      bookmarks: "Guardados",
      business: "Para Empresas",
      profile: "Perfil",
      more: "Más",
      record_review: "Reseña",
      language: "Idioma"
    },
    common: {
      back: "Volver",
      close: "Cerrar",
      save: "Guardar",
      cancel: "Cancelar",
      confirm: "Confirmar",
      delete: "Eliminar",
      edit: "Editar",
      share: "Compartir",
      search: "Buscar...",
      loading: "Cargando...",
      verified: "Verificado",
      follow: "Seguir",
      following: "Siguiendo",
      unfollow: "Dejar de seguir",
      directions: "Cómo llegar",
      website: "Sitio web",
      call: "Llamar",
      chat: "Chat",
      view_all: "Ver todo",
      see_more: "Ver más",
      see_less: "Ver menos",
      copy_link: "Copiar enlace",
      copied: "¡Copiado!",
      report: "Reportar",
      settings: "Configuración",
      select_language: "Seleccionar idioma",
      system_default: "Predeterminado del sistema",
      success: "Éxito",
      error: "Error",
      retry: "Reintentar",
      just_now: "Hace un momento",
      ago: "hace",
      hours: "horas",
      days: "días",
      minutes: "minutos"
    },
    video: {
      by: "Por",
      unmute: "Toca para activar sonido",
      mute: "Silenciar",
      likes: "Me gusta",
      comments: "Comentarios",
      shares: "Compartidos",
      bookmarks: "Guardados",
      no_reviews: "Aún no hay reseñas en video",
      record_first: "¡Sé el primer creador en publicar una reseña!",
      exceptional: "5.0 • Excepcional",
      great: "4.0 • Excelente",
      average: "3.0 • Aceptable",
      poor: "2.0 • Regular",
      terrible: "1.0 • Malo",
      more_options: "Más opciones",
      delete_review: "Eliminar reseña",
      report_video: "Reportar video inapropiado"
    },
    place: {
      reviews: "Reseñas en Video",
      about: "Información",
      photos: "Fotos",
      menu: "Menú",
      claim_business: "Reclamar y Verificar Negocio",
      suggest_edits: "Sugerir cambios",
      claimed: "Negocio Verificado",
      unclaimed: "Negocio sin verificar",
      verified_location: "Ubicación verificada",
      total_reviews: "reseñas totales",
      rating: "Calificación",
      about_business: "Sobre este negocio",
      chat_unavailable: "Mensajes directos no disponibles"
    },
    record: {
      title: "Grabar Reseña en Video",
      select_place: "Seleccionar negocio o lugar",
      start_recording: "Grabar Reseña",
      stop_recording: "Detener Grabación",
      re_record: "Volver a grabar",
      publish_review: "Publicar Reseña",
      publishing: "Publicando reseña...",
      recording: "Grabando en vivo...",
      time_left: "restante",
      face_not_detected: "Rostro no detectado. Por favor mira a la cámara frontal.",
      camera_permission: "Permite el acceso a la cámara para grabar reseñas auténticas.",
      content_safety_violation: "Violación de seguridad: Grabación bloqueada por contenido inapropiado.",
      front_camera_only: "Cámara frontal obligatoria para reseñas verificadas",
      one_minute_limit: "Máximo 60 segundos"
    },
    share: {
      share_title: "Compartir",
      share_subtitle: "Comparte esta video-reseña con tus amigos",
      whatsapp: "WhatsApp",
      twitter: "X (Twitter)",
      facebook: "Facebook",
      telegram: "Telegram",
      email: "Correo",
      copy: "Copiar enlace"
    },
    comments: {
      title: "Comentarios",
      placeholder: "Añade un comentario amable...",
      post: "Publicar",
      reply: "Responder",
      no_comments: "Aún no hay comentarios",
      be_first: "¡Sé el primero en comentar!"
    },
    business: {
      for_businesses: "Yoouz para Empresas",
      claim_now: "Reclamar perfil de negocio",
      manage_profile: "Administrar negocio",
      dashboard: "Panel de control",
      analytics: "Métricas de video",
      upgrade: "Mejorar plan"
    },
    trustCenter: {
      hub: "Centro Yoouz",
      subtitle: "Confianza, Verificación y Soporte",
      title: "Centro de Conocimiento y Confianza",
      pillarsTitle: "Prueba de Presencia. Personas Reales. Lugares Verificados.",
      pillarsDesc: "Las reseñas de texto tradicionales son vulnerables a redes de bots, cuentas falsas y reseñas generadas por IA. Yoouz crea confianza auténtica capturando reseñas de video cortas de 60 segundos grabadas exclusivamente a través de las cámaras en vivo del dispositivo.",
      strictRule: "REGLA ESTRICTA",
      rule1Title: "Solo Cámara Frontal en Vivo",
      rule1Desc: "Sin subidas de video MP4 pregrabados ni material de archivo. Clientes reales grabando experiencias auténticas.",
      pillar2: "PILAR 2",
      rule2Title: "Enfoque de 60 Segundos",
      rule2Desc: "Reseñas de video concisas y de alto impacto que ofrecen valor inmediato en menos de un minuto.",
      pillar3: "PILAR 3",
      rule3Title: "Diálogo de 3 Vías",
      rule3Desc: "Hilos de comentarios vivos que conectan a Reseñadores, Espectadores curiosos y Dueños de Lugares Verificados.",
      trustProtocol: "Protocolo de Confianza",
      helpFaqs: "Ayuda y Preguntas Frecuentes",
      forBusinesses: "Para Negocios",
      privacySecurity: "Privacidad y Seguridad",
      contactSupport: "Contactar Soporte",
      theYoouzStandard: "El Estándar Yoouz",
      bento1Title: "Identidad Inmutable de Rostro y Voz",
      bento1Desc: "Cada reseñador crea un portafolio visual abierto. Rostro real, voz verificada e historial transparente dan confianza instantánea a los espectadores.",
      bento1Sub: "Audita cualquier perfil de inmediato",
      bento2Title: "Diálogo Comunitario Interactivo",
      bento2Desc: "Las reseñas no son monólogos unidireccionales estáticos. Los espectadores hacen preguntas en tiempo real y la comunidad valida en conjunto.",
      bento2Sub: "Validación comunitaria colaborativa",
      bento3Title: "Verificación Oficial de Dominio",
      bento3Desc: "Los dueños de negocios reclaman su dominio, responden con insignias verificadas y fijan soluciones oficiales.",
      bento3Sub: "Respuestas fijadas de dueños",
      bento4Title: "Garantía Sin Pago por Eliminar",
      bento4Desc: "A diferencia de los portales antiguos, Yoouz garantiza que todas las reseñas verificadas permanezcan transparentes e inalterables.",
      bento4Sub: "100% reglas iguales para todos",
      verifiedMember: "Miembro Verificado • Colaborador Activo",
      searchFaqsPlaceholder: "Buscar respuestas por palabra clave o tema...",
      categoryAll: "Todos los Temas",
      categoryReviewers: "Para Reseñadores",
      categoryBusiness: "Para Negocios",
      categoryTrust: "Confianza y Seguridad",
      categoryTechnical: "Técnico",
      noMatchingFaqs: "No se encontraron preguntas coincidentes",
      tryDifferentKeywords: "Intenta buscar con palabras clave diferentes o cambia de categoría.",
      clearFilter: "Limpiar búsqueda",
      businessHeroTitle: "Convierte Reseñas Auténticas en tu Motor de Crecimiento",
      businessHeroDesc: "Yoouz proporciona a los dueños verificados herramientas directas para administrar perfiles, responder en hilos de video y mostrar señales de confianza a prueba de alteraciones.",
      verifiedOwnerBadgeTitle: "Insignia de Dueño Verificado",
      verifiedOwnerBadgeDesc: "Verifica tu dominio mediante DNS o etiqueta meta HTML para desbloquear insignias oficiales exclusivas en todas las respuestas.",
      pinnedSolutionsTitle: "Soluciones y Respuestas Fijadas",
      pinnedSolutionsDesc: "Fija videos explicativos para resolver dudas de clientes con transparencia y construir reputación a largo plazo.",
      embedTrustFeedsTitle: "Incrustar Feeds de Video en Vivo",
      embedTrustFeedsDesc: "Muestra reseñas auténticas en video de 60 segundos directamente en tu sitio web con widgets de streaming ultrarrápidos.",
      requestVerification: "Solicitar Verificación de Dominio",
      readyToVerify: "¿Listo para reclamar y verificar tu negocio?",
      privacySecurityTitle: "Arquitectura de Privacidad y Seguridad Grado Google",
      googleVerified: "Google OAuth • Cero Contraseñas Almacenadas",
      privacySummary: "Yoouz está construido con estándares de privacidad primero. Utilizamos autenticación segura con Google OAuth sin contraseñas, procesamos la cámara en tiempo real sin acceder a tu galería de fotos, y estamos bajo la jurisdicción de San Francisco, California, EE. UU.",
      updatedDate: "Actualizado: Ago 24, 2026",
      privacyPolicyTitle: "Política de Privacidad",
      privacyPolicyDesc: "Cubre el tratamiento de datos de perfil, uso de cámara/micrófono en tiempo real, cero venta de datos y tu derecho a la eliminación de tu cuenta.",
      readPrivacyPolicy: "Leer Política de Privacidad",
      termsConditionsTitle: "Términos y Condiciones",
      termsConditionsDesc: "Cubre los estándares de grabación en vivo, reglas contra el raspado de datos, licencias de streaming para negocios y limitación de responsabilidad.",
      readTermsConditions: "Leer Términos y Condiciones",
      authPillarTitle: "Seguridad sin Contraseñas por Email",
      authPillarDesc: "Nunca almacenamos contraseñas. Todos los inicios de sesión utilizan códigos de verificación seguros enviados a tu correo verificado mediante HTTPS cifrado.",
      recordingPillarTitle: "Solo Cámara en Tiempo Real",
      recordingPillarDesc: "El acceso a la cámara y micrófono se realiza estrictamente durante la grabación activa. Nunca accedemos a tus fotos o almacenamiento local.",
      zeroSellingPillarTitle: "Cero Venta o Alquiler de Datos",
      zeroSellingPillarDesc: "Nunca vendemos, alquilamos ni comerciamos con tus datos personales a terceros.",
      jurisdictionPillarTitle: "San Francisco, California, EE. UU.",
      jurispillarDesc: "Los términos de la plataforma y políticas de privacidad se rigen por las leyes del Estado de California, EE. UU., con jurisdicción en San Francisco, CA.",
      allSystemsOperational: "Todos los Sistemas Operativos",
      dangerZoneTitle: "Zona de Peligro: Eliminar Perfil de Cuenta",
      dangerZoneDesc: "Borra permanentemente los detalles de tu perfil, biografía, foto y datos de sesión. Esta acción no se puede deshacer.",
      deleteAccountBtn: "Eliminar Cuenta Permanentemente",
      deleteAccountWarning: "Confirmar cerrará tu sesión de inmediato y purgará tu registro de perfil.",
      supportDeskTitle: "Mesa de Ayuda Oficial Yoouz",
      supportDeskDesc: "Envía consultas de soporte, solicitudes de reclamo de dominio de negocio o reporta infracciones a las normas de la comunidad.",
      fullNameLabel: "Tu Nombre Completo *",
      emailLabel: "Correo Electrónico *",
      categoryLabel: "Categoría *",
      categorySupport: "Soporte General de Cuenta / Técnico",
      categoryVerification: "Verificación de Propiedad de Negocio / Dominio",
      categoryGuidelines: "Reportar Violación de Políticas / Contenido Falso",
      categoryPartnership: "Consultas de API y Asociaciones",
      websiteDomainLabel: "Dominio del Sitio Web (Opcional)",
      messageLabel: "Detalles del Mensaje *",
      messagePlaceholder: "Describe tu consulta o solicitud en detalle...",
      attachFilesLabel: "Adjuntar Capturas de Pantalla o Prueba de Verificación (Opcional)",
      dragDropPrompt: "Arrastra y suelta archivos aquí, o examina archivos",
      browseFiles: "examinar archivos",
      fileLimitHint: "PNG, JPG, WEBP, PDF o DOC (Máximo 3 archivos, hasta 2MB cada uno)",
      submitRequest: "Enviar Solicitud Segura",
      submitting: "Enviando...",
      inquiryReceivedTitle: "Consulta Recibida con Éxito",
      inquiryReceivedDesc: "Gracias por contactar a Yoouz. Tu mensaje ha sido registrado de forma segura en nuestra cola de soporte. Nuestro equipo revisa todas las solicitudes en 24 horas.",
      sendAnotherInquiry: "Enviar Otra Consulta",
      deleteConfirmTitle: "Confirmar Eliminación de Perfil",
      deleteConfirmDesc: "Esta es una operación permanente. Para eliminar el perfil, escribe DELETE abajo.",
      typeDeletePlaceholder: "Escribe DELETE para confirmar",
      permanentlyDelete: "Eliminar Permanentemente",
      deleting: "Eliminando..."
    },
    discover: {
      title: "Descubrir Reseñadores",
      searchPlaceholder: "Buscar reseñador por nombre...",
      searchResults: "Resultados de Búsqueda",
      tapToView: "Toca para ver el perfil",
      noReviewersFound: "No se encontraron reseñadores",
      tryDifferentSearch: "Intenta buscar con un nombre diferente.",
      reviews: "Reseñas",
      followers: "Seguidores"
    },
    auth: {
      help: "Ayuda",
      signInTitle: "Iniciar Sesión en Yoouz",
      signInSubtitle: "Ingresa tu correo para recibir un código de confirmación seguro de 6 dígitos. Sin contraseñas, instantáneo y privado.",
      recordTitle: "Inicia Sesión para Grabar una Reseña",
      recordSubtitle: "Únete a creadores verificados que comparten reseñas de video reales de 60 segundos en lugares auténticos.",
      followingTitle: "Inicia Sesión para Seguir Reseñadores",
      followingSubtitle: "Sigue la pista de tus creadores favoritos y descubre nuevos lugares a medida que publican reseñas.",
      messagesTitle: "Inicia Sesión para Acceder a Mensajes",
      messagesSubtitle: "Chatea directamente con reseñadores y dueños de negocios verificados en tu comunidad.",
      notificationsTitle: "Inicia Sesión para Notificaciones en Vivo",
      notificationsSubtitle: "Mantente al día cuando a otros les gusten, comenten o interactúen con tus video reseñas.",
      bookmarksTitle: "Inicia Sesión para Guardar Lugares",
      bookmarksSubtitle: "Guarda tus restaurantes, cafeterías y lugares favoritos para visitarlos más tarde.",
      profileTitle: "Inicia Sesión en tu Perfil",
      profileSubtitle: "Accede a tus reseñas publicadas, estadísticas de seguidores y personaliza tu perfil de creador.",
      commentTitle: "Inicia Sesión para Unirte a la Conversación",
      commentSubtitle: "Comparte tus opiniones, haz preguntas e interactúa directamente con la comunidad.",
      claimTitle: "Inicia Sesión para Reclamar Negocio",
      claimSubtitle: "Verifica la propiedad de tu lugar, responde a reseñas de video y conecta con clientes.",
      checkEmail: "Revisa tu Correo Electrónico",
      sentCodeTo: "Enviamos un código de confirmación de 6 dígitos a",
      completeProfileTitle: "Completa tu Perfil",
      completeProfileSubtitle: "Ingresa tu nombre y ubicación para publicar reseñas verificadas.",
      emailAddress: "Correo Electrónico",
      emailPlaceholder: "tu@ejemplo.com",
      continueEmail: "Continuar con Correo",
      invalidEmailError: "Por favor ingresa un correo electrónico válido.",
      verificationCode: "Código de Verificación de 6 Dígitos",
      digitsCount: "dígitos",
      verifyCode: "Verificar Código",
      changeEmail: "Cambiar Correo",
      resendCode: "Reenviar Código",
      firstName: "Nombre",
      lastName: "Apellido",
      country: "País",
      city: "Ciudad",
      regionProvince: "Región / Provincia",
      selectCity: "Seleccionar Ciudad",
      completeProfileEnter: "Completar Perfil y Entrar",
      termsAgreementPrefix: "Al continuar, aceptas los",
      termsOfService: "Términos de Servicio",
      and: "y la",
      privacyPolicy: "Política de Privacidad",
      copyright: "© 2026 Yoouz. Personas Reales. Reseñas Reales."
    },
    businessAuth: {
      title: "Iniciar Sesión en Yoouz Business",
      subtitle: "Reclama tu negocio, responde a reseñas de video y conecta con clientes como el dueño verificado.",
      workEmail: "Correo Corporativo",
      htmlCodeTag: "Etiqueta de Código HTML",
      instant: "Instantáneo",
      emailPlaceholder: "tu@tuempresa.com",
      continueMagicLink: "Continuar con Enlace Mágico",
      exit: "Salir",
      change: "Cambiar",
      switchToHtmlTag: "Cambiar a verificación por etiqueta HTML",
      checkInbox: "Revisa tu Bandeja de Entrada",
      codeSentTo: "Ingresa el código de verificación de 6 dígitos enviado a",
      verificationCode: "Código de Verificación",
      verifyCode: "Verificar Código",
      resendCode: "Reenviar Código",
      htmlVerificationTitle: "Verificación por Etiqueta Meta HTML",
      searchPlaceLabel: "Buscar y Seleccionar Negocio a Reclamar",
      searchPlacePlaceholder: "Busca el nombre o dirección de tu lugar...",
      pasteTagInstruction: "Copia el código de verificación y pégalo dentro de la etiqueta <head> de tu sitio web:",
      copyTag: "Copiar Etiqueta Meta",
      copied: "¡Copiado!",
      verifyDomain: "Verificar Etiqueta de Dominio",
      verifying: "Verificando..."
    },
    legal: {
      termsConditions: "Términos y Condiciones",
      privacyPolicy: "Política de Privacidad",
      supportDesk: "Mesa de Ayuda",
      networkLocation: "Red de Confianza Yoouz • San Francisco, CA",
      copyright: "© 2026 Yoouz Inc. Todos los derechos reservados. Personas Reales. Reseñas Reales."
    },
    settings: {
      language_preference: "Configuración de Idioma y Región",
      language_subtitle: "Cambia al instante entre 64 idiomas con traducción completa, compatibilidad bidireccional RTL y formato localizado.",
      search_languages_placeholder: "Buscar entre 64 idiomas..."
    }
  },
  fr: {
    nav: {
      home: "Accueil",
      search: "Rechercher",
      discover: "Découvrir",
      following: "Abonnements",
      messages: "Messages",
      notifications: "Notifications",
      bookmarks: "Favoris",
      business: "Pour les Pros",
      profile: "Profil",
      more: "Plus",
      record_review: "Avis",
      language: "Langue"
    },
    common: {
      back: "Retour",
      close: "Fermer",
      save: "Enregistrer",
      cancel: "Annuler",
      confirm: "Confirmer",
      delete: "Supprimer",
      edit: "Modifier",
      share: "Partager",
      search: "Rechercher...",
      loading: "Chargement...",
      verified: "Vérifié",
      follow: "Suivre",
      following: "Abonné",
      unfollow: "Se désabonner",
      directions: "Itinéraire",
      website: "Site web",
      call: "Appeler",
      chat: "Discussion",
      view_all: "Tout afficher",
      see_more: "Voir plus",
      see_less: "Voir moins",
      copy_link: "Copier le lien",
      copied: "Copié !",
      report: "Signaler",
      settings: "Paramètres",
      select_language: "Sélectionner la langue",
      system_default: "Par défaut du système",
      success: "Succès",
      error: "Erreur",
      retry: "Réessayer",
      just_now: "À l'instant",
      ago: "il y a",
      hours: "heures",
      days: "jours",
      minutes: "minutes"
    },
    video: {
      by: "Par",
      unmute: "Appuyez pour activer le son",
      mute: "Couper le son",
      likes: "J'aime",
      comments: "Commentaires",
      shares: "Partages",
      bookmarks: "Favoris",
      no_reviews: "Aucun avis vidéo pour l'instant",
      record_first: "Soyez le premier créateur à enregistrer un avis !",
      exceptional: "5.0 • Exceptionnel",
      great: "4.0 • Très bien",
      average: "3.0 • Moyen",
      poor: "2.0 • Médiocre",
      terrible: "1.0 • Terrible",
      more_options: "Plus d'options",
      delete_review: "Supprimer l'avis",
      report_video: "Signaler un contenu inapproprié"
    },
    place: {
      reviews: "Avis Vidéo",
      about: "À propos",
      photos: "Photos",
      menu: "Menu",
      claim_business: "Revendiquer et vérifier l'établissement",
      suggest_edits: "Suggérer une modification",
      claimed: "Établissement vérifié",
      unclaimed: "Non revendiqué",
      verified_location: "Lieu vérifié",
      total_reviews: "avis au total",
      rating: "Note",
      about_business: "À propos de cet établissement",
      chat_unavailable: "Messagerie directe non disponible"
    },
    record: {
      title: "Enregistrer un avis vidéo",
      select_place: "Sélectionner un lieu ou commerce",
      start_recording: "Enregistrer l'avis",
      stop_recording: "Arrêter l'enregistrement",
      re_record: "Recommencer",
      publish_review: "Publier l'avis",
      publishing: "Publication en cours...",
      recording: "Enregistrement en direct...",
      time_left: "restant",
      face_not_detected: "Visage non détecté. Regardez la caméra avant.",
      camera_permission: "Veuillez autoriser l'accès à la caméra.",
      content_safety_violation: "Violation de sécurité : contenu inapproprié détecté.",
      front_camera_only: "Caméra avant requise pour les avis certifiés",
      one_minute_limit: "60 secondes max"
    },
    share: {
      share_title: "Partager",
      share_subtitle: "Partagez cet avis vidéo avec vos proches",
      whatsapp: "WhatsApp",
      twitter: "X (Twitter)",
      facebook: "Facebook",
      telegram: "Telegram",
      email: "E-mail",
      copy: "Copier le lien"
    },
    comments: {
      title: "Commentaires",
      placeholder: "Ajoutez un commentaire constructif...",
      post: "Publier",
      reply: "Répondre",
      no_comments: "Aucun commentaire",
      be_first: "Soyez le premier à commenter !"
    },
    business: {
      for_businesses: "Yoouz pour les Entreprises",
      claim_now: "Revendiquer votre fiche",
      manage_profile: "Gérer l'établissement",
      dashboard: "Tableau de bord",
      analytics: "Statistiques vidéo",
      upgrade: "Mettre à niveau"
    }
  },
  de: {
    nav: {
      home: "Startseite",
      search: "Suche",
      discover: "Entdecken",
      following: "Gefolgt",
      messages: "Nachrichten",
      notifications: "Mitteilungen",
      bookmarks: "Lesezeichen",
      business: "Für Unternehmen",
      profile: "Profil",
      more: "Mehr",
      record_review: "Bewertung",
      language: "Sprache"
    },
    common: {
      back: "Zurück",
      close: "Schließen",
      save: "Speichern",
      cancel: "Abbrechen",
      confirm: "Bestätigen",
      delete: "Löschen",
      edit: "Bearbeiten",
      share: "Teilen",
      search: "Suchen...",
      loading: "Laden...",
      verified: "Verifiziert",
      follow: "Folgen",
      following: "Gefolgt",
      unfollow: "Entfolgen",
      directions: "Route",
      website: "Webseite",
      call: "Anrufen",
      chat: "Chat",
      view_all: "Alle anzeigen",
      see_more: "Mehr anzeigen",
      see_less: "Weniger anzeigen",
      copy_link: "Link kopieren",
      copied: "Kopiert!",
      report: "Melden",
      settings: "Einstellungen",
      select_language: "Sprache wählen",
      system_default: "Systemstandard",
      success: "Erfolgreich",
      error: "Fehler",
      retry: "Erneut versuchen",
      just_now: "Gerade eben",
      ago: "vor",
      hours: "Stunden",
      days: "Tage",
      minutes: "Minuten"
    },
    video: {
      by: "Von",
      unmute: "Tippen für Ton",
      mute: "Stummschalten",
      likes: "Gefällt mir",
      comments: "Kommentare",
      shares: "Geteilt",
      bookmarks: "Gespeichert",
      no_reviews: "Noch keine Video-Bewertungen",
      record_first: "Seien Sie der Erste, der eine Video-Bewertung aufnimmt!",
      exceptional: "5.0 • Außergewöhnlich",
      great: "4.0 • Sehr gut",
      average: "3.0 • Durchschnittlich",
      poor: "2.0 • Mangelhaft",
      terrible: "1.0 • Sehr schlecht",
      more_options: "Weitere Optionen",
      delete_review: "Bewertung löschen",
      report_video: "Unangemessenes Video melden"
    },
    place: {
      reviews: "Video-Bewertungen",
      about: "Über uns",
      photos: "Fotos",
      menu: "Speisekarte",
      claim_business: "Unternehmen beanspruchen & verifizieren",
      suggest_edits: "Änderung vorschlagen",
      claimed: "Verifiziertes Unternehmen",
      unclaimed: "Nicht beansprucht",
      verified_location: "Verifizierter Standort",
      total_reviews: "Bewertungen insgesamt",
      rating: "Bewertung",
      about_business: "Über diesen Betrieb",
      chat_unavailable: "Direktnachrichten derzeit nicht verfügbar"
    },
    record: {
      title: "Video-Bewertung aufnehmen",
      select_place: "Unternehmen oder Ort auswählen",
      start_recording: "Bewertung aufnehmen",
      stop_recording: "Aufnahme stoppen",
      re_record: "Neu aufnehmen",
      publish_review: "Bewertung veröffentlichen",
      publishing: "Bewertung wird veröffentlicht...",
      recording: "Live-Aufnahme läuft...",
      time_left: "verbleibend",
      face_not_detected: "Kein Gesicht erkannt. Bitte in die Frontkamera schauen.",
      camera_permission: "Kamerazugriff für authentische Bewertungen erforderlich.",
      content_safety_violation: "Sicherheitsverstoß: Aufnahme wegen unzulässigen Inhalts blockiert.",
      front_camera_only: "Frontkamera für verifizierte Bewertungen erforderlich",
      one_minute_limit: "Max. 60 Sekunden"
    },
    share: {
      share_title: "Teilen",
      share_subtitle: "Diese Video-Bewertung mit Freunden teilen",
      whatsapp: "WhatsApp",
      twitter: "X (Twitter)",
      facebook: "Facebook",
      telegram: "Telegram",
      email: "E-Mail",
      copy: "Link kopieren"
    },
    comments: {
      title: "Kommentare",
      placeholder: "Freundlichen Kommentar schreiben...",
      post: "Senden",
      reply: "Antworten",
      no_comments: "Noch keine Kommentare",
      be_first: "Hinterlassen Sie den ersten Kommentar!"
    },
    business: {
      for_businesses: "Yoouz für Unternehmen",
      claim_now: "Unternehmensprofil beanspruchen",
      manage_profile: "Unternehmen verwalten",
      dashboard: "Inhaber-Dashboard",
      analytics: "Video-Analysen",
      upgrade: "Plan upgraden"
    },
    trustCenter: {
      hub: "Yoouz Zentrum",
      subtitle: "Vertrauen, Verifikation & Support",
      title: "Wissens- & Vertrauenszentrum",
      pillarsTitle: "Präsenz-Nachweis. Echte Menschen. Verifizierte Orte.",
      pillarsDesc: "Traditionelle Textbewertungen sind anfällig für Bot-Netzwerke, gefälschte Konten und KI-generierte Bewertungen. Yoouz schafft echtes Vertrauen durch kurze 60-Sekunden-Video-Bewertungen, die ausschließlich über Live-Gerätekameras aufgenommen werden.",
      strictRule: "STRIKTE REGEL",
      rule1Title: "Nur Live-Frontkamera",
      rule1Desc: "Keine vorab aufgezeichneten MP4-Uploads oder Stock-Footage. Echte Kunden erfassen authentische Erlebnisse.",
      pillar2: "SÄULE 2",
      rule2Title: "60-Sekunden-Fokus",
      rule2Desc: "Prägnante, wirkungsvolle Video-Bewertungen, die in unter einer Minute direkten Mehrwert bieten.",
      pillar3: "SÄULE 3",
      rule3Title: "3-Wege-Dialog",
      rule3Desc: "Lebendige Kommentar-Threads, die Reviewer, neugierige Zuschauer und verifizierte Inhaber verbinden.",
      trustProtocol: "Vertrauensprotokoll",
      helpFaqs: "Hilfe & FAQs",
      forBusinesses: "Für Unternehmen",
      privacySecurity: "Datenschutz & Sicherheit",
      contactSupport: "Support kontaktieren",
      theYoouzStandard: "Der Yoouz Standard",
      bento1Title: "Unveränderliche Gesichts- und Sprachidentität",
      bento1Desc: "Jeder Reviewer baut ein offenes visuelles Portfolio auf. Echtes Gesicht, verifizierte Stimme und ein transparenter Verlauf geben Zuschauern sofortige Gewissheit.",
      bento1Sub: "Prüfen Sie jedes Profil sofort",
      bento2Title: "Interaktiver Community-Dialog",
      bento2Desc: "Bewertungen sind keine toten Einweg-Monologe. Zuschauer können live Fragen stellen und die Community antwortet gemeinsam.",
      bento2Sub: "Crowdsourced Community-Validierung",
      bento3Title: "Offizielle Domain-Verifizierung",
      bento3Desc: "Geschäftsinhaber können ihre Domain beanspruchen, mit Inhaber-Abzeichen antworten und offizielle Lösungen anpinnen.",
      bento3Sub: "Angepinnte Inhaber-Antworten",
      bento4Title: "Keine Löschung gegen Bezahlung",
      bento4Desc: "Im Gegensatz zu alten Bewertungsportalen garantiert Yoouz, dass alle verifizierten Bewertungen transparent und manipulationssicher bleiben.",
      bento4Sub: "100% gleiche Regeln für alle",
      verifiedMember: "Verifiziertes Mitglied • Aktiver Beitragsleistender",
      searchFaqsPlaceholder: "Antworten nach Stichwort oder Thema durchsuchen...",
      categoryAll: "Alle Themen",
      categoryReviewers: "Für Reviewer",
      categoryBusiness: "Für Unternehmen",
      categoryTrust: "Vertrauen & Sicherheit",
      categoryTechnical: "Technisch",
      noMatchingFaqs: "Keine passenden Fragen gefunden",
      tryDifferentKeywords: "Versuchen Sie es mit anderen Suchbegriffen oder wechseln Sie die Kategorie.",
      clearFilter: "Suchanfrage löschen",
      businessHeroTitle: "Verwandeln Sie echte Kundenbewertungen in Ihren Wachstumsmotor",
      businessHeroDesc: "Yoouz bietet verifizierten Geschäftsinhabern direkte Werkzeuge zur Verwaltung von Standortseiten, zur Teilnahme an Video-Kommentaren und zur Anzeige manipulationssicherer Vertrauenssignale.",
      verifiedOwnerBadgeTitle: "Verifiziertes Inhaber-Abzeichen",
      verifiedOwnerBadgeDesc: "Verifizieren Sie Ihre Domain via DNS oder HTML-Tag, um offizielle Abzeichen bei allen Antworten freizuschalten.",
      pinnedSolutionsTitle: "Angepinnte Lösungen & Feedback",
      pinnedSolutionsDesc: "Pinnen Sie Lösungsvideos an, um transparent auf Kundenfeedback einzugehen und langfristiges Vertrauen aufzubauen.",
      embedTrustFeedsTitle: "Live-Video-Feeds einbetten",
      embedTrustFeedsDesc: "Präsentieren Sie authentische 60-Sekunden-Video-Bewertungen direkt auf Ihrer Website mit verzögerungsfreien Streaming-Widgets.",
      requestVerification: "Domain-Verifikation anfordern",
      readyToVerify: "Bereit, Ihr Unternehmen zu beanspruchen und zu verifizieren?",
      privacySecurityTitle: "Datenschutz- & Sicherheitsarchitektur nach Google-Standard",
      googleVerified: "Google OAuth • Keine Passwörter gespeichert",
      privacySummary: "Yoouz wurde nach strengsten Datenschutzstandards entwickelt. Wir nutzen Google OAuth für sichere, passwortlose Authentifizierung, verarbeiten Kamera-Streams in Echtzeit ohne Zugriff auf Fotomediatheken und unterliegen der Gerichtsbarkeit von San Francisco, Kalifornien, USA.",
      updatedDate: "Aktualisiert am 24. Aug. 2026",
      privacyPolicyTitle: "Datenschutzerklärung",
      privacyPolicyDesc: "Umfasst den Umgang mit Google-Profildaten, Echtzeit-Kamera-/Mikrofonnutzung, keine Speicherung von Passwörtern, keinen Datenverkauf und Ihr Recht auf Datenlöschung.",
      readPrivacyPolicy: "Datenschutzerklärung lesen",
      termsConditionsTitle: "Allgemeine Geschäftsbedingungen",
      termsConditionsDesc: "Regelt Live-Aufnahmestandards, Anti-Scraping-Regeln, geschäftliche Streaming-Lizenzen, Haftungsbeschränkungen und den Gerichtsstand San Francisco, CA.",
      readTermsConditions: "AGB lesen",
      authPillarTitle: "Passwortlose E-Mail-Sicherheit",
      authPillarDesc: "Wir speichern niemals Passwörter. Alle Anmeldungen erfolgen über sichere Bestätigungscodes an Ihre verifizierte E-Mail-Adresse mit verschlüsselter HTTPS-Übertragung.",
      recordingPillarTitle: "Ausschließlich Echtzeit-Kamera",
      recordingPillarDesc: "Auf Kamera- und Mikrofondaten wird ausschließlich während der aktiven Aufnahme zugegriffen. Wir greifen niemals auf Fotogalerien zu.",
      zeroSellingPillarTitle: "Kein Verkauf oder Vermietung von Daten",
      zeroSellingPillarDesc: "Wir verkaufen, vermieten oder handeln niemals mit Ihren persönlichen Daten. Daten werden ausschließlich mit vertrauenswürdigen Cloud-Infrastrukturanbietern geteilt.",
      jurisdictionPillarTitle: "San Francisco, Kalifornien, USA",
      jurisdictionPillarDesc: "Plattformbedingungen und Datenschutzrichtlinien unterliegen den Gesetzen des US-Bundesstaates Kalifornien mit Gerichtsstand in San Francisco, CA.",
      allSystemsOperational: "Alle Systeme betriebsbereit",
      dangerZoneTitle: "Gefahrenzone: Benutzerprofil löschen",
      dangerZoneDesc: "Löschen Sie unwiderruflich Ihre Profildaten, Biografie, Avatar und zwischengespeicherte Sitzungsdaten. Dieser Vorgang kann nicht rückgängig gemacht werden.",
      deleteAccountBtn: "Konto löschen",
      deleteAccountWarning: "Die Bestätigung meldet Sie sofort ab und löscht Ihren Profil-Datensatz endgültig.",
      supportDeskTitle: "Offizieller Yoouz Support-Desk",
      supportDeskDesc: "Senden Sie Support-Anfragen, Anfragen zur Domain-Inhaberschaft oder melden Sie Verstöße gegen die Community-Richtlinien.",
      fullNameLabel: "Ihr vollständiger Name *",
      emailLabel: "E-Mail-Adresse *",
      categoryLabel: "Kategorie *",
      categorySupport: "Allgemeines Konto / Technischer Support",
      categoryVerification: "Unternehmens- / Domain-Inhaberschaftsverifizierung",
      categoryGuidelines: "Richtlinienverstoß / Gefälschte Inhalte melden",
      categoryPartnership: "API- & Partnerschaftsanfragen",
      websiteDomainLabel: "Website-Domain (Optional)",
      messageLabel: "Nachrichtendetails *",
      messagePlaceholder: "Beschreiben Sie Ihre Anfrage oder Ihr Anliegen ausführlich...",
      attachFilesLabel: "Screenshots oder Nachweise anhängen (Optional)",
      dragDropPrompt: "Dateien hierher ziehen oder durchsuchen",
      browseFiles: "Dateien durchsuchen",
      fileLimitHint: "PNG, JPG, WEBP, PDF oder DOC (Max. 3 Dateien, jeweils bis zu 2MB)",
      submitRequest: "Sichere Anfrage absenden",
      submitting: "Wird gesendet...",
      inquiryReceivedTitle: "Anfrage erfolgreich empfangen",
      inquiryReceivedDesc: "Vielen Dank für Ihre Kontaktaufnahme mit Yoouz. Ihre Nachricht wurde sicher in unserer Support-Warteschlange erfasst. Unser Team prüft alle Anfragen innerhalb von 24 Stunden.",
      sendAnotherInquiry: "Weitere Anfrage senden",
      deleteConfirmTitle: "Profil-Löschung bestätigen",
      deleteConfirmDesc: "Dies ist ein dauerhafter Vorgang. Um das Profil zu löschen, geben Sie bitte unten DELETE ein.",
      typeDeletePlaceholder: "Geben Sie DELETE zur Bestätigung ein",
      permanentlyDelete: "Dauerhaft löschen",
      deleting: "Wird gelöscht..."
    },
    discover: {
      title: "Reviewer entdecken",
      searchPlaceholder: "Reviewer nach Namen suchen...",
      searchResults: "Suchergebnisse",
      tapToView: "Karte antippen, um Profil anzuzeigen",
      noReviewersFound: "Keine Reviewer gefunden",
      tryDifferentSearch: "Versuchen Sie die Suche mit einem anderen Namen.",
      reviews: "Bewertungen",
      followers: "Follower"
    },
    auth: {
      help: "Hilfe",
      signInTitle: "Bei Yoouz anmelden",
      signInSubtitle: "Geben Sie Ihre E-Mail ein, um einen sicheren 6-stelligen Bestätigungscode zu erhalten. Passwortlos, sofort und privat.",
      recordTitle: "Anmelden, um Bewertung aufzunehmen",
      recordSubtitle: "Schließen Sie sich verifizierten Reviewern an, die echte 60-Sekunden-Videobewertungen an authentischen Orten teilen.",
      followingTitle: "Anmelden, um Reviewern zu folgen",
      followingSubtitle: "Behalten Sie Ihre Lieblings-Reviewer im Blick und entdecken Sie neue Orte, sobald sie bewertet werden.",
      messagesTitle: "Anmelden für Direktnachrichten",
      messagesSubtitle: "Chatten Sie direkt mit Reviewern und verifizierten Inhabern in Ihrer Community.",
      notificationsTitle: "Anmelden für Live-Mitteilungen",
      notificationsSubtitle: "Bleiben Sie informiert, wenn jemand Ihre Bewertungen liket, kommentiert oder darauf reagiert.",
      bookmarksTitle: "Anmelden, um Orte zu speichern",
      bookmarksSubtitle: "Speichern Sie Ihre Lieblingsrestaurants, Cafés und Orte für spätere Besuche.",
      profileTitle: "Bei Ihrem Profil anmelden",
      profileSubtitle: "Greifen Sie auf Ihre veröffentlichten Bewertungen und Follower-Statistiken zu und passen Sie Ihr Profil an.",
      commentTitle: "Anmelden, um mitzudiskutieren",
      commentSubtitle: "Teilen Sie Ihre Gedanken, stellen Sie Fragen und treten Sie direkt mit der Community in Kontakt.",
      claimTitle: "Anmelden, um Unternehmen zu beanspruchen",
      claimSubtitle: "Verifizieren Sie die Inhaberschaft Ihres Standorts, antworten Sie auf Videobewertungen und gewinnen Sie Kunden.",
      checkEmail: "Überprüfen Sie Ihre E-Mails",
      sentCodeTo: "Wir haben einen 6-stelligen Bestätigungscode gesendet an",
      completeProfileTitle: "Vervollständigen Sie Ihr Profil",
      completeProfileSubtitle: "Geben Sie Ihren Namen und Standort für verifizierte Bewertungen ein.",
      emailAddress: "E-Mail-Adresse",
      emailPlaceholder: "du@beispiel.de",
      continueEmail: "Mit E-Mail fortfahren",
      invalidEmailError: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
      verificationCode: "6-stelliger Bestätigungscode",
      digitsCount: "Ziffern",
      verifyCode: "Code bestätigen",
      changeEmail: "E-Mail ändern",
      resendCode: "Code erneut senden",
      firstName: "Vorname",
      lastName: "Nachname",
      country: "Land",
      city: "Stadt",
      regionProvince: "Region / Bundesland",
      selectCity: "Stadt auswählen",
      completeProfileEnter: "Profil abschließen & Starten",
      termsAgreementPrefix: "Mit dem Fortfahren akzeptieren Sie die",
      termsOfService: "Nutzungsbedingungen",
      and: "und",
      privacyPolicy: "Datenschutzerklärung",
      copyright: "© 2026 Yoouz. Echte Menschen. Echte Bewertungen."
    },
    businessAuth: {
      title: "Bei Yoouz Business anmelden",
      subtitle: "Beanspruchen Sie Ihr Unternehmen, antworten Sie auf Videobewertungen und interagieren Sie als verifizierter Inhaber.",
      workEmail: "Geschäftliche E-Mail",
      htmlCodeTag: "HTML Meta-Tag",
      instant: "Sofort",
      emailPlaceholder: "name@ihrunternehmen.de",
      continueMagicLink: "Mit Magic Link fortfahren",
      exit: "Beenden",
      change: "Ändern",
      switchToHtmlTag: "Zur HTML-Tag-Verifizierung wechseln",
      checkInbox: "Posteingang prüfen",
      codeSentTo: "Geben Sie den 6-stelligen Code ein, der gesendet wurde an",
      verificationCode: "Bestätigungscode",
      verifyCode: "Code verifizieren",
      resendCode: "Code erneut senden",
      htmlVerificationTitle: "HTML Meta-Tag Verifizierung",
      searchPlaceLabel: "Unternehmen suchen & auswählen",
      searchPlacePlaceholder: "Name oder Adresse des Betriebs eingeben...",
      pasteTagInstruction: "Kopieren Sie den Verifizierungscode und fügen Sie ihn in den <head>-Bereich Ihrer Website ein:",
      copyTag: "Meta-Tag kopieren",
      copied: "Kopiert!",
      verifyDomain: "Domain-Tag verifizieren",
      verifying: "Wird verifiziert..."
    },
    legal: {
      termsConditions: "Allgemeine Geschäftsbedingungen",
      privacyPolicy: "Datenschutzerklärung",
      supportDesk: "Support-Desk",
      networkLocation: "Yoouz Trust Netzwerk • San Francisco, CA",
      copyright: "© 2026 Yoouz Inc. Alle Rechte vorbehalten. Echte Menschen. Echte Bewertungen."
    },
    settings: {
      language_preference: "Sprach- & Regionaleinstellungen",
      language_subtitle: "Wechseln Sie sofort zwischen 64 unterstützten Sprachen mit vollständiger Übersetzung, RTL-Unterstützung und lokalisierter Formatierung.",
      search_languages_placeholder: "Aus 64 Sprachen suchen..."
    }
  },
  it: {
    nav: {
      home: "Home",
      search: "Cerca",
      discover: "Scopri",
      following: "Seguiti",
      messages: "Messaggi",
      notifications: "Notifiche",
      bookmarks: "Salvati",
      business: "Per le Aziende",
      profile: "Profilo",
      more: "Altro",
      record_review: "Recensione",
      language: "Lingua"
    },
    common: {
      back: "Indietro",
      close: "Chiudi",
      save: "Salva",
      cancel: "Annulla",
      confirm: "Conferma",
      delete: "Elimina",
      edit: "Modifica",
      share: "Condividi",
      search: "Cerca...",
      loading: "Caricamento...",
      verified: "Verificato",
      follow: "Segui",
      following: "Seguito",
      unfollow: "Non seguire più",
      directions: "Indicazioni",
      website: "Sito web",
      call: "Chiama",
      chat: "Chat",
      view_all: "Mostra tutto",
      see_more: "Altro",
      see_less: "Meno",
      copy_link: "Copia link",
      copied: "Copiato!",
      report: "Segnala",
      settings: "Impostazioni",
      select_language: "Seleziona lingua",
      system_default: "Predefinito di sistema",
      success: "Operazione completata",
      error: "Errore",
      retry: "Riprova",
      just_now: "Proprio ora",
      ago: "fa",
      hours: "ore",
      days: "giorni",
      minutes: "minuti"
    },
    video: {
      by: "Di",
      unmute: "Tocca per attivare l'audio",
      mute: "Disattiva audio",
      likes: "Mi piace",
      comments: "Commenti",
      shares: "Condivisioni",
      bookmarks: "Salvati",
      no_reviews: "Nessuna video recensione al momento",
      record_first: "Sii il primo creator a registrare una recensione!",
      exceptional: "5.0 • Eccezionale",
      great: "4.0 • Ottimo",
      average: "3.0 • Nella media",
      poor: "2.0 • Scarso",
      terrible: "1.0 • Pessimo",
      more_options: "Altre opzioni",
      delete_review: "Elimina recensione",
      report_video: "Segnala video inappropriato"
    },
    place: {
      reviews: "Video Recensioni",
      about: "Info",
      photos: "Foto",
      menu: "Menu",
      claim_business: "Rivendica e verifica attività",
      suggest_edits: "Suggerisci modifiche",
      claimed: "Attività verificata",
      unclaimed: "Non rivendicata",
      verified_location: "Luogo verificato",
      total_reviews: "recensioni totali",
      rating: "Valutazione",
      about_business: "Informazioni sull'attività",
      chat_unavailable: "Messaggi diretti non disponibili"
    },
    record: {
      title: "Registra Video Recensione",
      select_place: "Seleziona luogo o attività",
      start_recording: "Registra Recensione",
      stop_recording: "Ferma Registrazione",
      re_record: "Registra di nuovo",
      publish_review: "Pubblica Recensione",
      publishing: "Pubblicazione in corso...",
      recording: "Registrazione dal vivo...",
      time_left: "rimasti",
      face_not_detected: "Volto non rilevato. Guarda la fotocamera frontale.",
      camera_permission: "Autorizza la fotocamera per registrare recensioni autentiche.",
      content_safety_violation: "Violazione di sicurezza: video bloccato per contenuto inappropriato.",
      front_camera_only: "Fotocamera frontale obbligatoria per recensioni verificate",
      one_minute_limit: "Limite max 60s"
    },
    share: {
      share_title: "Condividi",
      share_subtitle: "Condividi questa recensione con i tuoi amici",
      whatsapp: "WhatsApp",
      twitter: "X (Twitter)",
      facebook: "Facebook",
      telegram: "Telegram",
      email: "Email",
      copy: "Copia link"
    },
    comments: {
      title: "Commenti",
      placeholder: "Lascia un commento costruttivo...",
      post: "Pubblica",
      reply: "Rispondi",
      no_comments: "Nessun commento",
      be_first: "Lascia il primo commento!"
    },
    business: {
      for_businesses: "Yoouz per le Imprese",
      claim_now: "Rivendica il tuo profilo",
      manage_profile: "Gestisci attività",
      dashboard: "Pannello di controllo",
      analytics: "Statistiche video",
      upgrade: "Passa a Premium"
    },
    trustCenter: {
      hub: "Hub Yoouz",
      subtitle: "Fiducia, Verifica e Supporto",
      title: "Centro di Conoscenza e Fiducia",
      pillarsTitle: "Prova di Presenza. Persone Reali. Luoghi Verificati.",
      pillarsDesc: "Le tradizionali recensioni testuali sono vulnerabili a bot, account falsi e IA. Yoouz crea autentica fiducia catturando recensioni video da 60 secondi registrate dal vivo dalla fotocamera frontale.",
      strictRule: "REGOLA SEVERA",
      rule1Title: "Solo Fotocamera Frontale dal Vivo",
      rule1Desc: "Nessun caricamento di video preregistrati o filmati d'archivio. Clienti autentici che riprendono esperienze dal vivo.",
      pillar2: "PILASTRO 2",
      rule2Title: "Focus di 60 Secondi",
      rule2Desc: "Recensioni video concise e ad alto impatto che offrono valore immediato in meno di un minuto.",
      pillar3: "PILASTRO 3",
      rule3Title: "Dialogo a 3 Vie",
      rule3Desc: "Discussioni vivaci che collegano Recensori, Spettatori e Titolari di Luoghi Verificati.",
      trustProtocol: "Protocollo di Fiducia",
      helpFaqs: "Aiuto e FAQ",
      forBusinesses: "Per le Imprese",
      privacySecurity: "Privacy e Sicurezza",
      contactSupport: "Contatta il Supporto",
      theYoouzStandard: "Lo Standard Yoouz",
      bento1Title: "Identità Immutabile di Volto e Voce",
      bento1Desc: "Ogni recensore costruisce un portfolio visivo pubblico. Volto reale, voce autentica e cronologia trasparente danno immediata fiducia agli spettatori.",
      bento1Sub: "Verifica qualsiasi profilo all'istante",
      bento2Title: "Dialogo Comunitario Interattivo",
      bento2Desc: "Le recensioni non sono monologhi statici. Gli spettatori fanno domande in tempo reale e la community convalida insieme.",
      bento2Sub: "Convalida comunitaria collaborativa",
      bento3Title: "Verifica Ufficiale del Dominio",
      bento3Desc: "I proprietari rivendicano il proprio dominio, rispondono con badge ufficiali e fissano le soluzioni in alto.",
      bento3Sub: "Risposte fissate dei titolari",
      bento4Title: "Nessun Pagamento per Rimozione",
      bento4Desc: "A differenza dei vecchi portali, Yoouz garantisce che tutte le recensioni verificate rimangano trasparenti e inalterabili.",
      bento4Sub: "Regole uguali al 100% per tutti",
      verifiedMember: "Membro Verificato • Contributore Attivo",
      searchFaqsPlaceholder: "Cerca risposte per parola chiave o argomento...",
      categoryAll: "Tutti gli Argomenti",
      categoryReviewers: "Per i Recensori",
      categoryBusiness: "Per le Imprese",
      categoryTrust: "Fiducia e Sicurezza",
      categoryTechnical: "Tecnico",
      noMatchingFaqs: "Nessuna domanda corrispondente",
      tryDifferentKeywords: "Prova a cercare con altre parole chiave o cambia categoria.",
      clearFilter: "Cancella filtro di ricerca",
      businessHeroTitle: "Trasforma le Recensioni Video nel Tuo Motore di Crescita",
      businessHeroDesc: "Yoouz fornisce ai titolari verificati strumenti diretti per gestire i profili, rispondere nei thread video e mostrare segnali di fiducia a prova di manomissione.",
      verifiedOwnerBadgeTitle: "Badge Proprietario Verificato",
      verifiedOwnerBadgeDesc: "Verifica il tuo dominio tramite DNS o meta tag HTML per sbloccare badge esclusivi in tutte le risposte.",
      pinnedSolutionsTitle: "Soluzioni e Risposte Fissate",
      pinnedSolutionsDesc: "Fissa video esplicativi per chiarire i dubbi dei clienti e costruire una reputazione duratura.",
      embedTrustFeedsTitle: "Incorpora Feed Video dal Vivo",
      embedTrustFeedsDesc: "Mostra recensioni video autentiche da 60 secondi direttamente sul tuo sito web con widget veloci.",
      requestVerification: "Richiedi Verifica Dominio",
      readyToVerify: "Pronto a rivendicare la tua attività?",
      privacySecurityTitle: "Architettura di Privacy e Sicurezza di Livello Google",
      googleVerified: "Google OAuth • Nessuna Password Memorizzata",
      privacySummary: "Yoouz è progettato secondo i massimi standard di privacy. Utilizziamo l'autenticazione Google, elaboriamo la fotocamera solo in tempo reale senza accedere alla tua galleria, e siamo sotto la giurisdizione di San Francisco, California.",
      updatedDate: "Aggiornato: Ago 24, 2026",
      privacyPolicyTitle: "Informativa sulla Privacy",
      privacyPolicyDesc: "Trattamento dei dati, utilizzo di fotocamera/microfono dal vivo, divieto assoluto di vendita dei dati e diritto alla cancellazione.",
      readPrivacyPolicy: "Leggi l'Informativa sulla Privacy",
      termsConditionsTitle: "Termini e Condizioni",
      termsConditionsDesc: "Standard di registrazione dal vivo, divieto di scraping, licenze di streaming e limitazioni di responsabilità.",
      readTermsConditions: "Leggi Termini e Condizioni",
      authPillarTitle: "Sicurezza Email Senza Password",
      authPillarDesc: "Non memorizziamo mai password. Tutti gli accessi avvengono tramite codici sicuri inviati alla tua email.",
      recordingPillarTitle: "Solo Fotocamera dal Vivo",
      recordingPillarDesc: "L'accesso a fotocamera e microfono avviene unicamente durante la registrazione attiva. Nessun accesso alla galleria.",
      zeroSellingPillarTitle: "Nessuna Vendita di Dati Personali",
      zeroSellingPillarDesc: "Non vendiamo, né affittiamo o scambiamo i tuoi dati con terze parti.",
      jurisdictionPillarTitle: "San Francisco, California, USA",
      jurispillarDesc: "I termini della piattaforma e le politiche di privacy sono regolati dalle leggi dello Stato della California, USA.",
      allSystemsOperational: "Tutti i Sistemi Operativi",
      dangerZoneTitle: "Zona Pericolo: Elimina Profilo Account",
      dangerZoneDesc: "Cancella definitivamente il profilo, la biografia, la foto e i dati della sessione. Operazione irreversibile.",
      deleteAccountBtn: "Elimina Account Definitivamente",
      deleteAccountWarning: "La conferma comporterà la disconnessione immediata e la cancellazione totale del profilo.",
      supportDeskTitle: "Help Desk Ufficiale Yoouz",
      supportDeskDesc: "Invia richieste di assistenza, richieste di verifica del dominio o segnala violazioni alle linee guida.",
      fullNameLabel: "Nome Completo *",
      emailLabel: "Indirizzo Email *",
      categoryLabel: "Categoria *",
      categorySupport: "Supporto Generale Account / Tecnico",
      categoryVerification: "Verifica Dominio / Proprietà Attività",
      categoryGuidelines: "Segnala Violazione Norme / Contenuto Falso",
      categoryPartnership: "Richieste di Partnership e API",
      websiteDomainLabel: "Dominio Sito Web (Opzionale)",
      messageLabel: "Dettagli del Messaggio *",
      messagePlaceholder: "Descrivi la tua richiesta in dettaglio...",
      attachFilesLabel: "Allega Screenshot o Prove di Verifica (Opzionale)",
      dragDropPrompt: "Trascina i file qui o sfoglia i file",
      browseFiles: "sfoglia i file",
      fileLimitHint: "PNG, JPG, WEBP, PDF o DOC (Max 3 file, fino a 2MB ciascuno)",
      submitRequest: "Invia Richiesta Sicura",
      submitting: "Invio in corso...",
      inquiryReceivedTitle: "Richiesta Ricevuta con Successo",
      inquiryReceivedDesc: "Grazie per aver contattato Yoouz. Il tuo messaggio è stato registrato in sicurezza. Il nostro team esamina tutte le richieste entro 24 ore.",
      sendAnotherInquiry: "Invia Un'altra Richiesta",
      deleteConfirmTitle: "Conferma Eliminazione Profilo",
      deleteConfirmDesc: "Questa operazione è permanente. Per procedere, digita DELETE qui sotto.",
      typeDeletePlaceholder: "Digita DELETE per confermare",
      permanentlyDelete: "Elimina Definitivamente",
      deleting: "Eliminazione in corso..."
    },
    discover: {
      title: "Scopri i Recensori",
      searchPlaceholder: "Cerca recensore per nome...",
      searchResults: "Risultati di Ricerca",
      tapToView: "Tocca per vedere il profilo",
      noReviewersFound: "Nessun recensore trovato",
      tryDifferentSearch: "Prova a cercare con un altro nome.",
      reviews: "Recensioni",
      followers: "Follower"
    },
    auth: {
      help: "Aiuto",
      signInTitle: "Accedi a Yoouz",
      signInSubtitle: "Inserisci la tua email per ricevere un codice sicuro di verifica a 6 cifre. Immediato e senza password.",
      recordTitle: "Accedi per Registrare una Recensione",
      recordSubtitle: "Unisciti ai recensori verificati e condividi video recensioni autentiche da 60 secondi.",
      followingTitle: "Accedi per Seguire i Recensori",
      followingSubtitle: "Segui i tuoi creator preferiti e scopri nuovi luoghi quando pubblicano recensioni.",
      messagesTitle: "Accedi per i Messaggi",
      messagesSubtitle: "Comunica direttamente con i recensori e i titolari verificati.",
      notificationsTitle: "Accedi per le Notifiche dal Vivo",
      notificationsSubtitle: "Ricevi aggiornamenti quando altri utenti interagiscono con le tue recensioni.",
      bookmarksTitle: "Accedi per Salvare i Luoghi",
      bookmarksSubtitle: "Salva i tuoi ristoranti e locali preferiti da visitare più tardi.",
      profileTitle: "Accedi al Tuo Profilo",
      profileSubtitle: "Visualizza le tue recensioni pubblicate, i follower e personalizza il profilo.",
      commentTitle: "Accedi per Partecipare alla Conversazione",
      commentSubtitle: "Condividi le tue opinioni e interagisci con la community.",
      claimTitle: "Accedi per Rivendicare l'Attività",
      claimSubtitle: "Verifica la proprietà del locale, rispondi alle video recensioni e connettiti con i clienti.",
      checkEmail: "Controlla la Tua Email",
      sentCodeTo: "Abbiamo inviato un codice di conferma a 6 cifre a",
      completeProfileTitle: "Completa il Tuo Profilo",
      completeProfileSubtitle: "Inserisci nome e posizione per pubblicare recensioni verificate.",
      emailAddress: "Indirizzo Email",
      emailPlaceholder: "tu@esempio.com",
      continueEmail: "Continua con Email",
      invalidEmailError: "Inserisci un indirizzo email valido.",
      verificationCode: "Codice di Verifica a 6 Cifre",
      digitsCount: "cifre",
      verifyCode: "Verifica Codice",
      changeEmail: "Cambia Email",
      resendCode: "Invia di Nuovo",
      firstName: "Nome",
      lastName: "Cognome",
      country: "Paese",
      city: "Città",
      regionProvince: "Regione / Provincia",
      selectCity: "Seleziona Città",
      completeProfileEnter: "Completa Profilo ed Entra",
      termsAgreementPrefix: "Continuando, accetti i nostri",
      termsOfService: "Termini di Servizio",
      and: "e l'",
      privacyPolicy: "Informativa sulla Privacy",
      copyright: "© 2026 Yoouz. Persone Reali. Recensioni Reali."
    },
    businessAuth: {
      title: "Accedi a Yoouz Business",
      subtitle: "Rivendica la tua attività, rispondi alle recensioni e connettiti con i clienti come titolare verificato.",
      workEmail: "Email Aziendale",
      htmlCodeTag: "Tag Meta HTML",
      instant: "Istantaneo",
      emailPlaceholder: "tu@tuaazienda.com",
      continueMagicLink: "Continua con Magic Link",
      exit: "Esci",
      change: "Cambia",
      switchToHtmlTag: "Passa alla verifica tramite tag HTML",
      checkInbox: "Controlla la Tua Posta",
      codeSentTo: "Inserisci il codice di 6 cifre inviato a",
      verificationCode: "Codice di Verifica",
      verifyCode: "Verifica Codice",
      resendCode: "Invia di Nuovo",
      htmlVerificationTitle: "Verifica tramite Tag Meta HTML",
      searchPlaceLabel: "Cerca e Seleziona l'Attività da Rivendicare",
      searchPlacePlaceholder: "Cerca per nome locale o indirizzo...",
      pasteTagInstruction: "Copia il tag e incollalo all'interno della sezione <head> del tuo sito:",
      copyTag: "Copia Tag Meta",
      copied: "Copiato!",
      verifyDomain: "Verifica Tag Dominio",
      verifying: "Verifica in corso..."
    },
    legal: {
      termsConditions: "Termini e Condizioni",
      privacyPolicy: "Informativa sulla Privacy",
      supportDesk: "Help Desk",
      networkLocation: "Yoouz Trust Network • San Francisco, CA",
      copyright: "© 2026 Yoouz Inc. Tutti i diritti riservati. Persone Reali. Recensioni Reali."
    },
    settings: {
      language_preference: "Preferenze Lingua e Regione",
      language_subtitle: "Passa istantaneamente tra 64 lingue con traduzione completa, supporto bidirezionale RTL e formattazione localizzata.",
      search_languages_placeholder: "Cerca tra 64 lingue..."
    }
  },
  pt: {
    nav: {
      home: "Início",
      search: "Buscar",
      discover: "Descobrir",
      following: "Seguindo",
      messages: "Mensagens",
      notifications: "Notificações",
      bookmarks: "Salvos",
      business: "Para Empresas",
      profile: "Perfil",
      more: "Mais",
      record_review: "Avaliação",
      language: "Idioma"
    },
    common: {
      back: "Voltar",
      close: "Fechar",
      save: "Salvar",
      cancel: "Cancelar",
      confirm: "Confirmar",
      delete: "Excluir",
      edit: "Editar",
      share: "Compartilhar",
      search: "Buscar...",
      loading: "Carregando...",
      verified: "Verificado",
      follow: "Seguir",
      following: "Seguindo",
      unfollow: "Deixar de seguir",
      directions: "Rotas",
      website: "Site",
      call: "Ligar",
      chat: "Chat",
      view_all: "Ver tudo",
      see_more: "Ver mais",
      see_less: "Ver menos",
      copy_link: "Copiar link",
      copied: "Copiado!",
      report: "Denunciar",
      settings: "Configurações",
      select_language: "Selecionar idioma",
      system_default: "Padrão do sistema",
      success: "Sucesso",
      error: "Erro",
      retry: "Tentar novamente",
      just_now: "Agora mesmo",
      ago: "atrás",
      hours: "horas",
      days: "dias",
      minutes: "minutos"
    },
    video: {
      by: "Por",
      unmute: "Toque para ativar o som",
      mute: "Silenciar",
      likes: "Curtidas",
      comments: "Comentários",
      shares: "Compartilhamentos",
      bookmarks: "Salvos",
      no_reviews: "Nenhuma avaliação em vídeo ainda",
      record_first: "Seja o primeiro criador a gravar uma avaliação!",
      exceptional: "5.0 • Excepcional",
      great: "4.0 • Muito bom",
      average: "3.0 • Médio",
      poor: "2.0 • Ruim",
      terrible: "1.0 • Péssimo",
      more_options: "Mais opções",
      delete_review: "Excluir avaliação",
      report_video: "Denunciar vídeo impróprio"
    },
    place: {
      reviews: "Avaliações em Vídeo",
      about: "Sobre",
      photos: "Fotos",
      menu: "Cardápio",
      claim_business: "Reivindicar e Verificar Empresa",
      suggest_edits: "Sugerir edições",
      claimed: "Empresa Verificada",
      unclaimed: "Não reivindicada",
      verified_location: "Local verificado",
      total_reviews: "avaliações no total",
      rating: "Nota",
      about_business: "Sobre este estabelecimento",
      chat_unavailable: "Mensagens diretas indisponíveis"
    },
    record: {
      title: "Gravar Avaliação em Vídeo",
      select_place: "Selecionar empresa ou local",
      start_recording: "Gravar Avaliação",
      stop_recording: "Parar Gravação",
      re_record: "Gravar novamente",
      publish_review: "Publicar Avaliação",
      publishing: "Publicando avaliação...",
      recording: "Gravando ao vivo...",
      time_left: "restante",
      face_not_detected: "Rosto não detectado. Olhe para a câmera frontal.",
      camera_permission: "Permita o acesso à câmera para gravar avaliações autênticas.",
      content_safety_violation: "Violação de segurança: gravação bloqueada por conteúdo impróprio.",
      front_camera_only: "Câmera frontal obrigatória para avaliações verificadas",
      one_minute_limit: "Limite máximo de 60s"
    },
    share: {
      share_title: "Compartilhar",
      share_subtitle: "Compartilhe esta avaliação em vídeo com amigos",
      whatsapp: "WhatsApp",
      twitter: "X (Twitter)",
      facebook: "Facebook",
      telegram: "Telegram",
      email: "E-mail",
      copy: "Copiar link"
    },
    comments: {
      title: "Comentários",
      placeholder: "Escreva um comentário amigável...",
      post: "Publicar",
      reply: "Responder",
      no_comments: "Nenhum comentário",
      be_first: "Seja o primeiro a comentar!"
    },
    business: {
      for_businesses: "Yoouz para Empresas",
      claim_now: "Reivindique seu perfil",
      manage_profile: "Gerenciar empresa",
      dashboard: "Painel do Proprietário",
      analytics: "Métricas de vídeo",
      upgrade: "Fazer upgrade"
    },
    trustCenter: {
      hub: "Hub Yoouz",
      subtitle: "Confiança, Verificação e Suporte",
      title: "Centro de Conhecimento e Confiança",
      pillarsTitle: "Prova de Presença. Pessoas Reais. Locais Verificados.",
      pillarsDesc: "Avaliações em texto tradicionais são vulneráveis a bots, contas falsas e IA. O Yoouz cria confiança autêntica capturando avaliações em vídeo de 60 segundos gravadas ao vivo pela câmera frontal.",
      strictRule: "REGRA ESTRITA",
      rule1Title: "Apenas Câmera Frontal ao Vivo",
      rule1Desc: "Sem envios de vídeos pré-gravados ou vídeos de arquivo. Clientes reais registrando experiências reais.",
      pillar2: "PILAR 2",
      rule2Title: "Foco de 60 Segundos",
      rule2Desc: "Avaliações em vídeo concisas e diretas que entregam valor imediato em menos de um minuto.",
      pillar3: "PILAR 3",
      rule3Title: "Diálogo em 3 Vias",
      rule3Desc: "Discussões ativas conectando Avaliadores, Espectadores e Proprietários Verificados.",
      trustProtocol: "Protocolo de Confiança",
      helpFaqs: "Ajuda e Perguntas Frequentes",
      forBusinesses: "Para Empresas",
      privacySecurity: "Privacidade e Segurança",
      contactSupport: "Fale com o Suporte",
      theYoouzStandard: "O Padrão Yoouz",
      bento1Title: "Identidade Imutável de Rosto e Voz",
      bento1Desc: "Cada avaliador constrói um histórico visual transparente. Rosto real e voz verificada dão confiança instantânea aos espectadores.",
      bento1Sub: "Audite qualquer perfil instantaneamente",
      bento2Title: "Diálogo Comunitário Interativo",
      bento2Desc: "Avaliações não são monólogos estáticos. Os espectadores fazem perguntas em tempo real e a comunidade valida em conjunto.",
      bento2Sub: "Validação comunitária colaborativa",
      bento3Title: "Verificação Oficial de Domínio",
      bento3Desc: "Proprietários reivindicam seus domínios, respondem com selos oficiais e fixam soluções no topo.",
      bento3Sub: "Respostas fixadas do proprietário",
      bento4Title: "Sem Pagamento para Remover Avaliações",
      bento4Desc: "Ao contrário de plataformas antigas, o Yoouz garante que todas as avaliações verificadas sejam transparentes e invioláveis.",
      bento4Sub: "Regras 100% iguais para todos",
      verifiedMember: "Membro Verificado • Contribuidor Ativo",
      searchFaqsPlaceholder: "Buscar respostas por palavra-chave ou tema...",
      categoryAll: "Todos os Tópicos",
      categoryReviewers: "Para Avaliadores",
      categoryBusiness: "Para Empresas",
      categoryTrust: "Confiança e Segurança",
      categoryTechnical: "Técnico",
      noMatchingFaqs: "Nenhuma pergunta encontrada",
      tryDifferentKeywords: "Tente buscar por outros termos ou mude de categoria.",
      clearFilter: "Limpar filtro de busca",
      businessHeroTitle: "Transforme Avaliações em Vídeo no Seu Motor de Crescimento",
      businessHeroDesc: "O Yoouz oferece aos proprietários ferramentas diretas para gerenciar perfis, responder vídeos e exibir sinais de confiança autênticos.",
      verifiedOwnerBadgeTitle: "Selo de Proprietário Verificado",
      verifiedOwnerBadgeDesc: "Verifique seu domínio via DNS ou tag HTML para exibir selos exclusivos em todas as respostas.",
      pinnedSolutionsTitle: "Soluções e Respostas Fixadas",
      pinnedSolutionsDesc: "Fixe vídeos explicativos para tirar dúvidas dos clientes com transparência e construir reputação duradoura.",
      embedTrustFeedsTitle: "Incorpore Feeds de Vídeo ao Vivo",
      embedTrustFeedsDesc: "Exiba avaliações autênticas de 60 segundos diretamente no seu site com widgets rápidos.",
      requestVerification: "Solicitar Verificação de Domínio",
      readyToVerify: "Pronto para reivindicar sua empresa?",
      privacySecurityTitle: "Arquitetura de Privacidade e Segurança Padrão Google",
      googleVerified: "Google OAuth • Nenhuma Senha Armazenada",
      privacySummary: "O Yoouz é construído com foco total na privacidade. Utilizamos autenticação Google sem senhas, processamos a câmera em tempo real sem acessar sua galeria de fotos, sob a jurisdição de São Francisco, Califórnia.",
      updatedDate: "Atualizado: Ago 24, 2026",
      privacyPolicyTitle: "Política de Privacidade",
      privacyPolicyDesc: "Tratamento de dados, uso de câmera/microfone ao vivo, proibição de venda de dados e direito à exclusão de conta.",
      readPrivacyPolicy: "Ler Política de Privacidade",
      termsConditionsTitle: "Termos e Condições",
      termsConditionsDesc: "Padrões de gravação ao vivo, regras contra raspagem de dados, licenças de streaming e limites de responsabilidade.",
      readTermsConditions: "Ler Termos e Condições",
      authPillarTitle: "Segurança Sem Senhas por E-mail",
      authPillarDesc: "Nunca armazenamos senhas. Todos os acessos usam códigos seguros de 6 dígitos enviados ao seu e-mail.",
      recordingPillarTitle: "Apenas Câmera ao Vivo",
      recordingPillarDesc: "O acesso à câmera e microfone ocorre exclusivamente durante a gravação ativa. Sem acesso a arquivos locais.",
      zeroSellingPillarTitle: "Zero Venda de Dados Pessoais",
      zeroSellingPillarDesc: "Nunca vendemos, alugamos ou comercializamos seus dados pessoais para terceiros.",
      jurisdictionPillarTitle: "São Francisco, Califórnia, EUA",
      jurispillarDesc: "Os termos da plataforma e políticas de privacidade são regidos pelas leis do Estado da Califórnia, EUA.",
      allSystemsOperational: "Todos os Sistemas Operacionais",
      dangerZoneTitle: "Zona de Perigo: Excluir Perfil da Conta",
      dangerZoneDesc: "Exclui permanentemente os dados do seu perfil, biografia, foto e sessões. Essa ação não pode ser desfeita.",
      deleteAccountBtn: "Excluir Conta Permanentemente",
      deleteAccountWarning: "Confirmar fará o logout imediatamente e removerá seu perfil por completo.",
      supportDeskTitle: "Central de Suporte Oficial Yoouz",
      supportDeskDesc: "Envie dúvidas de suporte, solicitações de verificação de domínio ou denuncie violações das diretrizes.",
      fullNameLabel: "Nome Completo *",
      emailLabel: "E-mail *",
      categoryLabel: "Categoria *",
      categorySupport: "Suporte Geral / Técnico",
      categoryVerification: "Verificação de Domínio / Propriedade",
      categoryGuidelines: "Denunciar Violação de Diretrizes / Conteúdo Falso",
      categoryPartnership: "Parcerias e Integrações de API",
      websiteDomainLabel: "Domínio do Site (Opcional)",
      messageLabel: "Mensagem *",
      messagePlaceholder: "Descreva sua dúvida ou solicitação em detalhes...",
      attachFilesLabel: "Anexar Imagens ou Comprovantes (Opcional)",
      dragDropPrompt: "Arraste e solte arquivos aqui, ou procure arquivos",
      browseFiles: "procurar arquivos",
      fileLimitHint: "PNG, JPG, WEBP, PDF ou DOC (Máx. 3 arquivos, até 2MB cada)",
      submitRequest: "Enviar Solicitação Segura",
      submitting: "Enviando...",
      inquiryReceivedTitle: "Solicitação Recebida com Sucesso",
      inquiryReceivedDesc: "Obrigado por contatar o Yoouz. Sua mensagem foi registrada com segurança. Nossa equipe responde em até 24 horas.",
      sendAnotherInquiry: "Enviar Outra Mensagem",
      deleteConfirmTitle: "Confirmar Exclusão de Perfil",
      deleteConfirmDesc: "Esta ação é irreversível. Para excluir seu perfil, digite DELETE abaixo.",
      typeDeletePlaceholder: "Digite DELETE para confirmar",
      permanentlyDelete: "Excluir Permanentemente",
      deleting: "Excluindo..."
    },
    discover: {
      title: "Descobrir Avaliadores",
      searchPlaceholder: "Buscar avaliador por nome...",
      searchResults: "Resultados da Busca",
      tapToView: "Toque para ver o perfil",
      noReviewersFound: "Nenhum avaliador encontrado",
      tryDifferentSearch: "Tente buscar por outro nome.",
      reviews: "Avaliações",
      followers: "Seguidores"
    },
    auth: {
      help: "Ajuda",
      signInTitle: "Entrar no Yoouz",
      signInSubtitle: "Digite seu e-mail para receber um código de confirmação de 6 dígitos. Sem senhas, rápido e privado.",
      recordTitle: "Entre para Gravar uma Avaliação",
      recordSubtitle: "Junte-se aos criadores verificados e compartilhe avaliações em vídeo autênticas de 60 segundos.",
      followingTitle: "Entre para Seguir Avaliadores",
      followingSubtitle: "Acompanhe seus criadores favoritos e descubra novos locais conforme publicam avaliações.",
      messagesTitle: "Entre para Acessar Mensagens",
      messagesSubtitle: "Converse diretamente com avaliadores e proprietários verificados.",
      notificationsTitle: "Entre para Notificações ao Vivo",
      notificationsSubtitle: "Receba avisos em tempo real quando curtirem ou comentarem em seus vídeos.",
      bookmarksTitle: "Entre para Salvar Locais",
      bookmarksSubtitle: "Salve restaurantes e locais favoritos para visitar mais tarde.",
      profileTitle: "Entre no Seu Perfil",
      profileSubtitle: "Acesse suas avaliações publicadas, contagem de seguidores e personalize seu perfil.",
      commentTitle: "Entre para Participar da Conversa",
      commentSubtitle: "Compartilhe suas opiniões, faça perguntas e interaja com a comunidade.",
      claimTitle: "Entre para Reivindicar Sua Empresa",
      claimSubtitle: "Verifique a propriedade do local, responda a avaliações em vídeo e conecte-se com clientes.",
      checkEmail: "Verifique Seu E-mail",
      sentCodeTo: "Enviamos um código de confirmação de 6 dígitos para",
      completeProfileTitle: "Complete Seu Perfil",
      completeProfileSubtitle: "Informe seu nome e localização para publicar avaliações verificadas.",
      emailAddress: "Endereço de E-mail",
      emailPlaceholder: "voce@exemplo.com",
      continueEmail: "Continuar com E-mail",
      invalidEmailError: "Por favor insira um endereço de e-mail válido.",
      verificationCode: "Código de Verificação de 6 Dígitos",
      digitsCount: "dígitos",
      verifyCode: "Verificar Código",
      changeEmail: "Trocar E-mail",
      resendCode: "Reenviar Código",
      firstName: "Nome",
      lastName: "Sobrenome",
      country: "País",
      city: "Cidade",
      regionProvince: "Estado / Província",
      selectCity: "Selecionar Cidade",
      completeProfileEnter: "Concluir Perfil e Entrar",
      termsAgreementPrefix: "Ao continuar, você concorda com nossos",
      termsOfService: "Termos de Serviço",
      and: "e com a",
      privacyPolicy: "Política de Privacidade",
      copyright: "© 2026 Yoouz. Pessoas Reais. Avaliações Reais."
    },
    businessAuth: {
      title: "Entrar no Yoouz Empresas",
      subtitle: "Reivindique sua empresa, responda a avaliações e conecte-se com clientes como proprietário verificado.",
      workEmail: "E-mail Corporativo",
      htmlCodeTag: "Tag Meta HTML",
      instant: "Instantâneo",
      emailPlaceholder: "voce@suaempresa.com",
      continueMagicLink: "Continuar com Link Mágico",
      exit: "Sair",
      change: "Alterar",
      switchToHtmlTag: "Alternar para verificação por tag HTML",
      checkInbox: "Verifique Sua Caixa de Entrada",
      codeSentTo: "Digite o código de 6 dígitos enviado para",
      verificationCode: "Código de Verificação",
      verifyCode: "Verificar Código",
      resendCode: "Reenviar Código",
      htmlVerificationTitle: "Verificação por Tag Meta HTML",
      searchPlaceLabel: "Buscar e Selecionar Empresa para Reivindicar",
      searchPlacePlaceholder: "Buscar por nome ou endereço do local...",
      pasteTagInstruction: "Copie o código e cole dentro da tag <head> no site da sua empresa:",
      copyTag: "Copiar Tag Meta",
      copied: "Copiado!",
      verifyDomain: "Verificar Tag de Domínio",
      verifying: "Verificando..."
    },
    legal: {
      termsConditions: "Termos e Condições",
      privacyPolicy: "Política de Privacidade",
      supportDesk: "Central de Suporte",
      networkLocation: "Rede de Confiança Yoouz • São Francisco, CA",
      copyright: "© 2026 Yoouz Inc. Todos os direitos reservados. Pessoas Reais. Avaliações Reais."
    },
    settings: {
      language_preference: "Preferências de Idioma e Região",
      language_subtitle: "Alterne instantaneamente entre 64 idiomas com tradução completa, suporte RTL e formatação localizada.",
      search_languages_placeholder: "Buscar entre 64 idiomas..."
    }
  },
  ru: {
    nav: {
      home: "Главная",
      search: "Поиск",
      discover: "Интересное",
      following: "Подписки",
      messages: "Сообщения",
      notifications: "Уведомления",
      bookmarks: "Закладки",
      business: "Для бизнеса",
      profile: "Профиль",
      more: "Ещё",
      record_review: "Записать отзыв",
      language: "Язык"
    },
    common: {
      back: "Назад",
      close: "Закрыть",
      save: "Сохранить",
      cancel: "Отмена",
      confirm: "Подтвердить",
      delete: "Удалить",
      edit: "Изменить",
      share: "Поделиться",
      search: "Поиск...",
      loading: "Загрузка...",
      verified: "Подтверждено",
      follow: "Подписаться",
      following: "Вы подписаны",
      unfollow: "Отписаться",
      directions: "Маршрут",
      website: "Сайт",
      call: "Позвонить",
      chat: "Чат",
      view_all: "Смотреть все",
      see_more: "Подробнее",
      see_less: "Свернуть",
      copy_link: "Скопировать ссылку",
      copied: "Скопировано!",
      report: "Пожаловаться",
      settings: "Настройки",
      select_language: "Выбрать язык",
      system_default: "Как в системе",
      success: "Успешно",
      error: "Ошибка",
      retry: "Повторить",
      just_now: "Только что",
      ago: "назад",
      hours: "ч.",
      days: "дн.",
      minutes: "мин."
    },
    video: {
      by: "Автор",
      unmute: "Включить звук",
      mute: "Выключить звук",
      likes: "Нравится",
      comments: "Комментарии",
      shares: "Поделились",
      bookmarks: "Сохранения",
      no_reviews: "Пока нет видеоотзывов",
      record_first: "Будьте первым, кто запишет видеоотзыв!",
      exceptional: "5.0 • Превосходно",
      great: "4.0 • Отлично",
      average: "3.0 • Нормально",
      poor: "2.0 • Плохо",
      terrible: "1.0 • Ужасно",
      more_options: "Дополнительно",
      delete_review: "Удалить отзыв",
      report_video: "Пожаловаться на видео"
    },
    place: {
      reviews: "Видеоотзывы",
      about: "О месте",
      photos: "Фотографии",
      menu: "Меню",
      claim_business: "Подтвердить права на бизнес",
      suggest_edits: "Предложить правку",
      claimed: "Подтвержденный бизнес",
      unclaimed: "Не подтверждено",
      verified_location: "Проверенное место",
      total_reviews: "всего отзывов",
      rating: "Рейтинг",
      about_business: "Об этом заведении",
      chat_unavailable: "Прямые сообщения недоступны"
    },
    record: {
      title: "Запись видеоотзыва",
      select_place: "Выберите заведение или место",
      start_recording: "Записать отзыв",
      stop_recording: "Остановить запись",
      re_record: "Перезаписать",
      publish_review: "Опубликовать",
      publishing: "Публикация отзыва...",
      recording: "Идет запись...",
      time_left: "осталось",
      face_not_detected: "Лицо не обнаружено. Смотрите во фронтальную камеру.",
      camera_permission: "Разрешите доступ к камере для записи честных отзывов.",
      content_safety_violation: "Нарушение безопасности: видео заблокировано из-за недопустимого контента.",
      front_camera_only: "Только фронтальная камера для проверенных отзывов",
      one_minute_limit: "Максимум 60 секунд"
    },
    share: {
      share_title: "Поделиться",
      share_subtitle: "Поделитесь этим видеоотзывом с друзьями",
      whatsapp: "WhatsApp",
      twitter: "X (Twitter)",
      facebook: "Facebook",
      telegram: "Telegram",
      email: "Email",
      copy: "Скопировать ссылку"
    },
    comments: {
      title: "Комментарии",
      placeholder: "Напишите доброжелательный комментарий...",
      post: "Отправить",
      reply: "Ответить",
      no_comments: "Пока нет комментариев",
      be_first: "Оставьте комментарий первым!"
    },
    business: {
      for_businesses: "Yoouz для бизнеса",
      claim_now: "Подтвердить профиль компании",
      manage_profile: "Управление компанией",
      dashboard: "Панель владельца",
      analytics: "Видеоаналитика",
      upgrade: "Улучшить тариф"
    },
    trustCenter: {
      hub: "Центр Yoouz",
      subtitle: "Доверие, Верификация и Поддержка",
      title: "Центр знаний и доверия",
      pillarsTitle: "Доказательство присутствия. Реальные люди. Проверенные места.",
      pillarsDesc: "Традиционные текстовые отзывы уязвимы для ботов, заказных публикаций и ИИ. Yoouz создает подлинное доверие с помощью 60-секундных видеоотзывов с фронтальной камеры.",
      strictRule: "СТРОГОЕ ПРАВИЛО",
      rule1Title: "Только фронтальная камера в реальном времени",
      rule1Desc: "Никаких загрузок готовых видеофайлов. Реальные клиенты, делящиеся искренним опытом.",
      pillar2: "ПРИНЦИП 2",
      rule2Title: "Фокус 60 секунд",
      rule2Desc: "Емкие видеоотзывы, дающие максимальную пользу менее чем за одну минуту.",
      pillar3: "ПРИНЦИП 3",
      rule3Title: "Трехсторонний диалог",
      rule3Desc: "Живые ветки комментариев, объединяющие Авторов, Зрителей и Официальных Владельцев.",
      trustProtocol: "Протокол доверия",
      helpFaqs: "Помощь и частые вопросы",
      forBusinesses: "Для бизнеса",
      privacySecurity: "Конфиденциальность и безопасность",
      contactSupport: "Служба поддержки",
      theYoouzStandard: "Стандарт Yoouz",
      bento1Title: "Неизменность лица и голоса",
      bento1Desc: "Каждый автор формирует открытое видеопортфолио. Реальное лицо и подтвержденный голос гарантируют доверие зрителей.",
      bento1Sub: "Мгновенная проверка любого профиля",
      bento2Title: "Интерактивный диалог сообщества",
      bento2Desc: "Отзывы — это не статический монолог. Зрители задают вопросы в реальном времени, а сообщество проверяет факты вместе.",
      bento2Sub: "Коллективная проверка сообществом",
      bento3Title: "Официальная верификация домена",
      bento3Desc: "Владельцы подтверждают владение сайтом, отвечают с официальным значком и закрепляют решения вверху.",
      bento3Sub: "Закрепленные ответы владельцев",
      bento4Title: "Гарантия отсутствия платного удаления",
      bento4Desc: "В отличие от устаревших каталогов, Yoouz гарантирует неизменность и прозрачность всех проверенных отзывов.",
      bento4Sub: "100% равные правила для каждого",
      verifiedMember: "Проверенный участник • Активный автор",
      searchFaqsPlaceholder: "Поиск ответов по ключевым словам или теме...",
      categoryAll: "Все темы",
      categoryReviewers: "Для авторов",
      categoryBusiness: "Для бизнеса",
      categoryTrust: "Доверие и безопасность",
      categoryTechnical: "Технические вопросы",
      noMatchingFaqs: "Вопросов не найдено",
      tryDifferentKeywords: "Попробуйте изменить поисковый запрос или категорию.",
      clearFilter: "Сбросить поиск",
      businessHeroTitle: "Превратите честные видеоотзывы в двигатель вашего роста",
      businessHeroDesc: "Yoouz предоставляет владельцам бизнеса официальные инструменты управления страницей и взаимодействия с аудиторией.",
      verifiedOwnerBadgeTitle: "Значок подтвержденного владельца",
      verifiedOwnerBadgeDesc: "Подтвердите домен через DNS или HTML-тег для получения официального статуса во всех ответах.",
      pinnedSolutionsTitle: "Закрепленные решения и ответы",
      pinnedSolutionsDesc: "Закрепляйте поясняющие видео, чтобы прозрачно отвечать на вопросы клиентов и укреплять репутацию.",
      embedTrustFeedsTitle: "Виджеты живых видеоотзывов",
      embedTrustFeedsDesc: "Размещайте 60-секундные видеоотзывы клиентов прямо на своем сайте с помощью быстрых виджетов.",
      requestVerification: "Запросить верификацию домена",
      readyToVerify: "Готовы подтвердить права на свой бизнес?",
      privacySecurityTitle: "Архитектура безопасности корпоративного уровня",
      googleVerified: "Вход через Google • Без хранения паролей",
      privacySummary: "Yoouz спроектирован по принципу максимальной защиты данных. Мы используем безопасный вход без паролей, работаем с камерой исключительно в режиме съемки без доступа к галерее, под юрисдикцией Сан-Франциско, Калифорния.",
      updatedDate: "Обновлено: 24 авг 2026",
      privacyPolicyTitle: "Политика конфиденциальности",
      privacyPolicyDesc: "Обработка данных профиля, использование камеры и микрофона в прямом эфире, запрет продажи данных и право на удаление.",
      readPrivacyPolicy: "Читать Политику конфиденциальности",
      termsConditionsTitle: "Условия обслуживания",
      termsConditionsDesc: "Стандарты съемки, запрет на парсинг данных, лицензии на трансляцию и ограничение ответственности.",
      readTermsConditions: "Читать Условия обслуживания",
      authPillarTitle: "Безопасность без паролей по Email",
      authPillarDesc: "Мы не храним пароли. Вход осуществляется через одноразовые 6-значные коды, отправленные на вашу почту.",
      recordingPillarTitle: "Только съемка в реальном времени",
      recordingPillarDesc: "Доступ к камере и микрофону запрашивается только в момент активной записи. Доступа к файлам нет.",
      zeroSellingPillarTitle: "Мы никогда не продаем ваши данные",
      zeroSellingPillarDesc: "Мы никогда не передаем, не сдаем в аренду и не продаем ваши персональные данные третьим лицам.",
      jurisdictionPillarTitle: "Сан-Франциско, Калифорния, США",
      jurispillarDesc: "Условия и политика конфиденциальности регулируются законодательством штата Калифорния, США.",
      allSystemsOperational: "Все системы работают стабильно",
      dangerZoneTitle: "Опасная зона: Удаление профиля",
      dangerZoneDesc: "Безвозвратно удаляет данные профиля, фото и историю сессий. Это действие невозможно отменить.",
      deleteAccountBtn: "Удалить аккаунт навсегда",
      deleteAccountWarning: "Подтверждение приведет к мгновенному выходу и полной очистке профиля.",
      supportDeskTitle: "Официальная служба поддержки Yoouz",
      supportDeskDesc: "Отправляйте запросы в техподдержку, заявки на верификацию бизнеса или жалобы на нарушения правил.",
      fullNameLabel: "Ваше полное имя *",
      emailLabel: "Email *",
      categoryLabel: "Категория *",
      categorySupport: "Общая техподдержка / Аккаунт",
      categoryVerification: "Верификация домена / компании",
      categoryGuidelines: "Жалоба на недостоверный контент",
      categoryPartnership: "Партнерство и интеграция API",
      websiteDomainLabel: "Домен сайта (необязательно)",
      messageLabel: "Текст обращения *",
      messagePlaceholder: "Опишите ваш вопрос или заявку подробно...",
      attachFilesLabel: "Прикрепить скриншоты или подтверждающие файлы (необязательно)",
      dragDropPrompt: "Перетащите файлы сюда или выберите на диске",
      browseFiles: "выбрать файлы",
      fileLimitHint: "PNG, JPG, WEBP, PDF или DOC (до 3 файлов, до 2MB каждый)",
      submitRequest: "Отправить защищенный запрос",
      submitting: "Отправка...",
      inquiryReceivedTitle: "Обращение успешно зарегистрировано",
      inquiryReceivedDesc: "Спасибо за обращение в Yoouz. Ваше сообщение поступило в очередь поддержки. Мы отвечаем в течение 24 часов.",
      sendAnotherInquiry: "Отправить еще одно сообщение",
      deleteConfirmTitle: "Подтверждение удаления аккаунта",
      deleteConfirmDesc: "Это действие необратимо. Чтобы удалить профиль, введите DELETE ниже.",
      typeDeletePlaceholder: "Введите DELETE для подтверждения",
      permanentlyDelete: "Удалить навсегда",
      deleting: "Удаление..."
    },
    discover: {
      title: "Поиск авторов",
      searchPlaceholder: "Поиск автора по имени...",
      searchResults: "Результаты поиска",
      tapToView: "Нажмите для просмотра профиля",
      noReviewersFound: "Авторы не найдены",
      tryDifferentSearch: "Попробуйте изменить поисковый запрос.",
      reviews: "Отзывы",
      followers: "Подписчики"
    },
    auth: {
      help: "Помощь",
      signInTitle: "Вход в Yoouz",
      signInSubtitle: "Введите email для получения 6-значного кода подтверждения. Быстро, без паролей и безопасно.",
      recordTitle: "Войдите, чтобы записать видеоотзыв",
      recordSubtitle: "Присоединяйтесь к проверенным авторам и делитесь честными 60-секундными видеообзорами.",
      followingTitle: "Войдите, чтобы подписаться на авторов",
      followingSubtitle: "Следите за любимыми авторами и узнавайте о новых местах первыми.",
      messagesTitle: "Войдите для доступа к сообщениям",
      messagesSubtitle: "Общайтесь напрямую с авторами и владельцами заведений.",
      notificationsTitle: "Войдите для получения уведомлений",
      notificationsSubtitle: "Узнавайте в реальном времени, когда оценивают или комментируют ваши видео.",
      bookmarksTitle: "Войдите, чтобы сохранять места",
      bookmarksSubtitle: "Сохраняйте любимые кафе и рестораны, чтобы посетить их позже.",
      profileTitle: "Войдите в свой профиль",
      profileSubtitle: "Просматривайте свои отзывы, статистику подписчиков и настраивайте профиль.",
      commentTitle: "Войдите, чтобы участвовать в обсуждении",
      commentSubtitle: "Делитесь мнениями, задавайте вопросы и общайтесь с сообществом.",
      claimTitle: "Войдите для подтверждения компании",
      claimSubtitle: "Подтвердите права на заведение, отвечайте на отзывы и привлекайте клиентов.",
      checkEmail: "Проверьте вашу почту",
      sentCodeTo: "Мы отправили 6-значный код подтверждения на",
      completeProfileTitle: "Заполните профиль",
      completeProfileSubtitle: "Укажите имя и город для публикации проверенных отзывов.",
      emailAddress: "Электронная почта",
      emailPlaceholder: "you@example.com",
      continueEmail: "Продолжить с Email",
      invalidEmailError: "Пожалуйста, введите корректный адрес электронной почты.",
      verificationCode: "6-значный код подтверждения",
      digitsCount: "цифр",
      verifyCode: "Подтвердить код",
      changeEmail: "Изменить email",
      resendCode: "Отправить код повторно",
      firstName: "Имя",
      lastName: "Фамилия",
      country: "Страна",
      city: "Город",
      regionProvince: "Регион / Область",
      selectCity: "Выберите город",
      completeProfileEnter: "Завершить и войти",
      termsAgreementPrefix: "Продолжая, вы принимаете наши",
      termsOfService: "Условия обслуживания",
      and: "и",
      privacyPolicy: "Политику конфиденциальности",
      copyright: "© 2026 Yoouz. Реальные люди. Честные отзывы."
    },
    businessAuth: {
      title: "Вход в Yoouz для бизнеса",
      subtitle: "Подтвердите права на компанию, отвечайте на видеоотзывы и общайтесь с клиентами.",
      workEmail: "Корпоративный Email",
      htmlCodeTag: "HTML Meta-тег",
      instant: "Мгновенно",
      emailPlaceholder: "you@company.com",
      continueMagicLink: "Войти по ссылке",
      exit: "Выход",
      change: "Изменить",
      switchToHtmlTag: "Верификация через HTML-тег",
      checkInbox: "Проверьте почту",
      codeSentTo: "Введите 6-значный код, отправленный на",
      verificationCode: "Код подтверждения",
      verifyCode: "Подтвердить",
      resendCode: "Отправить повторно",
      htmlVerificationTitle: "Верификация через HTML Meta-тег",
      searchPlaceLabel: "Найдите и выберите заведение",
      searchPlacePlaceholder: "Поиск по названию или адресу...",
      pasteTagInstruction: "Скопируйте код и вставьте его внутри тега <head> на вашем сайте:",
      copyTag: "Скопировать Meta-тег",
      copied: "Скопировано!",
      verifyDomain: "Проверить верификацию",
      verifying: "Проверка..."
    },
    legal: {
      termsConditions: "Условия обслуживания",
      privacyPolicy: "Политика конфиденциальности",
      supportDesk: "Служба поддержки",
      networkLocation: "Yoouz Trust Network • Сан-Франциско, США",
      copyright: "© 2026 Yoouz Inc. Все права защищены. Реальные люди. Честные отзывы."
    },
    settings: {
      language_preference: "Настройки языка и региона",
      language_subtitle: "Мгновенное переключение между 64 языками с полной поддержкой локализации и направления текста RTL.",
      search_languages_placeholder: "Поиск среди 64 языков..."
    }
  },
  zh: {
    nav: {
      home: "首页",
      search: "搜索",
      discover: "发现",
      following: "关注",
      messages: "消息",
      notifications: "通知",
      bookmarks: "收藏",
      business: "商家入驻",
      profile: "个人主页",
      more: "更多",
      record_review: "录制视频评价",
      language: "语言设置"
    },
    common: {
      back: "返回",
      close: "关闭",
      save: "保存",
      cancel: "取消",
      confirm: "确认",
      delete: "删除",
      edit: "编辑",
      share: "分享",
      search: "搜索地点、餐厅...",
      loading: "加载中...",
      verified: "已认证",
      follow: "关注",
      following: "已关注",
      unfollow: "取消关注",
      directions: "导航路线",
      website: "官网",
      call: "拨打电话",
      chat: "私信",
      view_all: "查看全部",
      see_more: "展开更多",
      see_less: "收起",
      copy_link: "复制链接",
      copied: "已复制！",
      report: "举报",
      settings: "设置",
      select_language: "选择语言",
      system_default: "跟随系统语言",
      success: "操作成功",
      error: "出错了",
      retry: "重试",
      just_now: "刚刚",
      ago: "前",
      hours: "小时",
      days: "天",
      minutes: "分钟"
    },
    video: {
      by: "创作者",
      unmute: "点击开启声音",
      mute: "静音",
      likes: "点赞",
      comments: "评论",
      shares: "分享",
      bookmarks: "收藏",
      no_reviews: "暂无视频评价",
      record_first: "成为第一个录制评价的创作者！",
      exceptional: "5.0 • 极佳",
      great: "4.0 • 很好",
      average: "3.0 • 一般",
      poor: "2.0 • 较差",
      terrible: "1.0 • 很差",
      more_options: "更多选项",
      delete_review: "删除评价",
      report_video: "举报违规视频"
    },
    place: {
      reviews: "视频真实评价",
      about: "关于门店",
      photos: "环境相册",
      menu: "精选菜单",
      claim_business: "认领并认证商家",
      suggest_edits: "建议修改信息",
      claimed: "官方认证商家",
      unclaimed: "未认领门店",
      verified_location: "实地认证位置",
      total_reviews: "条真实评价",
      rating: "评分",
      about_business: "门店详细介绍",
      chat_unavailable: "该商家暂未开通私信"
    },
    record: {
      title: "录制真实视频评价",
      select_place: "选择打卡商家或地点",
      start_recording: "开始录制",
      stop_recording: "结束录制",
      re_record: "重新录制",
      publish_review: "立即发布评价",
      publishing: "正在发布评价...",
      recording: "正在实时录制...",
      time_left: "剩余",
      face_not_detected: "未检测到面部，请将前置摄像头对准本人脸部。",
      camera_permission: "请授予摄像头权限以录制真实评价。",
      content_safety_violation: "安全合规拦截：检测到不当视觉内容，录制已终止。",
      front_camera_only: "认证评价必须使用前置自拍镜头",
      one_minute_limit: "最长限时 60 秒"
    },
    share: {
      share_title: "分享到",
      share_subtitle: "将这条真实视频评价分享给朋友",
      whatsapp: "WhatsApp",
      twitter: "X (Twitter)",
      facebook: "Facebook",
      telegram: "Telegram",
      email: "电子邮件",
      copy: "复制链接"
    },
    comments: {
      title: "评论区",
      placeholder: "留下善意真诚的评论...",
      post: "发表",
      reply: "回复",
      no_comments: "暂无评论",
      be_first: "快来发表第一条评论吧！"
    },
    business: {
      for_businesses: "Yoouz 商家服务",
      claim_now: "认领您的商家主页",
      manage_profile: "管理商家信息",
      dashboard: "店长控制台",
      analytics: "视频曝光分析",
      upgrade: "升级专业版"
    },
    trustCenter: {
      hub: "Yoouz 信任中心",
      subtitle: "真实性、认证与官方支持",
      title: "知识与信任中心",
      pillarsTitle: "在场实证 • 真人出镜 • 认证地标",
      pillarsDesc: "传统纯文字评价极易遭受水军刷单、虚假账号和 AI 伪造。Yoouz 通过必须使用设备前置摄像头实时拍摄的 60 秒短视频评价，重塑数字评价的真实信任。",
      strictRule: "核心准则",
      rule1Title: "仅限前置实时镜头",
      rule1Desc: "禁止上传预录视频或素材库片段。真实顾客实时记录真切体验。",
      pillar2: "支柱 2",
      rule2Title: "60秒精炼时长",
      rule2Desc: "精炼、高价值的视频评价，一分钟内传递核心信息，杜绝拖沓与营销废话。",
      pillar3: "支柱 3",
      rule3Title: "三方公开互动",
      rule3Desc: "实时评论互动区，连接评价者、探索用户与认证商家负责人。",
      trustProtocol: "信任协议",
      helpFaqs: "帮助与常见问题",
      forBusinesses: "商家服务",
      privacySecurity: "隐私与安全体系",
      contactSupport: "联系官方支持",
      theYoouzStandard: "Yoouz 信任标准",
      bento1Title: "人脸与声纹不可篡改",
      bento1Desc: "每位评价者构建公开的视频档案。真实人脸、认证声纹与连续发布记录，让观众获得即时信任。",
      bento1Sub: "即时查验任意评价者主页",
      bento2Title: "实时社群互动质询",
      bento2Desc: "评价不是单向陈述。观众可实时提问，社群共同交叉印证真实体验。",
      bento2Sub: "社群协同验证",
      bento3Title: "官方域名认证体系",
      bento3Desc: "商家通过 DNS 或网页标签认证域名，享有专属官方蓝标并在评论区置顶解答。",
      bento3Sub: "店长置顶解答",
      bento4Title: "绝无付费删评机制",
      bento4Desc: "与传统平台不同，Yoouz 保证所有合规的真实评价完全公开透明，绝不受商业付费干预。",
      bento4Sub: "所有用户与商家标准 100% 统一",
      verifiedMember: "认证会员 • 活跃贡献者",
      searchFaqsPlaceholder: "按关键词或主题搜索解答...",
      categoryAll: "全部主题",
      categoryReviewers: "评价者指南",
      categoryBusiness: "商家指南",
      categoryTrust: "信任与安全",
      categoryTechnical: "技术与隐私",
      noMatchingFaqs: "未找到相关问题",
      tryDifferentKeywords: "请尝试使用其他关键词搜索，或切换分类筛选。",
      clearFilter: "清空筛选",
      businessHeroTitle: "将真实视频评价转化为您的增长引擎",
      businessHeroDesc: "Yoouz 为认证商家提供直接的主页管理工具、视频互动通道与权威防伪凭证。",
      verifiedOwnerBadgeTitle: "认证商家专属蓝标",
      verifiedOwnerBadgeDesc: "通过 DNS 或 HTML 标签认证您的域名，在所有回复中解锁官方认证徽章。",
      pinnedSolutionsTitle: "官方解答置顶",
      pinnedSolutionsDesc: "置顶官方解答视频，透明回应顾客关切，积累长期信誉资产。",
      embedTrustFeedsTitle: "嵌入实时视频流组件",
      embedTrustFeedsDesc: "通过极速播放小组件，将顾客发布的 60 秒真实视频评价直接展示在您的官网上。",
      requestVerification: "申请域名认证",
      readyToVerify: "准备好认领并认证您的商家了吗？",
      privacySecurityTitle: "Google 级隐私与安全架构",
      googleVerified: "Google OAuth 登录 • 无需存储密码",
      privacySummary: "Yoouz 严格遵循隐私优先原则构建。我们采用免密码安全验证，仅在录制时实时读取摄像头，绝不访问您的本地相册，受美国加利福尼亚州旧金山法律管辖。",
      updatedDate: "更新时间：2026年8月",
      privacyPolicyTitle: "隐私政策",
      privacyPolicyDesc: "涵盖账号数据处理、实时相机/麦克风权限、绝不出售个人数据承诺及账号注销权益。",
      readPrivacyPolicy: "查阅完整隐私政策",
      termsConditionsTitle: "服务条款",
      termsConditionsDesc: "涵盖实时录制规范、反爬虫规则、商业流媒体授权及责任限制条款。",
      readTermsConditions: "查阅服务条款",
      authPillarTitle: "无密码安全登录",
      authPillarDesc: "我们绝不保存密码。所有登录均通过加密发送至您邮箱的 6 位动态验证码完成。",
      recordingPillarTitle: "仅限实时拍摄权限",
      recordingPillarDesc: "仅在用户主动录制时访问摄像头与麦克风，绝不读取设备本地媒体库。",
      zeroSellingPillarTitle: "绝不出售个人数据",
      zeroSellingPillarDesc: "我们绝不会向任何第三方出售、出租或交易您的个人隐私数据。",
      jurisdictionPillarTitle: "美国加州旧金山司法管辖",
      jurispillarDesc: "平台条款与隐私政策受美国加利福尼亚州法律管辖，争议由旧金山法院裁决。",
      allSystemsOperational: "所有服务运行正常",
      dangerZoneTitle: "危险区域：注销并删除账号",
      dangerZoneDesc: "永久抹除您的个人资料、简介、头像和所有会话数据。此操作不可逆。",
      deleteAccountBtn: "永久注销账号",
      deleteAccountWarning: "确认注销将立即退出登录并彻底清空您的个人资料。",
      supportDeskTitle: "Yoouz 官方支持中心",
      supportDeskDesc: "提交技术支持咨询、商家域名认证申请或举报违规虚假内容。",
      fullNameLabel: "您的姓名 *",
      emailLabel: "电子邮箱 *",
      categoryLabel: "咨询类别 *",
      categorySupport: "账号与技术支持",
      categoryVerification: "商家域名与主页认证",
      categoryGuidelines: "举报违规或虚假内容",
      categoryPartnership: "商务合作与 API 咨询",
      websiteDomainLabel: "官网域名（选填）",
      messageLabel: "咨询内容详情 *",
      messagePlaceholder: "请详细描述您的问题或申请需求...",
      attachFilesLabel: "上传截图或证明材料（选填）",
      dragDropPrompt: "拖拽文件至此处，或点击浏览文件",
      browseFiles: "浏览文件",
      fileLimitHint: "支持 PNG, JPG, WEBP, PDF 或 DOC（最多 3 个文件，每个不超过 2MB）",
      submitRequest: "提交安全工单",
      submitting: "正在提交...",
      inquiryReceivedTitle: "工单提交成功",
      inquiryReceivedDesc: "感谢您联系 Yoouz。您的留言已安全进入支持工单系统，我们的团队将在 24 小时内完成处理并回复。",
      sendAnotherInquiry: "提交新的工单",
      deleteConfirmTitle: "确认注销账号",
      deleteConfirmDesc: "此操作不可撤销。如确认永久注销，请在下方输入 DELETE。",
      typeDeletePlaceholder: "输入 DELETE 以确认",
      permanentlyDelete: "确认永久删除",
      deleting: "正在删除..."
    },
    discover: {
      title: "发现优质创作者",
      searchPlaceholder: "按名字搜索创作者...",
      searchResults: "搜索结果",
      tapToView: "点击查看个人主页",
      noReviewersFound: "未找到相关创作者",
      tryDifferentSearch: "请尝试搜索其他姓名。",
      reviews: "评价",
      followers: "粉丝"
    },
    auth: {
      help: "帮助",
      signInTitle: "登录 Yoouz",
      signInSubtitle: "输入您的邮箱以获取 6 位安全验证码。无需密码，即刻登录，安全私密。",
      recordTitle: "登录以录制视频评价",
      recordSubtitle: "加入认证创作者队伍，分享 60 秒真实探店视频评价。",
      followingTitle: "登录以关注创作者",
      followingSubtitle: "关注您喜爱的创作者，在他们发布新评价时第一时间获取动态。",
      messagesTitle: "登录以查看私信",
      messagesSubtitle: "与创作者及认证商家直接沟通交流。",
      notificationsTitle: "登录以获取实时通知",
      notificationsSubtitle: "当有人点赞、评论或互动您的视频时及时掌握消息。",
      bookmarksTitle: "登录以收藏地点",
      bookmarksSubtitle: "收藏您喜爱的餐厅、咖啡馆和宝藏去处，方便随时重访。",
      profileTitle: "登录以查看个人主页",
      profileSubtitle: "管理您发布的评价、查看粉丝动态并个性化您的主页。",
      commentTitle: "登录以参与讨论",
      commentSubtitle: "发表您的真知灼见，提问并与社群成员直接交流。",
      claimTitle: "登录以认领商家主页",
      claimSubtitle: "验证您的商家所有权，回复视频评价并与顾客紧密互动。",
      checkEmail: "请查收您的邮箱",
      sentCodeTo: "我们已向以下邮箱发送了 6 位安全验证码：",
      completeProfileTitle: "完善个人资料",
      completeProfileSubtitle: "填写您的姓名与所在地区以发布认证评价。",
      emailAddress: "电子邮箱",
      emailPlaceholder: "you@example.com",
      continueEmail: "通过邮箱继续",
      invalidEmailError: "请输入有效的电子邮箱地址。",
      verificationCode: "6 位数字验证码",
      digitsCount: "位数字",
      verifyCode: "验证并登录",
      changeEmail: "更换邮箱",
      resendCode: "重新发送验证码",
      firstName: "名",
      lastName: "姓",
      country: "国家 / 地区",
      city: "城市",
      regionProvince: "省份 / 州",
      selectCity: "选择城市",
      completeProfileEnter: "完成资料并进入",
      termsAgreementPrefix: "继续操作即代表您同意我们的",
      termsOfService: "服务条款",
      and: "和",
      privacyPolicy: "隐私政策",
      copyright: "© 2026 Yoouz. 真人出镜 • 真实评价"
    },
    businessAuth: {
      title: "登录 Yoouz 商家后台",
      subtitle: "认领您的商家主页，回复视频评价并以官方身份连接顾客。",
      workEmail: "企业工作邮箱",
      htmlCodeTag: "HTML Meta 标签认证",
      instant: "即时验证",
      emailPlaceholder: "you@company.com",
      continueMagicLink: "通过验证链接继续",
      exit: "返回",
      change: "修改",
      switchToHtmlTag: "切换为 HTML 标签认证",
      checkInbox: "请查收您的收件箱",
      codeSentTo: "请输入发送至以下邮箱的 6 位验证码：",
      verificationCode: "验证码",
      verifyCode: "确认验证码",
      resendCode: "重新发送",
      htmlVerificationTitle: "HTML Meta 标签验证",
      searchPlaceLabel: "搜索并选择要认领的商家",
      searchPlacePlaceholder: "搜索商家名称或地址...",
      pasteTagInstruction: "复制以下验证代码并粘贴到您官网网页代码的 <head> 区域中：",
      copyTag: "复制 Meta 标签",
      copied: "已复制！",
      verifyDomain: "立即验证域名标签",
      verifying: "正在验证..."
    },
    legal: {
      termsConditions: "服务条款",
      privacyPolicy: "隐私政策",
      supportDesk: "支持中心",
      networkLocation: "Yoouz 信任网络 • 美国加州旧金山",
      copyright: "© 2026 Yoouz Inc. 保留所有权利。真人出镜 • 真实评价"
    },
    settings: {
      language_preference: "语言与地区偏好",
      language_subtitle: "支持在 64 种语言之间即时无缝切换，包含完整翻译及 RTL 双向文字排版适配。",
      search_languages_placeholder: "在 64 种支持的语言中搜索..."
    }
  },
  ja,
  ko,
  hi,
  tr,
  nl,
  id
};
