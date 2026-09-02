const fs = require('fs');
const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const regexToRemove = /    if \(isPlaceView && drawerPlace\?\.id\) \{[\s\S]*?if \(isCreatorView && selectedAuthorForDrawer\) \{[\s\S]*?return visibleVideos\.filter\(\(v\) => resolveSafeAuthor\(v\)\.handle === targetHandle \|\| resolveSafeAuthor\(v\)\.name === targetHandle\);\n    \}/;

content = content.replace(regexToRemove, '');

fs.writeFileSync(path, content, 'utf8');
