const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/} else \s*const isVideoCard = type === 'video';/g, "}\nconst isVideoCard = type === 'video';");
fs.writeFileSync('server.ts', code);
