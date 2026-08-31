const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  /return Array\.from\(map\.values\(\)\)\.filter\(\(u: any\) => u\.name && u\.name !== "Registered User" && u\.name !== "Reviewer" && u\.email && !u\.email\.includes\("undefined"\)\);/g,
  'return Array.from(map.values());'
);
fs.writeFileSync('src/App.tsx', code);
console.log("Patched!");
