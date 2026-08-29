const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Find the isVideoCard block that has my SVG logic
const regex = /\s*const isVideoCard = type === 'video';[\s\S]*?(?=const isPlaceCard = type === 'place';)/;
const match = code.match(regex);

if (match) {
  let block = match[0];
  code = code.replace(block, '\n'); // remove it from the top
  // Insert it right before `if (isPlaceCard) {` which is after renderVideoPlayerMockup
  code = code.replace("if (isPlaceCard) {", block + "\n    if (isPlaceCard) {");
  fs.writeFileSync('server.ts', code);
  console.log("Moved successfully.");
} else {
  console.log("Not found.");
}

