import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId !== "(default)" ? config.firestoreDatabaseId : undefined);

async function readUsers() {
  const snapshot = await getDocs(collection(db, "users"));
  console.log(`Found ${snapshot.size} docs in users`);
  for (const document of snapshot.docs) {
    console.log(`User:`, document.id, document.data());
  }
}

readUsers().catch(console.error);
