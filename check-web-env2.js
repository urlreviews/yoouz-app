import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json"));
const app = initializeApp(config);
const db = getFirestore(app);
import { setLogLevel } from "firebase/firestore";
setLogLevel('debug');

async function run() {
  try {
    await setDoc(doc(db, "videoReviews", "test-ping-5"), { ping: "pong" });
    console.log("SUCCESS");
  } catch(e) {
    console.error("FAIL", e);
  }
  process.exit(0);
}
// We will set a timeout so it exits and prints logs
setTimeout(() => {
  console.log("Timeout reached");
  process.exit(1);
}, 3000);
run();
