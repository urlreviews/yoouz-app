import React, { useState } from "react";
import { X, Search, Check, Globe } from "lucide-react";
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
  const { language, setLanguage, languages, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const filteredLanguages = languages.filter((lang) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      lang.name.toLowerCase().includes(q) ||
      lang.nativeName.toLowerCase().includes(q) ||
      lang.code.toLowerCase().includes(q)
    );
  });

  const handleSelect = (code: SupportedLanguage) => {
    setLanguage(code);
    onClose();
  };

  return (
    <div
      id="language-selector-modal-overlay"
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="language-selector-modal-card"
        className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh] text-white"
        onClick={(e) => e.stopPropagation()}
        dir="ltr"
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/10">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {t("common.select_language", "Select Language")}
            </h2>
          </div>
          <button
            id="close-language-modal-btn"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 sm:p-4 border-b border-zinc-800/80 bg-zinc-950/40">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute top-1/2 -translate-y-1/2 left-3.5 pointer-events-none" />
            <input
              id="language-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("common.search", "Search language...")}
              autoFocus
              className="w-full py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-white transition-colors pl-10 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white right-3 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Languages List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1 custom-scrollbar">
          {filteredLanguages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                id={`lang-btn-${lang.code}`}
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 sm:py-3 rounded-xl transition-all text-left cursor-pointer ${
                  isSelected
                    ? "bg-white text-zinc-950 font-medium shadow-sm"
                    : "bg-transparent hover:bg-zinc-800/70 text-white"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl sm:text-2xl leading-none shrink-0 select-none">
                    {lang.flag}
                  </span>
                  <div className="min-w-0">
                    <div className={`text-sm leading-tight truncate ${isSelected ? "font-bold text-zinc-950" : "font-semibold text-white"}`}>
                      {lang.nativeName}
                    </div>
                    {lang.name !== lang.nativeName && (
                      <div className={`text-xs truncate leading-tight mt-0.5 ${isSelected ? "text-zinc-600 font-medium" : "text-zinc-400"}`}>
                        {lang.name}
                      </div>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-zinc-950 text-white flex items-center justify-center shrink-0 ml-2">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}

          {filteredLanguages.length === 0 && (
            <div className="py-12 text-center text-zinc-400 text-sm">
              No language found for &quot;{searchQuery}&quot;
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-950/40 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer"
          >
            {t("common.close", "Close")}
          </button>
        </div>
      </div>
    </div>
  );
};
