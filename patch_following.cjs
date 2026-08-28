const fs = require('fs');
const file = './src/components/CopoFollowingView.tsx';
let content = fs.readFileSync(file, 'utf8');

const target1 = `<div className="flex-1 h-full overflow-y-auto bg-zinc-950 md:bg-zinc-50 text-white md:text-zinc-900 p-3.5 sm:p-6 select-none" style={{ paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}>
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">`;
const replace1 = `<div className="flex-1 h-full overflow-y-auto bg-zinc-950 md:bg-zinc-50 text-white md:text-zinc-900 p-3.5 sm:p-6 select-none">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-32 md:pb-6">`;

content = content.replace(target1, replace1);

const targetUnauth = `<div className="flex-1 h-full overflow-y-auto bg-zinc-950 md:bg-white text-white md:text-zinc-900 flex flex-col justify-between" style={{ paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}>`;
const replaceUnauth = `<div className="flex-1 h-full overflow-y-auto bg-zinc-950 md:bg-white text-white md:text-zinc-900 flex flex-col justify-between pb-32 md:pb-6">`;
content = content.replace(targetUnauth, replaceUnauth);

fs.writeFileSync(file, content);
console.log("Patched CopoFollowingView scroll");
