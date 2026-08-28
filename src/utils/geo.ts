/**
 * Robust Geographic Coordinate Sanitization and Validation
 * Prevents Leaflet "Invalid LatLng object: (NaN, NaN)" exceptions
 */

export function isValidLatLng(lat: any, lng: any): boolean {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return false;
  }
  const numLat = typeof lat === "number" ? lat : parseFloat(String(lat));
  const numLng = typeof lng === "number" ? lng : parseFloat(String(lng));

  if (!Number.isFinite(numLat) || !Number.isFinite(numLng)) {
    return false;
  }
  if (Number.isNaN(numLat) || Number.isNaN(numLng)) {
    return false;
  }
  if (numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
    return false;
  }
  return true;
}

export function sanitizeLatLng(
  lat: any,
  lng: any,
  fallbackLat: number = 31.7921646,
  fallbackLng: number = 34.635408
): [number, number] {
  if (isValidLatLng(lat, lng)) {
    const numLat = typeof lat === "number" ? lat : parseFloat(String(lat));
    const numLng = typeof lng === "number" ? lng : parseFloat(String(lng));
    return [numLat, numLng];
  }
  const safeFallbackLat = isValidLatLng(fallbackLat, fallbackLng) ? Number(fallbackLat) : 31.7921646;
  const safeFallbackLng = isValidLatLng(fallbackLat, fallbackLng) ? Number(fallbackLng) : 34.635408;
  return [safeFallbackLat, safeFallbackLng];
}

export function getCachedUserLocation(): { lat: number; lng: number } | null {
  try {
    const cachedLat = localStorage.getItem("yoouz_lat");
    const cachedLng = localStorage.getItem("yoouz_lng");
    if (cachedLat && cachedLng) {
      const lat = parseFloat(cachedLat);
      const lng = parseFloat(cachedLng);
      if (isValidLatLng(lat, lng)) {
        return { lat, lng };
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return null;
}
