import React, { useMemo } from 'react';

interface SubtitleOverlayProps {
  currentTime?: number;
  segments?: any[];
  transcriptText?: string;
  duration?: number;
  isActive?: boolean;
  isLiveRecording?: boolean;
}

interface DiscreteSegment {
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
 * Splits transcript into natural spoken sentences/clauses.
 * Never cuts a sentence mid-phrase (e.g. "good morning" is never split into "good" in line 1 and "morning" in line 2).
 */
const parseNaturalSentences = (fullText: string): string[] => {
  if (!fullText) return [];

  const text = fullText.trim();
  if (!text || isTitleFallbackText(text)) return [];

  // Step 1: Detect explicit sentence boundaries (punctuation) OR repeated sentence restarts (e.g. "good morning ... good morning")
  // Regex matches sentence ending punctuation OR looks for common restarts
  const sentences: string[] = [];

  // Split on punctuation first: ., !, ?, ;, or newline
  const rawPunctuationSplits = text.split(/(?<=[.!?;\n])\s+/).filter(Boolean);

  for (const part of rawPunctuationSplits) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Check if within this part there is a repeated phrase restart (e.g. "good morning ... good morning")
    // Find if a 2+ word sequence repeats later in the same part
    const words = trimmed.split(/\s+/).filter(Boolean);
    let currentSentenceWords: string[] = [];

    for (let i = 0; i < words.length; i++) {
      const w = words[i];

      // Check if starting at i, the next 2 words match an earlier phrase in currentSentenceWords
      if (currentSentenceWords.length >= 4 && i + 1 < words.length) {
        const wordA = words[i].toLowerCase().replace(/[^a-z0-9]/g, '');
        const wordB = words[i + 1].toLowerCase().replace(/[^a-z0-9]/g, '');
        const firstWordPrev = currentSentenceWords[0]?.toLowerCase().replace(/[^a-z0-9]/g, '');
        const secondWordPrev = currentSentenceWords[1]?.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (wordA && wordB && firstWordPrev && secondWordPrev && wordA === firstWordPrev && wordB === secondWordPrev) {
          // Found a sentence restart! Flush currentSentenceWords as a completed sentence
          sentences.push(currentSentenceWords.join(' '));
          currentSentenceWords = [];
        }
      }

      currentSentenceWords.push(w);
    }

    if (currentSentenceWords.length > 0) {
      sentences.push(currentSentenceWords.join(' '));
    }
  }

  // Step 2: For any sentence that is still longer than 11 words, split cleanly at natural clause conjunctions (and, but, because, so, or, then)
  const finalClauses: string[] = [];

  for (const sent of sentences) {
    const sWords = sent.split(/\s+/).filter(Boolean);
    if (sWords.length <= 11) {
      finalClauses.push(sent);
      continue;
    }

    // Split long sentence at clause conjunctions
    let clauseAcc: string[] = [];
    for (let i = 0; i < sWords.length; i++) {
      const w = sWords[i];
      const lowerW = w.toLowerCase().replace(/[^a-z0-9]/g, '');
      const isConjunction = ['and', 'but', 'because', 'so', 'then', 'or', 'which', 'where'].includes(lowerW);

      if (clauseAcc.length >= 6 && isConjunction && (sWords.length - i) >= 3) {
        finalClauses.push(clauseAcc.join(' '));
        clauseAcc = [w];
      } else {
        clauseAcc.push(w);
      }
    }

    if (clauseAcc.length > 0) {
      if (finalClauses.length > 0 && clauseAcc.length <= 3) {
        finalClauses[finalClauses.length - 1] += ' ' + clauseAcc.join(' ');
      } else {
        finalClauses.push(clauseAcc.join(' '));
      }
    }
  }

