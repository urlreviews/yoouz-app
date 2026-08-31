const fs = require('fs');
let code = fs.readFileSync('src/components/CountrySelector.tsx', 'utf8');
code = code.replace(/<input\s+type="text"\s+value=\{search\}/, '<input\n              type="text"\n              value={search}\n              autoComplete="new-password"\n              autoCorrect="off"\n              spellCheck={false}');
fs.writeFileSync('src/components/CountrySelector.tsx', code);
console.log("Patched CountrySelector.tsx");
