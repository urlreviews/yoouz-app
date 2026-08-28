const fs = require('fs');
let code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');

const regex = /<\/div>\s*<\/div>\s*<\/div>\s*\{\/\* Dispatch Action Buttons \*\/\}/g;
const replace = '<\/div>\n                    {/* Dispatch Action Buttons */}';

code = code.replace(regex, replace);
fs.writeFileSync('src/components/CopoBusinessDashboardView.tsx', code);
