const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

const regex = /if \(isVideoCard\) \{([\s\S]*?)\} else if \(isPlaceCard\)/;
const match = server.match(regex);
if (match) {
  console.log("Matched video card block length:", match[1].length);
}
