const fs = require('fs');
const file = './src/components/CopoBusinessDashboardView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/top-\\[72px\\]/g, 'top-[64px]');

fs.writeFileSync(file, content);
console.log('Patched top');
