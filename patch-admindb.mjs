import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  '// Global Firebase Firestore Client for Server-Side Media Recovery',
  '// Global Firebase Firestore Client for Server-Side Media Recovery\nlet adminDb: any = null;'
);

fs.writeFileSync('server.ts', content);
console.log('Patched adminDb successfully');
