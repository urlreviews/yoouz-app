const fs = require('fs');

let content = fs.readFileSync('src/lib/videoStorage.ts', 'utf8');

const oldCall = `    // Concurrently upload to server endpoint and Firestore chunk repository
    const [uploadResult] = await Promise.all([
      uploadVideoResumableWithProgress(
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
      ),
      saveVideoChunksToFirestore(newId, optimizedBlob, (pct) => {
        const remapped = 60 + Math.round(pct * 0.35);
        onProgress?.({
          percent: remapped,
          bytesTransferred: 0,
          totalBytes: optimizedBlob.size,
          statusText: \`Replicating video across cloud (\${pct}%)...\`,
          stage: "syncing"
        });
      })
    ]);`;

const newCall = `    // Process upload to server endpoint
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

if (content.includes(oldCall)) {
  content = content.replace(oldCall, newCall);
  fs.writeFileSync('src/lib/videoStorage.ts', content);
  console.log("Patched concurrency in upload");
} else {
  console.log("Could not find the concurrency block");
}
