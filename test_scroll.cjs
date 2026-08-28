const fs = require('fs');
let content = fs.readFileSync('src/components/VideoFeedCard.tsx', 'utf-8');
content = content.replace(
  /if \(isActive\) \{\s+if \(el\.currentTime === 0 \|\| el\.ended\) \{\s+el\.currentTime = 0;\s+\}\s+safePlay\(\);\s+\} else \{/g,
  `if (isActive) {
      safePlay();
    } else {`
);
content = content.replace(/\}, \[isActive, safePlay, safePause\]\);/g, '  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps');
fs.writeFileSync('src/components/VideoFeedCard.tsx', content, 'utf-8');
console.log("Updated useEffect");
