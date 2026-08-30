const fs = require('fs');
let code = fs.readFileSync('src/components/CopoMoreView.tsx', 'utf8');

code = code.replace(/import\s*\{[^}]*\}\s*from\s*["']\.\.\/lib\/firebase["'];?\n/g, '');

code = code.replace(/if\s*\(db\)\s*\{[\s\S]*?\} catch \(fErr\) \{\}\n\s*\}/g, `// db removed`);

fs.writeFileSync('src/components/CopoMoreView.tsx', code);
