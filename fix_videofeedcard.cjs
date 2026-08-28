const fs = require('fs');
let code = fs.readFileSync('src/components/VideoFeedCard.tsx', 'utf-8');

// 1. Add state for browserForcedMute
const stateTarget = `  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);`;
const stateReplace = `  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [browserForcedMute, setBrowserForcedMute] = useState(false);`;

code = code.replace(stateTarget, stateReplace);

// 2. Reset browserForcedMute when isMuted prop changes
const muteEffectTarget = `  // Sync mute property changes
  useEffect(() => {
    const el = videoRef.current;
    if (el) {
      el.muted = isMuted;
    }
  }, [isMuted]);`;
const muteEffectReplace = `  // Sync mute property changes
  useEffect(() => {
    const el = videoRef.current;
    if (el) {
      el.muted = isMuted;
    }
    if (isMuted) {
      setBrowserForcedMute(false);
    }
  }, [isMuted]);`;

code = code.replace(muteEffectTarget, muteEffectReplace);

// 3. Set browserForcedMute on fallback
const safePlayTarget = `      // Browser blocked autoplay. DO NOT alter the user's global mute preference.
      try {
        // Fallback to muted autoplay so the video at least plays (TikTok style)
        el.muted = true;
        if (isActive) setIsPlaying(true);
        await el.play();`;
const safePlayReplace = `      // Browser blocked autoplay. DO NOT alter the user's global mute preference.
      try {
        // Fallback to muted autoplay so the video at least plays (TikTok style)
        el.muted = true;
        setBrowserForcedMute(true);
        if (isActive) setIsPlaying(true);
        await el.play();`;

code = code.replace(safePlayTarget, safePlayReplace);

// 4. Update the effective mute state
const effectiveMuteTarget = `    setShowMuteFeedback(!isMuted ? "muted" : "unmuted");`;
const effectiveMuteReplace = `    const effectiveMuted = isMuted || browserForcedMute;
    if (browserForcedMute) setBrowserForcedMute(false);
    setShowMuteFeedback(!effectiveMuted ? "muted" : "unmuted");`;

code = code.replace(effectiveMuteTarget, effectiveMuteReplace);

const muteButtonTarget = `title={isMuted ? "Unmute sound" : "Mute sound"}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-zinc-300" />
            ) : (`;
const muteButtonReplace = `title={(isMuted || browserForcedMute) ? "Unmute sound" : "Mute sound"}
          >
            {(isMuted || browserForcedMute) ? (
              <VolumeX className="w-5 h-5 text-zinc-300" />
            ) : (`;

code = code.replace(muteButtonTarget, muteButtonReplace);

const togglePlayTarget = `    // TikTok behavior: If it's playing but muted, and the global state says we want sound, 
    // or if the user clicks while it's silent, unmute it first.
    if (!el.paused && el.muted && !isMuted) {
      el.muted = false;
      triggerFeedback("play");
      return;
    }`;
const togglePlayReplace = `    // TikTok behavior: If it's playing but muted, and the global state says we want sound, 
    // or if the user clicks while it's silent, unmute it first.
    if (!el.paused && el.muted && !isMuted) {
      el.muted = false;
      setBrowserForcedMute(false);
      triggerFeedback("play");
      return;
    }`;
    
code = code.replace(togglePlayTarget, togglePlayReplace);

const recoverAudioTarget = `    const recoverAudio = () => {
      const el = videoRef.current;
      if (el && el.muted && !isMuted) {
        el.muted = false;
      }
    };`;
const recoverAudioReplace = `    const recoverAudio = () => {
      const el = videoRef.current;
      if (el && el.muted && !isMuted) {
        el.muted = false;
        setBrowserForcedMute(false);
      }
    };`;
code = code.replace(recoverAudioTarget, recoverAudioReplace);

fs.writeFileSync('src/components/VideoFeedCard.tsx', code, 'utf-8');
console.log("Updated VideoFeedCard.tsx with browserForcedMute state");
