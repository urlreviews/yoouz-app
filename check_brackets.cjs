const fs = require('fs');
const code = fs.readFileSync('server.ts', 'utf8');

const lines = code.split('\n');
let depth = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') depth++;
    if (line[j] === '}') depth--;
  }
  if (depth < 0) {
    console.log("Negative depth at line", i + 1);
    break;
  }
}
console.log("Final depth:", depth);
