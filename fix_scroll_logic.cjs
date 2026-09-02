const fs = require('fs');
const path = 'src/components/CopoVideoPlayer.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex1 = /currentIndexRef\.current = targetIndex;[\s\S]*?const isJump = Math\.abs\(targetIndex - currentIndexRef\.current\) > 1;/;
// We need to fix both scrollToCard and the useEffect. Let's just rewrite the block.

content = content.replace(
  /currentIndexRef\.current = targetIndex;[\s\S]*?lastObserverIndexRef\.current = targetIndex;[\s\S]*?onSelectVideoIndex\(targetIndex\);[\s\S]*?const cardEl = cardRefs\.current\[targetIndex\];[\s\S]*?const container = containerRef\.current;[\s\S]*?if \(cardEl && container\) \{[\s\S]*?isProgrammaticScrollRef\.current = true;[\s\S]*?const targetTop = cardEl\.offsetTop - container\.offsetTop;[\s\S]*?const isJump = Math\.abs\(targetIndex - currentIndexRef\.current\) > 1;[\s\S]*?container\.scrollTo\(\{ top: targetTop, behavior: isJump \? "auto" : behavior \}\);/,
  `const isJump = Math.abs(targetIndex - currentIndexRef.current) > 1;
      currentIndexRef.current = targetIndex;
      lastObserverIndexRef.current = targetIndex;
      onSelectVideoIndex(targetIndex);

      const cardEl = cardRefs.current[targetIndex];
      const container = containerRef.current;
      if (cardEl && container) {
        isProgrammaticScrollRef.current = true;
        const targetTop = cardEl.offsetTop - container.offsetTop;
        container.scrollTo({ top: targetTop, behavior: isJump ? "auto" : behavior });`
);

content = content.replace(
  /lastObserverIndexRef\.current = currentIndex;[\s\S]*?currentIndexRef\.current = currentIndex;[\s\S]*?const cardEl = cardRefs\.current\[currentIndex\];[\s\S]*?const container = containerRef\.current;[\s\S]*?if \(cardEl && container\) \{[\s\S]*?isProgrammaticScrollRef\.current = true;[\s\S]*?const targetTop = cardEl\.offsetTop - container\.offsetTop;[\s\S]*?\/\/ If it's a jump larger than 1 card \(e\.g\. returning to feed\), snap instantly[\s\S]*?const isJump = Math\.abs\(currentIndex - currentIndexRef\.current\) > 1;[\s\S]*?container\.scrollTo\(\{ top: targetTop, behavior: isJump \? "auto" : "smooth" \}\);/,
  `const isJump = Math.abs(currentIndex - currentIndexRef.current) > 1;
      lastObserverIndexRef.current = currentIndex;
      currentIndexRef.current = currentIndex;

      const cardEl = cardRefs.current[currentIndex];
      const container = containerRef.current;
      if (cardEl && container) {
        isProgrammaticScrollRef.current = true;
        const targetTop = cardEl.offsetTop - container.offsetTop;
        container.scrollTo({ top: targetTop, behavior: isJump ? "auto" : "smooth" });`
);

fs.writeFileSync(path, content, 'utf8');
