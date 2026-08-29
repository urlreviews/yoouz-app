import fs from 'fs';
import path from 'path';
import { db } from './src/db/index';
import { firestore_video_reviews } from './src/db/schema';
import { eq } from 'drizzle-orm';

const serverUploadsDir = path.join(process.cwd(), "uploads");
const reviewsIndexPath = path.join(serverUploadsDir, "reviews_index.json");
const readReviewsIndex = (): any[] => {
  try {
    if (fs.existsSync(reviewsIndexPath)) {
      return JSON.parse(fs.readFileSync(reviewsIndexPath, "utf8"));
    }
  } catch (e) {}
  return [];
};

async function check() {
  let videoId = 'rev-1787990803895-2ftsu';
  let foundVideo = null;
  const localList = readReviewsIndex();
  foundVideo = localList.find((v: any) => v.id === videoId);
  console.log("Local List Found:", !!foundVideo);

  if (!foundVideo && db) {
    const [rec] = await db.select().from(firestore_video_reviews).where(eq(firestore_video_reviews.id, videoId));
    if (rec) foundVideo = { id: rec.id, ...rec.data };
    console.log("DB Found:", !!foundVideo, !!rec);
  }
  
  if (foundVideo) {
     console.log(foundVideo.id);
  } else {
     console.log("Not found anywhere in fallback checks");
  }
  process.exit(0);
}
check();
