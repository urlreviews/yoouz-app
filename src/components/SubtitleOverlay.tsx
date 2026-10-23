import React, { useMemo, useRef, useEffect, useState } from 'react';
import { getWordPhoneticWeight, splitWordsIntoSingleLineChunks, alignBunnyCuesWithHardwareSilences } from '../utils/subtitleSync';

interface SubtitleCue {
  id: number;
  start: number;
  end: number;
  text: string;
  words?: { text: string; start: number; end: number }[];
}

interface SubtitleOverlayProps {
  currentTime?: number;
  segments?: any[];
  transcriptText?: string;
  duration?: number;
  isActive?: boolean;
  isLiveRecording?: boolean;
  slotId?: string;
  videoElement?: HTMLVideoElement | null;
}

/**
 * Filter out generic placeholder titles that are not real spoken speech
 */
const isIgnoredTitle = (text: string): boolean => {
  if (!text) return true;
  const lower = text.trim().toLowerCase();
  return (
    lower.startsWith('video review for') ||
    lower.startsWith('review for') ||
    lower.startsWith('video review of') ||
    lower === 'video review' ||
    lower.startsWith('video review')
  );
};

/**
 * Hardware-Locked Bunny Stream Smart Captions Overlay (9:16 Mobile & Desktop)
 */
