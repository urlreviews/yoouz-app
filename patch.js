const fs = require('fs');
let code = fs.readFileSync('src/components/CopoMobileSearchView.tsx', 'utf8');

const target = `              {/* Banner Top */}
              <div className="h-32 bg-slate-950 relative flex items-center justify-center overflow-hidden">
                {searchedPlace.bannerUrl ? (
                  <>
                    <img 
                      src={searchedPlace.bannerUrl} 
                      alt="" 
                      className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-125 select-none pointer-events-none" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                    <img 
                      src={searchedPlace.bannerUrl} 
                      alt="Banner" 
                      className="relative z-20 max-h-full max-w-full object-contain p-2" 
                      referrerPolicy="no-referrer" 
                    />
                  <>
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-600 via-indigo-700 to-blue-900 flex items-center justify-center text-white/50 text-xs font-bold uppercase tracking-wider">
                    Verified Web Listing
                  </div>
                )}
              </div>`;

const replacement = `              {/* Banner Top */}
              <div className="h-32 bg-zinc-950 relative flex items-center justify-center overflow-hidden">
                {searchedPlace.bannerUrl ? (
                  <>
                    <img 
                      src={searchedPlace.bannerUrl} 
                      alt="Banner" 
                      className="absolute inset-0 w-full h-full object-cover opacity-70"
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent z-10" />
                  </>
                ) : (
                  <div className="w-full h-full bg-zinc-900 relative flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950 opacity-80" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent" />
                  </div>
                )}
              </div>`;

// Since exact string matching might fail due to trailing spaces, let's use regex
const regex = /\s*\{\/\* Banner Top \*\/\}\s*<div className="h-32 bg-slate-950 relative flex items-center justify-center overflow-hidden">[\s\S]*?(?=\s*\{\/\* Card Body \*\/\})/m;

code = code.replace(regex, "\n" + replacement + "\n\n");
fs.writeFileSync('src/components/CopoMobileSearchView.tsx', code);
