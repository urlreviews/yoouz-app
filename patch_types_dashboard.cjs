const fs = require('fs');

// 1. Fix types.ts
let typesContent = fs.readFileSync('./src/types.ts', 'utf8');
typesContent = typesContent.replace(/authorHandle: string;/g, 'authorHandle?: string;');
typesContent = typesContent.replace(/replyToHandle\?: string;/g, '');
typesContent = typesContent.replace(/handle\?: string;/g, '');
typesContent = typesContent.replace(/handle: string;/g, '');
typesContent = typesContent.replace(/isReposted\?: boolean;/g, 'isReposted?: boolean;\n  views?: number;\n  viewsCount?: number;');
fs.writeFileSync('./src/types.ts', typesContent);

// 2. Fix CopoBusinessDashboardView.tsx 
let dashContent = fs.readFileSync('./src/components/CopoBusinessDashboardView.tsx', 'utf8');
// It seems CopoBusinessDashboardView uses `views` on VideoReview
// if the typescript compiler complained about views
dashContent = dashContent.replace(/views: Math.floor/g, 'viewsCount: Math.floor');
dashContent = dashContent.replace(/\.views/g, '.viewsCount');
fs.writeFileSync('./src/components/CopoBusinessDashboardView.tsx', dashContent);

console.log("Patched types and dashboard");
