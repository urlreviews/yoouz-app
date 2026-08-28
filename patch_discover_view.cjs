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

patchFile('./src/components/CopoDiscoverView.tsx', [
    [/\/\/handle: /g, 'handle: ']
]);
console.log("Patched CopoDiscoverView");
