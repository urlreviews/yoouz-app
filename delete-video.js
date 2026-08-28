import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId !== "(default)" ? config.firestoreDatabaseId : undefined);

async function deleteAll() {
  const snapshot = await getDocs(collection(db, "videoReviews"));
  console.log(`Found ${snapshot.size} docs in videoReviews`);
  for (const document of snapshot.docs) {
    console.log("Deleting:", document.id, document.data().author?.name, document.data().placeName);
    await deleteDoc(doc(db, "videoReviews", document.id));
  }
  
  const videosSnapshot = await getDocs(collection(db, "videos"));
  console.log(`Found ${videosSnapshot.size} docs in videos`);
  for (const document of videosSnapshot.docs) {
    console.log("Deleting:", document.id);
    await deleteDoc(doc(db, "videos", document.id));
  }
}

deleteAll().catch(console.error);
