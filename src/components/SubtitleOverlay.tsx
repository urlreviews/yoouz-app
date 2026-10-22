import React, { useMemo, useRef, useEffect, useState } from 'react';
import { getWordPhoneticWeight, splitWordsIntoSingleLineChunks, buildSingleLineSegments, formatCueToMaxTwoLines } from '../utils/subtitleSync';

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
 * Helper to split a longer subtitle cue into short 3-4 word 1-line phrase chunks with acoustic phonetic timing.
 * Guarantees that subtitles stay on 1 clean line and advance smoothly in sync with spoken audio.
 */
const chunkCueTo1Line = (
  start: number,
  end: number,
  text: string,
  maxWordsPerChunk = 4
): { start: number; end: number; text: string }[] => {
  const cleanText = text.trim();
  if (!cleanText) return [];

  const words = cleanText.split(/\s+/).filter(Boolean);
  if (words.length <= maxWordsPerChunk && cleanText.length <= 28) {
    return [{ start, end, text: cleanText }];
  }

  const wordGroups = splitWordsIntoSingleLineChunks(words, maxWordsPerChunk, 28);
  if (wordGroups.length === 0) return [];

  const totalDuration = Math.max(0.6, end - start);
  const groupWeights = wordGroups.map(group =>
    group.reduce((acc, w) => acc + getWordPhoneticWeight(w), 0)
  );
  const totalWeight = groupWeights.reduce((a, b) => a + b, 0);

  const chunks: { start: number; end: number; text: string }[] = [];
  let currentStart = start;

  for (let idx = 0; idx < wordGroups.length; idx++) {
    const group = wordGroups[idx];
    const groupText = group.join(' ');
    const groupWeight = groupWeights[idx];
    const groupDuration = totalWeight > 0 ? totalDuration * (groupWeight / totalWeight) : totalDuration / wordGroups.length;

    const groupEnd = idx === wordGroups.length - 1
      ? end
      : Math.round((currentStart + groupDuration) * 100) / 100;

    chunks.push({
      start: Math.round(currentStart * 100) / 100,
      end: Math.max(currentStart + 0.3, groupEnd),
      text: groupText
    });

    currentStart = groupEnd;
  }

  return chunks;
};

