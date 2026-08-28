const fs = require('fs');
let code = fs.readFileSync('src/components/CopoProfileView.tsx', 'utf8');

code = code.replace(/youtubeChannel: string; /g, '');
code = code.replace(/<span>\{currentUser\.youtubeChannel\}<\/span>/g, '');

fs.writeFileSync('src/components/CopoProfileView.tsx', code);
