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

    if (parsed.length > 0) {
      const refined: { start: number; end: number; text: string }[] = [];
      for (const s of parsed) {
        const rawText = String(s.text || s.transcript || '').trim();
        const start = Number(s.start ?? s.start_time ?? 0);
        const end = Number(s.end ?? s.end_time ?? (start + 5));
        const segDuration = Math.max(1.5, end - start);

        if (!rawText || isTitleFallbackText(rawText)) continue;

        // If segment has more than 5 words, split into 3-5 word single-line chunks
        const wordCount = rawText.split(/\s+/).length;
        if (wordCount > 5) {
          const subChunks = buildSegmentsFromTranscript(rawText, segDuration, start);
          refined.push(...subChunks);
        } else {
          refined.push({ start, end, text: rawText });
        }
      }
      if (refined.length > 0) return refined;
    }

    // Fallback: build short 3-5 word single-line segments on-the-fly from transcriptText
    if (transcriptText && transcriptText.trim() && !isTitleFallbackText(transcriptText)) {
      return buildSegmentsFromTranscript(transcriptText, duration);
    }

    return [];
  }, [segments, transcriptText, duration]);

  if (validSegments.length === 0) return null;

  const activeSegment = validSegments.find(
    s => currentTime >= s.start && currentTime <= s.end
  );

  if (!activeSegment || !activeSegment.text || isTitleFallbackText(activeSegment.text)) {
    return null;
  }

  return (
    <div className="absolute bottom-[115px] sm:bottom-[130px] left-0 right-0 flex justify-center px-4 pointer-events-none z-[48] select-none transition-all duration-300">
      <div className="max-w-[85%] sm:max-w-[78%] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
        <div className="bg-black/65 backdrop-blur-md px-4 py-2 rounded-full border border-white/15 shadow-[0_4px_20px_rgba(0,0,0,0.6)] text-center">
          <p className="text-white text-[13px] sm:text-[15px] font-semibold leading-tight tracking-normal text-center drop-shadow-md">
            {activeSegment.text}
          </p>
        </div>
      </div>
    </div>
  );
};

