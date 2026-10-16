import { useRef, useState, useCallback } from "react";
import { triggerHaptic } from "../utils/haptics";

interface UseSwipeDownToDismissOptions {
  onDismiss: () => void;
  threshold?: number; // pixels required to trigger dismiss, default 70
}

export function useSwipeDownToDismiss({
  onDismiss,
  threshold = 70
}: UseSwipeDownToDismissOptions) {
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState<number>(0);
  const isDragging = useRef<boolean>(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
      isDragging.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || touchStartY.current === null || touchStartX.current === null) return;
    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const diffY = currentY - touchStartY.current;
    const diffX = Math.abs(currentX - touchStartX.current);

    // Only handle if dragging primarily downward
    if (diffY > 0 && diffY > diffX) {
      setDragOffsetY(diffY);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (isDragging.current) {
      if (dragOffsetY >= threshold) {
        triggerHaptic("medium");
        onDismiss();
      }
      setDragOffsetY(0);
      isDragging.current = false;
      touchStartY.current = null;
      touchStartX.current = null;
    }
  }, [dragOffsetY, onDismiss, threshold]);

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
