import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check, Globe } from "lucide-react";
import { countries, getCountryDialInfo } from "../utils/countries";

interface CountrySelectorProps {
  value: string;
  onChange: (country: string) => void;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filteredCountries = countries.filter((country) =>
    country.toLowerCase().includes(search.toLowerCase())
  );

  const selectedInfo = value ? getCountryDialInfo(value) : null;

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch("");
        }}
        className="w-full flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm hover:bg-zinc-900/50 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all text-left cursor-pointer"
      >
        <div className="flex items-center gap-2 text-zinc-200">
          {selectedInfo?.flag ? (
            <span className="text-base leading-none shrink-0">{selectedInfo.flag}</span>
          ) : (
            <Globe className="w-4 h-4 text-zinc-400 shrink-0" />
          )}
          <span className={value ? "text-zinc-200 font-medium" : "text-zinc-400"}>
            {value || "Select Country..."}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-1 duration-150 overflow-hidden">
          {/* Search Box */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 bg-zinc-950/50">
            <Search className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search countries..."
              className="w-full bg-transparent border-0 p-0 text-xs text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-0 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* List */}
          <div className="max-h-48 overflow-y-auto py-1 scrollbar-thin">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 flex items-center justify-between cursor-pointer"
            >
              <span>None / Not Specified</span>
              {!value && <Check className="w-3.5 h-3.5 text-zinc-400" />}
            </button>

            {filteredCountries.length === 0 ? (
              <div className="px-4 py-3 text-xs text-zinc-400 text-center font-medium">
                No countries found
              </div>
            ) : (
              filteredCountries.map((country) => {
                const isSelected = value === country;
                const info = getCountryDialInfo(country);
                return (
                  <button
                    key={country}
                    type="button"
                    onClick={() => {
                      onChange(country);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-blue-950/50 text-blue-400 font-semibold"
                        : "text-zinc-300 hover:bg-zinc-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{info.flag || "🌐"}</span>
                      <span>{country}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
