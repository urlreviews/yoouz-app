const fs = require('fs');
const file = './src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetFollow = `  const handleToggleFollow = (authorHandle: string) => {
    let newFollowState = true;
    
    setVideos((prev) => {`;
const replaceFollow = `  const handleToggleFollow = (authorHandle: string) => {
    if (!currentUser) {
      setAuthIntent('following');
      setIsAuthModalOpen(true);
      return;
    }
    let newFollowState = true;
    
    setVideos((prev) => {`;
content = content.replace(targetFollow, replaceFollow);

fs.writeFileSync(file, content);
console.log("Patched App.tsx for follow auth");
