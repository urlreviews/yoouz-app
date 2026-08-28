import fs from 'fs';
let content = fs.readFileSync('src/components/CopoPlaceDrawer.tsx', 'utf8');

content = content.replace(
  'const [logoError, setLogoError] = React.useState<boolean>(false);',
  'const [logoError, setLogoError] = React.useState<boolean>(false);\n  const [bannerError, setBannerError] = React.useState<boolean>(false);'
);

content = content.replace(
  `        {hasAuthenticPhoto ? (
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <img
              src={allPhotos[0]}
              alt={place.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />`,
  `        {hasAuthenticPhoto && !bannerError ? (
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <img
              src={allPhotos[0]}
              alt={place.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={() => setBannerError(true)}
            />`
);

fs.writeFileSync('src/components/CopoPlaceDrawer.tsx', content);
console.log('Patched CopoPlaceDrawer banner successfully');
