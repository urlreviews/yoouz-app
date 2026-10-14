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

    // Priority 1: Use explicit VAD word timestamps if valid segments have them
    if (parsed.length > 0) {
      const refined: { start: number; end: number; text: string; words?: any[] }[] = [];
      let hasValidWordTimings = false;

      for (const s of parsed) {
        const rawText = String(s.text || s.transcript || '').trim();
        const start = Number(s.start ?? s.start_time ?? 0);
        const end = Number(s.end ?? s.end_time ?? (start + 3.5));

        if (!rawText || isTitleFallbackText(rawText)) continue;

        const rawWords: any[] = Array.isArray(s.words) && s.words.length > 0
          ? s.words
          : (Array.isArray(s.word_timestamps) && s.word_timestamps.length > 0 ? s.word_timestamps : []);

        if (rawWords.length > 0) {
          hasValidWordTimings = true;
          const cleanWords = rawWords.map((wObj: any) => ({
            word: String(wObj.word || wObj.text || '').trim(),
            start: Number(wObj.start ?? wObj.start_time ?? start),
            end: Number(wObj.end ?? wObj.end_time ?? (Number(wObj.start ?? start) + 0.35))
          })).filter(w => w.word && !isTitleFallbackText(w.word));

          if (cleanWords.length > 0) {
            for (let i = 0; i < cleanWords.length; i += 4) {
              const subGroup = cleanWords.slice(i, i + 4);
              const subStart = subGroup[0].start;
              const subEnd = subGroup[subGroup.length - 1].end;
              const subText = subGroup.map(w => w.word).join(" ");

              refined.push({
                start: Math.round(subStart * 100) / 100,
                end: Math.round(subEnd * 100) / 100,
                text: subText,
                words: subGroup
              });
            }
          }
        }
      }

      if (hasValidWordTimings && refined.length > 0) {
        return refined;
      }
    }

    // Priority 2: Use high-precision natural speech cadence generator only if NO hardware timing exists
    if (parsed.some(s => s.isHardwareTimed)) {
      return parsed.map(s => ({
        ...s,
        words: normalizeWordTimings(s.words || [], s.start, s.end, s.text)
      }));
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

    // 2. Pause handling: If currentTime is in a pause AFTER a segment ends but BEFORE the next segment starts,
    // keep the previous segment visible with all spoken words in past (white) state so captions don't flicker away during pauses.
    const pastSegments = validSegments.filter(s => currentTime >= s.start);
    if (pastSegments.length > 0) {
      const lastPast = pastSegments[pastSegments.length - 1];
      const nextSeg = validSegments.find(s => s.start > currentTime);
      if (nextSeg ? currentTime < nextSeg.start : currentTime <= (lastPast.end + 2.0)) {
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
    <div className="absolute bottom-[180px] xs:bottom-[195px] sm:bottom-[215px] md:bottom-[230px] left-0 right-0 flex justify-center px-4 pointer-events-none z-[48] select-none transition-all duration-300">
      <div className="max-w-[90%] sm:max-w-[75%] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-150">
        <div className="bg-black/85 backdrop-blur-xl px-5 py-2 rounded-full border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.85)] text-center flex items-center justify-center whitespace-nowrap overflow-hidden">
          <p className="text-white text-[15px] sm:text-[17px] font-bold leading-tight tracking-tight drop-shadow-md truncate">
            {activeSegment.text}
          </p>
        </div>
      </div>
    </div>
  );
};
