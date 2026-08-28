const fs = require('fs');
const code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');
const lines = code.split('\n');

let tab4Start = -1;
const stack = [];
const selfClosingTags = new Set(['input', 'img', 'br', 'hr', 'path', 'svg', 'circle', 'textarea']); // textarea might not be self-closing, wait!

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("{activeTab === 'qr_invites' && (")) {
    tab4Start = i;
  }
  
  if (tab4Start !== -1 && i >= tab4Start) {
    const line = lines[i];
    
    // Naive tag extraction
    // <Tag ...> or </Tag>
    // but ignore self-closing <Tag ... />
    
    const tagRegex = /<\/?[a-zA-Z0-9]+[^>]*>/g;
    let match;
    while ((match = tagRegex.exec(line)) !== null) {
      const tagStr = match[0];
      if (tagStr.endsWith('/>')) continue; // self closing
      
      const isClose = tagStr.startsWith('</');
      const tagNameMatch = tagStr.match(/<\/?([a-zA-Z0-9]+)/);
      if (!tagNameMatch) continue;
      const tagName = tagNameMatch[1];
      
      if (['br', 'hr', 'img', 'input', 'path', 'circle', 'polyline', 'line'].includes(tagName)) continue;
      
      if (isClose) {
        if (stack.length === 0) {
          console.log(`L${i+1} ERROR: trying to close <${tagName}> but stack is empty`);
        } else if (stack[stack.length - 1] !== tagName) {
          console.log(`L${i+1} ERROR: trying to close <${tagName}> but top of stack is <${stack[stack.length - 1]}>`);
          // Let's just pop it anyway to see the cascade
          stack.pop();
        } else {
          stack.pop();
        }
      } else {
        stack.push(tagName);
      }
    }
    
    if (i > 3420 && i < 3430) {
       console.log(`L${i+1} STACK LENGTH: ${stack.length} | ${stack.slice(-5).join(', ')}`);
    }
    
    if (line.includes(')}') && stack.length === 0 && i > tab4Start + 5) {
      console.log(`Perfectly closed at L${i+1}`);
      break;
    }
  }
}
