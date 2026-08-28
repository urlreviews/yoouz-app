const fs = require('fs');
const file = './src/components/CopoBusinessDashboardView.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldModal = `{/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-900 rounded-3xl border border-zinc-800 text-white p-6 max-w-lg w-full shadow-2xl border border-zinc-800 relative space-y-4">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-white text-base">Yoouz Business Merchant Guide</h3>
            </div>

            <div className="space-y-3 text-xs text-zinc-400 leading-relaxed max-h-96 overflow-y-auto pr-1">
              <div className="p-3 rounded-xl bg-blue-950/50/60 border border-blue-900/50 space-y-1">
                <strong className="text-white font-bold flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-blue-400" /> Verified Business Status
                </strong>
                <p>Your badge tells consumers that reviews are monitored by the authentic venue operator.</p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <strong className="text-white font-bold flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-purple-600" /> Table Standee QR Codes
                </strong>
                <p>Download the high-resolution QR standee to print and place on customer tables or receipt holders.</p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <strong className="text-white font-bold flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-emerald-600" /> Auto-Sync Web Widget
                </strong>
                <p>Copy the HTML snippet into your WordPress, Squarespace, Shopify, or custom HTML site to showcase video reviews.</p>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 bg-[#1a73e8] text-white font-bold rounded-xl text-xs hover:bg-[#1557b0] transition-colors cursor-pointer"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}`;

const newModal = `{/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-[#1a1a1c] rounded-3xl border border-white/[0.04] text-white p-6 max-w-[420px] w-full shadow-2xl relative flex flex-col gap-5 animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-1 pr-6 mt-1">
              <Sparkles className="w-6 h-6 text-[#1a73e8]" />
              <h3 className="font-bold text-white text-[19px]">Yoouz Business Merchant Guide</h3>
            </div>

            <div className="space-y-4 text-[13px] text-[#a1a1aa] leading-relaxed max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="p-4 rounded-2xl bg-[#1a73e8]/[0.05] border border-[#1a73e8]/30 space-y-1.5">
                <strong className="text-white font-bold flex items-center gap-2.5 text-[15px]">
                  <Star className="w-4 h-4 text-[#1a73e8]" /> Verified Business Status
                </strong>
                <p>Your badge tells consumers that reviews are monitored by the authentic venue operator.</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#000000] border border-white/[0.06] space-y-1.5">
                <strong className="text-white font-bold flex items-center gap-2.5 text-[15px]">
                  <QrCode className="w-4 h-4 text-[#a855f7]" /> Table Standee QR Codes
                </strong>
                <p>Download the high-resolution QR standee to print and place on customer tables or receipt holders.</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#000000] border border-white/[0.06] space-y-1.5">
                <strong className="text-white font-bold flex items-center gap-2.5 text-[15px]">
                  <Code className="w-4 h-4 text-[#10b981]" /> Auto-Sync Web Widget
                </strong>
                <p>Copy the HTML snippet into your WordPress, Squarespace, Shopify, or custom HTML site to showcase video reviews.</p>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-3.5 bg-[#1a73e8] text-white font-bold rounded-2xl text-[14px] hover:bg-[#1557b0] transition-colors cursor-pointer shadow-lg shadow-[#1a73e8]/20 mt-1"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}`;

content = content.replace(oldModal, newModal);
fs.writeFileSync(file, content);
console.log('Patched help modal');
