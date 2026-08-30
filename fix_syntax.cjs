const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const badCode = `            if (thumbArg.startsWith('data:image')) {
               thumbArg = ""; // Prevent massive URLs
            }
            // removed
               // removed
               // removed
            }`;

const fixedCode = `            if (thumbArg.startsWith('data:image')) {
               thumbArg = ""; // Prevent massive URLs
            }`;

code = code.replace(badCode, fixedCode);
fs.writeFileSync('server.ts', code);
console.log("Fixed syntax error");
