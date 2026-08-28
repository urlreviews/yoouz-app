const fs = require('fs');
let content = fs.readFileSync('src/utils/videoUtils.ts', 'utf8');

const regex = /\/\/ 3\. Identify if this is a review ID or local video filename/;
const replacement = `  // 2.5 Firebase Storage Download URLs should NEVER be rewritten
  if (trimmed.includes("firebasestorage.googleapis.com")) {
    return trimmed;
  }
  
  // 3. Identify if this is a review ID or local video filename`;

if (content.match(regex)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync('src/utils/videoUtils.ts', content);
    console.log("Patched normalizeVideoUrl!");
} else {
    console.log("Could not find regex");
}
