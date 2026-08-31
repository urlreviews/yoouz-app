const { createClient } = require('@libsql/client');
require('dotenv').config();

async function main() {
  const email = "ygf@usa.com";
  const uid = `usr_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;

  const bunnyDb = createClient({
    url: process.env.BUNNY_DB_URL,
    authToken: process.env.BUNNY_DB_TOKEN,
  });

  try {
    await bunnyDb.execute({
      sql: `DELETE FROM users WHERE id = ? OR email = ?`,
      args: [uid, email]
    });
    console.log("Deleted from BunnyDB");
  } catch (err) {
    console.log("Bunny DB delete failed", err);
  }
}

main();
