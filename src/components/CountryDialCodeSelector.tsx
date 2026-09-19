import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check, Phone } from "lucide-react";
import { countryDialData, CountryDialInfo, getCountryDialInfo } from "../utils/countries";

interface CountryDialCodeSelectorProps {
  value: string; // e.g. "+1", "+212", "+44"
  selectedCountry?: string; // Optional country name to prioritize matching
  onChange: (dialCode: string, country?: CountryDialInfo) => void;
  className?: string;
}

export const CountryDialCodeSelector: React.FC<CountryDialCodeSelectorProps> = ({
  value,
  selectedCountry,
  onChange,
  className = ""
}) => {
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

  // Find active country dial info based on dialCode and selectedCountry
  const activeDialInfo = React.useMemo(() => {
    if (selectedCountry) {
      const match = countryDialData.find(
        (c) => c.name.toLowerCase() === selectedCountry.toLowerCase()
      );
      if (match && (!value || match.dialCode === value)) return match;
    }
    if (value) {
      const match = countryDialData.find((c) => c.dialCode === value);
      if (match) return match;
    }
    return getCountryDialInfo(selectedCountry || "United States");
  }, [value, selectedCountry]);

  // Alphabetical list of countries (A-Z order)
  const sortedCountries = React.useMemo(() => {
    return [...countryDialData].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Filter countries by name or dial code
  const filteredCountries = React.useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return sortedCountries;
    return sortedCountries.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.dialCode.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query)
    );
  }, [search, sortedCountries]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        id="btn-select-dial-code"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch("");
        }}
        className="w-full flex items-center justify-between gap-1.5 bg-zinc-950 hover:bg-zinc-900/80 border border-zinc-800 rounded-2xl px-3 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500 transition-all cursor-pointer select-none"
        title="Select country dialing code"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base leading-none shrink-0" aria-hidden="true">
            {activeDialInfo?.flag || "🌐"}
          </span>
          <span className="text-sm font-bold text-white tracking-wide shrink-0">
            {value || activeDialInfo?.dialCode || "+1"}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 top-full mt-1.5 w-72 sm:w-80 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
          {/* Search Header */}
          <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-zinc-800 bg-zinc-900/60">
            <Search className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              type="text"
              value={search}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country or code (e.g. +212, UK)..."
              className="w-full bg-transparent border-0 p-0 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-0 font-medium"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-[11px] text-zinc-400 hover:text-white font-medium"
              >
                Clear
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-56 overflow-y-auto py-1 scrollbar-thin divide-y divide-zinc-900/50">
            {filteredCountries.length === 0 ? (
              <div className="px-4 py-4 text-xs text-zinc-400 text-center font-medium">
                No matching country found
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = value === c.dialCode && (!selectedCountry || selectedCountry === c.name);
                return (
                  <button
                    key={`${c.code}-${c.dialCode}`}
                    type="button"
                    onClick={() => {
                      onChange(c.dialCode, c);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-zinc-800/90 text-white"
                        : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base leading-none shrink-0">{c.flag}</span>
                      <span className="truncate font-medium text-zinc-200">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono font-bold text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                        {c.dialCode}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-zinc-300" />}
                    </div>
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
