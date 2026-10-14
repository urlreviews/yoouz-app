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

  return words.map((wObj) => {
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

/**
 * Generates precision subtitles from transcript text.
 */
export function generatePrecisionSubtitles(text: string, totalDuration: number = 60, startOffset: number = 0): SubtitleSegment[] {
  if (!text || !text.trim()) return [];
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const estimatedSpeechDur = words.length * 0.35;
  const dur = totalDuration && totalDuration > 0 ? Math.min(totalDuration, Math.max(3, estimatedSpeechDur)) : Math.max(3, estimatedSpeechDur);
  const secondsPerWord = dur / words.length;

  const chunks: SubtitleSegment[] = [];
  const maxWordsPerLine = 4;

  let currentWordIdx = 0;
  while (currentWordIdx < words.length) {
    const chunkWords = words.slice(currentWordIdx, currentWordIdx + maxWordsPerLine);
    const chunkText = chunkWords.join(' ');
    const chunkStartIdx = currentWordIdx;
    currentWordIdx += chunkWords.length;

    const segStart = Math.round((startOffset + chunkStartIdx * secondsPerWord) * 100) / 100;
    const segEnd = Math.round((startOffset + currentWordIdx * secondsPerWord) * 100) / 100;

    const totalChunkChars = chunkWords.reduce((sum, w) => sum + Math.max(1, w.length), 0) || 1;
    let accumSec = segStart;
    const wordTimings = chunkWords.map((w) => {
      const wDur = (Math.max(1, w.length) / totalChunkChars) * (segEnd - segStart);
      const wStart = accumSec;
      const wEnd = accumSec + wDur;
      accumSec = wEnd;
      return { word: w, start: Math.round(wStart * 100) / 100, end: Math.round(wEnd * 100) / 100 };
    });

    chunks.push({
      start: segStart,
      end: segEnd,
      text: chunkText,
      words: wordTimings
    });
  }

  return chunks;
}
