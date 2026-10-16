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
 * Helper to split a longer subtitle cue into short 4-5 word 1-line phrase chunks with proportional timing.
 * Guarantees that subtitles stay on 1 clean line and advance smoothly as the video plays.
 */
const chunkCueTo1Line = (
  start: number,
  end: number,
  text: string,
  maxWordsPerChunk = 5
): { start: number; end: number; text: string }[] => {
  const cleanText = text.trim();
  if (!cleanText) return [];

  const words = cleanText.split(/\s+/).filter(Boolean);
  if (words.length <= maxWordsPerChunk) {
    return [{ start, end, text: cleanText }];
  }

  const chunks: { start: number; end: number; text: string }[] = [];
  const totalWords = words.length;
  const totalDuration = Math.max(0.8, end - start);

  const wordGroups: string[][] = [];
  for (let i = 0; i < totalWords; i += maxWordsPerChunk) {
    wordGroups.push(words.slice(i, i + maxWordsPerChunk));
  }

  const numGroups = wordGroups.length;
  let currentStart = start;

  for (let idx = 0; idx < numGroups; idx++) {
    const group = wordGroups[idx];
    const groupText = group.join(' ');
    const groupRatio = group.length / totalWords;
    const groupDuration = totalDuration * groupRatio;
    
    const groupEnd = idx === numGroups - 1 
      ? end 
      : Math.round((currentStart + groupDuration) * 100) / 100;

    chunks.push({
      start: Math.round(currentStart * 100) / 100,
      end: Math.max(currentStart + 0.4, groupEnd),
      text: groupText
    });

    currentStart = groupEnd;
  }

  return chunks;
};

/**
 * Standard YouTube Subtitle Engine (Rebuilt with 1-Line CapCut / TikTok Phrase Chunking)
 * 1. Short 4-5 word phrase chunking: Guarantees subtitles fit on 1 clean line.
 * 2. Precision time-window matching: A subtitle cue is shown ONLY during [cue.start, cue.end].
 * 3. Instant disappear: When speech ends or between sentences, the subtitle disappears completely.
 * 4. Strict anti-repetition: Collapses identical consecutive lines into single sequential cues.
 */
export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  currentTime = 0,
  segments,
  transcriptText,
  duration = 15,
  isActive = false,
  isLiveRecording = false
}) => {
  // Parse and build clean 1-line phrase subtitle cues
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

      // Step 2: Strict Deduplication
      const mergedList: { start: number; end: number; text: string }[] = [];

      for (const item of candidateList) {
        if (mergedList.length === 0) {
          mergedList.push({ ...item });
          continue;
        }

        const prev = mergedList[mergedList.length - 1];
        const prevNorm = prev.text.toLowerCase().replace(/[^a-z0-9]/g, '');
        const currNorm = item.text.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (prevNorm === currNorm) {
          if (item.end > prev.end) prev.end = item.end;
          continue;
        }

        if (currNorm.startsWith(prevNorm) && item.start <= prev.end + 0.5) {
          prev.text = item.text;
          if (item.end > prev.end) prev.end = item.end;
          continue;
        }

        mergedList.push({ ...item });
      }

      // Step 3: Normalize cue durations and split long segments into 1-line 4-5 word phrase chunks
      for (let i = 0; i < mergedList.length; i++) {
        const item = mergedList[i];
        let s = item.start >= 0 ? item.start : i * 2.5;
        let e = item.end > s ? item.end : s + 2.0;

        if (e - s < 0.8) e = s + 0.8;
        if (e - s > 12.0) e = s + 12.0;

        // Apply 1-line phrase chunker
        const phraseChunks = chunkCueTo1Line(s, e, item.text, 5);
        for (const chunk of phraseChunks) {
          cleanCues.push({
            id: cueId++,
            start: chunk.start,
            end: chunk.end,
            text: chunk.text
          });
        }
      }
    }

    // PATH B: Fallback when only raw transcriptText is present (no pre-timed segments)
    if (cleanCues.length === 0 && transcriptText && transcriptText.trim()) {
      const clean = transcriptText.trim();
      if (!isIgnoredTitle(clean)) {
        const rawSentences = clean
          .split(/(?<=[.?!])\s+/)
          .map(s => s.trim())
          .filter(Boolean);

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
            
            // Apply 1-line phrase chunker
            const phraseChunks = chunkCueTo1Line(curStart, sEnd, sText, 5);
            for (const chunk of phraseChunks) {
              cleanCues.push({
                id: cueId++,
                start: chunk.start,
                end: chunk.end,
                text: chunk.text
              });
            }
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
    <div className="absolute bottom-[200px] xs:bottom-[210px] sm:bottom-[220px] md:bottom-[240px] left-3.5 sm:left-4 right-16 sm:right-20 md:left-0 md:right-0 flex justify-start md:justify-center pointer-events-none z-[48] select-none transition-opacity duration-150">
      <div className="max-w-full md:max-w-[620px] flex justify-start md:justify-center">
        <div
          dir={isRTL ? 'rtl' : 'ltr'}
          className="bg-black/80 backdrop-blur-sm px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-lg border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.85)] text-left md:text-center flex items-center justify-start md:justify-center max-w-full"
        >
          <p className="text-[14px] sm:text-[16px] md:text-[18px] font-medium tracking-normal text-left md:text-center leading-snug px-1 text-white break-words max-w-full drop-shadow">
            {activeCue.text}
          </p>
        </div>
      </div>
    </div>
  );
};

export const buildSegmentsFromTranscript = (_text?: string, _duration?: number): any[] => [];
