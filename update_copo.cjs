const fs = require('fs');
let code = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf8');

code = code.replace(
  'uploadVideoToServerWithProgress',
  'uploadVideoResumableWithProgress'
);
code = code.replace(
  'uploadVideoToServerWithProgress(',
  'uploadVideoResumableWithProgress('
);

fs.writeFileSync('src/components/CopoCreateModal.tsx', code);
