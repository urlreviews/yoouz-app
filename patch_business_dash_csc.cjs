const fs = require('fs');
let code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');

// 1. Add the import
if (!code.includes('import { Country, State, City } from "country-state-city";')) {
    code = code.replace(/import \{ locationData \} from '\.\.\/utils\/locationData';/, 'import { locationData } from "../utils/locationData";\nimport { Country, State, City } from "country-state-city";');
}

// 2. Replace the handleCountryChange logic
const handleCountryRegex = /const countryConfig = locationData\[c\];[\s\S]*?setZipCode\(''\);\n    \}/;

const handleCountryReplacement = `const selectedCountry = Country.getAllCountries().find(countryObj => countryObj.name === c);
    if (selectedCountry) {
      const statesObj = State.getStatesOfCountry(selectedCountry.isoCode);
      if (statesObj.length > 0) {
        setStateRegion(statesObj[0].name);
        const citiesObj = City.getCitiesOfState(selectedCountry.isoCode, statesObj[0].isoCode);
        setCity(citiesObj[0]?.name || '');
      } else {
        setStateRegion('');
        const citiesObj = City.getCitiesOfCountry(selectedCountry.isoCode);
        setCity(citiesObj[0]?.name || '');
      }
    } else {
      setStateRegion('');
      setCity('');
    }

    if (c !== 'United States' && zipCode === '10001') {
      setZipCode('');
    }`;

code = code.replace(handleCountryRegex, handleCountryReplacement);

// 3. Replace the activeCountryConfig derived state logic
const activeCountryRegex = /\/\/ Dynamic location options derived from locationData[\s\S]*?cityOptions = Object\.values\(activeCountryConfig\.cities\)\.flat\(\);\n      \}\n    \}\n  \}/;

const activeCountryReplacement = `// Dynamic location options derived from country-state-city
  const activeCountryObj = Country.getAllCountries().find(c => c.name === selectedCountry);
  const isoCode = activeCountryObj?.isoCode || "";
  
  const statesObj = State.getStatesOfCountry(isoCode);
  const hasStates = statesObj.length > 0;
  const stateLabel = "Country / Region";
  const stateOptions = statesObj.map(s => s.name);
  
  let cityOptions: string[] = [];
  if (stateRegion) {
    const selectedState = statesObj.find(s => s.name === stateRegion);
    if (selectedState) {
       cityOptions = City.getCitiesOfState(isoCode, selectedState.isoCode).map(c => c.name);
    } else {
       cityOptions = City.getCitiesOfCountry(isoCode)?.map(c => c.name) || [];
    }
  } else {
    cityOptions = City.getCitiesOfCountry(isoCode)?.map(c => c.name) || [];
  }
  
  cityOptions = Array.from(new Set(cityOptions));`;

code = code.replace(activeCountryRegex, activeCountryReplacement);

fs.writeFileSync('src/components/CopoBusinessDashboardView.tsx', code);
console.log("Patched CopoBusinessDashboardView.tsx successfully.");
