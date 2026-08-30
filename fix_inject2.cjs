const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace('\\n  async function resolveMetadataForRequest(req: any) {', '\n  async function resolveMetadataForRequest(req: any) {');

fs.writeFileSync('server.ts', code);
console.log("Fixed newline");
