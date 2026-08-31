const { createClient } = require('@libsql/client');

async function run() {
  const db = createClient({
    url: 'file:bunny.db'
  });
  
  await db.execute("DELETE FROM users WHERE name = '' OR name = email OR name = 'Registered User' OR email = ''");
  console.log("Deleted empty users from bunny.db");
}
run();
