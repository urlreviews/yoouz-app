import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId !== "(default)" ? config.firestoreDatabaseId : undefined);

async function inspectDb() {
  const collections = ["videoReviews", "videos", "places", "reviews"];
  for (const col of collections) {
    try {
      const snap = await getDocs(collection(db, col));
      console.log(`--- Collection: ${col} (${snap.size} docs) ---`);
      snap.docs.forEach(d => {
        console.log(d.id, JSON.stringify(d.data()));
      });
    } catch (e) {
      console.log(`Col ${col} error:`, e.message);
    }
  }
}

inspectDb().catch(console.error);
