const fs = require('fs');
const file = './src/components/CopoCreateModal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replaceAll(
  'logoUrl={selectedPlace.logoUrl}',
  'logoUrl={selectedPlace.logoUrl || selectedPlace.avatarUrl}'
);

fs.writeFileSync(file, content);
console.log("Patched CopoCreateModal");
