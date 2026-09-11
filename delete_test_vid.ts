import { getBunnyDb } from './src/lib/bunny-db.ts';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const db = getBunnyDb();
  if (!db) return;
  await db.execute("DELETE FROM videoReviews WHERE id = 'rev-test-12345678'");
  console.log("Deleted test video from videoReviews.");
}

run().catch(console.error);
