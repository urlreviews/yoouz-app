const fs = require('fs');
const code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');

const lines = code.split('\n');
let inTab4 = false;

let b = 0, p = 0;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("{activeTab === 'qr_invites' && (")) inTab4 = true;
  if (lines[i].includes("{/* TAB 5: VIDEO CALL-TO-ACTION (CTA) */}")) break;
  
  if (inTab4) {
    for (let c of lines[i]) {
      if (c === '{') b++;
      if (c === '}') b--;
      if (c === '(') p++;
      if (c === ')') p--;
    }
    console.log(`L${i+1} B:${b} P:${p} - ${lines[i].trim()}`);
  }
}
