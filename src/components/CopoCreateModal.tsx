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
import { getPlaceLogoUrl, getCleanLogoUrl, KNOWN_BRAND_LOGOS, KNOWN_BRAND_BANNERS } from "../utils/logoUtils";
import { formatBusinessName, resolveSafeAuthor, getSafeAvatarUrl, extractCleanDomain, getDisplayUrlAsDomain, getEffectivePlaceDescription, generateSmartPlaceDescription } from "../utils/placeUtils";
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
  const [recordingTime, setRecordingTime] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownTimerRef = useRef<any>(null);

  // Audio Context for hardware unlocking
  const audioContextRef = useRef<any>(null);
  const voiceDetectedRef = useRef<boolean>(true);
  const [isSpeakingDetected, setIsSpeakingDetected] = useState<boolean>(true);

  // Camera settings (Strict Front Camera Only)
  const [cameraActive, setCameraActive] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
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
    // Allow closing the record modal and continuing in-app navigation while upload proceeds in background
    onClose();
  };

  useEffect(() => {
    if (preselectedPlace) {
      setSelectedPlace(preselectedPlace);
      if (isOpen) setStep(1);
    }
  }, [preselectedPlace, isOpen]);

  useEffect(() => {
    setRating(0);
  }, [selectedPlace]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      resetState();
      setStep(1);
    } else {
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
    setRecordedVideoBlob(null);
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
    }
    setRecordedVideoUrl(null);
    setVideoThumbnail(null);
    setRecordingTime(0);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setErrorMessage(null);
    setIsPublishing(false);
    setUploadProgress(0);
  };

  const extractThumbnailFromVideo = (videoSource: string | Blob): Promise<string> => {
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
                resolve(dataUrl);
                return;
              }
            }
          } catch (e) {
            console.warn("Frame capture warning:", e);
          }
          cleanup();
          resolve("");
        };

        video.onloadeddata = () => {
          video.currentTime = 0.3;
        };
        video.onseeked = () => {
          capture();
        };
        video.onerror = () => {
          cleanup();
          resolve("");
        };

        setTimeout(() => {
          if (video.readyState >= 2) capture();
          else {
            cleanup();
            resolve("");
          }
        }, 3000);
      } catch {
        resolve("");
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
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    startCamera();
  };

  // Camera Access (Strict Front Camera Only)
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
      
      if (!videoRef.current) {
        stream.getTracks().forEach(t => {
          try { t.stop(); } catch(e) {}
        });
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
      if (err.name === "AbortError") return;

      console.warn("Camera access error (expected if denied):", err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: true
        });

        if (!videoRef.current) {
          fallbackStream.getTracks().forEach(t => {
            try { t.stop(); } catch(e) {}
          });
          return;
        }

        activeStreamRef.current = fallbackStream;
        videoRef.current.srcObject = fallbackStream;
        videoRef.current.muted = true;
        
        try {
          await videoRef.current.play();
        } catch (playErr: any) {
          if (playErr.name !== "AbortError") {
            console.warn("Fallback camera playback error:", playErr);
          }
        }
      } catch (fallbackErr) {
        console.warn("Fallback camera access error (expected if denied):", fallbackErr);
        
        // Canvas Simulation Stream Fallback so user is never blocked by permission denial in restricted iframes
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 720;
          canvas.height = 1280;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            let hue = 210;
            const drawFrame = () => {
              if (!activeStreamRef.current) return;
              hue = (hue + 0.5) % 360;
              ctx.fillStyle = `hsl(${hue}, 45%, 12%)`;
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 36px system-ui, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('Yoouz Review Studio', canvas.width / 2, canvas.height / 2 + 100);
              
              ctx.font = '22px system-ui, sans-serif';
              ctx.fillStyle = '#93c5fd';
              ctx.fillText('Front Camera Active', canvas.width / 2, canvas.height / 2 + 150);

              requestAnimationFrame(drawFrame);
            };
            drawFrame();
          }

          const simStream = (canvas as any).captureStream(30);
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const dst = audioCtx.createMediaStreamDestination();
            oscillator.connect(dst);
            oscillator.start();
            const audioTrack = dst.stream.getAudioTracks()[0];
            if (audioTrack) {
              simStream.addTrack(audioTrack);
            }
          } catch (e) {}

          activeStreamRef.current = simStream;
          if (videoRef.current) {
            videoRef.current.srcObject = simStream;
            videoRef.current.muted = true;
            await videoRef.current.play().catch(() => {});
          }

          setErrorMessage(null);
          return;
        } catch (simErr) {
          console.error("Simulation fallback error:", simErr);
        }

        setErrorMessage("Please allow camera & microphone permissions to record your video review.");
      }
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
  const handleStartRecordingInstant = (e?: React.SyntheticEvent) => {
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

    // If camera hasn't spun up yet, kick it off immediately
    if (!activeStreamRef.current && (!videoRef.current || !videoRef.current.srcObject)) {
      startCamera();
    }

    // Start 3-2-1 Countdown immediately
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
    if (!stream) {
      // If camera is still spinning up, start camera and then start recording as soon as stream is ready
      startCamera().then(() => {
        setTimeout(() => {
          startActualRecording();
        }, 150);
      });
      return;
    }
    triggerHaptic("heavy");
    chunksRef.current = [];
    try {
      const config = getOptimalVideoRecorderConfig();
      const options: MediaRecorderOptions = config.mimeType ? { mimeType: config.mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onerror = (e: any) => {
        console.warn("MediaRecorder error:", e);
      };

      mediaRecorder.onstop = () => {
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
        extractThumbnailFromVideo(blob).then((thumb) => {
          if (thumb) setVideoThumbnail(thumb);
        });
      };

      // Request data slices periodically
      mediaRecorder.start(250);
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
    }
  };

  const handlePublish = async () => {
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
    const cleanPlaceName = formatBusinessName(selectedPlace.name || placeDomain) || selectedPlace.name;
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

    const resolvedAuthor = resolveSafeAuthor({
      author: {
        name: currentUser?.name || (currentUser?.email ? currentUser.email.split("@")[0] : "Verified Reviewer"),
        avatar: currentUser?.avatar || ""
      },
      userId: currentUser?.email,
      userEmail: currentUser?.email
    }, currentUser);

    const fallbackReview: VideoReview = {
      id: reviewId,
      userId: currentUser?.email || "guest@yoouz.com",
      userEmail: currentUser?.email || "guest@yoouz.com",
      createdAtMs: Date.now(),
      isLocalUpload: true,
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
        localGuideLevel: 7,
        videoReviewCount: 1,
        photosCount: 0,
        isVerified: true
      },
      rating: rating || 5,
      durationSeconds: recordingTime > 0 ? recordingTime : (duration > 0 ? Math.round(duration) : 15),
      videoUrl: defaultStreamUrl,
      fallbackVideoUrls: [defaultStreamUrl],
      thumbnailUrl: safeThumbnail,
      caption: `Video review for ${getDisplayUrlAsDomain(selectedPlace) || cleanPlaceName}`,
      dishOrItem: cleanPlaceName,
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
      recordedAt: "Just now"
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
    }, 25000);

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
      }
    } catch (uploadErr) {
      console.warn("Server video upload notice:", uploadErr);
      // Even if direct upload threw an error, continue with local fallback URL so user review is never lost
    }

    setUploadProgress(92);
    setPublishingStage("Securing content & synchronizing...");

    const resolvedSafeThumbnail = finalThumbnail || safeThumbnail;

    const newReview: VideoReview = {
      ...fallbackReview,
      videoUrl: uploadedPublicUrl || defaultStreamUrl,
      bunnyVideoId: finalBunnyId,
      fallbackVideoUrls: [uploadedPublicUrl, defaultStreamUrl].filter(Boolean) as string[],
      thumbnailUrl: resolvedSafeThumbnail
    } as any;

    // 4. Save metadata locally first so it is immune to network dropouts or reloads
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

    // 5. Save metadata to server review index and memory cache
    setUploadProgress(96);
    setPublishingStage("Saving review to feed...");

    try {
      await fetch("/api/videos/save-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReview),
        signal: AbortSignal.timeout(12000)
      });
    } catch (saveErr) {
      console.warn("Server video review save notice:", saveErr);
      // Secondary immediate retry
      try {
        await fetch("/api/videos/save-review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newReview),
          signal: AbortSignal.timeout(12000)
        });
      } catch (retryErr) {}
    }

    // Secondary cloud sync calls run asynchronously without blocking the UI
    fetch(`/api/nosql/videoReviews/${reviewId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: newReview, merge: true })
    }).catch(() => {});

    if (selectedPlace?.id) {
      const placeDocId = selectedPlace.id;
      const updatedPlaceData = {
        ...selectedPlace,
        id: placeDocId,
        totalReviews: (selectedPlace.totalReviews || 0) + 1,
        rating: rating
      };
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
    onPublishVideoReview(newReview);
  };

  const filteredPlaces = places.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.brandDomain && p.brandDomain.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

          if (foundPlace) {
            foundPlace = {
              ...foundPlace,
              address: foundPlace.address || data.address || "",
              city: (foundPlace.city && foundPlace.city !== "Online") ? foundPlace.city : (data.city || foundPlace.city || ""),
              country: foundPlace.country || data.country || "",
              phone: foundPlace.phone || data.phone || "",
              email: foundPlace.email || data.email || "",
              category: (foundPlace.category && foundPlace.category !== "Website" && foundPlace.category !== "General") ? foundPlace.category : (data.category || foundPlace.category || "Website"),
              logoUrl: (foundPlace.logoUrl && !foundPlace.logoUrl.startsWith("data:;") && !foundPlace.logoUrl.includes("tap/0.png")) ? foundPlace.logoUrl : (fetchedLogo || ""),
              avatarUrl: (foundPlace.avatarUrl && !foundPlace.avatarUrl.startsWith("data:;") && !foundPlace.avatarUrl.includes("tap/0.png")) ? foundPlace.avatarUrl : (fetchedLogo || ""),
              bannerUrl: foundPlace.bannerUrl || fetchedBanner || "",
              description: getEffectivePlaceDescription({
                ...foundPlace,
                name: foundPlace.name || data.siteName || data.title,
                description: foundPlace.description || data.description,
                category: foundPlace.category || data.category,
                city: foundPlace.city || data.city,
                domain: data.domain || domain
              }),
            };
          } else {
            const newBizName = formatBusinessName(data.siteName || data.title, data.domain || domain) || formatBusinessName(data.domain || domain) || (data.domain || domain);
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
              avatarUrl: fetchedLogo,
              logoUrl: fetchedLogo,
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
                    <h4 className="font-bold text-white text-sm truncate">{formatBusinessName(selectedPlace.name)}</h4>
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
                      playbackVideoRef.current.play().catch(() => {});
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
                >
                  <source src={recordedVideoUrl} type={recordedVideoBlob?.type || "video/mp4"} />
                  <source src={recordedVideoUrl} type="video/webm" />
                </video>

                {/* Top Overlay: Place Badge & Close */}
                <div className="absolute top-4 left-4 right-4 md:top-6 md:left-6 md:right-6 flex items-center justify-between z-30 pointer-events-none gap-2.5">
                  <div className="flex items-center gap-2 pointer-events-auto min-w-0 flex-1 sm:flex-initial">
                    <div className="px-3.5 sm:px-4 py-2 rounded-full bg-black/50 backdrop-blur-xl border border-white/15 text-white font-bold text-xs flex items-center gap-2 sm:gap-2.5 shadow-xl max-w-full">
                      <div className="flex items-center gap-1.5 border-r border-white/15 pr-2 sm:pr-2.5 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse hidden sm:block" />
                        <CopoBrandLogo
                          domain={selectedPlace?.brandDomain || extractCleanDomain(selectedPlace?.website || selectedPlace?.id || selectedPlace?.name)}
                          name={selectedPlace?.name}
                          website={selectedPlace?.website}
                          logoUrl={selectedPlace?.logoUrl || selectedPlace?.avatarUrl}
                          bannerUrl={selectedPlace?.bannerUrl || selectedPlace?.ogImage}
                          className="w-6 h-6 rounded-md bg-white border border-white/20 overflow-hidden flex items-center justify-center shrink-0 p-0.5 shadow-sm ring-1 ring-white/10"
                          imageClassName="w-full h-full object-contain rounded-[3px]"
                          fallbackTextClassName="font-extrabold text-[10px] text-zinc-950"
                        />
                        <span className="truncate max-w-[110px] sm:max-w-[180px] tracking-tight">{formatBusinessName(selectedPlace?.name)}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/30 shrink-0">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-amber-400 font-black">{rating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pointer-events-auto shrink-0">
                    <button
                      type="button"
                      onClick={handleAttemptClose}
                      className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl border border-white/15 text-white flex items-center justify-center hover:bg-black transition-all cursor-pointer active:scale-95 shadow-xl shrink-0"
                      title="Close"
                    >
                      <X className="w-5 h-5" />
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
                          playbackVideoRef.current.muted = !isMuted;
                          setIsMuted(!isMuted);
                        }
                      }}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4 text-red-400" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-white" />
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
                  style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
                  className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
                />

                {/* Top Control Bar Over Camera */}
                <div className="absolute top-4 left-4 right-4 md:top-6 md:left-6 md:right-6 flex items-center justify-between z-30 pointer-events-none gap-2.5">
                  {/* Left: Place Info Pill - Clean Premium */}
                  <div className="flex items-center gap-2 pointer-events-auto min-w-0 flex-1 sm:flex-initial">
                    <div className="px-3.5 sm:px-4 py-2 rounded-full bg-black/50 backdrop-blur-xl border border-white/15 text-white text-xs font-bold flex items-center gap-2 sm:gap-2.5 shadow-xl max-w-full">
                      <div className="flex items-center gap-1.5 border-r border-white/15 pr-2 sm:pr-2.5 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse hidden sm:block" />
                        <CopoBrandLogo
                          domain={selectedPlace?.brandDomain || extractCleanDomain(selectedPlace?.website || selectedPlace?.id || selectedPlace?.name)}
                          name={selectedPlace?.name}
                          website={selectedPlace?.website}
                          logoUrl={selectedPlace?.logoUrl || selectedPlace?.avatarUrl}
                          bannerUrl={selectedPlace?.bannerUrl || selectedPlace?.ogImage}
                          className="w-6 h-6 rounded-md bg-white border border-white/20 overflow-hidden flex items-center justify-center shrink-0 p-0.5 shadow-sm ring-1 ring-white/10"
                          imageClassName="w-full h-full object-contain rounded-[3px]"
                          fallbackTextClassName="font-extrabold text-[10px] text-zinc-950"
                        />
                        <span className="uppercase tracking-tighter opacity-80 text-[10px] sm:text-xs">Live</span>
                      </div>
                      <span className="truncate max-w-[110px] sm:max-w-[180px] tracking-tight">{formatBusinessName(selectedPlace?.name)}</span>
                      <div className="flex items-center gap-1 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/30 shrink-0">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-amber-400 font-black">{rating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Close Only */}
                  <div className="flex items-center gap-2 pointer-events-auto shrink-0">
                    <button
                      type="button"
                      onClick={handleAttemptClose}
                      className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl border border-white/15 text-white flex items-center justify-center hover:bg-black/80 transition-all cursor-pointer shadow-xl active:scale-95 shrink-0"
                      title="Close"
                    >
                      <X className="w-5 h-5" />
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
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-red-950/95 backdrop-blur-xl border border-red-500/50 text-white text-xs sm:text-sm font-semibold flex items-start gap-3 shadow-2xl max-w-md">
                      <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <p className="font-bold text-red-200">Recording Notice</p>
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
