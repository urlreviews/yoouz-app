const { State, City } = require('country-state-city');
const states = State.getStatesOfCountry('BE');
states.forEach(s => {
    console.log(s.name, City.getCitiesOfState('BE', s.isoCode).length);
});
