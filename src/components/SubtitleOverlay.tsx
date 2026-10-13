import React, { useMemo } from 'react';

interface SubtitleOverlayProps {
  currentTime: number;
  segments?: any[];
  transcriptText?: string;
  duration?: number;
  isActive: boolean;
}

// Helper to filter out video review title fallbacks so post titles never appear as subtitles
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

// Helper to build short 3-5 word single-line timed segments from transcript text with character-weighted word timestamps
export const buildSegmentsFromTranscript = (text: string, totalDuration: number = 60, startOffset: number = 0) => {
  if (!text || !text.trim() || isTitleFallbackText(text)) return [];

  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const dur = totalDuration && totalDuration > 0 ? totalDuration : Math.max(4, Math.round(words.length * 0.38));
  const secondsPerWord = dur / words.length;

  const chunks: { start: number; end: number; text: string; words: { word: string; start: number; end: number }[] }[] = [];
  const maxWordsPerLine = 4; // Strict 3-5 words max per line for premium TikTok/Reels single-line captions

  let currentWordIdx = 0;
  while (currentWordIdx < words.length) {
    const chunkWords = words.slice(currentWordIdx, currentWordIdx + maxWordsPerLine);
    const chunkText = chunkWords.join(' ');
    const chunkStartIdx = currentWordIdx;
    currentWordIdx += chunkWords.length;

    if (isTitleFallbackText(chunkText)) continue;

    const segStart = Math.round((startOffset + chunkStartIdx * secondsPerWord) * 100) / 100;
    const segEnd = Math.round((startOffset + currentWordIdx * secondsPerWord) * 100) / 100;

    // Acoustic character-length weighting (longer words get proportionate spoken duration vs short words)
    const totalChunkChars = chunkWords.reduce((sum, w) => sum + Math.max(1, w.length), 0) || 1;
    let accumSec = segStart;
    const wordTimings = chunkWords.map((w) => {
      const wDur = (Math.max(1, w.length) / totalChunkChars) * (segEnd - segStart);
      const wStart = accumSec;
      const wEnd = accumSec + wDur;
      accumSec = wEnd;
      return { word: w, start: Math.round(wStart * 100) / 100, end: Math.round(wEnd * 100) / 100 };
    });

    chunks.push({
      start: segStart,
      end: segEnd,
      text: chunkText,
      words: wordTimings
    });
  }

  return chunks;
};

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  currentTime,
  segments,
  transcriptText,
  duration = 15,
  isActive
}) => {
  // CRITICAL: ALL Hooks MUST execute unconditionally in every render cycle. NO early returns before Hooks!
  const validSegments = useMemo(() => {
    let parsed: any[] = [];
    if (Array.isArray(segments)) {
      parsed = segments;
    } else if (typeof segments === 'string') {
      try {
        const json = JSON.parse(segments);
        if (Array.isArray(json)) parsed = json;
      } catch (e) {}
    }

    // Extract all spoken text
    let fullText = "";
    if (parsed.length > 0) {
      fullText = parsed
        .map(s => String(s.text || s.transcript || '').trim())
        .filter(s => s && !isTitleFallbackText(s))
        .join(" ");
    }
    if (!fullText && transcriptText && transcriptText.trim()) {
      const clean = transcriptText.trim();
      if (!isTitleFallbackText(clean)) {
        fullText = clean;
      }
    }

    if (!fullText || isTitleFallbackText(fullText)) return [];

    const effectiveDuration = duration && duration > 0 ? duration : 60;

    // Priority 1: Use exact VAD speech-to-text timestamps when real segments exist and are valid
    if (parsed.length > 0) {
      const refined: { start: number; end: number; text: string; words?: any[] }[] = [];
      for (const s of parsed) {
        const rawText = String(s.text || s.transcript || '').trim();
        const start = Number(s.start ?? s.start_time ?? 0);
        const end = Number(s.end ?? s.end_time ?? (start + 3.5));
        const segDuration = Math.max(1.0, end - start);

        if (!rawText || isTitleFallbackText(rawText)) continue;

        const wordCount = rawText.split(/\s+/).length;
        if (wordCount > 4) {
          // Sub-chunk long sentences into 3-4 word single-line phrases within this segment's exact VAD time window
          const subChunks = buildSegmentsFromTranscript(rawText, segDuration, start);
          refined.push(...subChunks);
        } else {
          // Build acoustic word timings for short segment
          const chunkWords = rawText.split(/\s+/).filter(Boolean);
          const totalChunkChars = chunkWords.reduce((sum, w) => sum + Math.max(1, w.length), 0) || 1;
          let accumSec = start;
          const wordTimings = chunkWords.map((w) => {
            const wDur = (Math.max(1, w.length) / totalChunkChars) * segDuration;
            const wStart = accumSec;
            const wEnd = accumSec + wDur;
            accumSec = wEnd;
            return { word: w, start: Math.round(wStart * 100) / 100, end: Math.round(wEnd * 100) / 100 };
          });
          refined.push({ start, end, text: rawText, words: s.words || wordTimings });
        }
      }

      if (refined.length > 0) {
        const firstSegStart = refined[0].start;
        // If the first segment is shifted towards the end of the video (> 2.5s and > 30% of duration), auto-correct by rebuilding from 0.0s
        if (firstSegStart < 2.5 || firstSegStart < effectiveDuration * 0.3) {
          return refined;
        }
      }
    }

    // Priority 2: Build timed segments from fullText starting cleanly at 0.0s
    if (fullText) {
      return buildSegmentsFromTranscript(fullText, effectiveDuration, 0);
    }

    return [];
  }, [segments, transcriptText, duration]);

  const activeSegment = useMemo(() => {
    if (!validSegments || validSegments.length === 0) return null;
    return validSegments.find(
      s => currentTime >= (s.start - 0.05) && currentTime <= s.end
    ) || null;
  }, [validSegments, currentTime]);

  const words = useMemo(() => {
    if (!activeSegment || !activeSegment.text || isTitleFallbackText(activeSegment.text)) return [];
    return activeSegment.text.split(/\s+/).filter(Boolean);
  }, [activeSegment]);

  // Compute exact active word index using word-level timestamps or character-weighted acoustic duration
  const activeWordIdx = useMemo(() => {
    if (!words || words.length === 0) return 0;
    if (words.length === 1) return 0;
    if (!activeSegment) return 0;

    // 1. If explicit word-level timestamps exist on activeSegment.words
    if (Array.isArray(activeSegment.words) && activeSegment.words.length === words.length) {
      const leadTime = currentTime + 0.08; // 80ms audio buffer lead
      const foundIdx = activeSegment.words.findIndex((wObj: any) => leadTime >= wObj.start && leadTime <= wObj.end);
      if (foundIdx !== -1) return foundIdx;
      for (let i = 0; i < activeSegment.words.length; i++) {
        if (leadTime < activeSegment.words[i].start) return Math.max(0, i - 1);
      }
      return words.length - 1;
    }

    // 2. Character-length acoustic weighting (accounting for long vs short words)
    const segStart = activeSegment.start;
    const segEnd = activeSegment.end;
    const segDuration = Math.max(0.1, segEnd - segStart);
    const elapsed = Math.max(0, (currentTime + 0.08) - segStart);

    const totalChars = words.reduce((acc, w) => acc + Math.max(1, w.length), 0);
    let cumulativeChars = 0;

    for (let i = 0; i < words.length; i++) {
      cumulativeChars += Math.max(1, words[i].length);
      const thresholdRatio = cumulativeChars / totalChars;
      const thresholdTime = thresholdRatio * segDuration;
      if (elapsed <= thresholdTime) {
        return i;
      }
    }

    return words.length - 1;
  }, [activeSegment, currentTime, words]);

  // Early returns strictly AFTER ALL HOOKS have run!
  if (!isActive) return null;
  if (!activeSegment || words.length === 0) return null;

  return (
    <div className="absolute bottom-[180px] xs:bottom-[195px] sm:bottom-[215px] md:bottom-[230px] left-0 right-0 flex justify-center px-4 pointer-events-none z-[48] select-none transition-all duration-300">
      <div className="max-w-[85%] sm:max-w-[78%] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-150">
        <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.85)] text-center flex items-center justify-center gap-1.5 flex-wrap">
          {words.map((word, wIdx) => {
            const isHighlighted = wIdx === activeWordIdx;
            const isPast = wIdx < activeWordIdx;
            return (
              <span
                key={`${word}-${wIdx}`}
                className={`transition-all duration-100 leading-tight inline-block ${
                  isHighlighted
                    ? "text-amber-400 font-black scale-105 drop-shadow-[0_0_12px_rgba(250,204,21,0.85)]"
                    : isPast
                    ? "text-white font-bold opacity-90"
                    : "text-white/70 font-semibold"
                } text-[13px] sm:text-[15px]`}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};
