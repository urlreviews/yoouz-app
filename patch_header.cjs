const fs = require('fs');
const file = './src/components/CopoBusinessDashboardView.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `<div className="flex items-center gap-2">
                            <h3 className="text-sm md:text-base font-bold text-white md:text-white">`;
const replace = `<div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm md:text-base font-bold text-white md:text-white">`;

content = content.replace(target, replace);
fs.writeFileSync(file, content);
console.log('Patched header wrap');
