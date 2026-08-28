const fs = require('fs');
let content = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf8');

content = content.replace(
  /if \(maxDeviation > 12\) \{\n\s*speechConfidenceFrames\+\+;\n\s*if \(speechConfidenceFrames >= 1\) \{/,
  `if (maxDeviation > 8) {
          speechConfidenceFrames++;
          if (speechConfidenceFrames >= 2) {`
);

fs.writeFileSync('src/components/CopoCreateModal.tsx', content);
