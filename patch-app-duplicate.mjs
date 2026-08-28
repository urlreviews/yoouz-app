import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `              onOpenMenu={() => setActiveSection("more")}
              onOpenCreateModal={() => {}}
            />`,
  `              onOpenMenu={() => setActiveSection("more")}
            />`
);

fs.writeFileSync('src/App.tsx', content);
console.log('Removed duplicate onOpenCreateModal');
