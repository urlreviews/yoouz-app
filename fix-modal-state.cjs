const fs = require('fs');
let content = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf8');
content = content.replace('setHasRecordedVideo(false);', '');
fs.writeFileSync('src/components/CopoCreateModal.tsx', content);
