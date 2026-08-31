const fs = require('fs');
let code = fs.readFileSync('src/components/CopoCreatorDrawer.tsx', 'utf8');

// 1. Add the import
if (!code.includes('import { Country, State, City } from "country-state-city";')) {
    code = code.replace(/import \{ locationData \} from "\.\.\/utils\/locationData";/, 'import { locationData } from "../utils/locationData";\nimport { Country, State, City } from "country-state-city";');
}

// 2. Replace the render logic
const regex = /\{editCountry && \(\(\) => \{[\s\S]*?const countryConfig = locationData\[editCountry\];[\s\S]*?let cityOptions: string\[\] = \[\];[\s\S]*?\}\)\]\}[\s\S]*?<\/>/;

const targetContent = `{editCountry && (() => {
                  const countryConfig = locationData[editCountry];
                  const hasStates = countryConfig?.hasStates || false;
                  const stateLabel = countryConfig?.stateLabel || "State / Prov";
                  const stateOptions = countryConfig?.states || [];

                  let cityOptions: string[] = [];
                  if (countryConfig) {
                    if (Array.isArray(countryConfig.cities)) {
                      cityOptions = countryConfig.cities;
                    } else {
                      if (editState) {
                        cityOptions = countryConfig.cities[editState] || [];
                      } else {
                        cityOptions = Object.values(countryConfig.cities).flat();
                      }
                    }
                  }

                  return (
                    <div className="grid grid-cols-2 gap-3 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                      {hasStates ? (
                        <>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide pl-1 block">{stateLabel}</span>
                            <SearchableComboSelector
                              value={editState}
                              onChange={(val) => {
                                setEditState(val);
                                if (countryConfig && !Array.isArray(countryConfig.cities)) {
                                  const allowedCities = countryConfig.cities[val] || [];
                                  const primaryCity = allowedCities.find(c => c.toLowerCase() === val.toLowerCase());
                                  if (primaryCity) {
                                    setEditCity(primaryCity);
                                  } else if (allowedCities.length === 1) {
                                    setEditCity(allowedCities[0]);
                                  } else if (editCity && !allowedCities.includes(editCity)) {
                                    setEditCity("");
                                  }
                                }
                              }}
                              options={stateOptions}
                              placeholder={stateLabel}
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide pl-1 block">City</span>
                            <SearchableComboSelector
                              value={editCity}
                              onChange={setEditCity}
                              options={cityOptions}
                              placeholder="City"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="col-span-2 space-y-1">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide pl-1 block">City</span>
                          <SearchableComboSelector
                            value={editCity}
                            onChange={setEditCity}
                            options={cityOptions}
                            placeholder="City"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}`;

const replacement = `{editCountry && (() => {
                  const selectedCountry = Country.getAllCountries().find(c => c.name === editCountry);
                  const isoCode = selectedCountry?.isoCode || "";
                  
                  const statesObj = State.getStatesOfCountry(isoCode);
                  const hasStates = statesObj.length > 0;
                  const stateOptions = statesObj.map(s => s.name);
                  const stateLabel = "Country / Region";
                  
                  let cityOptions: string[] = [];
                  if (editState) {
                    const selectedState = statesObj.find(s => s.name === editState);
                    if (selectedState) {
                       cityOptions = City.getCitiesOfState(isoCode, selectedState.isoCode).map(c => c.name);
                    } else {
                       cityOptions = City.getCitiesOfCountry(isoCode)?.map(c => c.name) || [];
                    }
                  } else {
                    cityOptions = City.getCitiesOfCountry(isoCode)?.map(c => c.name) || [];
                  }
                  const uniqueCityOptions = Array.from(new Set(cityOptions));

                  return (
                    <div className="grid grid-cols-2 gap-3 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                      {hasStates ? (
                        <>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide pl-1 block">{stateLabel}</span>
                            <SearchableComboSelector
                              value={editState}
                              onChange={(val) => {
                                setEditState(val);
                                setEditCity("");
                              }}
                              options={stateOptions}
                              placeholder={stateLabel}
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide pl-1 block">City</span>
                            <SearchableComboSelector
                              value={editCity}
                              onChange={setEditCity}
                              options={uniqueCityOptions}
                              placeholder="City"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="col-span-2 space-y-1">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide pl-1 block">City</span>
                          <SearchableComboSelector
                            value={editCity}
                            onChange={setEditCity}
                            options={uniqueCityOptions}
                            placeholder="City"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}`;

code = code.replace(targetContent, replacement);
fs.writeFileSync('src/components/CopoCreatorDrawer.tsx', code);
console.log("Patched CopoCreatorDrawer.tsx successfully.");
