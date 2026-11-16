import React, { useState } from "react";
import { triggerHaptic } from "../utils/haptics";

export interface SpecialStarSelectorProps {
  value: number; // Whole integer 0 (unselected) or 1..5
  onChange: (rating: 1 | 2 | 3 | 4 | 5) => void;
  disabled?: boolean;
  compact?: boolean;
  label?: string;
}

const STAR_META: Record<1 | 2 | 3 | 4 | 5, { title: string; colorClass: string; glowClass: string }> = {
  1: { title: "Poor", colorClass: "text-rose-400", glowClass: "bg-rose-500/15 border-rose-500/40" },
  2: { title: "Fair", colorClass: "text-orange-400", glowClass: "bg-orange-500/15 border-orange-500/40" },
  3: { title: "Good", colorClass: "text-amber-300", glowClass: "bg-amber-400/15 border-amber-400/40" },
  4: { title: "Great", colorClass: "text-amber-400", glowClass: "bg-amber-400/20 border-amber-400/50" },
  5: { title: "Iconic", colorClass: "text-amber-400", glowClass: "bg-amber-400/25 border-amber-400/60" },
};

export const SpecialStarSelector: React.FC<SpecialStarSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  compact = false,
  label = "Tap to Rate",
}) => {
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [bouncingStar, setBouncingStar] = useState<number>(0);

  const normalizedValue = value >= 1 && value <= 5 ? (Math.round(value) as 1 | 2 | 3 | 4 | 5) : 0;
  const activeCount = hoveredStar || normalizedValue;
  const activeMeta = activeCount >= 1 && activeCount <= 5 ? STAR_META[activeCount as 1 | 2 | 3 | 4 | 5] : null;

  const handleSelect = (star: 1 | 2 | 3 | 4 | 5) => {
    if (disabled) return;
    triggerHaptic("medium");
    setBouncingStar(star);
    onChange(star);
    window.setTimeout(() => {
      setBouncingStar((prev) => (prev === star ? 0 : prev));
    }, 320);
  };

  return (
    <div
      className={`w-full rounded-2xl border backdrop-blur-xl transition-all duration-300 select-none ${
        activeMeta
          ? `${activeMeta.glowClass} shadow-[0_12px_36px_rgba(251,191,36,0.12)]`
          : "bg-zinc-900/90 border-white/12 shadow-xl"
      } ${compact ? "px-3.5 py-3" : "px-4 py-4"}`}
      role="radiogroup"
      aria-label="Star rating selector from 1 to 5 whole stars"
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
          {label}
        </span>
        {activeMeta ? (
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-black tracking-tight ${activeMeta.colorClass}`}>
              {activeCount}/5 · {activeMeta.title}
            </span>
          </div>
        ) : (
          <span className="text-[11px] font-semibold text-zinc-400">
            Select 1–5 Stars
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        {([1, 2, 3, 4, 5] as const).map((star) => {
          const isFilled = star <= activeCount;
          const isSelectedExact = star === normalizedValue;
          const isBouncing = bouncingStar === star;

          return (
            <button
              key={star}
              type="button"
              disabled={disabled}
              role="radio"
              aria-checked={isSelectedExact}
              aria-label={`${star} ${star === 1 ? "Star" : "Stars"} - ${STAR_META[star].title}`}
              onClick={() => handleSelect(star)}
              onMouseEnter={() => !disabled && setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              className={`group relative flex-1 min-h-[52px] rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 cursor-pointer active:scale-90 border ${
                isFilled
                  ? "bg-amber-400/15 border-amber-400/50 shadow-[0_0_18px_rgba(251,191,36,0.22)]"
                  : "bg-zinc-950/60 border-white/10 hover:border-white/25 hover:bg-zinc-800/70"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <svg
                viewBox="0 0 24 24"
                className={`${compact ? "w-6 h-6" : "w-7 h-7"} transition-all duration-200 ${
                  isBouncing ? "scale-125 -rotate-6" : isFilled ? "scale-110" : "scale-95 group-hover:scale-105"
                } ${
                  isFilled
                    ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.65)]"
                    : "text-zinc-500 fill-zinc-900/60 group-hover:text-zinc-300"
                }`}
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span
                className={`text-[10px] font-black leading-none transition-colors ${
                  isFilled ? "text-amber-300" : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              >
                {star}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
