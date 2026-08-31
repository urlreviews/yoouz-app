const { State, City } = require('country-state-city');
const states = State.getStatesOfCountry('BE');
console.log("BE States:", states.map(s => s.name));
const allCities = City.getCitiesOfCountry('BE');
console.log("Is Eupen there?", allCities.some(c => c.name.toLowerCase().includes('eupen')));
console.log("Is Sankt Vith there?", allCities.some(c => c.name.toLowerCase().includes('vith')));
