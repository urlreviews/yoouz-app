const fs = require('fs');
let code = fs.readFileSync('src/lib/videoStorage.ts', 'utf8');

code = code.replace(
  'import { db } from "./firebase";',
  'import { db, storage } from "./firebase";\nimport { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";'
);

const regex = /export async function uploadVideoResumableWithProgress\([\s\S]*?\)\s*:\s*Promise<\{[^>]*?\}\>\s*\{[\s\S]*?return \{ downloadUrl:[^}]*? \};\n\}/;

const replacement = `export async function uploadVideoResumableWithProgress(
  blob: Blob,
  videoId: string,
  onProgress?: ProgressCallback
): Promise<{ downloadUrl: string; thumbnailUrl?: string; provider: "server" | "firebase" }> {
  try {
    const ext = blob.type.includes("webm") ? "webm" : "mp4";
    const fileName = \`\${videoId}.\${ext}\`;
    const storageRef = ref(storage, \`videos/\${fileName}\`);
    const uploadTask = uploadBytesResumable(storageRef, blob, { contentType: blob.type || "video/mp4" });
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress?.({
            percent: pct,
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            statusText: \`Uploading video... \${pct}%\`,
            stage: pct === 100 ? "complete" : "uploading"
          });
        },
        (error) => {
          console.error("Firebase Storage upload error:", error);
          reject(error);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ downloadUrl, provider: "firebase" });
        }
      );
    });
  } catch (err) {
    console.warn("Firebase Storage upload notice:", err);
  }
  return { downloadUrl: \`/api/videos/stream/\${videoId}.mp4\`, provider: "server" };
}`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/lib/videoStorage.ts', code);
