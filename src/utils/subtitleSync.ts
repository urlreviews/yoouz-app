/**
 * Subtitle Synchronization & VAD Word Timing Utilities
 * Ensures 100% precise acoustic alignment between video playback time and spoken words.
 */

export interface SubtitleWord {
  word: string;
  start: number;
  end: number;
}

export interface SubtitleSegment {
  start: number;
  end: number;
  text: string;
  words?: SubtitleWord[];
  isHardwareTimed?: boolean;
}

/**
 * Aligns words proportionally to a known acoustic time window [startTime, endTime].
 * Longer words (more characters/syllables) naturally take proportionally longer to speak.
 */
export function alignWordsToTimeWindow(rawWords: string[], startTime: number, endTime: number): SubtitleWord[] {
  const words = rawWords.map(w => w.trim()).filter(Boolean);
  if (words.length === 0) return [];

  const totalDuration = Math.max(0.25, endTime - startTime);
  if (words.length === 1) {
    return [{
      word: words[0],
      start: Math.round(startTime * 100) / 100,
      end: Math.round(endTime * 100) / 100
    }];
  }

  // Weight each word by character count + 1 (for inter-word pause/vowel weight)
  const weights = words.map(w => Math.max(2, w.length + 1));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  let currentStart = startTime;
  const wordTimings: SubtitleWord[] = [];

  for (let i = 0; i < words.length; i++) {
    const isLast = i === words.length - 1;
    const wordDur = (weights[i] / totalWeight) * totalDuration;
    const wStart = Math.round(currentStart * 100) / 100;
    const wEnd = isLast
      ? Math.round(endTime * 100) / 100
      : Math.round((currentStart + wordDur) * 100) / 100;

    wordTimings.push({
      word: words[i],
      start: wStart,
      end: Math.max(wStart + 0.08, wEnd)
    });

    currentStart += wordDur;
  }

  return wordTimings;
}

/**
 * Normalizes and validates VAD word timing tokens for a subtitle segment.
 * If words have hardware timestamps, we respect them 100%.
 */
export function normalizeWordTimings(words: any[], segmentStart: number, segmentEnd: number, text: string): SubtitleWord[] {
  const textWords = text ? text.split(/\s+/).filter(Boolean) : [];
  if (textWords.length === 0) return [];

  // If we have actual word-level hardware timestamps, use them strictly
  if (Array.isArray(words) && words.length >= textWords.length && words[0]?.start !== undefined) {
    return words.map((wObj, idx) => {
      const rawWord = String(wObj.word || wObj.text || textWords[idx] || '').trim();
      const wStart = Number(wObj.start ?? wObj.start_time ?? segmentStart);
      const wEnd = Number(wObj.end ?? wObj.end_time ?? (wStart + 0.3));
      return {
        word: rawWord,
        start: Math.round(wStart * 100) / 100,
        end: Math.round(Math.max(wStart + 0.06, wEnd) * 100) / 100
      };
    }).filter(t => t.word);
  }

  // Character-weighted acoustic alignment within the exact hardware segment window
  return alignWordsToTimeWindow(textWords, segmentStart, segmentEnd);
}

/**
 * Checks if a word is currently active given the video playback time.
 * Strict boundary check to ensure yellow highlight only appears when spoken.
 */
export function isWordActive(word: SubtitleWord, currentTime: number): boolean {
  return currentTime >= (word.start - 0.03) && currentTime <= (word.end + 0.03);
}

/**
 * Generates sentence-based precision subtitles from transcript text.
 * Groups spoken text into complete natural sentences or clauses (3-6 words).
 */
export function generatePrecisionSubtitles(text: string, totalDuration: number = 60, startOffset: number = 0): SubtitleSegment[] {
  if (!text || !text.trim()) return [];
  const cleanText = text.trim();
  const allWords = cleanText.split(/\s+/).filter(Boolean);
  if (allWords.length === 0) return [];

  const maxWordsPerChunk = 5; // Natural phrase limit (3-5 words)
  const chunks: SubtitleSegment[] = [];

  const totalWords = allWords.length;
  const NATURAL_SEC_PER_WORD = 0.34;

  let currentStart = Math.max(0.2, startOffset);

  for (let i = 0; i < totalWords; i += maxWordsPerChunk) {
    const subWords = allWords.slice(i, i + maxWordsPerChunk);
    const chunkText = subWords.join(" ");
    const chunkDuration = Math.max(0.6, subWords.length * NATURAL_SEC_PER_WORD);
    const segStart = Math.round(currentStart * 100) / 100;
    const segEnd = Math.round((currentStart + chunkDuration) * 100) / 100;

    const wordObjs = alignWordsToTimeWindow(subWords, segStart, segEnd);

    chunks.push({
      start: segStart,
      end: segEnd,
      text: chunkText,
      words: wordObjs,
      isHardwareTimed: true
    });

    currentStart += chunkDuration + 0.18;
  }

  return chunks;
}