  return finalClauses;
};

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  currentTime = 0,
  segments,
  transcriptText,
  duration = 15,
  isActive = false,
  isLiveRecording = false
}) => {
  // Build clean, deduplicated, non-overlapping 2-line sentence segments
  const discreteSegments = useMemo<DiscreteSegment[]>(() => {
    let fullText = '';

    if (Array.isArray(segments) && segments.length > 0) {
      const textList = segments
        .map(s => String(s?.text || s?.transcript || '').trim())
        .filter(t => t && !isTitleFallbackText(t));
      
      // Deduplicate consecutive identical segment strings
      const dedupList: string[] = [];
      for (const t of textList) {
        if (dedupList.length === 0 || dedupList[dedupList.length - 1].toLowerCase() !== t.toLowerCase()) {
          dedupList.push(t);
        }
      }
      fullText = dedupList.join(' ');
    } else if (typeof segments === 'string') {
      try {
        const parsed = JSON.parse(segments);
        if (Array.isArray(parsed)) {
          const textList = parsed
            .map(s => String(s?.text || s?.transcript || '').trim())
            .filter(t => t && !isTitleFallbackText(t));
          fullText = textList.join(' ');
        }
      } catch (e) {}
    }

    if (!fullText && transcriptText && transcriptText.trim()) {
      const clean = transcriptText.trim();
      if (!isTitleFallbackText(clean)) {
        fullText = clean;
      }
    }

    if (!fullText || isTitleFallbackText(fullText)) return [];

    // Step 1: Parse into natural sentences without breaking mid-phrase
    const sentenceClauses = parseNaturalSentences(fullText);
    if (sentenceClauses.length === 0) return [];

    // Step 2: Scale start/end time windows precisely across video duration
    const totalWords = fullText.split(/\s+/).filter(Boolean).length;
    const effectiveDur = duration && duration > 0 ? duration : 15;
    const availableDur = Math.max(2.0, effectiveDur - 0.5);

    let currentStart = 0.2;
    const result: DiscreteSegment[] = [];

    for (let i = 0; i < sentenceClauses.length; i++) {
      const text = sentenceClauses[i];
      const cWords = text.split(/\s+/).length;
      const proportion = totalWords > 0 ? cWords / totalWords : 1 / sentenceClauses.length;
      const chunkDur = availableDur * proportion;

      const segStart = Math.round(currentStart * 100) / 100;
      const segEnd = Math.round((currentStart + chunkDur) * 100) / 100;

      result.push({
        start: segStart,
        end: segEnd,
        text
      });

      currentStart = segEnd; // Next sentence appears right when previous finishes
    }

    return result;
  }, [segments, transcriptText, duration]);

  // Find active discrete segment for current video time
  const activeSegment = useMemo(() => {
    if (!isActive || discreteSegments.length === 0) return null;

    if (isLiveRecording) {
      return discreteSegments[discreteSegments.length - 1] || null;
    }

    // Strict time window: appears ONLY during [start, end] and vanishes completely when done
    for (const seg of discreteSegments) {
      if (currentTime >= seg.start && currentTime <= seg.end) {
        return seg;
      }
    }

    return null; // Clears completely between sentences
  }, [discreteSegments, currentTime, isActive, isLiveRecording]);

  // Detect Right-to-Left languages
  const isRTL = useMemo(() => {
    if (!activeSegment?.text) return false;
    return /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(activeSegment.text);
  }, [activeSegment]);

  if (!isActive || !activeSegment || !activeSegment.text) return null;

  return (
    <div className="absolute bottom-[200px] xs:bottom-[210px] sm:bottom-[220px] left-0 right-0 flex justify-center px-4 pointer-events-none z-[48] select-none transition-all duration-150">
      <div className="max-w-[92%] sm:max-w-[85%] md:max-w-[650px] animate-in fade-in zoom-in-95 duration-100 flex justify-center">
        <div
          dir={isRTL ? "rtl" : "ltr"}
          className="bg-black/85 backdrop-blur-md px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.95)] text-center flex items-center justify-center max-w-full"
        >
          <p className="text-[15px] sm:text-[17px] md:text-[18px] font-medium tracking-normal drop-shadow-md text-center leading-snug px-1 text-white break-words line-clamp-2 max-w-full">
            {activeSegment.text}
          </p>
        </div>
      </div>
    </div>
  );
};

export const buildSegmentsFromTranscript = () => [];
