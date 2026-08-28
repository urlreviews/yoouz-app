const fs = require('fs');
const file = './src/components/CopoBusinessDashboardView.tsx';
let content = fs.readFileSync(file, 'utf8');

const startTag = "{activeTab === 'profile' && (";
const endTag = "{/* TAB 7: SUBSCRIPTION & CREEM.IO */}";

const startIndex = content.indexOf(startTag);
const endIndex = content.indexOf(endTag);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find boundaries.");
  process.exit(1);
}

const replacement = `
            {activeTab === 'profile' && (
              <div className="space-y-8 animate-in fade-in duration-200 pb-12 max-w-6xl mx-auto">
                
                {/* 10/10 iOS-Style Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Venue Profile Settings</h2>
                    <p className="text-sm text-zinc-400 mt-1">Configure your official public listing details and appearance.</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {isProfileSaved && (
                      <span className="text-[13px] font-bold text-emerald-400 flex items-center gap-1.5 animate-in zoom-in-95">
                        <CheckCircle2 className="w-4 h-4" /> Saved
                      </span>
                    )}
                    <button
                      onClick={handleSaveProfile}
                      className="px-6 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-full text-[13px] font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                  {/* Left Column: Form Controls (7 cols) */}
                  <div className="lg:col-span-7 space-y-10">
                    
                    {/* SECTION 1: Business Identity */}
                    <div>
                      <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5" /> Business Identity
                      </h3>
                      <div className="bg-[#111113] rounded-[24px] border border-white/[0.08] overflow-hidden divide-y divide-white/[0.06] shadow-sm">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center p-4 sm:p-5 hover:bg-white/[0.02] transition-colors group focus-within:bg-white/[0.02]">
                          <div className="w-48 text-[13px] font-semibold text-zinc-300 mb-2 sm:mb-0 shrink-0">Venue Name</div>
                          <input
                            type="text"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            placeholder="e.g. The Rustic Spoon"
                            className="flex-1 bg-transparent text-[13px] font-semibold text-white placeholder-zinc-600 focus:outline-none"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center p-4 sm:p-5 hover:bg-white/[0.02] transition-colors relative">
                          <div className="w-48 text-[13px] font-semibold text-zinc-300 mb-2 sm:mb-0 shrink-0">Category</div>
                          <div className="flex-1 w-full relative">
                            <select
                              value={businessCategory}
                              onChange={(e) => setBusinessCategory(e.target.value)}
                              className="bg-transparent text-[13px] font-semibold text-white appearance-none cursor-pointer focus:outline-none w-full"
                            >
                              <option value="Dining & Artisanal Food">Dining & Artisanal Food</option>
                              <option value="Hospitality & Hotels">Hospitality & Hotels</option>
                              <option value="Services & Home Trades">Services & Home Trades</option>
                              <option value="Health, Beauty & Wellness">Health, Beauty & Wellness</option>
                              <option value="Retail & Local Boutique">Retail & Local Boutique</option>
                              <option value="Professional, Legal & Finance">Professional, Legal & Finance</option>
                              <option value="Digital Platform & E-Commerce">Digital Platform & E-Commerce</option>
                              <option value="Automotive & Transportation">Automotive & Transportation</option>
                              <option value="Entertainment & Venues">Entertainment & Venues</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-zinc-600 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center p-4 sm:p-5 hover:bg-white/[0.02] transition-colors group focus-within:bg-white/[0.02]">
                          <div className="w-48 text-[13px] font-semibold text-zinc-300 mb-2 sm:mb-0 shrink-0">Website URL</div>
                          <input
                            type="url"
                            value={profileWebsite}
                            onChange={(e) => setProfileWebsite(e.target.value)}
                            placeholder="https://yourwebsite.com"
                            className="flex-1 bg-transparent text-[13px] font-semibold text-white placeholder-zinc-600 focus:outline-none"
                          />
                        </div>

                      </div>
                    </div>

                    {/* SECTION 2: Physical Address */}
                    <div>
                      <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5" /> Physical Address
                      </h3>
                      <div className="bg-[#111113] rounded-[24px] border border-white/[0.08] overflow-hidden divide-y divide-white/[0.06] shadow-sm">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center p-4 sm:p-5 hover:bg-white/[0.02] transition-colors relative">
                          <div className="w-48 text-[13px] font-semibold text-zinc-300 mb-2 sm:mb-0 shrink-0">Country / Region</div>
                          <div className="flex-1 w-full relative">
                            <CountrySelector
                              value={selectedCountry}
                              onChange={handleCountryChange}
                            />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center p-4 sm:p-5 hover:bg-white/[0.02] transition-colors group focus-within:bg-white/[0.02]">
                          <div className="w-48 text-[13px] font-semibold text-zinc-300 mb-2 sm:mb-0 shrink-0">Street Address</div>
                          <input
                            type="text"
                            value={streetAddress}
                            onChange={(e) => setStreetAddress(e.target.value)}
                            placeholder="e.g. 123 Main St, Suite 400"
                            className="flex-1 bg-transparent text-[13px] font-semibold text-white placeholder-zinc-600 focus:outline-none"
                          />
                        </div>

                        {hasStates && (
                          <div className="flex flex-col sm:flex-row sm:items-center p-4 sm:p-5 hover:bg-white/[0.02] transition-colors relative">
                            <div className="w-48 text-[13px] font-semibold text-zinc-300 mb-2 sm:mb-0 shrink-0">{stateLabel}</div>
                            <div className="flex-1 w-full relative">
                              <SearchableComboSelector
                                value={stateRegion}
                                onChange={(val) => {
                                  setStateRegion(val);
                                  if (activeCountryConfig && !Array.isArray(activeCountryConfig.cities) && activeCountryConfig.cities) {
                                    const allowedCities = activeCountryConfig.cities[val] || [];
                                    const primaryCity = allowedCities.find(c => c.toLowerCase() === val.toLowerCase());
                                    if (primaryCity) {
                                      setCity(primaryCity);
                                    } else if (allowedCities.length > 0) {
                                      setCity(allowedCities[0]);
                                    } else if (city && !allowedCities.includes(city)) {
                                      setCity("");
                                    }
                                  }
                                }}
                                options={stateOptions}
                                placeholder={\`Select \${stateLabel}\`}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center p-4 sm:p-5 hover:bg-white/[0.02] transition-colors relative">
                          <div className="w-48 text-[13px] font-semibold text-zinc-300 mb-2 sm:mb-0 shrink-0">City</div>
                          <div className="flex-1 w-full relative">
                            <SearchableComboSelector
                              value={city}
                              onChange={setCity}
                              options={cityOptions}
                              placeholder={
                                cityOptions.length > 0
                                  ? \`e.g. \${cityOptions[0]}\`
                                  : stateRegion
                                    ? \`e.g. City in \${stateRegion}\`
                                    : "e.g. New York"
                              }
                            />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center p-4 sm:p-5 hover:bg-white/[0.02] transition-colors group focus-within:bg-white/[0.02]">
                          <div className="w-48 text-[13px] font-semibold text-zinc-300 mb-2 sm:mb-0 shrink-0">{activeCountryDialInfo.postalLabel || "ZIP Code"}</div>
                          <input
                            type="text"
                            value={zipCode}
                            onChange={(e) => setZipCode(e.target.value)}
                            placeholder={activeCountryDialInfo.postalPlaceholder || "e.g. 10001"}
                            className="flex-1 bg-transparent text-[13px] font-semibold text-white placeholder-zinc-600 focus:outline-none"
                          />
                        </div>

                      </div>
                    </div>

                    {/* SECTION 3: Phone Contact */}
                    <div>
                      <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5" /> Contact Information
                      </h3>
                      <div className="bg-[#111113] rounded-[24px] border border-white/[0.08] overflow-hidden divide-y divide-white/[0.06] shadow-sm">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center p-4 sm:p-5 hover:bg-white/[0.02] transition-colors relative">
                          <div className="w-48 text-[13px] font-semibold text-zinc-300 mb-2 sm:mb-0 shrink-0">Dialing Code</div>
                          <div className="flex-1 w-full relative">
                            <select
                              value={phoneDialCode}
                              onChange={(e) => setPhoneDialCode(e.target.value)}
                              className="bg-transparent text-[13px] font-semibold text-white appearance-none cursor-pointer focus:outline-none w-full"
                            >
                              {countryDialData.map((item) => (
                                <option key={\`\${item.code}-\${item.dialCode}-\${item.name}\`} value={item.dialCode}>
                                  {item.flag} {item.dialCode} ({item.name})
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-zinc-600 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center p-4 sm:p-5 hover:bg-white/[0.02] transition-colors group focus-within:bg-white/[0.02]">
                          <div className="w-48 text-[13px] font-semibold text-zinc-300 mb-2 sm:mb-0 shrink-0">Direct Number</div>
                          <input
                            type="tel"
                            value={localPhone}
                            onChange={(e) => setLocalPhone(e.target.value)}
                            placeholder={activeCountryDialInfo.phonePlaceholder || "e.g. 555-0198"}
                            className="flex-1 bg-transparent text-[13px] font-semibold text-white placeholder-zinc-600 focus:outline-none"
                          />
                        </div>

                      </div>
                    </div>

                    {/* SECTION 4: Operating Hours */}
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 px-1 gap-2">
                         <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                           <Clock className="w-3.5 h-3.5" /> Operating Hours
                         </h3>
                         <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                            <button
                              onClick={() => setWeeklySchedule(prev => prev.map((d, i) => i < 5 ? { ...d, status: 'open', openTime: '08:00 AM', closeTime: '06:00 PM' } : { ...d, status: 'closed' }))}
                              className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-[10px] font-bold transition-colors cursor-pointer uppercase tracking-wider shrink-0"
                            >
                              Mon-Fri
                            </button>
                            <button
                              onClick={() => setWeeklySchedule(prev => prev.map(d => ({ ...d, status: 'open', openTime: '11:00 AM', closeTime: '11:00 PM' })))}
                              className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-[10px] font-bold transition-colors cursor-pointer uppercase tracking-wider shrink-0"
                            >
                              Everyday
                            </button>
                            <button
                              onClick={() => setWeeklySchedule(prev => prev.map(d => ({ ...d, status: '24h' })))}
                              className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-[10px] font-bold transition-colors cursor-pointer uppercase tracking-wider shrink-0"
                            >
                              24/7
                            </button>
                         </div>
                      </div>

                      <div className="bg-[#111113] rounded-[24px] border border-white/[0.08] overflow-hidden divide-y divide-white/[0.06] shadow-sm">
                        {weeklySchedule.map((item, idx) => (
                          <div key={item.day} className="flex flex-col lg:flex-row lg:items-center p-4 hover:bg-white/[0.02] transition-colors gap-4">
                             <div className="w-32 text-[13px] font-semibold text-white shrink-0 flex items-center gap-2">
                               <span className={\`w-1.5 h-1.5 rounded-full \${item.status === 'open' ? 'bg-[#1a73e8]' : item.status === '24h' ? 'bg-emerald-500' : 'bg-zinc-700'}\`} />
                               {item.day}
                             </div>
                             
                             <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-3">
                               <div className="flex items-center bg-[#18181b] rounded-lg p-0.5 border border-white/[0.06]">
                                 {(['open', '24h', 'closed'] as const).map(status => (
                                   <button
                                     key={status}
                                     onClick={() => {
                                       const copy = [...weeklySchedule];
                                       copy[idx].status = status;
                                       setWeeklySchedule(copy);
                                     }}
                                     className={\`px-3 py-1.5 rounded-md text-[11px] font-bold capitalize transition-all cursor-pointer \${
                                       item.status === status 
                                         ? status === 'open' ? 'bg-[#1a73e8] text-white shadow-sm' 
                                         : status === '24h' ? 'bg-emerald-600 text-white shadow-sm' 
                                         : 'bg-zinc-700 text-white shadow-sm'
                                         : 'text-zinc-400 hover:text-white'
                                     }\`}
                                   >
                                     {status === '24h' ? '24 Hrs' : status}
                                   </button>
                                 ))}
                               </div>

                               {item.status === 'open' && (
                                 <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
                                   <div className="relative">
                                     <select
                                       value={item.openTime}
                                       onChange={(e) => {
                                         const copy = [...weeklySchedule];
                                         copy[idx].openTime = e.target.value;
                                         setWeeklySchedule(copy);
                                       }}
                                       className="bg-[#18181b] border border-white/[0.08] text-white rounded-lg pl-3 pr-7 py-2 text-[12px] font-semibold appearance-none focus:outline-none focus:border-[#1a73e8]/50"
                                     >
                                       {['06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM'].map(t => <option key={t} value={t}>{t}</option>)}
                                     </select>
                                     <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                   </div>
                                   <span className="text-zinc-500 text-[11px] font-bold">to</span>
                                   <div className="relative">
                                     <select
                                       value={item.closeTime}
                                       onChange={(e) => {
                                         const copy = [...weeklySchedule];
                                         copy[idx].closeTime = e.target.value;
                                         setWeeklySchedule(copy);
                                       }}
                                       className="bg-[#18181b] border border-white/[0.08] text-white rounded-lg pl-3 pr-7 py-2 text-[12px] font-semibold appearance-none focus:outline-none focus:border-[#1a73e8]/50"
                                     >
                                       {['05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM', '11:59 PM'].map(t => <option key={t} value={t}>{t}</option>)}
                                     </select>
                                     <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                   </div>
                                 </div>
                               )}
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SECTION 5: About & Amenities */}
                    <div>
                      <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                        <Info className="w-3.5 h-3.5" /> About & Amenities
                      </h3>
                      <div className="bg-[#111113] rounded-[24px] border border-white/[0.08] overflow-hidden divide-y divide-white/[0.06] shadow-sm">
                        
                        <div className="p-4 sm:p-5 hover:bg-white/[0.02] transition-colors focus-within:bg-white/[0.02]">
                          <div className="flex items-center justify-between mb-3">
                             <div className="text-[13px] font-semibold text-zinc-300">Public Story & Description</div>
                             <span className="text-[10px] text-zinc-500 font-mono">{profileDesc.length} / 500</span>
                          </div>
                          <textarea
                            value={profileDesc}
                            onChange={(e) => setProfileDesc(e.target.value)}
                            maxLength={500}
                            placeholder="Tell visitors what makes your venue special..."
                            className="w-full bg-[#18181b] border border-white/[0.06] rounded-xl p-4 text-[13px] text-white placeholder-zinc-600 focus:outline-none focus:border-[#1a73e8]/50 resize-none h-28 leading-relaxed font-medium"
                          />
                        </div>

                        <div className="p-4 sm:p-5">
                          <div className="text-[13px] font-semibold text-zinc-300 mb-4">Venue Amenities</div>
                          <div className="flex flex-wrap gap-2">
                            {['Free Wi-Fi', 'Outdoor Seating', 'Onsite Parking', 'Wheelchair Accessible', 'Pet Friendly', 'Live Music', 'Full Bar', 'Accepts Credit Cards'].map(amenity => {
                              const isSelected = selectedAmenities.includes(amenity);
                              return (
                                <button
                                  key={amenity}
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedAmenities(prev => prev.filter(a => a !== amenity));
                                    } else {
                                      setSelectedAmenities(prev => [...prev, amenity]);
                                    }
                                  }}
                                  className={\`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer border \${
                                    isSelected
                                      ? 'bg-blue-600/20 border-blue-500/50 text-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.1)]'
                                      : 'bg-[#18181b] border-white/[0.06] text-zinc-400 hover:bg-white/[0.04]'
                                  }\`}
                                >
                                  {isSelected && <Check className="w-3 h-3 inline-block mr-1 -mt-0.5" />}
                                  {amenity}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>

                  {/* Right Column: Premium Live Mobile Preview Widget (5 cols) */}
                  <div className="lg:col-span-5 relative">
                    <div className="sticky top-24">
                      
                      <div className="bg-[#111113] rounded-[36px] border border-white/[0.08] shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden relative">
                         {/* Subtle Glow */}
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-40 bg-[#1a73e8]/10 blur-[60px] rounded-full pointer-events-none" />
                         
                         {/* Header */}
                         <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between relative z-10 bg-[#111113]/80 backdrop-blur-xl">
                           <div className="flex items-center gap-2">
                             <Eye className="w-4 h-4 text-blue-400" />
                             <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-300">Live Preview</span>
                           </div>
                           <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">Yoouz App</span>
                         </div>

                         {/* Mobile Card Replica */}
                         <div className="p-6 bg-[#000000] min-h-[500px]">
                           <div className="bg-[#111113] rounded-[28px] border border-white/[0.08] p-5 shadow-2xl relative overflow-hidden ring-1 ring-white/[0.02]">
                              
                              {/* Preview Head */}
                              <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-[18px] bg-[#18181b] border border-white/[0.1] flex items-center justify-center text-2xl font-black text-white shrink-0 overflow-hidden shadow-inner">
                                  {currentPlace.logoUrl ? (
                                    <img src={currentPlace.logoUrl} className="w-full h-full object-cover" />
                                  ) : (
                                    (profileName.charAt(0).toUpperCase() || 'B')
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <h4 className="font-bold text-white text-lg truncate tracking-tight">{profileName || 'Venue Name'}</h4>
                                    <BadgeCheck className="w-4.5 h-4.5 text-blue-400 shrink-0" />
                                  </div>
                                  <div className="text-[11px] text-zinc-400 font-semibold mt-0.5 uppercase tracking-widest">{businessCategory || 'Category'}</div>
                                </div>
                              </div>

                              <div className="space-y-3">
                                {/* Map Preview */}
                                <div className="bg-[#18181b] p-4 rounded-[20px] border border-white/[0.04] shadow-sm">
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                                    </div>
                                    <div>
                                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Physical Location</div>
                                      <div className="text-[13px] font-semibold text-zinc-200 leading-snug">{profileAddress || 'Address will appear here'}</div>
                                    </div>
                                  </div>
                                </div>

                                {/* Status & Phone Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-[#18181b] p-4 rounded-[20px] border border-white/[0.04] shadow-sm">
                                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Status</div>
                                    <div className="text-[12px] font-bold text-emerald-400 flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Open Now
                                    </div>
                                  </div>
                                  <div className="bg-[#18181b] p-4 rounded-[20px] border border-white/[0.04] shadow-sm overflow-hidden">
                                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Direct Line</div>
                                    <div className="text-[12px] font-bold text-white truncate">{profilePhone || 'Not set'}</div>
                                  </div>
                                </div>

                                {/* Hours */}
                                <div className="bg-[#18181b] p-4 rounded-[20px] border border-white/[0.04] shadow-sm">
                                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Schedule</div>
                                  <div className="text-[12px] text-zinc-300 leading-relaxed font-mono font-medium">{profileHours || 'Schedule not configured'}</div>
                                </div>

                                {/* About */}
                                {profileDesc && (
                                  <div className="bg-[#18181b] p-4 rounded-[20px] border border-white/[0.04] shadow-sm">
                                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Story</div>
                                    <div className="text-[12.5px] text-zinc-300 leading-relaxed font-medium line-clamp-4">{profileDesc}</div>
                                  </div>
                                )}
                              </div>
                           </div>
                         </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            )}
`;

const newContent = content.slice(0, startIndex) + replacement + content.slice(endIndex);

fs.writeFileSync(file, newContent);
console.log('Successfully patched activeTab profile with 10/10 design.');
