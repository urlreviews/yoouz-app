import { db } from './src/db/index';
import { firestore_video_reviews } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function check() {
  let videoId = 'rev-1787990803895-2ftsu';
  let foundVideo = null;

  if (db) {
    try {
      const [rec] = await db.select().from(firestore_video_reviews).where(eq(firestore_video_reviews.id, videoId));
      if (rec) foundVideo = { id: rec.id, ...rec.data };
      console.log("DB Found:", !!foundVideo);
    } catch (e) {
      console.log("DB Error:", e);
    }
  }
  process.exit(0);
}
check();
