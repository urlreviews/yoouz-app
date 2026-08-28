const fs = require('fs');
let content = fs.readFileSync('src/components/GlobalUploadToast.tsx', 'utf8');
content = content.replace("style={{ width: \\`\\${up.percent}%\\` }}", "style={{ width: `${up.percent}%` }}");
fs.writeFileSync('src/components/GlobalUploadToast.tsx', content);
