const fs = require('fs');

// 1. CopoCreateModal.tsx
let createModalCode = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf8');
createModalCode = createModalCode.replace(
  /const displayedPlaces = searchedPlaces\.length > 0 \? searchedPlaces : places;/,
  `const displayedPlaces = React.useMemo(() => {
    const list = searchedPlaces.length > 0 ? searchedPlaces : places;
    const map = new Map<string, Place>();
    list.forEach((p) => {
      if (p && p.id && !map.has(p.id)) {
        map.set(p.id, p);
      }
    });
    return Array.from(map.values());
  }, [searchedPlaces, places]);`
);
createModalCode = createModalCode.replace(
  /\{displayedPlaces\.map\(\(p\)(?:,\s*idx)?\s*=>\s*\{/g,
  '{displayedPlaces.map((p, idx) => {'
);
createModalCode = createModalCode.replace(
  /key=\{p\.id\}/g,
  'key={`create-place-${p.id}-${idx}`}'
);
fs.writeFileSync('src/components/CopoCreateModal.tsx', createModalCode);

// 2. CopoProfileView.tsx
let profileCode = fs.readFileSync('src/components/CopoProfileView.tsx', 'utf8');
profileCode = profileCode.replace(
  /key=\{`profile-search-\$\{place\.id\}`\}/g,
  'key={`profile-search-${place.id}-${idx}`}'
);
profileCode = profileCode.replace(
  /liveGoogleResults\.slice\(0, 5\)\.map\(\(place\)\s*=>\s*\{/,
  'liveGoogleResults.slice(0, 5).map((place, idx) => {'
);
profileCode = profileCode.replace(
  /\{userVideos\.map\(\(video\)\s*=>\s*\(/,
  '{userVideos.map((video, idx) => ('
);
profileCode = profileCode.replace(
  /key=\{video\.id\}/g,
  'key={`user-video-${video.id}-${idx}`}'
);
profileCode = profileCode.replace(
  /\{savedPlaces\.map\(\(place\)\s*=>\s*\{/,
  '{savedPlaces.map((place, idx) => {'
);
profileCode = profileCode.replace(
  /key=\{`saved-\$\{place\.id\}`\}/g,
  'key={`saved-${place.id}-${idx}`}'
);
fs.writeFileSync('src/components/CopoProfileView.tsx', profileCode);

// 3. CopoMapView.tsx
let mapCode = fs.readFileSync('src/components/CopoMapView.tsx', 'utf8');
mapCode = mapCode.replace(
  /\{placeVideos\.map\(\(vid\)\s*=>\s*\(/,
  '{placeVideos.map((vid, idx) => ('
);
mapCode = mapCode.replace(
  /key=\{vid\.id\}/g,
  'key={`map-video-${vid.id}-${idx}`}'
);
fs.writeFileSync('src/components/CopoMapView.tsx', mapCode);

// 4. CopoSearchView.tsx
let searchCode = fs.readFileSync('src/components/CopoSearchView.tsx', 'utf8');
searchCode = searchCode.replace(
  /\{placeVideos\.map\(\(vid\)\s*=>\s*\(/,
  '{placeVideos.map((vid, idx) => ('
);
searchCode = searchCode.replace(
  /key=\{vid\.id\}/g,
  'key={`search-video-${vid.id}-${idx}`}'
);
fs.writeFileSync('src/components/CopoSearchView.tsx', searchCode);

// 5. CopoPlaceDrawer.tsx
let placeDrawerCode = fs.readFileSync('src/components/CopoPlaceDrawer.tsx', 'utf8');
placeDrawerCode = placeDrawerCode.replace(
  /\{placeVideos\.map\(\(video\)\s*=>\s*\(/,
  '{placeVideos.map((video, idx) => ('
);
placeDrawerCode = placeDrawerCode.replace(
  /key=\{video\.id\}/g,
  'key={`place-drawer-video-${video.id}-${idx}`}'
);
fs.writeFileSync('src/components/CopoPlaceDrawer.tsx', placeDrawerCode);

// 6. CopoCreatorDrawer.tsx
let creatorDrawerCode = fs.readFileSync('src/components/CopoCreatorDrawer.tsx', 'utf8');
creatorDrawerCode = creatorDrawerCode.replace(
  /\{authorVideos\.map\(\(video\)\s*=>\s*\(/,
  '{authorVideos.map((video, idx) => ('
);
creatorDrawerCode = creatorDrawerCode.replace(
  /key=\{video\.id\}/g,
  'key={`author-video-${video.id}-${idx}`}'
);
fs.writeFileSync('src/components/CopoCreatorDrawer.tsx', creatorDrawerCode);

// 7. CopoBookmarksView.tsx
let bookmarksCode = fs.readFileSync('src/components/CopoBookmarksView.tsx', 'utf8');
bookmarksCode = bookmarksCode.replace(
  /\{bookmarkedVideos\.map\(\(video\)\s*=>\s*\(/,
  '{bookmarkedVideos.map((video, idx) => ('
);
bookmarksCode = bookmarksCode.replace(
  /key=\{video\.id\}/g,
  'key={`bookmark-video-${video.id}-${idx}`}'
);
fs.writeFileSync('src/components/CopoBookmarksView.tsx', bookmarksCode);

// 8. CopoNotificationsView.tsx
let notifsCode = fs.readFileSync('src/components/CopoNotificationsView.tsx', 'utf8');
notifsCode = notifsCode.replace(
  /\{notifications\.map\(\(notif\)\s*=>\s*\(/,
  '{notifications.map((notif, idx) => ('
);
notifsCode = notifsCode.replace(
  /key=\{notif\.id\}/g,
  'key={`notif-${notif.id}-${idx}`}'
);
fs.writeFileSync('src/components/CopoNotificationsView.tsx', notifsCode);

// 9. CopoMessagesView.tsx
let msgsCode = fs.readFileSync('src/components/CopoMessagesView.tsx', 'utf8');
msgsCode = msgsCode.replace(
  /\{messages\.map\(\(thread\)\s*=>\s*\(/,
  '{messages.map((thread, idx) => ('
);
msgsCode = msgsCode.replace(
  /key=\{thread\.id\}/g,
  'key={`msg-thread-${thread.id}-${idx}`}'
);
fs.writeFileSync('src/components/CopoMessagesView.tsx', msgsCode);

// 10. CopoClubsView.tsx
let clubsCode = fs.readFileSync('src/components/CopoClubsView.tsx', 'utf8');
clubsCode = clubsCode.replace(
  /\{clubs\.map\(\(club\)\s*=>\s*\(/,
  '{clubs.map((club, idx) => ('
);
clubsCode = clubsCode.replace(
  /key=\{club\.id\}/g,
  'key={`club-${club.id}-${idx}`}'
);
fs.writeFileSync('src/components/CopoClubsView.tsx', clubsCode);

console.log('Successfully patched all component keys!');
