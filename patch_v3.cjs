const fs = require('fs');
const file = './src/components/CopoBusinessDashboardView.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove from header Utility Bar
const headerButtonRegex = /\s*\{\/\* Public Live View \*\/\}\s*<button\s*onClick=\{\(\) => onNavigate\('home'\)\}\s*className="flex items-center gap-1\.5 px-2\.5 sm:px-3 py-1\.5 rounded-xl bg-zinc-900 md:bg-zinc-950 hover:bg-zinc-800 md:hover:bg-zinc-900 border border-zinc-800 md:border-zinc-800 text-zinc-200 md:text-zinc-300 text-xs font-semibold transition-all shrink-0 cursor-pointer active:scale-95"\s*title="View live public profile on Yoouz"\s*>\s*<ExternalLink className="w-3\.5 h-3\.5 text-zinc-400 md:text-zinc-400" \/>\s*<span className="hidden md:inline">View Public Listing<\/span>\s*<span className="md:hidden text-\[11px\]">Listing<\/span>\s*<\/button>/g;
content = content.replace(headerButtonRegex, '');

// 2. Add to Dropdown Menu
const dropdownMenuRegex = /(<div className="h-px bg-zinc-800 md:bg-zinc-900 my-1" \/>\s*<button \s*onClick=\{\(\) => \{)/;
const replacement = `<button 
                      onClick={() => {
                        setShowAccountDropdown(false);
                        onNavigate('home');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-800 md:hover:bg-zinc-800 transition-colors text-left text-xs font-semibold text-zinc-300 md:text-zinc-300 cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4 text-zinc-400" />
                      <span>View Public Listing</span>
                    </button>
                    
                    $1`;
                    
content = content.replace(dropdownMenuRegex, replacement);

fs.writeFileSync(file, content);
console.log('Fixed Top Bar UI issues.');
