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

    // If parsed segments already provide granular 2-4 word timed chunks starting near 0.0s, use them
    if (parsed.length >= 3) {
      const firstStart = Number(parsed[0].start ?? parsed[0].start_time ?? 0);
      if (firstStart <= 1.5) {
        const refined: { start: number; end: number; text: string }[] = [];
        for (const s of parsed) {
          const rawText = String(s.text || s.transcript || '').trim();
          const start = Number(s.start ?? s.start_time ?? 0);
          const end = Number(s.end ?? s.end_time ?? (start + 4));
          const segDuration = Math.max(1.2, end - start);

          if (!rawText || isTitleFallbackText(rawText)) continue;

          const wordCount = rawText.split(/\s+/).length;
          if (wordCount > 4) {
            const subChunks = buildSegmentsFromTranscript(rawText, segDuration, start);
            refined.push(...subChunks);
          } else {
            refined.push({ start, end, text: rawText });
          }
        }
        if (refined.length > 0) return refined;
      }
    }

    // Default & Guaranteed Premium Standard: Start at 0.0s (INSTANTLY), chunk into 3-4 word single-line phrases
    return buildSegmentsFromTranscript(fullText, effectiveDuration, 0);
  }, [segments, transcriptText, duration]);

  if (validSegments.length === 0) return null;

  const activeSegment = validSegments.find(
    s => currentTime >= (s.start - 0.05) && currentTime <= s.end
  );

  if (!activeSegment || !activeSegment.text || isTitleFallbackText(activeSegment.text)) {
    return null;
  }

  return (
    <div className="absolute bottom-[165px] sm:bottom-[180px] md:bottom-[195px] left-0 right-0 flex justify-center px-4 pointer-events-none z-[48] select-none transition-all duration-300">
      <div className="max-w-[78%] sm:max-w-[72%] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
        <div className="bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 shadow-[0_6px_24px_rgba(0,0,0,0.85)] text-center">
          <p className="text-white text-[12px] sm:text-[14px] font-bold leading-tight tracking-normal text-center drop-shadow-md truncate">
            {activeSegment.text}
          </p>
        </div>
      </div>
    </div>
  );
};

