const fs = require('fs');
let content = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf-8');

// Add states
content = content.replace(
  /const \[recordingTime, setRecordingTime\] = useState\(0\);/,
  `const [recordingTime, setRecordingTime] = useState(0);
  const [smartAutoStart, setSmartAutoStart] = useState(true);
  const [isWaitingForVoice, setIsWaitingForVoice] = useState(false);
  const audioContextRef = useRef<any>(null);
  const analyserRef = useRef<any>(null);`
);

// Update countdown trigger to route through VAD check
const countdownBlock = `  const handleTriggerCountdown = () => {
    setErrorMessage(null);
    setCountdown(3);
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          if (smartAutoStart) {
            initiateVoiceWait();
          } else {
            startActualRecording();
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };`;

content = content.replace(
  /  const handleTriggerCountdown = \(\) => {[\s\S]*?  };/,
  countdownBlock
);

// Add VAD logic
const vadLogic = `  const initiateVoiceWait = () => {
    if (!videoRef.current || !videoRef.current.srcObject) {
      startActualRecording();
      return;
    }
    
    setIsWaitingForVoice(true);
    const stream = videoRef.current.srcObject as MediaStream;
    
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        setIsWaitingForVoice(false);
        startActualRecording();
        return;
      }
      
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;
      
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let isStarted = false;
      
      const checkVolume = () => {
        if (isStarted || !analyserRef.current) return;
        
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        let avg = sum / dataArray.length;
        
        // Threshold for human speaking voice (approximate)
        if (avg > 15) {
          isStarted = true;
          setIsWaitingForVoice(false);
          startActualRecording();
          
          if (audioCtx.state === 'running') {
            audioCtx.close().catch(() => {});
          }
          audioContextRef.current = null;
          analyserRef.current = null;
        } else {
          requestAnimationFrame(checkVolume);
        }
      };
      
      checkVolume();
      
    } catch (e) {
      setIsWaitingForVoice(false);
      startActualRecording();
    }
  };`;

content = content.replace(
  /  const startActualRecording = \(\) => {/,
  vadLogic + '\n\n  const startActualRecording = () => {'
);

// Stop camera also cleans up VAD
content = content.replace(
  /    if \(countdownTimerRef.current\) clearInterval\(countdownTimerRef.current\);/,
  `    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (audioContextRef.current && audioContextRef.current.state === 'running') {
      audioContextRef.current.close().catch(() => {});
    }
    setIsWaitingForVoice(false);`
);

// Add smart Auto Start toggle button UI
const uiToggle = `                {cameraActive && !isRecording && !recordedVideoUrl && countdown === null && (
                  <div className="absolute bottom-24 left-0 right-0 flex justify-center z-20">
                    <button
                      onClick={() => setSmartAutoStart(!smartAutoStart)}
                      className="px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-bold flex items-center gap-2 hover:bg-black/80 transition-colors"
                    >
                      <div className={\`w-2 h-2 rounded-full \${smartAutoStart ? "bg-emerald-400" : "bg-zinc-500"}\`}></div>
                      Smart Auto-Start on Voice
                    </button>
                  </div>
                )}
                
                {cameraActive && !isRecording && !recordedVideoUrl && countdown === null && (`;

content = content.replace(
  /{cameraActive && !isRecording && !recordedVideoUrl && countdown === null && \(/,
  uiToggle
);

content = content.replace(
  /                  <\/div>\n                \)}\n\n                {isRecording && \(/,
  `                  </div>
                )}

                {isWaitingForVoice && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-white">
                    <div className="w-24 h-24 rounded-full bg-black/50 border border-emerald-400/50 flex flex-col items-center justify-center text-emerald-400 mb-4 animate-pulse">
                      <Volume2 className="w-10 h-10 mb-1" />
                    </div>
                    <div className="text-xl font-bold font-display tracking-tight text-white mb-2">Waiting for you to speak...</div>
                    <div className="text-sm text-zinc-300">Recording will start instantly</div>
                    <button 
                       onClick={() => {
                         setIsWaitingForVoice(false);
                         startActualRecording();
                       }}
                       className="mt-6 px-4 py-2 rounded-full bg-white/10 text-white text-sm cursor-pointer z-50 pointer-events-auto hover:bg-white/20"
                    >
                      Start Manually
                    </button>
                  </div>
                )}

                {isRecording && (`
);

fs.writeFileSync('src/components/CopoCreateModal.tsx', content, 'utf-8');
console.log("Updated VAD UI");
