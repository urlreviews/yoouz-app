import React, { useMemo } from 'react';

interface SubtitleOverlayProps {
  currentTime?: number;
  segments?: any[];
  transcriptText?: string;
  duration?: number;
  isActive?: boolean;
  isLiveRecording?: boolean;
}

interface SubtitleBlock {
  id: number;
  start: number;
  end: number;
  text: string;
}

/**
 * Filter out generic place/title fallbacks
 */
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
 * Clean spoken transcript string from any raw input (segments array or transcriptText string)
 */
const extractCleanSpokenText = (segments?: any[], transcriptText?: string): string => {
  let rawTexts: string[] = [];

  if (Array.isArray(segments) && segments.length > 0) {
    for (const item of segments) {
      const txt = String(item?.text || item?.transcript || '').trim();
      if (txt && !isTitleFallbackText(txt)) {
        rawTexts.push(txt);
      }
    }
  } else if (typeof segments === 'string') {
    try {
      const parsed = JSON.parse(segments);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const txt = String(item?.text || item?.transcript || '').trim();
          if (txt && !isTitleFallbackText(txt)) {
            rawTexts.push(txt);
          }
        }
      }
    } catch (e) {}
  }

  if (rawTexts.length === 0 && transcriptText && transcriptText.trim()) {
    const clean = transcriptText.trim();
    if (!isTitleFallbackText(clean)) {
      rawTexts.push(clean);
    }
  }

  if (rawTexts.length === 0) return '';

  // Deduplicate consecutive identical text chunks or streaming prefix overlaps
  const deduplicatedPhrases: string[] = [];
  for (const phrase of rawTexts) {
    if (deduplicatedPhrases.length === 0) {
      deduplicatedPhrases.push(phrase);
      continue;
    }

    const prev = deduplicatedPhrases[deduplicatedPhrases.length - 1];
    const prevWords = prev.toLowerCase().split(/\s+/).filter(Boolean);
    const currWords = phrase.toLowerCase().split(/\s+/).filter(Boolean);

    // If current phrase starts with same 2+ words as previous (e.g. streaming hypothesis), replace it
    if (prevWords.length >= 2 && currWords.length >= 2) {
      if (prevWords[0] === currWords[0] && prevWords[1] === currWords[1]) {
        deduplicatedPhrases[deduplicatedPhrases.length - 1] = phrase;
        continue;
      }
    }

    if (prev.toLowerCase() === phrase.toLowerCase()) continue;

    deduplicatedPhrases.push(phrase);
  }

  return deduplicatedPhrases.join(' ');
};

/**
 * YouTube Subtitle Engine built from scratch.
 * Splitting full spoken text into clean, 2-line 6-to-8 word blocks mapped across video timeline.
 */
export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  currentTime = 0,
  segments,
  transcriptText,
  duration = 15,
  isActive = false,
  isLiveRecording = false
}) => {
  // Build pristine 2-line YouTube subtitle blocks
  const subtitleBlocks = useMemo<SubtitleBlock[]>(() => {
    const cleanFullText = extractCleanSpokenText(segments, transcriptText);
    if (!cleanFullText) return [];

    // Extract all spoken words while stripping consecutive duplicate words (e.g. "good good")
    const rawWords = cleanFullText.split(/\s+/).filter(Boolean);
    const cleanWords: string[] = [];
    for (let i = 0; i < rawWords.length; i++) {
      const w = rawWords[i];
      const prev = cleanWords[cleanWords.length - 1];
      if (prev && prev.toLowerCase() === w.toLowerCase()) continue;
      cleanWords.push(w);
    }

    if (cleanWords.length === 0) return [];

    // Group words into clean 2-line YouTube subtitle blocks (6 to 8 words per block)
    const blocksText: string[] = [];
    let currentBlockWords: string[] = [];
    const maxWordsPerBlock = 7;

    for (let i = 0; i < cleanWords.length; i++) {
      const word = cleanWords[i];
      currentBlockWords.push(word);

      const hasPunctuation = /[.,!?;:]$/.test(word);
      const reachMax = currentBlockWords.length >= maxWordsPerBlock;
      const reachMin = currentBlockWords.length >= 5;
      const remainingWords = cleanWords.length - (i + 1);

      if ((reachMax || (reachMin && hasPunctuation)) && remainingWords >= 2) {
        blocksText.push(currentBlockWords.join(' '));
        currentBlockWords = [];
      }
    }

    if (currentBlockWords.length > 0) {
      if (blocksText.length > 0 && currentBlockWords.length <= 2) {
        blocksText[blocksText.length - 1] += ' ' + currentBlockWords.join(' ');
      } else {
        blocksText.push(currentBlockWords.join(' '));
      }
    }

    if (blocksText.length === 0) return [];

    // Map time windows seamlessly across the video playback timeline [0.2s, videoDuration - 0.3s]
    const videoDuration = duration && duration > 0 ? duration : 15;
    const availablePlaybackTime = Math.max(2.0, videoDuration - 0.5);

    let startAcc = 0.2;
    const blocks: SubtitleBlock[] = [];

    for (let i = 0; i < blocksText.length; i++) {
      const text = blocksText[i];
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      const proportion = wordCount / cleanWords.length;
      const blockDur = availablePlaybackTime * proportion;

      const segStart = Math.round(startAcc * 100) / 100;
      const segEnd = Math.round((startAcc + blockDur) * 100) / 100;

      blocks.push({
        id: i + 1,
        start: segStart,
        end: segEnd,
        text
      });

      startAcc = segEnd; // Next YouTube subtitle block appears right when previous finishes
    }

    return blocks;
  }, [segments, transcriptText, duration]);

  // Determine active subtitle block for current video time
  const activeBlock = useMemo(() => {
    if (!isActive || subtitleBlocks.length === 0) return null;

    if (isLiveRecording) {
      return subtitleBlocks[subtitleBlocks.length - 1] || null;
    }

    // Match exact playback time window
    for (const block of subtitleBlocks) {
      if (currentTime >= block.start && currentTime <= block.end) {
        return block;
      }
    }

    // If currentTime is slightly past last block before loop
    if (subtitleBlocks.length > 0 && currentTime >= subtitleBlocks[subtitleBlocks.length - 1].end) {
      return subtitleBlocks[subtitleBlocks.length - 1];
    }

    return subtitleBlocks[0] || null;
  }, [subtitleBlocks, currentTime, isActive, isLiveRecording]);

  // RTL language support check
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
          className="bg-black/85 backdrop-blur-md px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.95)] text-center flex items-center justify-center max-w-full"
        >
          <p className="text-[15px] sm:text-[17px] md:text-[18px] font-medium tracking-normal drop-shadow-md text-center leading-snug px-1 text-white break-words max-w-full">
            {activeBlock.text}
          </p>
        </div>
      </div>
    </div>
  );
};

export const buildSegmentsFromTranscript = () => [];
