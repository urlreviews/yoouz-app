const fs = require('fs');
let code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');

const regex = /<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}\s*\{\/\* TAB 5: VIDEO CALL-TO-ACTION \(CTA\) \*\/\}/g;
const replace = `</div>
                </div>
              </div>
            )}
            {/* TAB 5: VIDEO CALL-TO-ACTION (CTA) */}`;

code = code.replace(regex, replace);
fs.writeFileSync('src/components/CopoBusinessDashboardView.tsx', code);
