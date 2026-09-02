const fs = require('fs');

function fix(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/style=\{\{([^}]+)\}\}\s*\/\>/g, 'style={{$1}}>');
  
  // What about spans that WERE self-closing? 
  // `<span className="w-3.5 h-3.5 rounded-full border border-zinc-700 shadow-2xs" style={{ backgroundColor: c.hex }}>`
  // That will be `>` now instead of `/>`. Is that an issue? React requires closing `</span>`.
  // Wait, I will just fix the ones that are `<div` or `<nav`.
  content = content.replace(/(<(?:div|nav)[^>]*?style=\{\{[^}]+\}\})\s*\/\>/g, '$1>');
  
  fs.writeFileSync(file, content, 'utf8');
}

['src/components/CopoSidebar.tsx', 'src/components/CopoCommentsDrawer.tsx', 'src/components/CopoBookmarksView.tsx', 'src/components/CopoBusinessDashboardView.tsx'].forEach(fix);
