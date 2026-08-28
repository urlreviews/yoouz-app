const fs = require('fs');
const code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');
const lines = code.split('\n');

for (let i = 3410; i < 3450; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
