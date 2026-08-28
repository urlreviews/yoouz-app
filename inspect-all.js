import fs from "fs";
import { adminDb } from "./src/lib/firebase-admin.ts";
import { db } from "./src/db/index.ts";
import { reviews, places } from "./src/db/schema.ts";

async function run() {
  console.log("=== FIRESTORE COLLECTIONS ===");
  try {
    const collections = await adminDb.listCollections();
    for (const col of collections) {
      console.log(`Collection: ${col.id}`);
      const snap = await col.get();
      snap.docs.forEach(doc => {
        console.log(`  Doc ID: ${doc.id}`, JSON.stringify(doc.data()));
      });
    }
  } catch (e) {
    console.error("Firestore error:", e);
  }

  console.log("=== DRIZZLE DB TABLES ===");
  try {
    const allReviews = await db.select().from(reviews);
    console.log("Drizzle Reviews:", allReviews);
    const allPlaces = await db.select().from(places);
    console.log("Drizzle Places:", allPlaces);
  } catch (e) {
    console.error("Drizzle error:", e);
  }
}

run().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
