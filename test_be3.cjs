const { City } = require('country-state-city');
const eupen = City.getCitiesOfCountry('BE').filter(c => c.name.toLowerCase().includes('eupen'));
console.log("Eupen:", eupen);
const vith = City.getCitiesOfCountry('BE').filter(c => c.name.toLowerCase().includes('vith'));
console.log("Vith:", vith);
