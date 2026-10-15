import React, { useMemo } from 'react';

interface SubtitleOverlayProps {
  currentTime?: number;
  segments?: any[];
  transcriptText?: string;
  duration?: number;
  isActive?: boolean;
  isLiveRecording?: boolean;
}

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

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  currentTime = 0,
  segments,
  transcriptText,
  duration = 15,
  isActive = false,
  isLiveRecording = false
}) => {
  const parsedSegments = useMemo(() => {
    let list: any[] = [];
    if (Array.isArray(segments) && segments.length > 0) {
      list = segments;
    } else if (typeof segments === 'string') {
      try {
        const parsed = JSON.parse(segments);
        if (Array.isArray(parsed)) list = parsed;
      } catch (e) {}
    }

    if (list.length === 0) {
      const text = (transcriptText || "").trim();
      if (text && !isTitleFallbackText(text)) {
        const words = text.split(/\s+/).filter(Boolean);
        const chunks: string[] = [];
        for (let i = 0; i < words.length; i += 6) {
          chunks.push(words.slice(i, i + 6).join(" "));
        }
        let curr = 0;
        list = chunks.map(chunk => {
          const durSec = Math.max(2.0, chunk.split(/\s+/).length * 0.4);
          const start = curr;
          const end = curr + durSec;
          curr = end;
          return { start, end, text: chunk };
        });
      }
    }

    return list.filter(s => s && s.text && !isTitleFallbackText(s.text));
  }, [segments, transcriptText]);

  const activeSegment = useMemo(() => {
    if (!isActive || parsedSegments.length === 0) return null;

    if (isLiveRecording) {
      return parsedSegments[parsedSegments.length - 1] || null;
    }

    // Strict YouTube-style time window matching: segment appears only during [start, end] and disappears when finished
    for (const seg of parsedSegments) {
      const start = Number(seg.start || 0);
      const end = Number(seg.end || (start + 3));
      if (currentTime >= start && currentTime <= end) {
        return seg;
      }
    }

    return null;
  }, [parsedSegments, currentTime, isActive, isLiveRecording]);

  if (!isActive || !activeSegment || !activeSegment.text) return null;

  return (
    <div className="absolute bottom-[200px] xs:bottom-[210px] sm:bottom-[220px] left-0 right-0 flex justify-center px-4 pointer-events-none z-[48] select-none transition-all duration-150">
      <div className="max-w-[92%] sm:max-w-[85%] animate-in fade-in zoom-in-95 duration-100 flex justify-center">
        <div className="bg-black/85 backdrop-blur-2xl px-5 sm:px-6 py-2.5 sm:py-3 rounded-full border border-white/20 shadow-[0_12px_36px_rgba(0,0,0,0.9)] text-center flex items-center justify-center max-w-full">
          <p className="text-white text-[15px] sm:text-[17px] font-extrabold tracking-tight drop-shadow-md text-center leading-snug px-1">
            {activeSegment.text}
          </p>
        </div>
      </div>
    </div>
  );
};

export const buildSegmentsFromTranscript = () => [];
