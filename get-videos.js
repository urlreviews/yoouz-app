const fs = require('fs');
console.log(fs.readFileSync('server.ts', 'utf8').includes('firebase-admin'));
