const fs = require('fs');
let code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');

// Fix embedSnippet
const oldEmbedSnippet = '    const embedSnippet = `<div id="yoouz-widget"\\n  data-place-id="${selectedPlaceId}"\\n  data-theme="${embedTheme}"\\n  data-star-filter="${embedStarFilter}"\\n  data-show-stars="${embedShowStars}"\\n  data-show-verified="${embedShowVerifiedBadge}"\\n  data-show-trust-header="${embedShowTrustHeader}"${pinnedAttr}${hiddenAttr}>\\n</div>\\n<script src="https://cdn.yoouz.com/embed/v2.js" async defer></script>\`;';
const newEmbedSnippet = '    const embedSnippet = `<div id="yoouz-widget"\\n  data-place-id="${selectedPlaceId}"\\n  data-theme="minimal_dark"\\n  data-layout="grid"\\n  data-accent="#ffffff"${pinnedAttr}${hiddenAttr}>\\n</div>\\n<script src="https://cdn.yoouz.com/embed/v2.js" async defer></script>\`;';
code = code.replace(oldEmbedSnippet, newEmbedSnippet);

// Fix displayableWidgetVideos
const oldDisplayable = `  const displayableWidgetVideos = useMemo(() => {
    return placeVideos
      .filter(v => {
        if (hiddenVideoIds.includes(v.id)) return false;
        const rating = v.rating || 5;
        if (embedStarFilter === '5') return rating === 5;
        if (embedStarFilter === '4plus') return rating >= 4;
        if (embedStarFilter === '3plus') return rating >= 3;
        if (embedStarFilter === 'pinned_only') return pinnedVideoIds.includes(v.id);
        return true;
      })
      .sort((a, b) => {
        const aPinned = pinnedVideoIds.includes(a.id);
        const bPinned = pinnedVideoIds.includes(b.id);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return 0;
      });
  }, [placeVideos, hiddenVideoIds, embedStarFilter, pinnedVideoIds]);`;

const newDisplayable = `  const displayableWidgetVideos = useMemo(() => {
    return placeVideos
      .filter(v => {
        if (hiddenVideoIds.includes(v.id)) return false;
        return true;
      })
      .sort((a, b) => {
        const aPinned = pinnedVideoIds.includes(a.id);
        const bPinned = pinnedVideoIds.includes(b.id);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return 0;
      });
  }, [placeVideos, hiddenVideoIds, pinnedVideoIds]);`;

code = code.replace(oldDisplayable, newDisplayable);

fs.writeFileSync('src/components/CopoBusinessDashboardView.tsx', code);
console.log("Fixed embed variables");
