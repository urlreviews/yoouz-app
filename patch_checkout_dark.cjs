const fs = require('fs');
const file = './src/components/CopoCreemCheckoutModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace Top White Header Section with Dark Header Section
const oldHeader = `{/* Top White Header Section */}
            <div className="bg-white px-8 pt-8 pb-7 text-center relative">
              <button 
                onClick={onClose}
                className="absolute right-5 top-5 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#d1f4e0] text-[#0a6c38] rounded-full text-[11px] font-bold mb-5">
                <Lock className="w-3.5 h-3.5" /> creem.io secure checkout
              </div>
              
              <h2 className="text-[40px] font-black text-black tracking-tight leading-none mb-2 flex items-center justify-center gap-2">
                {price} <span className="text-lg font-bold text-zinc-500 mt-2">/ month</span>
              </h2>
              
              <p className="text-[13px] text-zinc-500 font-medium">
                Yoouz {planName} • <span className="text-[#0a6c38] font-bold">Cancel anytime</span>
              </p>
            </div>`;

const newHeader = `{/* Top Dark Header Section */}
            <div className="bg-[#18181b] px-8 pt-8 pb-7 text-center relative border-b border-white/[0.04]">
              <button 
                onClick={onClose}
                className="absolute right-5 top-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[11px] font-bold mb-5">
                <Lock className="w-3.5 h-3.5" /> creem.io secure checkout
              </div>
              
              <h2 className="text-[40px] font-black text-white tracking-tight leading-none mb-2 flex items-center justify-center gap-2">
                {price} <span className="text-lg font-bold text-zinc-500 mt-2">/ month</span>
              </h2>
              
              <p className="text-[13px] text-zinc-400 font-medium">
                Yoouz {planName} • <span className="text-emerald-400 font-bold">Cancel anytime</span>
              </p>
            </div>`;

content = content.replace(oldHeader, newHeader);
fs.writeFileSync(file, content);
console.log('Patched header to dark mode');
