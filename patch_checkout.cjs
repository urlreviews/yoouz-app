const fs = require('fs');
const file = './src/components/CopoCreemCheckoutModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// The modal container: `<div className="w-full max-w-[420px] rounded-[32px] overflow-hidden shadow-2xl relative z-10 flex flex-col bg-[#141416] ring-1 ring-white/[0.05] animate-in slide-in-from-bottom-8 duration-300">`
// We need to add `max-h-[95vh]` to this container, and wrap the inside content (except success screen maybe, or whole content) in an `overflow-y-auto` div or make the container itself scrollable.

content = content.replace(
  'animate-in slide-in-from-bottom-8 duration-300">',
  'animate-in slide-in-from-bottom-8 duration-300 max-h-[95vh]">'
);

content = content.replace(
  '<div className="bg-[#141416] p-7 space-y-6">',
  '<div className="bg-[#141416] p-7 space-y-6 overflow-y-auto custom-scrollbar flex-1">'
);

fs.writeFileSync(file, content);
console.log('patched checkout modal');
