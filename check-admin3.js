import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

// Initialize without cert (default credentials in environment)
const config = JSON.parse(fs.readFileSync("firebase-applet-config.json"));
try {
  const app = initializeApp({ projectId: config.projectId });
  const db = getFirestore(app);
  db.settings({ databaseId: config.firestoreDatabaseId });

  async function run() {
    const docRef = db.collection("videoReviews").doc("test");
    await docRef.set({ ok: true });
    console.log("SUCCESS");
    process.exit(0);
  }
  run();
} catch (e) {
  console.error(e);
}
