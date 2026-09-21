export type MapFilterCategory =
  | "all"
  | "restaurants"
  | "food"
  | "hotels"
  | "things_to_do"
  | "transit"
  | "parking"
  | "pharmacies"
  | "atms"
  | "supermarket"
  | "cafe"
  | "bakery"
  | "civic"
  | "travel"
  | "museums";

export type NavSection =
  | "home"
  | "discover"
  | "following"
  | "search"
  | "map"
  | "messages"
  | "notifications"
  | "bookmarks"
  | "record_review"
  | "create"
  | "profile"
  | "more"
  | "admin"
  | "pricing"
  | "business"
  | "testembed";

export type FeedSubTab = "discover" | "following";

export interface ReviewComment {
  id: string;
  authorName: string;
  authorHandle?: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
  createdAtMs?: number;
  likesCount?: number;
  isLiked?: boolean;
  isCreator?: boolean;
  isOwner?: boolean;
  likedByCreator?: boolean;
  replyToId?: string;
  replyToHandle?: string;
  
  replies?: ReviewComment[];
}

export interface NotificationPreferences {
  enabled: boolean;
  likes: boolean;
  comments: boolean;
  messages: boolean;
  follows: boolean;
  bookmarks: boolean;
  emailNotifications: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  likes: true,
  comments: true,
  messages: true,
  follows: true,
  bookmarks: true,
  emailNotifications: false,
};

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  
  id?: string;
  uid?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  country?: string;
  handle?: string;
  role?: string;
  isNewUser?: boolean;
  initial?: string;
  bio?: string;
  banner?: string;
  location?: string;
  isVerified?: boolean;
  memberSince?: string;
  followersCount?: number;
  followingCount?: number;
  followers?: string[];
  followedAuthors?: string[];
  followedPlaces?: string[];
  savedVideoIds?: string[];
  savedPlaceIds?: string[];
  savedCreators?: string[];
  notificationSettings?: NotificationPreferences;
}

export interface VideoReview {
  id: string;
  userId?: string;
  userEmail?: string;
  createdAt?: string;
  createdAtMs?: number;
  placeId: string;
  placeName: string;
  placeCategory?: string;
  placeAddress?: string;
  placeCity?: string;
  placeRating?: number;
  placeWebsite?: string;
  placeLogoUrl?: string;
  placeBannerUrl?: string;
  placeDescription?: string;
  author?: {
    name: string;
    handle?: string;
    email?: string;
    userId?: string;
    id?: string;
    avatar: string;
    bio?: string;
    banner?: string;
    location?: string;
    city?: string;
    country?: string;
    isLocalGuide?: boolean;
    localGuideLevel?: number;
    videoReviewCount?: number;
    photosCount?: number;
    isVerified?: boolean;
    isFollowed?: boolean;
    followersCount?: number;
  };
  rating: number; // 1-5 stars
  durationSeconds?: number;
  videoUrl: string;
  bunnyVideoId?: string;
  localVideoUrl?: string;
  fallbackVideoUrls?: string[];
  videoData?: string;
  thumbnailUrl: string;
  caption?: string;
  dishOrItem?: string;
  likes?: number;
  likesCount?: number;
  shares?: number;
  isLiked?: boolean;
  commentsCount?: number;
  comments?: ReviewComment[];
  bookmarksCount?: number;
  bookmarks?: number;
  isBookmarked?: boolean;
  repostsCount?: number;
  isReposted?: boolean;
  views?: number;
  viewsCount?: number;
  sharesCount?: number;
  recordedAt?: string; // e.g. "a week ago", "3 days ago"
  feedCategory?: "discover" | "following";
  transcript?: string;
  tags?: string[];
  ownerResponse?: {
    text: string;
    respondedAt: string;
    respondedAtMs?: number;
  };
  isPinned?: boolean;
  isHiddenFromWidget?: boolean;
  isLocalUpload?: boolean;
  bannerUrl?: string;
  lastViewedAt?: any;
  updatedAt?: any;
  authorName?: string;
  authorAvatar?: string;
  duration?: number;
  ogImage?: string;
}

