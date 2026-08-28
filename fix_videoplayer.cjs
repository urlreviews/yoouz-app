const fs = require('fs');
const filePath = 'src/components/CopoVideoPlayer.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

content = content.replace(
  /const targetName = vid\.placeName\.toLowerCase\(\);/g,
  'const targetName = (vid.placeName || "").toLowerCase();'
);
content = content.replace(
  /\(place\) => place\.name && place\.name\.toLowerCase\(\) === targetName/g,
  '(place) => place.name && (place.name || "").toLowerCase() === targetName'
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log("CopoVideoPlayer.tsx fixed");
