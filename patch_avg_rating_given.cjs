const fs = require('fs');
let code = fs.readFileSync('src/components/CopoCreatorDrawer.tsx', 'utf8');

code = code.replace('<span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Avg Rating</span>', '<span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Avg Rating Given</span>');

fs.writeFileSync('src/components/CopoCreatorDrawer.tsx', code);
console.log("Patched Avg Rating Given successfully");
