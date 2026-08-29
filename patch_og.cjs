const fs = require('fs');

let index = fs.readFileSync('index.html', 'utf8');
index = index.replace(/api\/og-image\.png/g, 'og-banner.png');
fs.writeFileSync('index.html', index);

let server = fs.readFileSync('server.ts', 'utf8');
server = server.replace(/let imageUrl = \`\$\{baseUrl\}\/api\/og-image\.png\`;/g, 'let imageUrl = `${baseUrl}/og-banner.png`;');
fs.writeFileSync('server.ts', server);

console.log('Patched OG URLs');
