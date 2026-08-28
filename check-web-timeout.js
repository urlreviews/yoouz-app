import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, initializeFirestore, setLogLevel } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json"));
const app = initializeApp(config);
const db = initializeFirestore(app, {}, config.firestoreDatabaseId);

setLogLevel('debug');

async function run() {
  try {
    await setDoc(doc(db, "videoReviews", "test-ping-10"), { ping: "pong" });
    console.log("SUCCESS");
  } catch(e) {
    console.error("FAIL", e);
  }
  process.exit(0);
}
setTimeout(() => {
  console.log("Timeout reached");
  process.exit(1);
}, 3000);
run();
