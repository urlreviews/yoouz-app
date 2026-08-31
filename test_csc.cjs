const { Country, State, City } = require('country-state-city');

const uk = Country.getAllCountries().find(c => c.name === 'United Kingdom');
console.log('UK ISO:', uk.isoCode);

const states = State.getStatesOfCountry(uk.isoCode);
console.log('UK States (first 5):', states.slice(0, 5).map(s => s.name));

const firstState = states[0];
const cities = City.getCitiesOfState(uk.isoCode, firstState.isoCode);
console.log('Cities in', firstState.name, ':', cities.slice(0, 5).map(c => c.name));

const israel = Country.getAllCountries().find(c => c.name === 'Israel');
console.log('Israel States:', State.getStatesOfCountry(israel.isoCode).slice(0,5).map(s => s.name));

