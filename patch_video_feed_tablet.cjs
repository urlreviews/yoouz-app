const fs = require('fs');

function patchFile(file, replacements) {
    let content = fs.readFileSync(file, 'utf8');
    for (const [target, replacement] of replacements) {
        content = content.replace(target, replacement);
    }
    fs.writeFileSync(file, content);
}

// 1. Patch CopoVideoPlayer.tsx
patchFile('./src/components/CopoVideoPlayer.tsx', [
    [
        'className="w-full h-full md:w-[400px] lg:w-[420px] md:h-[92vh] md:max-h-[880px]',
        'className="w-full h-full md:w-full md:max-w-[400px] lg:w-[420px] lg:max-w-none md:h-[92vh] md:max-h-[880px]'
    ],
    [
        'className="w-full h-full md:h-auto md:w-auto flex items-center gap-4 relative md:max-h-[98vh] md:p-3"',
        'className="w-full h-full md:h-auto md:w-full md:max-w-[400px] lg:w-auto lg:max-w-none flex items-center md:justify-center gap-4 relative md:max-h-[98vh] md:p-3"'
    ],
    [
        'className="relative w-[340px] sm:w-[380px] md:w-[400px] h-[85vh]',
        'className="relative w-full max-w-[340px] sm:max-w-[380px] md:max-w-[400px] h-[85vh]'
    ]
]);

// 2. Patch VideoFeedCard.tsx
patchFile('./src/components/VideoFeedCard.tsx', [
    [
        'className="snap-start snap-always shrink-0 relative w-full h-full md:w-[400px] lg:w-[420px] md:h-[92vh] md:max-h-[880px]',
        'className="snap-start snap-always shrink-0 relative w-full h-full md:w-full md:max-w-[400px] lg:w-[420px] lg:max-w-none md:h-[92vh] md:max-h-[880px]'
    ]
]);

// 3. Patch CopoPlaceDrawer.tsx
patchFile('./src/components/CopoPlaceDrawer.tsx', [
    [
        'w-full md:w-[400px] lg:w-[430px]',
        'w-full md:w-[350px] lg:w-[430px]'
    ]
]);

// 4. Patch CopoCreatorDrawer.tsx
patchFile('./src/components/CopoCreatorDrawer.tsx', [
    [
        'w-full md:w-[400px] lg:w-[430px]',
        'w-full md:w-[350px] lg:w-[430px]'
    ]
]);

console.log("Patched tablet responsiveness");
