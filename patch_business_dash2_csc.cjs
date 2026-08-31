const fs = require('fs');
let code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');

const regex = /onChange=\{\(val\) => \{[\s\S]*?setStateRegion\(val\);[\s\S]*?if \(activeCountryConfig[\s\S]*?\}\n\s*\}\}/;

const replacement = `onChange={(val) => {
                                  setStateRegion(val);
                                  setCity("");
                                }}`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/components/CopoBusinessDashboardView.tsx', code);
    console.log("Patched CopoBusinessDashboardView.tsx onChange successfully.");
} else {
    console.log("Regex not found in CopoBusinessDashboardView.tsx");
}
