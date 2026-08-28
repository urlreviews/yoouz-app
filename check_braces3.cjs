const fs = require('fs');
const code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');

const tab4Start = code.indexOf("{activeTab === 'invites' && (");
const tab4End = code.indexOf("{/* TAB 5: VIDEO CALL-TO-ACTION (CTA) */}");
const tab4Code = code.substring(tab4Start, tab4End);

console.log("Last 50 chars:", JSON.stringify(tab4Code.substring(tab4Code.length - 50)));
