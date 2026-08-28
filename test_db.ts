import { db } from "./src/db/index.js";
import { firestore_video_reviews } from "./src/db/schema.js";
async function run() {
  const records = await db.select().from(firestore_video_reviews);
  console.log("Postgres records:", records.length);
  for (const r of records) {
    console.log(r.id);
  }
  process.exit(0);
}
run();
