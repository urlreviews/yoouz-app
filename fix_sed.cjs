const fs = require('fs');
let code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');
code = code.replace(/                      \)\}\n                  <\/div>/g, '                      )}');
fs.writeFileSync('src/components/CopoBusinessDashboardView.tsx', code);
