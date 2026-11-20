import { useCriticalImagesLoaded } from "../hooks/useCriticalImagesLoaded";
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { NavSection, Place, VideoReview, ReviewComment, UserProfile, VideoAuthor, CopoMessage, CopoNotification, NotificationPreferences, DEFAULT_NOTIFICATION_PREFERENCES, FeedSubTab, BusinessSession } from '../types';
import { CopoNotificationSettingsModal } from './CopoNotificationSettingsModal';
import { CopoTestEmbedView } from "./CopoTestEmbedView";
import { getDisplayViews, getPlaceSlug, getSafeAvatarUrl, resolveSafeAuthor, extractCleanDomain } from '../utils/placeUtils';
import { generateGoogleLetterAvatarSvg } from '../lib/avatar';
import { CopoBusinessAuthLanding } from './CopoBusinessAuthLanding';
import { CopoMessagesView } from './CopoMessagesView';
import { CopoNotificationsView } from './CopoNotificationsView';
import { CopoStarRating } from './CopoStarRating';
import { CopoMoreView } from './CopoMoreView';
import { CopoPremiumPlansModal } from './CopoPremiumPlansModal';
import { 
  Home,
  Menu,
  Shield, 
  Eye, 
  EyeOff,
  MousePointerClick, 
  MessageSquare, 
  MessageCircle,
  Star, 
  TrendingUp, 
  ExternalLink,
  Building2, 
  Mail, 
  Check, 
  CheckCheck,
  ArrowLeft, 
  ChevronLeft, 
  Lock, 
  QrCode, 
  Download, 
  Code, 
  Loader2, 
  CreditCard, 
  Receipt, 
  BarChart3,
  Award,
  Video,
  Play,
  Pause,
  Settings,
  LogOut,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
  Globe,
  Sliders,
  Copy,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Camera,
  Search,
  Bell,
  HelpCircle,
  X,
  Printer,
  BadgeCheck,
  ShieldCheck,
  Send,
  AlertCircle,
  Smartphone,
  Calendar,
  ShoppingBag,
  Utensils,
  Ticket,
  Phone,
  FileText,
  Sparkles,
  Zap,
  Share2,
  Heart,
  Bookmark,
  CheckCircle,
  Link2,
  Layers,
  MapPin,
  Clock,
  Info,
  LayoutDashboard,
  Wrench,
  Hotel,
  Users,
  UserPlus,
  UserCheck,
  UserMinus,
  Package,
  Truck,
  Upload,
  Trash2,
  Edit2
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { normalizeVideoUrl, releaseVideoHardwareDecoder, downloadVideoForAds } from '../utils/videoUtils';
import { useGlobalMute, ensureSharedAudioContextUnlocked } from '../hooks/useGlobalMute';
import { getPlaceLogoUrl } from '../utils/logoUtils';
import { CopoBrandLogo } from './CopoBrandLogo';
import { CopoVideoPlayer } from './CopoVideoPlayer';
import { CopoMobileBottomNav } from './CopoMobileBottomNav';
import { CopoCommentsDrawer } from './CopoCommentsDrawer';
import { GoogleOwnerReplyModal } from './GoogleOwnerReplyModal';
import { CopoBrandedAdExportModal } from './CopoBrandedAdExportModal';
import { formatRecordedDate, resolveMessageTimestampMs } from '../utils/dateUtils';
import { CountrySelector } from './CountrySelector';
import { CountryDialCodeSelector } from './CountryDialCodeSelector';
import { BusinessHoursManager, DaySchedule } from './BusinessHoursManager';
import { BusinessCategorySelector } from './BusinessCategorySelector';
import { SearchableComboSelector } from './SearchableComboSelector';
import { locationData } from "../utils/locationData";
import { Country, State, City } from "country-state-city";
import { countryDialData, getDialCodeByCountry, getCountryDialInfo } from '../utils/countries';
import { useLanguage } from '../i18n/LanguageContext';
import { buildLocalizedPath } from '../i18n/urlLocalization';
import { derivePlaceFromEmailOrDomain } from '../utils/businessDomainUtils';
import { getDeletedThreadsMap, saveDeletedThreadsMap, unmarkDeletedThread, getThreadPartnerKey, getThreadPartnerIdentifiers, deleteChatThreadFromBunnyDB } from '../lib/socialSync';

interface CopoBusinessDashboardViewProps {
  onNavigate: (section: NavSection) => void;
  hasBusinessPlan?: boolean;
  places?: Place[];
  videos?: VideoReview[];
  currentUser?: UserProfile | null;
  allUsers?: any[];
  messages?: CopoMessage[];
  notifications?: CopoNotification[];
  onOpenPlaceDrawer?: (placeId: string) => void;
  onOpenCreator?: (author: VideoAuthor) => void;
  initialPlace?: Place | null;
  initialMode?: 'signin' | 'claim' | 'demo';
  onClearInitialPlace?: () => void;
  onSaveOwnerResponse?: (videoId: string, text: string) => void;
  onDeleteOwnerResponse?: (videoId: string) => void;
  onAddComment?: (
    videoId: string,
    text: string,
    options?: {
      replyToId?: string;
      postAsOwner?: boolean;
      postAsCreator?: boolean;
      commentItem?: ReviewComment;
    }
  ) => void;
  onToggleCommentLike?: (videoId: string, commentId: string, replyId?: string) => void;
  onToggleCreatorHeart?: (videoId: string, commentId: string, replyId?: string) => void;
  onDeleteComment?: (videoId: string, commentId: string, replyId?: string) => void;
  onClose?: () => void;
  onUpdatePlace?: (place: Place) => void;
  onSendMessage?: (
    threadId: string,
    text: string,
    recipient: { id: string; name: string; avatar: string; email?: string },
    videoUrl?: string,
    customVideoId?: string,
    customMessageId?: string,
    customCreatedAt?: number,
    cardData?: {
      placeId?: string;
      placeName?: string;
      placeAddress?: string;
      placeCategory?: string;
      placeRating?: number;
      placeImage?: string;
    }
  ) => Promise<void>;
  onDeleteThread?: (threadId: string, targetPartnerKey?: string) => void;
  onMarkThreadRead?: (threadId: string) => void;
  onUpdateMessages?: (updated: CopoMessage[]) => void;
  onSelectVideo?: (videoId: string, source?: string) => void;
  onToggleFollow?: (authorHandle: string) => void;
  onToggleFollowPlace?: (placeId: string) => void;
  onMarkNotificationRead?: (id: string) => void;
  onDeleteNotification?: (id: string) => void;
  onUpdateNotifications?: (updated: CopoNotification[]) => void;
  onClearAllNotifications?: () => void;
  onSaveNotificationSettings?: (newSettings: NotificationPreferences) => Promise<void> | void;
  onOpenLegal?: (tab: 'terms' | 'privacy') => void;
  blockedUserIds?: string[];
  onBlockUser?: (userId: string, userName?: string) => void;
  onUnblockUser?: (userId: string) => void;
  onOpenReport?: (reportData: any) => void;
  onRecordReview?: (place: Place) => void;
}

type BusinessTab = 'overview' | 'reviews' | 'inbox' | 'followers' | 'notifications' | 'embed' | 'qr_invites' | 'profile' | 'membership' | 'more';


export const CopoBusinessDashboardView: React.FC<CopoBusinessDashboardViewProps> = ({ 
  onNavigate,
  places = [],
  videos = [],
  currentUser = null,
  allUsers = [],
  messages = [],
  notifications = [],
  onOpenPlaceDrawer,
  onOpenCreator,
  initialPlace = null,
  initialMode = 'signin',
  onClearInitialPlace,
  onSaveOwnerResponse,
  onDeleteOwnerResponse,
  onAddComment,
  onToggleCommentLike,
  onToggleCreatorHeart,
  onDeleteComment,
  onClose = () => onNavigate('home'),
  onUpdatePlace,
  onSendMessage,
  onDeleteThread,
  onMarkThreadRead,
  onUpdateMessages,
  onSelectVideo,
  onToggleFollow,
  onToggleFollowPlace,
  onMarkNotificationRead,
  onDeleteNotification,
  onUpdateNotifications,
  onClearAllNotifications,
  onSaveNotificationSettings,
  onOpenLegal,
  blockedUserIds = [],
  onBlockUser,
  onUnblockUser,
  onOpenReport,
  onRecordReview
}) => {
  const { language, setLanguage, languages, currentLanguageMeta, t, isRTL } = useLanguage();

  // Ensure Business Portal stays strictly in English (international standard)
  useEffect(() => {
    if (language !== 'en') {
      setLanguage('en');
    }
  }, [language, setLanguage]);

  const [showEmbedTester, setShowEmbedTester] = useState(false);
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<BusinessTab>('overview');
  const [isMobileBizMenuOpen, setIsMobileBizMenuOpen] = useState(false);

  // Premium Upgrade State & Marketing Agency Matcher
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [premiumTriggerFeature, setPremiumTriggerFeature] = useState<'embed' | 'direct_messages' | 'download_video' | 'general'>('general');
  const [selectedUpgradeCountry, setSelectedUpgradeCountry] = useState<string>('');
  const [upgradeAgencies, setUpgradeAgencies] = useState<any[]>([]);
  const [isLoadingUpgradeAgencies, setIsLoadingUpgradeAgencies] = useState(false);
  const [selectedUpgradeAgency, setSelectedUpgradeAgency] = useState<any | null>(null);
  const [isSubmittingUpgradeInquiry, setIsSubmittingUpgradeInquiry] = useState(false);
  const [upgradeInquirySuccess, setUpgradeInquirySuccess] = useState(false);

  // Fetch agencies for upgrade modal
  const fetchUpgradeAgencies = useCallback(async (countryName: string) => {
    setIsLoadingUpgradeAgencies(true);
    try {
      const endpoint = countryName 
        ? `/api/agencies?country=${encodeURIComponent(countryName)}` 
        : '/api/agencies';
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setUpgradeAgencies(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn("Failed to fetch upgrade agencies:", e);
    } finally {
      setIsLoadingUpgradeAgencies(false);
    }
  }, []);

  // Automatically scroll main content area back to top when switching tabs
  useEffect(() => {
    setShowEmbedTester(false);
    setIsMobileBizMenuOpen(false);
    const resetScroll = () => {
      if (mainScrollRef.current) {
        mainScrollRef.current.scrollTop = 0;
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (typeof document !== 'undefined') {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        const dashboardEl = document.querySelector('.copo-business-dashboard');
        if (dashboardEl) {
          dashboardEl.scrollTop = 0;
        }
      }
    };

    resetScroll();
    const frameId = requestAnimationFrame(resetScroll);
    const timerId = setTimeout(resetScroll, 50);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timerId);
    };
  }, [activeTab]);

  const [verifiedBusinessSession, setVerifiedBusinessSession] = useState<BusinessSession | null>(() => {
    try {
      const saved = localStorage.getItem('copo_business_verified_session');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed) {
        const dom = (parsed.domain || parsed.businessEmail || '').toLowerCase();
        if (dom.includes('yoouz.com') || parsed.placeName?.toLowerCase() === 'yoouz') {
          parsed.logoUrl = '/favicon.svg';
          parsed.placeName = 'Yoouz';
          localStorage.setItem('copo_business_verified_session', JSON.stringify(parsed));
        } else if (parsed.logoUrl && (parsed.logoUrl.startsWith('<svg') || parsed.logoUrl.startsWith('data:image/svg+xml;utf8,'))) {
          if (parsed.logoUrl.startsWith('<svg')) {
            parsed.logoUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(parsed.logoUrl)}`;
          } else {
            parsed.logoUrl = parsed.logoUrl.replace('data:image/svg+xml;utf8,', 'data:image/svg+xml;charset=utf-8,');
          }
          localStorage.setItem('copo_business_verified_session', JSON.stringify(parsed));
        }
      }
      return parsed;
    } catch (e) {
      return null;
    }
  });

  // Instantly sync URL for existing and new signed-in businesses to show their business domain slug
  useEffect(() => {
    try {
      if (verifiedBusinessSession) {
        const domainSource = verifiedBusinessSession.domain || verifiedBusinessSession.website || verifiedBusinessSession.placeId || verifiedBusinessSession.businessEmail || verifiedBusinessSession.placeName;
        const slug = getPlaceSlug(domainSource);
        if (slug && slug !== 'portal') {
          const expectedPath = buildLocalizedPath(`/business/${slug}`, language);
          if (window.location.pathname !== expectedPath) {
            window.history.replaceState(null, "", expectedPath);
          }
        }
      }
    } catch(e) {}
  }, [verifiedBusinessSession]);

  // Business Selection State
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>(() => {
    if (verifiedBusinessSession && verifiedBusinessSession.placeId && verifiedBusinessSession.placeId !== 'place-custom') {
      return verifiedBusinessSession.placeId;
    }
    if (initialPlace) return initialPlace.id;
    const yoouzPlace = places.find(p => p.id === 'yoouz.com' || (p.name && p.name.toLowerCase() === 'yoouz'));
    if (yoouzPlace) return yoouzPlace.id;
    return places.length > 0 ? places[0].id : 'yoouz.com';
  });

  // Current selected place
  const currentPlace = useMemo(() => {
    // 1. If we have a verified session with place or domain
    if (verifiedBusinessSession) {
      const vDomain = (verifiedBusinessSession.domain || '').replace(/^www\./, '').toLowerCase().trim();
      const vPlaceId = verifiedBusinessSession.placeId;
      
      const found = places.find(p => {
        if (vPlaceId && p.id === vPlaceId) return true;
        const pDomain = (p.brandDomain || (p.website ? p.website.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0] : '') || p.id).replace(/^www\./, '').toLowerCase().trim();
        return vDomain && (pDomain === vDomain || p.id === vDomain || p.id === `place-custom-${vDomain.replace(/[^a-z0-9]/g, '-')}`);
      });

      if (found) {
        // If the session has updated logo or banner not yet in places, overlay it
        const overlayLogo = (verifiedBusinessSession.logoUrl && !verifiedBusinessSession.logoUrl.startsWith('<svg') && !verifiedBusinessSession.logoUrl.includes('favicon.svg')) 
          ? verifiedBusinessSession.logoUrl 
          : found.logoUrl;
        const overlayBanner = verifiedBusinessSession.bannerUrl || found.bannerUrl;
        return {
          ...found,
          logoUrl: overlayLogo,
          avatarUrl: overlayLogo,
          bannerUrl: overlayBanner
        };
      }

      if (verifiedBusinessSession.domain || verifiedBusinessSession.businessEmail) {
        const derived = derivePlaceFromEmailOrDomain(
          verifiedBusinessSession.domain || verifiedBusinessSession.businessEmail,
          places
        );
        
        if (verifiedBusinessSession.placeName && verifiedBusinessSession.placeName !== 'Verified Business') {
          derived.name = verifiedBusinessSession.placeName;
        }
        if (verifiedBusinessSession.logoUrl && !verifiedBusinessSession.logoUrl.startsWith('<svg')) {
          derived.logoUrl = verifiedBusinessSession.logoUrl;
          derived.avatarUrl = verifiedBusinessSession.logoUrl;
        }
        if (verifiedBusinessSession.bannerUrl) {
          derived.bannerUrl = verifiedBusinessSession.bannerUrl;
        }

        const isYoouz = (verifiedBusinessSession.domain || '').includes('yoouz.com') || 
                        (verifiedBusinessSession.businessEmail || '').includes('yoouz.com') || 
                        derived.name === 'Yoouz';
        if (isYoouz) {
          derived.name = 'Yoouz';
          if (!derived.logoUrl || derived.logoUrl.startsWith('<svg')) {
            derived.logoUrl = verifiedBusinessSession.logoUrl || '/favicon.svg';
            derived.avatarUrl = derived.logoUrl;
          }
          if (!derived.bannerUrl) {
            derived.bannerUrl = verifiedBusinessSession.bannerUrl || '/yoouz-brand-banner.svg';
          }
          derived.website = 'https://yoouz.com';
        }
        
        return derived as unknown as Place & { hours?: string; phone?: string; website?: string; description?: string; coverImage?: string; claimedByEmail?: string };
      }
    }

    const found = places.find(p => p.id === selectedPlaceId);
    if (found) return found;
    if (initialPlace && initialPlace.id === selectedPlaceId) return initialPlace;
    const yoouzPlace = places.find(p => p.id === 'yoouz.com' || (p.name && p.name.toLowerCase() === 'yoouz'));
    if (yoouzPlace) return yoouzPlace;
    if (places.length > 0) return places[0];
    return derivePlaceFromEmailOrDomain('yoouz.com', places) as unknown as Place & { hours?: string; phone?: string; website?: string; description?: string; coverImage?: string; claimedByEmail?: string };
  }, [places, selectedPlaceId, initialPlace, verifiedBusinessSession]);

  // Premium tier check
  const isPremium = useMemo(() => {
    if (!currentPlace) return false;
    const planStr = ((currentPlace as any).plan || (currentPlace as any).subscriptionPlan || '').toLowerCase();
    if (planStr === 'free') return false;
    if ((currentPlace as any).isPremium === false && (currentPlace as any).isPremiumPlan === false) return false;
    return Boolean(
      (currentPlace as any).isPremium === true ||
      planStr === 'premium' ||
      (currentPlace as any).isPremiumPlan === true
    );
  }, [currentPlace]);

  // Sync upgrade country selection on modal trigger
  useEffect(() => {
    if (isPremiumModalOpen) {
      const defaultCountry = currentPlace?.country || 'Belgium';
      setSelectedUpgradeCountry(defaultCountry);
      fetchUpgradeAgencies(defaultCountry);
      setUpgradeInquirySuccess(false);
      setSelectedUpgradeAgency(null);
    }
  }, [isPremiumModalOpen, currentPlace, fetchUpgradeAgencies]);

  // Claiming Flow State (for onboarding new business)
  const [isClaiming, setIsClaiming] = useState(initialMode === 'claim');
  const [claimSearchQuery, setClaimSearchQuery] = useState('');


  useEffect(() => {
    setIsClaiming(initialMode === 'claim');
  }, [initialMode]);

  // Listen to business auth changes
  useEffect(() => {
    const handleAuthChange = (e: CustomEvent<BusinessSession>) => {
      if (e.detail) {
        setVerifiedBusinessSession(e.detail);
        if (e.detail.placeId) {
          setSelectedPlaceId(e.detail.placeId);
        }
      }
    };
    window.addEventListener('copo_business_auth_changed' as any, handleAuthChange as any);
    return () => {
      window.removeEventListener('copo_business_auth_changed' as any, handleAuthChange as any);
    };
  }, []);

  // Time Range Filter for Analytics
  const [analyticsDateRange, setAnalyticsDateRange] = useState<'7d' | '30d' | '90d' | 'ytd'>('30d');
  const [selectedChartMetric, setSelectedChartMetric] = useState<'views' | 'reviews' | 'rating'>('views');
  const [hoveredChartPoint, setHoveredChartPoint] = useState<number | null>(null);
  const chartSectionRef = useRef<HTMLDivElement | null>(null);
  const mainScrollRef = useRef<HTMLElement | null>(null);

  const handleSelectMetric = (metric: 'views' | 'reviews' | 'rating') => {
    setSelectedChartMetric(metric);
    // On mobile devices, smoothly align chart into full view so user doesn't have to manually scroll
    if (chartSectionRef.current) {
      chartSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // CTA Setup state
  const [ctaType, setCtaType] = useState(() => localStorage.getItem('demo_cta_type') || 'book_service');
  const [ctaUrl, setCtaUrl] = useState(() => localStorage.getItem('demo_cta_url') || ((currentPlace as any).website || `https://${(currentPlace.name || 'ups.com').toLowerCase().replace(/[^a-z0-9]/g, '')}.com/action`));
  const [ctaLabelCustom, setCtaLabelCustom] = useState(() => localStorage.getItem('demo_cta_label') || 'Book Service / Appointment');
  const [ctaAccentColor, setCtaAccentColor] = useState(() => localStorage.getItem('demo_cta_color') || '#ffffff');
  const [ctaCategoryFilter, setCtaCategoryFilter] = useState<'all' | 'services' | 'hotel' | 'professional' | 'health' | 'retail' | 'dining' | 'auto' | 'legal'>('all');
  const [ctaPreviewMode, setCtaPreviewMode] = useState<'feed' | 'profile'>('feed');
  const [isCtaSaved, setIsCtaSaved] = useState(false);
  const [ctaTestClicked, setCtaTestClicked] = useState(false);

  // Profile Setup state
  const [profileName, setProfileName] = useState(currentPlace.name || 'Verified Business');

  // Sync verified session with database if it goes stale
  useEffect(() => {
    if (verifiedBusinessSession && currentPlace && currentPlace.logoUrl) {
      if (currentPlace.logoUrl !== verifiedBusinessSession.logoUrl) {
        // If it's a dynamic place and the DB hasn't been saved yet, we shouldn't overwrite unless the user explicitly hit save.
        // But if the DB *has* the custom logo, we want to update the local session so it doesn't flash stale on reload.
        // We can safely do this since verifiedBusinessSession is mostly just for caching the UI state.
        const updatedSession = { ...verifiedBusinessSession, logoUrl: currentPlace.logoUrl };
        setVerifiedBusinessSession(updatedSession);
        try {
          localStorage.setItem('copo_business_verified_session', JSON.stringify(updatedSession));
        } catch(e) {}
      }
    }
  }, [currentPlace, verifiedBusinessSession]);
  const [profileAddress, setProfileAddress] = useState(currentPlace.address || '');
  const [profilePhone, setProfilePhone] = useState((currentPlace as any).phone || '');
  const [profileWebsite, setProfileWebsite] = useState((currentPlace as any).website || '');
  const [profileEmail, setProfileEmail] = useState((currentPlace as any).email || (verifiedBusinessSession as any)?.email || '');

  const displayCleanWebsite = useMemo(() => {
    const raw = currentPlace?.website || (currentPlace as any)?.domain || 'yoouz.com';
    return raw.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/.*$/, '').trim() || 'yoouz.com';
  }, [currentPlace]);

  const displayOwnerEmail = useMemo(() => {
    const signedUpEmail = verifiedBusinessSession?.businessEmail || verifiedBusinessSession?.email || (currentPlace as any)?.claimedByEmail || (currentPlace as any)?.ownerEmail || (currentPlace as any)?.claimedBy;
    if (signedUpEmail && typeof signedUpEmail === 'string' && signedUpEmail.includes('@')) {
      return signedUpEmail.trim();
    }
    if (profileEmail && typeof profileEmail === 'string' && profileEmail.includes('@')) {
      return profileEmail.trim();
    }
    return '';
  }, [currentPlace, verifiedBusinessSession, profileEmail]);

  const displayOwnerName = useMemo(() => {
    if ((verifiedBusinessSession as any)?.ownerName) {
      return (verifiedBusinessSession as any).ownerName;
    }
    if ((currentPlace as any)?.ownerName) {
      return (currentPlace as any).ownerName;
    }
    if (currentPlace?.name && currentPlace.name !== 'Verified Business' && currentPlace.name !== 'Business Venue') {
      return `${currentPlace.name} Executive`;
    }
    return 'Business Manager';
  }, [currentPlace, verifiedBusinessSession]);
  const [profileHours, setProfileHours] = useState((currentPlace as any).hours || currentPlace.openingHours || '');
  const [profileDesc, setProfileDesc] = useState((currentPlace as any).description || '');
  const [profileLogoUrl, setProfileLogoUrl] = useState(currentPlace.logoUrl || (currentPlace.id?.toLowerCase().includes('yoouz') || currentPlace.name?.toLowerCase().includes('yoouz') ? '/favicon.svg' : ''));
  const [profileBannerUrl, setProfileBannerUrl] = useState((currentPlace as any).bannerUrl || currentPlace.bannerUrl || currentPlace.photos?.[0] || '');
  const [bannerPreviewFailed, setBannerPreviewFailed] = useState(false);
  const [isProfileSaved, setIsProfileSaved] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const [logoError, setLogoError] = useState("");
  const [bannerError, setBannerError] = useState("");

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLogoError("Please select a valid image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setLogoError("Image file must be under 8MB.");
      return;
    }
    setLogoError("");
    setIsUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          try {
            const compressed = canvas.toDataURL("image/jpeg", 0.88);
            // Upload directly to Bunny CDN Storage
            const targetId = selectedPlaceId || currentPlace.id || 'yoouz.com';
            const uploadRes = await fetch("/api/business/upload-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageBase64: compressed,
                imageType: "logo",
                placeId: targetId,
                previousUrl: profileLogoUrl || undefined
              })
            });
            if (uploadRes.ok) {
              const data = await uploadRes.json();
              if (data.imageUrl) {
                setProfileLogoUrl(data.imageUrl);
              } else {
                setProfileLogoUrl(compressed);
              }
            } else {
              setProfileLogoUrl(compressed);
            }
          } catch (err) {
            setLogoError("Failed to upload image.");
          } finally {
            setIsUploadingLogo(false);
          }
        } else {
          setIsUploadingLogo(false);
        }
      };
      img.onerror = () => setIsUploadingLogo(false);
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setBannerError("Please select a valid image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setBannerError("Image file must be under 8MB.");
      return;
    }
    setBannerError("");
    setIsUploadingBanner(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          try {
            const compressed = canvas.toDataURL("image/jpeg", 0.88);
            // Upload directly to Bunny CDN Storage
            const targetId = selectedPlaceId || currentPlace.id || 'yoouz.com';
            const uploadRes = await fetch("/api/business/upload-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageBase64: compressed,
                imageType: "banner",
                placeId: targetId,
                previousUrl: profileBannerUrl
              })
            });
            if (uploadRes.ok) {
              const data = await uploadRes.json();
              if (data.imageUrl) {
                setProfileBannerUrl(data.imageUrl);
                setBannerPreviewFailed(false);
              } else {
                setProfileBannerUrl(compressed);
                setBannerPreviewFailed(false);
              }
            } else {
              setProfileBannerUrl(compressed);
              setBannerPreviewFailed(false);
            }
          } catch (err) {
            setBannerError("Failed to upload image.");
          } finally {
            setIsUploadingBanner(false);
          }
        } else {
          setIsUploadingBanner(false);
        }
      };
      img.onerror = () => setIsUploadingBanner(false);
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Structured Physical Address State (No mock data)
  const [streetAddress, setStreetAddress] = useState(currentPlace.address ? currentPlace.address.split(',')[0] || '' : '');
  const [city, setCity] = useState(currentPlace.city || '');
  const [stateRegion, setStateRegion] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(currentPlace.country || '');

  // Structured Phone & Dialing Code State (No mock data)
  const initialPhoneStr = ((currentPlace as any).phone || '').trim();
  const initialDialCode = initialPhoneStr.startsWith('+') ? initialPhoneStr.split(' ')[0] : '';
  const initialLocalPhone = initialPhoneStr.startsWith('+') ? (initialPhoneStr.split(' ').slice(1).join(' ') || '') : initialPhoneStr;

  const [phoneDialCode, setPhoneDialCode] = useState(initialDialCode);
  const [localPhone, setLocalPhone] = useState(initialLocalPhone);

  // Business Category & Amenities State
  const [businessCategory, setBusinessCategory] = useState(currentPlace.category || '');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Structured Operating Hours Schedule State
  const [weeklySchedule, setWeeklySchedule] = useState<{ day: string; status: 'open' | '24h' | 'closed'; openTime: string; closeTime: string }[]>([
    { day: 'Monday', status: 'closed', openTime: '09:00 AM', closeTime: '06:00 PM' },
    { day: 'Tuesday', status: 'closed', openTime: '09:00 AM', closeTime: '06:00 PM' },
    { day: 'Wednesday', status: 'closed', openTime: '09:00 AM', closeTime: '06:00 PM' },
    { day: 'Thursday', status: 'closed', openTime: '09:00 AM', closeTime: '06:00 PM' },
    { day: 'Friday', status: 'closed', openTime: '09:00 AM', closeTime: '06:00 PM' },
    { day: 'Saturday', status: 'closed', openTime: '10:00 AM', closeTime: '04:00 PM' },
    { day: 'Sunday', status: 'closed', openTime: '10:00 AM', closeTime: '04:00 PM' },
  ]);

  // Sync profile fields whenever currentPlace or selectedPlaceId changes
  useEffect(() => {
    if (!currentPlace) return;

    setProfileName(currentPlace.name || 'Verified Business');
    setProfileWebsite((currentPlace as any).website || '');
    setProfileEmail((currentPlace as any).email || (verifiedBusinessSession as any)?.email || '');
    setProfileHours((currentPlace as any).hours || currentPlace.openingHours || '');
    setProfileDesc((currentPlace as any).description || '');
    if (currentPlace.category) {
      setBusinessCategory(currentPlace.category);
    }

    if (currentPlace.logoUrl && !currentPlace.logoUrl.startsWith('<svg')) {
      setProfileLogoUrl(currentPlace.logoUrl);
    }
    const resolvedBanner = (currentPlace as any).bannerUrl || currentPlace.bannerUrl || currentPlace.photos?.[0];
    if (resolvedBanner && !resolvedBanner.includes('yoouz.com/og-banner.png') && !resolvedBanner.includes('1789810172562')) {
      setProfileBannerUrl(resolvedBanner);
      setBannerPreviewFailed(false);
    } else if (currentPlace.id?.toLowerCase().includes('yoouz') || currentPlace.name?.toLowerCase().includes('yoouz')) {
      setProfileBannerUrl("https://rev1.b-cdn.net/banners/yoouz_brand_banner.jpg");
      setBannerPreviewFailed(false);
    }

    if (currentPlace.address) {
      const parts = currentPlace.address.split(',').map(s => s.trim());
      if (parts.length >= 3) {
        setStreetAddress(parts[0] || '');
        setCity(parts[1] || '');
        const stateZip = (parts[2] || '').split(' ');
        if (stateZip.length >= 1) setStateRegion(stateZip[0] || '');
        if (stateZip.length >= 2) setZipCode(stateZip.slice(1).join(' ') || '');
        if (parts.length >= 4) setSelectedCountry(parts[3] || '');
      } else {
        setStreetAddress(currentPlace.address);
      }
    }

    if (currentPlace.city) setCity(currentPlace.city);
    if (currentPlace.country) setSelectedCountry(currentPlace.country);

    if ((currentPlace as any).phone) {
      const rawPhone = ((currentPlace as any).phone as string).trim();
      setProfilePhone(rawPhone);
      if (rawPhone.startsWith('+')) {
        const spaceIdx = rawPhone.indexOf(' ');
        if (spaceIdx > 0) {
          setPhoneDialCode(rawPhone.substring(0, spaceIdx));
          setLocalPhone(rawPhone.substring(spaceIdx + 1).trim());
        } else {
          setPhoneDialCode(rawPhone);
          setLocalPhone('');
        }
      } else {
        setLocalPhone(rawPhone);
      }
    }
  }, [selectedPlaceId, currentPlace]);

  // Sync profileAddress string from structured address fields on initial load
  useEffect(() => {
    const parts = [streetAddress, city, stateRegion, zipCode, selectedCountry].filter(Boolean);
    const formatted = parts.join(', ');
    if (formatted) setProfileAddress(formatted);
  }, [streetAddress, city, stateRegion, zipCode, selectedCountry]);

  // Handle Country Selection with Automatic State/Province & Dial Code Recognition
  const handleCountryChange = (newCountry: string) => {
    setSelectedCountry(newCountry);

    if (newCountry) {
      // Auto-update dialing code for the selected country
      const dialInfo = getCountryDialInfo(newCountry);
      if (dialInfo?.dialCode) {
        setPhoneDialCode(dialInfo.dialCode);
      }

      const countryObjMatch = Country.getAllCountries().find(countryObj => countryObj.name === newCountry);
      if (countryObjMatch) {
        const statesObj = State.getStatesOfCountry(countryObjMatch.isoCode);
        if (statesObj.length > 0) {
          setStateRegion(statesObj[0].name);
          const citiesObj = City.getCitiesOfState(countryObjMatch.isoCode, statesObj[0].isoCode);
          setCity(citiesObj[0]?.name || '');
        } else {
          setStateRegion('');
          const citiesObj = City.getCitiesOfCountry(countryObjMatch.isoCode);
          setCity(citiesObj[0]?.name || '');
        }
      } else {
        setStateRegion('');
        setCity('');
      }
    } else {
      setStateRegion('');
      setCity('');
    }
  };

  // Derived country dial and postal formatting info
  const activeCountryDialInfo = useMemo(() => {
    // 1. Prioritize explicitly selected phone dial code
    if (phoneDialCode) {
      if (selectedCountry) {
        const matchWithCountry = countryDialData.find(
          c => c.dialCode === phoneDialCode && c.name.toLowerCase() === selectedCountry.toLowerCase()
        );
        if (matchWithCountry) return matchWithCountry;
      }
      const matchByDial = countryDialData.find(c => c.dialCode === phoneDialCode);
      if (matchByDial) return matchByDial;
    }
    // 2. Fallback to selected country
    if (selectedCountry) {
      const match = countryDialData.find(c => c.name.toLowerCase() === selectedCountry.toLowerCase());
      if (match) return match;
    }
    return countryDialData[0];
  }, [selectedCountry, phoneDialCode]);

  // Dynamic location options derived from country-state-city
  const activeCountryObj = Country.getAllCountries().find(c => c.name === selectedCountry);
  const isoCode = activeCountryObj?.isoCode || "";
  
  const statesObj = State.getStatesOfCountry(isoCode);
  const hasStates = statesObj.length > 0;
  const stateLabel = "Country / Region";
  const stateOptions = statesObj.map(s => s.name);
  
  let cityOptions: string[] = [];
  if (stateRegion) {
    const selectedState = statesObj.find(s => s.name === stateRegion);
    if (selectedState) {
       const stateCities = City.getCitiesOfState(isoCode, selectedState.isoCode).map(c => c.name);
                       cityOptions = stateCities.length > 0 ? stateCities : (City.getCitiesOfCountry(isoCode)?.map(c => c.name) || []);
    } else {
       cityOptions = City.getCitiesOfCountry(isoCode)?.map(c => c.name) || [];
    }
  } else {
    cityOptions = City.getCitiesOfCountry(isoCode)?.map(c => c.name) || [];
  }
  
  cityOptions = Array.from(new Set(cityOptions));

  // Sync profilePhone string from dial code and local phone
  useEffect(() => {
    if (localPhone && localPhone.trim().replace(/\D/g, '').length >= 3) {
      const cleanDial = (phoneDialCode || '').trim();
      const cleanLocal = localPhone.trim();
      setProfilePhone(cleanDial ? `${cleanDial} ${cleanLocal}` : cleanLocal);
    } else if (!localPhone || localPhone.trim() === '') {
      setProfilePhone('');
    }
  }, [phoneDialCode, localPhone]);


  // Reviews Moderation & Reply State
  const [reviewsFilter, setReviewsFilter] = useState<'all' | '5' | '4' | '3'>('all');
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [ownerReplies, setOwnerReplies] = useState<Record<string, string>>({});
  const [expandedCommentsMap, setExpandedCommentsMap] = useState<Record<string, boolean>>({});
  const [activeVideoModal, setActiveVideoModal] = useState<VideoReview | null>(null);
  const [bizVideoIndex, setBizVideoIndex] = useState<number>(0);
  const [bizVideoSubTab, setBizVideoSubTab] = useState<FeedSubTab>('discover');
  const [activeCommentVideo, setActiveCommentVideo] = useState<VideoReview | null>(null);
  const [activeReplyModalVideo, setActiveReplyModalVideo] = useState<VideoReview | null>(null);

  // Keep activeCommentVideo synchronized with videos array so live comments and owner responses immediately reflect in the open drawer
  useEffect(() => {
    if (activeCommentVideo && videos) {
      const current = videos.find((v) => v.id === activeCommentVideo.id);
      if (current && (current.comments !== activeCommentVideo.comments || current.ownerResponse !== activeCommentVideo.ownerResponse || current.commentsCount !== activeCommentVideo.commentsCount)) {
        setActiveCommentVideo(current);
      }
    }
  }, [videos, activeCommentVideo]);

  // Filter videos strictly for this verified place
  const placeVideos = useMemo(() => {
    const pName = (currentPlace.name || '').toLowerCase().trim();
    const pId = (selectedPlaceId || '').toLowerCase().trim();
    const pDom = ((currentPlace as any).domain || '').toLowerCase().trim();
    const sessDom = ((verifiedBusinessSession as any)?.domain || (verifiedBusinessSession as any)?.businessEmail || '').toLowerCase().trim();
    const sessPlaceId = ((verifiedBusinessSession as any)?.placeId || '').toLowerCase().trim();
    const sessPlaceName = ((verifiedBusinessSession as any)?.placeName || '').toLowerCase().trim();

    return videos.filter(v => {
      const vAny = v as any;
      const vPlaceId = (v.placeId || vAny.place?.id || '').toLowerCase().trim();
      const vPlaceName = (v.placeName || vAny.place?.name || '').toLowerCase().trim();
      const vPlaceDom = (vAny.placeDomain || vAny.place?.domain || '').toLowerCase().trim();
      const vCaption = (v.caption || '').toLowerCase().trim();

      // Direct ID or Place ID match
      if (pId && (vPlaceId === pId || vPlaceId.includes(pId) || pId.includes(vPlaceId))) return true;
      if (currentPlace.id && (vPlaceId === currentPlace.id.toLowerCase() || vPlaceId.includes(currentPlace.id.toLowerCase()))) return true;

      // Name match
      if (pName && vPlaceName && (vPlaceName === pName || vPlaceName.includes(pName) || pName.includes(vPlaceName))) return true;

      // Domain match
      if (pDom && (vPlaceId.includes(pDom) || vPlaceDom.includes(pDom) || vPlaceName.includes(pDom) || vCaption.includes(pDom))) return true;

      // Session match for claimed business
      if (sessDom) {
        const domClean = sessDom.replace(/^.*@/, '').replace(/^(https?:\/\/)?(www\.)?/, '');
        if (domClean && (vPlaceId.includes(domClean) || vPlaceName.includes(domClean) || vCaption.includes(domClean) || vPlaceDom.includes(domClean))) return true;
      }
      if (sessPlaceId && (vPlaceId === sessPlaceId || vPlaceId.includes(sessPlaceId))) return true;
      if (sessPlaceName && vPlaceName && (vPlaceName === sessPlaceName || vPlaceName.includes(sessPlaceName))) return true;

      // Yoouz special fallback match if current business is Yoouz
      if (pName === 'yoouz' || pId.includes('yoouz') || sessDom.includes('yoouz')) {
        if (vPlaceId.includes('yoouz') || vPlaceName.includes('yoouz') || vCaption.includes('rev17895770756273488d') || vPlaceId.includes('rev17895770756273488d')) {
          return true;
        }
      }

      return false;
    });
  }, [videos, selectedPlaceId, currentPlace, verifiedBusinessSession]);

  const handleOpenBusinessVideo = useCallback((video: VideoReview) => {
    const idx = placeVideos.findIndex((v) => v.id === video.id);
    setBizVideoIndex(idx >= 0 ? idx : 0);
    setActiveVideoModal(video);
    setSeenReviewIds((prev) => {
      const next = new Set(prev);
      next.add(video.id);
      return next;
    });
  }, [placeVideos]);

  // QR Standee Studio State
  const [qrCustomHeading, setQrCustomHeading] = useState('LEAVE A 60-SECOND VIDEO REVIEW');
  const [qrTableLabel, setQrTableLabel] = useState('');
  const [qrLinkCopied, setQrLinkCopied] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showCustomizeAccordion, setShowCustomizeAccordion] = useState(false);

  const qrDirectReviewUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://www.yoouz.com';
    const slug = getPlaceSlug(currentPlace);
    return `${origin}/reviews/${slug}`;
  }, [currentPlace]);

  // Embed Customizer & Curation State
  const [embedFormat, setEmbedFormat] = useState<'script' | 'iframe' | 'react'>('script');
  const [embedTheme, setEmbedTheme] = useState<'dark_glass' | 'midnight_oled' | 'clean_light' | 'minimal'>('dark_glass');
  const [embedLayout, setEmbedLayout] = useState<'grid' | 'carousel' | 'badge'>('grid');
  const [embedAccentColor, setEmbedAccentColor] = useState<string>('#10B981');
  const [hiddenVideoIds, setHiddenVideoIds] = useState<string[]>([]);
  const [downloadingVideoId, setDownloadingVideoId] = useState<string | null>(null);
  const [adExportVideo, setAdExportVideo] = useState<VideoReview | null>(null);
  const [widgetNotice, setWidgetNotice] = useState<string | null>(null);
  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const [isDirectLinkCopied, setIsDirectLinkCopied] = useState(false);
  const [isDirectReviewLinkCopied, setIsDirectReviewLinkCopied] = useState(false);
  const [showAdvanceEmbedCode, setShowAdvanceEmbedCode] = useState(false);
  const [embedDeviceMode, setEmbedDeviceMode] = useState<'desktop' | 'mobile'>('desktop');

  // Embed Preview Interactive Player State (Single Video Carousel matching CopoEmbedView)
  const [embedPreviewIndex, setEmbedPreviewIndex] = useState<number>(0);
  const [embedPreviewPlayingId, setEmbedPreviewPlayingId] = useState<string | null>(null);
  const [embedPreviewMuted, setEmbedPreviewMuted] = useState<boolean>(true);
  const [embedPreviewPaused, setEmbedPreviewPaused] = useState<boolean>(false);
  const embedPreviewVideoRef = useRef<HTMLVideoElement | null>(null);

  // Synchronize embed preview video playback on play/pause/video change
  useEffect(() => {
    const el = embedPreviewVideoRef.current;
    if (!el) return;
    if (embedPreviewPaused || !embedPreviewPlayingId) {
      el.pause();
    } else {
      el.play().catch(() => {});
    }
  }, [embedPreviewPaused, embedPreviewPlayingId]);

  // Handle messages from embedded widget preview (e.g. clicking logo inside preview)
  useEffect(() => {
    const handleWidgetMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object' || e.data.type !== 'YOOUZ_OPEN_PLACE') return;
      setWidgetNotice(`✨ Verified widget connected to ${currentPlace?.name || 'your venue'}.`);
      setTimeout(() => setWidgetNotice(null), 3500);
    };
    window.addEventListener('message', handleWidgetMessage);
    return () => window.removeEventListener('message', handleWidgetMessage);
  }, [currentPlace]);

  const handleToggleEmbedPreviewPlay = useCallback((video: VideoReview) => {
    if (!video) return;
    if (embedPreviewPlayingId === video.id) {
      if (embedPreviewPaused) {
        setEmbedPreviewPaused(false);
        if (embedPreviewVideoRef.current) {
          embedPreviewVideoRef.current.play().catch(() => {});
        }
      } else {
        setEmbedPreviewPaused(true);
        if (embedPreviewVideoRef.current) {
          embedPreviewVideoRef.current.pause();
        }
      }
    } else {
      setEmbedPreviewPlayingId(video.id);
      setEmbedPreviewPaused(false);
      if (embedPreviewVideoRef.current) {
        embedPreviewVideoRef.current.play().catch(() => {});
      }
    }
  }, [embedPreviewPlayingId, embedPreviewPaused]);

  // Top header dropdowns & Command Palette
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);

  const accountDropdownRef = useRef<HTMLDivElement | null>(null);

  // Automatically close account dropdown when switching tabs or claiming
  useEffect(() => {
    setShowAccountDropdown(false);
  }, [activeTab, isClaiming, selectedPlaceId]);

  // Click outside / pointerdown handler to close account dropdown when clicking anywhere else
  useEffect(() => {
    if (!showAccountDropdown) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(event.target as Node)
      ) {
        setShowAccountDropdown(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [showAccountDropdown]);

  // Business Notification Preferences (Persisted across local storage, component state, and bunnydb)
  const [businessNotificationSettings, setBusinessNotificationSettings] = useState<NotificationPreferences>(() => {
    if (currentUser?.notificationSettings) {
      return currentUser.notificationSettings;
    }
    try {
      const saved = localStorage.getItem("copo_business_notification_settings") || localStorage.getItem("copo_notification_settings");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_NOTIFICATION_PREFERENCES;
  });

  useEffect(() => {
    if (currentUser?.notificationSettings) {
      setBusinessNotificationSettings(currentUser.notificationSettings);
    }
  }, [currentUser?.notificationSettings]);

  const handleSaveBusinessNotificationSettings = async (newSettings: NotificationPreferences) => {
    setBusinessNotificationSettings(newSettings);
    try {
      localStorage.setItem("copo_business_notification_settings", JSON.stringify(newSettings));
      localStorage.setItem("copo_notification_settings", JSON.stringify(newSettings));
    } catch (e) {}
    if (onSaveNotificationSettings) {
      await onSaveNotificationSettings(newSettings);
    }
  };

  // Buffer rendering until the logo and banner are ready
  const criticalImagesLoaded = useCriticalImagesLoaded([currentPlace?.logoUrl, currentPlace?.bannerUrl], 1500);
  const [commandQuery, setCommandQuery] = useState('');
  const [reviewsSearchQuery, setReviewsSearchQuery] = useState('');
  const [followerSearchQuery, setFollowerSearchQuery] = useState('');
  const [hoveredUnfollow, setHoveredUnfollow] = useState<string | null>(null);
  const [targetThreadId, setTargetThreadId] = useState<string>('');
  const [seenFollowerIds, setSeenFollowerIds] = useState<Set<string>>(() => {
    try {
      const placeKey = currentPlace?.id || 'biz';
      const stored = localStorage.getItem(`copo_seen_followers_${placeKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch (e) {}
    return new Set();
  });

  const [seenReviewIds, setSeenReviewIds] = useState<Set<string>>(() => {
    try {
      const placeKey = currentPlace?.id || 'biz';
      const stored = localStorage.getItem(`copo_seen_reviews_${placeKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch (e) {}
    return new Set();
  });

  // Re-sync seen sets whenever active venue changes
  useEffect(() => {
    try {
      const placeKey = currentPlace?.id || 'biz';
      const storedRev = localStorage.getItem(`copo_seen_reviews_${placeKey}`);
      if (storedRev) {
        const parsed = JSON.parse(storedRev);
        if (Array.isArray(parsed)) setSeenReviewIds(new Set(parsed));
      } else {
        setSeenReviewIds(new Set());
      }
    } catch (e) {}
  }, [currentPlace?.id]);

  // Effective Business User Profile for Messaging & Collaboration (Strictly separated from private user account)
  const effectiveUser: UserProfile = useMemo(() => {
    const base = verifiedBusinessSession ? {
      id: verifiedBusinessSession.placeId,
      uid: verifiedBusinessSession.placeId,
      userId: verifiedBusinessSession.placeId,
      placeId: verifiedBusinessSession.placeId,
      name: verifiedBusinessSession.placeName || currentPlace?.name || 'Business Manager',
      email: verifiedBusinessSession.businessEmail || (currentPlace as any)?.claimedByEmail || `biz_${verifiedBusinessSession.placeId}@business.yoouz.com`,
      avatar: currentPlace?.logoUrl || currentPlace?.avatarUrl || verifiedBusinessSession.logoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      handle: (verifiedBusinessSession.domain || currentPlace?.name || 'business').toLowerCase().replace(/[^a-z0-9]/g, ''),
      isVerified: true,
      isBusiness: true
    } : {
      id: currentPlace?.id || 'unknown',
      uid: currentPlace?.id || 'unknown',
      userId: currentPlace?.id || 'unknown',
      placeId: currentPlace?.id || 'unknown',
      name: currentPlace?.name || 'Business Portal',
      email: (currentPlace as any)?.claimedByEmail || 'business@yoouz.com',
      avatar: currentPlace?.logoUrl || currentPlace?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      handle: (currentPlace?.name || 'business').toLowerCase().replace(/[^a-z0-9]/g, ''),
      isVerified: true,
      isBusiness: true
    };

    return {
      ...base,
      notificationSettings: businessNotificationSettings
    };
  }, [verifiedBusinessSession, currentPlace, businessNotificationSettings]);

  // Keyboard shortcut listener for ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const placeKey = currentPlace?.id || 'biz';
  const [businessActiveTabSegment, setBusinessActiveTabSegment] = useState<"following" | "followers">("following");
  const [businessFollowingSubTab, setBusinessFollowingSubTab] = useState<"all" | "businesses" | "reviewers">("all");
  const [hoveredUnfollowPlace, setHoveredUnfollowPlace] = useState<string | null>(null);

  const [businessFollowedAuthors, setBusinessFollowedAuthors] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(`copo_business_followed_authors_${placeKey}`);
      if (stored) return JSON.parse(stored);
    } catch {}
    return (currentPlace as any)?.followedAuthors || currentUser?.followedAuthors || [];
  });

  const [businessFollowedPlaces, setBusinessFollowedPlaces] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(`copo_business_followed_places_${placeKey}`);
      if (stored) return JSON.parse(stored);
    } catch {}
    return (currentPlace as any)?.followedPlaces || currentUser?.followedPlaces || [];
  });

  // Business Followed Authors List
  const businessFollowedAuthorsList = useMemo(() => {
    const list: VideoAuthor[] = [];
    const seen = new Set<string>();
    businessFollowedAuthors.forEach((nameItem) => {
      const clean = (nameItem || "").trim();
      if (!clean) return;
      const key = clean.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);

      const matchingVid = videos.find(v => v.author?.name?.toLowerCase() === key);
      const matchingUser = allUsers.find(u => u.name?.toLowerCase() === key);
      const userReviews = videos.filter(v => v.author?.name?.toLowerCase() === key);

      list.push({
        name: matchingUser?.name || matchingVid?.author?.name || clean,
        avatar: getSafeAvatarUrl(matchingUser?.avatar || matchingVid?.author?.avatar, matchingUser?.name || matchingVid?.author?.name || clean, matchingUser?.handle || matchingVid?.author?.handle || clean),
        bio: matchingUser?.bio || "Community reviewer",
        location: matchingUser?.location || matchingVid?.placeCity || "Local Contributor",
        isFollowed: true,
        videoReviewCount: userReviews.length || (matchingUser as any)?.videoCount || 0
      });
    });
    return list;
  }, [businessFollowedAuthors, videos, allUsers]);

  // Business Followed Places List
  const businessFollowedPlacesList = useMemo(() => {
    const list: Place[] = [];
    const seen = new Set<string>();
    businessFollowedPlaces.forEach((pId) => {
      const clean = String(pId || "").toLowerCase().trim();
      if (!clean || seen.has(clean)) return;
      seen.add(clean);

      const foundPlace = places.find(p => (p.id ? p.id.toLowerCase() === clean : false) || (p.name ? p.name.toLowerCase() === clean : false));
      if (foundPlace) {
        list.push({ ...foundPlace, isFollowed: true });
      } else {
        list.push({
          id: pId,
          name: pId,
          category: "Business",
          categoryType: "all",
          address: "Verified Business",
          city: "Miami, FL",
          lat: 25.7617,
          lng: -80.1918,
          rating: 5.0,
          totalReviews: 1,
          ratingDistribution: { stars5: 1, stars4: 0, stars3: 0, stars2: 0, stars1: 0 },
          avatarUrl: "",
          bannerUrl: "",
          photos: [],
          openingHours: "Open now",
          isOpen: true,
          phone: "",
          website: "",
          priceRange: "$$",
          plusCode: "",
          description: "Verified business on Yoouz.",
          popularKeywords: [],
          amenities: [],
          topDishes: [],
          isFollowed: true
        });
      }
    });
    return list;
  }, [businessFollowedPlaces, places]);

  const totalBusinessFollowingCount = businessFollowedAuthorsList.length;

  const filteredBusinessFollowingAuthors = useMemo(() => {
    const q = followerSearchQuery.toLowerCase().trim();
    const map = new Map<string, any>();

    // 1. Followed authors
    businessFollowedAuthorsList.forEach((author) => {
      const key = author.name.toLowerCase();
      map.set(key, { ...author, isFollowed: true });
    });

    // 2. If search query exists, add matching platform reviewers/users
    if (q) {
      (allUsers || []).forEach((u: any) => {
        const name = (u.name || "").trim();
        const handle = (u.handle || name || "").toLowerCase().replace(/^@/, '');
        if (!name || name === "Registered User" || name === "Reviewer" || (u.email || "").toLowerCase() === "admin@yoouz.com") return;
        if (name.toLowerCase().includes(q) || handle.includes(q)) {
          const key = name.toLowerCase();
          if (!map.has(key)) {
            const isFollowed = businessFollowedAuthors.some(
              (a) => a.toLowerCase().trim() === key || a.toLowerCase().replace(/^@/, '') === handle
            );
            map.set(key, {
              name,
              avatar: getSafeAvatarUrl(u.avatar, name, handle),
              bio: u.bio || "Community reviewer",
              location: u.location || 'Local Contributor',
              isFollowed,
              videoReviewCount: u.videoCount || 0
            });
          }
        }
      });

      (videos || []).forEach((v) => {
        if (v.author && v.author.name) {
          const name = v.author.name.trim();
          const handle = name.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (name.toLowerCase().includes(q)) {
            const key = name.toLowerCase();
            if (!map.has(key)) {
              const isFollowed = businessFollowedAuthors.some(
                (a) => a.toLowerCase().trim() === key || a.toLowerCase().replace(/^@/, '') === handle
              );
              map.set(key, {
                name,
                avatar: getSafeAvatarUrl(v.author.avatar, name, handle),
                bio: "Community reviewer",
                location: v.placeCity || 'Local Contributor',
                isFollowed,
                videoReviewCount: 1
              });
            }
          }
        }
      });
    }

    return Array.from(map.values());
  }, [businessFollowedAuthorsList, followerSearchQuery, allUsers, videos, businessFollowedAuthors]);

  const handleToggleBusinessFollowAuthor = (authorName: string) => {
    const key = authorName.toLowerCase().trim();
    const exists = businessFollowedAuthors.some(a => a.toLowerCase().trim() === key);
    const updated = exists
      ? businessFollowedAuthors.filter(a => a.toLowerCase().trim() !== key)
      : [...businessFollowedAuthors, authorName];
    setBusinessFollowedAuthors(updated);
    try {
      localStorage.setItem(`copo_business_followed_authors_${placeKey}`, JSON.stringify(updated));
    } catch {}
    if (onToggleFollow) onToggleFollow(authorName);
  };

  const handleToggleBusinessFollowPlace = (placeId: string) => {
    const key = placeId.toLowerCase().trim();
    const exists = businessFollowedPlaces.some(p => p.toLowerCase().trim() === key);
    const updated = exists
      ? businessFollowedPlaces.filter(p => p.toLowerCase().trim() !== key)
      : [...businessFollowedPlaces, placeId];
    setBusinessFollowedPlaces(updated);
    try {
      localStorage.setItem(`copo_business_followed_places_${placeKey}`, JSON.stringify(updated));
    } catch {}
    if (onToggleFollowPlace) onToggleFollowPlace(placeId);
  };

  // STRICT POLICY 32: Real Business Followers List strictly derived from authentic user follows.
  // Reviews, bookmarks, chats, and guest visits NEVER synthesize fake follower relationships.
  const businessFollowers = useMemo(() => {
    if (!currentPlace) return [];
    const placeId = String(currentPlace.id || '').trim();
    const placeNameLower = (currentPlace.name || '').toLowerCase().trim();
    const placeSlugLower = ((currentPlace as any).slug || currentPlace.name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    const placeCanonId = placeId.toLowerCase().replace(/^place-custom-/, '').replace(/^www\./, '');

    const targetPlaceKeys = new Set<string>([
      placeId.toLowerCase(),
      placeSlugLower,
      placeCanonId
    ].filter(Boolean));

    const map = new Map<string, {
      id: string;
      name: string;
      handle: string;
      avatar: string;
      isReviewer: boolean;
      reviewCount: number;
      rating?: number;
      lastReviewSnippet?: string;
      followedAt?: string;
      isFollowedBack?: boolean;
      location?: string;
    }>();

    // 1. Registered users from allUsers who have EXPLICITLY added this business to their followedPlaces
    (allUsers || []).forEach((u: any) => {
      const followedPlaces = Array.isArray(u.followedPlaces) ? u.followedPlaces : [];
      const isActuallyFollowing = followedPlaces.some((pId: string) => {
        const cleanPId = String(pId || '').toLowerCase().trim();
        return targetPlaceKeys.has(cleanPId);
      });

      if (isActuallyFollowing) {
        const rawName = (u.name || '').trim();
        const handle = (u.handle || rawName || 'user').toLowerCase().replace(/^@/, '');
        const key = (u.id || u.email || handle).toLowerCase();

        // Check if this real follower has also submitted reviews for this place (for display enhancement only)
        const userReviews = (videos || []).filter(v => {
          const vPlaceMatch = v.placeId && targetPlaceKeys.has(String(v.placeId).toLowerCase().trim());
          const vNameMatch = v.placeName && v.placeName.toLowerCase().trim() === placeNameLower;
          if (!vPlaceMatch && !vNameMatch) return false;
          const authorName = (v.author?.name || '').toLowerCase().trim();
          const vUid = (v.userId || (v.author as any)?.id || '').toLowerCase().trim();
          return (
            (authorName && (authorName === handle || authorName === rawName.toLowerCase())) ||
            (vUid && (vUid === String(u.id).toLowerCase() || vUid === String(u.email).toLowerCase()))
          );
        });

        const totalUserReviews = (videos || []).filter(v => {
          const authorName = (v.author?.name || '').toLowerCase().trim();
          const vUid = (v.userId || (v.author as any)?.id || '').toLowerCase().trim();
          return (
            (authorName && (authorName === handle || authorName === rawName.toLowerCase())) ||
            (vUid && (vUid === String(u.id).toLowerCase() || vUid === String(u.email).toLowerCase()))
          );
        }).length;

        map.set(key, {
          id: u.id || u.uid || key,
          name: rawName || 'Yoouz User',
          handle: handle || 'user',
          avatar: u.avatar || getSafeAvatarUrl(u.avatar, rawName || 'User', handle),
          isReviewer: totalUserReviews > 0,
          reviewCount: totalUserReviews,
          rating: userReviews[0]?.rating,
          lastReviewSnippet: userReviews[0]?.caption || (userReviews[0] as any)?.text,
          followedAt: 'Recent',
          isFollowedBack: Boolean(businessFollowedAuthors.some(a => a.toLowerCase().replace(/^@/, '') === handle)),
          location: u.location || (userReviews[0]?.placeCity ? `${userReviews[0].placeCity}` : 'Local Contributor')
        });
      }
    });

    // 2. Current user IF they explicitly followed this place (authenticated or local session)
    if (currentUser) {
      const myFollowedPlaces = Array.isArray(currentUser.followedPlaces) ? currentUser.followedPlaces : [];
      let storedFollowed: string[] = [];
      try {
        storedFollowed = JSON.parse(localStorage.getItem('copo_followed_places') || '[]');
      } catch (e) {}

      const isMyFollow = myFollowedPlaces.some(pId => targetPlaceKeys.has(String(pId).toLowerCase().trim())) ||
        storedFollowed.some(pId => targetPlaceKeys.has(String(pId).toLowerCase().trim()));

      if (isMyFollow) {
        const myKey = (currentUser.id || currentUser.email || 'me').toLowerCase();
        if (!map.has(myKey)) {
          const myRawName = (currentUser.name || '').trim();
          const myHandle = (currentUser.handle || myRawName || 'me').toLowerCase().replace(/^@/, '');
          map.set(myKey, {
            id: myKey,
            name: myRawName || 'You',
            handle: myHandle,
            avatar: currentUser.avatar || getSafeAvatarUrl(currentUser.avatar, myRawName || 'You', myHandle),
            isReviewer: false,
            reviewCount: 0,
            followedAt: 'Recent',
            isFollowedBack: true
          });
        }
      }
    }

    return Array.from(map.values());
  }, [currentPlace, allUsers, videos, currentUser]);

  const filteredFollowers = useMemo(() => {
    const q = followerSearchQuery.toLowerCase().trim();
    if (!q) return businessFollowers;

    const map = new Map<string, any>();

    // 1. Matching existing followers
    businessFollowers.forEach((f) => {
      const fName = (f?.name || "").toLowerCase();
      const fHandle = (f?.handle || "").toLowerCase();
      const fSnippet = (f?.lastReviewSnippet || "").toLowerCase();
      if (fName.includes(q) || fHandle.includes(q) || fSnippet.includes(q)) {
        map.set(fName || fHandle, f);
      }
    });

    // 2. All platform users/reviewers matching query (excluding businesses)
    (allUsers || []).forEach((u: any) => {
      const name = (u.name || "").trim();
      const email = (u.email || "").toLowerCase().trim();
      const handle = (u.handle || name || "").toLowerCase().replace(/^@/, '');
      if (!name || name === "Registered User" || name === "Reviewer") return;
      if (email === "admin@yoouz.com") return;

      if (name.toLowerCase().includes(q) || handle.includes(q) || (u.bio && u.bio.toLowerCase().includes(q))) {
        const key = name.toLowerCase();
        if (!map.has(key)) {
          const isFollowed = Boolean(
            businessFollowedAuthors.some(
              (a) => a.toLowerCase().trim() === key || a.toLowerCase().replace(/^@/, '') === handle
            )
          );
          map.set(key, {
            id: u.id || u.uid || key,
            name,
            handle: handle || 'user',
            avatar: getSafeAvatarUrl(u.avatar, name, handle),
            isReviewer: true,
            reviewCount: u.videoCount || 0,
            location: u.location || 'Local Contributor',
            isFollowedBack: isFollowed
          });
        }
      }
    });

    // 3. Video review authors matching query
    (videos || []).forEach((v) => {
      if (v.author && v.author.name) {
        const name = v.author.name.trim();
        const handle = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (name.toLowerCase().includes(q)) {
          const key = name.toLowerCase();
          if (!map.has(key)) {
            const isFollowed = Boolean(
              businessFollowedAuthors.some(
                (a) => a.toLowerCase().trim() === key || a.toLowerCase().replace(/^@/, '') === handle
              )
            );
            map.set(key, {
              id: key,
              name,
              handle,
              avatar: getSafeAvatarUrl(v.author.avatar, name, handle),
              isReviewer: true,
              reviewCount: 1,
              location: v.placeCity || 'Local Contributor',
              isFollowedBack: isFollowed
            });
          }
        }
      }
    });

    return Array.from(map.values());
  }, [businessFollowers, followerSearchQuery, allUsers, videos, businessFollowedAuthors]);

  // Business Messages strictly scoped to this business entity (placeId, business email, or business handle)
  const businessMessages = useMemo(() => {
    if (!messages || messages.length === 0) return [];
    const deletedMap = getDeletedThreadsMap(effectiveUser);
    const bizPlaceId = (currentPlace?.id || (effectiveUser as any)?.placeId || (effectiveUser as any)?.id || '').toLowerCase().trim();
    const bizDomain = (bizPlaceId.includes('.') ? bizPlaceId : (currentPlace?.website || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')).trim();
    const bizEmail = (effectiveUser?.email || '').toLowerCase().trim();
    const bizName = (currentPlace?.name || effectiveUser?.name || '').toLowerCase().trim();
    const bizSlug = bizName.replace(/[^a-z0-9]/g, '');
    const bizHandle = (effectiveUser?.handle || '').toLowerCase().trim();
    const isYoouzBiz = bizPlaceId === 'yoouz.com' || bizPlaceId === 'yoouz' || bizName === 'yoouz' || bizDomain === 'yoouz.com';

    return messages.filter(m => {
      if (!m) return false;
      const tId = String(m.id || '').trim();
      const partnerInfo = getThreadPartnerIdentifiers(m, effectiveUser);
      const pKey = partnerInfo.partnerKey || getThreadPartnerKey(m, effectiveUser);

      const deletedTimestamp = 
        deletedMap.get(tId) ?? 
        (pKey ? deletedMap.get(pKey) : undefined) ??
        (partnerInfo.partnerId ? deletedMap.get(partnerInfo.partnerId) : undefined) ??
        (partnerInfo.partnerEmail ? deletedMap.get(partnerInfo.partnerEmail) : undefined);

      if (deletedTimestamp !== undefined && deletedTimestamp > 1) {
        const rawHistory = Array.isArray(m.history) ? m.history : [];
        const threadTime = resolveMessageTimestampMs(m, (m as any).updatedAt || (m as any).createdAt || m.createdAtMs);
        const historyTimes = rawHistory.map((h: any) => resolveMessageTimestampMs(h, h?.createdAt || h?.createdAtMs || 0));
        const latestMsgTime = Math.max(threadTime, ...historyTimes, 0);
        if (latestMsgTime > deletedTimestamp + 500) {
          deletedMap.delete(tId);
          if (pKey) deletedMap.delete(pKey);
          if (partnerInfo.partnerId) deletedMap.delete(partnerInfo.partnerId);
          if (partnerInfo.partnerEmail) deletedMap.delete(partnerInfo.partnerEmail);
          saveDeletedThreadsMap(deletedMap, effectiveUser);
        } else {
          return false;
        }
      }

      const deletedForUsers = Array.isArray((m as any).deletedForUsers)
        ? (m as any).deletedForUsers.map((u: string) => (u || '').toLowerCase().trim().replace(/^@/, ''))
        : [];
      const isDeletedOnServer = Boolean(
        (bizEmail && deletedForUsers.includes(bizEmail)) ||
        (bizPlaceId && deletedForUsers.includes(bizPlaceId)) ||
        (bizHandle && deletedForUsers.includes(bizHandle)) ||
        (bizName && deletedForUsers.includes(bizName))
      );
      if (isDeletedOnServer) {
        const rawHistory = Array.isArray(m.history) ? m.history : [];
        if (rawHistory.length === 0) return false;
      }

      const participants = Array.isArray(m.participants)
        ? m.participants.map(p => (p || '').toLowerCase().trim().replace(/^@/, ''))
        : [];
      const senderEmail = (m.senderEmail || m.lastSenderEmail || '').toLowerCase().trim();
      const recipientEmail = (m.recipientEmail || '').toLowerCase().trim();
      const senderId = (m.senderId || '').toLowerCase().trim().replace(/^@/, '');
      const recipientId = (m.recipientId || '').toLowerCase().trim().replace(/^@/, '');
      const senderName = (m.senderName || '').toLowerCase().trim();
      const recipientName = (m.recipientName || '').toLowerCase().trim();
      const threadIdStr = String(m.id || '').toLowerCase();
      const mPlaceId = String((m as any).placeId || '').toLowerCase();

      const matchesPlaceId = Boolean(
        bizPlaceId && (
          participants.some(p => p.includes(bizPlaceId) || bizPlaceId.includes(p)) ||
          senderId === bizPlaceId || recipientId === bizPlaceId ||
          mPlaceId === bizPlaceId || threadIdStr.includes(bizPlaceId)
        )
      );

      const matchesDomain = Boolean(
        bizDomain && (
          participants.some(p => p.includes(bizDomain) || bizDomain.includes(p)) ||
          senderEmail.includes(bizDomain) || recipientEmail.includes(bizDomain) ||
          senderId.includes(bizDomain) || recipientId.includes(bizDomain) ||
          threadIdStr.includes(bizDomain)
        )
      );

      const matchesEmail = Boolean(
        bizEmail && (
          participants.some(p => p.includes(bizEmail)) ||
          senderEmail === bizEmail || recipientEmail === bizEmail
        )
      );

      const matchesName = Boolean(
        bizName && bizName !== 'business manager' && (
          senderName === bizName || recipientName === bizName ||
          participants.includes(bizName) ||
          (bizSlug && bizSlug.length > 2 && (
            senderName.replace(/[^a-z0-9]/g, '') === bizSlug ||
            recipientName.replace(/[^a-z0-9]/g, '') === bizSlug ||
            threadIdStr.includes(bizSlug)
          ))
        )
      );

      const matchesHandle = Boolean(
        bizHandle && bizHandle.length > 2 && (
          participants.some(p => p.includes(bizHandle)) ||
          senderId === bizHandle || recipientId === bizHandle
        )
      );

      const matchesYoouz = Boolean(
        isYoouzBiz && (
          participants.some(p => p.includes('yoouz') || p.includes('info@yoouz.com')) ||
          senderName.includes('yoouz') || recipientName.includes('yoouz') ||
          senderId.includes('yoouz') || recipientId.includes('yoouz') ||
          senderEmail.includes('yoouz') || recipientEmail.includes('yoouz') ||
          threadIdStr.includes('yoouz')
        )
      );

      return matchesPlaceId || matchesDomain || matchesEmail || matchesName || matchesHandle || matchesYoouz;
    });
  }, [messages, effectiveUser, currentPlace]);

  const unreadMessagesCount = useMemo(() => {
    return businessMessages.reduce((acc, m) => acc + (m.unreadCount || 0), 0);
  }, [businessMessages]);

  // Business Notifications computed from props and active notification preferences
  const businessNotifications = useMemo(() => {
    if (!notifications || notifications.length === 0) return [];
    const pName = (currentPlace?.name || '').toLowerCase().trim();
    const pId = (currentPlace?.id || '').toLowerCase().trim();
    const placeVideoIds = new Set(placeVideos.map(v => v.id));

    // Claim timestamp of this place (if claimed)
    const claimedAtMs = (currentPlace as any)?.claimedAtMs || (verifiedBusinessSession?.verifiedAt ? new Date(verifiedBusinessSession.verifiedAt).getTime() : 0);

    return notifications.filter(n => {
      if (!n) return false;

      // 1. Master toggle: If disabled in settings, pause all notifications
      if (!businessNotificationSettings.enabled) return false;

      // 2. Granular category filters based on user settings
      if (n.type === 'like' && !businessNotificationSettings.likes) return false;
      if (n.type === 'comment' && !businessNotificationSettings.comments) return false;
      if (n.type === 'message' && !businessNotificationSettings.messages) return false;
      if (n.type === 'follow' && !businessNotificationSettings.follows) return false;
      if (n.type === 'bookmark' && !businessNotificationSettings.bookmarks) return false;
      if (n.type === 'review' && businessNotificationSettings.reviews === false) return false;
      if ((n.type === 'repost' || n.type === 'share') && (businessNotificationSettings.shares === false || (businessNotificationSettings.shares === undefined && !businessNotificationSettings.bookmarks))) return false;

      // 3. Welcome notification check (e.g. system welcome for the claimed business)
      const isWelcome = Boolean(
        n.id?.includes('welcome') ||
        n.text?.toLowerCase().includes('welcome to yoouz') ||
        n.text?.toLowerCase().includes('welcome')
      );

      if (isWelcome) {
        const notifRecipient = ((n as any).recipientEmail || '').toLowerCase().trim();
        const bizEmail = ((currentPlace as any)?.claimedByEmail || verifiedBusinessSession?.businessEmail || '').toLowerCase().trim();
        return Boolean(bizEmail && notifRecipient && bizEmail === notifRecipient);
      }

      // 4. Venue or recipient email match: Must match this business place ID, Name, Video ID, or business owner email
      const notifPlaceName = (n.placeName || '').toLowerCase().trim();
      const notifPlaceId = (n.placeId || '').toLowerCase().trim();
      const notifRecipient = ((n as any).recipientEmail || '').toLowerCase().trim();
      const bizEmail = ((currentPlace as any)?.claimedByEmail || verifiedBusinessSession?.businessEmail || '').toLowerCase().trim();

      // Exclude self-actions: If the notification was sent by the business owner themselves, filter it out!
      const senderEmail = (n.user?.email || '').toLowerCase().trim();
      if (senderEmail && bizEmail && senderEmail === bizEmail) {
        return false;
      }

      const isMyReceivedMessage = n.type === 'message' && (
        (notifRecipient && bizEmail && notifRecipient === bizEmail) ||
        (notifPlaceId && pId && notifPlaceId === pId) ||
        (notifPlaceName && pName && notifPlaceName === pName)
      );

      const matchesThisPlace = Boolean(
        (pId && notifPlaceId && notifPlaceId === pId) ||
        (pName && notifPlaceName && notifPlaceName === pName) ||
        (n.videoId && placeVideoIds.has(n.videoId)) ||
        (notifRecipient && bizEmail && notifRecipient === bizEmail) ||
        isMyReceivedMessage
      );

      if (!matchesThisPlace) {
        return false;
      }

      // 5. Timing filter: If business was newly claimed, ignore older pre-claim history/mock data
      if (claimedAtMs > 0 && n.createdAtMs && n.createdAtMs < (claimedAtMs - 120000)) {
        return false;
      }

      return true;
    });
  }, [notifications, currentPlace, placeVideos, businessNotificationSettings, verifiedBusinessSession]);

  const unreadBusinessNotifsCount = useMemo(() => {
    return businessNotifications.filter(n => !n.isRead).length;
  }, [businessNotifications]);

  // Unseen new followers count for the Followers tab badge
  const unseenFollowersCount = useMemo(() => {
    return businessFollowers.filter(
      (f) => !seenFollowerIds.has(f.id) && !seenFollowerIds.has(f.handle)
    ).length;
  }, [businessFollowers, seenFollowerIds]);

  // Mark all followers as read/seen
  const handleMarkFollowersAsRead = useCallback(() => {
    const allIds = businessFollowers.map((f) => f.id || f.handle);
    const nextSet = new Set([...Array.from(seenFollowerIds), ...allIds]);
    setSeenFollowerIds(nextSet);
    try {
      const placeKey = currentPlace?.id || 'biz';
      localStorage.setItem(`copo_seen_followers_${placeKey}`, JSON.stringify(Array.from(nextSet)));
    } catch (e) {}

    // Also mark any business follow notifications as read
    if (onMarkNotificationRead) {
      businessNotifications
        .filter((n) => n.type === 'follow' && !n.isRead)
        .forEach((n) => onMarkNotificationRead(n.id));
    }
  }, [businessFollowers, seenFollowerIds, currentPlace, businessNotifications, onMarkNotificationRead]);

  // When active tab is followers, automatically mark followers as seen
  useEffect(() => {
    if (activeTab === 'followers' && businessFollowers.length > 0 && unseenFollowersCount > 0) {
      handleMarkFollowersAsRead();
    }
  }, [activeTab, businessFollowers.length, unseenFollowersCount, handleMarkFollowersAsRead]);

  // Mark all video reviews as seen/read and clear notification badges
  const handleMarkReviewsAsRead = useCallback(() => {
    const allIds = placeVideos.map((v) => v.id);
    const nextSet = new Set([...Array.from(seenReviewIds), ...allIds]);
    setSeenReviewIds(nextSet);
    try {
      const placeKey = currentPlace?.id || 'biz';
      localStorage.setItem(`copo_seen_reviews_${placeKey}`, JSON.stringify(Array.from(nextSet)));
    } catch (e) {}

    // Also clear review-related notifications if callback is provided
    if (onMarkNotificationRead && businessNotifications.length > 0) {
      businessNotifications.forEach((n) => {
        if (!n.isRead) onMarkNotificationRead(n.id);
      });
    }
  }, [placeVideos, seenReviewIds, currentPlace, onMarkNotificationRead, businessNotifications]);

  // Toggle seen status for a specific video review
  const toggleMarkReviewAsRead = useCallback((videoId: string) => {
    const nextSet = new Set(seenReviewIds);
    if (nextSet.has(videoId)) {
      nextSet.delete(videoId);
    } else {
      nextSet.add(videoId);
    }
    setSeenReviewIds(nextSet);
    try {
      const placeKey = currentPlace?.id || 'biz';
      localStorage.setItem(`copo_seen_reviews_${placeKey}`, JSON.stringify(Array.from(nextSet)));
    } catch (e) {}
  }, [seenReviewIds, currentPlace]);

  // When active tab is reviews, automatically mark reviews as seen
  useEffect(() => {
    if (activeTab === 'reviews' && placeVideos.length > 0) {
      handleMarkReviewsAsRead();
    }
  }, [activeTab, placeVideos.length, handleMarkReviewsAsRead]);

  const handleMessageFollower = (follower: any) => {
    setActiveTab('inbox');
    const existing = (messages || []).find(m => 
      m.senderId === follower.id || 
      (m.senderName && m.senderName.toLowerCase() === follower.name.toLowerCase()) ||
      (follower.handle && m.senderName && m.senderName.toLowerCase().replace(/^@/, '') === follower.handle.toLowerCase())
    );
    if (existing) {
      setTargetThreadId(existing.id);
    } else {
      setTargetThreadId(follower.id);
    }
  };

  // Count reviews that need owner attention (unseen / unacknowledged without reply)
  const unseenReviewsCount = useMemo(() => {
    return placeVideos.filter(
      (v) => !seenReviewIds.has(v.id) && !ownerReplies[v.id] && !v.ownerResponse?.text
    ).length;
  }, [placeVideos, seenReviewIds, ownerReplies]);

  // Dynamic KPIs calculated strictly from real data
  const totalReviews = placeVideos.length;
  const avgRating = totalReviews > 0 
    ? (placeVideos.reduce((acc, v) => acc + (v.rating || 5), 0) / totalReviews).toFixed(1) 
    : (currentPlace.rating ? Number(currentPlace.rating).toFixed(1) : '5.0');
  const totalViews = placeVideos.reduce((acc, v) => acc + getDisplayViews(v), 0);

  // Chart Time Series Data for Interactive SVG Chart (Accurate Data Only)
  const chartData = useMemo(() => {
    const emptyPoints = Array(14).fill(0);
    const labels = ['Day 14', 'Day 13', 'Day 12', 'Day 11', 'Day 10', 'Day 9', 'Day 8', 'Day 7', 'Day 6', 'Day 5', 'Day 4', 'Day 3', 'Yesterday', 'Today'];

    const viewsPoints = [...emptyPoints];
    const reviewsPoints = [...emptyPoints];
    const ratingPoints = Array(14).fill(Number(avgRating) || 5.0);

    placeVideos.forEach(v => {
      const date = new Date(v.createdAtMs || v.recordedAt || Date.now());
      const diffTime = Math.abs(new Date().getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 14) {
         const index = 13 - diffDays;
         viewsPoints[index] += (v.viewsCount || 0);
         reviewsPoints[index] += 1;
      }
    });

    const metricsMap = {
      views: {
        points: viewsPoints,
        labels,
        color: '#ffffff',
        gradientStart: 'rgba(255, 255, 255, 0.25)',
        gradientEnd: 'rgba(255, 255, 255, 0.01)',
        unit: 'views',
        total: totalViews.toLocaleString(),
        change: 'New'
      },
      reviews: {
        points: reviewsPoints,
        labels,
        color: '#ffffff',
        gradientStart: 'rgba(255, 255, 255, 0.25)',
        gradientEnd: 'rgba(255, 255, 255, 0.01)',
        unit: 'reviews',
        total: totalReviews.toLocaleString(),
        change: 'New'
      },
      rating: {
        points: ratingPoints,
        labels,
        color: '#d4d4d8',
        gradientStart: 'rgba(212, 212, 216, 0.25)',
        gradientEnd: 'rgba(212, 212, 216, 0.01)',
        unit: 'stars',
        total: avgRating,
        change: 'New'
      }
    };
    return metricsMap[selectedChartMetric] || metricsMap.views;
  }, [selectedChartMetric, placeVideos, totalViews, totalReviews, avgRating]);

  // Handlers
  const handleSaveCta = () => {
    localStorage.setItem('demo_cta_type', ctaType);
    localStorage.setItem('demo_cta_url', ctaUrl);
    localStorage.setItem('demo_cta_label', ctaLabelCustom);
    localStorage.setItem('demo_cta_color', ctaAccentColor);
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('yoouz_cta_updated', {
        detail: {
          placeId: selectedPlaceId,
          type: ctaType,
          url: ctaUrl,
          label: ctaLabelCustom,
          color: ctaAccentColor,
        }
      }));
    }

    setIsCtaSaved(true);
    setTimeout(() => setIsCtaSaved(false), 2500);
  };

  const handleSaveProfile = async () => {
    const parts = [streetAddress.trim(), city.trim(), stateRegion.trim(), zipCode.trim(), selectedCountry.trim()].filter(Boolean);
    const finalAddress = parts.join(', ') || profileAddress;

    let finalBannerUrl = profileBannerUrl;
    let finalLogoUrl = profileLogoUrl;
    const targetPlaceId = selectedPlaceId || currentPlace.id || 'yoouz.com';

    // If profileBannerUrl is still base64 data, upload to Bunny Storage CDN now
    if (finalBannerUrl && finalBannerUrl.startsWith('data:image/')) {
      try {
        const uRes = await fetch('/api/business/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: finalBannerUrl,
            imageType: 'banner',
            placeId: targetPlaceId
          })
        });
        if (uRes.ok) {
          const uData = await uRes.json();
          if (uData.imageUrl) {
            finalBannerUrl = uData.imageUrl;
            setProfileBannerUrl(uData.imageUrl);
          }
        }
      } catch (e) {}
    }

    // If profileLogoUrl is still base64 data, upload to Bunny Storage CDN now
    if (finalLogoUrl && finalLogoUrl.startsWith('data:image/')) {
      try {
        const uRes = await fetch('/api/business/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: finalLogoUrl,
            imageType: 'logo',
            placeId: targetPlaceId
          })
        });
        if (uRes.ok) {
          const uData = await uRes.json();
          if (uData.imageUrl) {
            finalLogoUrl = uData.imageUrl;
            setProfileLogoUrl(uData.imageUrl);
          }
        }
      } catch (e) {}
    }

    const cleanPhone = profilePhone.trim();
    const hasValidPhoneDigits = cleanPhone.replace(/\D/g, '').length >= 4;
    const finalPhone = hasValidPhoneDigits ? cleanPhone : '';

    (currentPlace as any).name = profileName;
    (currentPlace as any).address = finalAddress;
    currentPlace.address = finalAddress;
    setProfileAddress(finalAddress);
    (currentPlace as any).city = city;
    (currentPlace as any).country = selectedCountry;
    (currentPlace as any).phone = finalPhone;
    (currentPlace as any).website = profileWebsite;
    (currentPlace as any).hours = profileHours;
    currentPlace.openingHours = profileHours;
    (currentPlace as any).email = profileEmail;
    (currentPlace as any).description = profileDesc;
    (currentPlace as any).category = businessCategory;
    currentPlace.logoUrl = finalLogoUrl;
    (currentPlace as any).logoUrl = finalLogoUrl;
    (currentPlace as any).avatarUrl = finalLogoUrl;
    (currentPlace as any).placeLogoUrl = finalLogoUrl;
    currentPlace.bannerUrl = finalBannerUrl;
    (currentPlace as any).bannerUrl = finalBannerUrl;
    (currentPlace as any).ogImage = finalBannerUrl;
    (currentPlace as any).placeBannerUrl = finalBannerUrl;
    if (finalBannerUrl) {
      currentPlace.photos = [finalBannerUrl, ...(currentPlace.photos || []).filter(p => p !== finalBannerUrl && !p.includes('yoouz.com/og-banner.png'))];
    }

    const updatedPlaceObj = {
      ...currentPlace,
      name: profileName,
      address: finalAddress,
      city: city,
      country: selectedCountry,
      phone: finalPhone,
      website: profileWebsite,
      hours: profileHours,
      openingHours: profileHours,
      email: profileEmail,
      description: profileDesc,
      category: businessCategory,
      logoUrl: finalLogoUrl,
      avatarUrl: finalLogoUrl,
      placeLogoUrl: finalLogoUrl,
      bannerUrl: finalBannerUrl,
      ogImage: finalBannerUrl,
      placeBannerUrl: finalBannerUrl,
      photos: finalBannerUrl 
        ? [finalBannerUrl, ...(currentPlace.photos || []).filter(p => p && p !== finalBannerUrl && !p.includes('yoouz.com/og-banner.png') && !p.includes('placeholder'))] 
        : (currentPlace.photos || []).filter(p => p && !p.includes('yoouz.com/og-banner.png') && !p.includes('placeholder')),
      customEdited: true,
      customized: true
    };

    // Persist to server database (BunnyDB NoSQL)
    try {
      const payload = { data: updatedPlaceObj, merge: true };
      const requests: Promise<any>[] = [];

      if (selectedPlaceId) {
        requests.push(fetch(`/api/nosql/places/${encodeURIComponent(selectedPlaceId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => {}));
        requests.push(fetch(`/api/nosql/business_profiles/${encodeURIComponent(selectedPlaceId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => {}));
      }
      if (currentPlace.id && currentPlace.id !== selectedPlaceId) {
        requests.push(fetch(`/api/nosql/places/${encodeURIComponent(currentPlace.id)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => {}));
      }
      // Guarantee explicit write for yoouz.com if editing yoouz place
      if (targetPlaceId.includes('yoouz')) {
        requests.push(fetch(`/api/nosql/places/yoouz.com`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => {}));
      }

      await Promise.all(requests);
    } catch (dbErr) {
      console.warn("Failed to persist place profile to BunnyDB:", dbErr);
    }

    if (onUpdatePlace) {
      onUpdatePlace({ ...updatedPlaceObj });
    }

    if (verifiedBusinessSession) {
      const updatedSession = { 
        ...verifiedBusinessSession, 
        logoUrl: finalLogoUrl, 
        placeName: profileName,
        bannerUrl: finalBannerUrl,
        email: profileEmail,
        phone: finalPhone,
        address: finalAddress,
        category: businessCategory
      };
      setVerifiedBusinessSession(updatedSession);
      try {
        localStorage.setItem('copo_business_verified_session', JSON.stringify(updatedSession));
      } catch (e) {}
    }

    try {
      localStorage.setItem(`copo_business_profile_${selectedPlaceId}`, JSON.stringify({
        name: profileName,
        address: finalAddress,
        phone: finalPhone,
        website: profileWebsite,
        hours: profileHours,
        email: profileEmail,
        description: profileDesc,
        category: businessCategory,
        streetAddress,
        city,
        stateRegion,
        zipCode,
        country: selectedCountry,
        weeklySchedule,
        selectedAmenities,
        logoUrl: finalLogoUrl,
        bannerUrl: finalBannerUrl
      }));
    } catch (e) {
      console.warn('Failed to save profile to localStorage:', e);
    }

    try {
      window.dispatchEvent(new CustomEvent('copo-place-updated', { detail: updatedPlaceObj }));
      window.dispatchEvent(new CustomEvent('yoouz-place-updated', { detail: updatedPlaceObj }));
      window.dispatchEvent(new CustomEvent('copo_place_updated', { detail: updatedPlaceObj }));
    } catch (e) {}

    handleSaveCta();

    setIsProfileSaved(true);
    setTimeout(() => setIsProfileSaved(false), 3000);
  };

  const downloadQRCode = () => {
    const qrCanvas = (document.getElementById("yoouz-qr-code-mobile") as HTMLCanvasElement) || 
                   (document.getElementById("yoouz-qr-code") as HTMLCanvasElement);
    if (qrCanvas) {
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = 1200;
      exportCanvas.height = 1500;
      const ctx = exportCanvas.getContext("2d");
      if (ctx) {
        const renderStandee = (logoImg?: HTMLImageElement | null) => {
          ctx.fillStyle = "#09090b";
          ctx.fillRect(0, 0, 1200, 1500);

          ctx.strokeStyle = "#27272a";
          ctx.lineWidth = 8;
          ctx.strokeRect(40, 40, 1120, 1420);

          ctx.fillStyle = "#52525b";
          ctx.beginPath();
          ctx.roundRect(500, 70, 200, 16, 8);
          ctx.fill();

          if (qrTableLabel) {
            ctx.fillStyle = "#27272a";
            ctx.beginPath();
            ctx.roundRect(850, 110, 240, 50, 25);
            ctx.fill();
            ctx.fillStyle = "#f4f4f5";
            ctx.font = "bold 22px system-ui, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(qrTableLabel.toUpperCase(), 970, 143);
          }

          // Draw Business Brand Logo Box at top center (y = 120)
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(530, 120, 140, 140, 28);
          ctx.fill();
          ctx.strokeStyle = "#e4e4e7";
          ctx.lineWidth = 4;
          ctx.stroke();

          if (logoImg) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(540, 130, 120, 120, 20);
            ctx.clip();
            ctx.drawImage(logoImg, 540, 130, 120, 120);
            ctx.restore();
          } else {
            const brandInitial = (currentPlace.name || "B").charAt(0).toUpperCase();
            ctx.fillStyle = "#09090b";
            ctx.font = "900 64px system-ui, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(brandInitial, 600, 192);
            ctx.textBaseline = "alphabetic";
          }

          // Title / Venue Name
          ctx.fillStyle = "#ffffff";
          ctx.font = "900 60px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(currentPlace.name || 'Venue', 600, 330);

          // URL subtitle
          ctx.fillStyle = "#a1a1aa";
          ctx.font = "bold 26px system-ui, sans-serif";
          ctx.fillText(`yoouz.com/reviews/${getPlaceSlug(currentPlace)}`, 600, 380);

          const avgRatingStr = Number(currentPlace.rating || 5).toFixed(1);
          const reviewCount = Math.max(1, placeVideos.length);
          ctx.fillStyle = "#fbbf24";
          ctx.font = "900 30px system-ui, sans-serif";
          ctx.fillText(`${avgRatingStr} ★ (${reviewCount} Photo Reviews)`, 600, 435);

          // Callout Heading Badge
          ctx.fillStyle = "#18181b";
          ctx.beginPath();
          ctx.roundRect(250, 485, 700, 70, 35);
          ctx.fill();
          ctx.strokeStyle = "#3f3f46";
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.font = "900 28px system-ui, sans-serif";
          ctx.fillText((qrCustomHeading || 'LEAVE A LIVE PHOTO REVIEW').toUpperCase(), 600, 530);

          // QR Code background box
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(260, 585, 680, 680, 36);
          ctx.fill();
          ctx.strokeStyle = "#e4e4e7";
          ctx.lineWidth = 4;
          ctx.stroke();

          // Draw QR code onto export canvas
          ctx.drawImage(qrCanvas, 320, 645, 560, 560);

          // Center star overlay on QR
          ctx.fillStyle = "#09090b";
          ctx.beginPath();
          ctx.arc(600, 925, 55, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 6;
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.font = "900 48px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("★", 600, 927);

          // Footer instructions
          ctx.textBaseline = "alphabetic";
          ctx.fillStyle = "#d4d4d8";
          ctx.font = "bold 30px system-ui, sans-serif";
          ctx.fillText("Scan with your phone camera app to review", 600, 1365);

          ctx.fillStyle = "#71717a";
          ctx.font = "bold 22px system-ui, sans-serif";
          ctx.fillText("Powered by Yoouz Live Photo Reviews", 600, 1420);

          const pngUrl = exportCanvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
          downloadLink.href = pngUrl;
          downloadLink.download = `${(currentPlace.name || 'venue').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-yoouz-table-standee.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        };

        const targetLogoUrl = currentPlace.logoUrl || currentPlace.bannerUrl;
        if (targetLogoUrl) {
          const logoImg = new Image();
          logoImg.crossOrigin = "anonymous";
          logoImg.onload = () => renderStandee(logoImg);
          logoImg.onerror = () => renderStandee(null);
          logoImg.src = targetLogoUrl;
        } else {
          renderStandee(null);
        }
      }
    }
  };

  const toggleHideVideo = (id: string) => {
    if (hiddenVideoIds.includes(id)) {
      setHiddenVideoIds(prev => prev.filter(item => item !== id));
      setWidgetNotice('Photo review restored to website widget.');
    } else {
      setHiddenVideoIds(prev => [...prev, id]);
      setWidgetNotice('👁️ Photo review hidden from website widget.');
    }
    setTimeout(() => setWidgetNotice(null), 3500);
  };

  const handleDownloadVideoForAds = (video: VideoReview) => {
    if (!isPremium) {
      setPremiumTriggerFeature('download_video');
      setIsPremiumModalOpen(true);
      return;
    }
    setAdExportVideo(video);
  };

  const getEmbedCode = () => {
    const rawSlug = getPlaceSlug(currentPlace);
    const embedSlug = (rawSlug && rawSlug.trim() !== '') ? rawSlug.trim() : (currentPlace?.id || currentPlace?.brandDomain || 'yoouz.com');
    const placeTitle = (currentPlace?.name || 'Business').replace(/"/g, '\\"');
    const placeRating = Number(currentPlace?.rating || 5).toFixed(1);
    const reviewCount = Math.max(1, placeVideos.length);

    // High-speed Google SEO Code Package with aggregate rating and video object metadata graphs
    const graphItems = [
      {
        "@type": "LocalBusiness",
        "@id": `https://www.yoouz.com/reviews/${embedSlug}#business`,
        "name": placeTitle,
        "url": `https://www.yoouz.com/reviews/${embedSlug}`,
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": placeRating,
          "bestRating": "5",
          "worstRating": "1",
          "ratingCount": String(reviewCount)
        }
      }
    ];

    placeVideos.forEach((v) => {
      if (!v || !v.id) return;
      const vAuthor = v.author?.name || 'Verified Customer';
      const vCaption = v.caption || `Verified Photo Review for ${placeTitle}`;
      const vDate = v.createdAtMs ? new Date(v.createdAtMs).toISOString() : new Date().toISOString();
      const vThumb = v.photoUrl || v.thumbnailUrl || 'https://yoouz.com/og-banner.png';
      const vUrl = v.photoUrl || v.videoUrl || `https://www.yoouz.com/video/${v.id}`;
      graphItems.push({
        "@type": "ImageObject",
        "@id": `https://www.yoouz.com/video/${v.id}#photo`,
        "name": `Verified Photo Review of ${placeTitle} by ${vAuthor}`,
        "description": vCaption,
        "thumbnailUrl": [vThumb],
        "uploadDate": vDate,
        "contentUrl": vUrl,
        "embedUrl": `https://www.yoouz.com/embed/${embedSlug}?v=${v.id}`,
        "interactionStatistic": {
          "@type": "InteractionCounter",
          "interactionType": { "@type": "http://schema.org/LikeAction" },
          "userInteractionCount": v.likes || 0
        }
      } as any);
    });

    const jsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": graphItems
    }, null, 2);

    const crawlableFallback = `<!-- Semantic Crawlable Fallback for Search Crawlers -->
  <div class="yoouz-seo-crawlers" style="display:none !important; visibility:hidden; opacity:0; font-size:0; width:0; height:0; overflow:hidden;">
    <h3>Verified Customer Photo Reviews for ${placeTitle}</h3>
    ${placeVideos.map(v => `
      <div itemscope itemtype="https://schema.org/ImageObject">
        <span itemprop="name">Photo Review by ${v.author?.name || 'Verified Customer'}</span>
        <p itemprop="description">${v.caption || ''}</p>
        <span itemprop="uploadDate">${v.createdAtMs ? new Date(v.createdAtMs).toISOString() : new Date().toISOString()}</span>
      </div>
    `).join('')}
  </div>`;

    return `<!-- Yoouz Authentic Photo Reviews + Google Rich Snippet (Schema.org) SEO Package -->
<div class="yoouz-video-embed" style="max-width:390px;margin:0 auto;">
  <iframe src="https://www.yoouz.com/embed/${embedSlug}" width="100%" height="520" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture; camera; popups; popups-to-escape-sandbox" style="width:100%; max-width:390px; height:520px; border-radius:24px; border:none; box-shadow:0 20px 40px rgba(0,0,0,0.5); overflow:hidden;" title="Verified Photo Reviews for ${placeTitle} on Yoouz"></iframe>
  
  <script type="application/ld+json">
${jsonLd}
  </script>
  
  ${crawlableFallback}
</div>`;
  };

  const copyEmbedCode = () => {
    if (!isPremium) {
      setPremiumTriggerFeature('embed');
      setIsPremiumModalOpen(true);
      return;
    }
    const snippet = getEmbedCode();
    navigator.clipboard.writeText(snippet);
    setIsCodeCopied(true);
    setTimeout(() => setIsCodeCopied(false), 2500);
  };

  const handleSendUpgradeInquiry = async () => {
    if (!selectedUpgradeAgency) return;
    setIsSubmittingUpgradeInquiry(true);
    try {
      const body = {
        placeId: currentPlace?.id,
        placeName: currentPlace?.name,
        userEmail: (verifiedBusinessSession as any)?.businessEmail || displayOwnerEmail,
        userName: (verifiedBusinessSession as any)?.ownerName || displayOwnerName,
        agencyId: selectedUpgradeAgency.id,
        agencyName: selectedUpgradeAgency.name
      };
      const res = await fetch('/api/agencies/request-upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setUpgradeInquirySuccess(true);
      }
    } catch (e) {
      console.warn("Failed to send upgrade inquiry:", e);
    } finally {
      setIsSubmittingUpgradeInquiry(false);
    }
  };
  const copyDirectReviewLink = () => {
    const rawSlug = getPlaceSlug(currentPlace);
    const slug = (rawSlug && rawSlug.trim() !== '') ? rawSlug.trim() : (currentPlace?.id || currentPlace?.brandDomain || 'yoouz.com');
    const directUrl = typeof window !== 'undefined' && !window.location.hostname.includes('yoouz.com')
      ? `${window.location.origin}/reviews/${encodeURIComponent(slug)}?record=true`
      : `https://www.yoouz.com/reviews/${encodeURIComponent(slug)}?record=true`;
    navigator.clipboard.writeText(directUrl);
    setIsDirectReviewLinkCopied(true);
    setTimeout(() => setIsDirectReviewLinkCopied(false), 2500);
  };

  // Compute displayable videos for Widget Preview and Website Embed
  const displayableWidgetVideos = useMemo(() => {
    return placeVideos.filter(v => !hiddenVideoIds.includes(v.id));
  }, [placeVideos, hiddenVideoIds]);

  // Synchronize ownerReplies from placeVideos when videos or selectedPlaceId updates
  useEffect(() => {
    const map: Record<string, string> = {};
    placeVideos.forEach(v => {
      if (v.ownerResponse?.text) {
        map[v.id] = v.ownerResponse.text;
      }
    });
    setOwnerReplies(prev => ({ ...map, ...prev }));
  }, [placeVideos, selectedPlaceId]);

  const handleSaveReply = (id: string, textOverride?: string) => {
    const text = (textOverride !== undefined ? textOverride : replyText).trim();
    if (!text) return;
    setOwnerReplies(prev => ({ ...prev, [id]: text }));
    if (onSaveOwnerResponse) {
      onSaveOwnerResponse(id, text);
    }
    setActiveReplyId(null);
    setReplyText('');
  };

  const handleDeleteReply = (id: string) => {
    setOwnerReplies(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (onDeleteOwnerResponse) {
      onDeleteOwnerResponse(id);
    }
  };

  // Clean grouped navigation structure (Apple Business Connect / Stripe / Linear standard)
  const workspaceNavItems = [
    { id: 'overview' as BusinessTab, label: 'Overview', icon: Home },
    {
      id: 'reviews' as BusinessTab,
      label: 'Reviews',
      icon: Camera,
      badge: unseenReviewsCount > 0 ? unseenReviewsCount : undefined
    },
    {
      id: 'inbox' as BusinessTab,
      label: 'Messages',
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined
    },
    {
      id: 'followers' as BusinessTab,
      label: 'Followers',
      icon: Users,
      badge: unseenFollowersCount > 0 ? unseenFollowersCount : undefined
    },
    {
      id: 'notifications' as BusinessTab,
      label: 'Alerts',
      icon: Bell,
      badge: unreadBusinessNotifsCount > 0 ? unreadBusinessNotifsCount : undefined
    },
  ];

  const growthNavItems = [
    { id: 'embed' as BusinessTab, label: 'Website Embed', icon: Code },
    { id: 'qr_invites' as BusinessTab, label: 'QR Standee', icon: QrCode },
  ];

  const accountNavItems = [
    { id: 'profile' as BusinessTab, label: 'Business Profile', icon: Building2 },
    {
      id: 'membership' as BusinessTab,
      label: 'Membership',
      icon: Zap,
      tierLabel: isPremium ? 'Pro' : 'Free'
    },
    { id: 'more' as BusinessTab, label: 'More & Help', icon: Menu },
  ];

  const activeTabLabelMap: Record<BusinessTab, string> = {
    overview: 'Overview',
    reviews: 'Reviews',
    inbox: 'Messages',
    followers: 'Followers',
    notifications: 'Alerts',
    embed: 'Website Embed',
    qr_invites: 'QR Standee',
    profile: 'Business Profile',
    membership: 'Membership',
    more: 'More & Help',
  };

  const activeTabTitle = showEmbedTester ? 'Embed Tester' : (activeTabLabelMap[activeTab] || 'Overview');
  const cleanBusinessDomain = useMemo(() => {
    const raw = currentPlace?.website || currentPlace?.brandDomain || currentPlace?.id || verifiedBusinessSession?.domain || '';
    const cleaned = extractCleanDomain(raw);
    return cleaned || 'yoouz.com';
  }, [currentPlace?.website, currentPlace?.brandDomain, currentPlace?.id, verifiedBusinessSession?.domain]);

  const dateRangeLabel = analyticsDateRange === '7d'
    ? 'Last 7 days'
    : analyticsDateRange === '30d'
      ? 'Last 30 days'
      : analyticsDateRange === '90d'
        ? 'Last 90 days'
        : 'All time';

  // If user hasn't signed in / claimed a business or is currently claiming
  if (!verifiedBusinessSession || isClaiming) {
    return (
      <CopoBusinessAuthLanding
        onNavigate={onNavigate}
        places={places || []}
        videos={videos || []}
        currentUser={currentUser || null}
        initialPlace={initialPlace}
        initialMode={initialMode}
        hasActiveSession={Boolean(verifiedBusinessSession)}
        onReturnToDashboard={() => setIsClaiming(false)}
        onCancelSelectedPlace={() => {
          setIsClaiming(false);
          if (onClearInitialPlace) {
            onClearInitialPlace();
          }
        }}
        onSuccessAuth={(session) => {
          setVerifiedBusinessSession(session);
          setSelectedPlaceId(session.placeId);
          setIsClaiming(false);
        }}
      />
    );
  }

  return (
    <div className="w-full max-w-full h-[100dvh] flex bg-[#050506] select-none antialiased overflow-x-hidden font-sans text-white copo-business-dashboard">
      <div className="w-full h-full flex">
      {/* Desktop Left Workspace Sidebar (Flagship Obsidian) */}
      <aside className="w-[252px] h-[100dvh] bg-[#050506] border-r border-white/[0.07] px-3.5 py-5 flex-col justify-between shrink-0 select-none hidden md:flex z-50 copo-business-sidebar text-white">
        {/* Scrollable Upper Area */}
        <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar min-h-0 gap-5">
          {/* Minimal Yoouz Business Wordmark (No Pill, No Marketing Tagline) */}
          <button
            type="button"
            id="biz-brand-logo"
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-2.5 px-2.5 py-1.5 text-left cursor-pointer group rounded-xl hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-[10px] bg-white/[0.06] border border-white/[0.1] group-hover:bg-white/[0.1] transition-colors shrink-0">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                <path d="M12 3.8l2.32 4.7 5.18 0.75-3.75 3.65 0.88 5.16L12 15.62l-4.63 2.44 0.88-5.16-3.75-3.65 5.18-0.75L12 3.8z" />
              </svg>
            </div>
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-white text-[18px] font-semibold tracking-[-0.03em] leading-none">
                Yoouz
              </span>
              <span className="text-[12px] font-medium text-zinc-500">
                Business
              </span>
            </div>
          </button>

          {/* Active Business Workspace Card */}
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.055] border border-white/[0.08] transition-colors text-left cursor-pointer group"
            title={`Manage ${currentPlace.name}`}
          >
            <CopoBrandLogo
              domain={currentPlace.website || currentPlace.id}
              name={currentPlace.name}
              logoUrl={profileLogoUrl || currentPlace.logoUrl}
              className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.1] p-1 flex items-center justify-center shrink-0 overflow-hidden"
              imageClassName="w-full h-full object-contain rounded-lg"
              fallbackTextClassName="font-semibold text-xs text-white"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-[13px] font-semibold text-white truncate">
                  {currentPlace.name}
                </span>
                <BadgeCheck className="w-3.5 h-3.5 text-[#E8C78A] shrink-0" />
              </div>
              <div className="text-[11px] text-zinc-400 truncate">
                {cleanBusinessDomain}
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 shrink-0 transition-colors" />
          </button>

          {/* Semantic Grouped Navigation */}
          <nav className="flex flex-col gap-5" aria-label="Business navigation">
            {/* Group 1: Workspace */}
            <div className="space-y-0.5">
              <div className="px-2.5 pb-1.5 text-[11px] font-medium text-zinc-500">
                Workspace
              </div>
              {workspaceNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    id={`biz-nav-btn-${item.id === 'overview' ? 'home' : item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-2.5 h-9 rounded-xl text-[13.5px] transition-colors text-left cursor-pointer ${
                      isActive
                        ? 'bg-white/[0.09] text-white font-semibold'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] font-medium'
                    }`}
                  >
                    <Icon className={`w-[17px] h-[17px] shrink-0 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                    <span className="truncate flex-1">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="min-w-[20px] h-5 px-1.5 text-[11px] font-semibold rounded-full bg-white text-zinc-950 flex items-center justify-center tabular-nums">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Group 2: Growth */}
            <div className="space-y-0.5">
              <div className="px-2.5 pb-1.5 text-[11px] font-medium text-zinc-500">
                Growth
              </div>
              {growthNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    id={`biz-nav-btn-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-2.5 h-9 rounded-xl text-[13.5px] transition-colors text-left cursor-pointer ${
                      isActive
                        ? 'bg-white/[0.09] text-white font-semibold'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] font-medium'
                    }`}
                  >
                    <Icon className={`w-[17px] h-[17px] shrink-0 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                    <span className="truncate flex-1">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Group 3: Account */}
            <div className="space-y-0.5">
              <div className="px-2.5 pb-1.5 text-[11px] font-medium text-zinc-500">
                Account
              </div>
              {accountNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    id={`biz-nav-btn-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-2.5 h-9 rounded-xl text-[13.5px] transition-colors text-left cursor-pointer ${
                      isActive
                        ? 'bg-white/[0.09] text-white font-semibold'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] font-medium'
                    }`}
                  >
                    <Icon className={`w-[17px] h-[17px] shrink-0 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                    <span className="truncate flex-1">{item.label}</span>
                    {(item as any).tierLabel && (
                      <span className={`text-[11px] font-medium shrink-0 ${isPremium ? 'text-[#E8C78A]' : 'text-zinc-500'}`}>
                        {(item as any).tierLabel}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Bottom Exit & Quiet Legal Footer */}
        <div className="pt-3 border-t border-white/[0.07] flex flex-col gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full flex items-center gap-2.5 px-2.5 h-9 rounded-xl text-[13px] font-medium text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Back to Yoouz</span>
          </button>

          <div className="px-2.5 space-y-1">
            <div className="flex items-center gap-2 text-[11px] text-zinc-500">
              <button
                type="button"
                onClick={() => onOpenLegal ? onOpenLegal("privacy") : onNavigate("home")}
                className="hover:text-zinc-300 transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                {t("legal.privacy", "Privacy")}
              </button>
              <span className="text-zinc-700">·</span>
              <button
                type="button"
                onClick={() => onOpenLegal ? onOpenLegal("terms") : onNavigate("home")}
                className="hover:text-zinc-300 transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                {t("legal.terms", "Terms")}
              </button>
              <span className="text-zinc-700">·</span>
              <button
                type="button"
                onClick={() => setActiveTab("more")}
                className="hover:text-zinc-300 transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                {t("legal.about", "About")}
              </button>
            </div>
            <p className="text-[10.5px] text-zinc-600">
              {t("legal.allRightsReserved", "© 2026 Yoouz. All rights reserved.")}
            </p>
          </div>
        </div>
      </aside>

        {/* Right Side Workspace Column */}
        <div className="flex-1 flex flex-col overflow-hidden relative bg-[#050506] min-w-0">

          {/* Unified Top Bar: Desktop Breadcrumb Header & Native Mobile PWA App Bar */}
          <header className="w-full h-14 md:h-16 bg-[#050506]/92 backdrop-blur-2xl border-b border-white/[0.07] px-3.5 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 z-30 relative">

            {/* Left: Desktop SaaS Breadcrumb OR Mobile Native App Header */}
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Mobile Native Back Button + Active Business & Page Title */}
              <div className="flex md:hidden items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 border border-white/[0.09] flex items-center justify-center transition-colors shrink-0 cursor-pointer active:scale-95"
                  aria-label="Back to Yoouz"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 min-w-0">
                  <CopoBrandLogo
                    domain={currentPlace.website || currentPlace.id}
                    name={currentPlace.name}
                    logoUrl={profileLogoUrl || currentPlace.logoUrl}
                    className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.1] p-0.5 flex items-center justify-center shrink-0 overflow-hidden"
                    imageClassName="w-full h-full object-contain rounded-md"
                    fallbackTextClassName="font-semibold text-[11px] text-white"
                  />
                  <div className="min-w-0 leading-tight">
                    <div className="text-[15px] font-semibold text-white tracking-[-0.02em] truncate">
                      {activeTabTitle}
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate flex items-center gap-1">
                      <span className="truncate">{currentPlace.name}</span>
                      <BadgeCheck className="w-3 h-3 text-[#E8C78A] shrink-0" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Minimal Breadcrumb Trail (Zero Pill Soup) */}
              <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-2 text-[13px] min-w-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer shrink-0"
                >
                  Business
                </button>
                <span className="text-zinc-700">/</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="text-zinc-300 hover:text-white transition-colors truncate max-w-[180px] cursor-pointer font-medium"
                >
                  {currentPlace.name}
                </button>
                <span className="text-zinc-700">/</span>
                <span className="text-white font-semibold truncate">
                  {activeTabTitle}
                </span>
              </nav>
            </div>

            {/* Right: Streamlined Utilities (Max 2 quiet controls + Account trigger) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Desktop Public Profile Quick Link */}
              <button
                type="button"
                onClick={() => {
                  const targetId = selectedPlaceId || currentPlace?.id || 'yoouz.com';
                  if (onOpenPlaceDrawer) {
                    onOpenPlaceDrawer(targetId);
                  } else {
                    window.location.href = `/reviews/${targetId}`;
                  }
                }}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 h-9 rounded-full text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <span>Public page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              {/* Desktop Help Icon Button */}
              <button
                type="button"
                id="biz-header-help-trigger"
                onClick={() => setShowHelpModal(true)}
                className="hidden md:flex w-9 h-9 items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                title={t("business.openGuideDocs", "Help & Documentation")}
                aria-label="Help & Documentation"
              >
                <HelpCircle className="w-[18px] h-[18px]" />
              </button>

              {/* Mobile Alerts Bell */}
              <button
                type="button"
                onClick={() => setActiveTab('notifications')}
                className={`md:hidden relative w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer active:scale-95 ${
                  activeTab === 'notifications'
                    ? 'bg-white/[0.12] text-white'
                    : 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
                }`}
                aria-label="Alerts"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadBusinessNotifsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E8C78A] ring-2 ring-[#050506]" />
                )}
              </button>

              {/* Mobile Business Sheet Trigger */}
              <button
                type="button"
                onClick={() => setIsMobileBizMenuOpen(true)}
                className="md:hidden w-9 h-9 rounded-full text-zinc-200 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                aria-label="Open business menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Desktop Account Control Popover */}
              <div className="relative hidden md:block" ref={accountDropdownRef}>
                <button
                  type="button"
                  id="biz-header-account-trigger"
                  onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                  className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 border border-white/[0.12] transition-all shrink-0 cursor-pointer flex items-center justify-center p-0.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/20 overflow-hidden"
                  title={`${currentPlace.name} - Account`}
                >
                  <CopoBrandLogo
                    domain={currentPlace.website || currentPlace.id}
                    name={currentPlace.name}
                    logoUrl={profileLogoUrl || currentPlace.logoUrl}
                    className="w-full h-full rounded-full bg-[#050506] flex items-center justify-center shrink-0 overflow-hidden"
                    imageClassName="w-full h-full object-contain rounded-full"
                    fallbackTextClassName="font-semibold text-xs text-white"
                  />
                </button>

                {/* Business Account Popover */}
                {showAccountDropdown && (
                  <>
                    <div
                      className="fixed inset-0 bg-black/45 z-[190]"
                      onClick={() => setShowAccountDropdown(false)}
                    />
                    <div className="absolute top-full right-0 mt-2 w-[280px] bg-[#0B0B0E]/96 backdrop-blur-2xl rounded-2xl border border-white/[0.1] text-white shadow-[0_24px_60px_rgba(0,0,0,0.85)] py-1.5 z-[200] animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/[0.07]">
                        <div className="flex items-center gap-3">
                          <CopoBrandLogo
                            domain={currentPlace.website || currentPlace.id}
                            name={currentPlace.name}
                            logoUrl={profileLogoUrl || currentPlace.logoUrl}
                            className="w-9 h-9 rounded-xl border border-white/[0.1] bg-white/[0.05] flex items-center justify-center shrink-0 overflow-hidden p-1"
                            imageClassName="w-full h-full object-contain rounded-lg"
                            fallbackTextClassName="font-semibold text-xs text-white"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-white text-[13.5px] truncate">{currentPlace.name}</span>
                              <BadgeCheck className="w-3.5 h-3.5 text-[#E8C78A] shrink-0" />
                            </div>
                            <div className="text-[11.5px] text-zinc-400 truncate mt-0.5">
                              {cleanBusinessDomain} · {isPremium ? 'Premium' : 'Free'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAccountDropdown(false);
                            setActiveTab('membership');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.06] transition-colors text-left text-[13px] font-medium text-zinc-200 cursor-pointer"
                        >
                          <Zap className="w-4 h-4 text-[#E8C78A] shrink-0" />
                          <span>Plans &amp; Membership</span>
                          <span className="ml-auto text-[11px] font-medium text-zinc-400">
                            {isPremium ? 'Pro' : 'Upgrade'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowAccountDropdown(false);
                            setActiveTab('profile');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.06] transition-colors text-left text-[13px] font-medium text-zinc-200 cursor-pointer"
                        >
                          <Settings className="w-4 h-4 text-zinc-400 shrink-0" />
                          <span>Workspace Settings</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowAccountDropdown(false);
                            setIsClaiming(true);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.06] transition-colors text-left text-[13px] font-medium text-zinc-200 cursor-pointer"
                        >
                          <Building2 className="w-4 h-4 text-zinc-400 shrink-0" />
                          <span>Switch Business</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowAccountDropdown(false);
                            const targetId = selectedPlaceId || currentPlace?.id || 'yoouz.com';
                            if (onOpenPlaceDrawer) {
                              onOpenPlaceDrawer(targetId);
                            } else {
                              window.location.href = `/reviews/${targetId}`;
                            }
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.06] transition-colors text-left text-[13px] font-medium text-zinc-200 cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4 text-zinc-400 shrink-0" />
                          <span>View Public Profile</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowAccountDropdown(false);
                            onNavigate('home');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.06] transition-colors text-left text-[13px] font-medium text-zinc-200 cursor-pointer"
                        >
                          <Home className="w-4 h-4 text-zinc-400 shrink-0" />
                          <span>Consumer Feed</span>
                        </button>
                      </div>

                      <div className="h-px bg-white/[0.07] my-1" />

                      <button
                        type="button"
                        onClick={() => {
                          setShowAccountDropdown(false);
                          localStorage.removeItem('copo_business_verified_session');
                          window.dispatchEvent(new CustomEvent('copo_business_auth_changed', { detail: null }));
                          setVerifiedBusinessSession(null);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.06] transition-colors text-left text-[13px] font-medium text-zinc-400 hover:text-white cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-zinc-500 shrink-0" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Center/Right Workspace Main Scroll Area */}
          <main
            ref={mainScrollRef}
            className="flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain bg-[#050506] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 pb-[calc(env(safe-area-inset-bottom,16px)+96px)] md:pb-12 no-scrollbar scroll-smooth w-full max-w-full"
          >
            <div className="max-w-[1120px] mx-auto space-y-6 w-full max-w-full overflow-x-hidden">

            {showEmbedTester ? (
              <div className="animate-in fade-in duration-300">
                <CopoTestEmbedView
                  places={places}
                  videos={videos}
                  onExit={() => setShowEmbedTester(false)}
                  restrictToPlace={currentPlace || undefined}
                />
              </div>
            ) : (
              <>
                {/* TAB 1: OVERVIEW & INSIGHTS */}
                {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-200">

                {/* Clean Editorial Header + Date Range Segmented Control */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <h1 className="text-[26px] sm:text-[32px] font-semibold text-white tracking-[-0.03em] leading-[1.12] truncate">
                        {currentPlace.name}
                      </h1>
                      <BadgeCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#E8C78A] shrink-0" aria-label="Verified Business" />
                    </div>
                    <p className="text-xs sm:text-[13px] text-zinc-400">
                      Verified business · {cleanBusinessDomain} · {dateRangeLabel}
                    </p>
                  </div>

                  {/* Compact Segmented Date Filter */}
                  <div className="flex items-center bg-white/[0.04] p-1 rounded-xl border border-white/[0.08] w-full sm:w-auto shrink-0">
                    {([
                      { id: '7d', short: '7D', full: '7 Days' },
                      { id: '30d', short: '30D', full: '30 Days' },
                      { id: '90d', short: '90D', full: '90 Days' },
                      { id: 'ytd', short: 'All', full: 'All Time' },
                    ] as const).map((range) => {
                      const active = analyticsDateRange === range.id;
                      return (
                        <button
                          key={range.id}
                          type="button"
                          onClick={() => setAnalyticsDateRange(range.id)}
                          className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center min-h-[34px] ${
                            active
                              ? 'bg-white text-zinc-950 shadow-xs'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          <span className="sm:hidden">{range.short}</span>
                          <span className="hidden sm:inline">{range.full}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Unified 3-Column KPI Metric Strip (Zero Pills, Zero Fake Sparklines) */}
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.07] overflow-hidden">
                  {[
                    {
                      key: 'views' as const,
                      label: t('business.kpiImpressions', 'Photo Review Impressions'),
                      value: totalViews.toLocaleString(),
                      meta: `${dateRangeLabel} across Yoouz`,
                      icon: Eye,
                      iconColor: 'text-zinc-400',
                    },
                    {
                      key: 'reviews' as const,
                      label: t('business.kpiReviews', 'Verified Photo Reviews'),
                      value: totalReviews.toLocaleString(),
                      meta: `${placeVideos.length} total live ${placeVideos.length === 1 ? 'review' : 'reviews'}`,
                      icon: Camera,
                      iconColor: 'text-zinc-400',
                    },
                    {
                      key: 'rating' as const,
                      label: t('business.kpiRating', 'Overall Rating'),
                      value: avgRating.toString(),
                      meta: placeVideos.length > 0 ? `Based on ${placeVideos.length} verified ${placeVideos.length === 1 ? 'review' : 'reviews'}` : 'Ready for first customer review',
                      icon: Star,
                      iconColor: 'text-[#E8C78A]',
                    },
                  ].map((stat) => {
                    const isSelected = selectedChartMetric === stat.key;
                    const Icon = stat.icon;
                    return (
                      <button
                        key={stat.key}
                        type="button"
                        onClick={() => handleSelectMetric(stat.key)}
                        className={`relative p-5 sm:p-6 text-left transition-colors cursor-pointer flex flex-col justify-between gap-4 min-h-[124px] ${
                          isSelected
                            ? 'bg-white/[0.045]'
                            : 'hover:bg-white/[0.025]'
                        }`}
                      >
                        {/* Crisp Active Top Hairline Indicator */}
                        {isSelected && (
                          <span className="absolute inset-x-0 top-0 h-[2px] bg-white" />
                        )}

                        <div className="flex items-center justify-between gap-2 w-full">
                          <span className={`text-xs font-medium ${isSelected ? 'text-zinc-200' : 'text-zinc-400'}`}>
                            {stat.label}
                          </span>
                          <Icon className={`w-4 h-4 shrink-0 ${stat.key === 'rating' ? 'text-[#E8C78A]' : isSelected ? 'text-white' : stat.iconColor}`} />
                        </div>

                        <div className="space-y-1">
                          <div className="text-[30px] sm:text-[34px] font-semibold text-white tracking-[-0.03em] tabular-nums leading-none flex items-center gap-2">
                            <span>{stat.value}</span>
                            {stat.key === 'rating' && (
                              <Star className="w-5 h-5 text-[#E8C78A] fill-[#E8C78A] shrink-0" />
                            )}
                          </div>
                          <div className="text-[11.5px] text-zinc-500 tabular-nums">
                            {stat.meta}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Interactive Performance Area Chart (Apple Stocks / Stripe Precision) */}
                <div
                  ref={chartSectionRef}
                  className="bg-white/[0.03] rounded-2xl border border-white/[0.08] text-white p-5 sm:p-6 flex flex-col justify-between scroll-mt-4"
                >
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                      <div>
                        <h2 className="text-[15px] sm:text-base font-semibold text-white tracking-[-0.015em]">
                          {selectedChartMetric === 'views' && 'Photo Review Impressions'}
                          {selectedChartMetric === 'reviews' && 'Verified Photo Reviews'}
                          {selectedChartMetric === 'rating' && 'Overall Venue Rating'}
                        </h2>
                        <p className="text-xs text-zinc-400 mt-0.5 tabular-nums">
                          {chartData.total.toLocaleString()} {chartData.unit} · {dateRangeLabel}
                        </p>
                      </div>

                      {/* Segmented Metric Selector */}
                      <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.08] self-stretch sm:self-auto w-full sm:w-auto">
                        {(['views', 'reviews', 'rating'] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => handleSelectMetric(m)}
                            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center min-h-[32px] ${
                              selectedChartMetric === m
                                ? 'bg-white text-zinc-950 shadow-xs'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            {m === 'views' ? 'Impressions' : m === 'reviews' ? 'Reviews' : 'Rating'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Chart Viewport with Smooth Scrubbing (Pointer + Touch) */}
                    {(() => {
                      const pts = chartData.points.length > 0 ? chartData.points : [0, 0];
                      const maxVal = Math.max(...pts, selectedChartMetric === 'rating' ? 5 : 1);
                      const minVal = 0;
                      const range = maxVal - minVal || 1;
                      const denom = Math.max(1, pts.length - 1);

                      const coordinates = pts.map((val, idx) => {
                        const x = (idx / denom) * 680 + 10;
                        const y = 178 - ((val - minVal) / range) * 144;
                        return { x, y, val };
                      });

                      let pathD = `M ${coordinates[0].x} ${coordinates[0].y}`;
                      for (let i = 0; i < coordinates.length - 1; i++) {
                        const curr = coordinates[i];
                        const next = coordinates[i + 1];
                        const cpX1 = curr.x + (next.x - curr.x) / 2;
                        const cpY1 = curr.y;
                        const cpX2 = curr.x + (next.x - curr.x) / 2;
                        const cpY2 = next.y;
                        pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
                      }

                      const areaD = `${pathD} L ${coordinates[coordinates.length - 1].x} 190 L ${coordinates[0].x} 190 Z`;
                      const activeIdx = hoveredChartPoint !== null && hoveredChartPoint < coordinates.length ? hoveredChartPoint : null;
                      const activeCoord = activeIdx !== null ? coordinates[activeIdx] : null;
                      const midLabel = selectedChartMetric === 'rating'
                        ? (maxVal / 2).toFixed(1)
                        : Math.round(maxVal / 2).toLocaleString();
                      const topLabel = selectedChartMetric === 'rating'
                        ? maxVal.toFixed(1)
                        : Math.round(maxVal).toLocaleString();

                      const handleScrubClientX = (clientX: number, rect: DOMRect) => {
                        const relX = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)));
                        const idx = Math.round(relX * denom);
                        setHoveredChartPoint(idx);
                      };

                      const tickIndices = [
                        0,
                        Math.floor(denom * 0.25),
                        Math.floor(denom * 0.5),
                        Math.floor(denom * 0.75),
                        denom,
                      ];

                      return (
                        <>
                          <div
                            className="relative w-full h-52 sm:h-64 select-none pt-2 touch-pan-y cursor-crosshair"
                            onMouseMove={(e) => handleScrubClientX(e.clientX, e.currentTarget.getBoundingClientRect())}
                            onMouseLeave={() => setHoveredChartPoint(null)}
                            onTouchStart={(e) => {
                              const touch = e.touches[0];
                              if (touch) handleScrubClientX(touch.clientX, e.currentTarget.getBoundingClientRect());
                            }}
                            onTouchMove={(e) => {
                              const touch = e.touches[0];
                              if (touch) handleScrubClientX(touch.clientX, e.currentTarget.getBoundingClientRect());
                            }}
                            onTouchEnd={() => setHoveredChartPoint(null)}
                          >
                            {/* Quiet Y-Axis Scale Labels */}
                            <div className="absolute inset-y-2 left-0 flex flex-col justify-between text-[10px] text-zinc-600 tabular-nums pointer-events-none z-10">
                              <span>{topLabel}</span>
                              <span>{midLabel}</span>
                              <span>0</span>
                            </div>

                            {/* Hover / Touch Scrubbing Tooltip */}
                            {activeIdx !== null && (
                              <div
                                className="absolute top-0 transform -translate-x-1/2 bg-[#111114]/95 backdrop-blur-xl text-white rounded-xl px-3 py-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.7)] border border-white/[0.12] pointer-events-none z-30 flex flex-col items-center text-xs"
                                style={{
                                  left: `${Math.min(88, Math.max(12, (activeIdx / denom) * 92 + 4))}%`
                                }}
                              >
                                <span className="font-semibold text-[13px] text-white tabular-nums whitespace-nowrap">
                                  {pts[activeIdx].toLocaleString()} {chartData.unit}
                                </span>
                                <span className="text-[10.5px] text-zinc-400 whitespace-nowrap">
                                  {chartData.labels[activeIdx] || ''}
                                </span>
                              </div>
                            )}

                            <svg
                              viewBox="0 0 700 200"
                              className="w-full h-full overflow-visible"
                              preserveAspectRatio="none"
                            >
                              <defs>
                                <linearGradient id="metricGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor={selectedChartMetric === 'rating' ? '#E8C78A' : '#FFFFFF'} stopOpacity="0.18" />
                                  <stop offset="100%" stopColor={selectedChartMetric === 'rating' ? '#E8C78A' : '#FFFFFF'} stopOpacity="0.0" />
                                </linearGradient>
                              </defs>

                              {/* Subtle Horizontal Gridlines */}
                              <line x1="0" y1="34" x2="700" y2="34" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                              <line x1="0" y1="106" x2="700" y2="106" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                              <line x1="0" y1="178" x2="700" y2="178" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

                              {/* Gradient Area */}
                              <path d={areaD} fill="url(#metricGradient)" />

                              {/* Precision Curve */}
                              <path
                                d={pathD}
                                fill="none"
                                stroke={selectedChartMetric === 'rating' ? '#E8C78A' : '#FFFFFF'}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />

                              {/* Vertical Hairline Crosshair + Active Point ONLY when scrubbing/hovering */}
                              {activeCoord && (
                                <g>
                                  <line
                                    x1={activeCoord.x}
                                    y1="24"
                                    x2={activeCoord.x}
                                    y2="190"
                                    stroke="rgba(255,255,255,0.22)"
                                    strokeDasharray="3 3"
                                    strokeWidth="1"
                                  />
                                  <circle
                                    cx={activeCoord.x}
                                    cy={activeCoord.y}
                                    r={5}
                                    fill="#050506"
                                    stroke={selectedChartMetric === 'rating' ? '#E8C78A' : '#FFFFFF'}
                                    strokeWidth={2.5}
                                  />
                                </g>
                              )}
                            </svg>
                          </div>

                          {/* Dynamic X-Axis Labels */}
                          <div className="flex justify-between text-[11px] text-zinc-500 mt-2 pt-2.5 border-t border-white/[0.06] tabular-nums">
                            {tickIndices.map((tIdx, i) => (
                              <span key={i} className={i === 1 || i === 3 ? 'hidden sm:inline' : ''}>
                                {chartData.labels[tIdx] || (i === 4 ? 'Today' : '')}
                              </span>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Quick Workspace Actions Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      tab: 'reviews' as BusinessTab,
                      icon: Camera,
                      title: 'Photo Reviews',
                      desc: placeVideos.length > 0 ? `Reply & export from ${placeVideos.length} live ${placeVideos.length === 1 ? 'review' : 'reviews'}` : 'View and reply to customer reviews',
                    },
                    {
                      tab: 'qr_invites' as BusinessTab,
                      icon: QrCode,
                      title: 'QR Table Standee',
                      desc: 'Print or share your live scan card',
                    },
                    {
                      tab: 'embed' as BusinessTab,
                      icon: Code,
                      title: 'Website Embed',
                      desc: 'Add verified photo proof to your site',
                    },
                  ].map((action) => (
                    <button
                      key={action.tab}
                      type="button"
                      onClick={() => setActiveTab(action.tab)}
                      className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.055] border border-white/[0.08] hover:border-white/[0.15] transition-all text-left flex items-center gap-3.5 cursor-pointer group active:scale-[0.99]"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0 text-zinc-200 group-hover:text-white">
                        <action.icon className="w-[18px] h-[18px]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-semibold text-white truncate">
                          {action.title}
                        </div>
                        <div className="text-xs text-zinc-400 truncate mt-0.5">
                          {action.desc}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* TAB 2: PHOTO REVIEWS & MODERATION */}
            {activeTab === 'reviews' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Widget Notice Alert Toast */}
                {widgetNotice && (
                  <div className="bg-[#101014] text-white text-xs font-medium px-4 py-3 rounded-2xl border border-white/[0.1] flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <span className="flex items-center gap-2 min-w-0">
                      <Eye className="w-4 h-4 text-[#E8C78A] shrink-0" />
                      <span className="truncate">{widgetNotice}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('embed')}
                      className="text-white hover:underline text-xs font-semibold cursor-pointer shrink-0"
                    >
                      View embed →
                    </button>
                  </div>
                )}

                {/* Editorial Header + Inline Controls */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <h1 className="text-[26px] sm:text-[32px] font-semibold text-white tracking-[-0.03em] leading-[1.12]">
                      Customer Photo Reviews
                    </h1>
                    <p className="text-xs sm:text-[13px] text-zinc-400 tabular-nums">
                      {placeVideos.length} live camera {placeVideos.length === 1 ? 'review' : 'reviews'} displayed on your profile and website embed.
                    </p>
                  </div>

                  {/* Search, Filter and Mark Reviewed Toolbar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
                    <div className="relative flex-1 w-full sm:w-56">
                      <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={reviewsSearchQuery}
                        onChange={(e) => setReviewsSearchQuery(e.target.value)}
                        placeholder="Search reviews..."
                        className="w-full h-10 pl-10 pr-8 bg-white/[0.04] focus:bg-white/[0.065] border border-white/[0.08] focus:border-white/25 rounded-xl text-[16px] sm:text-[13px] text-white placeholder-zinc-500 focus:outline-hidden transition-all"
                      />
                      {reviewsSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setReviewsSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 cursor-pointer"
                          aria-label="Clear search"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
                      <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.08] shrink-0">
                        {(['all', '5', '4'] as const).map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setReviewsFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[32px] ${
                              reviewsFilter === f ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            {f === 'all' ? 'All' : `${f}★`}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        id="btn-clear-reviews-badge"
                        onClick={handleMarkReviewsAsRead}
                        className="h-10 px-3.5 rounded-xl text-xs font-medium bg-white/[0.04] hover:bg-white/[0.09] text-zinc-300 hover:text-white border border-white/[0.08] transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-95 whitespace-nowrap"
                        title="Mark all reviews as reviewed"
                      >
                        <CheckCheck className="w-3.5 h-3.5 text-[#E8C78A]" />
                        <span>{unseenReviewsCount > 0 ? `Mark read (${unseenReviewsCount})` : 'Reviewed'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Reviews List */}
                {(() => {
                  const filteredReviews = placeVideos.filter((v) => {
                    if (reviewsSearchQuery.trim()) {
                      const q = reviewsSearchQuery.toLowerCase();
                      const matchName = v.author?.name?.toLowerCase().includes(q);
                      const matchCaption = v.caption?.toLowerCase().includes(q);
                      const matchDish = (v as any).dishOrItem?.toLowerCase().includes(q);
                      if (!matchName && !matchCaption && !matchDish) return false;
                    }
                    if (reviewsFilter === '5') return (v.rating || 5) === 5;
                    if (reviewsFilter === '4') return (v.rating || 5) === 4;
                    return true;
                  });

                  if (filteredReviews.length === 0) {
                    return (
                      <div className="p-10 sm:p-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-center space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.09] text-zinc-300 flex items-center justify-center mx-auto">
                          <Camera className="w-5 h-5" />
                        </div>
                        <div className="space-y-1 max-w-sm mx-auto">
                          <h3 className="text-sm sm:text-base font-semibold text-white">
                            {reviewsSearchQuery || reviewsFilter !== 'all'
                              ? 'No matching photo reviews'
                              : 'No customer photo reviews yet'}
                          </h3>
                          <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed">
                            {reviewsSearchQuery || reviewsFilter !== 'all'
                              ? 'Try adjusting your search or rating filter.'
                              : 'Place your QR standee at checkout or share your review link to collect verified live camera reviews.'}
                          </p>
                        </div>
                        {!reviewsSearchQuery && reviewsFilter === 'all' && (
                          <button
                            type="button"
                            onClick={() => setActiveTab('qr_invites')}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <QrCode className="w-4 h-4" />
                            <span>Open QR Standee</span>
                          </button>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3.5 w-full max-w-full overflow-hidden">
                      {filteredReviews.map((video) => {
                      const hasReply = Boolean(ownerReplies[video.id]);
                      const isReplying = activeReplyId === video.id;
                      const isHidden = hiddenVideoIds.includes(video.id);

                      const authorInfoJSX = (
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenCreator && video.author) {
                              onOpenCreator(video.author);
                            }
                          }}
                          className="flex items-start gap-3 text-left group cursor-pointer hover:opacity-95 transition-opacity min-w-0 w-full"
                          title={`View ${video.author?.name || 'Customer'}'s Profile`}
                        >
                          <img
                            src={getSafeAvatarUrl(video.author?.avatar, video.author?.name, video.author?.handle)}
                            alt={video.author?.name}
                            className="w-10 h-10 rounded-full object-cover ring-1 ring-white/[0.12] shrink-0"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.src = getSafeAvatarUrl(null, video.author?.name, video.author?.handle);
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-white group-hover:text-zinc-200 transition-colors truncate">
                                {video.author?.name || 'Customer Review'}
                              </span>
                              {isHidden && (
                                <span className="text-[11px] font-medium text-zinc-500 flex items-center gap-1 shrink-0">
                                  <EyeOff className="w-3 h-3" /> Hidden
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-zinc-400 flex-wrap">
                              <CopoStarRating
                                rating={Math.max(1, Math.min(5, Math.round(video.rating || 5)))}
                                roundToWhole={true}
                                starClassName="w-3 h-3 sm:w-3.5 sm:h-3.5"
                                filledColorClass="fill-[#E8C78A] text-[#E8C78A]"
                                emptyColorClass="fill-zinc-900/90 text-zinc-600"
                              />
                              <span className="text-zinc-600">·</span>
                              <span className="tabular-nums">{formatRecordedDate(video.recordedAt, video.createdAtMs)}</span>
                              {video.dishOrItem && (
                                <>
                                  <span className="text-zinc-600">·</span>
                                  <span className="text-zinc-300 truncate max-w-[160px]">
                                    {video.dishOrItem}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      );

                      return (
                        <div
                          key={video.id}
                          className={`rounded-2xl border p-4 sm:p-5 transition-colors w-full max-w-full overflow-hidden ${
                            isHidden
                              ? 'border-white/[0.06] opacity-60 bg-white/[0.02] text-zinc-200'
                              : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.14] text-white'
                          }`}
                        >
                          <div className="flex flex-col gap-4 w-full">
                            {/* Author Header */}
                            <div className="flex items-center justify-between gap-3 w-full border-b border-white/[0.07] pb-3.5">
                              {authorInfoJSX}
                            </div>

                            {/* Photo Viewport + Review Caption */}
                            <div className="flex flex-col sm:flex-row gap-4 items-start w-full">
                              <div
                                onClick={() => handleOpenBusinessVideo(video)}
                                className="w-full sm:w-32 md:w-36 aspect-9/14 shrink-0 relative rounded-xl overflow-hidden bg-[#0a0a0d] border border-white/[0.1] cursor-pointer group"
                                title="Click to view photo review"
                              >
                                <img
                                  src={video.photoUrl || video.thumbnailUrl || getSafeAvatarUrl(video.author?.avatar, video.author?.name, video.author?.handle)}
                                  alt={video.dishOrItem || 'Photo Review'}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    const target = e.currentTarget as HTMLImageElement;
                                    target.src = getSafeAvatarUrl(null, video.author?.name, video.author?.handle);
                                  }}
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-2.5 text-white">
                                  <span className="text-[11px] font-semibold text-white block line-clamp-1">
                                    {video.dishOrItem || 'Live photo proof'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex-1 min-w-0 space-y-3 w-full">
                                <p className="text-[13px] sm:text-sm text-zinc-200 leading-relaxed">
                                  {video.caption ? `"${video.caption}"` : `Live camera photo proof rated ${Math.max(1, Math.min(5, Math.round(video.rating || 5)))}/5 stars.`}
                                </p>

                                {/* Action Buttons Row */}
                                <div className="flex items-center gap-2 flex-wrap pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadVideoForAds(video)}
                                    className="px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.1] min-h-[38px]"
                                    title="Export branded photo review card for social media & web"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Export card</span>
                                  </button>

                                  {!hasReply && !isReplying && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveReplyId(video.id);
                                        setReplyText('');
                                      }}
                                      className="px-4 py-2 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px]"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                      <span>Reply</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                              {/* Existing Owner Reply */}
                              {hasReply && !isReplying && (
                                <div className="bg-white/[0.04] border border-white/[0.09] rounded-2xl p-3.5">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                                      <BadgeCheck className="w-3.5 h-3.5 text-[#E8C78A]" />
                                      <span>Response from {currentPlace.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => {
                                          setReplyText(ownerReplies[video.id]);
                                          setActiveReplyId(video.id);
                                        }}
                                        className="text-[11px] font-semibold text-zinc-200 hover:text-white cursor-pointer"
                                      >
                                        Edit
                                      </button>
                                      <span className="text-zinc-600">•</span>
                                      <button
                                        onClick={() => handleDeleteReply(video.id)}
                                        className="text-[11px] font-semibold text-zinc-200 hover:text-red-400 cursor-pointer"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-xs text-zinc-200 leading-relaxed">
                                    {ownerReplies[video.id]}
                                  </p>
                                </div>
                              )}

                              {/* Owner Reply Input Box */}
                              {isReplying && (
                                <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.08] space-y-3 animate-in fade-in">
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-semibold text-white">Reply as {currentPlace.name}</span>
                                      <span className="text-[11px] text-zinc-400 font-medium hidden sm:inline">Quick Response Templates</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <button
                                        type="button"
                                        onClick={() => setReplyText("Thank you so much for visiting us and sharing your kind review! We're thrilled you had a great experience.")}
                                        className="px-3 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 hover:text-white border border-white/[0.09] text-[11px] font-medium transition-all cursor-pointer active:scale-95"
                                      >
                                        + Thank Guest
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setReplyText("Thanks for visiting! We look forward to welcoming you back again very soon.")}
                                        className="px-3 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 hover:text-white border border-white/[0.09] text-[11px] font-medium transition-all cursor-pointer active:scale-95"
                                      >
                                        + Invite Back
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setReplyText(`We sincerely apologize that your experience fell short of our standards. Please message us directly here on Yoouz so our team can address your concerns and make things right for you.`)}
                                        className="px-3 py-1 rounded-full bg-[#E8C78A]/10 hover:bg-[#E8C78A]/20 text-[#E8C78A] border border-[#E8C78A]/25 text-[11px] font-medium transition-all cursor-pointer active:scale-95"
                                      >
                                        + Apologize & Resolve
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setReplyText("Thank you for your constructive feedback! Our team is constantly striving to improve and we hope to make your next visit even better.")}
                                        className="px-3 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 hover:text-white border border-white/[0.09] text-[11px] font-medium transition-all cursor-pointer active:scale-95"
                                      >
                                        + Value Feedback
                                      </button>
                                    </div>
                                  </div>
                                  <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Thank your customer or share upcoming specials..."
                                    rows={3}
                                    className="w-full bg-white/[0.04] border border-white/[0.09] rounded-2xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-white/25 transition-all"
                                  />
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        setActiveReplyId(null);
                                        setReplyText('');
                                      }}
                                      className="px-4 py-1.5 rounded-full text-xs font-medium text-zinc-300 hover:bg-white/[0.08] transition-colors cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleSaveReply(video.id)}
                                      disabled={!replyText.trim()}
                                      className="px-4 py-1.5 rounded-full bg-white hover:bg-zinc-200 disabled:bg-white/[0.08] disabled:text-zinc-500 text-zinc-950 text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <Send className="w-3.5 h-3.5" /> Publish Response
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Customer Comments Toggle Section */}
                              <div className="pt-2 border-t border-white/[0.07]">
                                <button
                                  onClick={() => {
                                    setExpandedCommentsMap(prev => ({
                                      ...prev,
                                      [video.id]: !prev[video.id]
                                    }));
                                  }}
                                  className="text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-zinc-400" />
                                  <span className="tabular-nums">
                                    {expandedCommentsMap[video.id] ? 'Hide' : 'View'} Customer Comments ({video.commentsCount || video.comments?.length || 0})
                                  </span>
                                </button>

                                {expandedCommentsMap[video.id] && (
                                  <div className="mt-3 space-y-2.5 bg-white/[0.025] p-4 rounded-2xl border border-white/[0.07]">
                                    {(!video.comments || video.comments.length === 0) ? (
                                      <p className="text-xs text-zinc-400">No customer comments yet on this review.</p>
                                    ) : (
                                      video.comments.map((comment) => (
                                        <div key={comment.id} className="flex items-start gap-3 bg-white/[0.03] p-3 rounded-2xl border border-white/[0.06]">
                                          <img
                                            src={getSafeAvatarUrl(comment.authorAvatar, comment.authorName, comment.authorHandle || comment.authorName)}
                                            alt={comment.authorName}
                                            className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-white/[0.1]"
                                            referrerPolicy="no-referrer"
                                            onError={(e) => {
                                              const target = e.currentTarget as HTMLImageElement;
                                              target.src = getSafeAvatarUrl(null, comment.authorName, comment.authorHandle || comment.authorName);
                                            }} 
                                          />
                                          <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-semibold text-white">{comment.authorName}</span>
                                                {comment.isOwner && (
                                                  <span className="bg-white/[0.08] text-[#E8C78A] text-[10px] font-medium px-2 py-0.5 rounded-full border border-white/[0.1]">Owner</span>
                                                )}
                                              </div>
                                              <span className="text-[10.5px] text-zinc-400">{comment.createdAt || 'Recently'}</span>
                                            </div>
                                            <p className="text-xs text-zinc-300 leading-relaxed">{comment.text}</p>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                      );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            
            {/* INBOX TAB */}
            {activeTab === 'inbox' && (
              <div className="w-full max-w-[1120px] h-[calc(100dvh-168px)] md:h-[calc(100dvh-128px)] bg-[#050506] sm:bg-white/[0.02] rounded-2xl border border-white/[0.08] overflow-hidden animate-in fade-in duration-200 flex flex-col">
                <CopoMessagesView
                  messages={businessMessages}
                  currentUser={effectiveUser}
                  places={places}
                  userVideos={placeVideos}
                  allVideos={videos}
                  allUsers={allUsers}
                  onSendMessage={async (threadId, text, recipient, videoUrl, customVideoId, customMessageId, customCreatedAt, cardData) => {
                    if (!isPremium) {
                      setPremiumTriggerFeature('direct_messages');
                      setIsPremiumModalOpen(true);
                      return;
                    }
                    if (onSendMessage) {
                      await onSendMessage(threadId, text, recipient, videoUrl, customVideoId, customMessageId, customCreatedAt, cardData);
                    }
                  }}
                  onDeleteThread={(threadId, targetPartnerKey) => {
                    deleteChatThreadFromBunnyDB(threadId, effectiveUser, targetPartnerKey);
                    if (onDeleteThread) {
                      onDeleteThread(threadId, targetPartnerKey);
                    }
                  }}
                  onMarkThreadRead={onMarkThreadRead}
                  onUpdateMessages={(updatedBizMessages) => {
                    if (onUpdateMessages) {
                      const updatedIds = new Set(updatedBizMessages.map(m => m.id));
                      const otherMessages = (messages || []).filter(m => !updatedIds.has(m.id));
                      onUpdateMessages([...updatedBizMessages, ...otherMessages]);
                    }
                  }}
                  onSelectVideo={onSelectVideo}
                  onSelectPlace={onOpenPlaceDrawer}
                  onOpenCreator={onOpenCreator}
                  selectedThreadId={targetThreadId}
                  onSelectThreadId={setTargetThreadId}
                  onNavigateHome={() => setActiveTab('overview')}
                  onNavigateToNotifications={() => setActiveTab('notifications')}
                  unreadNotifsCount={unreadBusinessNotifsCount}
                  blockedUserIds={blockedUserIds}
                  onBlockUser={onBlockUser}
                  onUnblockUser={onUnblockUser}
                  onOpenReport={onOpenReport}
                />
              </div>
            )}

            {/* FOLLOWING & FOLLOWERS TAB (Flagship Obsidian) */}
            {activeTab === 'followers' && (
              <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in duration-200">
                {/* Editorial Header */}
                <div className="space-y-1">
                  <h1 className="text-[26px] sm:text-[32px] font-semibold text-white tracking-[-0.03em] leading-[1.12]">
                    Followers
                  </h1>
                  <p className="text-xs sm:text-[13px] text-zinc-400">
                    Connect with reviewers following {currentPlace.name} and manage your network.
                  </p>
                </div>

                {/* Segmented Toggle */}
                <div className="grid grid-cols-2 p-1 bg-white/[0.04] rounded-xl border border-white/[0.08] gap-1">
                  <button
                    type="button"
                    onClick={() => setBusinessActiveTabSegment('following')}
                    className={`py-2 px-4 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[38px] ${
                      businessActiveTabSegment === 'following'
                        ? 'bg-white text-zinc-950 shadow-xs'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>Following</span>
                    <span className={`text-[11px] font-semibold tabular-nums ${
                      businessActiveTabSegment === 'following' ? 'text-zinc-700' : 'text-zinc-500'
                    }`}>
                      {totalBusinessFollowingCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBusinessActiveTabSegment('followers')}
                    className={`py-2 px-4 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[38px] ${
                      businessActiveTabSegment === 'followers'
                        ? 'bg-white text-zinc-950 shadow-xs'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>Followers</span>
                    <span className={`text-[11px] font-semibold tabular-nums ${
                      businessActiveTabSegment === 'followers' ? 'text-zinc-700' : 'text-zinc-500'
                    }`}>
                      {businessFollowers.length}
                      {unseenFollowersCount > 0 && ` (+${unseenFollowersCount})`}
                    </span>
                  </button>
                </div>

                {/* Search Bar (16px on mobile for zero iOS zoom) */}
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={followerSearchQuery}
                    onChange={(e) => setFollowerSearchQuery(e.target.value)}
                    placeholder={businessActiveTabSegment === 'following' ? "Search reviewers you follow..." : "Search your followers..."}
                    className="w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-9 text-[16px] sm:text-[13px] text-white placeholder-zinc-500 focus:outline-hidden focus:border-white/25 focus:bg-white/[0.065] transition-all"
                  />
                  {followerSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setFollowerSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer p-1 rounded-full hover:bg-white/[0.1] transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* LIST CONTENT: FOLLOWING SEGMENT */}
                {businessActiveTabSegment === 'following' ? (
                  <div className="space-y-4">
                    {filteredBusinessFollowingAuthors.length > 0 ? (
                      <div className="flex flex-col gap-2.5">
                        {filteredBusinessFollowingAuthors.map((author) => {
                          const isHovered = hoveredUnfollow === author.name;
                          return (
                            <div
                              key={`biz-followed-author-${author.name}`}
                              onClick={() => onOpenCreator?.(author)}
                              className="bg-white/[0.03] hover:bg-white/[0.055] rounded-[22px] border border-white/[0.08] hover:border-white/[0.16] p-4 transition-all flex items-center justify-between gap-3.5 group cursor-pointer"
                            >
                              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                <img
                                  src={getSafeAvatarUrl(author.avatar, author.name, (author as any).handle || author.name)}
                                  alt={author.name}
                                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover ring-1 ring-white/[0.12] shrink-0 group-hover:scale-105 transition-transform"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = getSafeAvatarUrl(null, author.name, (author as any).handle || author.name);
                                  }}
                                />
                                <div className="min-w-0 flex-1 text-left">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <h3 className="text-sm sm:text-[15px] font-semibold text-white truncate group-hover:text-zinc-200 transition-colors">
                                      {author.name}
                                    </h3>
                                    <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 border border-white/[0.08] text-[10px] font-medium shrink-0">
                                      Reviewer
                                    </span>
                                  </div>
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5 text-xs text-zinc-400 mt-0.5 min-w-0">
                                    <span className="shrink-0 text-zinc-300 tabular-nums">
                                      {author.videoReviewCount || 0} {(author.videoReviewCount === 1) ? 'photo review' : 'photo reviews'}
                                    </span>
                                    <span className="hidden sm:inline text-zinc-600 shrink-0">·</span>
                                    <span className="text-xs text-zinc-400 flex items-start sm:items-center gap-1 mt-0.5 sm:mt-0 whitespace-normal break-words leading-snug min-w-0">
                                      <MapPin className="w-3 h-3 text-zinc-500 shrink-0 mt-0.5 sm:mt-0" />
                                      <span className="whitespace-normal break-words">{author.location || 'Local Contributor'}</span>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onMouseEnter={() => setHoveredUnfollow(author.name)}
                                  onMouseLeave={() => setHoveredUnfollow(null)}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleBusinessFollowAuthor(author.name);
                                  }}
                                  className={`px-4 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                                    author.isFollowed
                                      ? (isHovered
                                          ? "bg-red-500/15 text-red-400 border border-red-500/30"
                                          : "bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 border border-white/[0.1]")
                                      : "bg-white hover:bg-zinc-200 text-zinc-950 border border-white"
                                  }`}
                                >
                                  {author.isFollowed ? (
                                    isHovered ? (
                                      <>
                                        <UserMinus className="w-3.5 h-3.5" />
                                        <span>Unfollow</span>
                                      </>
                                    ) : (
                                      <>
                                        <UserCheck className="w-3.5 h-3.5 text-zinc-300" />
                                        <span>Following</span>
                                      </>
                                    )
                                  ) : (
                                    <>
                                      <UserPlus className="w-3.5 h-3.5" />
                                      <span>Follow</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-10 sm:p-12 rounded-[24px] bg-white/[0.03] border border-white/[0.08] text-center text-zinc-400 space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/[0.09] text-white flex items-center justify-center mx-auto">
                          <Users className="w-5.5 h-5.5" />
                        </div>
                        <div className="space-y-1 max-w-sm mx-auto">
                          <p className="font-semibold text-white text-sm sm:text-base">
                            {followerSearchQuery ? "No matching reviewers found" : "Not following anyone yet"}
                          </p>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            {followerSearchQuery ? `No reviewer matches "${followerSearchQuery}". Try a different name.` : "Follow reviewers on Yoouz to build your business network."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* LIST CONTENT: FOLLOWERS SEGMENT */
                  filteredFollowers.length === 0 ? (
                    <div className="p-10 sm:p-12 rounded-[24px] bg-white/[0.03] border border-white/[0.08] text-center text-zinc-400 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/[0.09] text-white flex items-center justify-center mx-auto">
                        <Users className="w-5.5 h-5.5" />
                      </div>
                      <div className="space-y-1 max-w-sm mx-auto">
                        <p className="font-semibold text-white text-sm sm:text-base">
                          {followerSearchQuery ? "No matching followers found" : "No followers yet"}
                        </p>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          {followerSearchQuery
                            ? `No customer follower matches "${followerSearchQuery}". Try a different name.`
                            : "When customers and photo reviewers follow your business on Yoouz, they will appear here."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {filteredFollowers.map((follower) => {
                        const isHovered = hoveredUnfollow === follower.name;
                        return (
                          <div
                            key={`follower-${follower.id || follower.name}`}
                            onClick={() => onOpenCreator?.({ name: follower.name, avatar: getSafeAvatarUrl(follower.avatar, follower.name, (follower as any).handle || follower.name), id: follower.id } as any)}
                            className="bg-white/[0.03] hover:bg-white/[0.055] rounded-[22px] border border-white/[0.08] hover:border-white/[0.16] p-4 transition-all flex items-center justify-between gap-3.5 group cursor-pointer"
                          >
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              <div className="relative shrink-0">
                                <img
                                  src={getSafeAvatarUrl(follower.avatar, follower.name, (follower as any).handle || follower.name)}
                                  alt={follower.name}
                                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover ring-1 ring-white/[0.12] shrink-0 group-hover:scale-105 transition-transform"
                                  onError={(e) => {
                                    const target = e.currentTarget as HTMLImageElement;
                                    target.src = getSafeAvatarUrl(null, follower.name, (follower as any).handle || follower.name);
                                  }}
                                />
                                {follower.isReviewer && (
                                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#111114] flex items-center justify-center ring-2 ring-[#050506] text-[#E8C78A]" title="Verified Customer Reviewer">
                                    <Star className="w-2.5 h-2.5 fill-[#E8C78A] text-[#E8C78A]" />
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 flex-1 text-left">
                                <div className="flex items-center gap-2 min-w-0">
                                  <h3 className="text-sm sm:text-[15px] font-semibold text-white truncate group-hover:text-zinc-200 transition-colors">
                                    {follower.name}
                                  </h3>
                                  {follower.isReviewer && (
                                    <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 border border-white/[0.08] text-[10px] font-medium shrink-0 flex items-center gap-1">
                                      <span>Reviewer</span>
                                      {follower.rating && (
                                        <>
                                          <span className="text-zinc-500">·</span>
                                          <span className="flex items-center gap-0.5 text-zinc-200 font-semibold tabular-nums">
                                            <Star className="w-2.5 h-2.5 fill-[#E8C78A] text-[#E8C78A]" />
                                            {follower.rating.toFixed(1)}
                                          </span>
                                        </>
                                      )}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 text-xs text-zinc-400 truncate mt-0.5">
                                  <span className="shrink-0 text-zinc-300">
                                    {follower.location || 'Local Contributor'}
                                  </span>
                                  <span className="text-zinc-600">·</span>
                                  <span className="shrink-0 text-zinc-400 tabular-nums">
                                    {follower.reviewCount} {follower.reviewCount === 1 ? 'photo review' : 'photo reviews'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {onToggleFollow && (
                                <button
                                  onMouseEnter={() => setHoveredUnfollow(follower.name)}
                                  onMouseLeave={() => setHoveredUnfollow(null)}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleBusinessFollowAuthor(follower.name);
                                  }}
                                  className={`px-4 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                                    follower.isFollowedBack
                                      ? isHovered
                                        ? "bg-red-500/15 text-red-400 border border-red-500/30"
                                        : "bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 border border-white/[0.1]"
                                      : "bg-white hover:bg-zinc-200 text-zinc-950 border border-white"
                                  }`}
                                >
                                  {follower.isFollowedBack ? (
                                    isHovered ? (
                                      <>
                                        <UserMinus className="w-3.5 h-3.5" />
                                        <span>Unfollow</span>
                                      </>
                                    ) : (
                                      <>
                                        <UserCheck className="w-3.5 h-3.5 text-zinc-300" />
                                        <span>Following</span>
                                      </>
                                    )
                                  ) : (
                                    <>
                                      <UserPlus className="w-3.5 h-3.5" />
                                      <span>Follow</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </div>
            )}

            {/* NOTIFICATIONS TAB (Exact User Account Layout & Design Language) */}
            {activeTab === 'notifications' && (
              <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <CopoNotificationsView
                  notifications={businessNotifications}
                  currentUser={effectiveUser}
                  allVideos={placeVideos}
                  onSelectNotificationVideo={(videoId) => onSelectVideo?.(videoId)}
                  onNavigateToMessages={(targetKey) => {
                    setActiveTab('inbox');
                    if (targetKey) {
                      const tKeyLower = targetKey.toLowerCase().trim();
                      const found = businessMessages.find(m =>
                        (m.senderEmail && m.senderEmail.toLowerCase().includes(tKeyLower)) ||
                        (m.senderId && m.senderId.toLowerCase().includes(tKeyLower)) ||
                        (m.senderName && m.senderName.toLowerCase().includes(tKeyLower)) ||
                        (m.recipientEmail && m.recipientEmail.toLowerCase().includes(tKeyLower)) ||
                        (m.recipientId && m.recipientId.toLowerCase().includes(tKeyLower)) ||
                        (m.recipientName && m.recipientName.toLowerCase().includes(tKeyLower)) ||
                        (Array.isArray(m.participants) && m.participants.some(p => p && p.toLowerCase().includes(tKeyLower))) ||
                        m.id.toLowerCase().includes(tKeyLower)
                      );
                      if (found) {
                        setTargetThreadId(found.id);
                      }
                    }
                  }}
                  onNavigateHome={() => setActiveTab('overview')}
                  onMarkRead={(id) => onMarkNotificationRead?.(id)}
                  onMarkAllRead={() => {
                    if (onMarkNotificationRead && businessNotifications.length > 0) {
                      businessNotifications.forEach((n) => onMarkNotificationRead(n.id));
                    }
                  }}
                  onDeleteNotification={onDeleteNotification}
                  onUpdateNotifications={onUpdateNotifications}
                  onClearAll={onClearAllNotifications}
                  onOpenCreator={onOpenCreator}
                  onOpenSettings={() => setIsNotificationSettingsOpen(true)}
                />
              </div>
            )}

            {/* TAB 3: WEBSITE EMBED */}
            {activeTab === 'embed' && (
              <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
                {/* Editorial Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="space-y-1">
                    <h1 className="text-[26px] sm:text-[32px] font-semibold text-white tracking-[-0.03em] leading-[1.12]">
                      Website Embed
                    </h1>
                    <p className="text-xs sm:text-[13px] text-zinc-400">
                      Showcase verified customer photo proof directly on your website with built-in SEO rich snippets.
                    </p>
                  </div>
                  {placeVideos.length > 0 && (
                    <button
                      type="button"
                      onClick={copyEmbedCode}
                      className="px-5 py-2.5 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shrink-0 self-start sm:self-auto min-h-[40px]"
                    >
                      {isCodeCopied ? <Check className="w-4 h-4 text-zinc-950 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5 text-zinc-950" />}
                      <span>{isCodeCopied ? 'Copied code' : 'Copy embed code'}</span>
                    </button>
                  )}
                </div>

                {placeVideos.length === 0 ? (
                  /* Guidance State for Venues with 0 Reviews */
                  <div className="bg-white/[0.03] rounded-2xl border border-white/[0.08] text-white p-6 sm:p-10 space-y-6 text-center">
                    <div className="space-y-3 max-w-md mx-auto">
                      <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/[0.09] flex items-center justify-center mx-auto">
                        <Lock className="w-6 h-6 text-[#E8C78A]" />
                      </div>
                      <h2 className="text-lg sm:text-xl font-semibold text-white tracking-[-0.02em]">
                        Collect your first photo review to unlock
                      </h2>
                      <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed">
                        Your live photo carousel and HTML embed snippet activate automatically once {currentPlace.name} receives its first verified customer photo review.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                      <button
                        type="button"
                        onClick={() => setActiveTab('qr_invites')}
                        className="p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] text-white text-left transition-all active:scale-[0.99] flex flex-col justify-between gap-3 cursor-pointer border border-white/[0.09]"
                      >
                        <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.09] flex items-center justify-center">
                          <QrCode className="w-4 h-4 text-[#E8C78A]" />
                        </div>
                        <div>
                          <div className="text-[13.5px] font-semibold text-white">
                            Print QR Table Standee
                          </div>
                          <div className="text-xs text-zinc-400 mt-0.5">
                            Collect live photo reviews in person at checkout.
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={copyDirectReviewLink}
                        className="p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] text-white text-left transition-all active:scale-[0.99] border border-white/[0.09] flex flex-col justify-between gap-3 cursor-pointer"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.09] flex items-center justify-center">
                            <Link2 className="w-4 h-4 text-zinc-200" />
                          </div>
                          {isDirectReviewLinkCopied && (
                            <span className="text-xs font-semibold text-[#E8C78A] flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Copied
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="text-[13.5px] font-semibold text-white">
                            {isDirectReviewLinkCopied ? 'Direct link copied' : 'Copy direct review link'}
                          </div>
                          <div className="text-xs text-zinc-400 mt-0.5">
                            Share via SMS, WhatsApp, or email follow-up.
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* UNLOCKED EMBED STUDIO */
                  <div className="space-y-4">
                    {/* Capability Strip */}
                    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.07]">
                      <div className="p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                          <Globe className="w-4 h-4 text-zinc-200" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white">Works on any website</div>
                          <div className="text-[11.5px] text-zinc-400">Shopify, WordPress, Webflow, Wix, HTML</div>
                        </div>
                      </div>
                      <div className="p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                          <Star className="w-4 h-4 text-[#E8C78A] fill-[#E8C78A]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white">Google Rich Snippets</div>
                          <div className="text-[11.5px] text-zinc-400">Automatic Schema.org review markup</div>
                        </div>
                      </div>
                    </div>

                    {/* Collapsible Embed Code Bar */}
                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden">
                      <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0 font-mono text-xs text-zinc-400">
                          <Code className="w-4 h-4 text-zinc-400 shrink-0" />
                          <span className="text-zinc-200 truncate select-none">
                            {isPremium
                              ? `yoouz.com/embed/${getPlaceSlug(currentPlace) || currentPlace?.id || currentPlace?.brandDomain || 'yoouz.com'}`
                              : "yoouz.com/embed/••••••••"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (!isPremium) {
                                setPremiumTriggerFeature('embed');
                                setIsPremiumModalOpen(true);
                              } else {
                                setShowAdvanceEmbedCode(!showAdvanceEmbedCode);
                              }
                            }}
                            className="text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1 px-3 py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.09] transition-colors cursor-pointer"
                          >
                            <span>{showAdvanceEmbedCode ? 'Hide code' : 'View code'}</span>
                            {showAdvanceEmbedCode ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={copyEmbedCode}
                            className="text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 flex items-center gap-1.5 px-3.5 py-2 rounded-full transition cursor-pointer active:scale-95"
                          >
                            {isCodeCopied ? <Check className="w-3.5 h-3.5 text-zinc-950 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{isCodeCopied ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      {showAdvanceEmbedCode && (
                        <div className="border-t border-white/[0.07] p-4 bg-[#08080a] space-y-2.5">
                          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                            <span>HTML + Schema.org JSON-LD</span>
                            <button
                              type="button"
                              onClick={() => setShowEmbedTester(true)}
                              className="text-zinc-200 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <span>Open live tester</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                          <pre className="text-[11px] text-zinc-300 font-mono whitespace-pre-wrap break-all leading-relaxed p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07] max-h-48 overflow-y-auto">
                            {getEmbedCode()}
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* Interactive Widget Preview */}
                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 sm:p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">Live widget preview</span>
                        {displayableWidgetVideos.length > 0 && (
                          <span className="text-xs text-zinc-400 tabular-nums">
                            {displayableWidgetVideos.length} {displayableWidgetVideos.length === 1 ? 'review' : 'reviews'}
                          </span>
                        )}
                      </div>

                      <div className="relative w-full max-w-[400px] h-[520px] mx-auto bg-black border border-white/[0.1] rounded-[24px] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.65)] flex flex-col select-none">
                        <iframe
                          src={`/embed/${getPlaceSlug(currentPlace) || currentPlace?.id || currentPlace?.brandDomain || 'yoouz.com'}?preview=true`}
                          title={`Yoouz Live Embed Preview - ${currentPlace.name}`}
                          className="w-full h-full border-0 bg-transparent"
                          allow="autoplay; encrypted-media; picture-in-picture; camera; microphone; popups; popups-to-escape-sandbox"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: QR CODE STUDIO */}
            {activeTab === 'qr_invites' && (
              <div className="space-y-6 animate-in fade-in duration-200 max-w-md mx-auto pb-8">
                {/* Editorial Header */}
                <div className="text-center space-y-1">
                  <h1 className="text-[26px] sm:text-[32px] font-semibold text-white tracking-[-0.03em] leading-[1.12]">
                    QR Table Standee
                  </h1>
                  <p className="text-xs sm:text-[13px] text-zinc-400">
                    Place at checkout or tables so guests capture live photo proof in seconds.
                  </p>
                </div>

                {/* Centerpiece: Physical Standee Card */}
                <div className="flex flex-col items-center w-full">
                  <div className="w-full bg-[#0B0B0E] border border-white/[0.1] rounded-[28px] p-6 sm:p-7 shadow-[0_24px_60px_rgba(0,0,0,0.55)] relative overflow-hidden text-center text-white">
                    {/* Top Acrylic Bevel */}
                    <div className="w-14 h-1 bg-white/[0.14] rounded-full mx-auto mb-5" />

                    {qrTableLabel && (
                      <div className="absolute top-5 right-5 px-2.5 py-0.5 rounded-full bg-white/[0.08] text-zinc-200 text-[10px] font-semibold border border-white/[0.1]">
                        {qrTableLabel}
                      </div>
                    )}

                    {/* Venue Logo Avatar */}
                    <CopoBrandLogo
                      domain={currentPlace.website || currentPlace.id}
                      name={currentPlace.name}
                      logoUrl={currentPlace.logoUrl}
                      className="w-15 h-15 rounded-2xl bg-[#050506] p-2 flex items-center justify-center mx-auto mb-3.5 border border-white/[0.1] [print-color-adjust:exact] [-webkit-print-color-adjust:exact] print:bg-zinc-950 print:border-zinc-800 overflow-hidden"
                      imageClassName="w-full h-full object-contain"
                      fallbackTextClassName="font-semibold text-lg text-white"
                    />

                    {/* Venue Title & Verified Check */}
                    <div className="flex items-center justify-center gap-1.5 mb-1 px-2">
                      <h3 className="font-semibold text-white text-lg sm:text-xl tracking-[-0.02em] truncate max-w-[260px] sm:max-w-[300px]">
                        {currentPlace.name}
                      </h3>
                      <BadgeCheck className="w-4 h-4 text-[#E8C78A] shrink-0" />
                    </div>

                    {/* Business Place Handle / URL */}
                    <div className="text-[11.5px] text-zinc-400 flex items-center justify-center gap-1 mb-2.5">
                      <span>yoouz.com/reviews/{(selectedPlaceId || currentPlace.id || '').replace(/^(https?:\/\/)?(www\.)?yoouz\.com\/(place|reviews)\//, '')}</span>
                    </div>

                    {/* Star Rating & Reviews Count */}
                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold mb-4 tabular-nums">
                      <span className="text-[#E8C78A]">{avgRating}</span>
                      <CopoStarRating
                        rating={Number(avgRating) || 5.0}
                        starClassName="w-3.5 h-3.5"
                        filledColorClass="text-[#E8C78A] fill-[#E8C78A] print:text-amber-500 print:fill-amber-500 [print-color-adjust:exact] [-webkit-print-color-adjust:exact]"
                        emptyColorClass="text-zinc-600 fill-zinc-800 print:text-zinc-400 print:fill-zinc-200 [print-color-adjust:exact] [-webkit-print-color-adjust:exact]"
                      />
                      <span className="text-zinc-400 text-[11px] font-normal">
                        ({placeVideos.length} {placeVideos.length === 1 ? 'Photo Review' : 'Photo Reviews'})
                      </span>
                    </div>

                    {/* Callout Prompt with Edit Trigger */}
                    <div className="mb-5 px-2 flex items-center justify-center gap-2">
                      <span className="text-xs font-medium text-zinc-200 truncate max-w-[85%]">
                        {qrCustomHeading || 'Leave a live photo review'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowCustomizeAccordion(!showCustomizeAccordion)}
                        title="Customize standee text"
                        className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] active:scale-95 text-zinc-300 hover:text-white transition-all cursor-pointer shrink-0 border border-white/[0.09] flex items-center justify-center"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Collapsible Text Customization */}
                    {showCustomizeAccordion && (
                      <div className="mb-4 p-4 rounded-2xl bg-[#050506] border border-white/[0.08] space-y-3 text-left animate-in fade-in slide-in-from-top-1">
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                            Callout Heading
                          </label>
                          <input
                            type="text"
                            value={qrCustomHeading}
                            onChange={(e) => setQrCustomHeading(e.target.value)}
                            placeholder="e.g. Leave a live photo review"
                            className="w-full h-10 bg-white/[0.04] border border-white/[0.09] rounded-xl px-3 text-[16px] sm:text-xs font-medium text-white focus:outline-hidden focus:border-white/25"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                            Table / Zone Label (Optional)
                          </label>
                          <input
                            type="text"
                            value={qrTableLabel}
                            onChange={(e) => setQrTableLabel(e.target.value)}
                            placeholder="e.g. Counter, Table #4"
                            className="w-full h-10 bg-white/[0.04] border border-white/[0.09] rounded-xl px-3 text-[16px] sm:text-xs font-medium text-white focus:outline-hidden focus:border-white/25"
                          />
                        </div>
                      </div>
                    )}

                    {/* QR Code Canvas Card */}
                    <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-2xl inline-block border border-white/20 relative group my-1 max-w-full">
                      <div className="hidden sm:block">
                        <QRCodeCanvas
                          id="yoouz-qr-code"
                          value={qrDirectReviewUrl}
                          size={220}
                          level="H"
                          includeMargin={true}
                        />
                      </div>
                      <div className="sm:hidden flex items-center justify-center">
                        <QRCodeCanvas
                          id="yoouz-qr-code-mobile"
                          value={qrDirectReviewUrl}
                          size={190}
                          level="H"
                          includeMargin={true}
                        />
                      </div>

                      {/* Center Yoouz Star Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-950 border-2 border-white text-white flex items-center justify-center font-semibold text-sm shadow-xl">
                          ★
                        </div>
                      </div>
                    </div>

                    {/* Camera Guidance Prompt */}
                    <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-400 mt-4 font-normal px-2">
                      <Camera className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span>Scan with phone camera to record live review</span>
                    </div>

                    {/* Footnote: Direct URL + Copy Link */}
                    <div className="mt-4 pt-3.5 border-t border-white/[0.08] flex items-center justify-between gap-2 px-1">
                      <span className="text-[11px] font-mono text-zinc-400 truncate max-w-[200px] sm:max-w-[240px]">
                        {qrDirectReviewUrl.replace(/^https?:\/\//, '')}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(qrDirectReviewUrl);
                            setQrLinkCopied(true);
                            setTimeout(() => setQrLinkCopied(false), 2500);
                          }}
                          className="py-1.5 px-3 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white transition-all cursor-pointer text-xs font-medium flex items-center gap-1.5 border border-white/[0.09]"
                          title="Copy Direct Link"
                        >
                          {qrLinkCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#E8C78A]" />
                              <span className="text-[11px] text-[#E8C78A] font-semibold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Primary Action Button: Pure-White Flagship Pill */}
                  <div className="w-full mt-4">
                    <button
                      type="button"
                      onClick={downloadQRCode}
                      className="w-full py-3.5 px-6 bg-white hover:bg-zinc-200 active:scale-[0.98] text-zinc-950 rounded-full text-sm font-semibold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-zinc-950 shrink-0" />
                      <span>Download Print-Ready Table Standee</span>
                    </button>
                  </div>
                </div>

              </div>
            )}
            {/* TAB 6: BUSINESS PROFILE & INFO */}
            
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in duration-200 pb-16 max-w-2xl mx-auto">
                
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl sm:text-[32px] font-semibold text-white tracking-[-0.03em] leading-tight">Business Profile</h2>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-1">The essential information guests and reviewers see on Yoouz.</p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    {isProfileSaved && (
                      <span className="hidden sm:flex text-[13px] font-medium text-[#E8C78A] items-center gap-1.5 animate-in zoom-in-95">
                        <CheckCircle2 className="w-4 h-4 text-[#E8C78A]" /> Saved
                      </span>
                    )}
                    <button
                      type="button"
                      id="btn-save-profile-header"
                      onClick={handleSaveProfile}
                      className="px-4 sm:px-5 py-2 sm:py-2.5 bg-white hover:bg-zinc-200 active:bg-zinc-300 text-zinc-950 rounded-full text-xs sm:text-[13px] font-semibold shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      {isProfileSaved ? (
                        <>
                          <Check className="w-4 h-4 text-zinc-950" />
                          <span>Saved</span>
                        </>
                      ) : (
                        <span>Save Profile</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Main Unified Settings Card */}
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-[28px] p-5 sm:p-8 space-y-6">
                  
                  {/* Profile Picture / Logo Uploader */}
                  <div className="flex flex-col items-center gap-3 pt-1">
                    <div 
                      className="relative group cursor-pointer" 
                      onClick={() => logoFileInputRef.current?.click()}
                      title="Click to change profile picture"
                    >
                      <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/[0.14] shadow-md relative bg-white flex items-center justify-center p-2.5 transition-all group-hover:border-white/35">
                        <CopoBrandLogo
                          domain={currentPlace.website || currentPlace.id}
                          name={profileName || currentPlace.name}
                          logoUrl={profileLogoUrl || currentPlace.logoUrl}
                          className="w-full h-full bg-transparent overflow-hidden flex items-center justify-center border-0 p-0 shadow-none ring-0"
                          imageClassName="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                          fallbackTextClassName="text-2xl font-semibold text-zinc-950 uppercase"
                        />
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          logoFileInputRef.current?.click();
                        }}
                        className="absolute -bottom-1.5 -right-1.5 p-2 bg-[#111114]/95 hover:bg-zinc-800 text-white rounded-full shadow-lg transition-colors cursor-pointer border border-white/[0.14] backdrop-blur-md active:scale-95"
                        title="Upload Profile Picture"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                      <input 
                        type="file" 
                        ref={logoFileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleLogoFileUpload} 
                      />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-medium text-zinc-200 block">Profile Picture</span>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Click to upload a custom JPG or PNG</p>
                    </div>
                    {logoError && <p className="text-xs text-rose-400 font-medium">{logoError}</p>}
                  </div>

                  {/* Cover Banner Uploader */}
                  <div className="flex flex-col items-center gap-3">
                    <div 
                      className="relative group cursor-pointer w-full" 
                      onClick={() => bannerFileInputRef.current?.click()}
                      title="Click to change cover banner"
                    >
                      <div className="w-full h-36 sm:h-44 rounded-2xl overflow-hidden border border-white/[0.12] relative bg-white/[0.025] flex items-center justify-center transition-all group-hover:border-white/30">
                        {profileBannerUrl && !bannerPreviewFailed ? (
                          <img 
                            src={profileBannerUrl} 
                            alt="Cover Banner" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                            referrerPolicy="no-referrer" 
                            onError={() => setBannerPreviewFailed(true)}
                          />
                        ) : (
                          <div className="w-full h-full bg-white/[0.02] flex flex-col items-center justify-center gap-2 text-zinc-500">
                            <Camera className="w-7 h-7 text-zinc-500" />
                            <span className="text-xs font-medium text-zinc-400">
                              {bannerPreviewFailed ? "Image preview error (click to replace banner)" : "No cover banner set"}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Camera className="w-6 h-6" />
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          bannerFileInputRef.current?.click();
                        }}
                        className="absolute bottom-2.5 right-2.5 p-2 bg-[#111114]/90 hover:bg-zinc-800 text-white rounded-full shadow-lg transition-colors cursor-pointer border border-white/[0.14] backdrop-blur-md active:scale-95"
                        title="Upload Cover Banner"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                      <input 
                        type="file" 
                        ref={bannerFileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleBannerFileUpload} 
                      />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-medium text-zinc-200 block">Cover Banner</span>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Click to upload a custom JPG or PNG</p>
                    </div>
                    {bannerError && <p className="text-xs text-rose-400 font-medium">{bannerError}</p>}
                  </div>

                  {/* DISPLAY NAME */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300 block">
                      Display Name
                    </label>
                    <input
                      type="text"
                      id="input-profile-name"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value.slice(0, 70))}
                      placeholder="e.g. Legal500"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[16px] sm:text-sm font-medium text-white focus:outline-none focus:bg-white/[0.065] focus:border-white/25 transition-all placeholder:text-zinc-500"
                    />
                  </div>

                  {/* BIO */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-zinc-300">
                        Bio
                      </label>
                      <span className="text-[11px] text-zinc-500 tabular-nums">{profileDesc.length} / 300</span>
                    </div>
                    <textarea
                      id="textarea-profile-desc"
                      value={profileDesc}
                      onChange={(e) => setProfileDesc(e.target.value.slice(0, 300))}
                      rows={3}
                      placeholder="Tell visitors what makes your venue authentic and special..."
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-3.5 text-[16px] sm:text-sm text-white focus:outline-none focus:bg-white/[0.065] focus:border-white/25 transition-all placeholder:text-zinc-500 leading-relaxed font-normal"
                    />
                  </div>

                  {/* LOCATION (Structured Country, Region, City, Neighborhood) */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-300 block">
                      Location
                    </label>
                    
                    <CountrySelector
                      value={selectedCountry}
                      onChange={handleCountryChange}
                    />

                    {selectedCountry && (() => {
                      const selectedCountryObj = Country.getAllCountries().find(c => c.name === selectedCountry);
                      const isoCode = selectedCountryObj?.isoCode || "";
                      const statesObj = State.getStatesOfCountry(isoCode);
                      const hasStates = statesObj.length > 0;
                      const stateOptions = statesObj.map(s => s.name);
                      
                      let cityOptions: string[] = [];
                      if (stateRegion) {
                        const selectedState = statesObj.find(s => s.name === stateRegion);
                        if (selectedState) {
                          const stateCities = City.getCitiesOfState(isoCode, selectedState.isoCode).map(c => c.name);
                          cityOptions = stateCities.length > 0 ? stateCities : (City.getCitiesOfCountry(isoCode)?.map(c => c.name) || []);
                        } else {
                          cityOptions = City.getCitiesOfCountry(isoCode)?.map(c => c.name) || [];
                        }
                      } else {
                        cityOptions = City.getCitiesOfCountry(isoCode)?.map(c => c.name) || [];
                      }
                      const uniqueCityOptions = Array.from(new Set(cityOptions));

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                          {hasStates ? (
                            <>
                              <div className="space-y-1">
                                <span className="text-[11px] font-medium text-zinc-400 pl-1 block">
                                  Region / Province
                                </span>
                                <SearchableComboSelector
                                  value={stateRegion}
                                  onChange={(val) => {
                                    setStateRegion(val);
                                    setCity("");
                                  }}
                                  options={stateOptions}
                                  placeholder="Region / Province"
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[11px] font-medium text-zinc-400 pl-1 block">
                                  City
                                </span>
                                <SearchableComboSelector
                                  value={city}
                                  onChange={setCity}
                                  options={uniqueCityOptions}
                                  placeholder="Select City"
                                />
                              </div>
                            </>
                          ) : (
                            <div className="col-span-1 sm:col-span-2 space-y-1">
                              <span className="text-[11px] font-medium text-zinc-400 pl-1 block">
                                City
                              </span>
                              <SearchableComboSelector
                                value={city}
                                onChange={setCity}
                                options={uniqueCityOptions}
                                placeholder="Select City"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Street Address / Neighborhood */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[11px] font-medium text-zinc-400 pl-1 block">
                        Street Address / Neighborhood
                      </span>
                      <input
                        type="text"
                        id="input-profile-street"
                        value={streetAddress}
                        onChange={(e) => {
                          setStreetAddress(e.target.value);
                          setProfileAddress(e.target.value);
                        }}
                        placeholder="e.g. 100 Bay Street, Financial District"
                        className="w-full bg-white/[0.04] border border-white/[0.09] rounded-2xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:bg-white/[0.07] focus:border-white/25 transition-all font-normal"
                      />
                    </div>
                  </div>

                  {/* OPERATING HOURS */}
                  <div className="space-y-1.5 pt-1">
                    <BusinessHoursManager
                      value={profileHours}
                      schedule={weeklySchedule}
                      onChange={(formattedHours, schedule) => {
                        setProfileHours(formattedHours);
                        setWeeklySchedule(schedule);
                      }}
                    />
                  </div>

                  {/* PHONE NUMBER */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-zinc-400" /> Phone Number
                      </label>
                      {profilePhone && (
                        <span className="text-[11px] font-medium text-[#E8C78A]">
                          Connected
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-28 sm:w-32 shrink-0">
                        <CountryDialCodeSelector
                          value={phoneDialCode}
                          selectedCountry={selectedCountry}
                          onChange={(dialCode, countryObj) => {
                            setPhoneDialCode(dialCode);
                            if (countryObj) {
                              setSelectedCountry(countryObj.name);
                            }
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          inputMode="tel"
                          id="input-profile-phone"
                          name="business_contact_phone_no_autofill"
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck={false}
                          data-lpignore="true"
                          data-form-type="other"
                          value={localPhone}
                          onChange={(e) => setLocalPhone(e.target.value)}
                          placeholder={activeCountryDialInfo?.phonePlaceholder || "e.g. (212) 555-0198"}
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[16px] sm:text-sm font-medium text-white focus:outline-none focus:bg-white/[0.065] focus:border-white/25 transition-all placeholder:text-zinc-500"
                        />
                      </div>
                    </div>
                    {localPhone && (
                      <div className="flex items-center justify-between text-[11px] text-zinc-400 pl-1 pt-0.5">
                        <span>
                          Full Number: <span className="font-medium text-white tabular-nums">{phoneDialCode ? `${phoneDialCode} ` : ''}{localPhone}</span>
                        </span>
                        {phoneDialCode && (
                          <button
                            type="button"
                            onClick={() => setPhoneDialCode('')}
                            className="text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          >
                            Clear code
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* BUSINESS EMAIL */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-zinc-400" /> Business Email
                    </label>
                    <input
                      type="email"
                      id="input-profile-email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      placeholder="e.g. contact@business.com"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[16px] sm:text-sm font-medium text-white focus:outline-none focus:bg-white/[0.065] focus:border-white/25 transition-all placeholder:text-zinc-500"
                    />
                  </div>

                  {/* WEBSITE (Read-Only / Linked Domain) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-zinc-400" /> Website URL
                      </label>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400">
                        <Lock className="w-3 h-3 text-[#E8C78A]" /> Verified domain
                      </span>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        id="input-profile-website-readonly"
                        value={profileWebsite || (currentPlace as any).website || 'https://yoouz.com'}
                        readOnly
                        tabIndex={-1}
                        className="w-full bg-white/[0.025] border border-white/[0.07] text-zinc-400 rounded-xl px-4 py-3 text-[16px] sm:text-sm font-medium cursor-not-allowed select-all pr-12 focus:outline-none"
                      />
                      {(profileWebsite || (currentPlace as any).website) && (
                        <a
                          href={profileWebsite || (currentPlace as any).website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute right-3 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                          title="Open website"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 pl-1">
                      Associated with your verified business credentials and cannot be edited.
                    </p>
                  </div>

                  {/* BUSINESS CATEGORY */}
                  <div className="space-y-1.5 pt-1">
                    <BusinessCategorySelector
                      value={businessCategory}
                      onChange={(cat) => setBusinessCategory(cat)}
                    />
                  </div>

                  {/* FEATURED ACTION BUTTON (CALL-TO-ACTION / CTA) */}
                  <div className="space-y-3.5 pt-5 border-t border-white/[0.08]">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#E8C78A]" /> Featured Action Button (CTA)
                      </label>
                      <span className="text-[11px] text-zinc-500">
                        Shown on business page
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Choose the primary action button guests see on your Yoouz profile (e.g. Book Now, Order Online, Call Now, Contact Us).
                    </p>

                    {/* Action Preset Selector Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                      {[
                        { id: 'book_now', label: 'Book Now', icon: Calendar },
                        { id: 'order_online', label: 'Order Online', icon: ShoppingBag },
                        { id: 'reserve_table', label: 'Reserve Table', icon: Utensils },
                        { id: 'contact_us', label: 'Contact Us', icon: Mail },
                        { id: 'visit_website', label: 'Visit Website', icon: ExternalLink },
                        { id: 'call_now', label: 'Call Now', icon: Phone },
                        { id: 'get_quote', label: 'Get Quote', icon: FileText },
                        { id: 'buy_tickets', label: 'Buy Tickets', icon: Ticket },
                        { id: 'custom', label: 'Custom Button', icon: Sparkles },
                      ].map((preset) => {
                        const Icon = preset.icon;
                        const isSelected = ctaType === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              setCtaType(preset.id);
                              if (preset.id !== 'custom') {
                                setCtaLabelCustom(preset.label);
                              }
                            }}
                            className={`p-2.5 rounded-2xl border text-xs transition-all flex items-center gap-2 cursor-pointer ${
                              isSelected
                                ? 'bg-white text-zinc-950 border-white font-semibold shadow-sm'
                                : 'bg-white/[0.03] hover:bg-white/[0.07] text-zinc-300 border-white/[0.08] hover:text-white font-medium'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{preset.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Button Label Input */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[11px] font-medium text-zinc-400 block">
                        Button Display Text
                      </label>
                      <input
                        type="text"
                        value={ctaLabelCustom}
                        onChange={(e) => setCtaLabelCustom(e.target.value.slice(0, 40))}
                        placeholder="e.g. Book Appointment"
                        className="w-full bg-white/[0.04] border border-white/[0.09] rounded-2xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:bg-white/[0.07] focus:border-white/25 transition-all placeholder:text-zinc-500"
                      />
                    </div>

                    {/* Target Link or Phone URL */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-zinc-400 block">
                        Target Link URL or Phone Number
                      </label>
                      <input
                        type="text"
                        value={ctaUrl}
                        onChange={(e) => setCtaUrl(e.target.value)}
                        placeholder="e.g. https://yourbusiness.com/book or tel:+12125550198"
                        className="w-full bg-white/[0.04] border border-white/[0.09] rounded-2xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:bg-white/[0.07] focus:border-white/25 transition-all placeholder:text-zinc-500"
                      />
                    </div>

                    {/* Live Yoouz Page Preview Box */}
                    <div className="p-4 bg-white/[0.025] rounded-2xl border border-white/[0.08] space-y-2.5">
                      <span className="text-[11px] font-medium text-zinc-400 block">
                        Live Preview on Yoouz Page
                      </span>
                      <div className="w-full py-3 bg-white text-zinc-950 font-semibold text-sm rounded-full shadow-sm flex items-center justify-center gap-2">
                        <span>{ctaLabelCustom || 'Book Now'}</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-75" />
                      </div>
                    </div>
                  </div>

                  {/* Bottom Save Action Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      id="btn-save-profile-bottom"
                      onClick={handleSaveProfile}
                      className="w-full py-3.5 px-6 rounded-full bg-white hover:bg-zinc-200 active:bg-zinc-300 text-zinc-950 font-semibold text-sm transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isProfileSaved ? (
                        <>
                          <Check className="w-4 h-4 text-zinc-950" />
                          <span>Profile Updated Successfully</span>
                        </>
                      ) : (
                        <span>Save Profile Changes</span>
                      )}
                    </button>
                  </div>

                </div>

              </div>
            )}



            {/* TAB: MEMBERSHIP PLANS */}
            {activeTab === 'membership' && (
              <div className="space-y-6 animate-in fade-in duration-200 pb-12 w-full">
                <CopoPremiumPlansModal
                  isOpen={true}
                  onClose={() => setActiveTab('overview')}
                  businessName={verifiedBusinessSession.placeName || currentPlace?.name || 'Claimed Business'}
                  ownerEmail={displayOwnerEmail || verifiedBusinessSession?.businessEmail || currentPlace?.claimedByEmail || ''}
                  placeId={currentPlace?.id || verifiedBusinessSession?.placeId}
                  isPremium={isPremium}
                  currentPlace={currentPlace}
                  onUpdatePlace={onUpdatePlace}
                  isEmbedded={true}
                />
              </div>
            )}

            {/* TAB 7: MORE / KNOWLEDGE & TRUST CENTER */}
            {activeTab === 'more' && (
              <div className="space-y-6 animate-in fade-in duration-200 pb-12 w-full">
                <CopoMoreView
                  currentUser={null}
                  businessDomain={currentPlace?.website || currentPlace?.id || verifiedBusinessSession?.domain}
                  businessName={currentPlace?.name || (verifiedBusinessSession as any)?.businessName || (verifiedBusinessSession as any)?.ownerName || ""}
                  businessEmail={displayOwnerEmail || verifiedBusinessSession?.businessEmail || verifiedBusinessSession?.email || (currentPlace as any)?.claimedByEmail || ""}
                  isBusinessSuiteEmbedded={true}
                  onBack={() => setActiveTab('overview')}
                  onOpenLegal={onOpenLegal}
                  onNavigate={(sec) => {
                    if (sec === 'home' || sec === 'business') {
                      setActiveTab('overview');
                    } else {
                      onNavigate(sec);
                    }
                  }}
                />
              </div>
            )}
            </>
          )}

          </div>
        </main>

        {/* Native Mobile PWA Floating Obsidian Bottom Navigation Dock */}
        <nav
          aria-label="Mobile business navigation"
          className="md:hidden fixed bottom-[max(12px,env(safe-area-inset-bottom))] left-3 right-3 z-40 rounded-full bg-[#101013]/92 backdrop-blur-2xl border border-white/[0.12] shadow-[0_16px_48px_rgba(0,0,0,0.85)] h-[64px] px-2 flex items-center justify-around"
        >
          {[
            { id: 'overview' as const, label: 'Overview', icon: Home },
            { id: 'reviews' as const, label: 'Reviews', icon: Camera, badge: unseenReviewsCount },
            { id: 'inbox' as const, label: 'Messages', icon: MessageSquare, badge: unreadMessagesCount },
            { id: 'qr_invites' as const, label: 'QR Code', icon: QrCode },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id && !isMobileBizMenuOpen;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setIsMobileBizMenuOpen(false);
                  setActiveTab(tab.id);
                }}
                className={`relative flex-1 h-12 rounded-full flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer active:scale-95 ${
                  active ? 'text-white' : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                <div className="relative">
                  <Icon className="w-[19px] h-[19px]" />
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-white text-zinc-950 text-[9px] font-bold flex items-center justify-center tabular-nums">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] leading-none ${active ? 'font-semibold text-white' : 'font-medium'}`}>
                  {tab.label}
                </span>
                {active && (
                  <span className="w-1 h-1 rounded-full bg-white mt-0.5" />
                )}
              </button>
            );
          })}

          {/* 5th Dock Item: Menu / More Sheet */}
          {(() => {
            const inSheetTab = ['followers', 'notifications', 'embed', 'profile', 'membership', 'more'].includes(activeTab);
            const active = isMobileBizMenuOpen || inSheetTab;
            return (
              <button
                type="button"
                onClick={() => setIsMobileBizMenuOpen((prev) => !prev)}
                className={`relative flex-1 h-12 rounded-full flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer active:scale-95 ${
                  active ? 'text-white' : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                <div className="relative">
                  <Menu className="w-[19px] h-[19px]" />
                  {(unreadBusinessNotifsCount + unseenFollowersCount) > 0 && (
                    <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-[#E8C78A]" />
                  )}
                </div>
                <span className={`text-[10px] leading-none ${active ? 'font-semibold text-white' : 'font-medium'}`}>
                  Menu
                </span>
                {active && (
                  <span className="w-1 h-1 rounded-full bg-white mt-0.5" />
                )}
              </button>
            );
          })()}
        </nav>

        {/* Native Mobile PWA Right-Aligned Business Navigation Sheet */}
        {isMobileBizMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex justify-end animate-in fade-in duration-150">
            <div
              className="absolute inset-0 bg-black/65 backdrop-blur-xs"
              onClick={() => setIsMobileBizMenuOpen(false)}
            />
            <div className="relative z-10 w-[86%] max-w-[340px] h-full bg-[#0B0B0E]/96 backdrop-blur-2xl border-l border-white/[0.1] rounded-l-[28px] shadow-[-24px_0_64px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
              {/* Sheet Header */}
              <div className="px-5 pt-[max(20px,env(safe-area-inset-top))] pb-4 border-b border-white/[0.07] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <CopoBrandLogo
                    domain={currentPlace.website || currentPlace.id}
                    name={currentPlace.name}
                    logoUrl={profileLogoUrl || currentPlace.logoUrl}
                    className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.1] p-1 flex items-center justify-center shrink-0 overflow-hidden"
                    imageClassName="w-full h-full object-contain rounded-lg"
                    fallbackTextClassName="font-semibold text-xs text-white"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[15px] font-semibold text-white truncate">{currentPlace.name}</span>
                      <BadgeCheck className="w-4 h-4 text-[#E8C78A] shrink-0" />
                    </div>
                    <div className="text-xs text-zinc-400 truncate">
                      {cleanBusinessDomain} · {isPremium ? 'Premium' : 'Free'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileBizMenuOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 flex items-center justify-center shrink-0 cursor-pointer active:scale-95"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Grouped Menu */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 no-scrollbar">
                {/* Workspace Group */}
                <div className="space-y-1">
                  <div className="px-2 pb-1 text-[11px] font-medium text-zinc-500">Workspace</div>
                  <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] divide-y divide-white/[0.06] overflow-hidden">
                    {workspaceNavItems.map((item) => {
                      const Icon = item.icon;
                      const active = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveTab(item.id);
                            setIsMobileBizMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 min-h-[48px] text-left text-[14px] transition-colors cursor-pointer ${
                            active ? 'bg-white/[0.07] text-white font-semibold' : 'text-zinc-300 hover:bg-white/[0.04] font-medium'
                          }`}
                        >
                          <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-white' : 'text-zinc-400'}`} />
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge !== undefined && (
                            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-white text-zinc-950 text-[11px] font-semibold flex items-center justify-center tabular-nums">
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Growth Group */}
                <div className="space-y-1">
                  <div className="px-2 pb-1 text-[11px] font-medium text-zinc-500">Growth</div>
                  <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] divide-y divide-white/[0.06] overflow-hidden">
                    {growthNavItems.map((item) => {
                      const Icon = item.icon;
                      const active = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveTab(item.id);
                            setIsMobileBizMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 min-h-[48px] text-left text-[14px] transition-colors cursor-pointer ${
                            active ? 'bg-white/[0.07] text-white font-semibold' : 'text-zinc-300 hover:bg-white/[0.04] font-medium'
                          }`}
                        >
                          <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-white' : 'text-zinc-400'}`} />
                          <span className="flex-1 truncate">{item.label}</span>
                          <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Account & Tools Group */}
                <div className="space-y-1">
                  <div className="px-2 pb-1 text-[11px] font-medium text-zinc-500">Business Account</div>
                  <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] divide-y divide-white/[0.06] overflow-hidden">
                    {accountNavItems.map((item) => {
                      const Icon = item.icon;
                      const active = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveTab(item.id);
                            setIsMobileBizMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 min-h-[48px] text-left text-[14px] transition-colors cursor-pointer ${
                            active ? 'bg-white/[0.07] text-white font-semibold' : 'text-zinc-300 hover:bg-white/[0.04] font-medium'
                          }`}
                        >
                          <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-white' : 'text-zinc-400'}`} />
                          <span className="flex-1 truncate">{item.label}</span>
                          {(item as any).tierLabel && (
                            <span className={`text-xs font-medium ${isPremium ? 'text-[#E8C78A]' : 'text-zinc-500'}`}>
                              {(item as any).tierLabel}
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileBizMenuOpen(false);
                        const targetId = selectedPlaceId || currentPlace?.id || 'yoouz.com';
                        if (onOpenPlaceDrawer) {
                          onOpenPlaceDrawer(targetId);
                        } else {
                          window.location.href = `/reviews/${targetId}`;
                        }
                      }}
                      className="w-full flex items-center gap-3 px-4 min-h-[48px] text-left text-[14px] text-zinc-300 hover:bg-white/[0.04] font-medium transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-[18px] h-[18px] text-zinc-400 shrink-0" />
                      <span className="flex-1 truncate">View Public Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileBizMenuOpen(false);
                        setShowHelpModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 min-h-[48px] text-left text-[14px] text-zinc-300 hover:bg-white/[0.04] font-medium transition-colors cursor-pointer"
                    >
                      <HelpCircle className="w-[18px] h-[18px] text-zinc-400 shrink-0" />
                      <span className="flex-1 truncate">Support &amp; Docs</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileBizMenuOpen(false);
                        setIsClaiming(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 min-h-[48px] text-left text-[14px] text-zinc-300 hover:bg-white/[0.04] font-medium transition-colors cursor-pointer"
                    >
                      <Building2 className="w-[18px] h-[18px] text-zinc-400 shrink-0" />
                      <span className="flex-1 truncate">Switch Business</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sticky Bottom Actions & Quiet Legal */}
              <div className="p-4 pb-[max(16px,env(safe-area-inset-bottom))] border-t border-white/[0.07] space-y-3 bg-[#0B0B0E]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileBizMenuOpen(false);
                      onClose();
                    }}
                    className="flex-1 h-11 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Consumer Feed</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileBizMenuOpen(false);
                      localStorage.removeItem('copo_business_verified_session');
                      window.dispatchEvent(new CustomEvent('copo_business_auth_changed', { detail: null }));
                      setVerifiedBusinessSession(null);
                    }}
                    className="h-11 px-4 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileBizMenuOpen(false);
                      onOpenLegal ? onOpenLegal("privacy") : onNavigate("home");
                    }}
                    className="hover:text-zinc-300 cursor-pointer bg-transparent border-none p-0"
                  >
                    Privacy
                  </button>
                  <span className="text-zinc-700">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileBizMenuOpen(false);
                      onOpenLegal ? onOpenLegal("terms") : onNavigate("home");
                    }}
                    className="hover:text-zinc-300 cursor-pointer bg-transparent border-none p-0"
                  >
                    Terms
                  </button>
                  <span className="text-zinc-700">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileBizMenuOpen(false);
                      setActiveTab("more");
                    }}
                    className="hover:text-zinc-300 cursor-pointer bg-transparent border-none p-0"
                  >
                    About
                  </button>
                  <span className="text-zinc-700">·</span>
                  <span>© 2026 Yoouz</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Official CopoVideoPlayer (100% parity with homepage and user profile) */}
      {activeVideoModal && (
        <div
          id="business-official-player-portal"
          className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center animate-in fade-in select-none"
        >
          <div className="copo-has-bottom-nav flex-1 min-h-0 w-full h-full relative bg-[#050506] flex flex-col overflow-hidden z-10">
            <CopoVideoPlayer
              commentsOpen={Boolean(activeCommentVideo)}
              videos={placeVideos}
              places={places}
              currentIndex={bizVideoIndex}
              onSelectVideoIndex={(idx) => {
                setBizVideoIndex(idx);
                const targetVid = placeVideos[idx];
                if (targetVid) {
                  setActiveVideoModal(targetVid);
                  setSeenReviewIds((prev) => {
                    const next = new Set(prev);
                    next.add(targetVid.id);
                    return next;
                  });
                }
              }}
              activeSubTab={bizVideoSubTab}
              onSelectSubTab={setBizVideoSubTab}
              onOpenComments={(v) => setActiveCommentVideo(v)}
              onOpenPlace={() => {}}
              onOpenCreator={onOpenCreator || (() => {})}
              onOpenShare={() => {}}
              onToggleLike={() => {}}
              onToggleBookmark={() => {}}
              onToggleFollow={() => {}}
              onGoBack={() => setActiveVideoModal(null)}
              feedContextTitle={currentPlace.name}
              currentUser={currentUser || effectiveUser}
              isBusinessOwnerView={true}
              onOpenOwnerReply={(v) => setActiveReplyModalVideo(v)}
              isEmbed={false}
              onCloseEmbed={() => setActiveVideoModal(null)}
            />
          </div>

          <CopoMobileBottomNav
            activeSection="home"
            onSelectSection={(sec) => {
              setActiveVideoModal(null);
              onNavigate(sec);
            }}
            currentUser={currentUser || effectiveUser}
            unreadNotifsCount={notifications.filter((n) => !n.isRead).length}
            unreadMessagesCount={messages.reduce((acc, m) => acc + (m.unreadCount || 0), 0)}
            onOpenSearch={() => {
              setActiveVideoModal(null);
              onNavigate("home");
            }}
          />
        </div>
      )}

      {/* Verified Google-Style Owner Reply Modal */}
      {activeReplyModalVideo && (
        <GoogleOwnerReplyModal
          isOpen={Boolean(activeReplyModalVideo)}
          video={activeReplyModalVideo}
          placeName={currentPlace.name}
          placeLogoUrl={profileLogoUrl || currentPlace.logoUrl}
          existingReply={ownerReplies[activeReplyModalVideo.id] || activeReplyModalVideo.ownerResponse?.text}
          onClose={() => setActiveReplyModalVideo(null)}
          onSaveReply={async (vidId, text) => {
            await handleSaveReply(vidId, text);
          }}
          onDeleteReply={async (vidId) => {
            await handleDeleteReply(vidId);
          }}
        />
      )}

      {/* Comments Drawer for reviewing customer conversation */}
      {activeCommentVideo && (
        <CopoCommentsDrawer
          video={activeCommentVideo}
          currentUser={currentUser || effectiveUser}
          allUsers={allUsers}
          isUserOwner={true}
          placeName={currentPlace.name}
          placeLogoUrl={profileLogoUrl || currentPlace.logoUrl}
          onClose={() => setActiveCommentVideo(null)}
          onAddComment={onAddComment}
          onToggleCommentLike={onToggleCommentLike}
          onToggleCreatorHeart={onToggleCreatorHeart}
          onDeleteComment={onDeleteComment}
          onAddOwnerResponse={async (vidId, text) => {
            await handleSaveReply(vidId, text);
          }}
          onDeleteOwnerResponse={async (vidId) => {
            await handleDeleteReply(vidId);
          }}
        />
      )}

      {/* Help & FAQ Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-[#0C0C0E] rounded-[28px] border border-white/[0.1] text-white p-6 sm:p-7 max-w-xl w-full shadow-2xl relative flex flex-col gap-5 animate-in zoom-in-95 duration-300 max-h-[88vh] overflow-hidden">
            <button
              onClick={() => {
                setShowHelpModal(false);
                setFaqSearchQuery('');
              }}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 pr-8">
              <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/[0.09] flex items-center justify-center text-white shrink-0">
                <HelpCircle className="w-5 h-5 text-zinc-200" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg tracking-[-0.02em]">Merchant Q&A & Guide</h3>
                <p className="text-xs text-zinc-400">Everything you need to know about Yoouz Business</p>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={faqSearchQuery}
                onChange={(e) => setFaqSearchQuery(e.target.value)}
                placeholder="Search questions (e.g. video, reviews, QR, replies, embed)..."
                className="w-full pl-11 pr-9 py-2.5 rounded-full bg-white/[0.05] border border-white/[0.09] focus:bg-white/[0.08] focus:border-white/25 focus:outline-none text-xs text-white placeholder:text-zinc-500 transition-all"
              />
              {faqSearchQuery && (
                <button
                  type="button"
                  onClick={() => setFaqSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Q&A Accordion Items */}
            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed overflow-y-auto pr-1 custom-scrollbar">
              {[
                {
                  id: 'qa-what-is-yoouz',
                  icon: Camera,
                  question: 'What is Yoouz for Businesses?',
                  answer: 'Yoouz connects your venue directly with authentic, real-world guests. Customers snap genuine live photo reviews using their rear or front camera right inside your location—zero gallery uploads, plus whole 1–5 star ratings. There are no bot accounts or fake AI-written reviews, just real people sharing visual proof that builds trust and drives foot traffic.'
                },
                {
                  id: 'qa-premium-included',
                  icon: Zap,
                  question: 'What is included in the Yoouz Premium Business Suite ($149/mo)?',
                  answer: 'The Premium Suite ($149/mo) unlocks the complete enterprise growth stack: Verified Business Badge, Priority Search Placement in local results, Live Website Review Widget with automated Google Rich Snippets SEO Schema, HD Branded Review Card Exporter with logo watermarks, Pinned Owner Replies, Direct Messaging Lead Capture, Table & Window QR Code Standees, and Real-Time ROI Analytics.'
                },
                {
                  id: 'qa-premium-seo',
                  icon: Sparkles,
                  question: 'How does the Premium Plan boost Google Search SEO & Rich Snippets?',
                  answer: 'When you embed your Yoouz photo review widget on your website, our system automatically generates Schema.org JSON-LD structured data. This allows search engines like Google to render star ratings and customer photo thumbnails directly in organic search results, increasing click-through rates (CTR) by up to 35%.'
                },
                {
                  id: 'qa-premium-ads',
                  icon: Award,
                  question: 'Can I export customer photo reviews as social media assets?',
                  answer: 'Yes! Premium Suite subscribers can export customer live photo reviews as high-definition branded social proof cards with your official venue logo overlay and watermark—ready to share on Instagram, TikTok, Facebook, or your website.'
                },
                {
                  id: 'qa-premium-contracts',
                  icon: CreditCard,
                  question: 'Are there any contracts, hidden fees, or cancellation lock-ins?',
                  answer: 'No. Yoouz Premium Business Suite ($149/mo or $99/mo annual) is strictly flexible with zero setup fees and zero cancellation penalties. You can upgrade, pause, or switch plans anytime with 1-click in your Business Dashboard.'
                },
                {
                  id: 'qa-is-it-free',
                  icon: ShieldCheck,
                  question: 'Is claiming and managing my venue free of charge?',
                  answer: 'Yes. Standard venue claiming, verified business badges, real-time review alerts, official owner replies, print-ready QR table standees, and website review embeds are fully included for all verified venue operators with zero subscription or hidden fees.'
                },
                {
                  id: 'qa-reply-reviews',
                  icon: MessageSquare,
                  question: 'How do I reply to customer photo reviews?',
                  answer: 'Go to the Photo Reviews tab in your dashboard. Beneath any customer review, click "Reply" to publish an official response. Your message is pinned with a distinguished "Verified Business Owner" badge directly below the customer\'s photo so potential guests see your dedication to hospitality.'
                },
                {
                  id: 'qa-qr-codes',
                  icon: QrCode,
                  question: 'How do Table & Window QR Codes help my venue get more reviews?',
                  answer: 'In the QR Code tab, you can instantly download or print high-resolution table standees and window stickers. When guests scan the QR code with their mobile phone, it launches the Yoouz live camera directly for your venue, making it effortless for guests to snap a quick photo review and tap 1–5 stars.'
                },
                {
                  id: 'qa-website-embed',
                  icon: Code,
                  question: 'Can I showcase customer photo reviews on our website?',
                  answer: 'Yes! Navigate to the Embed tab to copy your venue\'s embed code. You can paste the responsive iframe snippet into WordPress, Squarespace, Shopify, Wix, or any custom website to display an interactive photo review carousel that boosts visitor trust and conversions.'
                },
                {
                  id: 'qa-direct-messages',
                  icon: Mail,
                  question: 'How do Customer Direct Messages work?',
                  answer: 'In the Messages tab, customers can send private inquiries directly to your venue (e.g. table reservations, event bookings, opening hours, or lost items). You can chat back in real time directly from your dashboard.'
                },
                {
                  id: 'qa-profile-branding',
                  icon: Building2,
                  question: 'How do I update our venue logo, cover banner, and contact information?',
                  answer: 'Open the Profile tab. Tap directly on your cover banner or profile image to upload your branding, or update your street address, phone number, website link, and category. Changes update live across the entire Yoouz app immediately.'
                },
                {
                  id: 'qa-moderation-rules',
                  icon: AlertCircle,
                  question: 'What should I do if a review violates guidelines or contains spam?',
                  answer: 'Every review on Yoouz must comply with our community trust policies. All photos must be captured live with the camera at the venue (zero gallery uploads) without harassment or inappropriate content. If a review violates our policies, you can report it directly from the review view for prompt investigation.'
                }
              ]
                .filter(item => {
                  if (!faqSearchQuery.trim()) return true;
                  const q = faqSearchQuery.toLowerCase();
                  return item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q);
                })
                .map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <div key={item.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-2">
                      <div className="text-white font-semibold flex items-center gap-2.5 text-xs sm:text-sm">
                        <ItemIcon className="w-4 h-4 text-[#E8C78A] shrink-0" />
                        <span>{item.question}</span>
                      </div>
                      <p className="text-zinc-400 pl-6 text-xs leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  );
                })}

              {faqSearchQuery && (
                <div className="text-center py-6 text-zinc-400 text-xs">
                  <div>No matching questions found for "{faqSearchQuery}".</div>
                  <button
                    type="button"
                    onClick={() => setFaqSearchQuery('')}
                    className="mt-2 text-zinc-200 underline hover:text-white cursor-pointer"
                  >
                    Clear search filter
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setShowHelpModal(false);
                setFaqSearchQuery('');
              }}
              className="w-full py-3 bg-white hover:bg-zinc-200 text-zinc-950 font-semibold rounded-full text-xs transition-colors cursor-pointer shadow-sm shrink-0 active:scale-[0.99]"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}



 {/* Interactive Command Palette Modal (⌘K) */}
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-start justify-center pt-16 md:pt-24 px-4 animate-in fade-in duration-150">
          <div 
            className="fixed inset-0"
            onClick={() => setIsCommandPaletteOpen(false)}
          />
          <div className="relative w-full max-w-xl bg-[#0C0C0E]/95 backdrop-blur-2xl rounded-[24px] border border-white/[0.1] text-white shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
            {/* Search Header Input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08]">
              <Search className="w-4 h-4 text-zinc-400 shrink-0" />
              <input
                type="text"
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                placeholder="Search navigation, reviews, actions..."
                className="w-full text-sm font-medium text-white placeholder:text-zinc-500 bg-transparent focus:outline-hidden"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setIsCommandPaletteOpen(false)}
                className="px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.09] text-[10px] font-medium text-zinc-300 hover:bg-white/[0.1] transition-colors cursor-pointer"
              >
                ESC
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-96 overflow-y-auto p-2 space-y-3">
              {/* Navigation Sections */}
              <div>
                <div className="px-3 py-1 text-[11px] font-medium text-zinc-500">
                  Portal Navigation
                </div>
                <div className="space-y-0.5 mt-1">
                  {[
                    { id: 'overview', label: 'Overview', icon: LayoutDashboard, desc: 'Analytics, impression trends & booking stats' },
                    { id: 'reviews', label: 'Photo Reviews', icon: Camera, desc: 'View customer photo reviews & owner replies' },
                    { id: 'inbox', label: 'Messages', icon: MessageSquare, desc: 'View and respond to direct messages' },
                    { id: 'followers', label: 'Followers', icon: Users, desc: 'View your business followers' },
                    { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'View business alerts and mentions' },
                    { id: 'embed', label: 'Embed', icon: Code, desc: 'Embed photo review carousel on website' },
                    { id: 'qr_invites', label: 'Invites', icon: QrCode, desc: 'Download table standees & send email invites' },
                    { id: 'profile', label: 'Profile', icon: Building2, desc: 'Manage operating hours, address & phone' },
                  ]
                    .filter(item => !commandQuery || item.label.toLowerCase().includes(commandQuery.toLowerCase()) || item.desc.toLowerCase().includes(commandQuery.toLowerCase()))
                    .map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id as BusinessTab);
                          setIsCommandPaletteOpen(false);
                          setCommandQuery('');
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/[0.06] transition-colors cursor-pointer group ${
                          activeTab === item.id ? 'bg-white/[0.08] text-white' : 'text-zinc-300'
                        }`}
                      >
                        <item.icon className={`w-4 h-4 shrink-0 ${activeTab === item.id ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`} />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold truncate text-white">{item.label}</div>
                          <div className="text-[11px] text-zinc-400 truncate">{item.desc}</div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white shrink-0" />
                      </button>
                    ))}
                </div>
              </div>

              {/* Customer Video Reviews Matching Query */}
              {commandQuery && (
                <div>
                  <div className="px-3 py-1 text-[11px] font-medium text-zinc-500">
                    Matching Customer Reviews
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {placeVideos
                      .filter(v => 
                        v.author?.name?.toLowerCase().includes(commandQuery.toLowerCase()) ||
                        v.caption?.toLowerCase().includes(commandQuery.toLowerCase()) ||
                        (v as any).dishOrItem?.toLowerCase().includes(commandQuery.toLowerCase())
                      )
                      .slice(0, 3)
                      .map(v => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            handleOpenBusinessVideo(v);
                            setIsCommandPaletteOpen(false);
                            setCommandQuery('');
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-white/[0.06] transition-colors cursor-pointer group"
                        >
                          <img
                            src={getSafeAvatarUrl(v.author?.avatar, v.author?.name, v.author?.handle)}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-white/[0.15]"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.src = getSafeAvatarUrl(null, v.author?.name, v.author?.handle);
                            }}
                          /> 
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-white truncate">{v.author?.name}</div>
                            <div className="text-[11px] text-zinc-400 truncate">{v.caption}</div>
                          </div>
                          <div className="flex text-[#E8C78A] text-[11px] shrink-0 font-semibold tabular-nums items-center gap-0.5">
                            <Star className="w-3 h-3 fill-current" /> {Math.max(1, Math.min(5, Math.round(v.rating || 5)))}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Quick Merchant Actions */}
              <div>
                <div className="px-3 py-1 text-[11px] font-medium text-zinc-500">
                  Quick Actions
                </div>
                <div className="space-y-0.5 mt-1">
                  {[
                    {
                      label: 'Get Embed Code for Website',
                      icon: Code,
                      action: () => {
                        setActiveTab('embed');
                        copyEmbedCode();
                      }
                    },
                    {
                      label: 'Download Table Standee QR Code',
                      icon: QrCode,
                      action: () => setActiveTab('qr_invites')
                    },
                    {
                      label: 'Claim or Verify Another Venue',
                      icon: ShieldCheck,
                      action: () => setIsClaiming(true)
                    },
                    {
                      label: 'Merchant Guide & FAQ',
                      icon: HelpCircle,
                      action: () => setShowHelpModal(true)
                    }
                  ]
                    .filter(a => !commandQuery || a.label.toLowerCase().includes(commandQuery.toLowerCase()))
                    .map((a, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          a.action();
                          setIsCommandPaletteOpen(false);
                          setCommandQuery('');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-white/[0.06] text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <a.icon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate">{a.label}</span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
            
            {/* Footer hint */}
            <div className="px-4 py-2.5 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between text-[11px] text-zinc-400 font-medium">
              <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.1] text-zinc-200 font-medium">ESC</kbd> to exit</span>
              <span>Yoouz Business Portal</span>
            </div>
          </div>
        </div>
      )}

      {/* Standee PDF Print Sheet Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0C0C0E] rounded-[28px] border border-white/[0.1] text-white max-w-lg w-full p-6 shadow-2xl relative space-y-5 print:p-0 print:border-none print:shadow-none">
            <button
              type="button"
              onClick={() => setShowPrintModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer print:hidden"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 print:hidden">
              <Printer className="w-5 h-5 text-white" />
              <h3 className="font-semibold text-white text-base tracking-[-0.02em]">A6 Table Standee Print Layout</h3>
            </div>

            {/* Printable Area */}
            <div className="bg-[#050506] border border-white/[0.1] rounded-[24px] p-8 text-center space-y-5 shadow-2xl relative overflow-hidden text-white print:bg-white print:text-black print:border-2 print:border-zinc-900 print:shadow-none print:p-6 print:rounded-2xl">
              {qrTableLabel && (
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/[0.08] text-zinc-200 text-[10px] font-semibold border border-white/[0.12] tracking-wide print:bg-zinc-100 print:text-black print:border-zinc-300">
                  {qrTableLabel}
                </div>
              )}

              <CopoBrandLogo
                domain={currentPlace.website || currentPlace.id}
                name={currentPlace.name}
                logoUrl={currentPlace.logoUrl}
                className="w-14 h-14 rounded-2xl bg-white/[0.04] p-2 flex items-center justify-center mx-auto shadow-md border border-white/[0.1] print:bg-zinc-950 print:border-zinc-800 [print-color-adjust:exact] [-webkit-print-color-adjust:exact] overflow-hidden shrink-0"
                imageClassName="w-full h-full object-contain"
                fallbackTextClassName="font-semibold text-xl text-white"
              />

              <div>
                <h2 className="font-semibold text-white text-xl tracking-[-0.02em] text-center [overflow-wrap:anywhere] print:text-black flex items-center justify-center gap-1.5">
                  <span>{currentPlace.name}</span>
                  <CheckCircle className="w-5 h-5 fill-white text-black shrink-0 print:fill-black print:text-white" />
                </h2>
                {/* Business Place Handle / URL */}
                <div className="text-xs font-medium text-zinc-400 print:text-zinc-700 tracking-tight flex items-center justify-center gap-1 mt-0.5">
                  <span>yoouz.com/reviews/{(selectedPlaceId || currentPlace.id || '').replace(/^(https?:\/\/)?(www\.)?yoouz\.com\/(place|reviews)\//, '')}</span>
                </div>
                <div className="text-[#E8C78A] font-semibold text-xs flex items-center justify-center gap-1.5 mt-1.5 print:text-amber-600 tabular-nums">
                  <span className="text-[#E8C78A] font-semibold print:text-amber-600">{avgRating}</span>
                  <CopoStarRating
                    rating={Number(avgRating) || 5.0}
                    starClassName="w-3.5 h-3.5"
                    filledColorClass="text-[#E8C78A] fill-[#E8C78A] print:text-amber-500 print:fill-amber-500 [print-color-adjust:exact] [-webkit-print-color-adjust:exact]"
                    emptyColorClass="text-zinc-700 fill-zinc-900 print:text-zinc-400 print:fill-zinc-200 [print-color-adjust:exact] [-webkit-print-color-adjust:exact]"
                  />
                  <span className="text-zinc-400 font-medium print:text-zinc-700">
                    ({placeVideos.length} {placeVideos.length === 1 ? 'Photo Review' : 'Photo Reviews'} on Yoouz)
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-xl inline-block border border-zinc-200 print:shadow-none print:border-zinc-300">
                <QRCodeCanvas
                  value={`https://www.yoouz.com/reviews/${getPlaceSlug(currentPlace) || selectedPlaceId}`}
                  size={180}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="space-y-1.5">
                <span className="inline-block px-4 py-1.5 rounded-full bg-white/[0.08] text-white font-semibold text-xs tracking-wide border border-white/[0.14] print:bg-zinc-100 print:text-black print:border-zinc-300">
                  {qrCustomHeading || 'Leave a Live Photo Review'}
                </span>
                <p className="text-xs text-zinc-400 font-normal print:text-zinc-600">
                  Scan with your phone camera app to snap your photo review!
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-3 bg-white hover:bg-zinc-200 text-zinc-950 rounded-full text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Now / Save as PDF
              </button>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-5 py-3 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.09] text-zinc-200 rounded-full text-xs font-medium transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Business Notification Preferences Modal (Identical Layout, Functionality & Live Cloud Sync as User Account) */}
      <CopoNotificationSettingsModal
        isOpen={isNotificationSettingsOpen}
        onClose={() => setIsNotificationSettingsOpen(false)}
        settings={businessNotificationSettings}
        onSave={handleSaveBusinessNotificationSettings}
      />

      {/* Branded Ad Video Export Modal (Baked-in overlays: Venue Logo, Rating, Creator badge & Powered by Yoouz.com) */}
      <CopoBrandedAdExportModal
        isOpen={Boolean(adExportVideo)}
        onClose={() => setAdExportVideo(null)}
        video={adExportVideo}
        place={currentPlace}
      />
      <CopoPremiumPlansModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        businessName={verifiedBusinessSession.placeName || currentPlace?.name || 'Unknown Business'}
        ownerEmail={displayOwnerEmail || verifiedBusinessSession?.businessEmail || currentPlace?.claimedByEmail || ''}
        placeId={currentPlace?.id || verifiedBusinessSession?.placeId}
        isPremium={isPremium}
        currentPlace={currentPlace}
        onUpdatePlace={onUpdatePlace}
      />



            


      </div>
    </div>
  );
};
