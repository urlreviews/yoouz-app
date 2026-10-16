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
 * Checks if two text strings share an overlapping prefix/suffix or streaming transcript revision
 */
const cleanTranscriptSegments = (rawSegments: any[]): string[] => {
  const cleanedTexts: string[] = [];

  for (const seg of rawSegments) {
    const text = String(seg?.text || seg?.transcript || '').trim();
    if (!text || isTitleFallbackText(text)) continue;

    if (cleanedTexts.length === 0) {
      cleanedTexts.push(text);
      continue;
    }

    const prevText = cleanedTexts[cleanedTexts.length - 1];
    const prevWords = prevText.toLowerCase().split(/\s+/).filter(Boolean);
    const currWords = text.toLowerCase().split(/\s+/).filter(Boolean);

    // Case A: Streaming transcript revision (e.g. "good morning I'm repeating myself and better" vs "good morning I'm repeating myself and also")
    // If the current segment starts with the same 2+ words as the previous segment, replace the previous segment with the updated version
    if (prevWords.length >= 2 && currWords.length >= 2) {
      const matchLength = 2;
      const prevPrefix = prevWords.slice(0, matchLength).join(' ');
      const currPrefix = currWords.slice(0, matchLength).join(' ');

      if (prevPrefix === currPrefix) {
        // Replace previous segment with current updated segment
        cleanedTexts[cleanedTexts.length - 1] = text;
        continue;
      }
    }

    // Case B: Sliding window overlap where suffix of prev matches prefix of curr
    let bestOverlapLength = 0;
    const maxOverlap = Math.min(prevWords.length, currWords.length);

    for (let k = 1; k <= maxOverlap; k++) {
      const prevSuffix = prevWords.slice(-k).join(' ');
      const currPrefix = currWords.slice(0, k).join(' ');

      if (prevSuffix === currPrefix) {
        bestOverlapLength = k;
      }
    }

    if (bestOverlapLength > 0) {
      const currOriginalWords = text.split(/\s+/).filter(Boolean);
      const remainingWords = currOriginalWords.slice(bestOverlapLength);
      if (remainingWords.length > 0) {
        cleanedTexts.push(remainingWords.join(' '));
      }
      continue;
    }

    // Case C: Exact or highly similar duplicate check
    if (prevText.toLowerCase() === text.toLowerCase()) {
      continue;
    }

    cleanedTexts.push(text);
  }

  return cleanedTexts;
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
    let rawList: any[] = [];
    if (Array.isArray(segments) && segments.length > 0) {
      rawList = segments;
    } else if (typeof segments === 'string') {
      try {
        const parsed = JSON.parse(segments);
        if (Array.isArray(parsed)) rawList = parsed;
      } catch (e) {}
    }

    // Step 1: Clean and deduplicate transcript segments
    let cleanPhrases: string[] = [];

    if (rawList.length > 0) {
      cleanPhrases = cleanTranscriptSegments(rawList);
    }

    if (cleanPhrases.length === 0 && transcriptText && transcriptText.trim()) {
      const cleanText = transcriptText.trim();
      if (!isTitleFallbackText(cleanText)) {
        cleanPhrases = [cleanText];
      }
    }

    if (cleanPhrases.length === 0) return [];

    // Combine phrases into word stream
    const fullSpokenText = cleanPhrases.join(' ');
    const rawWords = fullSpokenText.split(/\s+/).filter(Boolean);

    // Step 2: Deduplicate consecutive duplicate words (e.g. "for for")
    const dedupedWords: string[] = [];
    for (let i = 0; i < rawWords.length; i++) {
      const w = rawWords[i];
      const prevW = dedupedWords[dedupedWords.length - 1];
      if (prevW && prevW.toLowerCase() === w.toLowerCase() && i > 0 && rawWords[i - 1].toLowerCase() === w.toLowerCase()) {
        continue;
      }
      dedupedWords.push(w);
    }

    if (dedupedWords.length === 0) return [];

    // Step 3: Group into distinct 6 to 9 word 2-line YouTube-style sentence clauses
    const clauseChunks: string[] = [];
    let currentClause: string[] = [];

    for (let i = 0; i < dedupedWords.length; i++) {
      const word = dedupedWords[i];
      currentClause.push(word);

      const hasPunctuation = /[.,!?;:]$/.test(word);
      const reachTarget = currentClause.length >= 8;
      const reachMin = currentClause.length >= 6;
      const remaining = dedupedWords.length - (i + 1);

      if ((reachTarget || (reachMin && hasPunctuation)) && remaining >= 3) {
        clauseChunks.push(currentClause.join(' '));
        currentClause = [];
      }
    }

    if (currentClause.length > 0) {
      if (clauseChunks.length > 0 && currentClause.length <= 3) {
        clauseChunks[clauseChunks.length - 1] += ' ' + currentClause.join(' ');
      } else {
        clauseChunks.push(currentClause.join(' '));
      }
    }

    // Step 4: Scale start/end time windows precisely across video duration
    const effectiveDur = duration && duration > 0 ? duration : 15;
    const totalWordsCount = dedupedWords.length;
    const availableDur = Math.max(2.0, effectiveDur - 0.5);

    let currentStart = 0.2;
    const result: DiscreteSegment[] = [];

    for (let i = 0; i < clauseChunks.length; i++) {
      const text = clauseChunks[i];
      const cWords = text.split(/\s+/).length;
      const proportion = cWords / totalWordsCount;
      const chunkDur = availableDur * proportion;

      const segStart = Math.round(currentStart * 100) / 100;
      const segEnd = Math.round((currentStart + chunkDur) * 100) / 100;

      result.push({
        start: segStart,
        end: segEnd,
        text
      });

      currentStart = segEnd; // Next sentence starts right when previous finishes
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

    return null; // Clears completely between sentences
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
          <p className="text-[15px] sm:text-[17px] md:text-[18px] font-medium tracking-normal drop-shadow-md text-center leading-snug px-1 text-white break-words line-clamp-2 max-w-full">
            {activeSegment.text}
          </p>
        </div>
      </div>
    </div>
  );
};

export const buildSegmentsFromTranscript = () => [];
