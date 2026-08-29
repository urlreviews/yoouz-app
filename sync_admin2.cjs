require("dotenv").config();
const admin = require("firebase-admin");
const fs = require("fs");

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));

let credential;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
} else {
  console.log("No FIREBASE_SERVICE_ACCOUNT found in .env");
  process.exit(1);
}

admin.initializeApp({ credential });
const db = admin.firestore();

async function sync() {
  const reviews = JSON.parse(fs.readFileSync("uploads/reviews_index.json", "utf8"));
  let count = 0;
  for (const review of reviews) {
    if (review && review.id) {
      await db.collection("videoReviews").doc(review.id).set(review, { merge: true });
      count++;
    }
  }
  console.log(`Successfully synced ${count} reviews to Firestore.`);
  process.exit(0);
}
sync().catch(console.error);
