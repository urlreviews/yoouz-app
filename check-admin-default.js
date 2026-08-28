import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json"));
try {
  const app = initializeApp({ projectId: config.projectId });
  const db = getFirestore(app);
  db.settings({ databaseId: "(default)" });

  async function run() {
    const snap = await db.collection("videoReviews").limit(1).get();
    console.log("SUCCESS! Default DB works.");
    process.exit(0);
  }
  run();
} catch (e) {
  console.error("FAIL", e);
}
