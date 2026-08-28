const fs = require('fs');
let content = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf-8');

const effectsBlock = `
  // Load Face API models
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
  }, [isRecording, cameraActive, isFaceModelLoaded]);
`;

// Insert after the first useEffect
content = content.replace(
  /  useEffect\(\(\) => \{\n    if \(isOpen\)/,
  effectsBlock + '\n  useEffect(() => {\n    if (isOpen)'
);

// Add isFailure flag to handleStopRecording
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

// Render the face warning UI during recording
const faceWarningUI = `                {faceWarning && (
                  <div className="absolute inset-0 bg-red-900/40 backdrop-blur-sm z-40 flex flex-col items-center justify-center text-white pointer-events-none p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mb-3 animate-pulse" />
                    <div className="text-xl font-bold">{faceWarning}</div>
                  </div>
                )}`;

// We need to carefully find {isRecording && (
content = content.replace(
  /{isRecording && \(/,
  `${faceWarningUI}\n\n                {isRecording && (`
);

fs.writeFileSync('src/components/CopoCreateModal.tsx', content, 'utf-8');
console.log("Appended effects block");
