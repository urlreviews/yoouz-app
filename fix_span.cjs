const fs = require('fs');
let c = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');

c = c.replace(
    /<span className="w-3\.5 h-3\.5 rounded-full border border-zinc-700 shadow-2xs" style=\{\{\s*backgroundColor:\s*c\.hex\s*\}\}\>\s*\n\s*\<span\>\{c\.name\}\<\/span\>/g,
    '<span className="w-3.5 h-3.5 rounded-full border border-zinc-700 shadow-2xs" style={{ backgroundColor: c.hex }} />\n                              <span>{c.name}</span>'
);

// Also check the dashboard's chart style tag that I broke earlier and tried to fix?
// Let's see if there are any other `}}> \n <span` that should be `}} /> \n <span`
// Actually, earlier the build error in Dashboard was resolved. So let's just do this span.

fs.writeFileSync('src/components/CopoBusinessDashboardView.tsx', c, 'utf8');
