import { getBunnyDb } from './src/lib/bunny-db.ts';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const db = getBunnyDb();
  if (!db) return;
  const rs = await db.execute("SELECT id, placeName FROM videoReviews WHERE placeName = 'Test Save Place';");
  console.log(JSON.stringify(rs.rows, null, 2));
}
run().catch(console.error);
