const fs = require('fs');
let c = fs.readFileSync('src/components/CopoCreatorDrawer.tsx', 'utf8');

c = c.replace(/onError=\{\(e\)\s*=>\s*\{\s*\(e\.currentTarget\s*as\s*HTMLImageElement\)\.src[^}]+\}\}\>\s*<div/g, 
(match) => {
    return match.replace('}}>', '}} />').replace('/> \n <div', '/> <div').replace('/> <div', '/>\n<div');
});

fs.writeFileSync('src/components/CopoCreatorDrawer.tsx', c, 'utf8');
