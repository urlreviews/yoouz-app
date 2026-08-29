import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';

import { cert } from 'firebase-admin/app';
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig: any = {};
try {
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  console.warn("Failed to load firebase-applet-config.json in firebase-admin:", e);
}

let credentialArgs: any = undefined;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    credentialArgs = cert(sa);
  } catch(e) {
    console.warn("Failed to parse FIREBASE_SERVICE_ACCOUNT", e);
  }
}

const appArgs: any = {
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
};
if (credentialArgs) {
  appArgs.credential = credentialArgs;
}
const app = getApps().length > 0
  ? getApps()[0]
  : initializeApp(appArgs);


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

