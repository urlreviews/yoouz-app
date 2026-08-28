const fs = require('fs');
const code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');

// We want to parse the JSX of CopoBusinessDashboardView.tsx.
// Let's tokenise it simply by looking at tags, curly braces, and parentheses.
// A simpler way: let's look at each tab block one by one and check if they are balanced.

const tabs = [
  { name: 'overview', start: "{activeTab === 'overview' && (" },
  { name: 'reviews', start: "{activeTab === 'reviews' && (" },
  { name: 'inbox', start: "{activeTab === 'inbox' && (" },
  { name: 'followers', start: "{activeTab === 'followers' && (" },
  { name: 'embed', start: "{activeTab === 'embed' && (" },
  { name: 'qr_invites', start: "{activeTab === 'qr_invites' && (" },
  { name: 'cta', start: "{activeTab === 'cta' && (" },
  { name: 'profile', start: "{activeTab === 'profile' && (" },
  { name: 'billing', start: "{activeTab === 'billing' && (" }
];

for (let i = 0; i < tabs.length; i++) {
  const currentTab = tabs[i];
  const nextTab = tabs[i + 1];
  
  const startIdx = code.indexOf(currentTab.start);
  if (startIdx === -1) {
    console.log(`Tab ${currentTab.name} not found!`);
    continue;
  }
  
  const endIdx = nextTab ? code.indexOf(nextTab.start) : code.indexOf('</div>\n      {/* Video Playback Modal (No Fullscreen) */}');
  const tabCode = code.substring(startIdx, endIdx);
  
  // count curly braces, parentheses, and tag stack
  let braces = 0;
  let parens = 0;
  const tagStack = [];
  
  // We can tokenise the JSX naive style
  // To avoid getting confused by strings, let's strip strings first.
  let cleaned = tabCode;
  // strip template literals
  cleaned = cleaned.replace(/`[\s\S]*?`/g, '""');
  // strip double quoted strings
  cleaned = cleaned.replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, '""');
  // strip single quoted strings
  cleaned = cleaned.replace(/'[^'\\]*(?:\\.[^'\\]*)*'/g, "''");
  
  // Now scan for:
  // { or }
  // ( or )
  // tags: <[a-zA-Z0-9]+...>, </[a-zA-Z0-9]+>
  const regex = /(\{|\}|\(|\)|<\/?[a-zA-Z0-9]+(?:\s+[^>]*?)?\/?>)/g;
  let match;
  let mismatchedTag = false;
  
  while ((match = regex.exec(cleaned)) !== null) {
    const token = match[0];
    if (token === '{') {
      braces++;
    } else if (token === '}') {
      braces--;
    } else if (token === '(') {
      parens++;
    } else if (token === ')') {
      parens--;
    } else if (token.startsWith('</')) {
      const tagName = token.match(/<\/([a-zA-Z0-9]+)/)[1];
      if (['input', 'img', 'br', 'hr', 'path', 'svg', 'circle', 'textarea'].includes(tagName.toLowerCase())) continue;
      
      const top = tagStack.pop();
      if (top !== tagName) {
        console.log(`[${currentTab.name}] Mismatched close tag: expected </${top}> but found </${tagName}>. Full token: ${token.substring(0, 40)}`);
        mismatchedTag = true;
      }
    } else if (token.startsWith('<') && !token.endsWith('/>')) {
      const tagNameMatch = token.match(/<([a-zA-Z0-9]+)/);
      if (!tagNameMatch) continue;
      const tagName = tagNameMatch[1];
      if (['input', 'img', 'br', 'hr', 'path', 'svg', 'circle', 'textarea'].includes(tagName.toLowerCase())) continue;
      
      tagStack.push(tagName);
    }
  }
  
  console.log(`Tab [${currentTab.name}]: braces=${braces}, parens=${parens}, remainingTags=[${tagStack.join(', ')}]`);
}
