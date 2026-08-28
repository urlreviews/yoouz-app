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
  | "clubs"
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
  | "business";

export type FeedSubTab = "discover" | "following" | "clubs";

export interface ReviewComment {
  id: string;
  authorName: string;
  authorHandle?: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
  createdAtMs?: number;
  likesCount: number;
  isLiked?: boolean;
  isCreator?: boolean;
  isOwner?: boolean;
  likedByCreator?: boolean;
  replyToId?: string;
  
  replies?: ReviewComment[];
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  
  userId?: string;
  bio?: string;
  banner?: string;
  location?: string;
  memberSince?: string;
  followersCount?: number;
  followingCount?: number;
  followedAuthors?: string[];
  followedPlaces?: string[];
}

export interface VideoReview {
  id: string;
  userId?: string;
  userEmail?: string;
  createdAtMs?: number;
  placeId: string;
  placeName: string;
  placeCategory: string;
  placeAddress: string;
  placeCity: string;
  placeRating: number;
  placeWebsite?: string;
  placeLogoUrl?: string;
  placeBannerUrl?: string;
  author: {
    name: string;
    
    email?: string;
    userId?: string;
    id?: string;
    avatar: string;
    bio?: string;
    banner?: string;
    location?: string;
    isLocalGuide?: boolean;
    localGuideLevel?: number;
    videoReviewCount?: number;
    photosCount?: number;
    isVerified?: boolean;
    isFollowed?: boolean;
    followersCount?: number;
  };
  rating: number; // 1-5 stars
  durationSeconds: number;
  videoUrl: string;
  bunnyVideoId?: string;
  localVideoUrl?: string;
  fallbackVideoUrls?: string[];
  videoData?: string;
  thumbnailUrl: string;
  caption: string;
  dishOrItem?: string;
  likes: number;
  shares?: number;
  isLiked: boolean;
  commentsCount: number;
  comments: ReviewComment[];
  bookmarksCount: number;
  isBookmarked: boolean;
  repostsCount: number;
  isReposted?: boolean;
  views?: number;
  viewsCount?: number;
  sharesCount: number;
  recordedAt: string; // e.g. "a week ago", "3 days ago"
  feedCategory?: "discover" | "following" | "clubs";
  clubName?: string;
  transcript?: string;
  tags: string[];
  ownerResponse?: {
    text: string;
    respondedAt: string;
    respondedAtMs?: number;
  };
  isPinned?: boolean;
  isHiddenFromWidget?: boolean;
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
}

export interface Club {
  id: string;
  name: string;
  avatar: string;
  banner: string;
  membersCount: number;
  videoCount: number;
  description: string;
  isJoined: boolean;
  city: string;
}

export interface CopoNotification {
  id: string;
  type: "like" | "comment" | "follow" | "repost" | "message";
  user: {
    name: string;
    
    avatar: string;
  };
  text: string;
  timestamp: string;
  createdAtMs?: number;
  videoThumbnail?: string;
  videoId?: string;
  isRead: boolean;
}

export interface CopoMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  lastMessage: string;
  timestamp: string;
  createdAtMs?: number;
  unreadCount: number;
  videoPreviewUrl?: string;
  history?: {
    id: string;
    senderName: string;
    senderAvatar: string;
    text: string;
    timestamp: string;
  createdAtMs?: number;
    isMe: boolean;
    videoThumbnail?: string;
    videoId?: string;
  }[];
}
