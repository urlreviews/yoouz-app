const admin = require('firebase-admin');
const serviceAccount = require('./firebase-applet-config.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function run() {
  const ids = ["rev-1787767013276-ee969", "rev-1787510734251-tcadw"];
  for (const id of ids) {
    const doc = await db.collection("videoReviews").doc(id).get();
    if (doc.exists) {
      const data = doc.data();
      console.log(`\n--- Video: ${id} ---`);
      console.log(`coverUrl: ${data.coverUrl ? data.coverUrl.substring(0, 50) + "..." : "none"}`);
      console.log(`thumbnailUrl: ${data.thumbnailUrl ? data.thumbnailUrl.substring(0, 50) + "..." : "none"}`);
      console.log(`videoThumbnail: ${data.videoThumbnail ? data.videoThumbnail.substring(0, 50) + "..." : "none"}`);
      console.log(`videoPreviewUrl: ${data.videoPreviewUrl ? data.videoPreviewUrl.substring(0, 50) + "..." : "none"}`);
    } else {
      console.log(`\n--- Video: ${id} --- NOT FOUND IN FIRESTORE`);
    }
  }
}

run().catch(console.error);
