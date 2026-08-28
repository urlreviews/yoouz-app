const fs = require('fs');
let content = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf8');

content = content.replace(/setIsRecording\(true\); isRecordingRef\.current = true; isRecordingRef\.current = true;/g, "setIsRecording(true); isRecordingRef.current = true;");
content = content.replace(/setIsRecording\(false\); isRecordingRef\.current = false; isRecordingRef\.current = false;/g, "setIsRecording(false); isRecordingRef.current = false;");

fs.writeFileSync('src/components/CopoCreateModal.tsx', content);
