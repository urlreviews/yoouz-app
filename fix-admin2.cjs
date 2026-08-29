const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase-admin.ts', 'utf8');

const regex = /const app = getApps\(\)\.length > 0[\s\S]*?\}\);/;
const replacement = `const appArgs: any = {
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
};
if (credentialArgs) {
  appArgs.credential = credentialArgs;
}
const app = getApps().length > 0
  ? getApps()[0]
  : initializeApp(appArgs);`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/lib/firebase-admin.ts', code);
