import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

// Initialize without cert (default credentials in environment)
const config = JSON.parse(fs.readFileSync("firebase-applet-config.json"));
try {
  const app = initializeApp({ projectId: config.projectId });
  console.log("Admin initialized?", getApps().length > 0);
  console.log("GCP Project:", config.projectId);
  console.log("Database ID:", config.firestoreDatabaseId);

  const db = getFirestore(app);
  db.settings({ databaseId: "(default)" });

  async function run() {
    const docRef = db.collection("test-perms-9").doc("test");
    await docRef.set({ ok: true });
    console.log("SUCCESS! Write successful.");
    process.exit(0);
  }
  run();
} catch (e) {
  console.error("FAIL", e);
}
