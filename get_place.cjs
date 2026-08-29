const admin = require("firebase-admin");
const serviceAccount = require("./firebase-applet-config.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function run() {
  const query = await db.collection("places").where("brandDomain", "==", "ibm.com").get();
  query.forEach(doc => {
    console.log(doc.id, "=>", doc.data());
  });
}
run();
