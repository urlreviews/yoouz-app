const fs = require('fs');

const files = [
  './src/components/CopoBookmarksView.tsx',
  './src/components/CopoNotificationsView.tsx',
  './src/components/CopoMessagesView.tsx',
  './src/App.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replaceAll(
    `className="flex-1 h-full overflow-y-auto bg-zinc-950 md:bg-white text-white md:text-zinc-900 flex flex-col justify-between"`,
    `className="flex-1 h-full overflow-y-auto bg-zinc-950 md:bg-white text-white md:text-zinc-900 flex flex-col justify-between pb-32 md:pb-6"`
  );
  content = content.replaceAll(
    `className="flex-1 h-full overflow-y-auto bg-zinc-950 md:bg-white flex flex-col justify-between"`,
    `className="flex-1 h-full overflow-y-auto bg-zinc-950 md:bg-white flex flex-col justify-between pb-32 md:pb-6"`
  );
  fs.writeFileSync(file, content);
  console.log("Patched", file);
});
