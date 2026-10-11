import React from 'react';

export interface CopoStarRatingProps {
  rating: number; // e.g., 2.4, 3.7, 4.3
  maxStars?: number; // default 5
  starClassName?: string; // e.g. "w-6 h-6", "w-3.5 h-3.5"
  filledColorClass?: string; // default "text-amber-500 fill-amber-500"
  emptyColorClass?: string; // default "text-zinc-700 fill-zinc-800"
  className?: string; // container className
}

/**
 * Universal Google-standard 0.5-increment star rating rounding formula:
 * Snaps any rating (e.g., 2.4 -> 2.5, 2.6 -> 2.5, 3.7 -> 3.5, 4.3 -> 4.5, 4.8 -> 5.0)
 */
export function getRoundedRating(rating: number): number {
  if (isNaN(rating) || rating <= 0) return 0;
  return Math.min(5, Math.max(0, Math.round(rating * 2) / 2));
}

/**
 * Google-standard 5-star rating renderer with full, half, and empty star states.
 */
export const CopoStarRating: React.FC<CopoStarRatingProps> = ({
  rating,
  maxStars = 5,
  starClassName = "w-6 h-6",
  filledColorClass = "text-amber-400 fill-amber-400 print:text-amber-500 print:fill-amber-500 [print-color-adjust:exact] [-webkit-print-color-adjust:exact]",
  emptyColorClass = "text-zinc-400 fill-zinc-900/90 print:text-zinc-400 print:fill-zinc-200 [print-color-adjust:exact] [-webkit-print-color-adjust:exact]",
  className = "flex items-center text-amber-400 gap-0.5 print:inline-flex [print-color-adjust:exact] [-webkit-print-color-adjust:exact]"
}) => {
  const rounded = getRoundedRating(rating);
  const fullStars = Math.floor(rounded);
  const hasHalfStar = rounded % 1 !== 0;

  return (
    <div className={className} aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: maxStars }).map((_, index) => {
        if (index < fullStars) {
          // 1. Full Star
          return (
            <svg
              key={index}
              viewBox="0 0 24 24"
              className={`${starClassName} ${filledColorClass} shrink-0 [print-color-adjust:exact] [-webkit-print-color-adjust:exact]`}
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          );
        } else if (index === fullStars && hasHalfStar) {
          // 2. Half Star (Left half filled in amber, right half empty/dark)
          return (
            <div key={index} className={`relative ${starClassName} shrink-0 inline-flex items-center justify-center [print-color-adjust:exact] [-webkit-print-color-adjust:exact]`}>
              {/* Background Empty Star */}
              <svg
                viewBox="0 0 24 24"
                className={`absolute inset-0 w-full h-full ${emptyColorClass} [print-color-adjust:exact] [-webkit-print-color-adjust:exact]`}
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              {/* Foreground Left 50% Filled Star */}
              <div className="absolute inset-0 w-1/2 overflow-hidden pointer-events-none [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
                <svg
                  viewBox="0 0 24 24"
                  className={`h-full ${filledColorClass} [print-color-adjust:exact] [-webkit-print-color-adjust:exact]`}
                  style={{ width: "200%", maxWidth: "none" }}
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
            </div>
          );
        } else {
          // 3. Empty Star
          return (
            <svg
              key={index}
              viewBox="0 0 24 24"
              className={`${starClassName} ${emptyColorClass} shrink-0 [print-color-adjust:exact] [-webkit-print-color-adjust:exact]`}
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          );
        }
      })}
    </div>
  );
};
