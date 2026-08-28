import { adminDb } from "./src/lib/firebase-admin.ts";

async function run() {
  const collections = await adminDb.listCollections();
  for (const col of collections) {
    console.log(`=== Collection: ${col.id} ===`);
    const snap = await col.get();
    snap.docs.forEach(doc => {
      console.log(`  ID: ${doc.id}`, JSON.stringify(doc.data()));
    });
  }
}

run().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
