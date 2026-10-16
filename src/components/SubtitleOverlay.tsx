import React, { useMemo } from 'react';

interface SubtitleOverlayProps {
  currentTime?: number;
  segments?: any[];
  transcriptText?: string;
  duration?: number;
  isActive?: boolean;
  isLiveRecording?: boolean;
}

interface TwoLineSubtitleBlock {
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
 * Combines short spoken segments into 2-line subtitle blocks (11-15 words per block)
 * and maps them to exact acoustic start/end timestamps.
 */
const buildTwoLineSubtitleBlocks = (
  segments?: any[],
  transcriptText?: string,
  duration = 15
): TwoLineSubtitleBlock[] => {
  let rawList: any[] = [];

  if (Array.isArray(segments) && segments.length > 0) {
    rawList = segments;
  } else if (typeof segments === 'string') {
    try {
      const parsed = JSON.parse(segments);
      if (Array.isArray(parsed)) rawList = parsed;
    } catch (e) {}
  }

  // Step 1: Collect clean timed items from rawList or build from transcriptText
  const timedItems: { start: number; end: number; text: string }[] = [];

  if (rawList.length > 0) {
    for (const item of rawList) {
      const txt = String(item?.text || item?.transcript || '').trim();
      if (!txt || isTitleFallbackText(txt)) continue;

      const s = typeof item?.start === 'number' && !isNaN(item.start) ? Math.max(0, item.start) : -1;
      const e = typeof item?.end === 'number' && !isNaN(item.end) ? Math.max(s + 0.5, item.end) : -1;

      timedItems.push({ start: s, end: e, text: txt });
    }
  }

  // Fallback if no valid timed items exist
  if (timedItems.length === 0 && transcriptText && transcriptText.trim()) {
    const cleanText = transcriptText.trim();
    if (!isTitleFallbackText(cleanText)) {
      const words = cleanText.split(/\s+/).filter(Boolean);
      const videoDur = duration && duration > 0 ? duration : 15;
      const secPerWord = Math.max(0.25, (videoDur - 0.5) / Math.max(1, words.length));

      let curSec = 0.2;
      for (let i = 0; i < words.length; i += 6) {
        const chunkWords = words.slice(i, i + 6);
        const chunkDur = chunkWords.length * secPerWord;
        timedItems.push({
          start: Math.round(curSec * 100) / 100,
          end: Math.round((curSec + chunkDur) * 100) / 100,
          text: chunkWords.join(' ')
        });
        curSec += chunkDur;
      }
    }
  }

  if (timedItems.length === 0) return [];

  // Step 2: Group short items into 2-line blocks of 11 to 15 words
  const blocks: TwoLineSubtitleBlock[] = [];
  let blockId = 1;

  let currentBlockWords: string[] = [];
  let currentBlockStart = -1;
  let currentBlockEnd = -1;

  const targetWordsPerBlock = 12; // 12 words naturally wrap into 2 clean lines

  for (let i = 0; i < timedItems.length; i++) {
    const item = timedItems[i];
    const itemWords = item.text.split(/\s+/).filter(Boolean);

    if (currentBlockStart < 0) {
      currentBlockStart = item.start >= 0 ? item.start : 0.2;
    }

    currentBlockWords.push(...itemWords);
    currentBlockEnd = item.end >= 0 ? item.end : currentBlockStart + (currentBlockWords.length * 0.35);

    const isLast = i === timedItems.length - 1;
    const reachTarget = currentBlockWords.length >= targetWordsPerBlock;

    if (reachTarget || isLast) {
      blocks.push({
        id: blockId++,
        start: Math.round(currentBlockStart * 100) / 100,
        end: Math.round(currentBlockEnd * 100) / 100,
        text: currentBlockWords.join(' ')
      });

      currentBlockWords = [];
      currentBlockStart = -1;
      currentBlockEnd = -1;
    }
  }

  return blocks;
};

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  currentTime = 0,
  segments,
  transcriptText,
  duration = 15,
  isActive = false,
  isLiveRecording = false
}) => {
  // Build clean 2-line subtitle blocks
  const subtitleBlocks = useMemo<TwoLineSubtitleBlock[]>(() => {
    return buildTwoLineSubtitleBlocks(segments, transcriptText, duration);
  }, [segments, transcriptText, duration]);

  // Find active 2-line subtitle block for current video playback time
  const activeBlock = useMemo(() => {
    if (!isActive || subtitleBlocks.length === 0) return null;

    if (isLiveRecording) {
      return subtitleBlocks[subtitleBlocks.length - 1] || null;
    }

    // Strict acoustic timestamp matching: shows block ONLY during [start, end]
    for (const block of subtitleBlocks) {
      if (currentTime >= block.start && currentTime <= block.end) {
        return block;
      }
    }

    // Fallback if currentTime is between blocks
    for (let i = 0; i < subtitleBlocks.length; i++) {
      const b = subtitleBlocks[i];
      const nextB = subtitleBlocks[i + 1];
      if (currentTime >= b.start && (!nextB || currentTime < nextB.start)) {
        return b;
      }
    }

    return subtitleBlocks[0] || null;
  }, [subtitleBlocks, currentTime, isActive, isLiveRecording]);

  // Detect Right-to-Left languages
  const isRTL = useMemo(() => {
    if (!activeBlock?.text) return false;
    return /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(activeBlock.text);
  }, [activeBlock]);

  if (!isActive || !activeBlock || !activeBlock.text) return null;

  return (
    <div className="absolute bottom-[200px] xs:bottom-[210px] sm:bottom-[220px] left-0 right-0 flex justify-center px-4 pointer-events-none z-[48] select-none transition-all duration-150">
      <div className="max-w-[92%] sm:max-w-[85%] md:max-w-[650px] animate-in fade-in zoom-in-95 duration-100 flex justify-center">
        <div
          dir={isRTL ? 'rtl' : 'ltr'}
          className="bg-black/85 backdrop-blur-md px-5 py-3 sm:px-7 sm:py-3.5 rounded-xl border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.95)] text-center flex items-center justify-center max-w-full"
        >
          <p className="text-[16px] sm:text-[18px] md:text-[20px] font-medium tracking-normal drop-shadow-md text-center leading-relaxed px-1 text-white break-words max-w-full">
            {activeBlock.text}
          </p>
        </div>
      </div>
    </div>
  );
};

export const buildSegmentsFromTranscript = () => [];
