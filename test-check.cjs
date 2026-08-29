const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

const regex = /else if \(type === 'video'\) \{([\s\S]*?)\}/;
const match = server.match(regex);
if (match) {
  console.log(match[0].substring(0, 500));
}
