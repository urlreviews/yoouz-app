const fs = require('fs');
const file = './src/components/CopoBusinessAuthLanding.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldStr = `<span>Continue</span>
                    <ArrowRight className="w-4 h-4" />`;
const newStr = `<span>Continue with Magic Link</span>
                    <ArrowRight className="w-4 h-4" />`;
                    
content = content.replace(oldStr, newStr);

fs.writeFileSync(file, content);
console.log('Patched');
