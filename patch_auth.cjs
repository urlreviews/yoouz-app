const fs = require('fs');

function patchAuthModal() {
    let code = fs.readFileSync('src/components/CopoGoogleAuthModal.tsx', 'utf8');
    
    // Find the render block starting from {country && (() => { up to })]}
    const regex = /\{country && \(\(\) => \{[\s\S]*?const countryConfig = locationData\[country\];[\s\S]*?let cityOptions: string\[\] = \[\];[\s\S]*?\} else \{[\s\S]*?setCity\(""\);[\s\S]*?\}\)\]\}[\s\S]*?<\/>/;
    
    const replacement = `{country && (() => {
              const selectedCountryObj = Country.getAllCountries().find(c => c.name === country);
              const isoCode = selectedCountryObj?.isoCode || "";
              
              const statesObj = State.getStatesOfCountry(isoCode);
              const hasStates = statesObj.length > 0;
              const stateOptions = statesObj.map(s => s.name);
              const stateLabel = "Region / Province";
              
              let cityOptions: string[] = [];
              if (stateRegion) {
                const selectedState = statesObj.find(s => s.name === stateRegion);
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
                          value={stateRegion}
                          onChange={(val) => {
                            setStateRegion(val);
                            setCity(""); // Reset city when region changes
                          }}
                          options={stateOptions}
                          placeholder={stateLabel}
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide pl-1 block">City</span>
                        <SearchableComboSelector
                          value={city}
                          onChange={setCity}
                          options={uniqueCityOptions}
                          placeholder="Select City"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2 space-y-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide pl-1 block">City</span>
                      <SearchableComboSelector
                        value={city}
                        onChange={setCity}
                        options={uniqueCityOptions}
                        placeholder="Select City"
                      />
                    </div>
                  )}
                </div>
              );
            })}`;
            
    // Actually replace it (I'll do string replacement to be safer since the regex might be tricky)
    const startIndex = code.indexOf('{country && (() => {');
    const endIndex = code.indexOf('          {error && (');
    
    if (startIndex !== -1 && endIndex !== -1) {
        const toReplace = code.substring(startIndex, endIndex);
        code = code.replace(toReplace, replacement + '\n\n');
        fs.writeFileSync('src/components/CopoGoogleAuthModal.tsx', code);
        console.log("Patched Auth Modal successfully");
    } else {
        console.log("Could not find Auth Modal boundaries");
    }
}

patchAuthModal();
