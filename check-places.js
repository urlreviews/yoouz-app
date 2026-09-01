import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json"));
const app = initializeApp({ projectId: config.projectId });
const db = getFirestore(app);
db.settings({ databaseId: config.firestoreDatabaseId });

async function run() {
  try {
    const snap = await db.collection("places").get();
    console.log("Found " + snap.size + " places in database: " + config.firestoreDatabaseId);
    snap.forEach(doc => {
      console.log("-----------------------------------------");
      console.log("ID:", doc.id);
      console.log("Data:", JSON.stringify(doc.data(), null, 2));
    });
  } catch(e) {
    console.error("Error reading Firestore:", e.message);
  }
}
run();
