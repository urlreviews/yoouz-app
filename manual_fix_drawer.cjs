const fs = require('fs');
let c = fs.readFileSync('src/components/CopoCreatorDrawer.tsx', 'utf8');

c = c.replace(/onError=\{\(e\)\s*=>\s*\{\s*\n?\s*\(e\.currentTarget\s*as\s*HTMLImageElement\)\.src[^}]+\}\}\>\s*/g, (match) => match.replace('}}>', '}} />'));

fs.writeFileSync('src/components/CopoCreatorDrawer.tsx', c, 'utf8');
