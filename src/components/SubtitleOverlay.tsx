import React from 'react';

interface SubtitleOverlayProps {
  currentTime?: number;
  segments?: any[];
  transcriptText?: string;
  duration?: number;
  isActive?: boolean;
  isLiveRecording?: boolean;
}

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = () => {
  // Pure Bunny Stream native VTT subtitles via HTML5 <track> (local JS fallback completely removed)
  return null;
};

export const buildSegmentsFromTranscript = () => [];

