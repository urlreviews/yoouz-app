const fs = require('fs');
let a = fs.readFileSync('./src/App.tsx', 'utf8');
a = a.replace(/        \?: string;\n/g, '');
fs.writeFileSync('./src/App.tsx', a);

console.log("Fixed final types 4");
