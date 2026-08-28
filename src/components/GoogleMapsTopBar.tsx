import React from "react";
import {
  Search,
  X,
  Navigation,
  Utensils,
  Hotel,
  Camera,
  Train,
  ParkingSquare,
  Pill,
  Landmark,
  Grid,
  Menu,
  ArrowLeft,
  SlidersHorizontal,
  Compass
} from "lucide-react";
import { MapFilterCategory } from "../types";

interface GoogleMapsTopBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: MapFilterCategory;
  onSelectFilter: (cat: MapFilterCategory) => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onOpenDirections: () => void;
  onOpenRecord: () => void;
}

export const GoogleMapsTopBar: React.FC<GoogleMapsTopBarProps> = ({
  searchQuery,
  onSearchChange,
  activeFilter,
  onSelectFilter,
  onToggleSidebar,
  isSidebarOpen,
  onOpenDirections,
  onOpenRecord
}) => {
  const filterPills: { id: MapFilterCategory; label: string; icon: React.ReactNode }[] = [
    { id: "restaurants", label: "Restaurants", icon: <Utensils className="w-3.5 h-3.5" /> },
    { id: "hotels", label: "Hotels", icon: <Hotel className="w-3.5 h-3.5" /> },
    { id: "things_to_do", label: "Things to do", icon: <Camera className="w-3.5 h-3.5" /> },
    { id: "transit", label: "Transit", icon: <Train className="w-3.5 h-3.5" /> },
    { id: "parking", label: "Parking", icon: <ParkingSquare className="w-3.5 h-3.5" /> },
    { id: "pharmacies", label: "Pharmacies", icon: <Pill className="w-3.5 h-3.5" /> },
    { id: "atms", label: "ATMs", icon: <Landmark className="w-3.5 h-3.5" /> }
  ];

  return (
    <div
      id="google-maps-top-header"
      className="absolute top-2 left-2 right-2 md:left-4 md:top-3 z-30 flex items-center justify-between gap-3 pointer-events-none"
    >
      {/* Left Search Bar matching Google Maps UI */}
      <div className="flex items-center gap-2 pointer-events-auto w-full md:w-[412px]">
        <div className="w-full h-12 bg-white rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.2),0_-1px_0px_rgba(0,0,0,0.02)] flex items-center px-3 border border-transparent hover:border-gray-200 focus-within:border-blue-500 transition-all">
          {/* Hamburger or Back Arrow */}
          <button
            id="btn-google-menu"
            onClick={onToggleSidebar}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-gray-100 transition-colors shrink-0"
            title={isSidebarOpen ? "Collapse panel" : "Menu"}
          >
            {isSidebarOpen ? (
              <ArrowLeft className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          {/* Search Input */}
          <input
            id="google-maps-search-input"
            autoComplete="off"
            spellCheck={false}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Paste business website URL..."
            className="flex-1 bg-transparent text-[#202124] text-[15px] font-normal px-3 outline-none placeholder-[#70757a]"
          />

          {/* Clear X button if typed */}
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Vertical divider */}
          <div className="h-6 w-[1px] bg-[#dadce0] mx-1" />

          {/* Search Glass Button */}
          <button
            id="btn-search-trigger"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#1a73e8] hover:bg-blue-50 transition-colors shrink-0"
            title="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Directions Diamond Icon Button */}
          <button
            id="btn-google-directions"
            onClick={onOpenDirections}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#1a73e8] hover:bg-blue-50 transition-colors shrink-0"
            title="Directions"
          >
            <Navigation className="w-5 h-5 fill-[#1a73e8]" />
          </button>
        </div>
      </div>

      {/* Top Filter Category Pills matching Google Maps */}
      <div className="hidden lg:flex items-center gap-2 overflow-x-auto hide-scrollbar pointer-events-auto py-1">
        {filterPills.map((pill) => {
          const isSelected = activeFilter === pill.id;
          return (
            <button
              key={pill.id}
              id={`pill-${pill.id}`}
              onClick={() => onSelectFilter(isSelected ? "all" : pill.id)}
              className={`h-9 px-3.5 rounded-full text-[13px] font-medium flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap border ${
                isSelected
                  ? "bg-[#1a73e8] text-white border-[#1a73e8]"
                  : "bg-white text-[#3c4043] border-[#dadce0] hover:bg-[#f8f9fa] hover:border-[#bdc1c6]"
              }`}
            >
              <span className={isSelected ? "text-white" : "text-[#5f6368]"}>{pill.icon}</span>
              <span>{pill.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right Google Account & Apps Widget */}
      <div className="flex items-center gap-2 pointer-events-auto shrink-0">
        <button
          onClick={onOpenRecord}
          className="hidden sm:flex items-center gap-1.5 h-10 px-3.5 rounded-full bg-white border border-[#dadce0] text-[#1a73e8] hover:bg-blue-50 text-[13px] font-medium shadow-sm transition-all"
        >
          <Camera className="w-4 h-4 text-[#1a73e8]" />
          <span>Record Video Review</span>
        </button>

        <div className="w-10 h-10 rounded-full bg-white border border-[#dadce0] flex items-center justify-center text-[#5f6368] hover:bg-gray-50 shadow-sm cursor-pointer">
          <Grid className="w-5 h-5" />
        </div>

        {/* User Google Avatar 'J' */}
        <div
          id="google-user-avatar"
          className="w-10 h-10 rounded-full bg-[#e37400] border-2 border-white text-white font-medium text-base flex items-center justify-center shadow-md cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
          title="Google Account: 4samet@gmail.com"
        >
          J
        </div>
      </div>
    </div>
  );
};
