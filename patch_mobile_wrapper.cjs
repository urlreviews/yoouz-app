const fs = require('fs');
let content = fs.readFileSync('src/components/CopoMobileSearchView.tsx', 'utf8');

const targetRegex = /\{\/\*\s*Spacer to prevent overlap between banner and logo\s*\*\/\}\s*<div className="h-4" \/>\s*\{\/\*\s*Card Body\s*\*\/\}\s*<div className="p-5 relative pt-6">\s*\{\/\*\s*Logo Badge\s*\*\/\}\s*<div className="mt-2">/;

const replacement = `              {/* Card Body */}
              <div className="px-5 pb-6 relative z-10">
                {/* Logo Badge overlapping the banner */}
                <div className="relative -mt-10 mb-3 z-20">`;

content = content.replace(targetRegex, replacement);

content = content.replace(
  `fallbackTextClassName="font-black text-xl text-white"`,
  `fallbackTextClassName="font-black text-xl text-zinc-900 drop-shadow-sm"`
);

fs.writeFileSync('src/components/CopoMobileSearchView.tsx', content);
