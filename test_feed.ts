import { adminDb } from "./src/lib/firebase-admin.ts";

async function run() {
  const snapshot = await adminDb.collection("videoReviews").get();
  console.log(`Found ${snapshot.size} videos`);
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(doc.id, data.videoUrl);
  });
}
run().catch(console.error);
