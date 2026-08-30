const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

const regexes = [
  /\/\/ 2\. Query Firestore Admin if initialized[\s\S]*?\} catch \(fErr\) \{[\s\S]*?\}[\s\S]*?\}/g,
  /\/\/ 2\. Try Firestore Admin[\s\S]*?\} catch \(fErr\) \{\}\n\s*\}/g,
  /\/\/ 3\. Try Firestore Admin as fallback[\s\S]*?\} catch \(fErr\) \{\}\n\s*\}/g,
  /\/\/ 4\. Try Firestore Admin as fallback[\s\S]*?\} catch \(fErr\) \{\}\n\s*\}/g,
  /\/\/ Firestore Video Recovery: If file is not yet on server disk, pull chunks from Firestore[\s\S]*?\} catch \(e\) \{\n\s*failedRecoveryCache\.add\(base\);\n\s*\}\n\s*\}/g,
  /\/\/ 2\. Then try Firestore Admin as backup[\s\S]*?\} catch \(e\) \{\}\n\s*\}/g,
  /\/\/ 3\. Try Firestore Admin[\s\S]*?\} catch \(e\) \{\}\n\s*\}/g,
  /\/\/ 2\. Try Firestore Admin backup[\s\S]*?\} catch \(e\) \{\}\n\s*\}/g,
];

let prev = '';
while (prev !== server) {
  prev = server;
  for (let r of regexes) {
    server = server.replace(r, '');
  }
}

// Clean up remaining adminDb blocks blindly that might have been missed
server = server.replace(/if\s*\(!foundUser\s*&&\s*adminDb\)\s*\{[\s\S]*?catch\s*\(e\)\s*\{\}[\s\S]*?\}/g, '');
server = server.replace(/if\s*\(adminDb\)\s*\{[\s\S]*?\}\s*catch\s*\(e[^\)]*\)\s*\{[^\}]*\}[\s\S]*?\}/g, '');
server = server.replace(/if\s*\(adminDb\)\s*\{[\s\S]*?\}\s*catch\s*\(fErr\)\s*\{[^\}]*\}[\s\S]*?\}/g, '');

fs.writeFileSync('server.ts', server);
