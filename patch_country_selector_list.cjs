const fs = require('fs');
let code = fs.readFileSync('src/components/CountrySelector.tsx', 'utf8');

if (!code.includes('import { Country } from "country-state-city";')) {
    code = code.replace(/import \{ countries, getCountryDialInfo \} from "\.\.\/utils\/countries";/, 'import { countries as oldCountries, getCountryDialInfo } from "../utils/countries";\nimport { Country } from "country-state-city";');
    
    // Replace the filteredCountries logic
    const regex = /const filteredCountries = countries\.filter\(\(country\) =>\n\s*country\.toLowerCase\(\)\.includes\(search\.toLowerCase\(\)\)\n\s*\);/;
    
    const replacement = `const allCountryNames = Country.getAllCountries().map(c => c.name);
  const filteredCountries = allCountryNames.filter((country) =>
    country.toLowerCase().includes(search.toLowerCase())
  );`;
  
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/components/CountrySelector.tsx', code);
    console.log("Patched CountrySelector.tsx to use country-state-city for country list");
}
