import { getBunnyDb } from './src/lib/bunny-db.ts';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const db = getBunnyDb();
  if (!db) return;
  
  console.log("Deleting corrupted record...");
  const rs = await db.execute("DELETE FROM places WHERE id = 'oraldentalstudionyc';");
  console.log("Delete result:", rs);
  
  console.log("Verifying remaining records...");
  const check = await db.execute("SELECT id, name FROM places WHERE id LIKE '%oral%';");
  console.log(JSON.stringify(check.rows, null, 2));
}
run().catch(console.error);
