const fs = require('fs');
let code = fs.readFileSync('src/components/CopoGoogleAuthModal.tsx', 'utf8');

const regex = /<label className="block text-\[11px\] font-semibold text-zinc-400 mb-1 tracking-wider uppercase">\n\s*Last Name\n\s*<\/label>\n\s*<input\n\s*type="text"\n\s*value=\{lastName\}/;

const replacement = `<label className="block text-[11px] font-semibold text-zinc-400 mb-1 tracking-wider uppercase">
                  Last Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lastName}`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/components/CopoGoogleAuthModal.tsx', code);
    console.log("Patched Last Name successfully");
} else {
    console.log("Regex not found");
}
