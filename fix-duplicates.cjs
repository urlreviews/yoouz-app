const fs = require('fs');

// 1. Fix App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

// Fix places state init
const oldPlacesInitRegex = /const \[places, setPlaces\] = useState<Place\[\]>\(\(\) => \{[\s\S]*?return COPO_PLACES;\s*\}\s*\}\);/;
const newPlacesInit = `const [places, setPlaces] = useState<Place[]>(() => {
    try {
      const saved = localStorage.getItem("copo_places");
      if (saved) {
        const parsed: Place[] = JSON.parse(saved);
        const map = new Map<string, Place>();
        COPO_PLACES.forEach((cp) => map.set(cp.id, cp));
        if (Array.isArray(parsed)) {
          parsed.forEach((p) => {
            if (!p || !p.id) return;
            if (map.has(p.id)) {
              map.set(p.id, { ...map.get(p.id)!, ...p });
            } else {
              map.set(p.id, p);
            }
          });
        }
        return Array.from(map.values());
      }
      return COPO_PLACES;
    } catch {
      return COPO_PLACES;
    }
  });`;

appCode = appCode.replace(oldPlacesInitRegex, newPlacesInit);

// Fix videos state init
const oldVideosInitRegex = /const \[videos, setVideos\] = useState<VideoReview\[\]>\(\(\) => \{[\s\S]*?return COPO_VIDEOS;\s*\}\);/;
const newVideosInit = `const [videos, setVideos] = useState<VideoReview[]>(() => {
    try {
      const saved = localStorage.getItem("copo_videos");
      if (saved) {
        const parsed: VideoReview[] = JSON.parse(saved);
        const map = new Map<string, VideoReview>();
        COPO_VIDEOS.forEach((cv) => map.set(cv.id, cv));
        if (Array.isArray(parsed)) {
          parsed.forEach((pv) => {
            if (!pv || !pv.id) return;
            if (map.has(pv.id)) {
              map.set(pv.id, {
                ...map.get(pv.id)!,
                ...pv,
                videoUrl: pv.videoUrl || map.get(pv.id)!.videoUrl,
                fallbackVideoUrls: map.get(pv.id)!.fallbackVideoUrls || defFallbackUrls(pv.id)
              });
            } else {
              map.set(pv.id, pv);
            }
          });
        }
        return Array.from(map.values());
      }
    } catch {
      // ignore
    }
    return COPO_VIDEOS;
  });`;

appCode = appCode.replace(oldVideosInitRegex, newVideosInit);

// Fix Firestore sync in App.tsx
const oldFirestoreSync = `              const existingIds = new Set(prev.map((v) => v.id));
              const fresh = cloudReviews.filter((cr) => !existingIds.has(cr.id));
              return fresh.length > 0 ? [...fresh, ...prev] : prev;`;

const newFirestoreSync = `              const map = new Map<string, VideoReview>();
              cloudReviews.forEach((cr) => map.set(cr.id, cr));
              prev.forEach((v) => {
                if (!map.has(v.id)) map.set(v.id, v);
              });
              return Array.from(map.values());`;

appCode = appCode.replace(oldFirestoreSync, newFirestoreSync);

// Fix handleToggleGrabPlace and onAddPlace deduplication
appCode = appCode.replace(
  /onAddPlace=\{\(newPlace\) => \{\s*setPlaces\(\(prev\) => \{\s*if \(prev\.some\(\(p\) => p\.id === newPlace\.id\)\) return prev;\s*return \[newPlace, \.\.\.prev\];\s*\}\);\s*\}\}/g,
  `onAddPlace={(newPlace) => {
              setPlaces((prev) => {
                const map = new Map<string, Place>();
                map.set(newPlace.id, newPlace);
                prev.forEach((p) => {
                  if (!map.has(p.id)) map.set(p.id, p);
                });
                return Array.from(map.values());
              });
            }}`
);

fs.writeFileSync('src/App.tsx', appCode);
console.log('Successfully patched App.tsx!');
