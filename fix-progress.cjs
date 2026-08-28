const fs = require('fs');
let content = fs.readFileSync('src/lib/videoStorage.ts', 'utf8');

const oldCode = `      // Remap 0-100 to 15-95
      const remapped = 15 + Math.round(progressInfo.percent * 0.80);
      onProgress?.({
        ...progressInfo,
        percent: remapped,
        statusText: progressInfo.statusText,
        stage: "uploading"
      });`;

const newCode = `      onProgress?.({
        ...progressInfo,
        statusText: \`Uploading \${progressInfo.percent}%\`,
        stage: "uploading"
      });`;

content = content.replace(oldCode, newCode);
fs.writeFileSync('src/lib/videoStorage.ts', content);
