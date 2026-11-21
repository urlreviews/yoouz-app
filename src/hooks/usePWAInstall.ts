import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

let cachedDeferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    cachedDeferredPrompt = e as BeforeInstallPromptEvent;
    listeners.forEach((fn) => fn());
  });
  window.addEventListener("appinstalled", () => {
    cachedDeferredPrompt = null;
    listeners.forEach((fn) => fn());
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    cachedDeferredPrompt
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  });

  const isIOS =
    typeof navigator !== "undefined" &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

  useEffect(() => {
    if (typeof window === "undefined") return;

    const sync = () => {
      setDeferredPrompt(cachedDeferredPrompt);
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(standalone);
    };

    listeners.add(sync);
    const mq = window.matchMedia("(display-mode: standalone)");
    const onMqChange = () => sync();
    mq.addEventListener?.("change", onMqChange);

    return () => {
      listeners.delete(sync);
      mq.removeEventListener?.("change", onMqChange);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<"accepted" | "dismissed" | "ios-guide" | "unavailable"> => {
    const promptEvt = deferredPrompt || cachedDeferredPrompt;
    if (promptEvt) {
      await promptEvt.prompt();
      const { outcome } = await promptEvt.userChoice;
      if (outcome === "accepted") {
        cachedDeferredPrompt = null;
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
      return outcome;
    }
    if (isIOS) return "ios-guide";
    return "unavailable";
  }, [deferredPrompt, isIOS]);

  const canShowInstall = !isInstalled && (Boolean(deferredPrompt) || isIOS);

  return {
    isInstalled,
    isIOS,
    hasNativePrompt: Boolean(deferredPrompt),
    canShowInstall,
    promptInstall,
  };
}
