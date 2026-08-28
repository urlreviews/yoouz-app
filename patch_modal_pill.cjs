const fs = require('fs');
const file = './src/components/CopoCreateModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Patch recording screen overlay pill
const target1 = `<span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />`;
const replace1 = `<span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse hidden sm:block" />
                        <CopoBrandLogo
                          domain={selectedPlace?.brandDomain}
                          name={selectedPlace?.name}
                          website={selectedPlace?.website}
                          logoUrl={selectedPlace?.logoUrl || selectedPlace?.avatarUrl}
                          bannerUrl={selectedPlace?.bannerUrl || selectedPlace?.ogImage}
                          className="w-6 h-6 rounded-md bg-white border border-white/20 overflow-hidden flex items-center justify-center shrink-0 p-0.5 shadow-sm"
                          imageClassName="w-full h-full object-contain rounded-[3px]"
                          fallbackTextClassName="font-extrabold text-[10px] text-white"
                        />`;

content = content.replace(target1, replace1);

// Patch preview screen overlay pill
const target2 = `<span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />`;
const replace2 = `<span className="w-2 h-2 rounded-full bg-red-500 animate-pulse hidden sm:block" />
                        <CopoBrandLogo
                          domain={selectedPlace?.brandDomain}
                          name={selectedPlace?.name}
                          website={selectedPlace?.website}
                          logoUrl={selectedPlace?.logoUrl || selectedPlace?.avatarUrl}
                          bannerUrl={selectedPlace?.bannerUrl || selectedPlace?.ogImage}
                          className="w-6 h-6 rounded-md bg-white border border-white/20 overflow-hidden flex items-center justify-center shrink-0 p-0.5 shadow-sm"
                          imageClassName="w-full h-full object-contain rounded-[3px]"
                          fallbackTextClassName="font-extrabold text-[10px] text-white"
                        />`;

content = content.replace(target2, replace2);

fs.writeFileSync(file, content);
console.log("Patched CopoCreateModal overlay pills");
