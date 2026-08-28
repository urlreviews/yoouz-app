import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json"));
try {
  const app = initializeApp({ projectId: config.projectId });
  const db = getFirestore(app);
  db.settings({ databaseId: config.firestoreDatabaseId });

  async function run() {
    const snap = await db.collection("videoReviews").get();
    console.log("Found " + snap.size + " video reviews");
    process.exit(0);
  }
  run();
} catch (e) {
  console.error(e);
}
