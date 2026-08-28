import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/import \{ initializeApp as initFirebaseClientApp \} from "firebase\/app";\n/g, '');
code = code.replace(/import \{ getFirestore as getClientFirestore, initializeFirestore, collection as clientCollection, getDocs as clientGetDocs, doc as clientDoc, getDoc as clientGetDoc \} from "firebase\/firestore";\n/g, '');

code = code.replace(/function getServerFirestoreDb\(\) \{[\s\S]*?return serverFirestoreDb;\n\}/, 'function getServerFirestoreDb() { return null; }');

fs.writeFileSync('server.ts', code);
