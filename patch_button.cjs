const fs = require('fs');
let content = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf8');

const target = `{/* Manual Bypass Button */}`;
const startIndex = content.indexOf(target);
if (startIndex !== -1) {
  const endIndex = content.indexOf("</button>", startIndex) + "</button>".length;
  content = content.substring(0, startIndex) + content.substring(endIndex);
  fs.writeFileSync('src/components/CopoCreateModal.tsx', content);
}
