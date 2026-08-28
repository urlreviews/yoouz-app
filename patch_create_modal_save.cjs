const fs = require('fs');
const file = './src/components/CopoCreateModal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'placeLogoUrl: getPlaceLogoUrl(selectedPlace) || selectedPlace.logoUrl || "",',
  'placeLogoUrl: getPlaceLogoUrl(selectedPlace) || selectedPlace.logoUrl || selectedPlace.avatarUrl || "",'
);

fs.writeFileSync(file, content);
console.log("Patched CopoCreateModal save video review logoUrl");
