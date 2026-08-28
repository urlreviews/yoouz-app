const fs = require('fs');
const file = './src/components/CopoBusinessAuthLanding.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldHeader = `<header className="w-full flex items-center justify-between p-4 sm:p-6 border-b border-white/[0.04] bg-[#09090b]">
        <div 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#1a73e8] shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform text-white">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg text-white font-['Google_Sans',sans-serif] tracking-tight">Yoouz</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-400 text-[10.5px] font-bold uppercase tracking-wider border border-blue-900/50">
              Business
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleLaunchDemo('rustic')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/80 hover:bg-blue-900/30 text-blue-400 text-xs font-semibold transition-all cursor-pointer active:scale-95 border border-blue-900/50/50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Try Demo</span>
          </button>

          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>
        </div>
      </header>`;

const newHeader = `<header className="w-full flex items-center justify-between p-4 sm:p-6 border-b border-white/[0.04] bg-[#09090b]">
        <div 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative flex items-center justify-center w-[42px] h-[42px] rounded-[14px] bg-[#1a73e8] shadow-[0_4px_12px_rgba(26,115,232,0.35)] group-hover:shadow-[0_6px_16px_rgba(26,115,232,0.45)] group-hover:-translate-y-0.5 transition-all duration-300 shrink-0 border border-white/10">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <div className="flex flex-col justify-center pt-0.5 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-white text-[23px] font-black tracking-tight leading-none font-['Google_Sans',sans-serif]">
                Yoouz
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[9px] text-[#1a73e8] font-black uppercase tracking-wider scale-90 origin-left">
                Business
              </span>
            </div>
            <span className="text-[11.5px] text-zinc-400 font-medium tracking-tight mt-1 whitespace-nowrap flex items-center gap-1.5">
              Manage your verified listing
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>
        </div>
      </header>`;

content = content.replace(oldHeader, newHeader);
fs.writeFileSync(file, content);
console.log('Patched auth header');
