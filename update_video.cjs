const fs = require('fs');
let code = fs.readFileSync('src/lib/videoStorage.ts', 'utf8');

// Ensure firebase imports are there
if (!code.includes('firebase/storage')) {
  code = code.replace(
    'import { collection, doc, setDoc, getDocs, orderBy, query } from "firebase/firestore";',
    'import { collection, doc, setDoc, getDocs, orderBy, query } from "firebase/firestore";\nimport { storage } from "./firebase";\nimport { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";'
  );
}

const regex = /export async function uploadVideoResumableWithProgress[\s\S]*?return \{ downloadUrl: `\/api\/videos\/stream\/\$\{videoId\}\.mp4`, provider: "server" \};\n\}/;

const replacement = `export async function uploadVideoResumableWithProgress(
  blob: Blob,
  videoId: string,
  onProgress?: ProgressCallback
): Promise<{ downloadUrl: string; thumbnailUrl?: string; provider: "server" | "firebase" }> {
  try {
    const ext = blob.type.includes("webm") ? "webm" : "mp4";
    const fileName = \`\${videoId}.\${ext}\`;
    
    // Upload straight to Firebase Cloud Storage!
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
            statusText: \`Uploading video to cloud... \${pct}%\`,
            stage: pct === 100 ? "complete" : "uploading"
          });
        },
        (error) => {
          console.error("Firebase Storage direct upload error:", error);
          reject(error);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            console.log("Successfully uploaded to Firebase Storage:", downloadUrl);
            resolve({ downloadUrl, provider: "firebase" });
          } catch (urlErr) {
            console.error("Failed to get download URL:", urlErr);
            reject(urlErr);
          }
        }
      );
    });
  } catch (err) {
    console.warn("Client upload fallback:", err);
  }
  
  // Fallback to local server if Firebase fails (which causes cross-container issues)
  return { downloadUrl: \`/api/videos/stream/\${videoId}.mp4\`, provider: "server" };
}`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/lib/videoStorage.ts', code);
