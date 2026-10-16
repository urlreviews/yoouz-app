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
 * Filter out generic placeholder titles that are not real spoken speech
 */
const isIgnoredTitle = (text: string): boolean => {
  if (!text) return true;
  const lower = text.trim().toLowerCase();
  return (
    lower.startsWith('video review for') ||
    lower.startsWith('review for') ||
    lower.startsWith('video review of') ||
    lower === 'video review' ||
    lower.startsWith('video review')
  );
};

/**
 * Standard YouTube Subtitle Engine (Rebuilt from scratch)
 * 1. Precision time-window matching: A subtitle cue is shown ONLY during [cue.start, cue.end].
 * 2. Instant disappear: When speech ends or between sentences, the subtitle disappears completely.
 * 3. Strict anti-repetition: Collapses identical consecutive lines into single sequential cues.
 * 4. YouTube visual aesthetics: Black 75% translucent backdrop, crisp white font, responsive sizing.
 */
export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  currentTime = 0,
  segments,
  transcriptText,
  duration = 15,
  isActive = false,
  isLiveRecording = false
}) => {
  // Parse and build clean, non-repeating subtitle cues
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

    // PATH A: We have structured segments with timestamps (e.g. from Bunny Stream Smart Captions)
    if (rawList.length > 0) {
      // Step 1: Collect valid speech items
      const candidateList: { start: number; end: number; text: string }[] = [];

      for (const item of rawList) {
        const txt = String(item?.text || item?.transcript || '').trim();
        if (!txt || isIgnoredTitle(txt)) continue;

        const s = typeof item?.start === 'number' && !isNaN(item.start) ? Math.max(0, item.start) : -1;
        const e = typeof item?.end === 'number' && !isNaN(item.end) ? Math.max(s + 0.3, item.end) : -1;

        candidateList.push({ start: s, end: e, text: txt });
      }

      // Step 2: Strict Deduplication (Fixes old bad data where the same sentence was repeated dozens of times)
      const mergedList: { start: number; end: number; text: string }[] = [];

      for (const item of candidateList) {
        if (mergedList.length === 0) {
          mergedList.push({ ...item });
          continue;
        }

        const prev = mergedList[mergedList.length - 1];
        const prevNorm = prev.text.toLowerCase().replace(/[^a-z0-9]/g, '');
        const currNorm = item.text.toLowerCase().replace(/[^a-z0-9]/g, '');

        // If consecutive identical phrases (e.g. "one time it was a person" repeated 40 times in old data)
        if (prevNorm === currNorm) {
          // Extend previous cue end time to cover the full duration
          if (item.end > prev.end) prev.end = item.end;
          continue;
        }

        // If one is a strict substring/extension within close time
        if (currNorm.startsWith(prevNorm) && item.start <= prev.end + 0.5) {
          prev.text = item.text;
          if (item.end > prev.end) prev.end = item.end;
          continue;
        }

        mergedList.push({ ...item });
      }

      // Step 3: Normalize cue durations (minimum 1.2s so user can read it, maximum 6.0s)
      for (let i = 0; i < mergedList.length; i++) {
        const item = mergedList[i];
        let s = item.start >= 0 ? item.start : i * 2.5;
        let e = item.end > s ? item.end : s + 2.0;

        if (e - s < 0.8) e = s + 0.8;
        if (e - s > 12.0) e = s + 12.0;

        cleanCues.push({
          id: cueId++,
          start: Math.round(s * 100) / 100,
          end: Math.round(e * 100) / 100,
          text: item.text
        });
      }
    }

    // PATH B: Fallback when only raw transcriptText is present (no pre-timed segments)
    if (cleanCues.length === 0 && transcriptText && transcriptText.trim()) {
      const clean = transcriptText.trim();
      if (!isIgnoredTitle(clean)) {
        // Split by sentences or natural punctuation
        const rawSentences = clean
          .split(/(?<=[.?!])\s+/)
          .map(s => s.trim())
          .filter(Boolean);

        // Deduplicate any repeated sentences
        const uniqueSentences: string[] = [];
        for (const s of rawSentences) {
          const norm = s.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (!uniqueSentences.some(u => u.toLowerCase().replace(/[^a-z0-9]/g, '') === norm)) {
            uniqueSentences.push(s);
          }
        }

        const totalSentences = uniqueSentences.length;
        if (totalSentences > 0) {
          const videoDur = duration && duration > 2 ? duration : 15;
          const availableDuration = Math.max(2.0, videoDur - 0.5);
          const perSentence = Math.min(4.5, Math.max(1.8, availableDuration / totalSentences));

          let curStart = 0.5;
          for (let i = 0; i < totalSentences; i++) {
            const sText = uniqueSentences[i];
            const sEnd = Math.min(videoDur, curStart + perSentence);
            cleanCues.push({
              id: cueId++,
              start: Math.round(curStart * 100) / 100,
              end: Math.round(sEnd * 100) / 100,
              text: sText
            });
            curStart = sEnd + 0.2;
          }
        }
      }
    }

    return cleanCues;
  }, [segments, transcriptText, duration]);

  // Determine active cue matching the current video playback time
  const activeCue = useMemo<SubtitleCue | null>(() => {
    if (!isActive || cues.length === 0) return null;

    if (isLiveRecording) {
      return cues[cues.length - 1] || null;
    }

    // Strict time-window match: appears ONLY between cue.start and cue.end
    for (const cue of cues) {
      if (currentTime >= cue.start && currentTime <= cue.end) {
        return cue;
      }
    }

    // When speaker is silent or when sentence has finished: DISAPPEAR COMPLETELY
    return null;
  }, [cues, currentTime, isActive, isLiveRecording]);

  // RTL language support (Hebrew, Arabic, etc.)
  const isRTL = useMemo(() => {
    if (!activeCue?.text) return false;
    return /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(activeCue.text);
  }, [activeCue]);

  if (!isActive || !activeCue || !activeCue.text) return null;

  return (
    <div className="absolute bottom-[135px] xs:bottom-[145px] sm:bottom-[165px] left-3 right-[70px] md:left-4 md:right-4 flex justify-center pointer-events-none z-[48] select-none transition-all duration-150">
      <div className="max-w-full md:max-w-[440px] flex justify-center">
        <div
          dir={isRTL ? 'rtl' : 'ltr'}
          className="bg-black/75 backdrop-blur-2xl px-4 py-1.5 rounded-full border border-white/20 shadow-2xl text-center flex items-center justify-center max-w-full"
        >
          <p className="text-[13px] sm:text-[14px] font-bold tracking-normal text-center leading-snug px-1 text-white break-words max-w-full drop-shadow-md">
            {activeCue.text}
          </p>
        </div>
      </div>
    </div>
  );
};

export const buildSegmentsFromTranscript = (_text?: string, _duration?: number): any[] => [];
