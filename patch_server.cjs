const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Remove /og-banner.png from the dynamic handler so it serves statically!
code = code.replace(/app\.get\(\['\/api\/og-image', '\/api\/og-image\.png', '\/og-banner\.png'\],/g, "app.get(['/api/og-image', '/api/og-image.png'],");

fs.writeFileSync('server.ts', code);
console.log('Patched og-banner routing');
