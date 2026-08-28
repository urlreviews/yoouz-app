import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountStr) {
  console.log("No FIREBASE_SERVICE_ACCOUNT_KEY found. Attempting default init.");
  initializeApp();
} else {
  const serviceAccount = JSON.parse(serviceAccountStr);
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

async function deleteAll() {
  const snapshot = await db.collection("videoReviews").get();
  console.log(`Found ${snapshot.size} docs in videoReviews`);
  for (const doc of snapshot.docs) {
    console.log("Deleting:", doc.id);
    await db.collection("videoReviews").doc(doc.id).delete();
  }
  
  const videosSnapshot = await db.collection("videos").get();
  console.log(`Found ${videosSnapshot.size} docs in videos`);
  for (const doc of videosSnapshot.docs) {
    console.log("Deleting:", doc.id);
    await db.collection("videos").doc(doc.id).delete();
  }
}

deleteAll().then(() => {
  console.log("Done");
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
