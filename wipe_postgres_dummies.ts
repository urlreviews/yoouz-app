import { db } from "./src/db/index.js";
import { firestore_video_reviews } from "./src/db/schema.js";
import { inArray } from "drizzle-orm";

async function run() {
  const ids = [
    "rev-latakiano-barbero-bizriv",
    "rev-hotel-leopold-bizriv",
    "bpost-review-bizriv",
    "rev-grafton-pharmacy-bizriv",
    "rev-covent-garden-massage-aouisesmee",
    "rev-cnn-aouisesmee"
  ];
  
  await db.delete(firestore_video_reviews).where(inArray(firestore_video_reviews.id, ids));
  console.log("Deleted dummies from PostgreSQL.");
  process.exit(0);
}
run();
