const fs = require('fs');
let code = fs.readFileSync('src/components/CopoCreatorDrawer.tsx', 'utf8');

const startIndex = code.indexOf('{editCountry && (() => {');
const endIndexStr = '})()}';
const endOffset = code.indexOf(endIndexStr, startIndex);

if (startIndex !== -1 && endOffset !== -1) {
    const toReplace = code.substring(startIndex, endOffset + endIndexStr.length);
    const replacement = `{editCountry && (() => {
                  const selectedCountryObj = Country.getAllCountries().find(c => c.name === editCountry);
                  const isoCode = selectedCountryObj?.isoCode || "";
                  
                  const statesObj = State.getStatesOfCountry(isoCode);
                  const hasStates = statesObj.length > 0;
                  const stateOptions = statesObj.map(s => s.name);
                  const stateLabel = "Region / Province";
                  
                  let cityOptions: string[] = [];
                  if (editState) {
                    const selectedState = statesObj.find(s => s.name === editState);
                    if (selectedState) {
                       const stateCities = City.getCitiesOfState(isoCode, selectedState.isoCode).map(c => c.name);
                       cityOptions = stateCities.length > 0 ? stateCities : (City.getCitiesOfCountry(isoCode)?.map(c => c.name) || []);
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
                                setEditCity(""); // Reset city when region changes
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
                              placeholder="Select City"
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
                            placeholder="Select City"
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}`;
                
    code = code.replace(toReplace, replacement);
    fs.writeFileSync('src/components/CopoCreatorDrawer.tsx', code);
    console.log("Patched Creator Drawer successfully");
} else {
    console.log("Could not find boundaries", startIndex, endOffset);
}
