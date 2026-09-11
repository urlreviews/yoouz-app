import { getBunnyDb } from './src/lib/bunny-db.ts';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const db = getBunnyDb();
  if (!db) return;
  
  const rs = await db.execute("SELECT id, placeName, placeId, createdAt, data FROM videoReviews ORDER BY updatedAt DESC LIMIT 5;");
  console.log(JSON.stringify(rs.rows.map(r => ({ id: r.id, placeName: r.placeName, createdAt: r.createdAt })), null, 2));
}

run().catch(console.error);
