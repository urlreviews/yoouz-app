import React from 'react';

interface SubtitleOverlayProps {
  currentTime: number;
  segments?: any[];
  isActive: boolean;
}

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({ currentTime, segments, isActive }) => {
  if (!isActive || !segments || segments.length === 0) return null;
  
  // Find the segment that matches the current video time
  const activeSegment = segments.find(s => currentTime >= s.start && currentTime <= s.end);
  
  if (!activeSegment) return null;

  return (
    <div className="absolute bottom-[30%] left-0 right-0 flex justify-center px-8 pointer-events-none z-[48] select-none transition-all duration-300">
      <div className="max-w-[90%] animate-in fade-in zoom-in-95 duration-200">
        <p className="text-white text-[17px] sm:text-[19px] md:text-[21px] font-black text-center leading-tight tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] [text-shadow:_0_1px_4px_rgb(0_0_0_/_100%)] bg-black/25 backdrop-blur-[1px] px-4 py-1.5 rounded-xl uppercase italic">
          {activeSegment.text.trim()}
        </p>
      </div>
    </div>
  );
};
