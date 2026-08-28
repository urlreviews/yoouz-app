const fs = require('fs');

let content = fs.readFileSync('src/components/VideoFeedCard.tsx', 'utf8');

const processingBlock = `          {hasError && (
            <div className="absolute inset-0 z-15 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white space-y-3 pointer-events-auto">
              <p className="text-sm font-medium text-zinc-200">Tap to load or resume playback</p>`;

const newProcessingBlock = `          {(!resolvedSource) && (
            <div className="absolute inset-0 z-15 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white space-y-3 pointer-events-auto">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-2" />
              <p className="text-sm font-bold text-white">Video is processing...</p>
              <p className="text-xs text-zinc-300">This video is currently being uploaded to the cloud. It will be available shortly.</p>
            </div>
          )}

          {hasError && resolvedSource && (
            <div className="absolute inset-0 z-15 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white space-y-3 pointer-events-auto">
              <p className="text-sm font-medium text-zinc-200">Tap to load or resume playback</p>`;

if (content.includes("Tap to load or resume playback")) {
  content = content.replace(processingBlock, newProcessingBlock);
  
  // also let's strip out the getVideoBlobFromCloudChunks calls since we removed that logic!
  content = content.replace(/getVideoBlobFromCloudChunks\(video\.id\)\.then\(\(cloudBlobUrl\) => \{[^}]*\}\)\.catch\(\(\) => \{/g, `new Promise((resolve, reject) => reject()).catch(() => {`);
  content = content.replace(/getVideoBlobFromCloudChunks\(video\.id\)\s*\.then\(\(cloudBlobUrl\) => \{[\s\S]*?\}\)\s*\.catch\(\(\) => \{[\s\S]*?\}\);/g, `// cloud chunks removed`);
  
  fs.writeFileSync('src/components/VideoFeedCard.tsx', content);
  console.log("Patched VideoFeedCard processing state");
} else {
  console.log("Could not find the Tap to load block");
}
