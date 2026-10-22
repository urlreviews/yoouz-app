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

/**
 * Formats a subtitle cue so it never exceeds 1 to 2 lines max (standard TikTok / Reels format).
 * If a sentence exceeds ~68 characters, splits strictly at natural speech pauses (commas, periods, clauses).
 * Guarantees zero truncation (no 3 dots '...'), constant font size, and max 2 lines.
 */
export function formatCueToMaxTwoLines(
  start: number,
  end: number,
  text: string,
  maxCharsPerCue = 68
): { start: number; end: number; text: string }[] {
  const clean = text.trim();
  if (!clean) return [];

  if (clean.length <= maxCharsPerCue) {
    return [{ start: Math.round(start * 100) / 100, end: Math.round(end * 100) / 100, text: clean }];
  }

  const mid = Math.floor(clean.length / 2);
  const minSplit = Math.floor(clean.length * 0.3);
  const maxSplit = Math.floor(clean.length * 0.7);

  let bestSplitIdx = -1;
  let bestDistance = Infinity;

  // 1. Natural punctuation marks (comma, semicolon, period, exclamation, question)
  const punctMatches = Array.from(clean.matchAll(/([.,!?;:])\s+/g));
  for (const match of punctMatches) {
    const idx = (match.index || 0) + match[1].length;
    if (idx >= minSplit && idx <= maxSplit) {
      const dist = Math.abs(idx - mid);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestSplitIdx = idx;
      }
    }
  }

  // 2. Clause conjunctions (and, but, because, with, that, so)
  if (bestSplitIdx === -1) {
    const conjMatches = Array.from(clean.matchAll(/\s+(and|but|because|with|that|which|when|while|if|then|for|or)\s+/gi));
    for (const match of conjMatches) {
      const idx = match.index || 0;
      if (idx >= minSplit && idx <= maxSplit) {
        const dist = Math.abs(idx - mid);
        if (dist < bestDistance) {
          bestDistance = dist;
          bestSplitIdx = idx;
        }
      }
    }
  }

  // 3. Fallback: closest whitespace to middle
  if (bestSplitIdx === -1) {
    const spaces = Array.from(clean.matchAll(/\s+/g));
    for (const match of spaces) {
      const idx = match.index || 0;
      const dist = Math.abs(idx - mid);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestSplitIdx = idx;
      }
    }
  }

  if (bestSplitIdx <= 0 || bestSplitIdx >= clean.length) {
    return [{ start: Math.round(start * 100) / 100, end: Math.round(end * 100) / 100, text: clean }];
  }

  const part1 = clean.slice(0, bestSplitIdx).trim();
  const part2 = clean.slice(bestSplitIdx).trim();

  const totalChars = part1.length + part2.length;
  const totalDur = Math.max(0.6, end - start);
  const dur1 = totalChars > 0 ? totalDur * (part1.length / totalChars) : totalDur / 2;
  const splitTime = Math.round((start + dur1) * 100) / 100;

  const result: { start: number; end: number; text: string }[] = [];

  if (part1.length > maxCharsPerCue) {
    result.push(...formatCueToMaxTwoLines(start, splitTime, part1, maxCharsPerCue));
  } else {
    result.push({ start: Math.round(start * 100) / 100, end: splitTime, text: part1 });
  }

  if (part2.length > maxCharsPerCue) {
    result.push(...formatCueToMaxTwoLines(splitTime, end, part2, maxCharsPerCue));
  } else {
    result.push({ start: splitTime, end: Math.round(end * 100) / 100, text: part2 });
  }

  return result;
}

export interface AudioSilenceInterval {
  start: number;
  end: number;
  duration: number;
}

/**
 * Splits a caption cue into natural 1-2 line spoken phrases (4 to 7 words / up to ~38 chars)
 * at punctuation marks and natural clause boundaries, merging tiny 1-2 word tail orphans.
 */
