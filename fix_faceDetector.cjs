const fs = require('fs');
let content = fs.readFileSync('src/utils/faceDetector.ts', 'utf8');

const index = content.indexOf('// Method 3: Lightweight canvas skin-tone');
if (index !== -1) {
  content = content.substring(0, index) + "// Method 3 removed to avoid hand-blocking (skin heuristic) false positives\n  return { detected: false };\n}";
  fs.writeFileSync('src/utils/faceDetector.ts', content);
}
