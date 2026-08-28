import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `              onOpenCreateModal={() => setIsCreateModalOpen(true)}`,
  `              onOpenCreateModal={() => {
                if (!currentUser) {
                  setAuthIntent('record');
                  setIsAuthModalOpen(true);
                } else {
                  setPreselectedPlaceForRecording(null);
                  setIsCreateModalOpen(true);
                }
              }}`
);

fs.writeFileSync('src/App.tsx', content);
console.log('Patched App.tsx auth logic for recording');
