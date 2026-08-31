const { City } = require('country-state-city');
const cities = City.getCitiesOfCountry('BE');
console.log("Blankenberge in BE?", cities.some(c => c.name.includes('Blankenberge')));
console.log("How many cities in BE?", cities.length);
