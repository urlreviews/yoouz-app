import fs from "fs";
import path from "path";
import { initializeApp as initFirebaseClientApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const clientApp = initFirebaseClientApp(config, "clean-app");
const db = getFirestore(clientApp, config.firestoreDatabaseId);

async function clean() {
  const collections = ["places", "videoReviews", "videos", "reviews"];
  for (const colName of collections) {
    try {
      const colRef = collection(db, colName);
      const snap = await getDocs(colRef);
      for (const d of snap.docs) {
        const dataStr = JSON.stringify(d.data()).toLowerCase();
        if (dataStr.includes("donkey") || dataStr.includes("spotted")) {
          console.log(`Deleting ${colName}/${d.id}:`, d.data());
          await deleteDoc(doc(db, colName, d.id));
        }
      }
    } catch (e) {
      console.log(`Error cleaning ${colName}:`, e.message);
    }
  }

  // Also clean uploads directory
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    for (const f of files) {
      if (f.toLowerCase().includes("donkey") || f.toLowerCase().includes("spotted")) {
        const filePath = path.join(uploadsDir, f);
        console.log("Deleting local upload file:", filePath);
        fs.unlinkSync(filePath);
      }
    }
  }
}

clean().then(() => { console.log("Cleanup complete"); process.exit(0); }).catch(err => { console.error(err); process.exit(1); });
