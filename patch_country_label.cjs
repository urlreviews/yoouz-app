const fs = require('fs');
let code = fs.readFileSync('src/components/CopoGoogleAuthModal.tsx', 'utf8');

const regex = /<label className="block text-\[11px\] font-semibold text-zinc-400 mb-1 tracking-wider uppercase">\n\s*Country\n\s*<\/label>/;
const replacement = `<label className="block text-[11px] font-semibold text-zinc-400 mb-1 tracking-wider uppercase">
                Country <span className="text-red-400">*</span>
              </label>`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/components/CopoGoogleAuthModal.tsx', code);
    console.log("Patched Country label");
} else {
    console.log("Regex not found");
}
