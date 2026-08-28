import fs from "fs";
import path from "path";
import { initializeApp as initFirebaseClientApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const clientApp = initFirebaseClientApp(config, "inspect-app");
const db = getFirestore(clientApp, config.firestoreDatabaseId);

async function run() {
  const collections = ["places", "videoReviews", "videos"];
  for (const colName of collections) {
    const colRef = collection(db, colName);
    const snap = await getDocs(colRef);
    console.log(`=== Collection: ${colName} (${snap.size} docs) ===`);
    snap.docs.forEach(d => {
      console.log(`ID: ${d.id}`, JSON.stringify(d.data()));
    });
  }
}

run().catch(console.error);
