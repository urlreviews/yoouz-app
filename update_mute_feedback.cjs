const fs = require('fs');
let content = fs.readFileSync('src/components/VideoFeedCard.tsx', 'utf-8');

// Add state
content = content.replace(
  /const \[showPlayPauseFeedback, setShowPlayPauseFeedback\] = useState<"play" \| "pause" \| null>\(null\);/,
  `const [showPlayPauseFeedback, setShowPlayPauseFeedback] = useState<"play" | "pause" | null>(null);
  const [showMuteFeedback, setShowMuteFeedback] = useState<"muted" | "unmuted" | null>(null);
  const muteFeedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);`
);

// Add interceptor wrapper for onToggleMute
const interceptor = `
  const handleToggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onToggleMute(e);
    
    if (muteFeedbackTimeoutRef.current) clearTimeout(muteFeedbackTimeoutRef.current);
    setShowMuteFeedback(!isMuted ? "muted" : "unmuted");
    muteFeedbackTimeoutRef.current = setTimeout(() => {
      setShowMuteFeedback(null);
    }, 650);
  };`;

// Insert the interceptor before handleTogglePlayPause
content = content.replace(
  /  \/\/ Click card to toggle Play \/ Pause or recover from error/,
  interceptor + '\n\n  // Click card to toggle Play / Pause or recover from error'
);

// Update button onClick
content = content.replace(
  /onClick={onToggleMute}/,
  'onClick={handleToggleMute}'
);

// Update button content to an equalizer when unmuted and playing
const oldMuteButtonInner = `            {isMuted ? (
              <VolumeX className="w-5 h-5 text-zinc-300" />
            ) : (
              <Volume2 className="w-5 h-5 text-emerald-400 animate-pulse" />
            )}`;

const newMuteButtonInner = `            {isMuted ? (
              <VolumeX className="w-5 h-5 text-zinc-300" />
            ) : (
              <div className="flex items-end justify-center gap-[2px] w-5 h-5 relative">
                {isPlaying ? (
                  <>
                    <div className="w-[3px] bg-emerald-400 rounded-full animate-[equalizer_0.8s_ease-in-out_infinite] h-2"></div>
                    <div className="w-[3px] bg-emerald-400 rounded-full animate-[equalizer_0.8s_ease-in-out_infinite_0.2s] h-4"></div>
                    <div className="w-[3px] bg-emerald-400 rounded-full animate-[equalizer_0.8s_ease-in-out_infinite_0.4s] h-3"></div>
                  </>
                ) : (
                  <Volume2 className="w-5 h-5 text-emerald-400" />
                )}
              </div>
            )}`;

content = content.replace(oldMuteButtonInner, newMuteButtonInner);

// Add the transient mute visual feedback block near showPlayPauseFeedback
const oldFeedbackBlock = `      {/* Transient Play/Pause Icon Tap Feedback */}
      {showPlayPauseFeedback && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl animate-out fade-out zoom-out duration-500 pointer-events-none">
          {showPlayPauseFeedback === "play" ? (
            <Play className="w-9 h-9 fill-white translate-x-0.5" />
          ) : (
            <Pause className="w-9 h-9 fill-white" />
          )}
        </div>
      )}`;

const newFeedbackBlock = `      {/* Transient Play/Pause Icon Tap Feedback */}
      {showPlayPauseFeedback && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl animate-out fade-out zoom-out duration-500 pointer-events-none">
          {showPlayPauseFeedback === "play" ? (
            <Play className="w-9 h-9 fill-white translate-x-0.5" />
          ) : (
            <Pause className="w-9 h-9 fill-white" />
          )}
        </div>
      )}

      {/* Transient Mute/Unmute Icon Tap Feedback */}
      {showMuteFeedback && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-white shadow-2xl animate-out fade-out zoom-out duration-500 pointer-events-none">
          {showMuteFeedback === "unmuted" ? (
            <Volume2 className="w-8 h-8 text-white" />
          ) : (
            <VolumeX className="w-8 h-8 text-white" />
          )}
        </div>
      )}`;

content = content.replace(oldFeedbackBlock, newFeedbackBlock);

fs.writeFileSync('src/components/VideoFeedCard.tsx', content, 'utf-8');
console.log("Updated video feed card with equalizer and mute feedback");
