const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/      \}\n        type,\n        title,/g, '      }\n      const svg = buildOgImageSvg({\n        type,\n        title,');

fs.writeFileSync('server.ts', code);
console.log("Fixed");
