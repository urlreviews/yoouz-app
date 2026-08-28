const fs = require('fs');
const file = './src/components/CopoBusinessDashboardView.tsx';
let content = fs.readFileSync(file, 'utf8');

const notifTarget = `{showNotificationsDropdown && (
                  <div className="fixed top-[64px] left-4 right-4 sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:left-auto sm:mt-2 sm:w-80 bg-zinc-900 rounded-2xl border border-zinc-800 text-white shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">`;
const notifReplace = `{showNotificationsDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotificationsDropdown(false)} />
                    <div className="fixed top-[64px] left-4 right-4 sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:left-auto sm:mt-2 sm:w-80 bg-zinc-900 rounded-2xl border border-zinc-800 text-white shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">`;
content = content.replace(notifTarget, notifReplace);
content = content.replace('                  </div>\n                )}\n              </div>\n              {/* Profile / Account Control */}', '                  </div>\n                  </>\n                )}\n              </div>\n              {/* Profile / Account Control */}');

const accountTarget = `{showAccountDropdown && (
                  <div className="fixed top-[64px] right-4 w-[280px] sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:mt-2 sm:w-64 bg-zinc-900 rounded-2xl border border-zinc-800 text-white shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">`;
const accountReplace = `{showAccountDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowAccountDropdown(false)} />
                    <div className="fixed top-[64px] right-4 w-[280px] sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:mt-2 sm:w-64 bg-zinc-900 rounded-2xl border border-zinc-800 text-white shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">`;
content = content.replace(accountTarget, accountReplace);
content = content.replace('                  </div>\n                )}\n              </div>\n            </div>', '                  </div>\n                  </>\n                )}\n              </div>\n            </div>');

fs.writeFileSync(file, content);
console.log('Patched backdrops');
