const fs = require('fs');
const file = './src/components/CopoCreatorDrawer.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `<div className="bg-zinc-900 md:bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-800 md:border-zinc-200 space-y-5 animate-in fade-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>`;
const replace = `<div className="bg-zinc-900 md:bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-800 md:border-zinc-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>`;

content = content.replace(target, replace);
fs.writeFileSync(file, content);
console.log("Patched modal scroll");
