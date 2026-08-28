const fs = require('fs');
let content = fs.readFileSync('src/components/CopoPlaceDrawer.tsx', 'utf-8');

// 1. Remove `|| place.isSavedToProfile` to fix the button toggling
content = content.replace(/isSaved \|\| place\.isSavedToProfile/g, 'isSaved');
content = content.replace(/isSaved \|\| place\.isSavedToProfile/g, 'isSaved'); // Just in case, regex /g does all

// 2. Remove the Review List Grid
const gridStart = '{/* Review List Grid */}';
const gridEnd = '{/* Refined Status */}';
if (content.includes(gridStart) && content.includes(gridEnd)) {
  const startIndex = content.indexOf(gridStart);
  const endIndex = content.indexOf(gridEnd);
  content = content.substring(0, startIndex) + content.substring(endIndex);
}

fs.writeFileSync('src/components/CopoPlaceDrawer.tsx', content, 'utf-8');
console.log("Drawer fixed");
