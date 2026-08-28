const fs = require('fs');
const code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');

const tab4Start = code.indexOf("{activeTab === 'invites' && (");
const tab4End = code.indexOf("{/* TAB 5: VIDEO CALL-TO-ACTION (CTA) */}");
const tab4Code = code.substring(tab4Start, tab4End);

let braceDepth = 0;
for (let i = 0; i < tab4Code.length; i++) {
  if (tab4Code[i] === '{') braceDepth++;
  if (tab4Code[i] === '}') braceDepth--;
}

console.log("Brace balance in Tab 4:", braceDepth);
