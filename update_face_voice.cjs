const fs = require('fs');
let content = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf-8');

// 1. Add import
if (!content.includes('import * as faceapi')) {
  content = content.replace(
    /import React, \{ useState, useRef, useEffect \} from "react";/,
    `import React, { useState, useRef, useEffect } from "react";\nimport * as faceapi from "@vladmandic/face-api";`
  );
}

// 2. Add Face API states
if (!content.includes('isFaceModelLoaded')) {
  content = content.replace(
    /  const \[smartAutoStart, setSmartAutoStart\] = useState\(true\);/,
    `  const [isFaceModelLoaded, setIsFaceModelLoaded] = useState(false);
  const [faceWarning, setFaceWarning] = useState<string | null>(null);
  const [faceMissingSince, setFaceMissingSince] = useState<number | null>(null);
  const faceIntervalRef = useRef<any>(null);`
  );
}

// 3. Update handleTriggerCountdown
const countdownBlock = `  const handleTriggerCountdown = () => {
    setErrorMessage(null);
    setCountdown(3);
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          initiateVoiceWait();
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

// 4. Update initiateVoiceWait (remove manual start fallback from UI)
const uiToggle = /{cameraActive && !isRecording && !recordedVideoUrl && countdown === null && \([\s\S]*?Smart Auto-Start on Voice[\s\S]*?<\/button>\s*<\/div>\s*\)\}/;
content = content.replace(uiToggle, "");

const manualStartBtn = /<button[\s\S]*?onClick={\(\) => {\s*setIsWaitingForVoice\(false\);\s*startActualRecording\(\);\s*}}[\s\S]*?Start Manually\s*<\/button>/;
content = content.replace(manualStartBtn, "");

// 5. Update handleStopRecording to accept isFailure
content = content.replace(
  /  const handleStopRecording = \(\) => {/,
  `  const handleStopRecording = (isFailure: boolean | any = false) => {`
);

content = content.replace(
  /          setRecordedVideoUrl\(url\);\n        }/,
  `          setRecordedVideoUrl(url);
        }
        
        if (isFailure === true) {
          setRecordedVideoBlob(null);
          setRecordedVideoUrl(null);
          setErrorMessage("Recording cancelled: Face not detected. You must keep your face in the frame.");
        }`
);

// 6. Setup Face API load effect & detection loop
const effectsBlock = `  // Load Face API models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/');
        setIsFaceModelLoaded(true);
      } catch (e) {
        console.error("Face model load error:", e);
      }
    };
    loadModels();
  }, []);

  // Face detection loop during recording
  useEffect(() => {
    if (!isRecording || !cameraActive || !isFaceModelLoaded) {
      if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
      setFaceWarning(null);
      setFaceMissingSince(null);
      return;
    }

    faceIntervalRef.current = setInterval(async () => {
      if (videoRef.current && !videoRef.current.paused) {
        try {
          const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.3 }));
          if (detection) {
            setFaceMissingSince(null);
            setFaceWarning(null);
          } else {
            setFaceMissingSince(prev => {
              const now = Date.now();
              const since = prev || now;
              const missingFor = now - since;
              
              if (missingFor > 5000) {
                // Fail recording
                clearInterval(faceIntervalRef.current);
                handleStopRecording(true); // Pass failure flag
              } else {
                setFaceWarning(\`⚠️ Face not detected! Recording will cancel in \${Math.ceil((5000 - missingFor) / 1000)}s\`);
              }
              return since;
            });
          }
        } catch (e) {
          // ignore transient frame errors
        }
      }
    }, 500);

    return () => {
      if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
    };
  }, [isRecording, cameraActive, isFaceModelLoaded]);\n\n`;

if (!content.includes('loadModels')) {
  // Insert effects block after the first useEffect
  content = content.replace(
    /  useEffect\(\(\) => {\n    if \(isOpen\)/,
    effectsBlock + '  useEffect(() => {\n    if (isOpen)'
  );
}

// 7. Render faceWarning overlay during recording
const faceWarningUI = `                {faceWarning && (
                  <div className="absolute inset-0 bg-red-900/40 backdrop-blur-sm z-40 flex flex-col items-center justify-center text-white pointer-events-none p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mb-3 animate-pulse" />
                    <div className="text-xl font-bold">{faceWarning}</div>
                  </div>
                )}`;

content = content.replace(
  /{isRecording && \(/,
  `${faceWarningUI}\n\n                {isRecording && (`
);

fs.writeFileSync('src/components/CopoCreateModal.tsx', content, 'utf-8');
console.log("Updated CopoCreateModal.tsx with Face API logic");
