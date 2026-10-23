import React, { useState, useRef, useEffect, useCallback } from "react";
import { CopoBrandLogo } from "./CopoBrandLogo";
import {
  X,
  Video,
  Camera,
  Square,
  RotateCcw,
  Check,
  Star,
  MapPin,
  AlertCircle,
  Volume2,
  VolumeX,
  ArrowRight,
  ArrowLeft,
  Play,
  Pause,
  Mic,
  UserX,
  Globe,
  Loader2,
  Search
} from "lucide-react";
import { Place, UserProfile, VideoReview } from "../types";
import { saveVideoBlobToIndexedDB, uploadVideoResumableWithProgress } from "../lib/videoStorage";
import { cleanUndefinedFields, cleanData } from "../utils/cleanData";
import { getPlaceLogoUrl, getCleanLogoUrl, KNOWN_BRAND_LOGOS, KNOWN_BRAND_BANNERS, isBadBanner } from "../utils/logoUtils";
import { formatBusinessName, resolveSafeAuthor, getSafeAvatarUrl, extractCleanDomain, getDisplayUrlAsDomain, getEffectivePlaceDescription, generateSmartPlaceDescription, KNOWN_OFFICIAL_NAMES } from "../utils/placeUtils";
import { CopoMobileSearchView } from "./CopoMobileSearchView";
import { triggerHaptic } from "../utils/haptics";
import { useLanguage } from "../i18n/LanguageContext";

interface CopoCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  places: Place[];
  videos?: VideoReview[];
  preselectedPlace?: Place | null;
  onPublishVideoReview: (review: VideoReview) => void;
  currentUser?: UserProfile | null;
  onAddPlace?: (place: Place) => void;
  onStartBackgroundUpload?: (placeName: string, progress: number) => void;
  onUpdateBackgroundUpload?: (progress: number) => void;
  onCompleteBackgroundUpload?: () => void;
}

