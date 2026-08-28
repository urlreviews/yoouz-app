import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import {
  MapPin,
  Star,
  Video,
  Play,
  Compass,
  Navigation,
  Layers,
  Crosshair,
  X,
  Camera,
  Globe,
  Phone,
  Clock,
  Bookmark,
  Share2,
  CheckCircle2
} from "lucide-react";
import { Place, VideoReview } from "../types";
import { isValidLatLng, sanitizeLatLng, getCachedUserLocation } from "../utils/geo";
import { isPlaceReviewMatch } from "../utils/placeUtils";

interface CopoMapViewProps {
  places: Place[];
  videos: VideoReview[];
  onOpenPlace: (placeId: string) => void;
  onSelectVideo: (videoId: string) => void;
}

export const CopoMapView: React.FC<CopoMapViewProps> = ({
  places,
  videos,
  onOpenPlace,
  onSelectVideo
}) => {
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>(
    places.find((p) => p.id.includes("ashdod-city-hall"))?.id || places[0]?.id || ""
  );
  // Default to Google Maps White / Streets mode
  const [mapLayerType, setMapLayerType] = useState<"streets" | "satellite">("streets");
  const [activeTab, setActiveTab] = useState<"overview" | "reviews">("overview");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(() => {
    return getCachedUserLocation();
  });
  const [notificationMessage, setNotificationMessage] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userLocationMarkerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const selectedPlace = places.find((p) => p.id === selectedPlaceId) || places[0];
  const placeVideos = selectedPlace ? videos.filter((v) => isPlaceReviewMatch(v, selectedPlace)) : [];

  // Geolocation detection with localStorage persistence
  useEffect(() => {
    const cached = getCachedUserLocation();
    if (cached) {
      setUserLocation(cached);
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (isValidLatLng(pos.coords.latitude, pos.coords.longitude)) {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setUserLocation(loc);
            try {
              localStorage.setItem("yoouz_lat", loc.lat.toString());
              localStorage.setItem("yoouz_lng", loc.lng.toString());
            } catch {}
            if (mapInstanceRef.current) {
              mapInstanceRef.current.flyTo([loc.lat, loc.lng], 16, { duration: 1.2 });
            }
          }
        },
        () => {
          if (!cached) {
            setUserLocation({ lat: 31.7921646, lng: 34.635408 });
          }
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  const handleLocateMe = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (isValidLatLng(pos.coords.latitude, pos.coords.longitude)) {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setUserLocation(loc);
            try {
              localStorage.setItem("yoouz_lat", loc.lat.toString());
              localStorage.setItem("yoouz_lng", loc.lng.toString());
            } catch {}
            setIsLocating(false);
            if (mapInstanceRef.current) {
              mapInstanceRef.current.flyTo([loc.lat, loc.lng], 16, { duration: 1.2 });
            }
            setNotificationMessage("Centered on your current location");
            setTimeout(() => setNotificationMessage(""), 3000);
          } else {
            setIsLocating(false);
          }
        },
        () => {
          setIsLocating(false);
          if (userLocation && isValidLatLng(userLocation.lat, userLocation.lng) && mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 16, { duration: 1.2 });
            setNotificationMessage("Centered on your location");
            setTimeout(() => setNotificationMessage(""), 3000);
          }
        }
      );
    } else {
      setIsLocating(false);
    }
  };

  // Initialize Leaflet Map (Light Google Maps Street Map by default)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const cached = getCachedUserLocation();
      const defaultCenter = sanitizeLatLng(
        selectedPlace?.lat,
        selectedPlace?.lng,
        cached?.lat || userLocation?.lat || 31.7921646,
        cached?.lng || userLocation?.lng || 34.635408
      );

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 16,
        zoomControl: false,
        attributionControl: false
      });

      mapInstanceRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);

      const tileUrl =
        mapLayerType === "satellite"
          ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

      tileLayerRef.current = L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: ["a", "b", "c"]
      }).addTo(map);
    }
  }, []);

  // Handle Layer Toggle
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const tileUrl =
      mapLayerType === "satellite"
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: ["a", "b", "c"]
    }).addTo(mapInstanceRef.current);
  }, [mapLayerType]);

  // Update User Location Pulsing Dot on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation || !isValidLatLng(userLocation.lat, userLocation.lng)) return;

    if (userLocationMarkerRef.current) {
      mapInstanceRef.current.removeLayer(userLocationMarkerRef.current);
    }

    const userDotIcon = L.divIcon({
      className: "custom-user-location-marker",
      html: `
        <div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;width:24px;height:24px;border-radius:50%;background:rgba(26,115,232,0.3);animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="width:14px;height:14px;border-radius:50%;background:#1a73e8;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);position:relative;z-index:2;"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const userMarker = L.marker([userLocation.lat, userLocation.lng], {
      icon: userDotIcon,
      zIndexOffset: 1000
    });
    userMarker.bindTooltip("You are here", { direction: "top", offset: [0, -10] });
    userMarker.addTo(mapInstanceRef.current);
    userLocationMarkerRef.current = userMarker;
  }, [userLocation]);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    places.forEach((place) => {
      if (!isValidLatLng(place.lat, place.lng)) return;
      const [validLat, validLng] = sanitizeLatLng(place.lat, place.lng);
      const isSelected = place.id === selectedPlaceId;

      const pinColor = isSelected ? "#1a73e8" : "#ea4335";

      const pinIcon = L.divIcon({
        className: "custom-gmap-marker",
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.15)); transition: transform 0.2s ease;" onmouseover="this.style.transform='scale(1.05) translateY(-2px)'" onmouseout="this.style.transform='scale(1) translateY(0)'">
            <div style="
              background:${isSelected ? "#1a73e8" : "white"};
              color:${isSelected ? "white" : "#202124"};
              padding:6px 12px;
              border-radius:24px;
              font-size:13px;
              font-weight:500;
              border:1px solid ${isSelected ? "#1a73e8" : "#dadce0"};
              white-space:nowrap;
              display:flex;
              align-items:center;
              gap:6px;
              font-family:'Google Sans',Roboto,Arial,sans-serif;
            ">
              <span style="display:flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;background:${isSelected ? "white" : pinColor};color:${isSelected ? "#1a73e8" : "white"};">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
              </span>
              <span>${place.name}</span>
              ${place.videoReviewCount ? `<span style="color:${isSelected ? "rgba(255,255,255,0.8)" : "#70757a"};font-size:12px;margin-left:2px;">(${place.videoReviewCount})</span>` : ""}
            </div>
            <div style="
              width:0;
              height:0;
              border-left:6px solid transparent;
              border-right:6px solid transparent;
              border-top:8px solid ${isSelected ? "#1a73e8" : "white"};
              margin-top:-1px;
            "></div>
          </div>
        `,
        iconSize: [160, 48],
        iconAnchor: [80, 44]
      });

      const marker = L.marker([validLat, validLng], { icon: pinIcon });
      marker.on("click", () => {
        setSelectedPlaceId(place.id);
        if (mapInstanceRef.current && isValidLatLng(validLat, validLng)) {
          mapInstanceRef.current.flyTo([validLat, validLng], 16, { duration: 0.8 });
        }
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [places, selectedPlaceId]);

  // Pan to selected place
  useEffect(() => {
    if (selectedPlace && isValidLatLng(selectedPlace.lat, selectedPlace.lng) && mapInstanceRef.current) {
      const [validLat, validLng] = sanitizeLatLng(selectedPlace.lat, selectedPlace.lng);
      mapInstanceRef.current.flyTo([validLat, validLng], 16, { duration: 0.8 });
    }
  }, [selectedPlaceId]);

  return (
    <div id="copo-map-view" className="flex-1 h-full relative flex font-sans bg-[#e5e3df] overflow-hidden">
      {/* 1. Fullscreen Interactive Map Stage (Crisp Light Theme) */}
      <div
        ref={mapContainerRef}
        id="copo-map-fullscreen-stage"
        className="absolute inset-0 w-full h-full z-0"
        style={{ background: "#e5e3df" }}
      />

      {/* 2. Left Place Details Card (Crisp White Google Maps Left Panel) */}
      {selectedPlace && (
        <aside
          id="copo-map-side-panel"
          className="relative z-20 w-full md:w-[412px] h-full bg-white shadow-2xl border-r border-zinc-200 flex flex-col overflow-hidden text-zinc-900 pointer-events-auto"
        >
          {/* Place Banner Image */}
          <div className="relative h-48 w-full bg-slate-950 shrink-0 flex items-center justify-center overflow-hidden">
            {selectedPlace.bannerUrl || selectedPlace.photos?.[0] ? (
              <>
                <img
                  src={selectedPlace.bannerUrl || selectedPlace.photos?.[0]}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-125 select-none pointer-events-none"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/30 pointer-events-none z-10" />
                <img
                  src={selectedPlace.bannerUrl || selectedPlace.photos?.[0]}
                  alt={selectedPlace.name}
                  className="relative z-20 max-w-full max-h-full object-contain p-2"
                  referrerPolicy="no-referrer"
                />
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-center text-white/50 text-xs font-bold uppercase">
                {selectedPlace.name}
              </div>
            )}
            <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-semibold text-white flex items-center gap-1.5 border border-white/20 z-30">
              <Camera className="w-3.5 h-3.5 text-blue-300" />
              <span>Photos ({selectedPlace.photos?.length || 2})</span>
            </div>
          </div>

          {/* Place Header */}
          <div className="px-4 pt-3 pb-2 border-b border-zinc-100 bg-white">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900">{selectedPlace.name}</h2>
            <div className="flex items-center gap-2 mt-1 text-xs flex-wrap">
              <span className="font-bold text-zinc-900">{selectedPlace.rating?.toFixed(1) || "3.7"}</span>
              <div className="flex items-center text-[#fbbc04]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.floor(selectedPlace.rating || 3.7)
                        ? "fill-[#fbbc04] text-[#fbbc04]"
                        : "text-zinc-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-zinc-500 font-medium">
                ({(selectedPlace.totalReviews || 144).toLocaleString()})
              </span>
              <span className="text-zinc-400">·</span>
              <span className="text-zinc-600 font-medium">
                {selectedPlace.category}
              </span>
              <span className="text-[#1a73e8] font-bold">♿</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-zinc-200 text-xs font-semibold px-4 bg-white">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-2.5 px-3 border-b-2 transition-colors ${
                activeTab === "overview"
                  ? "border-[#1a73e8] text-[#1a73e8]"
                  : "border-transparent text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === "reviews"
                  ? "border-[#1a73e8] text-[#1a73e8]"
                  : "border-transparent text-zinc-500 hover:text-zinc-900"
              }`}
            >
              <Video className="w-3.5 h-3.5 text-blue-600" />
              <span>Video Reviews ({placeVideos.length})</span>
            </button>
          </div>

          {/* Details Body */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 text-xs bg-white">
            {activeTab === "overview" ? (
              <>
                <div className="px-3 py-3 flex items-center justify-around text-center bg-zinc-50/80 border-b border-zinc-100">
                  <button
                    onClick={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                        selectedPlace.name + ", " + selectedPlace.address
                      )}`;
                      window.open(url, "_blank");
                    }}
                    className="flex flex-col items-center gap-1 text-[11px] text-[#1a73e8] hover:scale-105 transition-transform"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#1a73e8] text-white flex items-center justify-center shadow-md">
                      <Navigation className="w-4 h-4 fill-white" />
                    </div>
                    <span className="font-semibold text-zinc-800">Directions</span>
                  </button>

                  <button
                    onClick={() => onOpenPlace(selectedPlace.id)}
                    className="flex flex-col items-center gap-1 text-[11px] text-[#1a73e8] hover:scale-105 transition-transform"
                  >
                    <div className="w-9 h-9 rounded-full border border-blue-200 bg-blue-50 text-[#1a73e8] flex items-center justify-center shadow-sm">
                      <Bookmark className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-zinc-800">Save</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("reviews")}
                    className="flex flex-col items-center gap-1 text-[11px] text-[#1a73e8] hover:scale-105 transition-transform"
                  >
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                      <Video className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-zinc-800">Videos</span>
                  </button>
                </div>

                <div className="px-4 py-3 flex items-start gap-3.5 hover:bg-zinc-50 transition-colors">
                  <MapPin className="w-5 h-5 text-[#1a73e8] shrink-0 mt-0.5" />
                  <span className="font-medium text-zinc-800">{selectedPlace.address}</span>
                </div>

                <div className="px-4 py-3 flex items-start gap-3.5 hover:bg-zinc-50 transition-colors">
                  <Clock className="w-5 h-5 text-[#1a73e8] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-700">
                      {selectedPlace.openingHours || "Open 24 hours"}
                    </span>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Verified business hours
                    </p>
                  </div>
                </div>

                {selectedPlace.website && (
                  <div className="px-4 py-3 flex items-center gap-3.5 hover:bg-zinc-50 transition-colors">
                    <Globe className="w-5 h-5 text-[#1a73e8] shrink-0" />
                    <a
                      href={selectedPlace.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#1a73e8] hover:underline font-medium truncate"
                    >
                      {selectedPlace.website.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "")}
                    </a>
                  </div>
                )}

                {selectedPlace.phone && (
                  <div className="px-4 py-3 flex items-center gap-3.5 hover:bg-zinc-50 transition-colors">
                    <Phone className="w-5 h-5 text-[#1a73e8] shrink-0" />
                    <a
                      href={`tel:${selectedPlace.phone}`}
                      className="text-zinc-800 hover:text-[#1a73e8] font-bold"
                    >
                      {selectedPlace.phone}
                    </a>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 space-y-4 bg-white">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-zinc-900">
                    Video Reviews ({placeVideos.length})
                  </h3>
                </div>

                {placeVideos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    {placeVideos.map((vid, idx) => (
                      <div
                        key={`map-video-${vid.id}-${idx}`}
                        onClick={() => onSelectVideo(vid.id)}
                        className="group relative aspect-[9/13] rounded-xl overflow-hidden bg-black border border-zinc-200 cursor-pointer hover:border-blue-600 transition-all shadow-sm"
                      >
                        {vid.thumbnailUrl ? (
                          <img
                            src={vid.thumbnailUrl}
                            alt={vid.caption}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                            <Play className="w-6 h-6 text-white/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                        <div className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white">
                          <Play className="w-3.5 h-3.5 fill-white translate-x-0.5" />
                        </div>
                        <div className="absolute bottom-2 left-2 right-2 text-white">
                          <p className="text-[11px] font-bold truncate">{vid.author.name}</p>
                          <p className="text-[9px] text-zinc-300 truncate">{vid.caption}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-2xl bg-zinc-50 border border-dashed border-zinc-300">
                    <Video className="w-8 h-8 text-blue-600 mx-auto mb-2 opacity-60" />
                    <p className="font-bold text-xs text-zinc-800">No video reviews yet</p>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Be the first creator to share a review for this place!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      )}

      {/* 3. Bottom Right Map Controls (White Theme) */}
      <div className="absolute right-4 z-20 flex flex-col gap-2 pointer-events-auto" style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}>
        <button
          onClick={() => setMapLayerType(mapLayerType === "satellite" ? "streets" : "satellite")}
          className="w-10 h-10 rounded-xl bg-white shadow-lg border border-zinc-200 flex items-center justify-center text-zinc-800 hover:scale-105 hover:bg-zinc-50 transition-all"
          title={mapLayerType === "satellite" ? "Switch to White Map" : "Switch to Satellite"}
        >
          <Layers className="w-5 h-5 text-[#1a73e8]" />
        </button>

        <button
          onClick={handleLocateMe}
          className={`w-10 h-10 rounded-xl bg-white shadow-lg border border-zinc-200 flex items-center justify-center hover:scale-105 hover:bg-zinc-50 transition-all ${
            isLocating ? "text-[#1a73e8] animate-pulse" : "text-zinc-700"
          }`}
          title="Show where I am located now"
        >
          <Crosshair className="w-5 h-5 text-[#1a73e8]" />
        </button>

        <div className="flex flex-col bg-white rounded-xl shadow-lg border border-zinc-200 overflow-hidden divide-y divide-zinc-200">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-10 h-9 flex items-center justify-center text-zinc-800 font-bold text-lg hover:bg-zinc-100 transition-colors"
            title="Zoom in"
          >
            +
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-10 h-9 flex items-center justify-center text-zinc-800 font-bold text-lg hover:bg-zinc-100 transition-colors"
            title="Zoom out"
          >
            −
          </button>
        </div>
      </div>

      {/* 4. Notification Toast */}
      {notificationMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-zinc-900/90 text-white text-xs font-semibold shadow-2xl backdrop-blur-md border border-white/10 flex items-center gap-2 animate-in fade-in zoom-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notificationMessage}</span>
        </div>
      )}
    </div>
  );
};
