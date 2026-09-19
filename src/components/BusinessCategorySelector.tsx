import React, { useState, useEffect } from "react";
import { Building2, ChevronDown, Check, Sparkles, Edit3 } from "lucide-react";

interface BusinessCategorySelectorProps {
  value: string;
  onChange: (category: string) => void;
}

export const PRESET_CATEGORIES = [
  "Technology & Software",
  "Dining & Artisanal Food",
  "Coffee, Cafes & Bakeries",
  "Nightlife, Bars & Lounges",
  "Hospitality & Hotels",
  "Retail & Local Boutiques",
  "Health, Beauty & Wellness",
  "Fitness & Sports Venues",
  "Entertainment & Venues",
  "Corporate, Legal & Agency",
  "Services & Home Trades",
  "Automotive & Mobility",
  "Custom Category"
];

export const BusinessCategorySelector: React.FC<BusinessCategorySelectorProps> = ({
  value,
  onChange,
}) => {
  const isCustomInitially = Boolean(value && !PRESET_CATEGORIES.includes(value));
  const [selectedPreset, setSelectedPreset] = useState<string>(
    isCustomInitially ? "Custom Category" : value || ""
  );
  const [customText, setCustomText] = useState<string>(
    isCustomInitially ? value : ""
  );

  useEffect(() => {
    if (value && !PRESET_CATEGORIES.includes(value)) {
      setSelectedPreset("Custom Category");
      setCustomText(value);
    } else if (value) {
      setSelectedPreset(value);
    }
  }, [value]);

  const handleSelectPreset = (preset: string) => {
    setSelectedPreset(preset);
    if (preset === "Custom Category") {
      onChange(customText || "");
    } else {
      onChange(preset);
    }
  };

  const handleCustomChange = (text: string) => {
    setCustomText(text);
    onChange(text);
  };

  const isCustomMode = selectedPreset === "Custom Category";

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-zinc-400" /> Business Category
        </label>
        {value && (
          <span className="text-[10px] font-bold text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded-full border border-zinc-700/60">
            {value}
          </span>
        )}
      </div>

      {/* Preset Category Dropdown Selector */}
      <div className="relative">
        <select
          id="select-profile-category"
          value={selectedPreset}
          onChange={(e) => handleSelectPreset(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-sm font-semibold text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500 transition-all pr-10"
        >
          <option value="" className="bg-zinc-900 text-zinc-500">
            Select Category...
          </option>
          {PRESET_CATEGORIES.map((cat) => (
            <option key={cat} value={cat} className="bg-zinc-900 text-white font-medium">
              {cat === "Custom Category" ? "✏️ Custom Category (Type your own...)" : cat}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* Custom Category Input if selected "Custom Category" */}
      {isCustomMode && (
        <div className="space-y-1.5 pt-1 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-1 pl-1">
              <Edit3 className="w-3 h-3 text-zinc-400" /> Type Exact Business Category
            </span>
            <span className="text-[10px] text-zinc-400">{customText.length} / 50</span>
          </div>
          <input
            type="text"
            id="input-profile-custom-category"
            value={customText}
            onChange={(e) => handleCustomChange(e.target.value.slice(0, 50))}
            placeholder="e.g. Technology Company, AI Research Studio, Specialty Matcha Bar..."
            className="w-full bg-zinc-950 border border-zinc-700/90 rounded-2xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-zinc-400 transition-all placeholder:text-zinc-500"
            autoFocus
          />
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-[10px] text-zinc-400 font-medium pl-1">Quick Suggestions:</span>
            {["Technology Company", "AI Software", "Specialty Coffee Roaster", "Boutique Fitness"].map((sugg) => (
              <button
                key={sugg}
                type="button"
                onClick={() => handleCustomChange(sugg)}
                className="text-[10px] font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-2 py-0.5 rounded-lg border border-zinc-800 transition-colors cursor-pointer"
              >
                {sugg}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
