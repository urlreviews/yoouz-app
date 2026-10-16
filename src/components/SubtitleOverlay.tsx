import React, { useMemo } from 'react';

interface SubtitleOverlayProps {
  currentTime?: number;
  segments?: any[];
  transcriptText?: string;
  duration?: number;
  isActive?: boolean;
  isLiveRecording?: boolean;
}

interface TimedWord {
  word: string;
  start: number;
  end: number;
}

interface DiscreteSegment {
  start: number;
  end: number;
  text: string;
  words: TimedWord[];
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

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  currentTime = 0,
  segments,
  transcriptText,
  duration = 15,
  isActive = false,
  isLiveRecording = false
}) => {
  // Build clean, discrete, non-overlapping sentence segments with word timings
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

    // Extract all spoken text cleanly if rawList lacks valid timed entries
    let fullSpokenText = "";
    if (rawList.length > 0) {
      const texts = rawList
        .map(s => String(s?.text || s?.transcript || '').trim())
        .filter(t => t && !isTitleFallbackText(t));
      
      // Deduplicate consecutive identical texts
      const dedupTexts: string[] = [];
      for (const t of texts) {
        if (dedupTexts.length === 0 || dedupTexts[dedupTexts.length - 1].toLowerCase() !== t.toLowerCase()) {
          dedupTexts.push(t);
        }
      }
      fullSpokenText = dedupTexts.join(" ");
    }

    if (!fullSpokenText && transcriptText && transcriptText.trim()) {
      const clean = transcriptText.trim();
      if (!isTitleFallbackText(clean)) {
        fullSpokenText = clean;
      }
    }

    if (!fullSpokenText || isTitleFallbackText(fullSpokenText)) return [];

    // Clean up consecutive word repetitions in fullSpokenText
    const wordsList = fullSpokenText.split(/\s+/).filter(Boolean);
    const dedupWords: string[] = [];
    for (let i = 0; i < wordsList.length; i++) {
      const w = wordsList[i];
      const prevW = dedupWords[dedupWords.length - 1];
      if (prevW && prevW.toLowerCase() === w.toLowerCase() && i > 0 && wordsList[i - 1].toLowerCase() === w.toLowerCase()) {
        continue;
      }
      dedupWords.push(w);
    }

    if (dedupWords.length === 0) return [];

    // Chunk into discrete, non-overlapping sentence blocks of 5 to 7 words
    const minWords = 5;
    const maxWords = 7;
    const wordChunks: string[][] = [];
    let currentChunk: string[] = [];

    for (let i = 0; i < dedupWords.length; i++) {
      const w = dedupWords[i];
      currentChunk.push(w);
      const hasPunctuation = /[.,!?;:]$/.test(w);
      const reachMax = currentChunk.length >= maxWords;
      const reachMin = currentChunk.length >= minWords;
      const remaining = dedupWords.length - (i + 1);

      if ((reachMax || (reachMin && hasPunctuation) || (reachMin && remaining > 0 && remaining < 4)) && remaining > 0) {
        wordChunks.push(currentChunk);
        currentChunk = [];
      }
    }
    if (currentChunk.length > 0) {
      if (wordChunks.length > 0 && currentChunk.length <= 2) {
        wordChunks[wordChunks.length - 1].push(...currentChunk);
      } else {
        wordChunks.push(currentChunk);
      }
    }

    // Assign strictly sequential, non-overlapping time windows [start, end]
    const effectiveDur = duration && duration > 0 ? duration : 15;
    const secPerWord = 0.38;
    let currStart = 0.2;
    const result: DiscreteSegment[] = [];

    for (let i = 0; i < wordChunks.length; i++) {
      const chunkWords = wordChunks[i];
      const chunkText = chunkWords.join(" ");
      const chunkDur = Math.max(1.5, chunkWords.length * secPerWord);
      const segStart = Math.round(currStart * 100) / 100;
      const segEnd = Math.round((currStart + chunkDur) * 100) / 100;

      // Calculate word-level timestamps for active word yellow glow
      const timedWords: TimedWord[] = [];
      const wordDur = (segEnd - segStart) / chunkWords.length;
      let wAcc = segStart;

      chunkWords.forEach((w, wIdx) => {
        const wS = Math.round(wAcc * 100) / 100;
        const wE = wIdx === chunkWords.length - 1 ? segEnd : Math.round((wAcc + wordDur) * 100) / 100;
        timedWords.push({ word: w, start: wS, end: Math.max(wS + 0.08, wE) });
        wAcc += wordDur;
      });

      result.push({
        start: segStart,
        end: segEnd,
        text: chunkText,
        words: timedWords
      });

      currStart = segEnd; // Next sentence starts EXACTLY where this sentence ends (0ms overlap)
    }

    return result;
  }, [segments, transcriptText, duration]);

  // Find the single active discrete segment for the current time
  const activeSegment = useMemo(() => {
    if (!isActive || discreteSegments.length === 0) return null;

    if (isLiveRecording) {
      return discreteSegments[discreteSegments.length - 1] || null;
    }

    // Strict time window matching: segment appears ONLY during [start, end] and clears when finished
    for (const seg of discreteSegments) {
      if (currentTime >= seg.start && currentTime <= seg.end) {
        return seg;
      }
    }

    return null; // Sentence clears completely when time window ends
  }, [discreteSegments, currentTime, isActive, isLiveRecording]);

  // Detect Right-to-Left languages
  const isRTL = useMemo(() => {
    if (!activeSegment?.text) return false;
    return /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(activeSegment.text);
  }, [activeSegment]);

  if (!isActive || !activeSegment || !activeSegment.text) return null;

  return (
    <div className="absolute bottom-[200px] xs:bottom-[210px] sm:bottom-[220px] left-0 right-0 flex justify-center px-4 pointer-events-none z-[48] select-none transition-all duration-150">
      <div className="max-w-[92%] sm:max-w-[85%] animate-in fade-in zoom-in-95 duration-100 flex justify-center">
        <div
          dir={isRTL ? "rtl" : "ltr"}
          className="bg-black/85 backdrop-blur-2xl px-5 sm:px-6 py-2.5 sm:py-3 rounded-full border border-white/20 shadow-[0_12px_36px_rgba(0,0,0,0.9)] text-center flex items-center justify-center max-w-full overflow-hidden"
        >
          <p className="text-[15px] sm:text-[17px] font-extrabold tracking-tight drop-shadow-md text-center leading-none px-1 max-w-full flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            {activeSegment.words.map((w, idx) => {
              const isCurrent = currentTime >= (w.start - 0.05) && currentTime <= (w.end + 0.05);
              const isSpoken = currentTime > (w.end + 0.05);

              return (
                <span
                  key={`${w.word}-${idx}`}
                  className={`inline-block whitespace-nowrap transition-all duration-75 ${
                    isCurrent
                      ? 'text-amber-300 font-black scale-105 drop-shadow-[0_2px_10px_rgba(251,191,36,0.9)]'
                      : isSpoken || isLiveRecording
                      ? 'text-white font-extrabold'
                      : 'text-white/80 font-bold'
                  }`}
                >
                  {w.word}
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
