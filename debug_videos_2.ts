import { db as sqlDb } from "./src/db/index.ts";
import { firestore_video_reviews, reviews } from "./src/db/schema.ts";

async function run() {
  console.log("--- SQL Database (firestore_video_reviews) ---");
  const records = await sqlDb.select().from(firestore_video_reviews);
  for (const r of records) {
    if (r.data.videoUrl !== '/default-review.mp4') {
      console.log(r.id, "videoUrl:", r.data.videoUrl, "thumbnailUrl:", r.data.thumbnailUrl);
    }
  }

  console.log("\n--- SQL Database (reviews legacy) ---");
  const legacyRecords = await sqlDb.select().from(reviews);
  for (const r of legacyRecords) {
    if (r.videoUrl !== '/default-review.mp4') {
      console.log(r.id, "videoUrl:", r.videoUrl, "thumbnailUrl:", r.videoThumbnail);
    }
  }

  process.exit(0);
}
run();
