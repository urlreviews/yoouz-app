const fs = require('fs');
const file = './src/components/CopoCreatorDrawer.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetSave = `      onUpdateProfile({
        name: cleanName,
        bio: editBio.trim(),
        avatar: editAvatar || currentUser?.avatar,
        location: combinedLocation
      });`;
const replaceSave = `      onUpdateProfile({
        name: cleanName,
        bio: editBio.trim(),
        avatar: editAvatar || currentUser?.avatar,
        banner: editBanner || currentUser?.banner,
        location: combinedLocation
      });`;
content = content.replace(targetSave, replaceSave);
fs.writeFileSync(file, content);
console.log("Patched save profile banner");
