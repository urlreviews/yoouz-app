import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

async function backupFirestore() {
  console.log("Starting Firestore backup...");

  let app;
  if (!getApps().length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      app = initializeApp({ credential: cert(serviceAccount) });
    } else {
      app = initializeApp({ projectId: process.env.VITE_FIREBASE_PROJECT_ID || "ai-studio-yoouz-95541371-cdcc-4025-9fb0-c7f3ae35f87c" });
    }
  }

  const db = getFirestore();
  const collectionsToBackup = ["users", "reviews", "places", "comments", "likes", "bookmarks", "admin_settings"];
  const backupData: Record<string, any[]> = {};

  for (const collName of collectionsToBackup) {
    try {
      console.log(`Exporting collection: ${collName}...`);
      const snapshot = await db.collection(collName).get();
      backupData[collName] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log(`✓ Fetched ${backupData[collName].length} documents from ${collName}`);
    } catch (err: any) {
      console.warn(`Could not export ${collName}:`, err.message);
      backupData[collName] = [];
    }
  }

  const outDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(outDir, `firestore-backup-${timestamp}.json`);
  fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), "utf-8");

  console.log(`\n Backup completed successfully!`);
  console.log(`Saved to: ${filePath}`);
}

backupFirestore().catch((err) => {
  console.error("Backup failed:", err);
});
