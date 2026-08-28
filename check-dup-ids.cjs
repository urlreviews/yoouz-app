const fs = require('fs');
let code = fs.readFileSync('src/data/mockData.ts', 'utf8');

const idRegex = /id:\s*["']([^"']+)["']/g;
let match;
const ids = {};
const duplicates = [];

while ((match = idRegex.exec(code)) !== null) {
  const id = match[1];
  if (ids[id]) {
    ids[id]++;
    duplicates.push(id);
  } else {
    ids[id] = 1;
  }
}

console.log("Duplicate IDs in mockData.ts:", duplicates);
