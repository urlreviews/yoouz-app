const fs = require('fs');
const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /if \(source === "creator" \|\| isCreatorView\) \{/,
  `previousVideoIndexRef.current = currentVideoIndex; // Save background feed index before going fullscreen
    if (source === "creator" || isCreatorView) {`
);

fs.writeFileSync(path, content, 'utf8');
