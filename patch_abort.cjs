const fs = require('fs');
let content = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf8');

// 1. Add `isRecordingAbortedRef`
content = content.replace(
  "const isRecordingRef = useRef(false);",
  "const isRecordingRef = useRef(false);\n  const isRecordingAbortedRef = useRef(false);"
);

// 2. Set aborted true on face missing
content = content.replace(
  /if \(Date\.now\(\) - faceMissingSinceRef\.current > 3000\) \{\n\s*setFaceWarning\("Face not detected\. Recording stopped automatically to ensure authenticity\."\);\n\s*handleStopRecording\(\);\n\s*faceMissingSinceRef\.current = null;\n\s*\}/,
  `if (Date.now() - faceMissingSinceRef.current > 3000) {
              setFaceWarning("Face not detected. Recording stopped automatically to ensure authenticity. Please try again.");
              isRecordingAbortedRef.current = true;
              handleStopRecording();
              faceMissingSinceRef.current = null;
            }`
);

// 3. Check aborted flag in mediaRecorder.onstop
const onstopReplacement = `
      mediaRecorder.onstop = () => {
        if (isRecordingAbortedRef.current) {
          chunksRef.current = [];
          setErrorMessage("Recording was discarded because a face was not clearly visible in the camera. Please try again.");
          isRecordingAbortedRef.current = false;
          setIsRecording(false);
          isRecordingRef.current = false;
          setRecordingTime(0);
          return;
        }
        if (chunksRef.current.length === 0) {
`;

content = content.replace(
  /mediaRecorder\.onstop = \(\) => \{\n\s*if \(chunksRef\.current\.length === 0\) \{/,
  onstopReplacement.trim()
);

// 4. Remove Start without voice button
content = content.replace(
  /\s*\/\*\*\s*Manual Bypass Button\s*\*\/\s*<button[\s\S]*?Start without voice\s*<\/button>/,
  ""
);

fs.writeFileSync('src/components/CopoCreateModal.tsx', content);
