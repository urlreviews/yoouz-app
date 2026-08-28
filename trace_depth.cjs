const fs = require('fs');
const code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');

const lines = code.split('\n');
let inTab4 = false;

let depth = 0;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("{activeTab === 'qr_invites' && (")) {
    inTab4 = true;
    depth = 0;
  }
  if (lines[i].includes("{/* TAB 5: VIDEO CALL-TO-ACTION (CTA) */}")) break;
  
  if (inTab4) {
    const opens = (lines[i].match(/<div/g) || []).length;
    const closes = (lines[i].match(/<\/div>/g) || []).length;
    depth += opens;
    depth -= closes;
    if (i > 3360 && i < 3440) {
      console.log(`L${i+1} D:${depth} - ${lines[i].trim()}`);
    }
  }
}
