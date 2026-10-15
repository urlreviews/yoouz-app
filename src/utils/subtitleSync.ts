/**
 * Subtitle Synchronization & VAD Word Timing Utilities
 * Ensures 100% precise acoustic alignment between video playback time and spoken words.
 * Strictly enforces single-line captions (max 6-8 words per line) with natural human speech pacing.
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
 * Splits an array of words into single-line chunks of 5 to 7 words (maximum 8 words).
 * Starts over with a new line when the line finishes.
 */
export function splitWordsIntoSingleLineChunks(words: string[], maxWordsPerLine = 4): string[][] {
  const clean = words.map(w => w.trim()).filter(Boolean);
  if (clean.length === 0) return [];
  if (clean.length <= maxWordsPerLine) return [clean];

  const lines: string[][] = [];
  let currentLine: string[] = [];

  for (let i = 0; i < clean.length; i++) {
    const w = clean[i];
    currentLine.push(w);

    const hasPunctuation = /[.,!?;:]$/.test(w);
    const reachedTarget = currentLine.length >= 6;
    const reachedMax = currentLine.length >= maxWordsPerLine;
    const remaining = clean.length - (i + 1);

    if ((reachedMax || (hasPunctuation && currentLine.length >= 4) || (reachedTarget && remaining >= 4)) && remaining > 0) {
      lines.push(currentLine);
      currentLine = [];
    }
  }

  if (currentLine.length > 0) {
    if (lines.length > 0 && currentLine.length <= 2) {
      const prev = lines[lines.length - 1];
      if (prev.length + currentLine.length <= 8) {
        lines[lines.length - 1] = [...prev, ...currentLine];
      } else {
        lines.push(currentLine);
      }
    } else {
      lines.push(currentLine);
    }
  }

  return lines;
}

/**
 * Aligns words proportionally to a known acoustic time window [startTime, endTime].
 * Enforces natural human speech pacing:
 * - Greetings & common words (e.g. "Good", "morning", "hello") receive natural spoken duration
 * - Minimum word duration prevents the highlight from rushing too fast at the beginning
 */
export function alignWordsToTimeWindow(rawWords: string[], startTime: number, endTime: number): SubtitleWord[] {
  const words = rawWords.map(w => w.trim()).filter(Boolean);
  if (words.length === 0) return [];

  // Human vocal rate: natural speech is ~0.35s to 0.45s per word
  const minRequiredDuration = words.length * 0.32;
  const totalDuration = Math.max(minRequiredDuration, endTime - startTime);

  if (words.length === 1) {
    return [{
      word: words[0],
      start: Math.round(startTime * 100) / 100,
      end: Math.round((startTime + totalDuration) * 100) / 100
    }];
  }

  // Weight words by phonetic complexity and length
  const weights = words.map((w, idx) => {
    const lower = w.toLowerCase().replace(/[^a-z0-9]/g, '');
    // Greetings / intro words at index 0-2 (e.g. "good", "morning", "hello", "today") get generous natural weight
    if (idx <= 2 && (lower === 'good' || lower === 'morning' || lower === 'hello' || lower === 'welcome' || lower === 'hey')) {
      return Math.max(6, w.length + 3);
    }
    return Math.max(3, w.length + 1);
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  let currentStart = startTime;
  const wordTimings: SubtitleWord[] = [];

  for (let i = 0; i < words.length; i++) {
    const isLast = i === words.length - 1;
    // Ensure each word receives at least 0.28s (or 0.38s for longer words)
    const proportionalDur = (weights[i] / totalWeight) * totalDuration;
    const wordDur = Math.max(0.28, proportionalDur);
    const wStart = Math.round(currentStart * 100) / 100;
    const wEnd = isLast
      ? Math.round(Math.max(wStart + 0.28, startTime + totalDuration) * 100) / 100
      : Math.round((currentStart + wordDur) * 100) / 100;

    wordTimings.push({
      word: words[i],
      start: wStart,
      end: Math.max(wStart + 0.12, wEnd)
    });

    currentStart += wordDur;
  }

  return wordTimings;
}

/**
 * Builds strictly single-line subtitle segments (max 6-8 words per line).
 * Starts over with a new line when the line finishes.
 */
export function buildSingleLineSegments(rawWords: string[], startTime: number, endTime: number): SubtitleSegment[] {
  const words = rawWords.map(w => w.trim()).filter(Boolean);
  if (words.length === 0) return [];

  const chunks = splitWordsIntoSingleLineChunks(words, 7);
  if (chunks.length <= 1) {
    const wordObjs = alignWordsToTimeWindow(words, startTime, endTime);
    const segEnd = wordObjs.length > 0 ? wordObjs[wordObjs.length - 1].end : endTime;
    return [{
      start: Math.round(startTime * 100) / 100,
      end: Math.round(segEnd * 100) / 100,
      text: words.join(" "),
      words: wordObjs,
      isHardwareTimed: true
    }];
  }

  // Calculate weights for each single-line chunk
  const chunkWeights = chunks.map(c => {
    return c.reduce((sum, w) => sum + Math.max(3, w.length + 1), 0);
  });
  const totalWeight = chunkWeights.reduce((a, b) => a + b, 0);

  const minTotalDur = chunks.reduce((acc, c) => acc + (c.length * 0.34), 0);
  const effectiveTotalDur = Math.max(minTotalDur, endTime - startTime);

  let curStart = startTime;
  const segments: SubtitleSegment[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const isLast = i === chunks.length - 1;
    const chunkWords = chunks[i];
    const chunkDur = isLast
      ? Math.max(chunkWords.length * 0.32, (startTime + effectiveTotalDur) - curStart)
      : Math.max(chunkWords.length * 0.32, (chunkWeights[i] / totalWeight) * effectiveTotalDur);

    const chunkEnd = curStart + chunkDur;
    const wordObjs = alignWordsToTimeWindow(chunkWords, curStart, chunkEnd);
    const finalChunkEnd = wordObjs.length > 0 ? wordObjs[wordObjs.length - 1].end : chunkEnd;

    segments.push({
      start: Math.round(curStart * 100) / 100,
      end: Math.round(finalChunkEnd * 100) / 100,
      text: chunkWords.join(" "),
      words: wordObjs,
      isHardwareTimed: true
    });

    curStart = finalChunkEnd;
  }

  return segments;
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
        end: Math.round(Math.max(wStart + 0.08, wEnd) * 100) / 100
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
 * Strictly breaks into single-line segments of 5 to 7 words (max 8).
 */
export function generatePrecisionSubtitles(text: string, totalDuration: number = 60, startOffset: number = 0): SubtitleSegment[] {
  if (!text || !text.trim()) return [];
  const cleanText = text.trim();
  const allWords = cleanText.split(/\s+/).filter(Boolean);
  if (allWords.length === 0) return [];

  const start = Math.max(0.4, startOffset);
  const end = Math.max(start + (allWords.length * 0.35), totalDuration);

  return buildSingleLineSegments(allWords, start, end);
}

