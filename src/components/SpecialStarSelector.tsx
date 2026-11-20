import React, { useState } from "react";
import { triggerHaptic } from "../utils/haptics";

export interface SpecialStarSelectorProps {
  value: number; // Whole integer 0 (unselected) or 1..5
  onChange: (rating: 1 | 2 | 3 | 4 | 5) => void;
  disabled?: boolean;
  compact?: boolean;
  label?: string;
}

const STAR_META: Record<
  1 | 2 | 3 | 4 | 5,
  { title: string; subtitle: string; accentText: string; surfaceRing: string }
> = {
  1: {
    title: "Poor",
    subtitle: "Did not deliver",
    accentText: "text-rose-400",
    surfaceRing: "ring-1 ring-rose-400/25 shadow-[0_20px_50px_rgba(244,63,94,0.12)]",
  },
  2: {
    title: "Fair",
    subtitle: "Below expectations",
    accentText: "text-orange-400",
    surfaceRing: "ring-1 ring-orange-400/25 shadow-[0_20px_50px_rgba(251,146,60,0.12)]",
  },
  3: {
    title: "Good",
    subtitle: "Solid experience",
    accentText: "text-[#E8C78A]",
    surfaceRing: "ring-1 ring-[#E8C78A]/25 shadow-[0_20px_50px_rgba(232,199,138,0.12)]",
  },
  4: {
    title: "Great",
    subtitle: "Would visit again",
    accentText: "text-[#E8C78A]",
    surfaceRing: "ring-1 ring-[#E8C78A]/30 shadow-[0_20px_50px_rgba(232,199,138,0.16)]",
  },
  5: {
    title: "Outstanding",
    subtitle: "Best in class",
    accentText: "text-[#E8C78A]",
    surfaceRing: "ring-1 ring-[#E8C78A]/40 shadow-[0_24px_60px_rgba(232,199,138,0.2)]",
  },
};

export const SpecialStarSelector: React.FC<SpecialStarSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  compact = false,
  label = "Rate your experience",
}) => {
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [bouncingStar, setBouncingStar] = useState<number>(0);

  const normalizedValue =
    value >= 1 && value <= 5 ? (Math.round(value) as 1 | 2 | 3 | 4 | 5) : 0;
  const activeCount = hoveredStar || normalizedValue;
  const activeMeta =
    activeCount >= 1 && activeCount <= 5
      ? STAR_META[activeCount as 1 | 2 | 3 | 4 | 5]
      : null;

  const handleSelect = (star: 1 | 2 | 3 | 4 | 5) => {
    if (disabled) return;
    triggerHaptic("medium");
    setBouncingStar(star);
    onChange(star);
    window.setTimeout(() => {
      setBouncingStar((prev) => (prev === star ? 0 : prev));
    }, 340);
  };

  return (
    <div
      className={`w-full rounded-[24px] bg-[#0c0c0f]/90 backdrop-blur-2xl border border-white/[0.12] transition-all duration-300 select-none ${
        activeMeta ? activeMeta.surfaceRing : "shadow-[0_20px_50px_rgba(0,0,0,0.65)]"
      } ${compact ? "px-4 py-3.5" : "px-4.5 py-4.5"}`}
      role="radiogroup"
      aria-label="Star rating selector from 1 to 5 whole stars"
    >
      {/* Crisp Unboxed Typographic Header */}
      <div className="flex items-baseline justify-between gap-3 mb-3.5 px-0.5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-tight text-zinc-400">
            {label}
          </p>
        </div>

        <div className="flex items-baseline gap-2 shrink-0 text-right">
          {activeMeta ? (
            <>
              <span className={`text-sm font-bold tracking-tight ${activeMeta.accentText}`}>
                {activeMeta.title}
              </span>
              <span className="text-xs font-semibold tabular-nums text-zinc-400">
                {activeCount} / 5
              </span>
            </>
          ) : (
            <span className="text-xs font-medium text-zinc-400">
              Tap 1–5 stars
            </span>
          )}
        </div>
      </div>

      {/* Tactile 5-Star Segmented Bar */}
      <div className="grid grid-cols-5 gap-2">
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
              aria-label={`${star} ${star === 1 ? "Star" : "Stars"} — ${STAR_META[star].title}`}
              onClick={() => handleSelect(star)}
              onMouseEnter={() => !disabled && setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              className={`group relative min-h-[60px] rounded-2xl flex flex-col items-center justify-center gap-1 transition-[transform,background-color,border-color,box-shadow] duration-200 cursor-pointer active:scale-92 border ${
                isFilled
                  ? "bg-gradient-to-b from-[#E8C78A]/22 via-[#E8C78A]/12 to-[#E8C78A]/6 border-[#E8C78A]/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_6px_20px_rgba(232,199,138,0.16)]"
                  : "bg-white/[0.04] border-white/[0.1] hover:bg-white/[0.08] hover:border-white/[0.2]"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <svg
                viewBox="0 0 24 24"
                className={`${compact ? "w-6 h-6" : "w-7 h-7"} transition-transform duration-200 will-change-transform ${
                  isBouncing
                    ? "scale-125 -rotate-6"
                    : isFilled
                    ? "scale-110"
                    : "scale-95 group-hover:scale-105"
                } ${
                  isFilled
                    ? "text-[#E8C78A] fill-[#E8C78A] drop-shadow-[0_0_10px_rgba(232,199,138,0.5)]"
                    : "text-zinc-500 fill-transparent group-hover:text-zinc-300"
                }`}
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="1.65"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>

              <span
                className={`text-[11px] font-bold tabular-nums leading-none transition-colors ${
                  isFilled
                    ? "text-[#E8C78A]"
                    : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              >
                {star}
              </span>
            </button>
          );
        })}
      </div>

      {/* Subtle Descriptor Footer */}
      {activeMeta && (
        <div className="mt-2.5 flex items-center justify-center">
          <p className="text-[11px] font-medium text-zinc-400 tracking-tight">
            {activeMeta.subtitle}
          </p>
        </div>
      )}
    </div>
  );
};
