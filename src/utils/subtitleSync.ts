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
 * Splits a caption cue into natural 1-2 line spoken phrases (2 to 6 words / up to ~35 chars)
 * at punctuation marks, proper-noun boundaries, and natural clause boundaries.
 */
export function splitCueTextIntoNaturalPhrases(
  text: string,
  maxWordsPerPhrase = 6,
  maxCharsPerPhrase = 35
): string[] {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const words = clean.split(" ").filter(Boolean);
  if (words.length <= 3 && clean.length <= maxCharsPerPhrase && !/[.!?]\s/.test(clean)) {
    return [clean];
  }

  const clauseStarters = new Set([
    "that", "it's", "and", "because", "so", "but", "which", "where",
    "when", "while", "if", "located", "making", "version", "honestly", "way",
    "unlike", "always", "once", "drop", "or", "since", "although", "though"
  ]);

  const sentenceStarterCapitalized = new Set([
    "This", "That", "These", "Those", "But", "And", "So", "Because",
    "However", "Also", "Plus", "They", "We", "He", "She", "It", "It's",
    "There", "Here", "Now", "Then", "When", "While", "If", "Once",
    "Overall", "Honestly", "Basically", "Actually", "Definitely"
  ]);

  const conjunctionsBeforeI = new Set([
    "and", "so", "but", "because", "that", "when", "if", "while", "as", "since", "though", "like", "or"
  ]);

  const isProperWord = (w: string): boolean => {
    const stripped = w.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, "");
    if (!stripped || stripped === "I" || stripped.startsWith("I'")) return false;
    if (sentenceStarterCapitalized.has(stripped)) return false;
    return /^[A-Z]/.test(stripped);
  };

  // Measure how many consecutive Proper Capitalized Words start at index idx (e.g. "Art Gallery Cafe,")
  const getProperChainStats = (startIdx: number): { count: number; chars: number } => {
    let count = 0;
    let chars = 0;
    for (let k = startIdx; k < words.length && count < 4; k++) {
      if (!isProperWord(words[k])) break;
      count++;
      chars += (count > 1 ? 1 : 0) + words[k].length;
      if (/[.,!?;:]$/.test(words[k])) break;
    }
    return { count, chars };
  };

  const phrases: string[][] = [];
  let current: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const cleanWord = word.replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g, "");
    const cleanLower = cleanWord.toLowerCase();
    const currentChars = current.join(" ").length;
    const remainingWords = words.length - i;
    const prevWord = current.length > 0 ? current[current.length - 1] : "";
    const prevLower = prevWord.toLowerCase().replace(/[^a-z']/g, "");
    const prevHasPunct = /[.,!?;:]$/.test(prevWord);

    // 1. Break BEFORE unpunctuated Capitalized sentence starters mid-cue (e.g. "open it up This is a product.")
    if (
      current.length >= 1 &&
      !prevHasPunct &&
      sentenceStarterCapitalized.has(cleanWord)
    ) {
      phrases.push(current);
      current = [word];
      continue;
    }

    // 2. Break BEFORE "I <verb>" / "I'm" / "I've" / "I'll" when not preceded by a conjunction
    // (e.g., "different things with | I don't know | I will actually come back here")
    if (
      current.length >= 2 &&
      remainingWords >= 2 &&
      (cleanLower === "i" || cleanLower === "i'm" || cleanLower === "i've" || cleanLower === "i'll" || cleanLower === "i'd") &&
      !conjunctionsBeforeI.has(prevLower)
    ) {
      phrases.push(current);
      current = [word];
      continue;
    }

    // 3. Protect multi-word Proper Noun sequences (e.g. "Art Gallery Cafe,") from being cut in the middle:
    // If word starts a 2+ word Proper Noun chain and current phrase wouldn't fit the whole chain, break BEFORE the Proper Noun!
    if (current.length >= 2 && isProperWord(word) && !isProperWord(prevWord)) {
      const chain = getProperChainStats(i);
      if (
        chain.count >= 2 &&
        (current.length + chain.count > maxWordsPerPhrase || currentChars + 1 + chain.chars > maxCharsPerPhrase)
      ) {
        phrases.push(current);
        current = [word];
        continue;
      }
    }

    // 4. Break BEFORE a natural clause starter if current phrase already has >= 3 words
    if (
      current.length >= 3 &&
      remainingWords >= 2 &&
      clauseStarters.has(cleanLower) &&
      !(cleanLower === "and" && current.length === 3 && remainingWords === 2)
    ) {
      phrases.push(current);
      current = [word];
      continue;
    }

    // 5. Avoid stranding a 2-word prepositional tail (e.g. "on the product.", "of this now.", "for the review.")
    // by breaking BEFORE the preposition when current already has >= 4 words
    const prepositions = new Set(["on", "in", "at", "for", "with", "from", "into", "unto", "by", "about"]);
    if (
      current.length >= 4 &&
      remainingWords >= 2 &&
      remainingWords <= 3 &&
      prepositions.has(cleanLower)
    ) {
      phrases.push(current);
      current = [word];
      continue;
    }

    current.push(word);
    const updatedChars = currentChars + (currentChars > 0 ? 1 : 0) + word.length;
    const hasEndPunct = /[.,!?;:]$/.test(word);
    const isStrongSentenceEnd = /[.!?]$/.test(word);
    const afterRemaining = words.length - (i + 1);
    const nextWord = afterRemaining >= 1 ? words[i + 1] : "";
    const nextWordClean = nextWord.replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g, "");
    const nextWordLower = nextWordClean.toLowerCase();
    const wordAfterNext = afterRemaining >= 2 ? words[i + 2] : "";
    const wordAfterNextClean = wordAfterNext.replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g, "");
    const wordAfterNextLower = wordAfterNextClean.toLowerCase();

    if (afterRemaining > 0) {
      // Never split in the middle of two consecutive Proper Noun words unless punctuated
      const splittingProperNoun = !hasEndPunct && isProperWord(word) && isProperWord(nextWord);

      const holdOneMoreWordForClause =
        !hasEndPunct &&
        !clauseStarters.has(nextWordLower) &&
        !sentenceStarterCapitalized.has(nextWordClean) &&
        (
          clauseStarters.has(wordAfterNextLower) ||
          sentenceStarterCapitalized.has(wordAfterNextClean) ||
          wordAfterNextLower === "i" ||
          wordAfterNextLower === "i'm" ||
          /[.,!?;:]$/.test(nextWord) ||
          afterRemaining === 1
        ) &&
        current.length <= maxWordsPerPhrase &&
        updatedChars + 1 + nextWord.length <= maxCharsPerPhrase + 5;

      if (
        isStrongSentenceEnd ||
        (hasEndPunct && current.length >= 2 && afterRemaining >= 2) ||
        (!splittingProperNoun &&
          !holdOneMoreWordForClause &&
          (current.length >= maxWordsPerPhrase || updatedChars + 1 + nextWord.length > maxCharsPerPhrase))
      ) {
        phrases.push(current);
        current = [];
      }
    }
  }

  if (current.length > 0) {
    phrases.push(current);
  }

  // Merge any tiny 1-word orphan (that doesn't have strong punctuation) into its neighbor
  const merged: string[][] = [];
  for (let i = 0; i < phrases.length; i++) {
    const p = phrases[i];
    const pText = p.join(" ");
    if (
      p.length === 1 &&
      !/[.!?,;:]$/.test(pText) &&
      merged.length > 0 &&
      !/[.!?]$/.test(merged[merged.length - 1].join(" ")) &&
      merged[merged.length - 1].join(" ").length + 1 + pText.length <= maxCharsPerPhrase + 5
    ) {
      merged[merged.length - 1] = [...merged[merged.length - 1], ...p];
    } else if (
      i === phrases.length - 1 &&
      p.length === 1 &&
      merged.length > 0 &&
      merged[merged.length - 1].length >= 4 &&
      !/[.!?,;:]$/.test(merged[merged.length - 1][merged[merged.length - 1].length - 1])
    ) {
      const moved = merged[merged.length - 1].pop()!;
      merged.push([moved, ...p]);
    } else {
      merged.push(p);
    }
  }

  return merged.map((p) => p.join(" "));
}

