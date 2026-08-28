const fs = require('fs');
const code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');

const tab4Start = code.indexOf("{activeTab === 'qr_invites' && (");
const tab4End = code.indexOf("{/* TAB 5: VIDEO CALL-TO-ACTION (CTA) */}");
const tab4Code = code.substring(tab4Start, tab4End);

const tagRegex = /<\/?([a-zA-Z0-9]+)[^>]*>/g;
let match;

while ((match = tagRegex.exec(tab4Code)) !== null) {
  if (match[1] === 'textarea') {
    console.log("Found textarea:");
    console.log(JSON.stringify(match[0]));
    console.log("Ends with /> ?", match[0].endsWith('/>'));
  }
}
