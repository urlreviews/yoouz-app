const fs = require('fs');
let code = fs.readFileSync('src/components/CopoGoogleAuthModal.tsx', 'utf8');

const importRegex = /import \{ (.*) \} from 'lucide-react';/;
if (importRegex.test(code)) {
    code = code.replace(importRegex, (match, p1) => {
        if (!p1.includes('User')) {
            return `import { ${p1}, User } from 'lucide-react';`;
        }
        return match;
    });
}

const renderRegex = /\{previewLetter\}\n\s*<\/div>/;
const renderReplacement = `{previewLetter ? previewLetter : <User className="w-6 h-6 text-zinc-400" />}\n          </div>`;

code = code.replace(renderRegex, renderReplacement);

fs.writeFileSync('src/components/CopoGoogleAuthModal.tsx', code);
console.log("Patched CopoGoogleAuthModal 2!");
