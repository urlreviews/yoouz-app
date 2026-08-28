const fs = require('fs');
const file = './src/components/CopoCreatorDrawer.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `<div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <h2 className="text-xl font-black text-white md:text-zinc-900 tracking-tight leading-tight flex items-center gap-1.5 truncate">
                <span className="truncate">{isOwner && currentUser ? currentUser.name : author.name}</span>
                <CheckCircle className="w-4 h-4 fill-[#1a73e8] text-white shrink-0" />
              </h2>`;

const replace = `<div className="flex items-start justify-between">
            <div className="min-w-0 pr-2 pt-1">
              <h2 className="text-xl font-black text-white md:text-zinc-900 tracking-tight leading-tight flex flex-wrap items-center gap-1.5">
                <span className="break-words max-w-full" style={{ wordBreak: 'break-word' }}>{isOwner && currentUser ? currentUser.name : author.name}</span>
                <CheckCircle className="w-4 h-4 fill-[#1a73e8] text-white shrink-0 mt-0.5" />
              </h2>`;

content = content.replace(target, replace);
fs.writeFileSync(file, content);
console.log("Patched");
