import { getBunnyDb } from "./src/lib/bunny-db.ts";
async function run() {
  const db = getBunnyDb();
  if (db) {
     const rs = await db.execute("SELECT * FROM users WHERE email = 'aouisesmee@gmail.com'");
     console.log(rs.rows);
  } else {
     console.log("No bunny db client");
  }
}
run();
