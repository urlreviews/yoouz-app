const { State, City } = require('country-state-city');
const states = State.getStatesOfCountry('BE');

const wallonia = states.find(s => s.name === 'Wallonia');
const liege = states.find(s => s.name === 'Liège');

console.log("Cities in Wallonia region:", City.getCitiesOfState('BE', wallonia.isoCode).length);
console.log("Cities in Liege province:", City.getCitiesOfState('BE', liege.isoCode).length);

const eupen = City.getCitiesOfCountry('BE').find(c => c.name.toLowerCase().includes('eupen'));
console.log("Eupen belongs to state code:", eupen.stateCode);

const vith = City.getCitiesOfCountry('BE').find(c => c.name.toLowerCase().includes('vith'));
console.log("Sankt Vith belongs to state code:", vith.stateCode);
