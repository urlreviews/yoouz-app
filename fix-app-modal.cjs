const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /<CopoCreateModal\n        isOpen={isCreateModalOpen}\n        onClose={\(\) => setIsCreateModalOpen\(false\)}\n        places={places}\n        preselectedPlace={preselectedPlaceForRecording}\n        onPublishVideoReview={handlePublishVideoReview}\n      \/>/,
  '<CopoCreateModal\n        isOpen={isCreateModalOpen}\n        onClose={() => setIsCreateModalOpen(false)}\n        places={places}\n        preselectedPlace={preselectedPlaceForRecording}\n        onPublishVideoReview={handlePublishVideoReview}\n        currentUser={currentUser}\n      />'
);

fs.writeFileSync('src/App.tsx', code);
