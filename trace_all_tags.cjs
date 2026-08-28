const fs = require('fs');
const code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');

const tab4Start = code.indexOf("{activeTab === 'qr_invites' && (");
const tab4End = code.indexOf("{/* TAB 5: VIDEO CALL-TO-ACTION (CTA) */}");
const tab4Code = code.substring(tab4Start, tab4End);

const stack = [];
const selfClosing = new Set(['input', 'img', 'br', 'hr', 'path', 'svg', 'circle', 'textarea']); 

// Match ALL tags exactly
// <Tag ... > or </Tag>
// Wait, we need to handle attributes with > in them!
// A proper JSX parser is hard.
const rx = /<\/?([a-zA-Z0-9]+)(\s+[^>]*?)?\/?>/g;
let match;
while ((match = rx.exec(tab4Code)) !== null) {
  const full = match[0];
  const tag = match[1];
  
  if (selfClosing.has(tag) || full.endsWith('/>')) {
    continue;
  }
  
  if (full.startsWith('</')) {
    if (stack.length > 0 && stack[stack.length - 1] === tag) {
      stack.pop();
    } else {
      console.log(`Mismatch: found </${tag}> but stack top is <${stack[stack.length - 1]}>`);
      stack.pop();
    }
  } else {
    stack.push(tag);
  }
}

console.log("Remaining stack:");
console.log(stack);
