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
    }
  },
  ja: {
    nav: {
      home: "ホーム",
      search: "検索",
      discover: "見つける",
      following: "フォロー中",
      messages: "メッセージ",
      notifications: "通知",
      bookmarks: "保存済み",
      business: "店舗・法人向け",
      profile: "プロフィール",
      more: "その他",
      record_review: "レビューを撮影",
      language: "言語"
    },
    common: {
      back: "戻る",
      close: "閉じる",
      save: "保存",
      cancel: "キャンセル",
      confirm: "確認",
      delete: "削除",
      edit: "編集",
      share: "共有",
      search: "店舗・場所を検索...",
      loading: "読み込み中...",
      verified: "認証済み",
      follow: "フォロー",
      following: "フォロー中",
      unfollow: "フォロー解除",
      directions: "経路案内",
      website: "公式サイト",
      call: "電話する",
      chat: "チャット",
      view_all: "すべて表示",
      see_more: "もっと見る",
      see_less: "閉じる",
      copy_link: "リンクをコピー",
      copied: "コピーしました！",
      report: "報告",
      settings: "設定",
      select_language: "言語を選択",
      system_default: "システム設定に従う",
      success: "成功",
      error: "エラー",
      retry: "再試行",
      just_now: "たった今",
      ago: "前",
      hours: "時間",
      days: "日",
      minutes: "分"
    },
    video: {
      by: "投稿者",
      unmute: "タップして音声を再生",
      mute: "ミュート",
      likes: "いいね",
      comments: "コメント",
      shares: "シェア",
      bookmarks: "保存",
      no_reviews: "動画レビューはまだありません",
      record_first: "最初の動画レビューを投稿してみましょう！",
      exceptional: "5.0 • 最高",
      great: "4.0 • 素晴らしい",
      average: "3.0 • 普通",
      poor: "2.0 • いまいち",
      terrible: "1.0 • 不満",
      more_options: "その他のオプション",
      delete_review: "レビューを削除",
      report_video: "不適切な動画を報告"
    },
    place: {
      reviews: "動画レビュー",
      about: "詳細情報",
      photos: "写真",
      menu: "メニュー",
      claim_business: "オーナー確認・認証",
      suggest_edits: "情報の修正を提案",
      claimed: "公式認証店舗",
      unclaimed: "未登録の店舗",
      verified_location: "認証済みスポット",
      total_reviews: "件のレビュー",
      rating: "評価",
      about_business: "この店舗について",
      chat_unavailable: "ダイレクトメッセージは現在利用できません"
    },
    record: {
      title: "動画レビューを撮影",
      select_place: "店舗または場所を選択",
      start_recording: "レビュー撮影開始",
      stop_recording: "撮影停止",
      re_record: "撮り直す",
      publish_review: "レビューを公開",
      publishing: "公開中...",
      recording: "リアルタイム撮影中...",
      time_left: "残り",
      face_not_detected: "顔が検出されませんでした。インカメラに顔を向けてください。",
      camera_permission: "本物のレビューを撮影するためにカメラへのアクセスを許可してください。",
      content_safety_violation: "安全基準違反：不適切な内容が検出されたため中止されました。",
      front_camera_only: "認証レビューにはインカメラのみ使用可能です",
      one_minute_limit: "最長60秒まで"
    },
    share: {
      share_title: "共有",
      share_subtitle: "この動画レビューを友達とシェア",
      whatsapp: "WhatsApp",
      twitter: "X (Twitter)",
      facebook: "Facebook",
      telegram: "Telegram",
      email: "メール",
      copy: "リンクをコピー"
    },
    comments: {
      title: "コメント",
      placeholder: "温かいコメントを書き込む...",
      post: "投稿",
      reply: "返信",
      no_comments: "コメントはまだありません",
      be_first: "最初のコメントを投稿しましょう！"
    },
    business: {
      for_businesses: "Yoouz 店舗・ビジネス向け",
      claim_now: "店舗ページをオーナー登録",
      manage_profile: "店舗管理",
      dashboard: "オーナーダッシュボード",
      analytics: "動画インサイト",
      upgrade: "プランのアップグレード"
    }
  },
  ko: {
    nav: {
      home: "홈",
      search: "검색",
      discover: "탐색",
      following: "팔로잉",
      messages: "메시지",
      notifications: "알림",
      bookmarks: "저장됨",
      business: "비즈니스",
      profile: "프로필",
      more: "더보기",
      record_review: "영상 리뷰 촬영",
      language: "언어 설정"
    },
    common: {
      back: "뒤로",
      close: "닫기",
      save: "저장",
      cancel: "취소",
      confirm: "확인",
      delete: "삭제",
      edit: "수정",
      share: "공유",
      search: "장소, 맛집 검색...",
      loading: "로딩 중...",
      verified: "인증됨",
      follow: "팔로우",
      following: "팔로잉",
      unfollow: "언팔로우",
      directions: "길찾기",
      website: "웹사이트",
      call: "전화",
      chat: "채팅",
      view_all: "전체 보기",
      see_more: "더보기",
      see_less: "접기",
      copy_link: "링크 복사",
      copied: "복사됨!",
      report: "신고",
      settings: "설정",
      select_language: "언어 선택",
      system_default: "시스템 기본값",
      success: "성공",
      error: "오류",
      retry: "재시도",
      just_now: "방금 전",
      ago: "전",
      hours: "시간",
      days: "일",
      minutes: "분"
    },
    video: {
      by: "작성자",
      unmute: "탭하여 소리 켜기",
      mute: "음소거",
      likes: "좋아요",
      comments: "댓글",
      shares: "공유",
      bookmarks: "저장",
      no_reviews: "아직 등록된 영상 리뷰가 없습니다",
      record_first: "첫 번째 영상 리뷰를 남겨보세요!",
      exceptional: "5.0 • 완벽해요",
      great: "4.0 • 훌륭해요",
      average: "3.0 • 보통이에요",
      poor: "2.0 • 아쉬워요",
      terrible: "1.0 • 별로예요",
      more_options: "옵션 더보기",
      delete_review: "리뷰 삭제",
      report_video: "부적절한 영상 신고"
    },
    place: {
      reviews: "영상 리뷰",
      about: "장소 정보",
      photos: "사진",
      menu: "메뉴",
      claim_business: "매장 등록 및 소유권 인증",
      suggest_edits: "정보 수정 제안",
      claimed: "인증된 매장",
      unclaimed: "미등록 매장",
      verified_location: "확인된 위치",
      total_reviews: "개의 리뷰",
      rating: "평점",
      about_business: "매장 소개",
      chat_unavailable: "현재 1:1 메시지를 지원하지 않습니다"
    },
    record: {
      title: "영상 리뷰 촬영",
      select_place: "매장 또는 장소 선택",
      start_recording: "촬영 시작",
      stop_recording: "촬영 중지",
      re_record: "다시 촬영",
      publish_review: "리뷰 등록하기",
      publishing: "리뷰 등록 중...",
      recording: "실시간 촬영 중...",
      time_left: "남음",
      face_not_detected: "얼굴이 감지되지 않았습니다. 전면 카메라를 응시해주세요.",
      camera_permission: "진짜 리뷰 촬영을 위해 카메라 권한을 허용해주세요.",
      content_safety_violation: "안전 가이드라인 위반: 부적절한 영상으로 감지되어 촬영이 중단되었습니다.",
      front_camera_only: "신뢰할 수 있는 리뷰를 위해 전면 카메라만 사용됩니다",
      one_minute_limit: "최대 60초"
    },
    share: {
      share_title: "공유하기",
      share_subtitle: "친구들과 이 영상 리뷰를 공유해보세요",
      whatsapp: "WhatsApp",
      twitter: "X (Twitter)",
      facebook: "Facebook",
      telegram: "Telegram",
      email: "이메일",
      copy: "링크 복사"
    },
    comments: {
      title: "댓글",
      placeholder: "따뜻한 댓글을 남겨주세요...",
      post: "등록",
      reply: "답글",
      no_comments: "아직 댓글이 없습니다",
      be_first: "첫 번째 댓글의 주인공이 되어보세요!"
    },
    business: {
      for_businesses: "Yoouz 비즈니스",
      claim_now: "매장 프로필 등록",
      manage_profile: "매장 관리",
      dashboard: "사장님 대시보드",
      analytics: "영상 통계",
      upgrade: "플랜 업그레이드"
    }
  },
  hi: {
    nav: {
      home: "होम",
      search: "खोजें",
      discover: "एक्सप्लोर करें",
      following: "फॉलोइंग",
      messages: "संदेश",
      notifications: "सूचनाएं",
      bookmarks: "सहेजे गए",
      business: "व्यवसाय के लिए",
      profile: "प्रोफ़ाइल",
      more: "अधिक",
      record_review: "रिव्यू रिकॉर्ड करें",
      language: "भाषा"
    },
    common: {
      back: "पीछे",
      close: "बंद करें",
      save: "सहेजें",
      cancel: "रद्द करें",
      confirm: "पुष्टि करें",
      delete: "हटाएं",
      edit: "संपादित करें",
      share: "साझा करें",
      search: "स्थान या रेस्टोरेंट खोजें...",
      loading: "लोड हो रहा है...",
      verified: "सत्यापित",
      follow: "फॉलो करें",
      following: "फॉलो कर रहे हैं",
      unfollow: "अनफॉलो करें",
      directions: "दिशा-निर्देश",
      website: "वेबसाइट",
      call: "कॉल करें",
      chat: "चैट",
      view_all: "सभी देखें",
      see_more: "और देखें",
      see_less: "कम देखें",
      copy_link: "लिंक कॉपी करें",
      copied: "कॉपी हो गया!",
      report: "रिपोर्ट करें",
      settings: "सेटिंग्स",
      select_language: "भाषा चुनें",
      system_default: "सिस्टम डिफ़ॉल्ट",
      success: "सफल",
      error: "त्रुटि",
      retry: "पुनः प्रयास करें",
      just_now: "अभी-अभी",
      ago: "पहले",
      hours: "घंटे",
      days: "दिन",
      minutes: "मिनट"
    },
    video: {
      by: "द्वारा",
      unmute: "आवाज़ चालू करने के लिए टैप करें",
      mute: "म्यूट करें",
      likes: "पसंद",
      comments: "टिप्पणियां",
      shares: "शेयर",
      bookmarks: "सहेजे गए",
      no_reviews: "अभी तक कोई वीडियो समीक्षा नहीं है",
      record_first: "समीक्षा रिकॉर्ड करने वाले पहले क्रिएटर बनें!",
      exceptional: "5.0 • असाधारण",
      great: "4.0 • बहुत बढ़िया",
      average: "3.0 • सामान्य",
      poor: "2.0 • खराब",
      terrible: "1.0 • बहुत खराब",
      more_options: "अन्य विकल्प",
      delete_review: "रिव्यू हटाएं",
      report_video: "अनुचित वीडियो की रिपोर्ट करें"
    },
    place: {
      reviews: "वीडियो समीक्षाएं",
      about: "के बारे में",
      photos: "तस्वीरें",
      menu: "मेनू",
      claim_business: "व्यवसाय सत्यापित करें",
      suggest_edits: "बदलाव का सुझाव दें",
      claimed: "सत्यापित व्यवसाय",
      unclaimed: "असत्यापित स्थान",
      verified_location: "सत्यापित स्थान",
      total_reviews: "कुल समीक्षाएं",
      rating: "रेटिंग",
      about_business: "इस व्यवसाय के बारे में",
      chat_unavailable: "सीधे संदेश वर्तमान में उपलब्ध नहीं हैं"
    },
    record: {
      title: "वीडियो रिव्यू रिकॉर्ड करें",
      select_place: "व्यवसाय या स्थान चुनें",
      start_recording: "रिकॉर्ड शुरू करें",
      stop_recording: "रिकॉर्डिंग रोकें",
      re_record: "फिर से रिकॉर्ड करें",
      publish_review: "रिव्यू प्रकाशित करें",
      publishing: "रिव्यू प्रकाशित हो रहा है...",
      recording: "लाइव रिकॉर्डिंग जारी है...",
      time_left: "शेष",
      face_not_detected: "चेहरा नहीं दिखा। कृपया फ्रंट कैमरे की ओर देखें।",
      camera_permission: "असली रिव्यू के लिए कैमरा अनुमति दें।",
      content_safety_violation: "सुरक्षा उल्लंघन: अनुचित सामग्री के कारण रिकॉर्डिंग ब्लॉक की गई।",
      front_camera_only: "सत्यापित रिव्यू के लिए केवल फ्रंट कैमरा अनिवार्य है",
      one_minute_limit: "अधिकतम 60 सेकंड"
    },
    share: {
      share_title: "शेयर करें",
      share_subtitle: "दोस्तों के साथ यह वीडियो रिव्यू शेयर करें",
      whatsapp: "WhatsApp",
      twitter: "X (Twitter)",
      facebook: "Facebook",
      telegram: "Telegram",
      email: "ईमेल",
      copy: "लिंक कॉपी करें"
    },
    comments: {
      title: "टिप्पणियां",
      placeholder: "एक अच्छी टिप्पणी जोड़ें...",
      post: "पोस्ट करें",
      reply: "उत्तर दें",
      no_comments: "अभी कोई टिप्पणी नहीं",
      be_first: "पहली टिप्पणी करने वाले बनें!"
    },
    business: {
      for_businesses: "व्यवसायों के लिए Yoouz",
      claim_now: "अपनी प्रोफ़ाइल क्लेम करें",
      manage_profile: "व्यवसाय प्रबंधित करें",
      dashboard: "मालिक डैशबोर्ड",
      analytics: "वीडियो इनसाइट्स",
      upgrade: "प्लान अपग्रेड करें"
    }
  },
  tr: {
    nav: {
      home: "Ana Sayfa",
      search: "Ara",
      discover: "Keşfet",
      following: "Takip Edilenler",
      messages: "Mesajlar",
      notifications: "Bildirimler",
      bookmarks: "Kaydedilenler",
      business: "İşletmeler İçin",
      profile: "Profil",
      more: "Daha Fazla",
      record_review: "Video İncelemesi Çek",
      language: "Dil"
    },
    common: {
      back: "Geri",
      close: "Kapat",
      save: "Kaydet",
      cancel: "İptal",
      confirm: "Onayla",
      delete: "Sil",
      edit: "Düzenle",
      share: "Paylaş",
      search: "Mekan veya restoran ara...",
      loading: "Yükleniyor...",
      verified: "Doğrulanmış",
      follow: "Takip Et",
      following: "Takip Ediliyor",
      unfollow: "Takibi Bırak",
      directions: "Yol Tarifi",
      website: "Web Sitesi",
      call: "Ara",
      chat: "Sohbet",
      view_all: "Tümünü Gör",
      see_more: "Daha fazla",
      see_less: "Daha az",
      copy_link: "Bağlantıyı Kopyala",
      copied: "Kopyalandı!",
      report: "Bildir",
      settings: "Ayarlar",
      select_language: "Dil Seçin",
      system_default: "Sistem Varsayılanı",
      success: "Başarılı",
      error: "Hata",
      retry: "Tekrar Dene",
      just_now: "Az önce",
      ago: "önce",
      hours: "saat",
      days: "gün",
      minutes: "dakika"
    },
    video: {
      by: "Yükleyen",
      unmute: "Sesi Açmak İçin Dokunun",
      mute: "Sesi Kapat",
      likes: "Beğeni",
      comments: "Yorum",
      shares: "Paylaşım",
      bookmarks: "Kaydedilen",
      no_reviews: "Henüz video incelemesi yok",
      record_first: "İlk video incelemesini çeken siz olun!",
      exceptional: "5.0 • Mükemmel",
      great: "4.0 • Çok İyi",
      average: "3.0 • Ortalama",
      poor: "2.0 • Kötü",
      terrible: "1.0 • Berbat",
      more_options: "Diğer Seçenekler",
      delete_review: "İncelemeyi Sil",
      report_video: "Uygunsuz Videoyu Bildir"
    },
    place: {
      reviews: "Video İncelemeleri",
      about: "Hakkında",
      photos: "Fotoğraflar",
      menu: "Menü",
      claim_business: "İşletmeyi Doğrula ve Sahiplen",
      suggest_edits: "Düzenleme Öner",
      claimed: "Doğrulanmış İşletme",
      unclaimed: "Sahiplenilmemiş Mekan",
      verified_location: "Doğrulanmış Konum",
      total_reviews: "toplam inceleme",
      rating: "Puan",
      about_business: "Bu işletme hakkında",
      chat_unavailable: "Direkt mesajlaşma şu an kullanılamıyor"
    },
    record: {
      title: "Video İncelemesi Çek",
      select_place: "Mekan veya İşletme Seçin",
      start_recording: "Kayda Başla",
      stop_recording: "Kaydı Durdur",
      re_record: "Yeniden Çek",
      publish_review: "İncelemeyi Yayınla",
      publishing: "İnceleme yayınlanıyor...",
      recording: "Canlı kayıt yapılıyor...",
      time_left: "kaldı",
      face_not_detected: "Yüz algılanamadı. Lütfen ön kameraya bakın.",
      camera_permission: "Gerçek incelemeler için kamera izni verin.",
      content_safety_violation: "Güvenlik İhlali: Uygunsuz içerik nedeniyle kayıt engellendi.",
      front_camera_only: "Doğrulanmış incelemeler için sadece ön kamera zorunludur",
      one_minute_limit: "En fazla 60 saniye"
    },
    share: {
      share_title: "Paylaş",
      share_subtitle: "Bu video incelemesini arkadaşlarınızla paylaşın",
      whatsapp: "WhatsApp",
      twitter: "X (Twitter)",
      facebook: "Facebook",
      telegram: "Telegram",
      email: "E-posta",
      copy: "Bağlantıyı Kopyala"
    },
    comments: {
      title: "Yorumlar",
      placeholder: "Nazik bir yorum yazın...",
      post: "Gönder",
      reply: "Yanıtla",
      no_comments: "Henüz yorum yok",
      be_first: "İlk yorumu siz yapın!"
    },
    business: {
      for_businesses: "İşletmeler İçin Yoouz",
      claim_now: "İşletme Profilini Sahiplen",
      manage_profile: "İşletmeyi Yönet",
      dashboard: "İşletme Paneli",
      analytics: "Video Analitikleri",
      upgrade: "Paketi Yükselt"
    }
  },
  he: {
    nav: {
      home: "בית",
      search: "חיפוש",
      discover: "גלה",
      following: "במעקב",
      messages: "הודעות",
      notifications: "התראות",
      bookmarks: "שמורים",
      business: "לעסקים",
      profile: "פרופיל",
      more: "עוד",
      record_review: "הקלט ביקורת",
      language: "שפה"
    },
    common: {
      back: "חזור",
      close: "סגור",
      save: "שמור",
      cancel: "ביטול",
      confirm: "אישור",
      delete: "מחק",
      edit: "ערוך",
      share: "שתף",
      search: "חיפוש מקומות ומסעדות...",
      loading: "טוען...",
      verified: "מאומת",
      follow: "עקוב",
      following: "במעקב",
      unfollow: "בטל מעקב",
      directions: "הוראות הגעה",
      website: "אתר",
      call: "התקשר",
      chat: "צ'אט",
      view_all: "הצג הכל",
      see_more: "עוד",
      see_less: "פחות",
      copy_link: "העתק קישור",
      copied: "הועתק!",
      report: "דווח",
      settings: "הגדרות",
      select_language: "בחר שפה",
      system_default: "ברירת מחדל של המערכת",
      success: "הצלחה",
      error: "שגיאה",
      retry: "נסה שוב",
      just_now: "הרגע",
      ago: "לפני",
      hours: "שעות",
      days: "ימים",
      minutes: "דקות"
    },
    video: {
      by: "על ידי",
      unmute: "לחץ להפעלת שמע",
      mute: "השתק",
      likes: "לייקים",
      comments: "תגובות",
      shares: "שיתופים",
      bookmarks: "שמורים",
      no_reviews: "אין עדיין ביקורות וידאו",
      record_first: "היה הראשון שמקליט ביקורת וידאו!",
      exceptional: "5.0 • יוצא מן הכלל",
      great: "4.0 • מעולה",
      average: "3.0 • סביר",
      poor: "2.0 • מאכזב",
      terrible: "1.0 • גרוע",
      more_options: "אפשרויות נוספות",
      delete_review: "מחק ביקורת",
      report_video: "דווח על תוכן לא הולם"
    },
    place: {
      reviews: "ביקורות וידאו",
      about: "אודות",
      photos: "תמונות",
      menu: "תפריט",
      claim_business: "אמת וקבל בעלות על העסק",
      suggest_edits: "הצע עריכה",
      claimed: "עסק מאומת",
      unclaimed: "מקום לא מאומת",
      verified_location: "מיקום מאומת",
      total_reviews: "ביקורות בסך הכל",
      rating: "דירוג",
      about_business: "על בית העסק",
      chat_unavailable: "שליחת הודעות אינה זמינה כרגע"
    },
    record: {
      title: "הקלט ביקורת וידאו",
      select_place: "בחר עסק או מקום",
      start_recording: "התחל להקליט",
      stop_recording: "עצור הקלטה",
      re_record: "הקלט מחדש",
      publish_review: "פרסם ביקורת",
      publishing: "מפרסם ביקורת...",
      recording: "מקליט בשידור חי...",
      time_left: "נותרו",
      face_not_detected: "הפנים לא זוהו. אנא התבונן במצלמה הקדמית.",
      camera_permission: "אנא אשר גישה למצלמה להקלטת ביקורות אותנטיות.",
      content_safety_violation: "הפרת בטיחות: ההקלטה נחסמה עקב תוכן בלתי הולם.",
      front_camera_only: "מצלמה קדמית בלבד נדרשת לביקורות מאומתות",
      one_minute_limit: "עד 60 שניות"
    },
    share: {
      share_title: "שיתוף",
      share_subtitle: "שתף ביקורת וידאו זו עם חברים",
      whatsapp: "WhatsApp",
      twitter: "X (Twitter)",
      facebook: "Facebook",
      telegram: "Telegram",
      email: "אימייל",
      copy: "העתק קישור"
    },
    comments: {
      title: "תגובות",
      placeholder: "הוסף תגובה חיובית...",
      post: "פרסם",
      reply: "השב",
      no_comments: "אין תגובות עדיין",
      be_first: "היה הראשון להגיב!"
    },
    business: {
      for_businesses: "Yoouz לעסקים",
      claim_now: "קבל בעלות על פרופיל העסק",
      manage_profile: "נהל את העסק",
      dashboard: "לוח בקרת בעלים",
      analytics: "סטטיסטיקות וידאו",
      upgrade: "שדרג תוכנית"
    }
  },
  nl: {
    nav: {
      home: "Home",
      search: "Zoeken",
      discover: "Ontdekken",
      following: "Volgend",
      messages: "Berichten",
      notifications: "Meldingen",
      bookmarks: "Opgeslagen",
      business: "Voor Bedrijven",
      profile: "Profiel",
      more: "Meer",
      record_review: "Review",
      language: "Taal"
    },
    common: {
      back: "Terug",
      close: "Sluiten",
      save: "Opslaan",
      cancel: "Annuleren",
      confirm: "Bevestigen",
      delete: "Verwijderen",
      edit: "Bewerken",
      share: "Delen",
      search: "Zoeken naar plaatsen...",
      loading: "Laden...",
      verified: "Geverifieerd",
      follow: "Volgen",
      following: "Volgend",
      unfollow: "Ontvolgen",
      directions: "Route",
      website: "Website",
      call: "Bellen",
      chat: "Chat",
      view_all: "Alles bekijken",
      see_more: "Meer bekijken",
      see_less: "Minder bekijken",
      copy_link: "Link kopiëren",
      copied: "Gekopieerd!",
      report: "Rapporteren",
      settings: "Instellingen",
      select_language: "Selecteer taal",
      system_default: "Systeemstandaard",
      success: "Succes",
      error: "Fout",
      retry: "Opnieuw proberen",
      just_now: "Zojuist",
      ago: "geleden",
      hours: "uur",
      days: "dagen",
      minutes: "minuten"
    },
    video: {
      by: "Door",
      unmute: "Tik voor geluid",
      mute: "Dempen",
      likes: "Vind-ik-leuks",
      comments: "Reacties",
      shares: "Gedeeld",
      bookmarks: "Opgeslagen",
      no_reviews: "Nog geen videoreviews",
      record_first: "Wees de eerste maker die een review opneemt!",
      exceptional: "5.0 • Uitzonderlijk",
      great: "4.0 • Geweldig",
      average: "3.0 • Gemiddeld",
      poor: "2.0 • Matig",
      terrible: "1.0 • Vreselijk",
      more_options: "Meer opties",
      delete_review: "Review verwijderen",
      report_video: "Ongepaste video melden"
    },
    place: {
      reviews: "Videoreviews",
      about: "Over",
      photos: "Foto's",
      menu: "Menu",
      claim_business: "Bedrijf claimen & verifiëren",
      suggest_edits: "Wijziging voorstellen",
      claimed: "Geverifieerd bedrijf",
      unclaimed: "Niet-geclaimde plaats",
      verified_location: "Geverifieerde locatie",
      total_reviews: "reviews in totaal",
      rating: "Beoordeling",
      about_business: "Over dit bedrijf",
      chat_unavailable: "Directe berichten niet beschikbaar"
    },
    record: {
      title: "Videoreview opnemen",
      select_place: "Selecteer bedrijf of plaats",
      start_recording: "Start opname",
      stop_recording: "Stop opname",
      re_record: "Opnieuw opnemen",
      publish_review: "Review publiceren",
      publishing: "Review wordt gepubliceerd...",
      recording: "Live opname bezig...",
      time_left: "resterend",
      face_not_detected: "Geen gezicht gedetecteerd. Kijk in de camera aan de voorkant.",
      camera_permission: "Geef cameratoegang om reviews op te nemen.",
      content_safety_violation: "Veiligheidswaarschuwing: opname geblokkeerd wegens ongepaste inhoud.",
      front_camera_only: "Alleen camera aan de voorkant toegestaan voor geverifieerde reviews",
      one_minute_limit: "Max. 60 seconden"
    },
    share: {
      share_title: "Delen",
      share_subtitle: "Deel deze videoreview met vrienden",
      whatsapp: "WhatsApp",
      twitter: "X (Twitter)",
      facebook: "Facebook",
      telegram: "Telegram",
      email: "E-mail",
      copy: "Link kopiëren"
    },
    comments: {
      title: "Reacties",
      placeholder: "Plaats een vriendelijke reactie...",
      post: "Plaatsen",
      reply: "Beantwoorden",
      no_comments: "Nog geen reacties",
      be_first: "Plaats als eerste een reactie!"
    },
    business: {
      for_businesses: "Yoouz voor Bedrijven",
      claim_now: "Claim uw bedrijfspagina",
      manage_profile: "Bedrijf beheren",
      dashboard: "Eigenaarsdashboard",
      analytics: "Video-inzichten",
      upgrade: "Plan upgraden"
    }
  },
  id: {
    nav: {
      home: "Beranda",
      search: "Cari",
      discover: "Jelajahi",
      following: "Mengikuti",
      messages: "Pesan",
      notifications: "Notifikasi",
      bookmarks: "Disimpan",
      business: "Untuk Bisnis",
      profile: "Profil",
      more: "Lainnya",
      record_review: "Rekam Ulasan",
      language: "Bahasa"
    },
    common: {
      back: "Kembali",
      close: "Tutup",
      save: "Simpan",
      cancel: "Batal",
      confirm: "Konfirmasi",
      delete: "Hapus",
      edit: "Edit",
      share: "Bagikan",
      search: "Cari tempat atau restoran...",
      loading: "Memuat...",
      verified: "Terverifikasi",
      follow: "Ikuti",
      following: "Mengikuti",
      unfollow: "Berhenti mengikuti",
      directions: "Petunjuk Arah",
      website: "Situs Web",
      call: "Telepon",
      chat: "Obrolan",
      view_all: "Lihat Semua",
      see_more: "Lihat lebih banyak",
      see_less: "Lihat lebih sedikit",
      copy_link: "Salin Tautan",
      copied: "Tersalin!",
      report: "Laporkan",
      settings: "Pengaturan",
      select_language: "Pilih Bahasa",
      system_default: "Bawaan Sistem",
      success: "Berhasil",
      error: "Gagal",
      retry: "Coba Lagi",
      just_now: "Baru saja",
      ago: "lalu",
      hours: "jam",
      days: "hari",
      minutes: "menit"
    },
    video: {
      by: "Oleh",
      unmute: "Ketuk untuk suara",
      mute: "Bisukan",
      likes: "Suka",
      comments: "Komentar",
      shares: "Dibagikan",
      bookmarks: "Disimpan",
      no_reviews: "Belum ada ulasan video",
      record_first: "Jadilah kreator pertama yang merekam ulasan!",
      exceptional: "5.0 • Luar Biasa",
      great: "4.0 • Sangat Bagus",
      average: "3.0 • Cukup",
      poor: "2.0 • Kurang",
      terrible: "1.0 • Buruk",
      more_options: "Opsi Lainnya",
      delete_review: "Hapus Ulasan",
      report_video: "Laporkan Video Tidak Pantas"
    },
    place: {
      reviews: "Ulasan Video",
      about: "Tentang",
      photos: "Foto",
      menu: "Menu",
      claim_business: "Klaim & Verifikasi Bisnis",
      suggest_edits: "Sarankan perubahan",
      claimed: "Bisnis Terverifikasi",
      unclaimed: "Tempat Belum Diklaim",
      verified_location: "Lokasi Terverifikasi",
      total_reviews: "total ulasan",
      rating: "Penilaian",
      about_business: "Tentang tempat ini",
      chat_unavailable: "Pesan langsung tidak tersedia"
    },
    record: {
      title: "Rekam Ulasan Video",
      select_place: "Pilih tempat atau bisnis",
      start_recording: "Mulai Rekam",
      stop_recording: "Hentikan Rekaman",
      re_record: "Rekam Ulang",
      publish_review: "Publikasikan Ulasan",
      publishing: "Mempublikasikan ulasan...",
      recording: "Merekam langsung...",
      time_left: "tersisa",
      face_not_detected: "Wajah tidak terdeteksi. Silakan menghadap kamera depan.",
      camera_permission: "Izinkan akses kamera untuk merekam ulasan asli.",
      content_safety_violation: "Pelanggaran Keamanan: Rekaman diblokir karena konten tidak pantas.",
      front_camera_only: "Hanya kamera depan untuk ulasan terverifikasi",
      one_minute_limit: "Maksimal 60 detik"
    },
    share: {
      share_title: "Bagikan",
      share_subtitle: "Bagikan ulasan video ini kepada teman",
      whatsapp: "WhatsApp",
      twitter: "X (Twitter)",
      facebook: "Facebook",
      telegram: "Telegram",
      email: "Email",
      copy: "Salin Tautan"
    },
    comments: {
      title: "Komentar",
      placeholder: "Tulis komentar positif...",
      post: "Kirim",
      reply: "Balas",
      no_comments: "Belum ada komentar",
      be_first: "Jadilah yang pertama berkomentar!"
    },
    business: {
      for_businesses: "Yoouz untuk Bisnis",
      claim_now: "Klaim Profil Bisnis Anda",
      manage_profile: "Kelola Bisnis",
      dashboard: "Dasbor Pemilik",
      analytics: "Wawasan Video",
      upgrade: "Tingkatkan Paket"
    }
  }
};
