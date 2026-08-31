const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.get\("\/api\/admin\/clean-users"[\s\S]*?return res\.json\(\{ error: e\.message \}\);\n    \}\n  \}\);\n\n  app\.post\("\/api\/auth\/update-profile"/;
const replacement = `app.post("/api/auth/update-profile"`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
console.log("Reverted clean endpoint");
