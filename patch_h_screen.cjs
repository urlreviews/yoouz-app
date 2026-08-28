const fs = require('fs');

function patchFile(file, replacements) {
    let content = fs.readFileSync(file, 'utf8');
    for (const [target, replacement] of replacements) {
        content = content.replace(target, replacement);
    }
    fs.writeFileSync(file, content);
}

const files = [
    './src/components/CopoPlaceDrawer.tsx',
    './src/components/CopoCommentsDrawer.tsx',
    './src/components/CopoCreatorDrawer.tsx',
    './src/components/CopoSidebar.tsx',
    './src/components/CopoBusinessDashboardView.tsx',
    './src/App.tsx'
];

files.forEach(file => {
    try {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(/ md:h-screen/g, ' md:h-[100dvh]');
        content = content.replace(/ h-screen/g, ' h-[100dvh]');
        fs.writeFileSync(file, content);
    } catch (e) {
        console.error("Error reading file", file, e);
    }
});

console.log("Patched h-screen to h-[100dvh]");