export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  currentTime = 0,
  segments,
  transcriptText,
  duration = 15,
  isActive = false,
  isLiveRecording = false,
  slotId,
  videoElement
}) => {
  const cues = useMemo<SubtitleCue[]>(() => {
    let rawList: any[] = [];
    if (Array.isArray(segments) && segments.length > 0) {
      rawList = segments;
    } else if (typeof segments === 'string') {
      try {
        const parsed = JSON.parse(segments);
        if (Array.isArray(parsed)) rawList = parsed;
      } catch (e) {}
    }

    const cleanCues: SubtitleCue[] = [];
    let cueId = 1;

    if (rawList.length > 0) {
      for (const item of rawList) {
        const txt = String(item?.text || item?.transcript || '').replace(/\s+/g, ' ').trim();
        if (!txt || isIgnoredTitle(txt)) continue;

        const s = typeof item?.start === 'number' && !isNaN(item.start) ? Math.max(0, item.start) : -1;
        const e = typeof item?.end === 'number' && !isNaN(item.end) ? Math.max(s + 0.3, item.end) : -1;

        if (s >= 0 && e >= s) {
          // If the segment is already a clean 1-2 line phrase (<= 48 chars), preserve its exact hardware timestamps untouched!
          if (txt.length <= 48) {
            cleanCues.push({
              id: cueId++,
              start: Math.round(s * 100) / 100,
              end: Math.round(e * 100) / 100,
              text: txt
            });
          } else {
            // Only if an unsplit raw long cue (>48 chars) arrives directly, split into natural clauses
            const aligned = alignBunnyCuesWithHardwareSilences([{ start: s, end: e, text: txt }], []);
            for (const ac of aligned) {
              cleanCues.push({
                id: cueId++,
                start: ac.start,
                end: ac.end,
                text: ac.text
              });
            }
          }
        } else {
          cleanCues.push({
            id: cueId++,
            start: s >= 0 ? s : (cueId - 1) * 2.5,
            end: e >= s ? e : (s >= 0 ? s + 2.5 : cueId * 2.5),
            text: txt
          });
        }
      }
    }

    // Fallback when only raw transcriptText is present
    if (cleanCues.length === 0 && transcriptText && transcriptText.trim()) {
      const clean = transcriptText.trim();
      if (!isIgnoredTitle(clean)) {
        const videoDur = duration && duration > 2 ? duration : 15;
        const aligned = alignBunnyCuesWithHardwareSilences(
          [{ start: 0.3, end: Math.max(1.5, videoDur - 0.3), text: clean }],
          []
        );
        for (const ac of aligned) {
          cleanCues.push({
            id: cueId++,
            start: ac.start,
            end: ac.end,
            text: ac.text
          });
        }
      }
    }

    cleanCues.sort((a, b) => a.start - b.start);

    // Ensure non-overlapping monotonic progression without altering hardware pause gaps
    const deduplicatedCues: SubtitleCue[] = [];
    for (const cue of cleanCues) {
      if (deduplicatedCues.length === 0) {
        deduplicatedCues.push({ ...cue });
      } else {
        const last = deduplicatedCues[deduplicatedCues.length - 1];
        if (Math.abs(cue.start - last.start) <= 0.04 && cue.text.toLowerCase() === last.text.toLowerCase()) {
          last.end = Math.max(last.end, cue.end);
          continue;
        }
        if (cue.start < last.end) {
          last.end = cue.start;
        }
        if (cue.end > cue.start + 0.05) {
          deduplicatedCues.push({ ...cue });
        }
      }
    }

    return deduplicatedCues;
  }, [segments, transcriptText, duration]);

  // 🎯 High-frequency 60fps hardware clock + event listener on the active video element for zero-jitter lockstep sync on all devices
  const [exactCurrentTime, setExactCurrentTime] = useState<number>(() => currentTime || 0);
  const lastReportedTimeRef = useRef<number>(currentTime || 0);

  // Instantly sync when CopoVideoPlayer passes updated time
  useEffect(() => {
    if (typeof currentTime === 'number' && !isNaN(currentTime)) {
      if (Math.abs(currentTime - lastReportedTimeRef.current) >= 0.015) {
        lastReportedTimeRef.current = currentTime;
        setExactCurrentTime(currentTime);
      }
    }
  }, [currentTime]);

  useEffect(() => {
    if (!isActive || isLiveRecording) return;

    const findTargetVideo = (): HTMLVideoElement | null => {
      if (videoElement) return videoElement;
      if (slotId) {
        const slotEl = document.getElementById(slotId);
        const vidInSlot = slotEl?.querySelector('video');
        if (vidInSlot) return vidInSlot;
      }
      const feedVideos = Array.from(document.querySelectorAll<HTMLVideoElement>('video[id^="copo-feed-video-"], video.copo-video-feed-element'));
      const playing = feedVideos.find(v => !v.paused && v.currentTime > 0);
      return playing || feedVideos[0] || null;
    };

    let targetVid = findTargetVideo();
    let rafId: number | null = null;

    const syncTimeFromHardware = () => {
      if (!targetVid || !targetVid.isConnected) {
        targetVid = findTargetVideo();
      }
      if (targetVid && typeof targetVid.currentTime === 'number' && !isNaN(targetVid.currentTime)) {
        const t = targetVid.currentTime;
        if (Math.abs(t - lastReportedTimeRef.current) >= 0.015) {
          lastReportedTimeRef.current = t;
          setExactCurrentTime(t);
        }
      }
    };

    const tick = () => {
      syncTimeFromHardware();
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    const attachListeners = (vid: HTMLVideoElement) => {
      vid.addEventListener('timeupdate', syncTimeFromHardware, { passive: true });
      vid.addEventListener('seeking', syncTimeFromHardware, { passive: true });
      vid.addEventListener('seeked', syncTimeFromHardware, { passive: true });
      vid.addEventListener('play', syncTimeFromHardware, { passive: true });
      vid.addEventListener('pause', syncTimeFromHardware, { passive: true });
    };

    const detachListeners = (vid: HTMLVideoElement) => {
      vid.removeEventListener('timeupdate', syncTimeFromHardware);
      vid.removeEventListener('seeking', syncTimeFromHardware);
      vid.removeEventListener('seeked', syncTimeFromHardware);
      vid.removeEventListener('play', syncTimeFromHardware);
      vid.removeEventListener('pause', syncTimeFromHardware);
    };

    if (targetVid) {
      attachListeners(targetVid);
    }

    const interval = setInterval(() => {
      if (!targetVid || !targetVid.isConnected) {
        const nextVid = findTargetVideo();
        if (nextVid) {
          if (targetVid) detachListeners(targetVid);
          targetVid = nextVid;
          attachListeners(targetVid);
          syncTimeFromHardware();
        }
      }
    }, 300);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      clearInterval(interval);
      if (targetVid) {
        detachListeners(targetVid);
      }
    };
  }, [isActive, isLiveRecording, slotId, videoElement]);

  const effectiveTime = isLiveRecording ? (currentTime || 0) : exactCurrentTime;

  // Match active cue directly against hardware-aligned [cue.start, cue.end] boundaries
  // Silence gaps between cues remain genuinely blank so subtitles never linger while speaker is silent
  const activeCue = useMemo<SubtitleCue | null>(() => {
    if (!isActive || cues.length === 0) return null;
    if (isLiveRecording) return cues[cues.length - 1] || null;

    for (let i = 0; i < cues.length; i++) {
      const cue = cues[i];
      if (effectiveTime >= cue.start && effectiveTime <= cue.end) {
        return cue;
      }
    }
    return null;
  }, [cues, effectiveTime, isActive, isLiveRecording]);

  const isRTL = useMemo(() => {
    const txt = activeCue?.text;
    if (!txt) return false;
    return /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(txt);
  }, [activeCue]);

  const isVisible = Boolean(isActive && activeCue && activeCue.text);
  const currentText = activeCue?.text || null;

  if (!isActive && !isVisible) return null;

  return (
    <div className="absolute bottom-[265px] xs:bottom-[275px] sm:bottom-[195px] md:bottom-[205px] left-0 right-0 flex justify-center pr-14 md:pr-4 pl-4 pointer-events-none z-[48] select-none transition-all duration-200">
      <div 
        className={`max-w-[88%] sm:max-w-[84%] flex justify-center transition-opacity duration-150 ease-out ${
          isVisible && currentText ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          dir={isRTL ? 'rtl' : 'ltr'}
          className="bg-black/85 backdrop-blur-md px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.7)] text-center flex items-center justify-center max-w-full"
        >
          <p className="text-[13px] xs:text-[13.5px] sm:text-[14px] font-bold tracking-tight text-center leading-[1.3] text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] max-w-full text-balance">
            {currentText || ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export const buildSegmentsFromTranscript = (_text?: string, _duration?: number): any[] => [];
