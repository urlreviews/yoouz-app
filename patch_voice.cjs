const fs = require('fs');
let content = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf8');

content = content.replace(
  /if \(avg > 15\) \{\n\s*speechConfidenceFrames\+\+;\n\s*if \(speechConfidenceFrames >= 2\) \{/g,
  `if (avg > 25) {
          speechConfidenceFrames++;
          if (speechConfidenceFrames >= 15) {`
);

fs.writeFileSync('src/components/CopoCreateModal.tsx', content);
