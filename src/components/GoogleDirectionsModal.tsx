import React from "react";
import { X, Navigation, Car, Train, Footprints, Bike, ArrowRight } from "lucide-react";
import { Place } from "../types";

interface GoogleDirectionsModalProps {
  destination: Place;
  onClose: () => void;
}

export const GoogleDirectionsModal: React.FC<GoogleDirectionsModalProps> = ({
  destination,
  onClose
}) => {
  return (
    <div
      id="google-directions-modal"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 select-none"
    >
      <div className="w-full max-w-md bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-800 overflow-hidden">
        {/* Top Header */}
        <div className="bg-zinc-950 p-4 text-white flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 fill-white" />
            <h3 className="font-extrabold text-base">
              Directions to {destination.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Travel Mode Pills */}
        <div className="flex items-center justify-around border-b border-zinc-800 py-2.5 bg-zinc-950/60 text-zinc-400">
          <button className="flex flex-col items-center gap-1 text-white font-bold text-xs cursor-pointer">
            <Car className="w-5 h-5" />
            <span>12 min</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white text-xs cursor-pointer">
            <Train className="w-5 h-5" />
            <span>18 min</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white text-xs cursor-pointer">
            <Footprints className="w-5 h-5" />
            <span>34 min</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white text-xs cursor-pointer">
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
                {destination.name} - {destination.address}
              </div>
            </div>
          </div>

          {/* Fastest route preview */}
          <div className="p-3.5 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-1">
            <div className="flex items-center justify-between text-white font-bold text-sm">
              <span>via Main Express Route</span>
              <span>12 min (4.2 mi)</span>
            </div>
            <p className="text-xs text-zinc-400">Fastest route now, usual traffic</p>
          </div>

          <button
            onClick={() => {
              window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                  destination.address
                )}`,
                "_blank"
              );
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
