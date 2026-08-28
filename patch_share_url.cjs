const fs = require('fs');
let files = [
  './src/components/CopoCreatorDrawer.tsx',
  './src/components/GoogleVideoPlayerModal.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    'shareUrl={`${window.location.origin}/@${author.handle}`}',
    'shareUrl={`${window.location.origin}/creator/${(author.name || "user").replace(/\\s+/g, "").toLowerCase()}`}'
  );
  content = content.replace(
    'const shareUrl = `${window.location.origin}/@${handle}/video/${currentReview.id}`;',
    'const shareUrl = `${window.location.origin}/creator/${(currentReview.author?.name || "user").replace(/\\s+/g, "").toLowerCase()}/video/${currentReview.id}`;'
  );
  fs.writeFileSync(file, content);
});

console.log("Patched share URLs");
