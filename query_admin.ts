import { adminDb } from "./src/lib/firebase-admin.ts";

async function check() {
  const videoId = 'rev-1787990803895-2ftsu';
  if (!adminDb) {
     console.log("No adminDb");
  } else {
     try {
       const snap = await adminDb.collection("videoReviews").doc(videoId).get();
       console.log("Exists:", snap.exists);
     } catch (e) {
       console.error("Error:", e.message);
     }
  }
  process.exit(0);
}
check();
