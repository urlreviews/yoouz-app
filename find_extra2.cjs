const fs = require('fs');
const code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');

const lines = code.split('\n');
let inTab4 = false;

let depth = 0;
let minDepth = 999;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("{activeTab === 'qr_invites' && (")) {
    inTab4 = true;
    depth = 0;
  }
  if (lines[i].includes("{/* TAB 5: VIDEO CALL-TO-ACTION (CTA) */}")) break;
  
  if (inTab4) {
    // Only count <div> that are NOT self-closing
    const opens = [...lines[i].matchAll(/<div(?![^>]*\/>)[^>]*>/g)].length;
    const closes = (lines[i].match(/<\/div>/g) || []).length;
    depth += opens;
    depth -= closes;
    if (depth <= 0 && i > 2901) {
      console.log(`L${i+1} D:${depth} - ${lines[i].trim()}`);
    }
  }
}
