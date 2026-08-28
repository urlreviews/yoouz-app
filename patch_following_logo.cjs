const fs = require('fs');
const file = './src/components/CopoFollowingView.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { CopoBrandLogo }')) {
  content = content.replace(
    'import { CopoAuthPrompt } from "./CopoGoogleAuthModal";',
    'import { CopoAuthPrompt } from "./CopoGoogleAuthModal";\nimport { CopoBrandLogo } from "./CopoBrandLogo";'
  );
}

const target1 = `                          <div className="w-12 h-12 rounded-xl bg-zinc-800 md:bg-zinc-100 border border-zinc-700 md:border-zinc-150 overflow-hidden flex items-center justify-center font-bold text-zinc-200 md:text-zinc-700 shrink-0 group-hover:scale-105 transition-transform">
                            {place.avatarUrl && (
                              <img 
                                src={place.avatarUrl} 
                                alt={place.name} 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const fallback = e.currentTarget.parentElement?.querySelector('.fallback-initial');
                                  if (fallback) fallback.classList.remove('hidden');
                                }}
                              />
                            )}
                            <div className={\`fallback-initial w-full h-full flex items-center justify-center \${place.avatarUrl ? 'hidden' : ''}\`}>
                              {place.name.charAt(0)}
                            </div>
                          </div>`;

const replace1 = `                          <CopoBrandLogo
                            domain={place.brandDomain}
                            name={place.name}
                            website={place.website || place.address}
                            logoUrl={place.logoUrl || place.avatarUrl}
                            bannerUrl={place.bannerUrl || place.ogImage}
                            className="w-12 h-12 rounded-xl bg-zinc-800 md:bg-zinc-100 border border-zinc-700 md:border-zinc-200 overflow-hidden flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm"
                            imageClassName="w-full h-full object-contain [image-rendering:-webkit-optimize-contrast]"
                            fallbackTextClassName="font-bold text-lg text-zinc-300 md:text-zinc-600"
                          />`;

content = content.replaceAll(target1, replace1);

fs.writeFileSync(file, content);
console.log("Patched CopoFollowingView");
