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
import { db } from "../lib/firebase";
import { doc, setDoc } from "../lib/firebase";
import { cleanForFirestore } from "../utils/cleanFirestore";
import { getPlaceLogoUrl, getCleanLogoUrl } from "../utils/logoUtils";
import { initFaceDetection, detectFaceInVideo } from "../utils/faceDetector";
import { formatBusinessName } from "../utils/placeUtils";
import { CopoMobileSearchView } from "./CopoMobileSearchView";
import { triggerHaptic } from "../utils/haptics";

interface CopoCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  places: Place[];
  videos?: VideoReview[];
  preselectedPlace?: Place | null;
  onPublishVideoReview: (review: VideoReview) => void;
  currentUser?: UserProfile | null;
  onAddPlace?: (place: Place) => void;
}

export const CopoCreateModal: React.FC<CopoCreateModalProps> = ({
  isOpen,
  onClose,
  places,
  videos,
  preselectedPlace,
  onPublishVideoReview,
  currentUser,
  onAddPlace
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(preselectedPlace || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [isSearchingMetadata, setIsSearchingMetadata] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Recording & Studio states
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  const isRecordingAbortedRef = useRef(false);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  // Face recognition & verification
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [faceWarning, setFaceWarning] = useState<string | null>(null);
  const [faceConfidence, setFaceConfidence] = useState<number>(0);
  const faceIntervalRef = useRef<any>(null);
  const faceMissingSinceRef = useRef<number | null>(null);

  // Speech / Voice-activated recording
  const [isWaitingForVoice, setIsWaitingForVoice] = useState(false);
  const [micVolumeLevel, setMicVolumeLevel] = useState<number>(0);
  const audioContextRef = useRef<any>(null);
  const analyserRef = useRef<any>(null);
  const voiceDetectionLoopRef = useRef<any>(null);

  // Camera settings (Front / Rear camera flip)
  const [cameraActive, setCameraActive] = useState(false);
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

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playbackVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const countdownTimerRef = useRef<any>(null);

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
      initFaceDetection().catch(() => {});
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  useEffect(() => {
    if (step === 2 && isOpen && !recordedVideoUrl) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [step, isOpen, recordedVideoUrl]);

  const resetState = () => {
    setIsRecording(false); isRecordingRef.current = false;
    setCountdown(null);
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
    setIsFaceDetected(false);
    setFaceWarning(null);
    setIsWaitingForVoice(false);
    setMicVolumeLevel(0);
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

  // Continuous face detection scanner loop
  const startFaceDetectionLoop = useCallback(() => {
    if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);

    faceIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        return;
      }

      try {
        const result = await detectFaceInVideo(videoRef.current);
        if (result.detected) {
          setIsFaceDetected(true);
          setFaceConfidence(result.confidence || 0.9);
          setFaceWarning(null);
          faceMissingSinceRef.current = null;
        } else {
          setIsFaceDetected(false);
          setFaceConfidence(0);

          // If recording is active and face is missing for over 3 seconds, show alert
          if (isRecordingRef.current) {
            if (!faceMissingSinceRef.current) {
              faceMissingSinceRef.current = Date.now();
            } else if (Date.now() - faceMissingSinceRef.current > 3000) {
              setFaceWarning("Face not detected. Recording stopped automatically to ensure authenticity. Please try again.");
              isRecordingAbortedRef.current = true;
              handleStopRecording();
              faceMissingSinceRef.current = null;
            }
          } else {
            faceMissingSinceRef.current = null;
          }
        }
      } catch (err) {
        // Fail quietly on frame scan
      }
    }, 400);
  }, [isRecording]);

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
        // Ignore AbortError which happens if play() is interrupted by a new load request
        if (playErr.name !== "AbortError") {
          console.warn("Camera playback non-abort error:", playErr);
        }
      }

      startFaceDetectionLoop();
    } catch (err: any) {
      // If it's an AbortError from play(), we don't necessarily want to treat it as a camera failure
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
        
        startFaceDetectionLoop();
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
              
              // Draw studio branding & face guide outline
              ctx.strokeStyle = 'rgba(59, 130, 246, 0.7)';
              ctx.lineWidth = 6;
              ctx.beginPath();
              ctx.ellipse(canvas.width / 2, canvas.height / 2 - 60, 180, 240, 0, 0, Math.PI * 2);
              ctx.stroke();

              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 36px system-ui, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('Yoouz Review Studio', canvas.width / 2, canvas.height / 2 + 100);
              
              ctx.font = '22px system-ui, sans-serif';
              ctx.fillStyle = '#93c5fd';
              ctx.fillText('Simulated Camera Mode (Ready)', canvas.width / 2, canvas.height / 2 + 150);

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

          setIsFaceDetected(true);
          setFaceConfidence(0.99);
          setFaceWarning(null);
          setErrorMessage(null);
          startFaceDetectionLoop();
          return;
        } catch (simErr) {
          console.error("Simulation fallback error:", simErr);
        }

        setErrorMessage("Please allow camera & microphone permissions to record your video review.");
        setCameraActive(false);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Feature disabled by policy - keeping stub for ref if needed but it's hidden in UI
    console.log("File upload is disabled");
  };

  const stopCamera = () => {
    if (faceIntervalRef.current) {
      clearInterval(faceIntervalRef.current);
      faceIntervalRef.current = null;
    }
    if (voiceDetectionLoopRef.current) {
      cancelAnimationFrame(voiceDetectionLoopRef.current);
      voiceDetectionLoopRef.current = null;
    }
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.disconnect();
      } catch (e) {}
      audioSourceRef.current = null;
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch (e) {}
      analyserRef.current = null;
    }
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
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setIsWaitingForVoice(false);
    setCameraActive(false);
    setIsFaceDetected(false);
    setFaceWarning(null);
    setMicVolumeLevel(0);
  };

  // Triggers countdown then speech/voice detection
  const handleTriggerCountdown = () => {
    // Face verification check before starting
    if (!isFaceDetected) {
      setFaceWarning("Please position your face clearly in the front camera frame.");
      setTimeout(() => {
        setFaceWarning(null);
      }, 3000);
      return; // STOP: Face must be detected to proceed
    }

    // Warm up / unlock AudioContext synchronously on user tap gesture (Safari/iOS requirement)
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

    setErrorMessage(null);
    setCountdown(3);
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          initiateVoiceWait(); // Wait for user speech to start recording
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Speech & Voice Detection Engine (Mobile & Desktop)
  const initiateVoiceWait = () => {
    if (!videoRef.current || !videoRef.current.srcObject) {
      startActualRecording();
      return;
    }

    setIsWaitingForVoice(true);
    setMicVolumeLevel(0);
    const stream = videoRef.current.srcObject as MediaStream;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        setIsWaitingForVoice(false);
        startActualRecording();
        return;
      }

      const audioCtx = audioContextRef.current || new AudioContextClass();
      audioContextRef.current = audioCtx;
      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }

      const analyser = audioCtx.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.3;

      const source = audioCtx.createMediaStreamSource(stream);
      audioSourceRef.current = source;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let isStarted = false;
      let speechConfidenceFrames = 0;

      const checkVolume = () => {
        if (isStarted || !analyserRef.current) return;

        analyser.getByteTimeDomainData(dataArray);
        let maxDeviation = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const deviation = Math.abs(dataArray[i] - 128);
          if (deviation > maxDeviation) maxDeviation = deviation;
        }

        // Map maxDeviation (0-128) to 0-100 percentage for UI wave feedback
        const normalized = Math.min(100, Math.round((maxDeviation / 128) * 100));
        setMicVolumeLevel(normalized);

        // A normal speaking voice easily spikes deviation > 15. Ambient hum stays < 5.
        // We trigger on the very first sign of a vocal spike (1 frame) to not cut off the first word.
        if (maxDeviation > 8) {
          speechConfidenceFrames++;
          if (speechConfidenceFrames >= 2) {
            isStarted = true;
            setIsWaitingForVoice(false);

            // Haptic feedback on mobile if supported
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              try { navigator.vibrate(50); } catch (e) {}
            }

            try { source.disconnect(); } catch (e) {}
            audioSourceRef.current = null;

            startActualRecording();

            if (audioCtx.state === "running") {
              audioCtx.close().catch(() => {});
            }
            audioContextRef.current = null;
            analyserRef.current = null;
            return;
          }
        } else {
          speechConfidenceFrames = Math.max(0, speechConfidenceFrames - 1);
        }

        voiceDetectionLoopRef.current = requestAnimationFrame(checkVolume);
      };

      voiceDetectionLoopRef.current = requestAnimationFrame(checkVolume);

    } catch (e) {
      console.error("AudioContext init error:", e);
      setErrorMessage("Microphone access is required for voice activation. Please check your permissions or try using a different browser.");
      setIsWaitingForVoice(false);
    }
  };

  const handleForceStartRecording = () => {
    if (voiceDetectionLoopRef.current) {
      cancelAnimationFrame(voiceDetectionLoopRef.current);
    }
    if (audioContextRef.current && audioContextRef.current.state === "running") {
      audioContextRef.current.close().catch(() => {});
    }
    setIsWaitingForVoice(false);
    triggerHaptic("heavy");
    startActualRecording();
  };

  const startActualRecording = () => {
    if (!videoRef.current || !videoRef.current.srcObject) {
      startCamera();
      return;
    }
    triggerHaptic("heavy");
    chunksRef.current = [];
    const stream = videoRef.current.srcObject as MediaStream;
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

      mediaRecorder.onstop = () => {
        if (isRecordingAbortedRef.current) {
          chunksRef.current = [];
          setErrorMessage("Recording was discarded because a face was not clearly visible in the camera. Please try again.");
          isRecordingAbortedRef.current = false;
          setIsRecording(false);
          isRecordingRef.current = false;
          setRecordingTime(0);
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
        setIsPlaying(false);
        setCurrentTime(0);
        stopCamera();

        // Extract genuine frame snapshot from recorded video
        extractThumbnailFromVideo(blob).then((thumb) => {
          if (thumb) setVideoThumbnail(thumb);
        });
      };

      // Request data slices periodically
      mediaRecorder.start(250);
      setIsRecording(true); isRecordingRef.current = true;
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
      setIsRecording(false); isRecordingRef.current = false;
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
    setUploadProgress(10);

    const reviewId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const mime = recordedVideoBlob?.type || "video/mp4";
    const ext = mime.includes("webm") ? "webm" : "mp4";
    const cleanFileName = `${reviewId}.${ext}`;
    const defaultStreamUrl = `/api/videos/stream/${cleanFileName}`;

    let finalThumbnail = videoThumbnail || "";

    // 1. Save raw blob to IndexedDB
    if (recordedVideoBlob) {
      try {
        await saveVideoBlobToIndexedDB(reviewId, recordedVideoBlob);
      } catch (e) {
        console.warn("IndexedDB save notice:", e);
      }
    }

    // 2. Upload video binary to streaming server & cloud storage with progress tracking
    let uploadedPublicUrl = defaultStreamUrl;
    let finalBunnyId: string | undefined = undefined;
    if (recordedVideoBlob) {
      try {
        const result = await uploadVideoResumableWithProgress(
          recordedVideoBlob,
          reviewId,
          (progress: any) => {
            const pct = typeof progress === "number" ? progress : progress.percent;
            setUploadProgress(Math.max(15, Math.min(95, pct)));
          }
        );
        if (result && result.downloadUrl) {
          uploadedPublicUrl = result.downloadUrl;
          if (result.thumbnailUrl) {
            finalThumbnail = result.thumbnailUrl;
          }
          if (result.bunnyVideoId) {
            finalBunnyId = result.bunnyVideoId;
          }
        }
      } catch (uploadErr) {
        console.warn("Server video upload notice:", uploadErr);
      }
    }

    setUploadProgress(100);

    // 3. Base64 backup for direct firestore fall-back if under 750KB
    let base64Backup: string | undefined = undefined;
    if (recordedVideoBlob && recordedVideoBlob.size < 750 * 1024) {
      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve("");
          reader.readAsDataURL(recordedVideoBlob);
        });
        const b64 = await base64Promise;
        if (b64) base64Backup = b64;
      } catch (b64Err) {}
    }

    const newReview: VideoReview = {
      id: reviewId,
      userId: currentUser?.email || "guest@yoouz.com",
      userEmail: currentUser?.email || "guest@yoouz.com",
      createdAtMs: Date.now(),
      placeId: selectedPlace.id,
      placeName: selectedPlace.name,
      placeCategory: selectedPlace.category || "General",
      placeAddress: selectedPlace.address || "Verified Location",
      placeCity: selectedPlace.city || "Online",
      placeRating: rating || 5,
      placeWebsite: selectedPlace.website || "",
      placeLogoUrl: getPlaceLogoUrl(selectedPlace) || selectedPlace.logoUrl || selectedPlace.avatarUrl || "",
      placeBannerUrl: selectedPlace.bannerUrl || selectedPlace.ogImage || "",
      author: {
        name: currentUser?.name || "Verified Reviewer",
        //handle: currentUser?.email ? `@${currentUser.email.split("@")[0]}` : "@yoouz_user",
        avatar: currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || "User")}&background=1a73e8&color=fff&bold=true&size=128`,
        isLocalGuide: true,
        localGuideLevel: 7,
        videoReviewCount: 1,
        photosCount: 0,
        isVerified: true
      },
      rating: rating || 5,
      durationSeconds: recordingTime > 0 ? recordingTime : (duration > 0 ? Math.round(duration) : 15),
      videoUrl: uploadedPublicUrl,
      bunnyVideoId: finalBunnyId,
      videoData: base64Backup,
      fallbackVideoUrls: [uploadedPublicUrl, defaultStreamUrl].filter(Boolean),
      thumbnailUrl: finalThumbnail,
      caption: `Video review for ${selectedPlace.name}`,
      dishOrItem: selectedPlace.name,
      likes: 1,
      isLiked: true,
      commentsCount: 0,
      comments: [],
      bookmarksCount: 0,
      isBookmarked: false,
      repostsCount: 0,
      sharesCount: 0,
      tags: [selectedPlace.category || "Review"],
      recordedAt: "Just now"
    };

    // 4. Save metadata to server & firestore
    try {
      fetch("/api/videos/save-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReview)
      }).catch((e) => console.warn("Server video review save notice:", e));
    } catch (e) {}

    try {
      if (db) {
        const firestoreCleanedReview = cleanForFirestore(newReview);
        setDoc(doc(db, "videoReviews", reviewId), firestoreCleanedReview, { merge: true }).catch((err) => {
          console.warn("Firestore video review write notice:", err?.message || err);
        });

        if (selectedPlace) {
          const placeDocId = selectedPlace.id;
          if (placeDocId) {
            setDoc(doc(db, "places", placeDocId), cleanForFirestore({
              ...selectedPlace,
              id: placeDocId,
              totalReviews: (selectedPlace.totalReviews || 0) + 1,
              rating: rating
            }), { merge: true }).catch(() => {});
          }
        }
      }
    } catch (e) {}

    onPublishVideoReview(newReview);
    setIsPublishing(false);
    onClose();
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const resp = await fetch(`/api/url-metadata?url=${encodeURIComponent(domain)}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (resp.ok) {
        const data = await resp.json();
        if (data.title || data.domain) {
          const newPlace: Place = {
            id: data.domain.replace(/[^a-zA-Z0-9]/g, "-"),
            name: data.title || data.domain,
            category: "Website",
            categoryType: "all",
            address: "",
            city: "Online",
            lat: 0,
            lng: 0,
            rating: 5,
            totalReviews: 1,
            ratingDistribution: { stars5: 1, stars4: 0, stars3: 0, stars2: 0, stars1: 0 },
            avatarUrl: data.logo || (data.domain ? getCleanLogoUrl(null, data.domain) || "" : ""),
            logoUrl: data.logo || (data.domain ? getCleanLogoUrl(null, data.domain) || "" : ""),
            bannerUrl: data.image || "",
            photos: data.image ? [data.image] : [],
            openingHours: "Available 24/7",
            isOpen: true,
            phone: "",
            website: data.url || domain,
            priceRange: "N/A",
            plusCode: "",
            description: data.description || "",
            popularKeywords: [],
            amenities: [],
            topDishes: [],
            brandDomain: data.domain
          };
          
          if (onAddPlace) onAddPlace(newPlace);
          setSelectedPlace(newPlace);
          setSearchQuery("");
        }
      } else {
        // Fallback to basic if API fails
        const cleanDomain = domain.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase();
        const fallbackPlace: Place = {
          id: cleanDomain.replace(/[^a-zA-Z0-9]/g, "-") || `custom-${Date.now()}`,
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
        if (onAddPlace) onAddPlace(fallbackPlace);
        setSelectedPlace(fallbackPlace);
        setSearchQuery("");
      }
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
          <div className="flex flex-col h-full w-full bg-zinc-950 md:bg-white relative z-[260]">
            {/* Step 1 Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 md:border-zinc-200 bg-zinc-900/50 md:bg-zinc-50/80 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-900/25">
                  <Video className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h2 className="text-lg font-bold text-white md:text-zinc-900">Record Video Review</h2>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500/20 md:bg-blue-100 text-blue-400 md:text-blue-700 font-bold text-[10px] uppercase tracking-wider whitespace-nowrap">
                        Step 1 of 2
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 md:text-zinc-500 font-medium">
                      Rate your experience & proceed to camera
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-zinc-800 md:bg-zinc-200 hover:bg-zinc-700 md:hover:bg-zinc-300 flex items-center justify-center text-zinc-300 md:text-zinc-600 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1 Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              {(errorMessage || errorMsg) && (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-red-900/20 md:bg-red-50 border border-red-800 md:border-red-200 text-red-400 md:text-red-700 text-sm font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{errorMessage || errorMsg}</span>
                </div>
              )}

              {/* Responsive Place Selection */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-100 md:text-zinc-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span>Selected Business</span>
                </label>
                
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-900/10 md:bg-blue-50/50 border border-blue-500/20 md:border-blue-200 shadow-lg md:shadow-sm">
                  <CopoBrandLogo
                    domain={selectedPlace.brandDomain}
                    name={selectedPlace.name}
                    website={selectedPlace.website}
                    logoUrl={selectedPlace.logoUrl || selectedPlace.avatarUrl}
                    bannerUrl={selectedPlace.bannerUrl || selectedPlace.ogImage}
                    className="w-14 h-14 rounded-xl border border-zinc-800 md:border-zinc-200 bg-white overflow-hidden flex items-center justify-center p-1 shrink-0"
                    imageClassName="w-full h-full object-contain rounded-lg"
                    fallbackTextClassName="font-bold text-xl text-zinc-900"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white md:text-zinc-900 text-sm truncate">{formatBusinessName(selectedPlace.name)}</h4>
                    <p className="text-xs text-zinc-400 md:text-zinc-500 truncate">{selectedPlace.brandDomain || selectedPlace.website || selectedPlace.address || selectedPlace.city}</p>
                  </div>
                  <button
                    onClick={() => setSelectedPlace(null)}
                    className="shrink-0 text-xs font-bold text-blue-400 md:text-blue-600 hover:text-blue-300 md:hover:text-blue-700 px-3 py-2 bg-zinc-900 md:bg-white rounded-xl border border-zinc-800 md:border-zinc-200 hover:border-zinc-700 md:hover:border-zinc-300 transition-all cursor-pointer shadow-sm"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Star Rating Section */}
              <div className="p-6 rounded-3xl bg-zinc-900 md:bg-zinc-50 border border-zinc-800 md:border-zinc-200 space-y-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-white md:text-zinc-900">Your Rating</h3>
                    <p className="text-[11px] text-zinc-500 md:text-zinc-500 font-medium">Tap stars to rate your experience</p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-full font-black text-[9px] uppercase tracking-[0.1em] transition-all duration-300 ${
                    rating === 0
                      ? "bg-zinc-800 md:bg-zinc-200 text-zinc-500 md:text-zinc-500 border border-zinc-700 md:border-zinc-300"
                      : "bg-amber-500/20 md:bg-amber-100 text-amber-400 md:text-amber-600 border border-amber-500/30 md:border-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
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
                             : "text-zinc-800 md:text-zinc-300 group-hover:text-zinc-700 md:group-hover:text-zinc-400"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 1 Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 md:border-zinc-200 bg-zinc-900 md:bg-white shrink-0">
              <button
                onClick={() => setSelectedPlace(null)}
                className="px-4 py-2.5 rounded-xl text-zinc-400 md:text-zinc-500 hover:bg-zinc-800 md:hover:bg-zinc-100 font-bold text-sm transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (!selectedPlace) {
                    setErrorMessage("Please select a place or business first.");
                    return;
                  }
                  if (rating === 0) {
                    setErrorMessage("Please select a star rating before proceeding.");
                    return;
                  }
                  setErrorMessage(null);
                  setStep(2);
                  startCamera();
                }}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-900/30 transition-all cursor-pointer flex items-center gap-2 active:scale-95 group"
              >
                <span>Proceed to Camera</span>
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
                    }
                  }}
                  onCanPlay={() => {
                    if (playbackVideoRef.current && !duration) {
                      setDuration(playbackVideoRef.current.duration || 0);
                    }
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => {
                    setIsPlaying(false);
                    setCurrentTime(0);
                  }}
                  onClick={togglePlay}
                >
                  <source src={recordedVideoUrl} type={recordedVideoBlob?.type || "video/mp4"} />
                  <source src={recordedVideoUrl} type="video/webm" />
                </video>

                {/* Top Overlay: Place Badge & Close */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-30 pointer-events-none">
                  <div className="flex items-center gap-2 pointer-events-auto">
                    <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white font-bold text-xs flex items-center gap-2.5 shadow-lg">
                      <div className="flex items-center gap-1.5 border-r border-white/10 pr-2.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse hidden sm:block" />
                        <CopoBrandLogo
                          domain={selectedPlace?.brandDomain}
                          name={selectedPlace?.name}
                          website={selectedPlace?.website}
                          logoUrl={selectedPlace?.logoUrl || selectedPlace?.avatarUrl}
                          bannerUrl={selectedPlace?.bannerUrl || selectedPlace?.ogImage}
                          className="w-6 h-6 rounded-md bg-white border border-white/20 overflow-hidden flex items-center justify-center shrink-0 p-0.5 shadow-sm"
                          imageClassName="w-full h-full object-contain rounded-[3px]"
                          fallbackTextClassName="font-extrabold text-[10px] text-white"
                        />
                        <span className="truncate max-w-[140px] sm:max-w-[200px] tracking-tight">{formatBusinessName(selectedPlace?.name)}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-amber-400 font-black">{rating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pointer-events-auto">
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center hover:bg-black transition-all cursor-pointer active:scale-95 shadow-2xl"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Center Big Play / Pause Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-25">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-[#1a73e8] text-white flex items-center justify-center shadow-2xl transition-all pointer-events-auto cursor-pointer border-2 border-white/30 hover:scale-110 active:scale-90 ${
                      isPlaying ? "opacity-0 hover:opacity-80" : "opacity-100 scale-100"
                    }`}
                    title={isPlaying ? "Pause" : "Play Recording"}
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 fill-white" />
                    ) : (
                      <Play className="w-8 h-8 fill-white ml-1" />
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
                      className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#1a73e8]"
                    />
                  </div>

                  {/* Time & Sound row */}
                  <div className="flex items-center justify-between text-white text-xs px-1">
                    <div className="flex items-center gap-2 font-mono text-zinc-300">
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
                    <div className="w-full space-y-1.5 bg-black/60 p-3 rounded-2xl border border-white/10">
                      <div className="flex justify-between text-xs font-bold text-white">
                        <span className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                          Publishing authentic review...
                        </span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
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
                      <span>Re-record</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePublish}
                      disabled={isPublishing || (!recordedVideoBlob && !recordedVideoUrl)}
                      className={`flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#1a73e8] to-[#1557b0] hover:from-[#1557b0] hover:to-[#0d47a1] text-white font-bold text-sm shadow-xl shadow-blue-500/30 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                        isPublishing ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    >
                      {isPublishing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Publishing live...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>Publish Video Review</span>
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
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-30 pointer-events-none">
                  {/* Left: Place Info Pill - Clean Premium */}
                  <div className="flex items-center gap-2 pointer-events-auto">
                    <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white text-xs font-bold flex items-center gap-2.5 shadow-2xl">
                      <div className="flex items-center gap-1.5 border-r border-white/10 pr-2.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse hidden sm:block" />
                        <CopoBrandLogo
                          domain={selectedPlace?.brandDomain}
                          name={selectedPlace?.name}
                          website={selectedPlace?.website}
                          logoUrl={selectedPlace?.logoUrl || selectedPlace?.avatarUrl}
                          bannerUrl={selectedPlace?.bannerUrl || selectedPlace?.ogImage}
                          className="w-6 h-6 rounded-md bg-white border border-white/20 overflow-hidden flex items-center justify-center shrink-0 p-0.5 shadow-sm"
                          imageClassName="w-full h-full object-contain rounded-[3px]"
                          fallbackTextClassName="font-extrabold text-[10px] text-white"
                        />
                        <span className="uppercase tracking-tighter opacity-80">Live</span>
                      </div>
                      <span className="truncate max-w-[140px] sm:max-w-[220px] tracking-tight">{formatBusinessName(selectedPlace?.name)}</span>
                      <div className="flex items-center gap-1 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-amber-400 font-black">{rating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Close Only */}
                  <div className="flex items-center gap-2 pointer-events-auto">
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center hover:bg-black/80 transition-all cursor-pointer shadow-lg active:scale-95"
                      title="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Center Audio Speech Waiting Screen ("Speak to Start Recording") */}
                {isWaitingForVoice && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-40 flex flex-col items-center justify-center text-white p-6 text-center animate-fadeIn select-none">
                    {/* Pulsating Microphone Soundwave Ring */}
                    <div className="relative flex items-center justify-center mb-6">
                      {/* Dynamic Ambient Audio Ring */}
                      <div
                        className="absolute rounded-full border-2 border-emerald-400/40 transition-all duration-75"
                        style={{
                          width: `${100 + micVolumeLevel * 1.5}px`,
                          height: `${100 + micVolumeLevel * 1.5}px`,
                          opacity: 0.3 + (micVolumeLevel / 100) * 0.7
                        }}
                      />
                      <div
                        className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 shadow-2xl animate-pulse"
                      >
                        <Mic className="w-10 h-10" />
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold font-display tracking-tight text-white mb-2">
                      Speak now to start recording...
                    </h3>
                    <p className="text-sm text-zinc-300 max-w-xs mb-6 leading-relaxed">
                      Say anything about your experience at <span className="text-emerald-300 font-bold">{formatBusinessName(selectedPlace?.name)}</span> to automatically begin recording!
                    </p>

                    {/* Speech Volume Live Meter */}
                    <div className="w-52 h-2.5 bg-white/20 rounded-full overflow-hidden mb-6">
                      <div
                        className="h-full bg-emerald-400 transition-all duration-75 rounded-full"
                        style={{ width: `${Math.max(5, micVolumeLevel)}%` }}
                      />
                    </div>

                    
                  </div>
                )}

                {/* 3..2..1 Countdown Overlay */}
                {countdown !== null && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-40 animate-fadeIn select-none">
                    <p className="text-white font-bold text-sm uppercase tracking-widest mb-3">Get Ready!</p>
                    <div className="w-24 h-24 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-5xl font-black shadow-2xl animate-bounce">
                      {countdown}
                    </div>
                  </div>
                )}

                {/* Face Missing Warning Alert Banner */}
                {faceWarning && (
                  <div className="absolute top-20 inset-x-4 z-35 flex justify-center pointer-events-none animate-fadeIn">
                    <div className="px-4 py-2.5 rounded-2xl bg-red-600/90 backdrop-blur-md border border-red-300/40 text-white text-xs font-bold flex items-center gap-2 shadow-2xl text-center max-w-md">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-200" />
                      <span>{faceWarning}</span>
                    </div>
                  </div>
                )}

                {/* Camera Inactive Placeholder */}
                {!cameraActive && !recordedVideoUrl && countdown === null && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-black z-20">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-bold tracking-wide">Starting secure camera...</p>
                    </div>
                  </div>
                )}

                {/* Bottom Camera Controls Bar (When NOT recording) */}
                {cameraActive && !isRecording && !recordedVideoUrl && countdown === null && !isWaitingForVoice && (
                  <div className="absolute bottom-10 inset-x-0 flex flex-col items-center justify-center z-30 pointer-events-auto gap-5">
                    {/* Simplified: Only Big Shutter Record Button */}
                    <button
                      type="button"
                      onClick={handleTriggerCountdown}
                      className="w-22 h-22 rounded-full border-[6px] border-white/30 p-1.5 flex items-center justify-center bg-transparent transition-all active:scale-90 cursor-pointer group"
                      title="Tap to start recording"
                    >
                      <div className="w-full h-full rounded-full bg-red-600 flex items-center justify-center shadow-2xl group-hover:bg-red-700 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30" />
                      </div>
                    </button>

                    <span className="text-[12px] font-bold text-white tracking-wide drop-shadow-md uppercase opacity-90">
                      Tap to record review
                    </span>
                  </div>
                )}

                {/* Active Recording State Bar with 60-Second Radial Progress */}
                {isRecording && (
                  <div className="absolute bottom-8 inset-x-0 flex flex-col items-center gap-4 z-30 pointer-events-auto">
                    {/* Live REC Timer badge */}
                    <div className="bg-red-600/90 backdrop-blur-md text-white px-4 py-1.5 rounded-full font-bold text-xs tracking-wider shadow-2xl border border-red-400 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                      <span>REC {recordingTime < 10 ? `00:0${recordingTime}` : `00:${recordingTime}`} / 01:00</span>
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
                        type="button"
                        onClick={handleStopRecording}
                        className="absolute w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-2xl transition-transform active:scale-90 cursor-pointer flex items-center justify-center"
                        title="Stop Recording"
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
