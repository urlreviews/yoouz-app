import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc, writeBatch } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId !== "(default)" ? config.firestoreDatabaseId : undefined);

async function deleteChats() {
  const snapshot = await getDocs(collection(db, "chats"));
  console.log(`Found ${snapshot.size} docs in chats`);
  const batch = writeBatch(db);
  for (const document of snapshot.docs) {
    console.log("Deleting chat:", document.id);
    batch.delete(doc(db, "chats", document.id));
  }
  await batch.commit();
}

deleteChats().catch(console.error);
