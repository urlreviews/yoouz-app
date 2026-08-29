const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase-admin.ts', 'utf8');

const newInit = `import { cert } from 'firebase-admin/app';
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

const app = getApps().length > 0
  ? getApps()[0]
  : initializeApp({
      credential: credentialArgs,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
    });
`;

code = code.replace(/const configPath = path\.join\([\s\S]*?storageBucket: firebaseConfig\.storageBucket,\s*\}\);/, newInit);
fs.writeFileSync('src/lib/firebase-admin.ts', code);
console.log("Patched firebase-admin.ts");
