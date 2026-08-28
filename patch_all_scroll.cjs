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
    "style={{ paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}",
    ""
  );
  
  // We also need to add the spacer.
  // For CopoBookmarksView:
  content = content.replaceAll(
    `      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">`,
    `      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-32 md:pb-6">`
  );
  // For CopoNotificationsView:
  content = content.replaceAll(
    `      <div className="max-w-3xl mx-auto space-y-4">`,
    `      <div className="max-w-3xl mx-auto space-y-4 pb-32 md:pb-6">`
  );
  // For CopoMessagesView:
  content = content.replaceAll(
    `      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col space-y-4">`,
    `      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col space-y-4 pb-32 md:pb-6">`
  );

  fs.writeFileSync(file, content);
  console.log("Patched", file);
});