export const CopoCreateModal: React.FC<CopoCreateModalProps> = ({
  isOpen,
  onClose,
  places,
  videos,
  preselectedPlace,
  onPublishVideoReview,
  currentUser,
  onAddPlace,
  onStartBackgroundUpload,
  onUpdateBackgroundUpload,
  onCompleteBackgroundUpload
}) => {
  const { t, isRTL } = useLanguage();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(preselectedPlace || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [isSearchingMetadata, setIsSearchingMetadata] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Recording & Studio states
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  const isRecordingAbortedRef = useRef(false);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [videoWidth, setVideoWidth] = useState<number>(0);
  const [videoHeight, setVideoHeight] = useState<number>(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownTimerRef = useRef<any>(null);

  // Audio Context for hardware unlocking
  const voiceDetectedRef = useRef<boolean>(true);
  const [isSpeakingDetected, setIsSpeakingDetected] = useState<boolean>(true);

  // Camera settings (Strict Front Camera Only)
  const [cameraActive, setCameraActive] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Video playback states
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Publishing progress
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [publishingStage, setPublishingStage] = useState("Preparing authentic review...");
  const isPublishingRef = useRef(false);
  const publishWatchdogRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playbackVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const vadIntervalRef = useRef<any>(null);
  const voiceBlocksRef = useRef<Array<{ start: number; end: number }>>([]);
  const currentVoiceBlockRef = useRef<{ start: number; end: number } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const isCancellingRef = useRef<boolean>(false);
  const recordingStartTimeRef = useRef<number>(0);
  const phraseStartRef = useRef<number>(-1);
  const liveSegmentsRef = useRef<any[]>([]);
  const currentActivePhraseRef = useRef<any>(null);
  const liveTimeRafRef = useRef<number | null>(null);
  const [liveVideoTime, setLiveVideoTime] = useState(0);
  const [liveSegments, setLiveSegments] = useState<any[]>([]);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  const activeRecordingSegments = React.useMemo(() => {
    if (!interimTranscript || !currentActivePhraseRef.current) {
      return liveSegments;
    }
    const interimSegments = currentActivePhraseRef.current.segments;
    if (Array.isArray(interimSegments) && interimSegments.length > 0) {
      return [...liveSegments, ...interimSegments];
    }
    if (currentActivePhraseRef.current.text) {
      return [...liveSegments, currentActivePhraseRef.current];
    }
    return liveSegments;
  }, [liveSegments, interimTranscript]);

  // High-precision 60 FPS RequestAnimationFrame sync for Preview Video Playback
  useEffect(() => {
    let animId: number;
    const loop = () => {
      if (playbackVideoRef.current && !playbackVideoRef.current.paused) {
        setCurrentTime(playbackVideoRef.current.currentTime);
      }
      animId = requestAnimationFrame(loop);
    };
    if (recordedVideoUrl && isPlaying) {
      animId = requestAnimationFrame(loop);
    }
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [recordedVideoUrl, isPlaying]);

  // Global cleanup on tab switch, lock, or navigation away from website
  useEffect(() => {
    const handleReleaseHardware = () => {
      if (document.hidden || document.visibilityState === "hidden") {
        stopCamera();
      }
    };

    const handleBeforeUnload = () => {
      stopCamera();
    };

    window.addEventListener("pagehide", handleReleaseHardware);
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleReleaseHardware);

    return () => {
      stopCamera();
      window.removeEventListener("pagehide", handleReleaseHardware);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleReleaseHardware);
    };
  }, []);

  // Strict browser tab closure protection during active video publishing upload
  useEffect(() => {
    if (!isPublishing) return;

    const handleUploadBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      const promptMessage = "Publishing... Keep Yoouz open until 100% complete.";
      e.returnValue = promptMessage;
      return promptMessage;
    };

    window.addEventListener("beforeunload", handleUploadBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUploadBeforeUnload);
    };
  }, [isPublishing]);

  const handleAttemptClose = () => {
    isCancellingRef.current = true;
    stopCamera();
    resetState();
    setStep(1);
    if (!preselectedPlace) {
      setSelectedPlace(null);
    }
    setRating(0);
    onClose();
  };

  useEffect(() => {
    if (preselectedPlace) {
      setSelectedPlace(preselectedPlace);
    }
  }, [preselectedPlace]);

  // Keep selectedPlace synchronized if background place enrichment populates bannerUrl or logoUrl while user is recording
  useEffect(() => {
    if (!selectedPlace) return;
    const match = places.find(
      (p) =>
        p.id === selectedPlace.id ||
        (selectedPlace.brandDomain && p.brandDomain && p.brandDomain.toLowerCase() === selectedPlace.brandDomain.toLowerCase())
    );
    if (match) {
      const nextBanner = (!isBadBanner(match.bannerUrl) ? match.bannerUrl : "") || (!isBadBanner(selectedPlace.bannerUrl) ? selectedPlace.bannerUrl : "");
      const nextLogo = (match.logoUrl && !match.logoUrl.includes("/api/favicon") ? match.logoUrl : "") || selectedPlace.logoUrl || match.logoUrl || "";
      if (
        (nextBanner && nextBanner !== selectedPlace.bannerUrl) ||
        (nextLogo && nextLogo !== selectedPlace.logoUrl) ||
        (match.name && match.name !== selectedPlace.name && match.name.length > 2)
      ) {
        setSelectedPlace((prev) =>
          prev
            ? {
                ...prev,
                name: match.name || prev.name,
                bannerUrl: nextBanner || prev.bannerUrl,
                ogImage: nextBanner || prev.ogImage,
                logoUrl: nextLogo || prev.logoUrl,
                avatarUrl: nextLogo || prev.avatarUrl,
                address: match.address && match.address !== "Verified Location" ? match.address : prev.address,
                city: match.city && match.city !== "Online" ? match.city : prev.city,
                country: match.country || prev.country,
                description: match.description || prev.description,
              }
            : prev
        );
      }
    }
  }, [places, selectedPlace]);

  // Proactively enrich selectedPlace via /api/url-metadata as soon as user selects a place to record
  useEffect(() => {
    if (!selectedPlace) return;
    const needsBanner = !selectedPlace.bannerUrl || isBadBanner(selectedPlace.bannerUrl);
    const needsLogo = !selectedPlace.logoUrl || selectedPlace.logoUrl.includes("/api/favicon");
    if (!needsBanner && !needsLogo) return;

    const rawDomain = selectedPlace.brandDomain || (selectedPlace.id?.includes(".") ? selectedPlace.id : "");
    const targetUrl = selectedPlace.website || (rawDomain ? `https://${rawDomain}` : "");
    if (!targetUrl && !selectedPlace.name) return;

    let cancelled = false;
    const queryParam = targetUrl
      ? `url=${encodeURIComponent(targetUrl)}&name=${encodeURIComponent(selectedPlace.name || "")}`
      : `name=${encodeURIComponent(selectedPlace.name || "")}`;
    fetch(`/api/url-metadata?${queryParam}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((meta) => {
        if (cancelled || !meta) return;
        const enrichedBanner = !isBadBanner(meta.image) ? meta.image : "";
        const enrichedLogo = meta.logo && !meta.logo.includes("/api/favicon") ? meta.logo : "";
        if (enrichedBanner || enrichedLogo) {
          setSelectedPlace((prev) => {
            if (!prev || prev.id !== selectedPlace.id) return prev;
            return {
              ...prev,
              name: meta.title && meta.title.length > 1 ? meta.title : prev.name,
              bannerUrl: (!isBadBanner(prev.bannerUrl) ? prev.bannerUrl : "") || enrichedBanner || prev.bannerUrl,
              ogImage: (!isBadBanner(prev.ogImage) ? prev.ogImage : "") || enrichedBanner || prev.ogImage,
              logoUrl: (prev.logoUrl && !prev.logoUrl.includes("/api/favicon") ? prev.logoUrl : "") || enrichedLogo || prev.logoUrl,
              avatarUrl: (prev.avatarUrl && !prev.avatarUrl.includes("/api/favicon") ? prev.avatarUrl : "") || enrichedLogo || prev.avatarUrl,
              address: meta.address || prev.address,
              city: meta.city || prev.city,
              country: meta.country || prev.country,
              description: meta.description || prev.description,
            };
          });
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [selectedPlace?.id]);

  useEffect(() => {
    setRating(0);
  }, [selectedPlace?.id]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      resetState();
      setStep(1);
      if (!preselectedPlace) {
        setSelectedPlace(null);
      }
      setRating(0);
    } else {
      // Whenever modal opens afresh, guarantee zero leftover recorded video memory
      resetState();
      if (preselectedPlace) {
        setSelectedPlace(preselectedPlace);
      }
      setRating(0);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  useEffect(() => {
    if (step === 2 && isOpen && !recordedVideoUrl) {
      setCameraActive(true);
      startCamera();
    } else {
      stopCamera();
    }
  }, [step, isOpen, recordedVideoUrl]);

  const resetState = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(null);
    setIsRecording(false);
    isRecordingRef.current = false;
    
    if (playbackVideoRef.current) {
      try { playbackVideoRef.current.pause(); } catch (e) {}
    }

    if (recordedVideoUrl) {
      // We no longer revoke here because the feed might be using this URL for instant playback
      // Browser will garbage collect when the blob is no longer referenced and IndexedDB is cleared
    }
    setRecordedVideoBlob(null);
    setRecordedVideoUrl(null);
    setVideoThumbnail(null);
    setLiveTranscript("");
    setLiveSegments([]);
    setInterimTranscript("");
    liveSegmentsRef.current = [];
    currentActivePhraseRef.current = null;
    if (liveTimeRafRef.current) {
      cancelAnimationFrame(liveTimeRafRef.current);
      liveTimeRafRef.current = null;
    }
    setLiveVideoTime(0);
    recordingStartTimeRef.current = 0;
    phraseStartRef.current = -1;
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }
    voiceBlocksRef.current = [];
    currentVoiceBlockRef.current = null;
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (e) {}
      audioContextRef.current = null;
    }
    setRecordingTime(0);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setErrorMessage(null);
    setIsPublishing(false);
    setUploadProgress(0);
  };

  const extractThumbnailFromVideo = (videoSource: string | Blob): Promise<{ thumbnail: string; width: number; height: number }> => {
    return new Promise((resolve) => {
      try {
        const video = document.createElement("video");
        const url = typeof videoSource === "string" ? videoSource : URL.createObjectURL(videoSource);

        const cleanup = () => {
          if (typeof videoSource !== "string") {
            try { URL.revokeObjectURL(url); } catch (e) {}
          }
        };

        video.src = url;
        video.crossOrigin = "anonymous";
        video.muted = true;
        video.playsInline = true;
        video.preload = "auto";

        const capture = () => {
          try {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              const canvas = document.createElement("canvas");
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
                cleanup();
                resolve({ 
                  thumbnail: dataUrl, 
                  width: video.videoWidth, 
                  height: video.videoHeight 
                });
                return;
              }
            }
          } catch (e) {
            console.warn("Frame capture warning:", e);
          }
          cleanup();
          resolve({ thumbnail: "", width: 0, height: 0 });
        };

        video.onloadeddata = () => {
          video.currentTime = 0.3;
        };
        video.onseeked = () => {
          capture();
        };
        video.onerror = () => {
          cleanup();
          resolve({ thumbnail: "", width: 0, height: 0 });
        };

        setTimeout(() => {
          if (video.readyState >= 2) capture();
          else {
            cleanup();
            resolve({ thumbnail: "", width: 0, height: 0 });
          }
        }, 3000);
      } catch {
        resolve({ thumbnail: "", width: 0, height: 0 });
      }
    });
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const getOptimalVideoRecorderConfig = (): { mimeType: string; blobType: string } => {
    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
      return { mimeType: "", blobType: "video/webm" };
    }

    const testVideo = document.createElement("video");

    const candidates = [
      { mime: "video/mp4;codecs=avc1.42E01E,mp4a.40.2", blob: "video/mp4" },
      { mime: "video/mp4;codecs=avc1,mp4a.40.2", blob: "video/mp4" },
      { mime: "video/mp4", blob: "video/mp4" },
      { mime: "video/webm;codecs=vp8,opus", blob: "video/webm" },
      { mime: "video/webm;codecs=vp9,opus", blob: "video/webm" },
      { mime: "video/webm;codecs=h264,opus", blob: "video/webm" },
      { mime: "video/webm", blob: "video/webm" },
    ];

    for (const c of candidates) {
      try {
        if (
          typeof MediaRecorder.isTypeSupported === "function" &&
          MediaRecorder.isTypeSupported(c.mime)
        ) {
          const canPlay = testVideo.canPlayType(c.mime);
          if (canPlay === "probably" || canPlay === "maybe") {
            return { mimeType: c.mime, blobType: c.blob };
          }
        }
      } catch {}
    }

    for (const c of candidates) {
      try {
        if (
          typeof MediaRecorder.isTypeSupported === "function" &&
          MediaRecorder.isTypeSupported(c.mime)
        ) {
          return { mimeType: c.mime, blobType: c.blob };
        }
      } catch {}
    }

    return { mimeType: "", blobType: "video/webm" };
  };

  const togglePlay = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const vid = playbackVideoRef.current;
    if (!vid) return;

    try {
      if (vid.paused || vid.ended) {
        if (vid.ended) {
          vid.currentTime = 0;
        }
        // User explicitly tapped play/video -> unmute audio safely
        if (isMuted) {
          vid.muted = false;
          setIsMuted(false);
        }
        const playPromise = vid.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
        setIsPlaying(true);
      } else {
        vid.pause();
        setIsPlaying(false);
      }
    } catch (err: any) {
      console.warn("Standard play error, attempting fallback:", err);
      try {
        vid.load();
        vid.muted = false;
        setIsMuted(false);
        const retryPromise = vid.play();
        if (retryPromise !== undefined) {
          await retryPromise;
        }
        setIsPlaying(true);
      } catch (e2: any) {
        try {
          vid.muted = true;
          setIsMuted(true);
          const mutedPromise = vid.play();
          if (mutedPromise !== undefined) {
            await mutedPromise;
          }
          setIsPlaying(true);
        } catch (e3: any) {
          console.warn("Playback failed completely:", e3);
        }
      }
    }
  };

  const handleReRecord = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (playbackVideoRef.current) {
      playbackVideoRef.current.pause();
    }
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
    }
    setRecordedVideoUrl(null);
    setRecordedVideoBlob(null);
    setLiveTranscript("");
    setLiveSegments([]);
    setInterimTranscript("");
    liveSegmentsRef.current = [];
    currentActivePhraseRef.current = null;
    if (liveTimeRafRef.current) {
      cancelAnimationFrame(liveTimeRafRef.current);
      liveTimeRafRef.current = null;
    }
    setLiveVideoTime(0);
    recordingStartTimeRef.current = 0;
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    startCamera();
  };

  // Camera Access (Strict Front Camera Only with Both Video & Audio Required)
  const startCamera = async () => {
    setCameraActive(true);
    setErrorMessage(null);
    try {
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((t) => {
          try { t.stop(); } catch (e) {}
        });
        activeStreamRef.current = null;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: "user"
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      const hasVideo = stream.getVideoTracks().some(t => t.readyState === "live" && t.enabled);
      const hasAudio = stream.getAudioTracks().some(t => t.readyState === "live" && t.enabled);

      if (!hasVideo || !hasAudio) {
        stream.getTracks().forEach(t => { try { t.stop(); } catch (e) {} });
        activeStreamRef.current = null;
        setCameraActive(false);
        setErrorMessage("Both Camera and Microphone permissions are required to record a video review. Please allow permissions in your browser settings.");
        return;
      }

      if (!videoRef.current) {
        activeStreamRef.current = stream;
        return;
      }

      activeStreamRef.current = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      
      try {
        await videoRef.current.play();
      } catch (playErr: any) {
        if (playErr.name !== "AbortError") {
          console.warn("Camera playback non-abort error:", playErr);
        }
      }
    } catch (err: any) {
      console.warn("Camera or microphone access denied:", err);
      activeStreamRef.current = null;
      setCameraActive(false);
      setErrorMessage("Both Camera and Microphone permissions are required to record a video review. Please allow permissions in your browser settings.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Feature disabled by policy - keeping stub for ref if needed but it's hidden in UI
  };

  const stopCamera = () => {
    if (audioContextRef.current) {
      try {
        if (audioContextRef.current.state !== "closed") {
          audioContextRef.current.close().catch(() => {});
        }
      } catch (e) {}
      audioContextRef.current = null;
    }
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      activeStreamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      videoRef.current.srcObject = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setCameraActive(false);
  };

  const playCountdownTone = (count: number) => {
    try {
      triggerHaptic(count === 1 ? "heavy" : "medium");
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = audioContextRef.current || new AudioContextClass();
        audioContextRef.current = audioCtx;
        if (audioCtx.state === "suspended") {
          audioCtx.resume().catch(() => {});
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(count === 1 ? 880 : 587, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.14);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.15);
      }
    } catch (e) {}
  };

  const handleCancelCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(null);
  };

  // 3-2-1 Countdown Trigger & Shutter Record Start (Desktop & Mobile)
  const handleStartRecordingInstant = async (e?: React.SyntheticEvent) => {
    if (e) {
      try {
        e.preventDefault();
        e.stopPropagation();
      } catch (err) {}
    }

    if (isRecording || isRecordingRef.current || countdown !== null) {
      return;
    }

    // Warm up / unlock AudioContext synchronously on user gesture (Safari/iOS requirement)
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContextClass();
        }
        if (audioContextRef.current.state === "suspended") {
          audioContextRef.current.resume().catch(() => {});
        }
      }
    } catch (e) {}

    // Clear any previous transient warning
    setErrorMessage(null);

    // Strict Permission Verification Guard: Ensure BOTH camera and microphone are active & authorized
    let currentStream = (videoRef.current?.srcObject as MediaStream) || activeStreamRef.current;
    if (!currentStream) {
      await startCamera();
      currentStream = (videoRef.current?.srcObject as MediaStream) || activeStreamRef.current;
    }

    const hasLiveVideo = Boolean(currentStream?.getVideoTracks().some(t => t.readyState === "live" && t.enabled));
    const hasLiveAudio = Boolean(currentStream?.getAudioTracks().some(t => t.readyState === "live" && t.enabled));

    if (!currentStream || !hasLiveVideo || !hasLiveAudio) {
      setErrorMessage("Both Camera and Microphone permissions are required to record a video review. Please allow permissions in your browser settings.");
      startCamera();
      return; // BLOCK RECORDING: DO NOT START 3-2-1 COUNTDOWN WITHOUT PERMISSIONS
    }

    // Start 3-2-1 Countdown immediately once permissions are verified
    let currentCount = 3;
    setCountdown(currentCount);
    playCountdownTone(currentCount);

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    countdownTimerRef.current = setInterval(() => {
      currentCount -= 1;
      if (currentCount > 0) {
        setCountdown(currentCount);
        playCountdownTone(currentCount);
      } else {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
        setCountdown(null);
        startActualRecording();
      }
    }, 1000);
  };

  const startActualRecording = () => {
    const stream = (videoRef.current?.srcObject as MediaStream) || activeStreamRef.current;
    const hasLiveVideo = Boolean(stream?.getVideoTracks().some(t => t.readyState === "live" && t.enabled));
    const hasLiveAudio = Boolean(stream?.getAudioTracks().some(t => t.readyState === "live" && t.enabled));

    if (!stream || !hasLiveVideo || !hasLiveAudio) {
      setErrorMessage("Both Camera and Microphone permissions are required to record a video review. Please allow permissions in your browser settings.");
      startCamera();
      return;
    }
    triggerHaptic("heavy");
    isCancellingRef.current = false;
    chunksRef.current = [];
    try {
      const config = getOptimalVideoRecorderConfig();
      const options: MediaRecorderOptions = config.mimeType ? { mimeType: config.mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
          // Video chunks are collected for the final file
          // Real-time audio is handled separately via AudioContext
        }
      };

      mediaRecorder.onerror = (e: any) => {
        console.warn("MediaRecorder error:", e);
      };

      mediaRecorder.onstop = () => {
        if (isCancellingRef.current) {
          chunksRef.current = [];
          stopCamera();
          return;
        }
        if (chunksRef.current.length === 0) {
          console.warn("No video chunks collected");
          setErrorMessage("Recording was empty. Please try recording again.");
          stopCamera();
          return;
        }
        const recorderType = mediaRecorder.mimeType?.split(";")[0].trim();
        const finalBlobType = recorderType || config.blobType || "video/mp4";
        const blob = new Blob(chunksRef.current, { type: finalBlobType });
        setRecordedVideoBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setIsPlaying(true);
        setCurrentTime(0);
        stopCamera();

        // Extract genuine frame snapshot from recorded video
        extractThumbnailFromVideo(blob).then((res) => {
          if (res.thumbnail) setVideoThumbnail(res.thumbnail);
          if (res.width && res.height) {
            setVideoWidth(res.width);
            setVideoHeight(res.height);
          }
        });

      };

      // Set hardware recording start timestamp baseline for exact 0s alignment
      recordingStartTimeRef.current = performance.now();
      phraseStartRef.current = -1;
      liveSegmentsRef.current = [];
      currentActivePhraseRef.current = null;
      setLiveTranscript("");
      setLiveSegments([]);
      setInterimTranscript("");
      setLiveVideoTime(0);

      // Start continuous 60 FPS timeline tracker for live subtitle synchronization
      if (liveTimeRafRef.current) cancelAnimationFrame(liveTimeRafRef.current);
      const updateLiveTime = () => {
        if (isRecordingRef.current) {
          const elapsed = Math.max(0, (performance.now() - recordingStartTimeRef.current) / 1000);
          setLiveVideoTime(elapsed);
          liveTimeRafRef.current = requestAnimationFrame(updateLiveTime);
        }
      };
      liveTimeRafRef.current = requestAnimationFrame(updateLiveTime);

      // Initialize zero-latency Web Audio API AnalyserNode Voice Activity Detector (VAD)
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass && stream) {
          const audioCtx = new AudioCtxClass();
          const audioSource = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.3;
          audioSource.connect(analyser);

          audioContextRef.current = audioCtx;
          audioAnalyserRef.current = analyser;
          voiceBlocksRef.current = [];
          currentVoiceBlockRef.current = null;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          if (vadIntervalRef.current) clearInterval(vadIntervalRef.current);
          vadIntervalRef.current = setInterval(() => {
            if (!isRecordingRef.current) return;
            analyser.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let k = 0; k < dataArray.length; k++) {
              sum += dataArray[k];
            }
            const avgVolume = sum / dataArray.length; // Live audio energy (0..255)
            const isSpeaking = avgVolume > 14; // Microphone speech onset threshold

            const recStart = recordingStartTimeRef.current || performance.now();
            const nowSec = Math.max(0, (performance.now() - recStart) / 1000);

            // Allow initial 0.25s for mic hardware connection to settle before recording speech onset
            if (nowSec < 0.25) return;

            if (isSpeaking) {
              if (!currentVoiceBlockRef.current) {
                const newBlock = { start: Math.max(0.25, nowSec - 0.15), end: nowSec + 0.3 };
                currentVoiceBlockRef.current = newBlock;
                voiceBlocksRef.current.push(newBlock);
              } else {
                currentVoiceBlockRef.current.end = Math.max(currentVoiceBlockRef.current.end, nowSec + 0.3);
              }
            } else {
              if (currentVoiceBlockRef.current) {
                if (nowSec - currentVoiceBlockRef.current.end > 0.35) {
                  currentVoiceBlockRef.current = null;
                }
              }
            }
          }, 40); // 25 FPS live hardware audio sampling
        }
      } catch (vadErr) {
        console.warn("[VAD] Setup notice:", vadErr);
      }

      // Request data slices periodically (every 500ms for responsiveness)
      mediaRecorder.start(500);
      setIsRecording(true);
      isRecordingRef.current = true;
      setRecordingTime(0);

      // Max 60 seconds (1 minute) strict limit
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 60) {
            handleStopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error("MediaRecorder error:", err);
      setErrorMessage("Recording could not start on this browser. Please check camera permissions.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecordingRef.current) {
      triggerHaptic("heavy");
      const recStart = recordingStartTimeRef.current || performance.now();
      const actualDuration = Math.max(1, Math.round((performance.now() - recStart) / 1000));
      setRecordingTime(actualDuration);

      try {
        if (mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.requestData();
        }
      } catch (e) {
        console.warn("requestData error:", e);
      }
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      isRecordingRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      
      // Stop continuous live timeline loop
      if (liveTimeRafRef.current) {
        cancelAnimationFrame(liveTimeRafRef.current);
        liveTimeRafRef.current = null;
      }

      // Stop VAD audio processing interval
      if (vadIntervalRef.current) {
        clearInterval(vadIntervalRef.current);
        vadIntervalRef.current = null;
      }

      currentActivePhraseRef.current = null;
      setInterimTranscript("");
      phraseStartRef.current = -1;

      setLiveSegments([]);
      liveSegmentsRef.current = [];
      setLiveTranscript("");
      
      // Stop Audio Processing
      if (audioProcessorRef.current) {
        try { audioProcessorRef.current.disconnect(); } catch (e) {}
        audioProcessorRef.current = null;
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch (e) {}
        audioContextRef.current = null;
      }

      // Close WebSocket gracefully with a 'finish' signal
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({ type: "finish" }));
          // We let it close naturally after receiving 'final' or timeout
          setTimeout(() => {
            if (wsRef.current) wsRef.current.close();
            wsRef.current = null;
          }, 2000);
        } catch (e) {
          wsRef.current.close();
          wsRef.current = null;
        }
      } else {
        wsRef.current = null;
      }
    }
  };

  const handlePublish = async () => {
    if (isPublishing || isPublishingRef.current) return;

    if (!selectedPlace) {
      setErrorMessage("Please select a place for your video review.");
      return;
    }
    if (!recordedVideoBlob && !recordedVideoUrl) {
      setErrorMessage("Please record a video review.");
      return;
    }

    setIsPublishing(true);
    isPublishingRef.current = true;
    setUploadProgress(15);
    setPublishingStage("Uploading authentic review...");
    onStartBackgroundUpload?.(selectedPlace.name, 15);

    let finalThumbnail = videoThumbnail || "";

    const reviewId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const mime = recordedVideoBlob?.type || "video/mp4";
    const ext = mime.includes("webm") ? "webm" : "mp4";
    const cleanFileName = `${reviewId}.${ext}`;
    const defaultStreamUrl = `/api/videos/stream/${cleanFileName}`;

    const placeDomain = extractCleanDomain(selectedPlace.website || selectedPlace.name || selectedPlace.id);
    const cleanPlaceName = (placeDomain && KNOWN_OFFICIAL_NAMES[placeDomain])
      || formatBusinessName(selectedPlace.name || placeDomain, placeDomain)
      || selectedPlace.name;
    const resolvedPlaceLogo =
      (placeDomain && KNOWN_BRAND_LOGOS[placeDomain])
      ? KNOWN_BRAND_LOGOS[placeDomain]
      : (selectedPlace.logoUrl && !selectedPlace.logoUrl.startsWith("data:;") && !selectedPlace.logoUrl.includes("tap/0.png"))
      ? selectedPlace.logoUrl
      : (selectedPlace.avatarUrl && !selectedPlace.avatarUrl.startsWith("data:;") && !selectedPlace.avatarUrl.includes("tap/0.png"))
      ? selectedPlace.avatarUrl
      : getPlaceLogoUrl(selectedPlace) || "";
    const resolvedPlaceBanner = selectedPlace.bannerUrl || selectedPlace.ogImage || (placeDomain && KNOWN_BRAND_BANNERS[placeDomain]) || "";
    const safeThumbnail = finalThumbnail || videoThumbnail || recordedVideoUrl || resolvedPlaceBanner || resolvedPlaceLogo || `/api/avatar?name=${encodeURIComponent(cleanPlaceName)}&background=18181b&color=fff`;

    const activeAuthUser = currentUser || (() => {
      try {
        const stored = typeof window !== "undefined" ? (localStorage.getItem("copo_user_profile") || localStorage.getItem("copo_user")) : null;
        if (stored) return JSON.parse(stored);
      } catch (e) {}
      return null;
    })();

    const resolvedAuthor = resolveSafeAuthor({
      author: {
        name: activeAuthUser?.name || (activeAuthUser?.email ? activeAuthUser.email.split("@")[0] : "Verified Reviewer"),
        avatar: activeAuthUser?.avatar || ""
      },
      userId: activeAuthUser?.email || activeAuthUser?.id,
      userEmail: activeAuthUser?.email
    }, activeAuthUser);

    let finalTranscript = "";
    let finalSegments: any[] = [];

    const fallbackReview: VideoReview = {
      id: reviewId,
      userId: activeAuthUser?.email || activeAuthUser?.id || "guest@yoouz.com",
      userEmail: activeAuthUser?.email || "guest@yoouz.com",
      createdAtMs: Date.now(),
      isLocalUpload: true,
      localBlobUrl: recordedVideoUrl || undefined,
      blobUrl: recordedVideoUrl || undefined,
      isCurrentSessionBlob: Boolean(recordedVideoUrl),
      placeId: selectedPlace.id,
      placeName: cleanPlaceName,
      placeCategory: selectedPlace.category || "General",
      placeAddress: (selectedPlace.address && selectedPlace.address !== "Verified Location") ? selectedPlace.address : (selectedPlace.city && selectedPlace.city !== "Online" ? selectedPlace.city : ""),
      placeCity: (selectedPlace.city && selectedPlace.city !== "Online") ? selectedPlace.city : "",
      placeCountry: (selectedPlace as any).country || "",
      placePhone: (selectedPlace as any).phone || "",
      placeEmail: (selectedPlace as any).email || "",
      placeRating: rating || 5,
      placeWebsite: selectedPlace.website || (placeDomain ? `https://${placeDomain}` : ""),
      placeLogoUrl: resolvedPlaceLogo,
      placeBannerUrl: resolvedPlaceBanner,
      placeDescription: getEffectivePlaceDescription(selectedPlace) || selectedPlace.description || "",
      author: {
        name: resolvedAuthor.name || "Verified Reviewer",
        handle: resolvedAuthor.handle || "@reviewer",
        avatar: resolvedAuthor.avatar || getSafeAvatarUrl(currentUser?.avatar, resolvedAuthor.name),
        isLocalGuide: true,
        videoReviewCount: 1,
        photosCount: 0,
        isVerified: true
      },
      rating: rating || 5,
      durationSeconds: recordingTime > 0 ? recordingTime : (duration > 0 ? Math.round(duration) : 15),
      videoUrl: defaultStreamUrl,
      fallbackVideoUrls: recordedVideoUrl ? [recordedVideoUrl, defaultStreamUrl] : [defaultStreamUrl],
      thumbnailUrl: safeThumbnail,
      caption: cleanPlaceName,
      title: cleanPlaceName,
      transcriptText: "",
      segments: [],
      hasBunnySmartCaptions: false,
      dishOrItem: cleanPlaceName,
      businessName: cleanPlaceName,
      likes: 0,
      isLiked: false,
      commentsCount: 0,
      comments: [],
      bookmarksCount: 0,
      isBookmarked: false,
      repostsCount: 0,
      views: 1,
      viewsCount: 1,
      sharesCount: 0,
      tags: [selectedPlace.category || "Review"],
      recordedAt: "Just now",
      isLandscape: false,
      aspectRatio: 'portrait'
    };

    // 🛡️ Anti-Stall Watchdog: Safety timer that guarantees completion while ensuring server sync
    publishWatchdogRef.current = setTimeout(async () => {
      if (isPublishingRef.current) {
        console.warn("⚠️ [Watchdog] Video publishing safety watchdog triggered. Auto-completing and saving to server feed.");
        
        // Post review to server so it is globally visible to all devices immediately
        try {
          await fetch("/api/videos/save-review", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fallbackReview),
            signal: AbortSignal.timeout(10000)
          });
        } catch (e) {
          console.warn("Watchdog server save notice:", e);
        }

        // Store review in localStorage
        try {
          const existingSaved = localStorage.getItem("yoouz_local_created_reviews");
          let list: any[] = [];
          if (existingSaved) {
            try { list = JSON.parse(existingSaved); } catch (e) {}
          }
          if (!Array.isArray(list)) list = [];
          list = [fallbackReview, ...list.filter((v: any) => v && v.id !== fallbackReview.id)].slice(0, 50);
          localStorage.setItem("yoouz_local_created_reviews", JSON.stringify(list));
        } catch (e) {}

        setUploadProgress(100);
        setPublishingStage("Published!");
        onUpdateBackgroundUpload?.(100);
        onCompleteBackgroundUpload?.();
        setIsPublishing(false);
        isPublishingRef.current = false;
        onClose();
        onPublishVideoReview(fallbackReview);
      }
    }, 120000);

    // 1. Save raw blob to IndexedDB
    if (recordedVideoBlob) {
      try {
        await saveVideoBlobToIndexedDB(reviewId, recordedVideoBlob);
      } catch (e) {
        console.warn("IndexedDB save notice:", e);
      }
    }

    // Run AI content moderation and video upload concurrently for maximum speed
    const visualPayload = finalThumbnail || videoThumbnail;
    const moderationPromise = (async () => {
      if (visualPayload && visualPayload.startsWith("data:image")) {
        try {
          const modRes = await fetch("/api/videos/moderate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageData: visualPayload,
              placeName: selectedPlace.name
            })
          });
          if (modRes.ok) {
            const modData = await modRes.json();
            if (modData.flagged || modData.isSafe === false) {
              return { isSafe: false };
            }
          }
        } catch (modErr) {
          console.warn("Safety check request notice:", modErr);
        }
      }
      return { isSafe: true };
    })();

    const uploadPromise = (async () => {
      if (!recordedVideoBlob) return null;
      return await uploadVideoResumableWithProgress(
        recordedVideoBlob,
        reviewId,
        (progress: any) => {
          const pct = typeof progress === "number" ? progress : progress.percent;
          const clamped = Math.max(15, Math.min(85, Math.round(pct)));
          setUploadProgress(clamped);
          if (clamped < 65) {
            setPublishingStage("Uploading authentic review...");
          } else if (clamped < 85) {
            setPublishingStage("Processing video & audio stream...");
          }
          onUpdateBackgroundUpload?.(clamped);
        },
        visualPayload || undefined
      );
    })();

    let uploadedPublicUrl = defaultStreamUrl;
    let finalBunnyId: string | undefined = undefined;
    let uploadedVideoData = "";

    try {
      const [modResult, uploadResult] = await Promise.all([moderationPromise, uploadPromise]);
      if (modResult && !modResult.isSafe) {
        if (publishWatchdogRef.current) clearTimeout(publishWatchdogRef.current);
        setIsPublishing(false);
        isPublishingRef.current = false;
        setUploadProgress(0);
        onCompleteBackgroundUpload?.();
        setRecordedVideoBlob(null);
        setRecordedVideoUrl(null);
        setVideoThumbnail(null);
        setErrorMessage("Content Safety Violation: Inappropriate, sexually explicit, or unsafe content was detected. Video reviews on Yoouz must comply with Community Safety Guidelines. This recording has been blocked and discarded.");
        triggerHaptic("heavy");
        return;
      }

      setUploadProgress(88);
      setPublishingStage("Optimizing video & audio...");

      if (uploadResult && uploadResult.downloadUrl) {
        uploadedPublicUrl = uploadResult.downloadUrl;
        if (uploadResult.thumbnailUrl) {
          finalThumbnail = uploadResult.thumbnailUrl;
        }
        if (uploadResult.bunnyVideoId) {
          finalBunnyId = uploadResult.bunnyVideoId;
        }
        if ((uploadResult as any).videoData) {
          uploadedVideoData = (uploadResult as any).videoData;
        }
      }

      // If a recorded video blob was provided but the upload returned no valid remote URL/Bunny ID, stop publish flow gracefully
      if (recordedVideoBlob && !finalBunnyId && (!uploadedPublicUrl || uploadedPublicUrl === defaultStreamUrl) && !uploadedVideoData) {
        if (publishWatchdogRef.current) clearTimeout(publishWatchdogRef.current);
        setIsPublishing(false);
        isPublishingRef.current = false;
        setUploadProgress(0);
        onCompleteBackgroundUpload?.();
        setErrorMessage("Upload Interrupted: The video recording could not be uploaded due to a network connection timeout or loss. Please check your internet connection and publish your review again.");
        triggerHaptic("heavy");
        return;
      }
    } catch (uploadErr) {
      console.warn("Server video upload notice:", uploadErr);
      if (publishWatchdogRef.current) clearTimeout(publishWatchdogRef.current);
      setIsPublishing(false);
      isPublishingRef.current = false;
      setUploadProgress(0);
      onCompleteBackgroundUpload?.();
      setErrorMessage("Upload Interrupted: A network error occurred while sending video data. Please check your internet connection and try again.");
      triggerHaptic("heavy");
      return;
    }

    setUploadProgress(92);
    setPublishingStage("Securing content & synchronizing...");

    const streamPullZone = "https://vz-dcd9e101-437.b-cdn.net";
    const assignedBunnyId = finalBunnyId || fallbackReview.bunnyVideoId;
    const resolvedSafeThumbnail = assignedBunnyId
      ? `${streamPullZone}/${assignedBunnyId}/thumbnail.jpg`
      : (finalThumbnail || safeThumbnail);

    const newReview: VideoReview = {
      ...fallbackReview,
      bunnyVideoId: assignedBunnyId,
      bunnyGuid: assignedBunnyId,
      hlsUrl: assignedBunnyId ? `${streamPullZone}/${assignedBunnyId}/playlist.m3u8` : undefined,
      vttUrl: `/api/videos/${reviewId}/subtitles.vtt`,
      localBlobUrl: recordedVideoUrl || fallbackReview.localBlobUrl || undefined,
      blobUrl: recordedVideoUrl || fallbackReview.blobUrl || undefined,
      isCurrentSessionBlob: Boolean(recordedVideoUrl),
      videoUrl: assignedBunnyId ? `${streamPullZone}/${assignedBunnyId}/playlist.m3u8` : (uploadedPublicUrl || defaultStreamUrl),
      videoData: uploadedVideoData || (recordedVideoBlob ? undefined : undefined),
      fallbackVideoUrls: Array.from(new Set([
        assignedBunnyId ? `${streamPullZone}/${assignedBunnyId}/playlist.m3u8` : null,
        recordedVideoUrl,
        uploadedPublicUrl,
        `/api/videos/stream/${cleanFileName}`,
        defaultStreamUrl,
        "/default-review.mp4"
      ].filter(Boolean))) as string[],
      thumbnailUrl: resolvedSafeThumbnail
    } as any;

    // 4. Save metadata to server and local backup IMMEDIATELY so it is 100% durable
    setUploadProgress(94);
    setPublishingStage("Securing review to feed...");

    try {
      await fetch("/api/videos/save-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReview),
        signal: AbortSignal.timeout(10000)
      });
    } catch (saveErr) {
      console.warn("Initial server video review save notice:", saveErr);
    }

    try {
      const existingSaved = localStorage.getItem("yoouz_local_created_reviews");
      let list: any[] = [];
      if (existingSaved) {
        try { list = JSON.parse(existingSaved); } catch (e) {}
      }
      if (!Array.isArray(list)) list = [];
      list = [newReview, ...list.filter((v: any) => v && v.id !== newReview.id)].slice(0, 50);
      localStorage.setItem("yoouz_local_created_reviews", JSON.stringify(list));
    } catch (e) {}

    // 5. Connect to Bunny Stream Smart Captions pipeline & wait for AI Captions
    setPublishingStage("Generating AI Smart Captions...");
    setUploadProgress(96);

    let bunnySegments: any[] = [];
    let bunnyTranscriptText = "";
    let bunnyAiTitle = "";

    if (assignedBunnyId) {
      // Poll server for official Bunny Stream Smart Captions (up to 3 quick checks)
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const capRes = await fetch(`/api/videos/${reviewId}/ensure-transcript`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bunnyVideoId: assignedBunnyId }),
            signal: AbortSignal.timeout(5000)
          });
          if (capRes.ok) {
            const capData = await capRes.json();
            if (capData && Array.isArray(capData.segments) && capData.segments.length > 0) {
              bunnySegments = capData.segments;
              bunnyTranscriptText = capData.transcriptText || "";
              if (capData.aiTitle) bunnyAiTitle = capData.aiTitle;
              console.log(`🎬 🐰 [Modal] Official Bunny Smart Captions ready on attempt ${attempt}!`);
              break;
            }
          }
        } catch (e) {}

        await new Promise(r => setTimeout(r, 1200));
      }
    }

    const finalReview: VideoReview = {
      ...newReview,
      bunnyVideoId: assignedBunnyId,
      bunnyGuid: assignedBunnyId,
      hlsUrl: assignedBunnyId ? `${streamPullZone}/${assignedBunnyId}/playlist.m3u8` : newReview.hlsUrl,
      vttUrl: `/api/videos/${reviewId}/subtitles.vtt`,
      localBlobUrl: recordedVideoUrl || newReview.localBlobUrl || undefined,
      blobUrl: recordedVideoUrl || newReview.blobUrl || undefined,
      transcriptText: bunnySegments.length > 0 ? bunnyTranscriptText : "",
      segments: bunnySegments.length > 0 ? bunnySegments : [],
      ...(bunnyAiTitle ? { aiTitle: bunnyAiTitle, title: bunnyAiTitle, caption: bunnyAiTitle } : {}),
      hasBunnySmartCaptions: bunnySegments.length > 0,
      isReady: true,
      isProcessing: false
    } as any;

    // 6. Final save with any synced AI captions/metadata
    setUploadProgress(100);
    setPublishingStage("Published!");

    try {
      await fetch("/api/videos/save-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalReview),
        signal: AbortSignal.timeout(12000)
      });
    } catch (saveErr) {
      console.warn("Server video review save notice:", saveErr);
      // Secondary immediate retry
      try {
        await fetch("/api/videos/save-review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finalReview),
          signal: AbortSignal.timeout(12000)
        });
      } catch (retryErr) {}
    }

    // Secondary cloud sync calls run asynchronously without blocking the UI
    fetch(`/api/nosql/videoReviews/${reviewId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: finalReview, merge: true })
    }).catch(() => {});

    if (selectedPlace?.id) {
      const placeDocId = selectedPlace.id;
      const updatedPlaceData: Record<string, any> = {
        ...selectedPlace,
        id: placeDocId,
        totalReviews: (selectedPlace.totalReviews || 0) + 1,
        rating: rating
      };
      if (!updatedPlaceData.bannerUrl || isBadBanner(updatedPlaceData.bannerUrl)) {
        delete updatedPlaceData.bannerUrl;
      }
      if (!updatedPlaceData.ogImage || isBadBanner(updatedPlaceData.ogImage)) {
        delete updatedPlaceData.ogImage;
      }
      if (!updatedPlaceData.logoUrl || updatedPlaceData.logoUrl.includes("/api/favicon")) {
        delete updatedPlaceData.logoUrl;
      }
      if (!updatedPlaceData.avatarUrl || updatedPlaceData.avatarUrl.includes("/api/favicon")) {
        delete updatedPlaceData.avatarUrl;
      }
      if (Array.isArray(updatedPlaceData.photos)) {
        updatedPlaceData.photos = updatedPlaceData.photos.filter((p: string) => p && !isBadBanner(p));
        if (updatedPlaceData.photos.length === 0) {
          delete updatedPlaceData.photos;
        }
      }
      fetch(`/api/nosql/places/${placeDocId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: updatedPlaceData, merge: true })
      }).catch(() => {});
    }

    if (publishWatchdogRef.current) {
      clearTimeout(publishWatchdogRef.current);
    }

    setUploadProgress(100);
    setPublishingStage("Published!");
    onUpdateBackgroundUpload?.(100);
    onCompleteBackgroundUpload?.();

    setIsPublishing(false);
    isPublishingRef.current = false;
    onClose();
    onPublishVideoReview(finalReview);
  };

  const filteredPlaces = React.useMemo(() => {
    if (!isOpen || !places || !Array.isArray(places)) return [];
    const query = (searchQuery || "").toLowerCase().trim();
    if (!query) return places;
    return places.filter((p) => {
      if (!p) return false;
      const name = (p.name || "").toLowerCase();
      const city = (p.city || "").toLowerCase();
      const brandDomain = (p.brandDomain || "").toLowerCase();
      const id = (p.id || "").toLowerCase();
      const category = (p.category || "").toLowerCase();
      return name.includes(query) || city.includes(query) || brandDomain.includes(query) || id.includes(query) || category.includes(query);
    });
  }, [isOpen, places, searchQuery]);

  const getRatingLabel = (r: number) => {
    switch (r) {
      case 5: return "5.0 • Exceptional";
      case 4: return "4.0 • Great";
      case 3: return "3.0 • Average";
      case 2: return "2.0 • Poor";
      case 1: return "1.0 • Terrible";
      default: return "Select star rating";
    }
  };

  const handleSearchMetadata = async (domain: string) => {
    if (!domain.trim()) return;
    setIsSearchingMetadata(true);
    setErrorMsg("");
    
    try {
      const cleanDomain = domain.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase();
      const placeId = cleanDomain;
      let foundPlace = places.find(p => p.id === placeId || p.brandDomain === cleanDomain || p.id === cleanDomain.replace(/[^a-zA-Z0-9]/g, "-"));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const resp = await fetch(`/api/url-metadata?url=${encodeURIComponent(domain)}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (resp.ok) {
        const data = await resp.json();
        if (data.title || data.domain) {
          const fetchedLogo = data.logo || (data.domain ? getCleanLogoUrl(null, data.domain) || "" : "");
          const fetchedBanner = data.image || "";

          const resolvedName = (cleanDomain && KNOWN_OFFICIAL_NAMES[cleanDomain])
            || (data.domain && KNOWN_OFFICIAL_NAMES[data.domain])
            || formatBusinessName(data.siteName || data.title, data.domain || domain)
            || formatBusinessName(data.domain || domain)
            || (data.domain || domain);

          const isFallbackLogo = (u?: string) => !u || u.includes("/api/favicon") || u.startsWith("data:;") || u.includes("tap/0.png") || u.includes("tap/default");
          const resolvedLogo = (!isFallbackLogo(fetchedLogo) ? fetchedLogo : (!isFallbackLogo(foundPlace?.logoUrl) ? foundPlace?.logoUrl : (fetchedLogo || foundPlace?.logoUrl || "")));

          if (foundPlace) {
            const hasBadExistingName = !foundPlace.name || foundPlace.name === "Pro Ximus" || foundPlace.name === "undefined" || foundPlace.name.startsWith("www.");
            foundPlace = {
              ...foundPlace,
              name: hasBadExistingName ? (resolvedName || foundPlace.name) : foundPlace.name,
              address: foundPlace.address || data.address || "",
              city: (foundPlace.city && foundPlace.city !== "Online") ? foundPlace.city : (data.city || foundPlace.city || ""),
              country: foundPlace.country || data.country || "",
              phone: foundPlace.phone || data.phone || "",
              email: foundPlace.email || data.email || "",
              category: (foundPlace.category && foundPlace.category !== "Website" && foundPlace.category !== "General") ? foundPlace.category : (data.category || foundPlace.category || "Website"),
              logoUrl: resolvedLogo,
              avatarUrl: resolvedLogo,
              bannerUrl: (foundPlace.bannerUrl && !foundPlace.bannerUrl.includes("${")) ? foundPlace.bannerUrl : (fetchedBanner || ""),
              description: getEffectivePlaceDescription({
                ...foundPlace,
                name: foundPlace.name || resolvedName,
                description: foundPlace.description || data.description,
                category: foundPlace.category || data.category,
                city: foundPlace.city || data.city,
                domain: data.domain || domain
              }),
            };
          } else {
            const newBizName = resolvedName;
            const newBizCat = data.category || "Website";
            const newBizCity = data.city || "";
            const newBizCountry = data.country || "";
            foundPlace = {
              id: placeId,
              name: newBizName,
              category: newBizCat,
              categoryType: "all",
              address: data.address || "",
              city: newBizCity,
              country: newBizCountry,
              lat: data.lat || 0,
              lng: data.lng || 0,
              rating: 5,
              totalReviews: 1,
              ratingDistribution: { stars5: 1, stars4: 0, stars3: 0, stars2: 0, stars1: 0 },
              avatarUrl: resolvedLogo,
              logoUrl: resolvedLogo,
              bannerUrl: fetchedBanner,
              photos: fetchedBanner ? [fetchedBanner] : [],
              openingHours: "Available 24/7",
              isOpen: true,
              phone: data.phone || "",
              email: data.email || "",
              website: data.url || domain,
              priceRange: "N/A",
              plusCode: "",
              description: getEffectivePlaceDescription({
                id: placeId,
                name: newBizName,
                category: newBizCat,
                city: newBizCity,
                country: newBizCountry,
                website: data.url || domain,
                domain: data.domain || domain,
                description: data.description
              }),
              popularKeywords: [],
              amenities: [],
              topDishes: [],
              brandDomain: data.domain
            };
          }
          if (onAddPlace) onAddPlace(foundPlace);
          setSelectedPlace(foundPlace);
          setSearchQuery("");
          return;
        }
      }
      
      // Fallback to basic if API fails
      if (!foundPlace) {
        foundPlace = {
          id: placeId || `custom-${Date.now()}`,
          name: domain.charAt(0).toUpperCase() + domain.slice(1),
          brandDomain: cleanDomain.includes(".") ? cleanDomain : undefined,
          category: "Website",
          categoryType: "all",
          address: cleanDomain.includes(".") ? cleanDomain : "Verified Business",
          city: "Online",
          lat: 0,
          lng: 0,
          rating: 5,
          totalReviews: 1,
          ratingDistribution: { stars5: 1, stars4: 0, stars3: 0, stars2: 0, stars1: 0 },
          avatarUrl: getCleanLogoUrl(null, cleanDomain) || "",
          logoUrl: getCleanLogoUrl(null, cleanDomain) || "",
          bannerUrl: "",
          photos: [],
          openingHours: "Available 24/7",
          isOpen: true,
          phone: "",
          website: cleanDomain.includes(".") ? `https://${cleanDomain}` : `https://${cleanDomain}.com`,
          priceRange: "$$",
          plusCode: "",
          description: `Verified online profile for ${domain}`,
          popularKeywords: [],
          amenities: [],
          topDishes: []
        };
      }
      if (onAddPlace) onAddPlace(foundPlace);
      setSelectedPlace(foundPlace);
      setSearchQuery("");
      
    } catch (err) {
      console.error("Metadata fetch error:", err);
      setErrorMsg("Could not fetch information for this URL.");
    } finally {
      setIsSearchingMetadata(false);
    }
  };

  if (!isOpen) return null;

  if (step === 1 && !selectedPlace) {
    return (
      <CopoMobileSearchView
        places={places}
        videos={videos || []}
        onSelectVideo={() => {}}
        onOpenPlace={() => {}}
        onRecordForPlace={(place) => {
          setSelectedPlace(place);
          setRating(0);
        }}
        onAddPlace={onAddPlace}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-0 md:p-6 overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-full h-full md:h-[780px] md:max-h-[90vh] max-w-[440px] bg-zinc-950 md:rounded-[36px] overflow-hidden shadow-2xl flex flex-col border border-white/10 md:ring-1 md:ring-white/10">

        {/* Hidden File Input for Native Mobile Gallery / Video Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,video/mov,video/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* STEP 1: PLACE & RATING SELECTION (Responsive Light/Dark) */}
        {step === 1 && selectedPlace && (
          <div className="flex flex-col h-full w-full bg-zinc-950 md:bg-zinc-900 relative z-[260]">
            {/* Step 1 Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-white shadow-md shadow-black/50">
                  <Video className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h2 className="text-lg font-bold text-white">Record Video Review</h2>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-bold text-[10px] uppercase tracking-wider whitespace-nowrap border border-zinc-700/60">
                        Step 1 of 2
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-medium">
                      Rate your experience & proceed to camera
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAttemptClose}
                className="w-10 h-10 rounded-full bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700/60 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 shrink-0"
                title="Close"
              >
                <X className="w-5 h-5 text-white stroke-[2.5]" />
              </button>
            </div>

            {/* Step 1 Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              {(errorMessage || errorMsg) && (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-red-900/20 border border-red-800 text-red-400 text-sm font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{errorMessage || errorMsg}</span>
                </div>
              )}

              {/* Responsive Place Selection */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-200 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-zinc-400" />
                  <span>Selected Business</span>
                </label>
                
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-lg ">
                  <CopoBrandLogo
                    domain={selectedPlace.brandDomain || extractCleanDomain(selectedPlace.website || selectedPlace.id || selectedPlace.name)}
                    name={selectedPlace.name}
                    website={selectedPlace.website}
                    logoUrl={selectedPlace.logoUrl || selectedPlace.avatarUrl}
                    bannerUrl={selectedPlace.bannerUrl || selectedPlace.ogImage}
                    className="w-14 h-14 rounded-xl border border-zinc-700 bg-white ring-1 ring-white/10 overflow-hidden flex items-center justify-center p-1.5 shrink-0"
                    imageClassName="w-full h-full object-contain rounded-lg [image-rendering:-webkit-optimize-contrast] [filter:drop-shadow(0px_0px_1px_rgba(0,0,0,0.25))]"
                    fallbackTextClassName="font-bold text-xl text-zinc-950"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-white text-base leading-snug truncate">{formatBusinessName(selectedPlace.name, selectedPlace.brandDomain || selectedPlace.website, selectedPlace.id)}</h4>
                    <p className="text-xs text-zinc-400 truncate">{selectedPlace.brandDomain || selectedPlace.website || selectedPlace.address || selectedPlace.city}</p>
                  </div>
                  <button
                    onClick={() => setSelectedPlace(null)}
                    className="shrink-0 text-xs font-bold text-zinc-200 hover:text-white px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-zinc-700 transition-all cursor-pointer shadow-sm"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Star Rating Section */}
              <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-white">Your Rating</h3>
                    <p className="text-[11px] text-zinc-400 font-medium">Tap stars to rate your experience</p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-full font-black text-[9px] uppercase tracking-[0.1em] transition-all duration-300 ${
                    rating === 0
                      ? "bg-zinc-800 text-zinc-400 border border-zinc-700"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                  }`}>
                    {rating === 0 ? "Select Star Rating" : getRatingLabel(rating)}
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3 py-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1.5 cursor-pointer transition-all hover:scale-110 active:scale-90 group"
                      title={`${star} Star${star > 1 ? "s" : ""}`}
                    >
                      <Star
                        className={`w-11 h-11 transition-all duration-300 ${
                          star <= rating 
                             ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" 
                             : "text-zinc-700 group-hover:text-zinc-500"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 1 Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-900 shrink-0">
              <button
                onClick={() => setSelectedPlace(null)}
                className="px-4 py-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 font-bold text-sm transition-colors cursor-pointer"
              >
                {t('create.back', 'Back')}
              </button>
              <button
                onClick={() => {
                  if (!selectedPlace) {
                    setErrorMessage(t('create.selectPlaceError', 'Please select a place or business first.'));
                    return;
                  }
                  if (rating === 0) {
                    setErrorMessage(t('create.selectRatingError', 'Please select a star rating before proceeding.'));
                    return;
                  }
                  setErrorMessage(null);
                  setStep(2);
                  startCamera();
                }}
                className="px-6 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-sm shadow-lg transition-all cursor-pointer flex items-center gap-2 active:scale-95 group"
              >
                <span>{t('create.proceedToCamera', 'Proceed to Camera')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: FULLSCREEN CAMERA STUDIO & PLAYBACK (Mobile & Desktop) */}
        {step === 2 && (
          <div className="relative w-full h-full bg-black flex flex-col justify-between overflow-hidden">

            {/* PLAYBACK VIEW (If video is recorded) */}
            {recordedVideoUrl ? (
              <div className="absolute inset-0 w-full h-full bg-black flex flex-col justify-between overflow-hidden z-20">
                {/* Playback HTML5 Video Tag */}
                <video
                  key={recordedVideoUrl}
                  ref={playbackVideoRef}
                  src={recordedVideoUrl}
                  playsInline
                  autoPlay
                  loop
                  preload="auto"
                  muted={isMuted}
                  className="w-full h-full object-cover cursor-pointer"
                  onTimeUpdate={() => {
                    if (playbackVideoRef.current) {
                      setCurrentTime(playbackVideoRef.current.currentTime);
                      if (!duration && playbackVideoRef.current.duration && !isNaN(playbackVideoRef.current.duration)) {
                        setDuration(playbackVideoRef.current.duration);
                      }
                    }
                  }}
                  onLoadedMetadata={() => {
                    if (playbackVideoRef.current) {
                      setDuration(playbackVideoRef.current.duration || 0);
                      playbackVideoRef.current.play().catch((err) => {
                        console.warn("Autoplay with sound restricted, playing muted fallback:", err);
                        if (playbackVideoRef.current) {
                          playbackVideoRef.current.muted = true;
                          setIsMuted(true);
                          playbackVideoRef.current.play().catch(() => {});
                        }
                      });
                    }
                  }}
                  onCanPlay={() => {
                    if (playbackVideoRef.current) {
                      if (!duration) {
                        setDuration(playbackVideoRef.current.duration || 0);
                      }
                      playbackVideoRef.current.play().catch(() => {});
                    }
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => {
                    if (playbackVideoRef.current) {
                      playbackVideoRef.current.currentTime = 0;
                      playbackVideoRef.current.play().catch(() => {});
                    }
                  }}
                  onClick={togglePlay}
                />



                {/* Top Overlay: Place Badge & Close */}
                <div className="absolute top-3.5 left-3.5 right-3.5 md:top-5 md:left-5 md:right-5 flex items-center justify-between z-30 pointer-events-none gap-2">
                  <div className="flex items-center pointer-events-auto min-w-0 flex-1">
                    <div className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-black/65 backdrop-blur-xl border border-white/20 text-white font-bold text-xs sm:text-sm flex items-center gap-2 sm:gap-2.5 shadow-2xl min-w-0 max-w-full">
                      <div className="flex items-center gap-1.5 sm:gap-2 border-r border-white/20 pr-2 sm:pr-2.5 shrink-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <CopoBrandLogo
                          domain={selectedPlace?.brandDomain || extractCleanDomain(selectedPlace?.website || selectedPlace?.id || selectedPlace?.name)}
                          name={selectedPlace?.name}
                          website={selectedPlace?.website}
                          logoUrl={selectedPlace?.logoUrl || selectedPlace?.avatarUrl}
                          bannerUrl={selectedPlace?.bannerUrl || selectedPlace?.ogImage}
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white border border-white/20 overflow-hidden flex items-center justify-center shrink-0 p-0.5 shadow-md ring-1 ring-white/10"
                          imageClassName="w-full h-full object-contain rounded-[4px]"
                          fallbackTextClassName="font-extrabold text-[11px] text-zinc-950"
                        />
                      </div>
                      <span className="font-extrabold text-white text-xs sm:text-sm tracking-normal truncate min-w-0 flex-1">
                        {formatBusinessName(selectedPlace?.name, selectedPlace?.brandDomain || selectedPlace?.website, selectedPlace?.id)}
                      </span>
                      <div className="flex items-center gap-1 bg-amber-400/20 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-amber-400/40 shrink-0 ml-auto sm:ml-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                        <span className="text-amber-400 font-black text-xs sm:text-sm">{rating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center pointer-events-auto shrink-0 z-30 ml-2">
                    <button
                      type="button"
                      onClick={handleAttemptClose}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/65 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center hover:bg-black transition-all cursor-pointer active:scale-95 shadow-2xl shrink-0"
                      title="Close"
                    >
                      <X className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Center Big Play / Pause Overlay (Optically centered in video framing area) */}
                <div className="absolute inset-0 pb-24 md:pb-16 flex items-center justify-center pointer-events-none z-25">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transition-all pointer-events-auto cursor-pointer border-2 border-white/40 hover:scale-110 active:scale-90 ${
                      isPlaying ? "opacity-0 hover:opacity-80" : "opacity-100 scale-100"
                    }`}
                    title={isPlaying ? "Pause" : "Play Recording"}
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 fill-black text-black" />
                    ) : (
                      <Play className="w-8 h-8 fill-black text-black ml-1" />
                    )}
                  </button>
                </div>

                {/* Bottom Custom Playback Bar & Publish Action */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-5 pt-8 z-30 flex flex-col gap-3 pointer-events-auto">
                  {/* Scrubber Range */}
                  <div className="flex items-center gap-3 w-full">
                    <input
                      type="range"
                      min="0"
                      max={duration || 60}
                      step="0.1"
                      value={currentTime}
                      onChange={(e) => {
                        const time = parseFloat(e.target.value);
                        setCurrentTime(time);
                        if (playbackVideoRef.current) {
                          playbackVideoRef.current.currentTime = time;
                        }
                      }}
                      className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                  </div>

                  {/* Time & Sound row */}
                  <div className="flex items-center justify-between text-white text-xs px-1">
                    <div className="flex items-center gap-2 font-mono text-zinc-200">
                      <span>{formatTime(currentTime)}</span>
                      <span>/</span>
                      <span>{formatTime(duration)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (playbackVideoRef.current) {
                          const nextMuted = !isMuted;
                          playbackVideoRef.current.muted = nextMuted;
                          setIsMuted(nextMuted);
                          if (!nextMuted && playbackVideoRef.current.paused) {
                            playbackVideoRef.current.play().catch(() => {});
                          }
                        }
                      }}
                      className={`w-9 h-9 rounded-full backdrop-blur-xl border transition-all cursor-pointer flex items-center justify-center shadow-lg active:scale-95 shrink-0 ${
                        isMuted
                          ? "bg-amber-500/20 border-amber-400/50 text-amber-300 animate-pulse"
                          : "bg-black/60 hover:bg-black/80 border-white/20 text-white"
                      }`}
                      title={isMuted ? "Unmute sound" : "Mute sound"}
                      aria-label={isMuted ? "Unmute sound" : "Mute sound"}
                    >
                      {isMuted ? (
                        <VolumeX className="w-4.5 h-4.5 text-amber-300 stroke-[2.2] shrink-0" />
                      ) : (
                        <Volume2 className="w-4.5 h-4.5 text-white stroke-[2.2] shrink-0" />
                      )}
                    </button>
                  </div>

                  {/* Upload Progress Bar (when publishing) */}
                  {isPublishing && (
                    <div className="w-full space-y-2 bg-zinc-900/95 p-3.5 rounded-2xl border border-zinc-700/60 backdrop-blur-md shadow-2xl">
                      <div className="flex justify-between text-xs font-bold text-white">
                        <span className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {publishingStage || "Publishing authentic review..."}
                        </span>
                        <span className="font-mono text-amber-400 font-black">{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-emerald-400 transition-all duration-300 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-[10.5px] text-zinc-300 text-center font-medium leading-tight pt-0.5">
                        {uploadProgress >= 90
                          ? "Adding review to the live feed..."
                          : "Please do not close or reload this browser tab."}
                      </p>
                    </div>
                  )}

                  {/* Publish Video Review CTA Button */}
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleReRecord}
                      disabled={isPublishing}
                      className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{t('create.reRecord', 'Re-record')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePublish}
                      disabled={isPublishing || (!recordedVideoBlob && !recordedVideoUrl)}
                      className={`flex-1 py-3.5 rounded-2xl bg-white hover:bg-zinc-200 text-black font-bold text-sm shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                        isPublishing ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    >
                      {isPublishing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          <span>{t('create.publishing', 'Publishing live...')}</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>{t('create.publishReview', 'Publish Video Review')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* LIVE FRONT CAMERA RECORDING STUDIO */
              <div className="relative w-full h-full bg-black flex flex-col justify-between overflow-hidden">
                {/* Live Camera Stream (Mirrored for front selfie camera only) */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ transform: "scaleX(-1)" }}
                  className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
                />

                {/* Top Control Bar Over Camera */}
                <div className="absolute top-3.5 left-3.5 right-3.5 md:top-5 md:left-5 md:right-5 flex items-center justify-between z-30 pointer-events-none gap-2">
                  {/* Left: Place Info Pill - Clean Premium */}
                  <div className="flex items-center pointer-events-auto min-w-0 flex-1">
                    <div className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-black/65 backdrop-blur-xl border border-white/20 text-white font-bold text-xs sm:text-sm flex items-center gap-2 sm:gap-2.5 shadow-2xl min-w-0 max-w-full">
                      <div className="flex items-center gap-1.5 sm:gap-2 border-r border-white/20 pr-2 sm:pr-2.5 shrink-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                        <CopoBrandLogo
                          domain={selectedPlace?.brandDomain || extractCleanDomain(selectedPlace?.website || selectedPlace?.id || selectedPlace?.name)}
                          name={selectedPlace?.name}
                          website={selectedPlace?.website}
                          logoUrl={selectedPlace?.logoUrl || selectedPlace?.avatarUrl}
                          bannerUrl={selectedPlace?.bannerUrl || selectedPlace?.ogImage}
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white border border-white/20 overflow-hidden flex items-center justify-center shrink-0 p-0.5 shadow-md ring-1 ring-white/10"
                          imageClassName="w-full h-full object-contain rounded-[4px]"
                          fallbackTextClassName="font-extrabold text-[11px] text-zinc-950"
                        />
                        <span className="uppercase tracking-wider text-[10px] font-black text-red-400 hidden xs:inline-block">Live</span>
                      </div>
                      <span className="font-extrabold text-white text-xs sm:text-sm tracking-normal truncate min-w-0 flex-1">
                        {formatBusinessName(selectedPlace?.name, selectedPlace?.brandDomain || selectedPlace?.website, selectedPlace?.id)}
                      </span>
                      <div className="flex items-center gap-1 bg-amber-400/20 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-amber-400/40 shrink-0 ml-auto sm:ml-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                        <span className="text-amber-400 font-black text-xs sm:text-sm">{rating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Close Only */}
                  <div className="flex items-center pointer-events-auto shrink-0 z-30 ml-2">
                    <button
                      type="button"
                      onClick={handleAttemptClose}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/65 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center hover:bg-black/90 transition-all cursor-pointer shadow-2xl active:scale-95 shrink-0"
                      title="Close"
                    >
                      <X className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* 3-2-1 Countdown Overlay */}
                {countdown !== null && (
                  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md animate-fadeIn select-none pointer-events-auto">
                    <div className="relative flex flex-col items-center justify-center">
                      {/* Pulsing ring animation */}
                      <div className="absolute w-36 h-36 rounded-full border-4 border-red-500/30 animate-ping pointer-events-none" />
                      
                      {/* Main Countdown Disc */}
                      <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.5)] border-4 border-white/90 transform scale-100 transition-all">
                        <span key={countdown} className="text-6xl font-black tracking-tight animate-scaleIn drop-shadow-lg">
                          {countdown}
                        </span>
                      </div>

                      <div className="mt-6 flex flex-col items-center gap-1.5 text-center">
                        <span className="text-white font-extrabold text-lg tracking-wider uppercase drop-shadow-md">
                          Get Ready...
                        </span>
                        <span className="text-zinc-300 text-xs font-medium">
                          Recording starts in {countdown}
                        </span>
                      </div>

                      {/* Cancel Countdown Button */}
                      <button
                        type="button"
                        onClick={handleCancelCountdown}
                        className="mt-8 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all cursor-pointer active:scale-95"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Content Safety / Error Alert Banner */}
                {errorMessage && (
                  <div className="absolute top-20 md:top-22 inset-x-4 md:inset-x-6 z-40 flex justify-center pointer-events-auto animate-fadeIn">
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-red-950/95 backdrop-blur-xl border border-red-500/50 text-white text-xs sm:text-sm font-semibold flex flex-col gap-2.5 shadow-2xl max-w-md w-full">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <p className="font-bold text-red-200">Permissions Required</p>
                          <p className="text-zinc-200 text-xs leading-relaxed">{errorMessage}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setErrorMessage(null)}
                          className="text-white/60 hover:text-white p-1 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => startCamera()}
                        className="w-full py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Allow Camera & Microphone Access</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Bottom Camera Controls Bar (When NOT recording and NOT counting down) */}
                {!isRecording && countdown === null && !recordedVideoUrl && (
                  <div className="absolute bottom-10 inset-x-0 flex flex-col items-center justify-center z-30 pointer-events-auto gap-4 select-none">
                    {/* Big Shutter Record Button - Instant Response on Desktop & Mobile */}
                    <button
                      id="record-shutter-button"
                      type="button"
                      onClick={handleStartRecordingInstant}
                      onTouchStart={handleStartRecordingInstant}
                      className="w-22 h-22 rounded-full border-[6px] border-white/50 p-1.5 flex items-center justify-center bg-transparent transition-transform active:scale-90 cursor-pointer group touch-manipulation select-none pointer-events-auto"
                      title="Tap to start 3-2-1 countdown"
                      aria-label="Tap to start 3-2-1 countdown"
                    >
                      <div className="w-full h-full rounded-full bg-red-600 flex items-center justify-center shadow-2xl group-hover:bg-red-500 active:bg-red-700 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-white/30 border border-white/50" />
                      </div>
                    </button>

                    <span className="text-[12px] font-bold text-white tracking-wide drop-shadow-md uppercase opacity-90 select-none pointer-events-none">
                      Tap to record review
                    </span>
                  </div>
                )}



                {/* Active Recording State Bar with 60-Second Radial Progress */}
                {isRecording && (
                  <div className="absolute bottom-8 inset-x-0 flex flex-col items-center gap-4 z-30 pointer-events-auto">
                    {/* Live REC Timer badge */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="bg-red-600/90 backdrop-blur-md text-white px-4 py-1.5 rounded-full font-bold text-xs tracking-wider shadow-2xl border border-red-400 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                        <span>REC {recordingTime < 10 ? `00:0${recordingTime}` : `00:${recordingTime}`} / 01:00</span>
                      </div>
                    </div>

                    {/* Circular 60s Progress Ring with Stop Recording Shutter Button */}
                    <div className="relative flex items-center justify-center">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="42"
                          stroke="rgba(255, 255, 255, 0.25)"
                          strokeWidth="4"
                          fill="transparent"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="42"
                          stroke="#ef4444"
                          strokeWidth="4"
                          fill="transparent"
                          strokeDasharray={263.89}
                          strokeDashoffset={263.89 - (263.89 * recordingTime) / 60}
                          className="transition-all duration-1000 ease-linear"
                        />
                      </svg>

                      <button
                        id="stop-recording-button"
                        type="button"
                        onClick={handleStopRecording}
                        className="absolute w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-2xl transition-transform active:scale-90 cursor-pointer flex items-center justify-center touch-manipulation select-none"
                        title="Stop Recording"
                        aria-label="Stop Recording"
                      >
                        <Square className="w-6 h-6 fill-white" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
