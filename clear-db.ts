import { db } from './src/db/index.ts';
import { firestore_video_reviews } from './src/db/schema.ts';

async function main() {
  await db.delete(firestore_video_reviews);
  console.log("Cleared old videos from PostgreSQL database");
  process.exit(0);
}
main();
