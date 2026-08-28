import { initializeApp } from "firebase/app";
import { initializeFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const firestoreDb = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

async function run() {
  const snap = await getDocs(collection(firestoreDb, "videoReviews"));
  let count = 0;
  for (const d of snap.docs) {
    const data = d.data();
    if (data.videoUrl === "/default-review.mp4" || data.videoUrl === "/api/videos/stream/default-review.mp4") {
      console.log(`Deleting dummy video: ${d.id}`);
      await deleteDoc(doc(firestoreDb, "videoReviews", d.id));
      count++;
    }
  }
  console.log(`Deleted ${count} dummy videos.`);
  process.exit(0);
}
run();
