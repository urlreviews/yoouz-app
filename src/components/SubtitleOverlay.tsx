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

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  currentTime = 0,
  segments,
  transcriptText,
  duration = 15,
  isActive = false,
  isLiveRecording = false
}) => {
  // Build clean, semantic, natural 1-to-2 line sentence chunks (YouTube Standard)
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

    // Extract full spoken text cleanly
    let fullSpokenText = "";
    if (rawList.length > 0) {
      const texts = rawList
        .map(s => String(s?.text || s?.transcript || '').trim())
        .filter(t => t && !isTitleFallbackText(t));
      
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
    const rawWords = fullSpokenText.split(/\s+/).filter(Boolean);
    const wordsList: string[] = [];
    for (let i = 0; i < rawWords.length; i++) {
      const w = rawWords[i];
      const prevW = wordsList[wordsList.length - 1];
      if (prevW && prevW.toLowerCase() === w.toLowerCase() && i > 0 && rawWords[i - 1].toLowerCase() === w.toLowerCase()) {
        continue;
      }
      wordsList.push(w);
    }

    if (wordsList.length === 0) return [];

    // Chunk words into semantic thought units of 6 to 9 words (allowing natural 1 to 2 lines without truncation)
    const targetChunkSize = 7;
    const wordChunks: string[][] = [];
    let currentChunk: string[] = [];

    for (let i = 0; i < wordsList.length; i++) {
      const word = wordsList[i];
      currentChunk.push(word);

      const hasPunctuation = /[.,!?;:]$/.test(word);
      const isChunkFull = currentChunk.length >= targetChunkSize;
      const isMinimumReached = currentChunk.length >= 5;
      const remainingWords = wordsList.length - (i + 1);

      if ((isChunkFull || (isMinimumReached && hasPunctuation)) && remainingWords >= 4) {
        wordChunks.push(currentChunk);
        currentChunk = [];
      }
    }

    if (currentChunk.length > 0) {
      if (wordChunks.length > 0 && currentChunk.length <= 3) {
        // Merge short remainder into preceding chunk so no sentence ever has dangling words
        wordChunks[wordChunks.length - 1].push(...currentChunk);
      } else {
        wordChunks.push(currentChunk);
      }
    }

    // Mathematically scale start and end times across video duration [0.2s, totalDuration - 0.3s]
    const effectiveDur = duration && duration > 0 ? duration : 15;
    const totalWords = wordsList.length;
    const availableDur = Math.max(2.0, effectiveDur - 0.5);
    
    let currentStart = 0.2;
    const result: DiscreteSegment[] = [];

    for (let i = 0; i < wordChunks.length; i++) {
      const chunkWords = wordChunks[i];
      const chunkText = chunkWords.join(" ");
      const chunkProportion = chunkWords.length / totalWords;
      const chunkDur = availableDur * chunkProportion;
      
      const segStart = Math.round(currentStart * 100) / 100;
      const segEnd = Math.round((currentStart + chunkDur) * 100) / 100;

      result.push({
        start: segStart,
        end: segEnd,
        text: chunkText
      });

      currentStart = segEnd; // Next sentence starts right when this one finishes
    }

    return result;
  }, [segments, transcriptText, duration]);

  // Find the single active discrete segment for current video time
  const activeSegment = useMemo(() => {
    if (!isActive || discreteSegments.length === 0) return null;

    if (isLiveRecording) {
      return discreteSegments[discreteSegments.length - 1] || null;
    }

    // Strict time window: appears ONLY during [start, end] and clears when finished
    for (const seg of discreteSegments) {
      if (currentTime >= seg.start && currentTime <= seg.end) {
        return seg;
      }
    }

    return null; // Clears completely between sentences and at end of video loop
  }, [discreteSegments, currentTime, isActive, isLiveRecording]);

  // Detect Right-to-Left languages
  const isRTL = useMemo(() => {
    if (!activeSegment?.text) return false;
    return /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(activeSegment.text);
  }, [activeSegment]);

  if (!isActive || !activeSegment || !activeSegment.text) return null;

  return (
    <div className="absolute bottom-[200px] xs:bottom-[210px] sm:bottom-[220px] left-0 right-0 flex justify-center px-4 pointer-events-none z-[48] select-none transition-all duration-150">
      <div className="max-w-[90%] sm:max-w-[82%] animate-in fade-in zoom-in-95 duration-100 flex justify-center">
        <div
          dir={isRTL ? "rtl" : "ltr"}
          className="bg-black/85 backdrop-blur-2xl px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl border border-white/20 shadow-[0_12px_36px_rgba(0,0,0,0.95)] text-center flex items-center justify-center max-w-full"
        >
          <p className="text-[15px] sm:text-[17px] font-extrabold tracking-tight drop-shadow-md text-center leading-snug px-1 text-white break-words line-clamp-2 max-w-full">
            {activeSegment.text}
          </p>
        </div>
      </div>
    </div>
  );
};

export const buildSegmentsFromTranscript = () => [];