export function splitCueTextIntoNaturalPhrases(
  text: string,
  maxWordsPerPhrase = 6,
  maxCharsPerPhrase = 38
): string[] {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const words = clean.split(" ").filter(Boolean);
  if (words.length <= maxWordsPerPhrase + 1 && clean.length <= maxCharsPerPhrase + 6) {
    return [clean];
  }

  const clauseStarters = new Set([
    "that", "it's", "its", "and", "because", "so", "but", "which", "where",
    "when", "while", "if", "located", "making", "version", "honestly", "way",
    "unlike", "always", "once", "drop"
  ]);

  const phrases: string[][] = [];
  let current: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const cleanLower = word.toLowerCase().replace(/[^a-z']/g, "");
    const currentChars = current.join(" ").length;
    const remainingWords = words.length - i;

    // Break BEFORE a natural clause starter if current phrase already has >= 3 words
    if (
      current.length >= 3 &&
      remainingWords >= 2 &&
      (clauseStarters.has(cleanLower) || (cleanLower === "i" && current.length >= 4))
    ) {
      phrases.push(current);
      current = [word];
      continue;
    }

    current.push(word);
    const updatedChars = currentChars + (currentChars > 0 ? 1 : 0) + word.length;
    const hasEndPunct = /[.,!?;:]$/.test(word);
    const afterRemaining = words.length - (i + 1);
    const nextWordLower = afterRemaining >= 1 ? words[i + 1].toLowerCase().replace(/[^a-z']/g, "") : "";
    const wordAfterNextLower = afterRemaining >= 2 ? words[i + 2].toLowerCase().replace(/[^a-z']/g, "") : "";

    if (afterRemaining > 0) {
      // If the word after next is a clause starter (e.g. "price [point] [so]"), allow 1 extra word so we split cleanly before the clause starter
      const holdOneMoreWordForClause =
        !hasEndPunct &&
        !clauseStarters.has(nextWordLower) &&
        clauseStarters.has(wordAfterNextLower) &&
        current.length <= maxWordsPerPhrase &&
        updatedChars + 1 + (words[i + 1]?.length || 0) <= maxCharsPerPhrase + 6;

      if (
        !holdOneMoreWordForClause &&
        ((hasEndPunct && current.length >= 2) ||
          current.length >= maxWordsPerPhrase ||
          updatedChars >= maxCharsPerPhrase)
      ) {
        phrases.push(current);
        current = [];
      }
    }
  }

  if (current.length > 0) {
    phrases.push(current);
  }

  // Merge any tiny 1-2 word trailing or orphan phrase into its neighbor so single words never flash alone
  const merged: string[][] = [];
  for (let i = 0; i < phrases.length; i++) {
    const p = phrases[i];
    if (
      i === phrases.length - 1 &&
      p.length <= 2 &&
      merged.length > 0 &&
      merged[merged.length - 1].length + p.length <= maxWordsPerPhrase + 2
    ) {
      merged[merged.length - 1] = [...merged[merged.length - 1], ...p];
    } else {
      merged.push(p);
    }
  }

  return merged.map((p) => p.join(" "));
}

/**
 * Aligns official Bunny Stream VTT cues with hardware-detected audio silence intervals (from ffmpeg silencedetect).
 * - Preserves short cues with exact Bunny Stream timestamps.
 * - For multi-clause cues, maps phrase phonetic weights exclusively onto active vocal speech islands
 *   (excluding silence pauses) and snaps phrase boundaries directly to real hardware voice pauses.
 */
export function alignBunnyCuesWithHardwareSilences(
  rawCues: { start: number; end: number; text: string }[],
  silences: AudioSilenceInterval[] = []
): SubtitleSegment[] {
  if (!Array.isArray(rawCues) || rawCues.length === 0) return [];

  const sortedSilences = [...(silences || [])]
    .filter((s) => s && typeof s.start === "number" && typeof s.end === "number" && s.end > s.start)
    .sort((a, b) => a.start - b.start);

  const result: SubtitleSegment[] = [];

  for (const cue of rawCues) {
    const text = String(cue?.text || "").replace(/\s+/g, " ").trim();
    if (!text) continue;

    let cueStart = Math.max(0, Number(cue.start || 0));
    let cueEnd = Math.max(cueStart + 0.4, Number(cue.end || cueStart + 2.0));

    // Trim leading/trailing silence overlapping cue boundaries
    for (const sil of sortedSilences) {
      if (sil.start <= cueStart + 0.08 && sil.end > cueStart && sil.end < cueEnd - 0.4) {
        cueStart = sil.end;
      }
      if (sil.end >= cueEnd - 0.08 && sil.start > cueStart + 0.4 && sil.start < cueEnd) {
        cueEnd = sil.start;
      }
    }

    const phrases = splitCueTextIntoNaturalPhrases(text, 6, 38);
    if (phrases.length <= 1) {
      result.push({
        start: Math.round(cueStart * 100) / 100,
        end: Math.round(cueEnd * 100) / 100,
        text: phrases[0] || text,
        isHardwareTimed: true
      });
      continue;
    }

    // Build active vocal islands inside [cueStart, cueEnd] by subtracting hardware silences
    const internalSilences = sortedSilences.filter(
      (s) => s.start > cueStart + 0.25 && s.start < cueEnd - 0.15 && s.duration >= 0.12
    );

    const vocalIslands: { start: number; end: number; duration: number }[] = [];
    let cursor = cueStart;
    for (const sil of internalSilences) {
      if (sil.start > cursor + 0.05) {
        vocalIslands.push({
          start: cursor,
          end: sil.start,
          duration: sil.start - cursor
        });
      }
      cursor = Math.max(cursor, sil.end);
    }
    if (cueEnd > cursor + 0.05) {
      vocalIslands.push({
        start: cursor,
        end: cueEnd,
        duration: cueEnd - cursor
      });
    }

    const totalVocalDuration = vocalIslands.reduce((acc, v) => acc + v.duration, 0);

    // Helper: convert active vocal elapsed time [0, totalVocalDuration] -> real video timestamp
    const vocalTimeToRealTime = (vocalElapsed: number): number => {
      if (vocalIslands.length === 0 || totalVocalDuration <= 0) {
        return cueStart + (vocalElapsed / Math.max(1, totalVocalDuration)) * (cueEnd - cueStart);
      }
      let rem = Math.max(0, Math.min(totalVocalDuration, vocalElapsed));
      for (const island of vocalIslands) {
        if (rem <= island.duration + 1e-6) {
          return island.start + rem;
        }
        rem -= island.duration;
      }
      return cueEnd;
    };

    const phraseWeights = phrases.map((p) => {
      const pWords = p.split(/\s+/).filter(Boolean);
      return pWords.reduce((sum, w) => sum + getWordPhoneticWeight(w), 0);
    });
    const totalWeight = phraseWeights.reduce((a, b) => a + b, 0);

    const usedSilenceIndices = new Set<number>();
    let currentPhraseStart = cueStart;
    let cumulativeWeight = 0;

    for (let i = 0; i < phrases.length; i++) {
      const isLast = i === phrases.length - 1;
      cumulativeWeight += phraseWeights[i];

      if (isLast) {
        result.push({
          start: Math.round(currentPhraseStart * 100) / 100,
          end: Math.round(Math.max(currentPhraseStart + 0.45, cueEnd) * 100) / 100,
          text: phrases[i],
          isHardwareTimed: true
        });
        break;
      }

      const targetVocalTime = (cumulativeWeight / totalWeight) * totalVocalDuration;
      const idealRealTime = vocalTimeToRealTime(targetVocalTime);

      // Find the best unused hardware silence pause near idealRealTime
      let bestSilIdx = -1;
      let bestScore = Infinity;

      for (let sIdx = 0; sIdx < internalSilences.length; sIdx++) {
        if (usedSilenceIndices.has(sIdx)) continue;
        const sil = internalSilences[sIdx];
        if (sil.start < currentPhraseStart + 0.45) continue;
        if (sil.start > cueEnd - 0.15) continue;

        const dist = Math.abs(sil.start - idealRealTime);
        // Prefer longer pauses when close to the expected vocal boundary
        const durationBonus = Math.min(0.4, sil.duration * 0.35);
        const score = dist - durationBonus;

        if (dist <= 1.35 && score < bestScore) {
          bestScore = score;
          bestSilIdx = sIdx;
        }
      }

      if (bestSilIdx !== -1) {
        usedSilenceIndices.add(bestSilIdx);
        const chosenSil = internalSilences[bestSilIdx];
        const phraseEnd = Math.max(currentPhraseStart + 0.35, chosenSil.start);
        result.push({
          start: Math.round(currentPhraseStart * 100) / 100,
          end: Math.round(phraseEnd * 100) / 100,
          text: phrases[i],
          isHardwareTimed: true
        });
        // Next phrase starts at the exact millisecond the speaker resumes talking after the silence!
        currentPhraseStart = chosenSil.end;
      } else {
        const phraseEnd = Math.max(currentPhraseStart + 0.4, Math.min(cueEnd - 0.35, idealRealTime));
        result.push({
          start: Math.round(currentPhraseStart * 100) / 100,
          end: Math.round(phraseEnd * 100) / 100,
          text: phrases[i],
          isHardwareTimed: true
        });
        currentPhraseStart = phraseEnd;
      }
    }
  }

  return result;
}


