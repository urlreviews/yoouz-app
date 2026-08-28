import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  `      // 1. Delete from Firestore via Admin SDK`,
  `      // 1. Delete from PostgreSQL
      try {
        const table = getNoSqlTable('videoReviews');
        if (table) await db.delete(table).where(eq(table.id, videoId));
      } catch (err) {
        console.error("Postgres delete error:", err);
      }
      
      // 2. Delete from Firestore via Admin SDK`
);

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts successfully");
