const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

// Remove import
server = server.replace(/import\s+\{[^}]*\}\s+from\s+["']\.\/src\/lib\/firebase-admin\.ts["'];?\n/g, '');

// Empty the variables if they are used elsewhere, or completely replace them.
server = server.replace(/if\s*\(\s*adminDb\s*\)\s*\{[\s\S]*?\/\/\s*3\./g, '// 3.');
server = server.replace(/\/\/\s*2\.\s*Query Firestore Admin[\s\S]*?\/\/\s*2\.\s*For videoReviews/g, '// 2. For videoReviews');
server = server.replace(/\/\/\s*2\.\s*Try Firestore Admin[\s\S]*?\/\/\s*3\.\s*Try local review index/g, '// 3. Try local review index');

fs.writeFileSync('server.ts', server);
