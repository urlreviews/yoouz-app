const { createClient } = require('@libsql/client');

async function run() {
  const db = createClient({
    url: 'file:.data/bunny.db'
  });
  
  const res = await db.execute("SELECT * FROM users");
  
  for (const row of res.rows) {
     const email = row.email || "";
     const name = row.name || "";
     const emailPrefix = email.split('@')[0];
     
     if (name === "" || name === "Registered User" || name === emailPrefix) {
        await db.execute({
           sql: "DELETE FROM users WHERE id = ?",
           args: [row.id]
        });
        console.log("Deleted user:", email, name);
     }
  }
  
  console.log("Done checking and deleting.");
}
run();
