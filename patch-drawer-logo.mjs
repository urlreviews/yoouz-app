import fs from 'fs';
let content = fs.readFileSync('src/components/CopoPlaceDrawer.tsx', 'utf8');

content = content.replace(
  'const [copiedNotification, setCopiedNotification] = React.useState<string | null>(null);',
  'const [copiedNotification, setCopiedNotification] = React.useState<string | null>(null);\n  const [logoError, setLogoError] = React.useState<boolean>(false);'
);

content = content.replace(
  `        {/* Overlapping Business Logo/Avatar Badge - Official High-Res Brand Logo */}
        <div className="absolute -bottom-10 left-6 w-24 h-24 sm:w-28 sm:h-28 rounded-[24px] border-4 border-white bg-white shadow-xl flex items-center justify-center z-20 p-2 ring-1 ring-black/10">
          {getPlaceLogoUrl(place) ? (
            <img
              src={getPlaceLogoUrl(place)!}
              alt={place.name}
              className="w-full h-full object-contain rounded-[14px] [image-rendering:-webkit-optimize-contrast]"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-[#1a73e8] via-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-inner">
              <span className="font-black text-3xl tracking-tight text-white drop-shadow-md">
                {place.name ? place.name.replace(/^(een|a|the)\\s+/i, "").charAt(0).toUpperCase() : "P"}
              </span>
            </div>
          )}
        </div>`,
  `        {/* Overlapping Business Logo/Avatar Badge - Official High-Res Brand Logo */}
        <div className="absolute -bottom-10 left-6 w-24 h-24 sm:w-28 sm:h-28 rounded-[24px] border-4 border-white bg-white shadow-xl flex items-center justify-center z-20 p-2 ring-1 ring-black/10">
          {getPlaceLogoUrl(place) && !logoError ? (
            <img
              src={getPlaceLogoUrl(place)!}
              alt={place.name}
              className="w-full h-full object-contain rounded-[14px] [image-rendering:-webkit-optimize-contrast]"
              referrerPolicy="no-referrer"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-[#1a73e8] via-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-inner">
              <span className="font-black text-4xl sm:text-5xl tracking-tight text-white drop-shadow-md">
                {place.name ? place.name.replace(/^(een|a|the)\\s+/i, "").charAt(0).toUpperCase() : "P"}
              </span>
            </div>
          )}
        </div>`
);

fs.writeFileSync('src/components/CopoPlaceDrawer.tsx', content);
console.log('Patched CopoPlaceDrawer.tsx successfully');
