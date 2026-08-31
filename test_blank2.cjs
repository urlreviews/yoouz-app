const { City, State } = require('country-state-city');
const cities = City.getCitiesOfCountry('BE').filter(c => c.name.includes('Blankenberge'));
console.log("Blankenberge details:", cities);
const state = State.getStateByCodeAndCountry(cities[0].stateCode, 'BE');
console.log("State:", state);
