import React, { useMemo } from 'react';
import { generatePrecisionSubtitles, normalizeWordTimings } from '../utils/subtitleSync';

interface SubtitleOverlayProps {
  currentTime: number;
  segments?: any[];
  transcriptText?: string;
  duration?: number;
  isActive: boolean;
  isLiveRecording?: boolean;
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
  isActive,
  isLiveRecording = false
}) => {
  // CRITICAL: ALL Hooks MUST execute unconditionally in every render cycle. NO early returns before Hooks!
  const { validSegments, fullText } = useMemo(() => {
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
    let text = "";
    if (parsed.length > 0) {
      text = parsed
        .map(s => String(s?.text || s?.transcript || '').trim())
        .filter(s => s && !isTitleFallbackText(s))
        .join(" ");
    }
    if (!text && transcriptText && transcriptText.trim()) {
      const clean = transcriptText.trim();
      if (!isTitleFallbackText(clean)) {
        text = clean;
      }
    }

    if (!text || isTitleFallbackText(text)) return { validSegments: [], fullText: "" };

    const effectiveDuration = duration && duration > 0 ? duration : 60;

    // Priority 1: Use explicit hardware-timed segments if available
    if (parsed.length > 0) {
      const validArray = parsed
        .filter(s => s && (s.text || s.transcript) && !isTitleFallbackText(s.text || s.transcript))
        .map((s: any) => ({
          start: Number(s.start ?? s.start_time ?? 0),
          end: Number(s.end ?? s.end_time ?? (Number(s.start ?? 0) + 1.2)),
          text: String(s.text || s.transcript || '').trim(),
          words: Array.isArray(s.words) ? s.words : undefined
        }));

      if (validArray.length > 0) {
        return { validSegments: validArray, fullText: text };
      }
    }

    const precision = generatePrecisionSubtitles(text, effectiveDuration);
    return { validSegments: precision, fullText: text };
  }, [segments, transcriptText, duration]);

  const activeSegment = useMemo(() => {
    if (!validSegments || validSegments.length === 0) return null;

    if (isLiveRecording) {
      // Live recording teleprompter view: pick current active phrase or hold last spoken phrase
      const direct = validSegments.find(
        s => currentTime >= (s.start - 0.2) && currentTime <= (s.end + 1.5)
      );
      if (direct) return direct;

      const last = validSegments[validSegments.length - 1];
      if (last && currentTime >= (last.start - 0.5)) return last;
      return validSegments[0] || null;
    }

    // Playback view: strict YouTube CC timing with 2.0s hold-over to bridge pauses so captions never vanish mid-video
    const direct = validSegments.find(
      s => currentTime >= (s.start - 0.1) && currentTime <= (s.end + 0.1)
    );
    if (direct) return direct;

    for (let i = 0; i < validSegments.length; i++) {
      const seg = validSegments[i];
      const nextSeg = validSegments[i + 1];
      const maxHold = nextSeg ? Math.min(seg.end + 2.0, nextSeg.start) : seg.end + 2.0;

      if (currentTime >= seg.start && currentTime <= maxHold) {
        return seg;
      }
    }

    return null;
  }, [validSegments, currentTime, isLiveRecording]);

  // Extract strict word tokens with exact start and end timestamps
  const wordTokens = useMemo(() => {
    if (!activeSegment || !activeSegment.text || isTitleFallbackText(activeSegment.text)) return [];

    const textWords = activeSegment.text.split(/\s+/).filter(Boolean);
    if (textWords.length === 0) return [];

    if (Array.isArray(activeSegment.words) && activeSegment.words.length > 0) {
      return normalizeWordTimings(activeSegment.words, activeSegment.start, activeSegment.end, activeSegment.text);
    }

    return normalizeWordTimings([], activeSegment.start, activeSegment.end, activeSegment.text);
  }, [activeSegment]);

  // Detect Right-to-Left languages (Arabic, Hebrew, Persian, Urdu, etc.)
  const isRTL = useMemo(() => {
    if (!activeSegment?.text) return false;
    return /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(activeSegment.text);
  }, [activeSegment]);

  // Early returns strictly AFTER ALL HOOKS have run!
  if (!isActive) return null;
  if (!activeSegment || !activeSegment.text || isTitleFallbackText(activeSegment.text)) return null;

  return (
    <div className="absolute bottom-[160px] xs:bottom-[175px] sm:bottom-[195px] md:bottom-[210px] left-0 right-0 flex justify-center px-3 pointer-events-none z-[48] select-none transition-all duration-150">
      <div className="max-w-[95%] sm:max-w-[88%] animate-in fade-in zoom-in-95 duration-100 flex justify-center">
        <div
          dir={isRTL ? "rtl" : "ltr"}
          className="bg-black/85 backdrop-blur-xl px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl sm:rounded-3xl border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.85)] text-center flex items-center justify-center max-w-full overflow-hidden"
        >
          {wordTokens.length > 0 ? (
            <p className="text-[13px] xs:text-[14px] sm:text-[16px] font-extrabold tracking-tight drop-shadow-md text-center leading-none px-0.5 max-w-full whitespace-nowrap overflow-hidden text-ellipsis flex flex-nowrap items-center justify-center gap-x-1.5">
              {wordTokens.map((w, idx) => {
                const isCurrent = currentTime >= (w.start - 0.05) && currentTime <= (w.end + 0.05);
                const isSpoken = currentTime > (w.end + 0.05);
                return (
                  <span
                    key={`${w.word}-${idx}`}
                    className={`inline-block whitespace-nowrap transition-all duration-75 ${
                      isCurrent
                        ? 'text-amber-300 font-black scale-105 drop-shadow-[0_2px_8px_rgba(251,191,36,0.8)]'
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
          ) : (
            <p className="text-white text-[13px] xs:text-[14px] sm:text-[16px] font-extrabold tracking-tight drop-shadow-md text-center leading-none px-0.5 max-w-full whitespace-nowrap overflow-hidden text-ellipsis flex items-center justify-center">
              {activeSegment.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

