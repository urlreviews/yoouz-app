const fs = require('fs');

let content = fs.readFileSync('src/lib/videoStorage.ts', 'utf8');

// Replace Attempt 1
const startAttempt1 = content.indexOf('// Attempt 1: Fast Multipart Streaming Upload');
const startAttempt2 = content.indexOf('// Attempt 2: Direct Firebase Cloud Storage');

if (startAttempt1 !== -1 && startAttempt2 !== -1) {
  const attempt1Block = content.substring(startAttempt1, startAttempt2);
  
  const replacement = `// Attempt 1: Fast Multipart Streaming Upload (DISABLED - Using Firebase for permanent 100% cross-device playback)
  /*
${attempt1Block.replace(/\*\//g, '* /')}
  */
  
  `;
  
  content = content.replace(attempt1Block, replacement);
  fs.writeFileSync('src/lib/videoStorage.ts', content);
  console.log("Patched Attempt 1 to enforce Firebase Storage.");
} else {
  console.log("Could not find Attempt 1 or 2 blocks.");
}
