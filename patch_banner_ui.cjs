const fs = require('fs');
const file = './src/components/CopoCreatorDrawer.tsx';
let content = fs.readFileSync(file, 'utf8');

const bannerUI = `              {/* Banner Photo Uploader */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative group cursor-pointer w-full" onClick={() => bannerInputRef.current?.click()}>
                  <div className="w-full h-32 rounded-2xl overflow-hidden border-2 border-indigo-600 shadow-md relative bg-zinc-950 md:bg-zinc-100">
                    {editBanner || currentUser?.banner ? (
                      <img src={editBanner || currentUser?.banner} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-zinc-950 md:bg-gradient-to-r md:from-blue-600 md:via-indigo-600 md:to-blue-800" />
                    )}
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Camera className="w-6 h-6" />
                    </div>
                  </div>
                  <button type="button" className="absolute bottom-2 right-2 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-colors cursor-pointer"><Camera className="w-3.5 h-3.5" /></button>
                  <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={handleBannerChange} />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-zinc-200 md:text-zinc-700">Cover Banner</span>
                  <p className="text-[10px] text-zinc-400">Click to upload a custom JPG or PNG</p>
                </div>
                {bannerError && <p className="text-xs text-red-400 md:text-red-500 font-semibold">{bannerError}</p>}
              </div>`;

content = content.replace('              {/* Name Field (Read-only) */}', bannerUI + '\n              {/* Name Field (Read-only) */}');
fs.writeFileSync(file, content);
console.log("Patched banner ui");
