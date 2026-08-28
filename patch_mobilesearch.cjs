const fs = require('fs');
const file = './src/components/CopoMobileSearchView.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  `                    <img 
                      src={searchedPlace.bannerUrl} 
                      alt="Banner" 
                      className="absolute inset-0 w-full h-full object-cover opacity-50"
                     referrerPolicy="no-referrer" 
                    />`,
  `                    <img 
                      src={searchedPlace.bannerUrl} 
                      alt="Banner" 
                      className="absolute inset-0 w-full h-full object-cover opacity-50"
                     referrerPolicy="no-referrer" 
                     onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />`
);
fs.writeFileSync(file, content);
