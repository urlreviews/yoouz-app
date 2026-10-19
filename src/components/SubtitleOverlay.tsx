import React, { useMemo } from 'react';
import { getWordPhoneticWeight, splitWordsIntoSingleLineChunks } from '../utils/subtitleSync';

interface SubtitleCue {
  id: number;
  start: number;
  end: number;
  text: string;
  words?: { text: string; start: number; end: number }[];
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
 * Helper to split a longer subtitle cue into short 3-4 word 1-line phrase chunks with acoustic phonetic timing.
 * Guarantees that subtitles stay on 1 clean line and advance smoothly in sync with spoken audio.
 */
const chunkCueTo1Line = (
  start: number,
  end: number,
  text: string,
  maxWordsPerChunk = 4
): { start: number; end: number; text: string }[] => {
  const cleanText = text.trim();
  if (!cleanText) return [];

  const words = cleanText.split(/\s+/).filter(Boolean);
  if (words.length <= maxWordsPerChunk) {
    return [{ start, end, text: cleanText }];
  }

  // Use clause-aware chunking with a smaller limit (4 words) to guarantee 1 line on mobile
  const wordGroups = splitWordsIntoSingleLineChunks(words, maxWordsPerChunk);
  if (wordGroups.length === 0) return [];

  const totalDuration = Math.max(0.6, end - start);
  const groupWeights = wordGroups.map(group =>
    group.reduce((acc, w) => acc + getWordPhoneticWeight(w), 0)
  );
  const totalWeight = groupWeights.reduce((a, b) => a + b, 0);

  const chunks: { start: number; end: number; text: string }[] = [];
  let currentStart = start;

  for (let idx = 0; idx < wordGroups.length; idx++) {
    const group = wordGroups[idx];
    const groupText = group.join(' ');
    const groupWeight = groupWeights[idx];
    const groupDuration = totalWeight > 0 ? totalDuration * (groupWeight / totalWeight) : totalDuration / wordGroups.length;

    const groupEnd = idx === wordGroups.length - 1
      ? end
      : Math.round((currentStart + groupDuration) * 100) / 100;

    chunks.push({
      start: Math.round(currentStart * 100) / 100,
      end: Math.max(currentStart + 0.3, groupEnd),
      text: groupText
    });

    currentStart = groupEnd;
  }

  return chunks;
};

/**
 * Standard YouTube Subtitle Engine (Rebuilt with 1-Line CapCut / TikTok Phrase Chunking)
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

    if (rawList.length > 0) {
      for (const item of rawList) {
        const txt = String(item?.text || item?.transcript || '').trim();
        if (!txt || isIgnoredTitle(txt)) continue;

        const s = typeof item?.start === 'number' && !isNaN(item.start) ? Math.max(0, item.start) : -1;
        const e = typeof item?.end === 'number' && !isNaN(item.end) ? Math.max(s + 0.3, item.end) : -1;

        // If the segment already has high-precision words (from Bunny Stream or our new parser)
        if (Array.isArray(item.words) && item.words.length > 0) {
          // Group these words into small chunks of 4 words max
          let currentChunk: any[] = [];
          for (let i = 0; i < item.words.length; i++) {
            currentChunk.push(item.words[i]);
            if (currentChunk.length === 4 || i === item.words.length - 1) {
              const chunkText = currentChunk.map(w => w.text || w.word).join(" ");
              const chunkStart = currentChunk[0].start;
              const chunkEnd = currentChunk[currentChunk.length - 1].end;
              cleanCues.push({
                id: cueId++,
                start: chunkStart,
                end: chunkEnd,
                text: chunkText
              });
              currentChunk = [];
            }
          }
        } else {
          // Fallback to phonetic guessing for 1-line chunks
          const phraseChunks = chunkCueTo1Line(s >= 0 ? s : (cueId - 1) * 2.5, e >= s ? e : s + 2.0, txt, 4);
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
    }

    // PATH B: Fallback when only raw transcriptText is present
    if (cleanCues.length === 0 && transcriptText && transcriptText.trim()) {
      const clean = transcriptText.trim();
      if (!isIgnoredTitle(clean)) {
        const rawSentences = clean.split(/(?<=[.?!])\s+/).map(s => s.trim()).filter(Boolean);
        const videoDur = duration && duration > 2 ? duration : 15;
        let curStart = 0.5;
        for (const sText of rawSentences) {
          const phraseChunks = chunkCueTo1Line(curStart, Math.min(videoDur, curStart + 3.0), sText, 4);
          for (const chunk of phraseChunks) {
            cleanCues.push({
              id: cueId++,
              start: chunk.start,
              end: chunk.end,
              text: chunk.text
            });
          }
          curStart += 3.2;
        }
      }
    }

    return cleanCues;
  }, [segments, transcriptText, duration]);

  const activeCue = useMemo<SubtitleCue | null>(() => {
    if (!isActive || cues.length === 0) return null;
    if (isLiveRecording) return cues[cues.length - 1] || null;

    for (const cue of cues) {
      if (currentTime >= cue.start && currentTime <= cue.end) {
        return cue;
      }
    }
    return null;
  }, [cues, currentTime, isActive, isLiveRecording]);

  const isRTL = useMemo(() => {
    if (!activeCue?.text) return false;
    return /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(activeCue.text);
  }, [activeCue]);

  if (!isActive || !activeCue || !activeCue.text) return null;

  return (
    <div className="absolute bottom-[250px] xs:bottom-[260px] sm:bottom-[270px] md:bottom-[240px] left-0 right-0 flex justify-center px-6 pointer-events-none z-[48] select-none">
      <div className="max-w-[85%] flex justify-center">
        <div
          dir={isRTL ? 'rtl' : 'ltr'}
          className="bg-black/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/25 shadow-[0_8px_32px_rgba(0,0,0,0.8)] text-center flex items-center justify-center"
        >
          <p className="text-[15px] sm:text-[17px] md:text-[19px] font-black tracking-tight text-center leading-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            {activeCue.text}
          </p>
        </div>
      </div>
    </div>
  );
};

export const buildSegmentsFromTranscript = (_text?: string, _duration?: number): any[] => [];
