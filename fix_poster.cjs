const fs = require('fs');
const path = 'src/components/VideoFeedCard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the poster image loading logic
content = content.replace(
  /loading="eager"\s+decoding="sync"\s+fetchPriority="high"/g,
  'loading={isActive || isNear ? "eager" : "lazy"}\n          decoding="async"\n          fetchPriority={isActive ? "high" : "auto"}'
);

fs.writeFileSync(path, content, 'utf8');
