import { useCriticalImagesLoaded } from "../hooks/useCriticalImagesLoaded";
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { NavSection, Place, VideoReview, UserProfile, VideoAuthor, CopoMessage, CopoNotification, NotificationPreferences, DEFAULT_NOTIFICATION_PREFERENCES } from '../types';
import { CopoNotificationSettingsModal } from './CopoNotificationSettingsModal';
import { getDisplayViews } from '../utils/placeUtils';
import { CopoBusinessClaimModal, BusinessSession } from './CopoBusinessClaimModal';
import { CopoBusinessAuthLanding } from './CopoBusinessAuthLanding';
import { CopoMessagesView } from './CopoMessagesView';
import { CopoNotificationsView } from './CopoNotificationsView';
import { 
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
  ArrowLeft, 
  ChevronLeft, 
  Lock, 
  QrCode, 
  Download, 
  Code, 
  Loader2, 
  CreditCard, 
  Receipt, 
  Sparkles,
  BarChart3,
  Video,
  Play,
  Pause,
  Settings,
  LogOut,
  Volume2,
  VolumeX,
  RotateCcw,
  Pin,
  CheckCircle2,
  Globe,
  Sliders,
  Copy,
  ChevronRight,
  ChevronDown,
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
  Share2,
  Heart,
  Bookmark,
  CheckCircle,
  Calendar,
  Layers,
  MapPin,
  Phone,
  Clock,
  Info,
  LayoutDashboard,
  Wrench,
  ShoppingBag,
  Hotel,
  Utensils,
  FileText,
  Users,
  UserPlus,
  UserCheck,
  UserMinus,
  Package,
  Truck
} from 'lucide-react';
import { CopoBusinessPricingModal } from './CopoBusinessPricingModal';
import { CopoCreemCheckoutModal } from './CopoCreemCheckoutModal';
import { QRCodeCanvas } from 'qrcode.react';
import { normalizeVideoUrl, releaseVideoHardwareDecoder } from '../utils/videoUtils';
import { useGlobalMute, ensureSharedAudioContextUnlocked } from '../hooks/useGlobalMute';
import { CopoBrandLogo } from './CopoBrandLogo';
import { formatRecordedDate } from '../utils/dateUtils';
import { CountrySelector } from './CountrySelector';
import { SearchableComboSelector } from './SearchableComboSelector';
import { locationData } from "../utils/locationData";
import { Country, State, City } from "country-state-city";
import { countryDialData, getDialCodeByCountry, getCountryDialInfo } from '../utils/countries';
import { useLanguage } from '../i18n/LanguageContext';
import { derivePlaceFromEmailOrDomain } from '../utils/businessDomainUtils';

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
  onClose?: () => void;
  onSendMessage?: (
    threadId: string,
    text: string,
    recipient: { id: string; name: string; avatar: string; email?: string },
    videoUrl?: string,
    customVideoId?: string
  ) => Promise<void>;
  onDeleteThread?: (threadId: string) => void;
  onMarkThreadRead?: (threadId: string) => void;
  onUpdateMessages?: (updated: CopoMessage[]) => void;
  onSelectVideo?: (videoId: string, source?: string) => void;
  onToggleFollow?: (authorHandle: string) => void;
  onToggleFollowPlace?: (placeId: string) => void;
  onMarkNotificationRead?: (id: string) => void;
  onClearAllNotifications?: () => void;
  onSaveNotificationSettings?: (newSettings: NotificationPreferences) => Promise<void> | void;
  onOpenLegal?: (tab: 'terms' | 'privacy') => void;
}

type BusinessTab = 'overview' | 'reviews' | 'inbox' | 'followers' | 'notifications' | 'embed' | 'qr_invites' | 'profile' | 'billing';

interface BusinessVideoPlayerModalProps {
  video: VideoReview;
  placeName: string;
  placeId: string;
  websiteUrl?: string;
  onClose: () => void;
  onOpenPublicListing: () => void;
  onOpenCreator?: (author: VideoAuthor) => void;
  onReply?: (video: VideoReview) => void;
}

