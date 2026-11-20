import React from 'react';

export interface CopoStarRatingProps {
  rating: number; // Whole integer 1-5 stars (1, 2, 3, 4, or 5)
  maxStars?: number; // default 5
  roundToWhole?: boolean; // Whole-star clamping flag (enabled by default)
  starClassName?: string; // e.g. "w-6 h-6", "w-3.5 h-3.5"
  filledColorClass?: string; // default "text-amber-400 fill-amber-400"
  emptyColorClass?: string; // default "text-zinc-500/60 fill-zinc-900/70"
  className?: string; // container className
}

/**
 * Strict Whole-Number Star Rating formula:
 * Accepts and clamps to whole integers 1, 2, 3, 4, or 5 (or 0 if unrated/invalid).
 * Half-stars and decimal ratings are completely disabled.
 */
export function getRoundedRating(rating: number): number {
  if (typeof rating !== 'number' || isNaN(rating) || rating <= 0) return 0;
  return Math.min(5, Math.max(1, Math.round(rating)));
}

/**
 * Strict 5-star rating renderer displaying ONLY whole solid or empty stars (1–5).
 */
export const CopoStarRating: React.FC<CopoStarRatingProps> = ({
  rating,
  maxStars = 5,
  starClassName = "w-6 h-6",
  filledColorClass = "text-[#E8C78A] fill-[#E8C78A] print:text-amber-500 print:fill-amber-500 [print-color-adjust:exact] [-webkit-print-color-adjust:exact]",
  emptyColorClass = "text-zinc-600/50 fill-zinc-900/60 print:text-zinc-300 print:fill-zinc-200 [print-color-adjust:exact] [-webkit-print-color-adjust:exact]",
  className = "flex items-center text-[#E8C78A] gap-0.5 print:inline-flex [print-color-adjust:exact] [-webkit-print-color-adjust:exact]"
}) => {
  const wholeStars = getRoundedRating(rating);

  return (
    <div className={className} aria-label={`${wholeStars} out of ${maxStars} stars`}>
      {Array.from({ length: maxStars }).map((_, index) => {
        const isFilled = index < wholeStars;
        return (
          <svg
            key={index}
            viewBox="0 0 24 24"
            className={`${starClassName} ${isFilled ? filledColorClass : emptyColorClass} shrink-0 [print-color-adjust:exact] [-webkit-print-color-adjust:exact]`}
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
      })}
    </div>
  );
};
