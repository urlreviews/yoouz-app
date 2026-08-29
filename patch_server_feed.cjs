const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /snapshot\.forEach\(\(docSnap: any\) => \{\s+const data = docSnap\.data\(\);\s+if \(data\) \{\s+map\.set\(docSnap\.id, \{ id: docSnap\.id, \.\.\.data \}\);\s+\}\s+\}\);/,
  `snapshot.forEach((docSnap: any) => {
            const data = docSnap.data();
            if (data) {
              const existing = map.get(docSnap.id) || {};
              map.set(docSnap.id, { ...existing, id: docSnap.id, ...data });
            }
          });`
);

code = code.replace(
  /dbRecords\.forEach\(\(r: any\) => \{\s+if \(r && r\.id && r\.data\) \{\s+map\.set\(r\.id, \{ id: r\.id, \.\.\.r\.data \}\);\s+\}\s+\}\);/,
  `dbRecords.forEach((r: any) => {
            if (r && r.id && r.data) {
              const existing = map.get(r.id) || {};
              map.set(r.id, { ...existing, id: r.id, ...r.data });
            }
          });`
);

fs.writeFileSync('server.ts', code);
console.log('Patched server.ts merge logic');
