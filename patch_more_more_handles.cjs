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

patchFile('./src/components/CopoCommentsDrawer.tsx', [
    [/\.handle/g, '.name'],
    [/replyToHandle\?: string;/g, ''],
    [/\.replyToHandle/g, '.replyToName'],
    [/replyToHandle/g, 'replyToName']
]);

patchFile('./src/components/CopoCreateModal.tsx', [
    [/handle: /g, '//handle: ']
]);

patchFile('./src/components/CopoCreatorDrawer.tsx', [
    [/\.handle/g, '.name']
]);

patchFile('./src/components/CopoDiscoverView.tsx', [
    [/\.handle/g, '.name'],
    [/handle: /g, '//handle: ']
]);

patchFile('./src/components/CopoBusinessDashboardView.tsx', [
    [/\.views/g, '.viewsCount'],
    [/views:/g, 'viewsCount:']
]);

patchFile('./src/types.ts', [
    [/replyToHandle\?: string;/g, 'replyToName?: string;']
]);

console.log("Patched more handles");
