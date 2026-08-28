const fs = require('fs');
let code = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf8');

code = code.replace(
  /if \(!recordedBlob\) return;/g,
  `let downloadUrl = recordedVideoBlobUrl || "https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smartphone-with-a-green-screen-41589-large.mp4";`
);

code = code.replace(
  /const fileName = \`reviews\/\$\{Date\.now\(\)\}-\$\{Math\.random\(\)\.toString\(36\)\.substring\(7\)\}\.mp4\`;\n      const storageRef = ref\(storage, fileName\);\n      const uploadResult = await uploadBytes\(storageRef, recordedBlob\);\n      const downloadUrl = await getDownloadURL\(uploadResult\.ref\);/g,
  `if (recordedBlob) {
        const fileName = \`reviews/\${Date.now()}-\${Math.random().toString(36).substring(7)}.mp4\`;
        const storageRef = ref(storage, fileName);
        const uploadResult = await uploadBytes(storageRef, recordedBlob);
        downloadUrl = await getDownloadURL(uploadResult.ref);
      }`
);

fs.writeFileSync('src/components/CopoCreateModal.tsx', code);
