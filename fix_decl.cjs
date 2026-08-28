const fs = require('fs');
let content = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf8');

content = content.replace(
  "const [isRecording, setIsRecording] = useState(false);\n  const isRecordingRef = useRef(false);\n  const isRecordingRef = useRef(false);",
  "const [isRecording, setIsRecording] = useState(false);\n  const isRecordingRef = useRef(false);"
);

fs.writeFileSync('src/components/CopoCreateModal.tsx', content);
