const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /\s*const isVideoCard = type === 'video';[\s\S]*?(?=const isCreatorCard = type === 'creator';)/;
const match = code.match(regex);
if (match) {
  const block = match[0];
  code = code.replace(block, '\n');
  code = code.replace("const isCreatorCard = type === 'creator';", block + "\n    const isCreatorCard = type === 'creator';");
  fs.writeFileSync('server.ts', code);
  console.log("Moved block");
} else {
  console.log("Not found");
}
