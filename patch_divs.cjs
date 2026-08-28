const fs = require('fs');
let code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');

const target = `              </div>
            </div>
            )}

            {/* TAB 5: VIDEO CALL-TO-ACTION (CTA) */}`;
const replace = `              </div>
            </div>
          </div>
        </div>
        )}

        {/* TAB 5: VIDEO CALL-TO-ACTION (CTA) */}`;

code = code.replace(target, replace);
fs.writeFileSync('src/components/CopoBusinessDashboardView.tsx', code);
