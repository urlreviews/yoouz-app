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
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 select-none"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#dadce0] overflow-hidden">
        {/* Top Header */}
        <div className="bg-[#1a73e8] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 fill-white" />
            <h3 className="font-semibold text-base font-['Google_Sans',Roboto,sans-serif]">
              Directions to {destination.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Travel Mode Pills */}
        <div className="flex items-center justify-around border-b border-[#dadce0] py-2 bg-gray-50 text-[#5f6368]">
          <button className="flex flex-col items-center gap-1 text-[#1a73e8] font-semibold text-xs">
            <Car className="w-5 h-5" />
            <span>12 min</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#5f6368] hover:text-[#202124] text-xs">
            <Train className="w-5 h-5" />
            <span>18 min</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#5f6368] hover:text-[#202124] text-xs">
            <Footprints className="w-5 h-5" />
            <span>34 min</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#5f6368] hover:text-[#202124] text-xs">
            <Bike className="w-5 h-5" />
            <span>14 min</span>
          </button>
        </div>

        {/* Routes */}
        <div className="p-4 space-y-3">
          {/* Starting point */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full border-2 border-blue-600 bg-white ml-1" />
              <div className="flex-1 p-2 bg-gray-100 rounded-lg text-xs font-medium text-[#202124]">
                Your Location
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 ml-1" />
              <div className="flex-1 p-2 bg-gray-100 rounded-lg text-xs font-medium text-[#202124] truncate">
                {destination.name} - {destination.address}
              </div>
            </div>
          </div>

          {/* Fastest route preview */}
          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 space-y-1">
            <div className="flex items-center justify-between text-[#1a73e8] font-bold text-sm">
              <span>via Main Express Route</span>
              <span>12 min (4.2 mi)</span>
            </div>
            <p className="text-xs text-[#70757a]">Fastest route now, usual traffic</p>
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
            className="w-full py-2.5 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <span>Start Navigation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
