const fs = require('fs');
let code = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf8');

// 1. Add currentUser to Props
code = code.replace(
  /onAddPlace\?: \(place: Place\) => void;\n}/,
  'onAddPlace?: (place: Place) => void;\n  currentUser?: { name: string; email: string; avatar: string } | null;\n}'
);

// 2. Destructure currentUser in component
code = code.replace(
  /export const CopoCreateModal: React\.FC<CopoCreateModalProps> = \(\{\n  isOpen,\n  onClose,\n  places,\n  preselectedPlace,\n  onPublishVideoReview,\n  onAddPlace\n}\) => \{/,
  'export const CopoCreateModal: React.FC<CopoCreateModalProps> = ({\n  isOpen,\n  onClose,\n  places,\n  preselectedPlace,\n  onPublishVideoReview,\n  onAddPlace,\n  currentUser\n}) => {'
);

// 3. Add blob state
code = code.replace(
  /const \[recordedVideoBlobUrl, setRecordedVideoBlobUrl\] = useState<string \| null>\(null\);/,
  'const [recordedVideoBlobUrl, setRecordedVideoBlobUrl] = useState<string | null>(null);\n  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);'
);

// 4. Set blob in onstop
code = code.replace(
  /const url = URL\.createObjectURL\(blob\);\n          setRecordedVideoBlobUrl\(url\);/,
  'const url = URL.createObjectURL(blob);\n          setRecordedVideoBlobUrl(url);\n          setRecordedBlob(blob);'
);

// 5. Clear blob on reset
code = code.replace(
  /setRecordedVideoBlobUrl\(null\);/g,
  'setRecordedVideoBlobUrl(null);\n      setRecordedBlob(null);'
);

fs.writeFileSync('src/components/CopoCreateModal.tsx', code);
