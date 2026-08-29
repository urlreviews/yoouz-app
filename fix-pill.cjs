const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace the place pill icon position
code = code.replace(
  'transform="translate(4, 4) scale(0.9)"',
  'transform="translate(10, 10)"'
);

// We should also replace the stars svg slightly to ensure they look perfect.
code = code.replace(
  'transform="translate(${i * 24}, 0) scale(0.9)"',
  'transform="translate(${i * 28}, 0)"'
);

fs.writeFileSync('server.ts', code);
console.log("Fixed pill and stars.");
