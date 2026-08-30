const fs = require('fs');
const index = JSON.parse(fs.readFileSync('reviews-index.json', 'utf8'));
const vid = index.find(v => v.id === 'rev-1787510734251-tcadw');
console.log(JSON.stringify(vid, null, 2));
