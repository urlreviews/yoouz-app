const fs = require('fs');
const code = fs.readFileSync('server.ts', 'utf8');

const lines = code.split('\n');
let depth = 0;
let lastOpen = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') {
      depth++;
      lastOpen.push({line: i + 1, text: line});
    }
    if (line[j] === '}') {
      depth--;
      lastOpen.pop();
    }
  }
}
console.log("Unclosed blocks:");
lastOpen.forEach(b => console.log(`Line ${b.line}: ${b.text}`));
