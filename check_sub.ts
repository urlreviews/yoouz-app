import { db } from "./src/db/index.ts";
import { firestore_video_reviews } from "./src/db/schema.ts";

async function run() {
  const records = await db.select().from(firestore_video_reviews);
  records.forEach(r => {
    if (r.id.includes("/") || r.id.includes("%")) {
      console.log(r.id, "=>", r.data);
    }
  });
  process.exit(0);
}
run();
