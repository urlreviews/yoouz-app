import React, { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export const PWAInstallPrompt: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2 rounded-full bg-zinc-900/95 text-amber-300 border border-amber-500/30 text-xs font-semibold shadow-2xl flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top duration-300">
      <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
      <span>You are currently offline • Cached content available</span>
    </div>
  );
};

