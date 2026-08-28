const fs = require('fs');
let code = fs.readFileSync('src/components/CopoMobileSearchView.tsx', 'utf8');

const replacement = `              {/* Banner Top */}
              <div className="h-32 bg-zinc-950 relative flex items-center justify-center overflow-hidden">
                {searchedPlace.bannerUrl ? (
                  <>
                    <img 
                      src={searchedPlace.bannerUrl} 
                      alt="Banner" 
                      className="absolute inset-0 w-full h-full object-cover opacity-50"
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent z-10" />
                  </>
                ) : (
                  <div className="w-full h-full bg-zinc-900 relative flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950 opacity-80" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent" />
                  </div>
                )}
              </div>`;

const regex = /\s*\{\/\* Banner Top \*\/\}\s*<div className="h-32 bg-slate-950 relative flex items-center justify-center overflow-hidden">[\s\S]*?(?=\s*\{\/\* Card Body \*\/\})/m;

code = code.replace(regex, "\n" + replacement + "\n\n");
fs.writeFileSync('src/components/CopoMobileSearchView.tsx', code);
