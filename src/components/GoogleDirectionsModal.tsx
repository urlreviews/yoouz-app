import React from "react";
import { X, Navigation, Car, Train, Footprints, Bike, ArrowRight } from "lucide-react";
import { Place } from "../types";
import { useSwipeDownToDismiss } from "../hooks/useSwipeDownToDismiss";
import { formatBusinessName, getGoogleMapsDirectionsUrl } from "../utils/placeUtils";

interface GoogleDirectionsModalProps {
  destination: Place;
  onClose: () => void;
}

export const GoogleDirectionsModal: React.FC<GoogleDirectionsModalProps> = ({
  destination,
  onClose
}) => {
  const { swipeProps, dragOffsetY } = useSwipeDownToDismiss({
    onDismiss: onClose,
    threshold: 60
  });

  const displayName = formatBusinessName(destination.name || destination.id || destination.brandDomain || "");
  const displayAddress = destination.address && !destination.address.includes("://") && !destination.address.endsWith(".com") && !destination.address.toLowerCase().startsWith("official domain:")
    ? destination.address
    : (destination.city && destination.city.toLowerCase() !== "online" ? destination.city : "Verified Business Entity");

  return (
    <div
      id="google-directions-modal"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 select-none"
      onClick={onClose}
    >
      <div 
        style={{
          transform: dragOffsetY > 0 ? `translateY(${dragOffsetY}px)` : undefined,
          transition: dragOffsetY === 0 ? "transform 0.2s ease-out" : "none"
        }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md h-[100dvh] sm:h-auto bg-zinc-900 rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border border-zinc-800 overflow-hidden flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
      >
        {/* Top Drag Indicator Pill for Mobile (Signature Top Black/Dark Line like Comments) */}
        <div 
          className="h-8 flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing sm:hidden touch-none"
          {...swipeProps}
        >
          <div className="w-12 h-1.5 rounded-full bg-zinc-700" />
        </div>

        {/* Top Header */}
        <div 
          className="bg-zinc-950 px-4 pt-2 sm:pt-4 pb-4 text-white flex items-center justify-between border-b border-zinc-800 touch-pan-y shrink-0"
          {...swipeProps}
        >
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 fill-white" />
            <h3 className="font-extrabold text-base truncate">
              Directions to {displayName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hidden sm:flex items-center justify-center hover:bg-zinc-800 text-zinc-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Travel Mode Pills */}
        <div className="flex items-center justify-around border-b border-zinc-800 py-2.5 bg-zinc-950/60 text-zinc-200">
          <button className="flex flex-col items-center gap-1 text-white font-bold text-xs cursor-pointer">
            <Car className="w-5 h-5" />
            <span>12 min</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-zinc-200 hover:text-white text-xs cursor-pointer">
            <Train className="w-5 h-5" />
            <span>18 min</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-zinc-200 hover:text-white text-xs cursor-pointer">
            <Footprints className="w-5 h-5" />
            <span>34 min</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-zinc-200 hover:text-white text-xs cursor-pointer">
            <Bike className="w-5 h-5" />
            <span>14 min</span>
          </button>
        </div>

        {/* Routes */}
        <div className="p-5 space-y-4">
          {/* Starting point */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full border-2 border-white bg-zinc-900 ml-1" />
              <div className="flex-1 p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-200">
                Your Location
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-white ml-1" />
              <div className="flex-1 p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-200 truncate">
                {displayName} - {displayAddress}
              </div>
            </div>
          </div>

          {/* Fastest route preview */}
          <div className="p-3.5 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-1">
            <div className="flex items-center justify-between text-white font-bold text-sm">
              <span>via Main Express Route</span>
              <span>12 min (4.2 mi)</span>
            </div>
            <p className="text-xs text-zinc-200">Fastest route now, usual traffic</p>
          </div>

          <button
            onClick={() => {
              const url = getGoogleMapsDirectionsUrl(destination, displayName);
              window.open(url, "_blank");
            }}
            className="w-full py-3 rounded-2xl bg-white hover:bg-zinc-200 text-black font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98"
          >
            <span>Start Navigation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
