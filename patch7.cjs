const fs = require('fs');
let code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');

const target = `
                      <div className="text-[11px] text-zinc-400 mt-4 text-center flex items-center justify-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-zinc-400" />
                        <span>Tap any video thumbnail to test the immersive HD video review player.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
`;
const replacement = `
                      <div className="text-[11px] text-zinc-400 mt-4 text-center flex items-center justify-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-zinc-400" />
                        <span>Tap any video thumbnail to test the immersive HD video review player.</span>
                      </div>
                    </div>
                  </div>
                </div>
            )}
`;
code = code.replace(target, replacement);
fs.writeFileSync('src/components/CopoBusinessDashboardView.tsx', code);
console.log("Success patch7");
