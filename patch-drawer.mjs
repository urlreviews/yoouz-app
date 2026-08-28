import fs from 'fs';
let content = fs.readFileSync('src/components/CopoPlaceDrawer.tsx', 'utf8');

content = content.replace(
  'className="absolute -bottom-9 left-6 w-20 h-20 sm:w-22 sm:h-22 rounded-[22px] border-4 border-white bg-white shadow-xl flex items-center justify-center z-20 p-1.5 ring-1 ring-black/10"',
  'className="absolute -bottom-10 left-6 w-24 h-24 sm:w-28 sm:h-28 rounded-[24px] border-4 border-white bg-white shadow-xl flex items-center justify-center z-20 p-2 ring-1 ring-black/10"'
);

fs.writeFileSync('src/components/CopoPlaceDrawer.tsx', content);
console.log('Patched CopoPlaceDrawer.tsx successfully');
