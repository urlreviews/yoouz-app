const fs = require('fs');
let code = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf8');

const firebaseImports = `import { ref, uploadBytes, getDownloadURL } from "firebase/storage";\nimport { collection, addDoc, serverTimestamp } from "firebase/firestore";\nimport { db, storage } from "../lib/firebase";\n`;

code = firebaseImports + code;

fs.writeFileSync('src/components/CopoCreateModal.tsx', code);
