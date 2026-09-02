const fs = require('fs');
const path = 'src/components/CopoCreatorDrawer.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /<img src=\{editAvatar \|\| currentUser\?\.avatar\} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" referrerPolicy="no-referrer" \/>/g,
  `<img src={editAvatar || currentUser?.avatar || \`/api/avatar?name=\${encodeURIComponent(currentUser?.name || "User")}&background=27272a&color=fff\`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" referrerPolicy="no-referrer" onError={(e) => { (e.currentTarget as HTMLImageElement).src = \`/api/avatar?name=\${encodeURIComponent(currentUser?.name || "User")}&background=27272a&color=fff\`; }} />`
);

fs.writeFileSync(path, content, 'utf8');
