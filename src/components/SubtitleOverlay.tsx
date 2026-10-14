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

    // Priority 1: Use explicit segments from SpeechRecognition or Gemini server transcription if available
    if (parsed.length > 0) {
      const validArray = parsed.map((s: any) => ({
        start: Number(s.start ?? s.start_time ?? 0),
        end: Number(s.end ?? s.end_time ?? (Number(s.start ?? 0) + 1.5)),
        text: String(s.text || s.transcript || '').trim(),
        words: Array.isArray(s.words) ? s.words : undefined
      })).filter(s => s.text && !isTitleFallbackText(s.text));

      if (validArray.length > 0) {
        return validArray.flatMap(s => {
          const words = s.text.split(/\s+/).filter(Boolean);
          if (words.length <= 5) return [s];

          const segDur = Math.max(0.4, s.end - s.start);
          const secPerWord = segDur / words.length;
          const subChunks: any[] = [];
          for (let i = 0; i < words.length; i += 5) {
            const subWords = words.slice(i, i + 5);
            const subText = subWords.join(" ");
            const subStart = s.start + (i * secPerWord);
            const subEnd = s.start + ((i + subWords.length) * secPerWord);
            subChunks.push({
              start: Math.round(subStart * 100) / 100,
              end: Math.round(subEnd * 100) / 100,
              text: subText
            });
          }
          return subChunks;
        });
      }
    }

    return generatePrecisionSubtitles(fullText, effectiveDuration);
  }, [segments, transcriptText, duration]);

  const activeSegment = useMemo(() => {
    if (!validSegments || validSegments.length === 0) return null;

    // 1. Direct active segment lookup within current time window [start - 0.05s, end + 0.15s]
    const direct = validSegments.find(
      s => currentTime >= (s.start - 0.05) && currentTime <= (s.end + 0.25)
    );
    if (direct) return direct;

    // 2. Pause handling: Keep previous 4-5 word phrase segment visible briefly during speech pauses
    const pastSegments = validSegments.filter(s => currentTime >= s.start);
    if (pastSegments.length > 0) {
      const lastPast = pastSegments[pastSegments.length - 1];
      const nextSeg = validSegments.find(s => s.start > currentTime);
      if (nextSeg ? currentTime < nextSeg.start : currentTime <= (lastPast.end + 1.8)) {
        return lastPast;
      }
    }

    return null;
  }, [validSegments, currentTime]);

  // Extract strict word tokens with exact start and end timestamps
  const wordTokens = useMemo(() => {
    if (!activeSegment || !activeSegment.text || isTitleFallbackText(activeSegment.text)) return [];

    const textWords = activeSegment.text.split(/\s+/).filter(Boolean);
    if (textWords.length === 0) return [];

    if (Array.isArray(activeSegment.words) && activeSegment.words.length > 0) {
      return activeSegment.words.map((wObj: any, idx: number) => {
        const rawWord = String(wObj.word || wObj.text || textWords[idx] || '').trim();
        const wStart = Number(wObj.start ?? wObj.start_time ?? 0);
        const wEnd = Number(wObj.end ?? wObj.end_time ?? (wStart + 0.35));
        return {
          word: rawWord,
          start: Math.round(wStart * 100) / 100,
          end: Math.round(Math.max(wStart + 0.08, wEnd) * 100) / 100
        };
      }).filter(t => t.word && !isTitleFallbackText(t.word));
    }

    // Fallback word token timings from precision generator
    return generatePrecisionSubtitles(activeSegment.text, duration).flatMap(s => s.words);
  }, [activeSegment, duration]);

  // Early returns strictly AFTER ALL HOOKS have run!
  if (!isActive) return null;
  if (!activeSegment || !activeSegment.text || isTitleFallbackText(activeSegment.text)) return null;

  return (
    <div className="absolute bottom-[180px] xs:bottom-[195px] sm:bottom-[215px] md:bottom-[230px] left-0 right-0 flex justify-center px-4 pointer-events-none z-[48] select-none transition-all duration-200">
      <div className="max-w-[90%] sm:max-w-[75%] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-150">
        <div className="bg-black/90 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.85)] text-center flex items-center justify-center whitespace-nowrap overflow-hidden">
          <p className="text-white text-[15px] sm:text-[17px] font-extrabold tracking-tight drop-shadow-md text-center whitespace-nowrap overflow-hidden text-ellipsis px-1">
            {activeSegment.text}
          </p>
        </div>
      </div>
    </div>
  );
};
