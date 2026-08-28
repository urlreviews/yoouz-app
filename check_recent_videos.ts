import { initializeApp } from "firebase/app";
import { initializeFirestore, collection, getDocs, orderBy, query } from "firebase/firestore";
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const firestoreDb = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

async function run() {
  const q = query(collection(firestoreDb, "videoReviews"));
  const snap = await getDocs(q);
  snap.forEach(d => {
    const data = d.data();
    if (data.placeId?.includes("mastercard")) {
      console.log(d.id, data.videoUrl, !!data.videoData);
    }
  });
  process.exit(0);
}
run();
