import { initializeApp } from "firebase/app";
import { initializeFirestore, collection, getDocs } from "firebase/firestore";
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const firestoreDb = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

async function run() {
  const snap = await getDocs(collection(firestoreDb, "videoReviews"));
  console.log("Firestore records:", snap.size);
  snap.forEach(d => console.log(d.id));
  process.exit(0);
}
run();
