/**
 * Web Haptic Feedback Utility
 * Uses navigator.vibrate where supported on mobile devices (Android / PWA / mobile Chrome / Firefox)
 */

export const triggerHaptic = (type: "light" | "medium" | "heavy" | "success" | "selection" | "error" = "light") => {
  if (typeof window === "undefined" || !("vibrate" in navigator)) return;
  try {
    switch (type) {
      case "light":
      case "selection":
        navigator.vibrate(12);
        break;
      case "medium":
        navigator.vibrate(25);
        break;
      case "heavy":
        navigator.vibrate(45);
        break;
      case "success":
        navigator.vibrate([15, 40, 25]);
        break;
      case "error":
        navigator.vibrate([40, 60, 40]);
        break;
    }
  } catch (e) {
    // Ignore if vibration is blocked or unsupported
  }
};
