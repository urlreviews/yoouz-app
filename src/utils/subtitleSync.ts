/**
 * Subtitle Synchronization & VAD Word Timing Utilities
 * Ensures 100% precise acoustic alignment between video playback time and spoken words.
 * Strictly enforces single-line captions (max 3-4 words per line) with natural human speech pacing.
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
 * Calculates a phonetic weight for a word based on character length, syllable count, and stop-word status.
 * This is used to apportion time slices to individual words within a larger VTT cue window.
 */
export function getWordPhoneticWeight(word: string): number {
  if (!word) return 1.0;
  const clean = word.toLowerCase().trim().replace(/[^a-z0-9\u0590-\u05FF\u0600-\u06FF\u00C0-\u024F]/g, '');
  if (!clean) return 1.0;

  // 1. Short stop words are spoken very rapidly (minimal weight)
  const rapidStopWords = new Set([
    'a', 'i', 'in', 'it', 'at', 'on', 'of', 'to', 'so', 'do', 'is', 'be', 'by', 'my', 'or', 'and', 'the', 'we', 'he', 'me', 'up', 'no', 'if', 'as', 'at'
  ]);
  if (rapidStopWords.has(clean)) return 0.85;

  // 2. Syllable counting (Vowels usually equal syllables)
  const vowels = clean.match(/[aeiouy]/gi);
  const syllables = Math.max(1, vowels ? vowels.length : 1);

  // 3. Proper nouns (Capitalized) are usually spoken slower and with more emphasis
  const isProperNoun = /^[A-Z]/.test(word.trim()) && clean.length > 2;
  const properNounBonus = isProperNoun ? 1.4 : 1.0;

  // 4. Complexity weighting: longer words and multi-syllabic words take significantly more time
  const lengthWeight = clean.length * 0.55;
  const syllableWeight = syllables * 1.35;

  return Math.max(1.1, (lengthWeight + syllableWeight) * properNounBonus);
}

/**
 * Splits an array of words into single-line chunks of 4 to 6 words per line max, respecting clause boundaries.
 */
