const fs = require('fs');
let c = fs.readFileSync('src/components/CopoCreatorDrawer.tsx', 'utf8');

c = c.replace(
    /setEditState\(""\);\s*\}\}\>\s*\{editCountry/g,
    'setEditState("");\n                  }} />\n\n                {editCountry'
);

fs.writeFileSync('src/components/CopoCreatorDrawer.tsx', c, 'utf8');
