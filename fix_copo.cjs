const fs = require('fs');
let code = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf8');

code = code.replace(
  'if (result && result.url) {',
  'if (result && result.downloadUrl) {'
);
code = code.replace(
  'uploadedPublicUrl = result.url;',
  'uploadedPublicUrl = result.downloadUrl;'
);

fs.writeFileSync('src/components/CopoCreateModal.tsx', code);
