const fs = require('fs');
let code = fs.readFileSync('src/components/CopoPlaceDrawer.tsx', 'utf8');

// Remove place.logoUrl from allPhotos
code = code.replace(
  /      \.\.\.\(place\.photos \|\| \[\]\),\n      \n    \]\)/,
  '      ...(place.photos || [])\n    ])'
);

// Fix banner rendering logic
code = code.replace(
  '{(hasAuthenticPhoto || place.logoUrl) && !bannerError ? (',
  '{hasAuthenticPhoto && !bannerError ? ('
);

code = code.replace(
  'src={allPhotos[0] || place.logoUrl}',
  'src={allPhotos[0]}'
);

fs.writeFileSync('src/components/CopoPlaceDrawer.tsx', code);
