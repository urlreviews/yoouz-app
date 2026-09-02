const fs = require('fs');
const path = 'src/components/CopoVideoPlayer.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /container\.scrollTo\(\{ top: targetTop, behavior: "smooth" \}\);/g,
  `// If it's a jump larger than 1 card (e.g. returning to feed), snap instantly
        const isJump = Math.abs(currentIndex - currentIndexRef.current) > 1;
        container.scrollTo({ top: targetTop, behavior: isJump ? "auto" : "smooth" });`
);

content = content.replace(
  /container\.scrollTo\(\{ top: targetTop, behavior \}\);/g,
  `const isJump = Math.abs(targetIndex - currentIndexRef.current) > 1;
        container.scrollTo({ top: targetTop, behavior: isJump ? "auto" : behavior });`
);

fs.writeFileSync(path, content, 'utf8');
