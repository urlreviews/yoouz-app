import React, { useMemo } from 'react';

interface SubtitleOverlayProps {
  currentTime?: number;
  segments?: any[];
  transcriptText?: string;
  duration?: number;
  isActive?: boolean;
  isLiveRecording?: boolean;
}

interface DiscreteSegment {
  start: number;
  end: number;
  text: string;
}

const isTitleFallbackText = (text: string): boolean => {
  if (!text) return true;
  const lower = text.trim().toLowerCase();
  return (
    lower.startsWith('video review for') ||
    lower.startsWith('review for') ||
    lower.startsWith('video review of') ||
    lower === 'video review'
  );
};

/**
 * Deduplicates raw segments using real speech acoustic timestamps.
 * Replaces partial speech hypotheses with final transcripts while preserving exact start/end seconds.
 */
const processAcousticSegments = (rawSegments: any[], fallbackText?: string, videoDuration = 15): DiscreteSegment[] => {
  const normalized: { start: number; end: number; text: string }[] = [];

  for (const item of rawSegments) {
    const text = String(item?.text || item?.transcript || '').trim();
    if (!text || isTitleFallbackText(text)) continue;

    const start = typeof item?.start === 'number' && !isNaN(item.start) ? Math.max(0, item.start) : 0;
    const end = typeof item?.end === 'number' && !isNaN(item.end) ? Math.max(start + 0.5, item.end) : start + 2.0;

    if (normalized.length === 0) {
      normalized.push({ start, end, text });
      continue;
    }

    const prev = normalized[normalized.length - 1];
    const prevWords = prev.text.toLowerCase().split(/\s+/).filter(Boolean);
    const currWords = text.toLowerCase().split(/\s+/).filter(Boolean);

    // Case 1: Current segment is an updated draft of previous segment (same opening words)
    if (prevWords.length >= 2 && currWords.length >= 2) {
      const matchLen = 2;
      const prevOpening = prevWords.slice(0, matchLen).join(' ');
      const currOpening = currWords.slice(0, matchLen).join(' ');

      if (prevOpening === currOpening) {
        // Replace previous partial draft with current complete text and extend end time
        prev.text = text;
        prev.end = Math.max(prev.end, end);
        continue;
      }
    }

    // Case 2: Suffix/prefix sliding window overlap
    let bestOverlap = 0;
    const maxOverlap = Math.min(prevWords.length, currWords.length);
    for (let k = 1; k <= maxOverlap; k++) {
      const prevSuffix = prevWords.slice(-k).join(' ');
      const currPrefix = currWords.slice(0, k).join(' ');
      if (prevSuffix === currPrefix) {
        bestOverlap = k;
      }
    }

    if (bestOverlap > 0) {
      const origWords = text.split(/\s+/).filter(Boolean);
      const remaining = origWords.slice(bestOverlap);
      if (remaining.length > 0) {
        normalized.push({
          start: Math.max(prev.end, start),
          end: Math.max(prev.end + 0.6, end),
          text: remaining.join(' ')
        });
      }
      continue;
    }

    // Case 3: Duplicate text check
    if (prev.text.toLowerCase() === text.toLowerCase()) {
      continue;
    }

    normalized.push({ start, end, text });
  }

  // Fallback: If no segments exist but transcript text is provided
  if (normalized.length === 0 && fallbackText && fallbackText.trim()) {
    const cleanText = fallbackText.trim();
    if (!isTitleFallbackText(cleanText)) {
      const words = cleanText.split(/\s+/).filter(Boolean);
      if (words.length > 0) {
        const secPerWord = 0.35;
        let curSec = 0.5;
        for (let i = 0; i < words.length; i += 7) {
          const chunkWords = words.slice(i, i + 7);
          const dur = Math.max(1.5, chunkWords.length * secPerWord);
          normalized.push({
            start: Math.round(curSec * 100) / 100,
            end: Math.round((curSec + dur) * 100) / 100,
            text: chunkWords.join(' ')
          });
          curSec += dur;
        }
      }
    }
  }

  // Step 2: Split any segment longer than 7 words into 2-line YouTube subtitle chunks
  // proportionally distributed across THAT segment's exact acoustic [start, end] window
  const finalChunks: DiscreteSegment[] = [];

  for (const seg of normalized) {
    const words = seg.text.split(/\s+/).filter(Boolean);
    if (words.length <= 7) {
      finalChunks.push(seg);
      continue;
    }

    // Split long segment into sub-chunks of max 7 words
    const subChunks: string[][] = [];
    let curWords: string[] = [];
    for (let i = 0; i < words.length; i++) {
      curWords.push(words[i]);
      const reachMax = curWords.length >= 7;
      const reachMin = curWords.length >= 5;
      const hasPunc = /[.,!?;:]$/.test(words[i]);
      const rem = words.length - (i + 1);

      if ((reachMax || (reachMin && hasPunc)) && rem >= 2) {
        subChunks.push(curWords);
        curWords = [];
      }
    }
    if (curWords.length > 0) {
      if (subChunks.length > 0 && curWords.length <= 2) {
        subChunks[subChunks.length - 1].push(...curWords);
      } else {
        subChunks.push(curWords);
      }
    }

    // Proportionally scale each sub-chunk across the segment's actual acoustic time [seg.start, seg.end]
    const segDuration = Math.max(1.2, seg.end - seg.start);
    let chunkStart = seg.start;

    for (let j = 0; j < subChunks.length; j++) {
      const cWords = subChunks[j];
      const chunkDur = (cWords.length / words.length) * segDuration;
      const cStart = Math.round(chunkStart * 100) / 100;
      const cEnd = j === subChunks.length - 1 ? seg.end : Math.round((chunkStart + chunkDur) * 100) / 100;

      finalChunks.push({
        start: cStart,
        end: cEnd,
        text: cWords.join(' ')
      });

      chunkStart = cEnd;
    }
  }

  return finalChunks;
};

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  currentTime = 0,
  segments,
  transcriptText,
  duration = 15,
  isActive = false,
  isLiveRecording = false
}) => {
  // Build clean, acoustic-synced 2-line YouTube subtitles
  const discreteSegments = useMemo<DiscreteSegment[]>(() => {
    let rawList: any[] = [];
    if (Array.isArray(segments) && segments.length > 0) {
      rawList = segments;
    } else if (typeof segments === 'string') {
      try {
        const parsed = JSON.parse(segments);
        if (Array.isArray(parsed)) rawList = parsed;
      } catch (e) {}
    }

    return processAcousticSegments(rawList, transcriptText, duration);
  }, [segments, transcriptText, duration]);

  // Find active discrete segment for current video time
  const activeSegment = useMemo(() => {
    if (!isActive || discreteSegments.length === 0) return null;

    if (isLiveRecording) {
      return discreteSegments[discreteSegments.length - 1] || null;
    }

    // Strict time window: appears ONLY during [start, end] when the speaker is actually speaking!
    // When the speaker pauses or stops speaking, activeSegment becomes null and disappears!
    for (const seg of discreteSegments) {
      if (currentTime >= seg.start && currentTime <= seg.end) {
        return seg;
      }
    }

    return null; // Clears completely when speaker is not speaking
  }, [discreteSegments, currentTime, isActive, isLiveRecording]);

  // Detect Right-to-Left languages
  const isRTL = useMemo(() => {
    if (!activeSegment?.text) return false;
    return /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(activeSegment.text);
  }, [activeSegment]);

  if (!isActive || !activeSegment || !activeSegment.text) return null;

  return (
    <div className="absolute bottom-[200px] xs:bottom-[210px] sm:bottom-[220px] left-0 right-0 flex justify-center px-4 pointer-events-none z-[48] select-none transition-all duration-150">
      <div className="max-w-[92%] sm:max-w-[85%] md:max-w-[650px] animate-in fade-in zoom-in-95 duration-100 flex justify-center">
        <div
          dir={isRTL ? "rtl" : "ltr"}
          className="bg-black/85 backdrop-blur-md px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.95)] text-center flex items-center justify-center max-w-full"
        >
          <p className="text-[15px] sm:text-[17px] md:text-[18px] font-medium tracking-normal drop-shadow-md text-center leading-snug px-1 text-white break-words max-w-full">
            {activeSegment.text}
          </p>
        </div>
      </div>
    </div>
  );
};

export const buildSegmentsFromTranscript = () => [];
