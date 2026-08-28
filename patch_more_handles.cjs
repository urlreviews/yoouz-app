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

patchFile('./src/components/CopoFollowingView.tsx', [
    [/\.handle/g, '.name']
]);

patchFile('./src/components/CopoMessagesView.tsx', [
    [/\.handle/g, '.name'],
    [/handle: /g, '//handle: ']
]);

patchFile('./src/components/VideoFeedCard.tsx', [
    [
        `const mockAuthor = {\n      name: "Local Expert",\n      handle: "@localexpert",\n      avatar: "https://yoouz.com/icon-192.png",\n      isVerified: true,\n      isFollowed: false\n    };`,
        `const mockAuthor = {\n      name: "Local Expert",\n      avatar: "https://yoouz.com/icon-192.png",\n      isVerified: true,\n      isFollowed: false,\n      location: "Local Area"\n    };`
    ]
]);

console.log("Patched more handles");
