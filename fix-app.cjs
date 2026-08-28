const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('import { GlobalUploadToast }')) {
  content = content.replace(
    'import { CopoMobileSearchView } from "./components/CopoMobileSearchView";',
    'import { CopoMobileSearchView } from "./components/CopoMobileSearchView";\nimport { GlobalUploadToast } from "./components/GlobalUploadToast";'
  );
  
  // Find where to insert it in the DOM
  // Let's put it right before {deleteSuccessToast &&
  const target = '{deleteSuccessToast &&';
  if (content.includes(target)) {
    content = content.replace(target, '<GlobalUploadToast />\n\n      ' + target);
    fs.writeFileSync('src/App.tsx', content);
    console.log("Added GlobalUploadToast to App.tsx");
  } else {
    console.log("Could not find insertion point in App.tsx");
  }
} else {
  console.log("GlobalUploadToast already imported");
}
