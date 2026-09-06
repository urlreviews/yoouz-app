import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";

interface SearchableComboSelectorProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
}

export const SearchableComboSelector: React.FC<SearchableComboSelectorProps> = ({
  value,
  onChange,
  options,
  placeholder,
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

  const uniqueOptions = Array.from(new Set(options));
  const filteredOptions = uniqueOptions.filter((option) =>
    option.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch("");
        }}
        className="w-full flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm hover:bg-zinc-900/50 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-zinc-700 transition-all text-left cursor-pointer min-h-[44px]"
      >
        <span className={value ? "text-zinc-200 font-medium" : "text-zinc-200 font-medium"}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-zinc-200 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-1 duration-150 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 bg-zinc-950/50">
            <Search className="w-4 h-4 text-zinc-200 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              autoComplete="new-password"
              autoCorrect="off"
              spellCheck={false}
              className="w-full bg-transparent border-0 p-0 text-xs text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-0 focus:border-transparent"
              autoFocus
            />
          </div>

          <div className="max-h-48 overflow-y-auto py-1 scrollbar-thin">
            {search.trim().length > 0 && !filteredOptions.some(opt => opt.toLowerCase() === search.trim().toLowerCase()) && (
              <button
                type="button"
                onClick={() => {
                  onChange(search.trim());
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer text-zinc-200 hover:bg-zinc-850"
              >
                <span className="font-semibold text-emerald-400">Use "{search.trim()}"</span>
              </button>
            )}

            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-xs text-zinc-200 text-center font-medium italic">
                Press "Use" above to add custom location.
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      onChange(option);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-zinc-800 text-white font-semibold"
                        : "text-zinc-200 hover:bg-zinc-850"
                    }`}
                  >
                    <span>{option}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
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
