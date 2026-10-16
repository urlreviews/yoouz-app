import { useRef, useState, useCallback } from "react";
import { triggerHaptic } from "../utils/haptics";

interface UseSwipeDownToDismissOptions {
  onDismiss: () => void;
  threshold?: number; // pixels required to trigger dismiss/expand, default 60
  isExpanded?: boolean;
  onToggleExpand?: (expanded: boolean) => void;
}

export function useSwipeDownToDismiss({
  onDismiss,
  threshold = 60,
  isExpanded = false,
  onToggleExpand
}: UseSwipeDownToDismissOptions) {
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchCurrentY = useRef<number | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState<number>(0);
  const isDragging = useRef<boolean>(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
      touchCurrentY.current = e.touches[0].clientY;
      isDragging.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || touchStartY.current === null || touchStartX.current === null) return;
    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    touchCurrentY.current = currentY;
    const diffY = currentY - touchStartY.current;
    const diffX = Math.abs(currentX - touchStartX.current);

    // Allow vertical movement if vertical > horizontal
    if (Math.abs(diffY) > diffX) {
      setDragOffsetY(diffY);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (isDragging.current && touchStartY.current !== null && touchCurrentY.current !== null) {
      const totalDiffY = touchCurrentY.current - touchStartY.current;

      if (totalDiffY <= -threshold) {
        // Swiped up -> Expand
        triggerHaptic("light");
        if (onToggleExpand) onToggleExpand(true);
      } else if (totalDiffY >= threshold) {
        // Swiped down -> if expanded, collapse; else dismiss
        triggerHaptic("medium");
        if (isExpanded && onToggleExpand) {
          onToggleExpand(false);
        } else {
          onDismiss();
        }
      }
      setDragOffsetY(0);
      isDragging.current = false;
      touchStartY.current = null;
      touchStartX.current = null;
      touchCurrentY.current = null;
    }
  }, [isExpanded, onDismiss, onToggleExpand, threshold]);

  return {
    dragOffsetY,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    swipeProps: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd
    }
  };
}
