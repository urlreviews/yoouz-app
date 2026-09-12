import { useCriticalImagesLoaded } from "../hooks/useCriticalImagesLoaded";
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { NavSection, Place, VideoReview, UserProfile, VideoAuthor, CopoMessage, CopoNotification, NotificationPreferences, DEFAULT_NOTIFICATION_PREFERENCES } from '../types';
import { CopoNotificationSettingsModal } from './CopoNotificationSettingsModal';
import { getDisplayViews, getPlaceSlug } from '../utils/placeUtils';
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
  onUpdatePlace?: (place: Place) => void;
  onSendMessage?: (
    threadId: string,
    text: string,
    recipient: { id: string; name: string; avatar: string; email?: string },
    videoUrl?: string,
    customVideoId?: string,
    customMessageId?: string,
    customCreatedAt?: number
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
  blockedUserIds?: string[];
  onBlockUser?: (userId: string, userName?: string) => void;
  onUnblockUser?: (userId: string) => void;
  onOpenReport?: (reportData: any) => void;
  onRecordReview?: (place: Place) => void;
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
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
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
  onUpdatePlace,
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
  onOpenLegal,
  blockedUserIds = [],
  onBlockUser,
  onUnblockUser,
  onOpenReport,
  onRecordReview
}) => {
  const { language, setLanguage, languages, currentLanguageMeta, t, isRTL } = useLanguage();
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<BusinessTab>('overview');

  const [verifiedBusinessSession, setVerifiedBusinessSession] = useState<BusinessSession | null>(() => {
    try {
      const saved = localStorage.getItem('copo_business_verified_session');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed) {
        const dom = (parsed.domain || parsed.businessEmail || '').toLowerCase();
        if (dom.includes('yoouz.com') || parsed.placeName?.toLowerCase() === 'yoouz') {
          parsed.logoUrl = 'https://www.yoouz.com/icon-512.png';
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
        
        const isDynamicPlace = derived.id.startsWith('place-custom');
        
        if (isDynamicPlace) {
          if (verifiedBusinessSession.placeName && verifiedBusinessSession.placeName !== 'Verified Business') {
            derived.name = verifiedBusinessSession.placeName;
          }
          if (verifiedBusinessSession.logoUrl && !verifiedBusinessSession.logoUrl.startsWith('<svg')) {
            derived.logoUrl = verifiedBusinessSession.logoUrl;
          }
        }

        const isYoouz = (verifiedBusinessSession.domain || '').includes('yoouz.com') || 
                        (verifiedBusinessSession.businessEmail || '').includes('yoouz.com') || 
                        derived.name === 'Yoouz';
        if (isYoouz) {
          derived.name = 'Yoouz';
          derived.logoUrl = 'https://www.yoouz.com/icon-512.png';
          derived.website = 'https://www.yoouz.com';
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
  const [profileHours, setProfileHours] = useState((currentPlace as any).hours || 'Mon-Fri: 9:00 AM - 6:00 PM');
  const [profileDesc, setProfileDesc] = useState((currentPlace as any).description || `Official verified business profile on Yoouz.`);
  const [profileLogoUrl, setProfileLogoUrl] = useState(currentPlace.logoUrl || '');
  const [profileBannerUrl, setProfileBannerUrl] = useState((currentPlace as any).bannerUrl || '');
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
    setProfileBannerUrl((currentPlace as any).bannerUrl || '');
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

  // Sync profileAddress string from structured address fields on initial load
  useEffect(() => {
    const parts = [streetAddress, city, stateRegion, zipCode, selectedCountry].filter(Boolean);
    const formatted = parts.join(', ');
    if (formatted && !profileAddress) setProfileAddress(formatted);
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

  // Sync profilePhone string from dial code and local phone on initial load
  useEffect(() => {
    const formattedPhone = `${phoneDialCode} ${localPhone}`.trim();
    if (formattedPhone && !profilePhone) setProfilePhone(formattedPhone);
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

  // QR Standee Studio State
  const [qrCustomHeading, setQrCustomHeading] = useState('LEAVE A 60-SECOND VIDEO REVIEW');
  const [qrTableLabel, setQrTableLabel] = useState('');
  const [qrLinkCopied, setQrLinkCopied] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showCustomizeAccordion, setShowCustomizeAccordion] = useState(false);

  const qrDirectReviewUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://www.yoouz.com';
    const slug = getPlaceSlug(currentPlace);
    return `${origin}/place/${slug}?action=record`;
  }, [currentPlace]);

  // Embed Customizer & Curation State
  const [embedFormat, setEmbedFormat] = useState<'script' | 'iframe' | 'react'>('script');
  const [embedTheme, setEmbedTheme] = useState<'dark_glass' | 'midnight_oled' | 'clean_light' | 'minimal'>('dark_glass');
  const [embedLayout, setEmbedLayout] = useState<'grid' | 'carousel' | 'badge'>('grid');
  const [embedAccentColor, setEmbedAccentColor] = useState<string>('#10B981');
  const [pinnedVideoIds, setPinnedVideoIds] = useState<string[]>([]);
  const [hiddenVideoIds, setHiddenVideoIds] = useState<string[]>([]);
  const [pinNotice, setPinNotice] = useState<string | null>(null);
  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const [isDirectLinkCopied, setIsDirectLinkCopied] = useState(false);
  const [embedDeviceMode, setEmbedDeviceMode] = useState<'desktop' | 'mobile'>('desktop');

  // Top header dropdowns & Command Palette
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);

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

  // Effective Business User Profile for Messaging & Collaboration
  const effectiveUser: UserProfile = useMemo(() => {
    const base = verifiedBusinessSession ? {
      id: verifiedBusinessSession.placeId,
      uid: verifiedBusinessSession.placeId,
      name: verifiedBusinessSession.placeName || currentPlace?.name || 'Business Manager',
      email: verifiedBusinessSession.businessEmail || (currentPlace as any)?.claimedByEmail || 'business@yoouz.com',
      avatar: currentPlace?.logoUrl || currentPlace?.avatarUrl || verifiedBusinessSession.logoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
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
    (currentPlace as any).bannerUrl = profileBannerUrl;

    if (onUpdatePlace) {
      onUpdatePlace({ ...currentPlace });
    }

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

  const downloadQRCode = () => {
    const canvas = (document.getElementById("yoouz-qr-code-mobile") as HTMLCanvasElement) || 
                   (document.getElementById("yoouz-qr-code") as HTMLCanvasElement);
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${(currentPlace.name || 'venue').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-yoouz-qr.png`;
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
    const embedSlug = getPlaceSlug(currentPlace);
    const iframeSnippet = `<iframe src="https://www.yoouz.com/embed/${embedSlug}" width="100%" height="640" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" style="border-radius:20px; border:none; width:100%; max-width:400px;"></iframe>`;
    navigator.clipboard.writeText(iframeSnippet);
    setIsCodeCopied(true);
    setTimeout(() => setIsCodeCopied(false), 2500);
  };

  // Compute displayable videos for Widget Preview and Website Embed
  const displayableWidgetVideos = useMemo(() => {
    return placeVideos
      .filter(v => {
        if (hiddenVideoIds.includes(v.id)) return false;
        return true;
      })
      .sort((a, b) => {
        const aPinned = pinnedVideoIds.includes(a.id);
        const bPinned = pinnedVideoIds.includes(b.id);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return 0;
      });
  }, [placeVideos, hiddenVideoIds, pinnedVideoIds]);

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
      badge: unseenFollowersCount > 0 ? unseenFollowersCount : undefined
    },
    { 
      id: 'notifications' as BusinessTab, 
      label: t('nav.notifications', 'Notifications'), 
      icon: Bell,
      badge: unreadBusinessNotifsCount > 0 ? unreadBusinessNotifsCount : undefined
    },
    { id: 'embed' as BusinessTab, label: t('business.embed', 'Embed'), icon: Code },
    { id: 'qr_invites' as BusinessTab, label: t('business.qrCode', 'QR Code'), icon: QrCode },
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
              <div className="relative flex items-center justify-center w-[42px] h-[42px] rounded-[14px] bg-zinc-900 shadow-[0_4px_16px_rgba(0,0,0,0.5)] group-hover:shadow-[0_6px_20px_rgba(0,0,0,0.6)] group-hover:-translate-y-0.5 transition-all duration-300 shrink-0 border border-zinc-800">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
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

        {/* Sidebar Footer Spacer */}
        <div className="pt-2 border-t border-zinc-800/80 flex flex-col shrink-0 bg-zinc-950" />
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
                  {/* Dedicated Logo Container with High-Contrast Background for Dark Mode */}
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white text-zinc-950 border border-zinc-700 flex items-center justify-center font-black text-xs shrink-0 overflow-hidden shadow-2xs">
                    {currentPlace.logoUrl ? (
                      <img 
                        src={currentPlace.logoUrl} 
                        alt={currentPlace.name} 
                        loading="eager" 
                        decoding="sync" 
                        fetchPriority="high" 
                        className="w-full h-full object-cover rounded-md"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          if (currentPlace.name?.toLowerCase().includes('yoouz') || (currentPlace.id && currentPlace.id.includes('yoouz'))) {
                            target.src = 'https://www.yoouz.com/icon-512.png';
                          } else {
                            target.style.display = 'none';
                            if (target.parentElement && !target.parentElement.querySelector('.fallback-initial')) {
                              const span = document.createElement('span');
                              span.className = 'fallback-initial font-black text-[11px] text-zinc-950';
                              span.textContent = currentPlace.name?.charAt(0).toUpperCase() || 'B';
                              target.parentElement.appendChild(span);
                            }
                          }
                        }} 
                      />
                    ) : (
                      <span className="font-black text-[11px] text-zinc-950">
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
                        <div className="w-8 h-8 rounded-xl bg-white text-zinc-950 border border-zinc-700 flex items-center justify-center font-black text-xs shrink-0 overflow-hidden shadow-2xs">
                          {currentPlace.logoUrl ? (
                            <img 
                              src={currentPlace.logoUrl} 
                              alt={currentPlace.name} 
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                if (currentPlace.name?.toLowerCase().includes('yoouz') || (currentPlace.id && currentPlace.id.includes('yoouz'))) {
                                  target.src = 'https://www.yoouz.com/icon-512.png';
                                } else {
                                  target.style.display = 'none';
                                  if (target.parentElement && !target.parentElement.querySelector('.fallback-initial')) {
                                    const span = document.createElement('span');
                                    span.className = 'fallback-initial font-black text-xs text-zinc-950';
                                    span.textContent = currentPlace.name?.charAt(0).toUpperCase() || 'B';
                                    target.parentElement.appendChild(span);
                                  }
                                }
                              }}
                            />
                          ) : (
                            <span className="font-black text-xs text-zinc-950">
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
                        const targetId = selectedPlaceId || currentPlace?.id || 'yoouz.com';
                        if (onOpenPlaceDrawer) {
                          onOpenPlaceDrawer(targetId);
                        } else {
                          window.location.href = `/place/${targetId}`;
                        }
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
                    { key: 'rating' as const, label: t('business.kpiRating', 'Overall Rating'), value: avgRating.toString(), change: t('common.realTime', 'Real-time'), icon: Star, color: 'text-amber-400 fill-amber-400', bg: 'bg-zinc-800' },
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
                                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400 inline-block drop-shadow-xs" />
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
                          <span className="text-[10px] sm:text-[11px] font-bold text-zinc-300 bg-zinc-800/80 px-2.5 py-1 rounded-full border border-zinc-700 flex items-center gap-1">
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
                                      <div className="flex items-center gap-0.5 text-amber-400">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                          <Star
                                            key={i}
                                            className={`w-3.5 h-3.5 ${
                                              i < (video.rating || 5)
                                                ? 'fill-amber-400 text-amber-400'
                                                : 'fill-zinc-800 text-zinc-700'
                                            }`}
                                          />
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
                  blockedUserIds={blockedUserIds}
                  onBlockUser={onBlockUser}
                  onUnblockUser={onUnblockUser}
                  onOpenReport={onOpenReport}
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
                        <span>Followers</span>
                      </h1>
                      <p className="text-xs text-zinc-400 font-medium truncate mt-0.5">
                        {businessFollowers.length} {businessFollowers.length === 1 ? 'follower' : 'followers'}
                        {unseenFollowersCount > 0 && (
                          <span className="text-emerald-400 ml-1 font-semibold">({unseenFollowersCount} new)</span>
                        )}
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
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-zinc-950 text-amber-400 shadow-xs" title="Verified Customer Reviewer">
                                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1 text-left">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <h3 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-zinc-200 transition-colors">
                                  {follower.name}
                                </h3>
                                {follower.isReviewer && (
                                  <span className="px-2 py-0.5 rounded-full bg-zinc-800/90 text-zinc-300 border border-zinc-700/80 text-[10px] font-medium shrink-0 flex items-center gap-1">
                                    <span>Reviewer</span>
                                    {follower.rating && (
                                      <>
                                        <span className="text-zinc-400">•</span>
                                        <span className="flex items-center gap-0.5 text-zinc-200 font-semibold">
                                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                          {follower.rating.toFixed(1)}
                                        </span>
                                      </>
                                    )}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium truncate mt-0.5">
                                <span className="shrink-0">
                                  {follower.lastReviewSnippet
                                    ? `"${follower.lastReviewSnippet}"`
                                    : `@${follower.handle} · Customer`}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
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

            {/* TAB 3: WEBSITE EMBED */}
            {activeTab === 'embed' && (
              <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-200">
                <div className="bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-800 text-white p-4 sm:p-7 shadow-xl space-y-5 sm:space-y-6">
                  {/* Clean Simple Title Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-zinc-800 pb-4 sm:pb-5">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                        Website Embed
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1">
                        Embed authentic video reviews directly on your website or reservation page.
                      </p>
                    </div>
                    {pinnedVideoIds.length > 0 && (
                      <span className="self-start sm:self-auto px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] sm:text-xs font-medium flex items-center gap-1.5">
                        <Pin className="w-3.5 h-3.5 text-white fill-current" /> {pinnedVideoIds.length}/3 Pinned
                      </span>
                    )}
                  </div>

                  {/* 1. Direct Link Section */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Direct Link
                    </span>
                    <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl sm:rounded-2xl p-2 sm:p-2.5">
                      <input
                        type="text"
                        readOnly
                        value={`https://www.yoouz.com/embed/${getPlaceSlug(currentPlace)}`}
                        className="bg-transparent text-xs text-zinc-200 flex-1 outline-none select-all truncate px-2 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`https://www.yoouz.com/embed/${getPlaceSlug(currentPlace)}`);
                          setIsDirectLinkCopied(true);
                          setTimeout(() => setIsDirectLinkCopied(false), 2500);
                        }}
                        className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-zinc-800 hover:bg-zinc-750 text-xs font-semibold text-white flex items-center gap-1.5 shrink-0 transition cursor-pointer border border-zinc-700/60 active:scale-95"
                      >
                        {isDirectLinkCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 2. HTML iFrame Code Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                        HTML iFrame Code
                      </span>
                      {isCodeCopied && (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Copied!
                        </span>
                      )}
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 font-mono text-xs">
                      <pre className="text-[10.5px] sm:text-[11px] text-zinc-300 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                        {`<iframe src="https://www.yoouz.com/embed/${getPlaceSlug(currentPlace)}" width="100%" height="640" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" style="border-radius:20px; border:none; width:100%; max-width:400px;"></iframe>`}
                      </pre>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <a
                        href={`/embed/${getPlaceSlug(currentPlace)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors"
                      >
                        <span>Test player</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        type="button"
                        onClick={copyEmbedCode}
                        className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-white text-zinc-950 hover:bg-zinc-100 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
                      >
                        {isCodeCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCodeCopied ? 'Copied Code' : 'Copy Code'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 3. Official Dark Mode Widget Preview Card */}
                  <div className="pt-4 border-t border-zinc-800 space-y-3">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Preview
                    </span>

                    <div className="w-full max-w-[360px] mx-auto bg-black border border-zinc-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-2xl space-y-3">
                      {/* Business Header Bar */}
                      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {(profileLogoUrl || (currentPlace as any)?.logoUrl || (currentPlace as any)?.imageUrl || verifiedBusinessSession?.logoUrl || (currentPlace as any)?.photo) ? (
                            <img
                              src={profileLogoUrl || (currentPlace as any)?.logoUrl || (currentPlace as any)?.imageUrl || verifiedBusinessSession?.logoUrl || (currentPlace as any)?.photo}
                              alt={currentPlace.name}
                              className="w-10 h-10 rounded-xl object-cover border border-zinc-700/80 shadow-md shrink-0"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 text-white flex items-center justify-center font-bold text-base shadow-md shrink-0">
                              {currentPlace.name ? currentPlace.name.charAt(0).toUpperCase() : 'Y'}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-white tracking-tight truncate">
                                {currentPlace.name}
                              </span>
                              <CheckCircle className="w-4 h-4 fill-white text-black shrink-0" />
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              <span className="text-xs font-bold text-white">4.9</span>
                              <span className="text-xs text-zinc-500">•</span>
                              <span className="text-xs text-zinc-400 font-medium truncate">
                                {placeVideos.length} Reviews
                              </span>
                            </div>
                          </div>
                        </div>

                        <a
                          href={`/#/record_review?placeId=${selectedPlaceId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-white text-zinc-950 text-xs font-bold transition hover:bg-zinc-100 shrink-0 flex items-center gap-1 cursor-pointer"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </a>
                      </div>

                      {/* Video Grid */}
                      {displayableWidgetVideos.length === 0 ? (
                        <div className="py-12 text-center text-zinc-500 space-y-2">
                          <AlertCircle className="w-8 h-8 mx-auto text-zinc-600" />
                          <p className="text-xs font-medium text-zinc-400">No video reviews found.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2.5">
                          {displayableWidgetVideos.slice(0, 4).map((v) => (
                            <div
                              key={v.id}
                              onClick={() => setActiveVideoModal(v)}
                              className="relative rounded-2xl overflow-hidden aspect-9/14 bg-zinc-900 group border border-zinc-800 cursor-pointer hover:scale-[1.02] transition-transform shadow-md"
                            >
                              <img
                                src={v.thumbnailUrl}
                                alt={v.dishOrItem || 'Review'}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-0.5 z-10">
                                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                <span>{v.rating || 5}</span>
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2 text-white">
                                <span className="text-[10px] font-bold leading-tight line-clamp-1">
                                  {v.dishOrItem && v.dishOrItem !== selectedPlaceId ? v.dishOrItem : (v.author?.name || 'Customer')}
                                </span>
                              </div>
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 pt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                        <span>Live Sync Powered by Yoouz</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: QR CODE STUDIO */}
            {activeTab === 'qr_invites' && (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200 max-w-lg mx-auto pb-16 px-1 sm:px-0">
                
                {/* Header Banner - Native Mobile App Card Styling */}
                <div className="bg-zinc-900/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white border border-zinc-800 shadow-sm backdrop-blur-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 text-[9.5px] sm:text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Live In-Venue QR
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                        Venue QR Code
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        Display on counter tops, dining tables, or windows. Scanning immediately launches the 60-second video review screen.
                      </p>
                    </div>

                    {/* Quick Direct Link Copy Pill */}
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(qrDirectReviewUrl);
                        setQrLinkCopied(true);
                        setTimeout(() => setQrLinkCopied(false), 2500);
                      }}
                      className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl sm:rounded-2xl bg-zinc-850 hover:bg-zinc-800 active:bg-zinc-750 text-white border border-zinc-700 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-98 shadow-xs"
                    >
                      {qrLinkCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-300" />}
                      <span>{qrLinkCopied ? 'Link Copied!' : 'Copy Direct Link'}</span>
                    </button>
                  </div>
                </div>

                {/* Centerpiece: Physical Mobile App Standee Card */}
                <div className="flex flex-col items-center w-full">
                  <div className="w-full bg-zinc-950 border border-zinc-800/90 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden text-center text-white ring-1 ring-white/5">
                    {/* Top Acrylic Lip & Bevel */}
                    <div className="w-16 sm:w-20 h-1 sm:h-1.5 bg-zinc-700/80 rounded-full mx-auto mb-4 sm:mb-5 shadow-inner" />

                    {qrTableLabel && (
                      <div className="absolute top-4 right-4 sm:top-5 sm:right-5 px-2.5 py-0.5 rounded-full bg-zinc-800/90 text-zinc-300 text-[8.5px] sm:text-[9px] font-extrabold uppercase border border-zinc-700 tracking-wider">
                        {qrTableLabel}
                      </div>
                    )}

                    {/* Venue Logo Avatar */}
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white text-zinc-950 p-1 flex items-center justify-center mx-auto mb-2.5 sm:mb-3 shadow-lg border border-zinc-200/20 overflow-hidden">
                      {currentPlace.logoUrl ? (
                        <img 
                          src={currentPlace.logoUrl} 
                          alt={currentPlace.name} 
                          className="w-full h-full object-cover rounded-xl"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.style.display = 'none';
                            if (target.parentElement && !target.parentElement.querySelector('.fallback-initial')) {
                              const span = document.createElement('span');
                              span.className = 'fallback-initial font-black text-base text-zinc-950';
                              span.textContent = currentPlace.name?.charAt(0).toUpperCase() || '★';
                              target.parentElement.appendChild(span);
                            }
                          }}
                        />
                      ) : (
                        <span className="font-black text-base text-zinc-950">
                          {currentPlace.name?.charAt(0).toUpperCase() || '★'}
                        </span>
                      )}
                    </div>

                    {/* Venue Title & Verified Badge */}
                    <div className="flex items-center justify-center gap-1.5 mb-1 px-2">
                      <h3 className="font-black text-white text-base sm:text-lg tracking-tight truncate max-w-[240px] sm:max-w-[280px]">
                        {currentPlace.name}
                      </h3>
                      <CheckCircle className="w-4 h-4 fill-white text-black shrink-0" />
                    </div>

                    {/* Star Rating & Reviews Count */}
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold mb-3">
                      <span className="text-amber-400">★ {(currentPlace.rating || 5.0).toFixed(1)}</span>
                      <div className="flex text-amber-400 text-xs">
                        {'★★★★★'.split('').map((s, idx) => (
                          <span key={idx}>{s}</span>
                        ))}
                      </div>
                      <span className="text-zinc-400 text-[11px] font-normal">
                        ({placeVideos.length} {placeVideos.length === 1 ? 'Video Review' : 'Video Reviews'})
                      </span>
                    </div>

                    {/* Callout Prompt */}
                    <div className="mb-3 sm:mb-4 px-2">
                      <span className="inline-block px-3 py-1 rounded-full bg-zinc-900 text-zinc-200 font-extrabold text-[10px] sm:text-[10.5px] uppercase tracking-wider border border-zinc-800 shadow-inner max-w-full truncate">
                        {qrCustomHeading || 'LEAVE A 60-SECOND VIDEO REVIEW'}
                      </span>
                    </div>

                    {/* QR Code Canvas Card (Responsive Sizing for Mobile) */}
                    <div className="bg-white p-3.5 sm:p-5 rounded-2xl shadow-xl inline-block border border-zinc-300 relative group my-1 max-w-full">
                      {/* Responsive QR canvas sizing: 180px on narrow mobile, 210px on tablet/desktop */}
                      <div className="hidden sm:block">
                        <QRCodeCanvas
                          id="yoouz-qr-code"
                          value={qrDirectReviewUrl}
                          size={210}
                          level="H"
                          includeMargin={true}
                        />
                      </div>
                      <div className="sm:hidden flex items-center justify-center">
                        <QRCodeCanvas
                          id="yoouz-qr-code-mobile"
                          value={qrDirectReviewUrl}
                          size={180}
                          level="H"
                          includeMargin={true}
                        />
                      </div>

                      {/* Center Yoouz Star Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-950 border-2 border-white text-white flex items-center justify-center font-black text-xs shadow-lg">
                          ★
                        </div>
                      </div>
                    </div>

                    {/* Camera Guidance Prompt */}
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 mt-3 font-medium px-2">
                      <Camera className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span>Scan with phone camera to record live review</span>
                    </div>

                    {/* Direct URL Footnote */}
                    <div className="mt-3.5 pt-2.5 border-t border-zinc-900/80">
                      <p className="text-[10px] font-mono text-zinc-500 truncate max-w-[260px] sm:max-w-xs mx-auto">
                        {qrDirectReviewUrl.replace(/^https?:\/\//, '')}
                      </p>
                    </div>
                  </div>

                  {/* Tactile Native Mobile App Buttons */}
                  <div className="w-full mt-4 sm:mt-6 space-y-2.5 sm:space-y-3">
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                      <button
                        type="button"
                        onClick={downloadQRCode}
                        className="py-3 px-3 sm:px-4 bg-white hover:bg-zinc-200 active:bg-zinc-300 text-zinc-950 rounded-2xl text-xs font-extrabold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Download className="w-4 h-4 text-zinc-950 shrink-0" />
                        <span className="truncate">Download PNG</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowPrintModal(true)}
                        className="py-3 px-3 sm:px-4 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-750 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-zinc-750 active:scale-95 shadow-md"
                      >
                        <Printer className="w-4 h-4 text-zinc-300 shrink-0" />
                        <span className="truncate">Print Standee</span>
                      </button>
                    </div>

                    {/* Test Scan / Open Recorder Button (Mobile touch-friendly) */}
                    <button
                      type="button"
                      onClick={() => {
                        if (onRecordReview) {
                          onRecordReview(currentPlace);
                        } else {
                          window.location.href = qrDirectReviewUrl;
                        }
                      }}
                      className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-850 active:bg-zinc-800 text-zinc-200 hover:text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-zinc-800 active:scale-98"
                    >
                      <Video className="w-4 h-4 text-white shrink-0" />
                      <span>Test Scan & Record Flow</span>
                    </button>

                    {/* Minimal Inline Customization Toggle */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setShowCustomizeAccordion(!showCustomizeAccordion)}
                        className="w-full flex items-center justify-between text-xs font-semibold text-zinc-400 hover:text-zinc-200 py-2.5 px-3.5 rounded-xl bg-zinc-900/60 active:bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Customize Standee Text</span>
                        </span>
                        {showCustomizeAccordion ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {showCustomizeAccordion && (
                        <div className="mt-2 p-3.5 sm:p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3 text-left animate-in fade-in slide-in-from-top-1">
                          <div>
                            <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                              Callout Heading
                            </label>
                            <input
                              type="text"
                              value={qrCustomHeading}
                              onChange={(e) => setQrCustomHeading(e.target.value)}
                              placeholder="e.g. LEAVE A 60-SECOND VIDEO REVIEW"
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-hidden focus:ring-1 focus:ring-zinc-600"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                              Table / Zone Label (Optional)
                            </label>
                            <input
                              type="text"
                              value={qrTableLabel}
                              onChange={(e) => setQrTableLabel(e.target.value)}
                              placeholder="e.g. Counter, Table #4"
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-hidden focus:ring-1 focus:ring-zinc-600"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}
            {/* TAB 6: BUSINESS PROFILE & INFO */}
            
            {activeTab === 'profile' && (
              <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200 pb-16 max-w-5xl mx-auto">
                
                {/* 10/10 Native App-Style Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Business Profile</h2>
                    <p className="text-sm text-zinc-400 mt-1">The essential information guests and reviewers see on Yoouz.</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {isProfileSaved && (
                      <span className="text-[13px] font-bold text-emerald-400 flex items-center gap-1.5 animate-in zoom-in-95">
                        <CheckCircle2 className="w-4 h-4" /> Saved
                      </span>
                    )}
                    <button
                      type="button"
                      id="btn-save-profile-header"
                      onClick={handleSaveProfile}
                      className="px-6 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-full text-[13px] font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                    >
                      {isProfileSaved ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>Changes Saved</span>
                        </>
                      ) : (
                        <span>Save Profile</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* HERO: Business Identity Card */}
                <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 p-5 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-xl">
                  <div className="absolute top-0 right-1/4 w-64 h-28 bg-white/[0.03] blur-3xl pointer-events-none rounded-full" />
                  
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 relative z-10">
                    {/* Venue Avatar */}
                    <div className="relative group shrink-0">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-3xl font-black text-white overflow-hidden shadow-xl ring-1 ring-white/10">
                        {profileLogoUrl ? (
                          <img 
                            src={profileLogoUrl} 
                            alt={profileName || "Venue Logo"}
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.src = 'https://www.yoouz.com/icon-512.png';
                            }}
                          />
                        ) : (
                          (profileName.charAt(0).toUpperCase() || 'B')
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center text-zinc-300 shadow-md">
                        <Camera className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Quick Info & Logo URL Editor */}
                    <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                          {profileName || 'Your Venue Name'}
                        </h3>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                          <BadgeCheck className="w-3.5 h-3.5" /> Verified
                        </span>
                      </div>

                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[11px] font-semibold border border-zinc-700/60">
                          {businessCategory || 'Dining & Artisanal Food'}
                        </span>
                        {profileAddress && (
                          <span className="text-[12px] text-zinc-400 truncate max-w-xs hidden sm:inline-block">
                            • {profileAddress}
                          </span>
                        )}
                      </div>

                      {/* Clean Logo URL Field */}
                      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="url"
                            id="input-profile-logo-url"
                            value={profileLogoUrl}
                            onChange={(e) => setProfileLogoUrl(e.target.value)}
                            placeholder="Paste venue logo image URL (e.g. https://...)"
                            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-2 text-[12px] font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
                          />
                        </div>
                        <button
                          type="button"
                          id="btn-profile-use-yoouz-icon"
                          onClick={() => setProfileLogoUrl('https://www.yoouz.com/icon-512.png')}
                          className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold border border-zinc-700 transition-all shrink-0 active:scale-95 cursor-pointer whitespace-nowrap"
                        >
                          Use Yoouz Icon
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2-Column Responsive Layout: Essential Form (7 cols) + Live Guest Card (5 cols) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                  
                  {/* Left Column: Essential Form Fields */}
                  <div className="lg:col-span-7 space-y-6">
                    
                    {/* The Primary Settings Group */}
                    <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800/80 shadow-xl">
                      
                      {/* Venue Name */}
                      <div className="p-4 sm:p-5 hover:bg-zinc-850/40 transition-colors group focus-within:bg-zinc-850/40">
                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-zinc-400" /> Venue Name
                        </label>
                        <input
                          type="text"
                          id="input-profile-name"
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          placeholder="e.g. The Rustic Spoon"
                          className="w-full bg-transparent text-[14px] font-bold text-white placeholder-zinc-600 focus:outline-none"
                        />
                      </div>

                      {/* Category */}
                      <div className="p-4 sm:p-5 hover:bg-zinc-850/40 transition-colors relative group focus-within:bg-zinc-850/40">
                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-zinc-400" /> Category
                        </label>
                        <div className="relative">
                          <select
                            id="select-profile-category"
                            value={businessCategory}
                            onChange={(e) => setBusinessCategory(e.target.value)}
                            className="w-full bg-transparent text-[14px] font-semibold text-white appearance-none cursor-pointer focus:outline-none pr-8"
                          >
                            <option value="Dining & Artisanal Food" className="bg-zinc-900 text-white">Dining & Artisanal Food</option>
                            <option value="Coffee, Cafes & Bakeries" className="bg-zinc-900 text-white">Coffee, Cafes & Bakeries</option>
                            <option value="Nightlife, Bars & Lounges" className="bg-zinc-900 text-white">Nightlife, Bars & Lounges</option>
                            <option value="Hospitality & Hotels" className="bg-zinc-900 text-white">Hospitality & Hotels</option>
                            <option value="Retail & Local Boutiques" className="bg-zinc-900 text-white">Retail & Local Boutiques</option>
                            <option value="Health, Beauty & Wellness" className="bg-zinc-900 text-white">Health, Beauty & Wellness</option>
                            <option value="Entertainment & Venues" className="bg-zinc-900 text-white">Entertainment & Venues</option>
                            <option value="Services & Home Trades" className="bg-zinc-900 text-white">Services & Home Trades</option>
                            <option value="Other Venue" className="bg-zinc-900 text-white">Other Venue</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      {/* Address */}
                      <div className="p-4 sm:p-5 hover:bg-zinc-850/40 transition-colors group focus-within:bg-zinc-850/40">
                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400" /> Physical Location
                        </label>
                        <input
                          type="text"
                          id="input-profile-address"
                          value={profileAddress}
                          onChange={(e) => {
                            setProfileAddress(e.target.value);
                            setStreetAddress(e.target.value);
                          }}
                          placeholder="e.g. 123 Main St, New York, NY 10001"
                          className="w-full bg-transparent text-[14px] font-semibold text-white placeholder-zinc-600 focus:outline-none"
                        />
                        <p className="text-[11px] text-zinc-500 mt-1">Where guests visit to record video reviews.</p>
                      </div>

                      {/* Phone Number */}
                      <div className="p-4 sm:p-5 hover:bg-zinc-850/40 transition-colors group focus-within:bg-zinc-850/40">
                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-zinc-400" /> Phone Number
                        </label>
                        <input
                          type="tel"
                          id="input-profile-phone"
                          value={profilePhone}
                          onChange={(e) => {
                            setProfilePhone(e.target.value);
                            setLocalPhone(e.target.value);
                          }}
                          placeholder="e.g. +1 (212) 555-0198"
                          className="w-full bg-transparent text-[14px] font-semibold text-white placeholder-zinc-600 focus:outline-none"
                        />
                      </div>

                      {/* Website */}
                      <div className="p-4 sm:p-5 hover:bg-zinc-850/40 transition-colors group focus-within:bg-zinc-850/40">
                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-zinc-400" /> Website URL
                        </label>
                        <input
                          type="url"
                          id="input-profile-website"
                          value={profileWebsite}
                          onChange={(e) => setProfileWebsite(e.target.value)}
                          placeholder="https://yourwebsite.com"
                          className="w-full bg-transparent text-[14px] font-semibold text-white placeholder-zinc-600 focus:outline-none"
                        />
                      </div>

                      {/* Short Bio / Story */}
                      <div className="p-4 sm:p-5 hover:bg-zinc-850/40 transition-colors focus-within:bg-zinc-850/40">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-zinc-400" /> About Venue
                          </label>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {profileDesc.length} / 300
                          </span>
                        </div>
                        <textarea
                          id="textarea-profile-desc"
                          value={profileDesc}
                          onChange={(e) => setProfileDesc(e.target.value)}
                          maxLength={300}
                          rows={3}
                          placeholder="Tell visitors what makes your venue authentic and special..."
                          className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3.5 text-[13px] text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 resize-none leading-relaxed font-medium transition-colors"
                        />
                      </div>

                    </div>

                    {/* Bottom Save Action */}
                    <button
                      type="button"
                      id="btn-save-profile-bottom"
                      onClick={handleSaveProfile}
                      className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-zinc-200 text-black font-bold text-[13px] transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isProfileSaved ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>Profile Updated Successfully</span>
                        </>
                      ) : (
                        <span>Save Profile Changes</span>
                      )}
                    </button>
                  </div>

                  {/* Right Column: Live In-App Guest Card (Sticky) */}
                  <div className="lg:col-span-5 relative">
                    <div className="sticky top-24 space-y-4">
                      
                      <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden relative backdrop-blur-xl">
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-zinc-300" />
                            <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-300">Live Guest View</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live on Yoouz
                          </span>
                        </div>

                        {/* Guest Card Mockup */}
                        <div className="p-5 sm:p-6 bg-zinc-950 space-y-4">
                          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 sm:p-5 shadow-lg relative overflow-hidden ring-1 ring-white/[0.04] space-y-4">
                            
                            {/* Card Top */}
                            <div className="flex items-center gap-3.5">
                              <div className="w-13 h-13 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-xl font-black text-white shrink-0 overflow-hidden shadow-inner">
                                {profileLogoUrl ? (
                                  <img 
                                    src={profileLogoUrl} 
                                    alt="Venue Logo"
                                    className="w-full h-full object-cover" 
                                    onError={(e) => {
                                      const target = e.currentTarget as HTMLImageElement;
                                      target.src = 'https://www.yoouz.com/icon-512.png';
                                    }}
                                  />
                                ) : (
                                  (profileName.charAt(0).toUpperCase() || 'B')
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <h4 className="font-bold text-white text-base truncate tracking-tight">
                                    {profileName || 'Your Venue Name'}
                                  </h4>
                                  <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                                </div>
                                <div className="text-[11px] text-zinc-400 font-semibold mt-0.5 uppercase tracking-wider truncate">
                                  {businessCategory || 'Dining & Artisanal Food'}
                                </div>
                              </div>
                            </div>

                            {/* Location */}
                            <div className="bg-zinc-950/90 p-3 rounded-xl border border-zinc-800/80 flex items-start gap-2.5">
                              <MapPin className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                              <div className="text-[12px] font-medium text-zinc-300 leading-snug break-words">
                                {profileAddress || 'Address will appear here for guests'}
                              </div>
                            </div>

                            {/* Contact Badges */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-zinc-950/90 p-2.5 rounded-xl border border-zinc-800/80 text-center truncate">
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Phone</div>
                                <div className="text-[11.5px] font-semibold text-white truncate">
                                  {profilePhone || 'Not set'}
                                </div>
                              </div>
                              <div className="bg-zinc-950/90 p-2.5 rounded-xl border border-zinc-800/80 text-center truncate">
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Website</div>
                                <div className="text-[11.5px] font-semibold text-white truncate">
                                  {profileWebsite ? (profileWebsite.replace(/^https?:\/\/(www\.)?/, '')) : 'Not set'}
                                </div>
                              </div>
                            </div>

                            {/* Short Story */}
                            {profileDesc && (
                              <div className="bg-zinc-950/90 p-3 rounded-xl border border-zinc-800/80">
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">About</div>
                                <p className="text-[12px] text-zinc-300 leading-relaxed font-normal line-clamp-3">
                                  {profileDesc}
                                </p>
                              </div>
                            )}

                            {/* Yoouz 60s Review Guarantee */}
                            <div className="pt-1 flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-800/80">
                              <span className="flex items-center gap-1.5 font-medium">
                                <Video className="w-3.5 h-3.5 text-zinc-300" /> 60s Video Reviews
                              </span>
                              <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Verified Host</span>
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
