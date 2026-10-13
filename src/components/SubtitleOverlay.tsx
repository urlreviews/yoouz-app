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
    <div className="absolute bottom-[28%] left-0 right-0 flex justify-center px-8 pointer-events-none z-[48] select-none transition-all duration-300">
      <div className="max-w-[95%] animate-in fade-in zoom-in-90 slide-in-from-bottom-2 duration-300">
        <div className="bg-black/60 backdrop-blur-md px-6 py-2.5 rounded-[22px] border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <p className="text-white text-[18px] sm:text-[20px] md:text-[22px] font-black text-center leading-[1.1] tracking-tight [text-shadow:_0_2px_8px_rgb(0_0_0_/_80%)] uppercase italic transform hover:scale-105 transition-transform">
            {activeSegment.text.trim()}
          </p>
        </div>
      </div>
    </div>
  );
};
