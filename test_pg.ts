import { db } from "./src/db/index.ts";
import { firestore_video_reviews } from "./src/db/schema.ts";

async function run() {
  const records = await db.select().from(firestore_video_reviews);
  for (const r of records) {
    console.log(r.id, (r.data as any).videoUrl);
  }
  process.exit(0);
}
run();
