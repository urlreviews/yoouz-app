const fs = require('fs');

let content = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf8');

const oldGenPoster = `  const generateNeutralPoster = (placeName: string) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 360;
      canvas.height = 640;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, 0, 640);
        grad.addColorStop(0, "#18181b");
        grad.addColorStop(0.5, "#27272a");
        grad.addColorStop(1, "#09090b");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 360, 640);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 24px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(placeName || "Video Review", 180, 310);

        ctx.fillStyle = "#a1a1aa";
        ctx.font = "14px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText("Real User Video Review", 180, 340);
        return canvas.toDataURL("image/jpeg", 0.6);
      }
    } catch (e) {
      // ignore
    }
    return "";
  };`;

const newGenPoster = `  const generateNeutralPoster = (placeName: string) => {
    // Completely banned Base64 generation to prevent Firestore bloat.
    return \`https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80\`;
  };`;

if (content.includes("generateNeutralPoster = ")) {
  content = content.replace(oldGenPoster, newGenPoster);
  
  // also replace captureCameraSnapshot base64 usage
  const oldCapture = `  const captureCameraSnapshot = () => {
    if (videoRef.current && stream) {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 360;
        canvas.height = 640;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const videoWidth = videoRef.current.videoWidth;
          const videoHeight = videoRef.current.videoHeight;
          const scale = Math.max(canvas.width / videoWidth, canvas.height / videoHeight);
          const x = (canvas.width / 2) - (videoWidth / 2) * scale;
          const y = (canvas.height / 2) - (videoHeight / 2) * scale;
          ctx.drawImage(videoRef.current, x, y, videoWidth * scale, videoHeight * scale);
          return canvas.toDataURL("image/jpeg", 0.7);
        }
      } catch (err) {
        console.warn("Could not capture camera frame:", err);
      }
    }
    return null;
  };`;
  const newCapture = `  const captureCameraSnapshot = () => {
    return null; // Banned Base64 dataURIs
  };`;
  content = content.replace(oldCapture, newCapture);
  
  fs.writeFileSync('src/components/CopoCreateModal.tsx', content);
  console.log("Patched CopoCreateModal to ban base64 posters");
}
