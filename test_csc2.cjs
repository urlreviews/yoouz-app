const { Country, State, City } = require('country-state-city');

const uk = Country.getAllCountries().find(c => c.name === 'United Kingdom');
console.log('UK ISO:', uk.isoCode);
console.log('UK all cities (first 10):', City.getCitiesOfCountry(uk.isoCode).slice(0, 10).map(c => c.name));

const il = Country.getAllCountries().find(c => c.name === 'Israel');
console.log('IL all cities (first 10):', City.getCitiesOfCountry(il.isoCode).slice(0, 10).map(c => c.name));
