const fs = require('fs');
let code = fs.readFileSync('src/lib/videoStorage.ts', 'utf8');

const newFunc = `export async function uploadVideoResumableWithProgress(
  blob: Blob,
  videoId: string,
  onProgress?: ProgressCallback
): Promise<{ downloadUrl: string; thumbnailUrl?: string; provider: "server" | "firebase" | "bunny" }> {
  try {
    // Send to our server to handle Bunny CDN upload
    const result = await uploadVideoToServerWithProgress(blob, videoId, (pct) => {
      onProgress?.({
        percent: pct,
        bytesTransferred: 0,
        totalBytes: blob.size,
        statusText: \`Uploading video... \${pct}%\`,
        stage: pct === 100 ? "complete" : "uploading"
      });
    });

    if (result && result.url) {
      return { 
        downloadUrl: result.url, 
        thumbnailUrl: result.thumbnailUrl, 
        provider: result.url.includes('b-cdn.net') ? "bunny" : "server" 
      };
    }
  } catch (err) {
    console.warn("Server upload failed:", err);
  }
  
  // Fallback to local server stream URL
  return { downloadUrl: \`/api/videos/stream/\${videoId}.mp4\`, provider: "server" };
}`;

// Replace the existing function
code = code.replace(/export async function uploadVideoResumableWithProgress\([\s\S]*?return \{ downloadUrl: `\/api\/videos\/stream\/\$\{videoId\}\.mp4`, provider: "server" \};\n\}/, newFunc);

fs.writeFileSync('src/lib/videoStorage.ts', code);
console.log("Done");
