import { initializeApp } from "firebase/app";
import { initializeFirestore, collection, getDocs } from "firebase/firestore";
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const firestoreDb = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

async function run() {
  const snap = await getDocs(collection(firestoreDb, "videoReviews"));
  snap.forEach(d => {
    const data = d.data();
    console.log(d.id, "videoUrl:", data.videoUrl?.substring(0, 50), "videoData exists:", !!data.videoData);
  });
  process.exit(0);
}
run();
