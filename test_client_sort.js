const pendingLocalVideos = [];
const mergedServerVideos = [
  { id: 'rev-1788290824170-vg5vg', createdAtMs: 1788290824170 }, // Legal 500
  { id: 'rev-1789144316489-abc', createdAtMs: 1789144316489 } // Yoouz
];
const merged = [...pendingLocalVideos, ...mergedServerVideos];
merged.sort((a, b) => {
  const aTime = a.createdAtMs || (a.id && a.id.startsWith('rev-') ? parseInt(a.id.split('-')[1]) : 0) || 0;
  const bTime = b.createdAtMs || (b.id && b.id.startsWith('rev-') ? parseInt(b.id.split('-')[1]) : 0) || 0;
  return bTime - aTime;
});
console.log(merged.map(v => v.id));
