const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

server = server.replace(/Liberation Sans, Arial, sans-serif/g, "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif");
fs.writeFileSync('server.ts', server);
console.log("Fonts patched.");
