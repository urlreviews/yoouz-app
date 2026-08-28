import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

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

  // Deduplicate options to prevent duplicates like multiple "Springfield" records
  const uniqueOptions = Array.from(new Set(options));

  const filteredOptions = uniqueOptions.filter((option) =>
    option.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-3.5 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all placeholder:text-zinc-400 font-medium text-zinc-200"
        />
        {options.length > 0 && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center text-zinc-400 hover:text-zinc-400 transition-colors cursor-pointer"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        )}
      </div>

      {isOpen && options.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-1 duration-150 overflow-hidden">
          <div className="max-h-40 overflow-y-auto py-1 scrollbar-thin">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-2.5 text-xs text-zinc-400 italic font-medium">
                Type to add custom location...
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value.toLowerCase() === option.toLowerCase();
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
                        ? "bg-blue-950/50 text-blue-400 font-semibold"
                        : "text-zinc-300 hover:bg-zinc-800"
                    }`}
                  >
                    <span>{option}</span>
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
