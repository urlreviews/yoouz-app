const merged = [
  { id: 'rev-1000' },
  { id: 'rev-2000' },
  { id: 'rev-3000' }
];

merged.sort((a, b) => {
  const aTime = a.createdAtMs || (a.id && a.id.startsWith('rev-') ? parseInt(a.id.split('-')[1]) : 0) || 0;
  const bTime = b.createdAtMs || (b.id && b.id.startsWith('rev-') ? parseInt(b.id.split('-')[1]) : 0) || 0;
  return bTime - aTime;
});

console.log(merged.map(m => m.id));