const BusinessVideoPlayerModal: React.FC<BusinessVideoPlayerModalProps> = ({ 
  video, 
  placeName,
  placeId,
  websiteUrl,
  onClose,
  onOpenPublicListing,
  onOpenCreator,
  onReply 
}) => {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isMuted, setIsMuted, isSessionAudioUnlocked, unlockAudioSession] = useGlobalMute();
  const [isActualMuted, setIsActualMuted] = useState<boolean>(isMuted || !isSessionAudioUnlocked);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showCenterFeedback, setShowCenterFeedback] = useState(false);

  // Release hardware video decoders on unmount to prevent 3-5 video decoder freezing
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        releaseVideoHardwareDecoder(videoRef.current);
      }
    };
  }, []);

  const videoSrc = useMemo(() => {
    return normalizeVideoUrl(video.videoUrl);
  }, [video.videoUrl]);

  useEffect(() => {
    const el = videoRef.current;
    if (el) {
      const shouldBeMuted = isMuted || !isSessionAudioUnlocked;
      el.muted = shouldBeMuted;
      if (!shouldBeMuted) {
        try { el.volume = 1; } catch {}
      }
      if (hasStarted) {
        const p = el.play();
        if (p !== undefined) {
          p.then(() => {
            setIsPlaying(true);
            setIsActualMuted(el.muted);
          }).catch(() => {
            el.muted = true;
            setIsActualMuted(true);
            const retry = el.play();
            if (retry !== undefined) {
              retry.then(() => {
                setIsPlaying(true);
                if (isSessionAudioUnlocked && !isMuted) {
                  const restoreAudio = () => {
                    if (videoRef.current) {
                      videoRef.current.muted = false;
                      try { videoRef.current.volume = 1; } catch {}
                      setIsActualMuted(false);
                    }
                  };
                  window.addEventListener("touchstart", restoreAudio, { once: true, passive: true });
                  window.addEventListener("click", restoreAudio, { once: true, passive: true });
                }
              }).catch(() => {});
            }
          });
        }
      } else {
        try {
          el.pause();
        } catch (e) {}
        setIsPlaying(false);
      }
    }
  }, [hasStarted, videoSrc, isMuted, isSessionAudioUnlocked]);

  const sanitizedWebsiteUrl = useMemo(() => {
    const raw = websiteUrl || (video as any).websiteUrl || (video as any).placeWebsite;
    if (!raw) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return `https://${raw}`;
  }, [websiteUrl, (video as any).websiteUrl, (video as any).placeWebsite]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      } else if (e.key.toLowerCase() === 'm') {
        handleToggleMute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isMuted, isSessionAudioUnlocked, isActualMuted]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (!hasStarted) {
      setHasStarted(true);
    }
    if (videoRef.current.paused) {
      const shouldBeMuted = isMuted || !isSessionAudioUnlocked;
      videoRef.current.muted = shouldBeMuted;
      if (!shouldBeMuted) {
        try { videoRef.current.volume = 1; } catch {}
      }
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsActualMuted(videoRef.current?.muted ?? true);
        })
        .catch(() => {
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsActualMuted(true);
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
          }
        });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    setShowCenterFeedback(true);
    setTimeout(() => setShowCenterFeedback(false), 500);
  };

  const handleToggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    ensureSharedAudioContextUnlocked();

    const isCurrentlyMuted = isMuted || !isSessionAudioUnlocked || isActualMuted;
    if (isCurrentlyMuted) {
      unlockAudioSession();
      setIsActualMuted(false);
      if (videoRef.current) {
        videoRef.current.muted = false;
        try { videoRef.current.volume = 1; } catch {}
      }
    } else {
      setIsMuted(true);
      setIsActualMuted(true);
      if (videoRef.current) {
        videoRef.current.muted = true;
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    
    // Safety catch: force pause if it should be stopped but is moving
    if ((!hasStarted || !isPlaying) && !videoRef.current.paused) {
      videoRef.current.pause();
    }
    
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="video-modal-content bg-zinc-900 rounded-3xl overflow-hidden max-w-sm w-full shadow-2xl relative border border-zinc-800 flex flex-col max-h-[92vh] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between pointer-events-none">
          <div className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-bold text-white/90 border border-white/10 flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Customer Review • {placeName}</span>
          </div>
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={handleToggleMute}
              className={`h-8 rounded-full bg-black/85 hover:bg-black active:scale-90 backdrop-blur-2xl border flex items-center justify-center text-white transition-all cursor-pointer shadow-2xl ${
                isMuted || !isSessionAudioUnlocked || isActualMuted
                  ? "px-2.5 gap-1.5 border-white/50 animate-pulse-subtle bg-black/90"
                  : "w-8 border-white/35"
              }`}
              title={isMuted || !isSessionAudioUnlocked || isActualMuted ? "Tap to unmute" : "Mute sound"}
              aria-label={isMuted || !isSessionAudioUnlocked || isActualMuted ? "Tap to unmute" : "Mute sound"}
            >
              {isMuted || !isSessionAudioUnlocked || isActualMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-white stroke-[2.2] shrink-0" />
                  <span className="text-[10px] font-bold tracking-wide select-none whitespace-nowrap">
                    Tap to Unmute
                  </span>
                </>
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-white stroke-[2.2]" />
              )}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black transition-colors pointer-events-auto border border-white/10 cursor-pointer"
              aria-label="Close review"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Canvas with Tap-to-Play/Pause */}
        <div 
          className="aspect-9/16 bg-black relative overflow-hidden group cursor-pointer max-h-[55vh]"
          onClick={togglePlay}
        >
          <video
            ref={videoRef}
            src={videoSrc}
            playsInline
            disablePictureInPicture
            controlsList="nofullscreen nodownload noremoteplayback"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onCanPlay={() => {
              if (!hasStarted && videoRef.current) {
                videoRef.current.pause();
                setIsPlaying(false);
              }
            }}
            onPlaying={() => {
              if (!hasStarted && videoRef.current) {
                videoRef.current.pause();
                setIsPlaying(false);
              } else {
                setIsPlaying(true);
              }
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            className="w-full h-full object-cover select-none"
          />

          {/* Central Play/Pause Animation Feedback */}
          {(!hasStarted || showCenterFeedback) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 animate-in zoom-in-75 duration-300">
              <div className="w-16 h-16 rounded-full bg-black/75 backdrop-blur-md flex items-center justify-center text-white shadow-2xl border border-white/20">
                {isPlaying && hasStarted ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
              </div>
            </div>
          )}

          {/* Custom Controls */}
          <div 
            className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/95 via-black/50 to-transparent p-3.5 pt-8 flex flex-col gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Scrubber Progress Slider */}
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between text-white text-xs font-semibold">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={togglePlay}
                  className="p-1 rounded-full hover:bg-zinc-800/40 transition-colors cursor-pointer text-white"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                </button>
                
                <span className="font-mono text-[11px] text-zinc-200">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className={`h-7 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all cursor-pointer border flex items-center justify-center ${
                    isMuted || !isSessionAudioUnlocked || isActualMuted
                      ? "px-2.5 gap-1 border-white/40 animate-pulse-subtle"
                      : "w-7 border-white/15"
                  }`}
                  title={isMuted || !isSessionAudioUnlocked || isActualMuted ? "Tap to unmute" : "Mute"}
                >
                  {isMuted || !isSessionAudioUnlocked || isActualMuted ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-white shrink-0" />
                      <span className="text-[10px] font-bold">Unmute</span>
                    </>
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Details & Actions Section */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800 text-white space-y-3 select-none overflow-y-auto">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (onOpenCreator && video.author) {
                  onClose();
                  onOpenCreator(video.author);
                }
              }}
              className="flex items-center gap-2.5 truncate text-left group cursor-pointer hover:opacity-85 transition-opacity min-w-0"
              title={`View ${video.author?.name || 'Customer'}'s Profile`}
            >
              {video.author?.avatar ? (
                <img
                  src={video.author.avatar}
                  alt={video.author.name}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-zinc-700 group-hover:ring-white transition-all shrink-0"
                  referrerPolicy="no-referrer"
                 onError={(e) => { const target = e.currentTarget as HTMLImageElement; if (!target.src.includes('/api/avatar')) { target.src = '/api/avatar?name=User&background=27272a&color=fff'; } }} />
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-200 font-bold flex items-center justify-center text-xs group-hover:bg-zinc-700 group-hover:text-white transition-colors shrink-0">
                  {(video.author?.name || 'C').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="truncate min-w-0">
                <span className="font-bold text-xs text-white group-hover:text-zinc-200 transition-colors block truncate">
                  {video.author?.name || 'Customer Review'}
                </span>
                <span className="text-[10px] text-zinc-200 block truncate">
                  {formatRecordedDate(video.recordedAt, video.createdAtMs)}
                </span>
              </div>
            </button>
            <div className="flex items-center gap-1 text-white text-xs font-bold shrink-0 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">
              <Star className="w-3.5 h-3.5 fill-white text-white" />
              <span>{video.rating || 5}</span>
            </div>
          </div>

          {video.dishOrItem && (
            <div className="text-[11px] text-zinc-200 font-semibold flex items-center gap-1">
              <span>Reviewed Item:</span>
              <span className="text-zinc-200">{video.dishOrItem}</span>
            </div>
          )}

          {video.caption && (
            <p className="text-xs text-zinc-200 line-clamp-2 leading-relaxed italic bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
              "{video.caption}"
            </p>
          )}

          {/* Official Owner Response Card if present */}
          {video.ownerResponse && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-1 text-zinc-200">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-white">
                <BadgeCheck className="w-3.5 h-3.5 text-white" />
                <span>{t("businessDashboard.verifiedResponseFrom", "Verified Response from")} {placeName} ({t("businessDashboard.owner", "Owner")})</span>
              </div>
              <p className="text-xs text-zinc-200 font-medium italic">
                "{video.ownerResponse.text}"
              </p>
            </div>
          )}

          {/* Quick Hub Actions */}
          <div className="pt-2 border-t border-zinc-800 flex flex-col gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenPublicListing();
              }}
              className="w-full py-2.5 px-3 bg-white hover:bg-zinc-200 text-zinc-950 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{t("businessDashboard.viewOnPublicListing", "View On Yoouz Public Listing")}</span>
            </button>

            <div className="flex gap-2">
              {sanitizedWebsiteUrl && (
                <a
                  href={sanitizedWebsiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-[11px] font-bold transition-colors flex items-center justify-center gap-1 border border-zinc-700"
                >
                  <Globe className="w-3.5 h-3.5 text-zinc-200" />
                  <span className="truncate">{t("businessDashboard.visitWebsite", "Visit Website")}</span>
                  <ExternalLink className="w-3 h-3 text-zinc-200 shrink-0" />
                </a>
              )}
              {onReply && (
                <button
                  onClick={() => {
                    onClose();
                    onReply(video);
                  }}
                  className="flex-1 py-2 px-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[11px] font-bold transition-colors flex items-center justify-center gap-1 border border-zinc-700 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-white" />
                  <span>{t("businessDashboard.replyAsOwner", "Reply as Owner")}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  onClose = () => onNavigate('home'),
  onSendMessage,
  onDeleteThread,
  onMarkThreadRead,
  onUpdateMessages,
  onSelectVideo,
  onToggleFollow,
  onToggleFollowPlace,
  onMarkNotificationRead,
  onClearAllNotifications,
  onSaveNotificationSettings,
  onOpenLegal
}) => {
  const { language, setLanguage, languages, currentLanguageMeta, t, isRTL } = useLanguage();
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<BusinessTab>('overview');

  const [verifiedBusinessSession, setVerifiedBusinessSession] = useState<BusinessSession | null>(() => {
    try {
      const saved = localStorage.getItem('copo_business_verified_session');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Business Selection State
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>(() => {
    if (verifiedBusinessSession && verifiedBusinessSession.placeId && verifiedBusinessSession.placeId !== 'place-custom') {
      return verifiedBusinessSession.placeId;
    }
    if (initialPlace) return initialPlace.id;
    return places.length > 0 ? places[0].id : 'place-custom';
  });

  // Current selected place
  const currentPlace = useMemo(() => {
    // 1. If we have a verified session with place or domain
    if (verifiedBusinessSession) {
      const found = places.find(p => p.id === verifiedBusinessSession.placeId);
      if (found) return found;

      if (verifiedBusinessSession.domain || verifiedBusinessSession.businessEmail) {
        const derived = derivePlaceFromEmailOrDomain(
          verifiedBusinessSession.domain || verifiedBusinessSession.businessEmail,
          places
        );
        if (verifiedBusinessSession.placeName && verifiedBusinessSession.placeName !== 'Verified Business') {
          derived.name = verifiedBusinessSession.placeName;
        }
        if (verifiedBusinessSession.logoUrl) {
          derived.logoUrl = verifiedBusinessSession.logoUrl;
        }
        return derived as unknown as Place & { hours?: string; phone?: string; website?: string; description?: string; coverImage?: string; claimedByEmail?: string };
      }
    }

    const found = places.find(p => p.id === selectedPlaceId);
    if (found) return found;
    if (initialPlace && initialPlace.id === selectedPlaceId) return initialPlace;
    if (places.length > 0) return places[0];
    return derivePlaceFromEmailOrDomain('yoouz.com', places) as unknown as Place & { hours?: string; phone?: string; website?: string; description?: string; coverImage?: string; claimedByEmail?: string };
  }, [places, selectedPlaceId, initialPlace, verifiedBusinessSession]);

  // Plan & Pricing State (default to Pro for rich enterprise demo)
  const [currentPlan, setCurrentPlan] = useState<'none' | 'basic' | 'pro' | 'premium'>('pro');
  const [showPricingModal, setShowPricingModal] = useState(false);
  
  // Claiming Flow State (for onboarding new business)
  const [isClaiming, setIsClaiming] = useState(initialMode === 'claim');
  const [claimSearchQuery, setClaimSearchQuery] = useState('');
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

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
        setCurrentPlan('pro');
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
  const [profileAddress, setProfileAddress] = useState(currentPlace.address || '');
  const [profilePhone, setProfilePhone] = useState((currentPlace as any).phone || '');
  const [profileWebsite, setProfileWebsite] = useState((currentPlace as any).website || '');
  const [profileHours, setProfileHours] = useState((currentPlace as any).hours || 'Mon-Fri: 9:00 AM - 6:00 PM');
  const [profileDesc, setProfileDesc] = useState((currentPlace as any).description || `Official verified business profile on Yoouz.`);
  const [profileLogoUrl, setProfileLogoUrl] = useState(currentPlace.logoUrl || '');
  const [isProfileSaved, setIsProfileSaved] = useState(false);

  // Sync profile fields whenever currentPlace changes (e.g. on business login)
  useEffect(() => {
    if (currentPlace) {
      setProfileName(currentPlace.name || 'Verified Business');
      setProfileAddress(currentPlace.address || '');
      setProfilePhone((currentPlace as any).phone || '');
      setProfileWebsite((currentPlace as any).website || '');
      setProfileHours((currentPlace as any).hours || 'Mon-Fri: 9:00 AM - 6:00 PM');
      setProfileDesc((currentPlace as any).description || `Official verified business profile on Yoouz.`);
      if (currentPlace.city) setCity(currentPlace.city);
    }
  }, [currentPlace]);

  // Structured Physical Address State
  const [streetAddress, setStreetAddress] = useState('123 Main St, Suite 400');
  const [city, setCity] = useState(currentPlace.city || 'New York');
  const [stateRegion, setStateRegion] = useState('NY');
  const [zipCode, setZipCode] = useState('10001');
  const [selectedCountry, setSelectedCountry] = useState('United States');

  // Structured Phone & Dialing Code State
  const [phoneDialCode, setPhoneDialCode] = useState('+1');
  const [localPhone, setLocalPhone] = useState('(212) 555-0198');

  // Business Category & Amenities State
  const [businessCategory, setBusinessCategory] = useState(currentPlace.category || 'Dining & Artisanal Food');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    '📶 Free Wi-Fi',
    '🅿️ Onsite Parking',
    '♿ Accessible Entrance',
    '🌱 Fresh Ingredients'
  ]);

  // Structured Operating Hours Schedule State
  const [weeklySchedule, setWeeklySchedule] = useState<{ day: string; status: 'open' | '24h' | 'closed'; openTime: string; closeTime: string }[]>([
    { day: 'Monday', status: 'open', openTime: '08:00 AM', closeTime: '10:00 PM' },
    { day: 'Tuesday', status: 'open', openTime: '08:00 AM', closeTime: '10:00 PM' },
    { day: 'Wednesday', status: 'open', openTime: '08:00 AM', closeTime: '10:00 PM' },
    { day: 'Thursday', status: 'open', openTime: '08:00 AM', closeTime: '10:00 PM' },
    { day: 'Friday', status: 'open', openTime: '08:00 AM', closeTime: '10:00 PM' },
    { day: 'Saturday', status: 'open', openTime: '09:00 AM', closeTime: '11:00 PM' },
    { day: 'Sunday', status: 'open', openTime: '09:00 AM', closeTime: '11:00 PM' },
  ]);

  // Re-sync profile fields when currentPlace changes
  useEffect(() => {
    setProfileName(currentPlace.name || '');
    setProfileWebsite((currentPlace as any).website || '');
    setProfileDesc((currentPlace as any).description || '');
    setProfileLogoUrl(currentPlace.logoUrl || '');
    setBusinessCategory(currentPlace.category || 'Dining & Artisanal Food');

    if (currentPlace.address) {
      const parts = currentPlace.address.split(',').map(s => s.trim());
      if (parts.length >= 3) {
        setStreetAddress(parts[0] || '');
        setCity(parts[1] || 'New York');
        const stateZip = (parts[2] || '').split(' ');
        if (stateZip.length >= 1) setStateRegion(stateZip[0] || 'NY');
        if (stateZip.length >= 2) setZipCode(stateZip[1] || '10001');
        if (parts.length >= 4) setSelectedCountry(parts[3] || 'United States');
      } else {
        setStreetAddress(currentPlace.address);
      }
    }

    if ((currentPlace as any).phone) {
      const rawPhone = (currentPlace as any).phone as string;
      if (rawPhone.startsWith('+')) {
        const spaceIdx = rawPhone.indexOf(' ');
        if (spaceIdx > 0) {
          setPhoneDialCode(rawPhone.substring(0, spaceIdx));
          setLocalPhone(rawPhone.substring(spaceIdx + 1));
        } else {
          setLocalPhone(rawPhone);
        }
      } else {
        setLocalPhone(rawPhone);
      }
    }
  }, [selectedPlaceId, currentPlace]);

  // Sync profileAddress string from structured address fields
  useEffect(() => {
    const parts = [streetAddress, city, stateRegion, zipCode, selectedCountry].filter(Boolean);
    const formatted = parts.join(', ');
    if (formatted) setProfileAddress(formatted);
  }, [streetAddress, city, stateRegion, zipCode, selectedCountry]);

  // Handle Country Selection with Automatic State/Province & Dial Code Recognition
  const handleCountryChange = (newCountry: string) => {
    const c = newCountry || 'United States';
    setSelectedCountry(c);

    // Auto-update dialing code for the selected country
    const dialInfo = getCountryDialInfo(c);
    if (dialInfo?.dialCode) {
      setPhoneDialCode(dialInfo.dialCode);
    }

    // Reset default US placeholder/dummy phone if moving away from US
    if (c !== 'United States') {
      if (localPhone === '(212) 555-0198' || localPhone === '212 555-0198' || localPhone === '(212)555-0198' || localPhone === '2125550198') {
        setLocalPhone('');
      }
    }

    const selectedCountry = Country.getAllCountries().find(countryObj => countryObj.name === c);
    if (selectedCountry) {
      const statesObj = State.getStatesOfCountry(selectedCountry.isoCode);
      if (statesObj.length > 0) {
        setStateRegion(statesObj[0].name);
        const citiesObj = City.getCitiesOfState(selectedCountry.isoCode, statesObj[0].isoCode);
        setCity(citiesObj[0]?.name || '');
      } else {
        setStateRegion('');
        const citiesObj = City.getCitiesOfCountry(selectedCountry.isoCode);
        setCity(citiesObj[0]?.name || '');
      }
    } else {
      setStateRegion('');
      setCity('');
    }

    if (c !== 'United States' && zipCode === '10001') {
      setZipCode('');
    }
  };

  // Derived country dial and postal formatting info
  const activeCountryDialInfo = useMemo(() => {
    return getCountryDialInfo(selectedCountry);
  }, [selectedCountry]);

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
    const formattedPhone = `${phoneDialCode} ${localPhone}`.trim();
    if (formattedPhone) setProfilePhone(formattedPhone);
  }, [phoneDialCode, localPhone]);

  // Sync profileHours string from weekly schedule
  useEffect(() => {
    const openDays = weeklySchedule.filter(d => d.status !== 'closed');
    if (openDays.length === 0) {
      setProfileHours('Temporarily Closed');
      return;
    }
    const all24h = weeklySchedule.every(d => d.status === '24h');
    if (all24h) {
      setProfileHours('Open 24/7 (Mon - Sun)');
      return;
    }
    const monToFri = weeklySchedule.slice(0, 5);
    const satSun = weeklySchedule.slice(5, 7);
    const monFriSame = monToFri.every(d => d.status === monToFri[0].status && d.openTime === monToFri[0].openTime && d.closeTime === monToFri[0].closeTime);
    const satSunSame = satSun.every(d => d.status === satSun[0].status && d.openTime === satSun[0].openTime && d.closeTime === satSun[0].closeTime);

    if (monFriSame && satSunSame) {
      const mfStr = monToFri[0].status === 'closed' ? 'Mon-Fri: Closed' : monToFri[0].status === '24h' ? 'Mon-Fri: 24 Hours' : `Mon-Fri: ${monToFri[0].openTime} - ${monToFri[0].closeTime}`;
      const ssStr = satSun[0].status === 'closed' ? 'Sat-Sun: Closed' : satSun[0].status === '24h' ? 'Sat-Sun: 24 Hours' : `Sat-Sun: ${satSun[0].openTime} - ${satSun[0].closeTime}`;
      setProfileHours(`${mfStr} • ${ssStr}`);
    } else {
      const summary = weeklySchedule
        .filter(d => d.status !== 'closed')
        .map(d => `${d.day.slice(0, 3)}: ${d.status === '24h' ? '24h' : `${d.openTime}-${d.closeTime}`}`)
        .join(' • ');
      setProfileHours(summary || 'Open Daily');
    }
  }, [weeklySchedule]);

  // Creem Checkout & Subscription Billing State
  const [showCreemCheckout, setShowCreemCheckout] = useState(false);
  const [creemPlan, setCreemPlan] = useState<'pro' | 'premium'>('pro');
  const [billingEmail, setBillingEmail] = useState(() => verifiedBusinessSession?.businessEmail || (currentPlace as any).claimedByEmail || 'business@domain.com');
  const [paymentMethodDisplay, setPaymentMethodDisplay] = useState('Visa ending in 4242');
  const [isAutoRenew, setIsAutoRenew] = useState(true);
  const [renewalDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  });
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Reviews Moderation & Reply State
  const [reviewsFilter, setReviewsFilter] = useState<'all' | '5' | '4' | '3'>('all');
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [ownerReplies, setOwnerReplies] = useState<Record<string, string>>({});
  const [expandedCommentsMap, setExpandedCommentsMap] = useState<Record<string, boolean>>({});
  const [activeVideoModal, setActiveVideoModal] = useState<VideoReview | null>(null);

  // Email Invites & QR Standee Studio State
  const [customerEmails, setCustomerEmails] = useState('');
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [emailSendResult, setEmailSendResult] = useState<{success?: boolean; message?: string} | null>(null);
  const [qrStandeeStyle, setQrStandeeStyle] = useState<'acrylic_standee' | 'decal_badge' | 'receipt_card'>('acrylic_standee');
  const [qrCustomHeading, setQrCustomHeading] = useState('LEAVE A 60-SECOND VIDEO REVIEW');
  const [qrTableLabel, setQrTableLabel] = useState('');
  const [qrLinkCopied, setQrLinkCopied] = useState(false);
  const [inviteChannel, setInviteChannel] = useState<'email' | 'whatsapp'>('email');
  const [includeIncentive, setIncludeIncentive] = useState(true);
  const [incentiveText, setIncentiveText] = useState('Get 10% off your next visit when you record a 60s video review!');
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Custom Invite Messaging & Dynamic Tags State
  const [inviteSubject, setInviteSubject] = useState('');
  const [inviteGreetingStyle, setInviteGreetingStyle] = useState<'smart_tag' | 'generic' | 'none'>('smart_tag');
  const [inviteBodyText, setInviteBodyText] = useState('');

  // Keep default subject and body text in sync with selected business name
  useEffect(() => {
    setInviteSubject(`How was your experience with ${currentPlace.name}? Leave a video review!`);
    setInviteBodyText(`Thank you for choosing ${currentPlace.name}! We value your business and would love to hear your feedback. Tap below to record a 60-second video review directly from your phone.`);
  }, [selectedPlaceId, currentPlace.name]);

  // Embed Customizer & Curation State
  const [embedTheme, setEmbedTheme] = useState<'google_light' | 'minimal_dark' | 'card_compact'>('minimal_dark');
  const [embedLayout, setEmbedLayout] = useState<'grid' | 'carousel' | 'badge'>('grid');
  const [embedAccentColor, setEmbedAccentColor] = useState<string>('#ffffff');
  const [embedFormat, setEmbedFormat] = useState<'script' | 'iframe'>('script');
  const [embedShowStars, setEmbedShowStars] = useState(true);
  const [embedShowVerifiedBadge, setEmbedShowVerifiedBadge] = useState(true);
  const [embedShowTrustHeader, setEmbedShowTrustHeader] = useState(true);
  const [embedStarFilter, setEmbedStarFilter] = useState<'all' | '5' | '4plus' | '3plus' | 'pinned_only'>('all');
  const [pinnedVideoIds, setPinnedVideoIds] = useState<string[]>([]);
  const [hiddenVideoIds, setHiddenVideoIds] = useState<string[]>([]);
  const [pinNotice, setPinNotice] = useState<string | null>(null);
  const [isCodeCopied, setIsCodeCopied] = useState(false);

  // Top header dropdowns & Command Palette
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);

  // Business Notification Preferences (Persisted across local storage, component state, and Firestore)
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

  // Effective Business User Profile for Messaging & Collaboration
  const effectiveUser: UserProfile = useMemo(() => {
    const base = verifiedBusinessSession ? {
      id: verifiedBusinessSession.placeId,
      uid: verifiedBusinessSession.placeId,
      name: verifiedBusinessSession.placeName || currentPlace?.name || 'Business Manager',
      email: verifiedBusinessSession.businessEmail || (currentPlace as any)?.claimedByEmail || 'business@yoouz.com',
      avatar: verifiedBusinessSession.logoUrl || currentPlace?.logoUrl || currentPlace?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      handle: (verifiedBusinessSession.domain || currentPlace?.name || 'business').toLowerCase().replace(/[^a-z0-9]/g, ''),
      isVerified: true
    } : currentUser ? { ...currentUser } : {
      id: currentPlace?.id || 'unknown',
      uid: currentPlace?.id || 'unknown',
      name: currentPlace?.name || 'Business Portal',
      email: (currentPlace as any)?.claimedByEmail || 'business@yoouz.com',
      avatar: currentPlace?.logoUrl || currentPlace?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      handle: (currentPlace?.name || 'business').toLowerCase().replace(/[^a-z0-9]/g, ''),
      isVerified: true
    };

    return {
      ...base,
      notificationSettings: businessNotificationSettings
    };
  }, [currentUser, verifiedBusinessSession, currentPlace, businessNotificationSettings]);

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

  // Filter videos strictly for this verified place
  const placeVideos = useMemo(() => {
    return videos.filter(v => 
      v.placeId === selectedPlaceId || 
      (v.placeName && currentPlace.name && v.placeName.toLowerCase() === currentPlace.name.toLowerCase())
    );
  }, [videos, selectedPlaceId, currentPlace.name]);

  // Real Business Followers List derived from all registered users and community reviewers
  const businessFollowers = useMemo(() => {
    if (!currentPlace) return [];
    const placeId = currentPlace.id;
    const placeNameLower = (currentPlace.name || '').toLowerCase().trim();

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
    }>();

    // 1. Users from allUsers who follow this place
    (allUsers || []).forEach((u: any) => {
      const followedPlaces = Array.isArray(u.followedPlaces) ? u.followedPlaces : [];
      if (followedPlaces.includes(placeId)) {
        const handle = (u.handle || u.name || '').toLowerCase().replace(/^@/, '');
        const key = u.id || u.email || handle;
        map.set(key, {
          id: u.id || u.uid || key,
          name: u.name || 'Yoouz User',
          handle: handle || 'user',
          avatar: u.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80`,
          isReviewer: false,
          reviewCount: 0,
          followedAt: 'Recent',
          isFollowedBack: Boolean(currentUser?.followedAuthors?.some(a => a.toLowerCase().replace(/^@/, '') === handle))
        });
      }
    });

    // 2. Reviewers who created a video review for this place (authentic customer advocates)
    const placeReviews = (videos || []).filter(v => 
      v.placeId === placeId || (v.placeName && v.placeName.toLowerCase().trim() === placeNameLower)
    );

    placeReviews.forEach((rev) => {
      const author = rev.author;
      if (!author) return;
      const authorName = (author.name || '').trim();
      const authorHandle = (author.name || '').toLowerCase().replace(/^@/, '').trim();
      const key = (rev.userId || (author as any).id || authorHandle).toLowerCase();

      const existing = map.get(key);
      if (existing) {
        existing.isReviewer = true;
        existing.reviewCount = (existing.reviewCount || 0) + 1;
        if (!existing.rating && rev.rating) existing.rating = rev.rating;
        if (!existing.lastReviewSnippet && (rev.caption || (rev as any).text)) {
          existing.lastReviewSnippet = rev.caption || (rev as any).text;
        }
      } else {
        map.set(key, {
          id: rev.userId || (author as any).id || (author as any).uid || key,
          name: authorName || 'Customer Reviewer',
          handle: authorHandle || 'reviewer',
          avatar: author.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80`,
          isReviewer: true,
          reviewCount: 1,
          rating: rev.rating,
          lastReviewSnippet: rev.caption || (rev as any).text,
          followedAt: rev.createdAt || 'Recent',
          isFollowedBack: Boolean(currentUser?.followedAuthors?.some(a => a.toLowerCase().replace(/^@/, '') === authorHandle))
        });
      }
    });

    // 3. Current user if they have followed or saved this place
    if (currentUser) {
      const myFollowedPlaces = currentUser.followedPlaces || [];
      let storedFollowed: string[] = [];
      try {
        storedFollowed = JSON.parse(localStorage.getItem('copo_saved_place_ids') || '[]');
      } catch (e) {}
      if (myFollowedPlaces.includes(placeId) || storedFollowed.includes(placeId)) {
        const myKey = currentUser.id || currentUser.email || 'me';
        if (!map.has(myKey)) {
          const myHandle = (currentUser.handle || currentUser.name || 'me').toLowerCase().replace(/^@/, '');
          map.set(myKey, {
            id: myKey,
            name: currentUser.name || 'You',
            handle: myHandle,
            avatar: currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
            isReviewer: false,
            reviewCount: 0,
            followedAt: 'Saved',
            isFollowedBack: true
          });
        }
      }
    }

    return Array.from(map.values());
  }, [currentPlace, allUsers, videos, currentUser]);

  const filteredFollowers = useMemo(() => {
    if (!followerSearchQuery.trim()) return businessFollowers;
    const q = followerSearchQuery.toLowerCase().trim();
    return businessFollowers.filter(f => 
      f.name.toLowerCase().includes(q) || 
      f.handle.toLowerCase().includes(q) ||
      (f.lastReviewSnippet && f.lastReviewSnippet.toLowerCase().includes(q))
    );
  }, [businessFollowers, followerSearchQuery]);

  const unreadMessagesCount = useMemo(() => {
    return (messages || []).reduce((acc, m) => acc + (m.unreadCount || 0), 0);
  }, [messages]);

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

  // Count reviews that need owner attention (unreplied)
  const unrepliedReviewsCount = useMemo(() => {
    return placeVideos.filter(
      (v) => !ownerReplies[v.id] && !v.ownerResponse?.text
    ).length;
  }, [placeVideos, ownerReplies]);

  // Business Notifications computed from props and active notification preferences
  const businessNotifications = useMemo(() => {
    if (!notifications || notifications.length === 0) return [];
    const pName = (currentPlace.name || '').toLowerCase();
    const placeVideoIds = new Set(placeVideos.map(v => v.id));

    return notifications.filter(n => {
      // 1. Master toggle: If disabled in settings, pause all notifications
      if (!businessNotificationSettings.enabled) return false;

      // 2. Granular category filters based on user settings
      if (n.type === 'like' && !businessNotificationSettings.likes) return false;
      if (n.type === 'comment' && !businessNotificationSettings.comments) return false;
      if (n.type === 'message' && !businessNotificationSettings.messages) return false;
      if (n.type === 'follow' && !businessNotificationSettings.follows) return false;
      if ((n.type === 'bookmark' || n.type === 'repost') && !businessNotificationSettings.bookmarks) return false;

      // 3. Relevance to this business venue
      if (n.placeName && n.placeName.toLowerCase() === pName) return true;
      if (n.videoId && placeVideoIds.has(n.videoId)) return true;
      return true;
    });
  }, [notifications, currentPlace, placeVideos, businessNotificationSettings]);

  const unreadBusinessNotifsCount = useMemo(() => {
    const unread = businessNotifications.filter(n => !n.isRead).length;
    return unread + unrepliedReviewsCount;
  }, [businessNotifications, unrepliedReviewsCount]);

  // Dynamic KPIs calculated strictly from real data
  const totalReviews = placeVideos.length;
  const avgRating = totalReviews > 0 ? (placeVideos.reduce((acc, v) => acc + (v.rating || 5), 0) / totalReviews).toFixed(1) : '0.0';
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
  const handleSelectPlan = (plan: 'basic' | 'pro' | 'premium') => {
    if (plan === 'pro' || plan === 'premium') {
      setCreemPlan(plan);
      setShowPricingModal(false);
      setShowCreemCheckout(true);
    } else {
      setCurrentPlan(plan);
      setShowPricingModal(false);
    }
  };

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

  const handleSaveProfile = () => {
    (currentPlace as any).name = profileName;
    (currentPlace as any).address = profileAddress;
    (currentPlace as any).phone = profilePhone;
    (currentPlace as any).website = profileWebsite;
    (currentPlace as any).hours = profileHours;
    (currentPlace as any).description = profileDesc;
    (currentPlace as any).category = businessCategory;
    currentPlace.logoUrl = profileLogoUrl;

    if (verifiedBusinessSession) {
      const updatedSession = { ...verifiedBusinessSession, logoUrl: profileLogoUrl, placeName: profileName };
      setVerifiedBusinessSession(updatedSession);
      try {
        localStorage.setItem('copo_business_verified_session', JSON.stringify(updatedSession));
      } catch (e) {}
    }

    try {
      localStorage.setItem(`copo_business_profile_${selectedPlaceId}`, JSON.stringify({
        name: profileName,
        address: profileAddress,
        phone: profilePhone,
        website: profileWebsite,
        hours: profileHours,
        description: profileDesc,
        category: businessCategory,
        streetAddress,
        city,
        stateRegion,
        zipCode,
        country: selectedCountry,
        weeklySchedule,
        selectedAmenities,
      }));
    } catch (e) {
      console.warn('Failed to save profile to localStorage:', e);
    }

    setIsProfileSaved(true);
    setTimeout(() => setIsProfileSaved(false), 3000);
  };

  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [orderingKitType, setOrderingKitType] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState('123 Culinary Row, Suite B');
  const [kitQuantity, setKitQuantity] = useState(1);

  const handleOrderPhysicalKit = (kitName: string) => {
    setOrderingKitType(kitName);
    setTimeout(() => {
      setOrderSubmitted(true);
      setOrderingKitType(null);
      setTimeout(() => setOrderSubmitted(false), 5000);
    }, 1500);
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById("yoouz-qr-code") as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${currentPlace.name.toLowerCase().replace(/\s+/g, '-')}-yoouz-qr.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const togglePinVideo = (id: string) => {
    if (pinnedVideoIds.includes(id)) {
      setPinnedVideoIds(prev => prev.filter(item => item !== id));
      setPinNotice('Removed video from pinned top section.');
    } else {
      if (pinnedVideoIds.length >= 3) {
        setPinNotice('Maximum 3 videos can be pinned to the top of your website widget.');
        setTimeout(() => setPinNotice(null), 3500);
        return;
      }
      setPinnedVideoIds(prev => [...prev, id]);
      setHiddenVideoIds(prev => prev.filter(item => item !== id));
      setPinNotice('📌 Video pinned to the top of your website widget!');
    }
    setTimeout(() => setPinNotice(null), 3500);
  };

  const toggleHideVideo = (id: string) => {
    if (hiddenVideoIds.includes(id)) {
      setHiddenVideoIds(prev => prev.filter(item => item !== id));
      setPinNotice('Video restored to widget carousel.');
    } else {
      setHiddenVideoIds(prev => [...prev, id]);
      setPinnedVideoIds(prev => prev.filter(item => item !== id));
      setPinNotice('👁️ Video hidden from website widget.');
    }
    setTimeout(() => setPinNotice(null), 3500);
  };

  const copyEmbedCode = () => {
    const pinnedAttr = pinnedVideoIds.length > 0 ? `\n  data-pinned-ids="${pinnedVideoIds.join(',')}"` : '';
    const hiddenAttr = hiddenVideoIds.length > 0 ? `\n  data-hidden-ids="${hiddenVideoIds.join(',')}"` : '';
    const embedSnippet = `<div id="yoouz-widget"\n  data-place-id="${selectedPlaceId}"\n  data-theme="${embedTheme}"\n  data-star-filter="${embedStarFilter}"\n  data-show-stars="${embedShowStars}"\n  data-show-verified="${embedShowVerifiedBadge}"\n  data-show-trust-header="${embedShowTrustHeader}"${pinnedAttr}${hiddenAttr}>\n</div>\n<script src="https://cdn.yoouz.com/embed/v2.js" async defer></script>`;
    navigator.clipboard.writeText(embedSnippet);
    setIsCodeCopied(true);
    setTimeout(() => setIsCodeCopied(false), 2500);
  };

  // Compute displayable videos for Widget Preview and Website Embed
  const displayableWidgetVideos = useMemo(() => {
    return placeVideos
      .filter(v => {
        if (hiddenVideoIds.includes(v.id)) return false;
        const rating = v.rating || 5;
        if (embedStarFilter === '5') return rating === 5;
        if (embedStarFilter === '4plus') return rating >= 4;
        if (embedStarFilter === '3plus') return rating >= 3;
        if (embedStarFilter === 'pinned_only') return pinnedVideoIds.includes(v.id);
        return true;
      })
      .sort((a, b) => {
        const aPinned = pinnedVideoIds.includes(a.id);
        const bPinned = pinnedVideoIds.includes(b.id);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return 0;
      });
  }, [placeVideos, hiddenVideoIds, embedStarFilter, pinnedVideoIds]);

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

  const handleSaveReply = (id: string) => {
    const text = replyText.trim();
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

  // Nav Items array with clean Google Material icons
  const suiteNavItems = [
    { id: 'overview' as BusinessTab, label: t('business.overview', 'Overview'), icon: BarChart3 },
    { 
      id: 'reviews' as BusinessTab, 
      label: t('business.videoReviews', 'Video Reviews'), 
      icon: Video, 
      badge: unrepliedReviewsCount > 0 ? unrepliedReviewsCount : undefined 
    },
    { 
      id: 'inbox' as BusinessTab, 
      label: t('nav.messages', 'Messages'), 
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined
    },
    { 
      id: 'followers' as BusinessTab, 
      label: t('business.followers', 'Followers'), 
      icon: Users,
      badge: businessFollowers.length > 0 ? businessFollowers.length : undefined
    },
    { 
      id: 'notifications' as BusinessTab, 
      label: t('nav.notifications', 'Notifications'), 
      icon: Bell,
      badge: unreadBusinessNotifsCount > 0 ? unreadBusinessNotifsCount : undefined
    },
    { id: 'embed' as BusinessTab, label: t('business.embed', 'Embed'), icon: Code },
    { id: 'qr_invites' as BusinessTab, label: t('business.invites', 'Invites'), icon: QrCode },
    { id: 'profile' as BusinessTab, label: t('business.profile', 'Profile'), icon: Building2 },
    { id: 'billing' as BusinessTab, label: t('business.billing', 'Billing'), icon: CreditCard, isProBadge: currentPlan === 'pro' || currentPlan === 'premium' },
  ];

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
        onCancelSelectedPlace={() => {
          setIsClaiming(false);
          if (onClearInitialPlace) {
            onClearInitialPlace();
          }
        }}
        onSuccessAuth={(session) => {
          setVerifiedBusinessSession(session);
          setSelectedPlaceId(session.placeId);
          setCurrentPlan('pro');
          setIsClaiming(false);
        }}
      />
    );
  }

  return (
    <div className="w-screen h-[100dvh] flex bg-zinc-950 select-none antialiased overflow-hidden font-sans text-white copo-business-dashboard">
      <div className="w-full h-full flex">
      {/* Left Google Enterprise Navigation Sidebar (Matching CopoSidebar exactly) */}
      <aside className="w-64 h-[100dvh] bg-zinc-950 border-r border-zinc-800/80 px-4 py-6 flex flex-col justify-between shrink-0 select-none hidden md:flex z-50 copo-business-sidebar text-white shadow-none">
        {/* Scrollable Upper Area */}
        <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar min-h-0">
          <div className="flex flex-col gap-6">
            {/* Official Yoouz Brand Logo */}
            <div 
              id="biz-brand-logo"
              className="flex items-center gap-3 px-3 py-2 cursor-pointer group"
              onClick={() => onNavigate('home')}
            >
              <div className="relative flex items-center justify-center w-[42px] h-[42px] rounded-[14px] bg-white shadow-[0_4px_16px_rgba(255,255,255,0.15)] group-hover:shadow-[0_6px_20px_rgba(255,255,255,0.25)] group-hover:-translate-y-0.5 transition-all duration-300 shrink-0 border border-white/20">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-zinc-950">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div className="flex flex-col justify-center pt-0.5 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-white text-[23px] font-black tracking-tight leading-none font-['Google_Sans',sans-serif]">
                    Yoouz
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[9px] text-zinc-200 font-black uppercase tracking-wider scale-90 origin-left">
                    {t("business.badge", "BUSINESS")}
                  </span>
                </div>
                <span className="text-[11.5px] text-zinc-200 font-medium tracking-tight mt-1 whitespace-nowrap flex items-center gap-1.5">
                  {t("business.tagline", "Real People. Real Reviews.")}
                </span>
              </div>
            </div>

            {/* Navigation items list */}
            <div>
              <div className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-200 mb-1">
                {t("business.managementSuite", "Management Suite")}
              </div>

              <nav className="flex flex-col gap-1.5 mt-1">
                {suiteNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`biz-nav-btn-${item.id}`}
                      onClick={() => setActiveTab(item.id)}
                      className={`relative flex items-center gap-3.5 px-4 py-3 rounded-full text-[15px] transition-all duration-150 text-left cursor-pointer group ${
                        isActive 
                          ? 'bg-zinc-900 border border-zinc-700/80 text-white font-bold shadow-xs' 
                          : 'text-white hover:bg-zinc-900/90 font-medium'
                      }`}
                    >
                      <div className="relative flex items-center justify-center">
                        <Icon className="w-5 h-5 shrink-0 transition-colors text-white" />
                      </div>
                      <span className="truncate flex-1">{item.label}</span>
                      {item.badge !== undefined && (
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-zinc-800 text-white border border-zinc-700">
                          {item.badge}
                        </span>
                      )}
                      {item.isProBadge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide shrink-0 bg-zinc-800 text-zinc-200 border border-zinc-700">
                          {t("business.active", "Active")}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Pinned Desktop Footer & Legal Links (Matching user account CopoSidebar exactly) */}
        <div className="pt-4 border-t border-zinc-800/80 flex flex-col gap-2 shrink-0 bg-zinc-950">
          <div className="flex items-center gap-2 text-xs text-zinc-200 font-medium">
            <button
              type="button"
              onClick={() => onOpenLegal ? onOpenLegal("privacy") : onNavigate('home')}
              className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0"
            >
              {t("legal.privacy", "Privacy")}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onOpenLegal ? onOpenLegal("terms") : onNavigate('home')}
              className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0"
            >
              {t("legal.terms", "Terms")}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onNavigate('more')}
              className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0"
            >
              {t("legal.about", "About")}
            </button>
          </div>
          <p className="text-xs text-zinc-200 font-normal">
            {t("legal.allRightsReserved", "© 2026 Yoouz. All rights reserved.")}
          </p>
        </div>
      </aside>
        
        {/* Right side content wrapper */}
        <div className="flex-1 flex flex-col overflow-hidden relative bg-zinc-950">
          
          {/* Refined Enterprise Header (Sleek Dark Theme) */}
          <header className="w-full h-14 sm:h-15 bg-zinc-950 border-b border-zinc-800/80 px-3 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 z-30 relative">
            
            {/* Left: Mobile Exit Back Button & Platform Scope */}
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              {/* Mobile Exit Back Button */}
              <button
                onClick={onClose}
                className="md:hidden p-2 rounded-xl bg-zinc-900 active:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 text-xs font-bold transition-all shrink-0 cursor-pointer"
                title="Back to Yoouz Feed"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              {/* Verified Workspace Scope Badge */}
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-zinc-900 text-zinc-200 text-[10.5px] sm:text-xs font-bold border border-zinc-800 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  <span>{t("business.verifiedLocation", "Verified Business Portal")}</span>
                </span>
              </div>
            </div>

            {/* Right: Clean, Uncluttered Utility Bar */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Quick Merchant Support / Docs Button */}
              <button
                type="button"
                id="biz-header-help-trigger"
                onClick={() => setShowHelpModal(true)}
                className="h-9 sm:h-10 px-2.5 sm:px-3 flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-xl transition-all shrink-0 cursor-pointer text-xs font-semibold shadow-xs"
                title={t("business.openGuideDocs", "Open Guide & Docs")}
              >
                <HelpCircle className="w-4 h-4 text-zinc-400" />
                <span className="hidden sm:inline">{t("business.support", "Support")}</span>
              </button>

              {/* Profile / Account Control with Spacious Dark-Mode Adaptive Logo */}
              <div className="relative">
                <button 
                  id="biz-header-account-trigger"
                  onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                  className="h-9 sm:h-10 px-2 sm:px-3 flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 rounded-xl transition-all shrink-0 cursor-pointer text-xs font-semibold group shadow-xs"
                  title="Business Account Menu"
                >
                  {/* Dedicated Logo Container with Inset Padding for Any Dark/Light Logo */}
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-zinc-950 text-white border border-zinc-700/80 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden p-0.5 shadow-2xs">
                    {currentPlace.logoUrl ? (
                      <img 
                        src={currentPlace.logoUrl} 
                        alt={currentPlace.name} 
                        loading="eager" 
                        decoding="sync" 
                        fetchPriority="high" 
                        className="w-full h-full object-contain rounded-md"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }} 
                      />
                    ) : (
                      <span className="font-black text-[11px] text-white">
                        {currentPlace.name?.charAt(0).toUpperCase() || 'B'}
                      </span>
                    )}
                  </div>

                  <span className="font-bold text-xs text-white max-w-[110px] sm:max-w-[160px] truncate">
                    {currentPlace.name}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform ${showAccountDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Business Account Dropdown */}
                {showAccountDropdown && (
                  <div className="fixed top-[60px] right-3 w-[270px] sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:mt-2 sm:w-68 bg-zinc-900 rounded-2xl border border-zinc-800 text-white shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-3 border-b border-zinc-800 mb-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white border border-zinc-700/80 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden p-0.5">
                          {currentPlace.logoUrl ? (
                            <img 
                              src={currentPlace.logoUrl} 
                              alt={currentPlace.name} 
                              className="w-full h-full object-contain rounded-lg"
                            />
                          ) : (
                            <span className="font-black text-xs text-white">
                              {currentPlace.name?.charAt(0).toUpperCase() || 'B'}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="font-extrabold text-white text-sm truncate">{currentPlace.name}</span>
                            <ShieldCheck className="w-3.5 h-3.5 text-white shrink-0" />
                          </div>
                          <div className="text-[11px] text-zinc-400 truncate mt-0.5 font-medium">
                            {verifiedBusinessSession?.businessEmail || (currentPlace as any).claimedByEmail || 'business@domain.com'}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        {t("business.proTierActive", "Pro Tier Active")}
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setActiveTab('profile');
                        setShowAccountDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-800 transition-colors text-left text-xs font-semibold text-zinc-200 cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-zinc-200" />
                      <span>{t("business.profile", "Profile")}</span>
                    </button>
                    <button 
                      onClick={() => {
                        setShowAccountDropdown(false);
                        setIsNotificationSettingsOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-800 transition-colors text-left text-xs font-semibold text-zinc-200 cursor-pointer"
                    >
                      <Bell className="w-4 h-4 text-zinc-200" />
                      <span>{t("nav.notifications", "Notifications")}</span>
                    </button>
                    <button 
                      onClick={() => {
                        setActiveTab('billing');
                        setShowAccountDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-800 transition-colors text-left text-xs font-semibold text-zinc-200 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4 text-zinc-200" />
                      <span>{t("business.billing", "Billing")}</span>
                    </button>
                    <button 
                      onClick={() => {
                        setShowAccountDropdown(false);
                        setShowHelpModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-800 transition-colors text-left text-xs font-semibold text-zinc-200 cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4 text-zinc-200" />
                      <span>{t("business.guideSupport", "Guide & Support")}</span>
                    </button>
                    <button 
                      onClick={() => {
                        setShowAccountDropdown(false);
                        setIsClaiming(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-800 transition-colors text-left text-xs font-semibold text-zinc-200 cursor-pointer"
                    >
                      <Building2 className="w-4 h-4 text-zinc-200" />
                      <span>{t("business.switchClaimVenue", "Switch or Claim Venue")}</span>
                    </button>
                    
                    <button 
                      onClick={() => {
                        setShowAccountDropdown(false);
                        onNavigate('home');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-800 transition-colors text-left text-xs font-semibold text-zinc-200 cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4 text-zinc-200" />
                      <span>{t("business.viewPublicListing", "View Public Listing")}</span>
                    </button>
                    
                    <div className="h-px bg-zinc-800 my-1" />
                    
                    <button 
                      onClick={() => {
                        setShowAccountDropdown(false);
                        localStorage.removeItem('copo_business_verified_session');
                        window.dispatchEvent(new CustomEvent('copo_business_auth_changed', { detail: null }));
                        setVerifiedBusinessSession(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-500/10 transition-colors text-left text-xs font-bold text-red-400 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-red-400" />
                      <span>{t("business.signOutBusiness", "Sign Out of Business")}</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          </header>

          {/* Top Mobile Pill Scroller (Clean, High-Contrast Dark Mode) */}
          <div className="md:hidden w-full bg-zinc-950 border-b border-zinc-800/80 px-2 py-2.5 shrink-0 z-20">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth px-1">
              {suiteNavItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-2 shrink-0 transition-all cursor-pointer active:scale-95 ${
                      isActive 
                        ? 'bg-zinc-900 border border-zinc-700/80 text-white font-bold shadow-xs' 
                        : 'bg-zinc-950 text-white hover:bg-zinc-900 border border-zinc-800 font-medium'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-white shrink-0" />
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="w-4 h-4 rounded-full bg-zinc-800 text-white text-[10px] flex items-center justify-center font-bold border border-zinc-700">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center/Right Workspace (Dark Theme) */}
          <main ref={mainScrollRef} className="flex-1 overflow-y-auto overscroll-y-contain bg-zinc-950 p-3 sm:p-6 lg:p-8 pb-32 sm:pb-12 no-scrollbar scroll-smooth">
            <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">

            {/* TAB 1: OVERVIEW & INSIGHTS */}
            {activeTab === 'overview' && (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
                
                {/* Banner with Welcome & Date Filter */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 mb-1.5 w-full">
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-none break-words">{currentPlace.name}</h1>
                      <div className="flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider self-start sm:self-auto shrink-0 whitespace-nowrap">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        {t("business.claimedVerified", "CLAIMED & VERIFIED")}
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-200 font-medium">
                      {t("business.overviewSubtitle", "Real-time performance metrics driven by customer video reviews across the Yoouz network.")}
                    </p>
                  </div>
                  {/* Date Filter Pills */}
                  <div className="flex items-center bg-zinc-950 p-1 rounded-full border border-zinc-800 w-full sm:w-auto justify-between sm:justify-start">
                    {(['7d', '30d', '90d', 'ytd'] as const).map(range => (
                      <button
                        key={range}
                        onClick={() => setAnalyticsDateRange(range)}
                        className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer text-center ${
                          analyticsDateRange === range 
                            ? 'bg-zinc-800 text-white border border-zinc-700/80 shadow-xs font-bold' 
                            : 'text-zinc-300 hover:text-white font-medium'
                        }`}
                      >
                        {range === '7d' ? t("business.range7d", "7 Days") : range === '30d' ? t("business.range30d", "30 Days") : range === '90d' ? t("business.range90d", "90 Days") : t("business.rangeAllTime", "All Time")}
                      </button>
                    ))}
                  </div>
                </div>
                {/* 3 Premium Glass KPI Cards with Real Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4">
                  {[
                    { key: 'views' as const, label: t('business.kpiImpressions', 'Video Reviews Impressions'), value: totalViews.toLocaleString(), change: t('common.realTime', 'Real-time'), icon: Eye, color: 'text-white', bg: 'bg-zinc-800' },
                    { key: 'reviews' as const, label: t('business.kpiReviews', 'Verified Video Reviews'), value: totalReviews.toString(), change: t('common.realTime', 'Real-time'), icon: Video, color: 'text-white', bg: 'bg-zinc-800' },
                    { key: 'rating' as const, label: t('business.kpiRating', 'Overall Rating'), value: avgRating.toString(), change: t('common.realTime', 'Real-time'), icon: Star, color: 'text-zinc-200', bg: 'bg-zinc-800' },
                  ].map((stat, i) => {
                    const isSelected = selectedChartMetric === stat.key;
                    const sparklineColor = isSelected ? '#ffffff' : '#71717a';
                    return (
                      <div 
                         key={i} 
                         onClick={() => handleSelectMetric(stat.key)}
                        className={`bg-zinc-900/90 rounded-[20px] sm:rounded-[24px] border p-4 sm:p-5 flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden group active:scale-[0.99] ${
                          isSelected 
                             ? 'border-zinc-700 ring-1 ring-zinc-700/60 bg-zinc-850' 
                             : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3 sm:mb-4 relative z-10">
                          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center border border-zinc-700`}>
                            <stat.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                          <span className={`flex items-center gap-1 text-[9px] sm:text-[10px] font-extrabold text-white bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700 shrink-0 whitespace-nowrap`}>
                            <TrendingUp className="w-2.5 h-2.5" /> {stat.change}
                          </span>
                        </div>
                        <div className="relative z-10">
                          <div className="flex items-end justify-between mb-1">
                            <div className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tighter leading-none flex items-center gap-1">
                              <span>{stat.value}</span>
                              {stat.key === 'rating' && (
                                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white inline-block drop-shadow-xs" />
                              )}
                            </div>
                            {/* SVG Mini Sparkline */}
                            <svg className="w-10 sm:w-12 h-4 sm:h-5 overflow-visible opacity-80" viewBox="0 0 60 20">
                              <polyline
                                fill="none"
                                stroke={sparklineColor}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={stat.key === 'views' ? '0,15 15,12 30,14 45,8 60,4' : stat.key === 'reviews' ? '0,18 15,18 30,12 45,15 60,5' : '0,10 20,10 40,10 60,10'}
                              />
                            </svg>
                          </div>
                          <div className="text-[10.5px] sm:text-[11px] font-medium text-zinc-200 mt-1">{stat.label}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Interactive Performance Graph */}
                <div ref={chartSectionRef} className="bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-800 text-white p-3.5 sm:p-5 md:p-6 shadow-xs flex flex-col justify-between scroll-mt-4">
                  <div>
                    {/* Metric Selector Tabs */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xs sm:text-sm md:text-base font-bold text-white">
                            {selectedChartMetric === 'views' && 'Customer Video Reviews Impressions'}
                            {selectedChartMetric === 'reviews' && 'Verified Video Reviews'}
                            {selectedChartMetric === 'rating' && 'Overall Venue Rating'}
                          </h3>
                          <span className="text-[10px] sm:text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                            <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Real Video Impressions Live
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-zinc-200 mt-0.5 font-medium">
                          Total {chartData.total} {chartData.unit} recorded during this period
                        </p>
                      </div>

                      {/* Metric Selector Pills */}
                      <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-full border border-zinc-800 self-stretch sm:self-auto w-full sm:w-auto">
                        {(['views', 'reviews', 'rating'] as const).map(m => (
                          <button
                            key={m}
                            onClick={() => handleSelectMetric(m)}
                            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-bold capitalize transition-all cursor-pointer text-center ${
                              selectedChartMetric === m ? 'bg-zinc-800 text-white border border-zinc-700/80 shadow-xs font-bold' : 'text-zinc-300 hover:text-white font-medium'
                            }`}
                          >
                            {m === 'views' ? 'Impressions' : m === 'reviews' ? 'Reviews' : 'Rating'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* SVG Area & Bézier Curve Chart */}
                    <div 
                      className="relative w-full h-56 sm:h-72 select-none pt-2 touch-pan-y"
                      onTouchStart={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const touch = e.touches[0];
                        if (touch) {
                          const relX = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
                          const idx = Math.round(relX * (chartData.points.length - 1));
                          setHoveredChartPoint(idx);
                        }
                      }}
                      onTouchMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const touch = e.touches[0];
                        if (touch) {
                          const relX = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
                          const idx = Math.round(relX * (chartData.points.length - 1));
                          setHoveredChartPoint(idx);
                        }
                      }}
                    >
                      {/* Hover Tooltip display */}
                      {hoveredChartPoint !== null && (
                        <div 
                          className="absolute top-0 transform -translate-x-1/2 bg-zinc-800 text-white rounded-xl px-2.5 sm:px-3 py-1 sm:py-1.5 shadow-xl border border-zinc-700 pointer-events-none z-30 flex flex-col items-center text-[10px] sm:text-xs animate-in fade-in zoom-in-95 duration-100"
                          style={{ 
                            left: `${(hoveredChartPoint / (chartData.points.length - 1)) * 88 + 6}%` 
                          }}> 
                          <span className="font-extrabold text-xs sm:text-sm text-white">
                            {chartData.points[hoveredChartPoint].toLocaleString()} {chartData.unit}
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-zinc-300 font-medium">
                            {chartData.labels[hoveredChartPoint]}
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
                            <stop offset="0%" stopColor={chartData.color} stopOpacity="0.28" />
                            <stop offset="100%" stopColor={chartData.color} stopOpacity="0.01" />
                          </linearGradient>
                        </defs>

                        {/* Grid Lines */}
                        <line x1="0" y1="40" x2="700" y2="40" stroke="currentColor" className="text-zinc-800/80" strokeDasharray="4 4" strokeWidth="1" />
                        <line x1="0" y1="90" x2="700" y2="90" stroke="currentColor" className="text-zinc-800/80" strokeDasharray="4 4" strokeWidth="1" />
                        <line x1="0" y1="140" x2="700" y2="140" stroke="currentColor" className="text-zinc-800/80" strokeDasharray="4 4" strokeWidth="1" />
                        <line x1="0" y1="190" x2="700" y2="190" stroke="currentColor" className="text-zinc-800" strokeWidth="1" />

                        {/* Generate Smooth Path */}
                        {(() => {
                          const pts = chartData.points;
                          const maxVal = Math.max(...pts, 1);
                          const minVal = 0;
                          const range = maxVal - minVal;
                          
                          const coordinates = pts.map((val, idx) => {
                            const x = (idx / (pts.length - 1)) * 680 + 10;
                            const y = 180 - ((val - minVal) / range) * 140;
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

                          return (
                            <>
                              {/* Gradient Filled Area */}
                              <path d={areaD} fill="url(#metricGradient)" />
                              
                              {/* Stroke Line */}
                              <path 
                                d={pathD} 
                                fill="none" 
                                stroke={chartData.color} 
                                strokeWidth="3" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                              />

                              {/* Interactive Data Points */}
                              {coordinates.map((coord, idx) => (
                                <g key={idx} className="cursor-pointer">
                                  <circle
                                    cx={coord.x}
                                    cy={coord.y}
                                    r={hoveredChartPoint === idx ? 5 : 3}
                                    fill="#18181b"
                                    stroke={chartData.color}
                                    strokeWidth={hoveredChartPoint === idx ? 3 : 2}
                                    className="transition-all duration-150"
                                    onMouseEnter={() => setHoveredChartPoint(idx)}
                                    onMouseLeave={() => setHoveredChartPoint(null)}
                                  />
                                  {/* Invisible larger hit area for smooth hovering/touch */}
                                  <circle
                                    cx={coord.x}
                                    cy={coord.y}
                                    r={24}
                                    fill="transparent"
                                    onMouseEnter={() => setHoveredChartPoint(idx)}
                                    onMouseLeave={() => setHoveredChartPoint(null)}
                                  />
                                </g>
                              ))}
                            </>
                          );
                        })()}
                      </svg>
                    </div>

                    {/* X-Axis Labels */}
                    <div className="flex justify-between text-[10px] sm:text-[11px] font-medium text-zinc-300 mt-2 px-1 sm:px-2 border-t border-zinc-800 pt-2">
                      <span>Day 1</span>
                      <span>Day 7</span>
                      <span>Day 15</span>
                      <span>Day 22</span>
                      <span>Today</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* TAB 2: VIDEO REVIEWS & MODERATION */}
            {activeTab === 'reviews' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Pin/Hide Alert Toast */}
                {pinNotice && (
                  <div className="bg-zinc-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-lg border border-zinc-700 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      {pinNotice}
                    </span>
                    <button
                      onClick={() => setActiveTab('embed')}
                      className="text-[#8ab4f8] hover:underline text-xs font-bold cursor-pointer"
                    >
                      View Website Widget →
                    </button>
                  </div>
                )}

                <div className="bg-zinc-900 rounded-3xl border border-zinc-800 text-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Customer Video Reviews</h2>
                    <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-zinc-200">
                      <span>Curate customer videos and pin your favorites to your website widget.</span>
                      <span className="text-zinc-600">•</span>
                      <span className="font-semibold text-amber-400 bg-amber-900/30 px-2.5 py-0.5 rounded-full border border-amber-800/40 text-[11px] flex items-center gap-1">
                        <Pin className="w-2.5 h-2.5 fill-current text-amber-400" /> {pinnedVideoIds.length}/3 Pinned
                      </span>
                    </div>
                  </div>

                  {/* Search and Filter Row */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                    {/* Search Reviews Input */}
                    <div className="relative flex-1 min-w-[180px]">
                      <Search className="w-3.5 h-3.5 text-zinc-300 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={reviewsSearchQuery}
                        onChange={(e) => setReviewsSearchQuery(e.target.value)}
                        placeholder="Search reviews..."
                        className="w-full pl-8 pr-7 py-1.5 bg-zinc-950 focus:bg-zinc-900 border border-zinc-800 rounded-full text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:ring-1 focus:ring-zinc-700 focus:border-zinc-700 transition-all font-medium"
                      />
                      {reviewsSearchQuery && (
                        <button
                          onClick={() => setReviewsSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-white text-xs font-bold"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-full border border-zinc-800 shrink-0">
                      {(['all', '5', '4'] as const).map(f => (
                        <button
                          key={f}
                          onClick={() => setReviewsFilter(f)}
                          className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            reviewsFilter === f ? 'bg-zinc-800 text-white border border-zinc-700/80 shadow-xs font-bold' : 'text-zinc-300 hover:text-white font-medium'
                          }`}
                        >
                          {f === 'all' ? 'All' : `${f} Stars`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                  {placeVideos
                    .filter(v => {
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
                    })
                    .map((video) => {
                      const hasReply = Boolean(ownerReplies[video.id]);
                      const isReplying = activeReplyId === video.id;
                      const isPinned = pinnedVideoIds.includes(video.id);
                      const isHidden = hiddenVideoIds.includes(video.id);

                      return (
                        <div 
                          key={video.id}
                          className={`rounded-3xl border p-5 sm:p-6 shadow-xs transition-all ${
                            isPinned 
                              ? 'border-zinc-700 bg-zinc-900 text-white' 
                              : isHidden 
                              ? 'border-zinc-800 opacity-60 bg-zinc-900/60 text-zinc-200' 
                              : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-white'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row gap-5 items-start">
                            {/* Video Thumbnail Player Viewport */}
                            <div 
                              onClick={() => setActiveVideoModal(video)}
                              className="w-full md:w-44 aspect-9/14 shrink-0 relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-xs cursor-pointer group"
                              title="Click to play review"
                            >
                              <img
                                src={video.thumbnailUrl || video.author?.avatar}
                                alt={video.dishOrItem || 'Video Review'}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                referrerPolicy="no-referrer"
                               onError={(e) => { const target = e.currentTarget as HTMLImageElement; if (!target.src.includes('/api/avatar')) { target.src = '/api/avatar?name=User&background=27272a&color=fff'; } }} /> 
 {/* Video Badges & Play Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-between p-3 text-white">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white flex items-center gap-1 border border-white/20">
                                    <Video className="w-2.5 h-2.5 text-zinc-200" /> 0:{video.durationSeconds || 15}
                                  </span>
                                </div>

                                <div className="self-center w-11 h-11 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg border border-white/40 group-hover:scale-110 transition-transform">
                                  <Play className="w-5 h-5 fill-current ml-0.5" />
                                </div>

                                <div>
                                  <span className="text-[11px] font-bold text-white block line-clamp-1">
                                    {video.dishOrItem || 'Verified Review'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Review Content & Management Column */}
                            <div className="flex-1 min-w-0 space-y-4 w-full">
                              <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onOpenCreator && video.author) {
                                      onOpenCreator(video.author);
                                    }
                                  }}
                                  className="flex items-center gap-3 text-left group cursor-pointer hover:opacity-90 transition-opacity min-w-0"
                                  title={`View ${video.author?.name || 'Customer'}'s Profile`}
                                >
                                  <img
                                    src={video.author?.avatar}
                                    alt={video.author?.name}
                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-zinc-700 group-hover:ring-white transition-all shrink-0"
                                    referrerPolicy="no-referrer"
                                   onError={(e) => { const target = e.currentTarget as HTMLImageElement; if (!target.src.includes('/api/avatar')) { target.src = '/api/avatar?name=User&background=27272a&color=fff'; } }} /> 
 <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-sm text-white group-hover:text-zinc-200 transition-colors truncate">
                                        {video.author?.name || 'Customer Review'}
                                      </span>
                                      {isPinned && (
                                        <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-200 text-[10px] font-bold tracking-wide flex items-center gap-1 border border-zinc-700">
                                          <Pin className="w-2.5 h-2.5 fill-current text-white" /> Pinned
                                        </span>
                                      )}
                                      {isHidden && (
                                        <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-200 text-[10px] font-bold flex items-center gap-1 border border-zinc-700">
                                          <EyeOff className="w-2.5 h-2.5" /> Hidden
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-200 flex-wrap">
                                      <div className="flex text-white">
                                        {Array.from({ length: video.rating || 5 }).map((_, i) => (
                                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                                        ))}
                                      </div>
                                      <span>•</span>
                                      <span>{formatRecordedDate(video.recordedAt, video.createdAtMs)}</span>
                                      {video.dishOrItem && (
                                        <>
                                          <span>•</span>
                                          <span className="font-semibold text-zinc-200 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md text-[11px]">
                                            {video.dishOrItem}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </button>

                                {/* Clean Action Group: Pin, Hide, Reply */}
                                <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => togglePinVideo(video.id)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
                                      isPinned
                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 shadow-2xs font-bold'
                                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                                    }`}
                                    title={isPinned ? 'Unpin from website widget' : 'Pin to top of website widget (Max 3)'}
                                  >
                                    <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current text-amber-400' : 'text-zinc-300'}`} />
                                    <span>{isPinned ? 'Pinned' : 'Pin to Widget'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => toggleHideVideo(video.id)}
                                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800"
                                    title={isHidden ? 'Restore to website widget' : 'Hide from website widget'}
                                  >
                                    {isHidden ? <Eye className="w-3.5 h-3.5 text-zinc-200" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-200" />}
                                    <span>{isHidden ? 'Unhide' : 'Hide'}</span>
                                  </button>

                                  {!hasReply && !isReplying && (
                                    <button
                                      onClick={() => {
                                        setActiveReplyId(video.id);
                                        setReplyText('');
                                      }}
                                      className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                      <span>Reply</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* AI Transcribed Audio Caption Block */}
                              <div className="bg-zinc-900 rounded-2xl p-3.5 border border-zinc-800 space-y-1">
                                <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-zinc-200 uppercase tracking-wider">
                                  <Sparkles className="w-3 h-3 text-zinc-200" />
                                  <span>Transcript</span>
                                </div>
                                <p className="text-xs text-zinc-200 leading-relaxed font-medium">
                                  "{video.caption}"
                                </p>
                              </div>

                              {/* Existing Owner Reply */}
                              {hasReply && !isReplying && (
                                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                                      <BadgeCheck className="w-3.5 h-3.5 text-white" />
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
                                <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 space-y-3 animate-in fade-in">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-white">Reply as {currentPlace.name}</span>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => setReplyText("Thank you so much for the wonderful review! We're glad you enjoyed your experience.")}
                                        className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-[10.5px] text-zinc-200 hover:text-white hover:border-zinc-500 cursor-pointer"
                                      >
                                        + Thank diner
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setReplyText("Thanks for visiting! Hope to welcome you back again very soon.")}
                                        className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-[10.5px] text-zinc-200 hover:text-white hover:border-zinc-500 cursor-pointer"
                                      >
                                        + Invite back
                                      </button>
                                    </div>
                                  </div>
                                  <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Thank your customer or share upcoming specials..."
                                    rows={3}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:ring-1 focus:ring-zinc-700 focus:border-zinc-700 transition-all"
                                  />
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        setActiveReplyId(null);
                                        setReplyText('');
                                      }}
                                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleSaveReply(video.id)}
                                      disabled={!replyText.trim()}
                                      className="px-4 py-1.5 rounded-xl bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-200 text-zinc-950 text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <Send className="w-3.5 h-3.5" /> Publish Response
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Customer Comments Toggle Section */}
                              <div className="pt-2 border-t border-zinc-800">
                                <button
                                  onClick={() => {
                                    setExpandedCommentsMap(prev => ({
                                      ...prev,
                                      [video.id]: !prev[video.id]
                                    }));
                                  }}
                                  className="text-xs font-semibold text-zinc-200 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-zinc-200" />
                                  <span>
                                    {expandedCommentsMap[video.id] ? 'Hide' : 'View'} Customer Comments ({video.commentsCount || video.comments?.length || 0})
                                  </span>
                                </button>

                                {expandedCommentsMap[video.id] && (
                                  <div className="mt-3 space-y-3 bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                                    {(!video.comments || video.comments.length === 0) ? (
                                      <p className="text-xs text-zinc-200 italic">No customer comments yet on this review.</p>
                                    ) : (
                                      video.comments.map((comment) => (
                                        <div key={comment.id} className="flex items-start gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800 shadow-2xs">
                                          <img
                                            src={comment.authorAvatar || `/api/avatar?name=${encodeURIComponent(comment.authorName)}&background=random`}
                                            alt={comment.authorName}
                                            className="w-8 h-8 rounded-full object-cover shrink-0"
                                            referrerPolicy="no-referrer"
                                           onError={(e) => { const target = e.currentTarget as HTMLImageElement; if (!target.src.includes('/api/avatar')) { target.src = '/api/avatar?name=User&background=27272a&color=fff'; } }} /> 
 <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-bold text-zinc-200">{comment.authorName}</span>
                                                {comment.isOwner && (
                                                  <span className="bg-zinc-800 text-zinc-200 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-zinc-700">Owner</span>
                                                )}
                                              </div>
                                              <span className="text-[10px] text-zinc-200">{comment.createdAt || 'Recently'}</span>
                                            </div>
                                            <p className="text-xs text-zinc-200 leading-relaxed">{comment.text}</p>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            
            {/* INBOX TAB */}
            {activeTab === 'inbox' && (
              <div className="w-full max-w-5xl h-[calc(100dvh-130px)] md:h-[calc(100vh-140px)] bg-zinc-950 sm:bg-zinc-900 rounded-none sm:rounded-3xl border-0 sm:border border-zinc-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                <CopoMessagesView
                  messages={messages}
                  currentUser={effectiveUser}
                  places={places}
                  userVideos={placeVideos}
                  allVideos={videos}
                  allUsers={allUsers}
                  onSendMessage={onSendMessage}
                  onDeleteThread={onDeleteThread}
                  onMarkThreadRead={onMarkThreadRead}
                  onUpdateMessages={onUpdateMessages}
                  onSelectVideo={onSelectVideo}
                  onSelectPlace={onOpenPlaceDrawer}
                  onOpenCreator={onOpenCreator}
                  selectedThreadId={targetThreadId}
                  onSelectThreadId={setTargetThreadId}
                  onNavigateHome={() => setActiveTab('overview')}
                  onNavigateToNotifications={() => setActiveTab('notifications')}
                  unreadNotifsCount={unreadBusinessNotifsCount}
                />
              </div>
            )}

            {/* FOLLOWERS TAB (Exact User Account Layout & Design Language) */}
            {activeTab === 'followers' && (
              <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4 animate-in fade-in zoom-in-95 duration-200">
                {/* Top Header & Navigation Bar */}
                <div className="flex items-center justify-between gap-3 pt-1 pb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className="w-10 h-10 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 shadow-xs border border-zinc-800"
                      title="Back to Overview"
                    >
                      <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>
                    <div className="min-w-0">
                      <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight flex items-center gap-2">
                        <Users className="w-5 h-5 text-zinc-300 shrink-0" />
                        <span>Followers & Advocates</span>
                      </h1>
                      <p className="text-xs text-zinc-400 font-medium truncate mt-0.5">
                        {businessFollowers.length} {businessFollowers.length === 1 ? 'customer follower' : 'customer followers'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Search Bar matching CopoFollowingView */}
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={followerSearchQuery}
                    onChange={(e) => setFollowerSearchQuery(e.target.value)}
                    placeholder="Search followers by name or review..."
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-zinc-600 focus:bg-zinc-900 transition-all shadow-inner"
                  />
                  {followerSearchQuery && (
                    <button
                      onClick={() => setFollowerSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer p-1 rounded-full hover:bg-zinc-800 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Follower Directory List */}
                {filteredFollowers.length === 0 ? (
                  <div className="p-8 sm:p-12 rounded-3xl bg-zinc-900/60 border border-zinc-800 text-center text-zinc-300 space-y-3 shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-850 text-white flex items-center justify-center mx-auto">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="space-y-1 max-w-sm mx-auto">
                      <p className="font-bold text-white text-sm sm:text-base">
                        {followerSearchQuery ? "No matching followers found" : "No followers yet"}
                      </p>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {followerSearchQuery
                          ? `No customer follower matches "${followerSearchQuery}". Try a different name.`
                          : "When customers and video reviewers follow your business on Yoouz, they will appear here."}
                      </p>
                    </div>
                    {followerSearchQuery && (
                      <button
                        onClick={() => setFollowerSearchQuery("")}
                        className="px-4 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold cursor-pointer transition-colors"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {filteredFollowers.map((follower) => {
                      const isHovered = hoveredUnfollow === follower.name;
                      return (
                        <div
                          key={`follower-${follower.id || follower.name}`}
                          onClick={() => onOpenCreator?.({ name: follower.name, avatar: follower.avatar, id: follower.id } as any)}
                          className="bg-zinc-900/70 hover:bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-zinc-700 p-3.5 sm:p-4 shadow-sm transition-all flex items-center justify-between gap-3.5 group cursor-pointer"
                        >
                          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                            <div className="relative shrink-0">
                              <img
                                src={follower.avatar}
                                alt={follower.name}
                                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border border-zinc-800 shrink-0 group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement;
                                  if (!target.src.includes("/api/avatar")) {
                                    target.src = `/api/avatar?name=${encodeURIComponent(follower.name || "User")}&background=27272a&color=fff`;
                                  }
                                }}
                              />
                              {follower.isReviewer && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-zinc-900 text-white" title="Verified Customer Reviewer">
                                  <Star className="w-2.5 h-2.5 fill-white" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1 text-left">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <h3 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-zinc-200 transition-colors">
                                  {follower.name}
                                </h3>
                                {follower.isReviewer && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold shrink-0">
                                    Reviewer {follower.rating ? `· ⭐ ${follower.rating.toFixed(1)}` : ""}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium truncate mt-0.5">
                                <span className="shrink-0">
                                  {follower.lastReviewSnippet
                                    ? `"${follower.lastReviewSnippet}"`
                                    : `@${follower.handle} · Customer Advocate`}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Message button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMessageFollower(follower);
                              }}
                              className="px-3.5 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 transition-all cursor-pointer shadow-xs whitespace-nowrap active:scale-95"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-zinc-300" />
                              <span className="hidden sm:inline">Message</span>
                            </button>

                            {/* Follow back / Following toggle */}
                            {onToggleFollow && (
                              <button
                                onMouseEnter={() => setHoveredUnfollow(follower.name)}
                                onMouseLeave={() => setHoveredUnfollow(null)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleFollow(follower.handle);
                                }}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs whitespace-nowrap active:scale-95 ${
                                  follower.isFollowedBack
                                    ? isHovered
                                      ? "bg-red-500/15 text-red-400 border border-red-500/30"
                                      : "bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700"
                                    : "bg-white hover:bg-zinc-200 text-zinc-950 font-black"
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
                  onNavigateToMessages={() => setActiveTab('inbox')}
                  onNavigateHome={() => setActiveTab('overview')}
                  onMarkRead={(id) => onMarkNotificationRead?.(id)}
                  onClearAll={onClearAllNotifications}
                  onOpenCreator={onOpenCreator}
                  onOpenSettings={() => setIsNotificationSettingsOpen(true)}
                />
              </div>
            )}

            {/* TAB 3: WEBSITE EMBED WIDGET */}
            {activeTab === 'embed' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-zinc-900 rounded-3xl border border-zinc-800 text-white p-5 md:p-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                        <span>Official Yoouz Video Reviews Website Embed</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-extrabold uppercase tracking-wide">
                          Pro Feature
                        </span>
                      </h2>
                      <p className="text-xs text-zinc-200 mt-1 leading-relaxed">
                        Embed authentic, high-converting video reviews directly on your website or reservation page with automatic real-time sync.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5">
                        <Pin className="w-3.5 h-3.5 fill-current text-white" /> {pinnedVideoIds.length}/3 Pinned
                      </span>
                      {hiddenVideoIds.length > 0 && (
                        <span className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5">
                          <EyeOff className="w-3.5 h-3.5" /> {hiddenVideoIds.length} Hidden
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Embed Controls */}
                    <div className="space-y-4">
                      <div className="bg-zinc-950 rounded-2xl p-4 border border-zinc-800 space-y-4">
                        {/* Widget Layout Style */}
                        <div>
                          <label className="text-xs font-bold text-zinc-200 block mb-2">Widget Layout</label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'grid', label: '3-Col Grid' },
                              { id: 'carousel', label: 'Reel Carousel' },
                              { id: 'badge', label: 'Corner Badge' },
                            ].map(l => (
                              <button
                                key={l.id}
                                onClick={() => setEmbedLayout(l.id as any)}
                                className={`py-2 px-1 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                                  embedLayout === l.id 
                                    ? 'bg-zinc-800 text-white border-zinc-700 shadow-xs font-bold' 
                                    : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-900 hover:text-white font-medium'
                                }`}
                              >
                                {l.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Widget Theme Selector */}
                        <div>
                          <label className="text-xs font-bold text-zinc-200 block mb-2">Widget Theme</label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'minimal_dark', label: 'Dark Mode' },
                              { id: 'card_compact', label: 'Compact' },
                              { id: 'google_light', label: 'Monochrome' },
                            ].map(t => (
                              <button
                                key={t.id}
                                onClick={() => setEmbedTheme(t.id as any)}
                                className={`py-2 px-1 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                                  embedTheme === t.id 
                                    ? 'bg-zinc-800 text-white border-zinc-700 shadow-xs font-bold' 
                                    : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-900 hover:text-white font-medium'
                                }`}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Brand Accent Color */}
                        <div>
                          <label className="text-xs font-bold text-zinc-200 block mb-2 flex items-center justify-between">
                            <span>Widget Button Style</span>
                            <span className="text-[10px] text-zinc-200 font-normal uppercase tracking-wider">Monochrome</span>
                          </label>
                          <div className="flex items-center gap-2 flex-wrap">
                            {[
                              { color: '#ffffff', name: 'Crisp White' },
                              { color: '#d4d4d8', name: 'Light Zinc' },
                              { color: '#71717a', name: 'Mid Gray' },
                              { color: '#27272a', name: 'Dark Charcoal' },
                              { color: '#09090b', name: 'Deep Black' },
                            ].map(c => (
                              <button
                                key={c.color}
                                onClick={() => setEmbedAccentColor(c.color)}
                                className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer shrink-0 ${
                                  embedAccentColor.toLowerCase() === c.color ? 'scale-115 ring-2 ring-offset-2 ring-zinc-600 border-white' : 'border-zinc-700 hover:scale-105'
                                }`}
                                style={{ backgroundColor: c.color }}
                                title={c.name}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Minimum Star Rating Filter */}
                        <div className="pt-2 border-t border-zinc-800">
                          <label className="text-xs font-bold text-zinc-200 block mb-2 flex items-center justify-between">
                            <span>Show Reviews By Star Rating</span>
                            <span className="text-[10px] text-zinc-200 font-normal">Auto-filter</span>
                          </label>
                          <select
                            value={embedStarFilter}
                            onChange={(e) => setEmbedStarFilter(e.target.value as any)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-zinc-700 focus:border-zinc-700"
                          >
                            <option value="all">⭐ All Star Ratings (5★, 4★, 3★)</option>
                            <option value="5">⭐⭐⭐⭐⭐ 5-Star Reviews Only</option>
                            <option value="4plus">⭐⭐⭐⭐ 4+ Stars (4★ & 5★)</option>
                            <option value="3plus">⭐⭐⭐ 3+ Stars (3★, 4★ & 5★)</option>
                            <option value="pinned_only">📌 Curated / Pinned Reviews Only</option>
                          </select>
                        </div>

                        {/* Brand & Badge Options */}
                        <div className="space-y-2 pt-2 border-t border-zinc-800">
                          <label className="flex items-center justify-between text-xs font-semibold text-zinc-200 cursor-pointer">
                            <span className="flex items-center gap-1.5">
                              <Star className="w-3.5 h-3.5 text-white fill-white" />
                              Display Yoouz Brand Trust Header
                            </span>
                            <input
                              type="checkbox"
                              checked={embedShowTrustHeader}
                              onChange={(e) => setEmbedShowTrustHeader(e.target.checked)}
                              className="w-4 h-4 rounded-sm accent-white"
                            />
                          </label>

                          <label className="flex items-center justify-between text-xs font-semibold text-zinc-200 cursor-pointer">
                            <span>Display Star Score Summary</span>
                            <input
                              type="checkbox"
                              checked={embedShowStars}
                              onChange={(e) => setEmbedShowStars(e.target.checked)}
                              className="w-4 h-4 rounded-sm accent-white"
                            />
                          </label>

                          <label className="flex items-center justify-between text-xs font-semibold text-zinc-200 cursor-pointer">
                            <span className="flex items-center gap-1.5">
                              <BadgeCheck className="w-3.5 h-3.5 text-white" />
                              Display Verified Business Badge
                            </span>
                            <input
                              type="checkbox"
                              checked={embedShowVerifiedBadge}
                              onChange={(e) => setEmbedShowVerifiedBadge(e.target.checked)}
                              className="w-4 h-4 rounded-sm accent-white"
                            />
                          </label>
                        </div>

                        {/* Quick Pinning & Curation Panel */}
                        <div className="pt-2 border-t border-zinc-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-200 flex items-center gap-1">
                              <Pin className="w-3.5 h-3.5 text-white" />
                              Curate Pinned Reviews
                            </span>
                            <span className="text-[10px] text-zinc-200 font-bold bg-zinc-800 px-1.5 py-0.5 rounded-md border border-zinc-700">
                              {pinnedVideoIds.length}/3 Pinned
                            </span>
                          </div>

                          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                            {placeVideos.map((v) => {
                              const isPinned = pinnedVideoIds.includes(v.id);
                              const isHidden = hiddenVideoIds.includes(v.id);
                              const title = v.dishOrItem && v.dishOrItem !== selectedPlaceId 
                                ? v.dishOrItem 
                                : (v.author?.name && v.author.name !== selectedPlaceId ? `Review by ${v.author.name}` : 'Customer Review');

                              return (
                                <div 
                                  key={v.id}
                                  className={`p-2 rounded-xl text-xs flex items-center justify-between gap-2 border ${
                                    isPinned 
                                      ? 'bg-zinc-800 border-zinc-600 text-white font-bold' 
                                      : isHidden 
                                      ? 'bg-zinc-900 border-zinc-800 text-zinc-200 opacity-60' 
                                      : 'bg-zinc-950 border-zinc-800 text-zinc-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-white font-bold text-[11px] shrink-0">
                                      {v.rating || 5}★
                                    </span>
                                    <span className="truncate text-[11px]">
                                      {title}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => togglePinVideo(v.id)}
                                      className={`p-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                                        isPinned
                                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                                      }`}
                                      title={isPinned ? 'Unpin video' : 'Pin video (Max 3)'}
                                    >
                                      📌 {isPinned ? 'Pinned' : 'Pin'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => toggleHideVideo(v.id)}
                                      className={`p-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                                        isHidden
                                          ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200'
                                      }`}
                                      title={isHidden ? 'Unhide video' : 'Hide from widget'}
                                    >
                                      {isHidden ? '👁️' : '🙈'}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Code Snippet Box */}
                      <div className="bg-zinc-900 rounded-2xl p-4 text-white font-mono text-xs space-y-3 shadow-md border border-zinc-800">
                        <div className="flex items-center justify-between text-zinc-200 text-[11px]">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEmbedFormat('script')}
                              className={`px-3 py-1 rounded-full text-xs font-sans font-bold cursor-pointer border transition-all ${
                                embedFormat === 'script' ? 'bg-zinc-800 text-white border-zinc-700 shadow-xs' : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:text-white'
                              }`}
                            >
                              JS Script Tag
                            </button>
                            <button
                              type="button"
                              onClick={() => setEmbedFormat('iframe')}
                              className={`px-3 py-1 rounded-full text-xs font-sans font-bold cursor-pointer border transition-all ${
                                embedFormat === 'iframe' ? 'bg-zinc-800 text-white border-zinc-700 shadow-xs' : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:text-white'
                              }`}
                            >
                              iFrame Tag
                            </button>
                          </div>
                          <button
                            onClick={copyEmbedCode}
                            className="flex items-center gap-1 text-white hover:text-zinc-200 transition-colors cursor-pointer font-sans font-bold"
                          >
                            {isCodeCopied ? <Check className="w-3.5 h-3.5 text-zinc-200" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{isCodeCopied ? 'Copied!' : 'Copy Code'}</span>
                          </button>
                        </div>

                        <div className="overflow-x-auto text-[11px] text-zinc-200 py-1 leading-relaxed">
                          {embedFormat === 'script' ? (
                            <code>{`<div id="yoouz-widget"\n  data-place-id="${selectedPlaceId}"\n  data-theme="${embedTheme}"\n  data-layout="${embedLayout}"\n  data-accent="${embedAccentColor}"\n  data-star-filter="${embedStarFilter}"\n  data-show-stars="${embedShowStars}"\n  data-show-verified="${embedShowVerifiedBadge}"\n  data-show-trust-header="${embedShowTrustHeader}"${pinnedVideoIds.length > 0 ? `\n  data-pinned-ids="${pinnedVideoIds.join(',')}"` : ''}${hiddenVideoIds.length > 0 ? `\n  data-hidden-ids="${hiddenVideoIds.join(',')}"` : ''}>\n</div>\n<script src="https://cdn.yoouz.com/embed/v2.js" async defer></script>`}</code>
                          ) : (
                            <code>{`<iframe src="https://yoouz.com/embed/widget?placeId=${selectedPlaceId}&theme=${embedTheme}&layout=${embedLayout}&accent=${encodeURIComponent(embedAccentColor)}" \n  width="100%" height="480" frameborder="0" loading="lazy" allow="autoplay; encrypted-media">\n</iframe>`}</code>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Live Website Preview Container */}
                    <div className="lg:col-span-2 bg-zinc-950 rounded-3xl p-6 border border-zinc-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-zinc-200" />
                            Live External Website Preview ({embedLayout.toUpperCase()} MODE)
                          </span>
                          <div className="flex items-center gap-2">
                            {pinnedVideoIds.length > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-200 text-[10px] font-bold border border-zinc-700">
                                📌 {pinnedVideoIds.length} Pinned First
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-200 text-[10px] font-bold border border-zinc-700">
                              Auto-Sync Active
                            </span>
                          </div>
                        </div>

                        {/* Rendered Widget Simulation Card */}
                        <div className="widget-simulation-container p-6 rounded-3xl border border-zinc-800 bg-zinc-900 text-white shadow-xl transition-all">
                          {/* Super Luxury Yoouz Brand Trust Header */}
                          {embedShowTrustHeader && (
                            <div className="p-4 rounded-2xl mb-5 border border-zinc-700/80 bg-zinc-800/90 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
                              <div className="flex items-center gap-3">
                                {/* Official Yoouz Brand Icon Badge */}
                                <div 
                                  className="w-11 h-11 rounded-2xl text-zinc-950 bg-white flex items-center justify-center font-black text-lg shadow-sm shrink-0 border border-white/40"
                                >
                                  ★
                                </div>

                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-extrabold text-base tracking-tight">{currentPlace.name}</span>
                                    {embedShowVerifiedBadge && (
                                      <span 
                                        className="inline-flex items-center gap-1 text-[11px] font-bold bg-zinc-900 text-white px-2 py-0.5 rounded-full border border-zinc-700 shadow-2xs"
                                      >
                                        <BadgeCheck className="w-3.5 h-3.5 fill-current text-white" /> Verified Merchant
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
                                    {embedShowStars && (
                                      <div className="flex items-center gap-1">
                                        <span className="font-black text-white">4.9</span>
                                        <div className="flex text-white">
                                          {Array.from({ length: 5 }).map((_, i) => (
                                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    <span className="text-zinc-200">•</span>
                                    <span className="text-zinc-200 font-medium">
                                      Based on <strong className="text-white">{placeVideos.length} Video Reviews</strong> on <strong className="text-white">Yoouz</strong>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Write Review CTA Button */}
                              <a
                                href={`/#/record_review?placeId=${selectedPlaceId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2 rounded-xl text-zinc-950 bg-white hover:bg-zinc-200 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 hover:scale-102 cursor-pointer"
                              >
                                <Video className="w-3.5 h-3.5" />
                                <span>Add Video Review</span>
                              </a>
                            </div>
                          )}

                          {/* Fallback Compact Header if Trust Header is disabled */}
                          {!embedShowTrustHeader && (
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-7 h-7 rounded-lg text-zinc-950 bg-white flex items-center justify-center font-bold text-xs"
                                >
                                  ★
                                </div>
                                <div>
                                  <div className="text-sm font-black flex items-center gap-1 text-white">
                                    {currentPlace.name}
                                    {embedShowVerifiedBadge && <BadgeCheck className="w-3.5 h-3.5 text-white" />}
                                  </div>
                                  {embedShowStars && (
                                    <div className="text-[11px] text-zinc-200 flex items-center gap-1 font-bold">
                                      ★★★★★ <span>4.9 ({placeVideos.length} Video Reviews)</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <span className="text-[10px] text-zinc-200 font-mono">powered by yoouz</span>
                            </div>
                          )}

                          {/* Video Simulation Display according to embedLayout */}
                          {displayableWidgetVideos.length === 0 ? (
                            <div className="py-12 text-center text-zinc-200 space-y-2">
                              <AlertCircle className="w-8 h-8 mx-auto text-zinc-200" />
                              <p className="text-xs font-semibold text-zinc-200">No video reviews match the selected star filter.</p>
                              <p className="text-[11px] text-zinc-200">Try switching the rating filter back to "All Star Ratings".</p>
                            </div>
                          ) : embedLayout === 'badge' ? (
                            /* CORNER FLOATING BADGE PREVIEW */
                            <div className="relative bg-zinc-900 rounded-2xl p-8 border border-dashed border-zinc-700 flex flex-col items-center justify-center min-h-[220px]">
                              <span className="text-xs text-zinc-200 font-semibold mb-2">[ Simulated Merchant Website Page ]</span>
                              <div className="absolute bottom-4 right-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-white p-3 shadow-xl flex items-center gap-3 animate-bounce cursor-pointer hover:scale-105 transition-transform" onClick={() => setActiveVideoModal(displayableWidgetVideos[0])}>
                                <div className="w-12 h-12 rounded-xl overflow-hidden relative shrink-0">
                                  <img src={displayableWidgetVideos[0].thumbnailUrl} alt="Review" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white">
                                    <Play className="w-4 h-4 fill-current" />
                                  </div>
                                </div>
                                <div className="min-w-0 pr-2">
                                  <div className="text-xs font-bold text-white truncate">★ 4.9 Video Reviews</div>
                                  <div className="text-[10px] text-zinc-200 truncate">Tap to watch {displayableWidgetVideos.length} reviews</div>
                                </div>
                              </div>
                            </div>
                          ) : embedLayout === 'carousel' ? (
                            /* HORIZONTAL REEL CAROUSEL PREVIEW */
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                              {displayableWidgetVideos.map((v) => {
                                const isPinned = pinnedVideoIds.includes(v.id);
                                return (
                                  <div 
                                    key={v.id} 
                                    onClick={() => setActiveVideoModal(v)}
                                    className="w-40 shrink-0 relative rounded-2xl overflow-hidden aspect-9/14 bg-zinc-800 group shadow-xs cursor-pointer hover:scale-[1.02] transition-transform"
                                    title="Click to play video reel"
                                  >
                                    <img
                                      src={v.thumbnailUrl}
                                      alt={v.dishOrItem || 'Review'}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      referrerPolicy="no-referrer"
                                    />
                                    
                                    {isPinned && (
                                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white text-zinc-950 text-[9px] font-black shadow-md flex items-center gap-1 z-10">
                                        <Pin className="w-2.5 h-2.5 fill-current" /> Pinned
                                      </div>
                                    )}

                                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-0.5 z-10">
                                      ★ {v.rating || 5}
                                    </div>

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5 text-white">
                                      <span className="text-[10px] font-bold leading-tight line-clamp-1">
                                        {v.dishOrItem && v.dishOrItem !== selectedPlaceId ? v.dishOrItem : (v.author?.name || 'Customer')}
                                      </span>
                                      <span className="text-[9px] text-zinc-200">
                                        by {v.author?.name || 'Verified Customer'}
                                      </span>
                                    </div>

                                    <div 
                                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                                    >
                                      <Play className="w-4 h-4 fill-current ml-0.5" />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            /* 3-COLUMN REEL GRID PREVIEW */
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {displayableWidgetVideos.map((v) => {
                                const isPinned = pinnedVideoIds.includes(v.id);
                                return (
                                  <div 
                                    key={v.id} 
                                    onClick={() => setActiveVideoModal(v)}
                                    className="relative rounded-2xl overflow-hidden aspect-9/14 bg-zinc-800 group shadow-xs cursor-pointer hover:scale-[1.02] transition-transform"
                                    title="Click to play video reel"
                                  >
                                    <img
                                      src={v.thumbnailUrl}
                                      alt={v.dishOrItem || 'Review'}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      referrerPolicy="no-referrer"
                                    />
                                    
                                    {isPinned && (
                                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white text-zinc-950 text-[9px] font-black shadow-md flex items-center gap-1 z-10">
                                        <Pin className="w-2.5 h-2.5 fill-current" /> Pinned
                                      </div>
                                    )}

                                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-0.5 z-10">
                                      ★ {v.rating || 5}
                                    </div>

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5 text-white">
                                      <span className="text-[10px] font-bold leading-tight line-clamp-1">
                                        {v.dishOrItem && v.dishOrItem !== selectedPlaceId ? v.dishOrItem : (v.author?.name || 'Customer')}
                                      </span>
                                      <span className="text-[9px] text-zinc-200">
                                        by {v.author?.name || 'Verified Customer'}
                                      </span>
                                    </div>

                                    <div 
                                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                                    >
                                      <Play className="w-4 h-4 fill-current ml-0.5" />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] text-zinc-200 mt-6 text-center flex items-center justify-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-zinc-200" />
                        <span>Click any video thumbnail in the live preview to watch the full HD video review player.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: QR CODES & REVIEW INVITES STUDIO */}
            {activeTab === 'qr_invites' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Header Banner */}
                <div className="bg-zinc-900 rounded-3xl p-6 text-white shadow-md border border-zinc-800 relative overflow-hidden">
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700 text-[10px] font-extrabold uppercase tracking-wider">
                          Google Business Partner Tools
                        </span>
                        <span className="text-zinc-200 text-xs">• Real-Time Sync Active</span>
                      </div>
                      <h2 className="text-2xl font-black text-white tracking-tight">Merchant QR & Customer Review Campaign Studio</h2>
                      <p className="text-xs text-zinc-200 mt-1 max-w-2xl leading-relaxed">
                        Design print-ready acrylic table tents, window stickers, and automated review invitations that lead guests straight to your 1-tap video review recorder.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const link = `https://yoouz.com/#/record_review?placeId=${selectedPlaceId}`;
                        navigator.clipboard.writeText(link);
                        setQrLinkCopied(true);
                        setTimeout(() => setQrLinkCopied(false), 2500);
                      }}
                      className="px-4 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0"
                    >
                      {qrLinkCopied ? <Check className="w-4 h-4 text-zinc-200" /> : <Copy className="w-4 h-4 text-zinc-200" />}
                      <span>{qrLinkCopied ? 'Link Copied!' : 'Copy Direct Video Review Link'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Left: Table QR Standee Studio */}
                  <div className="bg-zinc-900 rounded-3xl border border-zinc-800 text-white p-5 md:p-6 shadow-xs flex flex-col justify-between space-y-6">
                    <div className="space-y-5">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                        <div className="flex items-center gap-2.5 text-white font-extrabold text-lg">
                          <div className="w-9 h-9 rounded-xl bg-zinc-800 text-white border border-zinc-700 flex items-center justify-center">
                            <QrCode className="w-5 h-5" />
                          </div>
                          <div>
                            <h2>Table QR Standee Studio</h2>
                            <p className="text-[11px] text-zinc-200 font-normal">Physical in-venue print collateral</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-zinc-200 bg-zinc-800 px-2 py-1 rounded-md border border-zinc-700">
                          Format: {qrStandeeStyle.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      {/* Controls */}
                      <div className="space-y-3">
                        {/* Style Format Switcher */}
                        <div>
                          <label className="block text-xs font-bold text-zinc-200 mb-1.5">Standee Format</label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'acrylic_standee', label: 'Table Tent (A6)', icon: '📐' },
                              { id: 'decal_badge', label: 'Window Sticker', icon: '🏷️' },
                              { id: 'receipt_card', label: 'Receipt Footer', icon: '🧾' },
                            ].map(s => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => setQrStandeeStyle(s.id as any)}
                                className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                                  qrStandeeStyle === s.id
                                    ? 'bg-zinc-800 text-white border-zinc-700 shadow-xs font-bold'
                                    : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-900 hover:text-white'
                                }`}
                              >
                                <span>{s.icon}</span>
                                <span className="truncate">{s.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Heading & Table Label Text */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-zinc-200 mb-1">Printed Callout Heading</label>
                            <input
                              type="text"
                              value={qrCustomHeading}
                              onChange={(e) => setQrCustomHeading(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-hidden focus:ring-1 focus:ring-zinc-700"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-zinc-200 mb-1">Table / Zone Label (Optional)</label>
                            <input
                              type="text"
                              value={qrTableLabel}
                              onChange={(e) => setQrTableLabel(e.target.value)}
                              placeholder="e.g. Table #4"
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-hidden focus:ring-1 focus:ring-zinc-700"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Live Visual Standee Mockup Preview */}
                      <div className="relative pt-2">
                        <div className="text-[10px] font-bold text-zinc-200 uppercase tracking-wider text-center mb-2">
                          Print Preview ({qrStandeeStyle.replace('_', ' ')})
                        </div>

                        {qrStandeeStyle === 'acrylic_standee' && (
                          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center max-w-xs mx-auto shadow-xl relative overflow-hidden text-white">
                            {/* Decorative Top Acrylic Lip */}
                            <div className="w-20 h-1.5 bg-zinc-700 rounded-full mb-4 shadow-inner" />

                            {qrTableLabel && (
                              <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-200 text-[9px] font-extrabold uppercase border border-zinc-700">
                                {qrTableLabel}
                              </div>
                            )}

                            <div className="w-12 h-12 rounded-2xl bg-white text-zinc-950 flex items-center justify-center mb-2 shadow-md">
                              <Star className="w-6 h-6 fill-zinc-950" />
                            </div>

                            <h3 className="font-black text-white text-base tracking-tight">{currentPlace.name}</h3>
                            <div className="flex items-center gap-1 text-white text-xs font-bold my-1">
                              <span>4.9</span>
                              <div className="flex text-white">
                                {'★★★★★'.split('').map((s, idx) => (
                                  <span key={idx}>{s}</span>
                                ))}
                              </div>
                              <span className="text-zinc-200 text-[10px] font-normal">({placeVideos.length} Video Reviews)</span>
                            </div>

                            <p className="text-[11px] text-zinc-200 max-w-[200px] mb-3 leading-snug">
                              Scan with your camera app to record your 1-tap video review
                            </p>

                            <div className="bg-white p-3.5 rounded-2xl shadow-lg border border-zinc-700 relative group">
                              <QRCodeCanvas
                                id="yoouz-qr-code"
                                value={`https://yoouz.com/#/record_review?placeId=${selectedPlaceId}`}
                                size={150}
                                level="H"
                                includeMargin={true}
                              />
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-8 h-8 rounded-full bg-zinc-950 border-2 border-white text-white flex items-center justify-center font-black text-xs shadow-md">
                                  ★
                                </div>
                              </div>
                            </div>

                            <span className="text-[10px] font-extrabold text-zinc-200 mt-4 uppercase tracking-wider bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                              {qrCustomHeading || 'LEAVE A 60-SECOND VIDEO REVIEW'}
                            </span>
                          </div>
                        )}

                        {qrStandeeStyle === 'decal_badge' && (
                          <div className="w-64 h-64 mx-auto rounded-full bg-zinc-900 border border-zinc-700 p-1 shadow-2xl flex flex-col items-center justify-center text-center text-white relative">
                            <div className="w-full h-full rounded-full border-2 border-dashed border-zinc-700 p-4 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-xs">
                              <span className="text-[10px] font-black tracking-widest uppercase text-zinc-200 mb-1">{currentPlace.name}</span>
                              
                              <div className="bg-white p-2.5 rounded-2xl shadow-xl">
                                <QRCodeCanvas
                                  id="yoouz-qr-code"
                                  value={`https://yoouz.com/#/record_review?placeId=${selectedPlaceId}`}
                                  size={110}
                                  level="H"
                                  includeMargin={true}
                                />
                              </div>

                              <span className="text-[9px] font-bold text-zinc-200 mt-2 max-w-[150px] leading-tight">
                                {qrCustomHeading}
                              </span>
                            </div>
                          </div>
                        )}

                        {qrStandeeStyle === 'receipt_card' && (
                          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 max-w-sm mx-auto shadow-xs font-mono text-zinc-200 text-center space-y-2">
                            <div className="text-xs font-bold tracking-widest uppercase border-b border-dashed border-zinc-800 pb-2 text-zinc-200">
                              *** THANK YOU FOR VISITING {currentPlace.name.toUpperCase()} ***
                            </div>
                            <div className="flex items-center justify-center gap-4 py-1">
                              <div className="bg-white p-2 rounded-xl border border-zinc-700">
                                <QRCodeCanvas
                                  id="yoouz-qr-code"
                                  value={`https://yoouz.com/#/record_review?placeId=${selectedPlaceId}`}
                                  size={90}
                                  level="H"
                                  includeMargin={true}
                                />
                              </div>
                              <div className="text-left max-w-[160px]">
                                <div className="text-[11px] font-bold text-white leading-tight">
                                  {qrCustomHeading}
                                </div>
                                <div className="text-[9px] text-zinc-200 mt-1">
                                  Scan QR on receipt to publish your video review.
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Export Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={downloadQRCode}
                        className="py-3 bg-white hover:bg-zinc-200 text-zinc-950 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        Download High-Res PNG
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowPrintModal(true)}
                        className="py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-zinc-700"
                      >
                        <Printer className="w-4 h-4 text-zinc-200" />
                        Print Standee Sheet (PDF)
                      </button>
                    </div>
                  </div>

                  {/* Right: In-Venue Physical QR & NFC Print Kits */}
                  <div className="bg-zinc-900 rounded-3xl border border-zinc-800 text-white p-6 shadow-xs flex flex-col justify-between space-y-6">
                    <div className="space-y-5">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                        <div className="flex items-center gap-2.5 text-white font-extrabold text-lg">
                          <div className="w-9 h-9 rounded-xl bg-zinc-800 text-zinc-200 border border-zinc-700 flex items-center justify-center">
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <h2>Physical Review Kit</h2>
                            <p className="text-[11px] text-zinc-200 font-normal">All-in-one offline marketing bundle</p>
                          </div>
                        </div>

                        {/* Status badge */}
                        <span className="text-[10px] font-extrabold text-zinc-200 bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-zinc-200" /> Free Shipping
                        </span>
                      </div>

                      <p className="text-xs text-zinc-200 leading-relaxed">
                        Top venues capture over 85% of their reviews directly in-person. Instead of risky spam emails, display high-contrast physical prompts so customers scan and record before they leave.
                      </p>

                      {/* Unified Bundle Overview Card */}
                      <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3.5">
                          <span className="text-[10px] bg-zinc-800 text-zinc-200 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border border-zinc-700">
                            Complete In-Venue Suite
                          </span>
                          <span className="text-[10px] text-zinc-200 font-medium">Included for Pro & Premium</span>
                        </div>

                        <h3 className="font-extrabold text-white text-sm mb-3">What's in your box:</h3>
                        
                        <ul className="space-y-2.5">
                          <li className="flex items-start gap-2.5 text-xs text-zinc-200">
                            <span className="text-sm shrink-0 leading-none">📐</span>
                            <div>
                              <strong className="font-bold text-white">2x Acrylic Table Stands:</strong> Heavy-duty, double-sided displays for host stands, counters, or dining tables.
                            </div>
                          </li>
                          <li className="flex items-start gap-2.5 text-xs text-zinc-200">
                            <span className="text-sm shrink-0 leading-none">🏷️</span>
                            <div>
                              <strong className="font-bold text-white">4x Window & Door Stickers:</strong> Weatherproof, adhesive vinyl decals with high-visibility QR prompts.
                            </div>
                          </li>
                          <li className="flex items-start gap-2.5 text-xs text-zinc-200">
                            <span className="text-sm shrink-0 leading-none">⚡</span>
                            <div>
                              <strong className="font-bold text-white">1x Smart NFC Fast Tap Plate:</strong> High-tech embedded microchip plate. Guests just tap their phone to instantly open the recorder.
                            </div>
                          </li>
                        </ul>
                      </div>

                      {/* Shipping Form controls */}
                      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3.5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-extrabold text-zinc-200 uppercase tracking-wider mb-1">
                              Shipping Business Address
                            </label>
                            <div className="relative">
                              <MapPin className="w-3.5 h-3.5 text-zinc-200 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={shippingAddress}
                                onChange={(e) => setShippingAddress(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg pl-8 pr-3 py-1.5 text-xs font-bold text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-zinc-700"
                                placeholder="Enter shipping address"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-extrabold text-zinc-200 uppercase tracking-wider mb-1">
                              Quantity
                            </label>
                            <select
                              value={kitQuantity}
                              onChange={(e) => setKitQuantity(Number(e.target.value))}
                              className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-2.5 py-1.5 text-xs font-bold text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-zinc-700"
                            >
                              <option value={1}>1 Full Kit</option>
                              <option value={2}>2 Full Kits</option>
                              <option value={3}>3 Full Kits</option>
                            </select>
                          </div>
                        </div>

                        {/* Order status message */}
                        {orderSubmitted && (
                          <div className="p-3 bg-zinc-900 border border-zinc-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                            <CheckCircle2 className="w-4.5 h-4.5 text-zinc-200 shrink-0" />
                            <div>
                              <p className="leading-tight">Physical Kit Ordered Successfully!</p>
                              <p className="text-[10px] font-normal text-zinc-200 mt-0.5">
                                Your custom branded QR & NFC kit will ship to <span className="underline">{shippingAddress}</span> in 3-5 business days. Tracking email sent!
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Master Action Trigger */}
                    <div>
                      {currentPlan === 'none' || currentPlan === 'basic' ? (
                        <button
                          type="button"
                          onClick={() => setShowPricingModal(true)}
                          className="w-full py-3 bg-white hover:bg-zinc-200 text-zinc-950 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer font-extrabold"
                        >
                          <Sparkles className="w-4 h-4 text-zinc-950" />
                          Upgrade to Get This Physical Kit Shipped Free
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOrderPhysicalKit('Full Complete Physical Kit')}
                          disabled={orderingKitType !== null || orderSubmitted}
                          className="w-full py-3 bg-white hover:bg-zinc-200 text-zinc-950 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-zinc-800 disabled:text-zinc-200"
                        >
                          {orderingKitType !== null ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                              <span>Customizing & Shipping Your Kit...</span>
                            </>
                          ) : (
                            <>
                              <Truck className="w-4 h-4 text-zinc-950" />
                              <span>Ship My Free In-Venue Review Kit</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* TAB 6: BUSINESS PROFILE & INFO */}
            
            {activeTab === 'profile' && (
              <div className="space-y-8 animate-in fade-in duration-200 pb-12 max-w-6xl mx-auto">
                
                {/* 10/10 iOS-Style Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Venue Profile Settings</h2>
                    <p className="text-sm text-zinc-200 mt-1">Configure your official public listing details and appearance.</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {isProfileSaved && (
                      <span className="text-[13px] font-bold text-emerald-400 flex items-center gap-1.5 animate-in zoom-in-95">
                        <CheckCircle2 className="w-4 h-4" /> Saved
                      </span>
                    )}
                    <button
                      onClick={handleSaveProfile}
                      className="px-6 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-full text-[13px] font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                  {/* Left Column: Form Controls (7 cols) */}
                  <div className="lg:col-span-7 space-y-10">
                    
                    {/* SECTION 1: Business Identity */}
                    <div>
                      <h3 className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-zinc-400" /> Business Identity
                      </h3>
                      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800 shadow-sm">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center p-4 sm:p-5 hover:bg-zinc-800/40 transition-colors group focus-within:bg-zinc-800/40">
                          <div className="w-48 text-[13px] font-semibold text-zinc-300 mb-2 sm:mb-0 shrink-0">Venue Logo URL</div>
                          <input
                            type="url"
                            value={profileLogoUrl}
                            onChange={(e) => setProfileLogoUrl(e.target.value)}
                            placeholder="https://yourwebsite.com/logo.png"
                            className="flex-1 bg-transparent text-[13px] font-semibold text-white placeholder-zinc-500 focus:outline-none"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center p-4 sm:p-5 hover:bg-zinc-800/40 transition-colors group focus-within:bg-zinc-800/40">
                          <div className="w-48 text-[13px] font-semibold text-zinc-300 mb-2 sm:mb-0 shrink-0">Venue Name</div>
                          <input
                            type="text"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            placeholder="e.g. The Rustic Spoon"
                            className="flex-1 bg-transparent text-[13px] font-semibold text-white placeholder-zinc-500 focus:outline-none"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center p-4 sm:p-5 hover:bg-zinc-800/40 transition-colors relative">
                          <div className="w-48 text-[13px] font-semibold text-zinc-300 mb-2 sm:mb-0 shrink-0">Category</div>
                          <div className="flex-1 w-full relative">
                            <select
                              value={businessCategory}
                              onChange={(e) => setBusinessCategory(e.target.value)}
                              className="bg-transparent text-[13px] font-semibold text-white appearance-none cursor-pointer focus:outline-none w-full"
                            >
                              <option value="Dining & Artisanal Food" className="bg-zinc-900 text-white">Dining & Artisanal Food</option>
                              <option value="Hospitality & Hotels" className="bg-zinc-900 text-white">Hospitality & Hotels</option>
                              <option value="Services & Home Trades" className="bg-zinc-900 text-white">Services & Home Trades</option>
                              <option value="Health, Beauty & Wellness" className="bg-zinc-900 text-white">Health, Beauty & Wellness</option>
                              <option value="Retail & Local Boutique" className="bg-zinc-900 text-white">Retail & Local Boutique</option>
                              <option value="Professional, Legal & Finance" className="bg-zinc-900 text-white">Professional, Legal & Finance</option>
                              <option value="Digital Platform & E-Commerce" className="bg-zinc-900 text-white">Digital Platform & E-Commerce</option>
                              <option value="Automotive & Transportation" className="bg-zinc-900 text-white">Automotive & Transportation</option>
                              <option value="Entertainment & Venues" className="bg-zinc-900 text-white">Entertainment & Venues</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center p-4 sm:p-5 hover:bg-zinc-800/40 transition-colors group focus-within:bg-zinc-800/40">
                          <div className="w-48 text-[13px] font-semibold text-zinc-300 mb-2 sm:mb-0 shrink-0">Website URL</div>
                          <input
                            type="url"
                            value={profileWebsite}
                            onChange={(e) => setProfileWebsite(e.target.value)}
                            placeholder="https://yourwebsite.com"
                            className="flex-1 bg-transparent text-[13px] font-semibold text-white placeholder-zinc-500 focus:outline-none"
                          />
                        </div>

                      </div>
                    </div>

                    {/* SECTION 2: Physical Address */}
                    <div>
                      <h3 className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400" /> Physical Address
                      </h3>
                      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800 shadow-sm">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center p-4 sm:p-5 hover:bg-zinc-800/40 transition-colors relative">
                          <div className="w-48 text-[13px] font-semibold text-zinc-300 mb-2 sm:mb-0 shrink-0">Country / Region</div>
                          <div className="flex-1 w-full relative">
                            <CountrySelector
                              value={selectedCountry}
                              onChange={handleCountryChange}
                            />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center p-4 sm:p-5 hover:bg-zinc-800/40 transition-colors group focus-within:bg-zinc-800/40">
                          <div className="w-48 text-[13px] font-semibold text-zinc-300 mb-2 sm:mb-0 shrink-0">Street Address</div>
                          <input
                            type="text"
                            value={streetAddress}
                            onChange={(e) => setStreetAddress(e.target.value)}
                            placeholder="e.g. 123 Main St, Suite 400"
                            className="flex-1 bg-transparent text-[13px] font-semibold text-white placeholder-zinc-500 focus:outline-none"
                          />
                        </div>

                        {hasStates && (
                          <div className="flex flex-col sm:flex-row sm:items-center p-4 sm:p-5 hover:bg-zinc-800/40 transition-colors relative">
                            <div className="w-48 text-[13px] font-semibold text-zinc-300 mb-2 sm:mb-0 shrink-0">{stateLabel}</div>
                            <div className="flex-1 w-full relative">
                              <SearchableComboSelector
                                value={stateRegion}
                                onChange={(val) => {
                                  setStateRegion(val);
                                  setCity("");
                                }}
                                options={stateOptions}
                                placeholder={`Select ${stateLabel}`}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center p-4 sm:p-5 hover:bg-zinc-800/40 transition-colors relative">
                          <div className="w-48 text-[13px] font-semibold text-zinc-300 mb-2 sm:mb-0 shrink-0">City</div>
                          <div className="flex-1 w-full relative">
                            <SearchableComboSelector
                              value={city}
                              onChange={setCity}
                              options={cityOptions}
                              placeholder={
                                cityOptions.length > 0
                                  ? `e.g. ${cityOptions[0]}`
                                  : stateRegion
                                    ? `e.g. City in ${stateRegion}`
                                    : "e.g. New York"
                              }
                            />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center p-4 sm:p-5 hover:bg-zinc-800/40 transition-colors group focus-within:bg-zinc-800/40">
                          <div className="w-48 text-[13px] font-semibold text-zinc-300 mb-2 sm:mb-0 shrink-0">{activeCountryDialInfo.postalLabel || "ZIP Code"}</div>
                          <input
                            type="text"
                            value={zipCode}
                            onChange={(e) => setZipCode(e.target.value)}
                            placeholder={activeCountryDialInfo.postalPlaceholder || "e.g. 10001"}
                            className="flex-1 bg-transparent text-[13px] font-semibold text-white placeholder-zinc-500 focus:outline-none"
                          />
                        </div>

                      </div>
                    </div>

                    {/* SECTION 3: Phone Contact */}
                    <div>
                      <h3 className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-zinc-400" /> Contact Information
                      </h3>
                      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800 shadow-sm">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center p-4 sm:p-5 hover:bg-zinc-800/40 transition-colors relative">
                          <div className="w-48 text-[13px] font-semibold text-zinc-300 mb-2 sm:mb-0 shrink-0">Dialing Code</div>
                          <div className="flex-1 w-full relative">
                            <select
                              value={phoneDialCode}
                              onChange={(e) => setPhoneDialCode(e.target.value)}
                              className="bg-transparent text-[13px] font-semibold text-white appearance-none cursor-pointer focus:outline-hidden w-full"
                            >
                              {countryDialData.map((item) => (
                                <option key={`${item.code}-${item.dialCode}-${item.name}`} value={item.dialCode} className="bg-zinc-900 text-white">
                                  {item.flag} {item.dialCode} ({item.name})
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center p-4 sm:p-5 hover:bg-zinc-800/40 transition-colors group focus-within:bg-zinc-800/40">
                          <div className="w-48 text-[13px] font-semibold text-zinc-300 mb-2 sm:mb-0 shrink-0">Direct Number</div>
                          <input
                            type="tel"
                            value={localPhone}
                            onChange={(e) => setLocalPhone(e.target.value)}
                            placeholder={activeCountryDialInfo.phonePlaceholder || "e.g. 555-0198"}
                            className="flex-1 bg-transparent text-[13px] font-semibold text-white placeholder-zinc-500 focus:outline-hidden"
                          />
                        </div>

                      </div>
                    </div>

                    {/* SECTION 4: Operating Hours */}
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 px-1 gap-2">
                         <h3 className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                           <Clock className="w-3.5 h-3.5 text-zinc-400" /> Operating Hours
                         </h3>
                         <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                            <button
                              onClick={() => setWeeklySchedule(prev => prev.map((d, i) => i < 5 ? { ...d, status: 'open', openTime: '08:00 AM', closeTime: '06:00 PM' } : { ...d, status: 'closed' }))}
                              className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold transition-colors cursor-pointer uppercase tracking-wider shrink-0"
                            >
                              Mon-Fri
                            </button>
                            <button
                              onClick={() => setWeeklySchedule(prev => prev.map(d => ({ ...d, status: 'open', openTime: '11:00 AM', closeTime: '11:00 PM' })))}
                              className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold transition-colors cursor-pointer uppercase tracking-wider shrink-0"
                            >
                              Everyday
                            </button>
                            <button
                              onClick={() => setWeeklySchedule(prev => prev.map(d => ({ ...d, status: '24h' })))}
                              className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold transition-colors cursor-pointer uppercase tracking-wider shrink-0"
                            >
                              24/7
                            </button>
                         </div>
                      </div>

                      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800 shadow-sm">
                        {weeklySchedule.map((item, idx) => (
                          <div key={item.day} className="flex flex-col lg:flex-row lg:items-center p-4 hover:bg-zinc-800/40 transition-colors gap-4">
                             <div className="w-32 text-[13px] font-semibold text-white shrink-0 flex items-center gap-2">
                               <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'open' ? 'bg-white' : item.status === '24h' ? 'bg-zinc-300' : 'bg-zinc-700'}`} />
                               {item.day}
                             </div>
                             
                             <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-3">
                               <div className="flex items-center bg-zinc-950 rounded-full p-1 border border-zinc-800">
                                 {(['open', '24h', 'closed'] as const).map(status => (
                                   <button
                                     key={status}
                                     onClick={() => {
                                       const copy = [...weeklySchedule];
                                       copy[idx].status = status;
                                       setWeeklySchedule(copy);
                                     }}
                                     className={`px-3 py-1.5 rounded-full text-[11px] font-bold capitalize transition-all cursor-pointer ${
                                       item.status === status 
                                         ? 'bg-zinc-800 text-white border border-zinc-700 shadow-xs font-bold'
                                         : 'text-zinc-300 hover:text-white'
                                     }`}
                                   >
                                     {status === '24h' ? '24 Hrs' : status}
                                   </button>
                                 ))}
                               </div>

                               {item.status === 'open' && (
                                 <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
                                   <div className="relative">
                                     <select
                                       value={item.openTime}
                                       onChange={(e) => {
                                         const copy = [...weeklySchedule];
                                         copy[idx].openTime = e.target.value;
                                         setWeeklySchedule(copy);
                                       }}
                                       className="bg-zinc-950 border border-zinc-800 text-white rounded-xl pl-3 pr-7 py-2 text-[12px] font-semibold appearance-none focus:outline-none focus:border-zinc-600"
                                     >
                                       {['06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM'].map(t => <option key={t} value={t} className="bg-zinc-900 text-white">{t}</option>)}
                                     </select>
                                     <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                   </div>
                                   <span className="text-zinc-400 text-[11px] font-bold">to</span>
                                   <div className="relative">
                                     <select
                                       value={item.closeTime}
                                       onChange={(e) => {
                                         const copy = [...weeklySchedule];
                                         copy[idx].closeTime = e.target.value;
                                         setWeeklySchedule(copy);
                                       }}
                                       className="bg-zinc-950 border border-zinc-800 text-white rounded-xl pl-3 pr-7 py-2 text-[12px] font-semibold appearance-none focus:outline-none focus:border-zinc-600"
                                     >
                                       {['05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM', '11:59 PM'].map(t => <option key={t} value={t} className="bg-zinc-900 text-white">{t}</option>)}
                                     </select>
                                     <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                   </div>
                                 </div>
                               )}
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SECTION 5: About & Amenities */}
                    <div>
                      <h3 className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                        <Info className="w-3.5 h-3.5 text-zinc-400" /> About & Amenities
                      </h3>
                      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800 shadow-sm">
                        
                        <div className="p-4 sm:p-5 hover:bg-zinc-800/40 transition-colors focus-within:bg-zinc-800/40">
                          <div className="flex items-center justify-between mb-3">
                             <div className="text-[13px] font-semibold text-zinc-300">Public Story & Description</div>
                             <span className="text-[10px] text-zinc-400 font-mono">{profileDesc.length} / 500</span>
                          </div>
                          <textarea
                            value={profileDesc}
                            onChange={(e) => setProfileDesc(e.target.value)}
                            maxLength={500}
                            placeholder="Tell visitors what makes your venue special..."
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-[13px] text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 resize-none h-28 leading-relaxed font-medium"
                          />
                        </div>

                        <div className="p-4 sm:p-5">
                          <div className="text-[13px] font-semibold text-zinc-300 mb-4">Venue Amenities</div>
                          <div className="flex flex-wrap gap-2">
                            {['Free Wi-Fi', 'Outdoor Seating', 'Onsite Parking', 'Wheelchair Accessible', 'Pet Friendly', 'Live Music', 'Full Bar', 'Accepts Credit Cards'].map(amenity => {
                              const isSelected = selectedAmenities.includes(amenity);
                              return (
                                <button
                                  key={amenity}
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedAmenities(prev => prev.filter(a => a !== amenity));
                                    } else {
                                      setSelectedAmenities(prev => [...prev, amenity]);
                                    }
                                  }}
                                  className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer border ${
                                    isSelected
                                      ? 'bg-zinc-800 text-white border-zinc-700 shadow-xs'
                                      : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 inline-block mr-1 -mt-0.5" />}
                                  {amenity}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* SECTION 6: Pro Merchant Support & Documentation (Moved above alerts for clean hierarchy) */}
                    <div>
                      <h3 className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> {t("business.proMerchantSupport", "Pro Merchant Support & Documentation")}
                      </h3>
                      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                        <div className="space-y-1">
                          <h4 className="text-[13px] font-bold text-white">
                            {t("business.proMerchantSupport", "Pro Merchant Support & Knowledge Base")}
                          </h4>
                          <p className="text-[12px] text-zinc-400 leading-relaxed max-w-lg">
                            {t("business.proSupportDesc", "Need assistance setting up website widgets, table QR stands, or video review moderation? Access complete step-by-step documentation and live support.")}
                          </p>
                        </div>
                        <button
                          type="button"
                          id="btn-profile-open-support-docs"
                          onClick={() => setShowHelpModal(true)}
                          className="px-5 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 text-[12px] font-bold transition-all active:scale-95 shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-zinc-950" />
                          <span>{t("business.openGuideDocs", "Open Guide & Docs")}</span>
                        </button>
                      </div>
                    </div>

                    {/* SECTION 7: Alerts & Notification Preferences */}
                    <div>
                      <h3 className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                        <Bell className="w-3.5 h-3.5 text-zinc-400" /> Alerts & Notification Preferences
                      </h3>
                      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-[13px] font-bold text-white">Business Notification Preferences</h4>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              businessNotificationSettings.enabled
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {businessNotificationSettings.enabled ? 'Active' : 'Paused'}
                            </span>
                          </div>
                          <p className="text-[12px] text-zinc-400 font-medium">
                            {businessNotificationSettings.enabled 
                              ? 'Manage customer reviews, direct messages, followers, and interaction alerts.' 
                              : 'In-app notifications are currently paused. Enable them to stay updated in real time.'}
                          </p>
                        </div>
                        <button
                          type="button"
                          id="btn-open-business-notif-settings"
                          onClick={() => setIsNotificationSettingsOpen(true)}
                          className="px-4 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-[12px] font-bold border border-zinc-700/80 transition-all active:scale-95 shadow-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer whitespace-nowrap"
                        >
                          <Settings className="w-4 h-4 text-zinc-300" />
                          <span>Customize Settings</span>
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Premium Live Mobile Preview Widget (5 cols) */}
                  <div className="lg:col-span-5 relative">
                    <div className="sticky top-24">
                      
                      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden relative">
                         {/* Subtle Glow */}
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-40 bg-white/5 blur-[60px] rounded-full pointer-events-none" />
                         
                         {/* Header */}
                         <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between relative z-10 bg-zinc-900/80 backdrop-blur-xl">
                           <div className="flex items-center gap-2">
                             <Eye className="w-4 h-4 text-zinc-300" />
                             <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-300">Live Preview</span>
                           </div>
                           <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-white text-[10px] font-bold border border-white/20">Yoouz App</span>
                         </div>

                         {/* Mobile Card Replica */}
                         <div className="p-6 bg-zinc-950 min-h-[500px]">
                           <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-5 shadow-2xl relative overflow-hidden ring-1 ring-white/[0.04]">
                              
                              {/* Preview Head */}
                              <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-2xl font-black text-white shrink-0 overflow-hidden shadow-inner">
                                  {currentPlace.logoUrl ? (
                                    <img src={currentPlace.logoUrl} loading="eager" decoding="sync" fetchPriority="high" className="w-full h-full object-cover" />
                                  ) : (
                                    (profileName.charAt(0).toUpperCase() || 'B')
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <h4 className="font-bold text-white text-lg truncate tracking-tight">{profileName || 'Venue Name'}</h4>
                                    <BadgeCheck className="w-4.5 h-4.5 text-white shrink-0" />
                                  </div>
                                  <div className="text-[11px] text-zinc-400 font-semibold mt-0.5 uppercase tracking-widest">{businessCategory || 'Category'}</div>
                                </div>
                              </div>

                              <div className="space-y-3">
                                {/* Map Preview */}
                                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850 shadow-sm">
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                                      <MapPin className="w-3.5 h-3.5 text-zinc-300" />
                                    </div>
                                    <div>
                                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Physical Location</div>
                                      <div className="text-[13px] font-semibold text-zinc-200 leading-snug">{profileAddress || 'Address will appear here'}</div>
                                    </div>
                                  </div>
                                </div>

                                {/* Status & Phone Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850 shadow-sm">
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Status</div>
                                    <div className="text-[12px] font-bold text-white flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Open Now
                                    </div>
                                  </div>
                                  <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850 shadow-sm overflow-hidden">
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Direct Line</div>
                                    <div className="text-[12px] font-bold text-white truncate">{profilePhone || 'Not set'}</div>
                                  </div>
                                </div>

                                {/* Hours */}
                                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850 shadow-sm">
                                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Schedule</div>
                                  <div className="text-[12px] text-zinc-300 leading-relaxed font-mono font-medium">{profileHours || 'Schedule not configured'}</div>
                                </div>

                                {/* About */}
                                {profileDesc && (
                                  <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850 shadow-sm">
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Story</div>
                                    <div className="text-[12.5px] text-zinc-300 leading-relaxed font-medium line-clamp-4">{profileDesc}</div>
                                  </div>
                                )}
                              </div>
                           </div>
                         </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            )}
{/* TAB 7: SUBSCRIPTION & CREEM.IO */}
            {activeTab === 'billing' && (
              <div className="space-y-8 animate-in fade-in duration-200 pb-12 max-w-6xl mx-auto">
                
                {/* 10/10 iOS-Style Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Subscription & Billing</h2>
                    <p className="text-sm text-zinc-200 mt-1">Manage your active plans, payment methods, and Creem.io invoices.</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => setShowPricingModal(true)}
                      className="px-6 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-full text-[13px] font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                    >
                      Compare All Plans
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                  {/* Left Column: Active Plan & History (7 cols) */}
                  <div className="lg:col-span-7 space-y-10">
                    
                    {/* SECTION 1: Active Subscription */}
                    <div>
                      <h3 className="text-[11px] font-bold text-zinc-200 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5" /> Current Plan
                      </h3>
                      
                      <div className="bg-[#111113] rounded-[32px] border border-zinc-800 overflow-hidden relative shadow-sm">
                        {/* Glow effect */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[80px] rounded-full pointer-events-none" />
                        
                        <div className="p-8 relative z-10">
                           <div className="flex flex-col sm:flex-row sm:items-start sm:items-center justify-between gap-6 mb-8">
                             <div>
                               <div className="flex items-center gap-2 mb-3">
                                 <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-white text-[10px] font-bold border border-white/20 uppercase tracking-wider">
                                   Active Subscription
                                 </span>
                                 <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-white text-[10px] font-bold border border-white/20 uppercase tracking-wider flex items-center gap-1.5">
                                   <span className="w-1.5 h-1.5 rounded-full bg-white" /> Live
                                 </span>
                               </div>
                               <h4 className="text-3xl font-black text-white tracking-tight">Yoouz Pro <span className="text-zinc-200">Business</span></h4>
                               <div className="text-zinc-200 text-[13px] font-semibold mt-2">
                                 $49.00 USD / month
                                </div>
                             </div>
                             
                             <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shrink-0">
                               <Sparkles className="w-8 h-8 text-white" />
                             </div>
                           </div>
                           
                           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#000000]/40 rounded-[20px] border border-white/[0.04]">
                             <div>
                               <div className="text-[11px] text-zinc-200 font-bold uppercase tracking-wider mb-1">Next Billing Date</div>
                               <div className="text-[13px] font-semibold text-white">
                                 Renews on <span className="text-white font-bold">{renewalDate}</span>
                               </div>
                               <div className="text-[12px] text-zinc-200 font-medium mt-0.5">
                                 via {paymentMethodDisplay}
                               </div>
                             </div>
                             <div className="flex items-center gap-2 shrink-0">
                               <button
                                 onClick={() => {
                                   setCreemPlan('premium');
                                   setShowCreemCheckout(true);
                                 }}
                                 className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-xl text-[13px] font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                               >
                                 <Sparkles className="w-4 h-4" /> Upgrade to Premium
                               </button>
                             </div>
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: Billing History */}
                    <div>
                      <h3 className="text-[11px] font-bold text-zinc-200 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                        <Receipt className="w-3.5 h-3.5" /> Billing History
                      </h3>
                      <div className="bg-[#111113] rounded-[24px] border border-white/[0.08] shadow-sm overflow-hidden flex flex-col">
                        <div className="overflow-x-auto custom-scrollbar">
                          <table className="w-full text-left min-w-[600px]">
                            <thead className="bg-[#18181b] border-b border-white/[0.06]">
                              <tr>
                                <th className="py-3 px-5 text-[10px] font-bold text-zinc-200 uppercase tracking-widest whitespace-nowrap">Invoice</th>
                                <th className="py-3 px-5 text-[10px] font-bold text-zinc-200 uppercase tracking-widest whitespace-nowrap">Date</th>
                                <th className="py-3 px-5 text-[10px] font-bold text-zinc-200 uppercase tracking-widest whitespace-nowrap">Amount</th>
                                <th className="py-3 px-5 text-[10px] font-bold text-zinc-200 uppercase tracking-widest whitespace-nowrap">Status</th>
                                <th className="py-3 px-5 text-[10px] font-bold text-zinc-200 uppercase tracking-widest text-right whitespace-nowrap">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.06]">
                              {[
                                { id: 'CREEM-INV-9021', date: 'Aug 1, 2026', amount: '$49.00 USD' },
                                { id: 'CREEM-INV-8419', date: 'Jul 1, 2026', amount: '$49.00 USD' }
                              ].map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-white/[0.02] transition-colors group">
                                  <td className="py-4 px-5">
                                    <span className="font-mono text-[11px] text-zinc-200 bg-[#18181b] px-2.5 py-1.5 rounded-md border border-white/[0.06] whitespace-nowrap">{invoice.id}</span>
                                  </td>
                                  <td className="py-4 px-5 text-[13px] font-semibold text-zinc-200 whitespace-nowrap">{invoice.date}</td>
                                  <td className="py-4 px-5 text-[13px] font-bold text-white whitespace-nowrap">{invoice.amount}</td>
                                  <td className="py-4 px-5 whitespace-nowrap">
                                    <span className="px-2.5 py-1 rounded-md bg-white/10 text-white text-[10px] font-bold border border-white/20 uppercase tracking-wider">
                                      Paid
                                    </span>
                                  </td>
                                  <td className="py-4 px-5 text-right whitespace-nowrap">
                                    <button 
                                      onClick={() => setShowReceiptModal(true)}
                                      className="text-[12px] font-bold text-zinc-200 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-end gap-1.5 ml-auto md:opacity-100"
                                    >
                                      <Download className="w-3.5 h-3.5" /> Receipt
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Upgrade / Features (5 cols) */}
                  <div className="lg:col-span-5 relative">
                    <div className="sticky top-24 space-y-6">
                      
                      <div className="bg-[#111113] rounded-[32px] border border-white/[0.08] p-8 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                        
                        <div className="relative z-10">
                          <div className="w-12 h-12 rounded-2xl bg-[#18181b] border border-white/[0.08] flex items-center justify-center mb-6 shadow-inner">
                            <ShieldCheck className="w-5 h-5 text-white" />
                          </div>
                          
                          <h4 className="text-xl font-bold text-white mb-2 tracking-tight">Secure Merchant Billing</h4>
                          <p className="text-[13px] text-zinc-200 leading-relaxed font-medium mb-8">
                            Your subscription and payment methods are securely managed through Creem.io's encrypted merchant infrastructure.
                          </p>

                          <div className="space-y-4">
                            {[
                              'PCI-DSS Compliant Infrastructure',
                              '256-bit AES Encryption',
                              'Automated Monthly Invoicing',
                              'Cancel or modify anytime'
                            ].map((feature, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                                  <Check className="w-3.5 h-3.5 text-white" />
                                </div>
                                <span className="text-[13px] font-semibold text-zinc-200">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Payment Method Card */}
                      <div className="bg-[#111113] rounded-[24px] border border-white/[0.08] p-5 flex items-center justify-between group cursor-pointer hover:bg-white/[0.02] transition-colors shadow-sm">
                         <div className="flex items-center gap-4">
                           <div className="w-14 h-10 bg-[#18181b] border border-white/[0.06] rounded-lg flex items-center justify-center shadow-inner">
                             <CreditCard className="w-5 h-5 text-zinc-200" />
                           </div>
                           <div>
                             <div className="text-[13px] font-bold text-white mb-0.5">{paymentMethodDisplay}</div>
                             <div className="text-[11px] text-zinc-200 font-bold uppercase tracking-wider">Default Payment Method</div>
                           </div>
                         </div>
                         <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-200 transition-colors" />
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Footer & Legal Links (Matching user account layout on both desktop & mobile) */}
            <footer className="pt-12 pb-8 mt-10 border-t border-zinc-800/80 text-center text-xs text-zinc-400 space-y-4 select-none">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  id="business-footer-terms-btn"
                  onClick={() => onOpenLegal ? onOpenLegal("terms") : onNavigate('home')}
                  className="hover:text-white underline cursor-pointer bg-transparent border-none p-0 transition-colors"
                >
                  {t("legal.termsConditions", "Terms & Conditions")}
                </button>
                <span className="text-zinc-600">•</span>
                <button
                  type="button"
                  id="business-footer-privacy-btn"
                  onClick={() => onOpenLegal ? onOpenLegal("privacy") : onNavigate('home')}
                  className="hover:text-white underline cursor-pointer bg-transparent border-none p-0 transition-colors"
                >
                  {t("legal.privacyPolicy", "Privacy Policy")}
                </button>
                <span className="text-zinc-600">•</span>
                <button
                  type="button"
                  id="business-footer-support-btn"
                  onClick={() => setShowHelpModal(true)}
                  className="hover:text-white underline cursor-pointer bg-transparent border-none p-0 transition-colors"
                >
                  {t("legal.supportDesk", "Support Desk")}
                </button>
                <span className="text-zinc-600">•</span>
                <button
                  type="button"
                  id="business-footer-about-btn"
                  onClick={() => onNavigate('more')}
                  className="hover:text-white underline cursor-pointer bg-transparent border-none p-0 transition-colors"
                >
                  {t("legal.about", "About")}
                </button>
              </div>

              <div className="space-y-1 text-center font-medium">
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  {t("legal.networkLocation", "Yoouz Trust Network • San Francisco, CA")}
                </p>
                <p className="text-[11px] text-zinc-400">
                  {t("legal.copyright", "© 2026 Yoouz Inc. All rights reserved. Real People. Real Reviews.")}
                </p>
              </div>
            </footer>

          </div>
        </main>
      </div>

      {/* Video Playback Modal (No Fullscreen) */}
      {activeVideoModal && (
        <BusinessVideoPlayerModal
          video={activeVideoModal}
          placeName={currentPlace.name}
          placeId={currentPlace.id}
          websiteUrl={currentPlace.website || (currentPlace as any).url}
          onClose={() => setActiveVideoModal(null)}
          onOpenPublicListing={() => {
            if (onOpenPlaceDrawer) {
              onOpenPlaceDrawer(selectedPlaceId);
            } else {
              onNavigate('home');
            }
          }}
          onOpenCreator={onOpenCreator}
          onReply={(v) => {
            setActiveTab('reviews');
            setActiveReplyId(v.id);
          }}
        />
      )}

      {/* Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-900 rounded-3xl border border-zinc-800 text-white p-6 max-w-md w-full shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowReceiptModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-800 text-zinc-200 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-white" />
              <h3 className="font-bold text-white text-base">Creem.io Tax Invoice</h3>
            </div>

            <div className="bg-zinc-950 p-4 rounded-2xl space-y-2 text-xs font-mono border border-zinc-800 text-zinc-200">
              <div className="flex justify-between"><span>Invoice:</span><strong className="text-white">CREEM-INV-9021</strong></div>
              <div className="flex justify-between"><span>Billed To:</span><span>{billingEmail}</span></div>
              <div className="flex justify-between"><span>Merchant:</span><span>{currentPlace.name}</span></div>
              <div className="flex justify-between"><span>Plan:</span><span>Yoouz Pro Subscription</span></div>
              <div className="flex justify-between"><span>Payment:</span><span>{paymentMethodDisplay}</span></div>
              <div className="flex justify-between pt-2 border-t border-zinc-800 text-sm font-sans font-black text-white">
                <span>Total Paid:</span><span>$49.00 USD</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print / PDF
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      {showPricingModal && (
        <CopoBusinessPricingModal
          onClose={() => setShowPricingModal(false)}
          onSelectPlan={handleSelectPlan}
          currentPlan={currentPlan}
        />
      )}

      {/* Creem Checkout Modal */}
      {showCreemCheckout && (
        <CopoCreemCheckoutModal
          onClose={() => setShowCreemCheckout(false)}
          plan={creemPlan}
          onSuccess={(details) => {
            setCurrentPlan(creemPlan);
            if (details?.email) setBillingEmail(details.email);
            if (details?.last4) setPaymentMethodDisplay(`Card ending in ${details.last4}`);
            setShowCreemCheckout(false);
          }}
        />
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-[#1a1a1c] rounded-3xl border border-white/[0.04] text-white p-6 max-w-[420px] w-full shadow-2xl relative flex flex-col gap-5 animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/[0.08] text-zinc-200 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-1 pr-6 mt-1">
              <Sparkles className="w-6 h-6 text-white" />
              <h3 className="font-bold text-white text-[19px]">Yoouz Business Merchant Guide</h3>
            </div>

            <div className="space-y-4 text-[13px] text-[#a1a1aa] leading-relaxed max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <strong className="text-white font-bold flex items-center gap-2.5 text-[15px]">
                  <Star className="w-4 h-4 text-white" /> Verified Business Status
                </strong>
                <p>Your badge tells consumers that reviews are monitored by the authentic venue operator.</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#000000] border border-white/[0.06] space-y-1.5">
                <strong className="text-white font-bold flex items-center gap-2.5 text-[15px]">
                  <QrCode className="w-4 h-4 text-white" /> Table Standee QR Codes
                </strong>
                <p>Download the high-resolution QR standee to print and place on customer tables or receipt holders.</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#000000] border border-white/[0.06] space-y-1.5">
                <strong className="text-white font-bold flex items-center gap-2.5 text-[15px]">
                  <Code className="w-4 h-4 text-white" /> Auto-Sync Web Widget
                </strong>
                <p>Copy the HTML snippet into your WordPress, Squarespace, Shopify, or custom HTML site to showcase video reviews.</p>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-3.5 bg-white text-black font-bold rounded-2xl text-[14px] hover:bg-zinc-200 transition-colors cursor-pointer shadow-lg mt-1"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}

      {/* Business Claim & Verification Modal (Resend Magic Link & Website Meta Tag) */}
      <CopoBusinessClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        places={places}
        selectedPlace={currentPlace}
        onSuccess={(session) => {
          setVerifiedBusinessSession(session);
          setSelectedPlaceId(session.placeId);
          setCurrentPlan('pro');
          setIsClaiming(false);
        }} />

 {/* Interactive Command Palette Modal (⌘K) */}
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-start justify-center pt-16 md:pt-24 px-4 animate-in fade-in duration-150">
          <div 
            className="fixed inset-0"
            onClick={() => setIsCommandPaletteOpen(false)}
          />
          <div className="relative w-full max-w-xl bg-zinc-950 rounded-2xl border border-zinc-800 text-white shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
            {/* Search Header Input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800 bg-zinc-950">
              <Search className="w-4 h-4 text-zinc-200 shrink-0" />
              <input
                type="text"
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                placeholder="Search navigation, reviews, actions..."
                className="w-full text-sm font-medium text-white placeholder-zinc-400 bg-transparent focus:outline-hidden"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setIsCommandPaletteOpen(false)}
                className="px-1.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                ESC
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-96 overflow-y-auto p-2 space-y-3">
              {/* Navigation Sections */}
              <div>
                <div className="px-3 py-1 text-[10px] font-bold text-zinc-200 uppercase tracking-wider">
                  Portal Navigation
                </div>
                <div className="space-y-0.5 mt-1">
                  {[
                    { id: 'overview', label: 'Overview', icon: LayoutDashboard, desc: 'Analytics, impression trends & booking stats' },
                    { id: 'reviews', label: 'Video Reviews', icon: Video, desc: 'View customer video reviews & owner replies' },
                    { id: 'inbox', label: 'Messages', icon: MessageSquare, desc: 'View and respond to direct messages' },
                    { id: 'followers', label: 'Followers', icon: Users, desc: 'View your business followers' },
                    { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'View business alerts and mentions' },
                    { id: 'embed', label: 'Embed', icon: Code, desc: 'Embed video review carousel on website' },
                    { id: 'qr_invites', label: 'Invites', icon: QrCode, desc: 'Download table standees & send email invites' },
                    { id: 'profile', label: 'Profile', icon: Building2, desc: 'Manage operating hours, address & phone' },
                    { id: 'billing', label: 'Billing', icon: CreditCard, desc: 'Manage plan, receipts & merchant tier' },
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
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-zinc-800 transition-colors cursor-pointer group ${
                          activeTab === item.id ? 'bg-zinc-800 text-white' : 'text-zinc-200'
                        }`}
                      >
                        <item.icon className={`w-4 h-4 shrink-0 ${activeTab === item.id ? 'text-white' : 'text-zinc-200 group-hover:text-zinc-200'}`} />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold truncate">{item.label}</div>
                          <div className="text-[10px] text-zinc-200 truncate">{item.desc}</div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-200 group-hover:text-zinc-200 shrink-0" />
                      </button>
                    ))}
                </div>
              </div>

              {/* Customer Video Reviews Matching Query */}
              {commandQuery && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-bold text-zinc-200 uppercase tracking-wider">
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
                            setActiveVideoModal(v);
                            setIsCommandPaletteOpen(false);
                            setCommandQuery('');
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-zinc-800 transition-colors cursor-pointer group"
                        >
                          <img src={v.author?.avatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-zinc-200"  onError={(e) => { const target = e.currentTarget as HTMLImageElement; if (!target.src.includes('/api/avatar')) { target.src = '/api/avatar?name=User&background=27272a&color=fff'; } }} /> 
 <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-white truncate">{v.author?.name}</div>
                            <div className="text-[10px] text-zinc-200 truncate">{v.caption}</div>
                          </div>
                          <div className="flex text-amber-400 text-[10px] shrink-0 font-bold items-center gap-0.5">
                            <Star className="w-3 h-3 fill-current" /> {v.rating || 5}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Quick Merchant Actions */}
              <div>
                <div className="px-3 py-1 text-[10px] font-bold text-zinc-200 uppercase tracking-wider">
                  Quick Actions
                </div>
                <div className="space-y-0.5 mt-1">
                  {[
                    {
                      label: 'Get Embed Code for Website',
                      icon: Code,
                      action: () => {
                        setActiveTab('embed');
                        navigator.clipboard.writeText(`<iframe src="${window.location.origin}/embed/${selectedPlaceId}" width="100%" height="450" frameborder="0"></iframe>`);
                        setIsCodeCopied(true);
                        setTimeout(() => setIsCodeCopied(false), 2500);
                      }
                    },
                    {
                      label: 'Download Table Standee QR Code',
                      icon: QrCode,
                      action: () => setActiveTab('qr_invites')
                    },
                    {
                      label: 'Claim or Verify Another Venue',
                      icon: Sparkles,
                      action: () => setIsClaimModalOpen(true)
                    },
                    {
                      label: 'Upgrade / Manage Subscription Plan',
                      icon: Shield,
                      action: () => setShowPricingModal(true)
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
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-zinc-800 text-xs font-medium text-zinc-200 hover:text-white transition-colors cursor-pointer"
                      >
                        <a.icon className="w-3.5 h-3.5 text-zinc-200 shrink-0" />
                        <span className="truncate">{a.label}</span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
            
            {/* Footer hint */}
            <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-950/50 flex items-center justify-between text-[10px] text-zinc-200 font-medium">
              <span>Press <kbd className="px-1 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-white text-zinc-200 font-bold">ESC</kbd> to exit</span>
              <span>Yoouz Business Portal</span>
            </div>
          </div>
        </div>
      )}

      {/* Standee PDF Print Sheet Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-900 rounded-3xl border border-zinc-800 text-white max-w-lg w-full p-6 shadow-2xl border border-zinc-800 relative space-y-5 print:p-0 print:border-none print:shadow-none">
            <button
              type="button"
              onClick={() => setShowPrintModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-800 text-zinc-200 hover:text-zinc-200 transition-colors cursor-pointer print:hidden"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 print:hidden">
              <Printer className="w-5 h-5 text-white" />
              <h3 className="font-extrabold text-white text-base">A6 Table Standee Print Layout</h3>
            </div>

            {/* Printable Area */}
            <div className="bg-zinc-950 border-2 border-zinc-800 rounded-2xl p-8 text-center space-y-4 shadow-inner relative overflow-hidden text-white">
              {/* Fold Line Guide */}
              <div className="absolute top-2 left-0 right-0 border-t border-dashed border-zinc-700 text-[8px] font-mono text-zinc-200">
                FOLD LINE (TOP TENT)
              </div>

              <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center mx-auto shadow-md">
                <Star className="w-6 h-6 fill-black" />
              </div>

              <div>
                <h2 className="font-black text-white text-lg tracking-tight text-center [overflow-wrap:anywhere]">
                  {currentPlace.name}
                  <CheckCircle className="inline-block w-5 h-5 ml-1.5 align-text-bottom fill-white text-black shrink-0 relative -top-[1.5px]" />
                </h2>
                <div className="text-amber-400 font-bold text-xs flex items-center justify-center gap-1 mt-0.5">
                  <span>★ 4.9</span>
                  <span className="text-zinc-200 font-normal">({placeVideos.length} Video Reviews on Yoouz)</span>
                </div>
              </div>

              <div className="bg-zinc-900 p-4 rounded-2xl shadow-xl inline-block border border-zinc-800">
                <QRCodeCanvas
                  value={`https://yoouz.com/#/record_review?placeId=${selectedPlaceId}`}
                  size={180}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white font-black text-xs uppercase tracking-wider border border-white/20">
                  {qrCustomHeading || 'LEAVE A 60-SECOND VIDEO REVIEW'}
                </span>
                <p className="text-[10px] text-zinc-200 mt-2">
                  Scan with your phone camera app to share your video review!
                </p>
              </div>

              {qrTableLabel && (
                <div className="text-[11px] font-bold text-zinc-200 bg-zinc-900 py-1 px-3 rounded-md inline-block border border-zinc-800">
                  {qrTableLabel}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-3 bg-white hover:bg-zinc-200 text-black rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Now / Save as PDF
              </button>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
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

      </div>
    </div>
  );
};
