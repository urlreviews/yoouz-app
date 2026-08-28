import { db as sqlDb } from "./src/db/index.ts";
import { firestore_video_reviews } from "./src/db/schema.ts";
import { initializeApp } from "firebase/app";
import { initializeFirestore, collection, getDocs } from "firebase/firestore";
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const firestoreDb = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

async function run() {
  console.log("--- SQL Database ---");
  const records = await sqlDb.select().from(firestore_video_reviews);
  for (const r of records) {
    console.log(r.id, "videoUrl:", r.data.videoUrl, "thumbnailUrl:", r.data.thumbnailUrl);
  }

  console.log("\n--- Firestore Database ---");
  const snap = await getDocs(collection(firestoreDb, "videoReviews"));
  snap.forEach(d => {
    console.log(d.id, "videoUrl:", d.data().videoUrl, "thumbnailUrl:", d.data().thumbnailUrl);
  });
  process.exit(0);
}
run();
