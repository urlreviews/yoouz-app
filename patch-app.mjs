import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `          onRecordForPlace={(p) => {
            // Create video review feature removed per request
          }}`,
  `          onRecordForPlace={(p) => {
            if (!currentUser) {
              setAuthIntent('record');
              setPreselectedPlaceForRecording(p);
              setIsAuthModalOpen(true);
            } else {
              setPreselectedPlaceForRecording(p);
              setIsCreateModalOpen(true);
            }
          }}`
);

code = code.replace(
  `                onOpenCreate={(place) => {
                  // Create feature removed per request
                }}`,
  `                onOpenCreate={(place) => {
                  if (!currentUser) {
                    setAuthIntent('record');
                    setPreselectedPlaceForRecording(place || null);
                    setIsAuthModalOpen(true);
                  } else {
                    setPreselectedPlaceForRecording(place || null);
                    setIsCreateModalOpen(true);
                  }
                }}`
);

code = code.replace(
  `          onRecordForPlace={(place) => {
            setIsSearchModalOpen(false);
          }}`,
  `          onRecordForPlace={(place) => {
            setIsSearchModalOpen(false);
            if (!currentUser) {
              setAuthIntent('record');
              setPreselectedPlaceForRecording(place);
              setIsAuthModalOpen(true);
            } else {
              setPreselectedPlaceForRecording(place);
              setIsCreateModalOpen(true);
            }
          }}`
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx successfully");
