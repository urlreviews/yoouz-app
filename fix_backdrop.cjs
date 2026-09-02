const fs = require('fs');
let c = fs.readFileSync('src/components/CopoCreatorDrawer.tsx', 'utf8');

c = c.replace(
    /onClick=\{\(\)\s*=>\s*\{\s*triggerHaptic\("light"\);\s*onClose\(\);\s*\}\}\>\s*\n\s*\<aside/g,
    'onClick={() => {\n          triggerHaptic("light");\n          onClose();\n        }} />\n\n      <aside'
);

fs.writeFileSync('src/components/CopoCreatorDrawer.tsx', c, 'utf8');
