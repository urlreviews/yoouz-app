const fs = require('fs');
let code = fs.readFileSync('src/components/CopoGoogleAuthModal.tsx', 'utf8');

const importRegex = /import React, \{ useState \} from 'react';/;
if (importRegex.test(code)) {
    code = code.replace(importRegex, "import React, { useState, useEffect } from 'react';");
}

const functionStartRegex = /export default function CopoGoogleAuthModal\(\{\s*onClose,\s*onSuccess,\s*isFullPage = false,\s*initialIntent = 'general'\s*\}\: CopoGoogleAuthModalProps\) \{/;

const hookReplacement = `export default function CopoGoogleAuthModal({
  onClose,
  onSuccess,
  isFullPage = false,
  initialIntent = 'general'
}: CopoGoogleAuthModalProps) {
  // Try to pre-fill country based on IP
  useEffect(() => {
    fetch('https://freeipapi.com/api/json')
      .then(res => res.json())
      .then(data => {
        if (data && data.countryName && data.countryName.toLowerCase() !== "unknown") {
          setCountry(data.countryName);
          if (data.cityName) setCity(data.cityName);
        }
      })
      .catch(err => console.warn("Failed to detect IP location:", err));
  }, []);
`;

code = code.replace(functionStartRegex, hookReplacement);

const avatarRegex = /const seedName = firstName \|\| email\.split\('@'\)\[0\] \|\| 'Y';\n\s*const previewLetter = getFirstLetter\(seedName\);\n\s*const previewColor = getAvatarColor\(email \|\| seedName\);/;

const avatarReplacement = `const hasName = firstName && firstName.trim().length > 0;
  const seedName = hasName ? firstName.trim() : 'User';
  const previewLetter = hasName ? getFirstLetter(seedName) : '';
  const previewColor = hasName ? getAvatarColor(seedName) : { bg: '#27272a', text: '#ffffff' };`;

code = code.replace(avatarRegex, avatarReplacement);

fs.writeFileSync('src/components/CopoGoogleAuthModal.tsx', code);
console.log("Patched CopoGoogleAuthModal!");
