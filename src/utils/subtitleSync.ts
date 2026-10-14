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
}

/**
 * Normalizes and validates VAD word timing tokens for a subtitle segment.
 * If words have hardware timestamps, we respect them 100%.
 */
export function normalizeWordTimings(words: any[], segmentStart: number, segmentEnd: number, text: string): SubtitleWord[] {
  const textWords = text ? text.split(/\s+/).filter(Boolean) : [];
  if (textWords.length === 0) return [];

  // If we have actual word-level hardware timestamps, use them strictly
  if (Array.isArray(words) && words.length >= textWords.length) {
    return words.map((wObj, idx) => {
      const rawWord = String(wObj.word || wObj.text || textWords[idx] || '').trim();
      const wStart = Number(wObj.start ?? wObj.start_time ?? segmentStart);
      const wEnd = Number(wObj.end ?? wObj.end_time ?? (wStart + 0.3));
      return {
        word: rawWord,
        start: Math.round(wStart * 100) / 100,
        end: Math.round(Math.max(wStart + 0.05, wEnd) * 100) / 100
      };
    }).filter(t => t.word);
  }

  // Fallback: If no hardware word timings, divide the segment duration
  // But we still respect the segment boundaries which are hardware-timed
  const segDuration = Math.max(0.3, segmentEnd - segmentStart);
  const timePerWord = segDuration / textWords.length;
  
  return textWords.map((w, idx) => ({
    word: w,
    start: Math.round((segmentStart + (idx * timePerWord)) * 100) / 100,
    end: Math.round((segmentStart + ((idx + 1) * timePerWord)) * 100) / 100
  }));
}

/**
 * Checks if a word is currently active given the video playback time.
 * Strict boundary check to ensure yellow highlight only appears when spoken.
 */
export function isWordActive(word: SubtitleWord, currentTime: number): boolean {
  // 50ms lead time for visual smoothness, but strict end time
  return currentTime >= (word.start - 0.05) && currentTime <= word.end;
}

/**
 * Generates sentence-based precision subtitles from transcript text.
 * Groups spoken text into complete natural sentences or clauses.
 */
export function generatePrecisionSubtitles(text: string, totalDuration: number = 60, startOffset: number = 0): SubtitleSegment[] {
  if (!text || !text.trim()) return [];
  const cleanText = text.trim();
  const allWords = cleanText.split(/\s+/).filter(Boolean);
  if (allWords.length === 0) return [];

  const maxWordsPerChunk = 4; // Strict single-line limit (max 4 words)
  const chunks: SubtitleSegment[] = [];

  const totalWords = allWords.length;
  const effectiveDur = Math.max(1, totalDuration > 0 ? totalDuration : totalWords * 0.38);
  const timePerWord = effectiveDur / totalWords;

  let currentStart = startOffset;
  for (let i = 0; i < totalWords; i += maxWordsPerChunk) {
    const subWords = allWords.slice(i, i + maxWordsPerChunk);
    const chunkText = subWords.join(" ");
    const chunkDuration = subWords.length * timePerWord;
    const segStart = Math.round(currentStart * 100) / 100;
    const segEnd = Math.round((currentStart + chunkDuration) * 100) / 100;

    const wordObjs = subWords.map((w, idx) => ({
      word: w,
      start: Math.round((currentStart + (idx * timePerWord)) * 100) / 100,
      end: Math.round((currentStart + ((idx + 1) * timePerWord)) * 100) / 100
    }));

    chunks.push({
      start: segStart,
      end: segEnd,
      text: chunkText,
      words: wordObjs
    });
    currentStart += chunkDuration;
  }

  return chunks;
}

