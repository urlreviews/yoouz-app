const fs = require('fs');
const file = './src/components/CopoCreatorDrawer.tsx';
let content = fs.readFileSync(file, 'utf8');

const bannerDecl = `
  let effectiveBanner = isOwner && currentUser?.banner 
    ? currentUser.banner 
    : author?.banner;
`;
content = content.replace('  const handleShare = () => {', bannerDecl + '\n  const handleShare = () => {');

const targetBannerRender = `        {/* Top Header Banner */}
        <div 
          {...swipeProps}
          className="relative h-44 w-full bg-zinc-950 md:bg-gradient-to-r md:from-blue-600 md:via-indigo-600 md:to-blue-800 shrink-0 touch-pan-y"
        >
          <div className="absolute inset-0 bg-black/20" />`;

const replaceBannerRender = `        {/* Top Header Banner */}
        <div 
          {...swipeProps}
          className="relative h-44 w-full bg-zinc-950 md:bg-gradient-to-r md:from-blue-600 md:via-indigo-600 md:to-blue-800 shrink-0 touch-pan-y"
        >
          {effectiveBanner && (
            <img src={effectiveBanner} className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
          )}
          <div className="absolute inset-0 bg-black/20" />`;

content = content.replace(targetBannerRender, replaceBannerRender);
fs.writeFileSync(file, content);
console.log("Patched banner render");
