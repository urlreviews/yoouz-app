        {/* Top Header */}
        <header className="w-full h-20 bg-white border-b border-zinc-200/90 px-4 sm:px-8 flex items-center justify-between shrink-0 z-40 relative">
          {/* Left: Location Selector */}
          <div className="flex items-center">
            {/* Location Dropdown - Pill style */}
            <div className="relative">
              <button 
                onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full border border-zinc-200 hover:bg-zinc-50 transition-all text-left bg-white shadow-xs"
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  {currentPlace.logoUrl ? (
                    <img src={currentPlace.logoUrl} className="w-5 h-5 object-contain" />
                  ) : (
                    <Building2 className="w-5 h-5 text-[#1a73e8]" />
                  )}
                </div>
                <div className="hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-zinc-900 text-[15px]">{currentPlace.name}</span>
                    {currentPlace.isClaimed && <BadgeCheck className="w-4 h-4 text-[#1a73e8]" />}
                  </div>
                  <span className="text-xs text-zinc-500 font-medium">Verified Location</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-400 ml-2 transition-transform ${isLocationDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isLocationDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-zinc-200 py-2 z-50">
                  <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Your Businesses
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto">
                    {businessPlaces.map(place => (
                      <button
                        key={place.id}
                        onClick={() => {
                          setSelectedPlaceId(place.id);
                          setIsLocationDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors text-left ${
                          selectedPlaceId === place.id ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center shrink-0 p-1">
                          {place.logoUrl ? (
                            <img src={place.logoUrl} className="w-full h-full object-contain" />
                          ) : (
                            <Building2 className="w-4 h-4 text-zinc-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-zinc-900 text-sm truncate">{place.name}</div>
                          <div className="text-[10px] text-zinc-500 truncate">{place.address}</div>
                        </div>
                        {selectedPlaceId === place.id && (
                          <Check className="w-4 h-4 text-[#1a73e8] shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="p-2 border-t border-zinc-100 mt-2">
                    <button 
                      onClick={() => { setIsClaiming(true); setIsLocationDropdownOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-[#1a73e8] hover:bg-blue-50 rounded-xl transition-colors"
                    >
                      <Building2 className="w-4 h-4" />
                      Claim Another Business
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Action Tools */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Quick Actions (Pills) */}
            {currentPlan === 'free' ? (
              <button 
                onClick={() => setIsPricingModalOpen(true)}
                className="hidden lg:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-zinc-800 to-zinc-900 text-white rounded-full text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                Upgrade to Pro
              </button>
            ) : (
              <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-zinc-100 border border-zinc-200 rounded-full">
                <Shield className="w-4 h-4 text-[#1a73e8]" />
                <span className="text-sm font-bold text-zinc-800 tracking-wide">PRO TIER</span>
                <div className="w-2 h-2 rounded-full bg-emerald-500 ml-1" />
              </div>
            )}

            <button className="hidden xl:flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-full text-sm font-bold text-zinc-700 transition-colors">
              <Eye className="w-4 h-4 text-zinc-500" />
              Public Listing
            </button>

            <button onClick={() => onNavigate('home')} className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-black text-white rounded-full text-sm font-bold shadow-sm transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Exit to Feed
            </button>

            <div className="w-px h-6 bg-zinc-200 mx-1 hidden sm:block" />

            {/* Icons */}
            <button 
              className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unrepliedReviewsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
              )}
            </button>

            <button 
              className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors hidden sm:block"
              title="Help & Support"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* User Profile */}
            <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 border border-zinc-200 rounded-full hover:bg-zinc-50 transition-colors bg-white">
              <div className="w-8 h-8 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-sm font-bold shadow-sm">
                {currentUser?.avatar ? (
                   <img src={currentUser.avatar} className="w-full h-full rounded-full object-cover" />
                ) : (
                  (currentUser?.name?.charAt(0).toLowerCase() || 'u')
                )}
              </div>
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            </button>

          </div>
        </header>
