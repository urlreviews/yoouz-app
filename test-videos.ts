import { db } from './src/db/index.ts';
import { firestore_video_reviews } from './src/db/schema.ts';
async function main() {
  const p = await db.select().from(firestore_video_reviews);
  console.log("Total videos in DB:", p.length);
  process.exit(0);
}
main();
