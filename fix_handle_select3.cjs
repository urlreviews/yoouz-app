const fs = require('fs');
const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /previousVideoIndexRef\.current = currentVideoIndex; \/\/ Save background feed index before going fullscreen\n    previousVideoIndexRef\.current = currentVideoIndex; \/\/ Save background feed index before going fullscreen/,
  `previousVideoIndexRef.current = currentVideoIndex; // Save background feed index before going fullscreen`
);

fs.writeFileSync(path, content, 'utf8');
