const fs = require('fs');
let code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');

code = code.replace('{embedShowVerifiedBadge && (', '{true && (');
code = code.replace('{embedShowStars && (', '{true && (');

// Let's also restore the font text colors to white/zinc-200.
code = code.replace('text-zinc-950">{currentPlace.name}</span>', 'text-white">{currentPlace.name}</span>');
code = code.replace('text-zinc-950">4.9</span>', 'text-white">4.9</span>');
code = code.replace('text-zinc-500">•</span>', 'text-zinc-400">•</span>');
code = code.replace('text-zinc-700 text-[10px]">', 'text-zinc-300 text-[10px]">');

fs.writeFileSync('src/components/CopoBusinessDashboardView.tsx', code);
console.log("Success patch4");