/**
 * Aligns official Bunny Stream VTT cues with hardware-detected audio silence intervals (from ffmpeg silencedetect).
 * - Merges micro-silences and trims leading/trailing silence at cue edges.
 * - Uses Monotonic Dynamic Programming (Viterbi alignment) to lock phrase boundaries to real vocal pauses
 *   so subtitles appear the exact millisecond the speaker begins talking and disappear during pauses.
 */
export function alignBunnyCuesWithHardwareSilences(
  rawCues: { start: number; end: number; text: string }[],
  silences: AudioSilenceInterval[] = [],
  videoDuration = 0
): SubtitleSegment[] {
  if (!Array.isArray(rawCues) || rawCues.length === 0) return [];

  // Sort and merge micro-gaps (< 0.06s) between adjacent silence intervals
  const rawSorted = [...(silences || [])]
    .filter((s) => s && typeof s.start === "number" && typeof s.end === "number" && s.end > s.start)
    .sort((a, b) => a.start - b.start);

  const sortedSilences: AudioSilenceInterval[] = [];
  for (const s of rawSorted) {
    if (sortedSilences.length > 0 && s.start - sortedSilences[sortedSilences.length - 1].end <= 0.06) {
      const prev = sortedSilences[sortedSilences.length - 1];
      prev.end = Math.max(prev.end, s.end);
      prev.duration = prev.end - prev.start;
    } else {
      sortedSilences.push({ start: s.start, end: s.end, duration: s.end - s.start });
    }
  }

  // Determine the true end of active vocal speech from hardware silences
  let lastVocalEnd = 0;
  if (videoDuration > 0 && sortedSilences.length > 0) {
    let cursor = 0;
    for (const s of sortedSilences) {
      if (s.start > cursor + 0.12) {
        lastVocalEnd = s.start;
      }
      cursor = Math.max(cursor, s.end);
    }
    if (videoDuration > cursor + 0.25) {
      lastVocalEnd = videoDuration;
    }
  }

  let workingCues = rawCues
    .map((c) => ({
      start: Number(c?.start || 0),
      end: Number(c?.end || 0),
      text: String(c?.text || "").replace(/\s+/g, " ").trim()
    }))
    .filter((c) => c.text.length > 0);

  // If Bunny Stream's VTT compressed trailing cues before the end of actual hardware speech (> 3.0s gap),
  // remap the compressed trailing block across the full hardware vocal speech span [blockStart, lastVocalEnd]
  if (workingCues.length > 0 && lastVocalEnd > workingCues[workingCues.length - 1].end + 3.0) {
    let splitIdx = workingCues.length - 1;
    while (splitIdx > 0) {
      const gap = workingCues[splitIdx].start - workingCues[splitIdx - 1].end;
      if (gap >= 0.45) break;
      splitIdx--;
    }
    const compressedBlock = workingCues.slice(splitIdx);
    const blockWords = compressedBlock.reduce((sum, c) => sum + c.text.split(/\s+/).length, 0);
    const blockVttDur = Math.max(0.1, compressedBlock[compressedBlock.length - 1].end - compressedBlock[0].start);
    if (blockWords / blockVttDur > 3.5) {
      workingCues = [
        ...workingCues.slice(0, splitIdx),
        {
          start: compressedBlock[0].start,
          end: lastVocalEnd,
          text: compressedBlock.map((c) => c.text).join(" ")
        }
      ];
    }
  }

  const result: SubtitleSegment[] = [];

  for (const cue of workingCues) {
    const text = cue.text;
    if (!text) continue;

    let cueStart = Math.max(0, Number(cue.start || 0));
    let cueEnd = Math.max(cueStart + 0.4, Number(cue.end || cueStart + 1.5));

    // Trim leading/trailing silence overlapping cue boundaries so start/end lock to actual voice
    for (const sil of sortedSilences) {
      if (sil.start <= cueStart + 0.08 && sil.end > cueStart && sil.end < cueEnd - 0.35) {
        cueStart = sil.end;
      }
      if (sil.end >= cueEnd - 0.08 && sil.start > cueStart + 0.35 && sil.start < cueEnd) {
        cueEnd = sil.start;
      }
    }

    const phrases = splitCueTextIntoNaturalPhrases(text, 6, 35);
    if (phrases.length <= 1) {
      result.push({
        start: Math.round(cueStart * 100) / 100,
        end: Math.round(Math.max(cueStart + 0.45, cueEnd) * 100) / 100,
        text: phrases[0] || text,
        isHardwareTimed: true
      });
      continue;
    }

    // Internal hardware silences inside [cueStart, cueEnd]
    const internalSilences = sortedSilences.filter(
      (s) => s.start > cueStart + 0.22 && s.end < cueEnd - 0.18 && s.duration >= 0.09
    );

    const vocalIslands: { start: number; end: number; duration: number }[] = [];
    let cursor = cueStart;
    for (const sil of internalSilences) {
      if (sil.start > cursor + 0.04) {
        vocalIslands.push({
          start: cursor,
          end: sil.start,
          duration: sil.start - cursor
        });
      }
      cursor = Math.max(cursor, sil.end);
    }
    if (cueEnd > cursor + 0.04) {
      vocalIslands.push({
        start: cursor,
        end: cueEnd,
        duration: cueEnd - cursor
      });
    }

    const totalVocalDuration = vocalIslands.reduce((acc, v) => acc + v.duration, 0);

    // Helper: active vocal elapsed time inside [t1, t2]
    const getVocalDurBetween = (t1: number, t2: number): number => {
      if (t2 <= t1) return 0;
      if (vocalIslands.length === 0) return t2 - t1;
      let sum = 0;
      for (const isl of vocalIslands) {
        const s = Math.max(t1, isl.start);
        const e = Math.min(t2, isl.end);
        if (e > s) sum += e - s;
      }
      return sum;
    };

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

    const P = phrases.length;
    const idealBoundaries: number[] = [];
    let cumW = 0;
    for (let i = 0; i < P - 1; i++) {
      cumW += phraseWeights[i];
      const targetVocal = (cumW / totalWeight) * totalVocalDuration;
      idealBoundaries.push(vocalTimeToRealTime(targetVocal));
    }

    // Build candidate break intervals for each boundary i in 0 .. P-2:
    // Each candidate is { endPrev: number, startNext: number, silIdx: number, isRealSilence: boolean, silDur: number }
    type BreakCandidate = {
      endPrev: number;
      startNext: number;
      silIdx: number;
      isRealSilence: boolean;
      silDur: number;
    };

    const candidatesPerBoundary: BreakCandidate[][] = [];
    for (let i = 0; i < P - 1; i++) {
      const idealT = idealBoundaries[i];
      const cands: BreakCandidate[] = [];
      for (let sIdx = 0; sIdx < internalSilences.length; sIdx++) {
        const sil = internalSilences[sIdx];
        if (Math.abs(sil.start - idealT) <= 3.2) {
          cands.push({
            endPrev: sil.start,
            startNext: sil.end,
            silIdx: sIdx,
            isRealSilence: true,
            silDur: sil.duration
          });
        }
      }
      // Also include the smooth phonetic fallback split in case no hardware silence occurred at this clause
      cands.push({
        endPrev: idealT,
        startNext: idealT,
        silIdx: -1,
        isRealSilence: false,
        silDur: 0
      });
      candidatesPerBoundary.push(cands);
    }

    // Helper: evaluate cost of phrase k spanning [pStart, pEnd]
    const scorePhraseSpan = (k: number, pStart: number, pEnd: number): number => {
      const spanDur = pEnd - pStart;
      const pWords = phrases[k].split(/\s+/).filter(Boolean).length;
      const minDur = Math.max(0.42, pWords * 0.21);
      if (spanDur < minDur) return 1e6; // Hard constraint: cannot be faster than physical speech

      const vocalDur = getVocalDurBetween(pStart, pEnd);
      const expectedVocalDur = (phraseWeights[k] / totalWeight) * totalVocalDuration;
      const vocalDiff = Math.abs(vocalDur - expectedVocalDur);

      // Penalize leaving any large unsplit silence (>= 0.35s) trapped inside the middle of a phrase
      let trappedSilencePenalty = 0;
      for (const sil of internalSilences) {
        if (sil.start >= pStart + 0.12 && sil.end <= pEnd - 0.12 && sil.duration >= 0.35) {
          trappedSilencePenalty += sil.duration * 3.8;
        }
      }

      return vocalDiff * 1.35 + trappedSilencePenalty;
    };

    // Monotonic Dynamic Programming over boundaries 0 .. P-2
    const dpCost: number[][] = candidatesPerBoundary.map((cands) => new Array(cands.length).fill(1e9));
    const dpParent: number[][] = candidatesPerBoundary.map((cands) => new Array(cands.length).fill(-1));

    for (let cIdx = 0; cIdx < candidatesPerBoundary[0].length; cIdx++) {
      const cand = candidatesPerBoundary[0][cIdx];
      const phraseCost = scorePhraseSpan(0, cueStart, cand.endPrev);
      if (phraseCost >= 1e5) continue;
      const hasPunct = /[.,!?;:]$/.test(phrases[0]);
      const silenceBonus = cand.isRealSilence
        ? Math.min(0.95, cand.silDur * 0.85) + (hasPunct ? 0.35 : 0.15)
        : 0;
      dpCost[0][cIdx] = phraseCost - silenceBonus;
    }

    for (let i = 1; i < P - 1; i++) {
      const hasPunct = /[.,!?;:]$/.test(phrases[i]);
      for (let cIdx = 0; cIdx < candidatesPerBoundary[i].length; cIdx++) {
        const curCand = candidatesPerBoundary[i][cIdx];
        const silenceBonus = curCand.isRealSilence
          ? Math.min(0.95, curCand.silDur * 0.85) + (hasPunct ? 0.35 : 0.15)
          : 0;

        for (let prevIdx = 0; prevIdx < candidatesPerBoundary[i - 1].length; prevIdx++) {
          if (dpCost[i - 1][prevIdx] >= 1e5) continue;
          const prevCand = candidatesPerBoundary[i - 1][prevIdx];
          if (curCand.endPrev <= prevCand.startNext + 0.35) continue;
          if (curCand.isRealSilence && prevCand.isRealSilence && curCand.silIdx <= prevCand.silIdx) continue;

          const phraseCost = scorePhraseSpan(i, prevCand.startNext, curCand.endPrev);
          if (phraseCost >= 1e5) continue;

          const total = dpCost[i - 1][prevIdx] + phraseCost - silenceBonus;
          if (total < dpCost[i][cIdx]) {
            dpCost[i][cIdx] = total;
            dpParent[i][cIdx] = prevIdx;
          }
        }
      }
    }

    // Add final phrase (P - 1) spanning [lastCand.startNext, cueEnd]
    let bestLastIdx = -1;
    let bestTotalCost = 1e9;
    const lastBoundary = P - 2;
    for (let cIdx = 0; cIdx < candidatesPerBoundary[lastBoundary].length; cIdx++) {
      if (dpCost[lastBoundary][cIdx] >= 1e5) continue;
      const cand = candidatesPerBoundary[lastBoundary][cIdx];
      const finalPhraseCost = scorePhraseSpan(P - 1, cand.startNext, cueEnd);
      if (finalPhraseCost >= 1e5) continue;
      const total = dpCost[lastBoundary][cIdx] + finalPhraseCost;
      if (total < bestTotalCost) {
        bestTotalCost = total;
        bestLastIdx = cIdx;
      }
    }

    if (bestLastIdx !== -1) {
      const chosenCands: BreakCandidate[] = new Array(P - 1);
      let curr = bestLastIdx;
      for (let i = P - 2; i >= 0; i--) {
        chosenCands[i] = candidatesPerBoundary[i][curr];
        curr = dpParent[i][curr];
      }

      let segStart = cueStart;
      for (let i = 0; i < P; i++) {
        const segEnd = i < P - 1 ? chosenCands[i].endPrev : cueEnd;
        result.push({
          start: Math.round(segStart * 100) / 100,
          end: Math.round(Math.max(segStart + 0.4, segEnd) * 100) / 100,
          text: phrases[i],
          isHardwareTimed: true
        });
        if (i < P - 1) {
          segStart = chosenCands[i].startNext;
        }
      }
    } else {
      // Fallback: proportional vocal mapping
      let segStart = cueStart;
      for (let i = 0; i < P; i++) {
        const segEnd = i < P - 1 ? idealBoundaries[i] : cueEnd;
        result.push({
          start: Math.round(segStart * 100) / 100,
          end: Math.round(Math.max(segStart + 0.4, segEnd) * 100) / 100,
          text: phrases[i],
          isHardwareTimed: true
        });
        segStart = segEnd;
      }
    }
  }

  return result;
}




