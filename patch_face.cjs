const fs = require('fs');
let content = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf8');

// Add isRecordingRef
content = content.replace(
  "const [isRecording, setIsRecording] = useState(false);",
  "const [isRecording, setIsRecording] = useState(false);\n  const isRecordingRef = useRef(false);"
);

// Keep it in sync
content = content.replace(
  "setIsRecording(true);",
  "setIsRecording(true); isRecordingRef.current = true;"
);
content = content.replace(
  /setIsRecording\(false\);/g,
  "setIsRecording(false); isRecordingRef.current = false;"
);

// Update startFaceDetectionLoop logic
content = content.replace(
  /if \(isRecording\) \{\n\s*if \(\!faceMissingSinceRef\.current\) \{\n\s*faceMissingSinceRef\.current = Date\.now\(\);\n\s*\} else if \(Date\.now\(\) - faceMissingSinceRef\.current > 3000\) \{\n\s*setFaceWarning\("Face not detected\. Please look into the front camera to keep your review authentic\."\);\n\s*\}\n\s*\} else \{/g,
  `if (isRecordingRef.current) {
            if (!faceMissingSinceRef.current) {
              faceMissingSinceRef.current = Date.now();
            } else if (Date.now() - faceMissingSinceRef.current > 3000) {
              setFaceWarning("Face not detected. Recording stopped automatically to ensure authenticity.");
              handleStopRecording();
              faceMissingSinceRef.current = null;
            }
          } else {`
);

// Need to pass handleStopRecording into the dependency array of useCallback? Wait, we can't because it's defined after. Or we can just use another ref for handleStopRecording. Or since it's just a ref, we can check how handleStopRecording is used.
fs.writeFileSync('src/components/CopoCreateModal.tsx', content);
