import React, { useMemo } from 'react';

interface SubtitleCue {
  id: number;
  start: number;
  end: number;
  text: string;
}

interface SubtitleOverlayProps {
  currentTime?: number;
  segments?: any[];
  transcriptText?: string;
  duration?: number;
  isActive?: boolean;
  isLiveRecording?: boolean;
}

/**
 * Helper to check if text is a raw filename or system placeholder to ignore
 */
export const isIgnoredTitle = (text: string): boolean => {
  if (!text) return true;
  const clean = text.trim().toLowerCase();
  return clean.startsWith('rev-') || clean.endsWith('.mp4') || clean.endsWith('.webm');
};

/**
 * Helper to build clean timed segments covering video duration from transcript text
 */
export const buildSegmentsFromTranscript = (text?: string, duration: number = 15): any[] => {
  if (!text || !text.trim()) return [];
  const clean = text.trim();
  if (isIgnoredTitle(clean)) return [];

  // Split by natural sentence boundaries or punctuation
  const rawSentences = clean
    .split(/(?<=[.?!,])\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  const sentences = rawSentences.length > 0 ? rawSentences : [clean];
  const total = sentences.length;
  const videoDur = duration > 2 ? duration : 15;
  const timePerSentence = (videoDur - 0.4) / total;

  const result: any[] = [];
  let curStart = 0.2;

  for (let i = 0; i < total; i++) {
    const curEnd = Math.min(videoDur, curStart + timePerSentence);
    result.push({
      start: Math.round(curStart * 100) / 100,
      end: Math.round(curEnd * 100) / 100,
      text: sentences[i]
    });
    curStart = curEnd;
  }

  return result;
};

/**
 * Original Bunny Stream Subtitle Engine
 * - Takes official Bunny Stream WebVTT timed segments directly.
 * - Displays captions matching video playback time [cue.start, cue.end].
 * - No word restrictions, line limits, or artificial chunking.
 */
export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  currentTime = 0,
  segments,
  transcriptText,
  duration = 15,
  isActive = false,
  isLiveRecording = false
}) => {
  // Extract subtitle cues directly from Bunny Stream VTT segments
  const cues = useMemo<SubtitleCue[]>(() => {
    let rawList: any[] = [];
    if (Array.isArray(segments) && segments.length > 0) {
      rawList = segments;
    } else if (typeof segments === 'string') {
      try {
        const parsed = JSON.parse(segments);
        if (Array.isArray(parsed)) rawList = parsed;
      } catch (e) {}
    }

    const cleanCues: SubtitleCue[] = [];
    let cueId = 1;

    // Use Bunny Stream WebVTT segments directly as generated
    if (rawList.length > 0) {
      for (const item of rawList) {
        const txt = String(item?.text || item?.transcript || '').trim();
        if (!txt || isIgnoredTitle(txt)) continue;

        const s = typeof item?.start === 'number' && !isNaN(item.start) ? Math.max(0, item.start) : -1;
        const e = typeof item?.end === 'number' && !isNaN(item.end) ? Math.max(s + 0.3, item.end) : -1;

        const startTime = s >= 0 ? s : (cleanCues.length * 2.5);
        const endTime = e > startTime ? e : (startTime + 2.5);

        cleanCues.push({
          id: cueId++,
          start: Math.round(startTime * 100) / 100,
          end: Math.round(endTime * 100) / 100,
          text: txt
        });
      }
    }

    // Fallback if segments were missing: build from transcriptText
    const videoDur = duration && duration > 2 ? duration : 15;
    if (cleanCues.length === 0 && transcriptText && transcriptText.trim()) {
      const generated = buildSegmentsFromTranscript(transcriptText, videoDur);
      if (generated.length > 0) {
        return generated.map((g: any, idx: number) => ({
          id: idx + 1,
          start: g.start,
          end: g.end,
          text: g.text
        }));
      }
    }

    return cleanCues;
  }, [segments, transcriptText, duration]);

  // Determine active subtitle cue matching current video playback time
  const activeCue = useMemo<SubtitleCue | null>(() => {
    if (!isActive || cues.length === 0) return null;

    if (isLiveRecording) {
      return cues[cues.length - 1] || null;
    }

    // Direct timestamp match
    for (const cue of cues) {
      if (currentTime >= cue.start && currentTime <= cue.end) {
        return cue;
      }
    }

    // Small 0.4s tolerance gap between consecutive cues to prevent subtitle blinking
    for (let i = 0; i < cues.length - 1; i++) {
      if (currentTime > cues[i].end && currentTime < cues[i + 1].start) {
        return cues[i];
      }
    }

    // Before first cue start time, show cue #1 if video is active
    if (cues.length > 0 && currentTime < cues[0].start && currentTime >= 0) {
      return cues[0];
    }

    // Keep last cue visible if playback is past the last timestamp
    if (cues.length > 0) {
      const lastCue = cues[cues.length - 1];
      if (currentTime > lastCue.end && currentTime <= duration) {
        return lastCue;
      }
    }

    return null;
  }, [cues, currentTime, duration, isActive, isLiveRecording]);

  // RTL language support (Hebrew, Arabic, etc.)
  const isRTL = useMemo(() => {
    if (!activeCue?.text) return false;
    return /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(activeCue.text);
  }, [activeCue]);

  if (!isActive || !activeCue || !activeCue.text) return null;

  return (
    <div className="absolute bottom-[180px] xs:bottom-[190px] sm:bottom-[210px] md:bottom-[230px] left-3 right-[70px] md:left-4 md:right-4 flex justify-center pointer-events-none z-[48] select-none transition-all duration-150">
      <div className="max-w-full md:max-w-[440px] flex justify-center">
        <div
          dir={isRTL ? 'rtl' : 'ltr'}
          className="bg-black/80 backdrop-blur-2xl px-4 py-1.5 rounded-2xl border border-white/20 shadow-2xl text-center flex items-center justify-center max-w-full"
        >
          <p className="text-[13px] sm:text-[14px] font-bold tracking-normal text-center leading-snug px-1 text-white break-words max-w-full drop-shadow-md">
            {activeCue.text}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubtitleOverlay;
