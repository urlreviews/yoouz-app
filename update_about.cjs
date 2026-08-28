const fs = require('fs');
let content = fs.readFileSync('src/components/CopoPlaceDrawer.tsx', 'utf-8');

const mapBlock = `              {/* Maps Integration */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-zinc-800">Location Map</h4>
                  <button onClick={handleOpenDirections} className="text-[10px] text-[#1a73e8] font-bold hover:underline flex items-center gap-1">
                    <Navigation className="w-3 h-3" />
                    Get Directions
                  </button>
                </div>
                <div className="w-full h-[200px] rounded-2xl overflow-hidden border border-zinc-200/80 bg-zinc-50 cursor-pointer relative group" onClick={handleOpenDirections}>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors z-10 flex items-center justify-center pointer-events-none">
                     <div className="bg-white px-3 py-1.5 rounded-full shadow-lg text-[10px] font-bold text-[#1a73e8] opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">Open in Maps</div>
                  </div>
                  <iframe 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    style={{ border: 0, pointerEvents: 'none' }} 
                    referrerPolicy="no-referrer-when-downgrade" 
                    src={\`https://maps.google.com/maps?q=\${encodeURIComponent(place.name + ', ' + (place.address || place.city || ''))}&t=&z=14&ie=UTF8&iwloc=&output=embed\`}
                    title="Google Maps Location"
                  />
                </div>
                {place.address && (
                   <div className="flex items-start gap-2 mt-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                     <MapPin className="w-4 h-4 text-[#1a73e8] shrink-0 mt-0.5" />
                     <p className="text-xs text-zinc-700 font-medium">{place.address}</p>
                   </div>
                )}
              </div>

              <div className="pt-2 space-y-2">`;

content = content.replace(/<div className="pt-2 space-y-2">/, mapBlock);
fs.writeFileSync('src/components/CopoPlaceDrawer.tsx', content, 'utf-8');
console.log("Map block added to about tab");
