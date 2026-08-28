import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId !== "(default)" ? config.firestoreDatabaseId : undefined);

async function wipeCollection(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName));
  console.log(`Found ${snapshot.size} docs in ${collectionName}`);
  for (const document of snapshot.docs) {
    await deleteDoc(doc(db, collectionName, document.id));
    console.log(`Deleted ${document.id} from ${collectionName}`);
  }
}

async function wipeAll() {
  await wipeCollection("videos");
  await wipeCollection("videoReviews");
  await wipeCollection("places");
  await wipeCollection("users");
  console.log("Wipe complete!");
  process.exit(0);
}

wipeAll().catch(console.error);
