const fs = require('fs');
let content = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf8');

content = content.replace(
  "if (mediaRecorderRef.current && isRecording) {",
  "if (mediaRecorderRef.current && isRecordingRef.current) {"
);

fs.writeFileSync('src/components/CopoCreateModal.tsx', content);
