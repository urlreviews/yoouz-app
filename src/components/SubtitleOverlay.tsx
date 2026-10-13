import React, { useMemo } from 'react';

interface SubtitleOverlayProps {
  currentTime: number;
  segments?: any[];
  transcriptText?: string;
  duration?: number;
  isActive: boolean;
}

// Helper to build timed segments from plain text transcript if explicit segments are missing
export const buildSegmentsFromTranscript = (text: string, totalDuration: number = 60) => {
  if (!text || !text.trim()) return [];

  // Clean and split text by sentence/clause boundaries (. ! ? \n or commas)
  const sentences = text
    .trim()
    .split(/(?<=[.!?\n])\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return [{ start: 0, end: Math.max(totalDuration, 10), text: text.trim() }];
  }

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
      return parsed.map(s => ({
        start: Number(s.start ?? s.start_time ?? 0),
        end: Number(s.end ?? s.end_time ?? 9999),
        text: String(s.text || s.transcript || '').trim()
      })).filter(s => s.text);
    }

    // Fallback: build segments on-the-fly from transcriptText
    if (transcriptText && transcriptText.trim()) {
      return buildSegmentsFromTranscript(transcriptText, duration);
    }

    return [];
  }, [segments, transcriptText, duration]);

  if (validSegments.length === 0) return null;

  const activeSegment = validSegments.find(
    s => currentTime >= s.start && currentTime <= s.end
  );

  if (!activeSegment || !activeSegment.text) return null;

  return (
    <div className="absolute bottom-[28%] left-0 right-0 flex justify-center px-6 pointer-events-none z-[48] select-none transition-all duration-300">
      <div className="max-w-[92%] animate-in fade-in zoom-in-90 slide-in-from-bottom-2 duration-200">
        <div className="bg-black/75 backdrop-blur-md px-5 py-2.5 rounded-[22px] border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.7)] text-center">
          <p className="text-white text-[16px] sm:text-[18px] md:text-[20px] font-black leading-[1.25] tracking-tight [text-shadow:_0_2px_10px_rgb(0_0_0_/_90%)] uppercase italic">
            {activeSegment.text}
          </p>
        </div>
      </div>
    </div>
  );
};
