import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json"));
const app = initializeApp(config);
// Connect to the (default) database instead of the new one
const db = getFirestore(app); // Note we are using the default constructor now instead of passing a second arg

async function run() {
  try {
    await setDoc(doc(db, "videoReviews", "test-ping-10"), { ping: "pong" });
    console.log("SUCCESS! Default database is unlocked.");
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
