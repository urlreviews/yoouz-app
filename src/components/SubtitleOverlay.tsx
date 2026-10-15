import React, { useMemo } from 'react';
import { generatePrecisionSubtitles, normalizeWordTimings } from '../utils/subtitleSync';

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

// Helper wrapper for backwards compatibility
export const buildSegmentsFromTranscript = (text: string, totalDuration: number = 60, startOffset: number = 0) => {
  return generatePrecisionSubtitles(text, totalDuration);
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

    // Priority 1: Use explicit hardware-timed segments from SpeechRecognition if available
    if (parsed.length > 0) {
      const validArray = parsed.map((s: any) => ({
        start: Number(s.start ?? s.start_time ?? 0),
        end: Number(s.end ?? s.end_time ?? (Number(s.start ?? 0) + 1.2)),
        text: String(s.text || s.transcript || '').trim(),
        words: Array.isArray(s.words) ? s.words : undefined
      })).filter(s => s.text && !isTitleFallbackText(s.text));

      if (validArray.length > 0) {
        return validArray;
      }
    }

    return generatePrecisionSubtitles(fullText, effectiveDuration);
  }, [segments, transcriptText, duration]);

  const activeSegment = useMemo(() => {
    if (!validSegments || validSegments.length === 0) return null;

    // Strict YouTube CC timing: active strictly when currentTime is within [start - 0.04s, end + 0.08s]
    // Zero bleed into pauses/silence so no word appears before or after the sentence
    const direct = validSegments.find(
      s => currentTime >= (s.start - 0.04) && currentTime <= (s.end + 0.08)
    );
    return direct || null;
  }, [validSegments, currentTime]);

  // Extract strict word tokens with exact start and end timestamps
  const wordTokens = useMemo(() => {
    if (!activeSegment || !activeSegment.text || isTitleFallbackText(activeSegment.text)) return [];

    const textWords = activeSegment.text.split(/\s+/).filter(Boolean);
    if (textWords.length === 0) return [];

    if (Array.isArray(activeSegment.words) && activeSegment.words.length > 0) {
      return normalizeWordTimings(activeSegment.words, activeSegment.start, activeSegment.end, activeSegment.text);
    }

    // Fallback word token timings from precision generator
    return normalizeWordTimings([], activeSegment.start, activeSegment.end, activeSegment.text);
  }, [activeSegment]);

  // Early returns strictly AFTER ALL HOOKS have run!
  if (!isActive) return null;
  if (!activeSegment || !activeSegment.text || isTitleFallbackText(activeSegment.text)) return null;

  return (
    <div className="absolute bottom-[175px] xs:bottom-[190px] sm:bottom-[210px] md:bottom-[225px] left-0 right-0 flex justify-center px-3 sm:px-4 pointer-events-none z-[48] select-none transition-all duration-150">
      <div className="max-w-[96%] sm:max-w-[90%] animate-in fade-in zoom-in-95 duration-100 flex justify-center">
        <div className="bg-black/85 backdrop-blur-xl px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.85)] text-center flex items-center justify-center whitespace-nowrap overflow-hidden max-w-full">
          {wordTokens.length > 0 ? (
            <p className="text-[13px] xs:text-[14px] sm:text-[16px] font-extrabold tracking-tight drop-shadow-md text-center leading-none px-1 max-w-full flex items-center justify-center whitespace-nowrap overflow-hidden text-ellipsis gap-x-1.5">
              {wordTokens.map((w, idx) => {
                const isCurrent = currentTime >= (w.start - 0.04) && currentTime <= (w.end + 0.04);
                const isSpoken = currentTime > (w.end + 0.04);
                return (
                  <span
                    key={`${w.word}-${idx}`}
                    className={`inline-block whitespace-nowrap transition-all duration-75 ${
                      isCurrent
                        ? 'text-amber-300 font-black scale-105 drop-shadow-[0_2px_8px_rgba(251,191,36,0.8)]'
                        : isSpoken
                        ? 'text-white font-extrabold'
                        : 'text-white/80 font-bold'
                    }`}
                  >
                    {w.word}
                  </span>
                );
              })}
            </p>
          ) : (
            <p className="text-white text-[13px] xs:text-[14px] sm:text-[16px] font-extrabold tracking-tight drop-shadow-md text-center leading-none px-1 max-w-full whitespace-nowrap overflow-hidden text-ellipsis">
              {activeSegment.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
