import { db } from "./src/db/index.ts";
import { firestore_video_reviews } from "./src/db/schema.ts";

async function run() {
  const records = await db.select().from(firestore_video_reviews);
  records.forEach(r => {
    console.log(r.id, "commentsCount:", r.data.commentsCount, "comments:", r.data.comments?.length);
  });
  process.exit(0);
}
run();
