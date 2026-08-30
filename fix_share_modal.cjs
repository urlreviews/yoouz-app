const fs = require('fs');
let code = fs.readFileSync('src/components/CopoShareModal.tsx', 'utf8');

const replacement = `
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Social Card Preview</p>
              <a
                href={isVideoMode && video
                  ? \`/api/og-image.png?type=video&id=\${encodeURIComponent(video.id)}&placeName=\${encodeURIComponent(video.placeName || "Business")}&author=\${encodeURIComponent(video.author?.name || "Reviewer")}&rating=\${video.rating || 5}&caption=\${encodeURIComponent(video.caption || "")}&thumbUrl=\${encodeURIComponent(video.videoThumbnail || video.videoPreviewUrl || video.author?.avatar || "")}&v=8\`
                  : "/api/og-image.png?v=8"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition"
              >
                Open Full Card ↗
              </a>
            </div>
            <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-inner group">
              <img
                src={isVideoMode && video
                  ? \`/api/og-image.png?type=video&id=\${encodeURIComponent(video.id)}&placeName=\${encodeURIComponent(video.placeName || "Business")}&author=\${encodeURIComponent(video.author?.name || "Reviewer")}&rating=\${video.rating || 5}&caption=\${encodeURIComponent(video.caption || "")}&thumbUrl=\${encodeURIComponent(video.videoThumbnail || video.videoPreviewUrl || video.author?.avatar || "")}&v=8\`
                  : "/api/og-image.png?v=8"
                }
`;

code = code.replace(/<div className="flex items-center justify-between">[\s\S]*?<img[\s\S]*?\}[\s\S]*?\}/, replacement.trim());
fs.writeFileSync('src/components/CopoShareModal.tsx', code);
console.log("Fixed CopoShareModal");
