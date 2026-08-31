const fs = require('fs');
let code = fs.readFileSync('src/components/CopoGoogleAuthModal.tsx', 'utf8');

const regex = /const handleSaveProfile = async \(e\?: React\.FormEvent, skip: boolean = false\) => \{[\s\S]*?verifiedAt: new Date\(\)\.toISOString\(\)\n    \};/;

const newCode = `const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    const fName = firstName.trim() || email.split('@')[0];
    const lName = lastName.trim();
    const fullName = lName ? \`\${fName} \${lName}\` : fName;
    const finalCity = city.trim();
    const finalState = stateRegion.trim();
    const finalCountry = country.trim() || "United States";
    const locParts = [finalCity, finalState, finalCountry].filter(Boolean);
    const combinedLocation = locParts.join(", ");

    const avatarSvg = generateGoogleLetterAvatarSvg(fName || email.split("@")[0] || "Y", 128, email);

    const updatedUser = {
      uid: tempUser?.uid || \`usr_\${email.replace(/[^a-zA-Z0-9]/g, '_')}\`,
      id: tempUser?.uid || \`usr_\${email.replace(/[^a-zA-Z0-9]/g, '_')}\`,
      email: email.trim().toLowerCase(),
      name: fullName,
      firstName: fName,
      lastName: lName,
      city: finalCity,
      country: finalCountry,
      location: combinedLocation,
      avatar: tempUser?.avatar || avatarSvg,
      role: 'user',
      verifiedAt: new Date().toISOString()
    };`;

code = code.replace(regex, newCode);
fs.writeFileSync('src/components/CopoGoogleAuthModal.tsx', code);
