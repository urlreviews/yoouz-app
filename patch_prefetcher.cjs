const fs = require('fs');
let file = fs.readFileSync('src/utils/videoPrefetcher.ts', 'utf8');

file = file.replace(
  /\.then\(res => res\.blob\(\)\)/g,
  '.then(res => { if (!res.ok) throw new Error("Not OK"); return res.blob(); })'
);

fs.writeFileSync('src/utils/videoPrefetcher.ts', file);
