import React, { useState } from "react";
import { X, Search, Check, Globe, Sparkles } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { SupportedLanguage } from "../i18n/translations";

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  isOpen,
  onClose
}) => {
  const { language, setLanguage, languages, t, isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("All");

  if (!isOpen) return null;

  const regions = [
    { id: "All", label: t("region.all", "All") },
    { id: "Americas", label: t("region.americas", "Americas") },
    { id: "Europe", label: t("region.europe", "Europe") },
    { id: "Asia & Pacific", label: t("region.asiaPacific", "Asia & Pacific") },
    { id: "Middle East", label: t("region.middleEast", "Middle East") },
    { id: "Africa", label: t("region.africa", "Africa") },
  ];

  const filteredLanguages = languages.filter((lang) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      lang.name.toLowerCase().includes(q) ||
      lang.nativeName.toLowerCase().includes(q) ||
      lang.code.toLowerCase().includes(q);
    const matchesRegion =
      selectedRegion === "All" || lang.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  const handleSelect = (code: SupportedLanguage) => {
    setLanguage(code);
    onClose();
  };

  return (
    <div
      id="language-selector-modal-overlay"
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="language-selector-modal-card"
        className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh] text-white"
        onClick={(e) => e.stopPropagation()}
        dir="ltr"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/10">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {t("common.select_language", "Select Language & Country")}
              </h2>
              <p className="text-xs text-zinc-400">
                {t("settings.languages_supported", `${languages.length} Global Languages Supported • Instant Switch`)}
              </p>
            </div>
          </div>
          <button
            id="close-language-modal-btn"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Region Tabs */}
        <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/50 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute top-1/2 -translate-y-1/2 left-3.5" />
            <input
              id="language-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("settings.search_languages_input", "Search by language, country, or code (e.g., German, 日本語, Arabic)...")}
              className="w-full py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-white transition-colors pl-10 pr-4"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white right-3.5"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Region Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {regions.map((reg) => (
              <button
                key={reg.id}
                onClick={() => setSelectedRegion(reg.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedRegion === reg.id
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {reg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Languages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
          {filteredLanguages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                id={`lang-btn-${lang.code}`}
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all text-left cursor-pointer ${
                  isSelected
                    ? "bg-white text-zinc-950 font-semibold shadow-md"
                    : "bg-zinc-900/60 hover:bg-zinc-800/80 text-white border border-zinc-800/50"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="text-2xl leading-none shrink-0 select-none">
                    {lang.flag}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm truncate ${isSelected ? "font-bold text-zinc-950" : "font-medium text-white"}`}>
                        {lang.nativeName}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase font-bold ${
                        isSelected ? "bg-zinc-950 text-white" : "bg-zinc-800 text-zinc-400"
                      }`}>
                        {lang.code}
                      </span>
                      {lang.direction === "rtl" && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                            isSelected
                              ? "bg-zinc-950/10 text-zinc-900"
                              : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                          }`}
                        >
                          RTL
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs block truncate ${
                        isSelected ? "text-zinc-700" : "text-zinc-400"
                      }`}
                    >
                      {lang.name} &bull; {lang.region}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-zinc-950 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}

          {filteredLanguages.length === 0 && (
            <div className="py-12 text-center text-zinc-500 text-sm">
              No language matching &quot;{searchQuery}&quot;
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/40 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-zinc-400" />
            <span>{languages.length} {t("common.languagesAvailable", "Languages Available")}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors cursor-pointer"
          >
            {t("common.close", "Close")}
          </button>
        </div>
      </div>
    </div>
  );
};
