const fs = require('fs');
const file = './src/components/CopoCreatorDrawer.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetBanner = `<div 
          {...swipeProps}
          className="relative h-44 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 shrink-0 touch-pan-y"
        >`;
const replaceBanner = `<div 
          {...swipeProps}
          className="relative h-44 w-full bg-zinc-950 md:bg-gradient-to-r md:from-blue-600 md:via-indigo-600 md:to-blue-800 shrink-0 touch-pan-y"
        >`;
content = content.replace(targetBanner, replaceBanner);

fs.writeFileSync(file, content);
console.log("Patched CopoCreatorDrawer banner");
