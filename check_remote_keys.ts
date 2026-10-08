
import { getBunnyDb } from "./src/lib/bunny-db.ts";

async function checkKeys() {
  const db = getBunnyDb();
  if (!db) return;

  const result = await db.execute("SELECT * FROM comments LIMIT 1");
  if (result.rows.length > 0) {
    console.log("Remote DB keys for comments row:");
    console.log(Object.keys(result.rows[0]));
  } else {
    console.log("No rows in comments table");
  }
}

checkKeys();
