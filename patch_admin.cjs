const fs = require('fs');
const file = './src/components/CopoAdminPanel.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '<p className="text-xs text-zinc-400 truncate">@{user.handle}</p>',
  ''
);
fs.writeFileSync(file, content);
