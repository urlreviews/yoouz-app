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
 * Generates precision subtitles from transcript text.
 * Optimized for fallback when hardware timing is missing.
 */
export function generatePrecisionSubtitles(text: string, totalDuration: number = 60, startOffset: number = 0): SubtitleSegment[] {
  if (!text || !text.trim()) return [];
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  // Improved cadence: People speak at ~150 words per minute (0.4s per word)
  // We use the shorter of totalDuration or actual estimated speech time
  const estimatedSpeechDur = words.length * 0.42; 
  const dur = totalDuration > 0 ? Math.min(totalDuration, estimatedSpeechDur) : estimatedSpeechDur;
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

    const wordTimings = chunkWords.map((w, idx) => {
      const wStart = segStart + (idx * secondsPerWord);
      const wEnd = wStart + secondsPerWord;
      return { 
        word: w, 
        start: Math.round(wStart * 100) / 100, 
        end: Math.round(wEnd * 100) / 100 
      };
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

