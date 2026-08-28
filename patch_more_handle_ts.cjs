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

patchFile('./src/App.tsx', [
    [/handle: /g, '//handle: '],
    [/\.handle/g, '.name'],
    [/\.replyToHandle/g, '.replyToName']
]);

patchFile('./src/components/CopoAdminPanel.tsx', [
    [/\.handle/g, '.name']
]);

patchFile('./src/components/CopoBusinessDashboardView.tsx', [
    [/viewsCountCount/g, 'viewsCount']
]);

patchFile('./src/components/CopoCommentsDrawer.tsx', [
    [/replyToName:/g, '//replyToName:']
]);

patchFile('./src/components/VideoFeedCard.tsx', [
    [/handle: /g, '//handle: ']
]);

console.log("Patched left overs");
