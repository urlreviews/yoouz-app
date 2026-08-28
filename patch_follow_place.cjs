const fs = require('fs');
const file = './src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetFollowPlace = `  const handleToggleFollowPlace = (placeId: string) => {
    let newFollowState = true;
    setPlaces((prev) => {`;
const replaceFollowPlace = `  const handleToggleFollowPlace = (placeId: string) => {
    if (!currentUser) {
      setAuthIntent('following');
      setIsAuthModalOpen(true);
      return;
    }
    let newFollowState = true;
    setPlaces((prev) => {`;

content = content.replace(targetFollowPlace, replaceFollowPlace);
fs.writeFileSync(file, content);
console.log("Patched App.tsx for follow place auth");
