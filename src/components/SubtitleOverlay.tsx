import React, { useMemo } from 'react';

interface SubtitleOverlayProps {
  currentTime?: number;
  segments?: any[];
  transcriptText?: string;
  duration?: number;
  isActive?: boolean;
  isLiveRecording?: boolean;
}

interface WordToken {
  word: string;
  start: number;
  end: number;
}

interface DiscreteSegment {
  start: number;
  end: number;
  text: string;
  words: WordToken[];
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
 * Strips overlapping word suffix/prefix between consecutive spoken segments
 * Fixes sliding-window speech recognition output where phrase 2 repeats phrase 1's tail
 */
const stripSegmentOverlap = (wordsPrev: string[], wordsCurr: string[]): string[] => {
  if (wordsPrev.length === 0 || wordsCurr.length === 0) return wordsCurr;

  const maxOverlap = Math.min(wordsPrev.length, wordsCurr.length);
  let bestOverlapLength = 0;

  for (let k = 1; k <= maxOverlap; k++) {
    const prevSuffix = wordsPrev.slice(-k).map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const currPrefix = wordsCurr.slice(0, k).map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''));

    if (prevSuffix.join(' ') === currPrefix.join(' ')) {
      bestOverlapLength = k;
    }
  }

  if (bestOverlapLength > 0) {
    return wordsCurr.slice(bestOverlapLength);
  }

  return wordsCurr;
};

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  currentTime = 0,
  segments,
  transcriptText,
  duration = 15,
  isActive = false,
  isLiveRecording = false
}) => {
  // Build clean, deduplicated, non-overlapping sentence segments with active word timing
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

    // Step 1: Extract spoken words while deduplicating sliding-window overlapping phrases
    let cleanSpokenWords: string[] = [];

    if (rawList.length > 0) {
      let accumulatedWords: string[] = [];

      for (const seg of rawList) {
        const segText = String(seg?.text || seg?.transcript || '').trim();
        if (!segText || isTitleFallbackText(segText)) continue;

        const segWords = segText.split(/\s+/).filter(Boolean);
        const strippedWords = stripSegmentOverlap(accumulatedWords, segWords);

        if (strippedWords.length > 0) {
          accumulatedWords.push(...strippedWords);
        }
      }

      cleanSpokenWords = accumulatedWords;
    }

    if (cleanSpokenWords.length === 0 && transcriptText && transcriptText.trim()) {
      const cleanText = transcriptText.trim();
      if (!isTitleFallbackText(cleanText)) {
        cleanSpokenWords = cleanText.split(/\s+/).filter(Boolean);
      }
    }

    if (cleanSpokenWords.length === 0) return [];

    // Step 2: Remove consecutive identical single-word glitches (e.g. "for for")
    const dedupedWords: string[] = [];
    for (let i = 0; i < cleanSpokenWords.length; i++) {
      const w = cleanSpokenWords[i];
      const prevW = dedupedWords[dedupedWords.length - 1];
      if (prevW && prevW.toLowerCase() === w.toLowerCase() && i > 0 && cleanSpokenWords[i - 1].toLowerCase() === w.toLowerCase()) {
        continue;
      }
      dedupedWords.push(w);
    }

    if (dedupedWords.length === 0) return [];

    // Step 3: Group into distinct 5 to 8 word sentence clauses
    const clauseChunks: string[][] = [];
    let currentClause: string[] = [];

    for (let i = 0; i < dedupedWords.length; i++) {
      const word = dedupedWords[i];
      currentClause.push(word);

      const hasPunctuation = /[.,!?;:]$/.test(word);
      const reachTarget = currentClause.length >= 7;
      const reachMin = currentClause.length >= 5;
      const remaining = dedupedWords.length - (i + 1);

      if ((reachTarget || (reachMin && hasPunctuation)) && remaining >= 3) {
        clauseChunks.push(currentClause);
        currentClause = [];
      }
    }

    if (currentClause.length > 0) {
      if (clauseChunks.length > 0 && currentClause.length <= 2) {
        clauseChunks[clauseChunks.length - 1].push(...currentClause);
      } else {
        clauseChunks.push(currentClause);
      }
    }

    // Step 4: Scale start/end time windows precisely across video duration
    const effectiveDur = duration && duration > 0 ? duration : 15;
    const totalWordsCount = dedupedWords.length;
    const availableDur = Math.max(2.0, effectiveDur - 0.5);

    let currentStart = 0.2;
    const result: DiscreteSegment[] = [];

    for (let i = 0; i < clauseChunks.length; i++) {
      const cWords = clauseChunks[i];
      const proportion = cWords.length / totalWordsCount;
      const chunkDur = availableDur * proportion;

      const segStart = Math.round(currentStart * 100) / 100;
      const segEnd = Math.round((currentStart + chunkDur) * 100) / 100;

      // Calculate word-level timestamps inside [segStart, segEnd] for yellow word tracking
      const wordDur = (segEnd - segStart) / cWords.length;
      let wAccStart = segStart;

      const wordTokens: WordToken[] = cWords.map((w, wIdx) => {
        const wS = Math.round(wAccStart * 100) / 100;
        const wE = wIdx === cWords.length - 1 ? segEnd : Math.round((wAccStart + wordDur) * 100) / 100;
        wAccStart += wordDur;
        return {
          word: w,
          start: wS,
          end: Math.max(wS + 0.08, wE)
        };
      });

      result.push({
        start: segStart,
        end: segEnd,
        text: cWords.join(' '),
        words: wordTokens
      });

      currentStart = segEnd; // Next YouTube clause starts right when previous finishes
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

    return null; // Clears completely between sentence clauses
  }, [discreteSegments, currentTime, isActive, isLiveRecording]);

  // Detect Right-to-Left languages
  const isRTL = useMemo(() => {
    if (!activeSegment?.text) return false;
    return /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(activeSegment.text);
  }, [activeSegment]);

  if (!isActive || !activeSegment || !activeSegment.text) return null;

  return (
    <div className="absolute bottom-[200px] xs:bottom-[210px] sm:bottom-[220px] left-0 right-0 flex justify-center px-4 pointer-events-none z-[48] select-none transition-all duration-150">
      <div className="max-w-[88%] sm:max-w-[78%] animate-in fade-in zoom-in-95 duration-100 flex justify-center">
        <div
          dir={isRTL ? "rtl" : "ltr"}
          className="bg-black/80 backdrop-blur-md px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.95)] text-center flex items-center justify-center max-w-full"
        >
          <p className="text-[15px] sm:text-[17px] md:text-[18px] font-semibold tracking-normal drop-shadow-md text-center leading-snug px-1 text-white break-words line-clamp-2 max-w-full flex flex-wrap justify-center gap-x-1.5">
            {activeSegment.words.map((wToken, idx) => {
              // Active word check: yellow highlight when speaker is currently speaking this word
              const isWordActive = currentTime >= wToken.start && currentTime <= wToken.end;
              return (
                <span
                  key={idx}
                  className={
                    isWordActive
                      ? "text-[#FFE600] font-extrabold scale-105 transition-all duration-75 drop-shadow-[0_0_10px_rgba(255,230,0,0.7)]"
                      : "text-white/95 opacity-90 transition-all duration-100"
                  }
                >
                  {wToken.word}
                </span>
              );
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export const buildSegmentsFromTranscript = () => [];
