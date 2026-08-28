const fs = require('fs');
let content = fs.readFileSync('src/utils/faceDetector.ts', 'utf8');

// Replace Method 3 with a simple return false
content = content.replace(
  /\/\/ Method 3: Lightweight canvas skin-tone & center luminance analysis heuristic[\s\S]*\}\n\s*catch\s*\(e\)\s*\{\n\s*return\s*\{\s*detected:\s*false\s*\};\s*\/\/\s*Strict\s*on\s*error\n\s*\}/,
  `// Method 3 removed to avoid hand-blocking (skin heuristic) false positives
  return { detected: false };`
);

fs.writeFileSync('src/utils/faceDetector.ts', content);
