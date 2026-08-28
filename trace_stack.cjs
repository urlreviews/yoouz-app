const fs = require('fs');
const code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');

const lines = code.split('\n');
const tab4Start = code.indexOf("{activeTab === 'qr_invites' && (");
const tab4End = code.indexOf("{/* TAB 5: VIDEO CALL-TO-ACTION (CTA) */}");

let inTab4 = false;
const stack = [];

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("{activeTab === 'qr_invites' && (")) {
    inTab4 = true;
  }
  if (lines[i].includes("{/* TAB 5: VIDEO CALL-TO-ACTION (CTA) */}")) {
    inTab4 = false;
  }
  
  if (inTab4) {
    const lineNum = i + 1;
    const line = lines[i];
    
    // Check tags on this line
    const regex = /(<\/?[a-zA-Z0-9]+(?:\s+[^>]*?)?\/?>)/g;
    let match;
    while ((match = regex.exec(line)) !== null) {
      const full = match[0];
      if (full.endsWith('/>')) continue;
      const isClose = full.startsWith('</');
      const tagNameMatch = full.match(/<\/?([a-zA-Z0-9]+)/);
      if (!tagNameMatch) continue;
      const tag = tagNameMatch[1];
      if (['input', 'img', 'br', 'hr', 'path', 'svg', 'circle', 'textarea'].includes(tag.toLowerCase())) continue;
      
      if (isClose) {
        if (stack.length === 0) {
          console.log(`L${lineNum}: UNEXPECTED CLOSE </${tag}>`);
        } else {
          const popped = stack.pop();
          if (popped !== tag) {
            console.log(`L${lineNum}: MISMATCH CLOSE: popped <${popped}> instead of <${tag}>`);
          }
        }
      } else {
        stack.push(tag);
      }
    }
  }
}

console.log("Final Stack in Tab 4:", stack);
