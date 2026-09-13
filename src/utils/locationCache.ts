import { Country, State, City } from "country-state-city";

const countriesCache = Country.getAllCountries();
const statesCache = new Map<string, any[]>();
const stateCitiesCache = new Map<string, any[]>();
const countryCitiesCache = new Map<string, any[]>();

export const cachedCountry = {
  getAllCountries: () => countriesCache,
};

export const cachedState = {
  getStatesOfCountry: (isoCode: string) => {
    if (!isoCode) return [];
    if (statesCache.has(isoCode)) return statesCache.get(isoCode)!;
    const states = State.getStatesOfCountry(isoCode) || [];
    statesCache.set(isoCode, states);
    return states;
  },
};

export const cachedCity = {
  getCitiesOfState: (countryCode: string, stateCode: string) => {
    const key = `${countryCode}_${stateCode}`;
    if (stateCitiesCache.has(key)) return stateCitiesCache.get(key)!;
    const cities = City.getCitiesOfState(countryCode, stateCode) || [];
    stateCitiesCache.set(key, cities);
    return cities;
  },
  getCitiesOfCountry: (isoCode: string) => {
    if (!isoCode) return [];
    if (countryCitiesCache.has(isoCode)) return countryCitiesCache.get(isoCode)!;
    const cities = City.getCitiesOfCountry(isoCode) || [];
    const limited = cities.slice(0, 500);
    countryCitiesCache.set(isoCode, limited);
    return limited;
  },
};
