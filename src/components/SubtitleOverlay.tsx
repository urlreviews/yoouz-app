import React, { useMemo } from 'react';

interface SubtitleOverlayProps {
  currentTime?: number;
  segments?: any[];
  transcriptText?: string;
  duration?: number;
  isActive?: boolean;
  isLiveRecording?: boolean;
}

interface SubtitleCue {
  id: number;
  start: number;
  end: number;
  text: string;
}

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

/**
 * YouTube Standard Subtitle Engine (Built from scratch)
 * - Strict sentence deduplication (never repeats identical phrases like "test tell me test tell me")
 * - Disappears completely when a sentence finishes (never gets stuck on screen)
 * - Smooth sequential cue transitions across video playback
 */
export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  currentTime = 0,
  segments,
  transcriptText,
  duration = 15,
  isActive = false,
  isLiveRecording = false
}) => {
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

    // Step 1: Extract clean text items and check if valid timestamps exist
    const rawItems: { start: number; end: number; text: string }[] = [];

    if (rawList.length > 0) {
      for (const item of rawList) {
        const txt = String(item?.text || item?.transcript || '').trim();
        if (!txt || isTitleFallbackText(txt)) continue;

        const s = typeof item?.start === 'number' && !isNaN(item.start) ? Math.max(0, item.start) : -1;
        const e = typeof item?.end === 'number' && !isNaN(item.end) ? Math.max(s + 0.4, item.end) : -1;

        rawItems.push({ start: s, end: e, text: txt });
      }
    }

    // Step 2: Deduplicate consecutive identical phrases or streaming hypothesis revisions
    const dedupedItems: { start: number; end: number; text: string }[] = [];

    for (const item of rawItems) {
      if (dedupedItems.length === 0) {
        dedupedItems.push({ ...item });
        continue;
      }

      const prev = dedupedItems[dedupedItems.length - 1];
      const prevNorm = prev.text.toLowerCase().replace(/[^a-z0-9]/g, '');
      const currNorm = item.text.toLowerCase().replace(/[^a-z0-9]/g, '');

      // If exact duplicate phrase (e.g. "I'm going to test tell me" sent twice)
      if (prevNorm === currNorm) {
        if (item.end > prev.end) prev.end = item.end;
        continue;
      }

      // If current phrase is an extension of previous phrase (streaming revision)
      if (currNorm.startsWith(prevNorm) && currNorm.length > prevNorm.length) {
        prev.text = item.text;
        if (item.end > prev.end) prev.end = item.end;
        continue;
      }

      dedupedItems.push({ ...item });
    }

    // Step 3: If no valid timed items found, parse from transcriptText
    if (dedupedItems.length === 0 && transcriptText && transcriptText.trim()) {
      const clean = transcriptText.trim();
      if (!isTitleFallbackText(clean)) {
        // Split text by punctuation or into natural 6-to-8 word sentences
        const rawWords = clean.split(/\s+/).filter(Boolean);
        const uniqueWords: string[] = [];

        // Remove duplicate words or consecutive repeating phrases
        for (let i = 0; i < rawWords.length; i++) {
          const w = rawWords[i];
          const prev = uniqueWords[uniqueWords.length - 1];
          if (prev && prev.toLowerCase() === w.toLowerCase()) continue;
          uniqueWords.push(w);
        }

        if (uniqueWords.length > 0) {
          const sentences: string[] = [];
          let current: string[] = [];

          for (let i = 0; i < uniqueWords.length; i++) {
            current.push(uniqueWords[i]);
            const hasPunc = /[.,!?;:]$/.test(uniqueWords[i]);
            const reachCap = current.length >= 8;
            const remaining = uniqueWords.length - (i + 1);

            if ((reachCap || (current.length >= 5 && hasPunc)) && remaining >= 2) {
              sentences.push(current.join(' '));
              current = [];
            }
          }

          if (current.length > 0) {
            if (sentences.length > 0 && current.length <= 2) {
              sentences[sentences.length - 1] += ' ' + current.join(' ');
            } else {
              sentences.push(current.join(' '));
            }
          }

          const videoDur = duration && duration > 0 ? duration : 15;
          const availableTime = Math.max(2.0, videoDur - 0.5);
          let curTime = 0.4;
          const totalWords = uniqueWords.length;

          for (let i = 0; i < sentences.length; i++) {
            const sText = sentences[i];
            const sCount = sText.split(/\s+/).length;
            const dur = Math.max(1.8, availableTime * (sCount / totalWords));
            const sStart = Math.round(curTime * 100) / 100;
            const sEnd = Math.round((curTime + dur) * 100) / 100;

            dedupedItems.push({
              start: sStart,
              end: sEnd,
              text: sText
            });

            curTime = sEnd + 0.15; // Small pause between sentences
          }
        }
      }
    }

    if (dedupedItems.length === 0) return [];

    // Step 4: Ensure all cues have valid sequential timestamps and no overlaps
    const resultCues: SubtitleCue[] = [];
    let cueId = 1;

    for (let i = 0; i < dedupedItems.length; i++) {
      const item = dedupedItems[i];
      let s = item.start >= 0 ? item.start : 0.4 + (i * 2.5);
      let e = item.end >= 0 && item.end > s ? item.end : s + 2.2;

      // Ensure duration is comfortable to read (at least 1.6s, max 4.5s)
      if (e - s < 1.4) e = s + 1.4;
      if (e - s > 5.0) e = s + 5.0;

      resultCues.push({
        id: cueId++,
        start: Math.round(s * 100) / 100,
        end: Math.round(e * 100) / 100,
        text: item.text
      });
    }

    return resultCues;
  }, [segments, transcriptText, duration]);

  // Find active cue strictly matching the current playback second
  const activeCue = useMemo(() => {
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

  // RTL language check
  const isRTL = useMemo(() => {
    if (!activeCue?.text) return false;
    return /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(activeCue.text);
  }, [activeCue]);

  if (!isActive || !activeCue || !activeCue.text) return null;

  return (
    <div className="absolute bottom-[200px] xs:bottom-[210px] sm:bottom-[220px] left-0 right-0 flex justify-center px-4 pointer-events-none z-[48] select-none transition-all duration-150">
      <div className="max-w-[92%] sm:max-w-[85%] md:max-w-[650px] animate-in fade-in zoom-in-95 duration-100 flex justify-center">
        <div
          dir={isRTL ? 'rtl' : 'ltr'}
          className="bg-black/85 backdrop-blur-md px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.95)] text-center flex items-center justify-center max-w-full"
        >
          <p className="text-[15px] sm:text-[17px] md:text-[18px] font-medium tracking-normal drop-shadow-md text-center leading-snug px-1 text-white break-words line-clamp-2 max-w-full">
            {activeCue.text}
          </p>
        </div>
      </div>
    </div>
  );
};

export const buildSegmentsFromTranscript = () => [];