export type VideoAuthor = VideoReview["author"];

export interface PlaceRatingDistribution {
  stars5: number;
  stars4: number;
  stars3: number;
  stars2: number;
  stars1: number;
}

export interface HotelPricingOption {
  provider: string; // "Booking.com", "Hotels.com", "Agoda", "Official Site"
  logo?: string;
  price: string; // "€294", "$200", "₪1,150"
  cancellationText?: string; // "Free cancellation until 23 Oct"
  amenitiesIncluded?: string[]; // ["Free breakfast", "Free Wi-Fi", "Pay at hotel"]
  badge?: string; // "Sponsored", "Featured", "Best Price"
  rooms?: { name: string; price: string }[];
  bookingUrl?: string;
}

export interface HotelInfo {
  starRating: number; // 4 or 5
  hotelClass: string; // "5-star hotel", "4-star hotel", "Luxury resort"
  pricePerNight: string; // "€294"
  dateRange: string; // "Oct 31 – Nov 1"
  checkInTime?: string; // "15:00"
  checkOutTime?: string; // "11:00"
  pricingOptions: HotelPricingOption[];
  isFreeCancellationAvailable?: boolean;
}

export interface Place {
  id: string;
  name: string;
  category: string;
  categoryType: MapFilterCategory;
  address: string;
  city: string;
  country?: string;
  lat: number;
  lng: number;
  rating: number;
  totalReviews: number;
  videoReviewCount?: number;
  ratingDistribution: PlaceRatingDistribution;
  avatarUrl: string;
  bannerUrl: string;
  photos: string[];
  openingHours: string;
  hours?: string;
  hoursSubtext?: string;
  isOpen: boolean;
  phone: string;
  website: string;
  priceRange: string;
  plusCode: string;
  description: string;
  popularKeywords: { tag: string; count: number }[];
  amenities: string[];
  topDishes: string[];
  locatedIn?: string;
  isSavedToProfile?: boolean;
  isFollowed?: boolean;
  source?: string;
  googleMapsUri?: string;
  hotelInfo?: HotelInfo;
  logoUrl?: string;
  ogImage?: string;
  brandDomain?: string;
  isClaimed?: boolean;
  isVerified?: boolean;
  ownerId?: string;
  claimedByEmail?: string;
  email?: string;
  staffEmails?: string[];
  subscriptionPlan?: "basic" | "pro" | "premium" | "free";
  subscriptionStatus?: "active" | "trialing" | "past_due" | "canceled" | "unpaid" | "free";
  subscriptionAmount?: number;
  subscriptionBillingCycle?: "monthly" | "yearly";
  subscriptionStartDate?: number | string;
  subscriptionPaidAt?: number | string;
  subscriptionPaymentMethod?: string;
  subscriptionTransactionId?: string;
  subscriptionMessagesSent?: number;
  reviews?: any[];
}

export interface CopoNotification {
  id: string;
  type: "like" | "comment" | "follow" | "repost" | "message" | "bookmark";
  user: {
    name: string;
    avatar: string;
    email?: string;
  };
  text: string;
  timestamp: string;
  createdAtMs?: number;
  videoThumbnail?: string;
  videoId?: string;
  placeId?: string;
  placeName?: string;
  isRead: boolean;
}

export interface CopoMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderEmail?: string;
  lastSenderEmail?: string;
  recipientEmail?: string;
  recipientId?: string;
  participants?: string[];
  lastMessage: string;
  timestamp: string;
  createdAtMs?: number;
  unreadCount: number;
  videoPreviewUrl?: string;
  history?: {
    id: string;
    senderName: string;
    senderAvatar: string;
    senderEmail?: string;
    text: string;
    timestamp: string;
    createdAtMs?: number;
    isMe: boolean;
    videoThumbnail?: string;
    videoId?: string;
  }[];
}
