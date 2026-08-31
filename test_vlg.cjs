const { City } = require('country-state-city');
const cities = City.getCitiesOfState('BE', 'VLG');
console.log("Number of cities in Flanders:", cities.length);
console.log("Includes Blankenberge?", cities.some(c => c.name === 'Blankenberge'));
