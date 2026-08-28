import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  `// 1. Remove all files from uploads/videos directory`,
  `// 1. Clear PostgreSQL database
      try {
        const table = getNoSqlTable('videoReviews');
        if (table) await db.delete(table);
      } catch(e) {}
      
      // 2. Remove all files from uploads/videos directory`
);

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts successfully");
