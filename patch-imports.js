import fs from 'fs';

const files = [
  'src/components/CopoMoreView.tsx',
  'src/components/CopoPlaceDrawer.tsx',
  'src/components/CopoCreateModal.tsx',
  'src/lib/videoUploadEngine.ts',
  'src/lib/videoStorage.ts',
  'src/hooks/useFeedPagination.ts',
  'src/App.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/from\s+["']firebase\/firestore["']/g, 'from "../lib/firebase"');
  content = content.replace(/from\s+["']firebase\/auth["']/g, 'from "../lib/firebase"');
  content = content.replace(/from\s+["']firebase\/storage["']/g, 'from "../lib/firebase"');
  
  if (file === 'src/App.tsx') {
    content = content.replace(/from\s+["']\.\.\/lib\/firebase["']/g, 'from "./lib/firebase"');
  }
  
  fs.writeFileSync(file, content);
}
console.log("Imports patched!");
