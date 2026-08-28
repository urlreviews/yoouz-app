const fs = require('fs');
let code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');

const regex = /                      \)\}\n                  <\/div>\n                <\/div>\n              <\/div>\n            \)\}\n\n        \{\/\* TAB 5/;
const replace = `                      )}
                  </div>
                </div>
              </div>
            </div>
            )}

        {/* TAB 5`;

code = code.replace(regex, replace);
fs.writeFileSync('src/components/CopoBusinessDashboardView.tsx', code);
