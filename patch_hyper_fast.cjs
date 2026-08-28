const fs = require('fs');
let content = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf8');

content = content.replace(
  /if \(avg > 35 && peak > 120\) \{\n\s*speechConfidenceFrames\+\+;\n\s*if \(speechConfidenceFrames >= 20\) \{/g,
  `if (avg > 15 && peak > 60) {
          speechConfidenceFrames++;
          if (speechConfidenceFrames >= 2) {`
);

fs.writeFileSync('src/components/CopoCreateModal.tsx', content);
