const fs = require('fs');
const file = './src/components/CopoBusinessDashboardView.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace Notifications dropdown position
const notifTarget = `<div className="absolute top-full -right-16 sm:right-0 mt-2 w-[calc(100vw-32px)] sm:w-80 max-w-[360px] bg-zinc-900 rounded-2xl border border-zinc-800 text-white shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">`;
const notifReplace = `<div className="fixed top-[72px] left-4 right-4 sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:left-auto sm:mt-2 sm:w-80 bg-zinc-900 rounded-2xl border border-zinc-800 text-white shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">`;
content = content.replace(notifTarget, notifReplace);

// Replace Account dropdown position to match style for mobile if needed, though w-64 right-0 works. 
// Let's also fix Account dropdown to look consistent on mobile.
const accountTarget = `<div className="absolute top-full right-0 mt-2 w-64 bg-zinc-900 md:bg-zinc-950 rounded-2xl border border-zinc-800 text-white shadow-xl border border-zinc-800 md:border-zinc-800 py-2 z-50 animate-in fade-in text-zinc-200 md:text-white">`;
const accountReplace = `<div className="fixed top-[72px] right-4 w-[280px] sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:mt-2 sm:w-64 bg-zinc-900 rounded-2xl border border-zinc-800 text-white shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">`;
content = content.replace(accountTarget, accountReplace);

fs.writeFileSync(file, content);
console.log('Patched position');
