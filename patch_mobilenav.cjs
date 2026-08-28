const fs = require('fs');
const file = './src/components/CopoMobileNavDrawer.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '{currentUser.email || `@${currentUser.handle || "user"}`}',
  '{currentUser.email || ""}'
);

fs.writeFileSync(file, content);
