const fs = require('fs');

let d = fs.readFileSync('./src/components/CopoDiscoverView.tsx', 'utf8');
d = d.replace(/name: `@\${rawHandle}`,/g, '');
d = d.replace(/name: `\${rawName.toLowerCase().replace\(\/\[\^a-z0-9_\]\/g, ""\)}`/g, '');
d = d.replace(/name: currentUser.name \|\| currentUser.email\?\.split\("@"\)\[0\] \|\| currentUser.name.toLowerCase\(\).replace\(\/\[\^a-z0-9_\]\/g, ""\),/g, '');
d = d.replace(/name: currentUser.name/g, 'name: currentUser.name');
fs.writeFileSync('./src/components/CopoDiscoverView.tsx', d);

let v = fs.readFileSync('./src/components/VideoFeedCard.tsx', 'utf8');
v = v.replace(/name: "reviewer",/g, '');
v = v.replace(/name: "Local Expert",\s*name: "Local Expert"/g, 'name: "Local Expert"');
fs.writeFileSync('./src/components/VideoFeedCard.tsx', v);

console.log("Fixed final types 3");
