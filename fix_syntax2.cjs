const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/return res\.send\(blank\);\n         \}\n      \}\n      \}\n      const svg = buildOgImageSvg/g, 'return res.send(blank);\n         }\n      }\n      const svg = buildOgImageSvg');

code = code.replace(/return res\.send\(blank\);\n         \}\n      \}\n      const svg = buildOgImageSvg/g, 'return res.send(blank);\n         }\n      const svg = buildOgImageSvg');

fs.writeFileSync('server.ts', code);
console.log("Done");
