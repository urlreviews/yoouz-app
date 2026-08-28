const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

// Remove the base64 parsing and the whole streamVideoHandler logic.
// We can actually just leave the server upload endpoint alone as a fallback, or we can just nuke it.
// To be safe, I'll just strip the Firestore chunking recovery from streamVideoHandler!
const oldLogic = `      // If file not found on disk, dynamically pull and reconstruct from Firestore Cloud Chunks!
      if (!filePath) {
        try {
          const fDb = getServerFirestoreDb();
          if (fDb) {
            const chunksColl = clientCollection(fDb, "videoReviews", base, "videoChunks");
            const snap = await clientGetDocs(chunksColl);
            if (!snap.empty) {
              const docs = snap.docs.map(d => d.data()).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
              const buffers: Buffer[] = [];
              for (const docData of docs) {
                if (docData.data) {
                  buffers.push(Buffer.from(docData.data, "base64"));
                }
              }
              if (buffers.length > 0) {
                const combinedBuffer = Buffer.concat(buffers);
                const targetFilePath = path.join(serverUploadsDir, \`\${base}.mp4\`);
                fs.writeFileSync(targetFilePath, combinedBuffer);
                filePath = targetFilePath;
                console.log(\`Successfully recovered video \${base} from Firestore (\${combinedBuffer.length} bytes)\`);
              }
            } else {
              // Check if parent document has inline videoData base64
              const reviewDocRef = clientDoc(fDb, "videoReviews", base);
              const reviewSnap = await clientGetDoc(reviewDocRef);
              if (reviewSnap.exists()) {
                const reviewData = reviewSnap.data();
                if (reviewData?.videoData && reviewData.videoData.startsWith("data:video")) {
                  const base64Data = reviewData.videoData.split(",")[1];
                  if (base64Data) {
                    const buf = Buffer.from(base64Data, "base64");
                    const targetFilePath = path.join(serverUploadsDir, \`\${base}.mp4\`);
                    fs.writeFileSync(targetFilePath, buf);
                    filePath = targetFilePath;
                  }
                }
              }
            }
          }
        } catch (recoverErr) {
          console.warn(\`Firestore video recovery note for \${base}:\`, recoverErr);
        }
      }`;

if (content.includes("If file not found on disk, dynamically pull and reconstruct from Firestore Cloud Chunks!")) {
  content = content.replace(oldLogic, `      // No more base64 or chunk recovery!`);
  fs.writeFileSync('server.ts', content);
  console.log("Cleaned up server.ts");
} else {
  console.log("Could not find server block");
}
