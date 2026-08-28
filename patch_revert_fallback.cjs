const fs = require('fs');

function revert(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/fallbackTextClassName="(.*?)\stext-zinc-900(.*?)"/g, 'fallbackTextClassName="$1 text-white$2"');
  fs.writeFileSync(file, content);
}

revert('src/components/CopoMobileSearchView.tsx');
revert('src/components/CopoCreateModal.tsx');
revert('src/components/VideoFeedCard.tsx');

