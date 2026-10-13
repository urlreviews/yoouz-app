import React, { useMemo } from 'react';

interface SubtitleOverlayProps {
  currentTime: number;
  segments?: any[];
  transcriptText?: string;
  duration?: number;
  isActive: boolean;
}

// Helper to filter out video review title fallbacks so post titles never appear as subtitles
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

// Helper to build timed segments from plain text transcript if explicit segments are missing
export const buildSegmentsFromTranscript = (text: string, totalDuration: number = 60) => {
  if (!text || !text.trim() || isTitleFallbackText(text)) return [];

  // Clean and split text by sentence/clause boundaries (. ! ? \n or commas)
  const sentences = text
    .trim()
    .split(/(?<=[.!?\n])\s+/)
    .map(s => s.trim())
    .filter(Boolean)
    .filter(s => !isTitleFallbackText(s));

  if (sentences.length === 0) return [];

  // Calculate total words to assign duration proportionally
  const totalWords = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0);
  const dur = totalDuration && totalDuration > 0 ? totalDuration : 60;
  
  let currentStart = 0;
  return sentences.map((sentence) => {
    const wordCount = sentence.split(/\s+/).length;
    // Calculate slice duration proportional to word count (min 2 seconds per segment)
    const segDuration = Math.max(2, (wordCount / (totalWords || 1)) * dur);
    const start = Math.round(currentStart * 100) / 100;
    const end = Math.round((currentStart + segDuration) * 100) / 100;
    currentStart += segDuration;

    return {
      start,
      end,
      text: sentence
    };
  });
};

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  currentTime,
  segments,
  transcriptText,
  duration = 60,
  isActive
}) => {
  if (!isActive) return null;

  const validSegments = useMemo(() => {
    let parsed: any[] = [];
    if (Array.isArray(segments)) {
      parsed = segments;
    } else if (typeof segments === 'string') {
      try {
        const json = JSON.parse(segments);
        if (Array.isArray(json)) parsed = json;
      } catch (e) {}
    }

    if (parsed.length > 0) {
      return parsed
        .map(s => ({
          start: Number(s.start ?? s.start_time ?? 0),
          end: Number(s.end ?? s.end_time ?? 9999),
          text: String(s.text || s.transcript || '').trim()
        }))
        .filter(s => s.text && !isTitleFallbackText(s.text));
    }

    // Fallback: build segments on-the-fly from transcriptText
    if (transcriptText && transcriptText.trim() && !isTitleFallbackText(transcriptText)) {
      return buildSegmentsFromTranscript(transcriptText, duration);
    }

    return [];
  }, [segments, transcriptText, duration]);

  if (validSegments.length === 0) return null;

  const activeSegment = validSegments.find(
    s => currentTime >= s.start && currentTime <= s.end
  );

  if (!activeSegment || !activeSegment.text || isTitleFallbackText(activeSegment.text)) {
    return null;
  }

  return (
    <div className="absolute bottom-[115px] sm:bottom-[130px] left-0 right-0 flex justify-center px-4 pointer-events-none z-[48] select-none transition-all duration-300">
      <div className="max-w-[85%] sm:max-w-[78%] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
        <div className="bg-black/65 backdrop-blur-md px-4 py-2 rounded-full border border-white/15 shadow-[0_4px_20px_rgba(0,0,0,0.6)] text-center">
          <p className="text-white text-[13px] sm:text-[15px] font-semibold leading-tight tracking-normal text-center drop-shadow-md">
            {activeSegment.text}
          </p>
        </div>
      </div>
    </div>
  );
};

