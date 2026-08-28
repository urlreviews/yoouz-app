import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
const config = JSON.parse(fs.readFileSync("firebase-applet-config.json"));
const app = initializeApp({ projectId: config.projectId });

async function run() {
  try {
    const list = await getAuth(app).listUsers(1);
    console.log("Admin auth works. Users:", list.users.length);
    process.exit(0);
  } catch(e) {
    console.error("Admin auth failed", e);
    process.exit(1);
  }
}
run();
