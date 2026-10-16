import React, { useMemo } from 'react';

interface SubtitleOverlayProps {
  currentTime?: number;
  segments?: any[];
  transcriptText?: string;
  duration?: number;
  isActive?: boolean;
  isLiveRecording?: boolean;
}

interface TimedSubtitleBlock {
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
 * YouTube Professional Subtitle Engine:
 * Parses raw segments or transcript text into exact timestamped 2-line subtitle blocks.
 */
export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  currentTime = 0,
  segments,
  transcriptText,
  duration = 15,
  isActive = false,
  isLiveRecording = false
}) => {
  const subtitleBlocks = useMemo<TimedSubtitleBlock[]>(() => {
    let rawList: any[] = [];
    if (Array.isArray(segments) && segments.length > 0) {
      rawList = segments;
    } else if (typeof segments === 'string') {
      try {
        const parsed = JSON.parse(segments);
        if (Array.isArray(parsed)) rawList = parsed;
      } catch (e) {}
    }

    // Step 1: If rawList has valid acoustic timestamps ({ start, end, text }), use them directly!
    const hasValidTimestamps = rawList.length > 0 && rawList.some(s => typeof s?.start === 'number' && typeof s?.end === 'number' && s.end > s.start);

    if (hasValidTimestamps) {
      const blocks: TimedSubtitleBlock[] = [];
      let blockId = 1;

      for (const item of rawList) {
        const text = String(item?.text || item?.transcript || '').trim();
        if (!text || isTitleFallbackText(text)) continue;

        const start = Number(item.start) || 0;
        const end = Number(item.end) || start + 2.5;

        // If a segment is long, split into 10-14 word 2-line chunks proportionally across [start, end]
        const words = text.split(/\s+/).filter(Boolean);
        if (words.length <= 14) {
          blocks.push({
            id: blockId++,
            start: Math.round(start * 100) / 100,
            end: Math.round(end * 100) / 100,
            text
          });
        } else {
          // Chunk into sub-blocks of 12 words max for 2 lines
          const segDur = Math.max(1.0, end - start);
          let subWords: string[] = [];
          const subChunks: string[] = [];

          for (let i = 0; i < words.length; i++) {
            subWords.push(words[i]);
            if (subWords.length >= 12 || i === words.length - 1) {
              subChunks.push(subWords.join(' '));
              subWords = [];
            }
          }

          let curStart = start;
          const subDur = segDur / subChunks.length;
          for (let sc = 0; sc < subChunks.length; sc++) {
            const cStart = curStart;
            const cEnd = sc === subChunks.length - 1 ? end : curStart + subDur;
            blocks.push({
              id: blockId++,
              start: Math.round(cStart * 100) / 100,
              end: Math.round(cEnd * 100) / 100,
              text: subChunks[sc]
            });
            curStart = cEnd;
          }
        }
      }

      if (blocks.length > 0) return blocks;
    }

    // Step 2: Fallback to full transcript text parsing into exact 2-line (10-14 words) timeline blocks
    let fullText = '';
    if (rawList.length > 0) {
      fullText = rawList.map(s => String(s?.text || s?.transcript || '')).filter(t => t && !isTitleFallbackText(t)).join(' ');
    }
    if (!fullText && transcriptText && transcriptText.trim()) {
      const clean = transcriptText.trim();
      if (!isTitleFallbackText(clean)) fullText = clean;
    }

    if (!fullText) return [];

    const allWords = fullText.split(/\s+/).filter(Boolean);
    if (allWords.length === 0) return [];

    // Group into 12-word 2-line blocks
    const blockTexts: string[] = [];
    let curBlock: string[] = [];
    const maxWordsPerBlock = 12;

    for (let i = 0; i < allWords.length; i++) {
      curBlock.push(allWords[i]);
      const reachMax = curBlock.length >= maxWordsPerBlock;
      const hasPunctuation = /[.,!?;:]$/.test(allWords[i]);
      const remaining = allWords.length - (i + 1);

      if ((reachMax || (curBlock.length >= 8 && hasPunctuation)) && remaining >= 3) {
        blockTexts.push(curBlock.join(' '));
        curBlock = [];
      }
    }

    if (curBlock.length > 0) {
      if (blockTexts.length > 0 && curBlock.length <= 4) {
        blockTexts[blockTexts.length - 1] += ' ' + curBlock.join(' ');
      } else {
        blockTexts.push(curBlock.join(' '));
      }
    }

    const videoDur = duration && duration > 0 ? duration : 15;
    const availableTime = Math.max(2.0, videoDur - 0.6);
    let timeAcc = 0.2;
    const fallbackBlocks: TimedSubtitleBlock[] = [];

    for (let i = 0; i < blockTexts.length; i++) {
      const text = blockTexts[i];
      const wCount = text.split(/\s+/).length;
      const proportion = wCount / allWords.length;
      const bDur = Math.max(1.8, availableTime * proportion);

      const bStart = Math.round(timeAcc * 100) / 100;
      const bEnd = Math.round((timeAcc + bDur) * 100) / 100;

      fallbackBlocks.push({
        id: i + 1,
        start: bStart,
        end: bEnd,
        text
      });

      timeAcc = bEnd;
    }

    return fallbackBlocks;
  }, [segments, transcriptText, duration]);

  // Find active subtitle block for current video time
  const activeBlock = useMemo(() => {
    if (!isActive || subtitleBlocks.length === 0) return null;

    if (isLiveRecording) {
      return subtitleBlocks[subtitleBlocks.length - 1] || null;
    }

    // Strict time window matching: appears ONLY during [start, end]
    for (const block of subtitleBlocks) {
      if (currentTime >= block.start && currentTime <= block.end) {
        return block;
      }
    }

    return null; // Disappears completely during pauses or silence
  }, [subtitleBlocks, currentTime, isActive, isLiveRecording]);

  // RTL language check
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
          <p className="text-[16px] sm:text-[18px] md:text-[20px] font-medium tracking-normal drop-shadow-md text-center leading-relaxed px-1 text-white break-words line-clamp-2 max-w-full">
            {activeBlock.text}
          </p>
        </div>
      </div>
    </div>
  );
};

export const buildSegmentsFromTranscript = () => [];
