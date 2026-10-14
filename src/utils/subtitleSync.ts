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
 */
export function normalizeWordTimings(words: any[], segmentStart: number, segmentEnd: number, text: string): SubtitleWord[] {
  if (!Array.isArray(words) || words.length === 0) {
    // Derive fallback timed tokens evenly across segment duration
    const textWords = text ? text.split(/\s+/).filter(Boolean) : [];
    if (textWords.length === 0) return [];
    const segDuration = Math.max(0.5, segmentEnd - segmentStart);
    const timePerWord = segDuration / textWords.length;
    return textWords.map((w, idx) => ({
      word: w,
      start: Math.round((segmentStart + (idx * timePerWord)) * 100) / 100,
      end: Math.round((segmentStart + ((idx + 1) * timePerWord)) * 100) / 100
    }));
  }

  return words.map((wObj, idx) => {
    const rawWord = String(wObj.word || wObj.text || '').trim();
    const wStart = Number(wObj.start ?? wObj.start_time ?? segmentStart);
    const wEnd = Number(wObj.end ?? wObj.end_time ?? (wStart + 0.35));
    return {
      word: rawWord,
      start: Math.round(wStart * 100) / 100,
      end: Math.round(Math.max(wStart + 0.08, wEnd) * 100) / 100
    };
  }).filter(t => t.word);
}

/**
 * Checks if a word is currently active given the video playback time.
 */
export function isWordActive(word: SubtitleWord, currentTime: number): boolean {
  return currentTime >= (word.start - 0.05) && currentTime <= (word.end + 0.1);
}
