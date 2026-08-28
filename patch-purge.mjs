import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  `      // 1. Clear PostgreSQL database`,
  `      // 1. Clear PostgreSQL database
      try { writeReviewsIndex([]); } catch(e) {}
      try { if (fs.existsSync(reviewsIndexPath)) fs.unlinkSync(reviewsIndexPath); } catch(e) {}`
);

fs.writeFileSync('server.ts', content);
console.log('Patched purge-all to clear JSON index');
