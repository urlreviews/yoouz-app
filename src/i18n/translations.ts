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
      minutes: "minutes",
      clear: "Clear",
      clearAll: "Clear All",
      videoReview: "video review",
      videoReviews: "video reviews",
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
      videoReview: "video review",
      videoReviews: "video reviews",
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
      tabVideos: "Videos",
      tabPlaces: "Places",
      tabReviewers: "Reviewers",
      videosEmpty: "Tap the bookmark icon in any video's options menu to save it.",
      placesEmpty: "Grab places you want to visit from the map or review screens to build your bucket list.",
      reviewersEmpty: "Save trusted local guides & creators to instantly track their latest visual reviews."
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
      allCaughtUpDesc: "You're all caught up! Community updates and video review activity will appear here.",
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
      chat_unavailable: "Direct Messaging Unavailable",
      no_saved_places: "No saved places yet"
    },
    search: {
      title: "Review Any Business",
      subtitle: "Search any business to watch authentic video reviews or record your own.",
      recentSearches: "Recent Searches",
      trendingSearches: "Trending Searches",
      backSearch: "Search another business or website",
      viewBusiness: "View Business",
      reviews: "Reviews",
      syncing: "Syncing details...",
      invalidUrl: "Please select a business from the dropdown list or search with a valid website domain.",
      placeholder: "Search any business, service, or place..."
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
      trustEvolutionPara2: "When a customer asks \"Is this actually true?\", written reviews stop converting. Yoouz bridges that gap by moving past sterile text to create real human proof. We eliminate pre-recorded uploads, stock video files, and scripted corporate marketing. Every review on Yoouz is captured live through the device camera, restricted to a sharp 60-second focus, and tied directly to a verifiable human face and voice.",
      strictRule: "STRICT RULE",
      rule1Title: "Live Front-Camera Only",
      rule1Desc: "No pre-recorded MP4 uploads or stock footage. Real customers capturing authentic experiences.",
      pillar2: "PILLAR 2",
      rule2Title: "60-Second Focus",
      rule2Desc: "Concise, high-impact video reviews that deliver immediate value in under one minute.",
      pillar3: "PILLAR 3",
      rule3Title: "3-Way Dialogue",
      rule3Desc: "Living comment threads connecting Reviewers, curious Viewers, and Verified Place Owners.",
      conversionScienceLabel: "The Conversion Science",
      conversionScienceTitle: "Why Live Video Wins Every Time",
      conversionScienceDesc: "Video doesn't just display an opinion—it transmits emotional conviction, body language, and unmistakable truth.",
      point1Title: "1. Instant Human Connection (No Corporate Script)",
      point1Desc: "When users watch a video, they stop evaluating marketing claims and start evaluating a human. Micro-expressions, a natural pause, vocal tone, and body language carry emotional weight that makes feedback feel instantly genuine and unscripted.",
      point2Title: "2. Concrete Specifics Over Generic Buzzwords",
      point2Desc: "Written testimonials often rely on interchangeable buzzwords like \"great service, highly recommend\". Video captures unscripted specifics—real dish walkthroughs, exact timelines, and concrete outcomes that provide undeniable proof.",
      point3Title: "3. Up to 20x Stronger Brand Trust & 80–95% Retention",
      point3Desc: "Brand trust multiplies exponentially when prospective customers relate directly to a speaker showing a service or place in action. Viewers retain roughly 80% to 95% of a message delivered via video compared to only 10% to 20% from text.",
      point4Title: "4. The Trust Anchor for High-Stakes Decisions",
      point4Desc: "When a purchase feels like an investment rather than an expense—such as medical care, wedding venues, premium dining, or high-end services—video testimonials act as definitive trust anchors that dismantle customer skepticism.",
      point5Title: "5. A Permanent Competitive Moat & Modern AI Discovery",
      point5Desc: "While text review volume can be artificially copied overnight, building a library of authentic 60-second video testimonials creates an uncatchable advantage. Modern search engines and AI answer engines (Google AI Overview, Gemini, Perplexity) prioritize authentic video proof over faceless text snippets.",
      bento1Title: "Immutable Face & Voice Identity",
      bento1Desc: "Every reviewer builds an open visual review portfolio. Consistent face, verified voice, and historical timeline give viewers immediate confidence that reviews are authored by genuine people.",
      bento1Sub: "Audit Any Reviewer Profile Instantly",
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
      seoAdvantageTitle: "The SEO & Discovery Advantage of Video Reviews",
      seoAdvantageDesc: "Search engines like Google and generative AI engines prioritize authentic video entities over faceless text snippets.",
      seoRichSnippetsTitle: "Google Video Rich Snippets",
      seoRichSnippetsDesc: "Structured Schema.org VideoObject and Review metadata display video badges, star ratings, and thumbnails directly in Google search results.",
      aiRecommendationsTitle: "AI Grounded Recommendations",
      aiRecommendationsDesc: "Google AI Overviews, Gemini, ChatGPT, and Perplexity index spoken transcripts and geolocation to recommend highly rated authentic venues.",
      qrCaptureTitle: "In-Store QR Capture",
      qrCaptureDesc: "Merchants download instant table tents and counter cards so happy customers can scan and record 60-second video testimonials on the spot.",
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
      privacySecurityTitle: "Privacy, Security & Legal Compliance",
      privacyVerifiedBadge: "Enterprise Security • Zero Passwords Stored",
      googleVerified: "Enterprise Security • Zero Passwords Stored",
      privacySummary: "Yoouz is built with privacy-first standards. We use secure email verification for passwordless authentication, process camera streams in real-time without photo library harvesting, and enforce San Francisco, California USA governing jurisdiction.",
      updatedDate: "Updated Aug 24, 2026",
      privacyPolicyTitle: "Privacy Policy",
      privacyPolicyDesc: "Covers account profile data handling, real-time camera/mic usage, zero password storage, zero data selling, and your right to data deletion.",
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
      deactivateAccountTitle: "Deactivate Account (Temporary Hide)",
      deactivateAccountDesc: "Take a break without losing any of your data. Your profile and reviews will be temporarily hidden from the public feed. When you log back in, everything is instantly restored.",
      deactivateAccountBtn: "Deactivate Account",
      deactivateAccountWarning: "Confirming will log you out and hide your content until you sign in again.",
      deactivateAccountConfirmTitle: "Deactivate Your Account?",
      deactivateAccountConfirmDesc: "Your profile and videos will be temporarily hidden from the public feed. None of your data is erased. You can reactivate at any time simply by logging back in.",
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
      faq_rev_1_q: "How long can my video review be?",
      faq_rev_1_a: "Every video review has a strict limit of 60 seconds. This ensures content remains high-impact, focused, digestible, and easy for other users to browse quickly without fluff or commercial filler.",
      faq_rev_2_q: "Why does the video recorder only use the live front camera and disable gallery uploads?",
      faq_rev_2_a: "To guarantee 100% authentic human experiences, Yoouz enforces Proof of Presence™ by auto-starting the live front (selfie) camera for direct recording. Uploading pre-recorded gallery files, marketing commercials, or stock video is strictly disabled to eliminate fake reviews and bot uploads.",
      faq_rev_3_q: "Do I need professional equipment or video editing skills to leave a review?",
      faq_rev_3_a: "Not at all. Yoouz is built for raw, spontaneous, authentic moments. All you need is your smartphone. Open the live front camera, share your genuine feedback for 30–60 seconds, and publish. No studio lighting, script reading, or video editing is needed.",
      faq_rev_4_q: "Do I automatically receive a Verified badge when I create an account?",
      faq_rev_4_a: "No. All new accounts start as standard unverified profiles. Your official 'Verified Reviewer' badge is automatically granted as soon as you record and publish your first live video review.",
      faq_rev_5_q: "Can viewers comment, ask questions, or interact on my video reviews?",
      faq_rev_5_a: "Yes! Every video review includes a live 3-way community discussion feed. Viewers can ask follow-up questions ('Is parking easy?', 'Did you try the dessert?'), share tips, and discuss their experiences directly beneath your video.",
      faq_rev_6_q: "Can I review any website domain or local establishment?",
      faq_rev_6_a: "Yes! You can search and review any base website domain (e.g., stripe.com, airbnb.com) or local brick-and-mortar place (restaurants, cafes, services, gyms) to build a unified hub of authentic opinions.",
      faq_rev_7_q: "Can I edit or delete my reviews later?",
      faq_rev_7_a: "Absolutely. You maintain complete ownership of your uploaded content. You can modify your star rating or permanently delete any of your posted video reviews at any time directly from your Profile drawer or video player options.",
      faq_rev_8_q: "How does direct messaging work between community members?",
      faq_rev_8_a: "Reviewers and users can message each other directly through the 'Messages' tab to ask private questions about venues, recommend local spots, or connect with fellow explorers.",
      faq_biz_premium_suite_q: "What is included in the Yoouz Premium Business Suite ($149/mo)?",
      faq_biz_premium_suite_a: "The Yoouz Premium Business Suite ($149/mo or $99/mo annual) provides a comprehensive enterprise growth stack: Verified Business Badge, Priority Search Placement in local search results, Live Website Review Widget with automated Google Rich Snippets SEO Schema, HD Branded Video Ad Exporter with watermark overlays, Pinned Owner Video Replies, Direct Messaging Lead Capture, Table & Window QR Standees, and Real-Time Analytics.",
      faq_biz_premium_seo_q: "How does the Yoouz Premium Suite improve Google Search SEO & Rich Snippets?",
      faq_biz_premium_seo_a: "When you embed your Yoouz video review widget on your website, our system automatically generates Schema.org JSON-LD structured data. This allows search engines like Google to render star ratings and video thumbnails directly in organic search results, increasing organic click-through rates (CTR) by up to 35%.",
      faq_biz_premium_ads_q: "Can businesses export customer video reviews as branded social media ads?",
      faq_biz_premium_ads_a: "Yes! Premium Suite subscribers can export customer 60-second video reviews as high-definition branded video ad assets with your official venue logo overlay, subtitles, and watermark—ready to run on Instagram Reels, TikTok, Facebook Ads, or YouTube Shorts.",
      faq_biz_premium_terms_q: "Are there any contracts, hidden fees, or cancellation lock-ins?",
      faq_biz_premium_terms_a: "No. Yoouz Premium Business Suite is completely flexible with zero setup fees and zero cancellation penalties. You can upgrade, pause, or switch plans anytime with 1-click in your Business Dashboard.",
      faq_biz_1_q: "How can my business claim its official domain or place page?",
      faq_biz_1_a: "Business owners can claim their listing in less than 2 minutes through the business verification flow. Claiming unlocks official owner dashboard tools, category settings, operating hours management, and customer dialogue features.",
      faq_biz_2_q: "Why do live video reviews convert so much higher than traditional text reviews?",
      faq_biz_2_a: "Written reviews are treated as quick signals that users skim with skepticism, whereas video reviews are multi-sensory experiences. When customers see real human facial expressions and hear sincere vocal enthusiasm, brand trust multiplies up to 20x. Video delivers unscripted proof that dramatically accelerates purchasing decisions.",
      faq_biz_ugc_q: "Why are authentic customer video reviews 9.8x more trusted than paid influencer endorsements?",
      faq_biz_ugc_a: "Modern consumers are fatigue-blind to sponsored ads. Unscripted 60-second video reviews from everyday customers carry authentic social proof because reviewers have no financial incentive to flatter, making them almost 10x more trustworthy than paid influencers.",
      faq_biz_returns_q: "How do video reviews reduce product return rates and customer misunderstandings?",
      faq_biz_returns_a: "Text reviews often create ambiguous expectations. A 60-second video walkthrough shows true sizing, atmosphere, portion sizes, or build quality in natural light, aligning customer expectations before purchase and drastically lowering return rates.",
      faq_biz_case_study_q: "Why are 60-second video testimonials replacing long, written case studies for businesses?",
      faq_biz_case_study_a: "Modern buyers rarely read lengthy PDF case studies or 1,000-word written posts. A concise 60-second video where a client highlights their problem, timeline, and measurable outcome delivers the full value proposition in under a minute.",
      faq_biz_qr_q: "How can businesses use QR codes to capture in-person video testimonials on the spot?",
      faq_biz_qr_a: "Verified businesses can download branded QR table tents, counter cards, and receipt stickers from their dashboard. When customers scan the code, it launches the live 60-second front-camera review recorder instantly with the place pre-tagged.",
      faq_biz_3_q: "Can businesses embed Yoouz video reviews on their own websites?",
      faq_biz_3_a: "Yes! Verified businesses can copy responsive iframe video feed embeds from their place drawer or Business Dashboard to display live, authentic 60-second customer video reviews directly on their e-commerce store, Shopify site, or landing page.",
      faq_biz_4_q: "Can businesses export or download Branded Video Ads?",
      faq_biz_4_a: "Yes! Claimed businesses can export customer video reviews as high-resolution branded video ad assets with official watermark overlays for use in social media campaigns, Instagram stories, TikTok ads, and marketing campaigns.",
      faq_biz_5_q: "Can businesses pay to remove or hide negative video reviews?",
      faq_biz_5_a: "No. Yoouz is built on uncompromised trust and authenticity. We never delete or alter honest video reviews for payment. Reviews that violate safety or explicit content guidelines can be flagged for human moderation review, and owners can post pinned video replies to provide transparent resolutions.",
      faq_biz_6_q: "How do official Business Owner replies and pinned comments work?",
      faq_biz_6_a: "Claimed business owners can participate in comment threads with a highlighted 'Business Owner' badge. Owners can also pin official responses to the top of comment feeds to highlight updates, resolutions, or special announcements.",
      faq_biz_7_q: "What is the Business Hours Manager and how does it sync?",
      faq_biz_7_a: "Claimed business owners can configure weekly operating hours, special holiday schedules, and open/closed statuses directly in their dashboard. Changes sync live across search results and place profile drawers.",
      faq_biz_8_q: "How do I manage business categories and contact details?",
      faq_biz_8_a: "Claimed owners can select official business categories, add verified phone numbers with international country codes, and link official web domains directly within the Business Dashboard.",
      faq_trust_1_q: "Why do video reviews outperform traditional text feedback so drastically?",
      faq_trust_1_a: "Written reviews are treated as quick signals to be scanned, whereas video testimonials are experienced through multi-sensory human processing. Humans are hardwired to evaluate vocal tone, facial micro-expressions, and sincerity. People retain 80% to 95% of a video message compared to only 10% to 20% of text, turning skepticism into confident belief.",
      faq_trust_2_q: "How does Yoouz eliminate fake reviews, AI bots, and automated spam?",
      faq_trust_2_a: "With AI copywriters and bot farms making written text reviews effortless to manufacture, Yoouz enforces Proof of Presence™. Every review must be captured live through the device camera in the moment, completely eliminating pre-recorded video uploads, third-party stock footage, and automated text bots.",
      faq_trust_smear_q: "How does live video review capture protect businesses from competitor smear campaigns and review extortion?",
      faq_trust_smear_a: "On legacy text review sites, unethical competitors or anonymous trolls can easily create dozens of burner accounts to post damaging 1-star text complaints. Yoouz neutralizes this threat through Proof of Presence™—requiring real individuals to show their face and speak live on camera, dismantling anonymous trolling and malicious smear attacks.",
      faq_trust_3_q: "When should text be used versus video on a platform?",
      faq_trust_3_a: "Text reviews provide efficient, scannable proof when speed and volume outweigh the need for deep trust. However, when a purchase feels like an investment, involves a high-ticket service, or requires unwavering credibility, video testimonials act as essential trust anchors that dismantle customer skepticism.",
      faq_trust_4_q: "Is my private email address exposed on my public profile or business claim badge?",
      faq_trust_4_a: "No. Yoouz strictly protects user privacy. Public profiles and claimed business badges remain private and anonymous (e.g., 'Business Claimed') without ever displaying personal or owner email addresses to the public.",
      faq_trust_5_q: "Is Yoouz a misspelling or affiliated with YouTube, Yoox, Youz, or Yelp?",
      faq_trust_5_a: "No. Yoouz (spelled Y-O-O-U-Z, pronounced 'Use' or 'Yooz') is an independent brand and proprietary platform. It is NOT a misspelling, typo, or subsidiary of YouTube, Yoox, Youz, Yelp, or any other company. Yoouz is specifically dedicated to authentic 60-second live camera video reviews.",
      faq_trust_6_q: "How are community guidelines and safety rules enforced?",
      faq_trust_6_a: "Every video review and comment includes a report flag button. Community submissions triggering policy violations (hate speech, spam, harassment, or explicit content) are queued for immediate review and removal.",
      faq_trust_7_q: "What are Verified Reviewer and Top Reviewer badges?",
      faq_trust_7_a: "Active reviewers who regularly contribute high-quality video reviews across local venues and domains automatically earn 'Verified Reviewer' and 'Top Reviewer' badges, highlighting their standing in the community.",
      faq_tech_1_q: "How do video reviews impact Google Search, Google Maps, and AI answer engines?",
      faq_tech_1_a: "Modern search engines (like Google) and AI discovery engines (Perplexity, ChatGPT, Gemini) prioritize rich, verified user-generated video content. Yoouz profiles and 60-second video reviews produce high dwell times and structured Schema.org VideoObject metadata that help businesses rank prominently in local map packs and AI search overviews.",
      faq_tech_seo_snippets_q: "How do video testimonials improve Google search rankings and generate Video Rich Snippets?",
      faq_tech_seo_snippets_a: "Video generates significantly higher dwell time and lower bounce rates—two primary Google ranking metrics. Every Yoouz video is structured with Schema.org/VideoObject and Review metadata, enabling search engines to surface interactive video thumbnails, star ratings, and timestamps in Google Search and Google Video results.",
      faq_tech_ai_engines_q: "Do video reviews help businesses appear in Google AI Overviews, ChatGPT, and Perplexity?",
      faq_tech_ai_engines_a: "Yes. Generative AI engines look for verified entity signals rather than easily faked text snippets. Because Yoouz ties reviews to real human faces, authentic vocal transcripts, and geolocation, AI engines reference Yoouz reviews as primary proof when answering local and brand queries.",
      faq_tech_2_q: "How does Google Maps and Live Directions integration work?",
      faq_tech_2_a: "Yoouz integrates interactive Google Maps with live pin clustering. Users can tap any place to view street locations and launch step-by-step turn-by-turn driving, walking, biking, or transit directions.",
      faq_tech_3_q: "How can I share video reviews or business profiles with friends?",
      faq_tech_3_a: "Tap the 'Share' button on any video or place to generate instant direct web links, downloadable QR codes, or share directly to WhatsApp, X (Twitter), Facebook, LinkedIn, or Email.",
      faq_tech_4_q: "Can I customize the appearance of embedded video feeds?",
      faq_tech_4_a: "Yes! The embed builder allows businesses to preview mobile and desktop views, customize dark/light themes, set video limits, and toggle autoplay or sound controls.",
      faq_tech_5_q: "Where can I find video reviews or places I have saved for later?",
      faq_tech_5_a: "Any video review or business listing you bookmark or save is immediately stored in your 'Bookmarks' tab in the main navigation menu for quick access on any device.",
      faq_tech_6_q: "How do I navigate between video reviews on desktop and mobile?",
      faq_tech_6_a: "On mobile, swipe up or down to move between videos. On desktop, use your keyboard arrow keys, mouse wheel, or the fixed vertical Up (^) and Down (v) floating chevron buttons. The Up chevron is dimmed on the first video to indicate you are at the start of the feed.",
      faq_tech_7_q: "How does Yoouz work offline as a Progressive Web App (PWA)?",
      faq_tech_7_a: "Yoouz supports PWA offline capabilities and IndexedDB video caching, allowing instant zero-latency video playback and offline review draft queues when connectivity is low.",
      faq_tech_8_q: "How many languages does Yoouz support, and how do I change my language?",
      faq_tech_8_a: "Yoouz supports 64 global languages with full UI internationalization. You can switch your preferred language at any time from the sidebar, footer, profile drawer, or Knowledge Center settings.",
      faq_tech_9_q: "Is Yoouz free for consumers and businesses?",
      faq_tech_9_a: "Yes. Browsing, discovering local venues, posting authentic 60-second video reviews, and venue profile claiming are included for all users and business operators with no hidden fees."
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
      noVideosYet: "No video reviews published yet.",
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
      totalVideos: "Total Videos",
      aboutUser: "About {name}",
      viewVideoReviews: "View Video Reviews"
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
      title: "Yoouz Legal & Compliance",
      jurisdiction: "Governing Jurisdiction: San Francisco, California, USA",
      termsTab: "Terms & Conditions",
      privacyTab: "Privacy Policy",
      officialAgreement: "Official Legal Agreement",
      termsHeading: "Terms & Conditions for Yoouz",
      lastUpdated: "Last Updated: August 24, 2026",
      welcomeTerms: "Welcome to Yoouz. By accessing or using our platform, you agree to be bound by these Terms & Conditions. If you do not agree to these terms, please do not use Yoouz.",
      sec1Title: "Description of Service",
      sec1Body: "Yoouz is a video review and discovery platform. Users can record authentic reviews directly via their device camera, and businesses can display or stream these reviews within their profiles or via platform-provided tools.",
      sec2Title: "Account Registration",
      sec2Item1: "You must authenticate using your verified email address to create an account.",
      sec2Item2: "You are responsible for maintaining the security of your account and restricting unauthorized access to your device.",
      sec3Title: "Live Video Recording & Content Rules",
      noUploadsTitle: "No File Uploads",
      noUploadsBody: "All reviews must be recorded live through the Yoouz web application camera interface. Uploading pre-recorded video files from device storage or external libraries is strictly prohibited.",
      standardsTitle: "User Content Standards",
      standardsBody: "You retain personal accountability for the reviews you record. You agree not to record or publish content that is unlawful, defamatory, abusive, harassing, misleading, or infringing on third-party intellectual property rights.",
      licenseTitle: "Content License",
      licenseBody: "By recording a review on Yoouz, you grant Yoouz a worldwide, non-exclusive, royalty-free license to host, display, and stream your video content on the platform.",
      sec4Title: "Business Accounts & Intellectual Property Protection",
      noOwnership: "No Ownership Transfer:",
      noOwnershipBody: "Businesses utilizing Yoouz do not own the video files recorded by users.",
      streamingAccess: "Streaming-Only Access:",
      streamingAccessBody: "Businesses are granted a limited, revocable, non-transferable right to display consumer reviews exclusively through Yoouz's authorized platform interface or official embedding tools.",
      antiPiracy: "Anti-Piracy & Anti-Scraping:",
      antiPiracyBody: "Businesses and users are strictly prohibited from screen-recording, ripping, downloading, harvesting, or stealing video files from Yoouz to re-host them on external websites or third-party servers.",
      futureFeatures: "Future Features and Monetization:",
      futureFeaturesBody: "Advanced business tools, analytics, custom widgets, or higher-tier embedding features may be subject to future paid subscription tiers. Yoouz reserves the right to modify, restrict, or gate business features at any time.",
      sec5TitleDeactivation: "Account Deactivation & Deletion Requests",
      sec5DeactivationBody: "Users may request to deactivate or permanently delete their account and personal profile at any time by submitting a formal request through the in-app Account Settings request form. To protect authentic user reviews and prevent fraudulent or accidental account wipeouts, deletion requests are securely verified and processed by our compliance desk within 24 to 48 hours without requiring public email communication.",
      sec5DeactivationPurge: "Upon completed review and verification of the deletion request, the user's account records, authentication credentials, and personal profile data are permanently eradicated across our database and storage systems.",
      sec5Title: "Limitation of Liability",
      sec5Body: "Yoouz is provided on an 'as is' and 'as available' basis. We do not guarantee uninterrupted platform availability and are not liable for user-generated content or damages arising from the use of our services.",
      sec6Title: "Changes to Terms",
      sec6Body: "We reserve the right to modify these Terms & Conditions at any time. Continued use of Yoouz after changes constitutes your acceptance of the updated terms.",
      sec7Title: "Governing Law & Jurisdiction",
      sec7Body: "These terms are governed by the laws of the State of California, USA, without regard to its conflict of law provisions. Any legal action or proceeding arising from these terms shall be brought exclusively in the courts located in San Francisco, California, USA.",
      privacyArchitecture: "Privacy & Security Compliant",
      privacyHeading: "Privacy Policy for Yoouz",
      welcomePrivacy: "Welcome to Yoouz ('we,' 'our,' or 'us'). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website and web application.",
      privSec1Title: "Information We Collect",
      privSec1Subtitle: "When you interact with Yoouz, we collect limited personal data to provide and secure your account:",
      accountInfoTitle: "Account Information & Verified Email",
      accountInfoBody: "When you log in using your verified email address, we receive your account profile data, which includes your name, email address, and profile picture. We do not collect or store passwords.",
      cameraMicTitle: "Camera and Microphone Data",
      cameraMicBody: "Yoouz allows you to record video reviews directly through your device's camera interface. We do not access or accept pre-recorded files or photo library uploads. Camera and microphone data are accessed strictly in real-time during your active recording session to capture and generate your live video review.",
      privSec2Title: "How We Use Your Information",
      privSec2Subtitle: "We use the information we collect to:",
      privSec2Item1: "Create and manage your Yoouz user account.",
      privSec2Item2: "Authenticate your identity securely via passwordless email verification.",
      privSec2Item3: "Process, host, and display your live-recorded video reviews on the platform.",
      privSec2Item4: "Maintain platform security and prevent fraudulent activity.",
      privSec3Title: "Data Sharing and Disclosure",
      privSec3Subtitle: "We do not sell, trade, or rent your personal information to third parties. We may share data only under the following circumstances:",
      serviceProviders: "Service Providers:",
      serviceProvidersBody: "With trusted backend and hosting infrastructure providers (such as bunny.net and PostgreSQL Cloud SQL) required to run our web application.",
      legalCompliance: "Legal Compliance:",
      legalComplianceBody: "If required to comply with applicable laws, regulations, or legal processes.",
      privSec4Title: "Data Security",
      privSec4Body: "We implement modern technical and organizational security measures (including encrypted transport via HTTPS and secure token-based authentication) to protect your data from unauthorized access, loss, or misuse.",
      privSec5Title: "Your Rights and Choices",
      privSec5Subtitle: "You have the right to:",
      privSec5Item1: "Access the personal data we hold about you.",
      privSec5Item2: "Request the deactivation or permanent deletion of your account and personal data by submitting the in-app Account Deletion Request form in your profile settings.",
      privSec5Item3: "Withdraw your consent to data processing at any time through our automated in-app compliance request system without needing to send an email.",
      privSec6Title: "Privacy Officer & In-App Inquiries",
      privSec6BodyNoEmail: "If you have any questions about this Privacy Policy or wish to exercise your data privacy rights, you can submit an inquiry or account deletion request directly through the in-app Support Desk and Account Settings. All requests are securely routed to our privacy officers and processed within 24–48 hours.",
      copyright: "© 2026 Yoouz Inc. • San Francisco, CA",
      termsConditions: "Terms & Conditions",
      privacyPolicy: "Privacy Policy",
      supportDesk: "Support Desk",
      networkLocation: "Yoouz Trust Network • San Francisco, CA",
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
