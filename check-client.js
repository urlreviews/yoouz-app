import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json"));
const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
  try {
    const snap = await getDocs(collection(db, "videoReviews"));
    console.log(`Found ${snap.size} videos in Firestore!`);
    snap.forEach(doc => console.log(doc.id));
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();
