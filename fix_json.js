const fs = require('fs');
try {
  let data = JSON.parse(fs.readFileSync('uploads/reviews_index.json', 'utf8'));
  data = data.filter(d => d.id !== 'rev-test-12345678');
  fs.writeFileSync('uploads/reviews_index.json', JSON.stringify(data, null, 2));
} catch(e) {}
