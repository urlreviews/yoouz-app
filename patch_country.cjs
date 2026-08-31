const fs = require('fs');
let code = fs.readFileSync('src/components/CopoGoogleAuthModal.tsx', 'utf8');

// 1. Initial State
code = code.replace(/const \[country, setCountry\] = useState<string>\("United States"\);/g, 'const [country, setCountry] = useState<string>("");');

// 2. TempUser check
code = code.replace(/if \(returnedUser\?\.country\) setCountry\(returnedUser\.country \|\| "United States"\);/g, 'if (returnedUser?.country) setCountry(returnedUser.country || "");');

// 3. handleSaveProfile check
const saveProfileRegex = /const handleSaveProfile = async \(e\?: React\.FormEvent\) => \{\n\s*if \(e\) e\.preventDefault\(\);\n\s*setIsLoading\(true\);\n\s*setErrorMessage\(""\);/;

const saveProfileReplacement = `const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!country.trim()) {
      setErrorMessage("Please select your country to continue.");
      return;
    }
    
    setIsLoading(true);
    setErrorMessage("");`;

if (saveProfileRegex.test(code)) {
    code = code.replace(saveProfileRegex, saveProfileReplacement);
} else {
    console.log("saveProfileRegex not found");
}

// 4. finalCountry
code = code.replace(/const finalCountry = country\.trim\(\) \|\| "United States";/g, 'const finalCountry = country.trim();');

fs.writeFileSync('src/components/CopoGoogleAuthModal.tsx', code);
console.log("Patched country logic in CopoGoogleAuthModal");
