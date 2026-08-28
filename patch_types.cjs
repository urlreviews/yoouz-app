const fs = require('fs');
const file = './src/types.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('    bio?: string;', '    bio?: string;\n    banner?: string;');
fs.writeFileSync(file, content);
console.log("Patched types.ts");
