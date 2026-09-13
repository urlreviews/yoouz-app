import { nl } from "./locales/nl";
import { ja } from "./locales/ja";
import { ko } from "./locales/ko";
import { tr } from "./locales/tr";
import { id } from "./locales/id";
import { hi } from "./locales/hi";
import { fr } from "./locales/fr";
import { es } from "./locales/es";
import { de } from "./locales/de";
import { it } from "./locales/it";
import { pt } from "./locales/pt";
import { ru } from "./locales/ru";
import { he } from "./locales/he";
import { ar } from "./locales/ar";
import { zh } from "./locales/zh";
import { pl } from "./locales/pl";
import { uk } from "./locales/uk";
import { sv } from "./locales/sv";
import { no } from "./locales/no";
import { da } from "./locales/da";
import { fi } from "./locales/fi";
import { el } from "./locales/el";
import { cs } from "./locales/cs";
import { hu } from "./locales/hu";
import { ro } from "./locales/ro";
import { bg } from "./locales/bg";
import { sk } from "./locales/sk";
import { hr } from "./locales/hr";
import { sr } from "./locales/sr";
import { sl } from "./locales/sl";
import { lt } from "./locales/lt";
import { lv } from "./locales/lv";
import { et } from "./locales/et";
import { vi } from "./locales/vi";
import { th } from "./locales/th";
import { ms } from "./locales/ms";
import { bn } from "./locales/bn";
import { pa } from "./locales/pa";
import { ta } from "./locales/ta";
import { te } from "./locales/te";
import { mr } from "./locales/mr";
import { gu } from "./locales/gu";
import { kn } from "./locales/kn";
import { ml } from "./locales/ml";
import { ur } from "./locales/ur";
import { tl } from "./locales/tl";
import { sw } from "./locales/sw";
import { fa } from "./locales/fa";
import { my } from "./locales/my";
import { km } from "./locales/km";
import { am } from "./locales/am";
import { so } from "./locales/so";
import { ha } from "./locales/ha";
import { yo } from "./locales/yo";
import { ig } from "./locales/ig";
import { zu } from "./locales/zu";
import { is } from "./locales/is";
import { sq } from "./locales/sq";
import { ga } from "./locales/ga";
import { ca } from "./locales/ca";
import { eu } from "./locales/eu";
import { gl } from "./locales/gl";
import { mt } from "./locales/mt";
import { ka } from "./locales/ka";
import { hy } from "./locales/hy";
import { az } from "./locales/az";
import { zhTW } from "./locales/zhTW";
import { lo } from "./locales/lo";
import { kk } from "./locales/kk";
import { uz } from "./locales/uz";
import { mn } from "./locales/mn";
import { ne } from "./locales/ne";
import { si } from "./locales/si";
import { xh } from "./locales/xh";
import { af } from "./locales/af";

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
      record_review: "Video Review",
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
      record_first: "Be the first creator to record a video review!",
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
      start_recording: "Record Video Review",
      stop_recording: "Stop Recording",
      re_record: "Re-record",
      publish_review: "Publish Video Review",
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
      privacySecurity: "Privacy",
      contactSupport: "Support",
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
      recordTitle: "Sign in to Record a Video Review",
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
      completeProfileSubtitle: "Customize your public profile card.",
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
      emailPlaceholder: "name@yourcompany.com",
      continueMagicLink: "Continue with Magic Link",
      exit: "Exit",
      change: "Change",
      switchToHtmlTag: "Switch to HTML Code Tag verification",
      checkInbox: "Enter 6-Digit Code",
      codeSentTo: "We sent an official confirmation code to",
      verificationCode: "Verification Code",
      verifyCode: "Verify & Access Dashboard",
      resendCode: "Resend verification code",
      searchPlaceOptional: "Select business listing (optional)",
      reviewerConflictSelf: "This email is registered to your customer/reviewer account. Business accounts must use an official, dedicated work email to maintain review authenticity and avoid conflicts of interest.",
      reviewerConflictReview: "This email is associated with a customer reviewer who has posted video reviews. Business accounts must use a dedicated business email to protect review integrity.",
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
      language_preference: "Language",
      language_subtitle: "",
      search_languages_placeholder: "Search language..."
    }
  },
  ar,
  es,
  fr,
  de,
  it,
  pt,
  ru,
  zh,
  he,
  pl,
  ja,
  ko,
  hi,
  tr,
  nl,
  id,
  uk,
  sv,
  no,
  da,
  fi,
  el,
  cs,
  hu,
  ro,
  bg,
  sk,
  hr,
  sr,
  sl,
  lt,
  lv,
  et,
  vi,
  th,
  ms,
  bn,
  pa,
  ta,
  te,
  mr,
  gu,
  kn,
  ml,
  ur,
  tl,
  sw,
  fa,
  my,
  km,
  am,
  so,
  ha,
  yo,
  ig,
  zu,
  is,
  sq,
  ga,
  ca,
  eu,
  gl,
  mt,
  ka,
  hy,
  az,
  "zh-TW": zhTW,
  lo,
  kk,
  uz,
  mn,
  ne,
  si,
  xh,
  af
};
