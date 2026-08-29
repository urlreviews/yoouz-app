import { db, firestore_video_reviews, getDb } from "./src/db/index";
async function run() {
  if (getDb()) {
    const dbRecords = await db.select().from(firestore_video_reviews);
    console.log("Records:", dbRecords.length);
    console.log("First record data type:", typeof dbRecords[0]?.data);
  } else {
    console.log("No DB");
  }
}
run();
