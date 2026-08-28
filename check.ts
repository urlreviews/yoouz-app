import { initializeApp } from "firebase/app";
import { initializeFirestore, collection, getDocs } from "firebase/firestore";
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const firestoreDb = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

async function run() {
  const snap = await getDocs(collection(firestoreDb, "videoReviews"));
  snap.forEach(doc => {
    const data = doc.data();
    console.log(doc.id, "videoUrl:", data.videoUrl, "bunnyVideoId:", data.bunnyVideoId, "fallbackVideoUrls:", data.fallbackVideoUrls);
  });
  process.exit(0);
}
run();
