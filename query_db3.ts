import { db } from "./src/db/index.ts";
import { firestore_video_reviews } from "./src/db/schema.ts";
import { eq } from "drizzle-orm";

async function run() {
  const ids = ["rev-1787767013276-ee969", "rev-1787510734251-tcadw"];
  for (const id of ids) {
    const [rec] = await db.select().from(firestore_video_reviews).where(eq(firestore_video_reviews.id, id));
    if (rec) {
      const data = rec.data as any;
      console.log(`\n--- ${id} ---`);
      console.log(`thumbnailUrl length: ${data.thumbnailUrl?.length}`);
      console.log(`thumbnailUrl type: ${typeof data.thumbnailUrl}`);
    }
  }
}
run().catch(console.error);
