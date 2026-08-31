const fs = require('fs');
let code = fs.readFileSync('src/components/CopoGoogleAuthModal.tsx', 'utf8');

const regex = /<form onSubmit=\{\(e\) => handleSaveProfile\(e, false\)\} className="w-full max-w-sm space-y-3\.5 pt-1 text-left">([\s\S]*?)<\/form>/;

const newForm = `<form onSubmit={(e) => handleSaveProfile(e)} className="w-full max-w-sm space-y-3.5 pt-1 text-left">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1 tracking-wider uppercase">
                  First Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Alex"
                  className="w-full h-11 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1 tracking-wider uppercase">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Taylor"
                  className="w-full h-11 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1 tracking-wider uppercase">
                Country
              </label>
              <CountrySelector
                value={country}
                onChange={(c) => {
                  setCountry(c);
                  setCity("");
                  setStateRegion("");
                }}
              />
            </div>

            {country && (() => {
              const countryConfig = locationData[country];
              const hasStates = countryConfig?.hasStates || false;
              const stateLabel = countryConfig?.stateLabel || "State / Prov";
              const stateOptions = countryConfig?.states || [];

              let cityOptions: string[] = [];
              if (countryConfig) {
                if (Array.isArray(countryConfig.cities)) {
                  cityOptions = countryConfig.cities;
                } else {
                  if (stateRegion) {
                    cityOptions = countryConfig.cities[stateRegion] || [];
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
                          value={stateRegion}
                          onChange={(val) => {
                            setStateRegion(val);
                            if (countryConfig && !Array.isArray(countryConfig.cities)) {
                              const allowedCities = countryConfig.cities[val] || [];
                              const primaryCity = allowedCities.find(c => c.toLowerCase() === val.toLowerCase());
                              setCity(primaryCity || allowedCities[0] || "");
                            } else {
                              setCity("");
                            }
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
                          options={cityOptions}
                          placeholder="Select City"
                          disabled={!stateRegion}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2 space-y-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide pl-1 block">City</span>
                      <SearchableComboSelector
                        value={city}
                        onChange={setCity}
                        options={cityOptions}
                        placeholder="Select City"
                      />
                    </div>
                  )}
                </div>
              );
            })()}

            {errorMessage && (
              <div className="p-3 bg-red-950/40 text-red-400 text-xs rounded-xl border border-red-900/40 text-center flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !firstName.trim()}
              className="w-full h-12 rounded-xl bg-white hover:bg-zinc-200 active:bg-zinc-300 text-black font-bold text-[14.5px] shadow-lg shadow-white/5 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-black" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-black" />
                  <span>Complete Profile & Enter</span>
                </>
              )}
            </button>
          </form>`;

if (!regex.test(code)) {
  console.log("Could not find the form block to replace.");
} else {
  code = code.replace(regex, newForm);
  fs.writeFileSync('src/components/CopoGoogleAuthModal.tsx', code);
  console.log("Replaced successfully!");
}
