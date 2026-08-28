const fs = require('fs');
const code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');

const tsxCode = code.substring(code.indexOf("{activeTab === 'invites' && ("), code.indexOf("{/* TAB 5: VIDEO CALL-TO-ACTION (CTA) */}"));
console.log(tsxCode);
