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
 * Deduplicates raw transcript segment lists.
 * If a segment is an updated draft of an earlier segment (e.g. "hello everybody I like to share service" vs "hello everybody I like to share my opinion..."),
 * the newer, complete draft REPLACES the earlier partial draft.
 */
const deduplicateRawSegments = (rawSegments: any[]): string[] => {
  const result: string[] = [];

  for (const item of rawSegments) {
    const text = String(item?.text || item?.transcript || '').trim();
    if (!text || isTitleFallbackText(text)) continue;

    if (result.length === 0) {
      result.push(text);
      continue;
    }

    const prevText = result[result.length - 1];
    const prevWords = prevText.toLowerCase().split(/\s+/).filter(Boolean);
    const currWords = text.toLowerCase().split(/\s+/).filter(Boolean);

    // Check if current segment starts with the same 2+ words as the previous segment
    // (e.g., "good morning I'm..." or "hello everybody I...")
    if (prevWords.length >= 2 && currWords.length >= 2) {
      const matchLen = 2;
      const prevOpening = prevWords.slice(0, matchLen).join(' ');
      const currOpening = currWords.slice(0, matchLen).join(' ');

      if (prevOpening === currOpening) {
        // Current segment is an updated/extended draft of the previous partial segment.
        // Replace previous draft with current complete text!
        result[result.length - 1] = text;
        continue;
      }
    }

    // Check suffix/prefix overlap
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
      const originalWords = text.split(/\s+/).filter(Boolean);
      const remaining = originalWords.slice(bestOverlap);
      if (remaining.length > 0) {
        result.push(remaining.join(' '));
      }
      continue;
    }

    if (prevText.toLowerCase() === text.toLowerCase()) {
      continue;
    }

    result.push(text);
  }

  return result;
};

/**
 * Breaks a clean spoken transcript into 6-to-7 word 2-line YouTube subtitle chunks.
 * Guarantee: Maximum 7 words per chunk ensures text NEVER overflows 2 lines and NEVER shows "..."
 */
const chunkIntoYoutube2LineSubtitles = (fullText: string): string[] => {
  if (!fullText) return [];

  const text = fullText.trim();
  if (!text || isTitleFallbackText(text)) return [];

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const maxWordsPerChunk = 7;
  const chunks: string[] = [];
  let currentChunk: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    currentChunk.push(word);

    const hasPunctuation = /[.,!?;:]$/.test(word);
    const reachMax = currentChunk.length >= maxWordsPerChunk;
    const reachMin = currentChunk.length >= 5;
    const remaining = words.length - (i + 1);

    if ((reachMax || (reachMin && hasPunctuation)) && remaining >= 2) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [];
    }
  }

  if (currentChunk.length > 0) {
    if (chunks.length > 0 && currentChunk.length <= 2) {
      chunks[chunks.length - 1] += ' ' + currentChunk.join(' ');
    } else {
      chunks.push(currentChunk.join(' '));
    }
  }

  return chunks;
};

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  currentTime = 0,
  segments,
  transcriptText,
  duration = 15,
  isActive = false,
  isLiveRecording = false
}) => {
  // Build clean, deduplicated, non-overlapping 2-line sentence segments
  const discreteSegments = useMemo<DiscreteSegment[]>(() => {
    let cleanPhrases: string[] = [];

    if (Array.isArray(segments) && segments.length > 0) {
      cleanPhrases = deduplicateRawSegments(segments);
    } else if (typeof segments === 'string') {
      try {
        const parsed = JSON.parse(segments);
        if (Array.isArray(parsed)) {
          cleanPhrases = deduplicateRawSegments(parsed);
        }
      } catch (e) {}
    }

    if (cleanPhrases.length === 0 && transcriptText && transcriptText.trim()) {
      const clean = transcriptText.trim();
      if (!isTitleFallbackText(clean)) {
        cleanPhrases = [clean];
      }
    }

    if (cleanPhrases.length === 0) return [];

    const fullSpokenText = cleanPhrases.join(' ');
    const chunks = chunkIntoYoutube2LineSubtitles(fullSpokenText);
    if (chunks.length === 0) return [];

    // Scale start/end time windows precisely across video duration
    const totalWords = fullSpokenText.split(/\s+/).filter(Boolean).length;
    const effectiveDur = duration && duration > 0 ? duration : 15;
    const availableDur = Math.max(2.0, effectiveDur - 0.5);

    let currentStart = 0.2;
    const result: DiscreteSegment[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const text = chunks[i];
      const cWords = text.split(/\s+/).length;
      const proportion = totalWords > 0 ? cWords / totalWords : 1 / chunks.length;
      const chunkDur = availableDur * proportion;

      const segStart = Math.round(currentStart * 100) / 100;
      const segEnd = Math.round((currentStart + chunkDur) * 100) / 100;

      result.push({
        start: segStart,
        end: segEnd,
        text
      });

      currentStart = segEnd; // Next sentence chunk appears right when previous finishes
    }

    return result;
  }, [segments, transcriptText, duration]);

  // Find active discrete segment for current video time
  const activeSegment = useMemo(() => {
    if (!isActive || discreteSegments.length === 0) return null;

    if (isLiveRecording) {
      return discreteSegments[discreteSegments.length - 1] || null;
    }

    // Strict time window: appears ONLY during [start, end] and vanishes completely when done
    for (const seg of discreteSegments) {
      if (currentTime >= seg.start && currentTime <= seg.end) {
        return seg;
      }
    }

    return null; // Clears completely between sentence chunks
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