/**
 * Anti-Blinking, Anti-Flashing Subtitle Engine (1-2 Line CapCut / TikTok Phrase Chunking)
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
  // Parse and build clean 1-2 line phrase subtitle cues with zero-gap bridging
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
        const txt = String(item?.text || item?.transcript || '').trim();
        if (!txt || isIgnoredTitle(txt)) continue;

        const s = typeof item?.start === 'number' && !isNaN(item.start) ? Math.max(0, item.start) : -1;
        const e = typeof item?.end === 'number' && !isNaN(item.end) ? Math.max(s + 0.3, item.end) : -1;

        if (Array.isArray(item.words) && item.words.length > 0) {
          // If word-level timecodes exist, format into clean 1-2 line phrases
          const wordTexts = item.words.map((w: any) => w.text || w.word || '').filter(Boolean);
          const wordChunks = splitWordsIntoSingleLineChunks(wordTexts, 4, 28);
          let wordIdx = 0;
          for (const chunkWords of wordChunks) {
            const chunkItems = item.words.slice(wordIdx, wordIdx + chunkWords.length);
            wordIdx += chunkWords.length;
            if (chunkItems.length > 0) {
              const chunkText = chunkItems.map((w: any) => w.text || w.word).join(" ");
              const chunkStart = chunkItems[0].start;
              const chunkEnd = chunkItems[chunkItems.length - 1].end;
              cleanCues.push({
                id: cueId++,
                start: chunkStart,
                end: Math.max(chunkStart + 0.35, chunkEnd),
                text: chunkText
              });
            }
          }
        } else if (s >= 0 && e >= s) {
          // 🐰 Official Bunny Stream Cue:
          // Format into clean 1 to 2 lines max, splitting at natural punctuation pauses
          // Guarantees zero 3-dots ('...'), 100% audio sync, and 1-2 lines maximum
          const formatted = formatCueToMaxTwoLines(s, e, txt, 68);
          for (const fc of formatted) {
            cleanCues.push({
              id: cueId++,
              start: fc.start,
              end: fc.end,
              text: fc.text
            });
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

    // PATH B: Fallback when only raw transcriptText is present - Distribute evenly across video duration
    if (cleanCues.length === 0 && transcriptText && transcriptText.trim()) {
      const clean = transcriptText.trim();
      if (!isIgnoredTitle(clean)) {
        const words = clean.split(/\s+/).filter(Boolean);
        const videoDur = duration && duration > 2 ? duration : 15;
        
        const wordChunks = splitWordsIntoSingleLineChunks(words, 4, 28);
        const startOffset = 0.2;
        const endOffset = Math.max(startOffset + 1.0, videoDur - 0.2);
        const totalSpan = endOffset - startOffset;
        const chunkDur = totalSpan / wordChunks.length;

        wordChunks.forEach((chunkWords, cIdx) => {
          const cStart = Math.round((startOffset + (cIdx * chunkDur)) * 100) / 100;
          const cEnd = Math.round((startOffset + ((cIdx + 1) * chunkDur)) * 100) / 100;
          cleanCues.push({
            id: cueId++,
            start: cStart,
            end: cEnd,
            text: chunkWords.join(" ")
          });
        });
      }
    }

    // Sort cues strictly by start time
    cleanCues.sort((a, b) => a.start - b.start);

    // 🛡️ STRICT OVERLAP REMOVAL & CUE DEDUPLICATION
    // Ensures subtitles strictly advance forward and NEVER jump backward or restart in the middle
    const deduplicatedCues: SubtitleCue[] = [];
    for (const cue of cleanCues) {
      if (deduplicatedCues.length === 0) {
        deduplicatedCues.push(cue);
      } else {
        const last = deduplicatedCues[deduplicatedCues.length - 1];
        if (cue.start <= last.start + 0.05) {
          // If two cues start at virtually the same time, keep the one with longer/fuller text
          if (cue.text.length > last.text.length) {
            deduplicatedCues[deduplicatedCues.length - 1] = { ...cue, start: last.start, end: Math.max(last.end, cue.end) };
          }
          continue;
        }
        if (cue.start < last.end) {
          if (cue.text === last.text || last.text.includes(cue.text)) {
            last.end = Math.max(last.end, cue.end);
            continue;
          }
          if (cue.text.includes(last.text)) {
            last.text = cue.text;
            last.end = Math.max(last.end, cue.end);
            continue;
          }
          cue.start = last.end;
        }
        if (cue.end > cue.start) {
          deduplicatedCues.push(cue);
        }
      }
    }

    // 🛡️ ANTI-BLINKING MICRO-GAP BRIDGING: Only bridge tiny breath gaps <= 0.15s between consecutive sentences
    for (let i = 0; i < deduplicatedCues.length - 1; i++) {
      const curr = deduplicatedCues[i];
      const next = deduplicatedCues[i + 1];
      if (next.start > curr.end && next.start - curr.end <= 0.15) {
        curr.end = next.start;
      }
    }

    return deduplicatedCues;
  }, [segments, transcriptText, duration]);

  // 🎯 Direct hardware timeupdate event listener on the active video element for precise lockstep sync
  const [exactCurrentTime, setExactCurrentTime] = useState<number>(() => currentTime || 0);

  // Instantly sync when high-frequency 60Hz RAF loop passes updated time from CopoVideoPlayer
  useEffect(() => {
    if (typeof currentTime === 'number' && !isNaN(currentTime)) {
      setExactCurrentTime(currentTime);
    }
  }, [currentTime]);

  useEffect(() => {
    if (!isActive) return;

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

    const syncTimeFromHardware = () => {
      if (!targetVid) {
        targetVid = findTargetVideo();
      }
      if (targetVid && typeof targetVid.currentTime === 'number' && !isNaN(targetVid.currentTime)) {
        setExactCurrentTime(targetVid.currentTime);
      }
    };

    syncTimeFromHardware();

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
      if (!targetVid) {
        targetVid = findTargetVideo();
        if (targetVid) {
          attachListeners(targetVid);
          syncTimeFromHardware();
        }
      }
    }, 400);

    return () => {
      clearInterval(interval);
      if (targetVid) {
        detachListeners(targetVid);
      }
    };
  }, [isActive, slotId, videoElement]);

  const effectiveTime = isLiveRecording ? (currentTime || 0) : exactCurrentTime;

  // Compute active cue in exact lockstep with Bunny Stream audio timecodes
  const activeCue = useMemo<SubtitleCue | null>(() => {
    if (!isActive || cues.length === 0) return null;
    if (isLiveRecording) return cues[cues.length - 1] || null;

    for (let i = 0; i < cues.length; i++) {
      const cue = cues[i];
      // Exact second the speaker talks: active strictly between cue.start and cue.end
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
    <div className="absolute bottom-[200px] xs:bottom-[210px] sm:bottom-[125px] md:bottom-[125px] left-0 right-0 flex justify-center px-4 pointer-events-none z-[48] select-none">
      <div 
        className={`max-w-[92%] sm:max-w-[85%] flex justify-center transition-opacity duration-150 ease-out ${
          isVisible && currentText ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          dir={isRTL ? 'rtl' : 'ltr'}
          className="bg-black/85 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.7)] text-center flex items-center justify-center max-w-full"
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
