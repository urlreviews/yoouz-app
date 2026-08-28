const fs = require('fs');
const code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');
const lines = code.split('\n');

let depth = 0;

for (let i = 2899; i < 3431; i++) {
  const line = lines[i];
  if (!line) continue;
  
  const opens = (line.match(/<div/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  depth += opens;
  depth -= closes;
}
console.log('Final depth at line 3430:', depth);
