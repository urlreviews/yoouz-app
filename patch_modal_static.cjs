const fs = require('fs');
let code = fs.readFileSync('src/components/CopoGoogleAuthModal.tsx', 'utf8');

const regex = /\{step === 'profile' \? \([\s\S]*?className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold tracking-tight shadow-xl transition-all duration-300 border border-white\/10"[\s\S]*?style=\{\{ backgroundColor: previewColor\.bg, color: previewColor\.text \}\}[\s\S]*?>[\s\S]*?\{previewLetter \? previewLetter : <User className="w-6 h-6 text-zinc-400" \/>\}[\s\S]*?<\/div>[\s\S]*?\) : \(/;

const replacement = `{step === 'profile' ? (
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-zinc-900 border border-zinc-800 shadow-xl">
            <User className="w-6 h-6 text-zinc-400" />
          </div>
        ) : (`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/components/CopoGoogleAuthModal.tsx', code);
    console.log("Patched CopoGoogleAuthModal to have static profile icon!");
} else {
    console.log("Regex not found in CopoGoogleAuthModal.tsx");
}
