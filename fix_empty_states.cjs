const fs = require('fs');

function patchFile(filepath) {
    let code = fs.readFileSync(filepath, 'utf8');
    
    // Pattern we are looking for:
    // cityOptions = City.getCitiesOfState(isoCode, selectedState.isoCode).map(c => c.name);
    const regex = /cityOptions = City\.getCitiesOfState\(isoCode, selectedState\.isoCode\)\.map\(c => c\.name\);/g;
    
    const replacement = `const stateCities = City.getCitiesOfState(isoCode, selectedState.isoCode).map(c => c.name);
                       cityOptions = stateCities.length > 0 ? stateCities : (City.getCitiesOfCountry(isoCode)?.map(c => c.name) || []);`;
                       
    if (code.match(regex)) {
        code = code.replace(regex, replacement);
        fs.writeFileSync(filepath, code);
        console.log("Patched", filepath);
    } else {
        console.log("Not found in", filepath);
    }
}

patchFile('src/components/CopoBusinessDashboardView.tsx');
patchFile('src/components/CopoGoogleAuthModal.tsx');
patchFile('src/components/CopoCreatorDrawer.tsx');
