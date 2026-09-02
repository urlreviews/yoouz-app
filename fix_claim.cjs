const fs = require('fs');
let c = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');

c = c.replace(
    /setIsClaiming\(false\);\s*\}\}\>\s*\n/g,
    'setIsClaiming(false);\n        }} />\n\n'
);

fs.writeFileSync('src/components/CopoBusinessDashboardView.tsx', c, 'utf8');
