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
  common?: {
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
    clear?: string;
    clearAll?: string;
    videoReview?: string;
    videoReviews?: string;
    businessPlace?: string;
    help?: string;
  };
  video?: {
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
  following?: {
    title: string;
    subtitle: string;
    following: string;
    followers: string;
    searchPlaceholder: string;
    searchFollowersPlaceholder: string;
    all: string;
    businesses: string;
    reviewers: string;
    noResults: string;
    noFollowingYet: string;
    followingDesc: string;
    noFollowersResults: string;
    noFollowersYet: string;
    followersDesc: string;
    clearSearch: string;
    videoReview: string;
    videoReviews: string;
    unfollow: string;
    followBack: string;
    localReviewer: string;
  };
  messages?: {
    title: string;
    searchPlaceholder: string;
    unread: string;
    totalChats: string;
    activeOnYoouz: string;
    inputPlaceholder: string;
    noUnread: string;
    clearSearch: string;
    noResults: string;
    tryDifferent: string;
    conversation: string;
    conversations: string;
    newChat: string;
    newChatPlaceholder: string;
    all: string;
    businesses: string;
    members: string;
    block: string;
    unblock: string;
    delete: string;
    report: string;
    cancel: string;
    confirm: string;
    emptyState: string;
    noConversations: string;
    deleteConversation: string;
    blockUser: string;
    reportThread: string;
    connectDescription: string;
    startMessage: string;
    blockTitle: string;
    blockDescription: string;
    messageMembersDesc: string;
    messageBusinessesDesc: string;
    messageAllDesc: string;
    searchMembersPlaceholder: string;
    searchBusinessesPlaceholder: string;
    searchMembers: string;
    searchAll: string;
    typeMembersDesc: string;
    typeAllDesc: string;
    noMatches: string;
    business: string;
    member: string;
    businessOrMember: string;
    businessLabel: string;
    verifiedBusiness: string;
    communityReviewer: string;
    chatAction: string;
    deleteTitle: string;
    deleteDescription: string;
    message: string;
    messages: string;
    blockedPlaceholder: string;
  };
  notifications?: {
    all: string;
    unread: string;
    messages: string;
    likes: string;
    comments: string;
    shares: string;
    followers: string;
    saves: string;
    newUpdates: string;
    allCaughtUp: string;
    allCaughtUpDesc: string;
    markRead: string;
    clearAll: string;
    preferences: string;
    paused: string;
    pausedNotice: string;
    noNotifications: string;
    noNotificationsUnder: string;
    viewAll: string;
    settings: string;
  };
  place?: {
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
    no_saved_places?: string;
  };
  search?: {
    title: string;
    subtitle: string;
    recentSearches: string;
    trendingSearches: string;
    backSearch: string;
    viewBusiness: string;
    reviews: string;
    syncing: string;
    invalidUrl: string;
    placeholder: string;
  };
  record?: {
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
  share?: {
    share_title: string;
    share_subtitle: string;
    whatsapp: string;
    twitter: string;
    facebook: string;
    telegram: string;
    email: string;
    copy: string;
  };
  comments?: {
    title: string;
    placeholder: string;
    post: string;
    reply: string;
    no_comments: string;
    be_first: string;
  };
  business?: {
    for_businesses: string;
    claim_now: string;
    manage_profile: string;
    dashboard: string;
    analytics: string;
    agencyPartners?: string;
    upgrade?: string;
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
    deactivateAccountTitle?: string;
    deactivateAccountDesc?: string;
    deactivateAccountBtn?: string;
    deactivateAccountWarning?: string;
    deactivateAccountConfirmTitle?: string;
    deactivateAccountConfirmDesc?: string;
    confirmDeactivate?: string;
    deactivating?: string;
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
    trustEvolutionTitle?: string;
    trustEvolutionPara1?: string;
    trustEvolutionPara2?: string;
    conversionScienceLabel?: string;
    conversionScienceTitle?: string;
    conversionScienceDesc?: string;
    point1Title?: string;
    point1Desc?: string;
    point2Title?: string;
    point2Desc?: string;
    point3Title?: string;
    point3Desc?: string;
    point4Title?: string;
    point4Desc?: string;
    point5Title?: string;
    point5Desc?: string;
    supportDeskSubtitle?: string;
    contactNameLabel?: string;
    contactEmailLabel?: string;
    contactDomainLabel?: string;
    contactCategoryLabel?: string;
    contactMessageLabel?: string;
    contactAttachLabel?: string;
    contactSubmitBtn?: string;
    contactSubmittingBtn?: string;
    contactSuccessTitle?: string;
    contactSuccessDesc?: string;
    contactErrorTitle?: string;
    namePlaceholder?: string;
    emailPlaceholder?: string;
    domainPlaceholder?: string;
    reasonNoLongerUse?: string;
    reasonPrivacy?: string;
    reasonMistake?: string;
    reasonBreak?: string;
    reasonOther?: string;
    notesPlaceholder?: string;
    languageTitle?: string;
    languageSearchLabel?: string;
    seoVisibilityLabel?: string;
    seoAdvantageTitle?: string;
    seoAdvantageDesc?: string;
    seoRichSnippetsTitle?: string;
    seoRichSnippetsDesc?: string;
    aiRecommendationsTitle?: string;
    aiRecommendationsDesc?: string;
    qrCaptureTitle?: string;
    qrCaptureDesc?: string;
    faq_rev_1_q?: string;
    faq_rev_1_a?: string;
    faq_rev_2_q?: string;
    faq_rev_2_a?: string;
    faq_rev_3_q?: string;
    faq_rev_3_a?: string;
    faq_rev_4_q?: string;
    faq_rev_4_a?: string;
    faq_rev_5_q?: string;
    faq_rev_5_a?: string;
    faq_rev_6_q?: string;
    faq_rev_6_a?: string;
    faq_rev_7_q?: string;
    faq_rev_7_a?: string;
    faq_rev_8_q?: string;
    faq_rev_8_a?: string;
    faq_biz_premium_suite_q?: string;
    faq_biz_premium_suite_a?: string;
    faq_biz_premium_seo_q?: string;
    faq_biz_premium_seo_a?: string;
    faq_biz_premium_ads_q?: string;
    faq_biz_premium_ads_a?: string;
    faq_biz_premium_terms_q?: string;
    faq_biz_premium_terms_a?: string;
    faq_biz_1_q?: string;
    faq_biz_1_a?: string;
    faq_biz_2_q?: string;
    faq_biz_2_a?: string;
    faq_biz_ugc_q?: string;
    faq_biz_ugc_a?: string;
    faq_biz_returns_q?: string;
    faq_biz_returns_a?: string;
    faq_biz_case_study_q?: string;
    faq_biz_case_study_a?: string;
    faq_biz_qr_q?: string;
    faq_biz_qr_a?: string;
    faq_biz_3_q?: string;
    faq_biz_3_a?: string;
    faq_biz_4_q?: string;
    faq_biz_4_a?: string;
    faq_biz_5_q?: string;
    faq_biz_5_a?: string;
    faq_biz_6_q?: string;
    faq_biz_6_a?: string;
    faq_biz_7_q?: string;
    faq_biz_7_a?: string;
    faq_biz_8_q?: string;
    faq_biz_8_a?: string;
    faq_trust_1_q?: string;
    faq_trust_1_a?: string;
    faq_trust_2_q?: string;
    faq_trust_2_a?: string;
    faq_trust_smear_q?: string;
    faq_trust_smear_a?: string;
    faq_trust_3_q?: string;
    faq_trust_3_a?: string;
    faq_trust_4_q?: string;
    faq_trust_4_a?: string;
    faq_trust_5_q?: string;
    faq_trust_5_a?: string;
    faq_trust_6_q?: string;
    faq_trust_6_a?: string;
    faq_trust_7_q?: string;
    faq_trust_7_a?: string;
    faq_tech_1_q?: string;
    faq_tech_1_a?: string;
    faq_tech_seo_snippets_q?: string;
    faq_tech_seo_snippets_a?: string;
    faq_tech_ai_engines_q?: string;
    faq_tech_ai_engines_a?: string;
    faq_tech_2_q?: string;
    faq_tech_2_a?: string;
    faq_tech_3_q?: string;
    faq_tech_3_a?: string;
    faq_tech_4_q?: string;
    faq_tech_4_a?: string;
    faq_tech_5_q?: string;
    faq_tech_5_a?: string;
    faq_tech_6_q?: string;
    faq_tech_6_a?: string;
    faq_tech_7_q?: string;
    faq_tech_7_a?: string;
    faq_tech_8_q?: string;
    faq_tech_8_a?: string;
    faq_tech_9_q?: string;
    faq_tech_9_a?: string;
    [key: string]: any;
  };
  bookmarks?: {
    subtitle?: string;
    tabVideos?: string;
    tabPlaces?: string;
    tabReviewers?: string;
    videosEmpty?: string;
    placesEmpty?: string;
    reviewersEmpty?: string;
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
  profile?: {
    no_saved_reviewers?: string;
    communityReviewer?: string;
    verifiedReviewer?: string;
    verifiedTopReviewer?: string;
    communityMember?: string;
    editProfile?: string;
    shareProfile?: string;
    shareProfileLink?: string;
    accountSettings?: string;
    moreOptions?: string;
    shareProfileText?: string;
    signOut?: string;
    followers?: string;
    following?: string;
    bio?: string;
    location?: string;
    joined?: string;
    overview?: string;
    overviewTab?: string;
    reviews?: string;
    about?: string;
    aboutMe?: string;
    aboutTab?: string;
    saveChanges?: string;
    cancel?: string;
    city?: string;
    state?: string;
    country?: string;
    savedReviewer?: string;
    removedSaved?: string;
    notificationPreferences?: string;
    memberSince?: string;
    avgRatingGiven?: string;
    totalReviews?: string;
    noVideosYet?: string;
    reportReviewer?: string;
    changePhoto?: string;
    manageSocialDesc?: string;
    requestDeletionTitle?: string;
    requestDeletionNotice?: string;
    reasonLabel?: string;
    notesLabel?: string;
    deletionRequestSuccess?: string;
    updateProfileDesc?: string;
    profilePicture?: string;
    uploadCustomPhoto?: string;
    coverBanner?: string;
    uploadCustomBanner?: string;
    displayName?: string;
    bioPlaceholder?: string;
    regionProvince?: string;
    selectCity?: string;
    languageRegion?: string;
    requestDeletionDesc?: string;
    requestBtn?: string;
    reviewerProfile?: string;
    communityStats?: string;
    totalLikes?: string;
    totalVideos?: string;
    aboutUser?: string;
    viewVideoReviews?: string;
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
    searchPlaceOptional?: string;
    reviewerConflictSelf?: string;
    reviewerConflictReview?: string;
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
    title?: string;
    jurisdiction?: string;
    termsTab?: string;
    privacyTab?: string;
    officialAgreement?: string;
    termsHeading?: string;
    lastUpdated?: string;
    welcomeTerms?: string;
    sec1Title?: string;
    sec1Body?: string;
    sec2Title?: string;
    sec2Item1?: string;
    sec2Item2?: string;
    sec3Title?: string;
    noUploadsTitle?: string;
    noUploadsBody?: string;
    standardsTitle?: string;
    standardsBody?: string;
    licenseTitle?: string;
    licenseBody?: string;
    sec4Title?: string;
    noOwnership?: string;
    noOwnershipBody?: string;
    streamingAccess?: string;
    streamingAccessBody?: string;
    antiPiracy?: string;
    antiPiracyBody?: string;
    futureFeatures?: string;
    futureFeaturesBody?: string;
    sec5TitleDeactivation?: string;
    sec5DeactivationBody?: string;
    sec5DeactivationPurge?: string;
    sec5Title?: string;
    sec5Body?: string;
    sec6Title?: string;
    sec6Body?: string;
    sec7Title?: string;
    sec7Body?: string;
    privacyArchitecture?: string;
    privacyHeading?: string;
    welcomePrivacy?: string;
    privSec1Title?: string;
    privSec1Subtitle?: string;
    accountInfoTitle?: string;
    accountInfoBody?: string;
    cameraMicTitle?: string;
    cameraMicBody?: string;
    privSec2Title?: string;
    privSec2Subtitle?: string;
    privSec2Item1?: string;
    privSec2Item2?: string;
    privSec2Item3?: string;
    privSec2Item4?: string;
    privSec3Title?: string;
    privSec3Subtitle?: string;
    serviceProviders?: string;
    serviceProvidersBody?: string;
    legalCompliance?: string;
    legalComplianceBody?: string;
    privSec4Title?: string;
    privSec4Body?: string;
    privSec5Title?: string;
    privSec5Subtitle?: string;
    privSec5Item1?: string;
    privSec5Item2?: string;
    privSec5Item3?: string;
    privSec6Title?: string;
    privSec6BodyNoEmail?: string;
    copyright?: string;
    termsConditions?: string;
    privacyPolicy?: string;
    supportDesk?: string;
    networkLocation?: string;
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
  { code: "en", name: "English", nativeName: "English", direction: "ltr", flag: "🇺🇸", region: "Americas" },
  { code: "es", name: "Spanish", nativeName: "Español", direction: "ltr", flag: "🇪🇸", region: "Americas" },
  { code: "pt", name: "Portuguese", nativeName: "Português", direction: "ltr", flag: "🇧🇷", region: "Americas" },
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
  { code: "fa", name: "Persian", nativeName: "فارسی", direction: "rtl", flag: "🇮🇷", region: "Middle East" },
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
  { code: "tl", name: "Filipino", nativeName: "Filipino", direction: "ltr", flag: "🇵🇭", region: "Asia & Pacific" },
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
      record_review: "Add Review",
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
      minutes: "minutes",
      clear: "Clear",
      clearAll: "Clear All",
      videoReview: "photo review",
      videoReviews: "photo reviews",
      businessPlace: "Business Place",
      help: "Help"
    },
    following: {
      title: "Following & Followers",
      subtitle: "Manage businesses and reviewers you follow on Yoouz",
      following: "Following",
      followers: "Followers",
      searchPlaceholder: "Search followed businesses or reviewers...",
      searchFollowersPlaceholder: "Search followers by name...",
      all: "All",
      businesses: "Businesses",
      reviewers: "Reviewers",
      noResults: "No matching results found",
      noFollowingYet: "You aren't following anyone yet",
      followingDesc: "When you follow businesses or authentic local reviewers on Yoouz, they will appear here.",
      noFollowersResults: "No matching followers found",
      noFollowersYet: "No followers yet",
      followersDesc: "When other local reviewers follow your profile, they will appear here.",
      clearSearch: "Clear search",
      videoReview: "photo review",
      videoReviews: "photo reviews",
      unfollow: "Unfollow",
      followBack: "Follow Back",
      localReviewer: "Local Reviewer"
    },
    messages: {
      title: "Messages",
      searchPlaceholder: "Search chats or reviewers...",
      unread: "UNREAD",
      totalChats: "TOTAL CHATS",
      activeOnYoouz: "Active on Yoouz",
      inputPlaceholder: "Message {name}...",
      noUnread: "No unread messages",
      clearSearch: "Clear search",
      noResults: "No matching results found",
      tryDifferent: "Try a different name or search term",
      conversation: "conversation",
      conversations: "conversations",
      newChat: "Start a new conversation",
      newChatPlaceholder: "Search by name or email...",
      all: "All",
      businesses: "Businesses",
      members: "Members",
      block: "Block",
      unblock: "Unblock",
      delete: "Delete",
      report: "Report",
      cancel: "Cancel",
      confirm: "Confirm",
      emptyState: "Select a conversation to start messaging",
      noConversations: "You don't have any messages yet",
      deleteConversation: "Delete Conversation",
      blockUser: "Block User",
      reportThread: "Report Thread",
      connectDescription: "Connect and message other community reviewers.",
      startMessage: "Start a Message",
      blockTitle: "Block {name}?",
      blockDescription: "They will not be able to message you or see your direct chat history. You can unblock them at any time.",
      messageMembersDesc: "Message community members & reviewers on Yoouz",
      messageBusinessesDesc: "Message official business profiles on Yoouz",
      messageAllDesc: "Message members or business profiles on Yoouz",
      searchMembersPlaceholder: "Search member by name or handle...",
      searchBusinessesPlaceholder: "Search business by name, category, or city...",
      searchMembers: "Search community members",
      searchAll: "Search businesses & members",
      typeMembersDesc: "Type a reviewer or member name above to message them directly.",
      typeAllDesc: "Type a business or member name above, or switch to the Businesses tab.",
      noMatches: "No {type} matches \"{query}\".",
      business: "business",
      member: "member",
      businessOrMember: "business or member",
      businessLabel: "Business",
      verifiedBusiness: "Verified Business",
      communityReviewer: "Community reviewer",
      chatAction: "Chat",
      deleteTitle: "Delete this conversation?",
      deleteDescription: "This will delete the chat thread with {name}. This action cannot be undone.",
      message: "message",
      messages: "messages",
      blockedPlaceholder: "You have blocked {name}"
    },
    bookmarks: {
      subtitle: "Your saved visual reviews, places & creators",
      tabVideos: "Photos",
      tabPlaces: "Places",
      tabReviewers: "Reviewers",
      videosEmpty: "Tap the bookmark icon on any photo review to save it.",
      placesEmpty: "Grab places you want to visit from the map or review screens to build your bucket list.",
      reviewersEmpty: "Save trusted local guides & creators to instantly track their latest photo reviews."
    },
    notifications: {
      all: "All",
      unread: "Unread",
      messages: "Messages",
      likes: "Likes",
      comments: "Comments",
      shares: "Shares",
      followers: "Followers",
      saves: "Saves",
      newUpdates: "new updates",
      allCaughtUp: "All caught up",
      allCaughtUpDesc: "You're all caught up! Community updates and photo review activity will appear here.",
      markRead: "Mark read",
      clearAll: "Clear all",
      preferences: "Notification Preferences",
      paused: "Notifications are paused",
      pausedNotice: "In-app notifications are paused in your preferences.",
      noNotifications: "No notifications",
      noNotificationsUnder: "No notifications found under \"{filter}\".",
      viewAll: "View all notifications",
      settings: "Notification Settings"
    },
    video: {
      by: "By",
      unmute: "Sound On",
      mute: "Mute",
      likes: "Likes",
      comments: "Comments",
      shares: "Shares",
      bookmarks: "Bookmarks",
      no_reviews: "No photo reviews yet",
      record_first: "Be the first customer to add a live photo review!",
      exceptional: "5 • Exceptional",
      great: "4 • Great",
      average: "3 • Average",
      poor: "2 • Poor",
      terrible: "1 • Terrible",
      more_options: "More Options",
      delete_review: "Delete Review",
      report_video: "Report Inappropriate Review"
    },
    place: {
      reviews: "Photo Reviews",
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
      chat_unavailable: "Direct Messaging Unavailable",
      no_saved_places: "No saved places yet"
    },
    search: {
      title: "Review Any Business",
      subtitle: "Search any business to explore real photo reviews or add your own.",
      recentSearches: "Recent Searches",
      trendingSearches: "Trending Searches",
      backSearch: "Search another business or website",
      viewBusiness: "View Business",
      reviews: "Reviews",
      syncing: "Syncing details...",
      invalidUrl: "Please select a business from the dropdown list or search with a valid website domain.",
      placeholder: "Search any business, place, or URL..."
    },
    record: {
      title: "Add Review",
      select_place: "Select Business or Place",
      start_recording: "Take Photo",
      stop_recording: "Capture",
      re_record: "Retake",
      publish_review: "Publish Photo Review",
      publishing: "Publishing your photo review...",
      recording: "Live camera active",
      time_left: "ready",
      face_not_detected: "Please frame your subject clearly in the camera.",
      camera_permission: "Please allow camera permissions to snap live photo reviews.",
      content_safety_violation: "Content Safety Violation: Photo blocked for inappropriate visual content.",
      front_camera_only: "Live camera only — gallery uploads disabled",
      one_minute_limit: "Whole Stars 1–5"
    },
    share: {
      share_title: "Share",
      share_subtitle: "Share this photo review with friends",
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
      analytics: "Photo Insights",
      agencyPartners: "Agency Partners"
    },
    trustCenter: {
      hub: "Yoouz Hub",
      subtitle: "Trust, Verification & Support",
      title: "Knowledge & Trust Center",
      trustProtocol: "Trust Protocol",
      helpFaqs: "Help & FAQs",
      forBusinesses: "For Businesses",
      privacySecurity: "Privacy",
      contactSupport: "Support",
      theYoouzStandard: "The Yoouz Standard",
      trustEvolutionTitle: "The Evolution of Trust: From Static Text to Absolute Belief",
      trustEvolutionPara1: "For years, online reviews relied on static text. Written reviews served a simple baseline purpose—giving quick signals on whether a place was safe to consider. But text has a structural limit. In a digital landscape saturated with review inflation, bot networks, and AI-generated copy, written text is too easy to manufacture.",
      trustEvolutionPara2: "When a customer asks \"Is this actually true?\", written reviews stop converting. Yoouz bridges that gap by moving past sterile text to instant visual proof. We eliminate gallery uploads, stock photos, and scripted corporate marketing. Every review on Yoouz is captured live through the device camera, paired with a strict whole-number 1–5 star rating, and anchored to real places.",
      strictRule: "STRICT RULE",
      rule1Title: "Live Camera Only",
      rule1Desc: "No gallery uploads or pre-saved photos. Real customers snapping authentic experiences live.",
      pillar2: "PILLAR 2",
      rule2Title: "Whole-Star Clarity",
      rule2Desc: "Strict 1–5 solid whole stars on every single review—zero confusing half-star guesswork.",
      pillar3: "PILLAR 3",
      rule3Title: "3-Way Dialogue",
      rule3Desc: "Living comment threads connecting Reviewers, curious Viewers, and Verified Place Owners.",
      conversionScienceLabel: "The Conversion Science",
      conversionScienceTitle: "Why Live Photo Proof Wins Every Time",
      conversionScienceDesc: "Live camera photos don't just display an opinion—they deliver immediate, unmistakable visual proof.",
      point1Title: "1. Instant Visual Proof (Zero Gallery Filters)",
      point1Desc: "When shoppers see an unedited live camera photo taken on the spot, they immediately see real lighting, real food, and real quality instead of polished marketing claims.",
      point2Title: "2. Whole-Star Clarity & Speed",
      point2Desc: "Strict whole-number 1 to 5 solid star ratings keep scoring decisive and effortless to scan, pairing visual proof with a clear verdict in seconds.",
      point3Title: "3. Zero-Friction Anonymous Onboarding",
      point3Desc: "Every visitor gets an automatic U/XXXXXX identifier with zero mandatory sign-up wall, allowing real customers to snap and publish photo reviews on the spot.",
      point4Title: "4. The Trust Anchor for High-Stakes Decisions",
      point4Desc: "When choosing a restaurant, hotel, salon, or service, live photo proof acts as a definitive trust anchor that dismantles skepticism.",
      point5Title: "5. A Permanent Competitive Moat & Modern AI Discovery",
      point5Desc: "While text review volume can be artificially copied overnight, building a library of verified live photo reviews creates an uncatchable advantage for Google and AI discovery.",
      bento1Title: "Anonymous ID & Custom Handles",
      bento1Desc: "Every reviewer starts instantly with a U/XXXXXX identifier and can claim a custom username or link Google/Apple anytime.",
      bento1Sub: "Zero-Friction Reviewer Identity",
      bento2Title: "Interactive Community Dialogue",
      bento2Desc: "Reviews are not static one-way monologues. Viewers ask live questions, share tips, and verified owners participate in the feed to validate the experience together.",
      bento2Sub: "Crowdsourced Community Validation",
      bento3Title: "Official Domain Verification",
      bento3Desc: "Business owners claim their official domain to reply with verified badges, pin official solutions, and manage operating hours directly.",
      bento3Sub: "Pinned Owner Feedback & Responses",
      bento4Title: "100% Equal Rule Set (No Pay-to-Remove)",
      bento4Desc: "Unlike legacy review portals, Yoouz is built on uncompromised integrity. Businesses cannot pay to remove negative reviews. The rules are identical for everyone.",
      bento4Sub: "Decentralized & Tamper-Proof Trust",
      seoVisibilityLabel: "Search Engine & AI Visibility",
      seoAdvantageTitle: "The SEO & Discovery Advantage of Live Photo Reviews",
      seoAdvantageDesc: "Search engines like Google and generative AI engines prioritize authentic visual review entities over faceless text snippets.",
      seoRichSnippetsTitle: "Google Review Rich Snippets",
      seoRichSnippetsDesc: "Structured Schema.org Review and ImageObject metadata surface star ratings and photo previews directly in Google search results.",
      aiRecommendationsTitle: "AI Grounded Recommendations",
      aiRecommendationsDesc: "Google AI Overviews, Gemini, ChatGPT, and Perplexity index verified visual proof and geolocation to recommend top venues.",
      qrCaptureTitle: "In-Store QR Capture",
      qrCaptureDesc: "Merchants download instant table tents and counter cards so happy customers can scan and snap a live photo review in seconds.",
      searchFaqsPlaceholder: "Search answers by keyword or topic...",
      categoryAll: "All Topics",
      categoryReviewers: "For Reviewers",
      categoryBusiness: "For Businesses",
      categoryTrust: "Trust & Safety",
      categoryTechnical: "Technical",
      noMatchingFaqs: "No matching questions found",
      tryDifferentKeywords: "Try searching with different keywords or switch categories.",
      clearFilter: "Clear search query",
      businessHeroTitle: "Turn Authentic Photo Reviews into Your Growth Engine",
      businessHeroDesc: "Yoouz provides verified business owners with direct tools to manage place pages, engage in review threads, and display tamper-proof visual trust signals.",
      verifiedOwnerBadgeTitle: "Verified Owner Badge",
      verifiedOwnerBadgeDesc: "Verify your domain via DNS or HTML meta-tag to unlock exclusive official badges on all replies.",
      pinnedSolutionsTitle: "Pinned Solutions & Feedback",
      pinnedSolutionsDesc: "Pin official owner responses to address customer feedback transparently and build long-term reputation.",
      embedTrustFeedsTitle: "Embed Live Photo Feeds",
      embedTrustFeedsDesc: "Showcase genuine customer photo reviews directly on your website with ultra-fast CDN widgets.",
      requestVerification: "Request Domain Verification",
      readyToVerify: "Ready to claim and verify your business?",
      privacySecurityTitle: "Privacy, Security & Legal Compliance",
      privacyVerifiedBadge: "Enterprise Security • Zero Passwords Stored",
      googleVerified: "Enterprise Security • Zero Passwords Stored",
      privacySummary: "Yoouz is built with privacy-first standards. Consumers receive zero-friction U/XXXXXX identifiers, camera streams stay live without gallery harvesting, and private emails are never exposed publicly.",
      updatedDate: "Updated Nov 16, 2026",
      privacyPolicyTitle: "Privacy Policy",
      privacyPolicyDesc: "Covers U/XXXXXX identifiers, optional linked accounts, real-time camera usage, zero gallery harvesting, and zero data selling.",
      readPrivacyPolicy: "Read Privacy Policy",
      termsConditionsTitle: "Terms & Conditions",
      termsConditionsDesc: "Covers live camera capture rules, no-gallery-upload policy, anti-scraping rules, business display licenses, and compliance terms.",
      readTermsConditions: "Read Terms & Conditions",
      authPillarTitle: "Zero-Friction U/XXXXXX Identity",
      authPillarDesc: "Consumers never hit login walls to browse or post. Link Google/Apple or pick a custom username optionally whenever you like.",
      recordingPillarTitle: "Real-Time Camera Only",
      recordingPillarDesc: "Camera data is accessed strictly while taking your live photo review. We never access your photo gallery or saved camera roll.",
      zeroSellingPillarTitle: "No Selling or Renting",
      zeroSellingPillarDesc: "We never sell, rent, or trade your personal data to third parties. Data is stored safely on bunny.net and our local database.",
      jurisdictionPillarTitle: "Governing Compliance & Standards",
      jurispillarDesc: "Platform terms and privacy policies enforce strict global consumer data protection and digital privacy standards.",
      allSystemsOperational: "All Systems Operational",
      dangerZoneTitle: "Danger Zone: Delete Account Profile",
      dangerZoneDesc: "Permanently erase your user profile details, bio, avatar, and cached session information. This action cannot be reversed.",
      deleteAccountBtn: "Delete Account",
      deleteAccountWarning: "Confirming will purge your profile record.",
      deactivateAccountTitle: "Deactivate Account (Temporary Hide)",
      deactivateAccountDesc: "Take a break without losing any of your data. Your profile and reviews will be temporarily hidden from the public feed.",
      deactivateAccountBtn: "Deactivate Account",
      deactivateAccountWarning: "Confirming will hide your content until you reactivate.",
      deactivateAccountConfirmTitle: "Deactivate Your Account?",
      deactivateAccountConfirmDesc: "Your profile and photo reviews will be temporarily hidden from the public feed. None of your data is erased.",
      confirmDeactivate: "Deactivate",
      deactivating: "Deactivating...",
      supportDeskTitle: "Official Yoouz Support Desk",
      supportDeskSubtitle: "How can we help you today?",
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
      deleting: "Deleting...",
      namePlaceholder: "e.g. Sarah Jenkins",
      emailPlaceholder: "e.g. sarah@example.com",
      domainPlaceholder: "e.g. yourcompany.com",
      reasonNoLongerUse: "I no longer use this account",
      reasonPrivacy: "Privacy concerns",
      reasonMistake: "Created by mistake",
      reasonBreak: "Temporary break",
      reasonOther: "Other reason",
      notesPlaceholder: "Tell us if there is anything we can help with...",
      languageTitle: "Choose Your Language",
      languageSearchLabel: "Search 64+ languages...",
      faq_rev_1_q: "How fast is it to post a photo review on Yoouz?",
      faq_rev_1_a: "Every review takes just seconds: open the live camera, snap one clear photo with the rear or front lens, pick 1 to 5 solid stars, and publish. No lengthy forms, titles, or gallery uploads.",
      faq_rev_2_q: "Why does Yoouz only use the live camera and disable gallery uploads?",
      faq_rev_2_a: "To guarantee 100% authentic in-person proof, Yoouz enforces Proof of Presence™ by launching the live rear or front camera directly in your browser. Uploading pre-saved gallery files, stock photos, or downloaded images is strictly disabled.",
      faq_rev_3_q: "Why does Yoouz only allow whole-number 1 to 5 star ratings?",
      faq_rev_3_a: "Each individual review uses strict whole integers (1, 2, 3, 4, or 5 solid stars) so ratings are immediate, decisive, and clutter-free with zero half-star ambiguity.",
      faq_rev_4_q: "Do I need to create an account before posting a review?",
      faq_rev_4_a: "No! Yoouz assigns every visitor a zero-friction anonymous ID (U/XXXXXX) automatically. You can pick a custom username or link Google/Apple later anytime to preserve your history.",
      faq_rev_5_q: "Can viewers comment, ask questions, or interact on my photo reviews?",
      faq_rev_5_a: "Yes! Every photo review includes a live 3-way community discussion feed. Viewers can ask follow-up questions ('Is parking easy?', 'Did you try the dessert?'), share tips, and discuss their experiences.",
      faq_rev_6_q: "Can I review any website domain or local establishment?",
      faq_rev_6_a: "Yes! You can search and review any base website domain (e.g., stripe.com, airbnb.com) or local brick-and-mortar place (restaurants, cafes, services, gyms) to build a unified hub of visual proof.",
      faq_rev_7_q: "Can I edit or delete my reviews later?",
      faq_rev_7_a: "Absolutely. You maintain complete ownership of your content. You can modify your whole-star rating or permanently delete any of your posted photo reviews at any time directly from your Profile drawer or review options.",
      faq_rev_8_q: "How does direct messaging work between community members?",
      faq_rev_8_a: "Reviewers and users can message each other directly through the 'Messages' tab to ask private questions about venues, recommend local spots, or connect with fellow explorers.",
      faq_biz_premium_suite_q: "What is included in the Yoouz Premium Business Suite ($149/mo)?",
      faq_biz_premium_suite_a: "The Yoouz Premium Business Suite ($149/mo or $99/mo annual) provides a comprehensive enterprise growth stack: Verified Business Badge, Priority Search Placement in local search results, Live Website Review Widget with automated Google Rich Snippets SEO Schema, Branded Photo Review Exporter with watermark overlays, Pinned Owner Replies, Direct Messaging Lead Capture, Table & Window QR Standees, and Real-Time Analytics.",
      faq_biz_premium_seo_q: "How does the Yoouz Premium Suite improve Google Search SEO & Rich Snippets?",
      faq_biz_premium_seo_a: "When you embed your Yoouz photo review widget on your website, our system automatically generates Schema.org JSON-LD structured data so search engines can render star ratings and visual review previews in search results.",
      faq_biz_premium_ads_q: "Can businesses export customer photo reviews as branded social assets?",
      faq_biz_premium_ads_a: "Yes! Premium Suite subscribers can export customer photo reviews as high-resolution branded assets with your official venue logo overlay and watermark—ready to run on Instagram, TikTok, or Facebook.",
      faq_biz_premium_terms_q: "Are there any contracts, hidden fees, or cancellation lock-ins?",
      faq_biz_premium_terms_a: "No. Yoouz Premium Business Suite is completely flexible with zero setup fees and zero cancellation penalties. You can upgrade, pause, or switch plans anytime with 1-click in your Business Dashboard.",
      faq_biz_1_q: "How can my business claim its official domain or place page?",
      faq_biz_1_a: "Business owners can claim their listing in less than 2 minutes through the business verification flow. Claiming unlocks official owner dashboard tools, category settings, operating hours management, and customer dialogue features.",
      faq_biz_2_q: "Why do live photo reviews convert so much higher than traditional text reviews?",
      faq_biz_2_a: "Written reviews are treated as quick signals that users skim with skepticism, whereas live camera photos deliver instant visual proof. Real lighting, real food, real atmosphere, and whole-star scores eliminate guesswork.",
      faq_biz_ugc_q: "Why are authentic customer photo reviews more trusted than paid influencer posts?",
      faq_biz_ugc_a: "Modern consumers are fatigue-blind to staged sponsored ads. Live camera photo reviews from everyday customers carry authentic social proof because they are snapped on the spot without gallery filters or studio editing.",
      faq_biz_returns_q: "How do photo reviews reduce product return rates and customer misunderstandings?",
      faq_biz_returns_a: "Text reviews often create ambiguous expectations. A live photo shows true sizing, atmosphere, portion sizes, or build quality in natural light, aligning customer expectations before purchase.",
      faq_biz_case_study_q: "Why do live photo reviews replace lengthy written reviews?",
      faq_biz_case_study_a: "Modern buyers rarely read 1,000-word essays. One authentic live camera photo paired with a crisp 1–5 whole-star rating communicates proof in one second.",
      faq_biz_qr_q: "How can businesses use QR codes to capture in-person photo reviews on the spot?",
      faq_biz_qr_a: "Verified businesses can download branded QR table tents, counter cards, and receipt stickers from their dashboard. When customers scan the code, it launches the live camera photo review flow instantly with the place pre-tagged.",
      faq_biz_3_q: "Can businesses embed Yoouz photo reviews on their own websites?",
      faq_biz_3_a: "Yes! Verified businesses can copy responsive iframe photo review embeds from their place drawer or Business Dashboard to display live customer photo reviews directly on their Shopify store or landing page.",
      faq_biz_4_q: "Can businesses export or download Branded Review Cards?",
      faq_biz_4_a: "Yes! Claimed businesses can export customer photo reviews as high-resolution branded assets with official watermark overlays for use in social media campaigns and marketing.",
      faq_biz_5_q: "Can businesses pay to remove or hide negative photo reviews?",
      faq_biz_5_a: "No. Yoouz is built on uncompromised trust and authenticity. We never delete or alter honest photo reviews for payment. Reviews that violate safety guidelines can be flagged for moderation, and owners can post pinned replies.",
      faq_biz_6_q: "How do official Business Owner replies and pinned comments work?",
      faq_biz_6_a: "Claimed business owners can participate in comment threads with a highlighted 'Business Owner' badge and pin official responses to the top of comment feeds.",
      faq_biz_7_q: "What is the Business Hours Manager and how does it sync?",
      faq_biz_7_a: "Claimed business owners can configure weekly operating hours, special holiday schedules, and open/closed statuses directly in their dashboard. Changes sync live across search results and place profile drawers.",
      faq_biz_8_q: "How do I manage business categories and contact details?",
      faq_biz_8_a: "Claimed owners can select official business categories, add verified phone numbers with international country codes, and link official web domains directly within the Business Dashboard.",
      faq_trust_1_q: "Why do live photo reviews outperform traditional text feedback?",
      faq_trust_1_a: "Written reviews are treated as quick signals to be scanned skeptically, whereas live camera photos show indisputable real-world conditions in natural light.",
      faq_trust_2_q: "How does Yoouz eliminate fake reviews, AI bots, and automated spam?",
      faq_trust_2_a: "With AI copywriters making written text reviews effortless to manufacture, Yoouz enforces Proof of Presence™. Every review must be captured live through the device camera in the moment, completely eliminating gallery uploads and automated text bots.",
      faq_trust_smear_q: "How does live camera capture protect businesses from competitor smear campaigns?",
      faq_trust_smear_a: "On legacy text review sites, anonymous trolls can post dozens of fake 1-star essays. Yoouz neutralizes this threat through Proof of Presence™—requiring real live-camera capture from the spot.",
      faq_trust_3_q: "Why are individual reviews restricted to whole stars (1–5)?",
      faq_trust_3_a: "Strict whole-number solid stars make every individual customer verdict clear, honest, and easy to scan in a full-screen vertical feed.",
      faq_trust_4_q: "Is my private email address exposed on my public profile or business claim badge?",
      faq_trust_4_a: "No. Yoouz strictly protects user privacy. Consumers receive anonymous U/XXXXXX identifiers, and public profiles or claimed business badges never display personal email addresses publicly.",
      faq_trust_5_q: "Is Yoouz a misspelling or affiliated with YouTube, Yoox, Youz, or Yelp?",
      faq_trust_5_a: "No. Yoouz (spelled Y-O-O-U-Z, pronounced 'Use' or 'Yooz') is an independent brand and proprietary platform dedicated to authentic live camera photo reviews.",
      faq_trust_6_q: "How are community guidelines and safety rules enforced?",
      faq_trust_6_a: "Every photo review and comment includes a report flag button. Community submissions triggering policy violations are queued for immediate review and removal.",
      faq_trust_7_q: "What are Verified Reviewer and Top Reviewer badges?",
      faq_trust_7_a: "Active reviewers who regularly contribute high-quality photo reviews across local venues and domains earn 'Verified Reviewer' and 'Top Reviewer' badges, highlighting their standing in the community.",
      faq_tech_1_q: "How do photo reviews impact Google Search, Google Maps, and AI answer engines?",
      faq_tech_1_a: "Modern search engines and AI discovery engines prioritize rich, verified user-generated visual content. Yoouz profiles and photo reviews produce high engagement and structured Schema.org metadata that help businesses rank prominently.",
      faq_tech_seo_snippets_q: "How do photo reviews improve Google search rankings and Rich Snippets?",
      faq_tech_seo_snippets_a: "Verified live photo reviews increase visitor engagement and dwell time. Every Yoouz review is structured with Schema.org metadata, enabling search engines to surface star ratings and visual previews in search results.",
      faq_tech_ai_engines_q: "Do photo reviews help businesses appear in Google AI Overviews, ChatGPT, and Perplexity?",
      faq_tech_ai_engines_a: "Yes. Generative AI engines look for verified entity signals rather than easily faked text snippets, referencing structured Yoouz reviews as primary proof.",
      faq_tech_2_q: "How does Google Maps and Live Directions integration work?",
      faq_tech_2_a: "Yoouz integrates interactive Google Maps with live pin clustering. Users can tap any place to view street locations and launch turn-by-turn directions.",
      faq_tech_3_q: "How can I share photo reviews or business profiles with friends?",
      faq_tech_3_a: "Tap the 'Share' button on any photo review or place to generate instant direct web links, downloadable QR codes, or share directly to WhatsApp, X (Twitter), Facebook, LinkedIn, or Email.",
      faq_tech_4_q: "Can I customize the appearance of embedded review feeds?",
      faq_tech_4_a: "Yes! The embed builder allows businesses to preview mobile and desktop views, customize dark/light themes, and set review display limits.",
      faq_tech_5_q: "Where can I find photo reviews or places I have saved for later?",
      faq_tech_5_a: "Any photo review or business listing you bookmark or save is immediately stored in your 'Bookmarks' tab in the main navigation menu for quick access on any device.",
      faq_tech_6_q: "How do I navigate between photo reviews on desktop and mobile?",
      faq_tech_6_a: "On mobile, swipe up or down in the vertical snap feed. On desktop, use your keyboard arrow keys, mouse wheel, or the floating Up and Down navigation controls.",
      faq_tech_7_q: "How does Yoouz work offline as a Progressive Web App (PWA)?",
      faq_tech_7_a: "Yoouz supports PWA offline capabilities and ultra-fast bunny.net CDN caching for instant zero-latency photo browsing.",
      faq_tech_8_q: "How many languages does Yoouz support, and how do I change my language?",
      faq_tech_8_a: "Yoouz supports 64 global languages with full UI internationalization from the sidebar, profile drawer, or Knowledge Center settings.",
      faq_tech_9_q: "Is Yoouz free for consumers and businesses?",
      faq_tech_9_a: "Yes. Browsing, discovering local venues, posting live camera photo reviews, and venue profile claiming are included for all users and business operators with no hidden fees."
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
    profile: {
      no_saved_reviewers: "No saved reviewers yet",
      communityReviewer: "Community reviewer",
      verifiedReviewer: "Verified Reviewer",
      verifiedTopReviewer: "Verified Top Reviewer",
      communityMember: "Community Member",
      editProfile: "Edit Profile",
      shareProfile: "Share Profile",
      shareProfileLink: "Share Profile Link",
      accountSettings: "Account & Settings",
      moreOptions: "More Options",
      shareProfileText: "Share Profile",
      signOut: "Sign Out",
      followers: "Followers",
      following: "Following",
      bio: "Bio",
      location: "Location",
      joined: "Joined",
      overview: "Overview",
      overviewTab: "Overview",
      reviews: "Reviews",
      about: "About",
      aboutMe: "About Me",
      aboutTab: "About",
      saveChanges: "Save Changes",
      cancel: "Cancel",
      city: "City",
      state: "State/Province",
      country: "Country",
      savedReviewer: "Saved reviewer to bookmarks",
      removedSaved: "Removed reviewer from Saved",
      notificationPreferences: "Notification Preferences",
      memberSince: "Member since",
      avgRatingGiven: "Average Rating Given",
      totalReviews: "Total Reviews",
      noVideosYet: "No photo reviews published yet.",
      reportReviewer: "Report or Block Reviewer",
      changePhoto: "Change Photo",
      manageSocialDesc: "Manage followers and reviewers on Yoouz",
      requestDeletionTitle: "Request Account Deletion",
      requestDeletionNotice: "Please select a reason below. Our support team will review and process your account deletion within 24–48 hours.",
      reasonLabel: "Reason",
      notesLabel: "Additional Notes (Optional)",
      deletionRequestSuccess: "Your account deletion request has been submitted. Our team will process it within 24–48 hours.",
      updateProfileDesc: "Update your public profile details",
      profilePicture: "Profile Picture",
      uploadCustomPhoto: "Click to upload a custom JPG or PNG",
      coverBanner: "Cover Banner",
      uploadCustomBanner: "Click to upload a custom JPG or PNG",
      displayName: "Display Name",
      bioPlaceholder: "Introduce yourself to other reviewers! What are your favorite places, foods, or hobbies?",
      regionProvince: "Region / Province",
      selectCity: "Select City",
      languageRegion: "Language & Region",
      requestDeletionDesc: "Submit a request to permanently delete your account & profile.",
      requestBtn: "Request",
      reviewerProfile: "Reviewer Profile",
      communityStats: "Community Stats",
      totalLikes: "Total Likes",
      totalVideos: "Total Photos",
      aboutUser: "About {name}",
      viewVideoReviews: "View Photo Reviews"
    },
    auth: {
      help: "Help",
      signInTitle: "Link Your Account",
      signInSubtitle: "Link Google or Apple anytime to preserve your username and photo review history across devices.",
      recordTitle: "Add a Live Photo Review",
      recordSubtitle: "Snap a live photo and select a whole 1–5 star rating with zero sign-up required.",
      followingTitle: "Link Account to Sync Following",
      followingSubtitle: "Keep track of your favorite reviewers and places across all your devices.",
      messagesTitle: "Access Messages",
      messagesSubtitle: "Directly chat with reviewers and verified business owners across your community.",
      notificationsTitle: "Live Notifications",
      notificationsSubtitle: "Stay updated when people like, comment, or interact with your photo reviews.",
      bookmarksTitle: "Saved Places & Photos",
      bookmarksSubtitle: "Bookmark your favorite restaurants, cafés, and places to visit later.",
      profileTitle: "Your Yoouz Profile",
      profileSubtitle: "Customize your username, view your U/XXXXXX ID, and browse your published photo reviews.",
      commentTitle: "Join the Discussion",
      commentSubtitle: "Share your thoughts, ask questions, and engage directly with the community.",
      claimTitle: "Sign in to Claim Business",
      claimSubtitle: "Verify ownership of your place, respond to photo reviews, and engage customers.",
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
      copyright: "© 2026 Yoouz. Real People. Visual Proof."
    },
    businessAuth: {
      title: "Sign in to Yoouz Business",
      subtitle: "Claim your business, respond to photo reviews, and engage customers as the verified owner.",
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
      reviewerConflictReview: "This email is associated with a customer reviewer who has posted photo reviews. Business accounts must use a dedicated business email to protect review integrity.",
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
      title: "Yoouz Legal & Compliance",
      jurisdiction: "Governing Compliance & Data Protection",
      termsTab: "Terms & Conditions",
      privacyTab: "Privacy Policy",
      officialAgreement: "Official Legal Agreement",
      termsHeading: "Terms & Conditions for Yoouz",
      lastUpdated: "Last Updated: November 16, 2026",
      welcomeTerms: "Welcome to Yoouz. By accessing or using our platform, you agree to be bound by these Terms & Conditions. If you do not agree to these terms, please do not use Yoouz.",
      sec1Title: "Description of Service",
      sec1Body: "Yoouz is a live photo review and discovery platform. Users capture authentic photo reviews directly via their device camera, paired with whole-number 1 to 5 solid star ratings, and businesses can display these reviews via platform-provided tools.",
      sec2Title: "Anonymous Identity & Optional Account Linking",
      sec2Item1: "Visitors receive an automatic anonymous identifier (U/XXXXXX) with zero mandatory registration and may optionally choose a username or link Google/Apple.",
      sec2Item2: "You are responsible for maintaining the security of your device and any optionally linked accounts.",
      sec3Title: "Live Camera Capture & Content Rules",
      noUploadsTitle: "No Gallery Uploads",
      noUploadsBody: "All photo reviews must be captured live through the Yoouz web application camera interface (rear or front lens). Uploading saved photos from device galleries or external libraries is strictly prohibited.",
      standardsTitle: "User Content Standards",
      standardsBody: "You retain personal accountability for the photo reviews you publish. You agree not to capture or publish content that is unlawful, defamatory, abusive, harassing, misleading, or infringing on third-party intellectual property rights.",
      licenseTitle: "Content License",
      licenseBody: "By publishing a photo review on Yoouz, you grant Yoouz a worldwide, non-exclusive, royalty-free license to host and display your photo content on the platform.",
      sec4Title: "Business Accounts & Intellectual Property Protection",
      noOwnership: "No Ownership Transfer:",
      noOwnershipBody: "Businesses utilizing Yoouz do not own the photo files captured by users.",
      streamingAccess: "Authorized Display Only:",
      streamingAccessBody: "Businesses are granted a limited, revocable, non-transferable right to display consumer photo reviews exclusively through Yoouz's authorized platform interface or official embedding tools.",
      antiPiracy: "Anti-Piracy & Anti-Scraping:",
      antiPiracyBody: "Businesses and users are strictly prohibited from scraping, ripping, harvesting, or stealing photo files from Yoouz to re-host them on external websites or third-party servers.",
      futureFeatures: "Future Features and Monetization:",
      futureFeaturesBody: "Advanced business tools, analytics, custom widgets, or higher-tier embedding features may be subject to future paid subscription tiers. Yoouz reserves the right to modify, restrict, or gate business features at any time.",
      sec5TitleDeactivation: "Account Deactivation & Deletion Requests",
      sec5DeactivationBody: "Users may request to deactivate or permanently delete their profile at any time by submitting a formal request through the in-app Account Settings request form within 24 to 48 hours.",
      sec5DeactivationPurge: "Upon completed verification, profile records and linked credentials are permanently eradicated across our database and bunny.net storage systems.",
      sec5Title: "Limitation of Liability",
      sec5Body: "Yoouz is provided on an 'as is' and 'as available' basis. We do not guarantee uninterrupted platform availability and are not liable for user-generated content or damages arising from the use of our services.",
      sec6Title: "Changes to Terms",
      sec6Body: "We reserve the right to modify these Terms & Conditions at any time. Continued use of Yoouz after changes constitutes your acceptance of the updated terms.",
      sec7Title: "Governing Law & Jurisdiction",
      sec7Body: "These terms are governed by applicable privacy regulations and digital service guidelines. Any legal inquiry or proceeding arising from these terms shall be submitted through our official platform compliance desk.",
      privacyArchitecture: "Privacy & Security Compliant",
      privacyHeading: "Privacy Policy for Yoouz",
      welcomePrivacy: "Welcome to Yoouz ('we,' 'our,' or 'us'). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website and web application.",
      privSec1Title: "Information We Collect",
      privSec1Subtitle: "When you interact with Yoouz, we collect minimal data to operate the platform:",
      accountInfoTitle: "Anonymous Identifiers & Optional Linked Accounts",
      accountInfoBody: "Visitors receive an automatic anonymous U/XXXXXX identifier and can optionally claim a custom username or link Google/Apple. Your private email is never exposed publicly.",
      cameraMicTitle: "Live Camera Data",
      cameraMicBody: "Yoouz lets you snap a live photo review directly through your device's camera interface. We do not access, read, or accept saved files or photo gallery uploads.",
      privSec2Title: "How We Use Your Information",
      privSec2Subtitle: "We use the information we collect to:",
      privSec2Item1: "Provision and preserve your U/XXXXXX identity and optional username.",
      privSec2Item2: "Sync your reviews across devices if you optionally link Google or Apple.",
      privSec2Item3: "Process, host, and display your live-captured photo reviews via bunny.net and our local database.",
      privSec2Item4: "Maintain platform security and prevent automated spam.",
      privSec3Title: "Data Sharing and Disclosure",
      privSec3Subtitle: "We do not sell, trade, or rent your personal information to third parties. We may share data only under the following circumstances:",
      serviceProviders: "Service Providers:",
      serviceProvidersBody: "With trusted backend and CDN infrastructure providers (such as bunny.net and our local Cloud SQL database) required to run our web application.",
      legalCompliance: "Legal Compliance:",
      legalComplianceBody: "If required to comply with applicable laws, regulations, or legal processes.",
      privSec4Title: "Data Security",
      privSec4Body: "We implement modern technical and organizational security measures (including encrypted transport via HTTPS) to protect your data from unauthorized access, loss, or misuse.",
      privSec5Title: "Your Rights and Choices",
      privSec5Subtitle: "You have the right to:",
      privSec5Item1: "Access the personal data we hold about you.",
      privSec5Item2: "Request the deactivation or permanent deletion of your profile and personal data through your profile settings.",
      privSec5Item3: "Withdraw your consent to data processing at any time through our automated in-app compliance request system without needing to send an email.",
      privSec6Title: "Privacy Officer & In-App Inquiries",
      privSec6BodyNoEmail: "If you have any questions about this Privacy Policy or wish to exercise your data privacy rights, you can submit an inquiry or account deletion request directly through the in-app Support Desk and Account Settings. All requests are securely routed to our privacy officers and processed within 24–48 hours.",
      copyright: "© 2026 Yoouz Inc. All rights reserved.",
      termsConditions: "Terms & Conditions",
      privacyPolicy: "Privacy Policy",
      supportDesk: "Support Desk",
      networkLocation: "Yoouz Trust Network",
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
