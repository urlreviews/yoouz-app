import { initializeApp } from "firebase/app";
import { initializeFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const firestoreDb = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

async function run() {
  const snap = await getDocs(collection(firestoreDb, "videoReviews"));
  snap.forEach(d => {
    console.log(d.id, "likes:", d.data().likes);
  });
  
  const d = await getDoc(doc(firestoreDb, "videoReviews", "rev-hotel-leopold-bizriv"));
  console.log(JSON.stringify(d.data(), null, 2));

  process.exit(0);
}
run();
