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

// Helper to build short 3-5 word single-line timed segments from transcript text with natural conversational cadence (approx 0.28s-0.35s per word, never stretched over dead air)
export const buildSegmentsFromTranscript = (text: string, totalDuration: number = 60, startOffset: number = 0) => {
  if (!text || !text.trim() || isTitleFallbackText(text)) return [];

  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const chunks: { start: number; end: number; text: string; words: { word: string; start: number; end: number }[] }[] = [];
  const maxWordsPerLine = 4; // Strict 3-5 words max per line for premium TikTok/Reels single-line captions

  let currentWordIdx = 0;
  let runningTime = Math.max(0, startOffset);

  while (currentWordIdx < words.length) {
    const chunkWords = words.slice(currentWordIdx, currentWordIdx + maxWordsPerLine);
    const chunkText = chunkWords.join(' ');
    currentWordIdx += chunkWords.length;

    if (isTitleFallbackText(chunkText)) continue;

    const chunkStart = runningTime;
    const wordTimings = chunkWords.map((w) => {
      // Natural human speech cadence based on syllable/character length: 0.20s to 0.45s per word
      const wDur = Math.max(0.20, Math.min(0.50, 0.12 + (w.length * 0.035)));
      const wStart = runningTime;
      const wEnd = runningTime + wDur;
      runningTime = wEnd + 0.04; // Micro gap between spoken words
      return {
        word: w,
        start: Math.round(wStart * 100) / 100,
        end: Math.round(wEnd * 100) / 100
      };
    });

    const chunkEnd = wordTimings[wordTimings.length - 1].end;
    runningTime += 0.25; // Natural breath pause between subtitle phrases

    chunks.push({
      start: Math.round(chunkStart * 100) / 100,
      end: Math.round(chunkEnd * 100) / 100,
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

    // Priority 1: Use exact acoustic speech-to-text timestamps when real segments exist
    if (parsed.length > 0) {
      const refined: { start: number; end: number; text: string; words?: any[] }[] = [];
      for (const s of parsed) {
        const rawText = String(s.text || s.transcript || '').trim();
        const start = Number(s.start ?? s.start_time ?? 0);
        const end = Number(s.end ?? s.end_time ?? (start + 3.0));
        const segDuration = Math.max(0.3, end - start);

        if (!rawText || isTitleFallbackText(rawText)) continue;

        // Check if segment has explicit acoustic word objects array
        const rawWords: any[] = Array.isArray(s.words) && s.words.length > 0
          ? s.words
          : (Array.isArray(s.word_timestamps) && s.word_timestamps.length > 0 ? s.word_timestamps : []);

        if (rawWords.length > 0) {
          // Normalize words array with exact acoustic timestamps
          const cleanWords = rawWords.map((wObj: any) => ({
            word: String(wObj.word || wObj.text || '').trim(),
            start: Number(wObj.start ?? wObj.start_time ?? start),
            end: Number(wObj.end ?? wObj.end_time ?? (Number(wObj.start ?? start) + 0.32))
          })).filter(w => w.word && !isTitleFallbackText(w.word));

          if (cleanWords.length > 0) {
            // Chunk into max 4 words per display line, strictly preserving untouched acoustic timestamps
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
            continue;
          }
        }

        // Fallback for segments without explicit per-word array
        const wordCount = rawText.split(/\s+/).length;
        if (wordCount > 4) {
          const subChunks = buildSegmentsFromTranscript(rawText, segDuration, start);
          refined.push(...subChunks);
        } else {
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
          refined.push({ start, end, text: rawText, words: wordTimings });
        }
      }

      // If acoustic segments exist, ALWAYS respect them without discarding valid speech offsets!
      if (refined.length > 0) {
        return refined;
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

    // 1. If playback time is before the speaker even starts speaking, show nothing
    if (currentTime < (validSegments[0].start - 0.08)) {
      return null;
    }

    // 2. Direct active segment lookup within current time window [start - 0.06s, end + 0.12s]
    const direct = validSegments.find(
      s => currentTime >= (s.start - 0.06) && currentTime <= (s.end + 0.12)
    );
    if (direct) return direct;

    // 3. Pause handling: If currentTime is in a pause AFTER a segment ends but BEFORE the next segment starts,
    // keep the previous segment visible with all spoken words in past (white) state so captions don't flicker away during pauses.
    const pastSegments = validSegments.filter(s => currentTime >= s.start);
    if (pastSegments.length > 0) {
      const lastPast = pastSegments[pastSegments.length - 1];
      const nextSeg = validSegments.find(s => s.start > currentTime);
      if (nextSeg ? currentTime < nextSeg.start : currentTime <= (lastPast.end + 2.5)) {
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

    // Priority 1: Use explicit word timestamps from activeSegment.words if available
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

    // Priority 2: Derive strict acoustic word token bounds across the segment (capped to spoken duration so trailing silence does not stretch words)
    const segStart = Number(activeSegment.start ?? 0);
    const segEnd = Number(activeSegment.end ?? (segStart + 3.0));
    const segDuration = Math.max(0.1, segEnd - segStart);
    const estimatedSpokenDuration = Math.min(segDuration, Math.max(0.8, textWords.length * 0.35));

    const totalChars = textWords.reduce((acc, w) => acc + Math.max(1, w.length), 0) || 1;
    let accum = segStart;

    return textWords.map((w) => {
      const wDur = (Math.max(1, w.length) / totalChars) * estimatedSpokenDuration;
      const wStart = accum;
      const wEnd = accum + wDur;
      accum = wEnd;
      return {
        word: w,
        start: Math.round(wStart * 100) / 100,
        end: Math.round(wEnd * 100) / 100
      };
    });
  }, [activeSegment]);

  // Early returns strictly AFTER ALL HOOKS have run!
  if (!isActive) return null;
  if (!activeSegment || wordTokens.length === 0) return null;

  return (
    <div className="absolute bottom-[180px] xs:bottom-[195px] sm:bottom-[215px] md:bottom-[230px] left-0 right-0 flex justify-center px-4 pointer-events-none z-[48] select-none transition-all duration-300">
      <div className="max-w-[85%] sm:max-w-[78%] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-150">
        <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.85)] text-center flex items-center justify-center gap-1.5 flex-wrap">
          {wordTokens.map((token, index) => {
            // STRICT ACOUSTIC BOUNDARY CHECK:
            // The word becomes yellow ONLY when currentTime is strictly between token.start and token.end.
            // During pauses or silence, currentTime is not inside [token.start, token.end], so NO word is yellow.
            // It will NEVER jump ahead during pauses or before the speaker actually says it.
            const isActiveWord = currentTime >= token.start && currentTime <= token.end;
            const isPastWord = currentTime > token.end;

            return (
              <span
                key={`${token.word}-${index}`}
                className={`transition-all duration-100 leading-tight inline-block ${
                  isActiveWord
                    ? "text-amber-400 font-black scale-105 drop-shadow-[0_0_12px_rgba(250,204,21,0.85)]"
                    : isPastWord
                    ? "text-white font-bold opacity-90"
                    : "text-white/70 font-semibold"
                } text-[13px] sm:text-[15px]`}
              >
                {token.word}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};
