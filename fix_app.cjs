const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Also need to initialize `shares: v.shares || 0` when incrementing
content = content.replace(
  /shares: v\.shares \+ 1/g,
  'shares: (v.shares || 0) + 1'
);

content = content.replace(
  /shares: video\.shares \+ 1/g,
  'shares: (video.shares || 0) + 1'
);

fs.writeFileSync('src/App.tsx', content, 'utf-8');
console.log("App shares fixed");
