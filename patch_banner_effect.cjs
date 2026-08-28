const fs = require('fs');
const file = './src/components/CopoCreatorDrawer.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '      setEditBio(currentUser.bio || "");',
  '      setEditBio(currentUser.bio || "");\n      setEditBanner(currentUser.banner || "");'
);
fs.writeFileSync(file, content);
console.log("Patched CopoCreatorDrawer banner effect");
