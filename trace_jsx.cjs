const fs = require('fs');
const code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');
const lines = code.split('\n');

let tab4Start = -1;
let currentDepth = 0;
const stack = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes("{activeTab === 'invites' && (")) {
    tab4Start = i;
  }
  
  if (tab4Start !== -1 && i >= tab4Start) {
    const opens = [...line.matchAll(/<([a-zA-Z]+)(?![^>]*\/>)[^>]*>/g)];
    const closes = [...line.matchAll(/<\/([a-zA-Z]+)>/g)];
    const selfCloses = [...line.matchAll(/<([a-zA-Z]+)[^>]*\/>/g)];
    
    for (const open of opens) {
      if (open[1] !== 'input' && open[1] !== 'img' && open[1] !== 'br' && open[1] !== 'hr') {
        stack.push(open[1]);
      }
    }
    
    for (const close of closes) {
      if (stack.length > 0 && stack[stack.length - 1] === close[1]) {
        stack.pop();
      } else {
        // console.log(`Mismatch at line ${i+1}: expected ${stack[stack.length-1]} but got ${close[1]}`);
        stack.pop();
      }
    }
    
    if (i > 3420 && i < 3435) {
      console.log(`Line ${i+1}: ${line.trim()} | Stack: ${stack.join(', ')}`);
    }
    
    if (line.includes(')}') && stack.length === 0 && i > tab4Start + 10) {
      console.log(`Finished at line ${i+1}`);
      break;
    }
  }
}
