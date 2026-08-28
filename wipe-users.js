import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc, writeBatch } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId !== "(default)" ? config.firestoreDatabaseId : undefined);

async function wipeUsers() {
  const collections = ["users"];
  for (const coll of collections) {
    const snapshot = await getDocs(collection(db, coll));
    console.log(`Found ${snapshot.size} docs in ${coll}`);
    let batch = writeBatch(db);
    let count = 0;
    for (const document of snapshot.docs) {
      console.log(`Deleting ${coll}:`, document.id);
      batch.delete(doc(db, coll, document.id));
      count++;
      if (count % 400 === 0) {
        await batch.commit();
        batch = writeBatch(db);
      }
    }
    if (count % 400 !== 0) {
      await batch.commit();
    }
  }
}

// wait 5 seconds for rules to propagate
setTimeout(() => {
  wipeUsers().then(() => {
    console.log("Done");
    process.exit(0);
  }).catch(console.error);
}, 5000);
