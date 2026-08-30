const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/if \(!isProduction\) \{/g, "if (process.env.NODE_ENV !== 'production') {");
fs.writeFileSync('server.ts', code);
console.log("Fixed isProduction");
