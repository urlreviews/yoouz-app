const fs = require('fs');

let c = fs.readFileSync('./src/components/CopoDiscoverView.tsx', 'utf8');
c = c.replace(/\/\/\/\/handle: string/g, 'handle: string');
c = c.replace(/\/\/handle: string/g, 'name: string');
c = c.replace(/\/\/handle/g, 'name');
fs.writeFileSync('./src/components/CopoDiscoverView.tsx', c);

let vc = fs.readFileSync('./src/components/VideoFeedCard.tsx', 'utf8');
vc = vc.replace(/\/\/handle:/g, 'name:');
vc = vc.replace(/\/\/handle/g, 'name');
fs.writeFileSync('./src/components/VideoFeedCard.tsx', vc);

console.log("Fixed syntax");
