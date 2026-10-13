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

// Helper to build short 3-5 word single-line timed segments from transcript text
export const buildSegmentsFromTranscript = (text: string, totalDuration: number = 60, startOffset: number = 0) => {
  if (!text || !text.trim() || isTitleFallbackText(text)) return [];

  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const dur = totalDuration && totalDuration > 0 ? totalDuration : Math.max(4, Math.round(words.length * 0.38));
  const secondsPerWord = dur / words.length;

  const chunks: { start: number; end: number; text: string }[] = [];
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

    chunks.push({
      start: segStart,
      end: segEnd,
      text: chunkText
    });
  }

  return chunks;
};

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  currentTime,
  segments,
  transcriptText,
  duration = 60,
  isActive
}) => {
  if (!isActive) return null;

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

    // Priority 1: Use exact VAD speech-to-text timestamps when real segments exist
    if (parsed.length > 0) {
      const refined: { start: number; end: number; text: string }[] = [];
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
          refined.push({ start, end, text: rawText });
        }
      }
      if (refined.length > 0) return refined;
    }

    // Priority 2: Fallback to proportional single-line timing only if raw transcript text exists without segment timestamps
    return buildSegmentsFromTranscript(fullText, effectiveDuration, 0);
  }, [segments, transcriptText, duration]);

  if (validSegments.length === 0) return null;

  const activeSegment = validSegments.find(
    s => currentTime >= (s.start - 0.05) && currentTime <= s.end
  );

  if (!activeSegment || !activeSegment.text || isTitleFallbackText(activeSegment.text)) {
    return null;
  }

  const words = useMemo(() => activeSegment.text.split(/\s+/).filter(Boolean), [activeSegment.text]);
  const segStart = activeSegment.start - 0.05;
  const segEnd = activeSegment.end;
  const segDuration = Math.max(0.1, segEnd - segStart);
  const progressRatio = Math.max(0, Math.min(0.99, (currentTime - segStart) / segDuration));
  const activeWordIdx = Math.min(words.length - 1, Math.floor(progressRatio * words.length));

  return (
    <div className="absolute bottom-[165px] sm:bottom-[180px] md:bottom-[195px] left-0 right-0 flex justify-center px-4 pointer-events-none z-[48] select-none transition-all duration-300">
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
                    ? "text-[#ffcc00] font-black scale-105 drop-shadow-[0_0_12px_rgba(255,204,0,0.85)]"
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

