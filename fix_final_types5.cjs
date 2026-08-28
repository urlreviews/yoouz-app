const fs = require('fs');
let a = fs.readFileSync('./src/App.tsx', 'utf8');
a = a.replace(/.*\?: string;\n/g, (match) => {
    if (match.includes("?: string;")) {
        // Just completely clean it using explicit replace if it starts with space and ?
        return match.replace(/^\s*\?\:\s*string;.*\n/gm, '');
    }
    return match;
});
a = a.replace(/^\s*\?: string;\n/gm, '');
a = a.replace(/ \?: string;\n/gm, '');
fs.writeFileSync('./src/App.tsx', a);

console.log("Fixed final types 5");
