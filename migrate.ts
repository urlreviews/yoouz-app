import { db } from "./src/db/index.ts";
import { 
  firestore_video_reviews, 
  firestore_users, 
  firestore_places, 
  firestore_chats 
} from "./src/db/schema.ts";

import { initializeApp } from "firebase/app";
import { initializeFirestore, doc, setDoc } from "firebase/firestore";
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const firestoreDb = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

async function migrateCollection(sqlTable: any, firestoreCollectionName: string) {
  console.log(`Migrating ${firestoreCollectionName}...`);
  const records = await db.select().from(sqlTable);
  
  if (!records || records.length === 0) {
    console.log(`No records found for ${firestoreCollectionName}.`);
    return;
  }

  let count = 0;
  for (const record of records) {
    try {
      const docId = record.id;
      const data = record.data;
      
      if (!data) continue;
      
      await setDoc(doc(firestoreDb, firestoreCollectionName, docId), data, { merge: true });
      count++;
      console.log(`  -> Migrated ${firestoreCollectionName}/${docId}`);
    } catch (e) {
      console.error(`  -> Error migrating ${firestoreCollectionName}/${record.id}:`, e);
    }
  }
  console.log(`Finished migrating ${count} records for ${firestoreCollectionName}.\n`);
}

async function run() {
  try {
    await migrateCollection(firestore_video_reviews, "videoReviews");
    await migrateCollection(firestore_users, "users");
    await migrateCollection(firestore_places, "places");
    await migrateCollection(firestore_chats, "chats");
    
    console.log("Migration complete!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

run();
