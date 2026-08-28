const fs = require('fs');
const file = './src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'const authorDisplay = author.name || `@${cleanHandle}`;',
  'const authorDisplay = author.name || cleanHandle;'
);

fs.writeFileSync(file, content);
