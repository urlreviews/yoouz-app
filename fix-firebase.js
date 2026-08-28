import fs from 'fs';
let content = fs.readFileSync('src/lib/firebase.ts', 'utf8');
content = content.replace(
  "export const db = getFirestore(app);",
  "import { initializeFirestore } from 'firebase/firestore';\nexport const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);"
);
fs.writeFileSync('src/lib/firebase.ts', content);
