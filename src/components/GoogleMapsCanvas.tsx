import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  Plus,
  Minus,
  Navigation,
  Layers,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Compass,
  RotateCw,
  Sparkles
} from "lucide-react";
import { Place } from "../types";
import { isValidLatLng, sanitizeLatLng } from "../utils/geo";

interface GoogleMapsCanvasProps {
  places: Place[];
  selectedPlace: Place;
  onSelectPlace: (place: Place) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const GoogleMapsCanvas: React.FC<GoogleMapsCanvasProps> = ({
  places,
  selectedPlace,
  onSelectPlace,
  isSidebarOpen,
  onToggleSidebar
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const [mapLayer, setMapLayer] = useState<"standard" | "satellite">("standard");
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const center = sanitizeLatLng(selectedPlace?.lat, selectedPlace?.lng, 31.7921646, 34.635408);

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: 16,
      zoomControl: false,
      attributionControl: false
    });

    const standardTileUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
    const tileLayer = L.tileLayer(standardTileUrl, {
      maxZoom: 19,
      subdomains: "abcd"
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch between Standard and Satellite layer
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    let newUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
    if (mapLayer === "satellite") {
      newUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    }

    const newLayer = L.tileLayer(newUrl, {
      maxZoom: 19,
      subdomains: "abcd"
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newLayer;
  }, [mapLayer]);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear old markers
    Object.values(markersRef.current).forEach((m) => map.removeLayer(m));
    markersRef.current = {};

    places.forEach((place) => {
      if (!isValidLatLng(place.lat, place.lng)) return;
      const [validLat, validLng] = sanitizeLatLng(place.lat, place.lng);
      const isSelected = place.id === selectedPlace.id;

      // Google Maps Red Pin SVG Icon with Category Icon & Label
      const customHtml = `
        <div class="group cursor-pointer flex flex-col items-center -translate-x-1/2 -translate-y-full">
          <!-- Google Place Name Tag on Hover or Selected -->
          <div class="px-2 py-0.5 rounded shadow-md text-[11px] font-medium whitespace-nowrap mb-1 border transition-all ${
            isSelected
              ? "bg-[#d93025] text-white border-[#d93025] scale-105"
              : "bg-white text-[#202124] border-[#dadce0] group-hover:scale-105"
          }">
            ${place.name} <span class="text-amber-300">★ ${place.rating}</span>
          </div>

          <!-- Red Google Pin Pin Marker -->
          <div class="relative transition-transform duration-200 ${isSelected ? "scale-125" : "group-hover:scale-110"}">
            <svg width="34" height="46" viewBox="0 0 34 46" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 0C7.61116 0 0 7.61116 0 17C0 29.75 17 46 17 46C17 46 34 29.75 34 17C34 7.61116 26.3888 0 17 0Z" fill="${
                isSelected ? "#d93025" : "#ea4335"
              }"/>
              <circle cx="17" cy="17" r="7.5" fill="white"/>
            </svg>
            <div class="absolute inset-0 flex items-center justify-center -translate-y-2 text-[10px] font-bold text-[#d93025]">
              📹
            </div>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: customHtml,
        className: "google-maps-custom-pin",
        iconSize: [34, 46],
        iconAnchor: [17, 46]
      });

      const marker = L.marker([validLat, validLng], { icon: customIcon }).addTo(map);

      marker.on("click", () => {
        onSelectPlace(place);
      });

      markersRef.current[place.id] = marker;
    });
  }, [places, selectedPlace, onSelectPlace]);

  // Center on selected place
  useEffect(() => {
    if (!mapInstanceRef.current || !isValidLatLng(selectedPlace?.lat, selectedPlace?.lng)) return;
    const [validLat, validLng] = sanitizeLatLng(selectedPlace.lat, selectedPlace.lng);
    mapInstanceRef.current.flyTo([validLat, validLng], 16, {
      duration: 1.2
    });
  }, [selectedPlace]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current && isValidLatLng(selectedPlace?.lat, selectedPlace?.lng)) {
      const [validLat, validLng] = sanitizeLatLng(selectedPlace.lat, selectedPlace.lng);
      mapInstanceRef.current.flyTo([validLat, validLng], 16);
    }
  };

  return (
    <div className="flex-1 h-full relative overflow-hidden bg-[#e5e3df]">
      {/* 1. Leaflet Map Viewport */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* 2. Side Panel Collapser Arrow Tab on the left edge (matching Google Maps) */}
      <button
        id="btn-collapse-sidebar"
        onClick={onToggleSidebar}
        className="absolute top-1/2 -translate-y-1/2 left-0 z-20 w-5 h-12 bg-white rounded-r-md shadow-md border-y border-r border-[#dadce0] flex items-center justify-center text-[#5f6368] hover:bg-gray-50 hover:text-[#202124] transition-colors"
        title={isSidebarOpen ? "Collapse side panel" : "Expand side panel"}
      >
        {isSidebarOpen ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      {/* 3. Bottom-Left "Layers" Toggle Box (matching Google Maps screenshot) */}
      <div
        id="google-layers-box"
        onClick={() => setMapLayer(mapLayer === "standard" ? "satellite" : "standard")}
        className="absolute bottom-6 left-4 z-20 w-14 h-14 rounded-lg overflow-hidden border-2 border-white shadow-lg cursor-pointer group bg-black hover:scale-105 transition-transform"
        title="Toggle Satellite / Map Layer"
      >
        <img
          src={
            mapLayer === "standard"
              ? "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=200&auto=format&fit=crop&q=80"
              : "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=200&auto=format&fit=crop&q=80"
          }
          alt="Layers"
          className="w-full h-full object-cover group-hover:opacity-90"
        />
        <div className="absolute inset-0 bg-black/30 flex items-end justify-center pb-1">
          <span className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-0.5 drop-shadow">
            <Layers className="w-2.5 h-2.5" />
            {mapLayer === "standard" ? "Satellite" : "Map"}
          </span>
        </div>
      </div>

      {/* 4. Bottom-Right Controls matching Screenshot (Street View Preview + Zoom + Pegman + My Location) */}
      <div className="absolute bottom-6 right-4 z-20 flex flex-col items-end gap-2 pointer-events-auto">
        {/* Street View 360 preview thumbnail widget */}
        <div
          id="street-view-widget"
          className="w-20 h-14 rounded-lg overflow-hidden border-2 border-white shadow-lg bg-black relative group cursor-pointer"
          title="Street View 360"
        >
          <img
            src="https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=300&auto=format&fit=crop&q=80"
            alt="Street View"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs">
              ↻
            </div>
          </div>
        </div>

        {/* Action button cluster (My Location, Zoom in/out, Pegman) */}
        <div className="flex flex-col rounded-lg bg-white shadow-md border border-[#dadce0] overflow-hidden">
          <button
            id="btn-my-location"
            onClick={handleRecenter}
            className="w-10 h-10 flex items-center justify-center text-[#5f6368] hover:bg-gray-100 transition-colors border-b border-[#dadce0]"
            title="Your location"
          >
            <Navigation className="w-4 h-4" />
          </button>

          <button
            id="btn-zoom-in"
            onClick={handleZoomIn}
            className="w-10 h-10 flex items-center justify-center text-[#5f6368] hover:bg-gray-100 transition-colors border-b border-[#dadce0]"
            title="Zoom in"
          >
            <Plus className="w-5 h-5" />
          </button>

          <button
            id="btn-zoom-out"
            onClick={handleZoomOut}
            className="w-10 h-10 flex items-center justify-center text-[#5f6368] hover:bg-gray-100 transition-colors border-b border-[#dadce0]"
            title="Zoom out"
          >
            <Minus className="w-5 h-5" />
          </button>

          {/* Yellow Street View Pegman character */}
          <button
            id="btn-pegman"
            className="w-10 h-10 flex items-center justify-center bg-white hover:bg-amber-50 transition-colors"
            title="Browse Street View images"
          >
            <div className="w-4 h-6 bg-[#fbbc04] rounded-t-full border border-amber-600 flex flex-col items-center justify-between p-0.5 shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-800" />
              <div className="w-2.5 h-3 bg-[#f29900] rounded-sm" />
            </div>
          </button>
        </div>
      </div>

      {/* 5. Google Maps Bottom Legal / Attribution bar matching screenshot */}
      <div
        id="google-maps-attribution-bar"
        className="absolute bottom-0 right-0 left-0 z-10 bg-white/70 backdrop-blur-xs text-[10px] text-[#5f6368] px-3 py-0.5 flex items-center justify-end gap-3 pointer-events-auto border-t border-gray-200/50"
      >
        <span className="truncate">Map data ©2026 GeoBasis-DE/BKG (©2009), Google</span>
        <span className="hidden sm:inline">Belgium</span>
        <a href="#terms" className="hover:underline">Terms</a>
        <a href="#privacy" className="hover:underline">Privacy</a>
        <a href="#feedback" className="hover:underline hidden md:inline">Send Product Feedback</a>
        <div className="flex items-center gap-1 border-l border-gray-400 pl-2">
          <span>50 m</span>
          <div className="w-8 h-1 bg-gray-600" />
        </div>
      </div>
    </div>
  );
};