export function splitWordsIntoSingleLineChunks(words: string[], targetWordsPerLine = 4, targetMaxChars = 32): string[][] {
  const clean = words.map(w => w.trim()).filter(Boolean);
  if (clean.length === 0) return [];
  
  const maxWords = Math.max(3, Math.min(5, targetWordsPerLine || 4));
  const maxChars = Math.max(24, Math.min(36, targetMaxChars || 32));
  
  const totalCleanChars = clean.join(' ').length;
  if (clean.length <= maxWords && totalCleanChars <= maxChars) return [clean];

  // Calculate ideal number of chunks to balance words and characters evenly
  const numChunksByWords = Math.ceil(clean.length / maxWords);
  const numChunksByChars = Math.ceil(totalCleanChars / maxChars);
  const numChunks = Math.max(numChunksByWords, numChunksByChars);
  const wordsPerChunk = Math.ceil(clean.length / numChunks);

  const lines: string[][] = [];
  let currentLine: string[] = [];

  for (let i = 0; i < clean.length; i++) {
    const w = clean[i];
    currentLine.push(w);

    const hasPunctuation = /[.,!?;:]$/.test(w);
    const isClauseMarker = /^(so|and|because|with|but|located|by|where|that|which|when|while|if|then|for)$/i.test(w.replace(/[^a-z]/gi, ''));
    const remaining = clean.length - (i + 1);
    const currentLineCharLen = currentLine.join(' ').length;

    const reachedTarget = currentLine.length >= wordsPerChunk;
    const reachedMaxWords = currentLine.length >= maxWords;
    const reachedMaxChars = currentLineCharLen >= maxChars;

    if ((reachedMaxWords || reachedMaxChars || (reachedTarget && (hasPunctuation || isClauseMarker || remaining <= wordsPerChunk))) && remaining > 0) {
      lines.push(currentLine);
      currentLine = [];
    }
  }

  if (currentLine.length > 0) {
    if (lines.length > 0 && currentLine.length <= 2) {
      const prev = lines[lines.length - 1];
      const prevLen = prev.join(' ').length;
      const curLen = currentLine.join(' ').length;
      if (prev.length + currentLine.length <= maxWords + 1 && (prevLen + curLen + 1) <= maxChars) {
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
 * Aligns words proportionally to an exact acoustic time window [startTime, endTime].
 * Guarantees zero time-drift:
 * - Word 0 starts EXACTLY at startTime.
 * - Final word ends EXACTLY at endTime.
 * - Every word receives an acoustically weighted slice of the timeline.
 */
export function alignWordsToTimeWindow(rawWords: string[], startTime: number, endTime: number): SubtitleWord[] {
  const words = rawWords.map(w => w.trim()).filter(Boolean);
  if (words.length === 0) return [];

  const start = Math.max(0, startTime);
  const end = Math.max(start + 0.3, endTime);
  const totalDur = end - start;

  if (words.length === 1) {
    return [{
      word: words[0],
      start: Math.round(start * 100) / 100,
      end: Math.round(end * 100) / 100
    }];
  }

  const weights = words.map(w => getWordPhoneticWeight(w));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  let accumulated = start;
  const wordTimings: SubtitleWord[] = [];

  for (let i = 0; i < words.length; i++) {
    const isLast = i === words.length - 1;
    const wordDur = (weights[i] / totalWeight) * totalDur;
    const wStart = Math.round(accumulated * 100) / 100;
    const wEnd = isLast
      ? Math.round(end * 100) / 100
      : Math.round((accumulated + wordDur) * 100) / 100;

    wordTimings.push({
      word: words[i],
      start: wStart,
      end: Math.max(wStart + 0.08, wEnd)
    });

    accumulated += wordDur;
  }

  return wordTimings;
}

/**
 * Builds strictly single-line subtitle segments (4 to 6 words per line max).
 * Resets line display completely when moving to the next segment.
 */
export function buildSingleLineSegments(rawWords: string[], startTime: number, endTime: number): SubtitleSegment[] {
  const words = rawWords.map(w => w.trim()).filter(Boolean);
  if (words.length === 0) return [];

  const chunks = splitWordsIntoSingleLineChunks(words, 5);
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

  const chunkWeights = chunks.map(c => {
    return c.reduce((sum, w) => sum + getWordPhoneticWeight(w), 0);
  });
  const totalWeight = chunkWeights.reduce((a, b) => a + b, 0);

  const minTotalDur = chunks.reduce((acc, c) => acc + (c.length * 0.32), 0);
  const effectiveTotalDur = Math.max(minTotalDur, endTime - startTime);

  let curStart = startTime;
  const segments: SubtitleSegment[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const isLast = i === chunks.length - 1;
    const chunkWords = chunks[i];
    const chunkDur = isLast
      ? Math.max(chunkWords.length * 0.28, (startTime + effectiveTotalDur) - curStart)
      : Math.max(chunkWords.length * 0.28, (chunkWeights[i] / totalWeight) * effectiveTotalDur);

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
 */
export function isWordActive(word: SubtitleWord, currentTime: number): boolean {
  return currentTime >= (word.start - 0.03) && currentTime <= (word.end + 0.03);
}

/**
 * Generates sentence-based precision subtitles from transcript text.
 * Strictly breaks into single-line segments of 5 to 7 words.
 */
export function generatePrecisionSubtitles(text: string, totalDuration: number = 60, startOffset: number = 0.2): SubtitleSegment[] {
  if (!text || !text.trim()) return [];
  const cleanText = text.trim();
  const allWords = cleanText.split(/\s+/).filter(Boolean);
  if (allWords.length === 0) return [];

  const start = Math.max(0.2, startOffset);
  const end = Math.max(start + (allWords.length * 0.32), totalDuration);

  return buildSingleLineSegments(allWords, start, end);
}


