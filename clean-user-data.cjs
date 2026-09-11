const { createClient } = require('@libsql/client');
const fs = require('fs');

async function cleanData() {
  const client = createClient({
    url: 'file:bunny.db'
  });

  console.log('Connected to local bunny.db');

  const tables = ['users', 'places', 'businessClaims', 'videoReviews', 'chats', 'notifications', 'comments', 'likes', 'bookmarks', 'follows'];

  for (const table of tables) {
    try {
      const res = await client.execute({
        sql: `SELECT * FROM ${table}`
      });
      console.log(`Table ${table} has ${res.rows.length} rows`);

      for (const row of res.rows) {
        const rowStr = JSON.stringify(row);
        if (rowStr.toLowerCase().includes('info@yoouz.com') || rowStr.toLowerCase().includes('yoouz.com')) {
          console.log(`Found matching record in ${table}:`, row.id || row);
          
          if (table === 'users' && row.id) {
            await client.execute({ sql: `DELETE FROM users WHERE id = ?`, args: [row.id] });
            console.log(`Deleted user ${row.id} from users`);
          }
          if (table === 'places' && row.id) {
            await client.execute({ sql: `DELETE FROM places WHERE id = ?`, args: [row.id] });
            console.log(`Deleted place ${row.id} from places`);
          }
          if (table === 'businessClaims') {
            await client.execute({ sql: `DELETE FROM businessClaims WHERE data LIKE '%info@yoouz.com%' OR data LIKE '%yoouz.com%'` });
            console.log(`Deleted matching businessClaims`);
          }
        }
      }
    } catch (err) {
      console.log(`Table ${table} query note:`, err.message);
    }
  }

  // Also clean place-custom-yoouz-com or place-custom-yoouz
  try {
    await client.execute({
      sql: `DELETE FROM places WHERE id LIKE '%yoouz%' OR data LIKE '%yoouz.com%'`
    });
    console.log('Cleaned custom place records for yoouz in places table');
  } catch (e) {
    console.log('Place clean note:', e.message);
  }

  try {
    await client.execute({
      sql: `DELETE FROM users WHERE email LIKE '%yoouz%' OR data LIKE '%info@yoouz.com%'`
    });
    console.log('Cleaned user records for info@yoouz.com in users table');
  } catch (e) {
    console.log('User clean note:', e.message);
  }
}

cleanData().then(() => {
  console.log('Cleanup finished successfully!');
  process.exit(0);
}).catch(err => {
  console.error('Cleanup error:', err);
  process.exit(1);
});
