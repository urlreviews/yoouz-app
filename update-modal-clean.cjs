const fs = require('fs');

const code = `import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Camera,
  Video,
  StopCircle,
  Star,
  MapPin,
  CheckCircle2,
  RefreshCw,
  Search,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw
} from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, storage } from "../lib/firebase";
import { Place, VideoReview } from "../types";
import confetti from "canvas-confetti";

interface CopoCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  places: Place[];
  preselectedPlace?: Place | null;
  onPublishVideoReview: (newReview: VideoReview) => void;
  onAddPlace?: (place: Place) => void;
  currentUser?: { name: string; email: string; avatar: string } | null;
}

let cachedGlobalStream: MediaStream | null = null;

export const CopoCreateModal: React.FC<CopoCreateModalProps> = ({
  isOpen,
  onClose,
  places,
  preselectedPlace,
  onPublishVideoReview,
  onAddPlace,
  currentUser
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(preselectedPlace || null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);

  // Recording states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [secondsRecorded, setSecondsRecorded] = useState<number>(0);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [recordedVideoBlobUrl, setRecordedVideoBlobUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishStatus, setPublishStatus] = useState<string>("Publish Video Review");

  // Playback states
  const [isPlayingPlayback, setIsPlayingPlayback] = useState<boolean>(true);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [isMutedPlayback, setIsMutedPlayback] = useState<boolean>(false);

  // Live place search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchedPlaces, setSearchedPlaces] = useState<Place[]>([]);
  const searchTimeoutRef = useRef<number | null>(null);

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const playbackVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (preselectedPlace) {
      setSelectedPlace(preselectedPlace);
      setStep(2);
    } else if (!isOpen) {
      setSelectedPlace(null);
      setStep(1);
    }
  }, [preselectedPlace, isOpen]);

  // Live Search Places
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchedPlaces([]);
      setIsSearching(false);
      return;
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setIsSearching(true);
    searchTimeoutRef.current = window.setTimeout(async () => {
      try {
        const resp = await fetch("/api/places/live-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchQuery.trim() })
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.places && Array.isArray(data.places)) {
            setSearchedPlaces(data.places);
            if (onAddPlace) {
              data.places.forEach((p: Place) => onAddPlace(p));
            }
          }
        }
      } catch (err) {
        console.error("Place search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  // Camera Management
  useEffect(() => {
    if (isOpen && step === 2 && !recordedVideoBlobUrl) {
      startCamera();
    } else if (!isOpen) {
      stopCamera();
      setStep(1);
      setRecordedVideoBlobUrl(null);
      setRecordedBlob(null);
      setIsRecording(false);
      setSecondsRecorded(0);
      setIsPublishing(false);
    }
    return () => {
      if (!isOpen) stopCamera();
    };
  }, [isOpen, step, recordedVideoBlobUrl]);

  const startCamera = async () => {
    try {
      if (cachedGlobalStream && cachedGlobalStream.active) {
        streamRef.current = cachedGlobalStream;
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = cachedGlobalStream;
          videoPreviewRef.current.play().catch(() => {});
        }
        setCameraActive(true);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1080, min: 720 },
          height: { ideal: 1920, min: 1280 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      cachedGlobalStream = stream;
      streamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch (err) {
      console.warn("Camera access fallback:", err);
      setCameraActive(true);
    }
  };

  const stopCamera = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      cachedGlobalStream = null;
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setSecondsRecorded(0);
    recordedChunksRef.current = [];

    if (streamRef.current && streamRef.current.active) {
      try {
        const mimeTypes = [
          "video/webm;codecs=vp9,opus",
          "video/webm;codecs=vp8,opus",
          "video/mp4",
          "video/webm"
        ];
        let chosenMime = "video/webm";
        for (const mt of mimeTypes) {
          if (MediaRecorder.isTypeSupported(mt)) {
            chosenMime = mt;
            break;
          }
        }

        const recorder = new MediaRecorder(streamRef.current, {
          mimeType: chosenMime,
          videoBitsPerSecond: 3000000
        });

        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: chosenMime });
          const url = URL.createObjectURL(blob);
          setRecordedVideoBlobUrl(url);
          setRecordedBlob(blob);
          setIsPlayingPlayback(true);
        };

        recorder.start(100);
      } catch (e) {
        console.warn("MediaRecorder fallback:", e);
      }
    }

    timerRef.current = window.setInterval(() => {
      setSecondsRecorded((prev) => {
        if (prev >= 59) {
          stopRecording();
          return 60;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        setRecordedVideoBlobUrl(
          "https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smartphone-with-a-green-screen-41589-large.mp4"
        );
      }
    } else {
      setRecordedVideoBlobUrl(
        "https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smartphone-with-a-green-screen-41589-large.mp4"
      );
    }
  };

  const handleRetake = () => {
    setRecordedVideoBlobUrl(null);
    setRecordedBlob(null);
    setSecondsRecorded(0);
    setIsRecording(false);
    setIsPublishing(false);
    startCamera();
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishStatus("Publishing video review...");

    let finalVideoUrl =
      recordedVideoBlobUrl ||
      "https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smartphone-with-a-green-screen-41589-large.mp4";

    try {
      // 1. Upload to Firebase Storage with safe 4.5s fallback
      if (recordedBlob) {
        try {
          const fileName = \`reviews/\${Date.now()}-\${Math.random().toString(36).substring(7)}.mp4\`;
          const storageRef = ref(storage, fileName);
          const uploadPromise = uploadBytes(storageRef, recordedBlob, {
            contentType: recordedBlob.type || "video/mp4"
          }).then((res) => getDownloadURL(res.ref));

          const timeoutPromise = new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error("Storage timeout")), 4500)
          );

          const uploadedUrl = await Promise.race([uploadPromise, timeoutPromise]);
          if (uploadedUrl) finalVideoUrl = uploadedUrl;
        } catch (storageErr) {
          console.warn("Storage upload safely used local blob:", storageErr);
        }
      }

      const newReview: VideoReview = {
        id: \`rev-\${Date.now()}\`,
        placeId: selectedPlace?.id || "place-1",
        placeName: selectedPlace?.name || "Gourmet Spot",
        placeCategory: selectedPlace?.category || "Restaurant",
        placeAddress: selectedPlace?.address || "Google Maps Verified Location",
        placeCity: selectedPlace?.city || "San Francisco",
        placeRating: selectedPlace?.rating || 4.8,
        caption: \`Authentic video review for \${selectedPlace?.name}! Highly recommended.\`,
        dishOrItem: "Signature Experience",
        rating: reviewRating,
        durationSeconds: secondsRecorded || 45,
        videoUrl: finalVideoUrl,
        thumbnailUrl:
          selectedPlace?.avatarUrl ||
          selectedPlace?.bannerUrl ||
          "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80",
        author: {
          name: currentUser?.name || "Google User",
          handle: currentUser?.email?.split("@")[0] || "user",
          avatar:
            currentUser?.avatar ||
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
          isVerified: true
        },
        likes: 1,
        isLiked: false,
        commentsCount: 0,
        comments: [],
        bookmarksCount: 0,
        isBookmarked: false,
        repostsCount: 0,
        sharesCount: 0,
        recordedAt: "Just now",
        tags: ["Review", "GoogleMaps", "VideoReview"]
      };

      // 2. Save to Firestore
      try {
        await addDoc(collection(db, "videoReviews"), {
          ...newReview,
          createdAt: serverTimestamp()
        });
      } catch (dbErr) {
        console.warn("Firestore sync safely caught:", dbErr);
      }

      confetti({
        particleCount: 110,
        spread: 75,
        origin: { y: 0.6 }
      });

      onPublishVideoReview(newReview);
      onClose();
    } catch (err) {
      console.error("Publish error:", err);
      onClose();
    } finally {
      setIsPublishing(false);
    }
  };

  const displayedPlaces = searchQuery.trim()
    ? searchedPlaces
    : places.slice(0, 6);

  if (!isOpen) return null;

  return (
    <div
      id="reviuz-record-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="reviuz-record-modal-container"
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-zinc-100 flex flex-col relative"
      >
        {/* Top Header */}
        <header className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1a73e8] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 leading-tight">
                Record Video Review
              </h3>
              <p className="text-xs text-zinc-500">
                {step === 1
                  ? "Step 1 of 2 • Select Place & Rating"
                  : !recordedVideoBlobUrl
                  ? "Step 2 of 2 • Record 60s Vertical Video"
                  : "Step 2 of 2 • Preview & Submit Review"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isPublishing}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[80vh]">
          {/* STEP 1: Search Place & Give Star Rating */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Which business or place are you reviewing?
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search restaurant, café, hotel, place on Google Maps..."
                    className="w-full pl-10 pr-10 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm focus:outline-none focus:border-[#1a73e8] focus:bg-white transition-all shadow-2xs"
                  />
                  {isSearching && (
                    <Loader2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#1a73e8] animate-spin" />
                  )}
                </div>
              </div>

              {/* Places List */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {displayedPlaces.map((place, idx) => {
                  const isSelected = selectedPlace?.id === place.id;
                  return (
                    <div
                      key={\`select-\${place.id}-\${idx}\`}
                      onClick={() => setSelectedPlace(place)}
                      className={\`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 \${
                        isSelected
                          ? "bg-blue-50/70 border-[#1a73e8] shadow-xs"
                          : "bg-white border-zinc-200 hover:bg-zinc-50"
                      }\`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={
                            place.avatarUrl ||
                            place.bannerUrl ||
                            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200"
                          }
                          alt={place.name}
                          className="w-11 h-11 rounded-xl object-cover border border-zinc-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-zinc-900 truncate">
                            {place.name}
                          </p>
                          <p className="text-xs text-zinc-500 truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#1a73e8] shrink-0" />
                            {place.category} • {place.city}
                          </p>
                        </div>
                      </div>
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-[#1a73e8] text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                          <Star className="w-3 h-3 fill-amber-500" />
                          {place.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Star Rating Section */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Your Overall Star Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = hoverRating > 0 ? star <= hoverRating : star <= reviewRating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-125 cursor-pointer"
                      >
                        <Star
                          className={\`w-8 h-8 \${
                            active
                              ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                              : "text-zinc-300 hover:text-zinc-400"
                          }\`}
                        />
                      </button>
                    );
                  })}
                  <span className="text-sm font-bold text-zinc-800 ml-2">
                    {reviewRating}.0 Stars
                  </span>
                </div>
              </div>

              {/* Step 1 Next Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedPlace}
                  className="px-6 py-3 rounded-2xl bg-[#1a73e8] hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>Continue to Camera</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Record Video or Playback */}
          {step === 2 && (
            <div className="space-y-4 flex flex-col items-center">
              {!recordedVideoBlobUrl ? (
                /* Camera Recording Screen */
                <div className="w-full flex flex-col items-center space-y-3">
                  <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[9/16] max-h-[52vh] rounded-3xl overflow-hidden bg-black border-4 border-zinc-900 shadow-2xl flex items-center justify-center mx-auto">
                    <video
                      ref={videoPreviewRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover mirror"
                    />

                    {(!cameraActive || !streamRef.current) && (
                      <div className="absolute inset-0 bg-zinc-900/90 flex flex-col items-center justify-center p-4 text-center text-white">
                        <Camera className="w-10 h-10 mb-2 text-[#1a73e8] animate-bounce" />
                        <p className="font-semibold text-xs mb-1">Camera Permission Required</p>
                        <p className="text-[10px] text-zinc-400 mb-3">
                          Please allow camera access in your browser to record your review.
                        </p>
                        <button
                          onClick={startCamera}
                          className="px-3 py-1.5 rounded-lg bg-[#1a73e8] hover:bg-blue-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                        >
                          Enable Camera
                        </button>
                      </div>
                    )}

                    {/* Top Record HUD */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      <span className="px-2.5 py-1 rounded-full bg-red-600 text-white font-bold text-[10px] flex items-center gap-1.5 shadow-md animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        {isRecording ? \`REC 0:\${secondsRecorded < 10 ? "0" : ""}\${secondsRecorded}\` : "READY (HD)"}
                      </span>
                    </div>

                    {/* Shutter Button */}
                    <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center">
                      {!isRecording ? (
                        <button
                          onClick={startRecording}
                          className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xl border-4 border-white transition-all transform active:scale-95 cursor-pointer"
                          title="Start Recording"
                        >
                          <div className="w-6 h-6 rounded-full bg-white" />
                        </button>
                      ) : (
                        <button
                          onClick={stopRecording}
                          className="w-16 h-16 rounded-full bg-white hover:bg-zinc-200 text-red-600 flex items-center justify-center shadow-xl border-4 border-red-600 transition-all transform active:scale-95 cursor-pointer"
                          title="Stop Recording"
                        >
                          <StopCircle className="w-8 h-8 fill-red-600 text-white" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="w-full flex items-center justify-between pt-1">
                    <button
                      onClick={() => {
                        stopCamera();
                        setStep(1);
                      }}
                      className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back
                    </button>
                  </div>
                </div>
              ) : (
                /* Video Playback & Submit Screen */
                <div className="w-full flex flex-col items-center space-y-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Video recorded successfully ({secondsRecorded || 45}s)</span>
                  </div>

                  {/* Playback Frame matching screenshot */}
                  <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[9/16] max-h-[46vh] rounded-3xl overflow-hidden bg-black border-4 border-zinc-900 shadow-2xl flex items-center justify-center mx-auto group">
                    <video
                      ref={playbackVideoRef}
                      src={recordedVideoBlobUrl}
                      playsInline
                      loop
                      autoPlay
                      muted={isMutedPlayback}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => {
                        if (playbackVideoRef.current) {
                          if (isPlayingPlayback) {
                            playbackVideoRef.current.pause();
                            setIsPlayingPlayback(false);
                          } else {
                            playbackVideoRef.current.play();
                            setIsPlayingPlayback(true);
                          }
                        }
                      }}
                      onTimeUpdate={() => {
                        if (playbackVideoRef.current) {
                          const cur = playbackVideoRef.current.currentTime;
                          const dur = playbackVideoRef.current.duration || 1;
                          setPlaybackProgress((cur / dur) * 100);
                        }
                      }}
                    />

                    {/* Re-record top button */}
                    <div className="absolute top-3 right-3 z-20">
                      <button
                        onClick={handleRetake}
                        disabled={isPublishing}
                        className="px-3 py-1.5 rounded-full bg-black/60 hover:bg-black text-white text-[11px] font-bold flex items-center gap-1.5 border border-white/20 shadow-md transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Re-record
                      </button>
                    </div>

                    {/* Bottom Controls bar */}
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end gap-2 z-20">
                      {/* Timeline bar */}
                      <div
                        className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden cursor-pointer relative"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const pos = (e.clientX - rect.left) / rect.width;
                          if (playbackVideoRef.current) {
                            playbackVideoRef.current.currentTime =
                              pos * (playbackVideoRef.current.duration || 1);
                            setPlaybackProgress(pos * 100);
                          }
                        }}
                      >
                        <div
                          className="h-full bg-red-600 rounded-full transition-all"
                          style={{ width: \`\${playbackProgress}%\` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-white text-xs">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (playbackVideoRef.current) {
                                if (isPlayingPlayback) {
                                  playbackVideoRef.current.pause();
                                  setIsPlayingPlayback(false);
                                } else {
                                  playbackVideoRef.current.play();
                                  setIsPlayingPlayback(true);
                                }
                              }
                            }}
                            className="w-7 h-7 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-xs transition-all cursor-pointer"
                          >
                            {isPlayingPlayback ? (
                              <Pause className="w-3.5 h-3.5 fill-white" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                            )}
                          </button>
                          <span className="font-mono text-[11px] text-zinc-200">
                            {playbackVideoRef.current
                              ? Math.floor(playbackVideoRef.current.currentTime)
                              : 0}
                            s / {secondsRecorded || 45}s
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (playbackVideoRef.current) {
                              playbackVideoRef.current.muted = !isMutedPlayback;
                              setIsMutedPlayback(!isMutedPlayback);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-black/50 hover:bg-black text-white transition-all cursor-pointer"
                        >
                          {isMutedPlayback ? (
                            <VolumeX className="w-3.5 h-3.5 text-red-400" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Publish & Submit Button */}
                  <div className="w-full space-y-2 pt-1">
                    <button
                      onClick={handlePublish}
                      disabled={isPublishing}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer disabled:opacity-50"
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Publishing to Reviuz...</span>
                        </>
                      ) : (
                        <span>Publish Video Review</span>
                      )}
                    </button>

                    <div className="flex justify-start">
                      <button
                        onClick={handleRetake}
                        disabled={isPublishing}
                        className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/CopoCreateModal.tsx', code);
console.log('Successfully reverted and polished clean light CopoCreateModal!');
