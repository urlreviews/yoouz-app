import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

// Read the config to get the project id and the correct database id
const config = JSON.parse(fs.readFileSync("firebase-applet-config.json"));

try {
  // Use ADC to initialize the app
  const app = initializeApp({ projectId: config.projectId });
  const db = getFirestore(app);
  // Tell the SDK which database to use!
  db.settings({ databaseId: config.firestoreDatabaseId });

  async function run() {
    console.log("Checking Firestore connection to database:", config.firestoreDatabaseId);
    
    // We try to fetch exactly 1 document to see if the query goes through
    const snap = await db.collection("videoReviews").limit(1).get();
    
    console.log("SUCCESS! Connection is working. Found document?:", snap.size > 0);
    process.exit(0);
  }
  run();
} catch (e) {
  console.error("Initialization error:", e);
  process.exit(1);
}
