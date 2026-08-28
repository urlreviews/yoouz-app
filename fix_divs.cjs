const fs = require('fs');
let code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');

const target = `                      </div>
                      </div>
                    </div>

                    {/* Dispatch Action Buttons */}`;
const replace = `                      </div>

                    {/* Dispatch Action Buttons */}`;

code = code.replace(target, replace);
fs.writeFileSync('src/components/CopoBusinessDashboardView.tsx', code);
