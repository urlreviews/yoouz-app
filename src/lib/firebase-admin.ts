import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig: any = {};
try {
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  console.warn("Failed to load firebase-applet-config.json in firebase-admin:", e);
}

const app = getApps().length > 0
  ? getApps()[0]
  : initializeApp({
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
    });

export const adminAuth = getAuth(app);

let resolvedAdminDb: any = null;
try {
  resolvedAdminDb = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
} catch (e) {
  try {
    resolvedAdminDb = getFirestore(app);
  } catch (err) {
    console.warn("Could not initialize adminDb:", err);
  }
}
export const adminDb = resolvedAdminDb;

export const adminStorage = getStorage(app);

