const fs = require('fs');

function patchFile(file, replacements) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    for (const [target, replacement] of replacements) {
        if (target instanceof RegExp) {
            content = content.replace(target, replacement);
        } else {
            content = content.split(target).join(replacement);
        }
    }
    fs.writeFileSync(file, content);
}

patchFile('./src/components/CopoReportModal.tsx', [
    [/\.handle/g, '.name'],
    [/author\.handle/g, 'author.name']
]);

patchFile('./src/components/CopoShareModal.tsx', [
    [/\.handle/g, '.name']
]);

patchFile('./src/components/CopoVideoPlayer.tsx', [
    [/\.handle/g, '.name']
]);

patchFile('./src/components/GoogleVideoPlayerModal.tsx', [
    [/\.handle/g, '.name']
]);

patchFile('./src/components/VideoFeedCard.tsx', [
    [/\.handle/g, '.name'],
    [
        `const mockAuthor = {\n      name: "Local Expert",\n      handle: "@localexpert",\n      avatar: "https://yoouz.com/icon-192.png",\n      isVerified: true,\n      isFollowed: false\n    };`,
        `const mockAuthor = {\n      name: "Local Expert",\n      avatar: "https://yoouz.com/icon-192.png",\n      isVerified: true,\n      isFollowed: false,\n      location: "Local Area"\n    };`
    ]
]);

patchFile('./src/hooks/useFeedPagination.ts', [
    [/\.handle/g, '.name']
]);

patchFile('./src/lib/socialSync.ts', [
    [/\.handle/g, '.name'],
    [/handle: /g, '//handle: ']
]);

patchFile('./src/utils/placeUtils.ts', [
    [/\.handle/g, '.name']
]);

console.log("Patched left over handle property usages.");
