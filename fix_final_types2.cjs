const fs = require('fs');

let a = fs.readFileSync('./src/App.tsx', 'utf8');
a = a.replace(/replyToName: string;/g, '');
a = a.replace(/\.replyToName/g, '');
a = a.replace(/replyToName/g, '');
fs.writeFileSync('./src/App.tsx', a);

let cd = fs.readFileSync('./src/components/CopoCommentsDrawer.tsx', 'utf8');
cd = cd.replace(/replyToName/g, '//');
fs.writeFileSync('./src/components/CopoCommentsDrawer.tsx', cd);

let d = fs.readFileSync('./src/components/CopoDiscoverView.tsx', 'utf8');
d = d.replace(/name: "\/\/name: "",/g, '');
d = d.replace(/name: author.name,\s*name: author.name/g, 'name: author.name');
d = d.replace(/name: currentUser.name,\s*name: currentUser.name/g, 'name: currentUser.name');
fs.writeFileSync('./src/components/CopoDiscoverView.tsx', d);

let v = fs.readFileSync('./src/components/VideoFeedCard.tsx', 'utf8');
v = v.replace(/name: "Local Expert",\s*name: "Local Expert"/g, 'name: "Local Expert"');
fs.writeFileSync('./src/components/VideoFeedCard.tsx', v);

console.log("Fixed final types 2");
