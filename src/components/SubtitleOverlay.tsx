import React, { useMemo, useRef, useEffect, useState } from 'react';
import { getWordPhoneticWeight, splitWordsIntoSingleLineChunks } from '../utils/subtitleSync';

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
  if (words.length <= maxWordsPerChunk) {
    return [{ start, end, text: cleanText }];
  }

  const wordGroups = splitWordsIntoSingleLineChunks(words, maxWordsPerChunk);
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
 * Anti-Blinking, Anti-Flashing Subtitle Engine (1-Line CapCut / TikTok Phrase Chunking)
 */
export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  currentTime = 0,
  segments,
  transcriptText,
  duration = 15,
  isActive = false,
  isLiveRecording = false
}) => {
  // Parse and build clean 1-line phrase subtitle cues with zero-gap bridging
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
          const wordTexts = item.words.map((w: any) => w.text || w.word || '').filter(Boolean);
          const wordChunks = splitWordsIntoSingleLineChunks(wordTexts, 4);
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
                end: Math.max(chunkStart + 0.4, chunkEnd),
                text: chunkText
              });
            }
          }
        } else if (s >= 0 && e >= s) {
          cleanCues.push({
            id: cueId++,
            start: s,
            end: e,
            text: txt
          });
        } else {
          const phraseChunks = chunkCueTo1Line(s >= 0 ? s : (cueId - 1) * 2.5, e >= s ? e : s + 2.0, txt, 5);
          for (const chunk of phraseChunks) {
            cleanCues.push({
              id: cueId++,
              start: chunk.start,
              end: chunk.end,
              text: chunk.text
            });
          }
        }
      }
    }

    // PATH B: Fallback when only raw transcriptText is present - Distribute evenly across video duration
    if (cleanCues.length === 0 && transcriptText && transcriptText.trim()) {
      const clean = transcriptText.trim();
      if (!isIgnoredTitle(clean)) {
        const words = clean.split(/\s+/).filter(Boolean);
        const videoDur = duration && duration > 2 ? duration : 15;
        
        const wordChunks = splitWordsIntoSingleLineChunks(words, 4);
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
        if (cue.start <= last.start + 0.3) {
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

    // 🛡️ ANTI-BLINKING GAP BRIDGING:
    // Bridge gaps between consecutive phrase cues so subtitles NEVER unmount or flicker between words
    for (let i = 0; i < deduplicatedCues.length - 1; i++) {
      const curr = deduplicatedCues[i];
      const next = deduplicatedCues[i + 1];
      if (next.start > curr.end && next.start - curr.end <= 3.0) {
        curr.end = next.start; // Seamless transition!
      }
    }

    return deduplicatedCues;
  }, [segments, transcriptText, duration]);

  // Compute active cue with hysteresis hold time to prevent flickering
  const activeCue = useMemo<SubtitleCue | null>(() => {
    if (!isActive || cues.length === 0) return null;
    if (isLiveRecording) return cues[cues.length - 1] || null;

    for (let i = 0; i < cues.length; i++) {
      const cue = cues[i];
      const nextCue = cues[i + 1];
      // Hold cue until next cue starts or up to 1.5s after cue end to prevent mid-speech blinking
      const effectiveEnd = (nextCue && nextCue.start > cue.start) ? Math.min(nextCue.start, cue.end + 1.2) : cue.end + 1.8;
      if (currentTime >= cue.start && currentTime <= effectiveEnd) {
        return cue;
      }
    }
    return null;
  }, [cues, currentTime, isActive, isLiveRecording]);

  // Keep a persistent reference to the active or last display cue to ensure smooth fade-out CSS transitions
  const [displayCue, setDisplayCue] = useState<SubtitleCue | null>(null);
  const fadeTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (activeCue) {
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      setDisplayCue(activeCue);
    } else {
      // Hold last cue for 0.4s before fading out container
      fadeTimeoutRef.current = setTimeout(() => {
        setDisplayCue(null);
      }, 400);
    }
    return () => {
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, [activeCue]);

  const isRTL = useMemo(() => {
    const txt = activeCue?.text || displayCue?.text;
    if (!txt) return false;
    return /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(txt);
  }, [activeCue, displayCue]);

  const isVisible = Boolean(isActive && (activeCue || displayCue));
  const currentText = activeCue?.text || displayCue?.text;

  if (!isActive && !isVisible) return null;

  return (
    <div className="absolute bottom-[240px] xs:bottom-[250px] sm:bottom-[140px] md:bottom-[140px] left-0 right-0 flex justify-center px-6 pointer-events-none z-[48] select-none">
      <div 
        className={`max-w-[85%] flex justify-center transition-opacity duration-200 ease-out ${
          isVisible && currentText ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          dir={isRTL ? 'rtl' : 'ltr'}
          className="bg-black/85 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/25 shadow-[0_8px_32px_rgba(0,0,0,0.8)] text-center flex items-center justify-center"
        >
          <p className="text-[15px] sm:text-[17px] md:text-[19px] font-black tracking-tight text-center leading-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            {currentText || ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export const buildSegmentsFromTranscript = (_text?: string, _duration?: number): any[] => [];
