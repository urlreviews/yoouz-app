import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json"));
const app = initializeApp({ projectId: config.projectId });
const db = getFirestore(app);
db.settings({ databaseId: config.firestoreDatabaseId });

async function run() {
  try {
    const snap = await db.collection("videoReviews").get();
    console.log("SUCCESS! Found " + snap.size + " video reviews");
    process.exit(0);
  } catch (e) {
    console.error("FAIL", e);
    process.exit(1);
  }
}
run();
