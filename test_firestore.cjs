const { getFirestore } = require('firebase-admin/firestore');
const { initializeApp, getApps } = require('firebase-admin/app');
const fs = require('fs');
const path = require('path');
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
if (!getApps().length) initializeApp({ projectId: firebaseConfig.projectId });
const db = getFirestore();
if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)") {
  try { db.settings({ databaseId: firebaseConfig.firestoreDatabaseId }); } catch(e) {}
}

async function check() {
  const snap = await db.collection("videoReviews").limit(3).get();
  snap.forEach(doc => {
    console.log("ID:", doc.id);
    console.log("videoUrl:", doc.data().videoUrl);
  });
}
check();
