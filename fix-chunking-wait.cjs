const fs = require('fs');

let content = fs.readFileSync('src/lib/videoStorage.ts', 'utf8');

const oldCall = `    // Process upload to server endpoint
    const uploadResult = await uploadVideoResumableWithProgress(
        optimizedBlob,
        newId,
        (progressInfo) => {
          const remapped = 15 + Math.round(progressInfo.percent * 0.45);
          onProgress?.({
            ...progressInfo,
            percent: remapped,
            statusText: progressInfo.statusText
          });
        }
    );
    
    // Save to Firestore chunks synchronously to ensure it completes before advancing
    await saveVideoChunksToFirestore(newId, optimizedBlob, (pct) => {
        const remapped = 60 + Math.round(pct * 0.35);
        onProgress?.({
          percent: remapped,
          bytesTransferred: 0,
          totalBytes: optimizedBlob.size,
          statusText: \`Replicating video across cloud (\${pct}%)...\`,
          stage: "syncing"
        });
    });`;

const newCall = `    // Process upload to server endpoint (which will now seamlessly mirror to Firebase Storage)
    const uploadResult = await uploadVideoResumableWithProgress(
        optimizedBlob,
        newId,
        (progressInfo) => {
          const remapped = 15 + Math.round(progressInfo.percent * 0.81);
          onProgress?.({
            ...progressInfo,
            percent: remapped,
            statusText: progressInfo.statusText
          });
        }
    );
    
    // Non-blocking async backup chunks to Firestore (so UI doesn't freeze waiting for this)
    saveVideoChunksToFirestore(newId, optimizedBlob).catch(() => {});
`;

if (content.includes("await saveVideoChunksToFirestore")) {
  content = content.replace(oldCall, newCall);
  fs.writeFileSync('src/lib/videoStorage.ts', content);
  console.log("Patched concurrency wait");
} else {
  console.log("Could not find the chunking block");
}
