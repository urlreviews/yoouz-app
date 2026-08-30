import { db } from "./src/db/index.ts";
import { firestore_video_reviews } from "./src/db/schema.ts";
import { eq } from "drizzle-orm";

async function run() {
  const ids = ["rev-1787767013276-ee969"];
  for (const id of ids) {
    const [rec] = await db.select().from(firestore_video_reviews).where(eq(firestore_video_reviews.id, id));
    if (rec) {
      const data = rec.data as any;
      const b64 = data.thumbnailUrl.split(',')[1];
      const buf = Buffer.from(b64, 'base64');
      console.log(`Buffer length: ${buf.length}`);
    }
  }
}
run().catch(console.error);
