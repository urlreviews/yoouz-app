const fs = require('fs');
let c = fs.readFileSync('src/components/CopoCreatorDrawer.tsx', 'utf8');

c = c.replace(
    '              }}> \n {isOwner && (',
    '              }} /> \n {isOwner && ('
);

c = c.replace(
    /onError=\{\(e\)\s*=>\s*\{\s*\(e\.currentTarget\s*as\s*HTMLImageElement\)\.src\s*=\s*\`\/api\/avatar\?name=\$\{encodeURIComponent\(currentUser\?\.name\s*\|\|\s*"User"\)\}&background=27272a&color=fff\`\s*;\s*\}\}\>\s*\n\s*\<div/g,
    'onError={(e) => { (e.currentTarget as HTMLImageElement).src = `/api/avatar?name=${encodeURIComponent(currentUser?.name || "User")}&background=27272a&color=fff`; }} /> \n <div'
);

fs.writeFileSync('src/components/CopoCreatorDrawer.tsx', c, 'utf8');
