const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Fix App.tsx:582
  content = content.replace(
    /\(u\.uid \|\| u\.id \|\| u\.email \|\| u\.name\)\.toLowerCase\(\)/g,
    '(u.uid || u.id || u.email || u.name || "").toLowerCase()'
  );

  // Fix App.tsx:714
  content = content.replace(
    /p\.name\.toLowerCase\(\)\.trim\(\)/g,
    '(p.name || "").toLowerCase().trim()'
  );

  // Fix App.tsx:1244 targetVid?.userEmail
  content = content.replace(
    /targetVid\.userEmail\.toLowerCase\(\)/g,
    '(targetVid?.userEmail || "").toLowerCase()'
  );
  content = content.replace(
    /targetVid\.userId\.toLowerCase\(\)/g,
    '(targetVid?.userId || "").toLowerCase()'
  );
  content = content.replace(
    /targetVid\.author\.name\.toLowerCase\(\)/g,
    '(targetVid?.author?.name || "").toLowerCase()'
  );

  // Fix App.tsx:1772
  content = content.replace(
    /v\.placeName\?\.toLowerCase\(\)\.trim\(\)/g,
    '(v.placeName || "").toLowerCase().trim()'
  );

  // Fix App.tsx:1780
  content = content.replace(
    /p\.name\?\.toLowerCase\(\)\.trim\(\)/g,
    '(p.name || "").toLowerCase().trim()'
  );

  fs.writeFileSync(filePath, content, 'utf-8');
}

fixFile('src/App.tsx');
console.log("App.tsx fixed");
