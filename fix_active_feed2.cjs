const fs = require('fs');
const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const regexPlace = /\/\/ Priority 1: Business\/Place context \(if viewing a specific place\)[\s\S]*?isPlaceReviewMatch\(v, drawerPlace\.name\)[\s\S]*?\);[\s\S]*?\}/;
content = content.replace(regexPlace, '');

const regexCreator = /\/\/ Priority 2: Creator context[\s\S]*?if \(isCreatorView && selectedAuthorForDrawer\) \{[\s\S]*?return visibleVideos\.filter\(v => isAuthorMatch\(v, selectedAuthorForDrawer\)\);[\s\S]*?\}/;
content = content.replace(regexCreator, '');

fs.writeFileSync(path, content, 'utf8');
